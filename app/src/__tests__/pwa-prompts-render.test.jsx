// =============================================================================
// PwaPrompts — live render proof for the PWA lifecycle banners extracted from
// the monolith shell (hybrid-modular cutover, Stage 3). Mounts the REAL
// components in jsdom and pins the behavior the shell relied on, so the
// extraction is provably loss-free (DR-0076: verify, don't claim):
//   • UpdatePrompt is silent until the `poetech:updated` event, then shows the
//     confirmation toast.
//   • InstallPrompt is silent by default (no deferred prompt, not iOS).
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { UpdatePrompt, InstallPrompt } from '../components/PwaPrompts.jsx';

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
  try { window.localStorage.removeItem('pwa-install-dismissed'); } catch (e) {}
});

describe('UpdatePrompt — silent until updated, then confirms', () => {
  it('renders nothing before the poetech:updated event', async () => {
    await mount(UpdatePrompt);
    expect(container.textContent).toBe('');
  });

  it('shows the confirmation toast after poetech:updated fires', async () => {
    await mount(UpdatePrompt);
    await act(async () => { window.dispatchEvent(new Event('poetech:updated')); });
    expect(container.textContent).toContain('Updated to the latest version.');
    const toast = container.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast.getAttribute('aria-live')).toBe('polite');
  });
});

describe('InstallPrompt — silent without an install signal', () => {
  it('renders nothing when there is no deferred prompt and not iOS', async () => {
    await mount(InstallPrompt);
    expect(container.textContent).toBe('');
  });

  it('shows the Android nudge after beforeinstallprompt fires', async () => {
    await mount(InstallPrompt);
    await act(async () => {
      const e = new Event('beforeinstallprompt');
      e.prompt = () => {};
      e.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(e);
    });
    expect(container.textContent).toContain('Install PoeTech');
    expect(container.textContent).toContain('Install on this device');
  });
});
