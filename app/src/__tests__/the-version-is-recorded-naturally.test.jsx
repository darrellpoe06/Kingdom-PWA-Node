// =============================================================================
// THE VERSION IS RECORDED NATURALLY, AN OLDER READ IS THE BAND'S VERSION, AND
// THE ROW KEEPS ITS LOOK (DR-1257)
// =============================================================================
// Darrell 2026-10-27, on DR-1255's one dated limit: "The version read should
// be recorded naturally.... obviously!!!!!!" Then, on a row reading "✓ READ ×2
// · version not recorded" with five taps crushing the title to one word per
// line: "2x... if I don't know what I read... or which version... how can I
// read the others?!" and "the flow of the app and look...."
//
// Three things, each proven on the real component:
//   1. every write of the place from the lesson space names the version the
//      space serves — a start, a step, the end door — so a finish by any road
//      counts its version with no reader involved;
//   2. a read filed before the version existed is attributed to the version
//      the reader's band is served (the record's band, else the device's),
//      said so in the sentence, and the other versions are offered;
//   3. with taps to offer, the mark takes its own line under the title.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LatestLessons from '../components/LatestLessons.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlaceFor, clearAllPlaces, finishPlace, recordPlace, versionsRead } from '../lib/learn-resume.js';
import { versionRead, bandVersion, readMark, readMarkSays } from '../lib/lesson-read-mark.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const choose = (sel, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});

describe('the lesson space records the version on every write of the place', () => {
  let host, root;
  const courses = buildCatalogCourseDescriptors();
  const mount = (ageBand) => act(() => root.render(createElement(ChurchLearn, {
    extraCourses: courses, progress: {}, toggleModule: vi.fn(), quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand, setAgeBand: () => {},
  })));
  const openFromLatest = () => {
    choose(host.querySelector('#learn-course-sort'), 'latest');
    const row = host.querySelector('[data-testid="learn-latest-lessons"] li[data-course-key="living-lessons"]');
    const id = row.getAttribute('data-lesson-id');
    act(() => { row.querySelector('button').click(); });
    expect(host.querySelector(`[id="learn-lesson-${id}"]`), 'the lesson opened in its own space').toBeTruthy();
    const course = courses.find((c) => (c.key || c.meta?.key) === 'living-lessons');
    return { id, module: (course.schedule || []).find((m) => m.id === id) };
  };
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); window.localStorage.clear(); });

  it('opening a lesson as an adult notes the adult version; the end door then counts it', () => {
    mount('adult');
    const { id, module } = openFromLatest();
    expect(versionRead(module, 'adult')).toBe('adult');
    expect(getPlaceFor('living-lessons', id)?.version, 'noted on open, with no reader').toBe('adult');
    // The guide's end door (TutorPanel onAllUnits) names no version — and needs none.
    act(() => { finishPlace({ courseKey: 'living-lessons', lessonId: id }); });
    expect(versionsRead(getPlaceFor('living-lessons', id))).toEqual(['adult']);
  });

  it('opening the same lesson as a child notes the version the child band is served (proven-to-catch: not the adult one by default)', () => {
    mount('child');
    const { id, module } = openFromLatest();
    const served = versionRead(module, 'child');
    expect(served).toBeTruthy();
    expect(getPlaceFor('living-lessons', id)?.version).toBe(served);
    if (module.levels && module.levels.child) expect(served).toBe('child');
  });
});

