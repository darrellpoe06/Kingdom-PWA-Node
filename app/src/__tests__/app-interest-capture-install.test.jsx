// =============================================================================
// AppInterestCapture — live render proof for the ONE-TAP install button
// (2026-07-10, Darrell: "it should be easy — why can't I just push a button to
// download?"). The ?join=1 "get the app" page used to show only manual menu
// steps even while the browser held a captured beforeinstallprompt. These
// tests mount the REAL component in jsdom and pin the fix (DR-0076):
//   • no captured event -> manual steps only, no dead button
//   • captured event    -> a real "Install PoeTech on this device" button that
//     FIRES the native prompt and confirms on accept
//   • event lands AFTER mount -> the button still arms (no missed-by-a-beat)
// =============================================================================
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import AppInterestCapture from '../components/AppInterestCapture.jsx';
import { captureInstallPrompt } from '../lib/install-app.js';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(AppInterestCapture, props));
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

describe('AppInterestCapture — one-tap install', () => {
  it('shows the manual steps and NO install button when no event was captured', async () => {
    await mount({ source: 'test' });
    expect(container.textContent).toContain('Get the PoeTech app');
    expect(container.textContent).not.toContain('Install PoeTech on this device');
  });

  it('leads with the one-tap install button when the browser handed the event over', async () => {
    captureInstallPrompt(window);
    await act(async () => { window.dispatchEvent(fakeInstallEvent()); });
    await mount({ source: 'test' });
    expect(container.textContent).toContain('Install PoeTech on this device');
    expect(container.textContent).toContain('Install in one tap');
  });

  it('fires the native prompt on tap and confirms the accepted install', async () => {
    captureInstallPrompt(window);
    const evt = fakeInstallEvent('accepted');
    await act(async () => { window.dispatchEvent(evt); });
    await mount({ source: 'test' });
    const btn = [...container.querySelectorAll('button')]
      .find((b) => b.textContent.includes('Install PoeTech on this device'));
    expect(btn).toBeTruthy();
    await act(async () => { btn.click(); });
    expect(evt.promptCalled).toBe(true);
    expect(container.textContent).toContain('landing on your home screen');
  });

  it('falls back to the manual steps when the person declines the native dialog', async () => {
    captureInstallPrompt(window);
    await act(async () => { window.dispatchEvent(fakeInstallEvent('dismissed')); });
    await mount({ source: 'test' });
    const btn = [...container.querySelectorAll('button')]
      .find((b) => b.textContent.includes('Install PoeTech on this device'));
    await act(async () => { btn.click(); });
    // The one-shot event is spent: no dead button, the steps carry the person.
    expect(container.textContent).not.toContain('Install PoeTech on this device');
    expect(container.textContent).not.toContain('landing on your home screen');
  });

  it('arms the button when the browser hands the event over AFTER mount', async () => {
    captureInstallPrompt(window);
    await mount({ source: 'test' });
    expect(container.textContent).not.toContain('Install PoeTech on this device');
    await act(async () => { window.dispatchEvent(fakeInstallEvent()); });
    expect(container.textContent).toContain('Install PoeTech on this device');
  });
});
