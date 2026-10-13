// =============================================================================
// household-sync — the seam for the household's own record (0201, DR-0357)
// =============================================================================
// Read: household_record_read — any member of the household; the record starts
// itself, empty, on the first read, so there is never a "create it first" step.
// Fill: household_record_patch — an adult with a seat (owner/admin), any cell,
// any time, only the cells that changed.
// Sign: household_record_acknowledge — the covenant, in place, stamped by the
// server's own clock (0199's keep-or-renew rule).
//
// The forbidden keys are refused here AND by the database. Two walls on
// purpose: the client one gives a plain sentence, the server one is the wall.
// =============================================================================
import supabase from './supabase.js';
import { HOUSEHOLD_REFUSED_KEYS, normalizeHousehold } from './household-intake.js';

export const RPC_TIMEOUT_MS = 15000;

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

async function rpc(name, args, what) {
  try {
    const { data, error } = await withTimeout(supabase.rpc(name, args), RPC_TIMEOUT_MS, what);
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

const view = (data) => ({
  recordId: data.record_id,
  instanceId: data.instance_id,
  householdName: data.household_name || '',
  record: normalizeHousehold(data.record),
  myRole: data.my_role || '',
  updatedAt: data.updated_at || null,
});

/** The household's own record. Starts itself, empty, the first time. */
export async function readHousehold(instanceId = null) {
  const res = await rpc('household_record_read', { instance_in: instanceId }, 'opening the household record');
  if (!res.ok) return res;
  return { ok: true, view: view(res.data) };
}

/** Fill or correct named cells. Only what changed travels. */
export async function patchHousehold(patch, note = '', instanceId = null) {
  const clean = patch && typeof patch === 'object' ? { ...patch } : {};
  for (const k of HOUSEHOLD_REFUSED_KEYS) {
    if (k in clean) return fail('refused', `This app never holds ${k === 'diagnosis' ? 'a diagnosis' : 'that'}. Remove it and save the rest.`);
  }
  if ('acknowledgments' in clean) return fail('refused', 'A signature is made on the document itself, never through a cell.');
  if (!Object.keys(clean).length) return fail('empty', 'Nothing changed.');
  const res = await rpc('household_record_patch', { patch_in: clean, note_in: note || null, instance_in: instanceId }, 'saving the household record');
  if (!res.ok) return res;
  return { ok: true, view: view(res.data) };
}

/** Sign the household covenant where it is read. */
export async function acknowledgeHouseholdDocument(key, { signature, docVersion = '', attestation, agreedAt = '' } = {}, instanceId = null) {
  if (!String(signature || '').trim()) return fail('no-signature', 'Sign by typing your full legal name.');
  if (!String(attestation || '').trim()) return fail('no-attestation', 'Check the box to acknowledge the document.');
  const res = await rpc('household_record_acknowledge', {
    key_in: key, signature_in: String(signature).trim(), doc_version_in: docVersion || null,
    attestation_in: attestation, agreed_at_in: agreedAt || null, instance_in: instanceId,
  }, 'recording the acknowledgment');
  if (!res.ok) return res;
  return { ok: true, view: view(res.data) };
}

/**
 * The household's own record as a plain, labelled file — DATA-AS-EMPOWERMENT:
 * a record you cannot take with you is not yours.
 */
export function exportHouseholdRecord(v, sections = []) {
  const record = normalizeHousehold(v && v.record);
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
    household: (v && v.householdName) || '',
    exportedAt: new Date().toISOString(),
    answers,
    signed,
    note: 'This is your household record, as this app holds it. It is yours: correct it, keep it, or remove it.',
  };
}
