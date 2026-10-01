// =============================================================================
// Download one lesson, a course, or every lesson (DR-0722)
// =============================================================================
// Darrell 2026-10-01: "Also the ability to download all lessons at once or
// individually" and "Make sure the options for just adult or all reading
// levels as an option for those with and without children..."
//
// Each test below fails without the gate it names (DR-0076 §3); the mutations
// that were run to prove it are listed in DR-0722 "Verification".
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { DownloadPanel, LessonDownloadButton, OfflineLevelNote } from '../components/LessonDownloads.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { createClipCache, memoryBackend, _setDeviceClipCacheForTests, CAP_KEY } from '../lib/clip-cache.js';
import { getReadTarget } from '../lib/read-target.js';
import {
  lessonVersions, bandsForChoice, planDownload, runDownload, removeDownloads, checkRoom,
  lessonReading, readingPieces, savedLevels, savedReadingFor, courseContext, memoryWords,
  _setDeviceWordsForTests, saveChoice, loadChoice, readRegistry, REGISTRY_KEY,
} from '../lib/lesson-downloads.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const MB = 1024 * 1024;

const COURSES = buildCatalogCourseDescriptors();
const LL = COURSES.find((c) => c.meta.key === 'living-lessons');
const CTX = courseContext(LL);
// A lesson written at every level, and one written once for everybody.
const LEVELED = LL.schedule.find((m) => lessonVersions(m).length >= 4);
const SINGLE = COURSES.flatMap((c) => c.schedule).find((m) => lessonVersions(m).length === 1);

const fakeBlob = (n = 1000) => ({ size: n });
function harness({ capBytes = 1e12 } = {}) {
  const cache = createClipCache({ backend: memoryBackend(), capBytes: () => capBytes });
  const words = memoryWords();
  const fetched = [];
  const fetchPiece = async (spoken) => { fetched.push(spoken); return { blob: fakeBlob() }; };
  _setDeviceClipCacheForTests(cache);
  _setDeviceWordsForTests(words);
  return { cache, words, fetched, deps: { cache, words, fetchPiece, offline: () => false } };
}

let onLine = true;
const realOnLine = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
beforeEach(() => {
  window.localStorage.clear();
  onLine = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => onLine });
});
afterEach(() => {
  window.localStorage.clear();
  delete navigator.onLine;
  if (realOnLine) Object.defineProperty(Navigator.prototype, 'onLine', realOnLine);
});

describe('the reading levels are the lesson\'s own (Adult only / All reading levels)', () => {
  it('names the real bands, the adult first, and counts the same words once', () => {
    expect(LEVELED).toBeTruthy();
    const v = lessonVersions(LEVELED);
    expect(v[0].id).toBe('adult');
    expect(v.map((x) => x.label)).toEqual(expect.arrayContaining(['Adult', 'Child', 'Teen']));
    expect(bandsForChoice(LEVELED, 'adult')).toEqual(['adult']);
    expect(bandsForChoice(LEVELED, 'all')).toEqual(v.map((x) => x.id));
    // Picking Youth on a lesson whose youth reads the teen words saves the teen version once.
    const youthServer = v.find((x) => x.serves.includes('youth')).id;
    expect(bandsForChoice(LEVELED, { pick: ['youth'] })).toEqual([youthServer]);
  });

  it('a lesson written once for everybody: All is Adult', () => {
    expect(SINGLE).toBeTruthy();
    expect(bandsForChoice(SINGLE, 'all')).toEqual(['adult']);
  });

  it('All costs more than Adult only, and the choice is remembered', async () => {
    const items = [{ module: LEVELED, ctx: CTX }];
    const adult = await planDownload(items, { choice: 'adult', storage: window.localStorage });
    const all = await planDownload(items, { choice: 'all', storage: window.localStorage });
    expect(all.wordsBytes).toBeGreaterThan(adult.wordsBytes);
    expect(all.voiceBytes).toBeGreaterThan(adult.voiceBytes);
    saveChoice({ pick: ['child', 'adult'] });
    expect(loadChoice()).toEqual({ pick: ['child', 'adult'] });
    saveChoice('all');
    expect(loadChoice()).toBe('all');
  });
});

