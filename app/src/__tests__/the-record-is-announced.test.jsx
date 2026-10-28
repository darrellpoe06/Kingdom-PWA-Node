// =============================================================================
// THE RECORD IS ANNOUNCED — how much was consumed, what the exams prove, and
// the next thing to do, at the top of Learn (DR-1261)
// =============================================================================
// Darrell 2026-10-27, with his Class Record open: "The record should be more
// announced so it can be used and known for how much knowledge has been
// consumed and how many test reflect the competence of the information... so
// users can be motivated to do more or finish more tests and reading."
//
// Measured before: the record lived folded under one Learn area; a reader on
// Lessons, Latest or Find saw nothing of it. Proven here on the real catalog
// and the real component: the strip, its numbers, its one next step, the
// doors it opens, the tab that carries the count, and the record's own new
// versions figure. Every number is counted, never painted (P15).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LearnersPanel from '../components/LearnersPanel.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { clearAllPlaces, finishPlace } from '../lib/learn-resume.js';
import { recordHeadline, headlineLine, nextStep } from '../lib/record-headline.js';
import { aggregateLearnerRecords } from '../lib/learner-records.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ME = 'b0000000-0000-4000-a000-000000000250';

const Q = { questions: [{ q: 'Who?', options: ['A', 'B'], answer: 0 }] };
const ALL = { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' };
const L1 = { id: 'l1', title: 'First', lesson: 'Adult words.', levels: ALL, quiz: Q };
const L2 = { id: 'l2', title: 'Second', lesson: 'Adult words.', levels: ALL, quiz: Q };
const L3 = { id: 'l3', title: 'Third', lesson: 'Adult words.', quiz: Q };
const L4 = { id: 'l4', title: 'Fourth', lesson: 'Adult words.' }; // no exam to answer
const COURSES = [{ key: 'c', meta: { title: 'Course' }, schedule: [L1, L2, L3, L4] }];

describe('the headline is counted from every real source', () => {
  it('reads, readings, versions, exams and the next step, from rows + device + maps against the catalog', () => {
    const h = recordHeadline({
      courses: COURSES,
      records: [
        { userId: ME, lessonId: 'l1', completedAt: '2026-10-20T00:00:00.000Z', quizPct: 100, quizPassed: true, quizAt: '2026-10-20T01:00:00.000Z', versionsRead: ['adult'] },
        { userId: ME, lessonId: 'l2', completedAt: '2026-10-25T00:00:00.000Z', versionsRead: [], ageBand: 'adult' },
        { userId: ME, lessonId: 'ghost', completedAt: '2026-10-25T00:00:00.000Z' }, // not in the catalog: not counted
      ],
      places: [{ courseKey: 'c', lessonId: 'l3', finishes: 1, done: true, versions: { adult: 1, child: 1 }, lastFinishedAt: Date.parse('2026-10-26T00:00:00Z') }],
      progress: { l2: '2026-10-25T00:00:00.000Z' },
      quizState: { l3: { passed: false, pct: 50, at: '2026-10-26T01:00:00.000Z' } },
      ageBand: 'adult',
    });
    expect(h).toMatchObject({
      lessonsTotal: 4, lessonsRead: 3, readPct: 75,
      readingsTotal: 5 + 5 + 1 + 1, readingsRead: 1 + 1 + 2,
      examsAvailable: 3, examsTaken: 2, examsPassed: 1, avgQuizPct: 75, bestQuizPct: 100,
      untested: 1, versionsEver: ['child', 'adult'], versionsOffered: 5, nextVersion: 'youth',
    });
    expect(h.nextExam).toEqual({ lessonId: 'l2', courseKey: 'c', title: 'Second' });
    expect(h.competency.key).toBe('passing');
    expect(headlineLine(h)).toBe('3 of 4 lessons read (75%) · 1 exam passed of 2 taken, average 75%');
    const step = nextStep(h);
    expect(step).toMatchObject({ kind: 'exam', lessonId: 'l2', courseKey: 'c', label: 'Take the exam on Second' });
    expect(step.why).toBe('1 lesson read with the exam not yet answered — an exam is what proves the reading');
  });
  it('every exam answered → the next step is a version never read, on the newest lesson that carries it', () => {
    const h = recordHeadline({
      courses: COURSES,
      records: [
        { userId: ME, lessonId: 'l1', completedAt: '2026-10-20T00:00:00.000Z', quizPct: 90, quizPassed: true, quizAt: 'x', versionsRead: ['adult'] },
        { userId: ME, lessonId: 'l3', completedAt: '2026-10-26T00:00:00.000Z', quizPct: 80, quizPassed: true, quizAt: 'y', versionsRead: ['adult'] },
      ],
    });
    expect(h.untested).toBe(0);
    const step = nextStep(h);
    expect(step).toMatchObject({ kind: 'version', version: 'child', lessonId: 'l1', label: 'Read First in the Child version' });
    expect(step.why).toMatch(/^1 of 5 versions read so far/);
  });
  it('nothing read is an honest zero, and a learner with no catalog counts nothing', () => {
    const h = recordHeadline({ courses: COURSES });
    expect(h).toMatchObject({ lessonsRead: 0, readPct: 0, examsTaken: 0, avgQuizPct: null, untested: 0, versionsEver: [] });
    expect(headlineLine(h)).toBe('0 of 4 lessons read (0%) · no exam answered yet');
    expect(nextStep(h)).toMatchObject({ kind: 'read', why: '4 lessons not read yet' });
    expect(recordHeadline({}).lessonsTotal).toBe(0);
    expect(nextStep(recordHeadline({}))).toBe(null);
  });
  it('an older read with no version recorded counts the band’s version (DR-1257), so the readings are not under-counted', () => {
    const h = recordHeadline({ courses: COURSES, records: [{ userId: ME, lessonId: 'l1', completedAt: 'x', versionsRead: [], ageBand: 'teen' }], ageBand: 'adult' });
    expect(h.readingsRead).toBe(1);
    expect(h.versionsEver).toEqual(['teen']);
  });
});

describe('the record summary names the versions read', () => {
  it('each once, in the picker order, across every row', () => {
    const { learners } = aggregateLearnerRecords([
      { user_id: ME, lesson_id: 'l1', completed_at: '2026-10-20T00:00:00.000Z', versions_read: ['adult', 'child'] },
      { user_id: ME, lesson_id: 'l2', completed_at: '2026-10-21T00:00:00.000Z', versions_read: ['adult', 'senior'] },
    ]);
    expect(learners[0].versionsRead).toEqual(['child', 'adult', 'senior']);
  });
  it('the panel shows the figure, and says so honestly when nothing is recorded', () => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(LearnersPanel, { records: [{ user_id: ME, lesson_id: 'l1', completed_at: '2026-10-20T00:00:00.000Z', versions_read: ['adult', 'child'] }], currentUserId: ME })));
    expect(host.textContent).toMatch(/Versions read/);
    expect(host.textContent).toMatch(/Child, Adult/);
    expect(host.textContent).toMatch(/2 of 5 — 3 still to read/);
    act(() => root.render(createElement(LearnersPanel, { records: [{ user_id: ME, lesson_id: 'l1', completed_at: '2026-10-20T00:00:00.000Z' }], currentUserId: ME })));
    expect(host.textContent).toMatch(/Not recorded yet/);
    act(() => root.unmount()); host.remove();
  });
});

