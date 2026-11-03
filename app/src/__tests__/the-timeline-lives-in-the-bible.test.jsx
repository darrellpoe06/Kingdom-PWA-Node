// =============================================================================
// The timeline lives in the Bible, and each lesson shows its own books on it
// =============================================================================
// Darrell, 2026-11-03, on L270's chart: "I want this to be inside the bible we
// already have so users can see the timeline with or without the lesson so it's
// accessible to all users... also make it available in a intuitive way so it
// makes the data and timelines clearer in each lesson".
//
// These cases pin the three places the one chart is drawn:
//   1. the Bible reader: all 66 books, each opening its book, the book being
//      read marked, and a line under every chapter heading with that book's
//      date and author;
//   2. every lesson that quotes a book: only those books, on the same chart,
//      with a way to the whole chart in the Bible;
//   3. the road between them: a lesson's link opens the Bible at the timeline.
// Mounted and clicked, against the shipped KJV assets on disk.
// =============================================================================
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import BibleReader from '../components/BibleReader.jsx';
import LessonFigures from '../components/LessonFigures.jsx';
import { __setBibleFetcher, bookMeta } from '../lib/bible-kjv.js';
import { __setXrefFetcher } from '../lib/bible-xref.js';
import { PROGRESS_OF_REVELATION, chartDateOf, chartAuthorOf } from '../lib/progress-of-revelation.js';
import { bookTimelineFigure, booksCitedBy, lessonTimelineFor, figuresFor, spanScale, ordinal } from '../lib/lesson-figures.js';
import { BIBLE_TIMELINE_KEY, bibleHref, requestBibleTimeline, takeBibleTimelineRequest } from '../lib/bible-timeline-link.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '../../public/bible/kjv');
const XREF = join(HERE, '../../public/bible/xref');
const VOICES = join(HERE, '../../public/bible/voices');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fromDisk = (dir) => async (url) => {
  try { const body = readFileSync(join(dir, String(url).split('/').pop()), 'utf8'); return { ok: true, json: async () => JSON.parse(body) }; }
  catch { return { ok: false, json: async () => null }; }
};
beforeAll(() => {
  __setBibleFetcher(async (url) => (/\/voices\//.test(String(url)) ? fromDisk(VOICES)(url) : fromDisk(KJV)(url)));
  __setXrefFetcher(fromDisk(XREF));
});

let container; let root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  try { window.sessionStorage.clear(); } catch { /* noop */ }
});
const settle = async (n = 6) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  await settle();
}
const at = (sel) => container.querySelector(sel);
const need = (sel) => { const e = at(sel); expect(e, `no ${sel}`).toBeTruthy(); return e; };
const click = async (el) => { await act(async () => { el.click(); }); await settle(); };
const heading = () => container.querySelector('h3').textContent;

const L270 = 'll270-the-progress-of-revelation-the-word-came-in-order-and-stands-forever';
const byId = Object.fromEntries(LIVING_LESSONS_MODULES.map((m) => [m.id, m]));

describe('one chart, one source', () => {
  it('every book the chart names is a book the Bible can open', () => {
    expect(PROGRESS_OF_REVELATION).toHaveLength(66);
    for (const r of PROGRESS_OF_REVELATION) expect(bookMeta(r.book), r.book).toBeTruthy();
  });
  it('L270 draws the same 66 rows the Bible does', () => {
    const lesson = figuresFor(byId[L270])[0];
    const bible = bookTimelineFigure({ id: 'bible-timeline' });
    expect(lesson.groups).toEqual(bible.groups);
    expect(lesson.groups.map((g) => g.label)).toEqual(['Old Testament — 39 books', 'New Testament — 27 books']);
  });
});

