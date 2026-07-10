// boot-fallback — the front door never shows a blank page (Darrell 2026-07-04:
// "make the front door reliable"), and it heals ITSELF before asking for a tap
// (Darrell 2026-07-10, DR-0137: "The church app should never go down"). Pins the
// self-heal ladder — auto reload → auto cache-clear+reload → manual screen — its
// loop guards, and that the manual screen's buttons still work. jsdom default
// env (needs a real DOM element).
import { describe, it, expect, vi } from 'vitest';
import {
  bootFallbackHtml, bootHealingHtml, showBootFallback, clearAppCaches,
  decideBootHeal, BOOT_HEAL_KEY, BOOT_HEAL_WINDOW_MS,
} from '../lib/boot-fallback.js';

// A window-like with a working per-test sessionStorage (jsdom's real one leaks
// stamps across tests; this keeps each ladder run isolated + injectable).
function fakeWin(initial) {
  const store = new Map(initial ? [[BOOT_HEAL_KEY, JSON.stringify(initial)]] : []);
  return {
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
    },
    _store: store,
  };
}
const NOW = 1_800_000_000_000;

describe('decideBootHeal — the reload → clear → manual ladder', () => {
  it('first failure auto-reloads and stamps the attempt', () => {
    const win = fakeWin(null);
    expect(decideBootHeal(win, NOW)).toBe('reload');
    expect(JSON.parse(win._store.get(BOOT_HEAL_KEY))).toMatchObject({ ts: NOW, stage: 'reload' });
  });
  it('a failure right after a reload escalates to cache-clear', () => {
    const win = fakeWin({ ts: NOW - 5000, stage: 'reload' });
    expect(decideBootHeal(win, NOW)).toBe('clear');
  });
  it('a failure right after a clear gives up to the manual screen (no loop)', () => {
    const win = fakeWin({ ts: NOW - 5000, stage: 'clear' });
    expect(decideBootHeal(win, NOW)).toBe('manual');
  });
  it('an OLD stamp reads as a new incident — the ladder starts over', () => {
    const win = fakeWin({ ts: NOW - BOOT_HEAL_WINDOW_MS - 1, stage: 'clear' });
    expect(decideBootHeal(win, NOW)).toBe('reload');
  });
  it('no sessionStorage → manual immediately (cannot count attempts = never loop)', () => {
    expect(decideBootHeal({}, NOW)).toBe('manual');
    expect(decideBootHeal(null, NOW)).toBe('manual');
    const throwing = { get sessionStorage() { throw new Error('private mode'); } };
    expect(decideBootHeal(throwing, NOW)).toBe('manual');
  });
});

describe('the screens are self-contained plain DOM', () => {
  it('manual screen has inline styles with a reload + clear button', () => {
    const html = bootFallbackHtml();
    expect(html).toContain('data-boot-reload');
    expect(html).toContain('data-boot-clear');
    expect(html).toContain('PoeTech');
    expect(html).toMatch(/Reload/);
    expect(html).not.toContain('class=');   // no Tailwind — a failed CSS chunk can't blank it
  });
  it('healing screen asks for NOTHING (no buttons, polite live region)', () => {
    const html = bootHealingHtml();
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('data-boot-reload');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('class=');
  });
});

describe('showBootFallback — auto rungs recover without a tap', () => {
  it('rung 1: shows the healing screen and reloads by itself', async () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    const shown = showBootFallback(el, { reload, win: fakeWin(null), now: () => NOW, delayMs: 0 });
    expect(shown).toBe(true);
    expect(el.innerHTML).toContain('Refreshing automatically');
    expect(el.innerHTML).not.toContain('data-boot-reload');
    await new Promise((r) => setTimeout(r, 1));
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it('rung 2: clears caches THEN reloads by itself', async () => {
    const el = document.createElement('div');
    const order = [];
    const reload = vi.fn(() => order.push('reload'));
    const clear = vi.fn(() => { order.push('clear'); return Promise.resolve(); });
    showBootFallback(el, { reload, clear, win: fakeWin({ ts: NOW - 1000, stage: 'reload' }), now: () => NOW, delayMs: 0 });
    expect(el.innerHTML).toContain('Refreshing automatically');
    await new Promise((r) => setTimeout(r, 1));
    expect(order).toEqual(['clear', 'reload']);
  });
  it('rung 2 still reloads even if the cache-clear rejects (fail-soft)', async () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    const clear = vi.fn(() => Promise.reject(new Error('x')));
    showBootFallback(el, { reload, clear, win: fakeWin({ ts: NOW - 1000, stage: 'reload' }), now: () => NOW, delayMs: 0 });
    await new Promise((r) => setTimeout(r, 1));
    expect(reload).toHaveBeenCalled();
  });
});

describe('showBootFallback — the manual screen (both auto rungs exhausted)', () => {
  const manualOpts = (over) => ({ win: fakeWin({ ts: NOW - 1000, stage: 'clear' }), now: () => NOW, ...over });
  it('fills the root and Reload triggers a reload', () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    expect(showBootFallback(el, manualOpts({ reload, clear: () => Promise.resolve() }))).toBe(true);
    expect(el.innerHTML).toContain('Almost there');
    el.querySelector('[data-boot-reload]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it('Clear cache runs the clear step then reloads', async () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    const clear = vi.fn(() => Promise.resolve());
    showBootFallback(el, manualOpts({ reload, clear }));
    el.querySelector('[data-boot-clear]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await Promise.resolve(); await Promise.resolve();
    expect(clear).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });
  it('a storage-less environment (private mode) goes straight to the manual screen', () => {
    const el = document.createElement('div');
    expect(showBootFallback(el, { win: {}, reload: vi.fn() })).toBe(true);
    expect(el.innerHTML).toContain('Almost there');
  });
  it('is null-safe when there is no root element', () => {
    expect(showBootFallback(null, {})).toBe(false);
  });
});

describe('clearAppCaches — fail-soft cache/SW nuke', () => {
  it('unregisters workers and deletes caches, never throws', async () => {
    const unregister = vi.fn(() => Promise.resolve(true));
    const del = vi.fn(() => Promise.resolve(true));
    const nav = { serviceWorker: { getRegistrations: () => Promise.resolve([{ unregister }, { unregister }]) } };
    const cachesApi = { keys: () => Promise.resolve(['a', 'b']), delete: del };
    await clearAppCaches(nav, cachesApi);
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(del).toHaveBeenCalledTimes(2);
    // a throwing environment resolves quietly
    await expect(clearAppCaches({ serviceWorker: { getRegistrations: () => { throw new Error('x'); } } }, null)).resolves.toBeUndefined();
  });
});
