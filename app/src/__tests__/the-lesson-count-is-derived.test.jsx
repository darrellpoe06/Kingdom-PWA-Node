// =============================================================================
// The lesson count is read from the lessons themselves, and it says why the
// newest number can be higher than the count (DR-0631)
// =============================================================================
// Darrell 2026-09-25, on the Living Lessons index, where the header read
// "PICK A LESSON BY TITLE · 191" and "All lessons · 191" while the newest row
// read L192: "We need the count correct 191 or 192?"
//
// MEASURED: 191 lessons exist, the highest number is 192, and no lesson 79
// was ever made (living-lessons-dates.js:20). So both numbers were true. The
// header just gave no way to reconcile them. It now says "191 lessons ·
// L1–L192 · no L79". Every figure is read from the schedule, never from the
// hand-kept LIVING_LESSONS_META.weeks, so it stays right as L193, L194 and
// L195 land. The course heading ("The N lessons") and the overview button
// read the schedule too. A course whose meta.weeks goes stale can no longer
// show a wrong count.
//
// PROVEN-TO-CATCH: with ChurchLearn's header and course heading as they were
// on main (`· {schedule.length}` and `The {meta.weeks} …`), "the header names
// the count, the span and the gap" fails (no count label; the header ends in
// a bare "191"), and "a lesson added without touching meta.weeks" fails with
// "The 191 lessons" beside 192 rows. See the DR for the recorded run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { lessonNumber, lessonSpan, lessonCountLabel } from '../lib/lesson-order.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Computed here on its own, not through the helper under test.
const nums = LIVING_LESSONS_MODULES.map((m) => Number(/^ll(\d+)-/.exec(m.id)[1]));
const COUNT = LIVING_LESSONS_MODULES.length;
const HIGHEST = Math.max(...nums);
const GAPS = [];
for (let n = 1; n <= HIGHEST; n += 1) if (!nums.includes(n)) GAPS.push(n);

describe('the facts (measured from the lessons, not assumed)', () => {
  it('every Living Lesson carries its own number; none is shared; L79 was never made', () => {
    expect(new Set(nums).size).toBe(COUNT);
    expect(GAPS).toContain(79);
    expect(HIGHEST - GAPS.length).toBe(COUNT);
  });
});

describe('lessonSpan / lessonCountLabel', () => {
  it('reads the real count, the span and the gaps from the schedule', () => {
    const s = lessonSpan(LIVING_LESSONS_MODULES);
    expect(s).toEqual({ count: COUNT, numbered: true, first: 1, last: HIGHEST, missing: GAPS });
    const label = lessonCountLabel(LIVING_LESSONS_MODULES, { noun: 'lesson', plural: 'lessons', cap: 'Lesson' });
    expect(label.startsWith(`${COUNT} lessons · L1–L${HIGHEST}`)).toBe(true);
    for (const g of GAPS) expect(label).toContain(`L${g}`);
  });

  it('stays right as new lessons land: three more make it 194 lessons, up to L195', () => {
    const more = [...LIVING_LESSONS_MODULES,
      { id: `ll${HIGHEST + 1}-a` }, { id: `ll${HIGHEST + 2}-b` }, { id: `ll${HIGHEST + 3}-c` }];
    expect(lessonCountLabel(more, { noun: 'lesson', plural: 'lessons', cap: 'Lesson' }))
      .toBe(`${COUNT + 3} lessons · L1–L${HIGHEST + 3} · no ${GAPS.map((g) => `L${g}`).join(', ')}`);
  });

  it('says only the count when the numbers run 1..N with no gap, or the course is not numbered', () => {
    expect(lessonCountLabel([{ id: 'll1-a' }, { id: 'll2-b' }])).toBe('2 lessons');
    expect(lessonCountLabel([{ id: 'hl-w3-a', week: 1 }], { noun: 'week', plural: 'weeks', cap: 'Week' })).toBe('1 week');
    expect(lessonCountLabel([{ id: 'wk1-a' }, { id: 'wk3-b' }], { noun: 'week', plural: 'weeks', cap: 'Week' }))
      .toBe('2 weeks · Week 1–Week 3 · no Week 2');
    const many = [{ id: 'll1-a' }, { id: 'll10-b' }];
    expect(lessonCountLabel(many)).toBe('2 lessons · L1–L10 · 8 numbers unused');
    expect(lessonNumber({ number: 5 })).toBe(5);
  });
});

describe('on the real Learn tree', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

  const mount = (extraCourses) => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const pickLiving = () => act(() => {
    const sel = container.querySelector('#learn-course-pick');
    const opt = [...sel.querySelectorAll('option')].find((o) => /Living Lessons from the Word/.test(o.textContent || ''));
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, opt.value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const nav = () => container.querySelector('[data-testid="course-lessons-first"]');
  const rows = () => nav().querySelectorAll('[data-testid="course-lesson-list"] > li[data-lesson-id]');
  const allOption = () => [...nav().querySelectorAll('option')].find((o) => o.value === 'all');
  const heading = () => [...container.querySelectorAll('h3')].map((h) => h.textContent).find((t) => /^The \d+ lessons$/.test(t));

  it('the header names the count, the span and the gap, and every number agrees with the rows shown', () => {
    mount(buildCatalogCourseDescriptors());
    pickLiving();
    const count = nav().querySelector('[data-testid="course-lesson-count"]');
    expect(count, 'the header must carry the derived count label').toBeTruthy();
    expect(count.textContent).toBe(`${COUNT} lessons · L1–L${HIGHEST} · no ${GAPS.map((g) => `L${g}`).join(', ')}`);
    expect(rows().length).toBe(COUNT);
    expect(allOption().textContent).toBe(`All lessons · ${COUNT}`);
    expect(heading()).toBe(`The ${COUNT} lessons`);
  });

  it('a lesson added without touching meta.weeks is counted everywhere (meta.weeks is never the source)', () => {
    const courses = buildCatalogCourseDescriptors().map((c) => {
      if (c.meta.key !== 'living-lessons') return c;
      const last = c.schedule[c.schedule.length - 1];
      const added = { ...last, id: `ll${HIGHEST + 1}-a-lesson-that-just-landed`, title: 'A Lesson That Just Landed', week: c.schedule.length + 1 };
      return { ...c, meta: { ...c.meta, weeks: LIVING_LESSONS_META.weeks }, schedule: [...c.schedule, added] };
    });
    mount(courses);
    pickLiving();
    expect(rows().length).toBe(COUNT + 1);
    expect(heading(), 'the course heading reads the schedule, not meta.weeks').toBe(`The ${COUNT + 1} lessons`);
    expect(container.textContent).toContain(`all ${COUNT + 1} at a glance`);
    expect(allOption().textContent).toBe(`All lessons · ${COUNT + 1}`);
    expect(nav().querySelector('[data-testid="course-lesson-count"]').textContent)
      .toBe(`${COUNT + 1} lessons · L1–L${HIGHEST + 1} · no ${GAPS.map((g) => `L${g}`).join(', ')}`);
  });
});
