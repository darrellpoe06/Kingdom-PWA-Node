// Rental-portfolio derivation — the single source of truth behind the Real
// Estate header ("N Doors · <Entity>") and its rollup (mortgage debt, P&I,
// rent, rent gap). Pulled out of the Rentals component so the math is pure and
// directly unit-testable (DR-0076 verification doctrine: a header/rollup is a
// LIVE view of real property records, never a painted literal; the gate proves
// it recomputes from the data).
//
// A "door" = a rentable unit. A property can hold several (r.units, default 1):
// a single-family = 1 door, a fourplex = 4. The door count is the SUM of units
// across the rental portfolio, so it moves the moment a property — or its unit
// count — is added or edited.

// A property is PERSONAL when it's the family's own home (primary/secondary
// home, owner-occupied, or under the personal entity) — NOT merely because rent
// isn't entered yet (Darrell 2026-06-13: rentals stay rentals before their rent
// imports). Personal homes are excluded from the rental rollup + door count.
export const isPersonalProp = (r) =>
  r.propertyType === 'primary-home' ||
  r.propertyType === 'secondary-home' ||
  r.status === 'owner-occupied' ||
  r.entityId === 'e-personal';

// Doors in one property: a positive integer, default 1. Guards against blank,
// zero, negative, or fractional input.
export const unitsOf = (r) => Math.max(1, Math.round(Number(r && r.units) || 1));

// =============================================================================
// THE FIELDS WORK TOGETHER (DR-1178)
// =============================================================================
// Darrell, 2026-10-21: "Real estate should be flowing end to end data flows and
// fields should be concise ... made to work together... make sense?" And then:
// "And Properties tab... and Real-estate should work already if not fix it!!!!!"
//
// WHAT HIS OWN SCREENSHOTS SHOWED, read field by field rather than guessed at:
//
//   Mortgage: —    Rate: 6.5%    P&I: —
//
// A rate with no balance and no payment, on every card. Three separate blanks
// that are really ONE broken chain: a rate is not an independent fact, it is
// the multiplier between a balance and a payment, and the app made a person
// type all three by hand or see nothing. Meanwhile the door above summed that
// P&I column into "Left after the note $10,750" with one payment entered out
// of twelve. The numbers never worked together because nothing connected them.
//
// So the chain is closed here, where the math is pure and testable: a balance
// and a rate DERIVE the payment. Nothing is painted — a derived payment says it
// is derived and says the term it assumed, so it can never be mistaken for a
// figure someone entered.

/** The term a payment is derived against when the row does not carry one. */
export const ASSUMED_TERM_YEARS = 30;

/**
 * The monthly principal-and-interest on a balance at a rate over a term — the
 * standard amortized payment, P = B·i / (1 − (1+i)^−n). A zero rate is not an
 * error: it is straight-line, B/n. Returns null when there is nothing to
 * compute from, which is a real answer and never a zero.
 */
export function monthlyPIFrom({ balance, rate, years = ASSUMED_TERM_YEARS } = {}) {
  const b = Number(balance) || 0;
  const n = Math.round((Number(years) || 0) * 12);
  if (!(b > 0) || !(n > 0)) return null;
  const i = (Number(rate) || 0) / 100 / 12;
  if (!(i > 0)) return b / n;
  const p = (b * i) / (1 - Math.pow(1 + i, -n));
  return Number.isFinite(p) && p > 0 ? p : null;
}

/**
 * THE RATE A BALANCE AND A PAYMENT IMPLY — the chain run the other way. There
 * is no closed form for i in P = B·i/(1−(1+i)^−n), so this bisects on the
 * monthly rate, which converges to well under a basis point in 80 steps and
 * cannot diverge. Returns the ANNUAL percentage, or null when the payment
 * cannot service the balance over that term at any rate (P ≤ B/n means it never
 * amortizes) — null is a real answer and never a zero.
 */
export function solveRate({ balance, payment, years = ASSUMED_TERM_YEARS } = {}) {
  const b = Number(balance) || 0;
  const p = Number(payment) || 0;
  const n = Math.round((Number(years) || 0) * 12);
  if (!(b > 0) || !(p > 0) || !(n > 0)) return null;
  // At i = 0 the payment is exactly B/n. A payment at or below that services no
  // interest at all, so no positive rate fits; a payment above B (one month) is
  // past any sane bracket.
  if (p <= b / n) return null;
  let lo = 0;
  let hi = 1; // 100% a month is far above any real note; the bracket only needs to contain the answer
  for (let k = 0; k < 80; k += 1) {
    const mid = (lo + hi) / 2;
    const pay = (b * mid) / (1 - Math.pow(1 + mid, -n));
    if (!Number.isFinite(pay)) { hi = mid; continue; }
    if (pay > p) hi = mid; else lo = mid;
  }
  const annual = ((lo + hi) / 2) * 12 * 100;
  return Number.isFinite(annual) && annual > 0 ? annual : null;
}

