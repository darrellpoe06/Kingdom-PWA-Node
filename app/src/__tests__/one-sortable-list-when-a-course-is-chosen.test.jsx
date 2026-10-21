// =============================================================================
// One sortable list when a course is chosen (DR-1183)
// =============================================================================
// Darrell, 2026-10-21, with two screenshots of Learn:
//
//   "It's like a title page saying your inside living lessons... we need one
//    list when choosing a course... with all options to sort that one list...
//    make sense.... only have that sortable list when it is chosen!!!!!!!!!!!!
//    Obviously.... make sense?!!!!!!!!"
//
// Two defects, and the code named the first one about itself before he did.
// ChurchLearn's own comment at `activeKey`: "`active` below still falls back
// to the A.I. course for the CONTENT, so nothing under the picker is ever
// empty; only the select tells the truth about whether a choice was made."
// So Learn opened on Living Lessons' title, catalog line, plain words, Share,
// Download, sticky bar, Word-first lead and whole schedule with nothing saying
// no choice had been made. The second: the picker's order was `organizeCourses`
// — department groups, sorted WITHIN each group — so "Title A–Z" over nineteen
// courses in eleven departments produced eleven little lists, never one.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseChoiceRows, standingWords, choiceWords } from '../lib/learn-course-choice.js';
import { organizeCourses } from '../lib/learn-organize.js';
import CourseChoiceList from '../components/CourseChoiceList.jsx';

const course = (key, title, lessons, meta = {}) => ({
  key,
  meta: { title, ...meta },
  schedule: Array.from({ length: lessons }, (_, i) => ({ id: `${key}-${i + 1}`, title: `L${i + 1}` })),
});
// `meta.category` is what `courseDepartment` reads, and departments are ordered
// by lessons taught (descending). So this catalog is built so the GROUPED
// reading order and the ONE-LIST order genuinely differ: by title the first
// course is Alpha, but Alpha lives in the second department, so reading the
// groups top to bottom gives Zeta first.
const CATALOG = [
  course('zeta-course', 'Zeta: Last By Title', 9, { category: 'Alpha Studies' }),
  course('alpha-course', 'Alpha: First By Title', 1, { category: 'Beta Studies' }),
  course('mid-course', 'Mid: Second By Title', 5, { category: 'Beta Studies' }),
];

// ---------------------------------------------------------------------------
// ONE list, in ONE order
// ---------------------------------------------------------------------------
describe('one list, sorted across the whole list', () => {
  it('sorts every course together — not inside each department', () => {
    const rows = courseChoiceRows({ courses: CATALOG, sortKey: 'title' });
    expect(rows.map((r) => r.title)).toEqual(['Alpha: First By Title', 'Mid: Second By Title', 'Zeta: Last By Title']);
    // PROVEN AGAINST the shape this replaces: the grouped picker sorts WITHIN
    // each department, so the same key over the same catalog yields several
    // lists, and reading them top to bottom is NOT the catalog's title order.
    const groups = organizeCourses(CATALOG, 'title');
    expect(groups.length).toBe(2);
    expect(groups.flatMap((g) => g.courses).map((c) => c.key))
      .toEqual(['zeta-course', 'alpha-course', 'mid-course']);
    expect(rows.map((r) => r.key)).toEqual(['alpha-course', 'mid-course', 'zeta-course']);
  });

  it('every order the control offers reorders the one list', () => {
    const titles = (k) => courseChoiceRows({ courses: CATALOG, sortKey: k }).map((r) => r.key);
    expect(titles('title')).toEqual(['alpha-course', 'mid-course', 'zeta-course']);
    expect(titles('title-desc')).toEqual(['zeta-course', 'mid-course', 'alpha-course']);
    expect(titles('lessons-desc')).toEqual(['zeta-course', 'mid-course', 'alpha-course']);
    expect(titles('lessons-asc')).toEqual(['alpha-course', 'mid-course', 'zeta-course']);
    // 'authored' is the registry's own order, untouched.
    expect(titles('authored')).toEqual(['zeta-course', 'alpha-course', 'mid-course']);
  });

  it('counts lessons from the real schedule, never a typed number', () => {
    const rows = courseChoiceRows({ courses: CATALOG, sortKey: 'authored' });
    expect(rows.map((r) => r.lessons)).toEqual([9, 1, 5]);
  });

  it('a level is shown only when the course declares one', () => {
    const rows = courseChoiceRows({
      courses: [course('a', 'A', 1, { programLevel: '200-level' }), course('b', 'B', 1)],
      sortKey: 'authored',
    });
    expect(rows[0].level).toBe('200-level');
    expect(rows[1].level).toBe('');
  });

  it('a department view keeps the whole catalog’s codes', () => {
    const whole = courseChoiceRows({ courses: CATALOG, sortKey: 'authored' });
    const mid = whole.find((r) => r.key === 'mid-course');
    // Mid is the SECOND course of Beta Studies, so its code ends 102.
    expect(mid.code).toMatch(/102$/);
    const narrowed = courseChoiceRows({ courses: [CATALOG[2]], catalog: CATALOG, sortKey: 'authored' });
    expect(narrowed).toHaveLength(1);
    expect(narrowed[0].code).toBe(mid.code);
    // PROVEN TO CATCH: without the whole catalog it would be renumbered 101 —
    // a course's code must not change because a department tab is open.
    expect(courseChoiceRows({ courses: [CATALOG[2]], sortKey: 'authored' })[0].code).toMatch(/101$/);
  });
});

