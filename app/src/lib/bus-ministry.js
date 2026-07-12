// =============================================================================
// bus-ministry — pure domain logic for the Church Bus/Van Ministry surface.
// =============================================================================
// Deacon Anderson runs COLG's bus/van ministry (declared to Darrell 2026-07-12).
// The live pain he named: the schedule comes out, but nobody reminds the drivers
// they are scheduled — "this morning no one's on the phones." So the ministry
// needs, in the app: a driver roster (with phone + email), the weekly Sunday
// schedule (who drives which route, in which van, arrive 9:45 / end ~1:30), a
// REMINDER queue that fires the Thursday before each Sunday, a shared message
// thread everyone sees together, and a dev/ops intake so the ministry can hand
// new requirements to the build team without waiting on a call.
//
// This file is PURE (no Supabase, no React) so every rule below is unit-tested
// as the verification gate (DR-0076). Supabase I/O lives in bus-ministry-sync.js
// and mirrors choir-sync.js; the tables live in
// infra/supabase/migrations-auto/0095-bus-ministry.sql.
//
// Word-first grounding (SCRIPTURE-REFERENCE-STANDARD): the ministry carries a
// burden for one another — "Bear ye one another's burdens, and so fulfil the law
// of Christ" (Galatians 6:2) — and the reminders exist so "all things be done
// decently and in order" (1 Corinthians 14:40).
// =============================================================================

// -----------------------------------------------------------------------------
// Access gate (mirrors choir deriveAccess): read = any ministry member;
// edit = owner/admin (the coordinator is made admin). RLS is the real gate.
// -----------------------------------------------------------------------------
export function deriveAccess(role, inMinistry) {
  const canEdit = role === 'owner' || role === 'admin';
  return { canEdit, canSee: canEdit || !!inMinistry };
}

// -----------------------------------------------------------------------------
// Roles / statuses (single source for the labels the surface renders)
// -----------------------------------------------------------------------------
export const DRIVER_ROLES = [
  ['coordinator', 'Coordinator'],
  ['driver', 'Driver'],
  ['assistant', 'Assistant'],
  ['dispatch', 'Phone / Dispatch'],
];
export const driverRoleLabel = (r) => (DRIVER_ROLES.find(([k]) => k === r)?.[1]) || r;

export const SCHEDULE_STATUS = [
  ['open', 'Open'],
  ['scheduled', 'Scheduled'],
  ['confirmed', 'Confirmed'],
  ['declined', 'Declined'],
  ['covered', 'Covered'],
];
export const scheduleStatusLabel = (s) => (SCHEDULE_STATUS.find(([k]) => k === s)?.[1]) || s;

export const REQUEST_STATUS = [
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['planned', 'Planned'],
  ['shipped', 'Shipped'],
  ['declined', 'Declined'],
];
export const requestStatusLabel = (s) => (REQUEST_STATUS.find(([k]) => k === s)?.[1]) || s;

export const REMINDER_CHANNELS = [
  ['app', 'In-app'],
  ['text', 'Text'],
  ['call', 'Phone call'],
  ['email', 'Email'],
];
export const reminderChannelLabel = (c) => (REMINDER_CHANNELS.find(([k]) => k === c)?.[1]) || c;

// -----------------------------------------------------------------------------
// Starter templates — Deacon Anderson's REAL declared routes + vans. These are
// created by the coordinator with one tap (they never auto-paint a global
// surface; a coordinator confirms them into real, instance-scoped rows), which
// keeps the reality-trace honest: real data enters through a real gesture.
// -----------------------------------------------------------------------------
export const STARTER_ROUTES = [
  { name: 'Champaign — South of Springfield', area: 'Champaign', accessible: false, sortOrder: 1 },
  { name: 'Champaign — North of Springfield', area: 'Champaign', accessible: false, sortOrder: 2 },
  { name: 'Urbana', area: 'Urbana', accessible: false, sortOrder: 3 },
  { name: 'Accessibility (Champaign–Urbana)', area: 'Champaign–Urbana', accessible: true, sortOrder: 4 },
];
export const STARTER_VANS = [
  { name: 'Van 1', capacity: 15, accessible: false },
  { name: 'Van 2', capacity: 15, accessible: false },
  { name: 'Accessibility Van', capacity: 8, accessible: true },
];

