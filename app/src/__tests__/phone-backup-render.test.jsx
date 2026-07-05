// =============================================================================
// PhoneBackup — render proof (Verification Doctrine: observe, don't assume).
// =============================================================================
// The Phone → NAS backup card (2026-07-05) renders its REAL states: nothing
// without a bridge token (the fail-quiet NAS-surface contract), and the honest
// service banners + action buttons when a token is present. A painted "backed
// up" checkmark with no NAS behind it is the exact failure DR-0076 exists to
// stop, so these renders pin the honest states, not a happy path.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PhoneBackup } from '../components/PhoneBackup.jsx';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const flush = () => act(async () => { await Promise.resolve(); });

describe('PhoneBackup — honest render states', () => {
  it('renders NOTHING without a bridge token (fail-quiet NAS-surface contract)', async () => {
    act(() => { root.render(createElement(PhoneBackup)); });
    await flush();
    expect(container.innerHTML).toBe('');
  });

  it('renders the card + honest unreachable banner when the NAS is down', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    act(() => { root.render(createElement(PhoneBackup)); });
    await flush();
    expect(container.textContent).toContain('Phone → NAS backup');
    expect(container.textContent).toContain("Can't reach the NAS backup service");
    // Honest: the upload actions exist but are disabled — no fake readiness.
    const label = container.querySelector('label');
    expect(label.textContent).toContain('Back up photos & videos');
    expect(label.className).toContain('pointer-events-none');
    // The picker takes photos AND videos — the whole point of this lane.
    expect(container.querySelector('input[type="file"]').getAttribute('accept')).toBe('image/*,video/*');
  });

  it('states the one-line redeploy when the NAS runs the pre-media build', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    act(() => { root.render(createElement(PhoneBackup)); });
    await flush();
    expect(container.textContent).toContain('running the build from before media backup');
  });

  it('enables the upload actions when the NAS media service answers ready', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, bytes: 0 }) })));
    act(() => { root.render(createElement(PhoneBackup)); });
    await flush();
    const label = container.querySelector('label');
    expect(label.className).not.toContain('pointer-events-none');
    // The honest-limit line is part of the card, not fine print elsewhere.
    expect(container.textContent).toContain("a web app can't reach your camera roll in the background");
  });
});
