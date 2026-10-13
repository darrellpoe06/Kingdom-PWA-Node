// =============================================================================
// derived-insights — valuable insights from data, ALL THE TIME (DR-0249)
// =============================================================================
// Darrell 2026-07-30: "we need valuable insights from data all the time."
// Spoken after the mcp-health red-run readout proved the pattern: data the
// house already collects becomes VALUE only when a derivation states plainly
// what it means and what moved. This module is the standing derivation over
// the review registry (__UIUX_REVIEWS__ — the same build-time source the
// Quality panel and research cadence read), so every build re-derives the
// insights with zero new collection.
//
// HONESTY RULES (DR-0076/DR-0100, same discipline as quality-throughput.js):
//   - every insight is computed from real rows; no rows => ok:false
//     "unavailable", never a painted zero;
//   - movement is stated only when BOTH windows have data;
//   - meanings are plain-fact sentences (state it plainly), never hedged and
//     never inflated.
// =============================================================================

const MS_DAY = 86400000;

const items = (reviews) => {
  const arr = (reviews && Array.isArray(reviews.items)) ? reviews.items
    : (Array.isArray(reviews) ? reviews : []);
  return arr.filter((r) => r && /^\d{4}-\d{2}-\d{2}/.test(String(r.date || '')));
};
const msOf = (r) => Date.parse(`${String(r.date).slice(0, 10)}T00:00:00Z`);

// Velocity: records filed in the last N days vs the N before — is the record
// keeping pace with the work?
export function reviewVelocity(reviews, nowMs, windowDays = 7) {
  const rows = items(reviews);
  if (!rows.length || !Number.isFinite(nowMs)) return { ok: false };
  const win = windowDays * MS_DAY;
  const current = rows.filter((r) => nowMs - msOf(r) < win).length;
  const prior = rows.filter((r) => { const a = nowMs - msOf(r); return a >= win && a < 2 * win; }).length;
  return { ok: true, windowDays, current, prior, delta: current - prior };
}

// Resolution health: of everything on the record, how much is ADDRESSED vs
// still open/logged — and how old is the oldest unresolved item?
export function resolutionHealth(reviews, nowMs) {
  const rows = items(reviews);
  if (!rows.length) return { ok: false };
  const status = (r) => String(r.status || '').toLowerCase();
  const addressed = rows.filter((r) => status(r) === 'addressed').length;
  const unresolved = rows.filter((r) => status(r) === 'open' || status(r) === 'logged');
  let oldestOpenDays = null;
  if (unresolved.length && Number.isFinite(nowMs)) {
    const oldest = Math.min(...unresolved.map(msOf));
    oldestOpenDays = Math.floor((nowMs - oldest) / MS_DAY);
  }
  return { ok: true, total: rows.length, addressed, unresolved: unresolved.length, addressedRatio: addressed / rows.length, oldestOpenDays };
}

// The one call a surface makes: plain-fact insight lines, newest-signal first.
// Each line: { id, headline, basis } — headline states the fact and its meaning
// in one sentence; basis names the measurement so the claim carries its receipt.
export function insightLines(reviews, nowMs) {
  const lines = [];
  const v = reviewVelocity(reviews, nowMs);
  if (v.ok) {
    const dir = v.delta > 0 ? 'up' : v.delta < 0 ? 'down' : 'level';
    lines.push({
      id: 'velocity',
      headline: `${v.current} record${v.current === 1 ? '' : 's'} filed in the last ${v.windowDays} days — ${dir} vs the prior window (${v.prior}); the record is ${v.current > 0 ? 'moving with the work' : 'quiet — verify the work is quiet too, not just the filing'}.`,
      basis: `count of dated registry records in two ${v.windowDays}-day windows`,
    });
  }
  const h = resolutionHealth(reviews, nowMs);
  if (h.ok) {
    lines.push({
      id: 'resolution',
      headline: `${h.addressed} of ${h.total} recorded findings are addressed (${Math.round(h.addressedRatio * 100)}%)${h.unresolved ? `; ${h.unresolved} remain open/logged, the oldest ${h.oldestOpenDays} day${h.oldestOpenDays === 1 ? '' : 's'} old` : ' — nothing is parked'}.`,
      basis: 'status field over every dated registry record',
    });
  }
  if (!lines.length) return [{ id: 'unavailable', headline: 'Insights unavailable — the registry carries no dated records to derive from (honest empty, never a painted number).', basis: 'registry row count' }];
  return lines;
}
