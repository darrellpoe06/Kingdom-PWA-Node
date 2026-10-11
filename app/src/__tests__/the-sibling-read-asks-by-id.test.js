// =============================================================================
// The sibling read asks by the door's id (DR-0967)
// =============================================================================
// Darrell, 2026-10-11, after DR-0963 deployed: "Images for apartment 4...
// B?!!!!" and "We need to be able to see the images in Apt 4... B... so we can
// advertise!!!!!!!!!!!"
//
// The card was live and showed nothing. The cause was mine, and the comment I
// shipped beside it had the fact exactly backwards:
//
//   "Keyed on rental_ref (the slug) ... keying it on rental_id would have
//    matched nothing and failed silently, which is the quietest kind of wrong."
//
// `property_photos.rental_ref` holds the rental's UUID. `PropertiesApp` calls
// `loadDoorPhotos(rentalId)` into a parameter merely NAMED `rentalRef`, and
// `apt2-photos-probe.yml` joins `r.id = p.rental_ref`. So the slugs I passed
// matched zero rows, every time, silently — the exact failure I claimed to be
// avoiding, written into the code by the sentence claiming to avoid it.
//
// These cases pin the KEY, because a name is not a fact.
import { describe, it, expect } from 'vitest';
import { loadSiblingPhotos, loadDoorPhotos } from '../modules/properties/cloud.js';

// A stub client that records what each read was actually asked for. Enough of
// the builder to satisfy both functions, and nothing more.
function spyClient({ me, siblings, photos = [] }) {
  const asked = { rentalRefIn: null, rentalRefEq: null };
  const photoBuilder = {
    select: () => photoBuilder,
    in: (col, vals) => { if (col === 'rental_ref') asked.rentalRefIn = vals; return photoBuilder; },
    eq: (col, val) => { if (col === 'rental_ref') asked.rentalRefEq = val; return photoBuilder; },
    is: () => photoBuilder,
    order: () => photoBuilder,
    then: (res) => res({ data: photos, error: null }),
  };
  let rentalsCall = 0;
  const client = {
    from: (table) => {
      if (table === 'property_photos') return photoBuilder;
      // rentals: first call is the single() for "me", second is the list.
      const b = {
        select: () => b,
        eq: () => b,
        single: () => Promise.resolve({ data: me, error: null }),
        then: (res) => { rentalsCall += 1; return res({ data: siblings, error: null }); },
      };
      return b;
    },
  };
  return { client, asked, rentalsCalls: () => rentalsCall };
}

