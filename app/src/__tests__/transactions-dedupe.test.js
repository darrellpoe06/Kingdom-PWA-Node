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
  it('DROPS a synced row (remoteUuid) that is ABSENT from the cloud — a remote delete propagates even when local storage is stale', () => {
    // The "leaves and comes back after the clear" bug (Darrell 2026-07-19): the
    // dedupe deleted the cloud rows, but the device was OUT OF LOCAL SPACE so the
    // snapshot could not save — stale localStorage still held the deleted rows. Each
    // carries a remoteUuid (it came FROM the cloud) and a generic "DEBIT" content-key
    // that does NOT match the surviving real cloud row, so the content check missed
    // it and it resurrected. It must be dropped because it was synced and is now gone.
    const staleLocal = [
      { id: 't-dupe-9', remoteUuid: 'uuid-deleted-9', date: '2026-06-15', amount: -50, description: 'DEBIT', accountId: 'a-7206' },
      { id: 't-localonly', date: '2026-06-15', amount: -9, description: 'Cash tip', accountId: 'a-7206' }, // never synced -> keep
    ];
    const cloudAfterDelete = [
      { id: 't-real-9', remoteUuid: 'uuid-real-9', date: '2026-06-15', amount: -50, description: 'COUNTY MARKET', accountId: 'a-7206' },
    ];
    const merged = mergeTransactionsPreferCloud(staleLocal, cloudAfterDelete);
    expect(merged.some((t) => t.id === 't-dupe-9')).toBe(false);      // deleted-remotely row does NOT come back
    expect(merged.some((t) => t.id === 't-localonly')).toBe(true);    // genuine local-only survives
    expect(merged.some((t) => t.id === 't-real-9')).toBe(true);       // the surviving real cloud row stays
    // PROVEN-TO-CATCH: remove the `if (l.remoteUuid) return false` guard and the
    // 't-dupe-9' assertion fails — the generic "DEBIT" twin resurrects.
  });
  it('SAFETY: an EMPTY cloud list never blanks the local ledger (out-of-space read hiccup)', () => {
    // Post-incident (Darrell 2026-07-19): a cloud read on a full device came back
    // empty and the "drop synced rows absent from cloud" rule wiped every Books tab +
    // wedged the app. An empty remote is NOT an authoritative delete — keep local.
    const localSynced = [
      { id: 't-1', remoteUuid: 'u-1', date: '2026-06-01', amount: -50, description: 'COUNTY MARKET', accountId: 'a1' },
      { id: 't-2', remoteUuid: 'u-2', date: '2026-06-02', amount: 200, description: 'PAYROLL', accountId: 'a1' },
    ];
    expect(mergeTransactionsPreferCloud(localSynced, [])).toHaveLength(2);   // NOT blanked
    expect(mergeTransactionsPreferCloud(localSynced, null)).toHaveLength(2);
    // PROVEN-TO-CATCH: without the empty guard, both synced rows (remoteUuid, absent
    // from the empty cloud) would be dropped -> length 0 -> the blank-ledger incident.
  });
  it('txnContentKey matches across local + remote field names', () => {
    expect(txnContentKey({ date: '2026-05-18', amount: -50, description: 'A B', accountId: 'x' }))
      .toBe(txnContentKey({ txn_date: '2026-05-18', amount: -50, description: 'a b', account_slug: 'x' }));
  });
});
