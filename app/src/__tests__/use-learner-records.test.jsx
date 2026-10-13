// @vitest-environment jsdom
// =============================================================================
// useLearnerRecords — the class record's wiring, outside the frozen shell
// (DR-0754 / DR-0078)
// =============================================================================
// The shell is bug-fixes only (monolith-budget-guard), so this capability lives
// in lib/use-learner-records.js and the shell makes one call. These tests pin
// the behavior that moved out, against a real render.
//
// PROVEN-TO-CATCH: the attempt-count assertions fail against the shipped
// behavior before this (recordClassQuiz overwrote the module's record, so a
// second try erased the first and nothing counted attempts), and the demo
// assertion fails against any wiring that writes a row in demo mode.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const saved = [];
const subscribers = [];

vi.mock('../lib/learner-records-sync.js', () => ({
  saveLearnerRecord: (rec) => { saved.push(rec); return Promise.resolve({ saved: true }); },
  subscribeLearnerRecords: (onRecords) => {
    subscribers.push(onRecords);
    return () => { subscribers.length = 0; };
  },
}));

const { useLearnerRecords } = await import('../lib/use-learner-records.js');

const SESSION = { user: { id: 'u1', email: 'son@test.local' } };

let host = null;
let root = null;
let api = null;
let store = null;

function mount({ authSession = SESSION, demo = false, ageBand = 'teen', data = {} } = {}) {
  store = { classProgress: {}, classQuiz: {}, ...data };
  const setData = (fn) => { store = typeof fn === 'function' ? fn(store) : fn; };
  function Probe() {
    api = useLearnerRecords({ authSession, demo, ageBand, setData });
    return createElement('div', null, String(api.learnerRecords.length));
  }
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(createElement(Probe)); });
}

beforeEach(() => { saved.length = 0; subscribers.length = 0; });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null; host = null; api = null; store = null;
});

describe('marking a lesson read', () => {
  it('keeps the device map AND files a record carrying the course', () => {
    mount();
    act(() => { api.toggleClassModule('L1', 'living-lessons'); });
    expect(store.classProgress.L1).toBeTruthy();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      lessonId: 'L1', courseKey: 'living-lessons', ageBand: 'teen', learnerLabel: 'son@test.local',
    });
    expect(saved[0].completedAt).toBe(store.classProgress.L1);
  });

  it('un-marking a lesson files the record with no completion, so the record follows the learner', () => {
    mount({ data: { classProgress: { L1: '2026-10-01T00:00:00.000Z' } } });
    act(() => { api.toggleClassModule('L1', 'living-lessons'); });
    expect(store.classProgress.L1).toBeUndefined();
    expect(saved[0].completedAt).toBeNull();
  });
});

describe('answering an exam', () => {
  it('counts the attempt from the real record — proven to catch', () => {
    mount();
    act(() => { api.recordClassQuiz('L1', { pct: 60, passed: false, at: 'a' }, 'living-lessons'); });
    expect(store.classQuiz.L1.attempts).toBe(1);
    act(() => { api.recordClassQuiz('L1', { pct: 90, passed: true, at: 'b' }, 'living-lessons'); });
    // Before this, the second result simply replaced the first and no count
    // existed at all; attempts would be undefined here.
    expect(store.classQuiz.L1.attempts).toBe(2);
    expect(store.classQuiz.L1.pct).toBe(90);
    expect(saved[1].quiz).toMatchObject({ pct: 90, passed: true, attempts: 2 });
  });

  it('carries the course and a real moment even when the result names none', () => {
    mount();
    act(() => { api.recordClassQuiz('L2', { pct: 100, passed: true }, 'sovereign-ai'); });
    expect(saved[0].courseKey).toBe('sovereign-ai');
    expect(Number.isNaN(Date.parse(saved[0].quiz.at))).toBe(false);
  });
});

describe('what must never write', () => {
  it('demo mode files NOTHING, on either path — proven to catch', () => {
    mount({ demo: true });
    act(() => { api.toggleClassModule('L1', 'c'); });
    act(() => { api.recordClassQuiz('L1', { pct: 90, passed: true }, 'c'); });
    expect(saved).toEqual([]);
    expect(store.classProgress.L1).toBeTruthy(); // the device still reads normally
  });

  it('signed out files nothing, and holds no records', () => {
    mount({ authSession: null });
    act(() => { api.toggleClassModule('L1', 'c'); });
    expect(saved).toEqual([]);
    expect(api.learnerRecords).toEqual([]);
    expect(subscribers).toHaveLength(0); // nothing subscribes for a signed-out reader
  });
});

describe('the record comes back on this device', () => {
  it('hands the panel the rows and fills in what this device never saw', () => {
    mount();
    expect(subscribers).toHaveLength(1);
    act(() => {
      subscribers[0]([
        { userId: 'u1', lessonId: 'L9', courseKey: 'c', completedAt: '2026-09-01T00:00:00.000Z', quizPct: 70, quizPassed: true, quizAt: '2026-09-01T00:05:00.000Z' },
      ]);
    });
    expect(api.learnerRecords).toHaveLength(1);
    expect(store.classProgress.L9).toBe('2026-09-01T00:00:00.000Z');
    expect(store.classQuiz.L9).toMatchObject({ passed: true, pct: 70 });
  });

  it('the device copy WINS on a module it already knows', () => {
    mount({ data: { classProgress: { L9: '2026-10-05T00:00:00.000Z' }, classQuiz: {} } });
    act(() => {
      subscribers[0]([
        { userId: 'u1', lessonId: 'L9', courseKey: 'c', completedAt: '2026-09-01T00:00:00.000Z' },
      ]);
    });
    expect(store.classProgress.L9).toBe('2026-10-05T00:00:00.000Z');
  });

  it('unmounting hands the subscription back', () => {
    mount();
    expect(subscribers).toHaveLength(1);
    act(() => root.unmount());
    root = null;
    expect(subscribers).toHaveLength(0);
  });
});