// His shape: Bed B owns nothing, Bed A holds the apartment's pictures.
const BED_B = { id: 'uuid-bed-b', slug: 'bed-b-slug', instance_id: 'inst-1', address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4' };
const BED_A = { id: 'uuid-bed-a', slug: 'bed-a-slug', display_name: '805 North Prospect Avenue Room 1 - Bed A', instance_id: 'inst-1', address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4' };

describe('loadSiblingPhotos asks for photographs by the door id', () => {
  it('PROVEN-TO-CATCH: the ids go into the filter, never the slugs', async () => {
    const { client, asked } = spyClient({ me: BED_B, siblings: [BED_B, BED_A] });
    const r = await loadSiblingPhotos('uuid-bed-b', client);
    expect(r.ok).toBe(true);
    expect(asked.rentalRefIn, 'the photographs were never asked for').toBeTruthy();
    expect(asked.rentalRefIn).toEqual(['uuid-bed-a']);
    // The slug must appear NOWHERE in the filter. This is the whole bug.
    expect(asked.rentalRefIn.some((x) => String(x).includes('slug')), 'a slug reached the rental_ref filter').toBe(false);
  });

  it('it asks by the SAME key loadDoorPhotos asks by', async () => {
    // The two reads hit one column. If they ever disagree about what goes in
    // it, one of them silently returns nothing — which is what happened.
    const a = spyClient({ me: BED_B, siblings: [BED_B, BED_A] });
    await loadSiblingPhotos('uuid-bed-b', a.client);
    const b = spyClient({ me: BED_B, siblings: [] });
    await loadDoorPhotos('uuid-bed-b', b.client);
    expect(b.asked.rentalRefEq, 'loadDoorPhotos changed what it keys on').toBe('uuid-bed-b');
    expect(a.asked.rentalRefIn[0]).toMatch(/^uuid-/);
  });

  it('the door itself is excluded — it is not its own sibling', async () => {
    const { client, asked } = spyClient({ me: BED_B, siblings: [BED_B, BED_A] });
    await loadSiblingPhotos('uuid-bed-b', client);
    expect(asked.rentalRefIn).not.toContain('uuid-bed-b');
  });

  it('a door with no unit has no siblings and never asks', async () => {
    const whole = { ...BED_B, unit: null };
    const { client, asked } = spyClient({ me: whole, siblings: [whole, BED_A] });
    const r = await loadSiblingPhotos('uuid-bed-b', client);
    expect(r.ok).toBe(true);
    expect(r.photos).toEqual([]);
    expect(asked.rentalRefIn, 'a whole unit asked for a sibling’s photographs').toBeNull();
  });

  it('a sibling in another instance is not a sibling', async () => {
    const elsewhere = { ...BED_A, id: 'uuid-other', instance_id: 'inst-2' };
    const { client, asked } = spyClient({ me: BED_B, siblings: [BED_B, elsewhere] });
    const r = await loadSiblingPhotos('uuid-bed-b', client);
    expect(r.photos).toEqual([]);
    expect(asked.rentalRefIn).toBeNull();
  });

  it('a different unit at the same address is not a sibling', async () => {
    const apt2 = { ...BED_A, id: 'uuid-apt2', address: '805 North Prospect Avenue', unit: 'Apt 2' };
    const { client } = spyClient({ me: BED_B, siblings: [BED_B, apt2] });
    const r = await loadSiblingPhotos('uuid-bed-b', client);
    expect(r.photos).toEqual([]);
  });
});

// =============================================================================
// Same apartment number, same place (DR-0967)
// =============================================================================
// Darrell, 2026-10-11: "If it has the same apt number its the same location...
// can we make sure this happens each time we co-live a place?!!!!!!!!"
//
// The first version compared address and unit as exact strings, and HIS OWN
// DOORS break it: Bed B carries "805 North Prospect Avenue Apt 4" / "Apt 4"
// while Apt 2 carries "805 North Prospect Avenue" / "Apt 2". The unit got
// typed into the address on one door and not another, which is what anybody
// does entering a co-living building by hand.
describe('sameApartment — the apartment number decides', () => {
  it('PROVEN-TO-CATCH: his exact two rows match, unit in the address or not', async () => {
    const { sameApartment } = await import('../modules/properties/cloud.js');
    const bedB = { address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4' };
    const bedA = { address: '805 North Prospect Avenue', unit: 'Apt 4' };
    expect(sameApartment(bedA, bedB), 'two beds in one apartment read as different buildings').toBe(true);
  });

  it('every way a person writes a unit is one apartment', async () => {
    const { sameApartment } = await import('../modules/properties/cloud.js');
    const base = { address: '805 North Prospect Avenue', unit: 'Apt 4' };
    for (const unit of ['Apt 4', 'apt. 4', 'APT 4', '#4', 'Unit 4', '4', 'Suite 4']) {
      expect(sameApartment(base, { address: '805 North Prospect Avenue', unit }), `"${unit}" did not match "Apt 4"`).toBe(true);
    }
  });

  it('a different apartment number is a different apartment', async () => {
    const { sameApartment } = await import('../modules/properties/cloud.js');
    expect(sameApartment(
      { address: '805 North Prospect Avenue', unit: 'Apt 4' },
      { address: '805 North Prospect Avenue', unit: 'Apt 2' },
    )).toBe(false);
  });

  it('a lettered unit keeps its letter — 3A is not 3B', async () => {
    const { sameApartment } = await import('../modules/properties/cloud.js');
    expect(sameApartment(
      { address: '12 Elm', unit: 'Unit 3A' }, { address: '12 Elm', unit: 'Unit 3B' },
    )).toBe(false);
    expect(sameApartment(
      { address: '12 Elm', unit: 'Unit 3A' }, { address: '12 Elm', unit: '3a' },
    )).toBe(true);
  });

  it('a whole place with no unit is never anybody’s sibling', async () => {
    const { sameApartment } = await import('../modules/properties/cloud.js');
    expect(sameApartment({ address: '805 North Prospect Avenue', unit: null }, { address: '805 North Prospect Avenue', unit: 'Apt 4' })).toBe(false);
    expect(sameApartment({ address: '805 North Prospect Avenue', unit: '' }, { address: '805 North Prospect Avenue', unit: '' })).toBe(false);
  });

  it('a DIFFERENT street with the same unit number is NOT a match', async () => {
    // The dangerous direction. Apt 4 exists at thousands of addresses; one
    // family's pictures must never advertise another family's door.
    const { sameApartment } = await import('../modules/properties/cloud.js');
    expect(sameApartment(
      { address: '805 North Prospect Avenue', unit: 'Apt 4' },
      { address: '900 South Neil Street', unit: 'Apt 4' },
    )).toBe(false);
  });

  it('an abbreviated street is still treated as a different street, on purpose', async () => {
    // Guessing that two addresses are "probably" the same is how pictures
    // cross between families. The unit is normalised; the street is only
    // cleaned. Recorded as a deliberate limit, not an oversight.
    const { sameApartment } = await import('../modules/properties/cloud.js');
    expect(sameApartment(
      { address: '805 N Prospect Ave', unit: 'Apt 4' },
      { address: '805 North Prospect Avenue', unit: 'Apt 4' },
    )).toBe(false);
  });
});
