// @vitest-environment jsdom
// =============================================================================
// The record's course lists open onto their lessons (DR-1481)
// =============================================================================
// Darrell, 2026-11-13, reading his record at Big Print (A44), rendered for
// meaning: the Most studied and Most opportunities lists should be links; to
// save scrolling each course should be a drop-down; inside it, the lessons in
// chronological order; each lesson a link to that lesson's page.
//
// What is pinned here, each assertion proven to catch against the rendering
// before this change (a flat line per course, its key, no lessons, no doors):
//   - each course row is a fold, closed until it is opened;
//   - the row names the course by its catalog title, never its key;
//   - opened, it lists the lessons oldest first (the Lessons list's own
//     number order), each one tap to its lesson through Learn's list door;
//   - the count on the fold is the number of lessons inside it.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnersPanel from '../components/LearnersPanel.jsx';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { clearAllPlaces } from '../lib/learn-resume.js';
import { lessonNumber } from '../lib/lesson-order.js';
import { rowToRecord } from '../lib/learner-records.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ME = 'b0000000-0000-4000-a000-000000000250';
let host;
let root;
beforeEach(() => {
  window.localStorage.clear();
  clearAllPlaces();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.localStorage.clear();
});

const qa = (sel, el = host) => [...el.querySelectorAll(sel)];
const rowsOf = (list) => qa(`[data-testid="${list}"] [data-testid="record-course-row"]`);
const lessonsIn = (row) => qa('[data-testid="record-course-lesson"]', row);
const figure = (row, re) => Number((row.querySelector('[data-testid="record-course-summary"]').textContent.match(re) || [])[1]);

// The course as AUTHORED holds L3 before L1 before L2 (Living Lessons really does hold L61 before L60); oldest first is L1, L2, L3, L4.
const AUTHORED = ['ll3-third', 'll1-first', 'll2-second', 'll4-fourth', 'll5-fifth'];
const TITLES = { 'll1-first': 'First', 'll2-second': 'Second', 'll3-third': 'Third', 'll4-fourth': 'Fourth', 'll5-fifth': 'Fifth' };
const at = (d) => `2026-11-0${d}T10:00:00.000Z`;
const rec = (o) => rowToRecord({ user_id: ME, course_key: 'living-lessons', learner_label: 'Me', ...o });
const RECORDS = [
  // Read, and 100% on the exam: understood, so studied but not a lesson to grow.
  rec({ lesson_id: 'll3-third', completed_at: at(1), quiz_pct: 100, quiz_passed: true, quiz_attempts: 2, quiz_at: at(2) }),
  // Read, passed at 80%: studied, still to take to 100%.
  rec({ lesson_id: 'll1-first', completed_at: at(1), quiz_pct: 80, quiz_passed: true, quiz_attempts: 1, quiz_at: at(1) }),
  // Tested, not read yet: studied, still to grow.
  rec({ lesson_id: 'll4-fourth', completed_at: null, quiz_pct: 60, quiz_passed: false, quiz_attempts: 3, quiz_at: at(3) }),
  // Read, never tested: studied, still to grow.
  rec({ lesson_id: 'll2-second', completed_at: at(4) }),
];

function draw(props = {}) {
  const onOpenLesson = vi.fn();
  const onOpenCourse = vi.fn();
  act(() =>
    root.render(
      createElement(LearnersPanel, {
        records: RECORDS,
        currentUserId: ME,
        courseLessonIds: { 'living-lessons': AUTHORED },
        titleOf: (id) => TITLES[id] || null,
        courseTitleOf: (k) => (k === 'living-lessons' ? 'Living Lessons from the Word' : null),
        onOpenLesson,
        onOpenCourse,
        ...props,
      })
    )
  );
  return { onOpenLesson, onOpenCourse };
}

describe('each course row is a fold, closed until it is opened', () => {
  it('both lists draw one fold per course, and every fold starts closed', () => {
    draw();
    for (const list of ['most-studied', 'growth-opportunities']) {
      const rows = rowsOf(list);
      expect(rows.length, `${list} has its course`).toBe(1);
      const fold = rows[0].querySelector('details');
      expect(fold, `${list}: the row is a native disclosure`).toBeTruthy();
      expect(fold.open, `${list}: closed by default, so the record stays short`).toBe(false);
      expect(fold.querySelector('summary'), `${list}: the fold has its own focusable line`).toBeTruthy();
    }
  });
});

describe('the course is named by its title, never its key', () => {
  it('the fold line carries the catalog title and not the key', () => {
    draw();
    for (const list of ['most-studied', 'growth-opportunities']) {
      const line = rowsOf(list)[0].querySelector('[data-testid="record-course-summary"]').textContent;
      expect(line).toContain('Living Lessons from the Word');
      expect(line).not.toContain('living-lessons');
    }
  });

  it('with no title in the catalog it says the key rather than nothing', () => {
    draw({ courseTitleOf: () => null });
    expect(rowsOf('most-studied')[0].querySelector('[data-testid="record-course-title"]').textContent).toBe('living-lessons');
  });
});

