// =============================================================================
// Real Estate wears the door all the way, and its fields fit together (DR-1178)
// =============================================================================
// Darrell, 2026-10-21, with two screenshots of the live Real Estate tab:
//   "This isn't like the other tab enough... it only changed or added things to
//    the top... why... we need the look of the Properties tab all the way and
//    the colors can change with the color choices like the other tab."
//   "Real estate should be flowing end to end data flows and fields should be
//    concise ... made to work together."
//   "And Properties tab... and Real-estate should work already if not fix it!!!!!"
//   "Real Estate is more accurate than the other."
//   "However that's just data... we need them to fit together."
//   "Each should or may have data that should be combined and we will upload
//    all data after the system is actually tight."
import { describe, it, expect } from 'vitest';
import {
  monthlyPIFrom, piFor, rentFact, derivePortfolio, ASSUMED_TERM_YEARS, mortgageFacts, solveRate,
} from '../lib/rental-portfolio.js';
import { doorState } from '../lib/real-estate-door.js';
import { WELCOME_CSS } from '../components/PoePropertiesWelcome.jsx';

const ENTITIES = [{ id: 'e-poe', name: 'Poe Properties LLC' }];
// His own portfolio's shape, from the screenshots: rent on nearly every door,
// one note entered, no balances at all.
const HIS = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i}`, entityId: 'e-poe', units: 1, status: 'paying',
  rent: i === 11 ? 0 : 1000,
  mortgage: { balance: 0, rate: 6.5, monthlyPI: i === 0 ? 950 : 0, escrow: 0 },
}));

describe('a balance and a rate derive the payment', () => {
  it('computes the standard amortized payment, checked against a known figure', () => {
    // $200,000 at 6.5% over 30 years is $1,264.14 to the cent by the standard
    // formula. Pinned to a figure a lender would quote, not to our own output.
    expect(monthlyPIFrom({ balance: 200000, rate: 6.5, years: 30 })).toBeCloseTo(1264.14, 1);
    expect(monthlyPIFrom({ balance: 100000, rate: 0, years: 25 })).toBeCloseTo(100000 / 300, 6);
  });

  it('returns null rather than a zero when there is nothing to compute from', () => {
    expect(monthlyPIFrom({ balance: 0, rate: 6.5 })).toBe(null);
    expect(monthlyPIFrom({ balance: 200000, rate: 6.5, years: 0 })).toBe(null);
    expect(monthlyPIFrom({})).toBe(null);
  });

  it('an ENTERED payment always wins over a derivation', () => {
    const p = piFor({ mortgage: { balance: 200000, rate: 6.5, monthlyPI: 1100 } });
    expect(p).toMatchObject({ value: 1100, source: 'entered' });
  });

  it('derives from the balance and rate, and SAYS the term it assumed', () => {
    const p = piFor({ mortgage: { balance: 200000, rate: 6.5, monthlyPI: 0 } });
    expect(p.source).toBe('derived');
    expect(p.assumedYears).toBe(ASSUMED_TERM_YEARS);
    expect(p.value).toBeCloseTo(1264.14, 1);
  });

  it('does not claim an assumption when the row carries its own term', () => {
    const p = piFor({ mortgage: { balance: 200000, rate: 6.5, monthlyPI: 0, termYears: 15 } });
    expect(p.source).toBe('derived');
    expect(p.assumedYears).toBe(null);
    expect(p.value).toBeGreaterThan(1264.14);
  });

  it('names what would complete a partial record instead of a bare dash', () => {
    // Mortgage: —  Rate: 6.5%  P&I: —  on every one of his cards.
    expect(piFor({ mortgage: { balance: 200000, rate: 0, monthlyPI: 0 } }).why).toMatch(/Add the rate or the monthly payment/);
  });
});

// Darrell, 2026-10-21, correcting an earlier draft of this: "Blank rates should
// reflect the rate.... 0% interest... 0 means no mortgage or we dont know it we
// have our payments and other information and we should be able to deduce from
// there or need to say its based on this or that... make sense?"
describe('a zero is not one thing, and what we have deduces the rest', () => {
  it('NO BALANCE AND NO PAYMENT IS FREE AND CLEAR — a fact, not three dashes', () => {
    const f = mortgageFacts({ mortgage: { balance: 0, rate: 0, monthlyPI: 0 } });
    expect(f.state).toBe('none');
    expect(f.words).toMatch(/No mortgage on record/);
    expect(f.words).toMatch(/nothing owed/);
  });

  it('DEDUCES THE RATE from the balance and the payment we already have', () => {
    // $200,000 paying $1,264.14 a month over 30 years is 6.5% — the forward
    // figure, solved backwards. Pinned to the lender's number, not to ours.
    const f = mortgageFacts({ mortgage: { balance: 200000, rate: 0, monthlyPI: 1264.14 } });
    expect(f.state).toBe('deduced');
    expect(f.basis).toBe('rate');
    expect(f.rate).toBeCloseTo(6.5, 2);
    expect(f.words).toMatch(/deduced from the balance and the payment/);
  });

  it('says 0% INTEREST when the payment really does carry no interest', () => {
    // $120,000 at $333.33/mo over 30 years is exactly straight-line.
    const f = mortgageFacts({ mortgage: { balance: 120000, rate: 0, monthlyPI: 120000 / 360 } });
    expect(f.rate).toBe(0);
    expect(f.words).toMatch(/0% interest/);
  });

  it('solves the rate round-trip at several real rates, not just one', () => {
    for (const rate of [3.25, 4.75, 6.5, 7.875]) {
      const pay = monthlyPIFrom({ balance: 250000, rate, years: 30 });
      expect(solveRate({ balance: 250000, payment: pay, years: 30 })).toBeCloseTo(rate, 2);
    }
  });

  it('refuses rather than inventing a rate a payment cannot support', () => {
    // A payment at or below straight-line services no interest; above the
    // balance itself is nonsense. Null, never a number.
    expect(solveRate({ balance: 200000, payment: 200000 / 360, years: 30 })).toBe(null);
    expect(solveRate({ balance: 0, payment: 900 })).toBe(null);
    expect(solveRate({ balance: 200000, payment: 0 })).toBe(null);
  });

  it('ALWAYS says what a figure is based on — never a naked deduction', () => {
    const deduced = mortgageFacts({ mortgage: { balance: 200000, rate: 6.5, monthlyPI: 0 } });
    expect(deduced.basis).toBe('payment');
    expect(deduced.words).toMatch(/deduced from the balance and rate/);
    expect(deduced.words).toMatch(/assumed 30-yr/);
    // A row carrying its own term does not claim an assumption.
    expect(mortgageFacts({ mortgage: { balance: 200000, rate: 6.5, monthlyPI: 0, termYears: 15 } }).words).toMatch(/15-yr/);
  });

  it('a payment with no balance says the balance is what is wanted', () => {
    const f = mortgageFacts({ mortgage: { balance: 0, rate: 0, monthlyPI: 900 } });
    expect(f.state).toBe('partial');
    expect(f.words).toMatch(/Add the balance/);
  });
});

describe('a label is not a measurement, and the gap is the LEDGER’S', () => {
  it('an unbacked status is the property record’s word, and says the LEDGER has no lease', () => {
    const f = rentFact({ status: 'paying' }, null);
    expect(f.backed).toBe(false);
    expect(f.words).toMatch(/from the property record/);
    expect(f.words).toMatch(/rent ledger has no lease/);
  });

  it('NEVER casts doubt on the row — "Real Estate is more accurate than the other"', () => {
    // The direction matters: getting it backwards would have the app
    // second-guessing its own best data.
    const f = rentFact({ status: 'paying' }, null);
    expect(f.words).not.toMatch(/nothing confirms|unconfirmed|may not be|unreliable/i);
  });

  it('speaks with the ledger once a lease is synced', () => {
    expect(rentFact({ status: 'paying' }, { expected: 1000, received: 1000 })).toMatchObject({ backed: true });
    expect(rentFact({ status: 'paying' }, { expected: 1000, received: 1000 }).words).toMatch(/received in full/);
    expect(rentFact({ status: 'paying' }, { expected: 1000, received: 400 }).words).toMatch(/part of this month/);
    expect(rentFact({ status: 'late' }, { expected: 1000, received: 0 }).words).toMatch(/nothing received/);
  });
});

describe('the door stops reporting a partial sum as a whole one', () => {
  it('counts the NOTE column the way it already counted rent and debt', () => {
    const p = derivePortfolio(HIS, ENTITIES);
    // One payment entered in twelve — the shape his screenshot showed.
    expect(p.missingPI).toBe(11);
    const st = doorState({ rentals: HIS, entities: ENTITIES, paidRollup: null, incidents: [] });
    const pi = st.holds.find((h) => h.key === 'pi');
    expect(pi.sub).toBe('1 of 12 entered');
  });

  it('the DERIVED cell inherits the weaker of the two columns it subtracts', () => {
    // "Left after the note $10,750" carried no sub-line at all while being
    // rent-minus-one-note. A difference is only as complete as its least
    // complete side.
    const st = doorState({ rentals: HIS, entities: ENTITIES, paidRollup: null, incidents: [] });
    const net = st.holds.find((h) => h.key === 'net');
    expect(net.sub).toMatch(/not all entered/);
    expect(net.sub).toMatch(/1 of 12 carry both/);
  });

  it('says nothing extra when every column is complete — no noise on a full record', () => {
    const whole = HIS.map((r) => ({ ...r, rent: 1000, mortgage: { ...r.mortgage, balance: 100000, monthlyPI: 700 } }));
    const st = doorState({ rentals: whole, entities: ENTITIES, paidRollup: null, incidents: [] });
    expect(st.holds.find((h) => h.key === 'pi').sub).toBe(null);
    expect(st.holds.find((h) => h.key === 'net').sub).toBe(null);
    expect(st.holds.find((h) => h.key === 'rent').sub).toBe(null);
  });
});

describe('the look reaches the whole list, in tokens that follow the theme', () => {
  const need = ['.pp-list-head', '.pp-list-title', '.pp-pill', '.pp-row-card', '.pp-row-head', '.pp-row-title', '.pp-act'];
  it('defines every class the list needs, inside the door’s own stylesheet', () => {
    for (const c of need) expect(WELCOME_CSS).toContain(`${c}{`);
  });

  it('uses NO literal color in them, so each one remaps with the theme', () => {
    // His words: "the colors can change with the color choices like the other
    // tab". A literal hex cannot be remapped and goes dark-on-dark on midnight,
    // which is the defect DR-1156 and DR-0744 both recorded.
    const block = WELCOME_CSS.slice(WELCOME_CSS.indexOf('.pp-list-head{'));
    const literals = block.match(/#[0-9A-Fa-f]{6}\b/g) || [];
    // #FFFFFF on the red pill is the one allowed literal: it is the text ON the
    // brand red, which is itself a token, and white on --pp-red measures 9.72:1.
    expect(literals.filter((h) => h.toUpperCase() !== '#FFFFFF')).toEqual([]);
  });

  it('the panel shape matches the front door’s own panel, not a lookalike', () => {
    expect(WELCOME_CSS).toMatch(/\.pp-row-card\{[^}]*var\(--pp-card\)/);
    expect(WELCOME_CSS).toMatch(/\.pp-row-card\{[^}]*var\(--pp-shadow\)/);
    expect(WELCOME_CSS).toMatch(/\.pp-row-title\{[^}]*var\(--pp-serif\)/);
  });
});
