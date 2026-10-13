// @vitest-environment jsdom
// =============================================================================
// The wait explains itself WHILE you are waiting (DR-0969)
// =============================================================================
// Darrell, 2026-10-11: "Why is downloading lesson so long with only mb of
// data?!!!!!!!!!!"
//
// DR-0746 already wrote the sentence that answers him — "the reading voice is
// made on the church computer as this runs, about as fast as it is spoken" —
// and then guarded it with `!running`. So the one explanation of why this is
// slow was on screen only BEFORE the start, and disappeared at the exact
// moment somebody sits watching a crawling bar. That is when the question gets
// asked, so that is when the answer has to be on screen.
//
// This is the render-level twin of the pure cases in
// the-progress-line-says-what-is-being-spent.test.js (DR-0347: a rung-1 test
// cannot see a surface that never mounts the text).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { DownloadPanel } from '../components/LessonDownloads.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { createClipCache, memoryBackend, _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import {
  courseContext, lessonVersions, memoryWords, _setDeviceWordsForTests, DOWNLOAD_STREAMS,
} from '../lib/lesson-downloads.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COURSES = buildCatalogCourseDescriptors();
const LL = COURSES.find((c) => c.meta.key === 'living-lessons');
const CTX = courseContext(LL);
const LEVELED = LL.schedule.find((m) => lessonVersions(m).length >= 4);

// A fetch that never resolves until released, so the run stays RUNNING while
// the assertions look at it. A piece that resolves instantly would race the
// render and make this test flaky about the very state it exists to inspect.
function harness() {
  const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e12 });
  const words = memoryWords();
  let release;
  const held = new Promise((r) => { release = r; });
  let served = 0;
  const fetchPiece = async () => {
    served += 1;
    if (served > 2) await held;          // first couple land, then it hangs
    return { blob: { size: 18_000 } };   // ~18 kB a piece, like an Opus clip
  };
  _setDeviceClipCacheForTests(cache);
  _setDeviceWordsForTests(words);
  return { release: () => release(), deps: { cache, words, fetchPiece, offline: () => false, space: async () => ({ free: 1e12, quota: 1e12, usage: 0 }) } };
}

describe('while the download runs', () => {
  let host; let root; let h;
  beforeEach(() => {
    window.localStorage.clear();
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  });
  // THE PREVIOUS RUN MUST FINISH BEFORE THE NEXT TEST PRESSES DOWNLOAD.
  //
  // This teardown used to be `h?.release(); unmount()`, synchronously — which
  // released the hung fetch and then tore the tree down WITHOUT ever letting
  // the run drain. `runDownload` keeps module-level state while it is in
  // flight (the saved job, the intake hold), so a run abandoned mid-flight
  // left that state set and the NEXT test's Download press did nothing: no
  // progress box, no panel, a null read.
  //
  // The symptom named the cause. Four cases failed in PERFECT ALTERNATION —
  // 1 pass, 2 fail, 3 pass, 4 fail — because each abandoned run poisoned
  // exactly the test after it, and that test's own teardown then cleared it.
  // A flaky-looking failure that alternates is not flakiness; it is leakage
  // with a period of one.
  afterEach(async () => {
    h?.release();
    for (let i = 0; i < 20; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    await act(async () => { root.unmount(); });
    host.remove();
    window.localStorage.clear();
  });
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  const at = (id) => host.querySelector(`[data-testid="${id}"]`);

  // WAIT FOR THE THING, THEN SAY SO IF IT NEVER CAME.
  //
  // The first version of this file polled a fixed number of times and then
  // read `.textContent` off whatever was there — so two of its four cases
  // died on "Cannot read properties of null" while the other two passed on
  // the same code path. A test that fails on a race rather than on the
  // behaviour is worse than no test: it would have been "fixed" by deleting
  // an assertion. Each wait now has a generous budget and reports what was
  // missing.
  const waitFor = async (id, budget = 120) => {
    for (let i = 0; i < budget && !at(id); i += 1) await settle();
    const el = at(id);
    expect(el, `[data-testid="${id}"] never appeared within ${budget} settles`).toBeTruthy();
    return el;
  };

  const startRunning = async () => {
    h = harness();
    await act(async () => {
      root.render(createElement(DownloadPanel, {
        items: [{ module: LEVELED, ctx: CTX }], scope: `lesson:${LEVELED.id}`,
        what: 'this lesson', removeWhich: () => true, deps: h.deps,
      }));
    });
    await waitFor('download-start');
    act(() => { at('download-start').click(); });
    await waitFor('download-progress-box');
  };

  it('PROVEN-TO-CATCH: the reason the wait is long is on screen DURING the wait', async () => {
    await startRunning();
    const why = await waitFor('download-why-slow');
    expect(why, 'nothing explains the wait while the wait is happening').toBeTruthy();
    expect(why.textContent).toMatch(/Not a download/i);
    expect(why.textContent).toMatch(/speaks out loud/i);
    expect(why.textContent).toMatch(new RegExp(`${DOWNLOAD_STREAMS} at a time`));
  });

  it('it names the real cost and never blames the megabytes', async () => {
    await startRunning();
    const why = (await waitFor('download-why-slow')).textContent;
    expect(why).toMatch(/megabytes are small because speech is small/i);
    expect(why).toMatch(/the time is the making/i);
  });

  it('the before-the-start pace line is gone, so the two never contradict', async () => {
    await startRunning();
    // DR-0947's rule: a screen must not say two things about one subject.
    await waitFor('download-why-slow');
    expect(at('download-pace'), 'both the pre-start pace and the running reason were shown').toBeFalsy();
  });

  it('the bytes on the progress line say they were MADE', async () => {
    await startRunning();
    await waitFor('download-progress-text');
    for (let i = 0; i < 120 && !/made/.test(at('download-progress-text')?.textContent || ''); i++) await settle();
    expect(at('download-progress-text').textContent).toMatch(/\bmade\b/);
  });
});
