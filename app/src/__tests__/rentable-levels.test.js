// =============================================================================
// A door says what it is — whole unit, room, or bed
// =============================================================================
// Pinned against what Darrell actually built by hand (805 N Prospect Apt 4,
// "Room 1- Bed B" and "Room 1 - Bed A"), because the point of this module is
// that he never has to type those again.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  LEVELS, LEVEL_LABEL, levelOf, splitTarget, canSplit, refuseSplit,
  bedSuffix, defaultLabels, layoutRooms, planSplit, describeSplit, nestByRoom,
} from '../lib/rentable-levels.js';

describe('a door knows what it is', () => {
  it('reads the stored level when it has one', () => {
    expect(levelOf({ rentableLevel: 'bed' })).toBe('bed');
    expect(levelOf({ rentable_level: 'room' })).toBe('room');
  });

  it('infers a bed from the label on the twelve doors that predate the field', () => {
    // His real rows. Nothing has a level yet, and two of them ARE beds —
    // defaulting those to "whole unit" would offer him a Rooms control on a bed.
    expect(levelOf({ name: '805 North Prospect Avenue Apt 4', unitLabel: 'Room 1 - Bed A' })).toBe('bed');
    expect(levelOf({ name: 'Room 1- Bed B' })).toBe('bed');
  });

  it('infers a room from a room label, and a unit from everything else', () => {
    expect(levelOf({ unitLabel: 'Room 2' })).toBe('room');
    expect(levelOf({ name: '805 North Prospect Avenue Apt 2', unitLabel: 'Apt 2' })).toBe('unit');
    expect(levelOf({ name: '1003 Koehn Dr' })).toBe('unit');
  });

  it('never throws on junk, and calls it a unit', () => {
    for (const junk of [null, undefined, 0, '', [], 'a string']) {
      expect(LEVELS).toContain(levelOf(junk));
    }
  });
});

describe('splitting is the same move at every level', () => {
  it('a unit splits into rooms and a room splits into beds', () => {
    expect(splitTarget({ rentableLevel: 'unit' })).toBe('room');
    expect(splitTarget({ rentableLevel: 'room' })).toBe('bed');
  });

  it('a bed is the floor, and says why rather than going quiet', () => {
    const bed = { rentableLevel: 'bed' };
    expect(canSplit(bed)).toBe(false);
    expect(splitTarget(bed)).toBeNull();
    expect(refuseSplit(bed)).toMatch(/smallest thing you can rent/i);
  });

  it('gives no refusal sentence for a door that CAN split', () => {
    expect(refuseSplit({ rentableLevel: 'room' })).toBeNull();
  });
});

describe('the labels are his, not a tidier scheme of mine', () => {
  it('names beds the way he typed them', () => {
    expect(defaultLabels('bed', 2, { roomLabel: 'Room 1' }))
      .toEqual(['Room 1 - Bed A', 'Room 1 - Bed B']);
  });

  it('leads a bed with its room, so it still says where it is when read alone', () => {
    const [first] = defaultLabels('bed', 1, { roomLabel: 'Room 3' });
    expect(first).toBe('Room 3 - Bed A');
  });

  it('falls back to the unit label, then to Room 1, rather than to nothing', () => {
    expect(defaultLabels('bed', 1, { unitLabel: 'Apt 4' })[0]).toBe('Apt 4 - Bed A');
    expect(defaultLabels('bed', 1, {})[0]).toBe('Room 1 - Bed A');
  });

  it('numbers past Z instead of wrapping to AA', () => {
    expect(bedSuffix(0)).toBe('Bed A');
    expect(bedSuffix(25)).toBe('Bed Z');
    expect(bedSuffix(26)).toBe('Bed 27');
  });

  it('still makes Apt 1..N for whole units', () => {
    expect(defaultLabels('unit', 3)).toEqual(['Apt 1', 'Apt 2', 'Apt 3']);
  });
});

describe('the shapes he named: 1 room 2 beds, 1 room 1 bed, whole unit', () => {
  it('two rooms of two beds is four rentable doors, each naming its room', () => {
    expect(layoutRooms(2, 2)).toEqual([
      { level: 'bed', label: 'Room 1 - Bed A', roomLabel: 'Room 1' },
      { level: 'bed', label: 'Room 1 - Bed B', roomLabel: 'Room 1' },
      { level: 'bed', label: 'Room 2 - Bed A', roomLabel: 'Room 2' },
      { level: 'bed', label: 'Room 2 - Bed B', roomLabel: 'Room 2' },
    ]);
  });

  it('one bed per room leaves the ROOM as the rentable thing', () => {
    // Splitting a room into a single bed adds nesting that rents nothing extra
    // and only makes the board longer.
    expect(layoutRooms(3, 1)).toEqual([
      { level: 'room', label: 'Room 1', roomLabel: 'Room 1' },
      { level: 'room', label: 'Room 2', roomLabel: 'Room 2' },
      { level: 'room', label: 'Room 3', roomLabel: 'Room 3' },
    ]);
  });

  it('treats a missing or absurd bed count as one per room', () => {
    expect(layoutRooms(2, 0).every((x) => x.level === 'room')).toBe(true);
    expect(layoutRooms(2).every((x) => x.level === 'room')).toBe(true);
  });
});

