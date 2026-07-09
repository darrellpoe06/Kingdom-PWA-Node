// =============================================================================
// nas-loops.mjs — pure logic for the BRAKED, headless, deterministic NAS loop
// runner (no I/O, no net). The testable core the runner harness is built on.
// =============================================================================
// THE GAP THIS CLOSES (research-review 2026-06-29 "sustainable headless NAS loops"):
// the routine, timer-driven loops (health probes, digests, reconciliation) should
// run continuously on the always-on NAS as small DETERMINISTIC jobs — no LLM, no
// vendor — so "building continues when Claude/Dispatch is offline" is true for the
// routine work REGARDLESS of vendor state. Deterministic loops never wait on the
// AI; only AI-needed steps do (those ride the separate cap-resume/wake gate).
//
// This module is the single place the per-loop brake decision lives, kept PURE so
// the verification gate can prove it (DR-0076): every decision is a deterministic
// function of its inputs and is unit-tested proven-to-catch. The runner harness
// (infra/nas-loops/run.mjs) does the I/O — lockdir, child-process exec with a
// wall-clock timeout, call accounting, the event reel — and asks THIS module
// whether each fire is allowed. One decision authority, mirrored by the harness;
// the shell entry (run.sh) is only DSM glue.
//
// THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"),
// expressed for the deterministic class:
//   1. BUDGET     per-run wall-clock timeout (harness) + per-day CALL CAP
//                 (max_calls_per_day). Unset/zero cap == missing brake == no-go.
//                 No $ ceiling here: deterministic loops summon no vendor.
//   2. LOCK       single-flight per-loop lockdir (harness); a fire that finds the
//                 lock held SKIPS — never stacks (lockHeld === true => no-go).
//   3. KILL-SWITCH  a NAS file that, when present, forces every loop INERT
//                 (one touch halts the whole fleet). PLUS the LOOPS_ARMED arm
//                 PARAMETER (env/.env; ships UNSET) — the deterministic runner
//                 ships inert and is armed once, deliberately, via one parameter
//                 (DR-0096: governance is the parameters + humans, not two gates).
//
// AI loops are NOT run by this gate: kind:'ai' is refused here and delegated to
// the full cap-resume/wake brake gate (ARMED + RESUME_ARMED + $budget + caps +
// cap-window). The registry can carry both kinds; the dispatcher routes by kind.

// The two loop classes. 'deterministic' = no LLM, run by THIS gate. 'ai' = needs a
// vendor/local-LLM, delegated to the cap-resume gate (a strict superset of brakes).
export const LOOP_KINDS = ['deterministic', 'ai'];

// validateLoop(loop) -> { ok, errors[] }
// A loop is { name, kind, script, enabled, max_calls_per_day, timeout_seconds,
// schedule?, description? }. 'enabled' MUST be an explicit boolean (the committed
// greenlight — there is no default-true path, same discipline as the resume queue).
// max_calls_per_day and timeout_seconds MUST be > 0: an unset budget brake is a
// MISSING brake, and a missing brake means do not act.
export function validateLoop(loop) {
  const errors = [];
  if (loop === null || typeof loop !== 'object' || Array.isArray(loop)) {
    return { ok: false, errors: ['loop must be a JSON object'] };
  }
  if (typeof loop.name !== 'string' || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(loop.name)) {
    errors.push('name must be a kebab-case slug (a-z0-9-, 2-41 chars)');
  }
  if (!LOOP_KINDS.includes(loop.kind)) errors.push(`kind must be one of ${LOOP_KINDS.join('|')}`);
  if (typeof loop.script !== 'string' || loop.script.length < 1) errors.push('script must be a non-empty path');
  // Reject path traversal / absolute escapes in the script ref (the harness joins
  // it under the loops/ dir; a '..' or leading '/' would break the sandbox).
  if (typeof loop.script === 'string' && (loop.script.includes('..') || loop.script.startsWith('/') || loop.script.includes('\\'))) {
    errors.push('script must be a relative path under loops/ (no .., no leading /, no backslash)');
  }
  if (typeof loop.enabled !== 'boolean') errors.push('enabled must be an explicit boolean (the greenlight gate)');
  if (!(Number(loop.max_calls_per_day) > 0)) errors.push('max_calls_per_day must be > 0 (the call-cap budget brake; unset == missing brake)');
  if (!(Number(loop.timeout_seconds) > 0)) errors.push('timeout_seconds must be > 0 (the wall-clock budget brake; unset == missing brake)');
  return { ok: errors.length === 0, errors };
}

