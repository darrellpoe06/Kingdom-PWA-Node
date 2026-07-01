// =============================================================================
// ChurchVideoWall — live render proof for the VX1000 SOFTWARE card (Verification
// Doctrine: observe the REAL DOM, not a claim). Mounts the actual component in
// jsdom and asserts the NovaStar software stack Darrell needs on-site actually
// renders: the download link, NovaLCT / V-Can / VICP, the USB-Type-B first-setup
// steps, and the which-machine plan. This is the durable "it shows in the app"
// proof, run every CI cycle. The software card renders UNCONDITIONALLY (it is
// non-financial engineering content — only budget/donations are access-gated),
// so no signed-in session is needed to prove it shows.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ChurchVideoWall from '../components/ChurchVideoWall.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ChurchVideoWall));
  });
  // allow the access effect to settle (it resolves to not-signed-in in jsdom)
  await act(async () => { await Promise.resolve(); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('the VX1000 software card shows in the app', () => {
  it('renders the NovaStar download link + all three programs', async () => {
    await mount();
    const text = document.body.textContent;
    expect(text).toMatch(/VX1000 software/);
    expect(text).toMatch(/NovaLCT/);
    expect(text).toMatch(/V-Can/);
    expect(text).toMatch(/VICP/);
    const link = [...document.body.querySelectorAll('a')].find((a) => /novastar\.tech\/downloads/.test(a.getAttribute('href') || ''));
    expect(link, 'download link renders as a real anchor').toBeTruthy();
  });
  it('renders the on-site first-setup steps (USB Type-B, admin, 8x6, RCFG, V-Can)', async () => {
    await mount();
    const text = document.body.textContent;
    expect(text).toMatch(/USB Type-B/);
    expect(text).toMatch(/password "admin"/);
    expect(text).toMatch(/8 x 6 = 48/);
    expect(text).toMatch(/RCFG/);
  });
  it('renders which software goes on which control-room machine', async () => {
    await mount();
    const text = document.body.textContent;
    expect(text).toMatch(/config laptop/i);
    expect(text).toMatch(/operator machine/i);
  });
});