describe('opened, it lists its lessons oldest first, each one tap to its lesson', () => {
  it('Most studied: every studied lesson, by its own number, oldest first, with its marks', () => {
    const { onOpenLesson } = draw();
    const row = rowsOf('most-studied')[0];
    act(() => row.querySelector('summary').click());
    expect(row.querySelector('details').open, 'a tap on the line opens it').toBe(true);
    const items = lessonsIn(row);
    expect(items.map((li) => li.getAttribute('data-lesson-id'))).toEqual(['ll1-first', 'll2-second', 'll3-third', 'll4-fourth']);
    expect(items[0].textContent).toMatch(/^L1\. First — read · tested 1 time · best 80%$/);
    expect(items[1].textContent).toMatch(/^L2\. Second — read · not tested yet$/);
    expect(items[3].textContent).toMatch(/^L4\. Fourth — not read yet · tested 3 times · best 60%$/);
    act(() => items[2].querySelector('button').click());
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', 'll3-third');
  });

  it('Opportunities: exactly the studied lessons short of 100%, oldest first, each with its best', () => {
    const { onOpenLesson } = draw();
    const row = rowsOf('growth-opportunities')[0];
    const items = lessonsIn(row);
    expect(items.map((li) => li.getAttribute('data-lesson-id'))).toEqual(['ll1-first', 'll2-second', 'll4-fourth']);
    expect(items.map((li) => li.textContent.split(' — ')[1])).toEqual(['best 80%', 'read; exam not taken yet', 'best 60%']);
    act(() => items[2].querySelector('button').click());
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', 'll4-fourth');
  });

  it('the order the Lessons list uses wins when it is given (a course with no numbers keeps its own order)', () => {
    draw({ courseLessonOrder: { 'living-lessons': ['ll4-fourth', 'll3-third', 'll2-second', 'll1-first', 'll5-fifth'] } });
    expect(lessonsIn(rowsOf('most-studied')[0]).map((li) => li.getAttribute('data-lesson-id'))).toEqual(['ll4-fourth', 'll3-third', 'll2-second', 'll1-first']);
  });

  it('the course itself opens from inside the fold', () => {
    const { onOpenCourse } = draw();
    act(() => rowsOf('most-studied')[0].querySelector('[data-testid="record-course-open"]').click());
    expect(onOpenCourse).toHaveBeenCalledWith('living-lessons');
  });
});

describe('the count on the fold is the number of lessons inside it', () => {
  it('Most studied: studied count = items, read count = items marked read; Opportunities: count = items', () => {
    draw();
    const studied = rowsOf('most-studied')[0];
    expect(figure(studied, /(\d+) lessons? studied/)).toBe(lessonsIn(studied).length);
    expect(figure(studied, /(\d+) of \d+ read/)).toBe(lessonsIn(studied).filter((li) => li.getAttribute('data-read') === 'yes').length);
    expect(Number(studied.getAttribute('data-count'))).toBe(lessonsIn(studied).length);
    const grow = rowsOf('growth-opportunities')[0];
    expect(figure(grow, /(\d+) studied lessons? still to take to 100%/)).toBe(lessonsIn(grow).length);
    expect(lessonsIn(grow).length).toBe(3);
  });
});

describe('on the real Learn surface, a lesson picked on the record opens that lesson', () => {
  const courses = buildCatalogCourseDescriptors();
  const ll = courses.find((c) => (c.key || c.meta?.key) === 'living-lessons');
  const L60 = ll.schedule.find((m) => lessonNumber(m) === 60);
  const L61 = ll.schedule.find((m) => lessonNumber(m) === 61);

  it('the row is titled, opens oldest first (L60 before L61, though the course holds L61 first), and a tap opens the lesson', () => {
    expect(ll.schedule.indexOf(L61), 'the authored course really does hold L61 before L60').toBeLessThan(ll.schedule.indexOf(L60));
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          extraCourses: courses, progress: {}, toggleModule: vi.fn(), quizState: {}, recordQuiz: () => {},
          learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
          signedIn: true, currentUserId: ME,
          learnerRecords: [
            { userId: ME, lessonId: L61.id, courseKey: 'living-lessons', completedAt: '2026-11-01T00:00:00.000Z', quizPct: 80, quizPassed: true, quizAt: '2026-11-01T01:00:00.000Z' },
            { userId: ME, lessonId: L60.id, courseKey: 'living-lessons', completedAt: '2026-11-02T00:00:00.000Z' },
          ],
        })
      )
    );
    const tab = qa('[data-testid="learn-areas"] button').find((b) => /^Record/.test((b.textContent || '').trim()));
    act(() => tab.click());
    const row = rowsOf('most-studied')[0];
    expect(row.querySelector('[data-testid="record-course-title"]').textContent).toBe(ll.meta.title);
    expect(row.querySelector('details').open).toBe(false);
    expect(lessonsIn(row).map((li) => li.getAttribute('data-lesson-id'))).toEqual([L60.id, L61.id]);
    act(() => lessonsIn(row)[1].querySelector('button').click());
    expect(host.querySelector(`[id="learn-lesson-${L61.id}"]`), 'the lesson picked on the record is open').toBeTruthy();
  });
});
