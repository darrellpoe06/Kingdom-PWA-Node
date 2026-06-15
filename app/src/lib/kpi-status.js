// =============================================================================
// KPI status indicators — ONE palette + label set for every live KPI in the app
// =============================================================================
// Darrell 2026-06-15: don't make the build-freshness dot a one-off — make it the
// first instance of a reusable status-indicator system with a documented Key,
// applied consistently so every live KPI (build freshness, local-LLM health,
// workflow + loop health) reads the same way — "everything has its place."
//
// FOUR canonical states. Color is NEVER the only signal (WCAG 1.4.1): every dot
// is rendered via <KpiDot> paired with a text label + title + aria-label. The
// four colors each clear >=3:1 non-text contrast (1.4.11) against BOTH white and
// black, so they stay legible on every theme (the light themes .. midnight OLED).
// Verified in kpi-status.test.js, not by eye (DR-0076 — measure, don't claim).

export const KPI_STATUS = {
  good:      { key: 'good',      color: '#15803D', label: 'Good',      meaning: 'Good · latest · on-track · healthy' },
  attention: { key: 'attention', color: '#B45309', label: 'Attention', meaning: 'Attention · stale · due soon' },
  problem:   { key: 'problem',   color: '#DC2626', label: 'Problem',   meaning: 'Problem · old · blocked · overdue' },
  idle:      { key: 'idle',      color: '#6B7280', label: 'Idle',      meaning: 'Idle · N/A · no data yet' },
};

export const KPI_STATUS_ORDER = ['good', 'attention', 'problem', 'idle'];

// Known synonyms from the surfaces we drive, each mapped to a canonical state.
// Lets any surface pass its OWN vocabulary ('success', 'overdue', 'pinned',
// 'fresh', 'offline') and still get the right bucket — so the palette lives in
// exactly one place and the surfaces never re-pick colors.
const SYNONYMS = {
  // -> good
  latest: 'good', healthy: 'good', 'on-track': 'good', ontrack: 'good', success: 'good',
  fresh: 'good', ok: 'good', running: 'good', active: 'good', updating: 'good', loaded: 'good',
  // -> attention
  stale: 'attention', 'due-soon': 'attention', duesoon: 'attention', pinned: 'attention',
  warn: 'attention', warning: 'attention', slipping: 'attention',
  // -> problem
  old: 'problem', blocked: 'problem', overdue: 'problem', error: 'problem', crashed: 'problem',
  failed: 'problem', failure: 'problem', never: 'problem', late: 'problem',
  // -> idle (honest "no data" — never a misleading green)
  'n/a': 'idle', na: 'idle', 'no-data': 'idle', nodata: 'idle', waiting: 'idle',
  'never-run': 'idle', unknown: 'idle', offline: 'idle', disconnected: 'idle', unreachable: 'idle',
};

// Resolve a canonical key OR a known synonym to a canonical state descriptor.
// Unknown / null -> idle (never a misleading green). Null-safe.
export function resolveKpiStatus(status) {
  const k = String(status == null ? '' : status).trim().toLowerCase();
  if (KPI_STATUS[k]) return KPI_STATUS[k];
  const syn = SYNONYMS[k];
  return (syn && KPI_STATUS[syn]) || KPI_STATUS.idle;
}

// Just the color for a status — convenience for surfaces that color their own
// detail-row dots from the shared palette (so colors can't drift).
export function kpiColor(status) {
  return resolveKpiStatus(status).color;
}

// The Key (legend), derived from the SAME source the dots use — never a second
// hand-maintained list that could drift from the real palette.
export const KPI_LEGEND = KPI_STATUS_ORDER.map((k) => ({ ...KPI_STATUS[k] }));