describe('the plan is shown before anything is created', () => {
  const apt4 = {
    id: 'r-apt4', name: '805 North Prospect Avenue Apt 4',
    address: '805 North Prospect Avenue', building: '805 North Prospect Avenue',
    unitLabel: 'Apt 4', rentableLevel: 'unit',
  };

  it('rebuilds exactly what he made by hand', () => {
    const plan = planSplit({ ...apt4, rentableLevel: 'room', roomLabel: 'Room 1' }, { level: 'bed', count: 2 });
    expect(plan.ok).toBe(true);
    expect(plan.children.map((c) => c.label)).toEqual(['Room 1 - Bed A', 'Room 1 - Bed B']);
    expect(plan.children.every((c) => c.level === 'bed')).toBe(true);
  });

  it('turns a unit into rooms-with-beds in one pass', () => {
    const plan = planSplit(apt4, { level: 'room', count: 2, bedsPerRoom: 2 });
    expect(plan.children).toHaveLength(4);
    expect(describeSplit(plan)).toContain('2 rooms, 4 beds');
  });

  it('keeps the base door as the FIRST child, with its tenant and records', () => {
    const plan = planSplit(apt4, { level: 'room', count: 3 });
    expect(plan.basePatch.unitLabel).toBe('Room 1');
    expect(plan.basePatch.rentableLevel).toBe('room');
    expect(plan.basePatch.units).toBe(1);
    expect(plan.rest).toHaveLength(2);           // the other two are created
    expect(plan.children).toHaveLength(3);
  });

  it('refuses a split of one, which changes nothing', () => {
    const plan = planSplit(apt4, { level: 'room', count: 1 });
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe('too-few');
    expect(describeSplit(plan)).toMatch(/changes nothing/i);
  });

  it('refuses to split a bed, and says why', () => {
    const plan = planSplit({ ...apt4, rentableLevel: 'bed' }, {});
    expect(plan.ok).toBe(false);
    expect(describeSplit(plan)).toMatch(/smallest thing you can rent/i);
  });

  it('refuses when there is no building to group the doors under', () => {
    const plan = planSplit({ rentableLevel: 'unit' }, { level: 'room', count: 2 });
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe('no-building');
  });

  it('defaults the target to whatever the door splits into', () => {
    expect(planSplit(apt4, { count: 2 }).target).toBe('room');
    expect(planSplit({ ...apt4, rentableLevel: 'room' }, { count: 2 }).target).toBe('bed');
  });
});

describe('the board can show the nesting it actually has', () => {
  it('gathers beds under their room and leaves other doors standing alone', () => {
    const { rooms, standalone } = nestByRoom([
      { id: 'a', rentableLevel: 'bed', roomLabel: 'Room 1' },
      { id: 'b', rentableLevel: 'bed', roomLabel: 'Room 1' },
      { id: 'c', rentableLevel: 'bed', roomLabel: 'Room 2' },
      { id: 'd', rentableLevel: 'unit', unitLabel: 'Apt 2' },
    ]);
    expect(rooms).toHaveLength(2);
    expect(rooms[0].room).toBe('Room 1');
    expect(rooms[0].beds).toHaveLength(2);
    expect(standalone).toHaveLength(1);
  });

  it('does not lose a bed that names no room', () => {
    const { rooms, standalone } = nestByRoom([{ id: 'x', rentableLevel: 'bed' }]);
    expect(rooms).toHaveLength(0);
    expect(standalone).toHaveLength(1);   // visible, not swallowed
  });

  it('survives an empty or junk list', () => {
    expect(nestByRoom().rooms).toEqual([]);
    expect(nestByRoom([null, undefined]).standalone).toHaveLength(2);
  });
});

describe('the vocabulary is stated once', () => {
  it('every level has a plain word for the surfaces', () => {
    for (const l of LEVELS) expect(LEVEL_LABEL[l]).toBeTruthy();
  });
});
