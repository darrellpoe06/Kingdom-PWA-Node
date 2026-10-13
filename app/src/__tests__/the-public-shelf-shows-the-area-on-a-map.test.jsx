// =============================================================================
// THE PUBLIC SHELF: THE AREA ON A MAP WHEN ASKED (DR-0935, 0270, DR-0977)
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
  roundArea, parsePoint, nearbyFrom, namesStreet, streetName, tileLayout, cleanNearby, areaOf, PLACES, OVERPASS,
} from '../modules/properties/area.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ area: { ok: true, area: null, nearby: [] } }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadDoorArea: async () => H.area,
  loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
}));
vi.mock('../lib/bounded-read.js', () => ({ boundedRead: (p) => p }));
import { AreaMap, NearbyList, AreaEditor, MapOnRequest } from '../modules/properties/AreaMap.jsx';
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
  it('a held door: nearby lines show, NO map tile is fetched until asked, then the area is drawn (DR-0977)', async () => {
    await mount(createElement(VacancyCard, { unit: {
      id: 'r1', rentalId: 'r1', label: '1-bed multi-family in Champaign, Illinois', where: 'Champaign, Illinois', unit: '',
      rent: null, offering: 'short-term', nightly: 150, addressShown: false, street: '',
      area: { lat: 40.125, lng: -88.26 }, nearby: [{ label: 'University of Illinois Main Quad', miles: 2 }, { label: 'I-74 at Exit 181', miles: 0.7 }],
    } }));
    // "I only want a map when I want it": nothing drawn, nothing fetched.
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(0);
    expect(container.querySelector('[data-testid="nearby"]').textContent).toContain('University of Illinois Main Quad');
    expect(container.textContent).toContain('about 0.7 miles');
    // A held street gets no link out and no pin (DR-0997): a pin on the rounded
    // area would read as the house.
    expect(container.querySelector('[data-testid="street-view"]')).toBeNull();
    expect(container.querySelector('[data-testid="open-in-maps"]')).toBeNull();
    await tap(container.querySelector('[data-testid="show-map"]'));
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(15);
    expect(container.querySelector('[data-testid="area-map-circle"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="area-map-pin"]')).toBeNull();
    const label = container.querySelector('[data-testid="area-map"]').getAttribute('aria-label');
    expect(label).toContain('Champaign, Illinois');
    expect(label).toContain('The street is not shown');
    expect(container.textContent).toContain('© OpenStreetMap contributors');
    expect(container.innerHTML).not.toMatch(/40\.1233|88\.2582/);
    await tap(container.querySelector('[data-testid="show-map"]'));
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(0);
  });

  it('a shown street (DR-0997): Show on map pins the HOUSE, and Street view stands at it', async () => {
    const calls = [];
    const real = globalThis.fetch;
    globalThis.fetch = async (url) => { calls.push(String(url)); return { json: async () => ({ ok: true, lat: APT2.lat, lng: APT2.lng, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820', source: 'census' }) }; };
    try {
      await mount(createElement(VacancyCard, { unit: {
        id: 'r3', rentalId: 'r3', label: 'Apt 2 at Prospect', where: 'Champaign, Illinois', unit: 'Apt 2',
        offering: 'long-term', addressShown: true, street: '805 North Prospect Avenue', city: 'Champaign', state: 'Illinois',
        // The family's rounded area is stored, as on the live Apt 2: a shown
        // street is pinned on the house anyway, never drawn as the circle.
        area: { lat: 40.125, lng: -88.26 }, nearby: [],
      } }));
      expect(container.querySelector('[data-testid="vacancy-street"]').textContent).toBe('805 North Prospect Avenue');
      // Before anything is looked up, the link is the address in Maps.
      expect(container.querySelector('[data-testid="street-view"]').getAttribute('href'))
        .toBe('https://www.google.com/maps/search/?api=1&query=805%20North%20Prospect%20Avenue%2C%20Champaign%2C%20Illinois');
      expect(container.querySelector('[data-testid="open-in-maps"]')).toBeNull();
      expect(calls).toEqual([]); // nothing looked up on render
      await tap(container.querySelector('[data-testid="show-map"]'));
      expect(calls).toEqual(['/geocode?q=805%20North%20Prospect%20Avenue%2C%20Champaign%2C%20Illinois']);
      expect(container.querySelector('[data-testid="area-map-pin"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="area-map-circle"]')).toBeNull();
      const tiles = [...container.querySelectorAll('[data-testid="area-map-tile"]')].map((t) => t.getAttribute('src'));
      expect(tiles).toHaveLength(15);
      expect(tiles.every((u) => u.startsWith('https://tile.openstreetmap.org/17/'))).toBe(true);
      expect(container.querySelector('[data-testid="area-map"]').getAttribute('aria-label'))
        .toBe('Map of 805 North Prospect Avenue, Champaign, Illinois. The pin is on the house.');
      // Now the point is known, Street view is a plain link into Street View.
      expect(container.querySelector('[data-testid="street-view"]').getAttribute('href'))
        .toBe('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=40.123364,-88.258280');
      // No stored lines, so the ones worked out from the found point are shown.
      expect(container.querySelector('[data-testid="nearby"]').textContent).toContain('University of Illinois Main Quad');
      // Shown, not looked up again.
      await tap(container.querySelector('[data-testid="show-map"]'));
      await tap(container.querySelector('[data-testid="show-map"]'));
      expect(calls).toHaveLength(1);
    } finally { globalThis.fetch = real; }
  });

  it('a shown street whose house cannot be found falls back to its area, and says so', async () => {
    const real = globalThis.fetch;
    globalThis.fetch = async () => ({ json: async () => ({ ok: false, reason: 'census: no match; openstreetmap: no match' }) });
    try {
      await mount(createElement(MapOnRequest, { area: { lat: 40.125, lng: -88.26 }, query: '805 North Prospect Avenue, Champaign, Illinois', streetShown: true }));
      await tap(container.querySelector('[data-testid="show-map"]'));
      expect(container.textContent).toContain('The map could not find this address. This is its area.');
      expect(container.querySelector('[data-testid="area-map-circle"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="area-map-pin"]')).toBeNull();
    } finally { globalThis.fetch = real; }
  });

  it('ONE TAP: Street view before the house is known opens a tab inside the tap and sends it into Street View', async () => {
    const real = globalThis.fetch;
    let release;
    globalThis.fetch = () => new Promise((ok) => { release = () => ok({ json: async () => ({ ok: true, lat: APT2.lat, lng: APT2.lng }) }); });
    const tab = { location: { href: 'about:blank' } };
    let openedDuringTap = false;
    try {
      await mount(createElement(MapOnRequest, { query: '805 North Prospect Avenue, Champaign, Illinois', streetShown: true, openTab: () => { openedDuringTap = !release; return tab; } }));
      const link = container.querySelector('[data-testid="street-view"]');
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
      await act(async () => { link.dispatchEvent(ev); });
      // The tab was opened before the lookup was even sent, so no blocker refuses it.
      expect(openedDuringTap).toBe(true);
      expect(ev.defaultPrevented).toBe(true);
      await act(async () => { release(); });
      for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
      expect(tab.location.href).toBe('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=40.123364,-88.258280');
    } finally { globalThis.fetch = real; }
  });

  it('Street view with the house not found sends the tab to the address in Maps; a blocked tab is asked for again', async () => {
    const real = globalThis.fetch;
    globalThis.fetch = async () => ({ json: async () => ({ ok: false, reason: 'no match' }) });
    const tab = { location: { href: 'about:blank' } };
    try {
      await mount(createElement(MapOnRequest, { query: '1 Imaginary Lane, Nowhere, Illinois', streetShown: true, openTab: () => tab }));
      await tap(container.querySelector('[data-testid="street-view"]'));
      expect(tab.location.href).toBe('https://www.google.com/maps/search/?api=1&query=1%20Imaginary%20Lane%2C%20Nowhere%2C%20Illinois');
      expect(container.textContent).toContain('Opened the address in Maps instead.');
    } finally { globalThis.fetch = real; }
    globalThis.fetch = async () => ({ json: async () => ({ ok: true, lat: APT2.lat, lng: APT2.lng }) });
    try {
      if (root) act(() => root.unmount()); container.remove();
      await mount(createElement(MapOnRequest, { query: '805 North Prospect Avenue, Champaign, Illinois', streetShown: true, openTab: () => null }));
      await tap(container.querySelector('[data-testid="street-view"]'));
      expect(container.textContent).toContain('Street view is ready: tap it again.');
      expect(container.querySelector('[data-testid="street-view"]').getAttribute('href')).toContain('map_action=pano');
    } finally { globalThis.fetch = real; }
  });

  it('PROVEN-TO-CATCH: a HELD street is never given a pin or a Street view, even with an address in hand elsewhere', async () => {
    await mount(createElement(MapOnRequest, { area: { lat: 40.125, lng: -88.26 }, query: '', where: 'Champaign, Illinois' }));
    expect(container.querySelector('[data-testid="street-view"]')).toBeNull();
    await tap(container.querySelector('[data-testid="show-map"]'));
    expect(container.querySelector('[data-testid="area-map-pin"]')).toBeNull();
    expect(container.querySelector('[data-testid="area-map-circle"]')).not.toBeNull();
  });

  it('an address the map cannot find says so and draws nothing', async () => {
    const real = globalThis.fetch;
    globalThis.fetch = async () => ({ json: async () => ({ ok: false, reason: 'census: no match; openstreetmap: no match' }) });
    try {
      await mount(createElement(VacancyCard, { unit: {
        id: 'r4', rentalId: 'r4', label: 'Somewhere', where: 'Nowhere, Illinois', offering: 'long-term', addressShown: true,
        street: '1 Imaginary Lane', city: 'Nowhere', state: 'Illinois', area: null, nearby: [],
      } }));
      await tap(container.querySelector('[data-testid="show-map"]'));
      expect(container.textContent).toContain('The map could not find this address.');
      expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(0);
    } finally { globalThis.fetch = real; }
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

  it('FROM THE ADDRESS (DR-0977): one tap finds the door; the area and 12 lines are saved, never the point', async () => {
    const calls = [];
    const real = globalThis.fetch;
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      // What is nearby is asked around the found point (DR-0998); OpenStreetMap
      // knows nothing here, so the Champaign research is what is listed.
      if (String(url) === OVERPASS) return { ok: true, status: 200, json: async () => ({ elements: [] }) };
      return { json: async () => ({ ok: true, lat: APT2.lat, lng: APT2.lng, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820' }) };
    };
    try {
      const saved = [];
      await mount(createElement(AreaEditor, { rental: RENTAL, onSave: (patch, summary) => saved.push([patch, summary]) }));
      // Opening the editor looks nothing up and draws no map.
      expect(calls).toEqual([]);
      expect(container.querySelector('[data-testid="area-map"]')).toBeNull();
      expect(container.querySelector('[data-testid="area-status"]').textContent).toContain('Not on the map yet');
      await tap(button('Find it from the address'));
      expect(calls).toEqual(['/geocode?q=805%20North%20Prospect%20Avenue%2C%20Champaign%2C%20Illinois', OVERPASS]);
      expect(container.querySelector('[data-testid="area-map"]')).not.toBeNull();
      expect(container.textContent).toContain('805 N PROSPECT AVE, CHAMPAIGN, IL, 61820');
      await tap(button('Save the area'));
      const [patch, summary] = saved[0];
      expect([patch.area_lat, patch.area_lng]).toEqual([40.125, -88.26]);
      expect(JSON.stringify(patch)).not.toMatch(/40\.1233|88\.2582/);
      expect(patch.nearby).toHaveLength(12);
      expect(summary).toBe('Area on the map and 12 nearby lines');
    } finally { globalThis.fetch = real; }
  });

  it('a saved area is not drawn until the family asks', async () => {
    H.area = { ok: true, area: { lat: 40.125, lng: -88.26 }, nearby: [] };
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: () => {} }));
    expect(container.querySelector('[data-testid="area-status"]').textContent).toContain('This door is on the map');
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(0);
    await tap(button('Show on map'));
    expect(container.querySelectorAll('[data-testid="area-map-tile"]')).toHaveLength(15);
  });

  it('a pasted point gives the area and the distances; only the rounded area is saved', async () => {
    const saved = [];
    await mount(createElement(AreaEditor, { rental: RENTAL, onSave: (patch, summary) => saved.push([patch, summary]) }));
    await type('Point from a map app', 'https://www.google.com/maps/@40.123364,-88.25828,17z');
    await tap(button('Use this point'));
    expect(container.querySelector('[data-testid="area-map"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="area-editor-lines"]').textContent).toContain('I-74 at Exit 181 · about 0.7 miles');
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

describe('the card names the door once', () => {
  it('a name that already says the unit is not followed by it again', async () => {
    await mount(createElement(VacancyCard, { unit: { id: 'r5', rentalId: 'r5', label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', where: 'Champaign, Illinois', offering: 'long-term', addressShown: true, street: '805 North Prospect Avenue', area: null, nearby: [] } }));
    expect(container.textContent).toContain('805 North Prospect Avenue Apt 2');
    expect(container.textContent).not.toContain('Apt 2 · Apt 2');
    expect(container.querySelector('[data-testid="vacancy-street"]')).toBeNull();
  });
  it('a name without the unit still gets it', async () => {
    await mount(createElement(VacancyCard, { unit: { id: 'r6', rentalId: 'r6', label: '805 North Prospect Avenue', unit: 'Apt 3', where: 'Champaign, Illinois', offering: 'long-term', addressShown: true, street: '805 North Prospect Avenue', area: null, nearby: [] } }));
    expect(container.textContent).toContain('805 North Prospect Avenue · Apt 3');
  });
});
