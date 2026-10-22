// @vitest-environment node
// =============================================================================
// An address is completed from evidence, never guessed (DR-1211)
// =============================================================================
// Darrell, 2026-10-22: "fix the addresses to reflect the correct addresses and
// not the abbreviated addresses... Each asset should work end to end."
// Measured (rentals-address-probe, run 39717503181): eight of thirteen live
// doors held an incomplete address in the one record both tabs read. The
// fixtures below take those SHAPES (no ZIP; "Dr"; no street type; no town; an
// address field that lost its street); the values are made up.
import { describe, it, expect } from 'vitest';
import {
  fullStreet, sameStreet, matchedParts, recordedStreet, wantsCompleting, questionsFor, completion, trailTown, ownTown, needsFromFamily, addressOnPage, pageWords, completionFromPages,
} from '../modules/properties/complete-address.js';
import { rowsFromJson, completeRows, updatesSql } from '../../../scripts/complete-addresses.mjs';
import { fromNominatim } from '../../functions/geocode.js';

const ID = (n) => `00000000-0000-4000-8000-00000000000${n}`;
const census = (line) => ({ ok: true, matched: line, source: 'census' });
const ROWS = [
  { id: ID(1), instance_id: 'i', address: '12 Testing Dr', unit: '', city: 'Testtown', state: 'IL', zip: '', display_name: '12 Testing Dr' },
  { id: ID(2), instance_id: 'i', address: '30 Sample Hill', unit: '', city: 'Testtown', state: 'IL', zip: '', display_name: '30 Sample Hill' },
  { id: ID(3), instance_id: 'i', address: '7 Fixture', unit: '', city: '', state: 'IL', zip: '', display_name: '7 Fixture' },
  { id: ID(4), instance_id: 'i', address: 'Othertown', unit: '', city: 'Othertown', state: 'Illinois', zip: '', display_name: '31 Sample Hill', notes: '[2026-10-13] Edited — Address: 31 Sample Hill, Testtown, Illinois → 31 Sample Hill,; City: (blank) → Testtown' },
  { id: ID(5), instance_id: 'i', address: '9 North Example Avenue', unit: 'Apt 2', city: 'Othertown', state: 'Illinois', zip: '61820', display_name: '9 North Example Avenue' },
];

describe('the street, written out from the USPS table', () => {
  it('writes the street type and the direction in full', () => {
    expect(fullStreet('SAMPLE DR')).toBe('Sample Drive');
    expect(fullStreet('N EXAMPLE AVE')).toBe('North Example Avenue');
    expect(fullStreet('SAMPLE HILL DR')).toBe('Sample Hill Drive');
  });
  it('a street is the same street with or without the type it left off, and never a different one', () => {
    expect(sameStreet('Testing Dr', 'TESTING DR')).toBe(true);
    expect(sameStreet('Sample Hill', 'SAMPLE HILL DR')).toBe(true);
    expect(sameStreet('Testing Dr', 'TESTING ST'), 'PROVEN TO CATCH: Drive is not Street').toBe(false);
    expect(sameStreet('N Example Ave', 'S EXAMPLE AVE'), 'PROVEN TO CATCH: North is not South').toBe(false);
    expect(sameStreet('Sample', 'SAMPLE HILL RD'), 'PROVEN TO CATCH: two missing words is a different street').toBe(false);
  });
  it('reads the Census line and the OpenStreetMap parts', () => {
    expect(matchedParts(census('12 TESTING DR, TESTTOWN, IL, 61832'))).toEqual({ number: '12', street: 'TESTING DR', city: 'TESTTOWN', state: 'IL', zip: '61832' });
    const osm = fromNominatim([{ lat: '40.1', lon: '-87.6', display_name: '12, Testing Drive, Testtown', address: { house_number: '12', road: 'Testing Drive', city: 'Testtown', state: 'Illinois', postcode: '61832' } }]);
    expect(matchedParts({ ok: true, ...osm })).toEqual({ number: '12', street: 'Testing Drive', city: 'Testtown', state: 'Illinois', zip: '61832' });
  });
});

