// @vitest-environment jsdom
// =============================================================================
// LearningShelves + LessonVideo — the store's course and workshop shelves say
// what they see, and a lesson paints a player only when one is recorded
// (DR-1448)
// =============================================================================
// Copy and behavior together (DR-0691): where a shelf promises a state, a
// test renders that state and reads the words a person would read.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { CoursesShelf, WorkshopsShelf, GovernorLearningLedger } from '../components/LearningShelves.jsx';
import LessonVideo from '../components/LessonVideo.jsx';
import { catalogProductLines } from '../lib/learning-products.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const EV = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const notOpen = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }));
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function fakeClient({ rows = [], error = null, seats = 5, regs = [], token = 'tok' } = {}) {
  const chain = (data) => {
    const q = { data, error };
    for (const m of ['select', 'in', 'gte', 'order']) q[m] = () => q;
    q.then = (res) => res({ data, error });
    return q;
  };
  return {
    from: (table) => chain(table === 'workshop_events' ? rows : regs),
    rpc: async () => ({ data: seats }),
    auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) },
  };
}
const row = (over = {}) => ({
  id: EV,
  course_key: 'banking',
  title: 'Banking: a day',
  location_label: 'Champaign, IL',
  location_tier: 'city',
  format: 'day',
  starts_at: '2099-12-06T15:00:00Z',
  capacity: 20,
  price_cents: 20000,
  currency: 'usd',
  status: 'open',
  ...over,
});

let host = null;
let root = null;
async function draw(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root.render(el);
  });
  await flush();
  return host;
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null;
  host = null;
});

const lines = catalogProductLines();

describe('the courses shelf', () => {
  it('lists every registered course from the live registry, with its measured walk-through coverage and what opens it', async () => {
    const h = await draw(createElement(CoursesShelf, { lines, client: fakeClient(), fetchImpl: notOpen }));
    expect(h.querySelector('[data-testid="courses-shelf"]').getAttribute('data-count')).toBe(String(LEARN_CATALOG.length));
    const first = h.querySelector('[data-testid="course-product"]');
    expect(first.querySelector('[data-testid="course-video-coverage"]').textContent).toMatch(/Walk-throughs recorded: \d+ of \d+/);
    expect(first.textContent).toMatch(/lessons in \d+ sections/);
    expect(first.querySelector('a').getAttribute('href')).toMatch(/course=/);
    expect(h.querySelectorAll('[data-testid="course-product"][data-requires="poetech-plus"]').length).toBeGreaterThan(0);
    expect(h.querySelector('[data-testid="poetech-plus"]')).toBeTruthy();
    const more = [...h.querySelectorAll('button')].find((b) => /^All \d+ courses$/.test(b.textContent));
    await act(async () => {
      more.click();
    });
    expect(h.querySelectorAll('[data-testid="course-product"]').length).toBe(LEARN_CATALOG.length);
  });
});

describe('the workshops shelf', () => {
  it('says plainly when nothing is open, and when the list could not be read', async () => {
    const h = await draw(createElement(WorkshopsShelf, { client: fakeClient({ rows: [] }) }));
    expect(h.querySelector('[data-testid="workshops-none"]').textContent).toMatch(/No workshop is open for seats yet/);
    const h2 = await draw(createElement(WorkshopsShelf, { client: fakeClient({ rows: [], error: 'boom' }) }));
    expect(h2.querySelector('[data-testid="workshops-unreachable"]').textContent).toMatch(/could not be read/);
  });
  it('an open event shows its date in Central time, its price and seats, and a signed-in person can take a seat through /api/checkout', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init) => {
      calls.push({ url, init });
      return { ok: false, status: 400, json: async () => ({ error: 'sold-out' }) };
    });
    const h = await draw(createElement(WorkshopsShelf, { client: fakeClient({ rows: [row()], seats: 3 }), fetchImpl, nowIso: '2026-11-12T00:00:00Z' }));
    const card = h.querySelector('[data-testid="workshop-event"]');
    expect(card.textContent).toMatch(/Dec 6, 2099/);
    expect(card.textContent).toMatch(/CST/);
    expect(card.querySelector('[data-testid="workshop-price"]').textContent).toBe('$200.00 a seat · 3 of 20 seats left');
    const buy = card.querySelector('[data-testid="take-a-seat"]');
    expect(buy.textContent).toBe('Take a seat');
    await act(async () => {
      buy.click();
    });
    await flush();
    expect(calls[0].url).toBe('/api/checkout');
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ kind: 'workshop', eventId: EV });
    expect(h.querySelector('[role="status"]').textContent).toMatch(/Every seat is taken/);
  });
  it('a signed-out person is told to sign in; a held seat says so; a sold-out event offers no button', async () => {
    const h = await draw(createElement(WorkshopsShelf, { client: fakeClient({ rows: [row()], token: '' }), nowIso: '2026-11-12T00:00:00Z' }));
    expect(h.querySelector('[data-testid="seat-sign-in"]').textContent).toMatch(/Sign in to take a seat/);
    expect(h.querySelector('[data-testid="take-a-seat"]')).toBeNull();
    const h2 = await draw(
      createElement(WorkshopsShelf, { client: fakeClient({ rows: [row()], regs: [{ event_id: EV, status: 'paid' }] }), nowIso: '2026-11-12T00:00:00Z' })
    );
    expect(h2.querySelector('[data-testid="seat-held"]').textContent).toBe('Your seat is held');
    const h3 = await draw(
      createElement(WorkshopsShelf, { client: fakeClient({ rows: [row({ status: 'sold-out' })], seats: 0 }), nowIso: '2026-11-12T00:00:00Z' })
    );
    expect(h3.querySelector('[data-testid="take-a-seat"]')).toBeNull();
    expect(h3.textContent).toMatch(/Every seat is taken/);
  });
});

