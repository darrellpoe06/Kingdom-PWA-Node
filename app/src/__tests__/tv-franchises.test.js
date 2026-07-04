// @vitest-environment node
//
// tv-franchises — the curated "same universe" connections (Darrell 2026-07-04:
// "spinoff shows connected... Game of Thrones new spinoff is House of dragons").
// Connections are human-curated KNOWN facts (no algorithm guessing) — these
// tests pin that a real spinoff resolves and an unrelated title returns nothing
// (no invented links, DR-0076).
import { describe, it, expect } from 'vitest';
import { relatedTitles, franchiseOf, hasUniverse, titleKey } from '../lib/tv-franchises.js';
import { genreMatches, GENRES } from '../lib/tv-catalog.js';

describe('tv-franchises — same-universe connections', () => {
  it('Game of Thrones connects to House of the Dragon (and back), excluding self', () => {
    const rel = relatedTitles('Game of Thrones');
    expect(rel).toContain('House of the Dragon');
    expect(rel).not.toContain('Game of Thrones');           // never itself
    expect(relatedTitles('House of the Dragon')).toContain('Game of Thrones'); // symmetric
    expect(franchiseOf('Game of Thrones')).toBe('Game of Thrones');
    expect(hasUniverse('Game of Thrones')).toBe(true);
  });
  it('matches regardless of case / punctuation / articles (import vs lookup)', () => {
    expect(relatedTitles('the game of thrones')).toContain('House of the Dragon');
    expect(relatedTitles('BREAKING BAD')).toContain('Better Call Saul');
    expect(titleKey('Game of Thrones (2011)')).toBe(titleKey('game of thrones'));
  });
  it('an unrelated / standalone title has no invented connections', () => {
    expect(relatedTitles('Some Random Show 12345')).toEqual([]);
    expect(hasUniverse('Some Random Show 12345')).toBe(false);
    expect(franchiseOf('Some Random Show 12345')).toBe('');
    expect(relatedTitles('Downton Abbey')).toEqual([]);     // in the map but single-member → no siblings
  });
});

describe('genre browse', () => {
  it('carries the full genre set from the reference (Action..Western)', () => {
    expect(GENRES[0]).toBe('Action');
    expect(GENRES).toContain('Western');
    expect(GENRES.length).toBeGreaterThan(25);
  });
  it('matches loosely across source vocabularies', () => {
    expect(genreMatches('Sci-Fi', 'Science fiction')).toBe(true);
    expect(genreMatches('Sports', 'Sport')).toBe(true);
    expect(genreMatches('Action & Adventure', 'Action')).toBe(true);
    expect(genreMatches('Comedy', 'Horror')).toBe(false);
    expect(genreMatches('', 'Action')).toBe(false);
  });
});
