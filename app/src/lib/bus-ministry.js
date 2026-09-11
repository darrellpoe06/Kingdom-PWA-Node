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

// Ride-request lifecycle (a rider asks; the coordinator moves it along).
export const RIDE_REQUEST_STATUS = [
  ['new', 'New'],
  ['acknowledged', 'Seen'],
  ['scheduled', 'Ride set'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['declined', 'Declined'],
];
export const rideRequestStatusLabel = (s) => (RIDE_REQUEST_STATUS.find(([k]) => k === s)?.[1]) || s;
// Still-open (needs the coordinator's attention) vs. closed out.
export const rideRequestOpen = (s) => s === 'new' || s === 'acknowledged' || s === 'scheduled';

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

// -----------------------------------------------------------------------------
// SERVICE SLOTS — the bus runs on SUNDAY *AND* WEDNESDAY.
// -----------------------------------------------------------------------------
// Declared by Darrell 2026-09-11, with the COLG leadership looking at this very
// surface: "You say which Sunday? We need to say Sunday and Wednesday." And
// again, after a leader tapped into the ministry: "just clicked on bus ministry,
// and it just showed me the Sunday sign... Sunday and Wednesday."
//
// The surface was built Sunday-only (`upcomingSundays` above, and a "Which
// Sunday" picker), which quietly told a Wednesday rider the bus does not run for
// them. The fix is not a second hardcoded day — it is to stop hardcoding the day
// at all and read the church's OWN service record, which already carries the
// truth (lib/default-church.js: Sunday Worship 11:00 AM; Bible Study Wednesday
// 1:00 PM and 6:00 PM). Real data, named and traced (DR-0061 reality-trace);
// every other congregation that sets its own service times gets its own slots
// for free, with nothing here to edit.
//
// ARRIVE TIME is DERIVED, not invented. Deacon Anderson's declared Sunday pair
// is arrive 9:45 for an 11:00 AM service — a 75-minute lead. That same lead is
// offered as the DEFAULT for any other service and the coordinator can change it
// on the row; we do not make up a pickup time for a service nobody has told us
// about (DR-0076 — never fabricate; a default the human confirms is not a claim).
// -----------------------------------------------------------------------------
export const ARRIVE_LEAD_MINUTES = 75; // 9:45 arrive for an 11:00 AM service

const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dowIndex = (name) => DOW_NAMES.findIndex((d) => d.toLowerCase() === String(name || '').trim().toLowerCase());

// '11:00 AM' | '11:00' -> minutes past midnight, or null when unparseable.
function minutesOf(time) {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(String(time || '').trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const mer = (m[3] || '').toLowerCase();
  if (h > 23 || min > 59) return null;
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return h * 60 + min;
}
const hhmmOf = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// serviceSlots(church) — the weekly services the bus can be scheduled against,
// read off the church's own record. Falls back to the Sunday the surface has
// always had when a congregation carries no service list yet, so an instance
// with no data is never left with an empty picker.
export function serviceSlots(church) {
  const services = (church && Array.isArray(church.services)) ? church.services : [];
  const slots = services
    .map((svc) => {
      if (!svc) return null;
      const dow = dowIndex(svc.day);
      if (dow < 0) return null;
      const startMins = minutesOf(svc.time);
      return {
        id: svc.id || `svc-${dow}-${String(svc.time || '').replace(/\W+/g, '')}`,
        dow,
        dayLabel: DOW_NAMES[dow],
        time: svc.time || '',
        label: svc.label || `${DOW_NAMES[dow]} service`,
        // The default the coordinator sees pre-filled — overridable on the row.
        arriveDefault: startMins == null ? DEFAULT_ARRIVE : hhmmOf(Math.max(0, startMins - ARRIVE_LEAD_MINUTES)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dow - b.dow || (minutesOf(a.time) ?? 0) - (minutesOf(b.time) ?? 0));

  if (slots.length > 0) return slots;
  return [{ id: 'svc-sun', dow: 0, dayLabel: 'Sunday', time: '11:00 AM', label: 'Sunday Worship', arriveDefault: DEFAULT_ARRIVE }];
}

// The coming date on/after `fromIso` that falls on `dow` (same day when fromIso
// is itself that weekday) — the general form of nextSunday.
export function nextDayOfWeek(fromIso, dow) {
  const cur = dayOfWeek(fromIso);
  return addDays(fromIso, ((Number(dow) - cur) % 7 + 7) % 7);
}

// upcomingServices — the next `count` bus runs across ALL of the church's
// services, in true chronological order, so Sunday and Wednesday interleave in
// one picker instead of the rider having to know which list to look in.
// Each entry is the full identity of a run: date + which service on that date.
export function upcomingServices(fromIso, slots, count = 6) {
  const list = (slots && slots.length) ? slots : serviceSlots(null);
  const next = new Map(list.map((slot) => [slot.id, nextDayOfWeek(fromIso, slot.dow)]));
  const out = [];
  while (out.length < count) {
    // Pick the soonest pending run; ties (two services the same day) break on
    // the earlier start time, which the slot order already encodes.
    let pick = null;
    for (const slot of list) {
      const date = next.get(slot.id);
      if (!pick || date < pick.date) pick = { slot, date };
    }
    if (!pick) break;
    out.push({
      key: `${pick.date}::${pick.slot.id}`,
      date: pick.date,
      slotId: pick.slot.id,
      dow: pick.slot.dow,
      dayLabel: pick.slot.dayLabel,
      time: pick.slot.time,
      label: pick.slot.label,
      arriveDefault: pick.slot.arriveDefault,
    });
    next.set(pick.slot.id, addDays(pick.date, 7));
  }
  return out;
}

// How a run reads in a picker: "Sun, Nov 2 · 11:00 AM Sunday Worship".
export function serviceRunLabel(run, fmtDate) {
  if (!run) return '';
  const when = typeof fmtDate === 'function' ? fmtDate(run.date) : run.date;
  const time = run.time ? `${run.time} ` : '';
  return `${when} · ${time}${run.label}`.trim();
}

// A schedule row written before service slots existed carries only a date. It
// belongs to that date's FIRST service (Sunday, in every row we have), so
// back-compat is "no slot means the primary run", never "belongs to nothing".
export function rowMatchesRun(row, run) {
  if (!row || !run) return false;
  if (row.serviceDate !== run.date) return false;
  const slot = row.serviceSlot || row.service_slot || null;
  if (!slot) return true;
  return slot === run.slotId;
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
    // Which service on that date (null = the date's primary run — every row
    // written before Sunday-and-Wednesday landed). See rowMatchesRun.
    serviceSlot: row.service_slot ?? null,
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

// Ride request — a rider's pickup ask (any member files it; drivers see + act).
export function toRideRequestShape(row, myUserId) {
  return {
    id: row.id,
    riderName: row.rider_name ?? '',
    riderPhone: row.rider_phone ?? null,
    pickupArea: row.pickup_area ?? null,
    pickupAddress: row.pickup_address ?? null,
    serviceDate: row.service_date ?? null,
    // Which service they need the bus for — a Wednesday rider can ask for the
    // 1:00 PM or the 6:00 PM Bible Study. Null = the date's primary run.
    serviceSlot: row.service_slot ?? null,
    passengers: row.passengers ?? 1,
    accessibleNeeded: !!row.accessible_needed,
    notes: row.notes ?? null,
    status: row.status ?? 'new',
    assignedDriverName: row.assigned_driver_name ?? null,
    coordinatorNote: row.coordinator_note ?? null,
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.requested_by === myUserId,
  };
}

// Validate a rider's ride-request form. A name is required (so a driver knows who
// they're picking up); a pickup area OR address is required (so they know where).
// Returns { ok, errors:{field:msg} }. Phone/date/notes are optional but urged.
export function validateRideRequest(form = {}) {
  const errors = {};
  const name = (form.riderName || '').trim();
  const area = (form.pickupArea || '').trim();
  const address = (form.pickupAddress || '').trim();
  if (!name) errors.riderName = 'Please add your name so the driver knows who to pick up.';
  if (!area && !address) errors.pickupArea = 'Add a pickup area or address so we know where to come.';
  const p = Number(form.passengers);
  if (form.passengers != null && form.passengers !== '' && (!Number.isFinite(p) || p < 1)) {
    errors.passengers = 'How many riders? (at least 1).';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// -----------------------------------------------------------------------------
// Coverage — the deacon's core question: "is this Sunday covered?" For each
// active route, is a driver assigned, and have they confirmed? Returns a stable,
// sorted view plus tallies the surface renders as real numbers (never painted).
// -----------------------------------------------------------------------------
export function coverageForDate(schedule = [], routes = [], dateIso, slotId = null) {
  // `slotId` narrows to ONE service on a date that holds more than one (COLG's
  // Wednesday carries a 1:00 PM and a 6:00 PM Bible Study). Rows written before
  // slots existed carry no slot and belong to the date's primary run.
  const onDate = (schedule || []).filter((s) => s && s.serviceDate === dateIso
    && (!slotId || !(s.serviceSlot || s.service_slot) || (s.serviceSlot || s.service_slot) === slotId));
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
    slotId,
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
