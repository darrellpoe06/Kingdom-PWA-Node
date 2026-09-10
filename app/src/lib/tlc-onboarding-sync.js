// =============================================================================
// tlc-onboarding-sync — the client's honest seam to migration 0187 (DR-0344)
// =============================================================================
// Every write goes through one of the SECURITY DEFINER functions in 0187;
// every read comes back masked the way the server masks it (banking as last
// four, the list without the packet body or the headshot). Documents go to
// the private `tlc-onboarding` bucket as pointers; the row never carries bytes
// (DR-0303). Every call fails soft with a sentence the person can act on, and
// every network call is bounded by a timeout so a dead connection never
// leaves a screen spinning (SOUL.md: explicit thresholds + fallback paths).
//
// Scope (USER-ACCOUNTS-AND-HISTORIES-STANDARD): the packet is the colleague's
// OWN record, held inside the office. They read it back, export it, and can
// withdraw it (a hard delete, files first). The office reads it audited.
import supabase from './supabase.js';
import { tlcError } from './tlc-error.js';
import { compressImageFile } from './image.js';
import { HEADSHOT_THUMB_MAX_CHARS, HEADSHOT_THUMB_PX, documentPath, validateDocumentFile, normalizePacket } from './tlc-onboarding.js';

export const BUCKET = 'tlc-onboarding';
export const RPC_TIMEOUT_MS = 15000;
export const UPLOAD_TIMEOUT_MS = 90000;
export const SIGNED_URL_TTL_SECONDS = 300;