describe('one lesson: saved, then read with no connection', () => {
  it('saves the words and every voice piece, held by name', async () => {
    const h = harness();
    const plan = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'adult', storage: window.localStorage });
    const res = await runDownload({ plan, deps: h.deps });
    expect(res.saved).toBe(1);
    expect(res.failed).toEqual([]);
    expect(savedLevels(LEVELED.id).adult.voice).toBe('female');
    const reading = lessonReading(LEVELED, 'adult', CTX);
    const keys = readingPieces(reading, 'female').map((p) => p.key);
    const st = await h.cache.status(keys);
    expect(st.saved).toBe(st.total);
    expect(await h.words.get(`${LEVELED.id}|adult`)).toMatchObject({ reading, title: LEVELED.title });
  });

  it('offline, the open lesson hands the reader the saved text (preferText), whose pieces are all on the device', async () => {
    const h = harness();
    const plan = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'adult', storage: window.localStorage });
    await runDownload({ plan, deps: h.deps });
    onLine = false;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(ChurchLearn, {
      extraCourses: COURSES, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
      learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
    })));
    const sel = container.querySelector('#learn-course-pick');
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, 'living-lessons');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const titleBtn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(LEVELED.title));
    act(() => { titleBtn.click(); });
    const start = [...container.querySelectorAll('button')].find((b) => /^(Start|Continue) this /.test(b.textContent || ''));
    act(() => { start.click(); });
    const t = getReadTarget();
    expect(t && t.owner).toBe(LEVELED.id);
    expect(t.preferText).toBe(true);
    expect(t.text).toBe(savedReadingFor(LEVELED, 'adult', CTX));
    const st = await h.cache.status(readingPieces(t.text, 'female').map((p) => p.key));
    expect(st.saved).toBe(st.total);
    // The "Saved" mark is on the lesson.
    expect(container.querySelector('[data-testid="lesson-saved-mark"]')).toBeTruthy();
    act(() => root.unmount());
    container.remove();
  });

  it('a level that is not saved says so offline instead of failing', () => {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify({ v: 1, lessons: { [LEVELED.id]: { course: 'living-lessons', title: LEVELED.title, levels: { adult: { words: 1, voice: 'female' } } } } }));
    onLine = false;
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(createElement(OfflineLevelNote, { module: LEVELED, ageBand: 'child' })));
    const note = container.querySelector('[data-testid="offline-level-note"]');
    expect(note).toBeTruthy();
    expect(note.textContent).toMatch(/Child reading voice for this lesson is not saved/);
    expect(note.textContent).toMatch(/saved here: Adult/);
    act(() => root.render(createElement(OfflineLevelNote, { module: LEVELED, ageBand: 'adult' })));
    expect(container.querySelector('[data-testid="offline-level-note"]')).toBeNull();
    act(() => root.unmount());
  });
});

