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
  it('PROVEN-TO-CATCH: the rentals read selects rentable_level', async () => {
    // It existed in the database since 0160 and nothing asked for it, which is
    // the whole reason no screen could ever say a door was a bed. A tag
    // derived from a column nobody reads is a tag that never shows.
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../modules/properties/cloud.js'), 'utf8');
    const read = src.slice(src.indexOf("from('rentals')"));
    expect(read.slice(0, 600), 'the rentals read stopped selecting rentable_level').toContain('rentable_level');
  });
});