describe('the strip on the real Learn surface', () => {
  let host, root;
  const courses = buildCatalogCourseDescriptors();
  const ll = courses.find((c) => (c.key || c.meta?.key) === 'living-lessons');
  const first = ll.schedule[0];
  const second = ll.schedule[1];
  // The app mounts more than the catalog descriptors (its own built-in
  // courses ride in), so the total is read from the bar the app itself prints.
  const totalOnBar = () => Number((host.querySelector('[data-testid="lessons-bar"]').textContent.match(/(\d+) lessons/) || [])[1]);
  const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
    extraCourses: courses, progress: {}, toggleModule: vi.fn(), quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
    signedIn: true, currentUserId: ME, learnerRecords: [], ...props,
  })));
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); window.localStorage.clear(); });

  it('stands under the lessons bar with the counted headline, and the Record tab carries the count', () => {
    mount({
      learnerRecords: [
        { userId: ME, lessonId: first.id, courseKey: 'living-lessons', completedAt: '2026-10-20T00:00:00.000Z', quizPct: 100, quizPassed: true, quizAt: '2026-10-20T01:00:00.000Z', versionsRead: ['adult'] },
        { userId: ME, lessonId: second.id, courseKey: 'living-lessons', completedAt: '2026-10-25T00:00:00.000Z', versionsRead: ['adult'] },
      ],
    });
    const strip = host.querySelector('[data-testid="record-strip"]');
    expect(strip, 'the strip is on the Lessons area, not only the Record area').toBeTruthy();
    expect(strip.getAttribute('data-lessons-read')).toBe('2');
    const total = totalOnBar();
    expect(total).toBeGreaterThan(600);
    expect(host.querySelector('[data-testid="record-strip-line"]').textContent).toBe(`2 of ${total} lessons read (${Math.round((2 / total) * 100)}%) · 1 exam passed of 1 taken, average 100%`);
    expect(host.querySelector('[data-testid="record-strip-competency"]').textContent).toBe('Mastered');
    const next = host.querySelector('[data-testid="record-strip-next"]');
    expect(next.getAttribute('data-kind')).toBe('exam');
    expect(next.textContent).toContain(`Take the exam on ${second.title}`);
    const tab = [...host.querySelectorAll('[data-testid="learn-areas"] button')].find((b) => /Record/.test(b.textContent || ''));
    expect(tab.textContent).toContain('Record · 2');
    // The bar is still the bar, and the strip sits right after it.
    const bar = host.querySelector('[data-testid="lessons-bar"]');
    expect(bar.nextElementSibling).toBe(strip);
  });

  it('"Open your record" opens the Record area; the next step opens that lesson', () => {
    mount({ learnerRecords: [{ userId: ME, lessonId: second.id, courseKey: 'living-lessons', completedAt: '2026-10-25T00:00:00.000Z', versionsRead: ['adult'] }] });
    act(() => { host.querySelector('[data-testid="record-strip-open"]').click(); });
    expect(host.querySelector('[data-testid="learn-class-record"]'), 'the record is on screen').toBeTruthy();
    expect(host.querySelector('[data-testid="record-strip"]'), 'and the strip is still there, above it').toBeTruthy();
    act(() => { host.querySelector('[data-testid="record-strip-next"]').click(); });
    expect(host.querySelector(`[id="learn-lesson-${second.id}"]`), 'the lesson with the unanswered exam opened').toBeTruthy();
    expect(host.querySelector('[data-testid="record-strip"]'), 'a lesson open: the strip steps aside').toBeNull();
  });

  it('a reading finished on this device counts before its row arrives; signed out shows no strip (proven-to-catch)', () => {
    finishPlace({ courseKey: 'living-lessons', lessonId: first.id, version: 'adult' });
    mount();
    expect(host.querySelector('[data-testid="record-strip"]').getAttribute('data-lessons-read')).toBe('1');
    mount({ signedIn: false });
    expect(host.querySelector('[data-testid="record-strip"]')).toBeNull();
  });
});
