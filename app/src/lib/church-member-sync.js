// =============================================================================
// church-member-sync — the seam for a person's record and shelf (0209, DR-0357)
// =============================================================================
// Four doors, and no fifth:
//
//   readMyChurchRecord       church_member_record_read        — your own row;
//                            it starts itself, empty, on the first read, so
//                            there is never a "create your record" step.
//   patchMyChurchRecord      church_member_record_patch       — your own cells,
//                            any of them, any time. NOT an office function:
//                            nobody fills in somebody else's answers about
//                            their own life.
//   signChurchCovenant       church_member_record_acknowledge — the covenant,
//                            signed where it is read, stamped by the server's
//                            clock. The patch guard refuses an acknowledgments
//                            cell on purpose, so this is the only door.
//   readChurchRoll           church_roll_read                 — the office's
//                            read, owner/admin only, returning a NAMED set of
//                            cells. A question added to the intake tomorrow
//                            does not silently become visible to the office.
//
// The shelf rides RLS directly (church_documents): a row is private to whoever
// filed it until they share it with the office, and sharing does not hand over
// the pen — update and delete stay with the filer. Bytes live in the private
// `church-documents` bucket and open only through a short-lived signed URL.
//
// The refused keys are refused HERE and by the database. Two walls on purpose:
// the client one gives a plain sentence, the server one is the wall (DR-0060).
// =============================================================================
import supabase from './supabase.js';
import { CHURCH_MEMBER_REFUSED_KEYS, normalizeMemberRecord } from './church-member-intake.js';
import { churchDocumentPath, validateChurchDocument, validateChurchFile } from './church-shelf.js';

export const BUCKET = 'church-documents';
export const RPC_TIMEOUT_MS = 15000;
export const UPLOAD_TIMEOUT_MS = 120000;
export const SIGNED_URL_TTL_SECONDS = 300;

// ONE ATTEMPT WAS THE DEFECT (DR-1053). Darrell, 2026-10-15, on My Record at The
// Love Corner: "Your record could not be opened. opening your record timed out
// after 15000 ms." church_member_record_read (0212) RAISES on every named
// failure — 'sign in first', 'no church to read', 'that is not your church' —
// and a RAISE returns as a PostgREST error in milliseconds. So a 15 s timeout
// is none of those. It is the request never completing: one attempt, on a
// phone, all or nothing, and a dead end on screen.
//
// So the read asks three times instead of once, with the SAME total patience a
// person already spends: 3 x 5000 ms + 300 + 900 = 16.2 s worst case against
// the old 15 s single shot. And only a NO-ANSWER is retried — if the server
// spoke, its answer is the answer, and asking again only doubles the wait.
export const READ_ATTEMPT_MS = 5000;
export const READ_TRIES = 3;
export const READ_BACKOFF_MS = [300, 900];

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}
function fail(reason, msg) { return { ok: false, reason, message: msg }; }

const sleepReal = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function rpc(name, args, what, opts = {}) {
  const tries = Number.isFinite(opts.tries) ? Math.max(1, opts.tries) : 1;
  const attemptMs = Number.isFinite(opts.attemptMs) ? opts.attemptMs : RPC_TIMEOUT_MS;
  const sleep = opts.sleep || sleepReal;
  let last = { ok: false, reason: 'network-error', message: 'That did not go through.', attempts: 0 };
  for (let i = 0; i < tries; i += 1) {
    try {
      const { data, error } = await withTimeout(supabase.rpc(name, args), attemptMs, what);
      // The server spoke. Its answer is the answer — never retried.
      if (error) return { ok: false, reason: 'rpc-error', message: message(error), attempts: i + 1 };
      return { ok: true, data, attempts: i + 1 };
    } catch (e) {
      last = { ok: false, reason: 'network-error', message: message(e), attempts: i + 1 };
      if (i < tries - 1) await sleep(READ_BACKOFF_MS[Math.min(i, READ_BACKOFF_MS.length - 1)] || 0);
    }
  }
  return last;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return (data && data.user && data.user.id) || null;
}

const view = (data, church = null) => ({
  recordId: data.record_id,
  instanceId: data.instance_id,
  churchName: data.church_name || '',
  record: normalizeMemberRecord(data.record, church),
  myRole: data.my_role || '',
  updatedAt: data.updated_at || null,
});

