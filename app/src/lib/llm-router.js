// =============================================================================
// llm-router — deterministic spec -> provider router for the work pipeline (pure)
// =============================================================================
// Declared by Darrell 2026-07-08: "give the local LLMs specs to add to the build
// and project pipeline with or without Claude, and give work to Gemini, Claude, or
// any vendor LLM." This is the LLM sibling of gpu-scheduler.js: it matches a SPEC
// (a unit of work) against the provider register (llm-providers.js) and decides
// WHICH backend runs it — local qwen, a vendor, or nothing — under the same Cage.
//
// THE PATH (DR-0088, NOT n8n): a spec is a Supabase `agent_tasks` row. The
// self-orchestrating box agent POLLS that table (outbound), calls THIS router to
// pick a provider, runs the work, and opens a PR into the GATED build pipeline.
// The router trusts the GATES (ci.yml, auto-merge green-required, tests, monolith
// budget, contrast/legibility), not the model — that is what makes "with or
// without Claude" safe (DR-0076). This file only DECIDES and PLANS; the .mjs box
// agent does the (still brake-gated) network I/O + git.
//
// DETERMINISTIC-FIRST (DR-0080): routing is PLAIN CODE — no model call decides
// routing. Local-first once a GPU box makes local strong (DR-0073 ladder; local is
// now verified strong at 45 tok/s). PRIVATE specs are LOCAL-ONLY, never a vendor
// (DR-0073 private->local-only; DATA-AS-EMPOWERMENT).
//
// THE CAGE (three brakes; CLAUDE.md "Autonomous Automation Requires Three Brakes").
// Modeled exactly on gpu-scheduler.brakeGate. SHIPS INERT — makeInertState() is the
// shipped default: KILL_SWITCH engaged + ARMED absent + LLM_ROUTER_ARMED absent +
// budgets 0 + single-flight lock + append-only log. Arming is Darrell's, attended
// (Tier C). This file NEVER dispatches.
//
// PURE (no React, no fs, no network) so the gate proves it (DR-0076): the inert
// default + the bounded-eligibility gate are machine-checked by llm-router.test.js.
// =============================================================================
import { providersForCapability, CAPABILITY_TOKENS } from './llm-providers.js';

// A spec advertises ONE required capability + optional routing hints.
export const SPEC_STATUSES = ['queued', 'running', 'done', 'failed', 'cancelled'];

// --- Inert state (the shipped default) ---------------------------------------
// Every brake engaged/absent. brakeGate(makeInertState()) MUST be { go:false }.
export function makeInertState(overrides = {}) {
  return {
    killSwitch:      true,   // present => engaged (global stop). Ships engaged.
    armed:           false,  // master arm absent
    routerArmed:     false,  // dedicated router arm absent
    lockHeld:        false,  // single-flight lock not held by another run
    maxTasksPerRun:  0,      // 0 = unset = missing brake
    maxTasksPerDay:  0,      // 0 = unset = missing brake
    tasksToday:      0,
    ...overrides,
  };
}

// --- Validation --------------------------------------------------------------
export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') return { ok: false, errors: ['spec is not an object'] };
  if (!spec.id) errors.push('spec.id is required');
  if (!spec.title || !String(spec.title).trim()) errors.push('spec.title is required');
  if (!CAPABILITY_TOKENS.includes(spec.capability)) errors.push(`unknown capability "${spec.capability}"`);
  if (spec.status != null && !SPEC_STATUSES.includes(spec.status)) errors.push(`unknown status "${spec.status}"`);
  return { ok: errors.length === 0, errors };
}

// --- Routing: pick the provider for a spec (deterministic) --------------------
// Order of preference:
//   1. PRIVATE specs => local-only candidate set (vendors dropped). Non-negotiable.
//   2. A pinned targetProviderId => that provider IFF it is a dispatchable candidate.
//   3. Otherwise the cost-ranked candidate list (sovereign/free-local first — the
//      DR-0073 "local-first once local is strong" default).
// Only DISPATCHABLE providers are eligible (available + key present for vendors).
export function routeSpec(spec, providers) {
  if (!CAPABILITY_TOKENS.includes(spec?.capability)) {
    return { provider: null, reason: `unknown capability "${spec?.capability}"` };
  }
  let candidates = providersForCapability(providers, spec.capability, { dispatchableOnly: true });
  if (spec.private === true) {
    candidates = candidates.filter((p) => p.kind === 'local' && p.sovereign === true);
    if (candidates.length === 0) {
      return { provider: null, reason: `private spec needs a sovereign local provider for "${spec.capability}"; none dispatchable` };
    }
  }
  if (candidates.length === 0) {
    return { provider: null, reason: `no dispatchable provider advertises "${spec.capability}"` };
  }
  if (spec.targetProviderId) {
    const pinned = candidates.find((p) => p.id === spec.targetProviderId);
    if (!pinned) {
      return { provider: null, reason: `pinned provider "${spec.targetProviderId}" is not a dispatchable candidate for "${spec.capability}"` };
    }
    return { provider: pinned, reason: `pinned to ${pinned.name}` };
  }
  const pick = candidates[0];
  return { provider: pick, reason: `routed to ${pick.name} (${pick.sovereign ? 'sovereign/free' : pick.costTier}, "${spec.capability}")` };
}

