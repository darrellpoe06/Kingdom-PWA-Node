// DR-0715 — the lesson count AND every age version, shown side by side.
//
// Darrell 2026-09-30, on Learn -> "Latest lessons, every course": "is the
// lesson count 349 or is that with every variation based on the age number?
// I want both so it shows the scale even if no one else pays attention...
// they will know their children can read the same content in their age groups
// cognitive language and paced for them too."
//
// What is pinned here:
//   1. The count on a small fixture: a band counts only when its own text is
//      really there. An empty, blank, missing or non-string band is not a
//      version, and neither is a band that only repeats the adult text.
//   2. Proven-to-catch: a naive counter that counts band KEYS gets the fixture
//      wrong, so the fixture really tells the two apart.
//   3. The Latest lessons header renders both numbers, and each month does too.
//   4. On the real catalog, the header's number is the total COMPUTED here
//      from every mounted lesson, never a number typed into this file.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LatestLessons from '../components/LatestLessons.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { buildSchedule } from '../lib/church-classes.js';
import {
  lessonVersions, countReadings, catalogReadings, readingsLine, readingsMeaning, monthReadings, countWords,
  READING_VERSIONS,
} from '../lib/learn-organize.js';
import { AGE_BANDS } from '../lib/learn-framework.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ADULT = 'The adult lesson, written in full for a grown reader.';
const FIXTURE = [
  // Five real versions: every band written.
  { id: 'a1-five', lesson: ADULT, levels: { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' } },
  // Empty, blank and non-string bands are not versions; child and adult are.
  { id: 'a2-gaps', lesson: ADULT, levels: { child: 'Child words.', youth: '', teen: '   \n ', senior: null } },
  // No levels at all: the one lesson, one version.
  { id: 'a3-plain', lesson: ADULT },
  // A teen band that is the adult text again (spacing aside) is a copy, not a version.
  { id: 'a4-copy', lesson: ADULT, levels: { teen: `  ${ADULT.replace(/ /g, '   ')}\n`, senior: 'Senior words.' } },
  // levels.standard IS the adult version when written; `lesson` beside it is not a second one.
  { id: 'a5-standard', lesson: ADULT, levels: { standard: 'The standard adult text.', child: 'Child words.' } },
  // No adult text at all: the adult reader is handed the senior text, which is not an adult version.
  { id: 'a6-no-adult', levels: { teen: 'Teen words.', senior: 'Senior words.' } },
  // Not a lesson: no id.
  { lesson: ADULT, levels: { child: 'Child words.' } },
];
const EXPECT = {
  'a1-five': ['child', 'youth', 'teen', 'adult', 'senior'],
  'a2-gaps': ['child', 'adult'],
  'a3-plain': ['adult'],
  'a4-copy': ['adult', 'senior'],
  'a5-standard': ['child', 'adult'],
  'a6-no-adult': ['teen', 'senior'],
};

// The naive counter this work replaces: one per band key present, plus the lesson.
const naiveCount = (lessons) => lessons.filter((m) => m.id)
  .reduce((t, m) => t + (m.lesson ? 1 : 0) + Object.keys(m.levels || {}).length, 0);

describe('counting the age versions a lesson really carries', () => {
  it('names the reader bands the picker offers, in its order', () => {
    expect(READING_VERSIONS.map((b) => b.id)).toEqual(AGE_BANDS.map((b) => b.id));
  });

  it('counts a band only when its own text is really there', () => {
    for (const m of FIXTURE.filter((x) => x.id)) expect(lessonVersions(m), m.id).toEqual(EXPECT[m.id]);
    expect(lessonVersions(null)).toEqual([]);
    expect(lessonVersions({ id: 'x' })).toEqual([]);
  });

  it('totals the fixture, band by band, and a naive key count gets it wrong (proven-to-catch)', () => {
    const r = countReadings(FIXTURE);
    const want = Object.values(EXPECT).reduce((t, ids) => t + ids.length, 0);
    expect(r.lessons).toBe(6);
    expect(r.readings).toBe(want);
    expect(r.readings).toBe(14);
    expect(r.byBand).toEqual({ child: 3, youth: 1, teen: 2, adult: 5, senior: 3 });
    expect(r.younger).toBe(4);
    expect(naiveCount(FIXTURE)).not.toBe(r.readings);
  });

  it('writes the line plainly, naming only bands that have a version', () => {
    expect(readingsLine(countReadings(FIXTURE))).toBe('14 readings counting every age version (child, youth, teen, adult, senior)');
    expect(readingsLine(countReadings([FIXTURE[2]]))).toBe('1 reading counting every age version (adult)');
    expect(countWords(2641)).toBe('2,641');
  });

  it('says "Most" only when more than half the lessons carry a younger version', () => {
    expect(readingsMeaning({ lessons: 6, younger: 4 })).toMatch(/^Most lessons are written again for younger readers/);
    expect(readingsMeaning({ lessons: 6, younger: 3 })).toMatch(/^Some lessons/);
    expect(readingsMeaning({ lessons: 6, younger: 0 })).toBe('');
  });

  it('sums each month from the rows under its heading', () => {
    const items = [
      { heading: { key: 'month-2026-09' } }, { versions: 5 }, { versions: 2 },
      { heading: { key: 'month-2026-08' } }, { versions: 1 },
    ];
    expect(monthReadings(items)).toEqual({ 'month-2026-09': 7, 'month-2026-08': 1 });
  });
});

describe('the Latest lessons header shows both numbers', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('on the fixture: the lesson count, the readings count, and each month with both', () => {
    const dated = FIXTURE.filter((m) => m.id).map((m, i) => ({ ...m, title: m.id, added: i < 4 ? '2026-09-0' + (i + 1) : '2026-08-15' }));
    const courses = [{ key: 'fx', meta: { title: 'Fixture' }, schedule: dated }];
    act(() => root.render(createElement(LatestLessons, { courses, onOpen: () => {} })));
    expect(container.querySelector('[data-testid="learn-latest-count"]').textContent).toBe('6');
    const readings = container.querySelector('[data-testid="learn-latest-readings"]');
    expect(readings.getAttribute('data-readings')).toBe('14');
    expect(readings.textContent).toBe('14 readings counting every age version (child, youth, teen, adult, senior).');
    expect(container.querySelector('[data-testid="learn-latest-scale"]').textContent).toMatch(/Most lessons are written again for younger readers/);
    const sep = container.querySelector('li[data-month-heading="month-2026-09"]');
    // September holds a1..a4: 5 + 2 + 1 + 2 versions.
    expect(sep.querySelector('[data-month-lessons]').textContent).toBe('4 lessons');
    expect(sep.querySelector('[data-month-readings]').textContent).toBe('10 readings');
    const aug = container.querySelector('li[data-month-heading="month-2026-08"]');
    expect(aug.querySelector('[data-month-lessons]').textContent).toBe('2 lessons');
    expect(aug.querySelector('[data-month-readings]').textContent).toBe('4 readings');
  });
});

// THE MONTH STAYS AT THE TOP OF THE SCROLL, AND FOLDS (DR-0732, carried to this
// list; Darrell 2026-10-01: "October and September should stay at the top of
// the scroll with the count... remember"). Before this the heading scrolled off
// with its first lesson.
describe('the Latest lessons month heading stays at the top of the scroll, carries both counts, and folds', () => {
  let container, root;
  const courses = () => {
    const dated = FIXTURE.filter((m) => m.id).map((m, i) => ({ ...m, title: m.id, added: i < 4 ? '2026-09-0' + (i + 1) : '2026-08-15' }));
    return [{ key: 'fx', meta: { title: 'Fixture' }, schedule: dated }];
  };
  const mount = () => act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {} })));
  const heading = (k) => container.querySelector(`li[data-month-heading="${k}"]`);
  const fold = (k) => heading(k).querySelector('[data-testid="latest-month-fold"]');
  const lessons = () => container.querySelectorAll('[data-testid="learn-latest-list"] li[data-lesson-id]').length;
  const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  beforeEach(() => { window.localStorage.clear(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

  it('each heading is sticky inside the scrolling list, with the list background, and the whole row is the fold', () => {
    mount();
    const sep = heading('month-2026-09');
    expect(sep.className).toMatch(/\bsticky\b/);
    expect(sep.className).toMatch(/\btop-0\b/);
    expect(sep.className).toMatch(/bg-\[#FAF8F4\]/);
    expect(container.querySelector('[data-testid="learn-latest-list"]').className).toMatch(/overflow-y-auto/);
    const btn = fold('month-2026-09');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('September 2026, 4 lessons, 10 readings — fold this month');
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  it('a tap folds that month only, keeps both counts on it, and a second tap opens it', () => {
    mount();
    expect(lessons()).toBe(6);
    click(fold('month-2026-09'));
    expect(lessons()).toBe(2);
    expect(heading('month-2026-09').getAttribute('data-folded')).toBe('true');
    expect(fold('month-2026-09').getAttribute('aria-expanded')).toBe('false');
    expect(heading('month-2026-09').querySelector('[data-month-lessons]').textContent).toBe('4 lessons');
    expect(heading('month-2026-09').querySelector('[data-month-readings]').textContent).toBe('10 readings');
    expect(heading('month-2026-08').getAttribute('data-folded')).toBe('false');
    click(fold('month-2026-09'));
    expect(lessons()).toBe(6);
  });

  it('fold all leaves the headings with their counts; open all brings every lesson back; the fold is remembered', () => {
    mount();
    const all = () => container.querySelector('[data-testid="latest-months-fold-all"]');
    expect(all().textContent).toBe('Fold all 2 months');
    click(all());
    expect(lessons()).toBe(0);
    expect(container.querySelectorAll('li[data-month-heading]').length).toBe(2);
    expect(all().textContent).toBe('Open all 2 months');
    expect(JSON.parse(window.localStorage.getItem('poetech.lessonMonthFold.v1'))['latest:every-course'].sort()).toEqual(['month-2026-08', 'month-2026-09']);
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(lessons(), 'remembered across a remount').toBe(0);
    click(all());
    expect(lessons()).toBe(6);
  });
});

describe('on the real catalog, the header equals the computed total', () => {
  const extraCourses = buildCatalogCourseDescriptors();
  const CATALOG = [...extraCourses, ...buildEternalProcessingCourses()];
  const aiSchedule = buildSchedule(null);
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

  it('Latest lessons and the Courses tab both show the measured number of readings', () => {
    // Computed here, from every lesson Learn mounts: the catalog plus the A.I. course.
    const measured = catalogReadings([...CATALOG, { key: 'ai', schedule: aiSchedule }]);
    const lessons = CATALOG.reduce((t, c) => t + c.schedule.length, 0) + aiSchedule.length;
    expect(measured.lessons).toBe(lessons);
    expect(measured.readings).toBeGreaterThan(lessons);

    act(() => root.render(createElement(ChurchLearn, {
      extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
      learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
    })));
    const explain = container.querySelector('#learn-dept-explain-all');
    expect(explain.textContent).toContain(`${lessons} lessons · ${countWords(measured.readings)} readings counting every age version`);

    const sel = container.querySelector('#learn-course-sort');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, 'latest');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const list = container.querySelector('[data-testid="learn-latest-lessons"]');
    expect(list.querySelector('[data-testid="learn-latest-count"]').textContent).toBe(String(lessons));
    const readings = list.querySelector('[data-testid="learn-latest-readings"]');
    expect(Number(readings.getAttribute('data-readings'))).toBe(measured.readings);
    expect(readings.textContent).toBe(`${readingsLine(measured)}.`);
    // Every month's two numbers add up to the header's two numbers.
    const months = [...list.querySelectorAll('li[data-month-heading]')];
    const sum = (attr) => months.reduce((t, li) => t + Number(li.querySelector(`[${attr}]`).getAttribute(attr) || 0), 0);
    expect(sum('data-month-readings')).toBe(measured.readings);
    expect(months.reduce((t, li) => t + parseInt(li.querySelector('[data-month-lessons]').textContent, 10), 0)).toBe(lessons);
  });
});