describe('which doors want completing, and what is asked', () => {
  it('a whole door is left alone; an incomplete one is asked about', () => {
    expect(ROWS.map(wantsCompleting)).toEqual([true, true, true, true, false]);
  });
  it('a door whose address lost its street is read from its own name', () => {
    expect(recordedStreet(ROWS[3])).toMatchObject({ street: '31 Sample Hill', from: 'name' });
  });
  it('a door is asked only in the town its own record vouches for', () => {
    expect(questionsFor(ROWS[0]).map((q) => q.q)).toEqual(['12 Testing Dr, Testtown, IL']);
    expect(questionsFor(ROWS[2]), 'no town anywhere: nothing is asked').toEqual([]);
    expect(needsFromFamily(ROWS[2])).toBe('the town');
  });
  it('the town of a door whose address lost its street is the one its own edit trail set, not the one it now holds', () => {
    expect(trailTown(ROWS[3].notes)).toBe('Testtown');
    expect(ownTown(ROWS[3])).toBe('Testtown');
    expect(questionsFor(ROWS[3]).map((q) => q.q)).toEqual(['31 Sample Hill, Testtown, Illinois']);
  });
  it('PROVEN TO CATCH: whichever family town happens to answer is never taken as the door\'s town', () => {
    // Measured on the first dry run (39718050197): a no-town search answered
    // in the wrong town because the geocoder did not know the real street.
    const c = completion(ROWS[3], [{ town: 'Testtown', hit: { ok: false } }, { town: 'Othertown', hit: census('31 SAMPLE HILL DR, OTHERTOWN, IL, 61821') }]);
    expect(c.ok).toBe(false);
  });
});

describe('the completion, only from a match that is this house', () => {
  it('fills the ZIP and writes the street in full, the name following the street', () => {
    const c = completion(ROWS[0], [{ town: 'Testtown', hit: census('12 TESTING DR, TESTTOWN, IL, 61832') }]);
    expect(c.ok).toBe(true);
    expect(c.patch).toEqual({ address: '12 Testing Drive', zip: '61832', display_name: '12 Testing Drive' });
    expect(c.summary).toMatch(/US Census Bureau geocoder/);
  });
  it('adds the street type the record left off', () => {
    expect(completion(ROWS[1], [{ town: 'Testtown', hit: census('30 SAMPLE HILL DR, TESTTOWN, IL, 61832') }]).patch)
      .toMatchObject({ address: '30 Sample Hill Drive', zip: '61832' });
  });
  it('mends an address that lost its street, from its own name, in the town its own trail set', () => {
    const c = completion(ROWS[3], [{ town: 'Testtown', hit: census('31 SAMPLE HILL DR, TESTTOWN, IL, 61832') }]);
    expect(c.patch).toMatchObject({ address: '31 Sample Hill Drive', city: 'Testtown', zip: '61832', display_name: '31 Sample Hill Drive' });
    expect(c.summary).toMatch(/was "Othertown"/);
  });
  it('PROVEN TO CATCH: another house number, another street, or another town is not this house', () => {
    expect(completion(ROWS[0], [{ town: 'Testtown', hit: census('14 TESTING DR, TESTTOWN, IL, 61832') }]).ok).toBe(false);
    expect(completion(ROWS[0], [{ town: 'Testtown', hit: census('12 TESTING ST, TESTTOWN, IL, 61832') }]).ok).toBe(false);
    expect(completion(ROWS[0], [{ town: 'Testtown', hit: census('12 TESTING DR, THIRDTOWN, IL, 61801') }]).ok).toBe(false);
  });
  it('never touches a ZIP or a town the family already wrote', () => {
    const typed = { ...ROWS[0], zip: '61833' };
    expect(completion(typed, [{ town: 'Testtown', hit: census('12 TESTING DR, TESTTOWN, IL, 61832') }]).patch.zip).toBeUndefined();
  });
});

