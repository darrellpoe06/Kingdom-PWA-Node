// =============================================================================
// scripture-order — open verses read in the order they happened, as far as the
// Word settles it, otherwise in the order of Scripture
// =============================================================================
// Darrell, 2026-09-08: "have them chronological... as much as they can be...
// so it makes sense based on their timelines and or the flow of scriptures."
//
// PROVEN-TO-CATCH (DR-0076 §3): a book left out of every era fails "every
// book is placed"; Job sorted after Malachi (shelf order winning over
// timeline) fails the era case; a within-book verse sorted out of order fails
// the flow case; an unparseable reference crashing the sort fails the
// fail-soft case; a chip row or a WordInline that renders its verses in
// author order rather than timeline order fails the render cases.
import React, { act } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import VerseChips from '../components/VerseChips.jsx';
import WordInline from '../components/WordInline.jsx';
import {
  ERAS, OPEN_PLACEMENTS, eraOf, compareRefs, sortRefs, unplacedBooks, orderKey,
} from '../lib/scripture-order.js';
import { BIBLE_INDEX } from '../lib/bible-kjv.js';
import { __resetShowTheWord, setShowTheWord } from '../lib/show-the-word.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
  __resetShowTheWord();
});
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const regions = (h) => [...h.querySelectorAll('[role="region"]')].map((r) => r.getAttribute('aria-label'));

describe('the era table', () => {
  it('places every one of the 66 books in exactly one era', () => {
    expect(BIBLE_INDEX).toHaveLength(66);
    expect(unplacedBooks()).toEqual([]);
    const all = ERAS.flatMap((e) => e.books);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(66);
  });

  it('names the placements the Word leaves open instead of resolving them silently', () => {
    for (const book of Object.keys(OPEN_PLACEMENTS)) {
      expect(eraOf(book)).toBeLessThan(ERAS.length);
      expect(OPEN_PLACEMENTS[book].length).toBeGreaterThan(20);
    }
    expect(OPEN_PLACEMENTS.Job).toMatch(/patriarchal/);
  });

  it('carries order, never a date', () => {
    for (const e of ERAS) expect(JSON.stringify(e)).not.toMatch(/\bBC\b|\bAD\b|\d{3,4}/);
  });
});

describe('the order', () => {
  it('timeline beats the shelf: Job reads among the patriarchs, the prophets with the kings', () => {
    expect(sortRefs(['Malachi 3:6', 'Job 19:25', 'Genesis 12:1'])).toEqual(['Genesis 12:1', 'Job 19:25', 'Malachi 3:6']);
    expect(compareRefs('Isaiah 53:5', 'Ezra 1:1')).toBeLessThan(0);   // divided kingdom before the return
    expect(compareRefs('Psalm 23:1', '1 Kings 3:9')).toBeLessThan(0); // united before divided
  });

  it('within an era the Word\'s own arrangement holds, then chapter and verse', () => {
    expect(sortRefs(['Genesis 6:5', 'Genesis 6:2', 'Genesis 3:15', 'Genesis 6:4'])).toEqual(['Genesis 3:15', 'Genesis 6:2', 'Genesis 6:4', 'Genesis 6:5']);
    expect(sortRefs(['Deuteronomy 6:4', 'Exodus 3:14', 'Numbers 24:17'])).toEqual(['Exodus 3:14', 'Numbers 24:17', 'Deuteronomy 6:4']);
    expect(sortRefs(['John 1:1', 'Matthew 1:1'])).toEqual(['Matthew 1:1', 'John 1:1']);
  });

  it('a reference this app cannot read sorts last and never crashes the sort', () => {
    expect(orderKey('not a verse')).toBeNull();
    expect(sortRefs(['not a verse', 'Genesis 1:1', ''])).toEqual(['Genesis 1:1', 'not a verse', '']);
    expect(sortRefs([])).toEqual([]);
    expect(sortRefs(null)).toEqual([]);
  });

  it('is stable — equal keys keep the author\'s order', () => {
    expect(sortRefs(['Genesis 1:1', 'Genesis 1:1'])).toEqual(['Genesis 1:1', 'Genesis 1:1']);
  });
});

describe('on the surface', () => {
  const load = vi.fn(async (r) => `text of ${r}`);

  it('a chip row reads in order, and so do the verses beneath it', async () => {
    setShowTheWord(true);
    const host = render(<VerseChips refs={['Malachi 3:6', 'Genesis 12:1', 'Job 19:25']} load={load} />);
    const chips = [...host.querySelectorAll('button')].map((b) => b.textContent);
    expect(chips).toEqual(['Genesis 12:1', 'Job 19:25', 'Malachi 3:6']);
    await settle();
    expect(regions(host)).toEqual(['Genesis 12:1', 'Job 19:25', 'Malachi 3:6']);
  });

  it('prose stays exactly as written, while the verses beneath it read in order', async () => {
    setShowTheWord(true);
    const text = 'Malachi 3:6 echoes Genesis 12:1 and Job 19:25.';
    const host = render(<WordInline text={text} load={load} />);
    expect(host.querySelector('p').textContent).toBe(text);
    await settle();
    expect(regions(host)).toEqual(['Genesis 12:1', 'Job 19:25', 'Malachi 3:6']);
  });
});
