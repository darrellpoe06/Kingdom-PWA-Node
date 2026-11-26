// =============================================================================
// The Bible keeps its place (Darrell 2026-11-26: "the Bible should stay at the
// last location that it was at, that you were using it... It should keep its
// locations."). Measured before: read John 3 to verse 16, switch tabs, come
// back -> Genesis 1. This pins the fix on the REAL reader with the shipped KJV
// on disk: the place survives a remount (tab switch), a reload (storage only),
// bad or blocked storage never breaks the reader, and a deliberate jump (a
// lesson's timeline link) overrides the saved place and becomes the new one.
// The gate is proven to catch: with the restore removed (openingPlace ignoring
// `saved`), the remount and reload cases fail (run 2026-11-26).
// =============================================================================
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import BibleReader from '../components/BibleReader.jsx';
import { __setBibleFetcher } from '../lib/bible-kjv.js';
import { __setXrefFetcher } from '../lib/bible-xref.js';
import { requestBibleTimeline } from '../lib/bible-timeline-link.js';
import {
  BIBLE_PLACE_KEY, readBiblePlace, saveBiblePlace, clearBiblePlace, normalizePlace, openingPlace, verseAtLine,
} from '../lib/bible-place.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '../../public/bible/kjv');
const XREF = join(HERE, '../../public/bible/xref');
const VOICES = join(HERE, '../../public/bible/voices');
const fromDisk = (dir) => async (url) => {
  try { const body = readFileSync(join(dir, String(url).split('/').pop()), 'utf8'); return { ok: true, json: async () => JSON.parse(body) }; }
  catch { return { ok: false, json: async () => null }; }
};
beforeAll(() => {
  window.scrollBy = vi.fn(); // jsdom has no layout; the landing's scroll is asserted as a call
  __setBibleFetcher(async (url) => (/\/voices\//.test(String(url)) ? fromDisk(VOICES)(url) : fromDisk(KJV)(url)));
  __setXrefFetcher(fromDisk(XREF));
});

let container; let root;
async function unmount() {
  try { await act(async () => { if (root) root.unmount(); }); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
}
afterEach(async () => {
  await unmount();
  vi.restoreAllMocks();
  try { window.localStorage.removeItem(BIBLE_PLACE_KEY); window.sessionStorage.clear(); } catch { /* noop */ }
});
const settle = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(BibleReader, { email: null })); });
  await settle();
}
const heading = () => {
  const h = Array.from(container.querySelectorAll('h3')).find((x) => /\d+$/.test(x.textContent.trim()));
  return h ? h.textContent.trim() : '';
};
const focused = () => {
  const row = container.querySelector('[data-verse].bg-\\[\\#F2F4EC\\]');
  return row ? Number(row.getAttribute('data-verse')) : null;
};
const setValue = (el, val) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
};
const clickText = async (re) => {
  const b = Array.from(container.querySelectorAll('button')).find((x) => re.test((x.textContent || '').trim()));
  if (!b) throw new Error(`no button ${re}`);
  await act(async () => { b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  await settle();
};
const jumpTo = async (ref) => {
  const input = container.querySelector('input');
  await act(async () => { setValue(input, ref); });
  await clickText(/^Go$/);
};
const stored = () => JSON.parse(window.localStorage.getItem(BIBLE_PLACE_KEY) || 'null');

describe('lib/bible-place — ids and indexes only, fail-soft', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
  it('round-trips a real place and keeps no text', () => {
    const s = mem();
    expect(saveBiblePlace({ book: 'John', chapter: 3, verse: 16, text: 'For God so loved' }, s, 5)).toEqual({ book: 'John', chapter: 3, verse: 16 });
    expect(JSON.parse(s.getItem(BIBLE_PLACE_KEY))).toEqual({ v: 1, book: 'John', chapter: 3, verse: 16, at: 5 });
    expect(readBiblePlace(s)).toEqual({ book: 'John', chapter: 3, verse: 16 });
    clearBiblePlace(s);
    expect(readBiblePlace(s)).toBeNull();
  });
  it('a place that is not real is not kept or read', () => {
    expect(normalizePlace({ book: 'Hezekiah', chapter: 1 })).toBeNull();
    expect(normalizePlace({ book: 'Jude', chapter: 2 })).toBeNull();       // Jude has one chapter
    expect(normalizePlace({ book: 'John', chapter: 3, verse: 99 })).toEqual({ book: 'John', chapter: 3, verse: null });
    expect(normalizePlace({ book: 'John', chapter: '3' })).toBeNull();
    const s = mem();
    s.setItem(BIBLE_PLACE_KEY, '{not json');
    expect(readBiblePlace(s)).toBeNull();
  });
  it('blocked storage never throws', () => {
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    expect(readBiblePlace(broken)).toBeNull();
    expect(() => saveBiblePlace({ book: 'John', chapter: 3 }, broken)).not.toThrow();
    expect(() => clearBiblePlace(broken)).not.toThrow();
    expect(readBiblePlace(null)).toBeNull();
  });
  it('a deliberate jump wins over the saved place; Genesis 1 when there is neither', () => {
    expect(openingPlace({ jump: { book: 'Romans', chapter: 1 }, saved: { book: 'John', chapter: 3, verse: 16 } }))
      .toEqual({ book: 'Romans', chapter: 1, verse: null, restored: false });
    expect(openingPlace({ saved: { book: 'John', chapter: 3, verse: 16 } }))
      .toEqual({ book: 'John', chapter: 3, verse: 16, restored: true });
    expect(openingPlace({})).toEqual({ book: 'Genesis', chapter: 1, verse: null, restored: false });
  });
  it('the verse at the reading line', () => {
    const rows = [{ v: 1, top: 100, bottom: 150 }, { v: 2, top: 154, bottom: 220 }, { v: 3, top: 224, bottom: 300 }];
    expect(verseAtLine(rows, 200)).toBe(2);
    expect(verseAtLine(rows, 50)).toBeNull();     // above the chapter's first verse
    expect(verseAtLine(rows, 400)).toBeNull();    // past the chapter's end
    expect(verseAtLine([], 200)).toBeNull();
  });
});

describe('the Bible reader keeps its place', () => {
  it('first open, nothing saved: Genesis 1, and that is remembered', async () => {
    await mount();
    expect(heading()).toBe('Genesis 1');
    expect(container.querySelector('[data-testid="bible-picked-up"]')).toBeNull();
    expect(stored()).toMatchObject({ book: 'Genesis', chapter: 1, verse: null });
  });

  it('after a remount (a tab switch) it opens where the reader was, verse marked', async () => {
    await mount();
    await jumpTo('John 3:16');
    expect(heading()).toBe('John 3');
    expect(stored()).toMatchObject({ book: 'John', chapter: 3, verse: 16 });
    await unmount();
    await mount();
    expect(heading()).toBe('John 3');
    expect(focused()).toBe(16);
    expect(container.querySelector('[data-testid="bible-picked-up"]').textContent).toContain('John 3:16');
  });

  it('after a reload (storage only) it opens at the saved chapter and verse', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'Psalms', chapter: 23, verse: 4, at: 1 }));
    window.scrollBy.mockClear();
    await mount();
    expect(heading()).toBe('Psalms 23');
    expect(focused()).toBe(4);
    expect(window.scrollBy).toHaveBeenCalled(); // it lands on the verse, not just the chapter
  });

  it('moving chapter is remembered; the book list is still one tap', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'Romans', chapter: 8, verse: null, at: 1 }));
    await mount();
    expect(heading()).toBe('Romans 8');
    await clickText(/^Next ›$/);
    expect(heading()).toBe('Romans 9');
    expect(stored()).toMatchObject({ book: 'Romans', chapter: 9, verse: null });
    await clickText(/^All 66 books$/);
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Revelation')).toBe(true);
  });

  it('the picked-up line offers the book list in one tap', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'Mark', chapter: 4, verse: 39, at: 1 }));
    await mount();
    await clickText(/^Books$/);
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Revelation')).toBe(true);
  });

  it('Start at Genesis 1 forgets the place', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'Mark', chapter: 4, verse: 39, at: 1 }));
    await mount();
    await clickText(/^Start at Genesis 1$/);
    expect(heading()).toBe('Genesis 1');
    expect(stored()).toMatchObject({ book: 'Genesis', chapter: 1, verse: null });
  });

  it('bad or missing storage opens Genesis 1 and never breaks', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, '{oops');
    await mount();
    expect(heading()).toBe('Genesis 1');
    await unmount();
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ book: 'Hezekiah', chapter: 2 }));
    await mount();
    expect(heading()).toBe('Genesis 1');
    await unmount();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await mount();
    expect(heading()).toBe('Genesis 1');
  });

  it('a deliberate jump (the lesson timeline link) overrides the saved place, then becomes it', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'John', chapter: 3, verse: 16, at: 1 }));
    requestBibleTimeline('Romans');
    await mount();
    expect(heading()).toBe('Romans 1');
    expect(container.querySelector('[data-testid="bible-picked-up"]')).toBeNull();
    expect(stored()).toMatchObject({ book: 'Romans', chapter: 1, verse: null });
    await unmount();
    await mount();
    expect(heading()).toBe('Romans 1');
  });

  it('scrolling records the verse at the middle of the screen, not while the page settles', async () => {
    window.localStorage.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, book: 'John', chapter: 3, verse: 5, at: 1 }));
    await mount();
    const rows = Array.from(container.querySelectorAll('[data-verse]'));
    expect(rows.length).toBe(36);
    // Lay the chapter out so verse 10 sits on the middle line.
    const mid = window.innerHeight / 2;
    rows.forEach((el, i) => {
      const top = mid - (9 - i) * 40 - 20;
      el.getBoundingClientRect = () => ({ top, bottom: top + 36, height: 36, left: 0, right: 0, width: 0 });
    });
    const scroll = async () => {
      await act(async () => { document.dispatchEvent(new window.Event('scroll')); });
      await act(async () => { await new Promise((r) => setTimeout(r, 40)); });
    };
    // Just landed on verse 5: a scroll now is the page settling, not the reader.
    await scroll();
    expect(stored()).toMatchObject({ book: 'John', chapter: 3, verse: 5 });
    // The reader's own touch ends the settling; their scroll is followed.
    await act(async () => { window.dispatchEvent(new window.Event('pointerdown')); });
    await scroll();
    expect(stored()).toMatchObject({ book: 'John', chapter: 3, verse: 10 });
  });
});
