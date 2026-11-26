// @vitest-environment jsdom
// A Featured Series is drawn by Learn's OWN lesson list (LessonsInOrder), over the real catalog, in curated order.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnDiscover from '../components/learn-discover/LearnDiscover.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root = null;
let host = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null;
  host = null;
});
const $ = (sel) => host.querySelector(sel);
const $$ = (sel) => [...host.querySelectorAll(sel)];
const getBook = async () => ({ name: 'Matthew', chapters: [Array.from({ length: 60 }, (_, i) => `verse ${i + 1}`)] });

describe('a Featured Series uses Learn’s own lesson list', () => {
  it('shows the cover with count and progress, then numbered rows with Show, Pictures/List, ages and Play, in curated order', async () => {
    const onOpenLesson = vi.fn();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(LearnDiscover, { getBook, places: [], now: new Date(2026, 10, 26), onOpenLesson }));
    });
    await act(async () => {
      $('[data-testid=ld-series-tile][data-series=anxiety]').click();
    });
    expect($('[data-testid=ld-series-cover]').textContent).toContain('Overcoming Anxiety');
    expect($('[data-testid=ld-series-progress]').textContent).toContain('12 lessons');
    for (let i = 0; i < 100 && !$('[data-testid=ld-lessons-list]'); i += 1)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 250));
      });
    expect($('[data-testid=ld-lessons-list]')).toBeTruthy();
    // Pictures is the first look (the same Pictures | List choice Learn's course pages have); List is the numbered rows
    expect($('[data-testid="inorder-pictures"]')).toBeTruthy();
    await act(async () => {
      [...$('[data-testid="inorder-view"]').querySelectorAll('button')].find((b) => b.textContent === 'List').click();
    });
    const first = '[data-testid="inorder-ll2-the-energy-you-were-given"]';
    expect($(first)).toBeTruthy();
    expect($('.ls-inorder-row .ls-inorder-n').textContent).toBe('1');
    expect($('[data-testid="inorder-show"]')).toBeTruthy();
    expect($('[data-testid="inorder-view"]')).toBeTruthy();
    expect($('[data-testid="inorder-play-ll2-the-energy-you-were-given"]')).toBeTruthy();
    expect($$('.ls-inorder-row').length).toBeGreaterThan(0);
    await act(async () => {
      $(first).click();
    });
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', 'll2-the-energy-you-were-given');
  }, 120000);
});
