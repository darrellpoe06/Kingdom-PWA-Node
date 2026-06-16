// =============================================================================
// conference-sync — Supabase-backed Conference / Event Center (the REAL
// multi-attendee system)
// =============================================================================
// Mirrors choir-sync.js / engagement-sync.js: tenant resolution via
// churchInstanceId() before any write (so RLS passes), and a postgres_changes
// realtime stream so every leader's + attendee's device updates live. Backed by
// conferences / event_center_resources / event_sessions / event_participants
// (infra/supabase/migrations-auto/0023-conference-event-center.sql).
//
// SHARED + REALTIME: all subscribers fetch the FULL instance-scoped set (RLS
// scopes it to the caller's instance — no leak) and re-fetch on any change, so
// RSVPs / meals / sessions / rooms are identical across devices.
//
// PRESERVES the concurrent build's work: meals + Service<->Choir live in
// lib/conference.js (pure shapes/logic) and are re-exported + reused here, never
// re-implemented. A main_service session references a choir sermon (sermon_ref)
// + an ordered song set (music_set) resolved LIVE from the choir lists.
//
// ACCESS: read = any instance member (user_in_instance); organizing writes =
// owner/admin; a member registers their OWN attendance. getConferenceAccess()
// mirrors this for the UI; RLS is the real enforcement either way.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import {
  MEAL_TYPES, normalizeMealType, aggregateMeals, mealCountRows,
  isMainService, resolveServiceSermon, resolveServiceSongs, toggleSongId,
} from './conference.js';

// Re-export the preserved meal + Service<->Choir helpers so callers have ONE
// import surface and the shapes stay single-sourced.
export {
  MEAL_TYPES, normalizeMealType, aggregateMeals, mealCountRows,
  isMainService, resolveServiceSermon, resolveServiceSongs, toggleSongId,
};

export const SESSION_TYPES = ['main_service', 'breakout', 'other'];
// What a room can be used for, so the right module picks the right room.
export const USE_TYPES = ['service', 'class', 'food', 'facility'];
export const REGISTRATION_STATUSES = ['registered', 'waitlist', 'cancelled', 'checked_in'];
// Statuses that occupy a seat (for capacity math). Cancelled + waitlist do not.
const SEAT_STATUSES = new Set(['registered', 'checked_in']);

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session.user.email?.split('@')[0] || 'Member';
}

// --- Pure mappers (DB row -> camelCase shape; exported for tests) ------------

export function toVenueShape(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? null,
    notes: row.notes ?? null,
    sortOrder: row.sort_order ?? 0,
    status: row.status ?? 'active',
  };
}

export function toConferenceShape(row) {
  return {
    id: row.id,
    name: row.name,
    theme: row.theme ?? null,
    host: row.host ?? null,
    location: row.location ?? null,
    venueId: row.venue_id ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    datesLabel: row.dates_label ?? null,
    livestreamUrl: row.livestream_url ?? null,
    siteUrl: row.site_url ?? null,
    status: row.status ?? 'active',
    createdAt: row.created_at ?? null,
  };
}

export function toRoomShape(row) {
  return {
    id: row.id,
    venueId: row.venue_id ?? null,
    name: row.name,
    capacity: Number.isFinite(row.capacity) ? row.capacity : (row.capacity ?? null),
    features: Array.isArray(row.features) ? row.features : [],
    useTypes: Array.isArray(row.use_types) ? row.use_types : [],
    locationNote: row.location_note ?? null,
    sortOrder: row.sort_order ?? 0,
    status: row.status ?? 'active',
  };
}

export function toSessionShape(row) {
  return {
    id: row.id,
    conferenceId: row.conference_id,
    day: row.day ?? null,
    sessionDate: row.session_date ?? null,
    time: row.time ?? null,
    title: row.title,
    speaker: row.speaker ?? null,
    sessionType: row.session_type ?? 'breakout',
    venueId: row.venue_id ?? null,
    roomResourceId: row.room_resource_id ?? null,
    capacity: row.capacity ?? null,
    sermonRef: row.sermon_ref ?? null,
    musicSet: Array.isArray(row.music_set) ? row.music_set : [],
    sortOrder: row.sort_order ?? 0,
    status: row.status ?? 'active',
  };
}

