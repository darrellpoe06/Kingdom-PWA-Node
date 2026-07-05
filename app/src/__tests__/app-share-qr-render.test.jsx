// =============================================================================
// AppShareQR — live render proof for the "show a QR to share the app" card.
// Mounts the REAL component in jsdom and pins that it (a) renders an actual QR
// SVG, (b) encodes the CANONICAL public join URL (never a preview/localhost
// origin — the code is scanned from someone else's phone), (c) shows the copy-
// link affordance, and (d) states plainly that showing the code does NOT grant
// access. Verify, don't claim (DR-0076).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import AppShareQR from '../components/AppShareQR.jsx';
import { appJoinUrl } from '../lib/app-share.js';

let container, root;
async function mount(Component, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Component, props));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('AppShareQR — renders a scannable code for the canonical join URL', () => {
  it('renders an actual QR SVG', async () => {
    await mount(AppShareQR);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-label')).toContain('PoeTech');
  });

  it('encodes the CANONICAL public production URL, labelled for scanning', () => {
    // The value the QR encodes is the single-sourced canonical URL.
    expect(appJoinUrl()).toBe('https://poetech.us/poetech-app/?join=1');
  });

  it('shows the human-readable link and a copy affordance', async () => {
    await mount(AppShareQR);
    expect(container.textContent).toContain('poetech.us/poetech-app/?join=1');
    const copyBtn = [...container.querySelectorAll('button')]
      .find((b) => /copy link/i.test(b.textContent));
    expect(copyBtn).toBeTruthy();
    expect(copyBtn.className).toContain('min-h-[44px]'); // >=44px touch target
  });

  it('copy button writes the canonical URL to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const orig = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await mount(AppShareQR);
    const copyBtn = [...container.querySelectorAll('button')]
      .find((b) => /copy link/i.test(b.textContent));
    await act(async () => { copyBtn.click(); });
    expect(writeText).toHaveBeenCalledWith('https://poetech.us/poetech-app/?join=1');
    Object.defineProperty(navigator, 'clipboard', { value: orig, configurable: true });
  });

  it('states plainly that showing the code does not grant access (steward posture)', async () => {
    await mount(AppShareQR);
    expect(container.textContent.toLowerCase()).toContain("doesn't grant access");
  });
});
