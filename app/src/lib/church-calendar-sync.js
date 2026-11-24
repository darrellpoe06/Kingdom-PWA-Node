// =============================================================================
// church-calendar-sync — the office's calendar rows, read for one church
// (DR-1585)
// =============================================================================
// The rows are ministry_ops (migration 0099) filed under the calendar
// ministry. SCOPE IS THE CHURCH INSTANCE, not the user: a church calendar is
// the church's shared record (USER-ACCOUNTS-AND-HISTORIES-STANDARD keeps a
// person's own history per user; this is not one). RLS is the tenancy gate
// (DR-0060): a signed-in member reads only their own church's member-visible
// rows, the office (owner/admin) reads all of theirs. The church is resolved
// the way every church surface resolves it (lib/church-instance.js) and the
// query names that instance as well, so a reader who belongs to two instances
// still sees one church's calendar.
//
// A read that could not be made is 'unavailable', never an empty calendar
// (DR-1053): the surface says which it is. Bounded by READ_TIMEOUT_MS.
// =============================================================================
import { useCallback, useEffect, useState } from 'react';
import supabase from './supabase.js';
import { churchInstanceResolve } from './church-instance.js';
import { askRole } from './church-access.js';
import { CALENDAR_MINISTRY, encodeDetail, isDateKey } from './church-calendar.js';
import { removalOutcome } from './church-archive.js';

export const READ_TIMEOUT_MS = 8000;
const ROW_COLUMNS = 'id, ministry, title, detail, week_of, member_visible';
// 0343 (DR-1644): which office picture a row was read from, the picture
// itself, the unit whose leadership sent it in, and the event it reuses.
const SOURCE_COLUMNS = 'read_from, picture_path, sent_by_unit, reused_from';

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms));

/** { status: 'ok', rows } | { status: 'signed-out' | 'no-church' | 'unavailable', rows: [] }. Never throws. */
export async function readCalendarRows({ client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = READ_TIMEOUT_MS } = {}) {
  const none = (status) => ({ status, rows: [] });
  try {
    const { data } = await client.auth.getSession();
    if (!data || !data.session) return none('signed-out');
    const church = await Promise.race([resolveChurch(), timeout(timeoutMs)]);
    if (!church || church.timedOut || !church.ok) return none('unavailable');
    if (!church.value) return none('no-church');
    const read = (cols) =>
      client.from('ministry_ops').select(cols).eq('instance_id', church.value).eq('ministry', CALENDAR_MINISTRY).order('week_of', { ascending: true });
    // Newest columns first; until 0343 / 0342 have applied on the database
    // the app reads, the calendar still reads with what is there (DR-1596,
    // DR-1644): no source marks, then nothing archived.
    let res;
    for (const cols of [`${ROW_COLUMNS}, archived_at, ${SOURCE_COLUMNS}`, `${ROW_COLUMNS}, archived_at`, ROW_COLUMNS]) {
      res = await Promise.race([read(cols), timeout(timeoutMs)]);
      if (!res || res.timedOut || !res.error) break;
    }
    if (!res || res.timedOut || res.error) return none('unavailable');
    return { status: 'ok', rows: Array.isArray(res.data) ? res.data : [] };
  } catch {
    return none('unavailable');
  }
}

