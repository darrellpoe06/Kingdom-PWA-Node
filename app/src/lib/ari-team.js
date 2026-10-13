// =============================================================================
// ari-team — Ari plans a TEAM of agents (+ sub-agents) to work a set of tasks,
// gated by the three brakes. The first real increment of "Ari should be able to
// use a team of agents and even more subs when necessary to support our users
// and systems" (Darrell 2026-07-30).
// =============================================================================
// PLAN-FIRST, dispatches NOTHING yet — exactly how llm-router shipped (inert
// planRun before any dispatch). This is the safe pattern for the timer-driven /
// compute-spawning class: the ALLOCATION + its brake gate ship ACTIVE as the
// observable "what Ari's team would run" (DR-0254 — active, instrumented,
// fail-visible), and the real dispatch arms only once these brakes are proven-
// to-catch live (the three-brakes law, DR-0225 / DR-0247 / DR-0248; the runaway
// class from 2026-06-06). Building it active-as-observability is NOT shipping
// dark — the plan surface is real and useful now; the compute-spawning half
// carries the brakes it is legally required to carry before it can fire.
//
// PURE (no React, no fs, no network) so the gate proves it (DR-0076 §3): the
// unit test authorizes a clear plan and BLOCKS on each tripped brake.
//
// Composition:
//   • routeSpec (llm-router) picks the provider for each task/sub's capability.
//   • the three brakes (agent-brakes) decide whether the plan may DISPATCH:
//       budget ceiling · single-instance lock · kill-switch (dead-man's).
//     A plan is always COMPUTED (observability); it is only DISPATCHABLE when
//     every brake is clear.
// =============================================================================
import { routeSpec } from './llm-router.js';
import { createBudget, killSwitch, memoryStore } from './agent-brakes.js';

// Allocate one agent (and its subs) for a task. Dispatches nothing — records
// which provider WOULD run it and why. A task may carry `subs: [{...}]` — each
// sub is a smaller task Ari fans out under the parent agent ("even more subs
// when necessary"), routed the same way.
function allocate(task, providers) {
  const spec = { capability: task.capability, private: !!task.private, targetProviderId: task.targetProviderId };
  const { provider, reason } = routeSpec(spec, providers);
  const subs = Array.isArray(task.subs)
    ? task.subs.map((s) => allocate(s, providers))
    : [];
  return {
    taskId: task.id ?? null,
    capability: task.capability ?? null,
    private: !!task.private,
    provider: provider ? { id: provider.id, name: provider.name, sovereign: !!provider.sovereign } : null,
    routable: !!provider,
    reason,
    subs,
  };
}

// Count every agent the plan would run (parents + all subs, recursively) — the
// unit the budget ceiling is measured in ("units" = agent invocations).
function countAgents(assignments) {
  let n = 0;
  for (const a of assignments) { n += 1 + countAgents(a.subs || []); }
  return n;
}

// composeTeamBrakes — read the live three-brake state from agent-brakes, WITHOUT
// acquiring the dispatch lock (planning is side-effect-free). Returns a verdict
// per brake; the caller (real dispatch, a later increment) is what actually
// acquires the lock and spends the budget.
export function composeTeamBrakes(store, { nowMs = 0, name = 'ari-team', budget = {}, agentsPlanned = 0 } = {}) {
  const s = store || memoryStore();
  // kill-switch: sticky pause on explicit trip or a missed heartbeat.
  const kill = killSwitch(s, name, { nowMs, missedMs: budget.missedMs ?? 15 * 60000 }).check(nowMs);
  // budget: would running `agentsPlanned` more agents exceed the ceiling? Uses a
  // fresh accumulator seeded to the units already spent this run (passed in).
  const b = createBudget({ maxUnits: budget.maxUnits ?? Infinity, maxTurns: budget.maxTurns ?? Infinity, maxWallMs: budget.maxWallMs ?? Infinity, nowMs });
  b.spend((budget.usedUnits ?? 0) + agentsPlanned);
  const budgetV = b.exceeded(nowMs);
  return {
    kill: { blocked: !!kill.paused, reason: kill.reason || null },
    budget: { blocked: !!budgetV.exceeded, reason: budgetV.reason || null },
    // lock is a DISPATCH-time acquisition, not a plan-time read — surfaced as
    // "checked at dispatch"; a caller may pass a precomputed lock verdict.
    lock: { blocked: false, reason: 'acquired at dispatch (single-instance)' },
  };
}

// planTeam — the allocation + the dispatch-authorization gate.
//   tasks     : [{ id, capability, private?, targetProviderId?, subs?: [...] }]
//   providers : the SEED_PROVIDERS-shaped registry (llm-providers)
//   brakes    : { kill:{blocked,reason}, budget:{blocked,reason}, lock:{blocked,reason} }
//               — compose via composeTeamBrakes(store, ...), or pass verdicts
//                 directly (the test does this to prove each brake blocks).
// Returns { assignments, agentsPlanned, authorized, dispatchable, blockedBy,
//           reason, allRoutable }. The plan is ALWAYS computed; `dispatchable`
//           is true only when every brake is clear AND every task routed.
export function planTeam(tasks = [], providers = [], brakes = {}) {
  const assignments = (Array.isArray(tasks) ? tasks : []).map((t) => allocate(t, providers));
  const agentsPlanned = countAgents(assignments);
  const allRoutable = assignments.length > 0 && assignments.every(function ok(a) {
    return a.routable && (a.subs || []).every(ok);
  });
  // First tripped brake, in the law's order (budget · lock · kill).
  const order = [
    ['budget', brakes.budget],
    ['lock', brakes.lock],
    ['kill-switch', brakes.kill],
  ];
  const tripped = order.find(([, v]) => v && v.blocked);
  const brakeBlocked = !!tripped;
  const blockedBy = tripped ? tripped[0] : null;
  const reason = tripped ? (tripped[1].reason || `${blockedBy} brake engaged`) : null;
  const dispatchable = !brakeBlocked && allRoutable;
  return {
    assignments,
    agentsPlanned,
    allRoutable,
    authorized: !brakeBlocked,   // brakes clear (the safety gate)
    dispatchable,                // brakes clear AND every task has a provider
    blockedBy,
    reason,
  };
}
