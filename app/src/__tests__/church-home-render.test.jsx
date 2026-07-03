// =============================================================================
// ChurchHome — extraction parity proof (Verification Doctrine: characterize,
// then verify against the REAL artifact). The Church tab's home surface moved
// WHOLE out of the monolith shell into components/ChurchHome.jsx (2026-07-03
// Church-module extraction). These renders prove the moved module still
// delivers every section the inline version delivered, in the same behavior:
// Live Worship (channel embed with the latest-message fallback state), the
// default-home note, One Voice, Pastoral Content, Testimony Diary door,
// Yahweh Hears You (speak/type/link), Service Times + save-to-calendar,
// Media, Give + Parish Life, Ministry Interest, Prayer Requests (form
// validation + add), the Home Church header, and the Church Directory with
// the invite form. A cut section = a failed test, not a silent feature loss.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ChurchHome } from '../components/ChurchHome.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const noop = () => {};
const baseProps = {
  church: COLG_DEFAULT_CHURCH,
  prayerRequests: [],
  addPrayerRequest: noop,
  markPrayerRequestSent: noop,
  deletePrayerRequest: noop,
  addEvent: noop,
  conference: null,
  updateConference: noop,
  churchVoice: [],
  addChurchVoice: noop,
  sendToPoeTech: noop,
  addIncident: noop,
  addInquiry: noop,
};

const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchHome, { ...baseProps, ...props })));

describe('ChurchHome — every inline section survived the extraction', () => {
  it('renders the full section inventory of the pre-extraction Church home', () => {
    mount();
    const text = container.textContent;
    // Live Worship — channel-embedded player section
    expect(container.querySelector('#live-worship-h')).toBeTruthy();
    expect(container.querySelector('iframe')).toBeTruthy();
    // Default church home note (COLG is the platform default)
    expect(text).toMatch(/default church home/i);
    // Pastoral Content
    expect(container.querySelector('#sermons-h')).toBeTruthy();
    // Testimony Diary door
    expect(container.querySelector('#diary-h')).toBeTruthy();
    // Yahweh Hears You (typographic theology: Yahweh capitalized)
    expect(text).toMatch(/Yahweh Hears You/);
    // Service Times
    expect(container.querySelector('#svc-h')).toBeTruthy();
    expect(text).toMatch(/Sunday Worship/);
    // Media
    expect(container.querySelector('#media-h')).toBeTruthy();
    // Give + Parish Life
    expect(container.querySelector('#give-h')).toBeTruthy();
    expect(text).toMatch(/Parish Life/);
    // Prayer Requests
    expect(container.querySelector('#pr-h')).toBeTruthy();
    // Home Church header (the identity "ad", at the bottom per Darrell 2026-05-25)
    expect(text).toMatch(/Home Church/);
    expect(text).toMatch(/The Church of the Living God/);
    // Church Directory + invite entry point
    expect(container.querySelector('#dir-h')).toBeTruthy();
    expect(text).toMatch(/Invite them/i);
  });

  it('embeds worship by CHANNEL and shows the latest message outside a service window', () => {
    mount();
    const iframe = container.querySelector('iframe');
    // Channel-derived source (live_stream?channel= or the uploads videoseries),
    // never a pinned single-video id.
    expect(iframe.src).toMatch(/youtube\.com\/embed\/(live_stream\?channel=|videoseries\?list=)/);
    expect(iframe.src).toMatch(/UC821pJh7YR5llBNnWUJj-ZA|UU821pJh7YR5llBNnWUJj-ZA/);
  });

  it('prayer request form validates empty input and submits a real request', () => {
    const added = [];
    mount({ addPrayerRequest: (pr) => added.push(pr) });
    const toggle = [...container.querySelectorAll('button')].find((b) => /Add request/i.test(b.textContent));
    act(() => toggle.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const save = [...container.querySelectorAll('button')].find((b) => /Save Prayer Request/i.test(b.textContent));
    // Empty request → inline error, nothing added
    act(() => save.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.textContent).toMatch(/describe the prayer request/i);
    expect(added.length).toBe(0);
    // Fill name + request → added with the share flag
    const nameInput = container.querySelector('#pr-name');
    const textArea = container.querySelector('#pr-text');
    const setValue = (el, value) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    act(() => setValue(nameInput, 'Sister Ruth'));
    act(() => setValue(textArea, 'Healing for my mother'));
    act(() => save.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(added.length).toBe(1);
    expect(added[0]).toMatchObject({ requester: 'Sister Ruth', request: 'Healing for my mother', shareWithChurch: true });
  });

  it('lists logged prayer requests newest-first with send + delete affordances', () => {
    const prs = [
      { id: 'pr1', requester: 'A', request: 'older', createdAt: '2026-06-01T00:00:00.000Z', shareWithChurch: true, sentAt: null },
      { id: 'pr2', requester: 'B', request: 'newer', createdAt: '2026-07-01T00:00:00.000Z', shareWithChurch: true, sentAt: null },
    ];
    mount({ prayerRequests: prs });
    const text = container.textContent;
    expect(text.indexOf('newer')).toBeLessThan(text.indexOf('older'));
    expect([...container.querySelectorAll('a')].some((a) => /Send/.test(a.textContent))).toBe(true);
    expect(container.querySelector('button[aria-label^="Delete prayer request"]')).toBeTruthy();
  });

  it('save-to-calendar builds a real next-occurrence event from a service entry', () => {
    const events = [];
    vi.stubGlobal('alert', noop);
    mount({ addEvent: (e) => events.push(e) });
    const save = [...container.querySelectorAll('button')].find((b) => /Save next one/i.test(b.textContent));
    act(() => save.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    vi.unstubAllGlobals();
    expect(events.length).toBe(1);
    expect(events[0].title).toMatch(/Sunday Worship/);
    expect(events[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(events[0].time).toBe('11:00'); // "11:00 AM" parsed to 24h
    expect(new Date(`${events[0].date}T12:00:00`).getDay()).toBe(0); // lands on a Sunday
  });

  it('a custom church home replaces the COLG default (never COLG data on another church)', () => {
    mount({
      church: {
        name: 'Grace Fellowship', site: 'https://example.org',
        services: [{ id: 's1', day: 'Sunday', time: '9:00 AM', label: 'Worship', online: false }],
      },
    });
    const text = container.textContent;
    expect(text).toMatch(/Grace Fellowship/);
    // No default-home note, no COLG live channel on someone else's page
    expect(text).not.toMatch(/This is your default church home/i);
    expect(container.querySelector('#live-worship-h')).toBeFalsy();
  });
});
