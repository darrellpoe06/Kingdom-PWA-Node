// =============================================================================
// THE ROW SAYS WHICH VERSION I READ, AND OFFERS THE ONE I DID NOT (DR-1255)
// =============================================================================
// Darrell 2026-10-27, on the Latest list (58 lessons, 290 readings, not one
// marked): "Why can't I tell which ones I've already read?! Even which version
// so I can try the one I didn't read!!!!!! Fix it!!!!!!"
//
// The list on screen, rendered for real: the mark from the device's place AND
// from the learner's own record (another device's reading), the versions read
// named, a tap for each version not read that opens THAT version, and nothing
// on a lesson never touched. PROVEN-TO-CATCH: the record-only row and the
// finished-then-reopened row showed nothing before this change.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LatestLessons from '../components/LatestLessons.jsx';
import { recordPlace, finishPlace, clearAllPlaces } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ADULT = 'The adult lesson, written in full for a grown reader.';
const ALL_AGES = { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' };
const L1 = { id: 'll1-the-first', title: 'The First', lesson: ADULT, levels: ALL_AGES, added: '2026-10-03' };
const L2 = { id: 'll2-the-second', title: 'The Second', lesson: ADULT, added: '2026-10-02' };
const L3 = { id: 'll3-the-third', title: 'The Third', lesson: ADULT, levels: ALL_AGES, added: '2026-10-01' };
const L4 = { id: 'll4-the-fourth', title: 'The Fourth', lesson: ADULT, levels: ALL_AGES, added: '2026-09-30' };
const courses = () => [{ key: 'll', meta: { title: 'Living Lessons' }, schedule: [L1, L2, L3, L4] }];

describe('the Latest list says which ones I read, and which version', () => {
  let container, root;
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });
  const li = (id) => container.querySelector(`[data-testid="learn-latest-list"] li[data-lesson-id="${id}"]`);
  const mark = (id) => li(id).querySelector('[data-testid="row-finished"]');
  const chips = (id) => [...li(id).querySelectorAll('[data-testid="row-read-version"]')].map((b) => b.getAttribute('data-version'));

  const RECORDS = {
    [L2.id]: { lessonId: L2.id, completedAt: '2026-10-20T00:00:00.000Z', versionsRead: ['adult'] },
    [L3.id]: { lessonId: L3.id, completedAt: '2026-10-19T00:00:00.000Z', versionsRead: [] },
  };
  const mount = (over = {}) => {
    const onReadVersion = vi.fn();
    const onContinue = vi.fn();
    act(() => root.render(createElement(LatestLessons, {
      courses: courses(), onOpen: () => {}, onPlay: () => {}, onContinue,
      recordFor: (id) => RECORDS[id] || null, onReadVersion, ...over,
    })));
    return { onReadVersion, onContinue };
  };

  it('read as an adult on this device: "✓ READ · Adult", and a tap for each of the four versions not read', () => {
    finishPlace({ courseKey: 'll', lessonId: L1.id, version: 'adult' });
    const { onReadVersion } = mount();
    expect(mark(L1.id).textContent).toBe('✓ READ · Adult');
    expect(mark(L1.id).getAttribute('data-versions')).toBe('adult');
    expect(mark(L1.id).getAttribute('aria-label')).toBe('You read the Adult version of The First on this device. Not read yet: Child, Youth, Teen, Senior — tap one to read it.');
    expect(chips(L1.id)).toEqual(['child', 'youth', 'teen', 'senior']);
    act(() => { li(L1.id).querySelector('[data-testid="row-read-version"][data-version="child"]').click(); });
    expect(onReadVersion).toHaveBeenCalledWith('ll', L1.id, 'child');
    // A lesson never touched, on no device and in no record, says nothing.
    expect(li(L4.id).querySelector('[data-testid="row-finished"], [data-testid="row-continue"], [data-testid="row-read-version"]')).toBeNull();
  });

  it('read on ANOTHER device (the record alone): marked here too, from the record', () => {
    mount();
    expect(mark(L2.id).textContent, 'a one-version lesson names no version').toBe('✓ READ');
    expect(mark(L2.id).getAttribute('data-from-record')).toBe('true');
    expect(chips(L2.id), 'nothing left to offer on a one-version lesson').toEqual([]);
    expect(mark(L3.id).textContent, 'a record that never said which version, with no band to go by, says so').toBe('✓ READ · version not recorded');
    expect(chips(L3.id), 'and every version is offered').toEqual(['child', 'youth', 'teen', 'adult', 'senior']);
  });

  it('proven-to-catch: a lesson finished, then opened again, stays READ (before: no mark at all)', () => {
    finishPlace({ courseKey: 'll', lessonId: L1.id, version: 'child' });
    recordPlace({ courseKey: 'll', lessonId: L1.id, stage: 0, step: 0 });
    mount();
    expect(mark(L1.id).textContent).toBe('✓ READ · Child');
    expect(li(L1.id).querySelector('[data-testid="row-continue"]')).toBeNull();
  });

  it('device and record together: one mark, each version once, the count from the device', () => {
    finishPlace({ courseKey: 'll', lessonId: L3.id, version: 'senior' });
    recordPlace({ courseKey: 'll', lessonId: L3.id, sentence: 3 });
    finishPlace({ courseKey: 'll', lessonId: L3.id, version: 'senior' });
    mount({ recordFor: (id) => (id === L3.id ? { lessonId: L3.id, completedAt: 'x', versionsRead: ['teen', 'senior'] } : null) });
    expect(mark(L3.id).textContent).toBe('✓ READ ×2 · Teen, Senior');
    expect(chips(L3.id)).toEqual(['child', 'youth', 'adult']);
  });

  it('a lesson begun still says Continue; with no version door handed in, no taps are painted', () => {
    recordPlace({ courseKey: 'll', lessonId: L4.id, stage: 1, step: 2 });
    finishPlace({ courseKey: 'll', lessonId: L1.id, version: 'adult' });
    const { onContinue } = mount({ onReadVersion: null });
    expect(li(L4.id).querySelector('[data-testid="row-continue"]')).toBeTruthy();
    act(() => { li(L4.id).querySelector('[data-testid="row-continue"]').click(); });
    expect(onContinue).toHaveBeenCalled();
    expect(mark(L1.id).textContent).toBe('✓ READ · Adult');
    expect(chips(L1.id)).toEqual([]);
  });
});
