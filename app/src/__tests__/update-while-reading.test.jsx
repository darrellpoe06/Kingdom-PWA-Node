// @vitest-environment jsdom
// =============================================================================
// THE APP SAYS A NEWER VERSION IS READY WHILE A READING PLAYS (DR-1503)
// =============================================================================
// Found 2026-11-13 (PR #2688): a long-open tab kept running the OLD bundle because
// lib/sw-update.js holds the update reload while a reading plays — and told
// nobody. Now one quiet line says so, once per build, and a tap stops the
// reading cleanly and loads the new version. Nothing else changes.
//
// PROVEN-TO-CATCH: against the code before this change, the "line shows once
// and its tap reloads" cases fail (no offer is ever made, so updateReady()
// stays false, UPDATE_READY_EVENT is never dispatched and the tap target never
// renders), and the live-build case fails (its timer reloaded mid-reading:
// reloads was 1 while the reading still played).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { holdIntake, resetIntakeForTests, QUIET_MS } from '../lib/intake-guard.js';
import { wireUpdates, watchLiveBuild } from '../lib/sw-update.js';
import {
  updateReady,
  loadUpdateNow,
  useReadingHold,
  offerUpdateWhileReading,
  resetUpdateWhileReadingForTests,
  UPDATE_READY_EVENT,
  UPDATE_READY_WORDS,
} from '../lib/update-while-reading.js';
import { UpdatePrompt } from '../components/PwaPrompts.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function fakeTimers() {
  let now = 0;
  let id = 0;
  const due = new Map();
  return {
    setTimeout: (cb, ms) => {
      id += 1;
      due.set(id, { at: now + ms, cb });
      return id;
    },
    clearTimeout: (t) => {
      due.delete(t);
    },
    tick(ms) {
      now += ms;
      for (const [k, t] of Array.from(due.entries()))
        if (t.at <= now) {
          due.delete(k);
          t.cb();
        }
    },
  };
}
function makeWorker(state = 'installed') {
  return {
    state,
    posted: [],
    postMessage(m) {
      this.posted.push(m);
    },
    addEventListener() {},
  };
}
function makeRegistration({ waiting = null } = {}) {
  return { waiting, installing: null, update() {}, addEventListener() {} };
}
function makeNavigator() {
  const listeners = {};
  return {
    serviceWorker: {
      controller: makeWorker('activated'),
      addEventListener(t, cb) {
        (listeners[t] ||= []).push(cb);
      },
      fire(t) {
        (listeners[t] || []).forEach((cb) => cb());
      },
    },
  };
}
function makeWindow(t) {
  const map = new Map();
  const w = {
    reloads: 0,
    dispatched: [],
    sessionStorage: { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) },
    location: {
      reload() {
        w.reloads += 1;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent(e) {
      w.dispatched.push(e);
      return true;
    },
    setTimeout: t.setTimeout,
    clearTimeout: t.clearTimeout,
  };
  return w;
}
const readyEvents = (w) => w.dispatched.filter((e) => e.type === UPDATE_READY_EVENT && e.detail.ready);

// A reader as the app mounts one: holds 'reading' while on, hands over its stop.
let stops = 0;
let setOn = null;
function Reader() {
  const [on, set] = React.useState(true);
  setOn = set;
  useReadingHold(on, () => {
    stops += 1;
    set(false);
  });
  return null;
}

let container;
let root;
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(el);
  });
}

beforeEach(() => {
  resetIntakeForTests();
  resetUpdateWhileReadingForTests();
  stops = 0;
  setOn = null;
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  resetIntakeForTests();
  resetUpdateWhileReadingForTests();
});