export function toParticipantShape(row, myUserId) {
  return {
    id: row.id,
    conferenceId: row.conference_id,
    sessionId: row.session_id ?? null,
    userId: row.user_id ?? null,
    name: row.name,
    mealType: normalizeMealType(row.meal_type),
    dietary: row.dietary ?? null,
    registrationStatus: row.registration_status ?? 'registered',
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? null,
    mine: !!myUserId && (row.user_id === myUserId || row.created_by === myUserId),
  };
}

// --- Pure capacity / breakout logic (the heart of the multi-attendee system) -

// Editor controls render only for owner/admin; RLS still enforces it.
export function deriveAccess(role, inInstance) {
  const canEdit = role === 'owner' || role === 'admin';
  return { canEdit, canSee: canEdit || !!inInstance };
}

// How many participants occupy a seat in a given session (registered +
// checked_in; cancelled + waitlist do not count toward capacity).
export function registrationCount(participants, sessionId) {
  return (participants || []).filter(
    (p) => p.sessionId === sessionId && SEAT_STATUSES.has(p.registrationStatus),
  ).length;
}

// Whole-conference RSVPs (session_id null) that occupy a seat.
export function conferenceRsvpCount(participants, conferenceId) {
  return (participants || []).filter(
    (p) => p.conferenceId === conferenceId && p.sessionId == null && SEAT_STATUSES.has(p.registrationStatus),
  ).length;
}

// The effective capacity for a session: its own capacity, else the assigned
// room's capacity, else null (unbounded).
export function effectiveCapacity(session, rooms) {
  if (Number.isFinite(session?.capacity)) return session.capacity;
  const room = (rooms || []).find((r) => r.id === session?.roomResourceId);
  return Number.isFinite(room?.capacity) ? room.capacity : null;
}

// Capacity-vs-registration status for a session. tone drives the UI dot
// (good / attention / problem); never throws on missing capacity.
export function capacityStatus(count, capacity) {
  const n = Number.isFinite(count) ? count : 0;
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { count: n, capacity: null, remaining: null, full: false, over: false, ratio: null, tone: 'idle', label: `${n} registered` };
  }
  const remaining = capacity - n;
  const ratio = n / capacity;
  const over = n > capacity;
  const full = n >= capacity;
  let tone = 'good';
  if (over) tone = 'problem';
  else if (ratio >= 0.9) tone = 'attention';
  const label = over
    ? `${n} / ${capacity} · ${n - capacity} over capacity`
    : full
      ? `${n} / ${capacity} · full`
      : `${n} / ${capacity} · ${remaining} ${remaining === 1 ? 'seat' : 'seats'} left`;
  return { count: n, capacity, remaining, full, over, ratio, tone, label };
}

