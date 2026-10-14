// @vitest-environment node
// =============================================================================
// EVERY DOOR WITH AN ADDRESS IS ON THE MAP, BY DEFAULT — ACCURATE FOR EACH (DR-0998)
// =============================================================================
// Darrell, 2026-10-13: "I love that it shows what's close!!! Shouldn't this be
// default?", "Make sure it's accurate for each property", "Not just 805".
// The Census and Overpass answers are RECORDED shapes; the cloud sandbox has no
// route to either. The live answer is witnessed after merge (nearby-witness.yml).
import { describe, it, expect } from 'vitest';
import {
  buildingsToPlace, placeDoorsOnTheMap, matchesAddress, townOf, PLACE_MAX_LOOKUPS,
} from '../modules/properties/place-on-map.js';
import {
  nearbyAround, nearbyFromOverpass, overpassQuery, overpassGaveUp, OVERPASS, milesText, NEARBY_MAX, busStopLabel,
} from '../modules/properties/area.js';
import { buildingKey } from '../modules/properties/apartment.js';

const FAM = 'fam-1';
const door = (id, address, unit, extra = {}) => ({ id, instance_id: FAM, address, unit, city: 'Champaign', state: 'Illinois', ...extra });
const APT2 = door('apt2', '805 North Prospect Avenue', 'Apt 2');
const BEDA = door('beda', '805 North Prospect Avenue Apt 4', 'Apt 4');
const BEDB = door('bedb', '805 North Prospect Avenue Apt 4', 'Bed B');
const DANVILLE = door('dan', '12 Oak Street', '', { city: 'Danville' });
const AT_805 = { lat: 40.123364, lng: -88.25828 };
const AT_DANVILLE = { lat: 40.1245, lng: -87.6300 };

// A recorded Overpass answer around Danville: none of it is in Champaign.
const DANVILLE_OSM = { elements: [
  { type: 'node', lat: 40.1300, lon: -87.6280, tags: { shop: 'supermarket', name: 'County Market' } },
  { type: 'way', center: { lat: 40.1400, lon: -87.6100 }, tags: { amenity: 'hospital', name: 'OSF Sacred Heart Medical Center Danville' } },
  { type: 'node', lat: 40.1250, lon: -87.6310, tags: { amenity: 'pharmacy', name: 'Walgreens' } },
  { type: 'node', lat: 40.1100, lon: -87.6600, tags: { highway: 'motorway_junction', ref: '220' } },
  { type: 'node', lat: 40.1251, lon: -87.6301, tags: { leisure: 'park', name: 'Lincoln Park' } },
  // Kinds it should drop: no name, and a supermarket past its 5-mile radius.
  { type: 'node', lat: 40.1260, lon: -87.6290, tags: { shop: 'supermarket' } },
  { type: 'node', lat: 40.3000, lon: -87.6300, tags: { shop: 'supermarket', name: 'Far Foods' } },
  // THE CITY BUS (DR-1014): three stops, the two nearest kept, never by their
  // corner names (which name streets); the third is past a mile.
  { type: 'node', lat: 40.1252, lon: -87.6305, tags: { highway: 'bus_stop', name: 'Oak & Main', route_ref: '2;100' } },
  { type: 'node', lat: 40.1190, lon: -87.6350, tags: { highway: 'bus_stop', name: 'Oak & Vine' } },
  { type: 'node', lat: 40.1500, lon: -87.6300, tags: { highway: 'bus_stop', name: 'Far & Away', route_ref: '9' } },
] };

