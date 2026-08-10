// @vitest-environment node
//
// The 2026-08-04 "Add as debt won't stick" regression pins (Darrell, from the
// Debts-tab screenshots). Root cause, verified against the live table: the
// accounts cloud round-trip DROPPED treatAsDebt / minPayment / rate (no columns
// pre-0129, no mapper fields), so the first refetch erased every debt
// declaration; the suggestion panel then re-offered the same card and each
// re-tap uploaded another bare $0 account — 24 stray rows for 8 real cards.
// Three pins here:
//   1. mapper round-trip — the declaration survives local -> row -> local;
//   2. dedupeDebtAccountStrays — a device still holding pre-cleanup strays
//      renders ONE row per card (merge-time collapse, dedupeEntitiesByName
//      pattern), and never touches real accounts;
//   3. proven-to-catch: the old mapper shape (no debt fields) FAILS pin 1.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase.js', () => {
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => ({}),
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  return { default: supabase, supabase };
});

import { accountToRow, accountFromRow } from '../lib/accounts-sync.js';
import { dedupeDebtAccountStrays } from '../lib/accounts-dedupe.js';

const CTX = { tenantId: 't-1', userId: 'u-1' };

describe('accounts mapper round-trip carries the debt declaration (0129)', () => {
  it('toRow writes treat_as_debt / min_payment / rate', () => {
    const row = accountToRow(
      { id: 'a-1785805052251', name: 'Cardmember Serv Pymt', type: 'credit', treatAsDebt: true, balance: 0, minPayment: 110, rate: 22.99, entityId: 'e-personal' },
      CTX,
    );
    expect(row.treat_as_debt).toBe(true);
    expect(row.min_payment).toBe(110);
    expect(row.rate).toBe(22.99);
    expect(row.account_type).toBe('credit');
  });
  it('fromRow reads them back — the full round trip preserves the declaration', () => {
    const local = { id: 'a-1', name: 'American Express Ach A', type: 'credit', treatAsDebt: true, balance: 0, minPayment: 53, rate: 0, entityId: 'e-personal' };
    const back = accountFromRow({ ...accountToRow(local, CTX), id: 'uuid-1', slug: local.id });
    expect(back.treatAsDebt).toBe(true);
    expect(back.minPayment).toBe(53);
    expect(back.rate).toBe(0);
    expect(back.id).toBe('a-1');
  });
  it('absent columns read as an honest default, never undefined leaking NaN', () => {
    const back = accountFromRow({ id: 'uuid-2', slug: 'a-old', display_name: 'Old', account_type: 'checking', balance: '12.5' });
    expect(back.treatAsDebt).toBe(false);
    expect(back.minPayment).toBe(0);
    expect(back.rate).toBe(0);
  });
});

describe('dedupeDebtAccountStrays — one row per card, real accounts untouched', () => {
  // Real shapes from the live table (2026-08-04): epoch slugs from addAccount,
  // $0 balances, the same display name added on three different days.
  const stray = (id, name, extra = {}) => ({ id, name, type: 'credit', balance: 0, entityId: 'e-personal', ...extra });
  it('collapses duplicate strays to the declaration-carrying keeper', () => {
    const out = dedupeDebtAccountStrays([
      stray('a-1784809970729', 'Cardmember Serv Pymt', { treatAsDebt: true, remoteUuid: 'u-keep' }),
      stray('a-1785500237548', 'Cardmember Serv Pymt'),
      stray('a-1785805052251', 'Cardmember Serv Pymt'),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a-1784809970729');
  });
  it('keeps the earliest when no stray carries the declaration', () => {
    const out = dedupeDebtAccountStrays([
      stray('a-1784809981378', 'American Express Ach A'),
      stray('a-1785805053514', 'American Express Ach A'),
    ]);
    expect(out.map((a) => a.id)).toEqual(['a-1784809981378']);
  });
  it('drops a $0 stray sitting next to a REAL same-name account', () => {
    const real = { id: 'a-amex-4306', name: 'American Express Ach A', type: 'credit', balance: -512.4, entityId: 'e-personal' };
    const out = dedupeDebtAccountStrays([real, stray('a-1785805053514', 'American Express Ach A')]);
    expect(out).toEqual([real]);
  });
  it('never touches real accounts: word slugs, nonzero balances, distinct names, other types', () => {
    const list = [
      { id: 'a-chase-1818', name: 'Chase Line of Credit 1818', type: 'credit', balance: -8705.41, entityId: 'e-personal' },
      { id: 'a-chk', name: 'Chase Checking', type: 'checking', balance: 4200, entityId: 'e-personal' },
      stray('a-1784809963840', 'Goodleap Agnt Pymnt', { treatAsDebt: true }),
      stray('a-1785805050036', 'Wf Home Mtg', { treatAsDebt: true }),
    ];
    expect(dedupeDebtAccountStrays(list)).toEqual(list);
  });
  it('is safe on empty / null input', () => {
    expect(dedupeDebtAccountStrays([])).toEqual([]);
    expect(dedupeDebtAccountStrays(null)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The card terms + per-row switches (0133 / 0134) ride the SAME round trip, and
// have the same failure mode if a mapper field is missed: the first cloud
// refetch silently erases what the family entered.
// ---------------------------------------------------------------------------
describe('the card terms survive local -> row -> local', () => {
  it('carries limit, peak, range, and both switches through the round trip', () => {
    const local = {
      id: 'a-card', entityId: 'e-personal', name: 'AvantCard', type: 'credit',
      balance: 948, treatAsDebt: true, minPayment: 45, rate: 35.99, rateMin: 29.99,
      rateKnown: true, creditLimit: 1000, highestBalance: 1021,
      leaveAlone: true, rateOverridden: true,
    };
    const row = accountToRow(local, { tenantId: 't1', userId: 'u1' });
    const back = accountFromRow({ ...row, id: 'uuid-1' });
    expect(back).toMatchObject({
      creditLimit: 1000, highestBalance: 1021, rateMin: 29.99, rateKnown: true,
      leaveAlone: true, rateOverridden: true,
    });
  });

  it('an UNKNOWN limit or peak stays null across the trip — never becomes 0', () => {
    // Proven-to-catch: `Number(x) || 0` in either direction turns every blank
    // the family left into a hard $0 claim (DR-0076).
    const row = accountToRow(
      { id: 'a-x', name: 'Gas Card', type: 'credit', treatAsDebt: true, balance: 0 },
      { tenantId: 't1', userId: 'u1' },
    );
    expect(row.credit_limit).toBeNull();
    expect(row.highest_balance).toBeNull();
    expect(row.rate_min).toBeNull();
    const back = accountFromRow({ ...row, id: 'uuid-2' });
    expect(back.creditLimit).toBeNull();
    expect(back.highestBalance).toBeNull();
    expect(back.rateKnown).toBe(false);
    expect(back.rateOverridden).toBe(false);
  });
});
