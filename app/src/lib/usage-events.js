// =============================================================================
// usage-events — measure how the app is used, to make it better (Darrell
// 2026-07-04: "we have to know number of users... most used tab etc"). Sovereign
// (family NAS), governor-aggregate only, each person owns + can delete their own
// trail (migration 0073). DATA-TO-SERVE, not extract.
//
// recordView  — fire-and-forget on a tab open; never blocks or throws into the
//               render (fail-soft); signed-out is a no-op (nothing to attribute).
// fetchUsageFlow — the governor's AGGREGATE (poe-family gate lives in the RPC);
//               null when signed out / unreachable / not authorized so the
//               surface degrades gracefully (DR-0076 honest fallback).
// topViews    — PURE shape of the most-used list for the surface (node-testable).
// =============================================================================
import { supabase } from './supabase.js';
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';
import { currentDoor } from './app-doors.js';

// WHICH APP THE ROW CAME FROM (DR-1591). Darrell 2026-11-19: "Coreyon is
// supposed to be using the Poe Properties App... how do I know?" Every row now
// carries the door key the page booted as (app-doors.js currentDoor): poetech,
// lovecorner, properties, tlc, moore. Read from the page's own location, so it
// is the app the person actually has open, never a guess from their spaces.
export function doorKeyHere(loc) {
  try {
    const l = loc || (typeof window !== 'undefined' ? window.location : null);
    if (!l) return null;
    return currentDoor(l.pathname, l.search).key || null;
  } catch { return null; }
}

// The column arrives with migration 0337, applied by the lane after merge. A
// build that reaches a person before the column does must not lose their
// usage: on the one error that names the missing column, the row is written
// again without a door, and this page stops sending one.
let doorColumnMissing = false;
const namesDoorColumn = (error) => {
  const m = `${(error && error.message) || ''} ${(error && error.details) || ''}`.toLowerCase();
  return m.includes('door') && (m.includes('column') || (error && error.code === 'PGRST204'));
};
const INSERT_TIMEOUT_MS = 10000;
const bounded = (q) => {
  try {
    if (q && typeof q.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return q.abortSignal(AbortSignal.timeout(INSERT_TIMEOUT_MS));
    }
  } catch { /* an unbounded write is still fire-and-forget */ }
  return q;
};
export async function insertUsageRow(row, client = supabase, doorKey) {
  const door = doorColumnMissing ? null : (doorKey === undefined ? doorKeyHere() : doorKey);
  const withDoor = door ? { ...row, door } : row;
  let { error } = await bounded(client.from('usage_events').insert(withDoor));
  if (error && door && namesDoorColumn(error)) {
    doorColumnMissing = true;
    ({ error } = await bounded(client.from('usage_events').insert(row)));
  }
  return !error;
}
/** Tests only: forget that the column was missing. */
export function resetDoorColumnForTests() { doorColumnMissing = false; }

export async function recordView(name) {
  const v = String(name || '').trim();
  if (!v) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return false;
    return await insertUsageRow({ kind: 'view', name: v });
  } catch { return false; }
}

export async function fetchUsageFlow(days = 30) {
  try {
    // Token from the persisted session (no navigator.locks) + a direct-REST RPC, so
    // a wedged PoeTech tab holding the client's cross-tab lock can't hang the
    // WHAT'S-USED tab on "Loading…" (Darrell 2026-07-22; DR-0076). restRpc is
    // AbortController-bounded, so this always resolves.
    const token = readSnapshotToken();
    if (!token) return null;
    const { data: flow, error } = await restRpc('usage_flow_metrics', { days_in: days }, token);
    if (error) { console.warn('[usage-events] flow fetch failed:', error); return null; }
    return flow || null;
  } catch (err) { console.warn('[usage-events] flow fetch failed:', err); return null; }
}