describe('what is nearby, for ANY property (not just 805)', () => {
  it('one Overpass query around THIS point, each kind in its own radius', () => {
    const q = overpassQuery(AT_DANVILLE);
    expect(q.startsWith('[out:json]')).toBe(true);
    expect(q).toContain('nwr["shop"="supermarket"]["name"](around:8047,40.124500,-87.630000);');
    expect(q).toContain('nwr["amenity"="hospital"]["name"](around:24140,40.124500,-87.630000);');
    expect(q).toContain('out center tags;');
    // The city bus: stops within a mile (DR-1014).
    expect(q).toContain('node["highway"="bus_stop"](around:1609,40.124500,-87.630000);');
  });

  it('THE CITY BUS (DR-1014): the two nearest stops, nearest first, with the routes the map carries, never the corner name', () => {
    const lines = nearbyFromOverpass(AT_DANVILLE, DANVILLE_OSM);
    const bus = lines.filter((l) => /bus stop/i.test(l.label));
    expect(bus.map((l) => l.label)).toEqual(['City bus stop (routes 2, 100)', 'Another city bus stop']);
    expect(bus[0].miles).toBeLessThan(bus[1].miles);
    // PROVEN-TO-CATCH: a stop's own name is a street corner; it never reaches
    // the line, so a held door's street is never handed over through the bus.
    expect(lines.some((l) => /Oak|Main|Vine/.test(l.label) && /bus/i.test(l.label))).toBe(false);
    expect(lines.some((l) => /Far & Away|route 9/.test(l.label))).toBe(false); // past a mile
    expect(busStopLabel({ route_ref: '7' }, 0)).toBe('City bus stop (route 7)');
    expect(busStopLabel({}, 1)).toBe('Another city bus stop');
  });

  it('a Danville door gets Danville\'s places, measured from its own point — none of Champaign\'s', () => {
    const lines = nearbyFromOverpass(AT_DANVILLE, DANVILLE_OSM);
    const labels = lines.map((l) => l.label);
    expect(labels).toContain('County Market (grocery)');
    expect(labels).toContain('Walgreens (pharmacy)');
    expect(labels).toContain('Highway exit 220');
    expect(labels).toContain('Lincoln Park');
    expect(labels).not.toContain('Far Foods (grocery)'); // past 5 miles
    expect(labels.some((l) => /Target|Schnucks|Main Quad|Willard/.test(l))).toBe(false);
    for (const l of lines) expect(l.label.length).toBeLessThanOrEqual(80);
  });

  it('nearbyAround: the research where it applies, plus OpenStreetMap, nearest first, at most 12', async () => {
    const asked = [];
    const fetchImpl = async (url, init) => { asked.push({ url, body: decodeURIComponent(init.body) }); return { ok: true, status: 200, json: async () => DANVILLE_OSM }; };
    const r = await nearbyAround(AT_DANVILLE, { fetchImpl });
    expect(r.ok).toBe(true);
    expect(asked[0].url).toBe(OVERPASS);
    expect(asked[0].body).toContain('around:');
    expect(r.lines.length).toBeLessThanOrEqual(NEARBY_MAX);
    expect(r.lines.map((l) => l.miles)).toEqual([...r.lines.map((l) => l.miles)].sort((a, b) => a - b));
    // At 805, the Champaign research is kept as researched.
    const at805 = await nearbyAround(AT_805, { fetchImpl: async () => ({ ok: true, json: async () => ({ elements: [] }) }) });
    expect(at805.lines.find((l) => l.label === 'I-74 at Exit 181')).toEqual({ label: 'I-74 at Exit 181', miles: 0.7 });
  });

  it('Overpass unreachable is NOT "nothing near": it says so, so the caller tries again', async () => {
    const r = await nearbyAround(AT_DANVILLE, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    expect(r).toEqual({ ok: false, reason: 'What is nearby could not be reached just now.' });
    const busy = await nearbyAround(AT_DANVILLE, { fetchImpl: async () => ({ ok: false, status: 429 }) });
    expect(busy.ok).toBe(false);
  });

  it('a server that gave up is a failure, not "nothing near" (DR-1018: Koehn Dr placed with 0 lines)', async () => {
    const asked = [];
    const gaveUp = { version: 0.6, remark: 'runtime error: Query timed out in "query" at line 1 after 26 seconds.', elements: [] };
    const r = await nearbyAround(AT_DANVILLE, { fetchImpl: async (url) => { asked.push(url); return { ok: true, status: 200, json: async () => gaveUp }; } });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/timed out on the server/);
    expect(asked.length).toBe(2); // the server's own trouble is worth the next mirror
    expect(overpassGaveUp({ elements: [] })).toBe('');
    expect(overpassGaveUp({ remark: 'runtime error: Query run out of memory' })).toMatch(/out of memory/);
  });

  it('a runner may ask the server for more patience than a phone', () => {
    expect(overpassQuery(AT_805)).toContain('[timeout:25]');
    expect(overpassQuery(AT_805, { serverTimeoutS: 90 })).toContain('[timeout:90]');
    expect(overpassQuery(AT_805, { serverTimeoutS: 9999 })).toContain('[timeout:180]');
  });

  it('read aloud as words: "about 0.7 miles", never "mi" (WCAG 2.2 AA, the read-aloud)', () => {
    expect(milesText(0.7)).toBe('about 0.7 miles');
    expect(milesText(1)).toBe('about 1.0 mile');
  });
});

