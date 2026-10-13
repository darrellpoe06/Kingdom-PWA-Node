// =============================================================================
// InstallAppButton — live render proof for the header "Install app" control
// (Darrell 2026-07-10: "add it to the space that is on each tab top space").
// Pins the contract (DR-0076):
//   • not installed -> the button renders on the header, always actionable
//   • captured event -> tap fires the NATIVE install dialog (no dropdown)
//   • no event -> tap opens this phone's exact steps (never a dead button)
//   • installed (appinstalled event) -> the control removes itself
// Also pins the header mount: the monolith shell imports and renders it.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import InstallAppButton from '../components/InstallAppButton.jsx';
import { captureInstallPrompt } from '../lib/install-app.js';

const __dir = dirname(fileURLToPath(import.meta.url));

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(InstallAppButton));
  });
}
beforeEach(() => {
  window.__pwaInstallEvt = null;
  window.__pwaInstallCaptureArmed = false;
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  window.__pwaInstallEvt = null;
  window.__pwaInstallCaptureArmed = false;
});

function fakeInstallEvent(outcome = 'accepted') {
  const e = new Event('beforeinstallprompt');
  e.prompt = () => { e.promptCalled = true; };
  e.userChoice = Promise.resolve({ outcome });
  return e;
}

describe('InstallAppButton — the every-tab install control', () => {
  it('renders the Install app button when the app is not installed', async () => {
    await mount();
    expect(container.textContent).toContain('Install app');
  });

  it('fires the native install dialog when the browser handed the event over', async () => {
    captureInstallPrompt(window);
    const evt = fakeInstallEvent('accepted');
    await act(async () => { window.dispatchEvent(evt); });
    await mount();
    const btn = container.querySelector('button');
    await act(async () => { btn.click(); });
    expect(evt.promptCalled).toBe(true);
    expect(container.textContent).toContain('Installing');
  });

  it('opens the platform steps when no event is available — never a dead tap', async () => {
    await mount();
    const btn = container.querySelector('button');
    await act(async () => { btn.click(); });
    // jsdom's UA is desktop-shaped; the steps dropdown must show real content.
    expect(container.textContent).toMatch(/Install|Add to your home screen/);
    expect(container.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  it('removes itself once the browser reports the app installed', async () => {
    await mount();
    expect(container.textContent).toContain('Install app');
    await act(async () => { window.dispatchEvent(new Event('appinstalled')); });
    expect(container.textContent).toBe('');
  });

  it('is mounted in the monolith header beside Subscribe (source pin)', () => {
    const src = readFileSync(join(__dir, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(src).toContain("import InstallAppButton from './components/InstallAppButton.jsx'");
    expect(src).toContain('<InstallAppButton />');
  });
});
