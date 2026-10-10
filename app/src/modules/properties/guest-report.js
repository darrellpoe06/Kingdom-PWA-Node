// =============================================================================
// guest-report — the card inside a door that lets a guest say what is wrong
// (DR-0898, migration 0261)
// =============================================================================
// Darrell, 2026-10-10: "even a person walking through an Airbnb or short-term
// rental works great for getting work done or issues with systems or cleaning
// done asap".
//
// The card on the fridge carries a KEY, unlike the apply card in the window
// (apply-link.js carries only an id, because applying grants nothing). A guest
// report writes onto the family's Work board and pings the office, so it is a
// permission: one door, minted by the family in the database, replaced by
// opening a new one, ended by closing it. Everything that decides whether a
// report is accepted lives in the database (0261); this file only builds the
// address and checks the form before it is sent, so a guest is told what is
// missing without a round trip.
// =============================================================================
import { CANONICAL_APP_ORIGIN } from '../../lib/app-share.js';
import { POE_PROPERTIES } from './config.js';

/** The query key, one place so the builder and the reader cannot drift. */
export const REPORT_PARAM = 'report';

const isToken = (v) => /^[0-9a-f]{64}$/.test(String(v ?? '').trim().toLowerCase());

/** The address the card's code opens. Null for anything that is not a key. */
export function reportUrl(token) {
  if (!isToken(token)) return null;
  return `${CANONICAL_APP_ORIGIN}${POE_PROPERTIES.scope}?${REPORT_PARAM}=${String(token).trim().toLowerCase()}`;
}

/** The key a scan carried, or null for a missing or mangled one. */
export function readReportToken(search = '') {
  const s = String(search ?? '');
  try {
    const v = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s).get(REPORT_PARAM);
    return isToken(v) ? v.trim().toLowerCase() : null;
  } catch { return null; }
}

/** The limits 0261 enforces, mirrored so the form can say so first. */
export const GUEST_LIMITS = Object.freeze({ title: 160, detail: 2000, name: 80, contact: 120 });

/**
 * Check a guest's report before it is sent. The database refuses the same
 * things; this only saves the guest a trip and says it in plain words.
 */
export function validateGuestReport(form = {}) {
  const title = String(form.title ?? '').trim();
  const errors = {};
  if (title.length < 2) errors.title = 'Say what is wrong in a few words.';
  else if (title.length > GUEST_LIMITS.title) errors.title = `Keep it under ${GUEST_LIMITS.title} characters; add the rest below.`;
  if (String(form.detail ?? '').length > GUEST_LIMITS.detail) errors.detail = `Please keep this under ${GUEST_LIMITS.detail} characters.`;
  if (String(form.name ?? '').trim().length > GUEST_LIMITS.name) errors.name = 'That name is longer than this form takes.';
  if (String(form.contact ?? '').trim().length > GUEST_LIMITS.contact) errors.contact = 'That is longer than this form takes.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** The words printed under the code, so the paper says what it does. */
export function guestCardCaption(label) {
  const where = String(label ?? '').trim();
  return where
    ? `Something wrong at ${where}? Scan to tell us. No account needed.`
    : 'Something wrong here? Scan to tell us. No account needed.';
}
