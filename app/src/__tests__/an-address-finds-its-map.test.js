// @vitest-environment node
// =============================================================================
// /geocode — an address finds its map, only when asked (DR-0977)
// =============================================================================
// The Census and OpenStreetMap answers are recorded shapes, not live calls:
// the cloud sandbox has no route to either service. The live road is
// witnessed after deploy (DR-0977, Verification).
import { describe, it, expect } from 'vitest';
import {
  cleanQuery, fromCensus, fromNominatim, geocode, geocodeResponse, CENSUS, NOMINATIM, UA,
} from '../../functions/geocode.js';

const CENSUS_HIT = { result: { input: {}, addressMatches: [{ matchedAddress: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820', coordinates: { x: -88.25828, y: 40.123364 } }] } };
const CENSUS_MISS = { result: { input: {}, addressMatches: [] } };
const OSM_HIT = [{ lat: '40.1233', lon: '-88.2583', display_name: '805, North Prospect Avenue, Champaign, Illinois' }];

function fakeFetch(answers) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), headers: init.headers || {}, hasSignal: Boolean(init.signal) });
    const a = answers.shift();
    if (a instanceof Error) throw a;
    return { ok: a.status ? a.status < 400 : true, status: a.status || 200, json: async () => a.body };
  };
  fn.calls = calls;
  return fn;
}

describe('the address asked for', () => {
  it('is cleaned, and refused when it is not an address', () => {
    expect(cleanQuery('  805  North Prospect Avenue,\nChampaign ')).toBe('805 North Prospect Avenue, Champaign');
    expect(cleanQuery('1234')).toBe('');
    expect(cleanQuery('x'.repeat(201))).toBe('');
    expect(cleanQuery('')).toBe('');
  });

  it('reads both services\' shapes, and refuses a point off the earth', () => {
    expect(fromCensus(CENSUS_HIT)).toEqual({ lat: 40.123364, lng: -88.25828, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820', source: 'census' });
    expect(fromCensus(CENSUS_MISS)).toBeNull();
    expect(fromNominatim(OSM_HIT)).toMatchObject({ lat: 40.1233, lng: -88.2583, source: 'openstreetmap' });
    expect(fromNominatim([{ lat: '99', lon: '0' }])).toBeNull();
  });
});

describe('geocode', () => {
  it('the Census answer first, every call bounded by a timeout', async () => {
    const f = fakeFetch([{ body: CENSUS_HIT }]);
    const r = await geocode('805 North Prospect Avenue, Champaign, Illinois', { fetchImpl: f });
    expect(r).toMatchObject({ ok: true, lat: 40.123364, lng: -88.25828, source: 'census' });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].url.startsWith(`${CENSUS}?`)).toBe(true);
    expect(f.calls[0].url).toContain('benchmark=Public_AR_Current');
    expect(f.calls[0].hasSignal).toBe(true);
  });

  it('OpenStreetMap when the Census has no match, with an identifying User-Agent', async () => {
    const f = fakeFetch([{ body: CENSUS_MISS }, { body: OSM_HIT }]);
    const r = await geocode('805 North Prospect Avenue, Champaign, Illinois', { fetchImpl: f });
    expect(r).toMatchObject({ ok: true, source: 'openstreetmap' });
    expect(f.calls[1].url.startsWith(`${NOMINATIM}?`)).toBe(true);
    expect(f.calls[1].headers['user-agent']).toBe(UA);
  });

  it('a failing or hanging service is a "not found", never a throw', async () => {
    const f = fakeFetch([new Error('The operation was aborted due to timeout'), { status: 503, body: {} }]);
    const r = await geocode('805 North Prospect Avenue, Champaign, Illinois', { fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('census: The operation was aborted');
    expect(r.reason).toContain('openstreetmap: HTTP 503');
  });

  it('a non-address is refused without calling anyone', async () => {
    const f = fakeFetch([]);
    expect(await geocode('12', { fetchImpl: f })).toEqual({ ok: false, reason: 'not an address' });
    expect(f.calls).toHaveLength(0);
  });
});

describe('the route', () => {
  it('200 and a week of cache for a found point; 404 no-store when not found; 400 for a non-address', async () => {
    const hit = await geocodeResponse('https://poetech.us/geocode?q=805%20North%20Prospect%20Avenue%2C%20Champaign', fakeFetch([{ body: CENSUS_HIT }]));
    expect(hit.status).toBe(200);
    expect(hit.headers.get('cache-control')).toBe('public, max-age=604800');
    expect(await hit.json()).toMatchObject({ ok: true, lat: 40.123364 });
    const miss = await geocodeResponse('https://poetech.us/geocode?q=1%20Imaginary%20Lane%2C%20Nowhere', fakeFetch([{ body: CENSUS_MISS }, { body: [] }]));
    expect(miss.status).toBe(404);
    expect(miss.headers.get('cache-control')).toBe('no-store');
    const bad = await geocodeResponse('https://poetech.us/geocode?q=12', fakeFetch([]));
    expect(bad.status).toBe(400);
  });
});

describe('findPoint, on the phone', async () => {
  const { findPoint, NOMINATIM_DIRECT } = await import('../modules/properties/area.js');
  const answer = (body, ok = true) => ({ ok, status: ok ? 200 : 404, json: async () => { if (body === 'html') throw new SyntaxError('Unexpected token <'); return body; } });

  it('takes the route\'s point', async () => {
    const calls = [];
    const r = await findPoint('805 North Prospect Avenue, Champaign', { fetchImpl: async (u) => { calls.push(u); return answer({ ok: true, lat: 40.1, lng: -88.2, matched: 'X' }); } });
    expect(r).toMatchObject({ ok: true, point: { lat: 40.1, lng: -88.2 }, via: 'route' });
    expect(calls).toHaveLength(1);
  });

  it('THE OUTAGE (#2057): the route returns the app\'s HTML page, so OpenStreetMap is asked from the phone', async () => {
    const calls = [];
    const r = await findPoint('805 North Prospect Avenue, Champaign', { fetchImpl: async (u) => {
      calls.push(String(u));
      return calls.length === 1 ? answer('html') : answer([{ lat: '40.1233', lon: '-88.2583', display_name: '805, North Prospect Avenue' }]);
    } });
    expect(r).toMatchObject({ ok: true, point: { lat: 40.1233, lng: -88.2583 }, via: 'openstreetmap' });
    expect(calls[1].startsWith(`${NOMINATIM_DIRECT}?`)).toBe(true);
  });

  it('a route that answers "not found" is believed; OpenStreetMap is not asked twice', async () => {
    const calls = [];
    const r = await findPoint('1 Imaginary Lane, Nowhere', { fetchImpl: async (u) => { calls.push(u); return answer({ ok: false, reason: 'no match' }, false); } });
    expect(r).toEqual({ ok: false, reason: 'The map could not find this address.' });
    expect(calls).toHaveLength(1);
  });

  it('both roads down: says so, never throws', async () => {
    const r = await findPoint('805 North Prospect Avenue, Champaign', { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    expect(r).toEqual({ ok: false, reason: 'The map could not be reached just now.' });
  });
});
