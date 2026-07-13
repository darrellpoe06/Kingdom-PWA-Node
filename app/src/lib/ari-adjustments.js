// =============================================================================
// ari-adjustments — the GATE for "propose + gated auto-apply" (Ari's autonomy)
// =============================================================================
// Darrell 2026-07-13: "Ari should update all data everywhere and build the
// systems that make sure Ari can review that built process and make interactive
// iterative adjustments to solid, sound, data-driven processes." Chosen model:
// PROPOSE + GATED AUTO-APPLY — Ari applies the safe, verifiable, evidence-backed
// fixes itself and logs each one; anything high-stakes or unverifiable it only
// proposes for a human.
//
// This file is that gate. It takes the findings Ari's comprehensive review
// already produces (lib/ari-app-review.js — each { dimension, severity, title,
// evidence, action }) and decides, per finding, whether Ari may act on its own.
//
// THE GATE IS YOUR OWN DOCTRINE, ENCODED (DR-0076). An AI that rewrites real data
// without provenance is the exact "looks-right-but-wrong" failure verification
// exists to stop. So the gate is CONSERVATIVE and allowlist-based: Ari
// auto-applies ONLY a deterministic, reversible, evidence-backed correction in a
// safe dimension, and NEVER touches money, people/PHI, published/outward, or any
// unverifiable real-world value — those always route to a human. Every auto-apply
// writes an audit-log entry (what, why, the evidence, reversible), so nothing Ari
// does is silent.
//
// PURE + DETERMINISTIC: no localStorage / Date.now here (callers pass `now`).
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

// Dimensions whose findings CAN be deterministic, reversible recomputes/re-syncs
// (the only candidates for auto-apply). Plan / reviews / backlog carry human
// judgment, so they always propose.
export const AUTO_ELIGIBLE_DIMENSIONS = new Set(['delivery', 'data']);

// If a finding's text touches any of these, it NEVER auto-applies — a human
// governs anything about money, people/health, or the outward-facing world.
export const NEVER_AUTO_TERMS = [
  'money', 'payment', 'invoice', 'tuition', 'price', 'payroll', 'pay ', 'paid',
  'client', 'patient', 'phi', 'confidential', 'donor', 'giving', 'balance',
  'publish', 'deploy', 'live site', 'send', 'email', 'outreach', 'real-world',
  'diploma', 'credential', 'contact', 'referral',
];

// Deterministic, reversible operations Ari may perform itself. Deliberately
// specific verbs — NOT a bare 'sync' (that matches the description "out of sync"
// too, not an operation). The gate must key off the action, not the symptom.
export const SAFE_OPS = ['re-sync', 'resync', 'recompute', 'recalculate', 'refresh', 'reload', 're-load', 'load '];

function hay(finding) {
  return `${asStr(finding && finding.title)} ${asStr(finding && finding.action)} ${asStr(finding && finding.evidence)}`.toLowerCase();
}
export function touchesNeverAuto(finding) {
  const h = hay(finding);
  return NEVER_AUTO_TERMS.some((t) => h.includes(t));
}
export function isSafeOp(finding) {
  const h = `${asStr(finding && finding.action)} ${asStr(finding && finding.title)}`.toLowerCase();
  return SAFE_OPS.some((op) => h.includes(op));
}

// The decision. Conservative by construction: default is PROPOSE.
export function classifyFinding(finding) {
  if (!finding) return { mode: 'propose', reason: 'No finding.' };
  if (touchesNeverAuto(finding)) {
    return { mode: 'propose', reason: 'Touches money, people/health, or published/outward data — a human governs it (DR-0076).' };
  }
  if (AUTO_ELIGIBLE_DIMENSIONS.has(asStr(finding.dimension)) && isSafeOp(finding)) {
    return { mode: 'auto', reason: 'A deterministic, reversible, evidence-backed correction — safe for Ari to apply and log.' };
  }
  return { mode: 'propose', reason: 'Needs human judgment or isn’t provably safe to apply automatically.' };
}

// Split a review's findings into what Ari applies itself vs what it proposes.
export function partitionAdjustments(findings) {
  const auto = [];
  const propose = [];
  for (const f of asArr(findings)) {
    const c = classifyFinding(f);
    (c.mode === 'auto' ? auto : propose).push({ ...f, mode: c.mode, reason: c.reason });
  }
  return { auto, propose };
}

// The audit record written every time Ari auto-applies — provenance, not silence.
export function makeApplyLogEntry(finding, nowIso) {
  const f = finding || {};
  return {
    id: `apply-${asStr(f.dimension)}-${asStr(f.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    title: asStr(f.title),
    action: asStr(f.action),
    dimension: asStr(f.dimension),
    evidence: asStr(f.evidence),
    appliedIso: asStr(nowIso) || null,
    reversible: true,
    by: 'Ari',
  };
}

// A summary for the surface: how many Ari can act on vs must hand to a human.
export function adjustmentsSummary(findings) {
  const { auto, propose } = partitionAdjustments(findings);
  return {
    autoCount: auto.length,
    proposeCount: propose.length,
    auto,
    propose,
    headline: auto.length === 0 && propose.length === 0
      ? 'Nothing to adjust — the data is sound.'
      : `Ari can safely apply ${auto.length}; ${propose.length} need your call.`,
  };
}

export const ADJUSTMENTS_DOCTRINE =
  'Ari applies only deterministic, reversible, evidence-backed fixes on its own, and logs each one. Anything about money, people, or the outward-facing world it proposes for you — the gate is your verification doctrine (DR-0076), encoded.';
