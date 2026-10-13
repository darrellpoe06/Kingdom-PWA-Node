// =============================================================================
// GIVE AT THE TOP + the giver's own record — live render proof.
// =============================================================================
// Darrell, 2026-09-08, from the live Love Corner door: "always have a give
// button at the top so it's always there... not just the floating button... so
// parishioners can give tithes offerings and gifts... etc... also keep their
// history."
//
// This mounts the REAL components in jsdom (Verification Doctrine: observe the
// actual surface, never claim it) and proves the three things asked for:
//   1. a Give button that is a fixed part of the top chrome, NOT a floater;
//   2. it opens the same panel — the church's own channels, the Word, and now
//      the record;
//   3. the record keeps a real history, totals it correctly, and NEVER poses as
//      a church-issued contribution statement.
//
// The sync layer is mocked so this test proves the SURFACE, not the network.
// The logic under those totals is pinned separately in giving-records.test.js.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const fetchMyGiving = vi.fn();
const recordGiving = vi.fn();
const removeGiving = vi.fn();

// Mock ONLY the network edge; every pure helper the surface uses is the real one.
vi.mock('../lib/giving-records-sync.js', async () => {
  const pure = await vi.importActual('../lib/giving-records.js');
  return { ...pure, fetchMyGiving, recordGiving, removeGiving };
});
// The Call-to-Give archive shares the panel; stub its fetch so this test isn't
// measuring that surface's network behavior (it has its own tests).
vi.mock('../lib/call-to-give-sync.js', () => ({
  fetchCallToGiveArchive: () => Promise.resolve({ archive: [] }),
}));

const { ChurchGiveHeaderButton, ChurchGivePanel } = await import('../components/ChurchGiving.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COLG = {
  name: 'The Church of the Living God',
  site: 'https://thechurchofthelivinggod.com',
  links: { give: 'https://thechurchofthelivinggod.com' },
};

const GIFTS = [
  { id: 'g1', remoteUuid: 'u1', givenOn: '2026-09-06', cents: 25000, fund: 'tithe',    fundNote: '', method: 'zelle',    reference: '', note: '', createdAt: '2026-09-06T10:00:00Z' },
  { id: 'g2', remoteUuid: 'u2', givenOn: '2026-09-06', cents: 5000,  fund: 'offering', fundNote: '', method: 'cashapp',  reference: '', note: 'harvest', createdAt: '2026-09-06T11:00:00Z' },
  { id: 'g3', remoteUuid: 'u3', givenOn: '2025-12-28', cents: 10000, fund: 'tithe',    fundNote: '', method: 'givelify', reference: '', note: '', createdAt: '2025-12-28T10:00:00Z' },
];

let container, root;
beforeEach(() => {
  vi.clearAllMocks();
  fetchMyGiving.mockResolvedValue({ ok: true, records: [] });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

// flush — let the record's load effect settle before asserting on it.
async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }

const headerBtn = () => container.querySelector('button[aria-label^="Give to the church"]');

describe('ChurchGiveHeaderButton — Give, at the top, always there', () => {
  it('renders in the flow of the top chrome — NOT a floater', async () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    const btn = headerBtn();
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/Give/);
    // THE DISTINCTION Darrell drew: "not just the floating button." A fixed
    // button is positioned out of flow; this one must sit IN the header row.
    expect(btn.className).not.toMatch(/\bfixed\b/);
    expect(btn.className).not.toMatch(/bottom-/);
  });

  it('carries the cross-device SVG gift icon, never an emoji', async () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    const btn = headerBtn();
    expect(btn.querySelector('svg')).toBeTruthy();
    expect(/[\u{1F300}-\u{1FAFF}]/u.test(btn.textContent)).toBe(false);
  });

  it('keeps the label visible and names tithes, offerings and gifts for a screen reader', () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    const btn = headerBtn();
    expect(btn.textContent).toMatch(/Give/); // never collapses to a bare icon
    expect(btn.getAttribute('aria-label')).toMatch(/tithes, offerings and gifts/i);
  });

  it('meets the tap-target and focus-visibility minimums the header row holds', () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    const cls = headerBtn().className;
    expect(cls).toMatch(/min-h-\[44px\]/);
    expect(cls).toMatch(/focus:outline/);
    expect(cls).toMatch(/ts-chrome-region/); // scales with the header, not the body text
  });

  it('opens the same giving panel — the church\'s own channels and the Word', async () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    act(() => headerBtn().dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await flush();
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    expect(container.textContent).toContain('Zelle');
    expect(container.textContent).toContain('Malachi 3:10');
    expect(container.textContent).toMatch(/My giving record/i);
  });

  it('closes again, leaving the button where it was', async () => {
    act(() => root.render(createElement(ChurchGiveHeaderButton, { church: COLG })));
    act(() => headerBtn().dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await flush();
    const close = Array.from(container.querySelectorAll('button')).find((b) => /Close/.test(b.textContent));
    act(() => close.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(headerBtn()).toBeTruthy();
  });
});

