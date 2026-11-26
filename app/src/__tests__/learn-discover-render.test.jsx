// @vitest-environment jsdom
// =============================================================================
// The discovery page, rendered over the real curriculum
// =============================================================================
// Darrell 2026-11-26: the page is the Learning Zone's front door. "Browse All
// Lessons" must open the existing Learn, a lesson must open through Learn's own
// opener, Continue Learning must be real saved progress (and absent when there
// is none), and a search result must show the engaging promotional title WITH
// the lesson's original title preserved.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnDiscover from '../components/learn-discover/LearnDiscover.jsx';
import INDEX from '../lib/learn-discover-index.json';
import { CATEGORIES } from '../lib/learn-discover-categories.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const kjv = { name: 'Matthew', chapters: Array.from({ length: 30 }, () => Array.from({ length: 60 }, (_, i) => `verse ${i + 1}`)) };
const getBook = async () => kjv;

let root = null;
let host = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null;
  host = null;
});

async function mount(props = {}) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(createElement(LearnDiscover, { getBook, places: [], now: new Date(2026, 10, 26), ...props })); });
  await act(async () => { await Promise.resolve(); });
  return host;
}
const $ = (sel) => host.querySelector(sel);
const $$ = (sel) => [...host.querySelectorAll(sel)];
async function type(value) {
  const input = $('#ld-q');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  await act(async () => { set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); });
}

describe('the front door', () => {
  it('welcomes, offers search, and names the real inventory', async () => {
    await mount();
    expect($('h1').textContent).toBe('Welcome to the Learning Zone');
    expect($('#ld-q')).toBeTruthy();
    expect(host.textContent).toContain(`${INDEX.counts.lessons} lessons across ${INDEX.counts.courses} courses`);
  });

  it('Browse All Lessons calls the handler that opens the existing Learn, twice on the page', async () => {
    const onBrowseAll = vi.fn();
    await mount({ onBrowseAll });
    const buttons = $$('button').filter((b) => b.textContent === 'Browse All Lessons');
    expect(buttons.length).toBe(2);
    await act(async () => { buttons[0].click(); });
    expect(onBrowseAll).toHaveBeenCalledTimes(1);
  });

  it('labels all five ways into the rest of Learn', async () => {
    const onOpenArea = vi.fn();
    await mount({ onOpenArea });
    const want = { lessons: 'All Courses', browse: 'All Departments', record: 'My Learning', tools: 'Study Tools', downloads: 'Downloads' };
    for (const [id, label] of Object.entries(want)) {
      const b = $(`[data-testid=ld-access-${id}]`);
      expect(b.textContent).toContain(label);
      await act(async () => { b.click(); });
    }
    expect(onOpenArea.mock.calls.map((c) => c[0])).toEqual(['lessons', 'browse', 'record', 'tools', 'downloads']);
  });
});

describe('Continue Learning is real saved progress', () => {
  it('is absent for a learner who has begun nothing', async () => {
    await mount({ places: [] });
    expect($('[data-testid=ld-continue]')).toBeNull();
  });
  it('lists the saved lesson, with its bar, and opens it in its own course', async () => {
    const L = INDEX.lessons.find((l) => l.i === 'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works');
    const course = INDEX.courses[L.c].k;
    const onOpenLesson = vi.fn();
    await mount({ onOpenLesson, places: [{ courseKey: course, lessonId: L.i, stage: 1, step: 1, sentence: 3, seen: 0.5, at: 1 }] });
    const card = $('[data-testid=ld-continue] [data-testid=ld-lesson-card]');
    expect(card.getAttribute('data-lesson')).toBe(L.i);
    expect(card.querySelector('.ld-bar i').style.width).toBe('50%');
    await act(async () => { card.click(); });
    expect(onOpenLesson).toHaveBeenCalledWith(course, L.i);
  });
  it('ignores a saved place for a lesson that is not in the curriculum', async () => {
    await mount({ places: [{ courseKey: 'living-lessons', lessonId: 'no-such-lesson', stage: 1, seen: 0.5 }] });
    expect($('[data-testid=ld-continue]')).toBeNull();
  });
});

describe('search shows the promotional title and keeps the original', () => {
  it('answers a question with lessons, each carrying both titles', async () => {
    const onOpenLesson = vi.fn();
    await mount({ onOpenLesson });
    await type('How can I get out of debt?');
    const rows = $$('[data-testid=ld-result]');
    expect(rows.length).toBe(8);
    const withBoth = rows.filter((r) => r.querySelector('.ld-res-o'));
    expect(withBoth.length).toBeGreaterThan(0);
    const r = withBoth[0];
    const L = INDEX.lessons.find((l) => l.i === r.getAttribute('data-lesson'));
    expect(r.querySelector('.ld-res-t').textContent).toBe(L.p);
    expect(r.querySelector('.ld-res-o').textContent).toBe(L.t);
    await act(async () => { r.click(); });
    expect(onOpenLesson).toHaveBeenCalledWith(INDEX.courses[L.c].k, L.i);
  });
  it('hides the shelf rows while results show, and restores them on Clear', async () => {
    await mount();
    await type('forgiveness');
    expect($('[data-testid=ld-categories]')).toBeNull();
    await act(async () => { $$('button').find((b) => b.textContent === 'Clear').click(); });
    expect($('[data-testid=ld-categories]')).toBeTruthy();
  });
});

describe("categories, Today's Word and collections", () => {
  it('shows all twelve photographic categories with their real counts', async () => {
    await mount();
    const cards = $$('[data-testid=ld-category]');
    expect(cards.map((c) => c.querySelector('.ld-cat-t').textContent)).toEqual(CATEGORIES.map((c) => c.label));
    for (const c of cards) expect(c.querySelector('.ld-cat-n').textContent).toMatch(/^\d+ lessons$/);
  });
  it('opens a category shelf of lessons without leaving the page', async () => {
    await mount();
    await act(async () => { $('[data-testid=ld-category][data-cat=money]').click(); });
    const shelf = $('[data-testid=ld-category-shelf]');
    expect(shelf.querySelectorAll('[data-testid=ld-lesson-card]').length).toBe(12);
  });
  it("draws Today's Word from the shipped text, labelled KJV", async () => {
    await mount();
    expect($('[data-testid=ld-word] footer').textContent).toMatch(/KJV$/);
  });
  it('shows featured lessons and both collections from the real catalog', async () => {
    await mount();
    expect($$('[data-testid=ld-featured] [data-testid=ld-lesson-card]').length).toBeGreaterThan(0);
    expect($$('[data-testid=ld-collection-relationships] [data-testid=ld-lesson-card]').length).toBeGreaterThan(5);
    expect($$('[data-testid=ld-newest] [data-testid=ld-lesson-card]').length).toBe(12);
  });
});
