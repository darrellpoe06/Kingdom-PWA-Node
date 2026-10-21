// @vitest-environment node
//
// tv-where-to-watch — "where is this streaming?" (DR-1168).
//
// Darrell 2026-10-21 asked to "connect their streaming platforms". Whether the
// big services expose a consumer API is an UNVERIFIED LEAD here, not our
// measurement — so rather than assert anything about their policy, we ship no
// control whose working we cannot demonstrate, and we build the answer the
// connect button was reaching for. These tests pin the properties that make that
// answer honest rather than decorative:
//
//   1. UNKNOWN IS NOT A NO (DR-0076). A title we have not checked, and a title
//      TVmaze had no streaming answer for, both read UNKNOWN. Neither ever reads
//      "not available", and the two are told apart.
//   2. NO CONNECT-A-PLATFORM CONTROL EXISTS, anywhere in the module — not built,
//      not stubbed, and not promised in copy.
//
// PROVEN-TO-CATCH: the "unknown is not a no" case below is run against the
// WRONG implementation (a `||`-collapsed meta, and a 'none' state) in
// tv-where-to-watch-proves-catch.test.js, which REQUIRES the assertion to fail.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FREE_SERVICES, freeSearchLinks, freeServiceKeyFor, serviceKey,
  whereToWatch, watchCoverage, isFreeServiceKey,
} from '../lib/tv-where-to-watch.js';

// Stored catalog records, in the real shape tv-time.js `custom[id]` holds.
const NETFLIX_SHOW = { id: '1', title: 'Stranger Things', network: 'Netflix', webChannel: 'Netflix' };
const TUBI_SHOW = { id: '2', title: 'Some Free Show', network: '', webChannel: 'Tubi' };
const HBO_BROADCAST = { id: '3', title: 'Game of Thrones', network: 'HBO', webChannel: '' };
const NEVER_ASKED = { id: '4', title: 'Imported Show', network: '' };          // no webChannel KEY at all
const IMPORTED_WITH_NETWORK = { id: '5', title: 'Old Import', network: 'NBC' }; // ditto, but a network crumb

describe('the free services we actually ship a route for', () => {
  it('ships Tubi, Pluto TV and The Roku Channel — the services Darrell named', () => {
    const names = FREE_SERVICES.map((s) => s.name);
    expect(names).toContain('Tubi');
    expect(names).toContain('Pluto TV');
    expect(names).toContain('The Roku Channel');
  });

  it('does NOT ship Freevee — Amazon shut it down and its home 404s (measured)', () => {
    const blob = JSON.stringify(FREE_SERVICES);
    expect(blob.toLowerCase()).not.toContain('freevee');
  });

  it('builds each MEASURED search route from the title, url-encoded', () => {
    const links = freeSearchLinks('The Office');
    const tubi = links.find((l) => l.key === 'tubi');
    const pluto = links.find((l) => l.key === 'pluto');
    // The MEASURED forms (runs 39558010050 / 39558202527): Tubi carries the
    // query in the PATH, Pluto only in the `q` PARAM. Pluto's path form was my
    // first guess and the probe showed it SILENTLY IGNORES the query (it served
    // the home page) — this assertion is the guard that the correction holds.
    expect(tubi.url).toBe('https://tubitv.com/search/The%20Office');
    expect(tubi.kind).toBe('search');
    expect(pluto.url).toBe('https://pluto.tv/en/search?q=The%20Office');
    expect(pluto.kind).toBe('search');
    expect(pluto.url).not.toMatch(/\/search\/The/);
    expect(links.every((l) => l.free === true)).toBe(true);
  });

  it('a route we could NOT verify is a browse link, not a fake search', () => {
    // The Roku Channel's home page is a 24KB SPA shell that ships no /search
    // href at all (measured, run 39558498265), so no search route could be
    // proven. It is marked 'browse' and carries NO query, rather than pretending
    // to search with a parameter the service would drop on the floor.
    const roku = freeSearchLinks('The Office').find((l) => l.key === 'roku');
    expect(roku.kind).toBe('browse');
    expect(roku.url).toBe('https://therokuchannel.roku.com/');
    expect(roku.url).not.toMatch(/office/i);
  });

  it('every shipped route is one of the two honest kinds', () => {
    for (const l of freeSearchLinks('Anything')) {
      expect(['search', 'browse']).toContain(l.kind);
    }
  });

  it('a blank title yields no links rather than a route to nowhere', () => {
    expect(freeSearchLinks('')).toEqual([]);
    expect(freeSearchLinks('   ')).toEqual([]);
  });

  it('recognizes a free service name however a provider spells it', () => {
    expect(freeServiceKeyFor('Tubi')).toBe('tubi');
    expect(freeServiceKeyFor('Pluto TV')).toBe('pluto');
    expect(freeServiceKeyFor('pluto.tv')).toBe('pluto');
    expect(freeServiceKeyFor('The Roku Channel')).toBe('roku');
    expect(serviceKey('Pluto TV')).toBe('plutotv');
    // An unknown service is NOT called paid — it is simply not called free.
    expect(freeServiceKeyFor('Netflix')).toBe('');
    expect(freeServiceKeyFor('')).toBe('');
    expect(isFreeServiceKey('tubi')).toBe(true);
    expect(isFreeServiceKey('netflix')).toBe(false);
  });
});

