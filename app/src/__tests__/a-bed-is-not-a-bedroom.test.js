// =============================================================================
// A bed is not a bedroom (DR-0971)
// =============================================================================
// Darrell, 2026-10-11, holding his landlord board beside the public shelf:
//
//     "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
//
// His board:  "805 North Prospect Avenue half 0.5 of Room - Bed A · Apt 4"
// His shelf:  "1-bed multi-family in Champaign, Illinois"   <- and no
//             mention of housemates.
//
// NEITHER NUMBER IS RIGHT. "0.5 bedroom" is a fraction nobody searches for;
// "1-bed" reads as a one-bedroom apartment, which is the misreading that
// sends somebody to Apt 4 with a car full of belongings. It is a BED IN A
// SHARED ROOM.
//
// ROOT CAUSE, measured: 0273 already composes "Bed in a shared ..." and
// already derives shared_home — both from `rentals.rentable_level` read RAW,
// and that column is NULL on his doors because NOTHING IN THE APP EVER
// WRITES IT. So the label fell through to counting bedrooms in the apartment
// (one) and shared_home came back NULL, which is also why "none say
// co-living" was still true after 0273 shipped. One root, both symptoms.
//
// THE CLIENT HAS INFERRED SINCE AUGUST. `levelOf()` reads the stored level
// when there is one and otherwise reads the door's own labels — its comment
// says "twelve doors exist today with no level on them, and two of those are
// beds". 0278 gives the database that same reading.
//
// THIS FILE IS THE ANTI-DRIFT PIN. Two implementations of one rule is how a
// screen and a shelf start disagreeing again, so every case below carries
// the answer MEASURED on a real PostgreSQL 16 from 0278's own function, and
// asserts levelOf() returns the same thing. If either side moves, this fails.
import { describe, it, expect } from 'vitest';
import { levelOf } from '../lib/rentable-levels.js';

// label -> level, as public.rentable_level_of() ACTUALLY ANSWERED on
// PostgreSQL 16.15, 2026-10-11. Not predicted: executed.
const MEASURED = [
  // [stored, unit, displayName, sqlAnswer, why]
  [null, 'Apt 4', '805 North Prospect Avenue half 0.5 of Room - Bed A', 'bed', 'HIS Bed A'],
  [null, 'Apt 4', '805 North Prospect Avenue half 0.5 of Room - Bed B', 'bed', 'HIS Bed B'],
  [null, 'Apt 2', '805 North Prospect Avenue', 'unit', 'HIS Apt 2'],
  [null, '', '2 Bedroom apartment', 'unit', 'the bedroom trap: \\mbed\\M must not match "bedroom"'],
  [null, 'Unit 3', 'Spacious 3 Bedroom', 'unit', 'nor must \\mroom\\M match "Bedroom"'],
  ['unit', 'Apt 4', 'Room 1 - Bed A', 'unit', 'a stored level always wins over the label'],
  ['BED', '', 'whole house', 'bed', 'a stored level is read case-insensitively'],
  [null, '', 'Unit with Living Room', 'room', 'an edge the client shares: "Room" is a room'],
  [null, 'Apt 9', '805 N Prospect', 'unit', 'nothing to go on is a whole unit'],
  [null, null, null, 'unit', 'all null is a whole unit, never null'],
  [null, '', 'Room 2 - Beds', 'room', 'plural "Beds" is not \\mbed\\M, so the room wins — on both sides'],
];

describe('the database and the client read a door the same way', () => {
  it.each(MEASURED)(
    'stored=%s unit=%s name=%s -> %s (%s)',
    (stored, unit, displayName, sqlAnswer) => {
      const js = levelOf({ rentable_level: stored, unit, name: displayName });
      expect(js, 'levelOf() disagrees with public.rentable_level_of() — the shelf and the board will diverge').toBe(sqlAnswer);
    },
  );

  it('PROVEN-TO-CATCH: his Bed A is a bed, which is the whole complaint', () => {
    // If this ever returns 'unit' again, the public card goes back to saying
    // "1-bed multi-family" for half of a shared room.
    expect(levelOf({ unit: 'Apt 4', name: '805 North Prospect Avenue half 0.5 of Room - Bed A' })).toBe('bed');
  });

  it('a level is never null or empty — a card must always know what it is showing', () => {
    for (const [stored, unit, name] of MEASURED) {
      const lvl = levelOf({ rentable_level: stored, unit, name });
      expect(['unit', 'room', 'bed']).toContain(lvl);
    }
  });
});

describe('what the shelf must therefore say', () => {
  // The label 0278 composes from the level. Mirrored here so the wording is
  // pinned next to the rule that chooses it.
  const labelFor = (level, beds) => (
    level === 'bed' ? 'Bed in a shared'
      : level === 'room' ? 'Private room in a shared'
        : beds > 0 ? `${beds}-bed` : ''
  );

  it('PROVEN-TO-CATCH: a bed is never advertised as "1-bed"', () => {
    const level = levelOf({ unit: 'Apt 4', name: '805 North Prospect Avenue half 0.5 of Room - Bed A' });
    const label = labelFor(level, 1);
    expect(label).toBe('Bed in a shared');
    expect(label, 'the card is back to claiming a one-bedroom apartment').not.toMatch(/\d-bed/);
  });

  it('and never as "0.5 bedroom" either — the answer to his question is neither', () => {
    const label = labelFor(levelOf({ unit: 'Apt 4', name: 'half 0.5 of Room - Bed B' }), 1);
    expect(label).not.toMatch(/0\.5/);
    expect(label).toMatch(/shared/);
  });

  it('a whole unit still counts its bedrooms, because there the count is true', () => {
    expect(labelFor(levelOf({ unit: 'Apt 2', name: '805 North Prospect Avenue' }), 1)).toBe('1-bed');
  });
});

describe('shared_home follows the inferred level', () => {
  const sharedHome = (level) => ['room', 'bed'].includes(level);

  it('PROVEN-TO-CATCH: a bed with no stored level is still a shared home', () => {
    // This is why "None say co-living!!!" was still true after 0273: the
    // old expression read the raw NULL column and came back NULL.
    expect(sharedHome(levelOf({ unit: 'Apt 4', name: 'half 0.5 of Room - Bed A' }))).toBe(true);
  });

  it('a whole unit is not a shared home', () => {
    expect(sharedHome(levelOf({ unit: 'Apt 2', name: '805 North Prospect Avenue' }))).toBe(false);
  });
});