describe("the Governor's ledger", () => {
  it('answers how many books the courses make, measured, and prices a seat with its parts', async () => {
    const h = await draw(createElement(GovernorLearningLedger, { lines }));
    const sec = h.querySelector('[data-testid="governor-learning-ledger"]');
    expect(Number(sec.getAttribute('data-titles'))).toBeGreaterThanOrEqual(5);
    expect(h.querySelector('[data-testid="book-count-line"]').textContent).toMatch(/\d+ courses measure to \d+ book titles \(\d+ volumes\)/);
    expect(h.querySelectorAll('[data-testid="book-fitness-table"] tbody tr').length).toBe(LEARN_CATALOG.length);
    expect(h.querySelector('[data-testid="book-compilations"]').textContent).toMatch(/Real Estate/);
    const price = h.querySelector('[data-testid="seat-price"]');
    expect(price.textContent).toMatch(/a seat|An offering/);
    expect(h.querySelector('[data-testid="awaiting-sources"]').textContent).toMatch(/Acrobat/);
  });
});

describe('the Governor opens a workshop from the store', () => {
  it('the button says what it waits for, then posts an open row under the house instance', async () => {
    const inserted = [];
    const client = {
      ...fakeClient(),
      from: (t) => ({
        insert: (row) => {
          inserted.push({ t, row });
          return { select: () => ({ single: () => Promise.resolve({ data: { id: EV }, error: null }) }) };
        },
      }),
    };
    const INST = 'ffffffff-1111-4222-8333-444444444444';
    const h = await draw(createElement(GovernorLearningLedger, { lines, client, instanceId: INST }));
    const btn = h.querySelector('[data-testid="open-workshop"]');
    expect(btn.disabled).toBe(true);
    expect(h.querySelector('[data-testid="opener-waits-for"]').textContent).toBe('Name the place.');
    const set = (label, value) => {
      const input = [...h.querySelectorAll('[data-testid="workshop-opener"] label')].find((l) => l.textContent.startsWith(label)).querySelector('input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      set('Place', 'Champaign, IL');
    });
    await act(async () => {
      set('When', '2099-12-06T09:00');
    });
    await act(async () => {
      set('Seats', '20');
    });
    expect(h.querySelector('[data-testid="open-workshop"]').disabled).toBe(false);
    expect(h.querySelector('[data-testid="opener-waits-for"]')).toBeNull();
    await act(async () => {
      h.querySelector('[data-testid="open-workshop"]').click();
    });
    await flush();
    expect(h.querySelector('[data-testid="opener-result"]').getAttribute('data-ok')).toBe('yes');
    expect(inserted[0].t).toBe('workshop_events');
    expect(inserted[0].row).toMatchObject({ instance_id: INST, status: 'open', capacity: 20, location_label: 'Champaign, IL', course_key: lines[0].key });
    expect(inserted[0].row.price_cents).toBe(lines[0].workshop.recommendedCents);
    expect(inserted[0].row.title).toBe(`${lines[0].title}: a workshop`);
  });
});

describe('LessonVideo', () => {
  it('renders nothing for a reader when nothing is recorded, a Governor line instead, and a player when one is', async () => {
    const none = await draw(createElement(LessonVideo, { lesson: { title: 'L' } }));
    expect(none.querySelector('[data-testid="lesson-video"]')).toBeNull();
    const gov = await draw(createElement(LessonVideo, { lesson: { title: 'L' }, isGovernor: true }));
    expect(gov.querySelector('[data-testid="lesson-video"]').getAttribute('data-state')).toBe('not-recorded');
    const yt = await draw(createElement(LessonVideo, { lesson: { title: 'L', video: { url: 'https://youtu.be/dQw4w9WgXcQ', seconds: 600 } } }));
    expect(yt.querySelector('iframe').getAttribute('src')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(yt.textContent).toMatch(/Walk-through: L · 10 min/);
    const file = await draw(createElement(LessonVideo, { lesson: { title: 'L', video: { url: '/media/x.mp4' } } }));
    expect(file.querySelector('video').getAttribute('src')).toBe('/media/x.mp4');
  });
});
