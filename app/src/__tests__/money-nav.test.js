// money-nav.test.js — every legacy Money sub-tab is still reachable, in three taps or fewer.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MONEY_SECTIONS, LEGACY_SUBS, NEW_SUBS, ALL_SUBS, DEFAULT_SUB, MONEY_BOTTOM_NAV,
  sectionFor, sectionTabs, tapsTo, isMoneySub, moneyMoreSections, TAB_WORDS,
} from '../lib/money-nav.js';
import { VALID_BOOKS_SUBS, initialBooksView, parseNav } from '../lib/nav-history.js';
import { emptyMoneyPlan, patchMoneyPlan, syncStatus, setupSteps, balanceSource, moneySettings } from '../lib/money-plan.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

describe('the twelve legacy sub-tabs survive the redesign', () => {
  it('every legacy id lives inside exactly one section', () => {
    for (const id of LEGACY_SUBS) {
      const homes = MONEY_SECTIONS.filter((s) => s.tabs.includes(id));
      expect(homes, id).toHaveLength(1);
    }
  });
  it('the legacy list is the one the shell routed before (pinned)', () => {
    expect(LEGACY_SUBS).toEqual(['entities', 'accounts', 'debts', 'owed', 'plan', 'transactions', 'imported', 'cart', 'k1099', 'taxes', 'calendar', 'legal']);
  });
  it('every legacy id still has a render branch in the live shell', () => {
    for (const id of LEGACY_SUBS) expect(SHELL, id).toMatch(new RegExp(`booksView\\s*===\\s*'${id}'`));
  });
  it('the deep-link resolver knows every section and every legacy id, and defaults to the Overview', () => {
    for (const id of ALL_SUBS) {
      expect(VALID_BOOKS_SUBS, id).toContain(id);
      expect(initialBooksView(`?view=books&sub=${id}`)).toBe(id);
    }
    expect(DEFAULT_SUB).toBe('overview');
    expect(initialBooksView('?view=books')).toBe('overview');
    expect(parseNav('').booksView).toBe('overview');
  });
  it('nine sections, in the order Christina named', () => {
    expect(MONEY_SECTIONS.map((s) => s.label)).toEqual(['Overview', 'Accounts', 'Transactions', 'Budget', 'Bills', 'Goals', 'Debt Freedom', 'Reports', 'Settings']);
  });
  it('every id is reachable in three taps or fewer, on a phone and on a laptop', () => {
    for (const id of ALL_SUBS) {
      expect(tapsTo(id), `${id} laptop`).toBeLessThanOrEqual(2);
      expect(tapsTo(id, { phone: true }), `${id} phone`).toBeLessThanOrEqual(3);
    }
  });
  it('the phone bar shows the four Christina named plus More for the rest', () => {
    expect(MONEY_BOTTOM_NAV.map((t) => t.words)).toEqual(['Overview', 'Transactions', 'Budget', 'Goals']);
    const more = moneyMoreSections().map((s) => s.id);
    expect(more).toEqual(['accounts', 'bills', 'debt-freedom', 'reports', 'settings']);
  });
  it('sectionFor and sectionTabs route a legacy id to its section and tab row', () => {
    expect(sectionFor('imported').id).toBe('transactions');
    expect(sectionTabs('transactions').map(([id]) => id)).toEqual(['transactions', 'imported']);
    expect(sectionTabs('transactions', (id) => id !== 'imported').map(([id]) => id)).toEqual(['transactions']);
    expect(sectionFor('nope')).toBeNull();
    expect(isMoneySub('overview')).toBe(true);
    expect(isMoneySub('calendar')).toBe(true);
    expect(isMoneySub('bogus')).toBe(false);
    for (const id of ALL_SUBS) expect(TAB_WORDS[id], id).toBeTruthy();
    expect(NEW_SUBS).toHaveLength(7);
  });
});

describe('money-plan — settings that are entered, never invented', () => {
  it('patchMoneyPlan merges nested objects and stamps updatedAt', () => {
    const p = patchMoneyPlan(null, { settings: { minCushion: 750 } }, new Date('2026-10-28T12:00:00Z'));
    expect(p.settings.minCushion).toBe(750);
    expect(p.settings.defaultPeriod).toBe('next-paycheck');
    expect(p.updatedAt).toBe('2026-10-28T12:00:00.000Z');
    const p2 = patchMoneyPlan(p, { settings: { incomeSchedule: { s1: { frequency: 'biweekly', nextDate: '2026-11-06' } } } });
    expect(p2.settings.minCushion).toBe(750);
    expect(p2.settings.incomeSchedule.s1.frequency).toBe('biweekly');
    expect(moneySettings({ moneyPlan: p2 }).rentDueDay).toBeNull();
    expect(emptyMoneyPlan().v).toBe(1);
  });
  it('syncStatus says local, pending, or synchronized — never "saved" for a device-only change', () => {
    expect(syncStatus({ cloud: false }).state).toBe('local');
    expect(syncStatus({ cloud: true, updatedAt: null }).state).toBe('synced');
    expect(syncStatus({ cloud: true, marker: '2026-10-28T10:00:00.000Z', updatedAt: '2026-10-28T11:00:00.000Z' }).state).toBe('pending');
    expect(syncStatus({ cloud: true, marker: '2026-10-28T12:00:00.000Z', updatedAt: '2026-10-28T11:00:00.000Z' }).state).toBe('synced');
    expect(syncStatus({ cloud: true, marker: null, updatedAt: '2026-10-28T11:00:00.000Z' }).state).toBe('pending');
  });
  it('setupSteps names each missing value by its record', () => {
    const data = {
      meta: { bufferTarget: 0 },
      inflows: { salaries: [{ id: 's1', source: 'ACME', actual: 3000 }], rentals: [{ id: 'r1', rent: 1000 }] },
      recurringObligations: [], taxCalendar: [{ id: 'tx1', name: 'Q4 estimate', applies: true }], accounts: [],
      moneyPlan: null,
    };
    const debts = [{ id: 'd1', name: 'Visa', minPayment: 100, source: 'account' }, { id: 'm1', name: 'Mortgage', minPayment: 900, source: 'rental' }];
    const st = setupSteps(data, { debts });
    const by = Object.fromEntries(st.steps.map((s) => [s.id, s]));
    expect(by.paychecks.missing).toEqual(['ACME']);
    expect(by['debt-due'].missing).toEqual(['Visa']);
    expect(by['rent-due'].done).toBe(false);
    expect(by['mortgage-due'].applies).toBe(true);
    expect(by.taxes.missing).toEqual(['Q4 estimate']);
    expect(by.cushion.done).toBe(false);
    expect(st.complete).toBe(false);
    const filled = { ...data, moneyPlan: patchMoneyPlan(null, { settings: { incomeSchedule: { s1: { frequency: 'monthly', nextDate: '2026-11-01' } }, debtDueDays: { d1: 20 }, rentDueDay: 1, mortgageDueDay: 1, taxAmounts: { tx1: 1200 }, savingsMonthly: 200, minCushion: 500 } }), recurringObligations: [{ id: 'ro1', enabled: true }] };
    expect(setupSteps(filled, { debts }).complete).toBe(true);
  });
  it('balanceSource never calls a ledger figure a bank balance', () => {
    expect(balanceSource({ bankBalance: 1200, bankAsOf: '2026-10-27' })).toMatchObject({ kind: 'bank' });
    const l = balanceSource({ ledgerAsOf: '2026-10-28' });
    expect(l.kind).toBe('ledger');
    expect(l.label).toMatch(/Ledger-calculated/);
    expect(l.estimate).toBe(true);
  });
});
