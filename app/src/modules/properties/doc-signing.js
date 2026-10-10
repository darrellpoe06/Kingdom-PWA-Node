// =============================================================================
// doc-signing — what a document's signing state means, and the fingerprint a
// signer's screen sends back (DR-0901, migration 0263)
// =============================================================================
// Darrell, 2026-10-10: "Documents should be able to work integrated with the
// options to digitally sign... so all necessary documents are populated into
// their respective places... also have paper documents we can upload to keep
// as records for tenants".
//
// The database fingerprints the exact bytes it holds (SHA-256 of
// storage_path) when signatures are requested, and refuses a signature whose
// fingerprint differs. This file computes the same fingerprint from the same
// string the signer's screen rendered, so a signature always names the bytes
// that were shown — never "a document", always THIS one.
//
// The words a signer agrees to are the house's own (lib/tlc-signing.js,
// DR-0350): the attestation that they read it in full, and the consent to sign
// electronically. Both are stored with the signature, not just a ticked box.
// =============================================================================
import { ESIGN_CONSENT, acknowledgmentAttestation } from '../../lib/tlc-signing.js';

export { ESIGN_CONSENT, acknowledgmentAttestation };

/** SHA-256 of a string's UTF-8 bytes, as lowercase hex — what 0263 computes. */
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ROLE_WORD = { tenant: 'tenant', landlord: 'landlord' };

/**
 * Where a document stands, in words, from its row and its signatures:
 * { state, needs: roles still to sign, signed: [{role, signature, at}], line }.
 */
export function signingState(doc = {}, signatures = []) {
  const mine = (signatures || []).filter((s) => s.document_id === doc.id);
  const signed = mine.map((s) => ({ role: s.signer_role, signature: s.signature, at: s.signed_at }));
  const required = doc.signers_required || [];
  const needs = required.filter((r) => !signed.some((s) => s.role === r));
  const state = doc.sign_status || 'none';
  let line = '';
  if (state === 'awaiting') line = `Waiting for the ${needs.map((r) => ROLE_WORD[r] || r).join(' and ')} to sign`;
  if (state === 'signed') line = 'Signed by everyone';
  if (state === 'void') line = 'Withdrawn';
  return { state, needs, signed, line };
}

/** Can this seat sign this document now? role: 'tenant' | 'landlord'. */
export function canSign(doc, signatures, role) {
  const s = signingState(doc, signatures);
  return s.state === 'awaiting' && s.needs.includes(role);
}

/** The text a data URL holds, for a text document; null for anything else. */
export function dataUrlText(url = '') {
  const m = /^data:(text\/[a-z+.-]+)(;charset=[^;,]+)?(;base64)?,(.*)$/is.exec(String(url));
  if (!m) return null;
  try {
    return m[3] ? new TextDecoder().decode(Uint8Array.from(atob(m[4]), (c) => c.charCodeAt(0))) : decodeURIComponent(m[4]);
  } catch { return null; }
}

/** A generated document's lines as the stored file (a UTF-8 text data URL). */
export function textDataUrl(lines = []) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent((lines || []).join('\n'))}`;
}

/** The property_documents kind a generated document files under. */
export function kindForGenerated(id = '') {
  if (String(id).startsWith('lease')) return 'lease';
  if (id === 'house-rules') return 'rules';
  if (String(id).startsWith('notice') || id === 'move-out-deposit') return 'notice';
  if (id === 'move-in-condition') return 'inspection';
  if (String(id).startsWith('application')) return 'correspondence';
  return 'other';
}
