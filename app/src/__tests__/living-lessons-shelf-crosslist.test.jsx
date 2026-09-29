// =============================================================================
// The Living Lessons shelf gathers Darrell's lessons that live elsewhere (DR-0668)
// =============================================================================
// Darrell 2026-09-29: "Cross reference or make sure it is offered in living
// lessons also correct?" pm12 (Project Management) and World Issues 18 and 19
// were each sent into the app as a lesson and built in another course. Living
// Lessons is its own department (DR-0598), so its tab gathers them through the
// existing pointer (lib/learn-crosslist.js, DR-0447 / DR-0516): one home, one
// credit, one place record, program totals unchanged. This file pins, on the
// REAL catalog and the REAL component:
//   1. each declaration resolves to a live lesson (a dead pointer fails);
//   2. the totals do not move;
//   3. opening a pointer from the Living Lessons tab opens the HOME course and
//      writes the home course's place record;
//   4. proven-to-catch: a renamed lesson id is reported dead.
// And L160 carries one line pointing to its companion, L197 (same department,
// so a line in the lesson rather than a pointer, which would self-list).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { LEARN_CATALOG, buildCatalogCourseDescriptors, catalogCategory } from '../lib/learn-catalog.js';
import { buildLessonIndex, courseLessonCount, learnDepartments } from '../lib/learn-organize.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { CROSS_LISTINGS, crossListingsFor, resolveCrossListed, missingCrossListings, selfListedCrossListings } from '../lib/learn-crosslist.js';
import { getPlace } from '../lib/learn-resume.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DECLARED = [
  ['project-management', 'pm12-titles-and-fruits-capability-shown-in-outcomes'],
  ['world-issues', 'wi-apa-2021-apology-and-the-one-blood'],
  ['world-issues', 'wi-higher-ed-aid-2026-and-the-student-in-the-gap'],
];

const extraCourses = buildCatalogCourseDescriptors();
// The whole mounted catalog, the way learn-crosslist.test.js builds it.
const courses = [
  ...LEARN_CATALOG.map((e) => ({ key: e.key, meta: e.meta, schedule: e.buildScheduleRows() })),
  ...buildEternalProcessingCourses(),
];

describe('the declarations', () => {
  it('Living Lessons gathers exactly the three, each with its reason', () => {
    const mine = crossListingsFor('Living Lessons');
    expect(mine.map((c) => [c.courseKey, c.lessonId])).toEqual(DECLARED);
    for (const c of mine) expect(c.why.length).toBeGreaterThan(60);
  });

  it('each resolves to a LIVE lesson in the mounted catalog — no dead pointer', () => {
    const index = buildLessonIndex(courses);
    expect(missingCrossListings(index)).toEqual([]);
    const rows = resolveCrossListed('Living Lessons', buildLessonIndex(courses));
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.courseTitle)).toEqual(expect.arrayContaining([expect.stringMatching(/Project Management/), expect.stringMatching(/World Issues/)]));
  });

  it('none is self-listed: none of the three lives in Living Lessons', () => {
    const home = (key) => catalogCategory(key) || '';
    expect(selfListedCrossListings(home)).toEqual([]);
    for (const [k] of DECLARED) expect(home(k)).not.toBe('Living Lessons');
  });

  it('PROVEN-TO-CATCH: a renamed lesson id is reported as a dead pointer', () => {
    const index = buildLessonIndex(courses);
    const without = index.filter((r) => r.lessonId !== 'wi-apa-2021-apology-and-the-one-blood');
    expect(missingCrossListings(without)).toEqual(['world-issues :: wi-apa-2021-apology-and-the-one-blood']);
  });
});

describe('a pointer, never a copy — the totals do not move', () => {
  it('the Living Lessons department counts only its own lessons', () => {
    const d = learnDepartments(courses).find((x) => x.label === 'Living Lessons');
    expect(d.lessons).toBe(LIVING_LESSONS_MODULES.length);
    const all = courses.reduce((t, c) => t + courseLessonCount(c), 0);
    expect(learnDepartments(courses).reduce((t, x) => t + x.lessons, 0)).toBe(all);
    // Every cross-listing is unique, so the three add nothing anywhere.
    const keys = CROSS_LISTINGS.map((c) => `${c.department}::${c.courseKey}::${c.lessonId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('on the real component, standing in Living Lessons', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const tabs = () => [...container.querySelectorAll('[role="tab"]')];
  const clickTab = (label) => {
    const tab = tabs().find((b) => (b.textContent || '').trim() === label);
    if (!tab) throw new Error(`department tab not found: ${label}`);
    act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  };
  const shelf = () => container.querySelector('[data-testid="learn-crosslisted"]');

  it('the Living Lessons tab shows the three, each naming the course it lives in', () => {
    mount();
    clickTab('Living Lessons');
    const el = shelf();
    expect(el, 'no gathered shelf on the Living Lessons tab').toBeTruthy();
    expect(el.querySelectorAll('li')).toHaveLength(3);
    const text = el.textContent || '';
    expect(text).toContain('Titles and fruits');
    expect(text).toContain('The Psychologists’ Apology of 2021');
    expect(text).toContain('The Student in the Gap');
    expect(text).toMatch(/Project Management/);
    expect(text).toMatch(/World Issues/);
  });

  it('opening one opens it in its HOME course, and the place record is the home course’s', () => {
    mount();
    clickTab('Living Lessons');
    const row = [...shelf().querySelectorAll('li button')].find((b) => (b.textContent || '').includes('Titles and fruits'));
    expect(row).toBeTruthy();
    act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const place = getPlace();
    expect(place, 'opening a gathered lesson recorded no place').toBeTruthy();
    expect(place.courseKey).toBe('project-management');
    expect(place.lessonId).toBe('pm12-titles-and-fruits-capability-shown-in-outcomes');
  });
});

describe('L197 and its companion point at each other', () => {
  it('L197 names L160, and L160 names L197 in one line on its in-app card', () => {
    const l160 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll160-'));
    const l197 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll197-'));
    expect(l197.lesson).toMatch(/L160, Pride Is Not Worth Him/);
    // On L160's in-app line, not its adult text, so its measured bands keep their share.
    expect(l160.inApp.split('Its companion: L197, Think Soberly').length - 1).toBe(1);
  });
});
