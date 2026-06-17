// =============================================================================
// conference-variance — ANTICIPATED vs ACTUAL for the conference engine
// =============================================================================
// The projection (ANTICIPATED) already lives in real tables: open congregation
// registrations (conference_public_registrations — headcount + meals + party) and
// the internal per-session roll (event_participants). This module computes the
// ACTUAL side beside it and the side-by-side VARIANCE that serves the kitchen
// (plates), room capacity, and staffing — plus the no-show rate.
//
// TWO sources of ACTUAL:
//   1. CHECK-IN — checked_in_at / checked_in_heads on each registration (0031).
//      Sum of checkedInHeads = who really walked in. (Reads via conference-register.)
//   2. conference_actuals (0031) — meals actually SERVED + rooms actually USED, the
//      counts a check-in can't tell you. Staff record them; the view reads them.
//
// Pure helpers (varianceCell / *VarianceRows) are split from the supabase calls so
// every shape is locked by tests with NO live DB (DR-0076: measure, don't claim).
// The supabase calls are thin, instance-scoped (RLS), and never throw.
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { normalizeMealType, MEAL_TYPES } from './conference.js';
import { totalHeads, isCheckedIn } from './conference-register.js';

export const ACTUAL_SCOPES = ['event', 'meal', 'room', 'session'];

// --- The variance primitive --------------------------------------------------
// One anticipated-vs-actual comparison. delta = actual - anticipated (negative =
// shortfall / no-shows; positive = over the projection). rate is the size of the
// gap relative to the projection. tone drives the KpiDot:
//   good      — within 10% of plan
//   attention — 10–25% off (kitchen: re-plan; room: watch)
//   problem   — >25% off, OR actual exceeds a capacity-style anticipated (over)
// Tolerant of null/zero anticipated (returns an idle, label-only cell).
export function varianceCell(anticipated, actual, { overIsProblem = false } = {}) {
  const a = Number.isFinite(anticipated) ? anticipated : null;
  const v = Number.isFinite(actual) ? actual : 0;
  if (a == null) {
    return { anticipated: null, actual: v, delta: null, rate: null, direction: 'unknown', tone: 'idle', label: `${v} actual` };
  }
  const delta = v - a;
  const direction = delta === 0 ? 'on-target' : delta < 0 ? 'under' : 'over';
  const rate = a > 0 ? Math.abs(delta) / a : (delta === 0 ? 0 : null);
  let tone = 'good';
  if (rate == null) tone = 'attention';
  else if (rate > 0.25) tone = 'problem';
  else if (rate > 0.1) tone = 'attention';
  if (overIsProblem && direction === 'over') tone = 'problem'; // over a capacity ceiling
  const label = delta === 0
    ? `${v} / ${a} · on target`
    : delta < 0
      ? `${v} / ${a} · ${-delta} under`
      : `${v} / ${a} · ${delta} over`;
  return { anticipated: a, actual: v, delta, rate, direction, tone, label };
}

// Format a rate (0–1) as a whole-number percent string, or '—'.
export function ratePct(rate) {
  return Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : '—';
}

// --- Headcount (registration projection vs check-in actual) ------------------

// ANTICIPATED heads — sum of party sizes across non-cancelled registrations
// (reuses the registration lib's totalHeads, the proven headcount).
export function anticipatedHeads(regs) {
  return totalHeads(regs);
}

// ACTUAL heads — sum of checkedInHeads across checked-in, non-cancelled regs.
export function actualHeads(regs) {
  return (regs || [])
    .filter((r) => r.status !== 'cancelled' && isCheckedIn(r))
    .reduce((sum, r) => sum + (Number.isFinite(r.checkedInHeads) ? r.checkedInHeads : 0), 0);
}

// How many registrations (rows, not heads) have arrived vs are expected.
export function checkInProgress(regs) {
  const live = (regs || []).filter((r) => r.status !== 'cancelled');
  const arrived = live.filter(isCheckedIn).length;
  return { arrived, expected: live.length, remaining: live.length - arrived };
}

