// =============================================================================
// games/asset-allocation.js — "The Steward's Challenge" (real-money asset game)
// =============================================================================
// Darrell, 2026-07-06: make it fun and tangible — "she can buy 3 houses because
// she has $30,000 and she can split the money across them for 5% plus
// contingency." The board game scores abstract categories; this is the concrete
// money mini-game that sits underneath the "Buying & Managing Assets" idea: you
// have real cash (Christiana's $30,000), and you allocate it across properties by putting a DOWN PAYMENT
// (min 5% — leverage) plus closing costs on each, while keeping a CONTINGENCY
// reserve you are not supposed to spend to zero. It teaches the real lessons:
// leverage lets a little cash control a lot; diversify across several doors;
// never skip the reserve; and an asset that does not cash-flow is a trap, not a
// win.
//
// PURE + DETERMINISTIC (DR-0076): every function is (state, ...) -> new state
// with integer-dollar math, no Date.now()/Math.random(), so the vitest suite
// asserts exact outcomes. The grade maps to the SAME Yahweh-weighted categories
// the Generations board uses (wisdom, provision, peace, family), and every
// Scripture ref resolves verbatim from lib/scripture-kjv.js via scripture-link.
// FRAMING is Darrell + Bishop's to govern; flagged for review.
// =============================================================================

export const START_CASH = 30000;          // Christiana's stake
export const MIN_DOWN_PCT = 5;            // the leverage floor she named
export const MAX_DOWN_PCT = 100;
export const CLOSING_PCT = 2;             // closing costs, paid in cash at purchase
export const CONTINGENCY_TARGET = 3000;   // the reserve a wise steward keeps back

// Rough, honest-enough monthly model (not a mortgage calculator; a teaching toy):
// debt service on the financed balance + operating costs as a share of rent.
const MONTHLY_DEBT_RATE = 0.006;          // ~7.2%/yr on the loan balance (P&I-ish)
const EXPENSE_RATE = 0.35;                // taxes, upkeep, vacancy as a share of rent

// The block she can shop. Real trade-offs: cheap doors cash-flow thin; the big
// fourplex pays well but eats the reserve.
export const PROPERTIES = [
  { id: 'cottage',  name: 'The Cottage',      price: 70000,  rent: 720,  note: 'Tiny and affordable — a first brick you can actually reach.' },
  { id: 'corner',   name: 'The Corner House', price: 95000,  rent: 950,  note: 'Needs a little work; cheap to get into, steady renters after.' },
  { id: 'starter',  name: 'The Starter Home', price: 120000, rent: 1150, note: 'A small home on a quiet street; dependable tenants.' },
  { id: 'duplex',   name: 'The Duplex',       price: 175000, rent: 1750, note: 'Two units, two rent checks — a little more to manage.' },
  { id: 'fourplex', name: 'The Fourplex',     price: 320000, rent: 3300, note: 'Four doors; the big one — strong income if you can hold the reserve.' },
];

export function getProperty(id) {
  return PROPERTIES.find((p) => p.id === id) || null;
}

// A fresh challenge: all cash, nothing bought.
export function createAllocation() {
  return { holdings: [] }; // holdings: [{ propertyId, downPct }]
}

// The per-property cash + monthly numbers for a chosen down payment.
export function analyze(propertyId, downPct) {
  const p = getProperty(propertyId);
  if (!p) return null;
  const dp = clampDown(downPct);
  const down = Math.round((p.price * dp) / 100);
  const closing = Math.round((p.price * CLOSING_PCT) / 100);
  const cashNeeded = down + closing;
  const loan = p.price - down;
  const debt = Math.round(loan * MONTHLY_DEBT_RATE);
  const expenses = Math.round(p.rent * EXPENSE_RATE);
  const cashFlow = p.rent - debt - expenses;
  return { property: p, downPct: dp, down, closing, cashNeeded, loan, debt, expenses, cashFlow };
}

function clampDown(pct) {
  const n = Number.isFinite(pct) ? Math.round(pct) : MIN_DOWN_PCT;
  return Math.min(MAX_DOWN_PCT, Math.max(MIN_DOWN_PCT, n));
}