describe('whereToWatch — a real provider answer, or honest unknown', () => {
  it('a KNOWN streaming service is reported as streaming, and named', () => {
    const w = whereToWatch(NETFLIX_SHOW);
    expect(w.state).toBe('streaming');
    expect(w.service).toBe('Netflix');
    expect(w.free).toBe(false);
    expect(w.say).toBe('Streaming on Netflix.');
  });

  it('a free ad-supported service is marked free, and says so', () => {
    const w = whereToWatch(TUBI_SHOW);
    expect(w.state).toBe('streaming');
    expect(w.free).toBe(true);
    expect(w.freeKey).toBe('tubi');
    expect(w.say).toMatch(/free with ads on Tubi/);
  });

  it('a broadcaster is reported AS a broadcaster, never promoted to a streaming claim', () => {
    const w = whereToWatch(HBO_BROADCAST);
    expect(w.state).toBe('broadcast-only');
    expect(w.network).toBe('HBO');
    expect(w.service).toBe('');          // HBO is not claimed to be a streamer
    expect(w.say).toMatch(/Aired on HBO/);
    expect(w.say).toMatch(/unknown/);
  });

  // ------------------------------------------------------------------ DR-0076
  it('UNKNOWN IS NOT A NO: nothing ever reads "not available", in any state', () => {
    const all = [NETFLIX_SHOW, TUBI_SHOW, HBO_BROADCAST, NEVER_ASKED, IMPORTED_WITH_NETWORK, {}, null];
    for (const meta of all) {
      const w = whereToWatch(meta);
      expect(w.say.toLowerCase()).not.toContain('not available');
      expect(w.say.toLowerCase()).not.toContain('unavailable');
      expect(w.say.toLowerCase()).not.toContain("isn't streaming");
      expect(w.state).not.toBe('none');
      expect(['streaming', 'broadcast-only', 'unknown']).toContain(w.state);
    }
  });

  it('tells "we never asked" apart from "we asked and TVmaze had nothing"', () => {
    // Never asked: the record carries no webChannel KEY, so a live lookup can
    // still answer it — and the surface offers that lookup.
    const fresh = whereToWatch(NEVER_ASKED);
    expect(fresh.state).toBe('unknown');
    expect(fresh.resolvable).toBe(true);
    expect(fresh.say).toMatch(/until we check/);

    // Asked, and the answer was empty: no more lookup to offer, still unknown.
    const asked = whereToWatch({ id: '9', title: 'Checked Show', network: '', webChannel: '' });
    expect(asked.state).toBe('unknown');
    expect(asked.resolvable).toBe(false);
    expect(asked.say).toMatch(/unknown/);
    expect(asked.say).not.toMatch(/until we check/);
  });

  it('a pre-DR-1168 record keeps its crumb but makes NO streaming claim from it', () => {
    // The old store collapsed network and webChannel into one string, so a
    // stored "NBC" could have been either. It is not upgraded into a service.
    const w = whereToWatch(IMPORTED_WITH_NETWORK);
    expect(w.service).toBe('');
    expect(w.state).toBe('unknown');
    expect(w.resolvable).toBe(true);
    expect(w.network).toBe('NBC');
  });

  it('every state still offers the free-service searches, so no title dead-ends', () => {
    for (const meta of [NETFLIX_SHOW, HBO_BROADCAST, NEVER_ASKED]) {
      expect(whereToWatch(meta).searches.length).toBe(FREE_SERVICES.length);
    }
  });

  it('never throws on junk, and junk is never a verdict', () => {
    for (const bad of [null, undefined, 0, 'nope', [], { title: null }]) {
      const w = whereToWatch(bad);
      expect(w.state).toBe('unknown');
      expect(Array.isArray(w.searches)).toBe(true);
    }
  });
});

describe('watchCoverage — a measured count, never a painted one', () => {
  it('counts known / free / unknown from the real records', () => {
    const c = watchCoverage([NETFLIX_SHOW, TUBI_SHOW, HBO_BROADCAST, NEVER_ASKED]);
    expect(c).toEqual({ total: 4, known: 2, free: 1, unknown: 2 });
  });
  it('an empty list reports zeros, not a guess', () => {
    expect(watchCoverage([])).toEqual({ total: 0, known: 0, free: 0, unknown: 0 });
    expect(watchCoverage(null)).toEqual({ total: 0, known: 0, free: 0, unknown: 0 });
  });
});

describe('the premise is designed around, not papered over', () => {
  const SRC = readFileSync(join(process.cwd(), 'src/lib/tv-where-to-watch.js'), 'utf8');

  it('ships NO connect-an-account control we cannot demonstrate working', () => {
    // Not built, not stubbed, and not promised. The words may appear in the
    // header that EXPLAINS why there is none; what may not appear is a function
    // or an exported name that offers one.
    expect(/export\s+(?:async\s+)?function\s+connect/i.test(SRC)).toBe(false);
    expect(/connectNetflix|connectHulu|linkAccount|oauth/i.test(SRC)).toBe(false);
  });

  it('states the premise in the module, so the next author does not rebuild it', () => {
    expect(SRC).toMatch(/UNVERIFIED LEAD/);
    expect(SRC).toMatch(/DR-0076/);
  });

  it('promises nothing it cannot do: no "coming soon" on a dead road', () => {
    expect(/coming soon|in a future release|will support connecting/i.test(SRC)).toBe(false);
  });
});
