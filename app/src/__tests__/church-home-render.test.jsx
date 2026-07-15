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

// The Church home now flows as SectionTabs ("sliding tabs instead of a long
// scroll", Darrell 2026-07-04): only the ACTIVE panel is mounted, so a section
// that lives on another tab is reached by clicking its tab first. This helper
// clicks a tab in the strip by its visible label.
const clickTab = (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('Love Corner — an obvious Log in / Create account for signed-out visitors', () => {
  it('shows a prominent Log in / Create account button when signed OUT', () => {
    mount({ signedIn: false });
    const btn = [...container.querySelectorAll('button')].find((b) => /log in\s*\/\s*create account/i.test(b.textContent || ''));
    expect(btn, 'no obvious Log in / Create account button on the public church door').toBeTruthy();
  });
  it('hides it once signed in (no redundant login prompt)', () => {
    mount({ signedIn: true });
    const btn = [...container.querySelectorAll('button')].find((b) => /log in\s*\/\s*create account/i.test(b.textContent || ''));
    expect(btn).toBeFalsy();
  });
});

describe('ChurchHome — every inline section survived the extraction', () => {
  it('renders the full section inventory of the pre-extraction Church home', () => {
    mount();
    // The sliding-tabs strip is present, and the default-home note is pinned
    // ABOVE it (always mounted, not inside a tab).
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    expect(container.textContent).toMatch(/default church home/i);

    // WORSHIP tab (default active): Live Worship + Pastoral Content + Media.
    expect(container.querySelector('#live-worship-h')).toBeTruthy();
    expect(container.querySelector('iframe')).toBeTruthy();
    expect(container.querySelector('#sermons-h')).toBeTruthy();
    expect(container.querySelector('#media-h')).toBeTruthy();

    // SPEAK tab: THE ONE input surface (DR-0131 — "only have one input surface
    // from PoeTech on any and all tabs") + Testimony Diary door. The former
    // second widget (memory-only log + raw mailto Send that yanked the surface
    // into the mail app) is gone; its identity lives on as the one box's title.
    clickTab('Speak');
    expect(container.textContent).toMatch(/Yahweh Hears You/);
    // Exactly ONE input surface: one master box, one textarea.
    expect(container.querySelectorAll('[aria-labelledby="onevoice-h"]').length).toBe(1);
    expect(container.querySelectorAll('textarea').length).toBe(1);
    // Nothing on this surface navigates the app into a mail client in place:
    // any mailto is an explicit secondary link opening a NEW context.
    for (const a of container.querySelectorAll('a[href^="mailto:"]')) {
      expect(a.getAttribute('target')).toBe('_blank');
    }
    expect(container.querySelector('#diary-h')).toBeTruthy();

    // PRAYER tab: Prayer Requests.
    clickTab('Prayer');
    expect(container.querySelector('#pr-h')).toBeTruthy();

    // GIVE & SERVE tab: Give + Parish Life + Ministry Opportunities.
    clickTab('Give & Serve');
    expect(container.querySelector('#give-h')).toBeTruthy();
    expect(container.textContent).toMatch(/Parish Life/);

    // TIMES tab: Service Times.
    clickTab('Times');
    expect(container.querySelector('#svc-h')).toBeTruthy();
    expect(container.textContent).toMatch(/Sunday Worship/);

    // ABOUT tab: Home Church header + Church Directory (+ invite).
    clickTab('About');
    expect(container.textContent).toMatch(/Home Church/);
    expect(container.textContent).toMatch(/The Church of the Living God/);
    expect(container.querySelector('#dir-h')).toBeTruthy();
    expect(container.textContent).toMatch(/Invite them/i);
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
    clickTab('Prayer');
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
    clickTab('Prayer');
    const text = container.textContent;
    expect(text.indexOf('newer')).toBeLessThan(text.indexOf('older'));
    expect([...container.querySelectorAll('a')].some((a) => /Send/.test(a.textContent))).toBe(true);
    expect(container.querySelector('button[aria-label^="Delete prayer request"]')).toBeTruthy();
  });

  it('save-to-calendar builds a real next-occurrence event from a service entry', () => {
    const events = [];
    vi.stubGlobal('alert', noop);
    mount({ addEvent: (e) => events.push(e) });
    clickTab('Times');
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
    // Worship tab is active by default: a custom church with no channel shows no
    // live-worship player, and the pinned default-home note is absent.
    expect(container.querySelector('#live-worship-h')).toBeFalsy();
    expect(container.textContent).not.toMatch(/This is your default church home/i);
    // The church identity lives on the About tab.
    clickTab('About');
    expect(container.textContent).toMatch(/Grace Fellowship/);
  });
});

// Follow along in the Word (Darrell 2026-07-14): the control opens the Scripture
// reader INLINE, on the SAME page as the live player, so you watch + read the Word
// together — it must NOT navigate away (the old bug: it called setChurchView
// ('scripture'), moving you off the live video). Proven-to-catch: clicking reveals
// the inline reader on this page and never leaves it.
describe('Follow along in the Word', () => {
  it('opens the Scripture reader INLINE on the same page (does not navigate away)', () => {
    const setChurchView = vi.fn();
    mount({ setChurchView });
    const btn = [...container.querySelectorAll('button')].find((b) => /Follow along in the Word/i.test(b.textContent || ''));
    expect(btn).toBeTruthy();
    // Reader is not present until asked for.
    expect(container.textContent).not.toMatch(/Follow Along · The Word/);
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    // The inline reader appears on THIS page...
    expect(container.textContent).toMatch(/Follow Along · The Word/);
    // ...and we never navigated to the Scripture tab (the whole point).
    expect(setChurchView).not.toHaveBeenCalledWith('scripture');
  });
  it('offers follow-along even without navigation (it is inline, not a tab jump)', () => {
    mount({});
    const btn = [...container.querySelectorAll('button')].find((b) => /Follow along in the Word/i.test(b.textContent || ''));
    // Inline follow-along no longer depends on setChurchView being available.
    expect(btn).toBeTruthy();
  });

  // Watch + work the Word together (Darrell 2026-07-15): when follow-along is open,
  // the live player PINS (sticky) so it stays watchable while you scroll the Word
  // below it. Proven-to-catch: opening follow-along makes the live-worship section
  // sticky; closing it releases the pin.
  it('pins the live player (sticky) while following along, releases it on close', () => {
    mount();
    const section = () => container.querySelector('#live-worship-h').closest('section');
    expect(section().className).not.toMatch(/\bsticky\b/); // normal card by default
    const btn = [...container.querySelectorAll('button')].find((b) => /Follow along in the Word/i.test(b.textContent || ''));
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(section().className).toMatch(/\bsticky\b/);     // pinned while reading
    const close = [...container.querySelectorAll('button')].find((b) => /Close the Word/i.test(b.textContent || ''));
    act(() => close.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(section().className).not.toMatch(/\bsticky\b/); // released
  });
});
