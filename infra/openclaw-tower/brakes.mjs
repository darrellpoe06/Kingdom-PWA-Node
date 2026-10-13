// =============================================================================
// brakes.mjs -- the three brakes around OpenClaw on the tower (pure decisions)
// =============================================================================
// DR-0670. CLAUDE.md "Autonomous Automation Requires Three Brakes": no
// timer-driven or self-triggering automation goes active without ALL THREE --
// a budget, a concurrency lock, a kill-switch. The 2026-07-29 amendment
// (DR-0247 / DR-0248) removed the manual kill-switch only from the
// DETERMINISTIC class; "the heavier AI-class gates ... keep their full brake
// set". OpenClaw is an AI agent, so it keeps all three, and the kill is the
// house's own stop-path: registry enabled:false or deleting ARMED-BY-RECORD,
// in a PR, plus an auto-pause on overrun that only a PR can lift.
//
// Everything here is pure (no fs, no clock, no spawn) so each brake is proven
// to CATCH in vitest (DR-0076 s3). run.mjs does the I/O around it.
// =============================================================================

export const ROLES = Object.freeze(['report', 'act']);
export const MAX_TIMEOUT_SECONDS = 900;

const isPosInt = (n) => Number.isInteger(n) && n > 0;
const isNonNegInt = (n) => Number.isInteger(n) && n >= 0;

/** Registry shape check. Returns a list of problems; empty means sound. */
export function validateRegistry(reg) {
  const errors = [];
  if (!reg || typeof reg !== 'object') return ['registry is not an object'];
  if (!Array.isArray(reg.roles) || reg.roles.length === 0) return ['registry.roles must be a non-empty array'];
  const seen = new Set();
  for (const r of reg.roles) {
    const at = (r && r.name) || '(unnamed)';
    if (!r || typeof r.name !== 'string' || !r.name) { errors.push('a role has no name'); continue; }
    if (seen.has(r.name)) errors.push(`${at}: duplicate name`);
    seen.add(r.name);
    if (!ROLES.includes(r.role)) errors.push(`${at}: role must be one of ${ROLES.join(', ')}`);
    if (typeof r.enabled !== 'boolean') errors.push(`${at}: enabled must be true or false (no default-true)`);
    if (!isPosInt(r.arm_epoch)) errors.push(`${at}: arm_epoch must be a positive integer`);
    // A missing cap is a MISSING BRAKE, and a missing brake is a no-go.
    if (r.role === 'report' ? !isPosInt(r.max_runs_per_day) : !isNonNegInt(r.max_runs_per_day)) {
      errors.push(`${at}: max_runs_per_day missing (budget brake)`);
    }
    if (!isPosInt(r.timeout_seconds) || r.timeout_seconds > MAX_TIMEOUT_SECONDS) {
      errors.push(`${at}: timeout_seconds must be 1..${MAX_TIMEOUT_SECONDS} (budget brake)`);
    }
    if (!isPosInt(r.max_turns)) errors.push(`${at}: max_turns missing (budget brake)`);
    if (!isPosInt(r.max_tool_calls)) errors.push(`${at}: max_tool_calls missing (budget brake)`);
    if (!isPosInt(r.max_consecutive_failures)) errors.push(`${at}: max_consecutive_failures missing (kill brake)`);
    if (!isPosInt(r.stale_lock_seconds)) errors.push(`${at}: stale_lock_seconds missing (lock brake)`);
    if (r.enabled === false && (!r.disabled_why || !r.re_review)) {
      errors.push(`${at}: a disabled role carries disabled_why + re_review (DR-0075)`);
    }
  }
  return errors;
}

export function findRole(reg, name) {
  return (reg && Array.isArray(reg.roles) ? reg.roles : []).find((r) => r && r.name === name) || null;
}

/**
 * KILL: is this role switched on by record? Pure.
 *   entry          -- the registry entry (from main)
 *   armedByRecord  -- ARMED-BY-RECORD present on main
 *   paused         -- { arm_epoch, reason } written by an auto-pause, or null
 */
export function killState({ entry, armedByRecord, paused }) {
  if (!entry) return { live: false, brake: 'kill', reason: 'no such role in registry.json' };
  if (entry.enabled !== true) return { live: false, brake: 'kill', reason: 'registry enabled:false' };
  if (!armedByRecord) return { live: false, brake: 'kill', reason: 'ARMED-BY-RECORD is absent' };
  if (paused && Number(paused.arm_epoch) >= Number(entry.arm_epoch)) {
    return {
      live: false,
      brake: 'kill',
      reason: `auto-paused (${paused.reason || 'overrun'}); a PR raising arm_epoch above ${paused.arm_epoch} resumes it`,
    };
  }
  return { live: true, brake: null, reason: 'armed by record' };
}