// ---------------------------------------------------------------------------
// What it says
// ---------------------------------------------------------------------------
describe('the list says what it holds', () => {
  it('names the count, the lessons and the order, and says to pick one', () => {
    const rows = courseChoiceRows({ courses: CATALOG, sortKey: 'title' });
    expect(choiceWords(rows, { sortLabel: 'Title A–Z' }))
      .toBe('3 courses · 15 lessons · one list, ordered by title a–z. Pick one to open it.');
  });

  it('an empty list says it is empty rather than rendering nothing', () => {
    expect(choiceWords([])).toBe('No courses are mounted yet.');
    expect(choiceWords([], { departmentLabel: 'History' })).toBe('No courses are mounted in History yet.');
  });

  it('standing is measured from this device, and “not started” is a real answer', () => {
    expect(standingWords({ state: 'not-started', lessons: 9, done: 0 })).toBe('not started');
    expect(standingWords({ state: 'in-progress', lessons: 9, done: 3 })).toBe('in progress · 3 of 9 read');
    expect(standingWords({ state: 'completed', lessons: 9, done: 9 })).toBe('finished · 9 of 9 read');
    expect(standingWords(null)).toBe('not started');
  });

  it('reads a real standing out of the device’s places', () => {
    const ctx = { places: [{ courseKey: 'zeta-course', lessonId: 'zeta-course-1', done: true, at: 5 }], progress: {} };
    const rows = courseChoiceRows({ courses: CATALOG, sortKey: 'authored', ctx });
    const z = rows.find((r) => r.key === 'zeta-course');
    expect(z.state).toBe('in-progress');
    expect(z.done).toBe(1);
    expect(standingWords(z)).toBe('in progress · 1 of 9 read');
    expect(rows.find((r) => r.key === 'mid-course').state).toBe('not-started');
  });
});

// ---------------------------------------------------------------------------
// On the screen
// ---------------------------------------------------------------------------
let host;
let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('the list on the screen', () => {
  it('is ONE list of every course, each row one tap', async () => {
    const picked = [];
    await act(async () => {
      root.render(createElement(CourseChoiceList, {
        courses: CATALOG, catalog: CATALOG, sortKey: 'title', sortLabel: 'Title A–Z',
        onChoose: (k) => picked.push(k),
      }));
    });
    const lists = host.querySelectorAll('[data-testid="course-choice-list"] ul');
    expect(lists).toHaveLength(1);
    const items = lists[0].querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect([...items].map((li) => li.querySelector('button').getAttribute('data-course')))
      .toEqual(['alpha-course', 'mid-course', 'zeta-course']);
    await act(async () => { items[2].querySelector('button').click(); });
    expect(picked).toEqual(['zeta-course']);
  });

  it('says what it holds, above the list', async () => {
    await act(async () => {
      root.render(createElement(CourseChoiceList, { courses: CATALOG, catalog: CATALOG, sortKey: 'title', sortLabel: 'Title A–Z' }));
    });
    expect(host.querySelector('[data-testid="course-choice-words"]').textContent)
      .toMatch(/^3 courses · 15 lessons · one list, ordered by title a–z\. Pick one to open it\.$/);
  });

  it('an empty catalog says so and draws no list', async () => {
    await act(async () => { root.render(createElement(CourseChoiceList, { courses: [], catalog: [] })); });
    expect(host.querySelector('[data-testid="course-choice-words"]').textContent).toBe('No courses are mounted yet.');
    expect(host.querySelector('[data-testid="course-choice-list"] ul')).toBe(null);
  });

  it('every row is a real tap target on a phone', async () => {
    await act(async () => { root.render(createElement(CourseChoiceList, { courses: CATALOG, catalog: CATALOG, sortKey: 'authored' })); });
    for (const b of host.querySelectorAll('button')) {
      expect(b.className).toMatch(/min-h-\[56px\]/);
      expect(b.className).toMatch(/focus:outline/);
    }
  });
});

