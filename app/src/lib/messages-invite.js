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

// ---------------------------------------------------------------------------
// Cellphone as first-class CONTACT data (Darrell 2026-07-27: "Does it have to
// be email only... cellphone number?... only cellphone and add email whenever").
//
// The design, sovereign and honest (DR-0231, DR-0076): EMAIL is the account
// KEY — sign-in is an email magic-link, so a space-access GRANT is matched to a
// person by email. That is a sovereignty choice, not a limitation: no carrier,
// no paid SMS-OTP gateway, no third party owns the login. CELLPHONE is captured
// as real contact data and used to DELIVER the invite over the phone's OWN
// texting app (native sms:, still no gateway) and to tap-to-call/text later.
// So: a contact can be reached by phone NOW; email is what unlocks the access
// grant, and can be added "whenever" as another data point.
// These helpers are pure — the Messages surface wires them.
// ---------------------------------------------------------------------------

/** Keep a leading +, then digits only — a tel/sms-safe number. '' when unusable. */
export function normalizePhone(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const plus = s.startsWith('+') ? '+' : '';
  const digits = s.replace(/\D/g, '');
  return digits ? `${plus}${digits}` : '';
}

/** A plausible cellphone: 7–15 digits (E.164 caps at 15), forgiving of format. */
export function isLikelyPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** tel: URI for a tap-to-call action. '' when the number is unusable. */
export function telHref(raw) {
  const n = normalizePhone(raw);
  return n ? `tel:${n}` : '';
}

/**
 * sms: URI addressed to a SPECIFIC number when we have one (so "Text it" goes
 * straight to them), falling back to the recipient-less form. Body prefilled.
 */
export function smsHrefTo(phone, text) {
  const n = normalizePhone(phone);
  const t = String(text || '').trim();
  if (!t) return '';
  return n ? `sms:${n}?&body=${encodeURIComponent(t)}` : `sms:?&body=${encodeURIComponent(t)}`;
}

/**
 * The text for a PHONE-ONLY contact — no email yet, so no access grant and no
 * one-time link (a claim link with no bound email would be a painted promise,
 * DR-0076). It prompts them to install and sign in; once they sign in with an
 * email you add here, the access grant completes. Always returns { ok:true }.
 */
export function installPromptText({ spaceName = '' } = {}) {
  const space = String(spaceName || '').trim();
  const where = space ? `me on the ${space} space in PoeTech` : 'me on PoeTech';
  return { ok: true, text: `Come join ${where}. Install and sign in at ${POETECH_APP_URL} — then I can add you.` };
}
