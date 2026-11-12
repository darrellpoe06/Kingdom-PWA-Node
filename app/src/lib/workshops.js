// =============================================================================
// workshops — the app's half of the in-person workshop seat (DR-1444)
// =============================================================================
// Reads the OPEN events the house has posted (workshop_events, migration 0322;
// RLS shows only open and sold-out rows), counts the seats left through the
// database's own function, and starts the Stripe checkout for a seat the way
// PoeTech+ does (poetech-plus.js): a signed-in buyer, the server's price,
// never the client's. Every call has a timeout; an answer that is not the
// server's own "yes" reads as no (DR-0076).
// =============================================================================
import { TIMEOUT_MS, returnPaths, sayCheckoutError } from './poetech-plus.js';
import { getInstanceId } from './table-sync.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

/** A row from the table, in the app's shape. Pure. */
export function normalizeEvent(row = {}) {
  return {
    id: asStr(row.id),
    courseKey: asStr(row.course_key),
    title: asStr(row.title),
    location: asStr(row.location_label),
    locationTier: asStr(row.location_tier) || 'city',
    format: asStr(row.format) || 'day',
    startsAt: asStr(row.starts_at),
    endsAt: asStr(row.ends_at),
    capacity: Number.isFinite(row.capacity) ? row.capacity : 0,
    priceCents: Number.isFinite(row.price_cents) ? row.price_cents : 0,
    currency: asStr(row.currency) || 'usd',
    goingRateNote: asStr(row.going_rate_note),
    status: asStr(row.status) || 'draft',
    seatsLeft: Number.isFinite(row.seats_left) ? row.seats_left : null,
  };
}

/** The open events, soonest first. -> { ok, events } ; ok false when the database did not answer. */
export async function listOpenWorkshops(client, nowIso = new Date().toISOString()) {
  try {
    if (!client || typeof client.from !== 'function') return { ok: false, events: [] };
    const q = client.from('workshop_events').select('*').in('status', ['open', 'sold-out']).gte('starts_at', nowIso).order('starts_at', { ascending: true });
    const { data, error } = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (error || !Array.isArray(data)) return { ok: false, events: [] };
    const events = data.map(normalizeEvent);
    // Seats left, one call per event, each with the same timeout; a count
    // that did not come back stays null (unknown is not "plenty").
    if (typeof client.rpc === 'function') {
      await Promise.all(
        events.map(async (e) => {
          try {
            const r = await Promise.race([
              client.rpc('workshop_seats_left', { p_event: e.id }),
              new Promise((res) => setTimeout(() => res({ data: null }), TIMEOUT_MS)),
            ]);
            if (r && Number.isFinite(r.data)) e.seatsLeft = r.data;
          } catch {
            /* stays null */
          }
        })
      );
    }
    return { ok: true, events };
  } catch {
    return { ok: false, events: [] };
  }
}

/** A draft the Governor fills in -> the row to insert, or { errors } naming what is missing. Pure. */
export function eventRowFrom(draft = {}, instanceId = '') {
  const errors = [];
  const title = asStr(draft.title).trim();
  const location = asStr(draft.location).trim();
  const starts = new Date(asStr(draft.startsAt));
  const capacity = Number(draft.capacity);
  const priceCents = Number(draft.priceCents);
  if (!asStr(draft.courseKey)) errors.push('Choose the course it walks through.');
  if (!title) errors.push('Give it a title.');
  if (!location) errors.push('Name the place.');
  if (!Number.isFinite(starts.getTime()) || starts.getTime() <= Date.now()) errors.push('Pick a date and time that is still ahead.');
  if (!(Number.isInteger(capacity) && capacity > 0)) errors.push('Say how many seats (a whole number above 0).');
  if (!(Number.isInteger(priceCents) && priceCents >= 0)) errors.push('Set the seat price (0 for an offering).');
  if (!asStr(instanceId)) errors.push('Sign in to the house: an event belongs to its instance.');
  if (errors.length) return { errors };
  return {
    row: {
      instance_id: instanceId,
      course_key: asStr(draft.courseKey),
      title,
      location_label: location,
      location_tier: ['rural', 'city', 'metro', 'major-metro'].includes(draft.locationTier) ? draft.locationTier : 'city',
      format: ['half-day', 'day', 'two-day'].includes(draft.format) ? draft.format : 'day',
      starts_at: starts.toISOString(),
      capacity,
      price_cents: priceCents,
      currency: 'usd',
      going_rate_note: asStr(draft.goingRateNote).trim() || null,
      status: 'open',
    },
  };
}

/** The Governor opens an event for seats (owner-scoped RLS). -> { ok, id } or { ok: false, errors|error }. */
export async function openWorkshopEvent(client, draft, { instanceId } = {}) {
  try {
    if (!client || typeof client.from !== 'function') return { ok: false, error: 'no-client' };
    const inst = asStr(instanceId) || (await getInstanceId().catch(() => null)) || '';
    const built = eventRowFrom(draft, inst);
    if (built.errors) return { ok: false, errors: built.errors };
    const q = client.from('workshop_events').insert(built.row).select('id').single();
    const { data, error } = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (error || !data || !asStr(data.id)) return { ok: false, error: asStr(error && error.message) || asStr(error) || 'not-written' };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: asStr(e && e.message) || 'not-written' };
  }
}

/** The person's own registrations (RLS returns only theirs). -> { ok, eventIds } */
export async function mySeats(client) {
  try {
    if (!client || typeof client.from !== 'function') return { ok: false, eventIds: [] };
    const q = client.from('workshop_registrations').select('event_id,status').in('status', ['paid', 'attended']);
    const { data, error } = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (error || !Array.isArray(data)) return { ok: false, eventIds: [] };
    return { ok: true, eventIds: data.map((r) => asStr(r.event_id)).filter(Boolean) };
  } catch {
    return { ok: false, eventIds: [] };
  }
}

/** Start the Stripe checkout for one seat. Returns { url } or { error }. */
export async function startSeatCheckout({ token, eventId, pathname, search, fetchImpl } = {}) {
  if (!token) return { error: 'sign-in-required' };
  if (!asStr(eventId)) return { error: 'unknown-event' };
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return { error: 'no-fetch' };
  const { successUrl, cancelUrl } = returnPaths(pathname, search);
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const res = await f('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: 'workshop', eventId: asStr(eventId), successUrl, cancelUrl }),
      ...(ctl ? { signal: ctl.signal } : {}),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && asStr(data.url).startsWith('https://')) return { url: data.url };
    return { error: asStr(data && data.error) || `http-${res.status}` };
  } catch (e) {
    return { error: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    if (t) clearTimeout(t);
  }
}

const SAY = Object.freeze({
  'unknown-event': 'That workshop is not open for seats right now. Nothing was charged.',
  'sold-out': 'Every seat is taken. Nothing was charged.',
  'event-unreachable': 'The seat count could not be read. Nothing was charged; try again in a moment.',
});

/** Plain words for a server answer about a seat. Pure. */
export function saySeatError(code) {
  return SAY[code] || sayCheckoutError(code);
}

/** "Sat 2026-12-06 · 9:00 AM CST" from a timestamp, in Central time (Darrell's zone). Pure. */
export function whenLabel(iso) {
  const d = new Date(asStr(iso));
  if (!Number.isFinite(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** The events a person may still buy into: open, in the future, with a seat left (or an unknown count). Pure. */
export function buyable(events, nowIso = new Date().toISOString()) {
  const now = Date.parse(nowIso);
  return asArr(events).filter((e) => e.status === 'open' && Date.parse(e.startsAt) > now && (e.seatsLeft === null || e.seatsLeft > 0));
}
