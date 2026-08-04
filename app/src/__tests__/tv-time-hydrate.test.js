// @vitest-environment node
//
// The 2026-08-04 TV Time comprehensive-review pins — the pure halves.
// The wall "don't work" report traced to four defects; these gate the three
// that live in lib code:
//   G1 — a zip-imported show's "seasons" were only the episodes already
//        watched (nothing left to check off; progress a permanent 100%).
//        hydrateShow merges the catalog's FULL record in place, keeping the
//        id and every checkmark.
//   G2 — imports carried genre:'Show', so genre chips emptied the wall;
//        hydration fills the real genre (and only when the stored one is
//        the generic placeholder).
//   G3 — poster lookup passed disambiguated titles verbatim ("EMPIRE (2015)",
//        "LOVE IS___" → zero hits), cached the failure for the whole session,
//        and never tried the other keyless source.
import { describe, it, expect, afterEach } from 'vitest';
import { hydrateShow, untrack, normalize, addCustomShow } from '../lib/tv-time.js';
import { normalizeTitleQuery, resolvePoster, __setCatalogFetcher, __resetPosterCache } from '../lib/tv-catalog.js';

afterEach(() => { __resetPosterCache(); __setCatalogFetcher(async () => ({ ok: true, json: async () => null })); });

// An imported entry as tv-time-import-zip actually creates it: tvt- slug id,
// generic genre, no poster, seasons synthesized from watched episodes only.
const IMPORTED = {
  version: 3,
  shows: { 'tvt-empire': { status: 'watching', rating: 0, comments: [], watched: { '1x1': true } } },
  custom: { 'tvt-empire': { id: 'tvt-empire', kind: 'show', title: 'EMPIRE (2015)', genre: 'Show', poster: '', year: '', network: '', seasons: [{ season: 1, episodes: [{ number: 1, name: 'Pilot', airdate: '' }] }] } },
};
const FULL = {
  id: 100, kind: 'show', title: 'Empire', genre: 'Drama', poster: 'https://img/e.jpg', year: '2015', network: 'FOX',
  seasons: [
    { season: 1, episodes: [{ number: 1, name: 'Pilot', airdate: '' }, { number: 2, name: 'Outspoken King', airdate: '' }] },
    { season: 2, episodes: [{ number: 1, name: 'The Devils Are Here', airdate: '' }] },
  ],
};

describe('hydrateShow — the missing half of the TV Time import (G1/G2)', () => {
  it('merges the full record in place: real genre + poster + FULLER seasons, same id, checkmarks kept', () => {
    const next = hydrateShow(IMPORTED, 'tvt-empire', FULL);
    const meta = next.custom['tvt-empire'];
    expect(meta.genre).toBe('Drama');
    expect(meta.poster).toBe('https://img/e.jpg');
    expect(meta.seasons).toHaveLength(2);
    expect(meta.sourceId).toBe('100');
    // the watch-state key and the checkmark survive untouched
    expect(next.shows['tvt-empire'].watched['1x1']).toBe(true);
  });
  it('progress can no longer read a fake 100%: total now exceeds watched', () => {
    const next = hydrateShow(IMPORTED, 'tvt-empire', FULL);
    const total = next.custom['tvt-empire'].seasons.reduce((n, s) => n + s.episodes.length, 0);
    expect(total).toBe(3); // was 1 (only the watched episode) before hydration
  });
  it('never downgrades: a stored real genre/poster and a fuller season list are kept', () => {
    const hydrated = hydrateShow(IMPORTED, 'tvt-empire', FULL);
    const again = hydrateShow(hydrated, 'tvt-empire', { id: 200, title: 'Empire', genre: 'Soap', poster: 'https://img/other.jpg', seasons: [{ season: 1, episodes: [{ number: 1, name: 'Pilot', airdate: '' }] }] });
    const meta = again.custom['tvt-empire'];
    expect(meta.genre).toBe('Drama');
    expect(meta.poster).toBe('https://img/e.jpg');
    expect(meta.seasons).toHaveLength(2);
    expect(meta.sourceId).toBe('100'); // first hydration wins
  });
  it('sourceId survives normalize (the once-only marker syncs like the rest)', () => {
    const next = normalize(hydrateShow(IMPORTED, 'tvt-empire', FULL));
    expect(next.custom['tvt-empire'].sourceId).toBe('100');
  });
  it('is a no-op for movies, unknown ids, and empty input', () => {
    expect(hydrateShow(IMPORTED, 'nope', FULL).custom['tvt-empire'].genre).toBe('Show');
    expect(hydrateShow(IMPORTED, 'tvt-empire', null)).toEqual(normalize(IMPORTED));
  });
});

