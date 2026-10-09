// @vitest-environment jsdom
// =============================================================================
// NOTHING INTERRUPTS WORDS COMING IN (DR-0748)
// =============================================================================
// Darrell 2026-10-02, after a multi-minute spoken message was lost to an app
// that put something on the screen while he was still speaking: "let's build
// a safety into the PoeTech App.... so it can't interfere with the message
// intake from a voice message nor a texts as they are occurring... possible?"
//
// MEASURED on main 8b471cf4 before a line was written: the zero-click update
// reload (lib/sw-update.js controllerchange) reloaded the page the moment the
// new worker took control, whatever the person was doing; the stale-chunk
// heal reloaded on the spot; the install nudge and the "Updated" toast showed
// whenever their events fired; the arrivals list opened itself on launch.
// A recording (workflow-scribe) keeps its take in memory until it is sent, so
// any of those reloads lost it whole.
//
// PROVEN-TO-CATCH: the sw-update case fails against the old handler (which
// reloaded at once: reloads would be 1 while held); the heal case likewise;
// the toast, nudge and bell cases fail if the hold is not consulted; the
// typing watcher case fails if the hold is not taken from the field.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  holdIntake, intakeHeld, intakeKinds, intakeWords, subscribeIntake, whenIntakeFree,
  isTypingTarget, watchTypedIntake, resetIntakeForTests, INTAKE_EVENT, QUIET_MS, RESULT_HOLD_MS, TYPING_IDLE_MS,
} from '../lib/intake-guard.js';
import { wireUpdates } from '../lib/sw-update.js';
import { wireChunkHeal } from '../lib/chunk-reload-heal.js';
import { UpdatePrompt, InstallPrompt } from '../components/PwaPrompts.jsx';
import ArrivalsBell, { LAUNCH_OPENED_KEY } from '../components/ArrivalsBell.jsx';
import { ARRIVALS_EVENT } from '../lib/arrivals.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(SRC, ...p), 'utf8');
const codeOnly = (src) => String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

/** A controllable clock: schedule records, tick(ms) fires what is due. */
function fakeTimers() {
  let now = 0; let id = 0;
  const due = new Map();
  return {
    setTimeout: (cb, ms) => { id += 1; due.set(id, { at: now + ms, cb }); return id; },
    clearTimeout: (t) => { due.delete(t); },
    tick(ms) {
      now += ms;
      for (const [k, t] of Array.from(due.entries())) if (t.at <= now) { due.delete(k); t.cb(); }
    },
    pending() { return due.size; },
  };
}

beforeEach(() => resetIntakeForTests());
afterEach(() => resetIntakeForTests());

// ── 1. THE HOLD ──────────────────────────────────────────────────────────────
describe('the hold: taken, said, released, heard', () => {
  it('starts free; a hold is held until released; releasing twice is harmless', () => {
    expect(intakeHeld()).toBe(false);
    const release = holdIntake('recording');
    expect(intakeHeld()).toBe(true);
    expect(intakeKinds()).toEqual(['recording']);
    expect(release()).toBe(true);
    expect(release()).toBe(false);
    expect(intakeHeld()).toBe(false);
  });
  it('two holds of one kind are one kind; the words name each kind once', () => {
    const a = holdIntake('typing'); const b = holdIntake('typing'); const c = holdIntake('dictation');
    expect(intakeKinds()).toEqual(['typing', 'dictation']);
    expect(intakeWords()).toBe('you are typing and you are speaking');
    a(); expect(intakeHeld()).toBe(true);
    b(); c(); expect(intakeHeld()).toBe(false);
    expect(intakeWords()).toBe('');
    expect(intakeWords(['recording', 'reading', 'download'])).toBe('you are recording, a reading is playing and a download is running');
  });
  it('a listener hears every change, and the window gets the event', () => {
    const seen = [];
    const off = subscribeIntake((s) => seen.push(s));
    const evts = [];
    const onEvt = (e) => evts.push(e.detail);
    window.addEventListener(INTAKE_EVENT, onEvt);
    const r = holdIntake('reading', window);
    r();
    off();
    holdIntake('typing', window)();
    window.removeEventListener(INTAKE_EVENT, onEvt);
    expect(seen).toEqual([{ held: true, kinds: ['reading'] }, { held: false, kinds: [] }]);
    expect(evts.length).toBe(4);
    expect(evts[0]).toEqual({ held: true, kinds: ['reading'] });
  });
});