/**
 * Should this fire run? Pure. The order is the policy: kill, then the DR-0012
 * streaming hold, then lock, then budget.
 */
export function decideRun({
  entry,
  armedByRecord = false,
  paused = null,
  lock = { held: false, ageSeconds: 0 },
  runsToday = 0,
  streamingHold = false,
  registryErrors = [],
} = {}) {
  if (registryErrors && registryErrors.length) {
    return { go: false, brake: 'budget', reason: `registry unsound: ${registryErrors[0]}` };
  }
  const k = killState({ entry, armedByRecord, paused });
  if (!k.live) return { go: false, brake: k.brake, reason: k.reason };
  if (streamingHold) {
    return { go: false, brake: 'hold', reason: 'STREAMING_HOLD: the CUDA towers are reserved for the stream (DR-0012)' };
  }
  if (lock && lock.held) {
    const stale = Number(lock.ageSeconds) >= Number(entry.stale_lock_seconds);
    if (!stale) return { go: false, brake: 'lock', reason: 'a prior run still holds the lock -- this fire skips, it does not stack' };
  }
  if (!(Number(runsToday) < Number(entry.max_runs_per_day))) {
    return { go: false, brake: 'budget', reason: `budget: ${entry.max_runs_per_day} runs per day reached` };
  }
  return { go: true, brake: null, reason: lock && lock.held ? 'go (a stale lock was reclaimed)' : 'go' };
}

/**
 * BUDGET after the fact: did this run stay inside its ceiling? Pure. Reads the
 * `openclaw agent exec --json` envelope (docs: cli/agent.md, 2026.9.6 --
 * exit 0 ok / 1 error / 2 timeout; `assistantTurns`, `toolSummary.calls`).
 */
export function judgeRun({ exitCode, envelope, killedAtWallClock = false } = {}, entry = {}) {
  const env = envelope && typeof envelope === 'object' ? envelope : null;
  const turns = env && Number.isFinite(env.assistantTurns) ? env.assistantTurns : null;
  const calls = env && env.toolSummary && Number.isFinite(env.toolSummary.calls) ? env.toolSummary.calls : null;
  if (killedAtWallClock) return { ok: false, overrun: true, reason: 'wall-clock ceiling: the runner killed the run', turns, calls };
  if (exitCode === 2 || (env && env.status === 'timeout')) return { ok: false, overrun: true, reason: 'timed out at its deadline', turns, calls };
  if (turns !== null && turns > entry.max_turns) return { ok: false, overrun: true, reason: `${turns} turns > ${entry.max_turns}`, turns, calls };
  if (calls !== null && calls > entry.max_tool_calls) return { ok: false, overrun: true, reason: `${calls} tool calls > ${entry.max_tool_calls}`, turns, calls };
  if (exitCode !== 0 || !env || env.ok !== true) {
    const why = env && env.error && env.error.message ? env.error.message : `exit ${exitCode}`;
    return { ok: false, overrun: false, reason: `failed: ${String(why).slice(0, 200)}`, turns, calls };
  }
  return { ok: true, overrun: false, reason: 'inside its budget', turns, calls };
}

/**
 * KILL on its own: pause on an overrun, or on N failures in a row. Pure.
 * Returns the pause record to write, or null.
 */
export function pauseAfter({ judged, consecutiveFailures = 0, entry = {} } = {}) {
  if (judged && judged.overrun) return { arm_epoch: entry.arm_epoch, reason: `overrun: ${judged.reason}` };
  if (Number(consecutiveFailures) >= Number(entry.max_consecutive_failures)) {
    return { arm_epoch: entry.arm_epoch, reason: `${consecutiveFailures} failures in a row` };
  }
  return null;
}

/** Brakes as the surface shows them: armed = true/false, or null when unknown. */
export function brakesView({ entry, armedByRecord, paused, lock } = {}) {
  if (!entry) return { budget: null, lock: null, kill: null };
  const errs = validateRegistry({ roles: [entry] });
  const k = killState({ entry, armedByRecord, paused });
  return {
    budget: errs.length === 0,
    lock: lock ? !lock.held || Number(lock.ageSeconds) < Number(entry.stale_lock_seconds) : null,
    kill: { live: k.live, reason: k.reason },
  };
}
