// @vitest-environment node
// =============================================================================
// Learn a bank's layout once; never re-guess it
// =============================================================================
// Darrell 2026-08-11: "Automatically creates an account and vendor for perpetual
// use for any user the format should be the same for the same banks eventually
// we would have all of them... imported data would be easier to parce."
//
// Measured before this existed: every import re-derived the layout from scratch,
// and detectAccount could only MATCH an existing account by a digit fragment in
// the FILENAME — so a card that was never set up had nowhere to land.
//
// The load-bearing test here is 'changed': a remembered format is a cached
// assumption, and banks alter their exports without telling anyone. Silently
// applying a stale column map would shift every field by one and import a year
// of wrong numbers with total confidence — the same failure class as the
// recurring detector that invented subscriptions.
import { describe, it, expect } from 'vitest';
import {
  mapColumns, fingerprintStatement, accountFragment,
  loadFormats, rememberFormat, recallFormat, provisionFromStatement,
} from '../lib/bank-formats.js';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

const CHASE = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount'];
const SPLIT = ['Date', 'Description', 'Debit', 'Credit', 'Running Balance'];

describe('the columns a bank actually wrote', () => {
  it('maps the roles it can find and leaves the rest absent', () => {
    const c = mapColumns(CHASE);
    expect(c.description).toBe(2);
    expect(c.amount).toBe(5);
    expect(c.date).toBeGreaterThanOrEqual(0);
    expect(c.balance).toBeUndefined();   // absent, never index 0 by accident
  });

  it('recognises a debit/credit split layout', () => {
    const c = mapColumns(SPLIT);
    expect(c.debit).toBe(2);
    expect(c.credit).toBe(3);
    expect(c.balance).toBe(4);
    expect(fingerprintStatement({ headerCells: SPLIT, text: '' }).signConvention).toBe('split');
  });

  it('reads the masked account fragment the way statements print it', () => {
    expect(accountFragment('Account ending in 3322')).toBe('3322');
    expect(accountFragment('CARD ****8168')).toBe('8168');
    expect(accountFragment('no account here')).toBeNull();
  });

  it('a file with no date or no amount is UNUSABLE, not half-trusted', () => {
    expect(fingerprintStatement({ headerCells: ['Notes', 'Category'] }).usable).toBe(false);
    expect(fingerprintStatement({ headerCells: CHASE }).usable).toBe(true);
  });
});

describe('the registry remembers, and refuses to trust a stale map', () => {
  it('a new bank is learned, then recalled on the next statement', () => {
    const store = mem();
    const fp = fingerprintStatement({ headerCells: CHASE, text: 'CHASE Account ending in 3322' });
    expect(recallFormat(fp, store).status).toBe('new');
    rememberFormat(fp, store, 1);
    const again = recallFormat(fp, store);
    expect(again.status).toBe('remembered');
    expect(again.format.bank).toBe('chase');
    expect(again.format.columns.amount).toBe(5);
  });

  it('THE HAZARD: the same bank with a CHANGED header is re-learned, never reused', () => {
    const store = mem();
    rememberFormat(fingerprintStatement({ headerCells: CHASE, text: 'CHASE' }), store, 1);
    // Chase adds a column; every index after it has shifted.
    const moved = fingerprintStatement({ headerCells: ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Memo', 'Amount'], text: 'CHASE' });
    const r = recallFormat(moved, store);
    expect(r.status).toBe('changed');
    expect(r.format, 'a stale column map must NOT be handed back').toBeNull();
  });

  it('an unusable statement is never written into the registry', () => {
    const store = mem();
    rememberFormat(fingerprintStatement({ headerCells: ['Notes'] }), store, 1);
    expect(Object.keys(loadFormats(store))).toEqual([]);
  });

  it('seeing a bank again counts it rather than duplicating it', () => {
    const store = mem();
    const fp = fingerprintStatement({ headerCells: CHASE, text: 'CHASE' });
    rememberFormat(fp, store, 1);
    rememberFormat(fp, store, 2);
    const all = loadFormats(store);
    expect(Object.keys(all)).toHaveLength(1);
    expect(Object.values(all)[0].seen).toBe(2);
  });

  it('survives a storage that refuses to read or write', () => {
    const hostile = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(() => rememberFormat(fingerprintStatement({ headerCells: CHASE }), hostile, 1)).not.toThrow();
    expect(loadFormats(hostile)).toEqual({});
  });
});

describe('what gets created so the statement has a home', () => {
  const fp = fingerprintStatement({ headerCells: CHASE, text: 'CHASE Account ending in 3322' });
  const summary = { statementBalance: 1012.33, minimumPayment: 35, apr: 24.99, dueDay: 15 };

  it('a card never seen before provisions an account AND a vendor', () => {
    const p = provisionFromStatement(fp, { accounts: [], summary });
    expect(p.existingAccountId).toBeNull();
    expect(p.account.name).toBe('Chase 3322');
    expect(p.account.type).toBe('credit');
    expect(p.account.treatAsDebt).toBe(true);
    expect(p.account.dueDay).toBe(15);        // the field that unlocks on-time/late
    expect(p.account.rate).toBe(24.99);
    expect(p.vendor.name).toBe('Chase');
  });

  it('PROVEN-TO-CATCH: an existing card is REUSED, never duplicated', () => {
    // A duplicate account silently splits a card's history in two, which is
    // worse than an unrouted import a person can see and fix.
    const accounts = [{ id: 'acct-9', fragment: '3322' }];
    const p = provisionFromStatement(fp, { accounts, summary });
    expect(p.existingAccountId).toBe('acct-9');
    expect(p.account).toBeNull();
    expect(p.vendor).toBeNull();
  });

  it('a bank statement with no card fields provisions a BANK account, not a debt', () => {
    const p = provisionFromStatement(fingerprintStatement({ headerCells: SPLIT, text: 'Wells Fargo ending in 8168' }), { accounts: [], summary: null });
    expect(p.account.type).toBe('bank');
    expect(p.account.treatAsDebt).toBe(false);
    expect(p.account.name).toBe('Wells Fargo 8168');
  });

  it('an unrecognised issuer still gets a usable account rather than nothing', () => {
    const p = provisionFromStatement(fingerprintStatement({ headerCells: CHASE, text: 'Local Credit Union ending in 4444' }), { accounts: [], summary: null });
    expect(p.account.name).toContain('4444');
    expect(p.account).toBeTruthy();
  });
});
