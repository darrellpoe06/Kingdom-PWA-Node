// @vitest-environment jsdom
// =============================================================================
// WHY the highlight worked in Eternal Algorithms and not in Learn (DR-0285)
// =============================================================================
// Darrell 2026-08-10, from the phone: "The highlighted Words work inside
// Eternal Algorithms not the Learn space... why?" — with, in the same sitting,
// "deeper doesn't get read at all."
//
// The answer, MEASURED here rather than asserted in prose (DR-0076 §4):
//
//   • Eternal Algorithms registers no read target, so the reader maps the PAGE
//     and speaks that map's own text — alignment by construction. Every spoken
//     sentence has a range, so the highlight always paints.
//   • A Learn lesson DOES register a target, and that path spoke the surface's
//     COMPOSED text and then searched the DOM for each spoken sentence. Two
//     independent reasons that search fails: the composed text carries
//     connective sentences that are not on screen ("Anchor scripture — …"), and
//     the lesson renders ONE stage at a time, so most of the lesson is not in
//     the document at all. Low coverage = no highlight — and the stages that
//     were never rendered were never read either.
//
// The first test MEASURES the old coverage against the REAL Learn lesson (it is
// the reproduction, and it fails if anyone reverts the fix); the rest prove the
// new contract: prepare(true) renders the whole piece, the reader maps THAT,
// and every spoken sentence carries a range.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';
import { buildFollowMap, alignSegments } from '../lib/read-follow.js';
import { segmentText } from '../lib/tts.js';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const readSpy = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

let learnBox, learnRoot, panelBox, panelRoot;
beforeEach(() => {
  window.localStorage.clear();
  readSpy.mockClear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  learnBox = document.createElement('main');   // the reader looks for <main>
  document.body.appendChild(learnBox);
  learnRoot = createRoot(learnBox);
  panelBox = document.createElement('div');
  document.body.appendChild(panelBox);
  panelRoot = createRoot(panelBox);
});
afterEach(() => {
  act(() => { learnRoot.unmount(); panelRoot.unmount(); });
  learnBox.remove(); panelBox.remove();
  window.localStorage.clear();
});

const mountLearn = () => act(() => learnRoot.render(createElement(ChurchLearn, {
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
})));
const learnButton = (text) => [...learnBox.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
const openGuide = () => { mountLearn(); act(() => { learnButton('Start this week →').click(); }); return getReadTarget(); };

/** Share of spoken sentences that could be found on screen — the old path. */
const searchCoverage = (el, spokenText) => {
  const follow = buildFollowMap(el);
  const spoken = segmentText(spokenText);
  const ranges = alignSegments(follow, spoken);
  return ranges.filter(Boolean).length / spoken.length;
};

describe('the measurement: why Learn never highlighted', () => {
  it('the paced lesson can find almost NONE of the spoken sentences on screen', () => {
    const t = openGuide();
    const el = document.getElementById(t.elementId);
    expect(el).toBeTruthy();
    const coverage = searchCoverage(el, t.text);
    // This is the defect, in a number: a highlight that can only paint on a
    // sentence it located paints on almost nothing.
    expect(coverage).toBeLessThan(0.5);
  });

  it('and the lesson body itself is not even in the document — "deeper doesn’t get read at all"', () => {
    const t = openGuide();
    const el = document.getElementById(t.elementId);
    const onScreen = buildFollowMap(el).text;
    const spokenOnly = segmentText(t.text).filter((s) => s.length > 40 && !onScreen.includes(s));
    expect(spokenOnly.length).toBeGreaterThan(0); // words spoken that no one can see
  });
});

describe('the fix: the surface renders what it reads', () => {
  it('the registration names its element and carries a prepare switch', () => {
    const t = openGuide();
    expect(t.elementId).toBe('learn-read-wk1-what-is-ai');
    expect(typeof t.prepare).toBe('function');
  });

  it('prepare(true) puts EVERY stage of the lesson on screen', () => {
    const t = openGuide();
    const el = () => document.getElementById(t.elementId);
    const before = buildFollowMap(el()).text;
    act(() => { t.prepare(true); });
    const after = buildFollowMap(el()).text;
    expect(after.length).toBeGreaterThan(before.length * 1.5);
    // The sentences that were spoken-but-invisible are now on screen.
    const stillHidden = segmentText(t.text).filter((s) => s.length > 40 && !after.includes(s));
    expect(stillHidden.length).toBeLessThan(segmentText(t.text).filter((s) => s.length > 40 && !before.includes(s)).length);
  });

  it('with the whole piece rendered, EVERY spoken sentence has a range — by construction', () => {
    const t = openGuide();
    act(() => { t.prepare(true); });
    const follow = buildFollowMap(document.getElementById(t.elementId));
    // The reader speaks follow.text itself, so segment N on screen IS segment N
    // spoken: no search, no misses, nothing to drift.
    expect(follow.segments.length).toBeGreaterThan(5);
    expect(follow.segments.every(Boolean)).toBe(true);
  });

  it('data-read-skip keeps the lesson’s chrome and its tutor chat out of the reading', () => {
    const t = openGuide();
    act(() => { t.prepare(true); });
    const text = buildFollowMap(document.getElementById(t.elementId)).text;
    expect(text).not.toContain('your guide for this week');      // the panel's own header
    expect(text).not.toContain('Reading the whole week');        // the read-along notice
    expect(text).not.toMatch(/\d \/ \d · ~\d+ min/);             // the stage counter
    expect(text).not.toContain('Ask Ari anything');              // the chat, not the lesson
  });

  it('end to end: tapping "Read this week — start to finish" speaks the rendered whole lesson', async () => {
    const t = openGuide();
    act(() => panelRoot.render(createElement(TTSControl, { view: 'church' })));
    act(() => { panelBox.querySelector('button[aria-label="Open read-aloud controls"]').click(); });
    const btn = [...panelBox.querySelectorAll('button')].find((b) => /start to finish/.test(b.textContent));
    expect(btn).toBeTruthy();
    // Two act scopes on purpose: the first lets React flush prepare(true)'s
    // re-render (inside a single act scope the update is queued until the scope
    // exits, which a browser never does), the second gives the reader's
    // settle-then-map loop its frames.
    await act(async () => { btn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 800)); });
    expect(readSpy).toHaveBeenCalled();
    const spoken = readSpy.mock.calls[0][0];
    // It speaks the DOM's text (so it can be highlighted), and that text is now
    // the WHOLE lesson — the deep stages included.
    const rendered = buildFollowMap(document.getElementById(t.elementId)).text;
    expect(spoken).toBe(rendered);
    expect(spoken.length).toBeGreaterThan(400);
  });
});
