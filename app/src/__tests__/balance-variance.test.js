// @vitest-environment node
//
// balance-variance — a $500+ swing per account (and overall) never lands without a
// data-driven reason (Darrell 2026-07-18: "notice major changes easily").
import { describe, it, expect } from 'vitest';
import { accountVariance, varianceReport } from '../lib/balance-variance.js';

const txns = [
  { id: 'a', accountId: 'chk', date: '2026-06-02', description: 'RENT', amount: -800 },
  { id: 'b', accountId: 'chk', date: '2026-06-05', description: 'BLUE CROSS BLUE SHIELD', amount: -412 },
  { id: 'c', accountId: 'chk', date: '2026-06-10', description: 'ACH PAYROLL DEPOSIT', amount: 2000 },
  { id: 'd', accountId: 'chk', date: '2026-06-15', description: 'COUNTY MARKET', amount: -60 },
  { id: 'e', accountId: 'sav', date: '2026-06-01', description: 'INTEREST', amount: 3 },        // tiny — not material
  { id: 'f', accountId: 'chk', date: '2026-05-20', description: 'OLD RENT', amount: -800 },     // out of June window
  { id: 'g', accountId: 'chk', date: '2026-06-18', description: 'TRANSFER TO SAVINGS', amount: -500, category: 'transfer' },
  { id: 'h', accountId: 'sav', date: '2026-06-18', description: 'TRANSFER FROM CHECKING', amount: 500, category: 'transfer' },
];
const accounts = [{ id: 'chk', name: 'Chase Checking' }, { id: 'sav', name: 'Ally Savings' }];
const JUNE = { sinceMs: new Date(2026, 5, 1).getTime(), untilMs: new Date(2026, 6, 1).getTime() - 1 };

describe('accountVariance', () => {
  it('nets the window and explains the swing with top payee drivers', () => {
    const v = accountVariance(txns, 'chk', JUNE.sinceMs, JUNE.untilMs, { threshold: 500, maxDrivers: 3 });
    // 2000 - 800 - 412 - 60 - 500(transfer) = 228 net; but |228| < 500 -> not material here
    expect(v.net).toBe(228);
    expect(v.material).toBe(false);
    // Drivers are biggest |amount| first: payroll +2000, rent -800, transfer -500...
    expect(v.drivers[0].label).toBe('ACH PAYROLL DEPOSIT');
    expect(v.drivers[0].amount).toBe(2000);
    expect(v.count).toBe(5); // June chk rows incl. the transfer; excludes the May row
  });

  it('flags material when |net| crosses the threshold', () => {
    const v = accountVariance(txns, 'chk', JUNE.sinceMs, JUNE.untilMs, { threshold: 200 });
    expect(v.material).toBe(true); // |228| >= 200
  });

  it('excludes rows outside the window', () => {
    const v = accountVariance(txns, 'chk', JUNE.sinceMs, JUNE.untilMs, {});
    expect(v.drivers.some((d) => d.label === 'OLD RENT')).toBe(false);
  });
});

describe('varianceReport', () => {
  it('reports per-account movers (biggest first) and an overall external-only figure', () => {
    const r = varianceReport(txns, accounts, { ...JUNE, threshold: 500, maxDrivers: 3 });
    expect(r.threshold).toBe(500);
    // Chase (|228|) sorts ahead of Ally (|503| incl transfer)... actually Ally net =
    // 3 + 500 = 503, so Ally is the bigger mover and sorts first.
    expect(r.accounts[0].name).toBe('Ally Savings');
    expect(r.accounts[0].net).toBe(503);
    expect(r.accounts[0].material).toBe(true); // |503| >= 500

    // Overall EXCLUDES the two transfer legs -> true external flow only:
    // +2000 payroll +3 interest -800 rent -412 bcbs -60 groceries = 731 net
    expect(r.overall.net).toBe(731);
    expect(r.overall.count).toBe(5); // 5 external June rows (both transfers dropped)
    expect(r.overall.material).toBe(true);
    // The transfer is not a driver of the overall (external) figure.
    expect(r.overall.drivers.some((d) => /TRANSFER/i.test(d.label))).toBe(false);
  });

  it('aggregates repeat payees into one signed driver', () => {
    const repeats = [
      { id: '1', accountId: 'chk', date: '2026-06-01', description: 'SHELL FUEL', amount: -40 },
      { id: '2', accountId: 'chk', date: '2026-06-08', description: 'SHELL FUEL', amount: -55 },
      { id: '3', accountId: 'chk', date: '2026-06-20', description: 'SHELL FUEL', amount: -45 },
    ];
    const v = accountVariance(repeats, 'chk', JUNE.sinceMs, JUNE.untilMs, {});
    const shell = v.drivers.find((d) => /SHELL/.test(d.label));
    expect(shell.amount).toBe(-140);
    expect(shell.count).toBe(3);
  });
});
