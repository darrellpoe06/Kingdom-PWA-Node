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

import { UpdatePrompt, InstallPrompt, applyBootBrandManifest, currentFace } from '../components/PwaPrompts.jsx';

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
  try {
    window.localStorage.removeItem('pwa-install-dismissed');
    window.localStorage.removeItem('pwa-install-dismissed:poetech');
    window.localStorage.removeItem('pwa-install-dismissed:lovecorner');
  } catch (e) {}
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

describe('currentFace — two installable identities on one origin (DR-0133)', () => {
  it('maps church-boot views to the Love Corner face, everything else to PoeTech', () => {
    for (const v of ['church', 'choir', 'engagement', 'pulpit', 'learn', 'events']) {
      expect(currentFace(`?view=${v}`)).toEqual({ key: 'lovecorner', label: 'The Love Corner' });
    }
    expect(currentFace('')).toEqual({ key: 'poetech', label: 'PoeTech' });
    expect(currentFace('?view=books')).toEqual({ key: 'poetech', label: 'PoeTech' });
  });
});

describe('InstallPrompt — per-face dismissal (the 2026-07-30 "can\'t download PoeTech, I have Love Corner" bug)', () => {
  it('a Love Corner dismissal does NOT suppress the PoeTech install banner', async () => {
    // Simulate: the user installed / dismissed Love Corner (its per-face flag set).
    window.localStorage.setItem('pwa-install-dismissed:lovecorner', String(Date.now()));
    // Default (PoeTech) face mount — the banner must still appear on an install signal.
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

  it('a stale PER-ORIGIN legacy flag no longer suppresses either face', async () => {
    window.localStorage.setItem('pwa-install-dismissed', String(Date.now())); // the old shared key
    await mount(InstallPrompt);
    await act(async () => {
      const e = new Event('beforeinstallprompt');
      e.prompt = () => {};
      e.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(e);
    });
    expect(container.textContent).toContain('Install PoeTech'); // banner appears; legacy key ignored
  });
});

describe('applyBootBrandManifest — install identity is a page-load property (DR-0227)', () => {
  const freshDoc = () => {
    const d = document.implementation.createHTMLDocument('t');
    const link = d.createElement('link');
    link.rel = 'manifest';
    link.setAttribute('href', '/manifest.webmanifest');
    d.head.appendChild(link);
    return d;
  };
  it('a church boot swaps the link to the Love Corner manifest (the "already installed" screenshot fix)', () => {
    const d = freshDoc();
    expect(applyBootBrandManifest('?view=church', d)).toBe(true);
    expect(d.querySelector('link[rel="manifest"]').getAttribute('href')).toBe('/manifest-lovecorner.webmanifest');
  });
  it('church ALIAS deep links (choir/engagement/pulpit) swap too', () => {
    for (const v of ['choir', 'engagement', 'pulpit']) {
      const d = freshDoc();
      expect(applyBootBrandManifest(`?view=${v}`, d)).toBe(true);
      expect(d.querySelector('link[rel="manifest"]').getAttribute('href')).toBe('/manifest-lovecorner.webmanifest');
    }
  });
  it('a family boot keeps the PoeTech manifest — no hijack', () => {
    const d = freshDoc();
    expect(applyBootBrandManifest('?view=books', d)).toBe(false);
    expect(d.querySelector('link[rel="manifest"]').getAttribute('href')).toBe('/manifest.webmanifest');
    const d2 = freshDoc();
    expect(applyBootBrandManifest('', d2)).toBe(false);
    expect(d2.querySelector('link[rel="manifest"]').getAttribute('href')).toBe('/manifest.webmanifest');
  });
});