// The whole-event headcount variance + no-show rate. No-show rate is the share of
// ANTICIPATED heads that did not check in (clamped to [0,1]).
export function eventVariance(regs) {
  const a = anticipatedHeads(regs);
  const v = actualHeads(regs);
  const cell = varianceCell(a, v);
  const noShowRate = a > 0 ? Math.max(0, Math.min(1, (a - v) / a)) : null;
  return { ...cell, noShowRate };
}

// --- Meals (registration meal mix vs plates actually served) -----------------

// ANTICIPATED plates per meal type — counts HEADS (party_size), since each member
// of a party eats, so the kitchen plans plates not rows. Excludes cancelled.
export function anticipatedMealHeads(regs) {
  const counts = {};
  for (const r of regs || []) {
    if (r.status === 'cancelled') continue;
    const t = normalizeMealType(r.mealType);
    const heads = Number.isFinite(r.partySize) ? r.partySize : 1;
    counts[t] = (counts[t] || 0) + heads;
  }
  return counts;
}

// Index conference_actuals by ref_key for one scope (latest wins).
export function actualsByKey(actuals, scope) {
  const map = new Map();
  for (const a of actuals || []) {
    if (a.scope === scope) map.set(a.refKey, a);
  }
  return map;
}

// Per-meal-type variance: anticipated plates (heads) vs actual served. Covers
// every type that appears in the projection OR has a served actual recorded.
export function mealVarianceRows(regs, actuals) {
  const antic = anticipatedMealHeads(regs);
  const served = actualsByKey(actuals, 'meal');
  const types = new Set([...MEAL_TYPES.filter((t) => antic[t]), ...served.keys()]);
  // Keep MEAL_TYPES order, then any extras.
  const ordered = [...MEAL_TYPES.filter((t) => types.has(t)), ...[...types].filter((t) => !MEAL_TYPES.includes(t))];
  return ordered.map((type) => {
    const a = antic[type] ?? 0;
    const actRow = served.get(type) || null;
    const v = actRow && Number.isFinite(actRow.actual) ? actRow.actual : null;
    return {
      type,
      anticipated: a,
      hasActual: !!actRow,
      ...varianceCell(a, v == null ? 0 : v),
      actual: v == null ? null : v,
    };
  });
}

// --- Rooms (capacity / planned vs actually used) -----------------------------
// Anticipated = the room's capacity (the planned ceiling); actual = observed peak
// occupancy recorded by staff. over = problem (we needed a bigger room).
export function roomVarianceRows(rooms, actuals) {
  const used = actualsByKey(actuals, 'room');
  return (rooms || [])
    .filter((r) => r.status !== 'archived')
    .filter((r) => Number.isFinite(r.capacity) || used.has(r.id))
    .map((r) => {
      const actRow = used.get(r.id) || null;
      const v = actRow && Number.isFinite(actRow.actual) ? actRow.actual : null;
      return {
        roomId: r.id,
        name: r.name,
        anticipated: Number.isFinite(r.capacity) ? r.capacity : null,
        hasActual: !!actRow,
        ...varianceCell(Number.isFinite(r.capacity) ? r.capacity : null, v == null ? 0 : v, { overIsProblem: true }),
        actual: v == null ? null : v,
      };
    });
}

// --- Sessions (signed-up vs checked-in, fully derived) -----------------------
// Anticipated = everyone on the session roll (registered + checked_in seat
// statuses); actual = those marked checked_in. No extra data needed.
const SEAT_STATUSES = new Set(['registered', 'checked_in']);
export function sessionVarianceRows(sessions, participants) {
  return (sessions || [])
    .filter((s) => s.status !== 'archived')
    .map((s) => {
      const roll = (participants || []).filter((p) => p.sessionId === s.id);
      const anticipated = roll.filter((p) => SEAT_STATUSES.has(p.registrationStatus)).length;
      const actual = roll.filter((p) => p.registrationStatus === 'checked_in').length;
      return {
        sessionId: s.id,
        title: s.title,
        day: s.day ?? null,
        anticipated,
        ...varianceCell(anticipated, actual),
      };
    })
    .filter((row) => row.anticipated > 0 || row.actual > 0);
}

