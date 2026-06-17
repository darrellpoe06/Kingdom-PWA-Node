// =============================================================================
// conflict-loop — pure shapers for the in-app Conflict-Evaluation Loop surface.
// =============================================================================
// The build bakes the real conflict-events spine through scripts/orchestration/
// conflict-analytics.mjs into __CONFLICT_LOOP__ (vite define). This turns that
// manifest into render-ready status WITHOUT inventing anything (DR-0076): an
// empty/absent manifest yields an honest empty surface, never a painted trend.
//
// The headline metric is the conflict-RATE TREND. The target is DOWN — fewer
// conflicts as the system grows because the fixes (decomposition, new-surface=
// new-module, the pre-spawn warning) take hold. The surface states the trend
// honestly: 'down' is good, 'up' is attention, and 'baseline' means there is not
// yet enough history to call a direction (the loop just started recording).
//
// All functions are pure and null-safe so they unit-test without a browser.

export function normalizeConflictManifest(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const rate = m.rate && typeof m.rate === 'object' ? m.rate : {};
  return {
    ok: m.ok === true,
    eventCount: typeof m.eventCount === 'number' ? m.eventCount : 0,
    hotFiles: arr(m.hotFiles).map((h) => ({
      file: String((h && h.file) || ''),
      incidents: Number((h && h.incidents) || 0),
      contendingBranches: Number((h && h.contendingBranches) || 0),
      branches: arr(h && h.branches),
      prs: arr(h && h.prs),
      causes: arr(h && h.causes),
      lastSeen: (h && h.lastSeen) || null,
      isMonolith: (h && h.isMonolith) === true,
    })),
    contendedAreas: arr(m.contendedAreas).map((a) => ({
      lane: String((a && a.lane) || ''),
      incidents: Number((a && a.incidents) || 0),
      fileCount: Number((a && a.fileCount) || 0),
      lastSeen: (a && a.lastSeen) || null,
    })),
    rate: {
      buckets: arr(rate.buckets).map((b) => ({ bucket: String((b && b.bucket) || ''), count: Number((b && b.count) || 0) })),
      total: Number(rate.total || 0),
      latest: rate.latest != null ? Number(rate.latest) : null,
      priorMean: rate.priorMean != null ? Number(rate.priorMean) : null,
      trend: String(rate.trend || 'baseline'),
      bucketCount: Number(rate.bucketCount || 0),
    },
    decomposition: arr(m.decomposition).map((d) => ({
      target: String((d && d.target) || ''),
      collisions: Number((d && d.collisions) || 0),
      priority: Number((d && d.priority) || 99),
      contendingBranches: Number((d && d.contendingBranches) || 0),
      branches: arr(d && d.branches),
      prs: arr(d && d.prs),
      recommendation: String((d && d.recommendation) || ''),
      rankedExtractions: arr(d && d.rankedExtractions),
    })),
    problems: arr(m.problems),
  };
}

// The trend, as a KpiDot-ready descriptor. DOWN is the win; the target is always
// shown so a flat/up reading reads as "not there yet", never as success.
export function trendVerdict(rate) {
  const r = rate || {};
  const trend = String(r.trend || 'baseline');
  if (trend === 'down') return { status: 'good', label: 'Trending down', target: 'down' };
  if (trend === 'up') return { status: 'attention', label: 'Trending up — decompose', target: 'down' };
  if (trend === 'flat') return { status: 'idle', label: 'Flat', target: 'down' };
  return { status: 'idle', label: 'Baseline — recording', target: 'down' };
}

// A hot file's KpiDot status: the monolith (or any 3+ collision file) is a
// 'problem' (it is actively costing serializations); 2 collisions is 'attention';
// a single touch is 'idle'.
export function hotFileStatus(h) {
  const n = (h && h.incidents) || 0;
  if (n >= 3 || (h && h.isMonolith && n >= 1)) return { status: 'problem', label: `${n}× collided` };
  if (n === 2) return { status: 'attention', label: '2× collided' };
  return { status: 'idle', label: `${n}× touched` };
}

// Bars for a tiny inline rate chart — each bucket scaled to the max, so the
// shape of the trend is visible without a chart library. Pure (no DOM).
export function rateBars(rate) {
  const buckets = (rate && Array.isArray(rate.buckets)) ? rate.buckets : [];
  const max = buckets.reduce((m, b) => Math.max(m, b.count || 0), 0) || 1;
  return buckets.map((b) => ({ bucket: b.bucket, count: b.count || 0, pct: Math.round(((b.count || 0) / max) * 100) }));
}
