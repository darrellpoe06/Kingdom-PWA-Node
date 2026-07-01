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
