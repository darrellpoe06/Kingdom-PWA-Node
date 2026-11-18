// FOS Money Phase 2 (gap X1): a loan entered as a bill, carrying its remaining
// balance, is a debt. The six First State Bank loans were entered this way and
// never reached the Debts tab. One record per debt, never counted twice, and
// Safe-to-Spend is unchanged because the bill already reserves the payment.
import { describe, it, expect } from 'vitest';
import { deriveDebts } from '../lib/financial-engineering.js';
import { buildSafeToSpend } from '../lib/safe-to-spend.js';

const asOf = new Date(2026, 10, 18, 12);

function house({ bills = [], accounts = [], rentals = [] } = {}) {
  return {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
    ],
    accounts: [{ id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 2500 }, ...accounts],
    transactions: [],
    recurringObligations: bills,
    inflows: { salaries: [], rentals },
    moneyPlan: { settings: {} },
  };
}

const loan = (over = {}) => ({
  id: 'ob-5312',
  name: 'First State Bank loan 5312',
  group: 'rental',
  enabled: true,
  amount: 825.42,
  frequency: 'monthly',
  nextDue: '2026-11-25',
  accountId: 'a-3322',
  entityId: 'e-poeprops',
  balance: 48210.55,
  rate: 6.5,
  lender: 'First State Bank',
  accountLast4: '5312',
  ...over,
});

const billRows = (data) => deriveDebts(data, asOf).filter((d) => d.source === 'bill');

describe('a loan entered as a bill is on the Debts list', () => {
  it('a bill with a remaining balance becomes one debt with its balance, rate and monthly payment', () => {
    const rows = billRows(house({ bills: [loan()] }));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'debt-bill-ob-5312',
      name: 'First State Bank loan 5312',
      balance: 48210.55,
      rate: 6.5,
      rateKnown: true,
      minPayment: 825.42,
      entityId: 'e-poeprops',
      lender: 'First State Bank',
      accountLast4: '5312',
      debtType: 'loan',
      needsTerms: false,
      obligationId: 'ob-5312',
    });
  });

  it('six loans are six debts; an ordinary bill with no balance is not a debt', () => {
    const six = ['5312', '5313', '5314', '5315', '5316', '5317'].map((l4, i) =>
      loan({ id: `ob-${l4}`, name: `First State Bank loan ${l4}`, accountLast4: l4, balance: 10000 + i })
    );
    const electric = { id: 'ob-elec', name: 'Electric', enabled: true, amount: 140, frequency: 'monthly', nextDue: '2026-11-20', entityId: 'e-personal' };
    const rows = billRows(house({ bills: [...six, electric] }));
    expect(rows.map((r) => r.accountLast4)).toEqual(['5312', '5313', '5314', '5315', '5316', '5317']);
    expect(rows.find((r) => r.name === 'Electric')).toBeUndefined();
  });

  it('a turned-off bill, or one with no balance, is not listed; unknown terms say so', () => {
    expect(billRows(house({ bills: [loan({ enabled: false })] }))).toHaveLength(0);
    expect(billRows(house({ bills: [loan({ balance: '' })] }))).toHaveLength(0);
    const [r] = billRows(house({ bills: [loan({ rate: '' })] }));
    expect(r.rateKnown).toBe(false);
    expect(r.needsTerms).toBe(true);
  });
});

describe('never counted twice', () => {
  it('skips the bill when the loan already has its own debt account with the same last four', () => {
    const data = house({
      bills: [loan()],
      accounts: [{ id: 'a-5312', name: 'First State Bank 5312', type: 'loan', entityId: 'e-poeprops', balance: -48210.55 }],
    });
    const all = deriveDebts(data, asOf);
    expect(all.filter((d) => d.source === 'account')).toHaveLength(1);
    expect(all.filter((d) => d.source === 'bill')).toHaveLength(0);
  });

  it('skips the bill when the rental mortgage it pays already carries the balance', () => {
    const rentals = [{ id: 'r-709', name: '709 Commercial St', entityId: 'e-poeprops', mortgage: { balance: 60000, rate: 6.5, monthlyPI: 825.42 } }];
    const all = deriveDebts(house({ bills: [loan({ rentalId: 'r-709', isMortgage: true })], rentals }), asOf);
    expect(all.filter((d) => d.source === 'rental')).toHaveLength(1);
    expect(all.filter((d) => d.source === 'bill')).toHaveLength(0);
  });

  it('lists the bill as the mortgage when the rental has no balance on file', () => {
    const rentals = [{ id: 'r-709', name: '709 Commercial St', entityId: 'e-poeprops', mortgage: { balance: 0 } }];
    const rows = billRows(house({ bills: [loan({ rentalId: 'r-709', isMortgage: true })], rentals }));
    expect(rows).toHaveLength(1);
    expect(rows[0].debtType).toBe('mortgage');
  });

  it('two bills for the same loan (same lender and last four) count once', () => {
    const rows = billRows(house({ bills: [loan(), loan({ id: 'ob-5312-copy', name: 'FSB 5312 payment' })] }));
    expect(rows).toHaveLength(1);
  });
});

describe('Safe-to-Spend does not move', () => {
  it('the loan payment is reserved once, by the bill, exactly as before', () => {
    const data = house({ bills: [loan()] });
    const without = house({ bills: [loan({ balance: '' })] });
    const a = buildSafeToSpend(data, { currentDate: asOf, scope: 'e-poeprops' });
    const b = buildSafeToSpend(without, { currentDate: asOf, scope: 'e-poeprops' });
    expect(a.safeToSpendNow).toBe(b.safeToSpendNow);
    expect(a.lines.debtMinimums).toBe(b.lines.debtMinimums);
    expect(a.lines.billsDue).toBe(b.lines.billsDue);
    expect((a.items || []).filter((e) => e.kind === 'debt-min' && /5312/.test(e.label || ''))).toHaveLength(0);
  });

  it('a Poe Properties loan paid from the personal account is reserved once, in Personal, and never again in Poe Properties', () => {
    const personal = { id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 5000 };
    const paidFromPersonal = (over) => loan({ accountId: 'a-7206', ...over });
    for (const scope of ['e-poeprops', 'personal']) {
      const a = buildSafeToSpend(house({ bills: [paidFromPersonal()], accounts: [personal] }), { currentDate: asOf, scope });
      const b = buildSafeToSpend(house({ bills: [paidFromPersonal({ balance: '' })], accounts: [personal] }), { currentDate: asOf, scope });
      expect(a.lines.debtMinimums, scope).toBe(b.lines.debtMinimums);
      expect(a.safeToSpendNow, scope).toBe(b.safeToSpendNow);
    }
  });
});