describe('an older read is the band’s version, and the others are offered', () => {
  const V = ['child', 'youth', 'teen', 'adult', 'senior'];
  const ALL = { id: 'x', lesson: 'Adult words.', levels: { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' } };
  it('a finish with no version, on an adult’s record, reads as the Adult version — said so — with four to read', () => {
    const m = readMark({ place: { finishes: 2, done: true, versions: {} }, versions: V, attributed: bandVersion(ALL, 'adult') });
    expect(m).toMatchObject({ read: true, times: 2, readIds: ['adult'], unreadIds: ['child', 'youth', 'teen', 'senior'], byBand: true, known: true });
    expect(readMarkSays(m, 'X')).toBe('You read the Adult version of X on this device (the version your age band is served; it was not recorded at the time). Not read yet: Child, Youth, Teen, Senior — tap one to read it.');
  });
  it('a recorded version is never overridden by the band; a band the lesson does not serve attributes nothing', () => {
    expect(readMark({ place: { finishes: 1, done: true, versions: { teen: 1 } }, versions: V, attributed: 'adult' })).toMatchObject({ readIds: ['teen'], byBand: false });
    expect(readMark({ place: { finishes: 1, done: true, versions: {} }, versions: ['adult'], attributed: 'child' })).toMatchObject({ readIds: ['adult'], byBand: false });
    expect(bandVersion(null, 'adult')).toBe(null);
    expect(bandVersion(ALL, 'youth')).toBe('youth');
    expect(bandVersion({ id: 'y', lesson: 'Adult words.', levels: { teen: 'Teen words.' } }, 'child'), 'a child handed the teen words read the teen version').toBe('teen');
  });
});

describe('the look: the mark with taps takes its own line under the title', () => {
  let container, root;
  const ADULT = 'The adult lesson, written in full.';
  const ALL_AGES = { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' };
  const L1 = { id: 'll1-the-first', title: 'The Perfect Yahweh Expects Perfect Order', lesson: ADULT, levels: ALL_AGES, added: '2026-10-03' };
  const L2 = { id: 'll2-the-second', title: 'The Second', lesson: ADULT, added: '2026-10-02' };
  const courses = () => [{ key: 'll', meta: { title: 'Living Lessons' }, schedule: [L1, L2] }];
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });
  const li = (id) => container.querySelector(`[data-testid="learn-latest-list"] li[data-lesson-id="${id}"]`);

  it('the row wraps; a mark with taps is last and full-width; a mark with none stays inline', () => {
    finishPlace({ courseKey: 'll', lessonId: L1.id });
    recordPlace({ courseKey: 'll', lessonId: L1.id, sentence: 2 });
    finishPlace({ courseKey: 'll', lessonId: L1.id });
    finishPlace({ courseKey: 'll', lessonId: L2.id });
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {}, onPlay: () => {}, onContinue: () => {}, onReadVersion: () => {}, ageBand: 'adult' })));
    expect(li(L1.id).className).toMatch(/\bflex-wrap\b/);
    const mark = li(L1.id).querySelector('[data-testid="row-read-mark"]');
    expect(mark.getAttribute('data-own-line')).toBe('true');
    expect(mark.className).toMatch(/\border-last\b/);
    expect(mark.className).toMatch(/\bbasis-full\b/);
    expect(mark.className).not.toMatch(/max-w/);
    // The older two reads are the adult's, by his band, and the four others are offered.
    expect(li(L1.id).querySelector('[data-testid="row-finished"]').textContent).toBe('✓ READ ×2 · Adult');
    expect([...li(L1.id).querySelectorAll('[data-testid="row-read-version"]')].map((b) => b.getAttribute('data-version'))).toEqual(['child', 'youth', 'teen', 'senior']);
    const inline = li(L2.id).querySelector('[data-testid="row-read-mark"]');
    expect(inline.getAttribute('data-own-line')).toBe('false');
    expect(inline.className).toMatch(/\bshrink-0\b/);
    // The ▶ Play stays on the row, after the title.
    expect(li(L1.id).querySelector('[data-testid="latest-play"]')).toBeTruthy();
  });

  it('the band on the RECORD wins over the device’s band for an older read filed there', () => {
    act(() => root.render(createElement(LatestLessons, {
      courses: courses(), onOpen: () => {}, onContinue: () => {}, onReadVersion: () => {}, ageBand: 'adult',
      recordFor: (id) => (id === L1.id ? { lessonId: L1.id, completedAt: '2026-10-20T00:00:00.000Z', ageBand: 'teen', versionsRead: [] } : null),
    })));
    expect(li(L1.id).querySelector('[data-testid="row-finished"]').textContent).toBe('✓ READ · Teen');
  });
});
