// =============================================================================
// person-record-sync — the reads behind person-record.js (DR-0828)
// =============================================================================
// Two tables, both already readable by the viewer under their own RLS:
//   dm_device_keys    any signed-in person may read any user's device rows (a
//                     sender needs every device of the recipient, 0249);
//   member_presence   owner/admin of the instance (0055).
// READS ONLY. Nothing here persists a user's record (USER-ACCOUNTS-AND-
// HISTORIES-STANDARD: the account holds its own non-sensitive history and the
// steward reads it through RLS, never around it). Each read answers
// { ok, rows, reason } and never throws: a steward sees "could not read" with
// the reason, never an empty list pretending to be the truth (DR-0076 rule 8).
// =============================================================================

import supabase from './supabase.js';

function race(promise, timeoutMs, onTimeout) {
  const timer = new Promise((resolve) => setTimeout(() => resolve(onTimeout), timeoutMs));
  return Promise.race([promise, timer]);
}

const timedOut = (timeoutMs) => ({ data: null, error: { message: `the server did not answer within ${Math.round(timeoutMs / 1000)}s` } });

export async function loadDmDevicesOf(userId, { client = supabase, timeoutMs = 6000 } = {}) {
  if (!userId) return { ok: false, rows: [], reason: 'no user' };
  try {
    const q = client.from('dm_device_keys').select('device_id,label,last_seen_at').eq('user_id', userId);
    const r = await race(q, timeoutMs, timedOut(timeoutMs));
    if (r.error) return { ok: false, rows: [], reason: r.error.message || String(r.error) };
    return { ok: true, rows: Array.isArray(r.data) ? r.data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

export async function loadPresenceOf(instanceId, userId, { client = supabase, timeoutMs = 6000 } = {}) {
  if (!userId || !instanceId) return { ok: false, rows: [], reason: 'no user or no space' };
  try {
    const q = client.from('member_presence').select('platform,build_sha,build_time,last_seen_at').eq('instance_id', instanceId).eq('user_id', userId);
    const r = await race(q, timeoutMs, timedOut(timeoutMs));
    if (r.error) return { ok: false, rows: [], reason: r.error.message || String(r.error) };
    return { ok: true, rows: Array.isArray(r.data) ? r.data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

/** Both reads at once; each carries its own answer. */
export async function loadPersonRows(instanceId, userId, opts = {}) {
  const [dm, presence] = await Promise.all([loadDmDevicesOf(userId, opts), loadPresenceOf(instanceId, userId, opts)]);
  return { dm, presence };
}
