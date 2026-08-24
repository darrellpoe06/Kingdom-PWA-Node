// =============================================================================
// venue-rental — COMMUNITY use of the church's two campuses (Event Management)
// =============================================================================
// The community asks to use the church's spaces often — funerals, weddings,
// gatherings. This is the data + logic for all OUTSIDE community use of the two
// campuses, DISTINCT from the Conference (the church's own event). Backed by
// venue_bookings (infra/supabase/migrations-auto/0030-venue-bookings.sql).
//
// REUSE, not re-roll:
//   - The anon-write + owner/admin-read + trigger-forced-instance RLS shape is the
//     PROVEN conference_public_registrations pattern (0027). submit/fetch/subscribe
//     mirror conference-register.js so the ROW is the honest deliverable (failure
//     is surfaced, never swallowed).
//   - Pure helpers (catalog / conflict / quote / responsibilities) are split out so
//     the shapes are locked by tests with no live DB (DR-0076: measure, don't claim).
//   - The no-double-booking conflict engine is NEW shared logic the conference work
//     never had (it only did capacity, never room/time overlap); it lives here once
//     and is unit-tested (proven-to-catch), so any future booking surface reuses it.
//
// PRICING TRUTH (no fake money on a trust surface): the committed catalog carries a
// relative `tier` per campus (North = premium, South = standard) but NO invented
// dollar rates. The REAL revenue line is quoted_price, entered by staff per booking
// and never public (the whole table is owner/admin-read). A staff-editable rate card
// is a documented follow-up.
import supabase from './supabase.js';

// --- Catalog: the two campuses + their bookable spaces ------------------------
// Bathrooms are intentionally NOT bookable spaces. Capacity is only asserted where
// it is actually known (the North main sanctuary, 600 — the figure already used by
// the Observation board); elsewhere it is null (truthful — staff confirm per event).
export const CAMPUSES = [
  {
    id: 'north',
    name: 'North Campus',
    tier: 'premium',
    address: 'The Church of the Living God — main campus',
    blurb: 'The main ~44,000 sq ft church. The larger space; premium rate.',
    spaces: [
      { id: 'north-whole',      name: 'Whole Campus (exclusive use)', wholeCampus: true, capacity: 600 },
      { id: 'north-sanctuary',  name: 'Main Sanctuary',               capacity: 600 },
      { id: 'north-fellowship', name: 'Fellowship Hall',              capacity: null },
      { id: 'north-kitchen',    name: 'Kitchen',                      capacity: null },
      { id: 'north-rooms',      name: 'Meeting / Classroom',          capacity: null },
    ],
  },
  {
    id: 'south',
    name: 'South Campus Event Center',
    tier: 'standard',
    address: '1109 N 4th St',
    blurb: 'South Campus Event Center. Standard rate.',
    spaces: [
      { id: 'south-whole',      name: 'Whole Event Center (exclusive use)', wholeCampus: true, capacity: null },
      { id: 'south-sanctuary',  name: 'Main Sanctuary',                     capacity: null },
      { id: 'south-fellowship', name: 'Fellowship Hall',                    capacity: null },
      { id: 'south-kitchen',    name: 'Kitchen',                            capacity: null },
    ],
  },
];

export const CAMPUS_IDS = CAMPUSES.map((c) => c.id);

export function findCampus(campusId) {
  return CAMPUSES.find((c) => c.id === campusId) || null;
}
export function spacesForCampus(campusId) {
  return findCampus(campusId)?.spaces || [];
}
// Resolve a space by its global catalog id (space ids are unique across campuses).
export function findSpace(spaceId) {
  for (const c of CAMPUSES) {
    const s = c.spaces.find((sp) => sp.id === spaceId);
    if (s) return { ...s, campusId: c.id, campusName: c.name, tier: c.tier };
  }
  return null;
}

// --- Event types + per-type RESPONSIBILITIES (so nothing is dropped) ----------
// Each responsibility names the TEAM that owns it, so AV always lands on the media
// team, food on the kitchen, etc. The booking's `responsibilities` jsonb stores
// which keys are DONE; the template is the source of truth for what must happen.
export const EVENT_TYPES = [
  { id: 'funeral',    label: 'Funeral / Homegoing' },
  { id: 'wedding',    label: 'Wedding' },
  { id: 'concert',    label: 'Concert / Musical' },
  { id: 'conference', label: 'Conference / Workshop' },
  { id: 'community', label: 'Community Event' },
];
export const EVENT_TYPE_IDS = EVENT_TYPES.map((t) => t.id);
export function eventTypeLabel(id) {
  return EVENT_TYPES.find((t) => t.id === id)?.label || 'Event';
}

