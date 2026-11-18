// @vitest-environment jsdom
// =============================================================================
// The church office board (DR-1550): the door and the Times tab show the
// month's calendar, the latest Letter from BG and the flyers exactly as the
// office published them, through the same-origin relay; when nothing was
// read, nothing is painted; the feature card names the posted calendar.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchOfficeBoard from '../components/lovecorner/ChurchOfficeBoard.jsx';
import LoveCornerHome from '../components/lovecorner/LoveCornerHome.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { featureCards } from '../lib/home-week.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const MON_9AM = new Date('2026-11-16T15:00:00Z');

const DIGEST = {
  calendar: {
    label: 'November 2026',
    month: { month: 11, year: 2026, label: 'November 2026' },
    path: '/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg',
    src: '/api/church-site?asset=%2Fuploads%2F6%2F0%2F6%2F7%2F6067835%2F11-november-2026-calendar_orig.jpg',
    sourceUrl: 'https://www.thechurchofthelivinggod.com/calendar.html',
  },
  letter: {
    label: 'October 2026 letter',
    month: null,
    path: '/uploads/6/0/6/7/6067835/october-2026-letter_orig.jpg',
    src: '/api/church-site?asset=%2Fuploads%2F6%2F0%2F6%2F7%2F6067835%2Foctober-2026-letter_orig.jpg',
    sourceUrl: 'https://www.thechurchofthelivinggod.com/letters-from-bg.html',
  },
  events: {
    intro: 'Take a look at what’s happening now at The Love Corner.',
    flyers: [{ path: '/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg', src: '/api/church-site?asset=x', name: 'Battle Cry Sunday Veterans' }],
    sourceUrl: 'https://www.thechurchofthelivinggod.com/current-events.html',
  },
  serviceTimes: ['SUNDAY WORSHIP EXPERIENCE : 11:00 AM'],
  fetchedAt: '2026-11-18T14:48:30.000Z',
};

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const q = (sel) => container.querySelector(sel);
const qa = (sel) => [...container.querySelectorAll(sel)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

describe('the board shows what the office published', () => {
  it('the calendar, the letter and the flyers, every picture through the relay, with the time it was read', () => {
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: DIGEST })));
    expect(q('[data-testid="church-office-board"]')).toBeTruthy();
    const cal = q('[data-testid="church-office-calendar"] img');
    expect(cal.getAttribute('src')).toBe(DIGEST.calendar.src);
    expect(cal.getAttribute('alt')).toBe('November 2026 church calendar');
    expect(q('[data-testid="church-office-calendar"] figcaption').textContent).toContain('November 2026');
    expect(q('[data-testid="church-office-letter"] img').getAttribute('src')).toBe(DIGEST.letter.src);
    expect(q('[data-testid="church-office-events"]').textContent).toContain('Battle Cry Sunday Veterans');
    expect(qa('[data-testid="church-office-flyer"]').length).toBe(1);
    expect(q('[data-testid="church-office-read-at"]').textContent).toMatch(/Read from the church website/);
    for (const img of qa('img')) expect(img.getAttribute('src')).toMatch(/^\/api\/church-site\?asset=/);
  });
  it('a picture opens full size in the app and closes again', () => {
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: DIGEST })));
    expect(q('[data-testid="church-office-full"]')).toBeNull();
    click(q('[data-testid="church-office-calendar"] button'));
    const full = q('[data-testid="church-office-full"]');
    expect(full).toBeTruthy();
    expect(full.querySelector('img').getAttribute('src')).toBe(DIGEST.calendar.src);
    click(q('[data-testid="church-office-close"]'));
    expect(q('[data-testid="church-office-full"]')).toBeNull();
  });
  it('paints nothing when nothing was read: no board, no guessed news', () => {
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: null })));
    expect(q('[data-testid="church-office-board"]')).toBeNull();
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: { calendar: null, letter: null, events: null, serviceTimes: [], fetchedAt: '' } })));
    expect(q('[data-testid="church-office-board"]')).toBeNull();
  });
});

describe('the Love Corner door reads the site through the relay', () => {
  const relayAnswer = (page) => ({
    page,
    url: `https://www.thechurchofthelivinggod.com/${page}.html`,
    fetchedAt: '2026-11-18T14:48:30.000Z',
    html:
      page === 'calendar'
        ? '<div id="wsite-content"><h2 class="wsite-content-title">november 2026</h2><img src="/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg" alt="Picture" /></div>'
        : '<div id="wsite-content"></div>',
    images: [],
  });
  it('shows the office board with the month calendar and the feature card names it', async () => {
    const fetchImpl = vi.fn(async (url) => ({ ok: true, json: async () => relayAnswer(new URL(url, 'https://poetech.us').searchParams.get('page')) }));
    vi.stubGlobal('fetch', fetchImpl);
    act(() => root.render(createElement(LoveCornerHome, { church: COLG_DEFAULT_CHURCH, now: MON_9AM })));
    await flush();
    await flush();
    expect(fetchImpl.mock.calls.map((c) => c[0]).sort()).toEqual([
      '/api/church-site?page=calendar',
      '/api/church-site?page=current-events',
      '/api/church-site?page=home',
      '/api/church-site?page=letters-from-bg',
    ]);
    expect(q('[data-testid="church-office-board"]')).toBeTruthy();
    expect(q('[data-testid="church-office-calendar"] img').getAttribute('src')).toMatch(/11-november-2026-calendar_orig\.jpg/);
    const card = q('[data-testid="lc-feature-office-calendar"]');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('November 2026: the church calendar is posted');
    expect(q('[data-testid="lc-feature-no-events"]')).toBeNull();
  });
  it('when the relay fails the door stands as before: no board, the honest no-announcements card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    act(() => root.render(createElement(LoveCornerHome, { church: COLG_DEFAULT_CHURCH, now: MON_9AM })));
    await flush();
    await flush();
    expect(q('[data-testid="church-office-board"]')).toBeNull();
    expect(q('[data-testid="lc-feature-no-events"]')).toBeTruthy();
  });
  it("never asks the relay for a church whose site is not the church's own", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal('fetch', fetchImpl);
    act(() =>
      root.render(createElement(LoveCornerHome, { church: { ...COLG_DEFAULT_CHURCH, name: 'Another Church', site: 'https://example.org' }, now: MON_9AM }))
    );
    await flush();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('the feature card', () => {
  it('names the posted calendar when no announced event is coming, and yields to a real announced event', () => {
    const office = { calendar: { label: 'November 2026' } };
    const ids = (cards) => cards.map((c) => c.id);
    expect(ids(featureCards({ services: [], announcedEvents: [], office, now: MON_9AM }))).toContain('office-calendar');
    expect(ids(featureCards({ services: [], announcedEvents: [], office: null, now: MON_9AM }))).toContain('no-events');
    const soon = [{ id: 'evt-x', name: 'Harvest Dinner', date: '2026-11-20' }];
    expect(ids(featureCards({ services: [], announcedEvents: soon, office, now: MON_9AM }))).toContain('event-evt-x');
  });
});