// ── 2. WAITING UNTIL FREE ───────────────────────────────────────────────────
describe('whenIntakeFree: now when free, after the quiet time when not', () => {
  it('runs at once when nothing is coming in', () => {
    let ran = null;
    const { deferred } = whenIntakeFree((o) => { ran = o; });
    expect(deferred).toBe(false);
    expect(ran).toEqual({ waited: false });
  });
  it('PROVEN-TO-CATCH: waits through a hold, then the quiet time, then runs once', () => {
    const t = fakeTimers();
    const release = holdIntake('recording');
    let ran = 0;
    const { deferred } = whenIntakeFree(() => { ran += 1; }, { setTimeout: t.setTimeout, clearTimeout: t.clearTimeout });
    expect(deferred).toBe(true);
    t.tick(60_000);
    expect(ran).toBe(0);               // still recording: nothing runs however long it takes
    release();
    expect(ran).toBe(0);               // released: not yet — the quiet time first
    t.tick(QUIET_MS - 1);
    expect(ran).toBe(0);
    t.tick(1);
    expect(ran).toBe(1);
    release(); holdIntake('typing')();
    t.tick(QUIET_MS);
    expect(ran).toBe(1);               // once, and only once
  });
  it('a hold taken again inside the quiet time starts the wait over', () => {
    const t = fakeTimers();
    const r1 = holdIntake('dictation');
    let ran = 0;
    whenIntakeFree(() => { ran += 1; }, { setTimeout: t.setTimeout, clearTimeout: t.clearTimeout });
    r1();
    t.tick(QUIET_MS - 500);
    const r2 = holdIntake('typing');   // Stop, then straight into the box
    t.tick(5000);
    expect(ran).toBe(0);
    r2();
    t.tick(QUIET_MS);
    expect(ran).toBe(1);
  });
  it('cancel stops a deferred run', () => {
    const t = fakeTimers();
    const r = holdIntake('download');
    let ran = 0;
    const { cancel } = whenIntakeFree(() => { ran += 1; }, { setTimeout: t.setTimeout, clearTimeout: t.clearTimeout });
    cancel();
    r();
    t.tick(QUIET_MS * 2);
    expect(ran).toBe(0);
  });
});

// ── 3. THE UPDATE RELOAD WAITS ──────────────────────────────────────────────
function makeWorker(state = 'installed') {
  const listeners = {};
  return { state, posted: [], postMessage(m) { this.posted.push(m); }, addEventListener(t, cb) { (listeners[t] ||= []).push(cb); }, fire(t) { (listeners[t] || []).forEach((cb) => cb()); } };
}
function makeRegistration({ waiting = null } = {}) {
  const listeners = {};
  return { waiting, installing: null, update() {}, addEventListener(t, cb) { (listeners[t] ||= []).push(cb); }, fire(t) { (listeners[t] || []).forEach((cb) => cb()); } };
}
function makeNavigator({ controller = null } = {}) {
  const listeners = {};
  return { serviceWorker: { controller, addEventListener(t, cb) { (listeners[t] ||= []).push(cb); }, fire(t) { (listeners[t] || []).forEach((cb) => cb()); } } };
}
function makeWindow(t) {
  const map = new Map();
  const w = {
    reloads: 0, dispatched: [],
    sessionStorage: { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) },
    location: { reload() { w.reloads += 1; } },
    addEventListener() {}, removeEventListener() {},
    dispatchEvent(e) { w.dispatched.push(e); return true; },
    setTimeout: t.setTimeout, clearTimeout: t.clearTimeout,
  };
  return w;
}

describe('the zero-click update reload waits for the words', () => {
  it('PROVEN-TO-CATCH: a controller swap while recording does not reload; it reloads after the take and the quiet time', () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const reg = makeRegistration({ waiting: makeWorker() });
    const handle = wireUpdates(reg, nav, w);
    const release = holdIntake('recording');
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(0);                       // the old handler reloaded here
    expect(handle.state.deferred).toBe(1);
    expect(handle.state.deferredFor).toBe('you are recording');
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBe(null);  // the sentinel is set only with the reload
    t.tick(30 * 60 * 1000);
    expect(w.reloads).toBe(0);                       // a half-hour meeting, untouched
    release();
    t.tick(QUIET_MS);
    expect(w.reloads).toBe(1);
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBe('1');
    nav.serviceWorker.fire('controllerchange');
    t.tick(QUIET_MS);
    expect(w.reloads).toBe(1);                       // still exactly once
  });
  it('with nothing coming in, the swap reloads at once as before', () => {
    const t = fakeTimers();
    const w = makeWindow(t);
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const handle = wireUpdates(makeRegistration({ waiting: makeWorker() }), nav, w);
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
    expect(handle.state.deferred).toBe(0);
  });
});

