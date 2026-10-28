// =============================================================================
// debt-freedom.js — the corrected debt repayment engine (pure)
// =============================================================================
// Christina, 2026-10-28: "the existing debt snowball feature does not always
// calculate or function correctly ... thoroughly audit, repair, and improve the
// debt repayment engine." The audit of lib/lifecycle-and-flow.js (held in
// __tests__/debt-engine-audit.test.js, measured on synthetic debts) found:
//
//   A. A PARTIAL FINAL PAYMENT IS DOUBLE-COUNTED. When a debt's minimum clears
//      it mid-month ($50 owed, $100 minimum), the old engine pays the $50 AND
//      rolls the FULL $100 minimum into the same month's pool — $150 paid from a
//      $100 budget. Measured: two $1,000/$50 cases landed at $850 and $800
//      where the budget allows $900.
//   B. THE INTEREST METHOD IS TIED TO THE RATE'S SIZE, NOT THE LOAN'S TERMS.
//      Any APR above 10 is compounded daily, any APR at or below 10 monthly,
//      so a 12% simple-interest personal loan is charged like a card and a
//      9.99% card like a mortgage.
//   C. RUNNING OUT OF HORIZON READS AS "CLEARED". A debt whose minimum cannot
//      cover its interest reports allClearedMonth = 360 and a dated "debt-free"
//      month, with a nine-figure balance still open.
//   D. UNKNOWN TERMS READ AS FREE MONEY. A debt with no known rate and no
//      minimum is projected at 0% and $0 (the Big Picture headline), instead of
//      being named as unplannable.
//   Also missing: custom order, one-time payments, per-debt payoff dates, a
//   month-by-month schedule, promo / variable rates, fees, missed payments, and
//   any distinction between actual and projected payments.
//
// THE RULES THIS ENGINE KEEPS (each one a test):
//   · interest accrues per the debt's OWN method: 'monthly' (APR/12 on the
//     balance — mortgages, installment loans), 'daily' (daily-compounded over the
//     real days of that month — most cards), 'none' (0%). A promo rate applies
//     until its date; a rate change applies from its month; a monthly fee is
//     added like interest. Nothing is inferred from the size of the rate.
//   · every active debt is paid its minimum first, capped at what is owed; the
//     UNUSED part of a minimum that clears a debt joins THAT month's pool once,
//     and from the NEXT month the whole minimum rolls (defect A fixed).
//   · the pool (recurring extra + rolled minimums + unused minimums + lump sums
//     dated this month) is applied after minimums, in the strategy's order,
//     never exceeding a debt's remaining balance; a targeted lump sum goes to
//     its debt and any overflow to the pool.
//   · a debt rolls into the next only after it is actually at zero in THIS
//     projection; a missed payment pays nothing that month and interest still
//     accrues.
//   · a debt without known terms is NOT projected: it is returned under
//     `excluded` with its reason (defect D fixed). Reaching the horizon with a
//     balance open returns cleared=false and no debt-free date (defect C fixed).
//   · the engine never writes: balances in `data` are untouched; "paid off" is
//     a planner flag the caller stores, the account and its history stay.
//
// Independently verified: closed-form amortization (payment formula and the
// log-form month count), published 30-year mortgage interest, and hand-worked
// small cases in __tests__/debt-freedom.test.js. Expectations were written
// before the engine and were not adjusted to it.
// =============================================================================

export const STRATEGIES = [
  { id: 'snowball', label: 'Snowball', note: 'Smallest balance first; a cleared minimum rolls into the next.' },
  { id: 'avalanche', label: 'Avalanche', note: 'Highest interest rate first; a cleared minimum rolls into the next.' },
  { id: 'custom', label: 'Custom order', note: 'Your own order; anything unlisted follows the snowball.' },
];

export const INTEREST_METHODS = [
  { id: 'daily', label: 'Daily compounding (most credit cards)' },
  { id: 'monthly', label: 'Monthly (mortgages, auto and personal loans)' },
  { id: 'none', label: 'No interest' },
];

const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const EPS = 0.005;

