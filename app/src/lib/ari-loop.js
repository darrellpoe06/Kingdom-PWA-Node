// =============================================================================
// ari-loop — the MAPE-K control loop for Ari's autonomous operation
// =============================================================================
// Darrell 2026-07-13: "Ari keeps working without questions… research autonomous
// scalable processes for business and control systems, then implement the best
// ones." The researched best model is IBM autonomic computing's MAPE-K reference
// loop — Monitor → Analyze → Plan → Execute over shared Knowledge — combined with
// exception-based management from autonomous business-process automation (the
// machine handles the volume; a human handles the exceptions). Documented as the
// Ways in AUTONOMOUS-OPERATING-MODEL.md (DR-0185).
//
// This composes the pieces already built into one MEASURED loop:
//   • Monitor + Analyze  → ari-app-review.js (the review + its ranked findings)
//   • Plan               → ari-adjustments.js (the gate: auto vs propose)
//   • Execute            → the gated auto-apply (safe ops) + the human exception path
//   • Knowledge          → the audit log (reversible + attributed)
//
// The loop's health is a MEASURED number (STP rate), never painted. PURE +
// DETERMINISTIC (DR-0076): no localStorage / Date.now here; callers pass `now`.
// =============================================================================

import { partitionAdjustments, makeApplyLogEntry } from './ari-adjustments.js';

// The five MAPE-K stages, named for the surface + the tests.
export const MAPE_K_STAGES = [
  { key: 'monitor', label: 'Monitor', detail: 'Read the app’s own records across every dimension.' },
  { key: 'analyze', label: 'Analyze', detail: 'Rank the findings against the desired state, with evidence.' },
  { key: 'plan', label: 'Plan', detail: 'Gate each finding: safe for Ari to apply, or a human exception.' },
  { key: 'execute', label: 'Execute', detail: 'Apply the safe fixes and log them; hand the exceptions to a person.' },
  { key: 'knowledge', label: 'Knowledge', detail: 'The audit log the loop learns from — reversible + attributed.' },
];

// Graduated-autonomy ladder (exception-based management). We describe the CURRENT
// live stage honestly; the reach widens only as measured reliability earns it.
export const AUTONOMY_STAGES = [
  { key: 'supervised', label: 'Supervised', detail: 'Every change is proposed; a human applies each one.' },
  { key: 'gated-auto', label: 'Gated auto-apply', detail: 'Ari applies the provably-safe fixes itself and logs them; proposes the rest. (Live.)' },
  { key: 'exception-only', label: 'Exception-only', detail: 'The safe lane runs end-to-end; a human sees only the true exceptions and samples.' },
];
export const CURRENT_AUTONOMY_STAGE = 'gated-auto';

// Run one turn of the loop over a comprehensive review (the output of
// buildAppReview). Returns the full MAPE-K breakdown + the measured metrics.
export function runAriLoop(review, nowIso) {
  const findings = (review && Array.isArray(review.findings)) ? review.findings : [];
  const dimensions = (review && Array.isArray(review.dimensions)) ? review.dimensions : [];
  const { auto, propose } = partitionAdjustments(findings);
  const log = auto.map((f) => makeApplyLogEntry(f, nowIso));
  return {
    monitor: { dimensions: dimensions.length, findings: findings.length },
    analyze: { ranked: findings.length, worst: review && review.summary ? review.summary.status : 'ok' },
    plan: { auto, propose },
    execute: { appliedCount: auto.length, proposedCount: propose.length, log },
    knowledge: { log },
    metrics: controlMetrics({ auto, propose }),
    stage: CURRENT_AUTONOMY_STAGE,
  };
}

// The control metric: straight-through rate = the share Ari handles end-to-end.
// Measured from the real partition, never a target.
export function controlMetrics({ auto = [], propose = [] } = {}) {
  const a = Array.isArray(auto) ? auto.length : 0;
  const p = Array.isArray(propose) ? propose.length : 0;
  const total = a + p;
  return {
    total,
    autoCount: a,
    proposeCount: p,
    stpRate: total > 0 ? Math.round((a / total) * 100) : 0, // % straight-through
  };
}

// A one-line human read of the loop's state.
export function loopHeadline(loop) {
  if (!loop || !loop.metrics) return 'The loop has not run yet.';
  const { total, autoCount, stpRate } = loop.metrics;
  if (total === 0) return 'The loop ran: nothing to adjust — the data is sound.';
  return `The loop ran: Ari applied ${autoCount} of ${total} safely (${stpRate}% straight-through); the rest are yours.`;
}
