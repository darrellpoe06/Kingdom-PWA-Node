// =============================================================================
// church-calendar-office — the office names its unit leaders and uploads the
// pictures the website never had (DR-1628)
// =============================================================================
// Darrell 2026-11-24: "only certain people can add to the calendar... office
// staff and sent in by minister leadership over units" and "We need to find
// the churches archives of event flyers etc... on the website or we can add
// through uploading".
//
// LEADS. church_calendar_leads (0343): the office (owner/admin) names a member
// of its own church as the leader of a unit; that leader may then add events
// for that unit (church_calendar_post), nothing else. The database is the
// gate; this module only reads and asks.
//
// UPLOADS. The office's picture goes into the private church-archive bucket at
// <instance>/<sha256>.<ext> (the bytes' own hash, computed here; the picture
// type read from the bytes, never the file name), then is filed through
// church_site_archive_upload(). The daily reader reads it onto its days on its
// next run, exactly like a picture from the website.
//
// Every call is bounded by a timeout and never throws (DR-1053).
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceResolve } from './church-instance.js';
import { ARCHIVE_BUCKET, sniffType, storagePath } from './church-archive.js';

export const TIMEOUT_MS = 12000;
export const UPLOAD_TIMEOUT_MS = 60000;
export const MAX_PICTURE_BYTES = 12 * 1024 * 1024;
const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms));

async function church({ client, resolveChurch, timeoutMs }) {
  const { data } = await client.auth.getSession();
  if (!data || !data.session) return { skipped: 'signed-out' };
  const c = await Promise.race([resolveChurch(), timeout(timeoutMs)]);
  if (!c || c.timedOut || !c.ok) return { skipped: 'unavailable' };
  if (!c.value) return { skipped: 'no-church' };
  return { tenantId: c.value, userId: data.session.user.id };
}

/** A unit name as the office types it: trimmed, single-spaced, 1–80 letters; '' when not one. */
export function cleanUnit(text) {
  const s = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length >= 1 && s.length <= 80 ? s : '';
}

/** { status: 'ok', leads: [{ id, userId, unit, name }], members: [{ userId, name }] } or { status: reason }. */
export async function readLeads({ client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = TIMEOUT_MS } = {}) {
  try {
    const ctx = await church({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return { status: ctx.skipped, leads: [], members: [] };
    const [l, m] = await Promise.all([
      Promise.race([client.from('church_calendar_leads').select('id, user_id, unit').eq('instance_id', ctx.tenantId).order('unit'), timeout(timeoutMs)]),
      Promise.race([client.from('instance_members').select('user_id, display_name').eq('instance_id', ctx.tenantId), timeout(timeoutMs)]),
    ]);
    if (!l || l.timedOut || l.error || !m || m.timedOut || m.error) return { status: 'unavailable', leads: [], members: [] };
    const members = (m.data || [])
      .filter((r) => r && r.user_id)
      .map((r) => ({ userId: r.user_id, name: String(r.display_name || '').trim() || 'A member without a name' }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const nameOf = new Map(members.map((x) => [x.userId, x.name]));
    const leads = (l.data || []).map((r) => ({ id: r.id, userId: r.user_id, unit: r.unit, name: nameOf.get(r.user_id) || 'A member' }));
    return { status: 'ok', leads, members };
  } catch {
    return { status: 'unavailable', leads: [], members: [] };
  }
}

/** The office names a member the leader of a unit. { saved: true } or { skipped: reason }. */
export async function addLead(userId, unit, { client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = TIMEOUT_MS } = {}) {
  const u = cleanUnit(unit);
  if (!userId || !u) return { skipped: 'invalid' };
  try {
    const ctx = await church({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return { skipped: ctx.skipped };
    const res = await Promise.race([
      client.from('church_calendar_leads').insert({ instance_id: ctx.tenantId, user_id: userId, unit: u, granted_by: ctx.userId }),
      timeout(timeoutMs),
    ]);
    if (!res || res.timedOut) return { skipped: 'timeout' };
    if (res.error) return { skipped: res.error.code === '23505' ? 'already' : 'refused' };
    return { saved: true };
  } catch {
    return { skipped: 'unavailable' };
  }
}

/** The office takes a leader off a unit. { removed: true } or { skipped: reason }. */
export async function removeLead(id, { client = supabase, timeoutMs = TIMEOUT_MS } = {}) {
  if (!id) return { skipped: 'invalid' };
  try {
    const res = await Promise.race([client.from('church_calendar_leads').delete().eq('id', id), timeout(timeoutMs)]);
    if (!res || res.timedOut) return { skipped: 'timeout' };
    return res.error ? { skipped: 'refused' } : { removed: true };
  } catch {
    return { skipped: 'unavailable' };
  }
}

/** The hex sha256 of the bytes. */
export async function sha256Hex(bytes, subtle = globalThis.crypto && globalThis.crypto.subtle) {
  const digest = await subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The office uploads a calendar, letter or flyer picture for a month.
 * { kept: 'kept' | 'seen' } or { skipped: reason }. The bytes go first; the
 * row is filed only once they are in the bucket (the database checks).
 */
export async function uploadPicture(
  file,
  { kind, year, month, title = '' },
  { client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = UPLOAD_TIMEOUT_MS } = {}
) {
  if (!['calendar', 'letter', 'flyer'].includes(kind) || !(year >= 2000 && year <= 2200) || !(month >= 1 && month <= 12)) return { skipped: 'invalid' };
  if (!file || typeof file.arrayBuffer !== 'function') return { skipped: 'invalid' };
  if (file.size > MAX_PICTURE_BYTES) return { skipped: 'too-big' };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffType(bytes);
    if (!type) return { skipped: 'not-a-picture' };
    const ctx = await church({ client, resolveChurch, timeoutMs });
    if (ctx.skipped) return { skipped: ctx.skipped };
    const sha = await sha256Hex(bytes);
    const path = storagePath(ctx.tenantId, sha, type);
    const up = await Promise.race([client.storage.from(ARCHIVE_BUCKET).upload(path, bytes, { contentType: type, upsert: false }), timeout(timeoutMs)]);
    if (!up || up.timedOut) return { skipped: 'timeout' };
    // The same picture already there is the same bytes (the name is the hash).
    const dup = up.error && (String(up.error.statusCode) === '409' || /exists|duplicate/i.test(String(up.error.message || '')));
    if (up.error && !dup) return { skipped: 'refused' };
    const res = await Promise.race([
      client.rpc('church_site_archive_upload', {
        instance_in: ctx.tenantId,
        kind_in: kind,
        sha_in: sha,
        bytes_in: bytes.length,
        content_type_in: type,
        year_in: year,
        month_in: month,
        title_in: String(title || '').slice(0, 200),
      }),
      timeout(TIMEOUT_MS),
    ]);
    if (!res || res.timedOut) return { skipped: 'timeout' };
    if (res.error) return { skipped: 'refused' };
    return { kept: res.data === 'seen' ? 'seen' : 'kept' };
  } catch {
    return { skipped: 'unavailable' };
  }
}
