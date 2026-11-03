// money-paychecks.test.js — paycheck periods honor timing: cash first, income on its day, shortfalls named.
import { describe, it, expect } from 'vitest';
import { paycheckPeriods } from '../lib/money-paychecks.js';

const TODAY = new Date(2026, 9, 28);
function fixture(overrides = {}) {
  return {
    meta: { bufferTarget: 500 },
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'chk', entityId: 'e-personal', name: 'Checking', type: 'checking', balance: 1200, openingBalance: 1200 }],
    transactions: [],
    inflows: { salaries: [{ id: 's1', who: 'Adam', source: 'ACME', expected: 3000, actual: 3000, entityId: 'e-personal' }], rentals: [] },
    outflows: { household: 0 },
    recurringObligations: [
      { id: 'rent', name: 'Rent', amount: 1500, frequency: 'monthly', nextDue: '2026-11-01', entityId: 'e-personal', category: 'housing', enabled: true },
      { id: 'phone', name: 'Phone', amount: 80, frequency: 'monthly', nextDue: '2026-11-12', entityId: 'e-personal', category: 'utilities', enabled: true },
    ],
    taxCalendar: [], incidents: [], debts: [], events: [],
    moneyPlan: { settings: { incomeSchedule: { s1: { frequency: 'biweekly', nextDate: '2026-11-06' } }, minCushion: 200 } },
    ...overrides,
  };
}

describe('paycheckPeriods', () => {
  it('period 0 is funded from cash on hand minus the cushion; the paycheck is not counted before its day', () => {
    const r = paycheckPeriods(fixture(), { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    const p0 = r.periods[0];
    expect(p0.source).toBe('cash-on-hand');
    expect(p0.income).toBe(0);
    expect(p0.fromCash).toBe(1000); // 1200 − 200 cushion
    expect(p0.items.map((i) => i.label)).toEqual(['Rent']); // due 11-01, before the 11-06 paycheck
    expect(p0.obligations).toBe(1500);
    expect(p0.sufficient).toBe(false);
    expect(p0.shortfall).toBe(500);
    expect(p0.nextPayday).toBe('2026-11-06');
  });
  it('a later period is funded by its paycheck (plus any leftover), and lists the bills inside it', () => {
    const r = paycheckPeriods(fixture(), { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    const p1 = r.periods[1];
    expect(p1.source).toBe('paycheck');
    expect(p1.start).toBe('2026-11-06');
    expect(p1.income).toBeCloseTo(3000 * 12 / 26, 2);
    expect(p1.items.map((i) => i.label)).toEqual(['Phone']);
    expect(p1.sufficient).toBe(true);
    expect(p1.carriedIn).toBe(0); // period 0 had a shortfall, so nothing carries
    expect(r.insufficientCount).toBe(1);
  });
  it('a leftover carries forward as money; a shortfall never does', () => {
    const data = fixture(); data.accounts[0].balance = 5000; data.accounts[0].openingBalance = 5000;
    const r = paycheckPeriods(data, { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    expect(r.periods[0].leftover).toBe(5000 - 200 - 1500);
    expect(r.periods[1].carriedIn).toBe(3300);
    expect(r.periods[1].funds).toBeCloseTo(3300 + 3000 * 12 / 26, 2);
  });
  it('with no pay dates known there are no periods, and the missing information is named', () => {
    const data = fixture({ moneyPlan: { settings: { minCushion: 200 } } });
    const r = paycheckPeriods(data, { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    expect(r.paydays).toEqual([]);
    expect(r.periods).toHaveLength(1); // the whole horizon from cash on hand
    expect(r.missing[0]).toMatch(/No upcoming pay dates/);
  });
});