// ── 4. THE HEAL RELOAD WAITS ────────────────────────────────────────────────
describe('the stale-chunk heal waits for the words', () => {
  function healWindow(t) {
    const listeners = {};
    const map = new Map();
    return {
      sessionStorage: { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) },
      addEventListener(ty, cb) { (listeners[ty] ||= []).push(cb); },
      removeEventListener() {},
      fire(ty, evt) { (listeners[ty] || []).forEach((cb) => cb(evt)); },
      setTimeout: t.setTimeout, clearTimeout: t.clearTimeout,
    };
  }
  it('PROVEN-TO-CATCH: a chunk failure while typing is not healed by a reload under the person; the error is left to the boundary and the reload comes when they are free', () => {
    const t = fakeTimers();
    const w = healWindow(t);
    let reloads = 0;
    wireChunkHeal(w, { now: () => 1000, reload: () => { reloads += 1; } });
    const release = holdIntake('typing');
    let prevented = 0;
    w.fire('vite:preloadError', { preventDefault() { prevented += 1; } });
    expect(reloads).toBe(0);
    expect(prevented).toBe(0);                       // the import rejects honestly; the boundary says so
    release();
    t.tick(QUIET_MS);
    expect(reloads).toBe(1);
  });
  it('with nothing coming in, the heal reloads at once and swallows the error as before', () => {
    const t = fakeTimers();
    const w = healWindow(t);
    let reloads = 0; let prevented = 0;
    wireChunkHeal(w, { now: () => 1000, reload: () => { reloads += 1; } });
    w.fire('vite:preloadError', { preventDefault() { prevented += 1; } });
    expect(reloads).toBe(1);
    expect(prevented).toBe(1);
  });
});

// ── 5. BANNERS AND THE BELL STAY AWAY ───────────────────────────────────────
let container, root;
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { window.sessionStorage.removeItem(LAUNCH_OPENED_KEY); window.localStorage.removeItem('pwa-install-dismissed:poetech'); } catch (_) { /* ignore */ }
});

describe('the "Updated" toast, the install nudge and the arrivals list wait', () => {
  it('PROVEN-TO-CATCH: the toast does not show over a dictation, and shows once it ends (within its own time)', async () => {
    await mount(createElement(UpdatePrompt));
    let release;
    await act(async () => { release = holdIntake('dictation'); });
    await act(async () => { window.dispatchEvent(new Event('poetech:updated')); });
    expect(container.textContent).toBe('');
    await act(async () => { release(); });
    expect(container.textContent).toContain('Updated to the latest version.');
  });
  it('PROVEN-TO-CATCH: the install nudge waits while typing, then shows the same kept prompt', async () => {
    await mount(createElement(InstallPrompt));
    let release;
    await act(async () => { release = holdIntake('typing'); });
    const evt = new Event('beforeinstallprompt');
    evt.prompt = () => {}; evt.userChoice = Promise.resolve();
    await act(async () => { window.dispatchEvent(evt); });
    expect(container.textContent).toBe('');
    await act(async () => { release(); });
    expect(container.textContent).toContain('Install PoeTech');
  });
  it('PROVEN-TO-CATCH: the dock bell does not open the list on launch while recording; it opens once the person is free', async () => {
    window.__ptArrivals = { count: 2, items: [{ id: 'a', kind: 'message', count: 2, at: new Date().toISOString(), title: 'Hello' }], all: [] };
    const release = holdIntake('recording');
    await mount(createElement(ArrivalsBell, { variant: 'dock' }));
    expect(document.querySelector('[data-testid="arrivals-heading"]')).toBeNull();
    expect(window.sessionStorage.getItem(LAUNCH_OPENED_KEY)).toBeNull();   // not spent: it still owes the open
    await act(async () => { release(); });
    expect(document.querySelector('[data-testid="arrivals-heading"]')?.textContent).toBe('2 new');
    expect(window.sessionStorage.getItem(LAUNCH_OPENED_KEY)).toBe('1');
    delete window.__ptArrivals;
  });
  it('a new arrival while held does not open the list either', async () => {
    window.__ptArrivals = { count: 0, items: [], all: [] };
    await mount(createElement(ArrivalsBell, { variant: 'dock' }));
    let release;
    await act(async () => { release = holdIntake('typing'); });
    await act(async () => { window.dispatchEvent(new CustomEvent(ARRIVALS_EVENT, { detail: { count: 1, items: [{ id: 'b', kind: 'lesson-ready', at: '' }], all: [] } })); });
    expect(document.querySelector('[data-testid="arrivals-heading"]')).toBeNull();
    await act(async () => { release(); });
    delete window.__ptArrivals;
  });
});

