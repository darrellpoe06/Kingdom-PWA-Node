// =============================================================================
// A guest reports a problem from inside the door (DR-0898, 0261)
// =============================================================================
// Darrell, 2026-10-10: "even a person walking through an Airbnb or short-term
// rental works great for getting work done or issues with systems or cleaning
// done asap".
//
// The pure address and form rules; the guest's page (names the door, sends,
// says it was sent, passes the database's refusal through, says a dead card is
// dead); and the family's card (off until opened, then the code and the link,
// replaced, closed). The database walls are proven by
// infra/supabase/tests/0261-guest-report-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { reportUrl, readReportToken, validateGuestReport, guestCardCaption, REPORT_PARAM } from '../modules/properties/guest-report.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TOKEN = 'a'.repeat(32) + '0123456789abcdef0123456789abcdef';
const H = vi.hoisted(() => ({ door: null, link: null, sent: [], opened: 0, closed: 0, refuse: null }));

vi.mock('../modules/properties/cloud.js', () => ({
  loadGuestDoor: async (token) => ({ ok: true, door: token === H.liveToken ? H.door : null }),
  submitGuestReport: async (row) => { H.sent.push(row); return H.refuse ? { ok: false, reason: H.refuse } : { ok: true }; },
  loadGuestLink: async () => ({ ok: true, token: H.link }),
  openGuestLink: async () => { H.opened += 1; H.link = (H.opened % 2 ? 'b' : 'c').repeat(64); return { ok: true, token: H.link }; },
  closeGuestLink: async () => { H.closed += 1; H.link = null; return { ok: true }; },
}));

import { GuestReportPage, GuestLinkCard } from '../modules/properties/GuestReport.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { door: null, link: null, sent: [], opened: 0, closed: 0, refuse: null, liveToken: null });
});
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const text = () => container.textContent || '';
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));
async function click(re) {
  const b = button(re);
  if (!b) throw new Error(`no button ${re}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function type(id, value) {
  const el = container.querySelector(`#${id}`);
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('the card\'s address and the form rules (pure)', () => {
  it('a card carries a 64-hex key and nothing else; a mangled one reads as none', () => {
    expect(reportUrl(TOKEN)).toMatch(new RegExp(`/properties/\\?${REPORT_PARAM}=${TOKEN}$`));
    expect(reportUrl('not-a-key')).toBeNull();
    expect(readReportToken(`?report=${TOKEN.toUpperCase()}`)).toBe(TOKEN);
    expect(readReportToken('?report=abc')).toBeNull();
    expect(readReportToken('?apply=00000000-0000-4000-a000-000000000000')).toBeNull();
  });
  it('the form asks for what is wrong and refuses what the database would refuse', () => {
    expect(validateGuestReport({ title: ' ' }).errors.title).toMatch(/what is wrong/);
    expect(validateGuestReport({ title: 'x'.repeat(161) }).errors.title).toMatch(/160/);
    expect(validateGuestReport({ title: 'Fan rattles', detail: 'x'.repeat(2001) }).errors.detail).toBeTruthy();
    expect(validateGuestReport({ title: 'Fan rattles', name: 'Ana', contact: '555' }).ok).toBe(true);
    expect(guestCardCaption('The Short Stay')).toBe('Something wrong at The Short Stay? Scan to tell us. No account needed.');
  });
});

describe('the guest\'s page', () => {
  it('names the door, sends the report with the card\'s key, and says it was sent', async () => {
    H.liveToken = TOKEN; H.door = { label: '805 North Prospect Avenue', unit: 'Apt 2' };
    await mount(createElement(GuestReportPage, { token: TOKEN }));
    expect(text()).toContain('805 North Prospect Avenue · Apt 2');
    await click(/^Send it to the host$/);
    expect(H.sent).toHaveLength(0);
    expect(text()).toContain('Say what is wrong in a few words.');
    await type('gr-title', 'Exhaust fan rattles');
    await type('gr-detail', 'Loud all night');
    await type('gr-name', 'Ana');
    await click(/^Send it to the host$/);
    expect(H.sent).toEqual([{ token: TOKEN, title: 'Exhaust fan rattles', detail: 'Loud all night', name: 'Ana', contact: '', urgent: false }]);
    expect(text()).toContain('Thank you, it is sent');
  });
  it('passes the database\'s refusal through in its own words', async () => {
    H.liveToken = TOKEN; H.door = { label: 'The Short Stay', unit: null };
    H.refuse = 'Several reports have already come from this place recently. Please call or text your host.';
    await mount(createElement(GuestReportPage, { token: TOKEN }));
    await type('gr-title', 'Another one');
    await click(/^Send it to the host$/);
    expect(text()).toContain('Please call or text your host.');
    expect(text()).not.toContain('Thank you, it is sent');
  });
  it('a replaced or closed card says so and offers no form', async () => {
    H.liveToken = 'f'.repeat(64);
    await mount(createElement(GuestReportPage, { token: TOKEN }));
    expect(text()).toContain('This card is not active');
    expect(container.querySelector('#gr-title')).toBeNull();
  });
});

describe('the family\'s card on a door', () => {
  const RENTAL = { id: 'r-apt2', display_name: '805 North Prospect Avenue', unit: 'Apt 2' };
  it('is off until opened; opened it shows the code and the link; replaced it changes; closed it is off again', async () => {
    await mount(createElement(GuestLinkCard, { rental: RENTAL }));
    expect(text()).toContain('Off until you open it');
    expect(container.querySelector('svg')).toBeNull();
    await click(/^Open a guest card$/);
    expect(H.opened).toBe(1);
    expect(container.querySelector('svg')).not.toBeNull();
    const first = container.querySelector('[data-testid="guest-link-url"]').textContent;
    expect(first).toContain(`?report=${'b'.repeat(64)}`);
    expect(text()).toContain('Something wrong at 805 North Prospect Avenue · Apt 2?');
    await click(/^New card$/);
    expect(container.querySelector('[data-testid="guest-link-url"]').textContent).toContain(`?report=${'c'.repeat(64)}`);
    await click(/^Close it$/);
    expect(H.closed).toBe(1);
    expect(text()).toContain('Open a guest card');
  });
});
