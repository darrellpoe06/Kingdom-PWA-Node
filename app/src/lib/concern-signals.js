// =============================================================================
// concern-signals — the board self-organizes: worst-first, the few that matter
// =============================================================================
// A flat list of every concern is a death-scroll: feedback, process checks, the
// curated baseline, and the audit all land equal, so the one that needs a human
// NOW is buried under twenty that don't. This is the self-organizing layer: a
// deterministic RANK over the whole composed board (all feeds already merged by
// composeConcerns), so a "Needs attention now" digest can lead with the top few
// and the rest stay one tap away. AI-observable (a machine reads the same score),
// human-loved (you see the important few, not a scroll), pure + offline.
//
// The score is transparent on purpose (no black box): overdue dominates (a missed
// commitment is the loudest signal), then severity, then how open it still is.
// A resolved concern sinks — it's handled, it doesn't need attention.
// =============================================================================

import { daysLate } from './concerns.js';

// Shared severity vocabulary (matches feedback-triage): critical > high > normal
// > low > noise. Feedback cards carry an `evaluation.severity`; process-derived
// cards carry `severity`; everything else is a normal-weight signal.
export const SEVERITY_RANK = { critical: 5, high: 4, normal: 3, low: 2, noise: 1 };

export function concernSeverity(c) {
  if (!c) return 'normal';
  if (c.evaluation && c.evaluation.severity) return c.evaluation.severity;
  if (c.severity) return c.severity;
  return 'normal';
}

// A single, explainable score. Higher = louder. Overdue is worth more than any
// severity so a slipped commitment always leads; done sinks far below zero.
export function signalScore(c) {
  if (!c) return -Infinity;
  const late = daysLate(c);
  const sev = SEVERITY_RANK[concernSeverity(c)] || 3;
  const openWeight = c.status === 'done' ? -100 : c.status === 'in-progress' ? 1 : 2;
  return (late > 0 ? 1000 + Math.min(late, 999) : 0) + sev * 10 + openWeight;
}

// Why this signal is near the top — a short, honest reason string for the digest.
export function signalReason(c) {
  const late = daysLate(c);
  if (late > 0) return `${late} ${late === 1 ? 'day' : 'days'} past target`;
  const sev = concernSeverity(c);
  if (sev === 'critical' || sev === 'high') return `${sev} severity`;
  if (c.source === 'feedback') return 'new feedback';
  if (c.source === 'coverage' || c.source === 'reconciliation') return 'flagged by a process check';
  return c.status === 'in-progress' ? 'in progress' : 'open';
}

// rankConcerns — the top unresolved signals across every feed, worst-first.
// Deterministic: ties break by target date then id so the order never jitters.
export function rankConcerns(all, { limit = 5 } = {}) {
  const active = (all || []).filter((c) => c && c.status && c.status !== 'done');
  return [...active]
    .sort((a, b) => (signalScore(b) - signalScore(a))
      || String(a.targetDate || '~').localeCompare(String(b.targetDate || '~'))
      || String(a.id).localeCompare(String(b.id)))
    .slice(0, limit);
}

// signalSummary — the one observable line: how many signals, by feed, and how
// many need attention. Lets a human (or a machine) see the board's shape at a
// glance without scrolling it.
export function signalSummary(all) {
  const arr = (all || []).filter(Boolean);
  const bySource = (s) => arr.filter((c) => c.source === s).length;
  return {
    total: arr.length,
    feedback: bySource('feedback'),
    process: arr.filter((c) => c.source === 'coverage' || c.source === 'reconciliation').length,
    audit: bySource('audit'),
    curated: arr.filter((c) => c.source === 'seed' || c.source === 'manual').length,
    open: arr.filter((c) => c.status === 'open').length,
    inProgress: arr.filter((c) => c.status === 'in-progress').length,
    done: arr.filter((c) => c.status === 'done').length,
    overdue: arr.filter((c) => daysLate(c) > 0).length,
    needsAttention: arr.filter((c) => c.status !== 'done' && (daysLate(c) > 0 || ['critical', 'high'].includes(concernSeverity(c)))).length,
  };
}
