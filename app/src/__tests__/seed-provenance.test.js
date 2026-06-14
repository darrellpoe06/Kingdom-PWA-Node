// Seed provenance — 2026-06-12 ("we have original data, why don't we know
// the difference?"). SEED_DATA rows are aspirational scaffolding: they must
// be detectable (so they never upload to the family's cloud tables and drop
// from display once real rows exist), and rows the family creates must never
// be misclassified as seed.
import { describe, it, expect } from 'vitest';
import { SEED_IDS, notSeedRow, isRealRow, stripSeedScaffolding } from '../poe-financial-mvp-v28.jsx';

describe('seed provenance', () => {
  it('the seed world is non-empty and detected', () => {
    expect(SEED_IDS.size).toBeGreaterThan(20);
    // Every id literally present in SEED_DATA is classified as seed.
    for (const id of SEED_IDS) {
      expect(notSeedRow({ id })).toBe(false);
    }
  });

  it('family-created rows (timestamp ids) are never classified as seed', () => {
    expect(notSeedRow({ id: `inc-${Date.now()}` })).toBe(true);
    expect(notSeedRow({ id: `pr-${Date.now()}` })).toBe(true);
  });

  it('cloud rows (UUID ids) are never classified as seed', () => {
    expect(notSeedRow({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })).toBe(true);
  });

  it('rows without a string id pass through untouched', () => {
    expect(notSeedRow({})).toBe(true);
    expect(notSeedRow(null)).toBe(true);
  });
});

describe('isRealRow — signed-in clean slate (never drops a synced row)', () => {
  const seedId = [...SEED_IDS][0];
  it('keeps a SYNCED row even if it still carries a seed id (e.g. a real entity)', () => {
    expect(isRealRow({ id: seedId, remoteUuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })).toBe(true);
  });
  it('drops a pure local seed row (seed id, never synced)', () => {
    expect(isRealRow({ id: seedId })).toBe(false);
  });
  it('keeps a family-entered row (timestamp id, not yet synced)', () => {
    expect(isRealRow({ id: `pr-${Date.now()}` })).toBe(true);
  });
});

describe('stripSeedScaffolding', () => {
  const seedId = [...SEED_IDS][0];
  it('removes pure seed from lists; preserves synced + user rows, nested rentals, and non-arrays', () => {
    const out = stripSeedScaffolding({
      accounts: [{ id: seedId }, { id: 'acct-123' }],
      entities: [{ id: seedId, remoteUuid: 'uuid-1' }],
      inflows: { rentals: [{ id: seedId }, { id: seedId, remoteUuid: 'uuid-2' }] },
      meta: { theme: 'midnight' },
      numericSyncVerifiedAt: '2026-06-13T00:00:00Z',
    });
    expect(out.accounts.map(a => a.id)).toEqual(['acct-123']);
    expect(out.entities.map(e => e.id)).toEqual([seedId]);          // synced entity kept
    expect(out.inflows.rentals.length).toBe(1);                      // only the synced rental kept
    expect(out.meta).toEqual({ theme: 'midnight' });                 // non-array untouched
    expect(out.numericSyncVerifiedAt).toBe('2026-06-13T00:00:00Z');  // scalar untouched
  });
});
