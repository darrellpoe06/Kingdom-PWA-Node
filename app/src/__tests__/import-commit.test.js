// @vitest-environment node
//
// import-commit — the "N of M saved" reconciliation readout (Christina's books,
// 2026-07-18). After an import, the app awaits every cloud upload, counts what
// landed, re-uploads the misses, and reports the truth — so a partial save is
// never silent again. Pure with an injected uploader; no live Supabase needed.
import { describe, it, expect } from 'vitest';
import { reconcileCommit, commitRowsToCloud, commitWithRepair, commitReadout } from '../lib/import-commit.js';

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, amount: -(i + 1) }));

describe('reconcileCommit', () => {
  it('counts saved vs failed and returns the rows that failed (for retry)', () => {
    const r = rows(3);
    const results = [{ uploaded: true, remoteId: 'a' }, { skipped: 'insert-error' }, { uploaded: true, remoteId: 'c' }];
    const s = reconcileCommit(r, results);
    expect(s.total).toBe(3);
    expect(s.saved).toBe(2);
    expect(s.failed).toBe(1);
    expect(s.failedRows).toEqual([r[1]]);
    expect(s.remoteIds).toEqual({ r0: 'a', r2: 'c' });
    expect(s.offline).toBe(false);
  });
  it('flags OFFLINE when every row skipped because sync is off (not a failure)', () => {
    const s = reconcileCommit(rows(2), [{ skipped: 'signed-out' }, { skipped: 'signed-out' }]);
    expect(s.offline).toBe(true);
    expect(s.failed).toBe(0);
  });
});

describe('commitRowsToCloud', () => {
  it('awaits every upload and summarizes; a thrown upload counts as failed, never propagates', async () => {
    const r = rows(3);
    let call = 0;
    const upload = async () => { call += 1; if (call === 2) throw new Error('socket'); return { uploaded: true, remoteId: `id${call}` }; };
    const { summary } = await commitRowsToCloud(r, upload);
    expect(summary.saved).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.failedRows).toEqual([r[1]]);
  });
});

describe('commitWithRepair — the self-heal', () => {
  it('re-uploads the rows that missed on pass 1 and lands them on pass 2', async () => {
    const r = rows(3);
    // r1 fails the first time it is seen, succeeds on retry; r0/r2 succeed first try.
    const seen = new Set();
    const upload = async (row) => {
      if (row.id === 'r1' && !seen.has('r1')) { seen.add('r1'); return { skipped: 'insert-error' }; }
      return { uploaded: true, remoteId: `id-${row.id}` };
    };
    const summary = await commitWithRepair(r, upload, { passes: 1 });
    expect(summary.saved).toBe(3);      // all landed after the repair pass
    expect(summary.failed).toBe(0);
    expect(summary.remoteIds.r1).toBe('id-r1');
  });
  it('reports the rows that STILL fail after the repair passes (visible, not hidden)', async () => {
    const r = rows(2);
    const upload = async () => ({ skipped: 'insert-error' }); // always fails
    const summary = await commitWithRepair(r, upload, { passes: 2 });
    expect(summary.saved).toBe(0);
    expect(summary.failed).toBe(2);
  });
  it('does not thrash retries when offline (sync off)', async () => {
    let calls = 0;
    const upload = async () => { calls += 1; return { skipped: 'signed-out' }; };
    const summary = await commitWithRepair(rows(3), upload, { passes: 3 });
    expect(summary.offline).toBe(true);
    expect(calls).toBe(3); // one pass only — did not retry an offline batch
  });
});

describe('commitReadout', () => {
  it('all saved', () => { expect(commitReadout({ total: 5, saved: 5, failed: 0 })).toMatch(/all 5/); });
  it('partial names the gap', () => { expect(commitReadout({ total: 5, saved: 3, failed: 2 })).toMatch(/3 of 5.*2 did not upload/); });
  it('offline says local', () => { expect(commitReadout({ total: 5, saved: 0, failed: 0, offline: true })).toMatch(/locally.*sign in/i); });
  it('empty is blank', () => { expect(commitReadout({ total: 0 })).toBe(''); });
});