/**
 * WHAT WE KNOW ABOUT THIS DOOR'S NOTE, AND WHAT IT IS BASED ON (DR-1178).
 *
 * Darrell, 2026-10-21, correcting an earlier draft of this function that
 * refused to read a blank rate at all: *"Blank rates should reflect the
 * rate.... 0% interest... 0 means no mortgage or we dont know it we have our
 * payments and other information and we should be able to deduce from there or
 * need to say its based on this or that."*
 *
 * He is right, and the correction is the whole shape of this function. A zero
 * is not one thing. It can mean the door is FREE AND CLEAR — a positive fact
 * worth saying, not a blank — or it can mean nobody has typed it yet. And where
 * one of the three figures is missing, the other two usually DEDUCE it: a
 * balance and a rate give the payment, a balance and a payment give the rate.
 * So this never shows a bare dash where a deduction is available, and whatever
 * it shows, it says what it is based on.
 *
 * Returns { state, balance, rate, payment, basis, words }:
 *   none     — no balance, no payment: the door carries no note we know of
 *   entered  — every figure present as typed
 *   deduced  — one figure computed, `basis` naming the two it came from
 *   partial  — something is there but not enough to deduce, `words` naming
 *              exactly which field would unlock it
 */
export function mortgageFacts(rental) {
  const m = (rental && rental.mortgage) || {};
  const balance = Number(m.balance) || 0;
  const rate = Number(m.rate) || 0;
  const payment = Number(m.monthlyPI) || 0;
  const ownTerm = Number(m.termYears) > 0 ? Number(m.termYears) : 0;
  const years = ownTerm || ASSUMED_TERM_YEARS;
  const term = ownTerm ? `${ownTerm}-yr` : `assumed ${ASSUMED_TERM_YEARS}-yr`;

  // FREE AND CLEAR is a fact, not a gap. No balance owed and no payment going
  // out is the best state a door can be in, and the old code drew it as three
  // em-dashes indistinguishable from "nobody typed anything".
  if (!(balance > 0) && !(payment > 0)) {
    return { state: 'none', balance: 0, rate, payment: 0, basis: '', words: 'No mortgage on record — nothing owed and no payment going out.' };
  }

  if (balance > 0 && payment > 0 && rate > 0) {
    return { state: 'entered', balance, rate, payment, basis: 'entered', words: 'Balance, rate and payment are all on the record.' };
  }

  // Balance + payment -> the rate they imply. Runs BEFORE the forward
  // derivation, because a payment someone actually pays is better evidence than
  // a term we assumed.
  if (balance > 0 && payment > 0 && !(rate > 0)) {
    const solved = solveRate({ balance, payment, years });
    if (solved != null) {
      return { state: 'deduced', balance, rate: solved, payment, basis: 'rate', words: `Rate deduced from the balance and the payment, over a ${term} term.` };
    }
    // A payment at or under straight-line really is interest-free, and saying
    // "0% interest" is exactly what he asked for.
    return { state: 'deduced', balance, rate: 0, payment, basis: 'rate', words: `0% interest — the payment covers the balance over a ${term} term with none left for interest.` };
  }

  // Balance + rate -> the payment.
  if (balance > 0 && rate > 0 && !(payment > 0)) {
    const p = monthlyPIFrom({ balance, rate, years });
    if (p != null) return { state: 'deduced', balance, rate, payment: p, basis: 'payment', words: `Payment deduced from the balance and rate, over a ${term} term.` };
  }

  // Balance alone, at an explicit 0% — straight-line, and it IS the payment.
  if (balance > 0 && !(payment > 0) && !(rate > 0)) {
    return { state: 'partial', balance, rate: 0, payment: 0, basis: '', words: 'Balance only. Add the rate or the monthly payment and the other one is worked out from it.' };
  }

  // Payment without a balance: the note is being paid, the balance is unknown.
  if (payment > 0 && !(balance > 0)) {
    return { state: 'partial', balance: 0, rate, payment, basis: '', words: 'Payment only. Add the balance and the rate is worked out from it.' };
  }

  return { state: 'partial', balance, rate, payment, basis: '', words: 'Not enough on the record yet to work the note out.' };
}

/**
 * The monthly note, for a surface that only wants the one figure. A thin read
 * of mortgageFacts so there is ONE place the note is reasoned about.
 *   entered — typed; it always wins
 *   derived — worked out, `why` naming what from
 *   none    — nothing owed, or not enough to work it out; `why` says which
 */
export function piFor(rental) {
  const f = mortgageFacts(rental);
  const ownTerm = Number(rental && rental.mortgage && rental.mortgage.termYears) > 0;
  if (f.state === 'entered' || (f.payment > 0 && f.basis !== 'payment' && f.state !== 'none')) {
    return { value: f.payment, source: 'entered', assumedYears: null, why: '' };
  }
  if (f.basis === 'payment' && f.payment > 0) {
    return { value: f.payment, source: 'derived', assumedYears: ownTerm ? null : ASSUMED_TERM_YEARS, why: f.words };
  }
  return { value: 0, source: 'none', assumedYears: null, why: f.words };
}

