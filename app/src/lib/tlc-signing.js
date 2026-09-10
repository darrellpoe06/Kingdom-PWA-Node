// =============================================================================
// tlc-signing — what a typed signature in the packet actually pins (DR-0350)
// =============================================================================
// Darrell 2026-09-10: "how do the users acknowledge they read and agree to
// the documents we need signatures for?"
//
// The packet's three acknowledgments (0187) are: the document read in place,
// a checkbox ("I have read this and I agree"), the full legal name typed as
// the signature, a date. The server refuses a submit without all three. What
// was MISSING for the record to stand on its own later: WHICH TEXT was signed
// (the agreements are data in the app and will be revised), a precise time,
// and the consent to sign electronically that ESIGN / UETA expect. This module
// supplies the first and the third as pure data; the time is stamped by the
// form at signing (the device) AND by the office at submit (0194,
// acknowledgments.<key>.signedAtServer); the checkbox carries its own
// sentence (acknowledgmentAttestation) so the record says what was agreed.
//
// The version is a content hash of the document as the app renders it, so a
// signature made on 2026-09-10 says "v9f3a21c0" and a later edit to the
// handbook yields a different version: the reader can tell what was signed.
// =============================================================================
import { TLC_AGREEMENTS } from './tlc-agreements.js';
import { TLC_HANDBOOK } from './tlc-handbook.js';

/**
 * The checkbox sentence (Darrell 2026-09-10: "say 'by checking here you agree'
 * — something that says they acknowledged it"). Stored with the signature at
 * the moment it is checked, so the record says what was agreed to, not only
 * that a box was ticked. The office's clock stamps the submit (0194).
 */
export function acknowledgmentAttestation(docName) {
  return `By checking this box, I acknowledge that I have read the ${String(docName || 'document').trim()} in full and I agree to be bound by it.`;
}

/** The consent line under every signature box. */
export const ESIGN_CONSENT = 'By typing my full legal name I sign this document electronically, and I agree that this electronic signature has the same force as my handwritten signature.';

/** FNV-1a, 32-bit, over a string: short, stable, dependency-free. */
export function contentHash(s) {
  let h = 0x811c9dc5;
  const str = String(s == null ? '' : s);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** The document a packet acknowledgment key points at, as the app renders it. */
export function documentFor(key) {
  if (key === 'policies') return TLC_HANDBOOK;
  return TLC_AGREEMENTS[key] || null;
}

/** "v" + the content hash of the document text; null when the key names nothing. */
export function documentVersion(key) {
  const doc = documentFor(key);
  return doc ? `v${contentHash(JSON.stringify(doc))}` : null;
}

/** Every acknowledgment key with its current version, for the readout and the tests. */
export function documentVersions(keys = ['policies', 'confidentiality', 'contractorAgreement']) {
  return Object.fromEntries(keys.map((k) => [k, documentVersion(k)]));
}

/** What a signature pins: name, when (device time), which text. Pure; the form calls it once at signing. */
export function signatureRecord({ signature, key, now = new Date() } = {}) {
  const name = String(signature || '').trim();
  const at = now instanceof Date ? now.toISOString() : String(now || '');
  return name
    ? { signature: name, signedOn: at.slice(0, 10), signedAt: at, docVersion: documentVersion(key) || '' }
    : { signature: '', signedOn: '', signedAt: '', docVersion: '' };
}
