// @vitest-environment jsdom
//
// Proven-to-catch (review, 2026-07-18): the entity TYPE must survive sync. The
// old toRow flattened every non-'business' type to 'personal', so a family member
// who set an entity to nonprofit/trust/joint/other silently lost that tax
// classification on the next sync (the DB CHECK only allowed personal/business
// until migration 0106 widened it). This pins the full set through the normalizer.
import { describe, it, expect } from 'vitest';
import { normalizeEntityType, ENTITY_TYPES_SYNCED } from '../lib/entities-sync.js';

describe('normalizeEntityType — all six UI types survive sync (no silent flatten)', () => {
  it('passes every offered type through unchanged', () => {
    for (const t of ['personal', 'business', 'nonprofit', 'trust', 'joint', 'other']) {
      expect(normalizeEntityType(t)).toBe(t);
    }
  });
  it('nonprofit/trust/joint/other are NOT flattened to personal (the old bug)', () => {
    expect(normalizeEntityType('nonprofit')).not.toBe('personal');
    expect(normalizeEntityType('trust')).not.toBe('personal');
    expect(normalizeEntityType('joint')).not.toBe('personal');
    expect(normalizeEntityType('other')).not.toBe('personal');
  });
  it('an unknown/garbage value falls back to personal so the insert never breaks', () => {
    expect(normalizeEntityType('llc-scorp')).toBe('personal');
    expect(normalizeEntityType('')).toBe('personal');
    expect(normalizeEntityType(undefined)).toBe('personal');
  });
  it('the synced set matches the six the UI offers', () => {
    expect(ENTITY_TYPES_SYNCED).toEqual(['personal', 'business', 'nonprofit', 'trust', 'joint', 'other']);
  });
});