describe('untrack — no orphaned metadata (G7)', () => {
  it('removes the cached custom entry with the watch-state', () => {
    const st = addCustomShow({ version: 3, shows: {}, custom: {} }, { title: 'Old Show' });
    const id = Object.keys(st.custom)[0];
    const next = untrack(st, id);
    expect(next.shows[id]).toBeUndefined();
    expect(next.custom[id]).toBeUndefined();
  });
});

describe('normalizeTitleQuery — real imported title shapes (G3)', () => {
  it('strips the trailing disambiguation year and trailing underscores', () => {
    expect(normalizeTitleQuery('EMPIRE (2015)')).toBe('EMPIRE');
    expect(normalizeTitleQuery('LOVE IS___')).toBe('LOVE IS');
    expect(normalizeTitleQuery('  Game  of Thrones ')).toBe('Game of Thrones');
  });
  it('leaves interior years and ordinary titles alone', () => {
    expect(normalizeTitleQuery('1923')).toBe('1923');
    expect(normalizeTitleQuery('9-1-1')).toBe('9-1-1');
  });
});

describe('resolvePoster — survives rate limits and falls across sources (G3)', () => {
  const SHOW_HIT = [{ score: 1, show: { id: 5, name: 'Empire', premiered: '2015-01-07', genres: ['Drama'], image: { medium: 'https://img/e.jpg' } } }];
  it('queries with the NORMALIZED title, so "EMPIRE (2015)" finds its poster', async () => {
    const seen = [];
    __setCatalogFetcher(async (url) => { seen.push(String(url)); return { ok: true, json: async () => (String(url).includes('/search/shows') ? SHOW_HIT : { results: [] }) }; });
    expect(await resolvePoster('EMPIRE (2015)', 'show')).toBe('https://img/e.jpg');
    expect(seen.some((u) => u.includes('q=EMPIRE') && !u.includes('2015'))).toBe(true);
  });
  it('a failed lookup is NOT cached for the session — the next view retries', async () => {
    __setCatalogFetcher(async () => ({ ok: false, json: async () => null })); // the 429 case
    expect(await resolvePoster('Empire', 'show')).toBe('');
    __setCatalogFetcher(async (url) => ({ ok: true, json: async () => (String(url).includes('/search/shows') ? SHOW_HIT : { results: [] }) }));
    expect(await resolvePoster('Empire', 'show')).toBe('https://img/e.jpg'); // retried, not blank-forever
  });
  it('falls to the other keyless source when the primary has no artwork', async () => {
    __setCatalogFetcher(async (url) => {
      const u = String(url);
      if (u.includes('/search/shows')) return { ok: true, json: async () => [] };
      if (u.includes('itunes')) return { ok: true, json: async () => ({ results: [{ trackId: 7, trackName: 'Empire', artworkUrl100: 'https://is/100x100bb.jpg', releaseDate: '2015-01-07', primaryGenreName: 'Drama' }] }) };
      return { ok: false, json: async () => null };
    });
    expect(await resolvePoster('Empire', 'show')).toBe('https://is/600x600bb.jpg');
  });
});