describe('the lookup must be THIS property', () => {
  it('the house number and the town must both be in what was matched', () => {
    expect(matchesAddress('805 N PROSPECT AVE, CHAMPAIGN, IL, 61820', APT2)).toBe(true);
    expect(matchesAddress('805, North Prospect Avenue, Champaign, Illinois', BEDB)).toBe(true);
    expect(matchesAddress('North Prospect Avenue, Champaign, Illinois', APT2)).toBe(false); // the street's middle
    expect(matchesAddress('8050 N PROSPECT AVE, CHAMPAIGN, IL', APT2)).toBe(false);
    expect(matchesAddress('805 N PROSPECT AVE, PEORIA, IL', APT2)).toBe(false);          // another town
    expect(matchesAddress('', APT2)).toBe(false);
    expect(matchesAddress('12 Oak Street', door('x', 'Oak Street', ''))).toBe(false);    // no number to check
  });

  it('PROVEN-TO-CATCH: a record that names no town is never placed by a guess (the Real Estate shapes)', () => {
    const one = (address) => ({ address, city: '' });
    // The whole address typed into one field: the town is read out of it.
    expect(townOf(one('1508 Williamsburg, Champaign, IL, 61821'))).toBe('champaign');
    expect(townOf(one('1213 Koehn Dr, Danville, IL'))).toBe('danville');
    expect(matchesAddress('1508 WILLIAMSBURG DR, CHAMPAIGN, IL, 61821', one('1508 Williamsburg, Champaign, IL, 61821'))).toBe(true);
    // No town anywhere: "709 Commercial St, IL" could be any town's.
    expect(townOf(one('709 Commercial St, IL'))).toBe('');
    expect(matchesAddress('709 COMMERCIAL ST, DANVILLE, IL', one('709 Commercial St, IL'))).toBe(false);
    expect(townOf(one('709 Commercial St, Illinois 61832'))).toBe('');
  });
});

