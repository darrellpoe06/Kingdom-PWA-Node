// =============================================================================
// orchestrator-handoff — the BRAKED bridge from "manage a project in-app" to
// "feed the lanes" (clicks become API calls), with the Cage held shut
// =============================================================================
// The AI-Foundation vision (AI-FOUNDATION-INTERNAL-OPERATIONS): a click today is
// an API call tomorrow. When Darrell manages a project in-app — sets a priority,
// marks a next-step, approves a stage — that decision should be able to FEED the
// orchestrator lanes as the work it drives.
//
// BUT autonomous execution stays behind the Cage. The three-brakes rule (budget +
// concurrency lock + kill-switch; CLAUDE.md, post-2026-06-06-runaway) is law-tier.
// So this module does the SAFE half now:
//
//   1. buildHandoff(...)  — turn a management action into a hand-off RECORD
//      (a discussion of kind 'handoff'). It is persisted + surfaced; it does NOT
//      call the network. dispatchState is ALWAYS 'staged' in this build — the
//      deep autonomous-drive piece is explicitly not wired here.
//
//   2. evaluateHandoffGate(brakes) — compute, from the REAL Cage brake state
//      (lib/wake-orchestrator normalizeWakeState), whether this hand-off WOULD be
//      allowed to dispatch right now. Default-DENY: anything unknown, any brake
//      holding, or budget breached => blocked, with the reasons named. This is
//      the read/decide loop, braked — the human sees the verdict and decides; the
//      system never auto-continues into a runaway.
//
// Proven-to-catch: the gate tests assert it BLOCKS on an engaged kill-switch, a
// disarmed engine, withheld summon consent, a held concurrency lock, and a
// breached budget — a green verdict only appears when every brake actually permits.
// =============================================================================
import { normalizeWakeState, budgetStatus } from './wake-orchestrator.js';

// The dispatch states a hand-off record can be in. Only 'staged' is reachable in
// this build — there is no code path that sets the others, by design. They name
// the future states the deep-drive piece will own, so the data shape is forward-
// compatible without implying the capability exists yet.
export const HANDOFF_DISPATCH_STATES = ['staged', 'cleared', 'dispatched', 'blocked'];

// -----------------------------------------------------------------------------
// evaluateHandoffGate — the brake gate. Returns:
//   { allowed: boolean, reasons: string[], brakeState: {...} }
// allowed === true ONLY when every brake permits autonomous dispatch right now.
// `reasons` lists every brake currently blocking (so the surface explains WHY a
// hand-off is held). Default-deny on a missing / not-connected feed.
// -----------------------------------------------------------------------------
export function evaluateHandoffGate(wakeData) {
  // Accept either a raw feed body or an already-normalized state.
  const data = wakeData && wakeData.brakes ? wakeData : normalizeWakeState(wakeData);
  if (!data || data.ok !== true || !data.brakes) {
    return { allowed: false, reasons: ['Orchestrator not connected — cannot verify the brakes.'], brakeState: null };
  }
  const b = data.brakes;
  const reasons = [];

  if (b.killSwitch !== 'clear') reasons.push('Kill-switch engaged (master stop).');
  if (b.armed !== true) reasons.push('Engine is disarmed.');
  if (b.wakeSummon !== true) reasons.push('Vendor-summon consent not given.');
  if (b.concurrencyLock === 'held') reasons.push('A run is already in progress (concurrency lock held).');

  const budget = budgetStatus(b.budget);
  if (budget.status === 'idle') reasons.push('No budget ceiling set.');
  else if (budget.status === 'problem') reasons.push(`Budget cap reached (${budget.label}).`);

  return { allowed: reasons.length === 0, reasons, brakeState: b };
}

// -----------------------------------------------------------------------------
// buildHandoff — turn a project + a management action into a hand-off discussion
// record. The returned object is the local discussion shape (kind 'handoff') the
// addDiscussion reducer persists + syncs. The Cage verdict at creation time is
// stored in meta so the record carries an honest snapshot of whether it could
// have run. dispatchState is hard-coded 'staged' — this build never dispatches.
//
//   project   — the project being handed off (needs id + title)
//   action    — short human label of the management action ('approve execute', …)
//   lane      — the target lane id/name (free text; the orchestrator owns routing)
//   gate      — the result of evaluateHandoffGate(...) at click time
//   persona   — the family persona issuing it (display only)
//   nowIso    — ISO timestamp (injected, not Date.now — keeps callers testable)
// -----------------------------------------------------------------------------
export function buildHandoff({ project, action, lane, gate, persona = null, nowIso }) {
  const p = project || {};
  const verdict = gate || { allowed: false, reasons: ['No gate evaluated.'] };
  const laneName = (typeof lane === 'string' && lane.trim()) ? lane.trim() : 'unassigned';
  return {
    kind: 'handoff',
    title: `Hand-off → ${laneName}: ${p.title || '(untitled project)'}`,
    body: action ? `Management action: ${action}.` : '',
    projectSlugs: p.id ? [p.id] : [],
    visibility: 'shared',
    status: 'open',
    authorPersona: persona,
    links: {},
    meta: {
      handoff: true,
      lane: laneName,
      action: action || '',
      // The deep autonomous-drive piece is staged, not wired. This is the brake.
      dispatchState: 'staged',
      // An honest snapshot of the Cage at the moment of the hand-off.
      gateAllowed: verdict.allowed === true,
      gateReasons: Array.isArray(verdict.reasons) ? verdict.reasons : [],
      evaluatedAt: nowIso || null,
    },
  };
}

// -----------------------------------------------------------------------------
// handoffSummary — one-line, honest status for a hand-off record in the pulse /
// inline list. Always leads with "Staged" because nothing here auto-runs; then
// reports whether the brakes WOULD have allowed it.
// -----------------------------------------------------------------------------
export function handoffSummary(discussion) {
  const m = (discussion && discussion.meta) || {};
  if (!m.handoff) return '';
  const lane = m.lane || 'unassigned';
  if (m.gateAllowed) {
    return `Staged → ${lane}. Brakes clear — would run when the deep-drive is wired (still your call).`;
  }
  const why = Array.isArray(m.gateReasons) && m.gateReasons.length ? m.gateReasons[0] : 'a brake is holding';
  return `Staged → ${lane}. Held by the Cage: ${why}`;
}

// pendingHandoffs — every staged hand-off discussion not yet resolved, for the
// management pulse "what's queued to feed a lane" count. Real records only.
export function pendingHandoffs(discussions) {
  if (!Array.isArray(discussions)) return [];
  return discussions.filter(
    (d) => d && d.kind === 'handoff' && d.status === 'open' &&
      d.meta && d.meta.handoff && d.meta.dispatchState === 'staged'
  );
}