// The most-used tabs, biggest first, capped. Pure over the RPC's aggregate rows.
export function topViews(flow, limit = 15) {
  const rows = flow && Array.isArray(flow.views) ? flow.views : [];
  return rows
    .filter((r) => r && typeof r.name === 'string')
    .map((r) => ({ name: r.name, count: Number(r.count) || 0, users: Number(r.users) || 0 }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
    .slice(0, Math.max(0, limit));
}

// A tiny share-of-total for a bar width (0..1). Pure.
export function viewShare(row, flow) {
  const total = flow && Number(flow.total_views) ? Number(flow.total_views) : 0;
  if (!total || !row) return 0;
  return Math.max(0, Math.min(1, (Number(row.count) || 0) / total));
}

// Per-person usage for the STEWARDS (0145; Darrell 2026-08-23: "what does my
// son like to use the most so we can make it better... which users to ask to
// help"). The DB guard is the authority: only an owner/admin of one of the
// member's spaces may call. Null on failure so surfaces degrade honestly.
export async function fetchUserUsage(userId, days = 30) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.rpc('user_usage_metrics', { target_user: userId, days_in: days });
    if (error) { console.warn('[usage-events] user usage fetch failed:', error); return null; }
    return data || [];
  } catch (err) { console.warn('[usage-events] user usage fetch failed:', err); return null; }
}

// A FUNCTION EXERCISED, NOT A TAB OPENED (DR-0819). Darrell 2026-10-08: "to see
// if they are testing and using evaluating the functions based on the use so we
// can streamline our process for testing these applications." recordView
// answers "which tab", which cannot answer "has anyone tried the camera window".
// Same table, same ownership and deletion rights, kind='use' instead of 'view'
// — and because usage_flow_metrics filters kind='view', not one existing tab
// number moves. Fire-and-forget, never throws into a handler, no-op signed out.
export async function recordUse(feature) {
  const v = String(feature || '').trim();
  if (!v) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return false;
    return await insertUsageRow({ kind: 'use', name: v });
  } catch { return false; }
}

/** Call it without awaiting, from inside a click handler. Never throws. */
export function noteUse(feature) {
  try { recordUse(feature); } catch { /* a metric may never break a feature */ }
}

// The governor's roll-up of kind='use' (migration 0253). Same direct-REST path
// and the same honest null as fetchUsageFlow: null means we could not read it,
// which the surface must NOT render as "nothing has been tried".
export async function fetchFeatureUse(days = 90) {
  try {
    const token = readSnapshotToken();
    if (!token) return null;
    const { data, error } = await restRpc('feature_use_metrics', { days_in: days }, token);
    if (error) { console.warn('[usage-events] feature use fetch failed:', error); return null; }
    return data || null;
  } catch (err) { console.warn('[usage-events] feature use fetch failed:', err); return null; }
}

// THE DOOR WAS OPENED, BY A SIGNED-IN PERSON (DR-1591). One kind='door' row per
// person per page load, written when the door boots with a session or the
// moment someone signs in inside it. The Poe Properties door boots without the
// PoeTech shell, so before this it wrote no usage row at all: a tenant could
// live in that app and the governor's screen would say they never came.
// kind='door' is read by nothing that counts tabs (usage_flow_metrics reads
// 'view'; the calendar drops 'door'), so no existing number moves.
//
// Never throws, never blocks the boot. The session read is bounded so a tab
// holding the auth lock cannot strand it (DR-0076: an async step has a ceiling).
const SESSION_WAIT_MS = 8000;
export function noteDoorOpen({ client = supabase, loc } = {}) {
  const seen = new Set();
  const door = doorKeyHere(loc);
  if (!door) return () => {};
  const record = async (session) => {
    const uid = session && session.user && session.user.id;
    if (!uid || seen.has(uid)) return false;
    seen.add(uid);
    try { return await insertUsageRow({ kind: 'door', name: door }, client, door); } catch { return false; }
  };
  let unsub = () => {};
  try {
    const sub = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') record(session);
    });
    const s = sub && sub.data && sub.data.subscription;
    if (s && typeof s.unsubscribe === 'function') unsub = () => s.unsubscribe();
  } catch { /* no listener: the session read below still records */ }
  try {
    let timer;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), SESSION_WAIT_MS); });
    Promise.race([client.auth.getSession(), timeout])
      .then((res) => { clearTimeout(timer); return record(res && res.data && res.data.session); })
      .catch(() => {});
  } catch { /* a metric may never break a boot */ }
  return unsub;
}