/** The office's calendar rows for the signed-in reader's church; { status: 'idle' } until enabled. `reload()` reads again after a write. */
export function useChurchCalendarRows(enabled, reader = readCalendarRows) {
  const [state, setState] = useState({ status: 'idle', rows: [] });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', rows: [] });
      return undefined;
    }
    let cancelled = false;
    // A reload keeps the rows on screen while it reads; only the first read shows 'loading'.
    setState((cur) => (cur.status === 'ok' ? cur : { status: 'loading', rows: [] }));
    Promise.resolve()
      .then(() => reader())
      .then((r) => {
        if (!cancelled) setState(r && r.status ? r : { status: 'unavailable', rows: [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable', rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, reader, tick]);
  return { ...state, reload };
}

// ── the office's hand (DR-1586) ──────────────────────────────────────────────
// Only the church office (owner or admin of the church instance) writes. The
// database enforces it (0099's write policies); the client check below only
// decides whether to SHOW the form, and an unanswered check shows nothing
// rather than a form that would fail (DR-1053).
export const WRITE_TIMEOUT_MS = 12000;
export const INSERT_CHUNK = 200;
const isOffice = (role) => role === 'owner' || role === 'admin';

async function officeContext({ client, resolveChurch, timeoutMs }) {
  const { data } = await client.auth.getSession();
  if (!data || !data.session) return { skipped: 'signed-out' };
  const church = await Promise.race([resolveChurch(), timeout(timeoutMs)]);
  if (!church || church.timedOut || !church.ok) return { skipped: 'unavailable' };
  if (!church.value) return { skipped: 'no-church' };
  return { tenantId: church.value, userId: data.session.user.id };
}

/**
 * What the signed-in reader may do to their church's calendar:
 * { canManage (the office), units (the units the office named them a leader
 * over), unavailable }. Asked of church_calendar_can_post() (0343); until it
 * is there, the role alone answers (the office, no units). Never throws;
 * unknown is not a yes.
 */
export async function getCalendarAccess({ client = supabase, resolveChurch = churchInstanceResolve, roleOf = askRole, timeoutMs = READ_TIMEOUT_MS } = {}) {
  const no = (unavailable) => ({ canManage: false, units: [], unavailable });
  try {
    const ctx = await officeContext({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return no(ctx.skipped === 'unavailable');
    const asked = await Promise.race([client.rpc('church_calendar_can_post', { instance_in: ctx.tenantId }), timeout(timeoutMs)]);
    if (asked && !asked.timedOut && !asked.error && asked.data && typeof asked.data === 'object') {
      const units = Array.isArray(asked.data.units) ? asked.data.units.filter((u) => typeof u === 'string' && u.trim()) : [];
      return { canManage: asked.data.office === true, units, unavailable: false };
    }
    if (asked && !asked.timedOut && asked.error && !rpcMissing(asked.error)) return no(true);
    const role = await Promise.race([roleOf(ctx.tenantId), timeout(timeoutMs)]);
    if (!role || role.timedOut || !role.ok) return no(true);
    return { canManage: isOffice(role.value), units: [], unavailable: false };
  } catch {
    return no(true);
  }
}

/**
 * One event added by a person through church_calendar_post() (0343): the
 * office for the church (unit '') or any unit, a named leader for their unit.
 * `reusedFrom` is the row id of the past event it was made from ("Use
 * again"). { saved: 1, id } or { skipped: reason }. Until 0343 is there, the
 * office's own add (addCalendarEvents) files it. Never throws.
 */
export async function postCalendarEvent(ev, { unit = '', reusedFrom = null, client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = WRITE_TIMEOUT_MS } = {}) {
  if (!ev || !String(ev.name || '').trim() || !isDateKey(ev.date)) return { skipped: 'invalid', saved: 0 };
  try {
    const ctx = await officeContext({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return { skipped: ctx.skipped, saved: 0 };
    const res = await Promise.race([
      client.rpc('church_calendar_post', {
        instance_in: ctx.tenantId,
        title_in: String(ev.name).trim(),
        date_in: ev.date,
        detail_in: encodeDetail({ time: ev.time, place: ev.place, endDate: ev.endDate, detail: ev.detail }) || null,
        unit_in: String(unit || '').trim() || null,
        reused_from_in: reusedFrom || null,
      }),
      timeout(timeoutMs),
    ]);
    if (!res || res.timedOut) return { skipped: 'timeout', saved: 0 };
    if (!res.error) return { saved: 1, id: res.data || null };
    if (rpcMissing(res.error) && !unit) return addCalendarEvents([ev], { client, resolveChurch, timeoutMs });
    return { skipped: 'refused', saved: 0 };
  } catch {
    return { skipped: 'unavailable', saved: 0 };
  }
}

/** One calendar record as the row the office files. */
export function toCalendarRow(ev, { tenantId, userId }) {
  return {
    instance_id: tenantId,
    ministry: CALENDAR_MINISTRY,
    title: ev.name,
    detail: encodeDetail({ time: ev.time, place: ev.place, endDate: ev.endDate, detail: ev.detail }) || null,
    week_of: ev.date,
    status: 'todo',
    member_visible: true,
    created_by: userId,
  };
}

/**
 * Files the events for the office's own church: { saved: n } or
 * { skipped: reason, saved: n-so-far }. Every row carries the resolved church
 * instance; an event with no name or no real date is refused before anything
 * is sent. Never throws.
 */
export async function addCalendarEvents(events, { client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = WRITE_TIMEOUT_MS } = {}) {
  const list = Array.isArray(events) ? events : [];
  if (!list.length) return { skipped: 'empty', saved: 0 };
  if (list.some((e) => !e || !String(e.name || '').trim() || !isDateKey(e.date))) return { skipped: 'invalid', saved: 0 };
  let saved = 0;
  try {
    const ctx = await officeContext({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return { skipped: ctx.skipped, saved };
    for (let i = 0; i < list.length; i += INSERT_CHUNK) {
      const rows = list.slice(i, i + INSERT_CHUNK).map((e) => toCalendarRow(e, ctx));
      const res = await Promise.race([client.from('ministry_ops').insert(rows), timeout(timeoutMs)]);
      if (!res || res.timedOut) return { skipped: 'timeout', saved };
      if (res.error) return { skipped: 'refused', saved };
      saved += rows.length;
    }
    return { saved };
  } catch {
    return { skipped: 'unavailable', saved };
  }
}

/**
 * The office's Remove (DR-1596). The database decides through
 * church_calendar_remove(): an event that began before today is ARCHIVED
 * (kept in history, with who and when), one from today on is deleted.
 * { removed: true, outcome: 'archived' | 'deleted' } or { skipped: reason }.
 * Until 0342 has applied, only an event from today on may be deleted the old
 * way; a past one is refused rather than lost. Never throws.
 */
export async function removeCalendarEvent(rowId, { date = '', todayKey = '', client = supabase, timeoutMs = WRITE_TIMEOUT_MS } = {}) {
  if (!rowId) return { skipped: 'invalid' };
  try {
    const res = await Promise.race([client.rpc('church_calendar_remove', { row_in: rowId }), timeout(timeoutMs)]);
    if (!res || res.timedOut) return { skipped: 'timeout' };
    if (!res.error && (res.data === 'archived' || res.data === 'deleted')) return { removed: true, outcome: res.data };
    if (!res.error || !rpcMissing(res.error)) return { skipped: 'refused' };
    if (removalOutcome({ date }, todayKey) !== 'delete') return { skipped: 'refused' };
    const del = await Promise.race([client.from('ministry_ops').delete().eq('id', rowId).eq('ministry', CALENDAR_MINISTRY), timeout(timeoutMs)]);
    if (!del || del.timedOut) return { skipped: 'timeout' };
    return del.error ? { skipped: 'refused' } : { removed: true, outcome: 'deleted' };
  } catch {
    return { skipped: 'unavailable' };
  }
}

// PostgREST names a function it does not have PGRST202.
const rpcMissing = (error) => error && (error.code === 'PGRST202' || /could not find the function/i.test(String(error.message || '')));

/** Whether to show the office's tools; false until answered. */
export function useCalendarAccess(enabled, asker = getCalendarAccess) {
  const [access, setAccess] = useState({ canManage: false, units: [], unavailable: false });
  useEffect(() => {
    if (!enabled) {
      setAccess({ canManage: false, units: [], unavailable: false });
      return undefined;
    }
    let cancelled = false;
    Promise.resolve()
      .then(() => asker())
      .then((a) => {
        if (!cancelled)
          setAccess({ canManage: a && a.canManage === true, units: a && Array.isArray(a.units) ? a.units : [], unavailable: !!(a && a.unavailable) });
      })
      .catch(() => {
        if (!cancelled) setAccess({ canManage: false, units: [], unavailable: true });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, asker]);
  return access;
}