function withTimeout(promise, ms, what) {
  let timer;
  const bound = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} took longer than ${Math.round(ms / 1000)}s — check the connection and try again`)), ms); });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

function fail(reason, error) {
  const message = (error && tlcError(error)) || String(error || reason);
  return { ok: false, reason, message };
}

async function rpc(name, args, { timeout = RPC_TIMEOUT_MS } = {}) {
  try {
    const { data, error } = await withTimeout(supabase.rpc(name, args), timeout, name);
    if (error) return fail('rpc-error', error);
    return { ok: true, data };
  } catch (e) { return fail('network-error', e); }
}

export async function currentUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch { return null; }
}

// ---- Christina's side -------------------------------------------------------

export async function mintInvite(email, note = '') {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return fail('bad-email', 'That is not a valid email address.');
  const res = await rpc('tlc_onboarding_invite', { email_in: clean, note_in: note || null });
  if (!res.ok) return res;
  return { ok: true, invite: res.data };
}

export async function revokeInvite(inviteId) {
  if (!inviteId) return fail('no-id', 'No invite to revoke.');
  return rpc('tlc_onboarding_revoke_invite', { invite_id_in: inviteId });
}

export async function listOffice() {
  const res = await rpc('tlc_onboarding_list', {});
  if (!res.ok) return { ...res, invites: [], packets: [], manager: false };
  const d = res.data || {};
  return { ok: true, officeName: d.office_name || '', manager: d.manager === true, invites: Array.isArray(d.invites) ? d.invites : [], packets: Array.isArray(d.packets) ? d.packets : [] };
}

export async function readPacket(packetId) {
  if (!packetId) return fail('no-id', 'No packet to open.');
  const res = await rpc('tlc_onboarding_read', { packet_id_in: packetId });
  if (!res.ok) return res;
  return { ok: true, view: res.data };
}

export async function readBanking(packetId) {
  if (!packetId) return fail('no-id', 'No packet to open.');
  const res = await rpc('tlc_onboarding_banking_read', { packet_id_in: packetId });
  if (!res.ok) return res;
  return { ok: true, banking: res.data };
}

// `card` (approve only): the public roster card Christina previewed — name,
// role, specialty, url, photo, bio — written by the server in the format the
// current cards use (0187 §4b).
export async function reviewPacket(packetId, decision, note = '', card = null) {
  if (!packetId) return fail('no-id', 'No packet to review.');
  if (!['approve', 'return'].includes(decision)) return fail('bad-decision', 'A review is approve or return.');
  const rosterIn = decision === 'approve' && card && String(card.name || '').trim()
    ? { name: String(card.name).trim(), role: String(card.role || 'Specialist').trim(), specialty: String(card.specialty || '').trim(), url: String(card.url || '').trim(), photo: card.photo || '', bio: String(card.bio || '').trim(), published: true }
    : null;
  const res = await rpc('tlc_onboarding_review', { packet_id_in: packetId, decision_in: decision, note_in: note || null, roster_in: rosterIn });
  if (!res.ok) return res;
  return { ok: true, view: res.data, clinicianCreated: res.data?.clinician_created === true };
}

// The office removes a packet it holds: the files first (so nothing is
// stranded in the bucket), then the row (banking cascades).
export async function deletePacket(view) {
  if (!view || !view.packet_id) return fail('no-id', 'No packet to remove.');
  await removePacketFiles(view);
  const res = await rpc('tlc_onboarding_delete', { packet_id_in: view.packet_id });
  if (!res.ok) return res;
  return { ok: true, removed: res.data === true };
}

// ---- The colleague's side ---------------------------------------------------

// The signed-in person's OWN packet, if any — RLS lets an applicant read their
// own row directly (0187 tlc_onboarding_packets_applicant_read). Lets the TLC
// door recognize an approved colleague without a token. Null when none.
export async function myPacketStatus() {
  const userId = await currentUserId();
  if (!userId) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from('tlc_onboarding_packets').select('id,status,reviewed_at,submitted_at').eq('applicant_user_id', userId).order('updated_at', { ascending: false }).limit(1),
      RPC_TIMEOUT_MS, 'reading your packet');
    if (!error && Array.isArray(data) && data.length) {
      return { packetId: data[0].id, status: data[0].status, reviewedAt: data[0].reviewed_at, submittedAt: data[0].submitted_at };
    }
    // No packet bound to this login yet: an invite for this email (a
    // colleague already on the office's old form, 0197) starts one now, so
    // the person signs in and their answers are simply there.
    const claimed = await withTimeout(supabase.rpc('tlc_onboarding_claim'), RPC_TIMEOUT_MS, 'finding your packet');
    const v = claimed && claimed.data;
    if (claimed.error || !v || !v.packet_id) return null;
    return { packetId: v.packet_id, status: v.status, reviewedAt: v.reviewed_at, submittedAt: v.submitted_at, claimed: v.claimed === true };
  } catch { return null; }
}

/** The office mints an invite that already carries what it knows (0197): the packet body, the banking apart, and where it came from. */
export async function mintPrefilledInvite(email, note, prefill, banking = null, source = null) {
  const res = await rpc('tlc_onboarding_invite_prefilled', { email_in: String(email || '').trim().toLowerCase(), note_in: note || null, prefill_in: prefill || null, banking_in: banking || null, source_in: source || null });
  if (!res.ok) return res;
  return { ok: true, invite: res.data };
}

export async function openPacket(token) {
  const t = String(token || '').trim();
  if (!t) return fail('no-token', 'This link is missing its invitation code.');
  const res = await rpc('tlc_onboarding_open', { token_in: t });
  if (!res.ok) return res;
  const d = res.data || {};
  if (!d.packet_id) return { ok: false, reason: d.status || 'unknown', message: openMessage(d.status) };
  return { ok: true, view: d };
}

export function openMessage(status) {
  switch (status) {
    case 'revoked': return 'This invitation was withdrawn. Ask Christina for a new link.';
    case 'expired': return 'This invitation expired before it was opened. Ask Christina for a new link.';
    case 'taken': return 'This invitation was already opened under a different login. Sign in with that account, or ask Christina for a new link.';
    default: return 'This invitation link is not one we recognize. Check the link, or ask Christina for a new one.';
  }
}

// The one write. `submit` asks the server to check the required answers and
// the three acknowledgments; a short packet comes back with `missing`.
export async function savePacket({ packetId, packet, headshotThumb, banking, submit = false }) {
  if (!packetId) return fail('no-id', 'No packet to save.');
  const res = await rpc('tlc_onboarding_save', {
    packet_id_in: packetId,
    packet_in: normalizePacket(packet),
    headshot_in: headshotThumb === undefined ? null : headshotThumb,
    banking_in: banking || null,
    submit_in: submit === true,
  });
  if (!res.ok) return res;
  const d = res.data || {};
  if (submit && d.submitted === false) return { ok: true, submitted: false, missing: Array.isArray(d.missing) ? d.missing : [], view: null };
  return { ok: true, submitted: submit === true, missing: [], view: d };
}

// The colleague withdraws their packet: files first, then the row.
export async function withdrawPacket(view) {
  if (!view || !view.packet_id) return fail('no-id', 'No packet to withdraw.');
  await removePacketFiles(view);
  const res = await rpc('tlc_onboarding_withdraw', { packet_id_in: view.packet_id });
  if (!res.ok) return res;
  return { ok: true, removed: res.data === true };
}

// A headshot rides two ways: a 160px thumbnail in the row (the roster card
// never fetches a file) and the full photo as a document. Over the cap it is
// shrunk once more, then refused honestly rather than shipping a heavy row.
export async function headshotThumbFromFile(file) {
  let url = await compressImageFile(file, HEADSHOT_THUMB_PX, 0.72);
  if (url.length > HEADSHOT_THUMB_MAX_CHARS) url = await compressImageFile(file, 120, 0.6);
  if (url.length > HEADSHOT_THUMB_MAX_CHARS) throw new Error('that picture could not be made small enough — try a simpler photo');
  return url;
}

// Put a document in the private bucket. Returns a POINTER the packet keeps.
export async function uploadDocument({ packetId, docKey, file }) {
  const bounds = validateDocumentFile(file);
  if (!bounds.ok) return fail('bad-file', bounds.message);
  if (!packetId || !docKey) return fail('no-id', 'Internal error: the document has no home yet.');
  const userId = await currentUserId();
  if (!userId) return fail('signed-out', 'Sign in to attach a file.');
  const path = documentPath({ userId, packetId, docKey, fileName: file.name });
  try {
    const { error } = await withTimeout(
      supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || undefined }),
      UPLOAD_TIMEOUT_MS, 'the upload');
    if (error) {
      const msg = String(tlcError(error) || '').toLowerCase();
      if (msg.includes('bucket') && msg.includes('not found')) return fail('no-bucket', 'The document vault is not set up on this backend yet (migration 0187). Nothing was stored; tell Christina.');
      return fail('upload-failed', `The file could not be stored: ${tlcError(error)}`);
    }
  } catch (e) { return fail('network-error', `The file could not be stored: ${tlcError(e)}`); }
  return { ok: true, pointer: { path, fileName: file.name, fileSize: Number(file.size) || null, contentType: file.type || '', uploadedAt: new Date().toISOString() } };
}

export async function signedDocumentUrl(path) {
  if (!path) return null;
  try {
    const { data, error } = await withTimeout(supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS), RPC_TIMEOUT_MS, 'opening the file');
    if (error) return null;
    return data?.signedUrl || null;
  } catch { return null; }
}

export async function removeDocument(path) {
  if (!path) return { ok: true, skipped: true };
  try {
    const { error } = await withTimeout(supabase.storage.from(BUCKET).remove([path]), RPC_TIMEOUT_MS, 'removing the file');
    if (error) return fail('delete-failed', error);
    return { ok: true };
  } catch (e) { return fail('network-error', e); }
}

// Best-effort removal of every pointer a packet holds; reports what failed so
// the caller never claims a clean delete it did not get.
export async function removePacketFiles(view) {
  const docs = (view && view.packet && view.packet.documents) || {};
  const paths = Object.values(docs).map((d) => d && d.path).filter(Boolean);
  if (!paths.length) return { ok: true, removed: 0, failed: [] };
  try {
    const { error } = await withTimeout(supabase.storage.from(BUCKET).remove(paths), RPC_TIMEOUT_MS, 'removing the files');
    if (error) return { ok: false, removed: 0, failed: paths, message: tlcError(error) };
    return { ok: true, removed: paths.length, failed: [] };
  } catch (e) { return { ok: false, removed: 0, failed: paths, message: tlcError(e) }; }
}
