// =============================================================================
// mortgage-payoff — the PERSONAL home mortgage, kept apart from the rental
// mortgages, and what extra principal does to it (Christina, 2026-11-03: "pay
// off my personal residence by December 2030").
// =============================================================================
// The home is the property record marked owner-occupied / primary-home, so the
// mortgage is the existing record (balance, rate, P&I, escrow — the synced
// columns), never a duplicate debt. The lender, due date and paying account
// live on the confirmed bill (bill-review group 'home-mortgage') that links to
// it. Nothing is invented: every figure the math needs is either on file or
// named as missing, and no projection is produced without all of them.
// =============================================================================

const round2 = (x) => Math.round(x * 100) / 100;

export const EXTRA_SCENARIOS = [100, 250, 500, 1000, 2500];
export const HOME_GOAL = '2030-12-31';

export function isPrimaryHome(r) {
  return !!r && (r.status === 'owner-occupied' || r.propertyType === 'primary-home');
}

// The home record and its confirmed bill, with exactly what is still missing.
export function homeMortgage(data) {
  const homes = (data?.inflows?.rentals || []).filter(isPrimaryHome);
  if (!homes.length) return { found: false, missing: ['a property marked as your primary residence'] };
  const home = homes[0];
  const m = home.mortgage || {};
  const bill = (data?.recurringObligations || []).find((o) => o && o.group === 'home-mortgage' && o.enabled !== false && (o.linkedMortgageId === home.id || !o.linkedMortgageId)) || null;
  const balance = Number(m.balance) || 0;
  const rate = Number(m.rate) || 0;
  const monthlyPI = Number(m.monthlyPI) || 0;
  const escrow = Number(m.escrow) || 0;
  const missing = [];
  if (!(balance > 0)) missing.push('current balance');
  if (!(rate > 0)) missing.push('interest rate');
  if (!(monthlyPI > 0)) missing.push('principal and interest payment');
  if (!bill) missing.push('the confirmed mortgage bill (lender, due date, account) in Bills → Review & confirm');
  return {
    found: true, rentalId: home.id, property: home.name || home.address || 'Primary residence', entityId: home.entityId ?? null,
    homes: homes.length,
    lender: bill ? bill.name : null,
    balance, rate, monthlyPI, escrow,
    requiredPayment: bill ? Number(bill.amount) || 0 : round2(monthlyPI + escrow),
    nextDue: bill ? bill.nextDue || null : null,
    pastDue: bill ? Number(bill.pastDue) || 0 : 0,
    accountId: bill ? bill.accountId || null : null,
    estimated: m.estimated === true,
    complete: balance > 0 && rate > 0 && monthlyPI > 0,
    missing,
  };
}

// Month-by-month payoff with a fixed extra principal payment. Returns null when
// the payment cannot even cover the interest (it would never be paid off).
export function amortize(balance, annualRatePct, monthlyPI, extra = 0, start = new Date()) {
  const r = annualRatePct / 100 / 12;
  let b = balance; let interest = 0; let months = 0;
  const pay = monthlyPI + extra;
  if (b <= 0) return { months: 0, totalInterest: 0, payoffDate: isoMonth(start, 0) };
  if (pay <= b * r + 0.005) return null;
  while (b > 0.005 && months < 1200) {
    const i = b * r;
    interest += i;
    b = b + i - pay;
    months += 1;
  }
  return { months, totalInterest: round2(interest), payoffDate: isoMonth(start, months) };
}

function isoMonth(start, add) {
  const d = new Date(start.getFullYear(), start.getMonth() + add, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// The extra-payment table: payoff month, months saved and interest saved.
export function payoffScenarios(rec, start = new Date(), extras = EXTRA_SCENARIOS) {
  if (!rec || !rec.complete) return null;
  const base = amortize(rec.balance, rec.rate, rec.monthlyPI, 0, start);
  if (!base) return { base: null, rows: [] };
  const rows = extras.map((x) => {
    const r = amortize(rec.balance, rec.rate, rec.monthlyPI, x, start);
    return { extra: x, payoffDate: r.payoffDate, months: r.months, monthsSaved: base.months - r.months, totalInterest: r.totalInterest, interestSaved: round2(base.totalInterest - r.totalInterest) };
  });
  return { base, rows };
}

// The smallest extra monthly principal (whole dollars) that pays it off by the
// goal month, with what that saves. Null when the record is incomplete.
export function extraForGoal(rec, start = new Date(), goal = HOME_GOAL) {
  if (!rec || !rec.complete) return null;
  const goalYm = goal.slice(0, 7);
  const base = amortize(rec.balance, rec.rate, rec.monthlyPI, 0, start);
  if (base && base.payoffDate <= goalYm) return { extra: 0, payoffDate: base.payoffDate, interestSaved: 0, alreadyOnTrack: true };
  let lo = 0; let hi = Math.ceil(rec.balance);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const r = amortize(rec.balance, rec.rate, rec.monthlyPI, mid, start);
    if (r && r.payoffDate <= goalYm) hi = mid; else lo = mid + 1;
  }
  const r = amortize(rec.balance, rec.rate, rec.monthlyPI, lo, start);
  return { extra: lo, payoffDate: r.payoffDate, interestSaved: round2((base ? base.totalInterest : 0) - r.totalInterest), alreadyOnTrack: false };
}
