// =============================================================================
// A co-living door says so (DR-0968)
// =============================================================================
// Darrell, 2026-10-11, right after settling that the apartment number decides
// what counts as one apartment: "Good... a tag for co-living?!!!"
//
// DERIVED, NEVER A CHECKBOX. In the same breath he had asked "can we make sure
// this happens each time we co-live a place?" — so a tag that appears only
// when somebody remembers to tick it is the wrong answer to the question he
// actually asked. Both signals are facts the database already holds:
//
//   * `rentable_level` — 0160 added it and the client NEVER READ IT, which is
//     why no screen could say a door is a bed or a room.
//   * having a sibling at the same apartment number — measured, not declared.
import { describe, it, expect } from 'vitest';
import { coLivingTag } from '../modules/properties/model.js';

describe('coLivingTag — from what the door already is', () => {
  it('PROVEN-TO-CATCH: a bed says so, with no sibling needed and nothing ticked', () => {
    expect(coLivingTag({ rentable_level: 'bed' }, 0)).toMatch(/co-living/i);
    expect(coLivingTag({ rentable_level: 'bed' }, 0)).toMatch(/bed/i);
  });

  it('a private room says which it is, because they are not the same offer', () => {
    const t = coLivingTag({ rentable_level: 'room' }, 0);
    expect(t).toMatch(/co-living/i);
    expect(t).toMatch(/private room/i);
  });

  it('a whole unit on its own is NOT co-living', () => {
    expect(coLivingTag({ rentable_level: 'unit' }, 0)).toBeNull();
    expect(coLivingTag({ rentable_level: null }, 0)).toBeNull();
    expect(coLivingTag({}, 0)).toBeNull();
  });

  it('PROVEN-TO-CATCH: a door with a sibling at its apartment number says so even with no level recorded', () => {
    // The half that needs no data entry at all. A whole unit that later gets
    // split starts saying "co-living" the moment its second door exists,
    // with nobody editing anything — which is what "each time we co-live a
    // place" actually requires.
    expect(coLivingTag({ rentable_level: null }, 1)).toMatch(/co-living/i);
    expect(coLivingTag({ rentable_level: null }, 1)).toMatch(/shares this apartment/i);
  });

  it('a whole unit with no siblings stays silent — it is not a shared home', () => {
    expect(coLivingTag({ rentable_level: 'unit' }, 0)).toBeNull();
  });

  it('the level wins over the count, so a bed reads as a bed not as a sharer', () => {
    expect(coLivingTag({ rentable_level: 'bed' }, 3)).toMatch(/bed/i);
  });

  it('case and spacing in the stored level do not matter', () => {
    expect(coLivingTag({ rentable_level: 'BED' }, 0)).toMatch(/bed/i);
    expect(coLivingTag({ rentable_level: 'Room' }, 0)).toMatch(/private room/i);
  });

  it('no door at all is no tag, never a crash', () => {
    expect(coLivingTag(null, 0)).toBeNull();
    expect(coLivingTag(undefined, 5)).toBeNull();
  });

  it('a nonsense sibling count is treated as none', () => {
    expect(coLivingTag({ rentable_level: null }, NaN)).toBeNull();
    expect(coLivingTag({ rentable_level: null }, undefined)).toBeNull();
  });
});

describe('the client actually reads the column it needs', () => {
  // A SOURCE PIN MUST NAME THE QUERY IT MEANS, NOT "THE FIRST ONE".
  //
  // This case first located the door list as `src.indexOf("from('rentals')")`
  // and read the next 600 characters. That passed — until DR-0967's sibling
  // read added two `from('rentals')` calls ABOVE it, at which point the pin
  // silently started inspecting a different query and failed while the column
  // it guards was untouched. A pin that moves when unrelated code is inserted
  // above it is a pin that will one day pass while pointing at the wrong
  // thing, which is the worse direction of the same fault.
  //
  // So the query is found by a column only IT selects (`showcase_order`, the
  // landlord's arrangement), and the pin then asserts on that query alone.
  //
  // Since DR-1199 the door list's columns live in one named list,
  // RENTAL_COLUMNS, which the read joins with its optional columns before it
  // selects. The locator reads that list by its name AND confirms the door
  // read still selects from it, so the pin stays anchored to the one query.
  const doorListSelect = async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../modules/properties/cloud.js'), 'utf8');
    const literals = src.match(/\.select\((['"`])[^'"`]*\1\)/g) || [];
    const named = src.match(/export const RENTAL_COLUMNS = (['"`])[^'"`]*\1/g) || [];
    const readsTheList = /\[RENTAL_COLUMNS, \.\.\.optional\]/.test(src);
    return [...literals, ...(readsTheList ? named : [])].filter((s) => s.includes('showcase_order'));
  };

  it('PROVEN-TO-CATCH: the door-list read selects rentable_level', async () => {
    // It existed in the database since 0160 and nothing asked for it, which is
    // the whole reason no screen could ever say a door was a bed. A tag
    // derived from a column nobody reads is a tag that never shows.
    const found = await doorListSelect();
    expect(found, 'the door-list select could not be found by showcase_order').toHaveLength(1);
    expect(found[0], 'the door-list read stopped selecting rentable_level').toContain('rentable_level');
  });

  it('the pin is anchored, so inserting another rentals query cannot move it', async () => {
    // The regression this pin itself suffered, pinned: the locator must select
    // exactly one query by name, never "whichever comes first".
    const found = await doorListSelect();
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('property_type');
  });
});
