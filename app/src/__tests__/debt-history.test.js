// @vitest-environment node
// =============================================================================
// The statements' own record: paid, on time, late, left, and what extra buys
// =============================================================================
// Darrell 2026-08-11, from Books > Debts: "how many paid on time and late and
// what is left and what should be added for payoff faster... Debts shows
// snowball not all payments and paid and left to pay based on the uploaded
// statements from credit card companies."
//
// The load-bearing test in this file is the one that REFUSES to answer. No due
// date is stored anywhere in the debt libs or the debts table (measured), so
// lateness cannot be computed from data we hold — and a fabricated "0 late" on
// somebody's credit history is worse than a blank. Absent must read as absent.
import { describe, it, expect } from 'vitest';
import {
  dueDateFor, paymentHistory, amountLeft, payoffWith, accelerationOptions,
  parseStatementSummary, bestPlays,
} from '../lib/debt-history.js';

const pay = (date, amount, accountId = 'card1') => ({ accountId, date, amount });

describe('on time vs late — and the refusal when it cannot be known', () => {
  it('THE REFUSAL: with no due day, totals are real but on-time/late are NULL, never 0', () => {
    const h = paymentHistory([pay('2026-03-10', 200), pay('2026-04-10', 200)], 'card1');
    expect(h.known).toBe(false);
    expect(h.count).toBe(2);
    expect(h.totalPaid).toBe(400);       // still measured
    expect(h.onTime).toBeNull();          // never a fabricated zero
    expect(h.late).toBeNull();
  });

  it('counts on time and late against the due day', () => {
    const h = paymentHistory([
      pay('2026-03-10', 200),  // due the 15th -> on time
      pay('2026-04-18', 200),  // due the 15th -> 3 days late
      pay('2026-05-15', 200),  // exactly on the due day -> on time
    ], 'card1', { dueDay: 15 });
    expect(h.known).toBe(true);
    expect(h.onTime).toBe(2);
    expect(h.late).toBe(1);
    expect(h.payments.find((p) => p.daysLate > 0).daysLate).toBe(3);
  });

  it('a grace window counts a just-late payment as on time, deliberately', () => {
    const rows = [pay('2026-04-18', 200)];
    expect(paymentHistory(rows, 'card1', { dueDay: 15 }).late).toBe(1);
    expect(paymentHistory(rows, 'card1', { dueDay: 15, graceDays: 5 }).onTime).toBe(1);
  });

  it('a due day past the end of a short month clamps, as issuers do', () => {
    // The 31st in February is the 28th in 2026 (not a leap year).
    const due = dueDateFor(Date.parse('2026-02-20'), 31);
    expect(new Date(due).getDate()).toBe(28);
    expect(dueDateFor(Date.parse('2026-02-20'), 99)).toBeNull();
  });

  it('charges are not payments — only money going TO the card counts', () => {
    const h = paymentHistory([
      pay('2026-03-10', 200),
      pay('2026-03-12', -75),   // a purchase
    ], 'card1', { dueDay: 15 });
    expect(h.count).toBe(1);
    expect(h.totalPaid).toBe(200);
  });

  it('another card’s rows never leak into this card’s history', () => {
    const h = paymentHistory([pay('2026-03-10', 200, 'card1'), pay('2026-03-11', 999, 'card2')], 'card1', { dueDay: 15 });
    expect(h.count).toBe(1);
    expect(h.totalPaid).toBe(200);
  });
});

describe('what is left — the issuer is the authority', () => {
  it('a statement balance WINS over our arithmetic, and the drift is reported', () => {
    const r = amountLeft({ balance: 1000, statementBalance: 1120 });
    expect(r.left).toBe(1120);
    expect(r.source).toBe('statement');
    expect(r.drift).toBe(120);   // usually a missing import — worth seeing
  });

  it('falls back to our own balance when no statement is loaded', () => {
    expect(amountLeft({ balance: 1000 })).toMatchObject({ left: 1000, source: 'balance' });
  });

  it('knows nothing rather than printing zero when neither exists', () => {
    const r = amountLeft({});
    expect(r.known).toBe(false);
    expect(r.left).toBeNull();
  });
});

describe('payoff, amortised at the card’s real rate', () => {
  it('clears a balance and reports the interest actually paid', () => {
    const r = payoffWith(1000, 100, 24);
    expect(r.clears).toBe(true);
    expect(r.months).toBeGreaterThan(10);      // interest makes it longer than 10
    expect(r.totalInterest).toBeGreaterThan(0);
  });

  it('THE LIE THIS PREVENTS: a payment below the monthly interest never clears', () => {
    // $1,000 at 24% accrues $20/mo. A $15 payment grows the balance forever —
    // reporting a payoff date here would be the worst claim on this surface.
    const r = payoffWith(1000, 15, 24);
    expect(r.clears).toBe(false);
    expect(r.months).toBeNull();
    expect(r.reason).toBe('below-interest');
  });

  it('zero interest is just division', () => {
    expect(payoffWith(1000, 100, 0)).toMatchObject({ clears: true, months: 10 });
  });

  it('an already-cleared debt is clear, and a zero payment is honest about it', () => {
    expect(payoffWith(0, 100, 24).clears).toBe(true);
    expect(payoffWith(1000, 0, 24)).toMatchObject({ clears: false, reason: 'no-payment' });
  });
});