describe('each lesson shows the books it quotes, on the same chart', () => {
  it('lesson 1 quotes Matthew and Genesis: both rows, in writing order, with the chart’s own words', () => {
    const m = LIVING_LESSONS_MODULES[0];
    expect(m.anchor.ref).toBe('Matthew 5:48; Genesis 17:1');
    expect(booksCitedBy(m)).toEqual(['Genesis', 'Matthew']);
    const f = lessonTimelineFor(m);
    const rows = f.groups.flatMap((g) => g.rows);
    expect(rows.map((r) => r.label)).toEqual(['Genesis', 'Matthew']);
    for (const r of rows) {
      expect(r.dateText).toBe(chartDateOf(r.label));
      expect(r.detail).toBe(chartAuthorOf(r.label));
    }
    expect(f.title).toBe('When the 2 books this lesson quotes were written');
    expect(f.groups.map((g) => g.label)).toEqual(['Old Testament — 1 book', 'New Testament — 1 book']);
    expect(rows.map((r) => r.place)).toEqual(['2nd of 39 written', '3rd of 27 written']);
  });
  it('PROVEN-TO-CATCH: a part of the chart keeps the whole testament’s scale', () => {
    const [ot, nt] = lessonTimelineFor(LIVING_LESSONS_MODULES[0]).groups;
    const part = spanScale(ot);
    const whole = spanScale(bookTimelineFigure().groups[0]);
    expect([part.start, part.end]).toEqual([whole.start, whole.end]);
    // Genesis is a short bar at the start of the Old Testament, not the full width.
    expect(part.at(1405) - part.at(1445)).toBeLessThan(0.05);
    // Drawn on its own years, the same book would fill the width: the defect this pins.
    expect(spanScale({ ...ot, scaleYears: undefined }).at(1405)).toBe(1);
    expect(spanScale(nt).start).toBe(spanScale(bookTimelineFigure().groups[1]).start);
  });
  it('places are said in words, the English way', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 39].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '39th']);
  });
  it('L270 gets no second, smaller chart: it already carries all 66', () => {
    expect(lessonTimelineFor(byId[L270])).toBeNull();
  });
  it('PROVEN-TO-CATCH: a lesson quoting no book, or nothing the Bible names, gets no chart', () => {
    expect(lessonTimelineFor({ id: 'x', anchor: { ref: '' } })).toBeNull();
    expect(lessonTimelineFor({ id: 'x' })).toBeNull();
    expect(lessonTimelineFor({ id: 'x', anchor: { ref: 'Hezekiah 3:1; Proverbs 3:5' } }).groups.flatMap((g) => g.rows).map((r) => r.label)).toEqual(['Proverbs']);
  });
  it('the lesson draws it, and offers the whole chart in the Bible', async () => {
    await mount(createElement(LessonFigures, { module: LIVING_LESSONS_MODULES[0] }));
    const fig = need('[data-figure-id="books-this-lesson-quotes"]');
    expect(fig.querySelectorAll('li[data-row]')).toHaveLength(2);
    expect(fig.textContent).toContain('Genesis · 1445 to 1405 BC · Moses · 2nd of 39 written');
    const link = need('[data-testid="lesson-figure-bible-link"]');
    expect(link.textContent).toBe('See all 66 books on the timeline in the Bible');
    expect(link.getAttribute('href')).toMatch(/[?&]view=church(&|$).*sub=scripture/);
  });
  it('a lesson row is words, not a button: only the Bible opens books from the chart', async () => {
    await mount(createElement(LessonFigures, { module: byId[L270] }));
    expect(at('[data-testid="timeline-open-book"]')).toBeNull();
    need('[data-testid="lesson-figure-bible-link"]');
  });
});

describe('the road from a lesson to the Bible', () => {
  it('the wish is kept once and then cleared', () => {
    requestBibleTimeline();
    expect(window.sessionStorage.getItem(BIBLE_TIMELINE_KEY)).toBe('1');
    expect(takeBibleTimelineRequest()).toBe('');
    expect(takeBibleTimelineRequest()).toBeNull();
    requestBibleTimeline('Isaiah');
    expect(takeBibleTimelineRequest()).toBe('Isaiah');
  });
  it('blocked storage never breaks the Bible', () => {
    const broken = { setItem() { throw new Error('blocked'); }, getItem() { throw new Error('blocked'); }, removeItem() {} };
    expect(() => requestBibleTimeline('Job', broken)).not.toThrow();
    expect(takeBibleTimelineRequest(broken)).toBeNull();
  });
  it('the address is the Scripture room, the door params kept', () => {
    expect(bibleHref({ pathname: '/poetech-app/', search: '?lovecorner=1&lesson=x' })).toBe('/poetech-app/?view=church&lovecorner=1&lesson=x&sub=scripture');
  });
});

describe('the Bible carries the timeline for every reader', () => {
  it('under the heading: this book’s date and author, as the chart prints them', async () => {
    await mount(createElement(BibleReader, { email: null }));
    expect(heading()).toBe('Genesis 1');
    expect(need('[data-testid="bible-book-written"]').textContent).toContain('Written 1445 to 1405 BC · Moses');
    expect(at('[data-testid="bible-timeline"] li[data-row]')).toBeNull(); // folded until asked for
  });
  it('opened: all 66 books, the one being read marked, and a tap opens a book', async () => {
    await mount(createElement(BibleReader, { email: null }));
    await click(need('[data-testid="bible-timeline-toggle"]'));
    const books = container.querySelectorAll('[data-testid="bible-timeline"] [data-testid="timeline-open-book"]');
    expect(books).toHaveLength(66);
    const now = need('[data-testid="bible-timeline"] li[data-current="true"]');
    expect(now.dataset.row).toBe('Genesis');
    expect(now.textContent).toContain('reading now');
    const matthew = Array.from(books).find((b) => b.closest('li').dataset.row === 'Matthew');
    await click(matthew);
    expect(heading()).toBe('Matthew 1');
    expect(need('[data-testid="bible-book-written"]').textContent).toContain('Written AD 50 to 60 · Matthew');
    expect(at('[data-testid="bible-timeline"] li[data-row]')).toBeNull();
  });
  it('“On the timeline” under the heading opens it at the book being read', async () => {
    await mount(createElement(BibleReader, { email: null }));
    await click(need('[data-testid="bible-book-written-show"]'));
    expect(need('[data-testid="bible-timeline"] li[data-current="true"]').dataset.row).toBe('Genesis');
  });
  it('Job says the chart gives no date, never a made-up one', async () => {
    requestBibleTimeline('Job');
    await mount(createElement(BibleReader, { email: null }));
    expect(heading()).toBe('Job 1');
    expect(need('[data-testid="bible-book-written"]').textContent).toContain('The chart gives no date · Anonymous');
  });
  it('arriving from a lesson, the timeline is already open, once', async () => {
    requestBibleTimeline();
    await mount(createElement(BibleReader, { email: null }));
    expect(container.querySelectorAll('[data-testid="bible-timeline"] li[data-row]')).toHaveLength(66);
    expect(window.sessionStorage.getItem(BIBLE_TIMELINE_KEY)).toBeNull();
  });
});
