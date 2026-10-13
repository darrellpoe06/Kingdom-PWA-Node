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

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { UpdatePrompt, InstallPrompt, currentFace } from '../components/PwaPrompts.jsx';

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

describe('currentFace — two installable identities on one origin (DR-0133 / DR-0258)', () => {
  it('maps the church PATH and the church-door param to the Love Corner face', () => {
    expect(currentFace('', '/lovecorner/app/')).toEqual({ key: 'lovecorner', label: 'The Love Corner' });
    expect(currentFace('?view=church&lovecorner=1', '/lovecorner/app/')).toEqual({ key: 'lovecorner', label: 'The Love Corner' });
    // Legacy installed Love Corner apps launch the old start_url on the old path.
    expect(currentFace('?view=church&lovecorner=1', '/poetech-app/')).toEqual({ key: 'lovecorner', label: 'The Love Corner' });
  });
  it('the in-app Church tab is a POETECH page — its installable identity is PoeTech (the post-split fix)', () => {
    // Pre-split, ?view=church mapped to the Love Corner face; post-split that
    // page links the PoeTech manifest, so labeling its banner "Love Corner"
    // would install the wrong app under the wrong name.
    expect(currentFace('?view=church', '/poetech-app/')).toEqual({ key: 'poetech', label: 'PoeTech' });
    expect(currentFace('?view=choir', '/poetech-app/')).toEqual({ key: 'poetech', label: 'PoeTech' });
    expect(currentFace('', '/poetech-app/')).toEqual({ key: 'poetech', label: 'PoeTech' });
    expect(currentFace('?view=books', '/poetech-app/')).toEqual({ key: 'poetech', label: 'PoeTech' });
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

describe('install identity is STATIC per served page (DR-0258 — the DR-0227 runtime swap is retired)', () => {
  const src = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
  it('the PoeTech app HTML links ONLY the PoeTech manifest', () => {
    const html = src('../../index.html');
    expect(html).toContain('href="/manifest.webmanifest"');
    expect(html).not.toContain('manifest-lovecorner');
  });
  it('the church app HTML links ONLY the Love Corner manifest', () => {
    const html = src('../../lovecorner/app/index.html');
    expect(html).toContain('href="/manifest-lovecorner.webmanifest"');
    expect(html).not.toContain('href="/manifest.webmanifest"');
  });
  it('no runtime manifest-link swap survives in PwaPrompts (a mid-session swap is the flaky class the split removes)', () => {
    const comp = src('../components/PwaPrompts.jsx');
    expect(comp).not.toContain('applyBootBrandManifest');
    expect(comp).not.toMatch(/link\[rel="manifest"\]/);
  });
});