// ---------------------------------------------------------------------------
// The title page is gone: Learn's own source, read for the gates it must hold
// ---------------------------------------------------------------------------
describe('Learn opens on the list, not on a course nobody chose', () => {
  // Read as SOURCE deliberately: mounting ChurchLearn needs the whole catalog,
  // the cloud seams and a signed-in shell, and this assertion is about which
  // blocks are gated — which the source states exactly and a mount would only
  // restate. The behaviour of the list itself is mounted above.
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../components/ChurchLearn.jsx'), 'utf8',
  );

  it('the heading says what is open, and nothing is open until it is chosen', () => {
    expect(src).toMatch(/\{courseOpen \? active\.meta\.title : 'Choose a course'\}/);
    // And "open" means CHOSEN, or a department tab -- the narrowing DR-0432 /
    // DR-0433 pin as opening its department's first course with its lessons.
    expect(src).toMatch(/const courseOpen = courseChosen \|\| !!dept;/);
  });

  it('the course’s own blocks wait for a chosen course', () => {
    // The catalog line, the plain-words line, Share this course, the sticky
    // bar that names the course, the Word-first lead and the schedule.
    expect(src).toMatch(/\{courseOpen && !lessonFocus && \(\(\) => \{\n\s*const coded =/);
    expect(src).toMatch(/\{courseOpen && !lessonFocus && plainWordsFor\(active\.key\)/);
    // The sticky landmark bar is the EXCEPTION, and deliberately so: it exists
    // because a reader browses without choosing (Christina 2026-08-31), so it
    // renders either way and the three things in it that belong to a course
    // wait for one -- the unit noun, the course's name, and its Continue.
    expect(src).toMatch(/\{courseOpen \? `\$\{unitLabels\(active\.meta\)\.noun\}s` : 'lessons'\}/);
    expect(src).toMatch(/\{courseOpen \? active\.meta\.title : 'No course chosen yet'\}/);
    expect(src).toMatch(/\{courseOpen && <ContinueChip/);
    expect(src).toMatch(/\{courseOpen && \(\(\) => \{\n\s*const lead = wordFirstLead\(active\)/);
    expect(src).toMatch(/\{courseOpen && \(\n\s*<CourseView/);
  });

  it('the one list renders exactly when no course is chosen', () => {
    expect(src).toMatch(/\{!courseOpen && !lessonFocus && \(\n\s*<CourseChoiceList/);
    // It is handed the SAME sort the control sets, not its own order.
    expect(src).toMatch(/sortKey=\{sortNow\}/);
    expect(src).toMatch(/ctx=\{sortCtx\}/);
    // AND IT SITS BESIDE THE CONTROL THAT ORDERS IT. "All options to sort that
    // one list" means the sort and the list are one thing, so the list comes
    // directly after the picker + sort pair and before Resume -- not far below
    // the whole-catalog shelf, where its own sort control would be off screen.
    const pick = src.indexOf("<label htmlFor=\"learn-course-sort\"");
    const list = src.indexOf('<CourseChoiceList');
    const resume = src.indexOf('PICK UP WHERE YOU LEFT OFF');
    const shelf = src.indexOf('lesson-browse-all');
    expect(pick).toBeGreaterThan(-1);
    expect(list).toBeGreaterThan(pick);
    expect(list).toBeLessThan(resume);
    expect(list).toBeLessThan(shelf);
  });
});