// ── 6. TYPING IS WATCHED ────────────────────────────────────────────────────
describe('typing in any box holds the app still', () => {
  it('knows a field a person types words into', () => {
    const ta = document.createElement('textarea');
    const text = document.createElement('input'); text.type = 'text';
    const check = document.createElement('input'); check.type = 'checkbox';
    const ro = document.createElement('textarea'); ro.readOnly = true;
    const div = document.createElement('div');
    expect(isTypingTarget(ta)).toBe(true);
    expect(isTypingTarget(text)).toBe(true);
    expect(isTypingTarget(check)).toBe(false);
    expect(isTypingTarget(ro)).toBe(false);
    expect(isTypingTarget(div)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
  it('PROVEN-TO-CATCH: words in a focused box take the hold; leaving the box, emptying it, or going idle releases it', () => {
    const t = fakeTimers();
    const stop = watchTypedIntake(document, { setTimeout: t.setTimeout, clearTimeout: t.clearTimeout, win: window });
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    ta.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(intakeHeld()).toBe(false);                 // an empty box is not intake
    ta.value = 'Dear brother';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(intakeHeld()).toBe(true);
    expect(intakeKinds()).toEqual(['typing']);
    // Pauses to think, under the idle time: still held.
    t.tick(TYPING_IDLE_MS - 1);
    ta.value = 'Dear brother, grace';
    ta.dispatchEvent(new Event('keydown', { bubbles: true }));
    t.tick(TYPING_IDLE_MS - 1);
    expect(intakeHeld()).toBe(true);
    // Walks away: released by the idle time.
    t.tick(1);
    expect(intakeHeld()).toBe(false);
    // Comes back and types: held again; sends (the box blurs): released.
    ta.dispatchEvent(new Event('keydown', { bubbles: true }));
    expect(intakeHeld()).toBe(true);
    ta.dispatchEvent(new Event('focusout', { bubbles: true }));
    expect(intakeHeld()).toBe(false);
    // Empties the box: released.
    ta.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(intakeHeld()).toBe(true);
    ta.value = '';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(intakeHeld()).toBe(false);
    stop();
    ta.value = 'x';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(intakeHeld()).toBe(false);                 // stopped: no longer watching
    ta.remove();
  });
});

// ── 7. THE WIRING, PINNED IN SOURCE ─────────────────────────────────────────
describe('every taker of the screen consults the hold', () => {
  it('main.jsx watches typing from boot, after the heal is wired', () => {
    const main = codeOnly(read('main.jsx'));
    expect(main).toContain("import { watchTypedIntake } from './lib/intake-guard.js';");
    const heal = main.indexOf('wireChunkHeal(window);');
    const watch = main.indexOf('watchTypedIntake(document, { win: window });');
    expect(heal).toBeGreaterThan(0);
    expect(watch).toBeGreaterThan(heal);
  });
  it('the recorder holds for the take and for the kept result; the mic holds while listening; the reader and the download hold while they run', () => {
    const scribe = codeOnly(read('lib', 'workflow-scribe.js'));
    expect(scribe).toContain("holdIntake('recording')");
    expect(scribe).toContain("holdIntake('recording-kept')");
    expect(scribe).toContain('setTimeout(releaseKept, RESULT_HOLD_MS)');
    const mic = codeOnly(read('lib', 'voice-dictation.js'));
    expect(mic).toContain("holdIntake('dictation')");
    const reader = codeOnly(read('lib', 'use-read-aloud.js'));
    expect(reader).toContain("useIntakeHold('reading', !!(tts.isReading || cloudPlaying))");
    const dl = codeOnly(read('lib', 'lesson-downloads.js'));
    expect(dl).toContain("holdIntake('download')");
    expect(RESULT_HOLD_MS).toBe(10 * 60 * 1000);
  });
  it('the toast, the nudge and the bell read the hold', () => {
    const prompts = codeOnly(read('components', 'PwaPrompts.jsx'));
    expect(prompts).toContain('if (!confirmed || held) return null;');
    expect(prompts).toContain('if (installed || dismissed || held) return null;');
    const bell = codeOnly(read('components', 'ArrivalsBell.jsx'));
    expect(bell).toContain('count === 0 || held || launchOpened(win)');
  });
});
