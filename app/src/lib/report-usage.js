// =============================================================================
// report-usage — a lightweight, deterministic "learning" of which standard
// reports the family actually uses, so the most-used surfaces FIRST (Darrell
// 2026-07-20: "a learning method for Ari — the standard reports grow based on
// needs assessment and use... always keep our sorted, just iterative getting
// better"). No autonomous compute, no timer, no server call — a device-local
// usage counter that reorders a KNOWN registry of reports by frequency. Ari's
// "recognition" of the most-used report IS this frequency ranking.
//
// WHY device-local + not tenant data: the counter keys are report IDs
// ('material', 'unusual', 'recurring', ...), never family/entity data — so it
// carries no leak risk (P1 is about DATA hydration, not UI preference) and it
// is correctly per-person/per-device (which reports THIS user reaches for).
// All storage I/O is fail-soft: a broken/absent store never throws into render.
// =============================================================================

export const REPORT_USAGE_KEY = 'poe.imported.reportUsage.v1';

// The KNOWN standard-report registry. The SET is explicit (so it is "known"),
// and it GROWS by adding entries here as new needs are assessed — order in this
// list is only the tiebreak; real order is by usage (below). Kept in sync with
// the on-screen panels in Imported.jsx.
export const STANDARD_REPORTS = [
  { id: 'material', label: 'Material changes' },
  { id: 'unusual', label: 'Unusual months' },
  { id: 'recurring', label: 'Recurring payments' },
  { id: 'categories', label: 'Top categories' },
  { id: 'payees', label: 'Top payees' },
];

// A safe storage accessor — returns null (never throws) when localStorage is
// absent (SSR/tests) or blocked (private mode, quota, disabled).
function safeStore() {
  try {
    if (typeof globalThis === 'undefined') return null;
    const s = globalThis.localStorage;
    if (!s || typeof s.getItem !== 'function') return null;
    return s;
  } catch {
    return null;
  }
}

// Read the usage map { [reportId]: count }. Always returns a plain object;
// malformed / negative / non-integer values are dropped (deterministic).
export function loadReportUsage(store = safeStore()) {
  if (!store) return {};
  let raw;
  try { raw = store.getItem(REPORT_USAGE_KEY); } catch { return {}; }
  if (!raw) return {};
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return {}; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof k === 'string' && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  }
  return out;
}

// Increment the count for one report and persist. Returns the NEW usage map
// (so the caller can setState with it) — pure in, new object out; the write is
// fail-soft and never throws.
export function bumpReportUsage(id, store = safeStore(), prev = loadReportUsage(store)) {
  if (typeof id !== 'string' || !id) return prev;
  const next = { ...prev, [id]: (prev[id] || 0) + 1 };
  if (store) {
    try { store.setItem(REPORT_USAGE_KEY, JSON.stringify(next)); } catch { /* fail-soft */ }
  }
  return next;
}

// Rank a list of {id,...} reports by usage DESC, with a STABLE tiebreak on the
// original order (so equal-usage reports keep their registry order — the sort
// is deterministic and never reshuffles on a tie). Unknown/zero-usage reports
// sort after used ones but keep their relative order. Pure: does not mutate.
export function rankReports(reports = [], usage = {}) {
  return reports
    .map((r, i) => ({ r, i, n: (usage && usage[r.id]) || 0 }))
    .sort((a, b) => (b.n - a.n) || (a.i - b.i))
    .map((x) => x.r);
}
