// money-reconciliation.test.js — nothing is spendable until the cash is
// checked against the bank (Christina, 2026-11-03: "If the actual bank balance
// is unknown or unverified, DO NOT display a positive Safe-to-Spend amount as
// though it is accurate ... display SAFE TO SPEND: $0, STATUS: UNVERIFIED —
// RECONCILIATION REQUIRED"; "Use my approximately $6,000 figure only as a
// provisional amount"; "Set my required PERSONAL cash cushion to $10,000").
//
// Shapes from her own records: the ledger computed Chase 7206 at $26,428 while
// the bank held about $6,000; the live screen showed a positive Safe to Spend.
import { describe, it, expect } from 'vitest';
import { buildSafeToSpend } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow, resolveAccountUpdates } from '../lib/financial-engineering.js';

const TODAY = new Date(2026, 10, 3, 12);
const opts = { currentDate: TODAY, period: '14d', scope: 'personal' };

function world() {
  const tx = [];
  // A ledger that has drifted far above the bank: +$20,000 never reconciled.
  tx.push({ id: 'big', date: '2026-08-17', accountId: 'chk', amount: 20000, description: 'DEPOSIT ID NUMBER 1', category: 'other' });
  for (const m of ['09', '10']) tx.push({ id: `g${m}`, date: `2026-${m}-10`, accountId: 'chk', amount: -150, description: 'COUNTY MARKET', category: 'groceries' });
  return {
    meta: { releaseLabel: 'MVP v1.5' },
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-poeprops', name: 'Poe Properties', type: 'business' }],
    accounts: [
      { id: 'chk', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 6400 },
      { id: 'poe', name: 'Poe Properties checking', type: 'checking', entityId: 'e-poeprops', balance: 50000 },
    ],
    transactions: tx,
    inflows: { salaries: [], rentals: [] },
    recurringObligations: [],
    moneyPlan: { settings: { minCushion: 2000, reserveByEntity: { personal: 10000 } } },
  };
}

describe('Safe to Spend is $0 until the cash is checked against the bank (PROVEN TO CATCH)', () => {
  it('a ledger-only balance shows $0 and RECONCILIATION REQUIRED, while the unverified projection stays visible', () => {
    const r = buildSafeToSpend(world(), opts);
    expect(r.lines.availableCash).toBe(26100); // the ledger's arithmetic, not the bank
    expect(r.reconciliationRequired).toBe(true);
    expect(r.safeToSpendNow).toBe(0);
    expect(r.unreconciledSafe).toBeGreaterThan(0); // not hidden: shown as not usable
    expect(r.explanation[0]).toMatch(/^SAFE TO SPEND: \$0\. UNVERIFIED — RECONCILIATION REQUIRED\. Not checked against the bank: Chase 7206 \(ledger arithmetic \$26,100\)/);
    expect(r.lines.potentialDebtPayment).toBe(0);
  });
  it('an APPROXIMATE balance replaces the ledger arithmetic, but is never a bank check', () => {
    const w = world();
    w.transactions.push({ id: 'prov', ...balanceCheckpointRow('chk', 6000, '2026-11-03', { basis: 'provisional', source: 'entered by hand, approximate' }) });
    const r = buildSafeToSpend(w, opts);
    expect(r.lines.availableCash).toBe(6000);
    expect(r.balanceSources.find((b) => b.id === 'chk')).toMatchObject({ provisional: true, verifiedOn: null });
    expect(r.reconciliationRequired).toBe(true);
    expect(r.safeToSpendNow).toBe(0);
    expect(r.explanation[0]).toMatch(/your approximate \$6,000/);
  });
  it('the exact balance checked against the bank lifts the hold; below the $10,000 personal cushion it is still $0, with the shortfall named', () => {
    const w = world();
    w.transactions.push({ id: 'cp', ...balanceCheckpointRow('chk', 6236.18, '2026-11-03', { basis: 'available' }) });
    const r = buildSafeToSpend(w, opts);
    expect(r.reconciliationRequired).toBe(false);
    expect(r.lines.minCushion).toBe(10000); // the personal cushion, not the old $2,000
    expect(r.safeToSpendNow).toBe(0);
    expect(r.shortfall).toBeGreaterThan(3000);
    // Above the cushion, the checked figure is spendable.
    w.transactions.push({ id: 'cp2', ...balanceCheckpointRow('chk', 15000, '2026-11-03', { basis: 'available' }) });
    const r2 = buildSafeToSpend(w, opts);
    expect(r2.safeToSpendNow).toBe(r2.unreconciledSafe);
    expect(r2.safeToSpendNow).toBeGreaterThan(0);
  });
  it('business cash never reaches personal Safe to Spend', () => {
    const w = world();
    w.transactions.push({ id: 'cp', ...balanceCheckpointRow('chk', 15000, '2026-11-03', { basis: 'available' }) });
    const r = buildSafeToSpend(w, opts);
    expect(r.balanceSources.map((b) => b.id)).toEqual(['chk']);
    expect(r.lines.availableCash).toBe(15000);
  });
  it('a bank check older than 14 days holds Safe to Spend at $0 again', () => {
    const w = world();
    w.transactions.push({ id: 'old', ...balanceCheckpointRow('chk', 15000, '2026-10-01', { basis: 'available' }) });
    const r = buildSafeToSpend(w, opts);
    expect(r.reconciliationRequired).toBe(true);
    expect(r.safeToSpendNow).toBe(0);
  });
});

describe('the account editor records an approximate balance as provisional', () => {
  it('"approximate" posts a provisional checkpoint, and the flag is never stored on the account', () => {
    const posted = [];
    const out = resolveAccountUpdates(world(), 'chk', { name: 'Chase 7206', balance: '6000', balanceProvisional: true }, TODAY, (row) => posted.push(row));
    expect(posted).toHaveLength(1);
    expect(posted[0].reconciliation).toMatchObject({ kind: 'balance-checkpoint', balance: 6000, basis: 'provisional' });
    expect(out).not.toHaveProperty('balanceProvisional');
    expect(out.balance).toBeUndefined();
  });
  it('an exact balance (not approximate) is a bank check, as before', () => {
    const posted = [];
    resolveAccountUpdates(world(), 'chk', { balance: '6236.18' }, TODAY, (row) => posted.push(row));
    expect(posted[0].reconciliation.basis).toBe(null);
    const w = world(); w.transactions.push({ id: 'cp', ...posted[0] });
    expect(buildSafeToSpend(w, opts).reconciliationRequired).toBe(false);
  });
});