export const DEFAULT_ARRIVE = '09:45'; // "quarter to ten" — declared 2026-07-12
export const DEFAULT_END = '13:30';    // "about one thirty" — declared 2026-07-12
export const DEFAULT_REMIND_OFFSET_DAYS = 3; // Sunday − 3 = Thursday (the call sister used to make)

// -----------------------------------------------------------------------------
// Date helpers (UTC-anchored so day-of-week math is deterministic across TZs and
// safe for tests; ISO dates are 'YYYY-MM-DD').
// -----------------------------------------------------------------------------
function toDate(iso) { return new Date(String(iso) + 'T00:00:00Z'); }
function isoOf(d) { return d.toISOString().slice(0, 10); }
export function addDays(iso, n) { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + Number(n)); return isoOf(d); }
export function dayOfWeek(iso) { return toDate(iso).getUTCDay(); } // 0 = Sunday

// The coming Sunday on/after `fromIso` (same day when fromIso is itself Sunday).
export function nextSunday(fromIso) {
  const dow = dayOfWeek(fromIso);
  return addDays(fromIso, (7 - dow) % 7);
}
export function upcomingSundays(fromIso, count = 6) {
  let s = nextSunday(fromIso);
  const out = [];
  for (let i = 0; i < count; i += 1) { out.push(s); s = addDays(s, 7); }
  return out;
}
// The date a driver should be reminded for a given service (Thursday before).
export function remindSendOn(serviceDateIso, offsetDays = DEFAULT_REMIND_OFFSET_DAYS) {
  return addDays(serviceDateIso, -Math.abs(offsetDays));
}

// -----------------------------------------------------------------------------
// Time formatting: '09:45' -> '9:45 AM'
// -----------------------------------------------------------------------------
export function formatTime(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}
export function serviceWindow(arrive, end) {
  const a = formatTime(arrive || DEFAULT_ARRIVE);
  const e = formatTime(end || DEFAULT_END);
  return `${a} – ${e}`;
}

// -----------------------------------------------------------------------------
// Row <-> shape mappers (exported for tests; the surface renders shapes)
// -----------------------------------------------------------------------------
export function toDriverShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name ?? '',
    phone: row.phone ?? null,
    email: row.email ?? null,
    role: row.driver_role ?? 'driver',
    notes: row.notes ?? null,
    active: row.active !== false,
    mine: !!myUserId && row.user_id === myUserId,
  };
}
export function toRouteShape(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    area: row.area ?? null,
    description: row.description ?? null,
    accessible: row.accessible === true,
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    active: row.active !== false,
  };
}
export function toVanShape(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    capacity: Number.isFinite(row.capacity) ? row.capacity : null,
    accessible: row.accessible === true,
    notes: row.notes ?? null,
    active: row.active !== false,
  };
}
export function toScheduleShape(row, myUserId) {
  return {
    id: row.id,
    serviceDate: row.service_date ?? null,
    routeId: row.route_id ?? null,
    routeName: row.route_name ?? null,
    vanId: row.van_id ?? null,
    vanName: row.van_name ?? null,
    driverId: row.driver_id ?? null,
    driverUserId: row.driver_user_id ?? null,
    driverName: row.driver_name ?? null,
    arriveTime: row.arrive_time ?? DEFAULT_ARRIVE,
    endTime: row.end_time ?? DEFAULT_END,
    status: row.status ?? 'open',
    notes: row.notes ?? null,
    mine: !!myUserId && row.driver_user_id === myUserId,
  };
}
export function toReminderShape(row, myUserId) {
  return {
    id: row.id,
    serviceDate: row.service_date ?? null,
    scheduleId: row.schedule_id ?? null,
    driverId: row.driver_id ?? null,
    driverUserId: row.driver_user_id ?? null,
    driverName: row.driver_name ?? '',
    routeName: row.route_name ?? null,
    sendOn: row.send_on ?? null,
    channel: row.channel ?? 'app',
    status: row.status ?? 'pending',
    sentAt: row.sent_at ?? null,
    note: row.note ?? null,
    mine: !!myUserId && row.driver_user_id === myUserId,
  };
}
export function toBusMessageShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name ?? '',
    body: row.body ?? '',
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.user_id === myUserId,
  };
}
export function toRequestShape(row, myUserId) {
  return {
    id: row.id,
    title: row.title ?? '',
    detail: row.detail ?? null,
    submitterName: row.submitter_name ?? '',
    status: row.status ?? 'new',
    priority: row.priority ?? 'normal',
    resolution: row.resolution ?? null,
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.submitted_by === myUserId,
  };
}

