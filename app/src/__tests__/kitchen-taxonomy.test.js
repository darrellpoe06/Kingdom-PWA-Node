// =============================================================================
// kitchen-taxonomy.test — the chef vocabulary maps stored ids to readable labels
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  KITCHEN_CATEGORIES, STORAGE_AREAS, KITCHEN_UNITS, ALL_KITCHEN_UNITS,
  categoryLabel, storageAreaLabel, modeForUnit, dimensionForUnit,
} from '../lib/kitchen-taxonomy.js';

describe('kitchen-taxonomy — catalog shape', () => {
  it('ships the standard kitchen categories with unique ids + labels', () => {
    expect(KITCHEN_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    const ids = KITCHEN_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('proteins');
    expect(ids).toContain('produce');
    expect(ids).toContain('dry-goods');
    KITCHEN_CATEGORIES.forEach((c) => expect(typeof c.label).toBe('string'));
  });

  it('ships the kitchen storage areas a count narrows to', () => {
    const ids = STORAGE_AREAS.map((a) => a.id);
    expect(ids).toContain('walk-in');
    expect(ids).toContain('freezer');
    expect(ids).toContain('dry-storage');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups units by dimension and exposes a flat list', () => {
    expect(KITCHEN_UNITS.weight).toContain('lb');
    expect(KITCHEN_UNITS.count).toContain('case');
    expect(KITCHEN_UNITS.volume).toContain('gal');
    expect(ALL_KITCHEN_UNITS).toContain('lb');
    expect(ALL_KITCHEN_UNITS).toContain('each');
    expect(ALL_KITCHEN_UNITS.length).toBe(
      KITCHEN_UNITS.count.length + KITCHEN_UNITS.weight.length + KITCHEN_UNITS.volume.length,
    );
  });
});

describe('kitchen-taxonomy — label resolution', () => {
  it('resolves a known category/area id to its label', () => {
    expect(categoryLabel('proteins')).toBe('Proteins');
    expect(storageAreaLabel('walk-in')).toBe('Walk-in Cooler');
  });
  it('falls back to the raw value for a custom/legacy id, and a friendly default for empty', () => {
    expect(categoryLabel('house-made')).toBe('house-made');
    expect(categoryLabel(null)).toBe('Uncategorized');
    expect(storageAreaLabel(null)).toBe('Unassigned');
  });
});

describe('kitchen-taxonomy — count mode + dimension', () => {
  it('defaults a weight unit to weigh-mode and everything else to unit-mode', () => {
    expect(modeForUnit('lb')).toBe('weight');
    expect(modeForUnit('OZ')).toBe('weight');
    expect(modeForUnit('each')).toBe('unit');
    expect(modeForUnit('case')).toBe('unit');
    expect(modeForUnit('gal')).toBe('unit');   // volume is tallied as a unit count
  });
  it('classifies a unit\'s dimension', () => {
    expect(dimensionForUnit('kg')).toBe('weight');
    expect(dimensionForUnit('qt')).toBe('volume');
    expect(dimensionForUnit('each')).toBe('count');
    expect(dimensionForUnit('mystery')).toBe('count');
  });
});
