import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { advertisedPriceFollows } from '../modules/properties/staging.js';

// ===========================================================================
// THE RENT THAT IS SAVED IS THE RENT THAT SHOWS.
//
// Darrell, 2026-10-27, on 805 North Prospect Apt 4: "The rent amounts don't
// update appropriately... the $750 will not update to $1000 even after saving
// it."
//
// It saved. `monthly_rent` really became 1000. The header kept saying $750
// because the header reads a DIFFERENT COLUMN first -- `listed_rent`, frozen
// at the hour the door was advertised and editable from no screen at all.
//
// Two halves are gated here, because fixing one without the other leaves the
// defect alive:
//   1. the rule itself -- the advertised price follows the rent;
//   2. the WIRING -- that the save path actually applies the rule. DR-1238
//      recorded what a tested rule over an unwired call is worth: nothing.
// ===========================================================================

const here = dirname(fileURLToPath(import.meta.url));
const APP = readFileSync(join(here, '../modules/properties/PropertiesApp.jsx'), 'utf8');

const ADVERTISED = { id: 'd1', listed_at: '2026-10-20T00:00:00Z', listed_rent: 750, monthly_rent: 750 };

describe('the advertised price follows the rent', () => {
  it('carries a new rent onto the advertised price', () => {
    const out = advertisedPriceFollows(ADVERTISED, { monthly_rent: 1000 });
    expect(out.monthly_rent).toBe(1000);
    expect(out.listed_rent).toBe(1000);
  });

  it('follows a door whose listing was WITHDRAWN but kept its price', () => {
    // setListing keeps listed_rent on the way down, so a withdrawn door would
    // otherwise re-advertise last season's price the next time it goes up.
    const withdrawn = { ...ADVERTISED, listed_at: null };
    expect(advertisedPriceFollows(withdrawn, { monthly_rent: 1200 }).listed_rent).toBe(1200);
  });

  it('follows the rent to blank rather than quoting a price nobody set', () => {
    expect(advertisedPriceFollows(ADVERTISED, { monthly_rent: 0 }).listed_rent).toBe(0);
  });

  it('leaves a door that was never advertised alone', () => {
    const never = { id: 'd2', listed_at: null, listed_rent: null, monthly_rent: 600 };
    const out = advertisedPriceFollows(never, { monthly_rent: 900 });
    expect(out).not.toHaveProperty('listed_rent');
  });

  it('touches nothing when the edit is not about the rent', () => {
    const out = advertisedPriceFollows(ADVERTISED, { unit: 'Apt 5' });
    expect(out).not.toHaveProperty('listed_rent');
    expect(out.unit).toBe('Apt 5');
  });

  it('does not mutate the patch it was handed', () => {
    const patch = { monthly_rent: 1000 };
    advertisedPriceFollows(ADVERTISED, patch);
    expect(patch).toEqual({ monthly_rent: 1000 });
  });

  it('survives a door it cannot find', () => {
    expect(advertisedPriceFollows(null, { monthly_rent: 1000 })).toEqual({ monthly_rent: 1000 });
  });
});

describe('a door that already drifted tells the truth without being re-saved', () => {
  // The write fix keeps the two columns in step from here on. It cannot reach
  // back to the doors that drifted BEFORE it, and Darrell should not have to
  // save Apt 4 a second time to see the number he already saved once. So the
  // order the screens read in puts the editable figure first.
  const DOORS = readFileSync(join(here, '../modules/properties/DoorTabs.jsx'), 'utf8');

  // The DOOR's own two columns, named by their accessor. An earlier draft of
  // this check compared the first 'monthly_rent' on the line against the first
  // 'listed_rent' -- and the first one is the TENANCY's (`tenancy?.monthly_rent`),
  // which sits ahead of both regardless. It passed 11/11 against the broken
  // order. A gate that cannot fail is worth less than no gate, because it is
  // believed (DR-0076 §3), so the subject is pinned to the door prefix.
  const order = (text, prefix) => {
    const line = text.split('\n').find((l) => /const rent = Number\(/.test(l));
    expect(line, 'the rent line was not found at all').toBeTruthy();
    return [line.indexOf(`${prefix}monthly_rent`), line.indexOf(`${prefix}listed_rent`)];
  };

  it('the board row reads the door’s own rent before the advertised copy', () => {
    const [own, advertised] = order(DOORS, 'r.');
    expect(own).toBeGreaterThan(-1);
    expect(advertised).toBeGreaterThan(-1);
    expect(advertised).toBeGreaterThan(own);
  });

  it('the open door’s header reads them in the same order', () => {
    const [own, advertised] = order(APP, 'rental?.');
    expect(own).toBeGreaterThan(-1);
    expect(advertised).toBeGreaterThan(-1);
    expect(advertised).toBeGreaterThan(own);
  });
});

describe('the save path is wired to it', () => {
  // Proven to catch: deleting the call from editRental fails this, which is
  // exactly the shape of the bug being fixed -- a correct rule nothing calls.
  const editRental = APP.slice(APP.indexOf('const editRental = async'), APP.indexOf('const bookEntryFor'));

  it('editRental writes the patch the rule returned, not the form', () => {
    expect(editRental).toMatch(/advertisedPriceFollows\(\s*door\s*,\s*patch\s*\)/);
    expect(editRental).toMatch(/updateRental\(\s*id\s*,\s*written\s*,/);
  });

  it('the other tab is told what was written, not what was typed', () => {
    expect(editRental).toMatch(/announceRentalChange\([^)]*patch:\s*written/);
  });
});
