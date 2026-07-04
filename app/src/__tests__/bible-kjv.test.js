// @vitest-environment node
//
// bible-kjv — the whole KJV, hosted in-app (Darrell 2026-07-04: "so we can not
// need to link out to biblegateway"). Proves the resolver parses references,
// resolves VERBATIM public-domain KJV text from the REAL materialized assets,
// and fails soft. The fetcher is pointed at the on-disk public/ files so this is
// a true end-to-end check of the shipped data, not a mock of made-up text.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BIBLE_INDEX, OLD_TESTAMENT, NEW_TESTAMENT, bookMeta, parseRef,
  verseText, chapterVerses, chapterCount, verseCount, __setBibleFetcher,
} from '../lib/bible-kjv.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');

// A fetcher that serves the REAL per-book assets off disk (same files the app
// serves at /bible/kjv/<file>.json), so we verify the shipped text.
beforeAll(() => {
  __setBibleFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

describe('the whole canon is indexed', () => {
  it('has all 66 books, split 39 OT / 27 NT, Genesis first, Revelation last', () => {
    expect(BIBLE_INDEX).toHaveLength(66);
    expect(OLD_TESTAMENT).toHaveLength(39);
    expect(NEW_TESTAMENT).toHaveLength(27);
    expect(BIBLE_INDEX[0].name).toBe('Genesis');
    expect(BIBLE_INDEX[65].name).toBe('Revelation');
  });
  it('carries chapter/verse counts for navigation without a fetch', () => {
    expect(chapterCount('Psalms')).toBe(150);
    expect(chapterCount('Psalm')).toBe(150);        // alias
    expect(verseCount('Genesis', 1)).toBe(31);
    expect(verseCount('John', 3)).toBe(36);
  });
});

describe('reference parsing', () => {
  it('parses plain, ranged, numbered-book, and multiword refs', () => {
    expect(parseRef('John 3:16')).toMatchObject({ book: 'John', file: 'John', chapter: 3, v1: 16, v2: 16 });
    expect(parseRef('John 3:16-18')).toMatchObject({ chapter: 3, v1: 16, v2: 18 });
    expect(parseRef('1 John 2:15')).toMatchObject({ book: '1 John', file: '1John' });
    expect(parseRef('Song of Solomon 1:1')).toMatchObject({ file: 'SongofSolomon' });
    expect(parseRef('Psalm 23:1')).toMatchObject({ book: 'Psalms', file: 'Psalms' });
  });
  it('handles a single-chapter book written without a chapter (Jude 6)', () => {
    expect(parseRef('Jude 6')).toMatchObject({ book: 'Jude', chapter: 1, v1: 6 });
  });
  it('returns null for an unknown book', () => {
    expect(parseRef('Hezekiah 3:1')).toBeNull();
    expect(bookMeta('nope')).toBeNull();
  });
});

describe('verbatim text from the shipped assets', () => {
  it('resolves John 3:16 exactly as the public-domain KJV reads', async () => {
    expect(await verseText('John 3:16')).toBe(
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    );
  });
  it('resolves a range by joining the verses', async () => {
    const t = await verseText('Genesis 1:1-2');
    expect(t).toMatch(/^In the beginning God created the heaven and the earth\./);
    expect(t).toMatch(/Spirit of God moved upon the face of the waters\.$/);
  });
  it('returns a full chapter as [{v,text}] for the reader', async () => {
    const ps23 = await chapterVerses('Psalms', 23);
    expect(ps23).toHaveLength(6);
    expect(ps23[0]).toMatchObject({ v: 1, text: 'The LORD is my shepherd; I shall not want.' });
  });
});

describe('fail-soft (never throws into the render)', () => {
  it('unparseable ref or missing verse resolves to empty, not an error', async () => {
    expect(await verseText('not a ref')).toBe('');
    expect(await verseText('John 999:1')).toBe('');
    expect(await chapterVerses('John', 999)).toEqual([]);
  });
  it('a failing fetch degrades to empty', async () => {
    __setBibleFetcher(async () => ({ ok: false, json: async () => null }));
    expect(await verseText('Isaiah 40:31')).toBe('');
  });
});
