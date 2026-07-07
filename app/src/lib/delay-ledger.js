// =============================================================================
// delay-ledger — the data-driven record of request-time vs finish-time
// =============================================================================
// Darrell 2026-07-07: "mark down and keep recording the time it would have
// taken if you did what was requested when I asked and the difference... and
// categorize each reason for our data-driven reasons to use this model AI or
// that one." The metric is the FAMILY'S wall clock (request -> finish in the
// app's timeline), never the agent's execution time; the gap between them,
// categorized, is the stress the model choice either causes or removes.
// Entries live in delay-ledger.json (appended per incident, DR-0115 pairing);
// this lib is the pure reader + stats the report surface renders.
// =============================================================================
import LEDGER from './delay-ledger.json';

export function loadDelayLedger() {
  return Array.isArray(LEDGER.entries) ? LEDGER.entries : [];
}
export const DELAY_CATEGORIES = LEDGER.categories || {};

// Pure stats over entries — honest: empty ledger reports zeros/nulls, never a
// painted average; governor-hold never counts as unnecessary.
export function delayStats(entries = loadDelayLedger()) {
  const list = (entries || []).filter((e) => e && e.id);
  const byCategory = {};
  const byModel = {};
  let unnecessary = 0;
  for (const e of list) {
    const cat = e.category || 'uncategorized';
    const hrs = cat === 'governor-hold' ? 0 : Math.max(0, Number(e.unnecessaryDelayHours) || 0);
    unnecessary += hrs;
    byCategory[cat] = byCategory[cat] || { count: 0, hours: 0 };
    byCategory[cat].count += 1;
    byCategory[cat].hours = +(byCategory[cat].hours + hrs).toFixed(2);
    const m = e.model || 'unknown';
    byModel[m] = byModel[m] || { count: 0, hours: 0 };
    byModel[m].count += 1;
    byModel[m].hours = +(byModel[m].hours + hrs).toFixed(2);
  }
  return {
    count: list.length,
    totalUnnecessaryHours: +unnecessary.toFixed(2),
    byCategory,
    byModel,
    worst: list.length
      ? list.reduce((a, b) => ((Number(b.unnecessaryDelayHours) || 0) > (Number(a.unnecessaryDelayHours) || 0) ? b : a))
      : null,
  };
}
