// The storage gate (owner 2026-11-24, mandatory): no paid picture is bought until
// every picture already paid for is verified on the NAS. Each case below is a
// way storage can be unproven; every one must PAUSE. Proven to catch: with the
// gate's checks removed, the paused cases open and these tests fail.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { storageGate, paidPictureShas, STALE_HOURS } from '../../scripts/learn-presentation/lib/storage-gate.mjs';

const NOW = Date.parse('2026-11-24T20:00:00Z');
const verdict = (o = {}) => JSON.stringify({ at: '2026-11-24T19:00:00Z', from_run: '1', expected: 180, present_of_expected: 180, missing: 0, ...o });

describe('storage gate: paid pictures wait for a verified NAS backup', () => {
  it('opens only when the NAS has verified every paid picture', () => {
    const g = storageGate({ paid: 180, verdict: verdict(), nowMs: NOW });
    expect(g.open).toBe(true);
  });

  it('pauses when the NAS has never reported', () => {
    expect(storageGate({ paid: 150, verdict: '', nowMs: NOW }).open).toBe(false);
  });

  it('pauses when the verdict is unreadable or has no time or counts', () => {
    expect(storageGate({ paid: 1, verdict: '{not json', nowMs: NOW }).open).toBe(false);
    expect(storageGate({ paid: 1, verdict: verdict({ at: '' }), nowMs: NOW }).open).toBe(false);
    expect(storageGate({ paid: 1, verdict: verdict({ present_of_expected: 'x' }), nowMs: NOW }).open).toBe(false);
  });

  it('pauses when any paid picture is missing on the NAS', () => {
    const g = storageGate({ paid: 180, verdict: verdict({ missing: 3, present_of_expected: 177 }), nowMs: NOW });
    expect(g.open).toBe(false);
    expect(g.reason).toMatch(/missing 3/);
  });

  it('pauses when the last batch has not reached the NAS yet', () => {
    const g = storageGate({ paid: 380, verdict: verdict(), nowMs: NOW });
    expect(g.open).toBe(false);
    expect(g.reason).toMatch(/180 of the 380/);
  });

  it('pauses on a stale verdict', () => {
    const old = new Date(NOW - (STALE_HOURS + 1) * 3600000).toISOString();
    expect(storageGate({ paid: 180, verdict: verdict({ at: old }), nowMs: NOW }).open).toBe(false);
  });

  it('does not gate a free provider (nothing is paid for)', () => {
    expect(storageGate({ paid: 999, verdict: '', costCents: 0, nowMs: NOW }).open).toBe(true);
  });
});

describe('paidPictureShas: the pictures the ledger says were bought', () => {
  it('counts lesson pictures, kept v1 pictures and topic covers, once each', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-'));
    writeFileSync(
      join(dir, 'records.json'),
      JSON.stringify({
        a: { image: { sha256: 'AA' }, imageV1: { sha256: 'bb' } },
        b: { image: { sha256: 'aa' } }, // same bytes as a: one picture
        c: { status: 'review' }, // titled, no picture yet
      })
    );
    writeFileSync(join(dir, 'topics.json'), JSON.stringify({ faith: { image: { sha256: 'cc' } } }));
    expect([...paidPictureShas(dir)].sort()).toEqual(['aa', 'bb', 'cc']);
  });

  it('is empty, never an error, when the state has no files', () => {
    expect(paidPictureShas(mkdtempSync(join(tmpdir(), 'gate-'))).size).toBe(0);
  });
});
