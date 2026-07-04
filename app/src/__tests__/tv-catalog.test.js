// @vitest-environment node
//
// tv-catalog — the TVmaze show lookup (Darrell 2026-07-04: "look up Game of
// Thrones... it'll show you a picture... bring in all the seasons"). The LIVE
// fetch runs in the browser (public CORS API); here the PARSERS are verified
// against a recorded representative TVmaze sample, and the fetch path is proven
// fail-soft. Injected fetcher — no network.
import { describe, it, expect, afterEach } from 'vitest';
import {
  showBrief, parseSearchResults, parseShow, groupEpisodes, totalEpisodes,
  searchShows, loadShow, __setCatalogFetcher, TV_SOURCE,
} from '../lib/tv-catalog.js';

// A recorded, representative slice of TVmaze's real response shapes.
const SEARCH_SAMPLE = [
  { score: 0.9, show: { id: 82, name: 'Game of Thrones', premiered: '2011-04-17', genres: ['Drama', 'Fantasy'], network: { name: 'HBO' }, image: { medium: 'http://img/got-med.jpg', original: 'http://img/got.jpg' }, summary: '<p>Seven noble families fight.</p>' } },
  { score: 0.2, show: { id: 999, name: 'Game of Thrones: The Last Watch', premiered: '2019-05-26', genres: [], webChannel: { name: 'HBO Max' }, image: null, summary: null } },
  { score: 0.1, show: null }, // malformed row → dropped
];
const SHOW_SAMPLE = {
  id: 82, name: 'Game of Thrones', premiered: '2011-04-17', genres: ['Drama', 'Fantasy'], network: { name: 'HBO' }, image: { medium: 'http://img/got-med.jpg' }, summary: '<p>Seven noble families fight for control.</p>',
  _embedded: {
    episodes: [
      { id: 1, name: 'Winter Is Coming', season: 1, number: 1, airdate: '2011-04-17', runtime: 60 },
      { id: 2, name: 'The Kingsroad', season: 1, number: 2, airdate: '2011-04-24' },
      { id: 20, name: 'The North Remembers', season: 2, number: 1, airdate: '2012-04-01' },
      { id: 99, name: 'A Special', season: null, number: null }, // special → ignored
    ],
  },
};

const okFetch = (json) => async () => ({ ok: true, json: async () => json });
afterEach(() => __setCatalogFetcher(async () => ({ ok: true, json: async () => null })));

describe('parsers (pure) against the recorded TVmaze shape', () => {
  it('showBrief maps id/title/year/network/poster/genre; webChannel + null image tolerated', () => {
    const b = showBrief(SEARCH_SAMPLE[0].show);
    expect(b).toMatchObject({ id: '82', title: 'Game of Thrones', year: '2011', network: 'HBO', poster: 'http://img/got-med.jpg', genre: 'Drama' });
    const b2 = showBrief(SEARCH_SAMPLE[1].show);
    expect(b2.network).toBe('HBO Max');   // falls back to webChannel
    expect(b2.poster).toBe('');           // null image → empty
    expect(showBrief(null)).toBe(null);
  });
  it('parseSearchResults keeps valid rows, drops malformed', () => {
    const rows = parseSearchResults(SEARCH_SAMPLE);
    expect(rows.map((r) => r.id)).toEqual(['82', '999']);
  });
  it('groupEpisodes buckets by season (ignoring specials), sorted', () => {
    const seasons = groupEpisodes(SHOW_SAMPLE._embedded.episodes);
    expect(seasons.map((s) => s.season)).toEqual([1, 2]);
    expect(seasons[0].episodes.map((e) => e.number)).toEqual([1, 2]);
    expect(seasons[0].episodes[0].name).toBe('Winter Is Coming');
    expect(totalEpisodes(seasons)).toBe(3);
  });
  it('parseShow returns the brief + its seasons', () => {
    const show = parseShow(SHOW_SAMPLE);
    expect(show.title).toBe('Game of Thrones');
    expect(show.poster).toBe('http://img/got-med.jpg');
    expect(show.seasons.length).toBe(2);
    expect(parseShow(null)).toBe(null);
  });
});

describe('async fetch path (injected fetcher)', () => {
  it('searchShows requires 2+ chars and returns parsed briefs', async () => {
    __setCatalogFetcher(okFetch(SEARCH_SAMPLE));
    expect(await searchShows('a')).toEqual([]);                 // too short, no call needed
    const rows = await searchShows('game of thrones');
    expect(rows[0].title).toBe('Game of Thrones');
  });
  it('loadShow returns a full show with seasons', async () => {
    __setCatalogFetcher(okFetch(SHOW_SAMPLE));
    const show = await loadShow(82);
    expect(show.seasons.length).toBe(2);
  });
  it('fail-soft: a non-ok response or thrown fetch yields []/null, never throws', async () => {
    __setCatalogFetcher(async () => ({ ok: false, json: async () => null }));
    expect(await searchShows('game of thrones')).toEqual([]);
    __setCatalogFetcher(async () => { throw new Error('offline'); });
    expect(await searchShows('game of thrones')).toEqual([]);
    expect(await loadShow(82)).toBe(null);
  });
  it('carries its public-source provenance', () => {
    expect(TV_SOURCE.name).toBe('TVmaze');
    expect(TV_SOURCE.license).toMatch(/CC BY-SA/);
  });
});
