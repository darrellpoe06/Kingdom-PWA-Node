// @vitest-environment node
// =============================================================================
// workshops — the app's half of a seat: reads only what the house opened,
// counts seats through the database, and starts checkout as a person (DR-1444)
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { normalizeEvent, listOpenWorkshops, mySeats, startSeatCheckout, saySeatError, whenLabel, buyable, eventRowFrom, openWorkshopEvent } from '../lib/workshops.js';

const EV = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const row = (over = {}) => ({
  id: EV, course_key: 'banking', title: 'Banking: a day', location_label: 'Champaign, IL', location_tier: 'city', format: 'day',
  starts_at: '2026-12-06T15:00:00Z', ends_at: '2026-12-06T21:00:00Z', capacity: 20, price_cents: 20000, currency: 'usd',
  going_rate_note: 'Going rate in Champaign for a day workshop runs $150 to $250.', status: 'open', ...over,
});

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

describe('normalizeEvent', () => {
  it('maps the row and leaves an unknown seat count null (unknown is not plenty)', () => {
    const e = normalizeEvent(row());
    expect(e).toMatchObject({ id: EV, courseKey: 'banking', location: 'Champaign, IL', capacity: 20, priceCents: 20000, status: 'open', seatsLeft: null });
    expect(normalizeEvent({}).status).toBe('draft');
  });
});

describe('listOpenWorkshops / mySeats', () => {
  it('returns the open rows with the database\'s seat count; a client that cannot answer is ok:false, never an empty "no workshops"', async () => {
    const r = await listOpenWorkshops(fakeClient({ rows: [row()], seats: 7 }), '2026-11-12T00:00:00Z');
    expect(r.ok).toBe(true);
    expect(r.events[0].seatsLeft).toBe(7);
    const bad = await listOpenWorkshops(fakeClient({ rows: [], error: 'boom' }));
    expect(bad.ok).toBe(false);
    expect((await listOpenWorkshops(null)).ok).toBe(false);
  });
  it('mySeats returns the paid event ids the person\'s own row holds', async () => {
    const r = await mySeats(fakeClient({ regs: [{ event_id: EV, status: 'paid' }] }));
    expect(r).toEqual({ ok: true, eventIds: [EV] });
    expect((await mySeats(null)).ok).toBe(false);
  });
});

describe('startSeatCheckout', () => {
  it('needs a signed-in person and an event, posts kind workshop with the token, and takes only an https url', async () => {
    expect(await startSeatCheckout({ token: '', eventId: EV })).toEqual({ error: 'sign-in-required' });
    expect(await startSeatCheckout({ token: 't', eventId: '' })).toEqual({ error: 'unknown-event' });
    const calls = [];
    const fetchImpl = vi.fn(async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/c/1' }) }; });
    const r = await startSeatCheckout({ token: 't', eventId: EV, pathname: '/poetech-app/', search: '?tab=books', fetchImpl });
    expect(r).toEqual({ url: 'https://checkout.stripe.com/c/1' });
    expect(calls[0].url).toBe('/api/checkout');
    expect(calls[0].init.headers.Authorization).toBe('Bearer t');
    const body = JSON.parse(calls[0].init.body);
    expect(body).toMatchObject({ kind: 'workshop', eventId: EV });
    expect(body.successUrl).toMatch(/poetech_plus=welcome/);
    expect(body.amountCents).toBeUndefined();
    const bad = await startSeatCheckout({ token: 't', eventId: EV, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ url: 'http://evil' }) }) });
    expect(bad.error).toBe('http-200');
    const err = await startSeatCheckout({ token: 't', eventId: EV, fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: 'sold-out' }) }) });
    expect(err.error).toBe('sold-out');
    expect(saySeatError('sold-out')).toMatch(/Every seat is taken/);
    expect(saySeatError('sign-in-required')).toMatch(/Sign in/);
  });
});

describe('buyable and the label', () => {
  it('only an open, future event with a seat left (or an unknown count) can be bought', () => {
    const now = '2026-11-12T00:00:00Z';
    const open = normalizeEvent(row());
    const past = normalizeEvent(row({ starts_at: '2026-01-01T00:00:00Z' }));
    const sold = normalizeEvent(row({ status: 'sold-out' }));
    const none = { ...open, seatsLeft: 0 };
    const unknown = { ...open, seatsLeft: null };
    expect(buyable([open, past, sold, none, unknown], now).length).toBe(2);
  });
  it('the when label is in Central time, named', () => {
    const s = whenLabel('2026-12-06T15:00:00Z');
    expect(s).toMatch(/Dec 6, 2026/);
    expect(s).toMatch(/9:00 AM CST/);
    expect(whenLabel('nope')).toBe('');
  });
});

describe('the Governor opens an event', () => {
  const good = { courseKey: 'banking', title: 'Banking: a day', location: 'Champaign, IL', locationTier: 'metro', format: 'day', startsAt: '2099-12-06T09:00', capacity: 20, priceCents: 20000, goingRateNote: '' };
  const INST = 'ffffffff-1111-4222-8333-444444444444';
  it('eventRowFrom names every missing piece, and builds an open row with the house instance when whole', () => {
    const bad = eventRowFrom({ ...good, title: '', capacity: 0, startsAt: '2001-01-01T00:00', priceCents: -1 }, '');
    expect(bad.errors).toEqual([
      'Give it a title.', 'Pick a date and time that is still ahead.', 'Say how many seats (a whole number above 0).',
      'Set the seat price (0 for an offering).', 'Sign in to the house: an event belongs to its instance.',
    ]);
    const { row } = eventRowFrom(good, INST);
    expect(row).toMatchObject({ instance_id: INST, course_key: 'banking', title: 'Banking: a day', location_label: 'Champaign, IL', location_tier: 'metro', format: 'day', capacity: 20, price_cents: 20000, currency: 'usd', going_rate_note: null, status: 'open' });
    expect(row.starts_at).toMatch(/^2099-12-06T/);
    expect(eventRowFrom({ ...good, locationTier: 'moon', format: 'week' }, INST).row).toMatchObject({ location_tier: 'city', format: 'day' });
  });
  it('openWorkshopEvent inserts the row and returns its id; a refused write or a missing client is honest', async () => {
    const inserted = [];
    const client = { from: (t) => ({ insert: (row) => { inserted.push({ t, row }); return { select: () => ({ single: () => Promise.resolve({ data: { id: EV }, error: null }) }) }; } }) };
    expect(await openWorkshopEvent(client, good, { instanceId: INST })).toEqual({ ok: true, id: EV });
    expect(inserted[0].t).toBe('workshop_events');
    expect(inserted[0].row.status).toBe('open');
    expect((await openWorkshopEvent(client, { ...good, title: '' }, { instanceId: INST })).errors[0]).toBe('Give it a title.');
    const refused = { from: () => ({ insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy' } }) }) }) }) };
    expect(await openWorkshopEvent(refused, good, { instanceId: INST })).toEqual({ ok: false, error: 'new row violates row-level security policy' });
    expect((await openWorkshopEvent(null, good, { instanceId: INST })).ok).toBe(false);
  });
});
