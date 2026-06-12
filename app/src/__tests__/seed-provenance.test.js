// Seed provenance — 2026-06-12 ("we have original data, why don't we know
// the difference?"). SEED_DATA rows are aspirational scaffolding: they must
// be detectable (so they never upload to the family's cloud tables and drop
// from display once real rows exist), and rows the family creates must never
// be misclassified as seed.
import { describe, it, expect } from 'vitest';
import { SEED_IDS, notSeedRow } from '../poe-financial-mvp-v28.jsx';

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
