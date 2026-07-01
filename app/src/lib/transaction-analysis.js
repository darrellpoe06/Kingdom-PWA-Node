// =============================================================================
// transaction-analysis — sort / filter / evaluate the ledger (DR-0061)
// =============================================================================
// "They need to actually work the data" (Darrell + Christina). After a bulk
// upload of months across accounts, the verify-and-evaluate step needs to SORT
// (by date / amount / account / payee / category), FILTER (account, date range,
// text), and EVALUATE (income vs outflow by category, per-account derived
// balance). Pure + deterministic so the math is testable and the same whether
// the data came from manual entry, CSV, or the verified ledger.
// =============================================================================

// filterTransactions — narrow the ledger. Every clause is optional; an absent /
// 'all' clause is a pass-through. Dates are ISO strings (lexical compare works).
export function filterTransactions(txns, filters = {}) {
  const { accountId, dateFrom, dateTo, search, category } = filters;
  const q = (search || '').trim().toLowerCase();
  return (txns || []).filter((t) => {
    if (!t) return false;
    if (accountId && accountId !== 'all' && t.accountId !== accountId) return false;
    if (category && category !== 'all' && (t.category || 'other') !== category) return false;
    if (dateFrom && String(t.date || '') < dateFrom) return false;
    if (dateTo && String(t.date || '') > dateTo) return false;
    if (q) {
      const hay = ((t.description || '') + ' ' + (t.category || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const COMPARATORS = {
  date: (t) => String(t.date || ''),
  amount: (t) => Number(t.amount) || 0,
  payee: (t) => String(t.description || '').toLowerCase(),
  category: (t) => String(t.category || 'other').toLowerCase(),
};

// sortTransactions — stable sort by a column. `accountName(id)` lets us sort by
// the human account name rather than the opaque id. dir = 'asc' | 'desc'.
export function sortTransactions(txns, key = 'date', dir = 'desc', accountName) {
  const get = key === 'account'
    ? (t) => String((accountName && accountName(t.accountId)) || t.accountId || '').toLowerCase()
    : (COMPARATORS[key] || COMPARATORS.date);
  const sign = dir === 'asc' ? 1 : -1;
  return (txns || [])
    .map((t, i) => [t, i])
    .sort((a, b) => {
      const va = get(a[0]);
      const vb = get(b[0]);
      if (va < vb) return -1 * sign;
      if (va > vb) return 1 * sign;
      return a[1] - b[1]; // stable
    })
    .map(([t]) => t);
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// monthCoverage — DATA-COMPLETENESS self-check for the ledger. The "April showed
// 2 of 296" bug (a sync cap silently dropping rows) is invisible until a human
// eyeballs the months. This encodes the reflex: over the span first..last, count
// per month (gaps filled as 0 so a MISSING month is caught too) and flag any
// month whose count is anomalously low vs the median populated month. Pure +
// deterministic so the proactive audit can run it and a thin month self-flags.
export function monthCoverage(txns, { minFraction = 0.2, minMonths = 3 } = {}) {
  const byMonth = {};
  for (const t of txns || []) {
    if (!t || !t.date) continue;
    const m = String(t.date).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(m)) continue;
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const keys = Object.keys(byMonth).sort();
  if (keys.length === 0) return { months: [], thin: [], median: 0 };
  // Fill every month in the span so a completely-missing month reads as 0.
  const span = [];
  let [y, mo] = keys[0].split('-').map(Number);
  const [ey, em] = keys[keys.length - 1].split('-').map(Number);
  while (y < ey || (y === ey && mo <= em)) {
    span.push(`${y}-${String(mo).padStart(2, '0')}`);
    mo += 1; if (mo > 12) { mo = 1; y += 1; }
    if (span.length > 600) break; // safety
  }
  const populated = span.map(m => byMonth[m] || 0).filter(c => c > 0).sort((a, b) => a - b);
  const median = populated.length ? populated[Math.floor(populated.length / 2)] : 0;
  const floor = Math.max(1, Math.round(median * minFraction));
  const months = span.map(m => ({ month: m, count: byMonth[m] || 0, thin: (byMonth[m] || 0) < floor }));
  const thin = span.length >= minMonths ? months.filter(x => x.thin).map(x => x.month) : [];
  return { months, thin, median, floor };
}

// reviewStatus — the deterministic "verify/categorize" scoreboard. A transaction
// is CATEGORIZED (the new "verified") once it carries a real category; anything
// still 'other' or blank is NEEDS-REVIEW (the old "unexplained"). Pure count over
// the ledger, so it moves as the categorizer runs and as the user confirms rows.
export function reviewStatus(txns) {
  let categorized = 0;
  let needsReview = 0;
  for (const t of txns || []) {
    if (!t) continue;
    const c = t.category;
    if (c && c !== 'other') categorized += 1; else needsReview += 1;
  }
  const total = categorized + needsReview;
  return { categorized, needsReview, total, pctCategorized: total ? Math.round((categorized / total) * 100) : 0 };
}

// categorySummary — the EVALUATE view: per-category income (credits) vs outflow
// (debits) + net + count, sorted by gross size so the biggest movers lead, with
// grand totals. This is how they judge the real picture against what they know.
export function categorySummary(txns) {
  const byCat = {};
  let totalIncome = 0;
  let totalOutflow = 0;
  for (const t of txns || []) {
    if (!t) continue;
    const cat = t.category || 'other';
    const amt = Number(t.amount) || 0;
    const c = byCat[cat] || (byCat[cat] = { category: cat, income: 0, outflow: 0, net: 0, count: 0 });
    if (amt >= 0) { c.income += amt; totalIncome += amt; } else { c.outflow += amt; totalOutflow += amt; }
    c.net += amt;
    c.count += 1;
  }
  const categories = Object.values(byCat)
    .map((c) => ({ category: c.category, income: round2(c.income), outflow: round2(c.outflow), net: round2(c.net), count: c.count }))
    .sort((a, b) => (Math.abs(b.income) + Math.abs(b.outflow)) - (Math.abs(a.income) + Math.abs(a.outflow)));
  return {
    categories,
    totalIncome: round2(totalIncome),
    totalOutflow: round2(totalOutflow),
    totalNet: round2(totalIncome + totalOutflow),
    count: (txns || []).length,
  };
}