describe('a course or every lesson: progress, pause, and skipping what is here', () => {
  it('counts lessons, skips the saved one, and never fetches its pieces again', async () => {
    const h = harness();
    const three = LL.schedule.slice(0, 3).map((m) => ({ module: m, ctx: CTX }));
    await runDownload({ plan: await planDownload(three.slice(0, 1), { choice: 'adult', storage: window.localStorage }), deps: h.deps });
    const firstFetches = h.fetched.length;
    expect(firstFetches).toBeGreaterThan(0);
    const plan = await planDownload(three, { choice: 'adult', storage: window.localStorage });
    expect(plan.already).toBe(1);
    const seen = [];
    const res = await runDownload({ plan, deps: h.deps, onProgress: (p) => seen.push(`${p.done} of ${p.total}`) });
    expect(res).toMatchObject({ total: 3, skipped: 1, saved: 2 });
    expect(seen[0]).toBe('1 of 3');
    expect(seen.at(-1)).toBe('3 of 3');
    const firstKeys = new Set(readingPieces(lessonReading(three[0].module, 'adult', CTX), 'female').map((p) => p.spoken));
    expect(h.fetched.slice(firstFetches).some((s) => firstKeys.has(s) && !readingPieces(lessonReading(three[1].module, 'adult', CTX), 'female').concat(readingPieces(lessonReading(three[2].module, 'adult', CTX), 'female')).some((p) => p.spoken === s))).toBe(false);
  });

  it('pauses and resumes', async () => {
    const h = harness();
    const two = LL.schedule.slice(0, 2).map((m) => ({ module: m, ctx: CTX }));
    const plan = await planDownload(two, { choice: 'adult', storage: window.localStorage });
    const signal = { paused: true, aborted: false };
    const progress = [];
    const run = runDownload({ plan, signal, deps: h.deps, onProgress: (p) => progress.push(p.done) });
    await new Promise((r) => setTimeout(r, 450));
    expect(h.fetched.length).toBe(0);
    signal.paused = false;
    const res = await run;
    expect(res.saved).toBe(2);
    expect(progress.at(-1)).toBe(2);
  });

  it('adding the children\'s levels later tops up without fetching the adult version again', async () => {
    const h = harness();
    const items = [{ module: LEVELED, ctx: CTX }];
    await runDownload({ plan: await planDownload(items, { choice: 'adult', storage: window.localStorage }), deps: h.deps });
    const adultSpoken = new Set(readingPieces(lessonReading(LEVELED, 'adult', CTX), 'female').map((p) => p.spoken));
    const before = h.fetched.length;
    const top = await planDownload(items, { choice: 'all', storage: window.localStorage });
    expect(top.work[0].todo).not.toContain('adult');
    await runDownload({ plan: top, deps: h.deps });
    const after = h.fetched.slice(before);
    expect(after.length).toBeGreaterThan(0);
    expect(after.filter((s) => adultSpoken.has(s))).toEqual([]);
    expect(Object.keys(savedLevels(LEVELED.id)).sort()).toEqual(lessonVersions(LEVELED).map((v) => v.id).sort());
  });

  it('a failure is kept with its reason; the words are still saved', async () => {
    const h = harness();
    const plan = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'adult', storage: window.localStorage });
    const res = await runDownload({ plan, deps: { ...h.deps, fetchPiece: async () => ({ error: 'voice-lite-timeout' }) } });
    expect(res.failed).toEqual([{ lessonId: LEVELED.id, title: LEVELED.title, reason: 'voice-lite-timeout' }]);
    expect(savedLevels(LEVELED.id).adult).toMatchObject({ voice: null });
  });
});

describe('storage honesty', () => {
  it('over the limit: says so and offers a higher limit; over free space: words only', () => {
    const plan = { wordsBytes: 2 * MB, voiceBytes: 400 * MB, withVoice: true };
    const cap = checkRoom(plan, { capMb: 300, heldBytes: 0, space: { free: 10000 * MB } });
    expect(cap).toMatchObject({ fits: false, short: 'cap', raiseTo: 600 });
    const space = checkRoom(plan, { capMb: 1000, heldBytes: 0, space: { free: 100 * MB } });
    expect(space).toMatchObject({ fits: false, short: 'space', wordsFit: true });
    expect(checkRoom({ ...plan, withVoice: false }, { capMb: 100, space: { free: 100 * MB } }).fits).toBe(true);
  });

  it('a piece a person saved is never cleared to make room', async () => {
    const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1500 });
    await cache.put('held', fakeBlob(1000), { pin: 'lesson|adult' });
    await cache.put('casual', fakeBlob(1000));
    await cache.put('casual2', fakeBlob(1000));
    expect(await cache.has('held')).toBe(true);
    expect(await cache.has('casual')).toBe(false);
  });

  it('the panel, short on room, offers the words only, and that saves no voice', async () => {
    const h = harness();
    window.localStorage.setItem(CAP_KEY, '100');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const items = LL.schedule.slice(0, 2).map((m) => ({ module: m, ctx: CTX }));
    await act(async () => {
      root.render(createElement(DownloadPanel, {
        items, scope: 'course:living-lessons', what: 'this course', removeWhich: () => true,
        deps: { ...h.deps, space: async () => ({ free: 3 * MB, quota: 3 * MB, usage: 0 }) },
      }));
      await new Promise((r) => setTimeout(r, 300));
    });
    const short = container.querySelector('[data-testid="download-room-short"]');
    expect(short).toBeTruthy();
    expect(short.textContent).toMatch(/free/);
    expect(container.querySelector('[data-testid="download-start"]')).toBeNull();
    await act(async () => { container.querySelector('[data-testid="download-words-only"]').click(); await new Promise((r) => setTimeout(r, 300)); });
    expect(h.fetched.length).toBe(0);
    expect(Object.keys(readRegistry().lessons)).toHaveLength(2);
    expect(container.querySelector('[data-testid="download-summary"]').textContent).toMatch(/Saved 2 lessons/);
    act(() => root.unmount());
    container.remove();
  });
});

