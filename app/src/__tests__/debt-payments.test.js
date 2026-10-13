// @vitest-environment node
//
// debt-payments — payoff dated off REAL payments + APR read from the account's own
// interest charges (Darrell 2026-07-20). Pins: the payment pace, the truthful
// reach-zero date (net of new charges, never a rosy fiction), the data-derived APR
// (authoritative over a manual entry), and the name classifier that surfaces a
// mis-typed imported card.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  debtPaymentStats, estimatePayoff, deriveApr, debtPayoffInsight,
  isInterestCharge, looksLikeDebtAccount, cardPaymentSuggestions, debtNameFromPayee,
  linkedDebtPaymentStats,
} from '../lib/debt-payments.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const asOf = new Date('2026-07-15T00:00:00');
// Six monthly $500 payments to card account 'cc', plus a couple of charges.
const CC = 'cc';
const txns = [
  { id: 'p1', accountId: CC, date: '2026-02-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'p2', accountId: CC, date: '2026-03-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'p3', accountId: CC, date: '2026-04-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'p4', accountId: CC, date: '2026-05-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'p5', accountId: CC, date: '2026-06-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'p6', accountId: CC, date: '2026-07-01', amount: 500, description: 'PAYMENT THANK YOU' },
  { id: 'c1', accountId: CC, date: '2026-06-10', amount: -100, description: 'AMAZON' },
  { id: 'i1', accountId: CC, date: '2026-06-15', amount: -60, description: 'INTEREST CHARGE ON PURCHASES' },
  { id: 'x1', accountId: 'other', date: '2026-06-01', amount: 500, description: 'not this account' },
];

describe('debtPaymentStats', () => {
  it('averages the real payments and new charges per month over the row span', () => {
    const s = debtPaymentStats(txns, CC, asOf, 6);
    expect(s.paymentCount).toBe(6);
    // 6 payments across a ~5-month span; pace is a positive monthly figure.
    expect(s.grossPaymentPerMonth).toBeGreaterThan(0);
    // new charges (100 + 60 interest) pull the net paydown below the gross pace.
    expect(s.netPaydownPerMonth).toBeLessThan(s.grossPaymentPerMonth);
  });
  it('ignores other accounts', () => {
    expect(debtPaymentStats(txns, CC, asOf, 6).paymentCount).toBe(6); // x1 excluded
  });
});

describe('estimatePayoff', () => {
  it('dates the payoff off the net paydown', () => {
    const r = estimatePayoff(1000, 500, asOf);
    expect(r.onTrack).toBe(true);
    expect(r.months).toBe(2);
    expect(r.date).toBeInstanceOf(Date);
  });
  it('is honest when the balance is not going down (net <= 0)', () => {
    const r = estimatePayoff(1000, 0, asOf);
    expect(r.onTrack).toBe(false);
    expect(r.date).toBeNull();
  });
  it('reports already-clear for a non-positive owed', () => {
    expect(estimatePayoff(0, 500, asOf).clear).toBe(true);
  });
});

describe('deriveApr — the rate read from the data, authoritative', () => {
  it('reads the APR from the statement interest charge', () => {
    // $60 interest/mo on ~$3,000 owed ≈ 2%/mo ≈ 24% APR.
    const r = deriveApr(txns, CC, 3000, asOf, 6);
    expect(r.source).toBe('derived');
    expect(r.apr).toBeGreaterThan(15);
    expect(r.apr).toBeLessThan(35);
  });
  it('returns null (fall back to manual) when there is no interest line', () => {
    const noInterest = txns.filter((t) => !isInterestCharge(t));
    expect(deriveApr(noInterest, CC, 3000, asOf, 6).apr).toBeNull();
  });
  it('rejects a nonsense rate from a tiny balance (falls back to manual)', () => {
    expect(deriveApr(txns, CC, 5, asOf, 6).apr).toBeNull();
  });
});

describe('debtPayoffInsight', () => {
  it('combines pace + payoff and flags a growing balance', () => {
    const growing = [
      { id: 'p1', accountId: CC, date: '2026-05-01', amount: 200, description: 'PAYMENT' },
      { id: 'p2', accountId: CC, date: '2026-06-01', amount: 200, description: 'PAYMENT' },
      { id: 'p3', accountId: CC, date: '2026-07-01', amount: 200, description: 'PAYMENT' },
      { id: 'c1', accountId: CC, date: '2026-06-15', amount: -900, description: 'BIG CHARGE' },
    ];
    const g = debtPayoffInsight(growing, CC, 1000, asOf);
    expect(g.hasPayments).toBe(true);
    expect(g.growing).toBe(true);       // charges outpaced payments
    expect(g.onTrack).toBe(false);
  });
});

describe('looksLikeDebtAccount', () => {
  it('matches real debt names', () => {
    for (const name of ['Chase Credit Card', 'Chase Line of Credit 1818', 'Discover it', 'Home Equity LOC', 'Auto Loan']) {
      expect(looksLikeDebtAccount({ name })).toBe(true);
    }
  });
  it('does NOT match a checking account that merely contains "card"-ish text', () => {
    expect(looksLikeDebtAccount({ name: 'Cardinal Checking' })).toBe(false);
    expect(looksLikeDebtAccount({ name: 'Chase Personal Checking' })).toBe(false);
  });
});

describe('cardPaymentSuggestions — "you pay these; add them as debts"', () => {
  const nowMs = Date.parse('2026-07-20T00:00:00');
  const txns = [
    // a monthly credit-card autopay (categorizer -> debt-payment) x4
    { id: 'a1', date: '2026-04-05', amount: -300, description: 'CHASE CREDIT CRD AUTOPAY 0511' },
    { id: 'a2', date: '2026-05-05', amount: -300, description: 'CHASE CREDIT CRD AUTOPAY 0511' },
    { id: 'a3', date: '2026-06-05', amount: -300, description: 'CHASE CREDIT CRD AUTOPAY 0511' },
    { id: 'a4', date: '2026-07-05', amount: -300, description: 'CHASE CREDIT CRD AUTOPAY 0511' },
    // a monthly subscription (NOT a debt) x4
    { id: 'n1', date: '2026-04-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n2', date: '2026-05-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n3', date: '2026-06-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n4', date: '2026-07-05', amount: -15.49, description: 'NETFLIX.COM' },
  ];

  it('suggests a recurring card/loan payment as an addable debt, with the monthly amount', () => {
    const s = cardPaymentSuggestions(txns, [], { nowMs });
    expect(s).toHaveLength(1);
    expect(/CHASE CREDIT/i.test(s[0].label)).toBe(true);
    expect(s[0].monthlyPayment).toBeCloseTo(300, 2);
    expect(s[0].cadence).toBe('monthly');
  });
  it('does NOT suggest a recurring non-debt (subscription)', () => {
    expect(cardPaymentSuggestions(txns, [], { nowMs }).some((x) => /NETFLIX/i.test(x.label))).toBe(false);
  });
  it('skips a payee already covered by an existing debt account', () => {
    const accounts = [{ name: 'Chase Credit Crd', type: 'credit' }];
    expect(cardPaymentSuggestions(txns, accounts, { nowMs })).toHaveLength(0);
  });
});

describe('cardPaymentSuggestions — an ADDED card stays added (2026-08-04 regression)', () => {
  // The real bank strings from the live ledger. The raw label keeps PMT/WEB
  // noise the stored account NAME had stripped ("american express ach pmt a tel
  // id" vs "american express ach a"), so the raw-key containment check alone
  // never matched — the suggestion survived every add, and each re-tap piled on
  // another duplicate $0 account (24 stray rows in the live table).
  const nowMs = Date.parse('2026-08-04T00:00:00');
  const amex = (id, date) => ({ id, date, accountId: 'a-chk', amount: -53, description: 'AMERICAN EXPRESS ACH PMT    A1440           TEL ID: 9493560001' });
  const card = (id, date) => ({ id, date, accountId: 'a-chk', amount: -110, description: 'CARDMEMBER SERV  WEB PYMT   ***********2001 WEB ID: 5911111111' });
  const txns = [
    amex('x1', '2026-05-04'), amex('x2', '2026-06-04'), amex('x3', '2026-07-04'),
    card('c1', '2026-05-10'), card('c2', '2026-06-10'), card('c3', '2026-07-10'),
  ];
  it('suggests both card autopays when nothing tracks them yet', () => {
    expect(cardPaymentSuggestions(txns, [], { nowMs })).toHaveLength(2);
  });
  it('the add flow itself produces the covering names (debtNameFromPayee)', () => {
    expect(debtNameFromPayee('AMERICAN EXPRESS ACH PMT    A1440           TEL ID: 9493560001')).toBe('American Express Ach A');
    expect(debtNameFromPayee('CARDMEMBER SERV  WEB PYMT   ***********2001 WEB ID: 5911111111')).toBe('Cardmember Serv Pymt');
  });
  it('does NOT re-suggest a card already added under its cleaned name', () => {
    const accounts = [
      { id: 'a-1', name: 'American Express Ach A', type: 'credit', treatAsDebt: true },
      { id: 'a-2', name: 'Cardmember Serv Pymt', type: 'credit', treatAsDebt: true },
    ];
    expect(cardPaymentSuggestions(txns, accounts, { nowMs })).toHaveLength(0);
  });
  it('an unrelated tracked card does not hide these suggestions (no over-blocking)', () => {
    const accounts = [{ id: 'a-3', name: 'Chase Credit Crd', type: 'credit' }];
    expect(cardPaymentSuggestions(txns, accounts, { nowMs })).toHaveLength(2);
  });
});

describe('linkedDebtPaymentStats — payments recovered by cleaned payee name', () => {
  // A debt added from a suggestion has NO ledger rows of its own; its payments
  // live in checking. Matching by the same cleaned name the add flow used
  // recovers the pace — the row shows "$53/mo" instead of "no payments seen".
  const asOf = new Date('2026-08-04T00:00:00');
  const txns = [
    { id: 'x1', date: '2026-05-04', accountId: 'a-chk', amount: -53, description: 'AMERICAN EXPRESS ACH PMT    A009' },
    { id: 'x2', date: '2026-06-04', accountId: 'a-chk', amount: -53, description: 'AMERICAN EXPRESS ACH PMT    A1440           TEL ID: 9493560001' },
    { id: 'x3', date: '2026-07-04', accountId: 'a-chk', amount: -53, description: 'AMERICAN EXPRESS ACH PMT    A234' },
    { id: 'g1', date: '2026-06-15', accountId: 'a-chk', amount: -180.5, description: 'KROGER 0451' },
    // the debt account's OWN rows are excluded (they are the normal path)
    { id: 'own', date: '2026-06-20', accountId: 'a-amex', amount: -53, description: 'AMERICAN EXPRESS ACH PMT A009' },
    // a deposit never counts as a payment
    { id: 'dep', date: '2026-06-21', accountId: 'a-chk', amount: 53, description: 'AMERICAN EXPRESS ACH PMT REFUND' },
  ];
  it('finds the checking-side payments and computes the monthly pace', () => {
    const s = linkedDebtPaymentStats(txns, 'American Express Ach A', 'a-amex', asOf);
    expect(s.paymentCount).toBe(3);
    expect(s.grossPaymentPerMonth).toBeCloseTo(53, 2);
  });
  it('matches nothing for an unrelated account name', () => {
    expect(linkedDebtPaymentStats(txns, 'Synchrony Bank', 'a-syn', asOf).paymentCount).toBe(0);
  });
  it('is honest on a blank name', () => {
    expect(linkedDebtPaymentStats(txns, '', 'a-x', asOf).paymentCount).toBe(0);
  });
});

describe('name matching widened — 29 "not observed" while the family paid monthly (Darrell 2026-08-24)', () => {
  // Descriptions below are the REAL shapes from the imported ledger. Matching is
  // by NAME, never by amount; these pin the three widenings that link the
  // family's own compact naming to the bank's spaced naming.
  const asOf = new Date('2026-08-15T00:00:00');
  const txns = [
    { id: 'c1', date: '2026-07-02', accountId: 'a-chk', amount: -62, description: 'Credit One Bank  Payment    68135128        WEB ID: WEB000004' },
    { id: 'c2', date: '2026-08-02', accountId: 'a-chk', amount: -62, description: 'Credit One Bank  Payment    68199201        WEB ID: WEB000004' },
    { id: 'a1', date: '2026-07-03', accountId: 'a-chk', amount: -124, description: 'AMERICAN EXPRESS ACH PMT    A4306           TEL ID: 9493560001' },
    { id: 'a2', date: '2026-08-04', accountId: 'a-chk', amount: -124, description: 'AMERICAN EXPRESS ACH PMT    A5652           TEL ID: 9493560001' },
    { id: 'w1', date: '2026-07-16', accountId: 'a-chk', amount: -2622.83, description: 'WF HOME MTG      AUTO PAY   0511000606      WEB ID: 1562287461' },
    { id: 'g1', date: '2026-07-20', accountId: 'a-chk', amount: -84.12, description: 'WFM WHOLE FOODS CHAMPAIGN IL' },
    { id: 'k1', date: '2026-07-21', accountId: 'a-chk', amount: -148, description: 'DISCOVER E-PAYMENT 7244' },
  ];
  it('a compact family name matches the bank\'s spaced one: CreditOne ↔ Credit One Bank', () => {
    const s = linkedDebtPaymentStats(txns, 'CreditOne', 'a-c1', asOf);
    expect(s.paymentCount).toBe(2);
    expect(s.grossPaymentPerMonth).toBeCloseTo(62, 2);
  });
  it('an issuer alias links Amex ↔ AMERICAN EXPRESS', () => {
    const s = linkedDebtPaymentStats(txns, 'Amex 5652', 'a-am', asOf);
    expect(s.paymentCount).toBe(2);
  });
  it('the payeeAlias "payment name" is the universal cure — and groceries never leak in', () => {
    // "House Mortgage" matches nothing by name; the alias links the WF payment
    // — and ONLY it: WFM Whole Foods must not ride the short "wf" alias.
    const miss = linkedDebtPaymentStats(txns, 'House Mortgage', 'a-wf', asOf);
    expect(miss.paymentCount).toBe(0);
    const s = linkedDebtPaymentStats(txns, 'House Mortgage', 'a-wf', asOf, 6, 'WF HOME MTG AUTO PAY');
    expect(s.paymentCount).toBe(1);
    expect(s.grossPaymentPerMonth).toBeCloseTo(2622.83, 2);
    const wells = linkedDebtPaymentStats(txns, 'Wells Fargo Mortgage', 'a-wf', asOf);
    expect(wells.paymentCount).toBe(1); // the wf whole-word alias, not the grocer
  });
  it('Discover still matches as before (spaced containment, back-compat)', () => {
    expect(linkedDebtPaymentStats(txns, 'Discover', 'a-d', asOf).paymentCount).toBe(1);
  });
  it('deriveDebts runs linked recovery for TYPED credit accounts too, not only treat-as-debt', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'financial-engineering.js'), 'utf8');
    expect(src).toMatch(/if \(!insight\.hasPayments\) \{/);
    expect(src).toMatch(/linkedDebtPaymentStats\(txns, a\.name, a\.id, asOf, 6, a\.payeeAlias \|\| null\)/);
    expect(src).toMatch(/payeeAlias: a\.payeeAlias \|\| null/);
  });
});

describe('debtNameFromPayee', () => {
  it('tidies an autopay description into a card name', () => {
    expect(debtNameFromPayee('CHASE CREDIT CRD AUTOPAY 0511')).toBe('Chase Credit Crd');
  });
  it('strips ids/dates and payment noise', () => {
    expect(debtNameFromPayee('DISCOVER PAYMENT 1234567 WEB ID')).toBe('Discover');
  });
  it('never returns empty', () => {
    expect(debtNameFromPayee('')).toBe('Debt');
    expect(debtNameFromPayee('12345 0000')).toBe('Debt');
  });
});