describe('My giving record — the history, kept honestly', () => {
  const openPanel = async () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: COLG, onClose: () => {} })));
    await flush();
  };

  it('always states whose record this is — never poses as a church statement', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: GIFTS });
    await openPanel();
    expect(container.textContent).toMatch(/your own record of what you gave/i);
    expect(container.textContent).toMatch(/church office/i);
  });

  it('lists the real gifts and totals them exactly', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: GIFTS });
    await openPanel();
    const text = container.textContent;
    expect(text).toContain('$250.00');   // the tithe
    expect(text).toContain('$50.00');    // the offering
    expect(text).toContain('$100.00');   // last year's tithe
    expect(text).toContain('$400.00');   // all-years total, derived
    expect(text).toMatch(/3 gifts/);
    expect(text).toContain('Tithe');
    expect(text).toContain('Offering');
  });

  it('offers only the years that actually have gifts', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: GIFTS });
    await openPanel();
    const select = container.querySelector('#giving-year');
    const years = Array.from(select.options).map((o) => o.value);
    expect(years).toEqual(['all', '2026', '2025']);
  });

  it('an empty record says so plainly — it never paints a $0 total', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: [] });
    await openPanel();
    expect(container.textContent).toMatch(/Nothing recorded yet/i);
    expect(container.querySelector('#giving-year')).toBeNull(); // no year picker over no gifts
    expect(container.textContent).not.toMatch(/\$0\.00/);
  });

  // THE HONEST-STATES CLASS (DR-0076). Four different truths, four different
  // surfaces. The failure this gates: telling a signed-IN member to sign in
  // because a read hiccuped — which is the app lying about why it is empty.
  it('a failed read reports a connection problem, NOT a sign-in problem', async () => {
    fetchMyGiving.mockResolvedValue({ ok: false, reason: 'error', records: [] });
    await openPanel();
    const alert = container.querySelector('[role="alert"]');
    expect(alert.textContent).toMatch(/connection problem, not a sign-in problem/i);
    expect(alert.textContent).not.toMatch(/^Sign in/);
    expect(alert.querySelector('button').textContent).toMatch(/Try again/i);
  });

  it('a signed-out visitor is invited to sign in — and told the record follows their account', async () => {
    fetchMyGiving.mockResolvedValue({ ok: false, reason: 'signed-out', records: [] });
    await openPanel();
    expect(container.textContent).toMatch(/Sign in to keep a record/i);
    expect(container.textContent).toMatch(/follows you to any device/i);
  });

  it('an unlinked account is told giving still works right now', async () => {
    fetchMyGiving.mockResolvedValue({ ok: false, reason: 'no-church', records: [] });
    await openPanel();
    expect(container.textContent).toMatch(/isn.t linked to the church yet/i);
    expect(container.textContent).toMatch(/giving itself works right now/i);
  });

  it('records a gift through the form and shows it immediately', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: [] });
    recordGiving.mockResolvedValue({
      ok: true,
      record: { id: 'g9', remoteUuid: 'u9', givenOn: '2026-09-07', cents: 7500, fund: 'offering', fundNote: '', method: 'zelle', reference: '', note: '', createdAt: '2026-09-07T10:00:00Z' },
    });
    await openPanel();

    const openForm = Array.from(container.querySelectorAll('button')).find((b) => /Record a gift/i.test(b.textContent));
    act(() => openForm.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    const setValue = (sel, value) => {
      const el = container.querySelector(sel);
      const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      act(() => el.dispatchEvent(new Event('change', { bubbles: true })));
    };
    setValue('#giving-amount', '75');
    setValue('#giving-date', '2026-09-07');
    setValue('#giving-fund', 'offering');
    setValue('#giving-method', 'zelle');

    await act(async () => { container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();

    expect(recordGiving).toHaveBeenCalledTimes(1);
    expect(recordGiving.mock.calls[0][0]).toMatchObject({ amount: '75', givenOn: '2026-09-07', fund: 'offering', method: 'zelle' });
    expect(container.textContent).toContain('$75.00');
    expect(container.textContent).toMatch(/Thank you for your faithfulness/i);
  });

  it('refuses an invalid gift at the surface — no write is attempted', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: [] });
    await openPanel();
    const openForm = Array.from(container.querySelectorAll('button')).find((b) => /Record a gift/i.test(b.textContent));
    act(() => openForm.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    // Submit with the amount left blank.
    await act(async () => { container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(recordGiving).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/Enter the amount you gave/i);
  });

  it('grounds its owner-only privacy in the Word, quoted as ESV', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: GIFTS });
    await openPanel();
    expect(container.textContent).toContain('Matthew 6:3-4');
    expect(container.textContent).toMatch(/left hand know what your right hand is doing/);
    expect(container.textContent).toMatch(/visible to you alone/i);
  });

  it('adds no outbound links of its own — the link-safety rule is untouched', async () => {
    fetchMyGiving.mockResolvedValue({ ok: true, records: GIFTS });
    await openPanel();
    const record = Array.from(container.querySelectorAll('h4')).find((h) => /My giving record/i.test(h.textContent)).parentElement;
    expect(record.querySelectorAll('a[href]').length).toBe(0);
  });
});