describe('what should I add — the delta, in months and dollars', () => {
  it('reports months and interest saved for each extra', () => {
    const r = accelerationOptions(5000, 150, 22, [50, 100]);
    expect(r.known).toBe(true);
    const fifty = r.options.find((o) => o.extra === 50);
    expect(fifty.monthsSaved).toBeGreaterThan(0);
    expect(fifty.interestSaved).toBeGreaterThan(0);
    // More money must never buy less: the ordering is a real invariant.
    const hundred = r.options.find((o) => o.extra === 100);
    expect(hundred.monthsSaved).toBeGreaterThanOrEqual(fifty.monthsSaved);
    expect(hundred.interestSaved).toBeGreaterThanOrEqual(fifty.interestSaved);
  });

  it('says it cannot advise when the CURRENT payment never clears', () => {
    const r = accelerationOptions(1000, 15, 24, [50]);
    expect(r.known).toBe(false);
    expect(r.reason).toBe('below-interest');
  });
});

describe('the parser reads the statement’s own header facts', () => {
  const STATEMENT = `
    ACCOUNT SUMMARY
    Previous Balance            $1,204.55
    Payments and Credits        $   300.00
    New Balance Total           $1,012.33
    Minimum Payment Due         $    35.00
    Payment Due Date            09/15/2026
    Statement Closing Date      08/20/2026
    Annual Percentage Rate      24.99%
  `;

  it('reads balance, minimum, both dates and the APR', () => {
    const s = parseStatementSummary(STATEMENT);
    expect(s.statementBalance).toBe(1012.33);
    expect(s.minimumPayment).toBe(35);
    expect(s.previousBalance).toBe(1204.55);
    expect(s.apr).toBe(24.99);
    expect(new Date(s.dueDate).getMonth()).toBe(8);   // September
    expect(s.dueDay).toBe(15);                        // unlocks on-time/late
  });

  it('THE POINT: the due day it reads is what makes lateness computable at all', () => {
    const { dueDay } = parseStatementSummary(STATEMENT);
    const h = paymentHistory([pay('2026-09-20', 100)], 'card1', { dueDay });
    expect(h.known).toBe(true);
    expect(h.late).toBe(1);
  });

  it('a statement it cannot read yields nulls and an empty `found`, never guesses', () => {
    const s = parseStatementSummary('a receipt for coffee');
    expect(s.statementBalance).toBeNull();
    expect(s.dueDate).toBeNull();
    expect(s.dueDay).toBeNull();
    expect(s.found).toEqual([]);
  });

  it('a PARTIAL parse is visibly partial — found lists only what was read', () => {
    const s = parseStatementSummary('New Balance Total $500.00');
    expect(s.statementBalance).toBe(500);
    expect(s.dueDate).toBeNull();
    expect(s.found).toContain('statementBalance');
    expect(s.found).not.toContain('dueDate');
  });
});

describe('the plays are derived, ranked, and never padded', () => {
  const card = (o) => ({ id: o.id, name: o.name, balance: o.balance, rate: o.rate, minPayment: o.min, extraPayment: 0, ...o });

  it('a payment below the interest OUTRANKS the avalanche — it is the alarm', () => {
    const plays = bestPlays({
      debts: [
        card({ id: 'a', name: 'Visa', balance: 1000, rate: 24, min: 15 }),   // underwater
        card({ id: 'b', name: 'Store', balance: 500, rate: 29, min: 100 }),
      ],
    });
    expect(plays[0].kind).toBe('underwater');
    expect(plays[0].headline).toMatch(/going BACKWARD/);
    expect(plays.some((p) => p.kind === 'avalanche')).toBe(true);
  });

  it('a promo rate ending soon is surfaced with the dated cliff', () => {
    const asOf = Date.parse('2026-08-11');
    const plays = bestPlays({
      asOf,
      debts: [card({ id: 'c', name: 'Chase 0%', balance: 4000, rate: 0, min: 200, promoZeroAprUntil: '2026-10-01' })],
    });
    const cliff = plays.find((p) => p.kind === 'promo-cliff');
    expect(cliff).toBeTruthy();
    expect(cliff.value).toBe(4000);
  });

  it('lateness is only ever played back when it was MEASURED', () => {
    const debts = [card({ id: 'a', name: 'Visa', balance: 1000, rate: 20, min: 100 })];
    const unknown = bestPlays({ debts, history: { a: { known: false, late: null, count: 3 } } });
    expect(unknown.some((p) => p.kind === 'late-pattern')).toBe(false);
    const known = bestPlays({ debts, history: { a: { known: true, late: 2, count: 6 } } });
    expect(known.find((p) => p.kind === 'late-pattern').value).toBe(2);
  });

  it('no debts, no advice — it never pads the list to look busy', () => {
    expect(bestPlays({ debts: [] })).toEqual([]);
    expect(bestPlays({ debts: [card({ id: 'z', name: 'Paid', balance: 0, rate: 20, min: 50 })] })).toEqual([]);
  });

  it('a surplus play is offered only when a surplus actually exists', () => {
    const debts = [card({ id: 'a', name: 'Visa', balance: 5000, rate: 22, min: 150 })];
    expect(bestPlays({ debts }).some((p) => p.kind === 'surplus')).toBe(false);
    const withCash = bestPlays({ debts, minSurplus: 200 });
    expect(withCash.find((p) => p.kind === 'surplus').unit).toBe('interest saved');
  });
});
