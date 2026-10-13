// =============================================================================
// screen-awake — the screen stays on while a lesson is open or read (DR-0439)
// =============================================================================
// Darrell 2026-09-16: his Z Fold 7 goes black after 10 minutes mid-lesson. The
// app holds ONE wake-lock sentinel while any holder is active and lets go when
// none is; it re-requests on return to the foreground; it never pretends on a
// browser without the API. Every branch is driven with a fake navigator and a
// fake document; PROVEN-TO-CATCH cases fail against a manager that forgets to
// release, re-acquire, or honour the per-device switch.
import { describe, it, expect, vi } from 'vitest';
import {
  createScreenAwake, isScreenAwakeSupported, loadScreenAwakePref, saveScreenAwakePref,
  SCREEN_AWAKE_KEY, NO_WAKE_LOCK_HINT, REQUEST_TIMEOUT_MS,
} from '../lib/screen-awake.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function fakeSentinel() {
  const s = { released: false, listeners: {}, release: vi.fn(async () => { s.released = true; (s.listeners.release || []).forEach((f) => f()); }), addEventListener: (t, f) => { (s.listeners[t] ||= []).push(f); } };
  return s;
}
function fakeNav({ deny = false, hang = false } = {}) {
  const sentinels = [];
  return {
    sentinels,
    wakeLock: {
      request: vi.fn(() => {
        if (deny) return Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
        if (hang) return new Promise(() => {});
        const s = fakeSentinel(); sentinels.push(s); return Promise.resolve(s);
      }),
    },
  };
}
function fakeDoc() {
  const listeners = {};
  return {
    visibilityState: 'visible',
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
    removeEventListener: (t, f) => { listeners[t] = (listeners[t] || []).filter((x) => x !== f); },
    fire: (t) => (listeners[t] || []).forEach((f) => f()),
    count: (t) => (listeners[t] || []).length,
  };
}
function fakeStore(init = {}) { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; }

describe('support and the per-device switch', () => {
  it('supported only when navigator.wakeLock.request exists; the hint names the phone setting', () => {
    expect(isScreenAwakeSupported(fakeNav())).toBe(true);
    expect(isScreenAwakeSupported({})).toBe(false);
    expect(isScreenAwakeSupported(undefined)).toBe(false);
    expect(NO_WAKE_LOCK_HINT).toMatch(/Screen timeout/);
    expect(NO_WAKE_LOCK_HINT).toMatch(/Auto-Lock/);
  });
  it('the switch defaults ON, persists OFF, and never throws without storage', () => {
    expect(loadScreenAwakePref(fakeStore())).toBe(true);
    const st = fakeStore(); saveScreenAwakePref(false, st);
    expect(st.m[SCREEN_AWAKE_KEY]).toBe('off');
    expect(loadScreenAwakePref(st)).toBe(false);
    expect(loadScreenAwakePref({ getItem: () => { throw new Error('private'); } })).toBe(true);
    expect(() => saveScreenAwakePref(true, undefined)).not.toThrow();
  });
});

describe('the manager holds one sentinel for any number of holders', () => {
  it('hold → requests once; a second holder does not request again; the last drop releases', async () => {
    const nav = fakeNav(); const doc = fakeDoc(); const m = createScreenAwake({ nav, doc, store: fakeStore() });
    m.hold('lesson'); await tick();
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1);
    expect(m.getState().held).toBe(true);
    m.hold('reader'); await tick();
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1); // one sentinel, two holders
    m.drop('lesson'); await tick();
    expect(m.getState().held).toBe(true); // the reader still holds
    m.drop('reader'); await tick();
    expect(nav.sentinels[0].release).toHaveBeenCalled();
    expect(m.getState().held).toBe(false);
    expect(doc.count('visibilitychange')).toBe(0); // the listener leaves with the last holder
  });
  it('PROVEN-TO-CATCH: the OS revokes on hide; on return to visible it is re-requested (holder still active)', async () => {
    const nav = fakeNav(); const doc = fakeDoc(); const m = createScreenAwake({ nav, doc, store: fakeStore() });
    m.hold('lesson'); await tick();
    doc.visibilityState = 'hidden'; await nav.sentinels[0].release(); doc.fire('visibilitychange'); await tick();
    expect(m.getState().held).toBe(false);
    doc.visibilityState = 'visible'; doc.fire('visibilitychange'); await tick();
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(2);
    expect(m.getState().held).toBe(true);
  });
  it('never requests while hidden; requests when the page becomes visible with a holder', async () => {
    const nav = fakeNav(); const doc = fakeDoc(); doc.visibilityState = 'hidden';
    const m = createScreenAwake({ nav, doc, store: fakeStore() });
    m.hold('lesson'); await tick();
    expect(nav.wakeLock.request).not.toHaveBeenCalled();
    doc.visibilityState = 'visible'; doc.fire('visibilitychange'); await tick();
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1);
  });
  it('the per-device switch OFF releases and stops requesting; ON resumes', async () => {
    const nav = fakeNav(); const doc = fakeDoc(); const st = fakeStore(); const m = createScreenAwake({ nav, doc, store: st });
    m.hold('lesson'); await tick();
    m.setEnabled(false); await tick();
    expect(nav.sentinels[0].release).toHaveBeenCalled();
    expect(m.getState()).toMatchObject({ held: false, enabled: false, reason: 'off' });
    expect(st.m[SCREEN_AWAKE_KEY]).toBe('off');
    m.setEnabled(true); await tick();
    expect(m.getState().held).toBe(true);
  });
  it('a denied request is reported as blocked, never as held; an unsupported browser says so', async () => {
    const m = createScreenAwake({ nav: fakeNav({ deny: true }), doc: fakeDoc(), store: fakeStore() });
    m.hold('lesson'); await tick();
    expect(m.getState()).toMatchObject({ held: false, reason: 'blocked' });
    const u = createScreenAwake({ nav: {}, doc: fakeDoc(), store: fakeStore() });
    u.hold('lesson');
    expect(u.getState()).toMatchObject({ supported: false, held: false, reason: 'unsupported' });
  });
  it('a request that never settles times out (explicit threshold) and is not held', async () => {
    vi.useFakeTimers();
    try {
      const m = createScreenAwake({ nav: fakeNav({ hang: true }), doc: fakeDoc(), store: fakeStore(), timeoutMs: 50 });
      m.hold('lesson');
      await vi.advanceTimersByTimeAsync(60);
      expect(m.getState()).toMatchObject({ held: false, reason: 'timeout' });
      expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    } finally { vi.useRealTimers(); }
  });
  it('subscribers hear every change and a throwing subscriber never breaks the lock', async () => {
    const nav = fakeNav(); const m = createScreenAwake({ nav, doc: fakeDoc(), store: fakeStore() });
    const seen = []; m.subscribe(() => { throw new Error('boom'); }); m.subscribe((s) => seen.push(s.held));
    m.hold('x'); await tick();
    expect(seen).toContain(true);
    expect(m.getState().held).toBe(true);
  });
});
