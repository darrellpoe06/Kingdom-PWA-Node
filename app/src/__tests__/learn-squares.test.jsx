// @vitest-environment jsdom
// LEARN BY SQUARES (DR-1633): another way in, never a replacement. Areas and
// courses are square tiles; lessons are full-title rows, ten to a page; a
// breadcrumb says where you are; nothing scrolls on and on. Copy and
// behavior are tested together: what a tile says is what its tap does.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import LearnSquares, { LESSONS_PAGE, LESSON_SQUARES_PAGE, LESSON_VIEW_KEY } from '../components/LearnSquares.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const course = (key, category, n, title = `Course ${key}`) => ({
  key,
  meta: { title, category, audience: 'the whole house' },
  schedule: Array.from({ length: n }, (_, i) => ({ id: `${key}-${i + 1}`, title: `${title} lesson ${i + 1} with a long title that must be read whole` })),
});
const COURSES = [course('w1', 'The Word & The Way', 25), course('w2', 'The Word & The Way', 3), course('r1', 'Real Estate', 4)];

let host, root;
beforeEach(() => {
  window.localStorage.removeItem(LESSON_VIEW_KEY);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const q = (s) => host.querySelector(s);
const qa = (s) => [...host.querySelectorAll(s)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const draw = (props) => act(() => root.render(createElement(LearnSquares, { courses: COURSES, ...props })));

describe('areas, then courses, then lessons', () => {
  it('opens on the areas as squares, each counted from the catalog', () => {
    draw();
    expect(q('[data-testid="learn-squares"]').getAttribute('data-level')).toBe('areas');
    expect(q('[data-testid="squares-crumb-areas"]').textContent).toBe('All 2 areas');
    const word = q('[data-testid="square-area-the-word-and-the-way"]');
    expect(word.className).toContain('aspect-square');
    expect(word.getAttribute('aria-label')).toBe('The Word & The Way: 2 courses, 28 lessons');
  });
  it('an area opens its courses as squares; a course opens its lessons as squares, with full-title rows one tap away', () => {
    const opened = [];
    draw({ onOpenLesson: (k, id) => opened.push([k, id]) });
    click(q('[data-testid="square-area-the-word-and-the-way"]'));
    expect(q('[data-testid="learn-squares"]').getAttribute('data-level')).toBe('courses');
    expect(qa('[data-testid^="square-course-"]').map((b) => b.getAttribute('data-testid'))).toEqual(['square-course-w1', 'square-course-w2']);
    expect(q('[data-testid="square-course-w1"]').className).toContain('aspect-square');
    click(q('[data-testid="square-course-w1"]'));
    expect(q('[data-testid="learn-squares"]').getAttribute('data-level')).toBe('lessons');
    // Squares open first, as he asked: twelve to a page, the whole title in each square's name.
    expect(q('[data-testid="squares-lessons"]').getAttribute('data-view')).toBe('squares');
    const tiles = qa('[data-testid^="square-lesson-"]');
    expect(tiles.length).toBe(LESSON_SQUARES_PAGE);
    expect(tiles[0].className).toContain('aspect-square');
    expect(tiles[0].getAttribute('aria-label')).toContain('with a long title that must be read whole');
    expect(q('[data-testid="squares-range"]').textContent).toBe('1–12 of 25');
    // Rows are one tap away, carry the title uncut, and the choice is remembered.
    click(q('[data-testid="squares-view-rows"]'));
    expect(window.localStorage.getItem(LESSON_VIEW_KEY)).toBe('rows');
    const rows = qa('[data-testid^="square-lesson-"]');
    expect(rows.length).toBe(LESSONS_PAGE);
    expect(rows[0].className).not.toContain('aspect-square');
    expect(rows[0].className).not.toContain('line-clamp');
    expect(rows[0].textContent).toContain('with a long title that must be read whole');
    expect(q('[data-testid="squares-range"]').textContent).toBe('1–10 of 25');
    click(q('[data-testid="squares-next"]'));
    click(q('[data-testid="squares-next"]'));
    expect(q('[data-testid="squares-range"]').textContent).toBe('21–25 of 25');
    expect(q('[data-testid="squares-next"]').disabled).toBe(true);
    click(q('[data-testid="square-lesson-w1-21"]'));
    expect(opened).toEqual([['w1', 'w1-21']]);
  });
  it('the breadcrumb goes back a level at a time, and "More about this course" opens the course page', () => {
    const pages = [];
    draw({ onOpenCourse: (k) => pages.push(k) });
    click(q('[data-testid="square-area-real-estate"]'));
    click(q('[data-testid="square-course-r1"]'));
    expect(q('[data-testid="squares-course-about"]').textContent).toBe('For the whole house. 4 lessons.');
    expect(q('[data-testid="squares-pager"]')).toBeNull(); // four lessons need no pager
    click(q('[data-testid="squares-open-course"]'));
    expect(pages).toEqual(['r1']);
    click(q('[data-testid="squares-crumb-area"]'));
    expect(q('[data-testid="learn-squares"]').getAttribute('data-level')).toBe('courses');
    click(q('[data-testid="squares-crumb-areas"]'));
    expect(q('[data-testid="learn-squares"]').getAttribute('data-level')).toBe('areas');
  });
  it('a course tile says where the reader stands, from their real record', () => {
    draw({ ctx: { places: [], progress: { 'w2-1': 't' } } });
    click(q('[data-testid="square-area-the-word-and-the-way"]'));
    expect(q('[data-testid="square-course-w2"]').textContent).toContain('1 of 3 read · 33%');
    expect(q('[data-testid="square-course-w1"]').textContent).toContain('not started');
  });
  it('never blank: no courses says so', () => {
    draw({ courses: [] });
    expect(q('[data-testid="squares-empty"]').textContent).toContain('No course is mounted here yet');
  });
  it('it is another door: Browse is added to the area strip and every other area is still there', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../components/ChurchLearn.jsx'), 'utf8');
    for (const id of ['lessons', 'continue', 'latest', 'browse', 'find', 'record', 'downloads']) expect(src, id).toContain(`{ id: '${id}',`);
    expect(src).toContain("learnArea === 'browse' && <LearnSquares");
  });
});
