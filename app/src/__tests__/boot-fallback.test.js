// boot-fallback — the front door never shows a blank page (Darrell 2026-07-04:
// "make the front door reliable"). Pins that a boot failure renders a retry
// screen with working Reload + Clear-cache buttons, and that the cache-clear is
// fail-soft. jsdom default env (needs a real DOM element).
import { describe, it, expect, vi } from 'vitest';
import { bootFallbackHtml, showBootFallback, clearAppCaches } from '../lib/boot-fallback.js';

describe('bootFallbackHtml — the plain-DOM retry screen', () => {
  it('is self-contained (inline styles) with a reload + clear button', () => {
    const html = bootFallbackHtml();
    expect(html).toContain('data-boot-reload');
    expect(html).toContain('data-boot-clear');
    expect(html).toContain('PoeTech');
    expect(html).toMatch(/Reload/);
    expect(html).not.toContain('class=');   // no Tailwind — a failed CSS chunk can't blank it
  });
});

describe('showBootFallback — renders + wires the buttons', () => {
  it('fills the root and Reload triggers a reload', () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    expect(showBootFallback(el, { reload, clear: () => Promise.resolve() })).toBe(true);
    expect(el.innerHTML).toContain('Almost there');
    el.querySelector('[data-boot-reload]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it('Clear cache runs the clear step then reloads', async () => {
    const el = document.createElement('div');
    const reload = vi.fn();
    const clear = vi.fn(() => Promise.resolve());
    showBootFallback(el, { reload, clear });
    el.querySelector('[data-boot-clear]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await Promise.resolve(); await Promise.resolve();
    expect(clear).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
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
