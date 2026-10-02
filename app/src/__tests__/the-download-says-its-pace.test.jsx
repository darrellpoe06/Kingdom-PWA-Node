// @vitest-environment jsdom
// =============================================================================
// THE DOWNLOAD SAYS ITS PACE AND MOVES BY THE PIECE (DR-0746)
// =============================================================================
// Darrell 2026-10-02, L105 with every level and the voice: "Not downloading..."
// over "0 of 1 saved" and an empty bar; three minutes later: "It did it... I
// guess... it didn't show the progress bar.. until it was downloaded."
//
// The reading voice is MADE on the church computer as the download runs, one
// sentence at a time, about as fast as it is spoken. The bar counted lessons,
// so a lesson of hundreds of pieces showed nothing until the last one landed.
// Now the plan is sized in minutes before the start, the run reports every
// piece, the bar moves by the piece, the line says the pace it has measured,
// and a stall or a refusal is said in words.
//
// PROVEN-TO-CATCH: the per-piece case counts progress reports between the
// first and the last; against the old run there are none. The pace case fails
// if paceSeconds stops reading the plan's characters.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { DownloadPanel, progressText, progressFraction, stallWords, STALL_AFTER_MS } from '../components/LessonDownloads.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { createClipCache, memoryBackend, _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import {
  planDownload, runDownload, courseContext, lessonVersions, memoryWords, _setDeviceWordsForTests,
  paceSeconds, paceWords, SYNTH_CHARS_PER_SECOND, DOWNLOAD_STREAMS,
} from '../lib/lesson-downloads.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COURSES = buildCatalogCourseDescriptors();
const LL = COURSES.find((c) => c.meta.key === 'living-lessons');
const CTX = courseContext(LL);
const LEVELED = LL.schedule.find((m) => lessonVersions(m).length >= 4);

function harness() {
  const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e12 });
  const words = memoryWords();
  const fetched = [];
  const fetchPiece = async (spoken) => { fetched.push(spoken); return { blob: { size: 1000 } }; };
  _setDeviceClipCacheForTests(cache);
  _setDeviceWordsForTests(words);
  return { cache, words, fetched, deps: { cache, words, fetchPiece, offline: () => false } };
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { window.localStorage.clear(); });

describe('the pace, from the measured speed of the church computer', () => {
  it('paceSeconds reads the plan\'s characters over the streams', () => {
    expect(paceSeconds(0)).toBe(0);
    expect(paceSeconds(SYNTH_CHARS_PER_SECOND * DOWNLOAD_STREAMS * 60)).toBeCloseTo(60, 6);
    expect(paceSeconds(861, { streams: 1 })).toBeCloseTo(861 / SYNTH_CHARS_PER_SECOND, 6);
  });
  it('paceWords says seconds, minutes, hours, days', () => {
    expect(paceWords(0)).toBe('');
    expect(paceWords(42)).toBe('about 40 seconds');
    expect(paceWords(32 * 60)).toBe('about 32 minutes');
    expect(paceWords(3.4 * 3600)).toBe('about 3.5 hours');
    expect(paceWords(14 * 3600)).toBe('about 14 hours');
    expect(paceWords(3 * 86400)).toBe('about 3 days');
  });
  it('a plan with the voice carries its characters and its pace; words only carries none', async () => {
    const items = [{ module: LEVELED, ctx: CTX }];
    const all = await planDownload(items, { choice: 'all', storage: window.localStorage });
    expect(all.voiceChars).toBeGreaterThan(1000);
    expect(all.paceSeconds).toBeCloseTo(paceSeconds(all.voiceChars), 6);
    const adult = await planDownload(items, { choice: 'adult', storage: window.localStorage });
    expect(adult.voiceChars).toBeLessThan(all.voiceChars);
    const wordsOnly = await planDownload(items, { choice: 'all', storage: window.localStorage, withVoice: false });
    expect(wordsOnly.voiceChars).toBe(0);
    expect(wordsOnly.paceSeconds).toBe(0);
  });
});

