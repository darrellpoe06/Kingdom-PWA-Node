// @vitest-environment node
//
// verified-ledger-sync — merge the NAS verified ledger into the durable in-app
// ledger (DR-0083). Proven-to-catch: account matching by fragment tail, FITID
// dedupe against the existing ledger AND within the batch (idempotent re-sync),
// the combined export left unmatched (no double-count), and the verified-only
// filter. The money loop's "no double-count, no loss" guarantee lives here.
import { describe, it, expect } from 'vitest';
import { accountDigits, matchAccount, mapVerifiedLedger, fetchAndMapVerifiedLedger } from '../lib/verified-ledger-sync.js';

const ACCOUNTS = [
  { id: 'a-8168', fragment: '...8168' },
  { id: 'a-3322', fragment: '...3322' },
  { id: 'a-7206', fragment: '...7206' },
];

const row = (fitid, account, amount, date = '2026-01-05') => ({
  id: account + ':' + fitid, account, date, amount,
  description: 'x', fitid, source: 'bank', verified: true,
});

describe('account matching', () => {
  it('pulls the 4-digit tail from a NAS key', () => {
    expect(accountDigits('chase8168')).toBe('8168');
    expect(accountDigits('transaction')).toBe(null);
  });
  it('matches the app account by fragment tail; combined export is unmatched', () => {
    expect(matchAccount('chase8168', ACCOUNTS)).toBe('a-8168');
    expect(matchAccount('chase7206', ACCOUNTS)).toBe('a-7206');
    expect(matchAccount('transaction', ACCOUNTS)).toBe(null);
    expect(matchAccount('chase9999', ACCOUNTS)).toBe(null);
  });
});

describe('mapVerifiedLedger', () => {
  it('maps verified bank rows to app transactions on the matched account', () => {
    const out = mapVerifiedLedger({ transactions: [row('F1', 'chase8168', -80)] }, ACCOUNTS, []);
    expect(out.added).toBe(1);
    expect(out.toAdd[0]).toMatchObject({ accountId: 'a-8168', amount: -80, source: 'verified-ledger', fitid: 'F1', verified: true });
    expect(out.toAdd[0].id).toBe('vl-F1');
  });
  it('IDEMPOTENT: skips rows whose FITID is already in the ledger (re-sync is a no-op)', () => {
    const existing = [{ id: 'vl-F1', fitid: 'F1' }];
    const out = mapVerifiedLedger({ transactions: [row('F1', 'chase8168', -80), row('F2', 'chase8168', 50)] }, ACCOUNTS, existing);
    expect(out.added).toBe(1);          // only F2 is new
    expect(out.skippedDup).toBe(1);     // F1 already present
    expect(out.toAdd[0].fitid).toBe('F2');
  });
  it('dedupes duplicate FITIDs WITHIN one batch (no double-count)', () => {
    const out = mapVerifiedLedger({ transactions: [row('F9', 'chase8168', -10), row('F9', 'chase3322', -10)] }, ACCOUNTS, []);
    expect(out.added).toBe(1);
    expect(out.skippedDup).toBe(1);
  });
  it('reports the combined export as unmatched instead of double-counting it', () => {
    const out = mapVerifiedLedger({ transactions: [row('T1', 'transaction', -5)] }, ACCOUNTS, []);
    expect(out.added).toBe(0);
    expect(out.unmatched.transaction).toBe(1);
  });
  it('ignores non-verified / non-bank rows (gmail preview never drives the ledger)', () => {
    const gmail = { id: 'gm:1', account: 'chase8168', date: '2026-01-01', amount: 5, source: 'gmail', verified: false, fitid: '' };
    const out = mapVerifiedLedger({ transactions: [gmail] }, ACCOUNTS, []);
    expect(out.added).toBe(0);
  });
  it('clamps an unknown category to other', () => {
    const r = { ...row('F3', 'chase8168', -5), category: 'bogus' };
    expect(mapVerifiedLedger({ transactions: [r] }, ACCOUNTS, []).toAdd[0].category).toBe('other');
  });
});

describe('fetchAndMapVerifiedLedger — robust, never throws', () => {
  it('fetches + maps on success', async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ transactions: [row('F1', 'chase8168', -80)] }) });
    const out = await fetchAndMapVerifiedLedger('http://nas/finance/verified-ledger.json', ACCOUNTS, [], fakeFetch);
    expect(out.ok).toBe(true);
    expect(out.added).toBe(1);
  });
  it('NO-OP (never throws) when the NAS is unreachable — balance stays durable', async () => {
    const boom = async () => { throw new Error('failed to fetch'); };
    const out = await fetchAndMapVerifiedLedger('http://nas/x.json', ACCOUNTS, [], boom);
    expect(out.ok).toBe(false);
    expect(out.toAdd).toEqual([]);
    expect(out.error).toMatch(/failed to fetch/);
  });
  it('NO-OP on a non-200', async () => {
    const out = await fetchAndMapVerifiedLedger('http://nas/x.json', ACCOUNTS, [], async () => ({ ok: false, status: 502 }));
    expect(out.ok).toBe(false);
    expect(out.added).toBe(0);
  });
});
