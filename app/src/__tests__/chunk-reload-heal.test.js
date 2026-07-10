// @vitest-environment node
//
// chunk-reload-heal — recover from a stale-deploy lazy-chunk 404 (lib/chunk-reload-
// heal.js). Proven-to-catch (DR-0076): reproduces the failure that made "the Voice
// tab does not work" while other tabs did — a lazy chunk 404 on a skewed deploy —
// and asserts the fix: ONE recovery reload, then a loop guard so a still-broken
// server doesn't spin the device.
import { describe, it, expect, vi } from 'vitest';
import {
  decideChunkHeal, wireChunkHeal, HEAL_TS_KEY, HEAL_WINDOW_MS,
} from '../lib/chunk-reload-heal.js';

function makeSession() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

// Minimal window-like with a real event target for vite:preloadError.
function makeWin(sessionStorage) {
  const listeners = {};
  return {
    sessionStorage,
    location: { reload: () => {} },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    removeEventListener: (t, fn) => { listeners[t] = (listeners[t] || []).filter((f) => f !== fn); },
    dispatch: (t, evt) => (listeners[t] || []).forEach((fn) => fn(evt)),
    _listeners: listeners,
  };
}

describe('decideChunkHeal', () => {
  it('heals on the first chunk failure and stamps the time', () => {
    const ss = makeSession();
    const win = { sessionStorage: ss };
    expect(decideChunkHeal(win, 1000)).toBe('reload');
    expect(ss.getItem(HEAL_TS_KEY)).toBe('1000');
  });

  it('gives up if a chunk fails AGAIN within the loop window (no spin)', () => {
    const ss = makeSession();
    const win = { sessionStorage: ss };
    expect(decideChunkHeal(win, 1000)).toBe('reload');
    expect(decideChunkHeal(win, 1000 + HEAL_WINDOW_MS - 1)).toBe('gave-up'); // too soon → loop guard
  });

  it('heals again for a NEW skew after the window elapses', () => {
    const ss = makeSession();
    const win = { sessionStorage: ss };
    expect(decideChunkHeal(win, 1000)).toBe('reload');
    expect(decideChunkHeal(win, 1000 + HEAL_WINDOW_MS + 1)).toBe('reload');
  });

  it('gives up with no storage — cannot count attempts, must not loop (DR-0139)', () => {
    expect(() => decideChunkHeal({}, 5)).not.toThrow();
    expect(decideChunkHeal({}, 5)).toBe('gave-up');
  });
});

describe('wireChunkHeal — vite:preloadError recovery', () => {
  it('reloads once on a preloadError, then loop-guards the immediate repeat', () => {
    const ss = makeSession();
    const win = makeWin(ss);
    let reloads = 0;
    let t = 1000;
    wireChunkHeal(win, { now: () => t, reload: () => { reloads += 1; } });

    const evt = { preventDefault: vi.fn() };
    win.dispatch('vite:preloadError', evt);     // first failure → recover
    expect(reloads).toBe(1);
    expect(evt.preventDefault).toHaveBeenCalled();

    t = 1000 + 5000;                            // 5s later, still broken
    win.dispatch('vite:preloadError', { preventDefault() {} });
    expect(reloads).toBe(1);                     // did NOT reload again (loop guard)
  });

  it('does NOT preventDefault on gave-up — the import must REJECT with the real error (DR-0139)', () => {
    // Root-caused live 2026-07-10: Vite's preload helper swallows the rejection
    // when the event is defaultPrevented, so the import RESOLVES UNDEFINED and
    // main.jsx dies on "Cannot destructure property 'default' of 'undefined'" —
    // the real cause (a 404'd chunk, a module that threw) is destroyed. On the
    // gave-up rung the error must propagate untouched.
    const ss = makeSession();
    const win = makeWin(ss);
    let reloads = 0;
    let t = 1000;
    wireChunkHeal(win, { now: () => t, reload: () => { reloads += 1; } });
    win.dispatch('vite:preloadError', { preventDefault: vi.fn() }); // heals (reload #1)

    t = 1000 + 5000; // within the window → gave-up
    const evt2 = { preventDefault: vi.fn() };
    win.dispatch('vite:preloadError', evt2);
    expect(reloads).toBe(1);
    expect(evt2.preventDefault).not.toHaveBeenCalled();
  });

  it('journals the heal so the recovery is visible on the quality board (DR-0139)', () => {
    const ls = makeSession(); // same map-backed shape works for localStorage
    const win = makeWin(makeSession());
    win.localStorage = ls;
    wireChunkHeal(win, { now: () => 1000, reload: () => {} });
    win.dispatch('vite:preloadError', { preventDefault() {} });
    const journal = JSON.parse(ls.getItem('poe-error-journal') || '[]');
    expect(journal.length).toBe(1);
    expect(journal[0]).toMatchObject({ source: 'chunk-heal', kind: 'heal' });
  });

  it('unsubscribe stops further handling', () => {
    const win = makeWin(makeSession());
    let reloads = 0;
    const off = wireChunkHeal(win, { now: () => 1, reload: () => { reloads += 1; } });
    off();
    win.dispatch('vite:preloadError', { preventDefault() {} });
    expect(reloads).toBe(0);
  });

  it('no-ops without a usable window (never throws)', () => {
    expect(() => wireChunkHeal(undefined)).not.toThrow();
    expect(typeof wireChunkHeal(undefined)).toBe('function');
  });
});