// Every event type carries the media CUE SHEET as a named Media Team step —
// merged 2026-08-24 from Bro Clifton Reed's Event Media Intake process, built
// from his experience working with the congregation: the media team confirms
// what it will receive (photos, videos, slides, documents, music) BEFORE the
// day, so nothing is chased mid-event.
const CUE_SHEET_STEP = { key: 'cuesheet', label: 'Media cue sheet confirmed (files + music received)', team: 'Media Team' };

const RESPONSIBILITY_TEMPLATES = {
  funeral: [
    { key: 'setup',        label: 'Setup & seating',         team: 'Deacons' },
    { key: 'av',           label: 'AV / livestream',         team: 'Media Team' },
    CUE_SHEET_STEP,
    { key: 'kitchen',      label: 'Repast / kitchen',        team: 'Hospitality' },
    { key: 'cleaning',     label: 'Cleaning & reset',        team: 'Custodial' },
    { key: 'security',     label: 'Security & parking',      team: 'Security' },
    { key: 'scheduling',   label: 'Scheduling & coordination', team: 'Church Office' },
    { key: 'family',       label: 'Family liaison',          team: 'Pastoral' },
  ],
  wedding: [
    { key: 'setup',        label: 'Setup & décor',           team: 'Deacons' },
    { key: 'av',           label: 'AV / sound',              team: 'Media Team' },
    CUE_SHEET_STEP,
    { key: 'rehearsal',    label: 'Rehearsal scheduling',    team: 'Church Office' },
    { key: 'kitchen',      label: 'Reception / kitchen',     team: 'Hospitality' },
    { key: 'cleaning',     label: 'Cleaning & reset',        team: 'Custodial' },
    { key: 'security',     label: 'Security & parking',      team: 'Security' },
    { key: 'officiant',    label: 'Officiant coordination',  team: 'Pastoral' },
  ],
  concert: [
    { key: 'setup',        label: 'Setup & staging',         team: 'Deacons' },
    { key: 'av',           label: 'AV / sound & lighting',   team: 'Media Team' },
    CUE_SHEET_STEP,
    { key: 'soundcheck',   label: 'Sound check scheduled',   team: 'Media Team' },
    { key: 'cleaning',     label: 'Cleaning & reset',        team: 'Custodial' },
    { key: 'security',     label: 'Security & parking',      team: 'Security' },
    { key: 'scheduling',   label: 'Scheduling & coordination', team: 'Church Office' },
  ],
  conference: [
    { key: 'setup',        label: 'Setup & seating',         team: 'Deacons' },
    { key: 'av',           label: 'AV / projection & mics',  team: 'Media Team' },
    CUE_SHEET_STEP,
    { key: 'kitchen',      label: 'Refreshments (if catered)', team: 'Hospitality' },
    { key: 'cleaning',     label: 'Cleaning & reset',        team: 'Custodial' },
    { key: 'security',     label: 'Security & parking',      team: 'Security' },
    { key: 'scheduling',   label: 'Scheduling & coordination', team: 'Church Office' },
  ],
  community: [
    { key: 'setup',        label: 'Setup & seating',         team: 'Deacons' },
    { key: 'av',           label: 'AV / sound',              team: 'Media Team' },
    CUE_SHEET_STEP,
    { key: 'kitchen',      label: 'Kitchen (if catered)',    team: 'Hospitality' },
    { key: 'cleaning',     label: 'Cleaning & reset',        team: 'Custodial' },
    { key: 'security',     label: 'Security & parking',      team: 'Security' },
    { key: 'scheduling',   label: 'Scheduling & coordination', team: 'Church Office' },
  ],
};

// The responsibility checklist for an event type (defaults to community).
export function responsibilitiesFor(eventType) {
  return RESPONSIBILITY_TEMPLATES[eventType] || RESPONSIBILITY_TEMPLATES.community;
}

// --- The media cue sheet (Bro Clifton Reed's Event Media Intake, merged) ------
// The four media categories his congregation-tested form collects, with the
// formats the media team can actually play. The booking's `media_expected`
// jsonb stores { key: true } for what the requester says is coming; the
// Spotify link + media notes ride their own columns (0146). Files themselves
// travel the media team's channel until the storage work lands (DR-0307) —
// the cue sheet is the coordination record, not the file store.
export const MEDIA_CATEGORIES = [
  { key: 'photos',    label: 'Pictures / photos',       formats: 'JPG, PNG, HEIC' },
  { key: 'videos',    label: 'Videos',                  formats: 'MP4, MOV' },
  { key: 'slides',    label: 'PowerPoints / slides',    formats: 'PPT, PPTX, KEY, PDF' },
  { key: 'documents', label: 'Documents (programs, obituaries, lyrics)', formats: 'PDF, DOC, DOCX, TXT' },
];
export const MEDIA_CATEGORY_KEYS = MEDIA_CATEGORIES.map((c) => c.key);

