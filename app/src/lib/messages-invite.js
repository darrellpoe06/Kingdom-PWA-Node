// =============================================================================
// messages-invite — add a contact FROM Messages, and text them the invite
// =============================================================================
// Darrell 2026-07-27 (Messages screenshot): "I want to add a contact/s from
// here too... this location makes the most sense... to begin to text anyone
// and that could promote and prompt them to install the PoeTech App."
//
// The DM roster is server-derived (list_dm_contacts mirrors users_can_dm), so
// "adding a contact" = inviting the person into a space you lead — the SAME
// proven lane Admin uses (member-roles.js inviteToSpace; two-party confirm per
// DR-0187). This module is the pure half the Messages surface wires: who may
// add, and the ready-to-send text that turns the invite into the app prompt.
export const POETECH_APP_URL = 'https://poetech.us/poetech-app/';

/** Only a leader of at least one space can add contacts (invite = real access). */
export function canAddContacts(adminInstances) {
  return Array.isArray(adminInstances) && adminInstances.length > 0;
}

/**
 * The ready-to-send invite text — what his thumb actually sends. Returns
 * { ok, text }. A claim-link invite with NO link is refused (a text pointing
 * nowhere would be a painted promise, DR-0076).
 *   kind 'church' — access lands on their next sign-in; the text points at the app.
 *   kind 'claim'  — family/other spaces; the text carries the one-time link.
 */
export function inviteShareText({ kind, link = '', spaceName = '' } = {}) {
  const space = String(spaceName || '').trim();
  const where = space ? `the ${space} space on PoeTech` : 'PoeTech';
  if (kind === 'church') {
    return { ok: true, text: `You're invited to ${where}. Sign in at ${POETECH_APP_URL} and your access will be ready.` };
  }
  if (kind === 'claim') {
    const l = String(link || '').trim();
    if (!l) return { ok: false, text: '' };
    return { ok: true, text: `Join me on ${where} — open this one-time link to claim your spot: ${l}` };
  }
  return { ok: false, text: '' };
}

/** sms: URI that opens the phone's texting app with the invite prefilled. */
export function smsHref(text) {
  const t = String(text || '').trim();
  return t ? `sms:?&body=${encodeURIComponent(t)}` : '';
}