// Service<->Choir resolved on the DB session shape (sermonRef / musicSet). Same
// logic as conference.js resolveServiceSermon/resolveServiceSongs (kept + re-
// exported for the local path); these adapt it to the synced field names so the
// link is REUSED, never re-implemented divergently.
export function isMainServiceSession(session) {
  return !!(session && session.sessionType === 'main_service');
}
export function sessionSermon(session, sermons) {
  if (!session || !session.sermonRef) return null;
  return (sermons || []).find((s) => s && s.id === session.sermonRef) || null;
}
export function sessionSongs(session, songs) {
  const ids = (session && session.musicSet) || [];
  const byId = new Map((songs || []).map((s) => [s && s.id, s]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

// THE whole-building answer: the breakout sessions running PARALLEL to a given
// main service (same day, session_type 'breakout', active). "How many breakouts
// run while the main space is in use" = breakoutsDuringMainService(...).length.
export function breakoutsDuringMainService(sessions, mainSession) {
  if (!mainSession) return [];
  return (sessions || []).filter(
    (s) =>
      s.id !== mainSession.id &&
      s.status !== 'archived' &&
      s.sessionType === 'breakout' &&
      (s.day || null) === (mainSession.day || null),
  );
}

// Per-day building view: for each main_service, the parallel breakouts + their
// total seat capacity (so a leader sees the whole-building load at a glance).
export function buildingView(sessions, rooms) {
  const mains = (sessions || []).filter((s) => s.sessionType === 'main_service' && s.status !== 'archived');
  return mains.map((main) => {
    const breakouts = breakoutsDuringMainService(sessions, main);
    const totalBreakoutSeats = breakouts.reduce((sum, b) => {
      const cap = effectiveCapacity(b, rooms);
      return sum + (Number.isFinite(cap) ? cap : 0);
    }, 0);
    return { main, breakouts, parallelCount: breakouts.length, totalBreakoutSeats };
  });
}

// Resolve the room object assigned to a session (or null).
export function roomForSession(session, rooms) {
  if (!session?.roomResourceId) return null;
  return (rooms || []).find((r) => r.id === session.roomResourceId) || null;
}

// --- Venues (buildings) ------------------------------------------------------
// Active rooms in a building.
export function roomsForVenue(rooms, venueId) {
  return (rooms || []).filter((r) => r.status !== 'archived' && r.venueId === venueId);
}
// Rooms (optionally within a building) that support a given use_type — so Learn
// picks a 'class' room, meals pick a 'food' room, a service picks a 'service'
// room. A room with no tags is eligible for anything (unscoped).
export function roomsSupporting(rooms, useType, venueId) {
  return (rooms || [])
    .filter((r) => r.status !== 'archived')
    .filter((r) => venueId == null || r.venueId === venueId)
    .filter((r) => !r.useTypes || r.useTypes.length === 0 || r.useTypes.includes(useType));
}
// Total known seats in a building (sum of room capacities; NULLs ignored).
export function venueSeatTotal(rooms, venueId) {
  return roomsForVenue(rooms, venueId).reduce((n, r) => n + (Number.isFinite(r.capacity) ? r.capacity : 0), 0);
}
// Resolve the venue object for a session/room (or null).
export function venueById(venues, venueId) {
  if (!venueId) return null;
  return (venues || []).find((v) => v.id === venueId) || null;
}

// --- Access ------------------------------------------------------------------

export async function getConferenceAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null };
  const [{ data: role }, { data: inInstance }] = await Promise.all([
    supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
    supabase.rpc('user_in_instance', { tenant_uuid: tenantId }),
  ]);
  const { canEdit, canSee } = deriveAccess(role, inInstance);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}

// --- Generic fetch + realtime subscribe (identical pattern to choir-sync) -----

function makeSubscriber(table, mapRow, orderBy) {
  return function subscribe(onChange) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const myUserId = session.user.id;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy
          ? await q.order(orderBy.col, { ascending: orderBy.asc })
          : await q;
        if (error) { console.warn(`[conference-sync] ${table} fetch failed:`, error); return null; }
        return (data || []).map((r) => mapRow(r, myUserId));
      };
      const initial = await fetchAll();
      if (initial && !cancelled) onChange(initial);
      channel = supabase
        .channel(`${table}-stream`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
        })
        .subscribe();
    })();
    return function unsubscribe() {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  };
}

export const subscribeVenues = makeSubscriber('venues', toVenueShape, { col: 'sort_order', asc: true });
export const subscribeConferences = makeSubscriber('conferences', toConferenceShape, { col: 'created_at', asc: true });
export const subscribeRooms = makeSubscriber('event_center_resources', toRoomShape, { col: 'sort_order', asc: true });
export const subscribeSessions = makeSubscriber('event_sessions', toSessionShape, { col: 'sort_order', asc: true });
export const subscribeParticipants = makeSubscriber('event_participants', toParticipantShape, { col: 'created_at', asc: true });

// --- Writes (RLS-enforced; fail soft + surface to caller) --------------------

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveDisplayName(session, displayName) };
}

