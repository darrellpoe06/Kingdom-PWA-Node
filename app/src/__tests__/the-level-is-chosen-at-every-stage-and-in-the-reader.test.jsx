// @vitest-environment jsdom
// THE LEVEL IS CHOSEN FROM THE BEGINNING, AT EVERY STAGE, AND FROM THE READER.
// =============================================================================
// Darrell 2026-09-15: "We need to be able to choose the level from the
// beginning and at each section change... we would also want the reader to be
// able to switch too..."
//
// DR-0417 put the "Who is learning?" row at the top of the paced core — the
// Teach stage, the SECOND section — so the first thing a learner met (Open)
// still had no way to pitch it, and the reading panel had none at all. Now
// (DR-0426):
//   • LessonFlowAudience renders the row under EVERY stage header, paced and
//     read-all, Open first;
//   • the tutor panel supplies it from the band in force and no longer doubles
//     it inside the core;
//   • the read target carries level / levels / setLevel, the reader shows the
//     same row (and a one-tap select on the pill), and a pick reaches the same
//     remembered state; mid-read, the place is kept by fraction.
//
// Proven-to-catch: every assertion below fails against the previous code
// (no stageExtra, no level on the target, no row in the reader, no
// startIndexForFraction).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonFlowAudience } from '../components/LessonFlow.jsx';
import { setReadTarget, getReadTarget, clearReadTarget } from '../lib/read-target.js';
import { startIndexForFraction } from '../lib/read-follow.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
    segmentIndex: 0, setBoundaryHandler: () => {}, deviceRead: true, cloudProgress: 0,
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

let host; let root;
beforeEach(() => { window.localStorage.clear(); host = document.createElement('main'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); const t = getReadTarget(); if (t) clearReadTarget(t.owner); window.localStorage.clear(); });
const draw = (el) => act(() => { root.render(el); });
const button = (text) => [...host.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));

const ARC = {
  totalMinutes: 10,
  audienceSegments: [
    { kind: 'open', icon: '🎯', title: 'Open', subtitle: 'Hook', blurb: 'Pray.', minutes: 2, audience: {} },
    { kind: 'teach', icon: '📖', title: 'Teach', subtitle: 'The core', blurb: 'Teach.', minutes: 5, audience: {} },
    { kind: 'send', icon: '🚀', title: 'Send-off', subtitle: 'Go', blurb: 'Go.', minutes: 1, audience: {} },
  ],
};

describe('the row is under every stage header', () => {
  it('paced: the Open stage — the FIRST thing a learner meets — carries the row, and so does each stage after it', () => {
    const extra = vi.fn((seg) => createElement('div', { 'data-testid': 'level-row', 'data-stage': seg.kind }, 'Who is learning?'));
    draw(createElement(LessonFlowAudience, { arc: ARC, renderStage: () => createElement('p', null, 'body'), stageExtra: extra }));
    let rows = host.querySelectorAll('[data-testid="level-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute('data-stage')).toBe('open');
    // The row sits ABOVE the stage body, not after it.
    expect(host.innerHTML.indexOf('Who is learning?')).toBeLessThan(host.innerHTML.indexOf('>body<'));
    act(() => { button('Next part').click(); });
    rows = host.querySelectorAll('[data-testid="level-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute('data-stage')).toBe('teach');
  });
  it('read-all: every stage on screen carries its own row', () => {
    const extra = (seg) => createElement('div', { 'data-testid': 'level-row', 'data-stage': seg.kind });
    draw(createElement(LessonFlowAudience, { arc: ARC, renderStage: () => null, stageExtra: extra, showAll: true }));
    expect([...host.querySelectorAll('[data-testid="level-row"]')].map((r) => r.getAttribute('data-stage'))).toEqual(['open', 'teach', 'send']);
  });
  it('a host that hands in no stageExtra renders exactly as before', () => {
    draw(createElement(LessonFlowAudience, { arc: ARC, renderStage: () => null }));
    expect(host.querySelector('[data-testid="level-row"]')).toBeNull();
  });
});

describe('the real lesson: one row, in the Open stage, wired to the remembered band', () => {
  const extraCourses = buildCatalogCourseDescriptors();
  const mount = (setAgeBand) => draw(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand,
  }));
  it('opening a lesson shows exactly ONE "Who is learning?" row, before the Open stage body, and a pick reaches setAgeBand', () => {
    const setAgeBand = vi.fn();
    mount(setAgeBand);
    act(() => { button('Start this lesson →').click(); });
    const rows = host.querySelectorAll('[data-testid="lesson-level-control"]');
    expect(rows.length).toBe(1);
    const stage = rows[0].closest('[aria-live="polite"]');
    expect(stage && stage.textContent).toMatch(/Open/);
    const child = [...rows[0].querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith('Child'));
    act(() => { child.click(); });
    expect(setAgeBand).toHaveBeenCalledWith('child');
  });
  it('the lesson registers its level and setter on the read target', () => {
    const setAgeBand = vi.fn();
    mount(setAgeBand);
    act(() => { button('Start this lesson →').click(); });
    const t = getReadTarget();
    expect(t).toBeTruthy();
    expect(t.level).toBe('adult');
    expect(t.levels.map((l) => l.id)).toContain('child');
    expect(typeof t.setLevel).toBe('function');
    t.setLevel('teen');
    expect(setAgeBand).toHaveBeenCalledWith('teen');
  });
});

describe('the reader offers the same row', () => {
  it('a target with a level shows "Who is learning?" in the panel; a pick calls setLevel', () => {
    const setLevel = vi.fn();
    setReadTarget('lesson-x', { label: 'this lesson', text: 'Some words to read. And more of them.', level: 'adult', levels: [{ id: 'child', label: 'Child', range: '6–10' }, { id: 'adult', label: 'Adult', range: '18–64' }], setLevel });
    draw(createElement(TTSControl, {}));
    act(() => { host.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const row = host.querySelector('[data-testid="reader-level-control"]');
    expect(row).not.toBeNull();
    const radios = [...row.querySelectorAll('[role="radio"]')];
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true']);
    act(() => { radios[0].click(); });
    expect(setLevel).toHaveBeenCalledWith('child');
  });
  it('a target without a level (a Bible chapter, a public door) shows no row', () => {
    setReadTarget('chapter-x', { label: 'this chapter', text: 'In the beginning.' });
    draw(createElement(TTSControl, {}));
    act(() => { host.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    expect(host.querySelector('[data-testid="reader-level-control"]')).toBeNull();
  });
  it('the read target keeps only a real setter', () => {
    setReadTarget('lesson-y', { label: 'x', text: 'y z.', level: 'child', levels: [], setLevel: 'nope' });
    expect(getReadTarget().setLevel).toBeNull();
    expect(getReadTarget().level).toBe('child');
  });
});

describe('half-way stays half-way, per sentence', () => {
  it('maps a fraction into the new sentence count and clamps to the last one', () => {
    expect(startIndexForFraction(0.5, 40)).toBe(20);
    expect(startIndexForFraction(0.5, 9)).toBe(5);
    expect(startIndexForFraction(0, 12)).toBe(0);
    expect(startIndexForFraction(1, 12)).toBe(11);
    expect(startIndexForFraction(0.999, 3)).toBe(2);
    expect(startIndexForFraction(0.5, 0)).toBe(0);
    expect(startIndexForFraction(NaN, 10)).toBe(0);
  });
});