describe('placing the family\'s doors', () => {
  it('one lookup per BUILDING; doors already on the map are left alone', () => {
    expect(buildingKey(BEDB.address, BEDB.unit)).toBe(buildingKey(APT2.address, APT2.unit));
    const g = buildingsToPlace([APT2, BEDA, BEDB, DANVILLE], new Set(['beda']));
    expect(g.map((x) => x.doors.map((d) => d.id))).toEqual([['apt2', 'bedb'], ['dan']]);
    expect(g[0].query).toBe('805 North Prospect Avenue, Champaign, Illinois');
    // Another family on the same street is its own building.
    const other = { ...APT2, id: 'other', instance_id: 'fam-2' };
    expect(buildingsToPlace([APT2, other]).length).toBe(2);
  });

  it('saves each door its rounded area and ITS OWN place\'s lines, through the door edit path', async () => {
    const saved = [];
    const finds = { '805 North Prospect Avenue, Champaign, Illinois': { ok: true, point: AT_805, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820' },
      '12 Oak Street, Danville, Illinois': { ok: true, point: AT_DANVILLE, matched: '12 OAK ST, DANVILLE, IL, 61832' } };
    const r = await placeDoorsOnTheMap({
      rentals: [APT2, BEDB, DANVILLE],
      find: async (q) => finds[q],
      around: async (p) => (p === AT_DANVILLE ? { ok: true, lines: nearbyFromOverpass(p, DANVILLE_OSM) } : { ok: true, lines: [{ label: 'I-74 at Exit 181', miles: 0.7 }] }),
      save: async (id, patch, summary) => { saved.push({ id, patch, summary }); return { ok: true }; },
      wait: async () => {},
    });
    expect(r.placed).toEqual(['apt2', 'bedb', 'dan']);
    expect(r.looked).toBe(2);
    const byId = Object.fromEntries(saved.map((s) => [s.id, s]));
    expect(byId.apt2.patch).toEqual({ area_lat: 40.125, area_lng: -88.26, nearby: [{ label: 'I-74 at Exit 181', miles: 0.7 }] });
    expect(byId.bedb.patch.area_lat).toBe(40.125);
    expect(byId.dan.patch.nearby.map((l) => l.label)).toContain('County Market (grocery)');
    expect(byId.dan.patch.nearby.map((l) => l.label)).not.toContain('I-74 at Exit 181');
    expect(byId.apt2.summary).toBe('Placed on the map from its address (automatic): the area and 1 nearby line');
    // The exact point is never in what is saved.
    expect(JSON.stringify(saved)).not.toMatch(/40\.123364|88\.25828/);
  });

  it('PROVEN-TO-CATCH: a lookup that is not THIS house saves nothing', async () => {
    const saved = [];
    const r = await placeDoorsOnTheMap({
      rentals: [APT2], find: async () => ({ ok: true, point: AT_805, matched: 'North Prospect Avenue, Champaign, Illinois' }),
      around: async () => ({ ok: true, lines: [] }), save: async (id) => { saved.push(id); return { ok: true }; }, wait: async () => {},
    });
    expect(saved).toEqual([]);
    expect(r.missed).toEqual(['apt2']);
  });

  it('PROVEN-TO-CATCH: what is nearby unreachable saves nothing (tried again next time, never saved as "nothing near")', async () => {
    const saved = [];
    const r = await placeDoorsOnTheMap({
      rentals: [APT2], find: async () => ({ ok: true, point: AT_805, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL' }),
      around: async () => ({ ok: false, reason: 'unreachable' }), save: async (id) => { saved.push(id); return { ok: true }; }, wait: async () => {},
    });
    expect(saved).toEqual([]);
    expect(r.missed).toEqual(['apt2']);
  });

  it('bounded: at most a few lookups a session, one a second apart', async () => {
    const many = Array.from({ length: 20 }, (_, i) => door(`d${i}`, `${100 + i} Elm Street`, ''));
    const waits = [];
    const r = await placeDoorsOnTheMap({
      rentals: many, find: async () => ({ ok: false }), save: async () => ({ ok: true }), wait: async (ms) => { waits.push(ms); },
    });
    expect(r.looked).toBe(PLACE_MAX_LOOKUPS);
    expect(waits).toHaveLength(PLACE_MAX_LOOKUPS - 1);
    expect(waits.every((ms) => ms >= 1000)).toBe(true);
  });

  it('never throws, whatever a road does', async () => {
    const r = await placeDoorsOnTheMap({
      rentals: [APT2], find: async () => { throw new Error('boom'); }, save: async () => { throw new Error('boom'); }, wait: async () => {},
    });
    expect(r.missed).toEqual(['apt2']);
  });
});
