// tv-popular — the curated "Popular picks" starter catalog + genre grouping
// (Darrell 2026-07-04: "show the currently most watched shows... sort under drama
// etc"). Pins that the catalog is well-formed, grouping honors the order, empty
// groups drop, already-tracked shows are excluded, and no pick silently vanishes.
import { describe, it, expect } from 'vitest';
import {
  POPULAR_SHOWS, POPULAR_GENRE_ORDER, popularByGenre, popularCount,
} from '../lib/tv-popular.js';
import { GENRES } from '../lib/tv-catalog.js';

describe('POPULAR_SHOWS — a clean curated catalog', () => {
  it('every pick has a non-empty title and genre', () => {
    expect(POPULAR_SHOWS.length).toBeGreaterThan(20);
    for (const s of POPULAR_SHOWS) {
      expect(typeof s.title).toBe('string');
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(typeof s.genre).toBe('string');
      expect(s.genre.trim().length).toBeGreaterThan(0);
    }
  });
  it('every genre tag is a real catalog GENRE (chips line up)', () => {
    for (const s of POPULAR_SHOWS) {
      expect(GENRES, `"${s.title}" tagged with unknown genre "${s.genre}"`).toContain(s.genre);
    }
  });
  it('has no duplicate titles', () => {
    const titles = POPULAR_SHOWS.map((s) => s.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('popularCount counts the real picks', () => {
    expect(popularCount()).toBe(POPULAR_SHOWS.length);
  });
});

describe('popularByGenre — grouped, ordered, honest', () => {
  it('groups by genre in POPULAR_GENRE_ORDER first', () => {
    const groups = popularByGenre();
    const genres = groups.map((g) => g.genre);
    // the ordered genres that exist appear in the given order, ahead of any extras
    const orderedPresent = POPULAR_GENRE_ORDER.filter((g) => genres.includes(g));
    expect(genres.slice(0, orderedPresent.length)).toEqual(orderedPresent);
  });
  it('drops empty groups and never loses a pick', () => {
    const groups = popularByGenre();
    const flat = groups.flatMap((g) => g.shows);
    expect(flat.length).toBe(POPULAR_SHOWS.length);
    for (const g of groups) expect(g.shows.length).toBeGreaterThan(0);
  });
  it('every show ends up under its own genre', () => {
    for (const g of popularByGenre()) {
      for (const s of g.shows) expect(s.genre).toBe(g.genre);
    }
  });
  it('excludes already-tracked titles (case/space-insensitive)', () => {
    const first = POPULAR_SHOWS[0].title;
    const groups = popularByGenre(POPULAR_SHOWS, undefined, new Set([`  ${first.toLowerCase()} `]));
    const flat = groups.flatMap((g) => g.shows).map((s) => s.title);
    expect(flat).not.toContain(first);
    expect(flat.length).toBe(POPULAR_SHOWS.length - 1);
  });
  it('an appended (non-ordered) genre still surfaces, sorted after the ordered ones', () => {
    const shows = [{ title: 'A Western Show', genre: 'Western' }, { title: 'A Drama', genre: 'Drama' }];
    const groups = popularByGenre(shows, ['Drama'], null);
    expect(groups.map((g) => g.genre)).toEqual(['Drama', 'Western']);
  });
  it('is empty-safe', () => {
    expect(popularByGenre([])).toEqual([]);
    expect(popularByGenre(null)).toEqual([]);
  });
});