// validateRegistry(reg) -> { ok, errors[] }
// Top-level shape: { v:1, loops:[...] }. Catches duplicate names (a dup would
// break per-loop lock + call accounting, which key on the name).
export function validateRegistry(reg) {
  const errors = [];
  if (reg === null || typeof reg !== 'object' || Array.isArray(reg)) {
    return { ok: false, errors: ['registry must be a JSON object'] };
  }
  if (reg.v !== 1) errors.push('v must be 1');
  if (!Array.isArray(reg.loops)) {
    errors.push('loops must be an array');
    return { ok: errors.length === 0, errors };
  }
  const seen = new Set();
  reg.loops.forEach((l, i) => {
    const v = validateLoop(l);
    if (!v.ok) errors.push(`loops[${i}] (${(l && l.name) || '?'}): ${v.errors.join('; ')}`);
    const name = l && l.name;
    if (name) { if (seen.has(name)) errors.push(`duplicate loop name '${name}'`); seen.add(name); }
  });
  return { ok: errors.length === 0, errors };
}

// findLoop(reg, name) -> loop | null
export function findLoop(reg, name) {
  const loops = (reg && Array.isArray(reg.loops)) ? reg.loops : [];
  return loops.find((l) => l && l.name === name) || null;
}

// decideRun(input) -> { go, reason }
// THE braked gate for a DETERMINISTIC loop. input = {
//   loop, killSwitch:bool, loopsArmed:bool, lockHeld:bool, callsToday:int }.
// GO only when the loop is valid + deterministic + enabled AND every brake is
// satisfied: kill-switch CLEAR, LOOPS_ARMED set, under the daily call cap, lock
// free. Order is chosen so the most important refusal (panic stop) reads first.
// kind:'ai' is REFUSED here — it is delegated to the cap-resume gate by the runner.
export function decideRun(input = {}) {
  const { loop, killSwitch, loopsArmed, lockHeld } = input;
  const callsToday = Number(input.callsToday || 0);

  const v = validateLoop(loop);
  if (!v.ok) return { go: false, reason: `invalid loop: ${v.errors.join('; ')}` };

  if (loop.kind === 'ai') {
    return { go: false, reason: "kind 'ai': delegated to the cap-resume/wake gate (not run by the deterministic dispatcher)" };
  }
  if (loop.enabled !== true) return { go: false, reason: 'loop disabled in registry (enabled !== true)' };
  if (killSwitch === true) return { go: false, reason: 'kill-switch engaged (panic stop; one touch halts the fleet)' };
  if (loopsArmed !== true) return { go: false, reason: 'deterministic runner disarmed (LOOPS_ARMED not set; ships inert)' };

  const cap = Number(loop.max_calls_per_day);
  if (!(cap > 0)) return { go: false, reason: 'call-cap unset (missing budget brake)' };
  if (callsToday >= cap) return { go: false, reason: `daily call cap reached (${callsToday} >= ${cap})` };

  if (lockHeld === true) return { go: false, reason: 'single-flight lock held (another run of this loop is in progress; skipping)' };

  return { go: true, reason: `GO (calls ${callsToday}/${cap}, armed, kill-switch clear, lock free)` };
}

// reelLine(rec) -> a single JSONL string for the event reel (the observability
// brake). Same append-only one-object-per-line shape as the dispatch-status reel
// (_reel.jsonl) so the existing Dispatch Status surface renders these runs with no
// new sink. Never throws; coerces every field to a safe scalar.
export function reelLine(rec = {}) {
  const s = (v, n = 500) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').slice(0, n);
  const obj = {
    ts: s(rec.ts, 40),
    node: s(rec.node || 'nas-loops', 40),
    agent: 'nas-loops',
    loop: s(rec.loop, 60),
    event: s(rec.event, 60),
    ok: rec.ok === true,
    duration_ms: Number.isFinite(Number(rec.durationMs)) ? Number(rec.durationMs) : 0,
    detail: s(rec.detail, 800),
  };
  return JSON.stringify(obj);
}