export function monthKeyOf(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
export function addMonthsTo(date, n) { return new Date(date.getFullYear(), date.getMonth() + n, 1); }
function daysIn(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
function labelOf(date) { return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]} '${String(date.getFullYear()).slice(2)}`; }

/** The default interest method for a debt type when none is set on the debt. */
export function defaultMethod(debt) {
  const t = String(debt.debtType || debt.type || '').toLowerCase();
  if (t === 'mortgage' || t === 'loan' || t === 'auto' || t === 'personal') return 'monthly';
  if ((Number(debt.rate) || 0) === 0) return 'none';
  return 'daily';
}

/** Normalize a debt row (a deriveDebts row, or a plain test debt) into the
 *  engine's shape. `overrides[id]` (from the family's plan) may set method,
 *  promo, fees, dueDay, include, paidOff. Returns { debt, excludedReason }. */
export function normalizeDebt(raw, overrides = {}) {
  const o = overrides[raw.id] || {};
  const balance = round2(Math.max(0, Number(raw.balance) || 0));
  const apr = o.apr != null ? Number(o.apr) : (Number(raw.rate) || 0);
  const minPayment = o.minPayment != null ? Number(o.minPayment) : (Number(raw.minPayment) || 0);
  const rateKnown = raw.rateKnown != null ? !!raw.rateKnown : (apr > 0 || raw.rateKnown === true || o.apr != null);
  const debt = {
    id: raw.id, name: raw.name || raw.id, balance, apr, minPayment,
    method: o.method || raw.interestMethod || defaultMethod({ ...raw, rate: apr }),
    promo: o.promo && o.promo.until ? { apr: Number(o.promo.apr) || 0, until: String(o.promo.until) } : (raw.promo || null),
    monthlyFee: Number(o.monthlyFee != null ? o.monthlyFee : raw.monthlyFee) || 0,
    dueDay: o.dueDay || raw.dueDay || null,
    type: raw.debtType || raw.type || 'credit',
    variable: !!(o.variable || raw.variable),
    leaveAlone: !!raw.leaveAlone,
    source: raw.source || 'account',
  };
  if (o.paidOff) return { debt, excludedReason: 'marked paid off' };
  if (o.include === false) return { debt, excludedReason: 'left out of this plan' };
  if (balance <= EPS) return { debt, excludedReason: 'no balance owed' };
  if (!rateKnown && apr === 0 && !o.method) return { debt, excludedReason: 'interest rate not known' };
  if (minPayment <= 0) return { debt, excludedReason: 'no minimum payment entered' };
  return { debt, excludedReason: null };
}

/** The APR in force for a debt in a given month. */
export function aprFor(debt, monthKey, rateChanges = []) {
  let apr = debt.apr;
  if (debt.promo && monthKey <= String(debt.promo.until).slice(0, 7)) apr = debt.promo.apr;
  for (const rc of rateChanges) {
    if (rc.debtId === debt.id && rc.from && monthKey >= String(rc.from).slice(0, 7)) apr = Number(rc.apr) || 0;
  }
  return apr;
}

/** One month of interest on `balance` for this debt, by its own method. */
export function interestFor(debt, balance, monthDate, apr) {
  if (balance <= 0 || !apr || apr <= 0) return 0;
  const r = apr / 100;
  switch (debt.method) {
    case 'none': return 0;
    case 'daily': return round2(balance * (Math.pow(1 + r / 365, daysIn(monthDate)) - 1));
    default: return round2(balance * r / 12);
  }
}

function orderFor(strategy, customOrder = []) {
  return (list) => {
    const live = list.filter((s) => s.balance > EPS);
    if (strategy === 'avalanche') return live.sort((a, b) => (b.aprNow - a.aprNow) || (a.balance - b.balance));
    if (strategy === 'custom') {
      const rank = new Map(customOrder.map((id, i) => [id, i]));
      return live.sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id) : Infinity; const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
        return (ra - rb) || (a.balance - b.balance);
      });
    }
    return live.sort((a, b) => (a.balance - b.balance) || (b.aprNow - a.aprNow));
  };
}

/**
 * planDebtFreedom(debts, opts) → the complete month-by-month plan.
 *   debts        — deriveDebts rows or { id, name, balance, rate, minPayment, debtType? }
 *   opts.strategy      'snowball' | 'avalanche' | 'custom'
 *   opts.customOrder   [debtId, ...] for 'custom'
 *   opts.extraMonthly  recurring extra applied after minimums
 *   opts.oneTime       [{ month: 'YYYY-MM', amount, debtId? }]
 *   opts.rateChanges   [{ debtId, from: 'YYYY-MM', apr }]
 *   opts.missed        [{ debtId, month: 'YYYY-MM' }]
 *   opts.overrides     { [debtId]: { method, apr, minPayment, promo, monthlyFee, dueDay, include, paidOff } }
 *   opts.startDate     the first projected month (default: next month)
 *   opts.maxMonths     horizon (default 600)
 */