export async function saveConference(conf, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    name: conf.name ?? '',
    theme: conf.theme ?? null,
    host: conf.host ?? null,
    location: conf.location ?? null,
    venue_id: conf.venueId || null,
    start_date: conf.startDate || null,
    end_date: conf.endDate || null,
    dates_label: conf.datesLabel ?? null,
    livestream_url: conf.livestreamUrl ?? null,
    site_url: conf.siteUrl ?? null,
    status: conf.status ?? 'active',
  };
  if (conf.id) {
    const { error } = await supabase.from('conferences').update({ ...row, updated_by: ctx.userId }).eq('id', conf.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: conf.id };
  }
  const { data, error } = await supabase.from('conferences').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function saveVenue(venue, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    name: venue.name ?? '',
    address: venue.address ?? null,
    notes: venue.notes ?? null,
    sort_order: Number.isFinite(venue.sortOrder) ? venue.sortOrder : 0,
    status: venue.status ?? 'active',
  };
  if (venue.id) {
    const { error } = await supabase.from('venues').update({ ...row, updated_by: ctx.userId }).eq('id', venue.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: venue.id };
  }
  const { data, error } = await supabase.from('venues').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function deleteVenue(id) {
  const { error } = await supabase.from('venues').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

export async function saveRoom(room, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    venue_id: room.venueId || null,
    name: room.name ?? '',
    capacity: Number.isFinite(room.capacity) ? room.capacity : null,
    features: Array.isArray(room.features) ? room.features : [],
    use_types: Array.isArray(room.useTypes) ? room.useTypes : [],
    location_note: room.locationNote ?? null,
    sort_order: Number.isFinite(room.sortOrder) ? room.sortOrder : 0,
    status: room.status ?? 'active',
  };
  if (room.id) {
    const { error } = await supabase.from('event_center_resources').update({ ...row, updated_by: ctx.userId }).eq('id', room.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: room.id };
  }
  const { data, error } = await supabase.from('event_center_resources').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function deleteRoom(id) {
  const { error } = await supabase.from('event_center_resources').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

export async function saveSession(sessionItem, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    conference_id: sessionItem.conferenceId,
    day: sessionItem.day ?? null,
    session_date: sessionItem.sessionDate || null,
    time: sessionItem.time ?? null,
    title: sessionItem.title ?? '',
    speaker: sessionItem.speaker ?? null,
    session_type: SESSION_TYPES.includes(sessionItem.sessionType) ? sessionItem.sessionType : 'breakout',
    venue_id: sessionItem.venueId || null,
    room_resource_id: sessionItem.roomResourceId || null,
    capacity: Number.isFinite(sessionItem.capacity) ? sessionItem.capacity : null,
    sermon_ref: sessionItem.sermonRef || null,
    music_set: Array.isArray(sessionItem.musicSet) ? sessionItem.musicSet : [],
    sort_order: Number.isFinite(sessionItem.sortOrder) ? sessionItem.sortOrder : 0,
    status: sessionItem.status ?? 'active',
  };
  if (sessionItem.id) {
    const { error } = await supabase.from('event_sessions').update({ ...row, updated_by: ctx.userId }).eq('id', sessionItem.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: sessionItem.id };
  }
  const { data, error } = await supabase.from('event_sessions').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function deleteSession(id) {
  const { error } = await supabase.from('event_sessions').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Register attendance. created_by is always the signed-in user (RLS requires
// it); user_id defaults to the signed-in user unless a leader registers someone.
export async function saveParticipant(participant, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    conference_id: participant.conferenceId,
    session_id: participant.sessionId || null,
    user_id: participant.userId ?? ctx.userId,
    name: (participant.name || '').trim() || ctx.displayName,
    meal_type: normalizeMealType(participant.mealType),
    dietary: (participant.dietary || '').trim() || null,
    registration_status: REGISTRATION_STATUSES.includes(participant.registrationStatus)
      ? participant.registrationStatus : 'registered',
  };
  if (participant.id) {
    const { error } = await supabase.from('event_participants').update({ ...row, updated_by: ctx.userId }).eq('id', participant.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: participant.id };
  }
  const { data, error } = await supabase.from('event_participants').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function setRegistrationStatus(id, status) {
  if (!REGISTRATION_STATUSES.includes(status)) return { skipped: 'bad-status' };
  const { error } = await supabase.from('event_participants').update({ registration_status: status }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

export async function deleteParticipant(id) {
  const { error } = await supabase.from('event_participants').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
