// =============================================================================
// The App Store SHOWS every app on the shelf — including Poe Properties
// =============================================================================
// Darrell, 2026-08-26: "Is there also a stand alone Poe Properties App? Able to
// be downloaded from our App Store? Like the Ways and documentation state for
// all apps we build." The shelf record is not the answer on its own — the
// question is whether a person opening the store SEES it and can tap it.
// Proven-to-catch: drop the row (or the card's download link) and this fails.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { APP_STORE } from '../lib/app-store.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import AppStore from '../components/AppStore.jsx';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(AppStore)); });
}

describe('the PoeTech App Store shelf', () => {
  it('shows a card for EVERY app in the family — none silently missing', async () => {
    await mount();
    const text = container.textContent;
    for (const a of APP_STORE) {
      expect(text.includes(a.name), `${a.name} is on the shelf record but not on the screen`).toBe(true);
    }
  });

  it('Poe Properties is there, with both install paths a person can actually tap', async () => {
    await mount();
    expect(container.textContent).toMatch(/Poe Properties/);
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs, 'no Android package link for Poe Properties').toContain('/store/apk/properties.apk');
    expect(hrefs.some((h) => /poetech\.us\/properties/.test(h || '')), 'no web install link for Poe Properties').toBe(true);
  });

  it('names who the properties app is FOR — a tenant reading the shelf should recognize it', async () => {
    await mount();
    const row = APP_STORE.find((a) => a.key === 'properties');
    expect(row.blurb).toMatch(/tenant/i);
    expect(row.blurb).toMatch(/1099/);
    expect(container.textContent).toContain(row.blurb);
  });
});
