// =============================================================================
// THE PUBLIC SHELF SHOWS THE AREA ON A MAP, NEVER THE STREET (DR-0912, 0270)
// =============================================================================
// Darrell, 2026-10-10: "Just show the location without the address... make
// sense... map view...", "How many miles away from the UIUC campus is the
// apartment...", "And highway is less than a quarter mile...", "Shops...".
// The database half is infra/supabase/tests/0270-area-map-smoke.sql; the
// distances are checked against docs/99-session-notes/
// 2026-10-10-805-north-prospect-whats-nearby.md.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  roundArea, parsePoint, nearbyFrom, namesStreet, streetName, tileLayout, cleanNearby, areaOf, PLACES,
} from '../modules/properties/area.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ area: { ok: true, area: null, nearby: [] } }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadDoorArea: async () => H.area,
  loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
}));
vi.mock('../lib/bounded-read.js', () => ({ boundedRead: (p) => p }));
import { AreaMap, NearbyList, AreaEditor } from '../modules/properties/AreaMap.jsx';
import { VacancyCard } from '../modules/properties/Storefront.jsx';

// 805 N Prospect, Champaign: the parcel point from the research note.
const APT2 = { lat: 40.123364, lng: -88.25828 };

let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.area = { ok: true, area: null, nearby: [] }; });
async function mount(el) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function tap(el) { await act(async () => { el.click(); }); for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); }); }
async function type(label, value) {
  const input = container.querySelector(`input[aria-label="${label}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent === text);

describe('the area (pure)', () => {
  it('a point is snapped to the same 0.005-degree grid the database uses', () => {
    expect(roundArea(APT2.lat, APT2.lng)).toEqual({ lat: 40.125, lng: -88.26 });
    expect(roundArea(91, 0)).toBeNull();
    expect(roundArea('x', 1)).toBeNull();
  });

  it('a point pasted from any map app is read; nothing else is', () => {
    expect(parsePoint('40.123364, -88.25828')).toEqual(APT2);
    expect(parsePoint('40.123364 -88.25828')).toEqual(APT2);
    expect(parsePoint('https://www.google.com/maps/@40.123364,-88.25828,17z')).toEqual(APT2);
    expect(parsePoint('https://maps.google.com/?q=40.123364,-88.25828')).toEqual(APT2);
    expect(parsePoint('805 North Prospect Avenue')).toBeNull();
    expect(parsePoint('95.1, -88.2')).toBeNull();
  });

  it('the distances match the research, straight-line, nearest first, within 15 miles', () => {
    const got = Object.fromEntries(nearbyFrom(APT2).map((l) => [l.label, l.miles]));
    expect(got['I-74 at Exit 181']).toBe(0.7);
    expect(got['UIUC engineering campus (ECE Building)']).toBe(1.7);
    expect(got['University of Illinois Main Quad']).toBe(2);
    expect(got['Downtown Champaign']).toBe(0.9);
    expect(got.Target).toBe(1.3);
    expect(got['Willard Airport (CMI)']).toBe(5.9);
    expect(Object.keys(got)).toHaveLength(PLACES.length);
    const miles = nearbyFrom(APT2).map((l) => l.miles);
    expect(miles).toEqual([...miles].sort((a, b) => a - b));
    // A Danville door is not "33 miles from Target".
    expect(nearbyFrom({ lat: 40.124, lng: -87.63 })).toEqual([]);
  });

  it('no place line names a street', () => {
    for (const p of PLACES) expect(p.label).not.toMatch(/\b(Ave|Avenue|St|Street|Rd|Road|Dr|Drive|Prospect|Mattis|Green|Wright|Park)\b/);
  });

  it('PROVEN-TO-CATCH: a line naming the door\'s street is caught, any case; the number alone is not a street', () => {
    expect(streetName('805 North Prospect Avenue')).toBe('North Prospect Avenue');
    expect(namesStreet('Cafes along north prospect avenue', '805 North Prospect Avenue')).toBe(true);
    expect(namesStreet('Target', '805 North Prospect Avenue')).toBe(false);
    expect(namesStreet('805 feet to the bus', '805 North Prospect Avenue')).toBe(false);
  });

  it('only the database\'s shape reaches the shelf', () => {
    expect(cleanNearby([{ label: ' Campus ', miles: 2 }, { label: '', miles: 1 }, { label: 'Far', miles: 200 }, { label: 'X', miles: 'y' }, null]))
      .toEqual([{ label: 'Campus', miles: 2 }]);
    expect(areaOf({ area_lat: '40.125', area_lng: '-88.260' })).toEqual({ lat: 40.125, lng: -88.26 });
    expect(areaOf({ area_lat: null, area_lng: null })).toBeNull();
  });

  it('the map is 5 x 3 OpenStreetMap tiles at zoom 14 with a 600 m circle (about 82 px at Champaign)', () => {
    const L = tileLayout({ lat: 40.125, lng: -88.26 });
    expect(L.tiles).toHaveLength(15);
    expect(L.tiles.every((t) => /^https:\/\/tile\.openstreetmap\.org\/14\/\d+\/\d+\.png$/.test(t.src))).toBe(true);
    expect(Math.round(L.radiusPx)).toBe(82);
    expect(L.centerX).toBeGreaterThan(512); expect(L.centerX).toBeLessThan(768);
  });
});

describe('on the public shelf', () => {
  it('the card shows the area and what is nearby, credits OpenStreetMap, and never a coordinate', async () => {
    await mount(createElement(VacancyCard, { unit: {
      id: 'r1', rentalId: 'r1', label: '1-bed multi-family in Champaign, Illinois', where: 'Champaign, Illinois', unit: '',
      rent: null, offering: 'short-term', nightly: 150, addressShown: false,
      area: { lat: 40.125, lng: -88.26 }, nearby: [{ label: 'University of Illinois Main Quad', miles: 2 }, { label: 'I-74 at Exit 181', miles: 0.7 }],
    } }));
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(15);
    expect(container.querySelector('[data-testid="area-map-circle"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="area-map"]').getAttribute('aria-label')).toContain('Champaign, Illinois');
    expect(container.textContent).toContain('© OpenStreetMap contributors');
    expect(container.querySelector('[data-testid="nearby"]').textContent).toContain('University of Illinois Main Quad');
    expect(container.textContent).toContain('about 0.7 mi');
    expect(container.innerHTML).not.toMatch(/40\.12|88\.2[0-9]/);
  });

  it('a door with no area set shows no map and no empty heading', async () => {
    await mount(createElement(VacancyCard, { unit: { id: 'r2', rentalId: 'r2', label: 'Place', where: 'Danville, Illinois', offering: 'long-term', addressShown: false, area: null, nearby: [] } }));
    expect(container.querySelector('[data-testid="area-map"]')).toBeNull();
    expect(container.querySelector('[data-testid="nearby"]')).toBeNull();
  });

  it('NearbyList prints nothing for nothing', async () => {
    await mount(createElement(NearbyList, { lines: [] }));
    expect(container.innerHTML).toBe('');
  });

  it('AreaMap draws nothing without an area', async () => {
    await mount(createElement(AreaMap, { area: null }));
    expect(container.innerHTML).toBe('');
  });
});

describe('the family sets the area', () => {
  const RENTAL = { id: 'r-apt2', address: '805 North Prospect Avenue', city: 'Champaign', state: 'Illinois' };

  it('a pasted point gives the area and the distances; only the rounded area is saved', async () => {
    const saved = [];
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: (patch, summary) => saved.push([patch, summary]) }));
    await type('Point from a map app', 'https://www.google.com/maps/@40.123364,-88.25828,17z');
    await tap(button('Use this point'));
    expect(container.querySelector('[data-testid="area-map"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="area-editor-lines"]').textContent).toContain('I-74 at Exit 181 · about 0.7 mi');
    await tap(button('Save the area'));
    expect(saved).toHaveLength(1);
    const [patch, summary] = saved[0];
    expect([patch.area_lat, patch.area_lng]).toEqual([40.125, -88.26]);
    expect(JSON.stringify(patch)).not.toMatch(/40\.1233|88\.2582/);
    expect(patch.nearby).toHaveLength(12);
    expect(summary).toBe('Area on the map and 12 nearby lines');
  });

  it('a line of their own; one naming the street stops the save and says why', async () => {
    const saved = [];
    H.area = { ok: true, area: { lat: 40.125, lng: -88.26 }, nearby: [{ label: 'Target', miles: 1.3 }] };
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: (p) => saved.push(p) }));
    expect(container.querySelector('[data-testid="area-editor-lines"]').textContent).toContain('Target');
    await type('Your own nearby line', 'Bus stop at the corner'); await type('Miles away', '0.1');
    await tap(button('Add line'));
    await type('Your own nearby line', 'Coffee on North Prospect Avenue'); await type('Miles away', '0.3');
    await tap(button('Add line'));
    expect(container.querySelector('[role="alert"]').textContent).toContain('names this door\'s street');
    expect(button('Save the area').disabled).toBe(true);
    await tap(container.querySelector('button[aria-label="Take off Coffee on North Prospect Avenue"]'));
    await tap(button('Save the area'));
    expect(saved[0].nearby).toEqual([{ label: 'Target', miles: 1.3 }, { label: 'Bus stop at the corner', miles: 0.1 }]);
  });

  it('the map comes off whole', async () => {
    const saved = [];
    H.area = { ok: true, area: { lat: 40.125, lng: -88.26 }, nearby: [] };
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: (p) => saved.push(p) }));
    await tap(button('Take the map off'));
    expect(saved).toEqual([{ area_lat: null, area_lng: null, nearby: null }]);
  });

  it('when the area cannot be read, it says so and offers nothing to overwrite', async () => {
    H.area = { ok: false, reason: 'read-failed' };
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: () => {} }));
    expect(container.querySelector('[data-testid="area-editor-unavailable"]')).not.toBeNull();
    expect(button('Save the area')).toBeUndefined();
  });
});
