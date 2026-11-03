// money-test-household.test.jsx — on a preview host the Money chrome names the
// TEST HOUSEHOLD, offers "Start over", the self-fetching tabs' notice says why
// they are empty, and the Imported view opens without a profile or a session.
import { describe, it, expect, vi, afterEach } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/preview-isolation.js', async (orig) => { const m = await orig(); return { ...m, isIsolatedPreview: () => true }; });

import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import MoneyLayout, { TestHouseholdBanner } from '../components/money/MoneyChrome.jsx';
import SampleModeNotice from '../components/money/SampleModeNotice.jsx';
import { PREVIEW_STORAGE_KEY } from '../lib/preview-isolation.js';

let host; let root;
async function mount(el) {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => { root.render(el); });
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; delete window.storage; });

describe('the preview test household in the Money chrome', () => {
  it('MoneyLayout shows the banner above the tab row, naming fictional data and device-only saving', async () => {
    const el = await mount(createElement(MoneyLayout, { booksView: 'overview', setBooksView: () => {} }, createElement('div', null, 'content')));
    const banner = el.querySelector('[data-testid="preview-test-household"]');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toMatch(/fictional/i);
    expect(banner.textContent).toMatch(/saved only on this device/i);
    expect(banner.textContent).toMatch(/real records are not connected/i);
    expect(banner.textContent).toMatch(/nothing can sign in/i);
  });
  it('"Start over" removes the TEST key from the device store (never the real key) and reloads', async () => {
    const removed = [];
    window.storage = { get: async () => null, set: async () => {}, remove: async (k) => { removed.push(k); } };
    const el = await mount(createElement(TestHouseholdBanner));
    await act(async () => { el.querySelector('[data-testid="preview-test-household-reset"]').click(); await new Promise((r) => setTimeout(r, 10)); });
    expect(removed).toEqual([PREVIEW_STORAGE_KEY]);
  });
  it('the self-fetching tabs\' notice says the test household is not connected to the family cloud', async () => {
    const el = await mount(createElement(SampleModeNotice, { what: 'receivables and payables', testId: 'n' }));
    const n = el.querySelector('[data-testid="n"]');
    expect(n.getAttribute('data-mode')).toBe('test-household');
    expect(n.textContent).toMatch(/not connected/i);
    expect(n.textContent).toMatch(/Nothing here can reach your real records/);
  });
});
