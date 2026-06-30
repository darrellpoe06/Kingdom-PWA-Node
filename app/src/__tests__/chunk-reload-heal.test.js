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

  it('is null-safe with no storage (still heals, never throws)', () => {
    expect(() => decideChunkHeal({}, 5)).not.toThrow();
    expect(decideChunkHeal({}, 5)).toBe('reload');
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
