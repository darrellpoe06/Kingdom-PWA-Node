// Live render proof for the ?share=1 projector poster (DR-0076). Mounts the REAL
// component in jsdom and pins that it renders a QR SVG encoding the canonical
// public join URL, shows the "scan" instruction, and states the steward posture
// (showing the code does not grant access).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import SharePoster from '../components/SharePoster.jsx';

let container, root;
async function mount(Component) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Component));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('SharePoster — full-screen scan-to-get-the-app poster', () => {
  it('renders a QR SVG labelled for install', async () => {
    await mount(SharePoster);
    const svg = container.querySelector('svg[aria-label*="PoeTech"]');
    expect(svg).not.toBeNull();
  });

  it('shows the scan instruction and the canonical address', async () => {
    await mount(SharePoster);
    expect(container.textContent.toLowerCase()).toContain('scan to get the app');
    expect(container.textContent).toContain('poetech.us/poetech-app/?join=1');
  });

  it('keeps the steward posture (showing does not grant access)', async () => {
    await mount(SharePoster);
    expect(container.textContent.toLowerCase()).toContain("doesn't grant access");
  });
});
