// =============================================================================
// Read is read by any road (DR-1384)
// =============================================================================
// Darrell, 2026-11-10, with three screenshots of L3: "I took the exam and
// passed and still the receipt and record passed however it doesn't look like
// I read it... fix it..." The lesson said ALL READ, seen 100%, and Done; the
// list beside L1 and L2 (both ✓ READ · ADULT) showed L3 with no mark at all.
//
// MEASURED FIRST. The list's ✓ READ comes from a FINISHED place or the
// learner's record (lib/lesson-read-mark.js). A place was finished only by the
// read-aloud's last sentence, the deck's last part, or the guide's end door, so
// three real readings left no mark: every part seen by hand, a passed exam,
// and Done. Each now finishes the place once, with its version, and the
// finish is filed to the record the same moment (DR-1251).
//
// PROVEN TO CATCH: un-marking Done finishes nothing, and a lesson only half
// seen is not read.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlaceFor, clearAllPlaces, recordPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const C = 'living-lessons';
const choose = (sel, value) =>
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });

describe('read is read by any road', () => {
  let host;
  let root;
  const mount = (toggleModule, progress = {}) =>
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          extraCourses: buildCatalogCourseDescriptors(),
          progress,
          toggleModule,
          quizState: {},
          recordQuiz: () => {},
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
  const doneButton = (card) => [...card.querySelectorAll('button')].find((b) => /Mark this lesson done|✓ Done/.test(b.textContent || ''));
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

  it('Done finishes the reading with its version, and the read is filed with it', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const { id, card } = open(latestRow());
    expect(getPlaceFor(C, id)?.done).not.toBe(true);
    act(() => doneButton(card).click());
    expect(getPlaceFor(C, id)?.done, 'Done is a finished reading').toBe(true);
    expect(getPlaceFor(C, id)?.versions).toEqual({ adult: 1 });
    expect(toggleModule).toHaveBeenCalledWith(id, C, { versionsRead: ['adult'] });
  });

  it('every part seen by hand finishes the reading the next time the place is written', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const row = latestRow();
    const id = row.getAttribute('data-lesson-id');
    recordPlace({ courseKey: C, lessonId: id, seen: 1 });
    expect(getPlaceFor(C, id)?.done).not.toBe(true);
    open(row);
    expect(getPlaceFor(C, id)?.done, 'seen 100% is read').toBe(true);
    expect(toggleModule).toHaveBeenCalledWith(id, C, { versionsRead: ['adult'] });
  });

  it('a passed exam finishes the reading (the card hands the guide a recorder that finishes on a pass)', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/onRecordQuiz=\{\(id, r\) => \{ if \(recordQuiz\) recordQuiz\(id, r\); if \(r && r\.passed\) finishRead\(id\); \}\}/);
  });

  it('PROVEN TO CATCH: un-marking Done finishes nothing, and half seen is not read', () => {
    const toggleModule = vi.fn();
    const row0 = (() => {
      mount(toggleModule);
      return latestRow();
    })();
    const id = row0.getAttribute('data-lesson-id');
    mount(toggleModule, { [id]: '2026-11-10T00:00:00.000Z' });
    const { card } = open(latestRow());
    act(() => doneButton(card).click());
    expect(getPlaceFor(C, id)?.done, 'turning Done off is not a reading').not.toBe(true);
    recordPlace({ courseKey: C, lessonId: id, seen: 0.5 });
    act(() => [...card.querySelectorAll('button')].find((b) => /Start this lesson|Continue this lesson/.test(b.textContent || ''))?.click());
    expect(getPlaceFor(C, id)?.done, 'half seen is not read').not.toBe(true);
  });
});
