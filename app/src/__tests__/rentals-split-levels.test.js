// =============================================================================
// Every room can do what he had to do by hand — the split control, gated
// =============================================================================
// Darrell, 2026-08-28: "all rooms should be able to do what I had to do... the
// system needs to support 1 room 2 beds... or 1 room 1 bed... or whole unit."
//
// He built 805 N Prospect Apt 4's two beds by pressing "Split into doors" on a
// unit and typing "Room 1 - Bed A" and "Room 1- Bed B" himself. Then the
// control DISAPPEARED from what he had made: it required
// `!building && (units > 1 || multi-family)`, and every door the split creates
// belongs to a building. So a room could never become beds.
//
// These read the real component. The model has its own tests
// (rentable-levels.test.js); this file is about the SURFACE — the board, not
// the model, which is the lesson from shipping the showcase ordering with no
// button attached to it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = () => readFileSync(join(process.cwd(), 'src/components/Rentals.jsx'), 'utf8');
// Comments explain the very conditions under test by name, so they are stripped
// before matching — a lesson from a guard that passed on its own prose.
const code = () => src().replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the split control reaches every door that has something inside it', () => {
  it('no longer hides itself from a door that belongs to a building', () => {
    // The exact condition that made a room a dead end.
    const s = code();
    expect(s).not.toMatch(/!\(r\.building \|\| ''\)\.trim\(\) && !isPersonalProp/);
  });

  it('offers itself on the basis of what the door can actually split into', () => {
    const s = code();
    expect(s).toMatch(/!isPersonalProp\(r\) && splitTarget\(r\)/);
  });

  it('still never offers to split our own home', () => {
    const s = code();
    const btn = s.slice(s.indexOf('splitTarget(r) &&'));
    expect(s).toMatch(/!isPersonalProp\(r\) && splitTarget\(r\)/);
    expect(btn.slice(0, 400)).toContain('openSplit');
  });

  it('names what it will make rather than always saying "doors"', () => {
    const s = code();
    expect(s).toMatch(/Split into \$\{LEVEL_PLURAL\[splitTarget\(r\)\]\}/);
  });
});

describe('the panel asks the two questions he was answering by hand', () => {
  const panel = () => {
    const s = code();
    const start = s.indexOf('splitFor && splitFor.id === r.id && (');
    return s.slice(start, s.indexOf('Cancel</button>', start));
  };

  it('asks what is being rented — units, rooms or beds', () => {
    expect(panel()).toContain('What are you renting out?');
    expect(panel()).toMatch(/reshapeSplit\(\{ level: e\.target\.value/);
  });

  it('asks how many beds are in each room, which is the "1 room 2 beds" shape', () => {
    const p = panel();
    expect(p).toContain('Beds in each room');
    expect(p).toMatch(/bedsPerRoom: parseInt/);
  });

  it('offers "the room itself" as well as separately-rented beds', () => {
    // "1 room 1 bed" must not force a pointless bed layer under every room.
    expect(panel()).toContain('The room itself');
    expect(panel()).toContain('each rented separately');
  });

  it('shows the beds question only when rooms are being made', () => {
    expect(panel()).toMatch(/splitFor\.level === 'room' && \(/);
  });

  it('states what pressing the button will create, before it is pressed', () => {
    expect(panel()).toContain('describeSplit(planSplit(');
  });
});

describe('the structure is written onto every door, not just the labels', () => {
  const confirm = () => {
    const s = code();
    const i = s.indexOf('const confirmSplit');
    return s.slice(i, s.indexOf('};', s.indexOf('setSplitFor(null)', i)));
  };

  it('stamps the level and the room on the door that is kept', () => {
    const c = confirm();
    expect(c).toMatch(/rentableLevel: shape\(0\)\.level/);
    expect(c).toMatch(/roomLabel: shape\(0\)\.roomLabel/);
  });

  it('stamps them on every door it creates too', () => {
    const c = confirm();
    expect(c).toMatch(/rentableLevel: shape\(i \+ 1\)\.level/);
    expect(c).toMatch(/roomLabel: shape\(i \+ 1\)\.roomLabel/);
  });

  it('still keeps the tenant, rent and records on the door that is kept', () => {
    // The existing behaviour, and it is right — a split must not orphan the
    // history of the thing being split.
    expect(confirm()).toMatch(/updateRental\(base\.id/);
    expect(confirm()).toMatch(/units: 1/);
  });
});

describe('a label the landlord has typed is his', () => {
  it('re-proposes labels on a shape change without overwriting his edits', () => {
    // Re-deriving over his typing is what made him do this by hand the first
    // time; the reshape keeps any label that differs from what was proposed.
    const s = code();
    const i = s.indexOf('const reshapeSplit');
    const fn = s.slice(i, s.indexOf('const setSplitCount', i));
    expect(fn).toContain('prior');
    expect(fn).toMatch(/sp\.labels\[i\] !== prior\[i\]/);
  });
});

describe('the structure leaves the phone', () => {
  const sync = () => readFileSync(join(process.cwd(), 'src/lib/rentals-sync.js'), 'utf8');

  it('writes the unit label, which the table has always had a column for', () => {
    expect(sync()).toMatch(/unit:\s+item\.unitLabel/);
  });

  it('writes the building, the room and the level (0160)', () => {
    const s = sync();
    expect(s).toMatch(/building_label:\s+item\.building/);
    expect(s).toMatch(/room_label:\s+item\.roomLabel/);
    expect(s).toMatch(/rentable_level:/);
  });

  it('sends NULL rather than guessing a level nobody has stated', () => {
    // Twelve doors carry no level. Writing 'unit' for them would turn an honest
    // silence into a claim (DR-0076 §8).
    expect(sync()).toMatch(/RENTABLE_LEVELS\.has\(item\.rentableLevel\) \? item\.rentableLevel : null/);
  });

  it('reads them back, so a second device sees the nesting', () => {
    const s = sync();
    expect(s).toMatch(/unitLabel:\s+row\.unit/);
    expect(s).toMatch(/building:\s+row\.building_label/);
    expect(s).toMatch(/roomLabel:\s+row\.room_label/);
  });

  it('never lets a blank remote value erase a label held only locally', () => {
    // The twelve existing doors hold their labels on the device until they are
    // written; a row that simply has not synced yet must not flatten them.
    const s = sync();
    expect(s).toContain('STRUCTURE_FIELDS');
    expect(s).toMatch(/for \(const f of STRUCTURE_FIELDS\) if \(remote\[f\]\) next\[f\] = remote\[f\]/);
  });
});
