// @vitest-environment jsdom
//
// About sideways-sub-tabs render (DR-0116 front-door sweep; DR-0167). The About
// page — the app's worst "everything buried down a long scroll" surface — is now
// SectionTabs like the other ~30 surfaces. This proves the behavior end-to-end
// (DR-0076 §7, the verification the anonymous profile-gate blocks in a real
// browser): the tablist mounts, the default panel (pricing) shows, a non-active
// section's copy is NOT in the DOM until its tab is opened (lazy panel mount),
// clicking a tab swaps the panel, and the steward-only tabs appear only with data.
import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import About from '../components/About.jsx';

const base = {
  moduleInterest: {},
  toggleModuleInterest: vi.fn(),
  theme: 'cream',
  setTheme: vi.fn(),
  feedback: [],
  deleteFeedback: vi.fn(),
  checkoutIntents: [],
  addCheckoutIntent: vi.fn(),
  deleteCheckoutIntent: vi.fn(),
  addProject: vi.fn(),
  VIEW_TIER_REQUIREMENTS: {},
};

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(About, { ...base, ...props })); });
  return { host, root, cleanup: () => { act(() => root.unmount()); host.remove(); } };
}

describe('About — sideways section tabs', () => {
  it('mounts the About sections tablist', () => {
    const { host, cleanup } = mount();
    const tablist = host.querySelector('[role="tablist"][aria-label="About sections"]');
    expect(tablist).toBeTruthy();
    // The nine always-on sections, in order.
    const tabs = [...host.querySelectorAll('[id^="about-tab-"]')].map((b) => b.id);
    expect(tabs).toEqual([
      'about-tab-pricing', 'about-tab-mission', 'about-tab-modules',
      'about-tab-serve', 'about-tab-ari', 'about-tab-community',
      'about-tab-bookstore', 'about-tab-sponsors', 'about-tab-settings',
    ]);
    cleanup();
  });

  it('shows pricing by default and lazily mounts other panels only when opened', () => {
    const { host, cleanup } = mount();
    // Default panel: pricing content is present.
    expect(host.textContent).toContain('What you actually get');
    // A different section's distinctive copy is NOT in the DOM yet (lazy mount).
    expect(host.textContent).not.toContain('A stronghold for relationships with Yahweh');

    // Open Mission → its copy appears, pricing panel unmounts.
    const missionTab = host.querySelector('#about-tab-mission');
    act(() => { missionTab.click(); });
    expect(host.textContent).toContain('A stronghold for relationships with Yahweh');
    expect(host.textContent).not.toContain('What you actually get');
    cleanup();
  });

  it('the cart modal and credits footer live OUTSIDE the tabs (always reachable)', () => {
    const { host, cleanup } = mount();
    // Footer credit is always present regardless of active tab.
    expect(host.textContent).toContain('Emoji artwork from the Twemoji project');
    // Switch tabs; footer still there.
    act(() => { host.querySelector('#about-tab-sponsors').click(); });
    expect(host.textContent).toContain('Emoji artwork from the Twemoji project');
    cleanup();
  });

  it('long panels carry a 3rd-row sub-tab strip (DR-0116 rule 1)', () => {
    const { host, cleanup } = mount();
    // Pricing (default panel) nests a sub-row that splits the long tier lists.
    const pricingSub = host.querySelector('[role="tablist"][aria-label="Plan options"]');
    expect(pricingSub).toBeTruthy();
    expect([...host.querySelectorAll('[id^="about-pricing-tab-"]')].map((b) => b.id)).toEqual([
      'about-pricing-tab-free', 'about-pricing-tab-paid', 'about-pricing-tab-justice', 'about-pricing-tab-adopt',
    ]);

    // Modules: open the 2nd-row tab, then its 3rd-row splits by real status.
    act(() => { host.querySelector('#about-tab-modules').click(); });
    const modSub = host.querySelector('[role="tablist"][aria-label="Module status"]');
    expect(modSub).toBeTruthy();
    // Default sub = Live: a live module shows, a vision-only module does not.
    expect(host.textContent).toContain('Multi-entity bookkeeping');       // financial, status="active"
    expect(host.textContent).not.toContain('Ethical purchase program for elderly homeowners'); // home-legacy, vision
    act(() => { host.querySelector('#about-modules-tab-vision').click(); });
    expect(host.textContent).toContain('Ethical purchase program for elderly homeowners'); // now the vision panel

    // Sponsors: its whole panel is a 3rd-row (ethics default).
    act(() => { host.querySelector('#about-tab-sponsors').click(); });
    expect(host.querySelector('[role="tablist"][aria-label="Sponsor sections"]')).toBeTruthy();
    expect(host.textContent).toContain('Sponsorship & Advertising Ethics'); // ethics default
    expect(host.textContent).not.toContain('Vetting Framework');            // vetting is another sub-tab
    act(() => { host.querySelector('#about-sponsors-tab-vetting').click(); });
    expect(host.textContent).toContain('Vetting Framework');
    cleanup();
  });

  it('the steward-only Feedback / Checkout tabs appear only when they hold data', () => {
    const empty = mount();
    expect(empty.host.querySelector('#about-tab-feedback')).toBeNull();
    expect(empty.host.querySelector('#about-tab-intents')).toBeNull();
    empty.cleanup();

    const withData = mount({
      feedback: [{ id: 'f1', area: 'Books', createdAt: '2026-07-10', whatsWorking: 'clean' }],
      checkoutIntents: [{ id: 'c1', name: 'A', email: 'a@b.co', tierName: 'PoeTech+', billing: 'monthly', price: '39', action: 'subscribe', at: '2026-07-10' }],
    });
    expect(withData.host.querySelector('#about-tab-feedback')).toBeTruthy();
    expect(withData.host.querySelector('#about-tab-intents')).toBeTruthy();
    withData.cleanup();
  });
});
