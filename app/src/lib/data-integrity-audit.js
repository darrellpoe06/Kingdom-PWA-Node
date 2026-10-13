// =============================================================================
// data-integrity — summarize the committed static-data audit ledger so the app
// can show, as a STANDARD REPORT, how much of the surface is verified live-data
// (DR-0061 / P15) and how that improves over time ("see our growth", Darrell
// 2026-07-20). This lib is PURE: it reads the ledger JSON and derives coverage,
// open-findings-by-severity, and the trend. It PAINTS NOTHING — every number it
// returns is computed from the real ledger records (the audit results), so the
// integrity report is itself held to the standard it measures (DR-0076).
//
// Ledger shape (app/src/data/data-integrity-audit.json):
//   { updatedAt, areas: [{ id, label, files:[...], verdict:'clean'|'findings'|'pending',
//       high, med, low, note, auditedAt }],
//     history: [{ date, areasAudited, areasClean, openHigh, openMed, openLow }] }
// verdict 'pending' = not yet audited (honest coverage gap, never counted clean).
// =============================================================================

// Sum a severity across the audited areas (pending areas contribute nothing).
function sev(areas, k) {
  return areas.reduce((n, a) => n + (a.verdict === 'pending' ? 0 : (Number(a[k]) || 0)), 0);
}

export function summarizeAudit(ledger) {
  const areas = Array.isArray(ledger?.areas) ? ledger.areas : [];
  const history = Array.isArray(ledger?.history) ? ledger.history : [];

  const total = areas.length;
  const audited = areas.filter((a) => a.verdict && a.verdict !== 'pending').length;
  const pending = total - audited;
  const clean = areas.filter((a) => a.verdict === 'clean').length;
  const withFindings = areas.filter((a) => a.verdict === 'findings').length;

  const openHigh = sev(areas, 'high');
  const openMed = sev(areas, 'med');
  const openLow = sev(areas, 'low');
  const openTotal = openHigh + openMed + openLow;

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const coveragePct = pct(audited, total);
  // "clean" is measured against what has actually been audited — under-claiming
  // (counting pending as dirty) and over-claiming (counting pending as clean)
  // are both avoided by scoping to `audited` (DR-0100 / DR-0076).
  const cleanPct = pct(clean, audited);

  // Trend: compare the two most recent history points (newest last). Fewer open
  // HIGH findings and higher coverage = growth. First run has no prior → baseline.
  const last = history[history.length - 1] || null;
  const prev = history[history.length - 2] || null;
  const trend = !prev ? { baseline: true } : {
    baseline: false,
    highDelta: (last?.openHigh ?? 0) - (prev.openHigh ?? 0),
    coverageDelta: (last?.areasAudited ?? 0) - (prev.areasAudited ?? 0),
    cleanDelta: (last?.areasClean ?? 0) - (prev.areasClean ?? 0),
  };

  // One honest verdict for the KPI dot: problem if any open HIGH, attention if
  // any open finding or any pending area, good only when fully audited + clean.
  const status = openHigh > 0 ? 'problem'
    : (openTotal > 0 || pending > 0) ? 'attention'
      : audited > 0 ? 'good' : 'idle';

  return {
    total, audited, pending, clean, withFindings,
    openHigh, openMed, openLow, openTotal,
    coveragePct, cleanPct, status,
    updatedAt: ledger?.updatedAt || null,
    areas, history, last, prev, trend,
  };
}
