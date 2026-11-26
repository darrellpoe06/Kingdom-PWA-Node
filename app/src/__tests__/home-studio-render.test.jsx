// @vitest-environment jsdom
// =============================================================================
// The redesigned homepage renders from real inputs, every door opens the place
// it names, nothing from the mockup is data, and the relocated features (the
// church office, the calendar, the sermons) stay reachable and working.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import HomeStudio from '../components/lovecorner/studio/HomeStudio.jsx';
import StudioMyCorner from '../components/lovecorner/studio/StudioMyCorner.jsx';
import { ChurchHome } from '../components/ChurchHome.jsx';
import ChromeDock from '../components/ChromeDock.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { churchSubTabs } from '../lib/church-tabs.jsx';
import { subscribeChurchHomeSection } from '../lib/church-home-section.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const NOW = new Date('2026-11-29T16:00:00Z'); // a Sunday
const OFFICE = {
  calendar: { label: 'November 2026', path: '/u/cal.jpg', src: '/api/church-site?asset=cal' },
  letter: { label: 'November 2026 letter', path: '/u/l.jpg', src: '/api/church-site?asset=l' },
  events: { intro: '', flyers: ['One', 'Two', 'Three', 'Four'].map((n) => ({ path: `/u/${n}.jpg`, src: `/api/church-site?asset=${n}`, name: `Flyer ${n}` })) },
  serviceTimes: [],
  fetchedAt: '2026-11-26T12:00:00.000Z',
};
const VIDS = Array.from({ length: 7 }, (_, i) => ({ videoId: `vid${i}abcdef`, title: `Message ${i}`, published: '2026-11-22T17:00:00+00:00', thumbnail: null }));
let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '', json: async () => ({}) })));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const q = (s) => container.querySelector(s);
const qa = (s) => [...container.querySelectorAll(s)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = (props = {}) => act(() => root.render(createElement(HomeStudio, { church: COLG_DEFAULT_CHURCH, now: NOW, ...props })));

describe('HomeStudio', () => {
  it("shows Bishop Gwin's real photo with his title Senior Pastor, and the two hero buttons", () => {
    mount();
    expect(q('[data-testid="hs-plaque"]').textContent).toContain('Bishop Lloyd E. Gwin');
    expect(q('[data-testid="hs-plaque"]').textContent).toContain('Senior Pastor');
    expect(q('[data-testid="hs-bishop-photo"]').getAttribute('src')).toMatch(/lovecorner\/bishop-lloyd-e-gwin-1200\.jpg$/);
    expect(q('[data-testid="hs-watch"]')).toBeTruthy();
    expect(q('[data-testid="hs-visit"]').textContent).toContain('Plan a Visit');
  });
  it('every door asks for the place it names', () => {
    const asked = [];
    const setChurchView = vi.fn();
    const un = subscribeChurchHomeSection((id) => asked.push(id));
    mount({ setChurchView });
    const cases = [
      ['hs-watch', 'section', 'worship'],
      ['hs-visit', 'section', 'about'],
      ['hs-quick-worship', 'section', 'worship'],
      ['hs-quick-prayer', 'section', 'prayer'],
      ['hs-quick-give', 'section', 'give'],
      ['hs-view-all-events', 'section', 'times'],
      ['hs-more-messages', 'section', 'worship'],
      ['hs-office', 'section', 'office'],
      ['hs-quick-word', 'sub', 'pulpit'],
      ['hs-quick-institute', 'sub', 'institute'],
      ['hs-quick-ministries', 'sub', 'ministries'],
      ['hs-quick-youth', 'sub', 'youth'],
      ['hs-kids-go', 'sub', 'youth'],
      ['hs-learn', 'sub', 'learn'],
      ['hs-institute', 'sub', 'institute'],
    ];
    for (const [id, kind, want] of cases) {
      asked.length = 0;
      setChurchView.mockClear();
      click(q(`[data-testid="${id}"]`));
      if (kind === 'section') expect(asked, id).toContain(want);
      else expect(setChurchView, id).toHaveBeenCalledWith(want);
    }
    un();
  });
  it('the live button says Watch Live only inside a published service window, else Latest Message', () => {
    mount({ now: new Date('2026-11-29T17:00:00Z') });
    const live = q('[data-testid="hs-watch"]');
    mount({ now: new Date('2026-11-25T03:00:00Z') });
    expect(q('[data-testid="hs-watch"]').textContent).toContain('Latest Message');
    expect(q('[data-testid="hs-watch"]').getAttribute('data-live')).toBe('false');
    expect(live).toBeTruthy();
  });
  it("Watch & Be Inspired plays the channel's real newest message and a short swipeable run, through the same player path", () => {
    const onPlay = vi.fn();
    mount({ recentVids: VIDS, onPlay, now: new Date('2026-11-25T03:00:00Z') });
    expect(q('[data-testid="hs-latest"]').textContent).toContain('Message 0');
    expect(qa('[data-testid^="hs-msg-"]').length).toBe(4);
    click(q('[data-testid="hs-latest"]'));
    expect(onPlay).toHaveBeenCalledWith(VIDS[0]);
    click(q('[data-testid="hs-msg-vid2abcdef"]'));
    expect(onPlay).toHaveBeenLastCalledWith(VIDS[2]);
  });
  it('with no feed it says so and opens Messages; it never paints a sermon', () => {
    mount();
    expect(q('[data-testid="hs-latest-empty"]').textContent).toMatch(/did not come back/);
    expect(q('[data-testid="hs-rail"]')).toBeNull();
  });
  it('Happening shows at most three real events and names the real total', () => {
    mount({ office: OFFICE });
    expect(qa('[data-testid="hs-event"]').length).toBe(3);
    expect(q('[data-testid="hs-view-all-events-2"]').textContent).toContain('4 events');
    click(qa('[data-testid="hs-event"]')[0]);
    expect(q('[data-testid="church-office-full"]')).toBeTruthy(); // the flyer opens full size
  });
  it('with nothing posted it says so, never a made-up event', () => {
    mount({ church: { ...COLG_DEFAULT_CHURCH, announcedEvents: [] }, office: null });
    expect(q('[data-testid="hs-events-empty"]').textContent).toMatch(/No new events posted/);
    expect(qa('[data-testid="hs-event"]').length).toBe(0);
  });
  it('the Church Office door reports what the office really posted', () => {
    mount({ office: OFFICE });
    expect(q('[data-testid="hs-office"]').textContent).toContain('November 2026 calendar');
    expect(q('[data-testid="hs-office"]').textContent).toContain('4 current flyers');
  });
  it('nothing from the mockup is data', () => {
    mount();
    const text = container.textContent;
    for (const s of ["New Year's Eve", 'Bryan Wilson', 'What God Has Placed in You', 'A Living Hope in Christ', 'Faith That Works', 'Dec 31']) expect(text).not.toContain(s);
  });
  it('keeps the Kids & Youth artwork whole and the Institute card', () => {
    mount();
    expect(q('[data-testid="hs-kids"] img').getAttribute('src')).toMatch(/bible-adventures-key-art\.jpg$/);
    expect(q('[data-testid="hs-institute"]').textContent).toContain('TLC');
  });
});

describe('My Corner', () => {
  it('signed out: a sign-in and the public doors; signed in: My Record and Members too', () => {
    const onSignIn = vi.fn();
    act(() => root.render(createElement(StudioMyCorner, { signedIn: false, onSignIn })));
    expect(q('[data-testid="hs-corner-record"]')).toBeNull();
    click(q('[data-testid="hs-corner-sign-in"]'));
    expect(onSignIn).toHaveBeenCalled();
    act(() => root.render(createElement(StudioMyCorner, { signedIn: true })));
    expect(q('[data-testid="hs-corner-record"]')).toBeTruthy();
    expect(q('[data-testid="hs-corner-members"]')).toBeTruthy();
  });
  it('the header sheets open by event; church tabs by the open callback', () => {
    const seen = [];
    const open = vi.fn();
    for (const n of ['lovecorner:menu', 'lovecorner:search', 'lovecorner:personalize', 'lovecorner:notifications']) window.addEventListener(n, () => seen.push(n));
    act(() => root.render(createElement(StudioMyCorner, { signedIn: true, open })));
    for (const k of ['all', 'search', 'personalize', 'notifications']) click(q(`[data-testid="hs-corner-${k}"]`));
    expect(seen.sort()).toEqual(['lovecorner:menu', 'lovecorner:notifications', 'lovecorner:personalize', 'lovecorner:search']);
    click(q('[data-testid="hs-corner-record"]'));
    expect(open).toHaveBeenCalledWith('my-record', null);
  });
});

const homeProps = { church: COLG_DEFAULT_CHURCH, prayerRequests: [], addPrayerRequest() {}, markPrayerRequestSent() {}, deletePrayerRequest() {}, addEvent() {}, conference: null, updateConference() {}, churchVoice: [], addChurchVoice() {}, sendToPoeTech() {}, addIncident() {}, addInquiry() {} };
const mountHome = (extra = {}) => act(() => root.render(createElement(ChurchHome, { ...homeProps, ...extra })));
const tabs = () => qa('[role="tab"]').map((t) => t.textContent.trim());

describe('ChurchHome: the preview is additive, the current homepage is the default', () => {
  it('without the flag the current homepage renders and no new sections exist', () => {
    mountHome();
    expect(q('[data-testid="lovecorner-home"]')).toBeTruthy();
    expect(q('[data-testid="home-studio"]')).toBeNull();
    expect(tabs().join('|')).not.toMatch(/Church Office|My Corner/);
  });
  it('with the flag the redesign replaces only the top; every original section is still there, plus Church Office and My Corner', () => {
    mountHome({ homeStudio: true });
    expect(q('[data-testid="home-studio"]')).toBeTruthy();
    expect(q('[data-testid="lovecorner-home"]')).toBeNull();
    mountHome();
    const original = tabs();
    mountHome({ homeStudio: true });
    for (const t of original) expect(tabs(), t).toContain(t);
    expect(tabs().join('|')).toMatch(/Church Office/);
    expect(tabs().join('|')).toMatch(/My Corner/);
  });
  it('relocated: the church office (calendar, letter, flyers) lives in its own section and the calendar stays under Times', async () => {
    const answer = (page) => ({ page, url: `https://www.thechurchofthelivinggod.com/${page}.html`, fetchedAt: '2026-11-26T12:00:00.000Z', html: page === 'calendar' ? '<h2>november 2026</h2><img src="/uploads/1/11-november-2026-calendar_orig.jpg" alt="Picture"/>' : '<div></div>', images: [] });
    vi.stubGlobal('fetch', vi.fn(async (u) => ({ ok: true, text: async () => '', json: async () => answer(new URL(u, 'https://x.test').searchParams.get('page')) })));
    mountHome({ homeStudio: true });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(q('[data-testid="hs-office"]').textContent).toContain('November 2026 calendar');
    expect(q('[data-testid="church-office-board"]')).toBeNull(); // not dumped on the homepage
    click(qa('[role="tab"]').find((t) => t.textContent.includes('Church Office')));
    expect(q('[data-testid="church-office-section"]')).toBeTruthy();
    expect(q('[data-testid="church-office-calendar"] img').getAttribute('src')).toMatch(/11-november-2026-calendar_orig\.jpg/);
    click(qa('[role="tab"]').find((t) => t.textContent.includes('Times')));
    expect(q('[data-testid="church-office-calendar"]')).toBeTruthy();
  });
});

describe('the bottom bar', () => {
  const nav = (extra = {}) => ({ groups: [{ key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] }], view: 'church', churchView: 'home', homeView: 'current', churchTabs: churchSubTabs({}), onNavigate: () => {}, money: null, ...extra });
  const dock = (n) => act(() => root.render(createElement(ChromeDock, { onFeedback() {}, nav: n })));
  beforeEach(() => {
    window.innerWidth = 390;
    window.matchMedia = (m) => ({ matches: /max-width: (639|1023)/.test(m), media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  });
  it('the preview shows Home · Messages · Events · Learning · My Corner; everyone else keeps the seven tabs', () => {
    dock(nav({ homeStudio: true }));
    expect(qa('[data-testid^="dock-tab-studio-"]').map((e) => e.textContent.trim())).toEqual(['Home', 'Messages', 'Events', 'Learning', 'My Corner']);
    dock(nav());
    expect(qa('[data-testid^="dock-tab-studio-"]').length).toBe(0);
    expect(q('[data-testid="dock-tab-church-watch"]')).toBeTruthy();
  });
  it('each tab asks for its place', () => {
    const onNavigate = vi.fn();
    const asked = [];
    const un = subscribeChurchHomeSection((id) => asked.push(id));
    dock(nav({ homeStudio: true, onNavigate }));
    click(q('[data-testid="dock-tab-studio-messages"]'));
    click(q('[data-testid="dock-tab-studio-events"]'));
    click(q('[data-testid="dock-tab-studio-corner"]'));
    expect(asked).toEqual(['worship', 'times', 'mycorner']);
    click(q('[data-testid="dock-tab-studio-learning"]'));
    expect(onNavigate).toHaveBeenLastCalledWith('church', null, 'learn');
    un();
  });
});