// The labels of the categories a booking says to expect (for the staff card).
export function mediaExpectedLabels(booking) {
  const state = (booking?.mediaExpected && typeof booking.mediaExpected === 'object') ? booking.mediaExpected : {};
  return MEDIA_CATEGORIES.filter((c) => state[c.key] === true).map((c) => c.label);
}

// Does this booking carry ANY cue-sheet info worth showing the media team?
export function hasCueSheet(booking) {
  return mediaExpectedLabels(booking).length > 0
    || !!String(booking?.spotifyLink ?? '').trim()
    || !!String(booking?.mediaNotes ?? '').trim();
}

// Progress over a booking's responsibilities: which of the required items are done.
// tone drives a KpiDot: problem = nothing assigned, attention = partway, good = all.
export function responsibilityProgress(booking) {
  const template = responsibilitiesFor(booking?.eventType);
  const state = booking?.responsibilities || {};
  const total = template.length;
  const done = template.filter((r) => state[r.key] === true).length;
  const remaining = total - done;
  let tone = 'good';
  if (done === 0) tone = 'problem';
  else if (remaining > 0) tone = 'attention';
  return { done, total, remaining, tone, complete: remaining === 0 };
}

// --- No-double-booking conflict engine (the heart of the calendar) -----------
export const BOOKING_STATUSES = ['requested', 'reviewing', 'scheduled', 'declined', 'completed', 'cancelled'];
// Statuses that do NOT hold the room (so they never block another booking).
const RELEASED_STATUSES = new Set(['declined', 'cancelled']);