/**
 * WHETHER A DOOR'S STATUS LABEL IS BACKED BY THE LEDGER (DR-1178). `r.status`
 * is a word somebody set on the row; the rent ledger is the record of what was
 * actually received. On Darrell's live portfolio every card read "PAYING"
 * while the door above it read "No lease is synced yet, so this month has
 * nothing to measure against" — two fields about one fact, disagreeing, on one
 * screen. A label is not a measurement, and a surface that draws them
 * identically is claiming something it cannot support.
 *
 * `paid` is this door's own ledger entry (paidPortfolio.byDoor[remoteUuid]) —
 * already loaded on the card and, until now, never read for this.
 *
 * WHICH SIDE IS THE TRUTH WHEN THEY DISAGREE (Darrell, 2026-10-21: "Real Estate
 * is more accurate than the other"). The `rentals` row is the accurate record;
 * the rent ledger is a second, narrower witness that only speaks once a lease
 * is synced. So an unbacked label is a gap in the LEDGER, never doubt about the
 * row — and the words say exactly that. Getting this direction backwards would
 * have the app second-guessing its own best data.
 */
export function rentFact(rental, paid = null) {
  const label = String((rental && rental.status) || '').trim();
  const expected = Number(paid && paid.expected) || 0;
  const received = Number(paid && paid.received) || 0;
  if (!paid || !(expected > 0)) {
    return { label, backed: false, words: label ? `${label} — from the property record. The rent ledger has no lease for this door yet, so it cannot measure this month against it.` : 'no status set' };
  }
  if (received >= expected) return { label, backed: true, words: `${label} — the ledger shows this month received in full` };
  if (received > 0) return { label, backed: true, words: `${label} — the ledger shows part of this month received` };
  return { label, backed: true, words: `${label} — the ledger shows nothing received this month` };
}

// Derive the whole portfolio view from the real rental records + entity list.
// Everything the Real Estate header and rollup show comes from this one call.
export function derivePortfolio(rentals = [], entities = []) {
  const portfolioRentals = (rentals || []).filter((r) => !isPersonalProp(r));
  const doorCount = portfolioRentals.reduce((s, r) => s + unitsOf(r), 0);

  // Entity label = the business that owns the portfolio. Exactly one owner →
  // its name (e.g. "Steward Real Estate LLC"); mixed or none → a neutral label,
  // so we never hardcode an LLC name the data doesn't back.
  const portfolioEntityIds = [...new Set(portfolioRentals.map((r) => r.entityId).filter(Boolean))];
  const portfolioEntity =
    portfolioEntityIds.length === 1
      ? (entities || []).find((e) => e.id === portfolioEntityIds[0])
      : null;
  const portfolioLabel = portfolioEntity
    ? String(portfolioEntity.name || '').split('(')[0].trim() || 'Real Estate Portfolio'
    : 'Real Estate Portfolio';

  // Rollup sums only figures that are actually present; a property missing a
  // figure is counted as "needs input" and flagged, never silently zeroed into
  // the whole portfolio (honest-uncertainty: a painted $0 is worse than a
  // flagged gap on a surface whose value is trust).
  const acc = portfolioRentals.reduce(
    (a, r) => {
      const bal = Number(r.mortgage && r.mortgage.balance) || 0;
      const pi = Number(r.mortgage && r.mortgage.monthlyPI) || 0;
      const rent = Number(r.rent) || 0;
      const actual = Number(r.actual) || 0;
      a.mortgageDebt += bal;
      a.monthlyPI += pi;
      a.monthlyRent += rent;
      a.actualRent += actual;
      if (!(bal > 0)) a.missingDebt += 1;
      if (!(rent > 0)) a.missingRent += 1;
      // THE COLUMN THE DOOR WAS NOT COUNTING (DR-1178). "Mortgage a month" and
      // "Left after the note" carried no "N of M entered" line while rent and
      // debt did, so on Darrell's own portfolio the door read "Mortgage a month
      // $950" and "Left after the note $10,750" with ONE note entered out of
      // twelve. The figure was arithmetically right and read as a complete
      // one. Counting the P&I column is what lets the door say so.
      if (!(pi > 0)) a.missingPI += 1;
      return a;
    },
    { mortgageDebt: 0, monthlyPI: 0, monthlyRent: 0, actualRent: 0, missingDebt: 0, missingRent: 0, missingPI: 0 }
  );

  // Rent gap = expected rent − rent actually collected (the established app
  // meaning, poe-financial-mvp totals). Collection rate is actual ÷ expected.
  const rentGap = acc.monthlyRent - acc.actualRent;
  const collectionRate = acc.monthlyRent > 0 ? (acc.actualRent / acc.monthlyRent) * 100 : 0;

  return {
    portfolioRentals,
    portfolioCount: portfolioRentals.length,
    doorCount,
    portfolioLabel,
    mortgageDebt: acc.mortgageDebt,
    monthlyPI: acc.monthlyPI,
    monthlyRent: acc.monthlyRent,
    actualRent: acc.actualRent,
    missingDebt: acc.missingDebt,
    missingRent: acc.missingRent,
    missingPI: acc.missingPI,
    rentGap,
    collectionRate,
  };
}
