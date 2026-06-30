// =============================================================================
// PromoBanners — live render proof for the Foundation-tier advisement & support
// banners extracted from the monolith shell (hybrid-modular cutover, Stage 3).
// Mounts the REAL components in jsdom and pins the behavior the shell relied on
// so the extraction is provably loss-free (DR-0076: verify, don't claim):
//   • SalesFooterBanner is hidden on 'overview', visible elsewhere, dismissible.
//   • TherapyReminder shows the TLC support footer for every tier.
//   • AdvisementBanner shows a family-ministries advisement.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { SalesFooterBanner, TherapyReminder, AdvisementBanner } from '../components/PromoBanners.jsx';

let container, root;
async function mount(Component, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Component, props));
  });
}
const findButton = (re) =>
  [...document.body.querySelectorAll('button')].find((b) => re.test(b.getAttribute('aria-label') || ''));
async function click(el) { await act(async () => { el.click(); }); }

afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('SalesFooterBanner — hidden on overview, dismissible elsewhere', () => {
  it('renders nothing on the overview dashboard', async () => {
    await mount(SalesFooterBanner, { currentView: 'overview', setView: () => {} });
    expect(container.textContent).toBe('');
  });

  it('renders a PoeTech Services pitch on other views', async () => {
    await mount(SalesFooterBanner, { currentView: 'opportunities', setView: () => {} });
    expect(container.textContent).toContain('PoeTech Services');
  });

  it('dismisses to nothing when the dismiss button is clicked', async () => {
    await mount(SalesFooterBanner, { currentView: 'opportunities', setView: () => {} });
    const dismiss = findButton(/Dismiss/);
    expect(dismiss).toBeTruthy();
    await click(dismiss);
    expect(container.textContent).toBe('');
  });
});

describe('TherapyReminder — always-visible support footer', () => {
  it('shows the TLC support message', async () => {
    await mount(TherapyReminder);
    expect(container.textContent).toContain('TLC Therapy Solutions');
    expect(container.textContent).toContain('Book a session');
  });
});

describe('AdvisementBanner — family ministries rotation', () => {
  it('shows a family-ministries advisement on first render', async () => {
    await mount(AdvisementBanner);
    expect(container.textContent).toContain('Advisement');
    // first item in the rotation
    expect(container.textContent).toContain('The Church of the Living God');
  });
});
