// @vitest-environment node
//
// mergeTransactionsPreferCloud — the fix for the double-count. A stale LOCAL
// import row (old slug, wrong old category) is superseded by the reconciled
// CLOUD row when they're the same transaction by content (date+amount+payee+
// account) — cloud wins. Proven-to-catch: the exact WF mortgage case (local
// Vehicle vs cloud Debt-Payment) collapses to the cloud row; genuinely local-only
// rows survive; and a legitimate same-day/same-amount pair the bank really has
// (two cloud rows) is NOT collapsed.
import { describe, it, expect } from 'vitest';
import { mergeTransactionsPreferCloud, txnContentKey } from '../lib/txn-dedupe.js';

const cloud = [
  { id: 't-hashA', date: '2026-05-18', amount: -2622.83, description: 'WF HOME MTG AUTO PAY 0511', accountId: 'a-7206', category: 'debt-payment' },
];

describe('mergeTransactionsPreferCloud', () => {
  it('drops a stale local dupe (different slug, same content) — cloud wins', () => {
    const local = [
      { id: 't-1782000', date: '2026-05-18', amount: -2622.83, description: 'WF HOME MTG AUTO PAY 0511', accountId: 'a-7206', category: 'vehicle' },
    ];
    const merged = mergeTransactionsPreferCloud(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].category).toBe('debt-payment'); // the cloud row, not the stale Vehicle one
  });
  it('keeps a genuinely local-only row (no cloud content match)', () => {
    const local = [{ id: 't-1782999', date: '2026-05-20', amount: -12, description: 'Local only coffee', accountId: 'a-7206' }];
    const merged = mergeTransactionsPreferCloud(local, cloud);
    expect(merged).toHaveLength(2);
    expect(merged.some((t) => t.description === 'Local only coffee')).toBe(true);
  });
  it('does NOT collapse a legit same-day/same-amount pair the bank really has (two cloud rows)', () => {
    const twoReal = [
      { id: 't-h1', date: '2026-05-20', amount: 2099.93, description: 'UNIVERSITY OF IL PAYROLL', accountId: 'a-7206' },
      { id: 't-h2', date: '2026-05-20', amount: 2099.93, description: 'UNIVERSITY OF IL PAYROLL', accountId: 'a-7206' },
    ];
    expect(mergeTransactionsPreferCloud([], twoReal)).toHaveLength(2);
  });
  it('drops a local row that matches a cloud row by slug (cloud copy used)', () => {
    const local = [{ id: 't-hashA', date: '2026-05-18', amount: -2622.83, description: 'WF HOME MTG AUTO PAY 0511', accountId: 'a-7206', category: 'stale' }];
    const merged = mergeTransactionsPreferCloud(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].category).toBe('debt-payment');
  });
  it('txnContentKey matches across local + remote field names', () => {
    expect(txnContentKey({ date: '2026-05-18', amount: -50, description: 'A B', accountId: 'x' }))
      .toBe(txnContentKey({ txn_date: '2026-05-18', amount: -50, description: 'a b', account_slug: 'x' }));
  });
});