// 'HH:MM' (or 'H:MM') -> minutes since midnight; null if unparseable/blank.
export function timeToMinutes(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

// Do two [start,end) ranges overlap? A null start OR end means "all day" — an
// untimed booking holds the whole day, so it overlaps any other booking that day.
export function timeRangesOverlap(aStart, aEnd, bStart, bEnd) {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  const be = timeToMinutes(bEnd);
  // If either side lacks a complete, valid window, treat it as all-day.
  if (as === null || ae === null || bs === null || be === null) return true;
  if (ae <= as || be <= bs) return true; // a malformed/zero window is treated as all-day too
  return as < be && bs < ae;
}

// Do two bookings contend for the same physical space? Same campus AND (same space
// OR either books the WHOLE campus, which blocks every space on it).
function spacesContend(a, b) {
  if (a.campus !== b.campus) return false;
  if (a.spaceId === b.spaceId) return true;
  const sa = findSpace(a.spaceId);
  const sb = findSpace(b.spaceId);
  return !!(sa?.wholeCampus || sb?.wholeCampus);
}

// Every existing booking that conflicts with `candidate`: same campus + same date +
// contending space + overlapping time, among bookings that still hold the room.
// Released (declined/cancelled) bookings and the candidate itself never conflict.
export function bookingConflicts(existing, candidate) {
  if (!candidate || !candidate.campus || !candidate.spaceId || !candidate.eventDate) return [];
  if (RELEASED_STATUSES.has(candidate.status)) return [];
  return (existing || []).filter((b) => {
    if (!b || b.id === candidate.id) return false;
    if (RELEASED_STATUSES.has(b.status)) return false;
    if (b.eventDate !== candidate.eventDate) return false;
    if (!spacesContend(b, candidate)) return false;
    return timeRangesOverlap(candidate.startTime, candidate.endTime, b.startTime, b.endTime);
  });
}

export function hasConflict(existing, candidate) {
  return bookingConflicts(existing, candidate).length > 0;
}

// --- Pricing / revenue (REAL numbers only) -----------------------------------
// The quoted price for a booking is whatever staff entered; there is no invented
// rate card. Revenue counts ONLY scheduled/completed bookings (a request or a
// declined event is not income).
const REVENUE_STATUSES = new Set(['scheduled', 'completed']);

export function bookingRevenue(booking) {
  if (!booking || !REVENUE_STATUSES.has(booking.status)) return 0;
  const n = Number(booking.quotedPrice);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Total + per-campus revenue from real quoted prices on scheduled/completed bookings.
export function revenueSummary(bookings) {
  const byCampus = {};
  let total = 0;
  for (const b of bookings || []) {
    const rev = bookingRevenue(b);
    if (rev <= 0) continue;
    total += rev;
    byCampus[b.campus] = (byCampus[b.campus] || 0) + rev;
  }
  return { total, byCampus };
}

// Format cents-free USD for display ($1,200). Returns '—' for null/zero.
export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

// --- Validation + row building (pure, test-locked) ---------------------------
export function validateBookingRequest(form = {}) {
  const errors = {};
  const name = String(form.requesterName ?? form.name ?? '').trim();
  if (!name) errors.requesterName = 'Please enter your name so we can reach you.';

  if (!CAMPUS_IDS.includes(form.campus)) errors.campus = 'Please choose a campus.';
  if (!form.spaceId || !findSpace(form.spaceId)) errors.spaceId = 'Please choose a space.';
  else if (form.campus && findSpace(form.spaceId)?.campusId !== form.campus) {
    errors.spaceId = 'That space is on a different campus.';
  }
  if (!EVENT_TYPE_IDS.includes(form.eventType)) errors.eventType = 'Please choose the type of event.';
  if (!String(form.eventDate ?? '').trim()) errors.eventDate = 'Please choose a date.';

  const email = String(form.requesterEmail ?? form.email ?? '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.requesterEmail = 'That email doesn’t look right — or leave it blank.';
  }

  const s = timeToMinutes(form.startTime);
  const e = timeToMinutes(form.endTime);
  if (s !== null && e !== null && e <= s) {
    errors.endTime = 'End time must be after the start time.';
  }

  if (form.expectedAttendance !== undefined && form.expectedAttendance !== '' && form.expectedAttendance !== null) {
    const n = Number(form.expectedAttendance);
    if (!Number.isFinite(n) || n < 0 || n > 5000) errors.expectedAttendance = 'About how many people? (0–5000)';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

function cleanInt(v) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Build the venue_bookings DB row from a public/staff form (snake_case).
export function buildBookingRow(form = {}) {
  const space = findSpace(form.spaceId);
  return {
    campus: CAMPUS_IDS.includes(form.campus) ? form.campus : (space?.campusId || 'south'),
    space_id: form.spaceId || null,
    space_name: space?.name || String(form.spaceName ?? '').trim() || null,
    event_type: EVENT_TYPE_IDS.includes(form.eventType) ? form.eventType : 'community',
    event_title: String(form.eventTitle ?? '').trim() || null,
    requester_name: String(form.requesterName ?? form.name ?? '').trim(),
    requester_email: String(form.requesterEmail ?? form.email ?? '').trim() || null,
    requester_phone: String(form.requesterPhone ?? form.phone ?? '').trim() || null,
    organization: String(form.organization ?? '').trim() || null,
    event_date: String(form.eventDate ?? '').trim() || null,
    start_time: String(form.startTime ?? '').trim() || null,
    end_time: String(form.endTime ?? '').trim() || null,
    expected_attendance: cleanInt(form.expectedAttendance),
    notes: String(form.notes ?? '').trim() || null,
    media_expected: buildMediaExpected(form.mediaExpected),
    spotify_link: String(form.spotifyLink ?? '').trim() || null,
    media_notes: String(form.mediaNotes ?? '').trim() || null,
    source: form.source || 'public-request',
  };
}

// Only known category keys, only true values — the stored shape stays clean.
function buildMediaExpected(input) {
  const out = {};
  if (input && typeof input === 'object') {
    for (const key of MEDIA_CATEGORY_KEYS) {
      if (input[key] === true) out[key] = true;
    }
  }
  return out;
}

// DB row -> camelCase shape for the management surface.
export function toBookingShape(row) {
  return {
    id: row.id,
    campus: row.campus ?? 'south',
    spaceId: row.space_id ?? null,
    spaceName: row.space_name ?? null,
    eventType: row.event_type ?? 'community',
    eventTitle: row.event_title ?? null,
    requesterName: row.requester_name ?? '',
    requesterEmail: row.requester_email ?? null,
    requesterPhone: row.requester_phone ?? null,
    organization: row.organization ?? null,
    eventDate: row.event_date ?? null,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    expectedAttendance: Number.isFinite(row.expected_attendance) ? row.expected_attendance : (row.expected_attendance ?? null),
    status: row.status ?? 'requested',
    quotedPrice: row.quoted_price ?? null,
    responsibilities: (row.responsibilities && typeof row.responsibilities === 'object') ? row.responsibilities : {},
    notes: row.notes ?? null,
    mediaExpected: (row.media_expected && typeof row.media_expected === 'object') ? row.media_expected : {},
    spotifyLink: row.spotify_link ?? null,
    mediaNotes: row.media_notes ?? null,
    source: row.source ?? null,
    createdAt: row.created_at ?? null,
  };
}

// --- Supabase calls (thin; honest; never throw) ------------------------------

// Public / community: submit a space-use request. The trigger forces instance +
// the safe public shape. Returns {ok} | {ok:false,error}; the row is the deliverable
// so the caller MUST surface a false result.
export async function submitSpaceRequest(form = {}) {
  const row = buildBookingRow(form);
  if (!row.requester_name) return { ok: false, error: { message: 'name-required' } };
  if (!row.space_id) return { ok: false, error: { message: 'space-required' } };
  try {
    const { error } = await supabase.from('venue_bookings').insert(row);
    if (error) {
      console.warn('[venue-rental] request submit failed:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[venue-rental] request submit threw:', e);
    return { ok: false, error: e };
  }
}

// Staff: add a booking directly (source 'staff'). RLS requires owner/admin.
export async function createStaffBooking(form = {}) {
  const row = { ...buildBookingRow(form), source: 'staff', status: BOOKING_STATUSES.includes(form.status) ? form.status : 'reviewing' };
  if (!row.requester_name) return { ok: false, error: { message: 'name-required' } };
  try {
    const { data, error } = await supabase.from('venue_bookings').insert(row).select('id').single();
    if (error) return { ok: false, error };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Staff: fetch the booking roll, newest first. RLS returns nothing to a non
// owner/admin, so this is safe to call from any surface.
export async function fetchBookings() {
  try {
    const { data, error } = await supabase
      .from('venue_bookings')
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) return { ok: false, error, rows: [] };
    return { ok: true, rows: (data || []).map(toBookingShape) };
  } catch (e) {
    return { ok: false, error: e, rows: [] };
  }
}

// Staff: live subscription — re-fetch on any change so the calendar + revenue
// update as requests come in. Returns an unsubscribe fn.
export function subscribeBookings(onChange) {
  let channel = null;
  let cancelled = false;
  const load = async () => {
    const { ok, rows } = await fetchBookings();
    if (ok && !cancelled) onChange(rows);
  };
  load();
  try {
    channel = supabase
      .channel('venue_bookings-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venue_bookings' }, () => { load(); })
      .subscribe();
  } catch { /* realtime optional; the initial load still ran */ }
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* noop */ } }
  };
}

// Staff: patch a booking (status / price / responsibilities / notes / schedule).
// Accepts a camelCase patch; maps the known fields to snake_case.
export async function updateBooking(id, patch = {}) {
  if (!id) return { ok: false, error: 'no-id' };
  const row = {};
  if (patch.status !== undefined) {
    if (!BOOKING_STATUSES.includes(patch.status)) return { ok: false, error: 'bad-status' };
    row.status = patch.status;
  }
  if (patch.quotedPrice !== undefined) {
    const n = Number(patch.quotedPrice);
    row.quoted_price = (patch.quotedPrice === '' || patch.quotedPrice === null || !Number.isFinite(n) || n < 0) ? null : n;
  }
  if (patch.responsibilities !== undefined) row.responsibilities = patch.responsibilities || {};
  if (patch.notes !== undefined) row.notes = String(patch.notes ?? '').trim() || null;
  if (patch.eventDate !== undefined) row.event_date = String(patch.eventDate ?? '').trim() || null;
  if (patch.startTime !== undefined) row.start_time = String(patch.startTime ?? '').trim() || null;
  if (patch.endTime !== undefined) row.end_time = String(patch.endTime ?? '').trim() || null;
  if (Object.keys(row).length === 0) return { ok: false, error: 'empty-patch' };
  try {
    const { error } = await supabase.from('venue_bookings').update(row).eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Staff: toggle one responsibility key done/undone (immutably) and persist.
export async function toggleResponsibility(booking, key) {
  const current = (booking?.responsibilities && typeof booking.responsibilities === 'object') ? booking.responsibilities : {};
  const next = { ...current, [key]: !current[key] };
  if (!next[key]) delete next[key];
  return updateBooking(booking.id, { responsibilities: next });
}

export async function deleteBooking(id) {
  if (!id) return { ok: false, error: 'no-id' };
  try {
    const { error } = await supabase.from('venue_bookings').delete().eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}
