// =============================================================================
// tv-time-sync — your TV Time list follows your sign-in across your devices
// (Darrell 2026-07-04: "Sure. Why not good idea."). OWNER-ONLY, the proven rail
// Study rides (migration 0072 mirrors 0070). The list moves between the owner's
// devices THROUGH the family NAS (self-hosted Supabase) — never a third-party
// cloud, never mined. The anti-"TV Time shut down and took your data" guarantee.
//
// MERGE MODEL (honest — DR-0076): whole-list, newest-wins by the store's own
// `updatedAt` (a single user's own devices). The one edge is concurrent edits on
// two devices before a sync (the later save wins); per-item CRDT merge is the
// documented refinement. A device that has a pre-sign-in local list (no stamp
// yet) is UNIONED with the cloud so first sign-in never drops what was there.
//
// localStorage stays the immediate source of truth on-device (instant, offline);
// this table is the courier. All merge logic is PURE (node-testable); the
// fetch/push/subscribe functions touch supabase and every one FAILS SOFT (null /
// false) so a NAS outage degrades to exactly the old device-local behavior
// (PERPETUAL-PIPELINE-HEALTH: try-catch every external I/O).
//
// NOTE: the CIRCLE-SHARED layer (friends seeing each other's activity) is a
// separate, higher-stakes tenancy and lands only after a live-NAS isolation
// smoke-test (see 0072 header). This file is owner-only.
// =============================================================================
import { supabase } from './supabase.js';
import { normalize, emptyTv, tvUpdatedAt, touchTv } from './tv-time.js';

// --- Pure: is this state empty? ----------------------------------------------
function isEmpty(state) {
  const s = normalize(state);
  return Object.keys(s.shows).length === 0 && Object.keys(s.custom).length === 0;
}

// A monotonic "how much real activity" score for one tracked entry — used to
// pick the richer copy when the same id exists on both sides (union path).
function activity(e) {
  if (!e) return -1;
  return Object.keys(e.watched || {}).length * 2 + (Array.isArray(e.comments) ? e.comments.length : 0) * 2
    + (e.status && e.status !== 'want' ? 1 : 0) + (Number(e.rating) || 0);
}

// --- Pure: union two states (no data loss) -----------------------------------
// Keeps every show/movie from both; on an id collision keeps the more-active
// tracking entry and the richer catalog meta (more seasons). Used only for the
// first-sign-in case where the local list was never stamped.
export function unionStates(a, b) {
  const A = normalize(a);
  const B = normalize(b);
  const shows = { ...B.shows };
  for (const [id, e] of Object.entries(A.shows)) {
    shows[id] = activity(e) >= activity(B.shows[id]) ? e : B.shows[id];
  }
  const custom = { ...B.custom };
  for (const [id, m] of Object.entries(A.custom)) {
    const other = B.custom[id];
    const aSeasons = (m.seasons || []).length;
    const bSeasons = (other && other.seasons ? other.seasons : []).length;
    custom[id] = !other || aSeasons >= bSeasons ? m : other;
  }
  return { version: A.version, shows, custom };
}

// --- Pure: merge the cloud row into the local state --------------------------
// local = device state; cloud = { doc, updated_at } | null (fetchTvCloud shape).
// Returns { state, push } — state to render+save, push=true when local should be
// written up. Total + pure.
export function mergeTvCloud(local, cloud) {
  const localAt = tvUpdatedAt(local);
  const cloudDoc = cloud && cloud.doc && typeof cloud.doc === 'object' ? cloud.doc : null;
  const cloudAt = (cloud && typeof cloud.updated_at === 'string' && cloud.updated_at) || '';

  // Nothing in the cloud yet → local is the seed (push it up if it has anything).
  if (!cloudDoc) return { state: normalize(local), push: !isEmpty(local) };
  // Nothing local → adopt the cloud.
  if (isEmpty(local)) return { state: normalize(cloudDoc), push: false };
  // Local has content but was never stamped (a pre-sign-in list on a fresh
  // device) → UNION so nothing is dropped, then write the union up.
  if (!localAt) return { state: unionStates(local, cloudDoc), push: true };
  // Both stamped → newest-wins wholesale. STRICTLY-newer local pushes; equal
  // stamps are the same version → adopt cloud and DON'T re-push (this is what
  // breaks the realtime echo loop: our own push comes back with an equal stamp).
  if (localAt > cloudAt) return { state: normalize(local), push: true };
  return { state: normalize(cloudDoc), push: false };
}

// --- I/O: owner-only via RLS; all fail-soft ----------------------------------
async function ownedSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch { return null; }
}

// Pull the owner's list. null = unreachable / signed out (stay device-local);
// { doc, updated_at } otherwise ({ doc:null } when the owner has no row yet).
export async function fetchTvCloud() {
  const session = await ownedSession();
  if (!session) return null;
  try {
    const { data, error } = await supabase.from('tv_watch').select('doc,updated_at').maybeSingle();
    if (error) { console.warn('[tv-time-sync] fetch failed:', error); return null; }
    return data ? { doc: data.doc || null, updated_at: data.updated_at || '' } : { doc: null, updated_at: '' };
  } catch (err) {
    console.warn('[tv-time-sync] fetch failed:', err);
    return null;
  }
}

// Write the owner's whole list up (upsert on owner). Fails soft → false.
export async function pushTvCloud(state, nowIso) {
  const session = await ownedSession();
  if (!session) return false;
  try {
    const at = nowIso || new Date().toISOString();
    // Stamp the doc so its embedded updatedAt matches the row's updated_at
    // column — an adopting device then reads back an equal stamp (no echo loop).
    const doc = touchTv(state, at);
    const { error } = await supabase
      .from('tv_watch')
      .upsert({ owner: session.user.id, doc, updated_at: at }, { onConflict: 'owner' });
    if (error) { console.warn('[tv-time-sync] push failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[tv-time-sync] push failed:', err);
    return false;
  }
}

// Live: any change to the owner's row (RLS scopes the stream) re-triggers the
// caller's pull+merge. Returns an unsubscribe fn; safe when offline.
export function subscribeTvRealtime(onRemoteChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await ownedSession();
    if (!session || cancelled) return;
    try {
      channel = supabase
        .channel('tv-time-sync-stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_watch' }, () => { if (!cancelled) onRemoteChange(); })
        .subscribe();
    } catch (err) {
      console.warn('[tv-time-sync] realtime subscribe failed:', err);
    }
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* already closed */ } }
  };
}

export { isEmpty as _isEmptyState, emptyTv };