// =============================================================================
// conference_actuals — data access (supabase). Instance-scoped via RLS.
// =============================================================================

export function toActualShape(row) {
  return {
    id: row.id,
    conferenceId: row.conference_id ?? null,
    scope: row.scope,
    refKey: row.ref_key ?? 'event',
    label: row.label ?? null,
    anticipated: Number.isFinite(row.anticipated) ? row.anticipated : (row.anticipated ?? null),
    actual: Number.isFinite(row.actual) ? row.actual : (row.actual ?? 0),
    notes: row.notes ?? null,
    recordedAt: row.recorded_at ?? null,
  };
}

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Live subscription to conference_actuals (re-fetch on any change), mirroring the
// conference-sync subscriber. Returns an unsubscribe fn.
export function subscribeActuals(onChange) {
  let channel = null;
  let cancelled = false;
  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('conference_actuals')
      .select('*')
      .order('recorded_at', { ascending: true });
    if (error) { console.warn('[conference-variance] actuals fetch failed:', error.message || error); return null; }
    return (data || []).map(toActualShape);
  };
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    try {
      channel = supabase
        .channel('conference_actuals-stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conference_actuals' }, () => {
          fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
        })
        .subscribe();
    } catch { /* realtime optional; initial load still ran */ }
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* noop */ } }
  };
}

export async function fetchActuals() {
  try {
    const { data, error } = await supabase
      .from('conference_actuals')
      .select('*')
      .order('recorded_at', { ascending: true });
    if (error) return { ok: false, error, rows: [] };
    return { ok: true, rows: (data || []).map(toActualShape) };
  } catch (e) {
    return { ok: false, error: e, rows: [] };
  }
}

// Build the DB row from a camelCase actual. Pure + spec-shaped.
export function buildActualRow(actual = {}) {
  const scope = ACTUAL_SCOPES.includes(actual.scope) ? actual.scope : 'event';
  return {
    conference_id: actual.conferenceId || null,
    scope,
    ref_key: String(actual.refKey ?? '').trim() || 'event',
    label: actual.label ? String(actual.label).trim() : null,
    anticipated: Number.isFinite(actual.anticipated) ? actual.anticipated : null,
    actual: Math.max(0, Math.floor(Number(actual.actual)) || 0),
    notes: actual.notes ? String(actual.notes).trim() : null,
  };
}

// Record (upsert) one actual — meals served / room used / etc. Owner/admin (RLS).
// Upserts on (conference_id, scope, ref_key) so a re-record UPDATES the single row
// rather than piling duplicates. Fails soft + honest.
export async function saveActual(actual, displayName) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-church' };
  const row = buildActualRow(actual);
  if (!row.conference_id) return { skipped: 'no-conference' };
  try {
    const { error } = await supabase
      .from('conference_actuals')
      .upsert(
        { ...row, instance_id: tenantId, recorded_by: session.user.id, updated_by: session.user.id },
        { onConflict: 'conference_id,scope,ref_key' },
      );
    if (error) return { skipped: 'upsert-error', error };
    return { saved: true };
  } catch (e) {
    return { skipped: 'threw', error: e };
  }
}

export async function deleteActual(id) {
  if (!id) return { skipped: 'no-id' };
  try {
    const { error } = await supabase.from('conference_actuals').delete().eq('id', id);
    return error ? { skipped: 'delete-error', error } : { deleted: true };
  } catch (e) {
    return { skipped: 'threw', error: e };
  }
}