// -----------------------------------------------------------------------------
// Coverage — the deacon's core question: "is this Sunday covered?" For each
// active route, is a driver assigned, and have they confirmed? Returns a stable,
// sorted view plus tallies the surface renders as real numbers (never painted).
// -----------------------------------------------------------------------------
export function coverageForDate(schedule = [], routes = [], dateIso) {
  const onDate = (schedule || []).filter((s) => s && s.serviceDate === dateIso);
  const activeRoutes = (routes || [])
    .filter((r) => r && r.active !== false)
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.name).localeCompare(String(b.name)));

  const usedRowIds = new Set();
  const routeCoverage = activeRoutes.map((r) => {
    const row = onDate.find((s) => s.routeId === r.id && s.driverName);
    if (row) usedRowIds.add(row.id);
    return {
      routeId: r.id,
      routeName: r.name,
      area: r.area,
      accessible: r.accessible,
      assigned: !!row,
      driverName: row?.driverName ?? null,
      vanName: row?.vanName ?? null,
      status: row?.status ?? 'open',
      scheduleId: row?.id ?? null,
    };
  });

  // Assigned rows that don't map to a known route (ad-hoc runs) — surfaced too.
  const extra = onDate
    .filter((s) => s.driverName && !usedRowIds.has(s.id) && !activeRoutes.some((r) => r.id === s.routeId))
    .map((s) => ({
      routeId: s.routeId,
      routeName: s.routeName || 'Other run',
      area: null,
      accessible: false,
      assigned: true,
      driverName: s.driverName,
      vanName: s.vanName ?? null,
      status: s.status ?? 'scheduled',
      scheduleId: s.id,
    }));

  const all = [...routeCoverage, ...extra];
  const assignedCount = all.filter((c) => c.assigned).length;
  const confirmedCount = all.filter((c) => c.status === 'confirmed').length;
  const openCount = routeCoverage.filter((c) => !c.assigned).length;
  return {
    date: dateIso,
    routes: all,
    totalRoutes: activeRoutes.length,
    assignedCount,
    confirmedCount,
    openCount,
    fullyCovered: activeRoutes.length > 0 && openCount === 0,
  };
}

// -----------------------------------------------------------------------------
// Reminder plan — from a published schedule, one reminder per assigned driver
// (skip Open/Declined rows). This is what "the schedule comes out, reminders go
// out" turns into: a concrete list of who to remind and WHEN (Thursday before).
// -----------------------------------------------------------------------------
export function buildReminderPlan(scheduleRows = [], opts = {}) {
  const offsetDays = Number.isFinite(opts.offsetDays) ? opts.offsetDays : DEFAULT_REMIND_OFFSET_DAYS;
  const channel = opts.channel || 'app';
  return (scheduleRows || [])
    .filter((s) => s && s.serviceDate && s.driverName && s.status !== 'declined' && s.status !== 'open')
    .map((s) => ({
      serviceDate: s.serviceDate,
      scheduleId: s.id ?? null,
      driverId: s.driverId ?? null,
      driverUserId: s.driverUserId ?? null,
      driverName: s.driverName,
      routeName: s.routeName ?? null,
      sendOn: remindSendOn(s.serviceDate, offsetDays),
      channel,
      status: 'pending',
    }));
}

// Pending reminders that should have gone out already, or go out today. This is
// the fix for "no one called them" — overdue rises to the top of the surface.
export function dueReminders(reminders = [], todayIso) {
  return (reminders || []).filter((r) => r && r.status === 'pending' && r.sendOn && r.sendOn <= todayIso);
}
export function overdueReminders(reminders = [], todayIso) {
  return (reminders || []).filter((r) => r && r.status === 'pending' && r.sendOn && r.sendOn < todayIso);
}

// Assigned drivers who have NOT confirmed for a given date (the coordinator's
// follow-up list). Open/declined rows are not "unconfirmed" — they are handled.
export function unconfirmedForDate(schedule = [], dateIso) {
  return (schedule || []).filter(
    (s) => s && s.serviceDate === dateIso && s.driverName && s.status !== 'confirmed' && s.status !== 'declined' && s.status !== 'open',
  );
}

// A schedule row is "assignable to remind" — small predicate reused by the UI.
export function needsReminder(row) {
  return !!(row && row.serviceDate && row.driverName && row.status !== 'declined' && row.status !== 'open');
}
