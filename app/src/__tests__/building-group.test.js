import { describe, it, expect } from 'vitest';
import {
  buildingKeyOf, unitLabelOf, buildingRollup, groupDoorsByBuilding,
  doorCountOf, buildRestoreUnits,
} from '../lib/building-group.js';

// REGRESSION GUARD (805 N Prospect, 2026-07-01): a four-plex must stay FOUR
// separate doors grouped under one building — never collapse to a single door.
// These are proven-to-catch: they assert counts that MOVE with the records, so
// a regression that merges units into one door fails the suite.

const door = (over = {}) => ({
  id: over.id || 'r',
  name: over.name || 'Some Address',
  entityId: 'e-poeprops',
  rent: 1000,
  actual: 1000,
  status: 'paying',
  mortgage: { balance: 70000, monthlyPI: 442 },
  units: 1,
  ...over,
});

const fourplex = () => [
  door({ id: 'r4', name: '240 Cedar Ln Apt 1', building: '240 Cedar Ln', unitLabel: 'Apt 1', rent: 850 }),
  door({ id: 'r5', name: '240 Cedar Ln Apt 2', building: '240 Cedar Ln', unitLabel: 'Apt 2', rent: 950 }),
  door({ id: 'r6', name: '240 Cedar Ln Apt 3', building: '240 Cedar Ln', unitLabel: 'Apt 3', rent: 900 }),
  door({ id: 'r7', name: '240 Cedar Ln Apt 4', building: '240 Cedar Ln', unitLabel: 'Apt 4', rent: 1000 }),
];

describe('buildingKeyOf / unitLabelOf', () => {
  it('groups on a trimmed building key; blank => standalone', () => {
    expect(buildingKeyOf({ building: '  805 N Prospect ' })).toBe('805 N Prospect');
    expect(buildingKeyOf({ building: '' })).toBe(null);
    expect(buildingKeyOf({})).toBe(null);
  });
  it('prefers an explicit unitLabel, else derives from the name', () => {
    expect(unitLabelOf({ unitLabel: 'Apt 3' })).toBe('Apt 3');
    expect(unitLabelOf({ name: '240 Cedar Ln Apt 4' })).toBe('Apt 4');
    expect(unitLabelOf({ name: '1402 Maple St' })).toBe('1402 Maple St');
  });
});

describe('groupDoorsByBuilding — the regression guard', () => {
  it('a four-plex stays FOUR doors under ONE building (does not collapse)', () => {
    const entries = groupDoorsByBuilding(fourplex());
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('building');
    expect(entries[0].building).toBe('240 Cedar Ln');
    // The four apartments remain four distinct doors — the whole point.
    expect(entries[0].units).toHaveLength(4);
    expect(entries[0].rollup.doorCount).toBe(4);
    expect(entries[0].rollup.monthlyRent).toBe(850 + 950 + 900 + 1000);
  });

  it('door count is preserved end to end (4 records => 4 doors)', () => {
    expect(doorCountOf(fourplex())).toBe(4);
  });

  it('a lone door renders standalone, not as a building of one', () => {
    const entries = groupDoorsByBuilding([door({ id: 'r1', name: '1402 Maple St' })]);
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('single');
    expect(entries[0].rental.id).toBe('r1');
  });

  it('a building with a single unit stays a single (needs 2+ to group)', () => {
    const entries = groupDoorsByBuilding([door({ id: 'r1', building: 'Solo Bldg' })]);
    expect(entries[0].type).toBe('single');
  });

  it('preserves input order — a building appears at its first unit', () => {
    const list = [
      door({ id: 'a', name: '1402 Maple St' }),
      door({ id: 'r4', building: '240 Cedar Ln', name: 'Apt 1' }),
      door({ id: 'b', name: '312 Willow Ln' }),
      door({ id: 'r5', building: '240 Cedar Ln', name: 'Apt 2' }),
    ];
    const entries = groupDoorsByBuilding(list);
    // building emitted at index 1 (first Cedar unit), between the two singles.
    expect(entries.map((e) => e.type)).toEqual(['single', 'building', 'single']);
    expect(entries[1].units.map((u) => u.id)).toEqual(['r4', 'r5']);
  });

  it('mixed buildings + singles all survive', () => {
    const list = [...fourplex(), door({ id: 'r1', name: '1402 Maple St' })];
    const entries = groupDoorsByBuilding(list);
    expect(doorCountOf(list)).toBe(5);
    expect(entries.filter((e) => e.type === 'building')).toHaveLength(1);
    expect(entries.filter((e) => e.type === 'single')).toHaveLength(1);
  });
});

describe('buildRestoreUnits — the in-app restore control', () => {
  it('splits a collapsed door into N standalone doors sharing the building', () => {
    let n = 0;
    const base = door({ id: 'r-805', name: '805 N Prospect (multi-unit)', address: '805 N Prospect', building: '805 N Prospect' });
    const doors = buildRestoreUnits(base, ['Apt 2', 'Apt 3', 'Apt 4'], () => `r-new-${++n}`);
    expect(doors).toHaveLength(3);
    // Each is its own door (units:1) under the same building — no collapse.
    for (const d of doors) {
      expect(d.building).toBe('805 N Prospect');
      expect(d.units).toBe(1);
      expect(d.entityId).toBe('e-poeprops');
    }
    expect(doors.map((d) => d.unitLabel)).toEqual(['Apt 2', 'Apt 3', 'Apt 4']);
    // With the base kept as Apt 1, the building would read 4 doors total.
    expect(1 + doorCountOf(doors)).toBe(4);
  });
});

describe('buildingRollup', () => {
  it('sums units + rent + debt across the group', () => {
    const r = buildingRollup(fourplex());
    expect(r.doorCount).toBe(4);
    expect(r.monthlyRent).toBe(3700);
    expect(r.mortgageDebt).toBe(70000 * 4);
  });
});