// ---------------------------------------------------------------------------
// THE RECORD
// ---------------------------------------------------------------------------

/**
 * Your own record at your church. Starts itself, empty, the first time.
 *
 * Asked up to READ_TRIES times (DR-1053) — a stalled first attempt on a phone
 * is not the whole answer. `retryable` tells the surface whether a Try again
 * button can help: a server that answered will answer the same way again.
 */
export async function readMyChurchRecord(instanceId = null, church = null, opts = {}) {
  const res = await rpc('church_member_record_read', { instance_in: instanceId }, 'opening your record',
    { tries: READ_TRIES, attemptMs: READ_ATTEMPT_MS, ...opts });
  if (!res.ok) return { ...res, retryable: res.reason === 'network-error' };
  return { ok: true, view: view(res.data, church) };
}

/** Fill or correct named cells of your own record. Only what changed travels. */
export async function patchMyChurchRecord(patch, note = '', instanceId = null, church = null) {
  const clean = patch && typeof patch === 'object' ? { ...patch } : {};
  for (const k of CHURCH_MEMBER_REFUSED_KEYS) {
    if (k in clean) {
      return fail('refused', k === 'givingAmount' || k === 'givingTotal' || k === 'income'
        ? 'This record never holds what you give or what you earn. Remove it and save the rest.'
        : k === 'diagnosis' ? 'This record never holds a diagnosis. Remove it and save the rest.'
          : 'This record never holds that. Remove it and save the rest.');
    }
  }
  if ('acknowledgments' in clean) return fail('refused', 'A signature is made on the document itself, never through a cell.');
  if (!Object.keys(clean).length) return fail('empty', 'Nothing changed.');
  const res = await rpc('church_member_record_patch',
    { patch_in: clean, note_in: note || null, instance_in: instanceId }, 'saving your record');
  if (!res.ok) return res;
  return { ok: true, view: view({ ...res.data, church_name: '', my_role: '' }, church) };
}

/** Sign the church covenant where it is read. */
export async function signChurchCovenant(key, { signature, docVersion = '', attestation, agreedAt = '' } = {}, instanceId = null, church = null) {
  if (!String(signature || '').trim()) return fail('no-signature', 'Sign by typing your full legal name.');
  if (!String(attestation || '').trim()) return fail('no-attestation', 'Check the box to acknowledge the document.');
  const res = await rpc('church_member_record_acknowledge', {
    key_in: key, signature_in: String(signature).trim(), doc_version_in: docVersion || null,
    attestation_in: attestation, agreed_at_in: agreedAt || null, instance_in: instanceId,
  }, 'recording your signature');
  if (!res.ok) return res;
  return { ok: true, view: view({ ...res.data, church_name: '', my_role: '' }, church) };
}

/** The office's read of the roll. Owner/admin only — the server decides, not this. */
export async function readChurchRoll(instanceId = null) {
  const res = await rpc('church_roll_read', { instance_in: instanceId }, 'opening the roll');
  if (!res.ok) return { ...res, rows: [] };
  const d = res.data || {};
  return { ok: true, rows: Array.isArray(d.rows) ? d.rows : [], count: d.count || 0, instanceId: d.instance_id || null };
}

// ---------------------------------------------------------------------------
// THE SHELF
// ---------------------------------------------------------------------------
const fromRow = (r) => ({
  id: r.id,
  instanceId: r.instance_id,
  filedBy: r.filed_by,
  title: r.title,
  kind: r.kind,
  note: r.note || '',
  storagePath: r.storage_path || '',
  paperLocation: r.paper_location || '',
  sharedWithOffice: r.shared_with_office === true,
  createdAt: r.created_at,
  updatedAt: r.updated_at || null,
});

const COLUMNS = 'id, instance_id, filed_by, title, kind, note, storage_path, paper_location, shared_with_office, created_at, updated_at';

/** Everything this person may see on the church shelf — RLS decides, not a filter. */
export async function listChurchDocuments(instanceId = null) {
  try {
    let q = supabase.from('church_documents').select(COLUMNS).order('created_at', { ascending: false });
    if (instanceId) q = q.eq('instance_id', instanceId);
    const { data, error } = await withTimeout(q, RPC_TIMEOUT_MS, 'reading the shelf');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), rows: [] };
    return { ok: true, rows: (data || []).map(fromRow) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), rows: [] };
  }
}