export function planDebtFreedom(debts, opts = {}) {
  const {
    strategy = 'snowball', customOrder = [], extraMonthly = 0, oneTime = [], rateChanges = [], missed = [],
    overrides = {}, maxMonths = 600,
  } = opts;
  const start = opts.startDate instanceof Date ? new Date(opts.startDate.getFullYear(), opts.startDate.getMonth(), 1) : addMonthsTo(new Date(), 1);
  const included = []; const excluded = [];
  for (const raw of debts || []) {
    if (!raw) continue;
    const { debt, excludedReason } = normalizeDebt(raw, overrides);
    if (excludedReason) excluded.push({ ...debt, reason: excludedReason });
    else included.push(debt);
  }
  const state = included.map((d) => ({ ...d, start: d.balance, interestPaid: 0, feesPaid: 0, totalPaid: 0, payoffMonth: null, payoffKey: null, payoffLabel: null, aprNow: d.apr }));
  const order = orderFor(strategy, customOrder);
  const months = [];
  let rolled = 0; // minimums of debts cleared in PRIOR months
  let cleared = state.length === 0;
  const totalOwedAtStart = round2(state.reduce((s, d) => s + d.balance, 0));
  for (let m = 1; m <= maxMonths && !cleared; m++) {
    const monthDate = addMonthsTo(start, m - 1);
    const key = monthKeyOf(monthDate);
    const rows = new Map();
    const row = (d) => { if (!rows.has(d.id)) rows.set(d.id, { debtId: d.id, name: d.name, startBalance: d.balance, interest: 0, fees: 0, minimum: 0, extra: 0, lump: 0, principal: 0, endBalance: d.balance, paidOff: false, missed: false, apr: d.aprNow }); return rows.get(d.id); };
    // 1) interest + fees
    for (const d of state) {
      if (d.balance <= EPS) continue;
      d.aprNow = aprFor(d, key, rateChanges);
      const r = row(d); r.apr = d.aprNow;
      const i = interestFor(d, d.balance, monthDate, d.aprNow);
      const f = d.monthlyFee > 0 ? round2(d.monthlyFee) : 0;
      d.balance = round2(d.balance + i + f); d.interestPaid = round2(d.interestPaid + i); d.feesPaid = round2(d.feesPaid + f);
      r.interest = i; r.fees = f;
    }
    // 2) minimums, capped at what is owed; the unused part joins this month's pool once
    let unused = 0; let clearedThisMonth = 0;
    for (const d of state) {
      if (d.balance <= EPS) continue;
      const r = row(d);
      const skip = missed.some((x) => x.debtId === d.id && String(x.month).slice(0, 7) === key);
      if (skip) { r.missed = true; continue; }
      // A residual under 1% of the minimum — the cents a cent-rounded payment
      // leaves behind at the end of a term — is settled with this payment, as a
      // lender's final payment does; it never bills a separate month for $1.04.
      const settleAll = d.balance - d.minPayment > 0 && d.balance - d.minPayment < d.minPayment * 0.01;
      const pay = round2(Math.min(settleAll ? d.balance : d.minPayment, d.balance));
      d.balance = round2(d.balance - pay); d.totalPaid = round2(d.totalPaid + pay);
      r.minimum = pay;
      if (d.balance <= EPS) { d.balance = 0; d.payoffMonth = m; d.payoffKey = key; d.payoffLabel = labelOf(monthDate); r.paidOff = true; unused = round2(unused + (d.minPayment - pay)); clearedThisMonth = round2(clearedThisMonth + d.minPayment); }
    }
    // 3) the pool: recurring extra + rolled minimums + unused minimums + this month's lump sums
    let pool = round2((Number(extraMonthly) || 0) + rolled + unused);
    const lumps = oneTime.filter((l) => String(l.month).slice(0, 7) === key && (Number(l.amount) || 0) > 0);
    for (const l of lumps) {
      const target = l.debtId ? state.find((d) => d.id === l.debtId && d.balance > EPS) : null;
      let amt = round2(Number(l.amount) || 0);
      if (target) {
        const pay = round2(Math.min(amt, target.balance));
        target.balance = round2(target.balance - pay); target.totalPaid = round2(target.totalPaid + pay);
        const r = row(target); r.lump = round2(r.lump + pay);
        if (target.balance <= EPS) { target.balance = 0; target.payoffMonth = m; target.payoffKey = key; target.payoffLabel = labelOf(monthDate); r.paidOff = true; clearedThisMonth = round2(clearedThisMonth + target.minPayment); }
        amt = round2(amt - pay);
      }
      pool = round2(pool + amt); // untargeted, or the overflow of a targeted lump
    }
    let guard = 0;
    while (pool > EPS && guard++ < 1000) {
      const q = order(state);
      if (!q.length) break;
      const t = q[0];
      const pay = round2(Math.min(pool, t.balance));
      t.balance = round2(t.balance - pay); t.totalPaid = round2(t.totalPaid + pay); pool = round2(pool - pay);
      const r = row(t); r.extra = round2(r.extra + pay);
      if (t.balance <= EPS) { t.balance = 0; t.payoffMonth = m; t.payoffKey = key; t.payoffLabel = labelOf(monthDate); r.paidOff = true; clearedThisMonth = round2(clearedThisMonth + t.minPayment); }
    }
    rolled = round2(rolled + clearedThisMonth);
    // 4) the month's record
    const payments = [...rows.values()].map((r) => { r.principal = round2(r.minimum + r.extra + r.lump - r.interest - r.fees); r.endBalance = round2(state.find((d) => d.id === r.debtId).balance); return r; });
    months.push({
      month: key, label: labelOf(monthDate), offset: m, payments,
      totalPaid: round2(payments.reduce((s, r) => s + r.minimum + r.extra + r.lump, 0)),
      totalInterest: round2(payments.reduce((s, r) => s + r.interest, 0)),
      totalBalance: round2(state.reduce((s, d) => s + d.balance, 0)),
      poolUnspent: pool > EPS ? round2(pool) : 0,
    });
    cleared = state.every((d) => d.balance <= EPS);
  }
  const last = months[months.length - 1];
  return {
    strategy, startMonth: monthKeyOf(start),
    debts: state.map((d) => ({
      id: d.id, name: d.name, type: d.type, method: d.method, apr: d.apr, minPayment: d.minPayment, dueDay: d.dueDay,
      startBalance: d.start, endBalance: d.balance, interestPaid: round2(d.interestPaid), feesPaid: round2(d.feesPaid), totalPaid: round2(d.totalPaid),
      payoffMonth: d.payoffMonth, payoffKey: d.payoffKey, payoffLabel: d.payoffLabel, cleared: d.balance <= EPS,
      promo: d.promo, variable: d.variable,
    })),
    excluded,
    months,
    cleared,
    debtFreeMonth: cleared && months.length ? months.length : null,
    debtFreeKey: cleared && last ? last.month : null,
    debtFreeLabel: cleared && last ? last.label : null,
    totalInterest: round2(state.reduce((s, d) => s + d.interestPaid, 0)),
    totalFees: round2(state.reduce((s, d) => s + d.feesPaid, 0)),
    totalPaid: round2(state.reduce((s, d) => s + d.totalPaid, 0)),
    totalOwedAtStart,
    horizonExhausted: !cleared && months.length >= maxMonths,
  };
}

