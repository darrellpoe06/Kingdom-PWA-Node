// @vitest-environment node
// =============================================================================
// The reader starts where you left off, per reading (Darrell 2026-09-24)
// =============================================================================
// "start where I left off" and "starting at any chapter or step, not just
// beginning to end." One bookmark per reading (lesson, chapter, page), bounded,
// never throwing on a device that cannot store.
//
// Proven-to-catch: the per-reading test fails against a single shared place
// (learn-resume keeps only the last lesson); the finished test fails if a
// lesson heard to the end offers Resume at its end.
import { describe, it, expect } from 'vitest';
import {
  getBookmark, saveBookmark, clearBookmark, offersResume, resumeLabel,
  paragraphOf, paragraphLabels, MAX_BOOKMARKS, BOOKMARKS_KEY,
} from '../lib/reader-bookmarks.js';

function mem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

describe('one bookmark per reading', () => {
  it('two lessons keep two places', () => {
    const storage = mem();
    saveBookmark('lesson-a', { sentence: 12, key: 'k12', para: 3, paras: 10 }, { storage, now: 1 });
    saveBookmark('lesson-b', { sentence: 4, key: 'k4', para: 1, paras: 6 }, { storage, now: 2 });
    expect(getBookmark('lesson-a', { storage })).toMatchObject({ sentence: 12, para: 3, paras: 10, done: false });
    expect(getBookmark('lesson-b', { storage })).toMatchObject({ sentence: 4, para: 1, paras: 6 });
  });

  it('offers Resume only for a real place that is not finished', () => {
    expect(offersResume(null)).toBe(false);
    expect(offersResume({ sentence: 0, para: 0 })).toBe(false);
    expect(offersResume({ sentence: 9, para: 2, done: false })).toBe(true);
    expect(offersResume({ sentence: 99, para: 11, done: true })).toBe(false);
  });

  it('says where, in plain words', () => {
    expect(resumeLabel({ para: 2, paras: 12 })).toBe('Resume · Paragraph 3 of 12');
    expect(resumeLabel({ para: 0, paras: 0 })).toBe('Resume · Paragraph 1');
  });

  it('Start over forgets the place', () => {
    const storage = mem();
    saveBookmark('x', { sentence: 5, para: 1, paras: 4 }, { storage });
    clearBookmark('x', { storage });
    expect(getBookmark('x', { storage })).toBe(null);
  });

  it('stays bounded, dropping the oldest', () => {
    const storage = mem();
    for (let i = 0; i < MAX_BOOKMARKS + 5; i++) saveBookmark(`r${i}`, { sentence: 1 }, { storage, now: i + 1 });
    const all = JSON.parse(storage.getItem(BOOKMARKS_KEY));
    expect(Object.keys(all).length).toBe(MAX_BOOKMARKS);
    expect(all.r0).toBeUndefined();
    expect(all[`r${MAX_BOOKMARKS + 4}`]).toBeTruthy();
  });

  it('a device that cannot store has no bookmarks and never throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    expect(() => saveBookmark('a', { sentence: 3 }, { storage: broken })).not.toThrow();
    expect(getBookmark('a', { storage: broken })).toBe(null);
    expect(getBookmark('a', { storage: null })).toBe(null);
  });
});

describe('paragraphs are the steps a listener picks from', () => {
  const segments = ['In the beginning was the Word.', 'And the Word was with God.', 'All things were made by Him, and without Him was not any thing made.', 'In Him was life.']
    .map((text) => ({ text }));
  const starts = [0, 2, 3];

  it('finds the paragraph a sentence is in', () => {
    expect(paragraphOf(starts, 0)).toBe(0);
    expect(paragraphOf(starts, 1)).toBe(0);
    expect(paragraphOf(starts, 2)).toBe(1);
    expect(paragraphOf(starts, 3)).toBe(2);
    expect(paragraphOf([], 3)).toBe(0);
  });

  it('labels each paragraph by its first words', () => {
    const labels = paragraphLabels(segments, starts, { words: 4 });
    expect(labels.map((l) => l.label)).toEqual([
      '1. In the beginning was…',
      '2. All things were made…',
      '3. In Him was life.',
    ]);
    expect(labels.map((l) => l.sentence)).toEqual([0, 2, 3]);
  });
});