// The rolled-up picture the UI and the grader read.
export function summary(state) {
  const holdings = (state.holdings || []).map((h) => ({ ...h, ...analyze(h.propertyId, h.downPct) }));
  const invested = holdings.reduce((t, h) => t + (h.cashNeeded || 0), 0);
  const cashLeft = START_CASH - invested;
  const monthlyIncome = holdings.reduce((t, h) => t + (h.cashFlow || 0), 0);
  const doors = holdings.reduce((t, h) => t + (h.property?.id === 'duplex' ? 2 : h.property?.id === 'fourplex' ? 4 : 1), 0);
  return {
    holdings,
    owned: holdings.length,
    doors,
    invested,
    cashLeft,
    reserve: cashLeft,
    reserveHealthy: cashLeft >= CONTINGENCY_TARGET,
    monthlyIncome,
    annualIncome: monthlyIncome * 12,
    positiveCashFlow: monthlyIncome > 0,
  };
}

// Can this property be bought right now at this down payment? (Not already owned,
// and the cash it needs is still on hand.)
export function canBuy(state, propertyId, downPct) {
  if ((state.holdings || []).some((h) => h.propertyId === propertyId)) return false;
  const a = analyze(propertyId, downPct);
  if (!a) return false;
  return a.cashNeeded <= summary(state).cashLeft;
}

// Buy a property (no-op if unowned/unaffordable/duplicate) — pure.
export function buy(state, propertyId, downPct) {
  if (!canBuy(state, propertyId, downPct)) return state;
  return { ...state, holdings: [...state.holdings, { propertyId, downPct: clampDown(downPct) }] };
}

// Sell it back (release the cash) — pure.
export function sell(state, propertyId) {
  return { ...state, holdings: (state.holdings || []).filter((h) => h.propertyId !== propertyId) };
}

export function reset() {
  return createAllocation();
}

// The grade — measured the way Yahweh measures, not by raw dollars. Rewards
// putting the talent to work AND keeping a reserve; names over-leverage and a
// money-losing buy without scolding. Returns category effects for the board's
// axes plus a lens + a verified verse.
export function grade(state) {
  const s = summary(state);

  if (s.owned === 0) {
    return {
      tier: 'It Stayed in the Mattress',
      headline: 'You kept every dollar safe — and idle. Nothing was lost, but nothing was put to work either; the talent stayed buried.',
      lens: 'The wise put what they are given to work; kept in a drawer, even a good sum only sleeps. There is no reserve to keep when there is nothing built to protect.',
      verse: { ref: 'Luke 16:10' },
      effects: { peace: 1 },
      ...s,
    };
  }

  if (!s.reserveHealthy) {
    return {
      tier: 'Stretched Thin',
      headline: `You built ${s.owned} ${s.owned === 1 ? 'holding' : 'holdings'} and $${s.monthlyIncome}/mo — but you spent the reserve down to $${s.reserve}. One broken furnace and the whole thing wobbles.`,
      lens: 'The borrower is servant to the lender; leverage without a reserve is a loan against your own peace. Keep the contingency — it is the margin that lets you obey when trouble comes.',
      verse: { ref: 'Proverbs 22:7' },
      effects: { provision: 1, wisdom: 1, peace: -1 },
      ...s,
    };
  }

  if (!s.positiveCashFlow) {
    return {
      tier: 'House-Poor',
      headline: `You own ${s.owned}, and you kept a reserve — but they drain $${Math.abs(s.monthlyIncome)}/mo instead of paying you. An asset that costs you every month is a weight, not a wing.`,
      lens: 'Count the cost before you build; a holding that does not cash-flow is a trap dressed as a trophy. Steward what produces, not what merely impresses.',
      verse: { ref: 'Proverbs 21:20' },
      effects: { wisdom: 1, provision: -1 },
      ...s,
    };
  }

  // Wise: bought, diversified, cash-flowing, reserve intact.
  const diversified = s.owned >= 2;
  return {
    tier: diversified ? 'A Wise Steward' : 'A Faithful Start',
    headline: `${s.owned} ${s.owned === 1 ? 'holding' : 'holdings'} (${s.doors} doors), $${s.monthlyIncome}/mo in your pocket, and $${s.reserve} still in reserve. You put the talent to work AND kept your margin — this is how a house is built.`,
    lens: 'The wise store treasure and oil in their dwelling — they put the little to work, spread it wisely, and keep a reserve. Faithful in this, you are trusted with more, and it becomes provision for your children’s children.',
    verse: { ref: 'Proverbs 21:20' },
    effects: diversified
      ? { wisdom: 2, provision: 2, peace: 1, family: 1 }
      : { wisdom: 1, provision: 1, peace: 1 },
    ...s,
  };
}
