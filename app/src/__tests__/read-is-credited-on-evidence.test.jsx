// =============================================================================
// Read is credited on evidence (DR-1386, narrowing DR-1384)
// =============================================================================
// Darrell, 2026-11-10, after DR-1384 made a passed exam, Done or every part seen
// each count as read: "Not seeing any part... taking the test... and some kpi's
// that fit noticing when a human roll a test... We want to give credit where
// it is due... not anything..." and "is there a better way?"
//
// THE BETTER WAY, pinned here: READ is credited on evidence the words were met
// (the parts seen or heard to READ_FLOOR, or a finish by the reader, the deck
// or the end door). Done stays the learner's own mark; a passed exam stays a
// score carried WITH how it was taken. Neither stands in for the reading.
//
// PROVEN TO CATCH: Done and a passed exam with nothing seen finish nothing, and
// a lesson half seen is not read.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlaceFor, clearAllPlaces, recordPlace } from '../lib/learn-resume.js';
import { READ_FLOOR } from '../lib/test-integrity.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { buildLessonArc } from '../lib/lesson-flow.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const C = 'living-lessons';
const choose = (sel, value) =>
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });

describe('read is credited on evidence', () => {
  let host;
  let root;
  const mount = (toggleModule, recordQuiz = () => {}, progress = {}) =>
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          extraCourses: buildCatalogCourseDescriptors(),
          progress,
          toggleModule,
          quizState: {},
          recordQuiz,
          learnLevel: 'auto',
          setLearnLevel: () => {},
          ageBand: 'adult',
          setAgeBand: () => {},
        })
      )
    );
  const latestRow = () => {
    choose(host.querySelector('#learn-course-sort'), 'latest');
    const row = host.querySelector(`[data-testid="learn-latest-lessons"] li[data-course-key="${C}"]`);
    expect(row).toBeTruthy();
    return row;
  };
  const open = (row) => {
    const id = row.getAttribute('data-lesson-id');
    act(() => row.querySelector('button').click());
    const card = host.querySelector(`[id="learn-lesson-${id}"]`);
    expect(card).toBeTruthy();
    return { id, card };
  };
  // The exam lives in the Apply part of the guide: the place opens the guide there.
  const atApply = (id, extra = {}) => {
    const mod = LIVING_LESSONS_MODULES.find((m) => m.id === id);
    const stage = buildLessonArc(mod, { ageBand: 'adult' }).audienceSegments.findIndex((x) => x.kind === 'apply');
    expect(stage, 'the guide has an Apply part').toBeGreaterThan(0);
    recordPlace({ courseKey: C, lessonId: id, stage, ...extra });
  };
  const doneButton = (card) => [...card.querySelectorAll('button')].find((b) => /Mark this lesson done|✓ Done/.test(b.textContent || ''));
  const passExam = (card, id, beforeAnswering = null) => {
    const mod = LIVING_LESSONS_MODULES.find((m) => m.id === id);
    act(() => [...card.querySelectorAll('button')].find((b) => /Continue this lesson/.test(b.textContent || '')).click());
    if (beforeAnswering) beforeAnswering();
    expect(mod?.quiz?.questions?.length, 'the lesson carries an exam').toBeGreaterThan(0);
    mod.quiz.questions.forEach((q, qi) => {
      const radio = card.querySelectorAll(`input[name="q-${id}-${qi}"]`)[q.answer];
      expect(radio, `question ${qi + 1} is on the card`).toBeTruthy();
      act(() => radio.click());
    });
    act(() => [...card.querySelectorAll('button')].find((b) => /Check my answers/.test(b.textContent || '')).click());
    const line = card.querySelector('[data-testid="quiz-integrity"]');
    expect(line, 'the attempt says how it was taken').toBeTruthy();
    return line;
  };
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

  it('Done with nothing seen keeps the mark but credits no reading', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const { id, card } = open(latestRow());
    act(() => doneButton(card).click());
    expect(toggleModule, 'the Done mark is kept').toHaveBeenCalledWith(id, C);
    expect(toggleModule, 'no reading filed').not.toHaveBeenCalledWith(id, C, expect.anything());
    expect(getPlaceFor(C, id)?.done, 'Done is not a reading').not.toBe(true);
  });

  it('the parts seen to the floor finish the reading with its version, the next time the place is written', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const row = latestRow();
    const id = row.getAttribute('data-lesson-id');
    recordPlace({ courseKey: C, lessonId: id, seen: READ_FLOOR });
    open(row);
    expect(getPlaceFor(C, id)?.done, 'seen to the floor is read').toBe(true);
    expect(getPlaceFor(C, id)?.versions).toEqual({ adult: 1 });
    expect(toggleModule).toHaveBeenCalledWith(id, C, { versionsRead: ['adult'] });
  });

  it('heard to the floor is read as well as seen (the read-aloud is a witness)', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const row = latestRow();
    const id = row.getAttribute('data-lesson-id');
    recordPlace({ courseKey: C, lessonId: id, heard: 0.95 });
    open(row);
    expect(getPlaceFor(C, id)?.done).toBe(true);
  });

  it('a passed exam before reading keeps the score, says so, and credits no reading', () => {
    const toggleModule = vi.fn();
    const recordQuiz = vi.fn();
    mount(toggleModule, recordQuiz);
    const row = latestRow();
    const id = row.getAttribute('data-lesson-id');
    atApply(id);
    const { card } = open(row);
    const line = passExam(card, id);
    expect(line.getAttribute('data-reading')).toBe('before');
    expect(line.textContent).toMatch(/Taken before reading the lesson/);
    expect(line.getAttribute('data-rushed'), 'answered faster than a person can read').toBe('true');
    const [gotId, got] = recordQuiz.mock.calls.at(-1);
    expect(gotId).toBe(id);
    expect(got.passed, 'the grade is kept').toBe(true);
    expect(got.integrity.reading).toBe('before');
    expect(got.integrity.rushed).toBe(true);
    expect(got.integrity.firstTry, 'taking is kept apart from grading').toBe(true);
    expect(getPlaceFor(C, id)?.done, 'a pass is not a reading').not.toBe(true);
    expect(toggleModule).not.toHaveBeenCalledWith(id, C, expect.anything());
  });

  it('a passed exam after reading is carried as taken after reading', () => {
    const recordQuiz = vi.fn();
    mount(vi.fn(), recordQuiz);
    const row = latestRow();
    const id = row.getAttribute('data-lesson-id');
    atApply(id);
    const { card } = open(row);
    const line = passExam(card, id, () => recordPlace({ courseKey: C, lessonId: id, seen: 1 }));
    expect(line.getAttribute('data-reading')).toBe('after');
    expect(line.textContent).toMatch(/Taken after reading \(100% of the lesson seen or heard\)/);
    const got = recordQuiz.mock.calls.at(-1)[1];
    expect(got.integrity.reading).toBe('after');
    expect(got.integrity.readPct).toBe(100);
  });

  it('a lesson flicked through at once is not credited as seen (the pace, with grace)', () => {
    mount(vi.fn());
    const { id } = open(latestRow());
    // jsdom lays every word "on screen" at once: a reading credited faster than a reader reads would show it all seen.
    expect(getPlaceFor(C, id)?.seen || 0, 'no words credited before there was time to read them').toBeLessThan(0.05);
  });

  it('PROVEN TO CATCH: un-marking Done finishes nothing, and half seen is not read', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const id = latestRow().getAttribute('data-lesson-id');
    mount(toggleModule, () => {}, { [id]: '2026-11-10T00:00:00.000Z' });
    const { card } = open(latestRow());
    recordPlace({ courseKey: C, lessonId: id, seen: 0.5 });
    act(() => doneButton(card).click());
    expect(getPlaceFor(C, id)?.done, 'turning Done off is not a reading').not.toBe(true);
    act(() => [...card.querySelectorAll('button')].find((b) => /Start this lesson|Continue this lesson/.test(b.textContent || ''))?.click());
    expect(getPlaceFor(C, id)?.done, 'half seen is not read').not.toBe(true);
  });
});
