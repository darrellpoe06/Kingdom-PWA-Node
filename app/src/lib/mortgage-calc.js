// =============================================================================
// mortgage-calc — one loan, month by month, with and without extra principal
// =============================================================================
// Darrell, 2026-11-10, with eleven screens of the phone calculator he has been
// using beside the app: "We need our own mortgage calculator inside our PoeTech
// App where it makes sense." This is the engine under it (DR-1413).
//
// It answers what that calculator answers, with no account, no advert and no
// network: the payment for a principal, rate and term; the full schedule; and
// what a monthly, twice-yearly, yearly or one-time extra payment does to the
// payoff month and to the interest.
//
// A loan is described EITHER by its term (a new loan: the payment is worked
// out) OR by its payment (a loan already on the books: the property record
// keeps balance, rate and P&I, and no term). Nothing is guessed: a loan whose
// payment cannot cover its first month of interest is refused in words, never
// drawn as a schedule that does not end.
//
// The arithmetic: a monthly rate of the yearly rate over twelve, carried at
// full precision and rounded to the cent only where a figure is shown, the
// last payment trimmed to what is owed. Measured against the reference
// calculator (three rounding conventions tried; only this one matches every
// figure to the cent — __tests__/mortgage-calc.test.js). A lender that rounds
// interest each month can differ from this by a few cents over the life of a
// loan. Pure; no React, no dates beyond a 'YYYY-MM'.
// =============================================================================

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
export const MAX_MONTHS = 1200;

/** 'YYYY-MM' plus a number of months. */
export function addMonths(ym, add) {
  const [y, m] = String(ym).split('-').map(Number);
  const d = new Date(y, m - 1 + add, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** The level monthly payment for a principal, a yearly rate (%) and a term in years. */
export function standardPayment(principal, ratePct, years) {
  const p = num(principal); const n = Math.round(num(years) * 12); const r = num(ratePct) / 100 / 12;
  if (!(p > 0) || !(n > 0)) return 0;
  return round2(exactPayment(p, r, n));
}
const exactPayment = (p, r, n) => (r === 0 ? p / n : (p * r) / (1 - (1 + r) ** -n));

/** The extra principal that falls in payment number `n` (1 = the first payment). */
export function extraInMonth(prepay, n) {
  const p = prepay || {};
  let x = 0;
  const every = (rule, step) => {
    const amount = num(rule && rule.amount); const start = Math.max(1, Math.round(num(rule && rule.startMonth) || 1));
    if (amount > 0 && n >= start && (n - start) % step === 0) x += amount;
  };
  every(p.monthly, 1);
  every(p.semiAnnual, 6);
  every(p.annual, 12);
  if (num(p.oneTime && p.oneTime.amount) > 0 && Math.round(num(p.oneTime.month)) === n) x += num(p.oneTime.amount);
  return x;
}

/**
 * The schedule for one loan.
 * @param {object} loan { principal, ratePct, years?, payment?, startYm, propertyValue?, prepay? }
 * @returns {{ok: boolean, reason?: string, payment: number, rows: object[], months: number,
 *   totalInterest: number, totalExtra: number, totalPaid: number, endYm: string|null}}
 */
export function buildSchedule(loan) {
  const principal = num(loan && loan.principal);
  const ratePct = num(loan && loan.ratePct);
  const r = ratePct / 100 / 12;
  const termMonths = Math.round(num(loan && loan.years) * 12);
  // A payment on file is used as written; a term is worked out and kept exact.
  const pay = num(loan && loan.payment) > 0 ? num(loan.payment) : (principal > 0 && termMonths > 0 ? exactPayment(principal, r, termMonths) : 0);
  const payment = round2(pay);
  const startYm = (loan && loan.startYm) || '2000-01';
  const value = num(loan && loan.propertyValue);
  const fail = (reason) => ({ ok: false, reason, payment, rows: [], months: 0, totalInterest: 0, totalExtra: 0, totalPaid: 0, endYm: null });
  if (!(principal > 0)) return fail('Enter the amount owed.');
  if (ratePct < 0) return fail('The interest rate cannot be below zero.');
  if (!(pay > 0)) return fail('Enter the term in years, or the monthly payment.');
  if (pay <= principal * r + 0.005) return fail(`A payment of $${payment.toFixed(2)} does not cover the first month of interest ($${round2(principal * r).toFixed(2)}), so this loan would never be paid off.`);

  const rows = []; let balance = principal; let totalInterest = 0; let totalExtra = 0;
  for (let n = 1; balance > 0.004 && n <= MAX_MONTHS; n += 1) {
    const interest = balance * r;
    const toPrincipal = Math.min(pay - interest, balance);
    const extra = Math.min(extraInMonth(loan.prepay, n), balance - toPrincipal);
    balance = balance - toPrincipal - extra;
    if (balance < 0.005) balance = 0;
    totalInterest += interest; totalExtra += extra;
    rows.push({
      n, ym: addMonths(startYm, n - 1), payment: round2(interest + toPrincipal), interest: round2(interest), principal: round2(toPrincipal), extra: round2(extra),
      total: round2(interest + toPrincipal + extra), balance: round2(balance), ltv: value > 0 ? Math.round((balance / value) * 1000) / 10 : null,
      exact: { interest, principal: toPrincipal, extra },
    });
  }
  if (balance > 0.004) return fail('This loan is not paid off within 100 years at this payment.');
  return { ok: true, payment, rows, months: rows.length, totalInterest: round2(totalInterest), totalExtra: round2(totalExtra), totalPaid: round2(principal + totalInterest), endYm: rows[rows.length - 1].ym };
}

/** One row a calendar year: interest, principal (extra included), and the closing balance. */
export function annualRows(rows) {
  const out = [];
  for (const row of rows || []) {
    const year = row.ym.slice(0, 4);
    let y = out[out.length - 1];
    if (!y || y.year !== year) { y = { year, i: 0, p: 0, x: 0 }; out.push(y); }
    const e = row.exact || row;
    y.i += e.interest; y.p += e.principal + e.extra; y.x += e.extra;
    y.balance = row.balance; y.ltv = row.ltv;
  }
  return out.map((y) => ({ year: y.year, interest: round2(y.i), principal: round2(y.p), extra: round2(y.x), balance: y.balance, ltv: y.ltv }));
}

/**
 * The whole answer: the loan as written, the loan with the extra payments, and
 * the difference between them. `expenses` are carried beside the payment and
 * never enter the schedule: { annualInsurance, annualTax, monthly }.
 */
export function calculate(loan, expenses = {}) {
  const base = buildSchedule({ ...loan, prepay: null });
  const monthlyExpenses = round2(num(expenses.annualInsurance) / 12 + num(expenses.annualTax) / 12 + num(expenses.monthly));
  if (!base.ok) return { ok: false, reason: base.reason, payment: base.payment, monthlyExpenses, totalMonthly: round2(base.payment + monthlyExpenses) };
  const plan = buildSchedule(loan);
  const hasExtra = plan.totalExtra > 0;
  return {
    ok: true,
    payment: base.payment,
    monthlyExpenses,
    totalMonthly: round2(base.payment + monthlyExpenses),
    base, plan, hasExtra,
    monthsSaved: base.months - plan.months,
    interestSaved: round2(base.totalInterest - plan.totalInterest),
    // Of every dollar paid under the plan: how much is interest, scheduled principal, extra.
    split: {
      interest: plan.totalInterest,
      principal: round2(plan.totalPaid - plan.totalInterest - plan.totalExtra),
      extra: plan.totalExtra,
    },
  };
}
