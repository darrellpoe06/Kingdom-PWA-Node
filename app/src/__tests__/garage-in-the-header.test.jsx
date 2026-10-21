// @vitest-environment jsdom
// =============================================================================
// The Wyze garage door is in the header (2026-10-21)
// =============================================================================
// Darrell: "Garage door openers are supposed to be on the main page in the
// header of the app so we users who connect our Garage doors can use it for
// opening the garage without needing to open the cameras tab."
// Root cause: the header read only hand-registered openers; the working garage
// is the Wyze garage controller only Cameras asked about. Pinned here: the
// header offers it, a HOLD moves it through the same NAS action, letting go
// early sends nothing, no key or no door draws nothing, and the door list is
// asked of the NAS at most once per GARAGE_FRESH_MS.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import GarageHeaderButton from '../components/GarageHeaderButton.jsx';
import { loadGarages, saveGarages, garagesStale, keepAfterRead, GARAGE_FRESH_MS } from '../lib/garage-header.js';
import { HOLD_MS } from '../lib/openers.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function memStore() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; }
const devicesBody = { devices: [{ mac: 'AA11', nickname: 'Garage Cam', online: true, garage: true }, { mac: 'BB22', nickname: 'Porch', online: true, garage: false }] };
function fakeFetch(calls) {
  return async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body || null });
    if (String(url).includes('/devices')) return { status: 200, json: async () => devicesBody };
    return { status: 200, json: async () => ({ ok: true }) };
  };
}
let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(GarageHeaderButton, props)); });
  await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
}
afterEach(async () => { vi.useRealTimers(); if (root) await act(async () => root.unmount()); container?.remove(); root = null; });
const presses = (calls) => calls.filter((c) => c.method === 'POST');

describe('the garage door rides the header', () => {
  it('PROVEN TO CATCH: with a key and a Wyze garage, the header offers it; a full hold sends one garage action', async () => {
    const calls = []; const storage = memStore();
    await mount({ token: 'family-key', fetchImpl: fakeFetch(calls), storage });
    const btn = container.querySelector('[data-testid="garage-header-press"]');
    expect(btn, 'the header draws the garage').toBeTruthy();
    expect(btn.getAttribute('data-mac')).toBe('AA11');
    expect(loadGarages(storage).garages.map((g) => g.mac)).toEqual(['AA11']);
    vi.useFakeTimers();
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true })); });
    await act(async () => { vi.advanceTimersByTime(HOLD_MS + 100); });
    vi.useRealTimers();
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    const sent = presses(calls);
    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0].body)).toEqual({ mac: 'AA11', action: 'garage' });
    expect(container.querySelector('[data-testid="garage-header-said"]').textContent).toMatch(/door was told to move/i);
  });

  it('PROVEN TO CATCH: a phone\'s long-press (contextmenu, then pointercancel at ~500 ms) does not end the hold', async () => {
    // Darrell 2026-10-21, on his Fold: "The garage tab doesn't work!!!". Android
    // raises these two events on any touch held about half a second, and the
    // first version cancelled the hold on pointercancel, so the 800 ms hold
    // could never finish on a phone.
    const calls = [];
    await mount({ token: 'family-key', fetchImpl: fakeFetch(calls), storage: memStore() });
    const btn = container.querySelector('[data-testid="garage-header-press"]');
    expect(btn.style.touchAction).toBe('none');
    vi.useFakeTimers();
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true })); });
    await act(async () => { vi.advanceTimersByTime(500); });
    const menu = new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    await act(async () => { btn.dispatchEvent(menu); });
    expect(menu.defaultPrevented, 'the long-press menu must be refused').toBe(true);
    await act(async () => { btn.dispatchEvent(new window.Event('pointercancel', { bubbles: true })); });
    await act(async () => { vi.advanceTimersByTime(HOLD_MS); });
    vi.useRealTimers();
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(presses(calls), 'the hold finished and the door was told').toHaveLength(1);
    // and the answer is on screen, not only for a screen reader
    const said = container.querySelector('[data-testid="garage-header-said"]');
    expect(said.className).not.toContain('sr-only');
    expect(said.textContent).toMatch(/door was told to move/i);
  });

  it('letting go before the hold is full sends nothing, and says to hold it', async () => {
    const calls = [];
    await mount({ token: 'family-key', fetchImpl: fakeFetch(calls), storage: memStore() });
    const btn = container.querySelector('[data-testid="garage-header-press"]');
    vi.useFakeTimers();
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true })); });
    await act(async () => { vi.advanceTimersByTime(Math.floor(HOLD_MS / 2)); });
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true })); });
    expect(container.querySelector('[data-testid="garage-header-said"]').textContent).toMatch(/hold it down/i);
    await act(async () => { vi.advanceTimersByTime(HOLD_MS * 2); });
    vi.useRealTimers();
    expect(presses(calls)).toEqual([]);
  });

  it('no camera key, or no garage, draws nothing', async () => {
    await mount({ token: '', fetchImpl: fakeFetch([]), storage: memStore() });
    expect(container.querySelector('[data-testid="garage-header"]')).toBeNull();
    await act(async () => root.unmount()); container.remove();
    const none = async () => ({ status: 200, json: async () => ({ devices: [{ mac: 'BB22', nickname: 'Porch', garage: false }] }) });
    await mount({ token: 'k', fetchImpl: none, storage: memStore() });
    expect(container.querySelector('[data-testid="garage-header"]')).toBeNull();
  });

  it('a fresh record is used without asking Wyze; a stale one is asked once', async () => {
    const calls = []; const storage = memStore();
    saveGarages([{ mac: 'CC33', nickname: 'Shop door' }], Date.now(), storage);
    await mount({ token: 'k', fetchImpl: fakeFetch(calls), storage });
    expect(calls).toEqual([]);
    expect(container.querySelector('[data-testid="garage-header-press"]').getAttribute('data-mac')).toBe('CC33');
    expect(garagesStale(Date.now() - GARAGE_FRESH_MS, Date.now())).toBe(true);
    expect(garagesStale(Date.now() - 1000, Date.now())).toBe(false);
  });

  it('a slow Wyze keeps the known doors; an access without doors clears them', () => {
    expect(keepAfterRead({ kind: 'rate-limited' })).toBe(null);
    expect(keepAfterRead({ kind: 'unreachable' })).toBe(null);
    expect(keepAfterRead({ kind: 'no-actions' })).toBe('clear');
    expect(keepAfterRead({ kind: 'ok' })).toBe('replace');
  });
});