describe('an update waiting on a reading says so, once, and a tap loads it', () => {
  it('PROVEN-TO-CATCH: reading + new build -> no reload, the line shows once, its tap stops the reading and reloads once', async () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator();
    await mount(createElement('div', null, createElement(Reader), createElement(UpdatePrompt)));
    wireUpdates(makeRegistration({ waiting: makeWorker() }), nav, w);
    await act(async () => {
      nav.serviceWorker.fire('controllerchange');
    });
    expect(w.reloads).toBe(0); // never mid-sentence
    expect(updateReady()).toBe(true);
    expect(readyEvents(w).length).toBe(1);
    const line = container.querySelector('[data-testid="update-ready-line"]');
    expect(line).not.toBe(null);
    expect(line.textContent).toBe(UPDATE_READY_WORDS);
    expect(line.className).toMatch(/min-h-\[44px\]/); // a real tap target
    // a second swap signal for the same build never says it twice
    await act(async () => {
      nav.serviceWorker.fire('controllerchange');
    });
    expect(readyEvents(w).length).toBe(1);
    await act(async () => {
      line.click();
    });
    expect(stops).toBe(1); // the reading stopped first
    expect(w.reloads).toBe(1);
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBe('1');
    expect(updateReady()).toBe(false);
    t.tick(QUIET_MS * 10);
    expect(w.reloads).toBe(1); // the deferred reload was dropped: once only
  });

  it('when the reading ends, the update loads as before and the line goes', async () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator();
    await mount(createElement(Reader));
    wireUpdates(makeRegistration({ waiting: makeWorker() }), nav, w);
    nav.serviceWorker.fire('controllerchange');
    expect(updateReady()).toBe(true);
    t.tick(30 * 60 * 1000);
    expect(w.reloads).toBe(0); // a half-hour reading, untouched
    await act(async () => {
      setOn(false);
    }); // the reading ends
    t.tick(QUIET_MS);
    expect(w.reloads).toBe(1);
    expect(updateReady()).toBe(false);
    expect(stops).toBe(0);
  });

  it('no update waiting -> no line, even while a reading plays', async () => {
    await mount(createElement('div', null, createElement(Reader), createElement(UpdatePrompt)));
    expect(updateReady()).toBe(false);
    expect(container.querySelector('[data-testid="update-ready-line"]')).toBe(null);
    expect(loadUpdateNow()).toBe(false);
  });

  it('update waiting, nothing reading -> reloads at once as before, no line', () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator();
    wireUpdates(makeRegistration({ waiting: makeWorker() }), nav, w);
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
    expect(updateReady()).toBe(false);
    expect(readyEvents(w).length).toBe(0);
  });

  it('update waiting on another hold (typing) -> waits as before, no line; a reading begun in the wait offers it', () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator();
    const typing = holdIntake('typing');
    wireUpdates(makeRegistration({ waiting: makeWorker() }), nav, w);
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(0);
    expect(updateReady()).toBe(false);
    const reading = holdIntake('reading', w);
    expect(updateReady()).toBe(true);
    expect(readyEvents(w).length).toBe(1);
    reading();
    typing();
    t.tick(QUIET_MS);
    expect(w.reloads).toBe(1);
    expect(updateReady()).toBe(false);
  });

  it('one line per build: the same build offered again stays quiet', () => {
    const release = holdIntake('reading');
    const a = offerUpdateWhileReading({ key: 'abc', reload() {} });
    expect(a.offered()).toBe(true);
    a.stop();
    expect(updateReady()).toBe(false);
    const b = offerUpdateWhileReading({ key: 'abc', reload() {} });
    expect(b.offered()).toBe(false);
    expect(updateReady()).toBe(false);
    release();
  });
});

describe('the live-build reload never lands mid-reading', () => {
  async function flush() {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  }
  const behind = async () => ({ ok: true, json: async () => ({ sha: 'newsha' }) });

  it('PROVEN-TO-CATCH: server ahead + reading -> the timer offers the line instead of reloading; reading ends -> one reload', async () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const release = holdIntake('reading', w);
    watchLiveBuild(makeRegistration(), w, {
      buildSha: 'oldsha',
      fetchImpl: behind,
      setTimeout: t.setTimeout,
      setInterval: () => 0,
      everyMs: 0,
      reloadAfterMs: 10,
    });
    await flush();
    t.tick(10);
    expect(w.reloads).toBe(0);
    expect(updateReady()).toBe(true);
    release();
    t.tick(QUIET_MS);
    expect(w.reloads).toBe(1);
    expect(updateReady()).toBe(false);
  });

  it('server ahead, nothing reading -> reloads at the timer exactly as before', async () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    watchLiveBuild(makeRegistration(), w, {
      buildSha: 'oldsha',
      fetchImpl: behind,
      setTimeout: t.setTimeout,
      setInterval: () => 0,
      everyMs: 0,
      reloadAfterMs: 10,
    });
    await flush();
    t.tick(10);
    expect(w.reloads).toBe(1);
    expect(updateReady()).toBe(false);
  });
});

describe('the seams stay where they are', () => {
  it('the reader hands its stop to the hold, and use-read-aloud stays within its line budget', () => {
    const src = readFileSync(join(SRC, 'lib', 'use-read-aloud.js'), 'utf8');
    expect(src).toMatch(/useReadingHold\(!!\(tts\.isReading \|\| cloudPlaying\), stop\)/);
    expect(src.replace(/\n$/, '').split('\n').length).toBeLessThanOrEqual(1500);
  });
});