describe('the lane: bounded asking and guarded writing', () => {
  it('asks only for the doors that want it, and writes one guarded UPDATE each', async () => {
    const rows = rowsFromJson(JSON.stringify(ROWS));
    const answers = {
      '12 Testing Dr, Testtown, IL': census('12 TESTING DR, TESTTOWN, IL, 61832'),
      '30 Sample Hill, Testtown, IL': { ok: false },
    };
    const asked = [];
    const r = await completeRows(rows, { find: async (q) => { asked.push(q); return answers[q] || { ok: false }; }, wait: async () => {} });
    expect(asked).not.toContain('9 North Example Avenue, Othertown, Illinois');
    const sql = updatesSql(rows, r.results, { today: '2026-10-22' });
    expect(sql.trim().split('\n')).toHaveLength(1);
    expect(sql).toContain(`WHERE id = '${ID(1)}' AND address = $q$12 Testing Dr$q$ AND city = $q$Testtown$q$ AND nullif(btrim(coalesce(zip, '')), '') IS NULL;`);
    expect(sql).toContain('updated_at = now()');
    expect(sql).toContain('[2026-10-22] Edited — Address completed from the US Census Bureau geocoder');
  });
  it('PROVEN TO CATCH: a value that could break out of its quotes is never written', () => {
    const rows = rowsFromJson(JSON.stringify([{ ...ROWS[0], address: '12 Testing Dr$q$; DROP TABLE rentals; --' }]));
    expect(updatesSql(rows, [{ id: ID(1), ok: true, patch: { zip: '61832' }, summary: 'x' }])).toBe('');
  });
  it('the asking is bounded: a run past its budget leaves the rest for the next run', async () => {
    const rows = rowsFromJson(JSON.stringify(ROWS));
    const r = await completeRows(rows, { find: async () => ({ ok: false }), wait: async () => {}, max: 1 });
    expect(r.looked).toBe(1);
    expect(r.results.some((x) => /budget/.test(x.why || ''))).toBe(true);
  });
});

describe('the second road: a source page the research road found', () => {
  const page = (html) => ({ url: 'https://records.example.gov/parcel/1', text: html });
  it('a page that shows the house, its town and its ZIP completes the street type and the ZIP', () => {
    const c = completionFromPages(ROWS[1], [page('<p>Parcel at <b>30 Sample Hill Dr</b>, Testtown, IL 61832 — residential</p>')]);
    expect(c.ok).toBe(true);
    expect(c.patch).toMatchObject({ address: '30 Sample Hill Drive', zip: '61832' });
    expect(c.summary).toMatch(/research road found \(records\.example\.gov\)/);
  });
  it('reads the house however a page spells the street type', () => {
    const rec = { street: '12 Testing Dr' };
    expect(addressOnPage(pageWords('12 Testing Drive, Testtown, Illinois 61832'), rec, 'Testtown')).toEqual({ street: 'Testing Drive', zip: '61832' });
    expect(addressOnPage(pageWords('12 TESTING DR. TESTTOWN IL 61832-1234'), rec, 'Testtown')).toEqual({ street: 'Testing Drive', zip: '61832' });
  });
  it('PROVEN TO CATCH: another number, another town, or two ZIPs is no answer', () => {
    expect(completionFromPages(ROWS[1], [page('31 Sample Hill Dr, Testtown, IL 61832')]).ok, 'the neighbour').toBe(false);
    expect(completionFromPages(ROWS[1], [page('30 Sample Hill Dr, Othertown, IL 61821')]).ok, 'the same street in another town').toBe(false);
    expect(completionFromPages(ROWS[1], [page('30 Sample Hill Dr, Testtown, IL 61832'), page('30 Sample Hill Dr, Testtown, IL 61834')]).why).toMatch(/disagree/);
    expect(completionFromPages(ROWS[2], [page('7 Fixture St, Othertown, IL 61821')]).ok, 'a door with no town of its own').toBe(false);
  });
  it('PROVEN TO CATCH: the research road\'s own words are never the evidence, only the page', () => {
    expect(completionFromPages(ROWS[1], [page('The answer is that this property is in Testtown with ZIP 61832.')]).ok).toBe(false);
  });
});