/** Put a file in the private bucket. Returns the pointer the row will carry. */
export async function uploadChurchDocumentFile({ file, slug, instanceId }) {
  const check = validateChurchFile(file);
  if (!check.ok) return fail('bad-file', check.message);
  if (!instanceId) return fail('no-instance', 'No church to file this in.');
  const userId = await currentUserId();
  if (!userId) return fail('signed-out', 'Sign in first.');
  const path = churchDocumentPath({ instanceId, userId, slug, fileName: file.name });
  try {
    const { error } = await withTimeout(
      supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' }),
      UPLOAD_TIMEOUT_MS, 'uploading the file');
    if (error) return fail('upload-error', message(error));
    return { ok: true, pointer: { storagePath: path, fileName: file.name, fileSize: file.size } };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/** File a document on your shelf — a file, a pointer to the paper, or both. */
export async function saveChurchDocument(doc, instanceId) {
  const errors = validateChurchDocument(doc);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  if (!instanceId) return fail('no-instance', 'No church to file this in.');
  const userId = await currentUserId();
  if (!userId) return fail('signed-out', 'Sign in first.');
  const row = {
    instance_id: instanceId,
    filed_by: userId,
    title: String(doc.title).trim(),
    kind: doc.kind,
    note: doc.note || null,
    storage_path: doc.storagePath || null,
    paper_location: doc.paperLocation || null,
    shared_with_office: doc.sharedWithOffice === true,
  };
  try {
    const { data, error } = await withTimeout(
      supabase.from('church_documents').insert(row).select(COLUMNS).single(),
      RPC_TIMEOUT_MS, 'filing the document');
    if (error) return fail('rpc-error', message(error));
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/** Share a document with the office, or take it back. The pen stays with you. */
export async function shareChurchDocument(id, shared) {
  try {
    const { data, error } = await withTimeout(
      supabase.from('church_documents')
        .update({ shared_with_office: shared === true, updated_at: new Date().toISOString() })
        .eq('id', id).select(COLUMNS).single(),
      RPC_TIMEOUT_MS, 'changing who can see it');
    if (error) return fail('rpc-error', message(error));
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/** A short-lived link to the bytes. Never stored, never shared onward. */
export async function signedChurchDocumentUrl(storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS),
      RPC_TIMEOUT_MS, 'opening the file');
    if (error) return null;
    return (data && data.signedUrl) || null;
  } catch { return null; }
}

/** Remove a document — the row and, when there is one, the file with it. */
export async function removeChurchDocument(row) {
  if (!row || !row.id) return fail('no-row', 'Nothing to remove.');
  try {
    if (row.storagePath) {
      await withTimeout(supabase.storage.from(BUCKET).remove([row.storagePath]), RPC_TIMEOUT_MS, 'removing the file').catch(() => null);
    }
    const { error } = await withTimeout(
      supabase.from('church_documents').delete().eq('id', row.id), RPC_TIMEOUT_MS, 'removing the document');
    if (error) return fail('rpc-error', message(error));
    return { ok: true, removed: true };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/**
 * Your own record as a plain, labelled file — DATA-AS-EMPOWERMENT: a record you
 * cannot take with you is not yours. Nothing is summarized and nothing is left
 * out; this is what the church holds, in your hands.
 */
export function exportChurchMemberRecord(v, sections = []) {
  const record = normalizeMemberRecord(v && v.record);
  const answers = {};
  for (const s of sections) {
    for (const f of s.fields || []) {
      if (f.type === 'acknowledgment') continue;
      const val = record[f.key];
      const empty = Array.isArray(val) ? val.length === 0 : val === null || String(val ?? '').trim() === '';
      if (!empty) answers[f.label] = val;
    }
  }
  const signed = {};
  for (const [k, a] of Object.entries(record.acknowledgments || {})) {
    if (a && a.agreed) signed[k] = { signature: a.signature, signedOn: a.signedOn, documentVersion: a.docVersion, receivedByTheApp: a.signedAtServer };
  }
  return {
    church: (v && v.churchName) || '',
    exportedAt: new Date().toISOString(),
    answers,
    signed,
    note: 'This is your record, as your church holds it. It is yours: correct it, keep it, or ask for it to be removed. It holds no giving amount, because this app never stores one.',
  };
}