describe('remove downloads', () => {
  it('per lesson, per course, and all; a piece two lessons share stays for the other', async () => {
    const h = harness();
    const items = LL.schedule.slice(0, 2).map((m) => ({ module: m, ctx: CTX }));
    await runDownload({ plan: await planDownload(items, { choice: 'adult', storage: window.localStorage }), deps: h.deps });
    // Hold one of lesson 2's pieces from lesson 1 too, as a shared sentence would be.
    const shared = readingPieces(lessonReading(items[1].module, 'adult', CTX), 'female')[0].key;
    await h.cache.pin(shared, `${items[0].module.id}|adult`);
    const one = await removeDownloads({ which: ({ lessonId }) => lessonId === items[1].module.id, deps: h.deps });
    expect(one.lessons).toBe(1);
    expect(Object.keys(readRegistry().lessons)).toEqual([items[0].module.id]);
    expect(await h.cache.has(shared)).toBe(true);
    const course = await removeDownloads({ which: ({ course }) => course === 'living-lessons', deps: h.deps });
    expect(course.lessons).toBe(1);
    expect(await h.cache.pinnedBytes()).toBe(0);
    expect(await removeDownloads({ deps: h.deps })).toMatchObject({ lessons: 0 });
  });
});

describe('downloading needs an account (DR-0698)', () => {
  it('a signed-out reader gets the sign-in prompt, never the download', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(createElement(LessonDownloadButton, { module: LEVELED, course: LL, signedIn: false })));
    expect(container.querySelector('[data-testid="download-needs-account"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="lesson-download-open"]')).toBeNull();
    act(() => root.render(createElement(LessonDownloadButton, { module: LEVELED, course: LL, signedIn: true })));
    expect(container.querySelector('[data-testid="lesson-download-open"]')).toBeTruthy();
    act(() => root.unmount());
  });

  it('Learn shows every door with its count; signed out, each asks for an account', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const props = { extraCourses: COURSES, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {}, learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {} };
    act(() => root.render(createElement(ChurchLearn, { ...props, signedIn: true })));
    const all = container.querySelector('[data-testid="download-all-open"]');
    expect(all.textContent).toMatch(/Download every lesson \(\d+\)/);
    expect(container.querySelector('[data-testid="download-course-open"]').textContent).toMatch(/Download this course \(\d+ lessons\)/);
    act(() => root.render(createElement(ChurchLearn, { ...props, signedIn: false })));
    expect(container.querySelector('[data-testid="download-all-open"]')).toBeNull();
    expect(container.querySelector('[data-testid="lesson-download-open"]')).toBeNull();
    expect(container.querySelector('[data-testid="learn-download-all"] [data-testid="download-needs-account"]')).toBeTruthy();
    act(() => root.unmount());
    container.remove();
  });
});
