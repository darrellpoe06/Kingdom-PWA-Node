// =============================================================================
// person-onboarding — did they get in, and which apps have they opened?
// =============================================================================
// Darrell, 2026-11-19, on Admin > Users & usage > Signups: "How do I know who
// signed up and if and when they got in? Coreyon is supposed to be using the
// Poe Properties App... he may also want the Love Corner App... as well as the
// PoeTech App... how do I know and how do we help people when they have
// onboarding issues?!"
//
// This module reads the governor-only records and shapes them for the
// Signups rows. Every line is drawn from a real row (DR-0076): a door never
// opened reads "never", a visit from before doors were recorded is counted as
// exactly that and never given a door, and an unreadable record says it could
// not be read instead of reading as "nothing happened".
//
//   admin_person_doors()  (0339, DR-1591)  which app each visit was
// =============================================================================
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';
import { relativeTime } from './access-metrics.js';
import { DOORS } from './app-doors.js';

// ── fetch ────────────────────────────────────────────────────────────────────
// The same discriminated status as fetchSignupMetrics: never throws, never paints.
async function governorRead(fn, body = {}) {
  const token = readSnapshotToken();
  if (!token) return { status: 'signed-out' };
  try {
    const { data, error } = await restRpc(fn, body, token);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (error.code === '42501' || msg.includes('not authorized')) return { status: 'unauthorized' };
      return { status: 'unavailable', error };
    }
    if (!data || typeof data !== 'object') return { status: 'unavailable', error: { message: 'no answer' } };
    return { status: 'ready', data };
  } catch (e) {
    return { status: 'unavailable', error: { message: (e && e.message) || String(e) } };
  }
}

export function fetchPersonDoors() {
  return governorRead('admin_person_doors');
}

// ── doors ────────────────────────────────────────────────────────────────────

/** The apps every row names, opened or not: the three a person is placed in. */
export const NAMED_DOORS = ['poetech', 'lovecorner', 'properties'];

const doorByKey = new Map(DOORS.map((d) => [d.key, d]));
export function doorLabel(key) {
  const d = doorByKey.get(key);
  return d ? d.label : String(key || 'Unknown app');
}

/** A calendar date, said the way a person says it (Central, the family's clock). */
export function dayLabel(iso) {
  const t = Date.parse(iso || '');
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
}

/** user_id -> { doors: Map(key -> {firstAt,lastAt,n}), before: {n,lastAt}|null }. */
export function indexDoors(data) {
  const out = new Map();
  const people = data && Array.isArray(data.people) ? data.people : [];
  for (const p of people) {
    if (!p || !p.user_id) continue;
    const doors = new Map();
    for (const d of Array.isArray(p.doors) ? p.doors : []) {
      if (!d || !d.door) continue;
      doors.set(String(d.door), { firstAt: d.first_at || null, lastAt: d.last_at || null, n: Number(d.n) || 0 });
    }
    const b = p.before_tracking;
    out.set(String(p.user_id), { doors, before: b && Number(b.n) > 0 ? { n: Number(b.n), lastAt: b.last_at || null } : null });
  }
  return out;
}

/**
 * What one row says about the apps. `record` is indexDoors(...).get(userId)
 * (undefined when the person has no usage row at all). `since` is the
 * door_tracking_since stamp (null when no row has carried a door yet).
 *   { doors: [{ key, label, opened, firstAt, lastAt, text }], note }
 */
export function doorsView(record, since, nowMs, extraKeys = []) {
  const doors = (record && record.doors) || new Map();
  const keys = [...NAMED_DOORS];
  for (const k of [...extraKeys, ...doors.keys()]) if (k && !keys.includes(k)) keys.push(k);
  const rows = keys.map((key) => {
    const d = doors.get(key);
    const label = doorLabel(key);
    if (!d) return { key, label, opened: false, firstAt: null, lastAt: null, text: `${label}: never` };
    const first = relativeTime(d.firstAt, nowMs);
    const last = relativeTime(d.lastAt, nowMs);
    return {
      key,
      label,
      opened: true,
      firstAt: d.firstAt,
      lastAt: d.lastAt,
      text: first === last ? `${label}: ${first}` : `${label}: first ${first}, last ${last}`,
    };
  });
  const before = record && record.before;
  let note;
  if (!since) note = 'Which app a visit was in is recorded from this release on; nothing has been recorded with its app yet.';
  else note = `"Never" means not since door tracking began on ${dayLabel(since)}.`;
  if (before)
    note += ` ${before.n} earlier ${before.n === 1 ? 'visit was' : 'visits were'} recorded before door tracking began (last ${relativeTime(before.lastAt, nowMs)}), so which app ${before.n === 1 ? 'it was' : 'they were'} is not known.`;
  const beforeText = before ? `${before.n} earlier ${before.n === 1 ? 'visit' : 'visits'}, app not recorded (last ${relativeTime(before.lastAt, nowMs)})` : '';
  return { doors: rows, note, beforeText };
}