// --- The Cage: brakeGate (mirrors gpu-scheduler.brakeGate) --------------------
export function brakeGate(state, opts = {}) {
  const s = state || {};
  const reasons = [];
  const killEngaged = s.killSwitch === true;
  const armed = s.armed === true;
  const routerArmed = s.routerArmed === true;
  const lockFree = s.lockHeld !== true;
  const perRun = Number(s.maxTasksPerRun) || 0;
  const perDay = Number(s.maxTasksPerDay) || 0;
  const tasksToday = Number(s.tasksToday) || 0;
  const budgetOk = perRun > 0 && perDay > 0 && tasksToday < perDay;

  if (killEngaged) reasons.push('KILL_SWITCH engaged');
  if (!armed) reasons.push('not ARMED');
  if (!routerArmed) reasons.push('LLM_ROUTER not armed');
  if (!lockFree) reasons.push('single-flight lock held by another run');
  if (perRun <= 0) reasons.push('per-run budget unset (0)');
  if (perDay <= 0) reasons.push('per-day budget unset (0)');
  if (perDay > 0 && tasksToday >= perDay) reasons.push(`daily budget exhausted (${tasksToday}/${perDay})`);
  // Optional: refuse to dispatch during a live church service window (DR-0012 is
  // enforced per-provider, but a global service-freeze can be passed in too).
  if (opts.serviceFreeze === true) reasons.push('live-service freeze active (DR-0012)');

  const go = !killEngaged && armed && routerArmed && lockFree && budgetOk && opts.serviceFreeze !== true;
  return {
    go,
    reasons,
    budget: { perRun, perDay, tasksToday, remaining: Math.max(0, perDay - tasksToday) },
    brakes: { killEngaged, armed, routerArmed, lockFree, budgetOk, serviceFreeze: opts.serviceFreeze === true },
  };
}

// --- The bounded gate: selectRunnable ----------------------------------------
// A spec is runnable ONLY when ALL hold:
//   - the global brakeGate is go (else NOTHING runs)
//   - spec.approved === true (explicit; Darrell/Governor sets it)
//   - spec.status === 'queued' (a done/running/failed spec never re-runs)
//   - a dispatchable provider is routed (capability + private + pin honored)
//   - the per-run + per-day budgets still have headroom
export function selectRunnable(queue, providers, state, opts = {}) {
  const items = Array.isArray(queue?.items) ? queue.items : [];
  const gate = brakeGate(state, opts);
  if (!gate.go) {
    return { runnable: [], skipped: items.map((s) => ({ id: s.id, reason: `brakes: ${gate.reasons.join(', ')}` })), gate };
  }
  const runnable = [];
  const skipped = [];
  let used = 0;
  const perRun = gate.budget.perRun;
  const dayRemaining = gate.budget.remaining;
  for (const spec of items) {
    const v = validateSpec(spec);
    if (!v.ok) { skipped.push({ id: spec.id, reason: v.errors.join('; ') }); continue; }
    if (spec.approved !== true) { skipped.push({ id: spec.id, reason: 'not approved' }); continue; }
    if (spec.status !== 'queued') { skipped.push({ id: spec.id, reason: `status is "${spec.status}" (only queued runs)` }); continue; }
    if (used >= perRun) { skipped.push({ id: spec.id, reason: 'per-run budget reached' }); continue; }
    if (used >= dayRemaining) { skipped.push({ id: spec.id, reason: 'daily budget reached' }); continue; }
    const { provider, reason } = routeSpec(spec, providers);
    if (!provider) { skipped.push({ id: spec.id, reason }); continue; }
    runnable.push({ spec, provider });
    used += 1;
  }
  return { runnable, skipped, gate };
}

// --- Plan (what ships): observability WITHOUT dispatch -----------------------
// Deterministic, side-effect-free summary of what WOULD run + why each is skipped.
// This is what the in-app surface + the inert box agent display. Dispatches nothing.
export function planRun(queue, providers, state, opts = {}) {
  const sel = selectRunnable(queue, providers, state, opts);
  return {
    inert: !sel.gate.go,
    gate: sel.gate,
    wouldRun: sel.runnable.map((r) => ({
      specId: r.spec.id,
      title: r.spec.title,
      capability: r.spec.capability,
      provider: r.provider.name,
      providerId: r.provider.id,
      sovereign: r.provider.sovereign === true,
      private: r.spec.private === true,
    })),
    skipped: sel.skipped,
  };
}

// --- Event shaping (append-only JSONL; the box agent writes, this shapes) ------
export function makeEvent(event, detail, state, nowIso) {
  const s = state || {};
  return {
    ts: nowIso,
    agent: 'llm-router',
    event,
    armed: s.armed === true,
    router_armed: s.routerArmed === true,
    kill_switch: s.killSwitch === true ? 'engaged' : 'clear',
    detail: String(detail || '').slice(0, 1000),
  };
}