describe('the run reports every piece', () => {
  it('PROVEN-TO-CATCH: progress arrives between the first and the last report, counting pieces, bytes and the pace', async () => {
    const h = harness();
    let t = 1_000_000;
    const plan = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'adult', storage: window.localStorage });
    const seen = [];
    const fetchPiece = async (spoken) => { h.fetched.push(spoken); t += 2000; return { blob: { size: 1000 } }; };
    const res = await runDownload({ plan, deps: { ...h.deps, fetchPiece, now: () => t }, onProgress: (p) => seen.push(p) });
    expect(res.saved).toBe(1);
    expect(plan.pieces).toBeGreaterThan(2);
    const middle = seen.filter((p) => p.pieces && p.pieces.done > 0 && p.pieces.done < p.pieces.total);
    expect(middle.length).toBeGreaterThan(0);
    const last = seen.at(-1);
    expect(last.pieces).toMatchObject({ done: plan.pieces, total: plan.pieces, fetched: plan.pieces, held: 0 });
    expect(last.bytes).toBe(plan.pieces * 1000);
    expect(last.charsDone).toBe(plan.voiceChars);
    expect(last.charsPerSecond).toBeGreaterThan(0);
    expect(last.lastError).toBeNull();
    // Pieces already on the device count as held, never fetched again.
    const again = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'all', storage: window.localStorage });
    const seen2 = [];
    await runDownload({ plan: again, deps: { ...h.deps, fetchPiece, now: () => t }, onProgress: (p) => seen2.push(p) });
    // The children's versions share sentences with the adult one already on
    // the device: those are held, not fetched again; held + fetched is the plan.
    const last2 = seen2.at(-1);
    expect(last2.pieces.held).toBeGreaterThan(0);
    expect(last2.pieces.fetched + last2.pieces.held).toBe(again.pieces);
    expect(last2.pieces.done).toBe(again.pieces);
    // Each new piece is fetched exactly once, even where one level says the
    // same sentence twice (two workers used to fetch it side by side).
    expect(h.fetched.length).toBe(plan.pieces + last2.pieces.fetched);
    expect(new Set(h.fetched).size).toBe(h.fetched.length);
  });
  it('a refused piece is said as the last error', async () => {
    const h = harness();
    const plan = await planDownload([{ module: LEVELED, ctx: CTX }], { choice: 'adult', storage: window.localStorage });
    const seen = [];
    await runDownload({ plan, deps: { ...h.deps, fetchPiece: async () => ({ error: 'voice-lite-503' }) }, onProgress: (p) => seen.push(p) });
    expect(seen.some((p) => p.lastError === 'voice-lite-503')).toBe(true);
  });
});

describe('the words on the screen', () => {
  const run = (over = {}) => ({
    total: 1, saved: 0, skipped: 0, failed: [], bytes: 14 * 1024 * 1024, voiceStopped: null, current: 'L105',
    pieces: { done: 37, total: 312, fetched: 37, held: 0 }, charsDone: 3200, charsPerSecond: 20,
    startedAt: 1_000_000, lastPieceAt: 1_000_000 + 160_000, lastError: null, ...over,
  });
  it('progressText: lessons, pieces, bytes and the time left at the measured pace', () => {
    const t = progressText(run(), { running: true, now: 1_000_000 + 160_000 });
    expect(t).toMatch(/^0 of 1 lesson saved · 37 of 312 voice pieces · 14 MB · about \d+ minutes more at this pace$/);
    expect(progressText(run(), { running: true, paused: true, now: 1_000_000 + 160_000 })).toMatch(/· paused$/);
    expect(progressText(run({ pieces: { done: 0, total: 0, fetched: 0, held: 0 }, bytes: 0 }))).toBe('0 of 1 lesson saved');
    expect(progressText(run({ total: 3, saved: 2, failed: [{ lessonId: 'x' }] }), { running: false })).toMatch(/^2 of 3 lessons saved · 37 of 312 voice pieces · 14 MB · 1 not saved$/);
  });
  it('progressFraction: by the piece when there are pieces, by the lesson otherwise', () => {
    expect(progressFraction(run())).toEqual({ now: 37, max: 312, fraction: 37 / 312 });
    expect(progressFraction(run({ pieces: { done: 0, total: 0 }, total: 4, saved: 1, skipped: 1 }))).toEqual({ now: 2, max: 4, fraction: 0.5 });
  });
  it('stallWords: quiet while pieces flow, a reason when one was refused, a plain wait after a long silence', () => {
    expect(stallWords(run(), 1_000_000 + 170_000)).toBe('');
    expect(stallWords(run(), 1_000_000 + 160_000 + STALL_AFTER_MS + 1)).toMatch(/No piece has arrived for \d+ seconds\. The church computer is making it/);
    expect(stallWords(run({ lastError: 'voice-lite-503' }), 1_000_000)).toMatch(/The reading voice was busy\. Trying the next\./);
    expect(stallWords(run({ finished: true }), 9e9)).toBe('');
  });
});

describe('the panel says the pace before the start', () => {
  let host; let root;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });

  it('with the voice: a pace line in minutes; words only: none', async () => {
    const h = harness();
    const items = [{ module: LEVELED, ctx: CTX }];
    await act(async () => { root.render(createElement(DownloadPanel, { items, scope: `lesson:${LEVELED.id}`, what: 'this lesson', removeWhich: () => true, deps: { ...h.deps, space: async () => ({ free: 1e12, quota: 1e12, usage: 0 }) } })); });
    for (let i = 0; i < 20 && !host.querySelector('[data-testid="download-pace"]'); i++) await settle();
    const pace = host.querySelector('[data-testid="download-pace"]');
    expect(pace).toBeTruthy();
    expect(pace.textContent).toMatch(/made on the church computer as this runs, about as fast as it is spoken: about \d+ (seconds|minutes) for this choice\./);
    act(() => { host.querySelector('[data-testid="download-with-voice"]').click(); });
    await settle();
    expect(host.querySelector('[data-testid="download-pace"]')).toBeNull();
  });
});