/** The same debts under every strategy, plus minimums only, for the comparison table. */
export function compareStrategies(debts, opts = {}) {
  const base = { ...opts };
  const results = {};
  for (const s of STRATEGIES) results[s.id] = planDebtFreedom(debts, { ...base, strategy: s.id });
  results['minimums-only'] = planDebtFreedom(debts, { ...base, strategy: 'snowball', extraMonthly: 0, oneTime: [] });
  return results;
}

/** The standard amortization payment: P·r / (1 − (1+r)^−n). Used by the UI to
 *  show "what the loan's own payment would be" and by the tests as an
 *  independent check — it is not the engine's loop. */
export function amortizedPayment(principal, apr, months) {
  const r = (Number(apr) || 0) / 100 / 12; const n = Number(months) || 0;
  if (n <= 0) return 0;
  if (r === 0) return round2(principal / n);
  return round2((principal * r) / (1 - Math.pow(1 + r, -n)));
}

/** What the plan says to pay THIS month per debt: the first month's rows. */
export function thisMonthPayments(plan) {
  const m = plan && plan.months && plan.months[0];
  if (!m) return [];
  return m.payments.map((r) => ({ debtId: r.debtId, name: r.name, minimum: r.minimum, extra: r.extra, lump: r.lump, total: round2(r.minimum + r.extra + r.lump), paidOff: r.paidOff }));
}
