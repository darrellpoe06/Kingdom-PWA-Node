// =============================================================================
// apply-link — the address a QR code on a property points at
// =============================================================================
// Darrell, 2026-08-27: "Have a person scan a qr code to apply for an open spot."
//
// WHAT THE CODE HAS TO DO, and what it must not. Someone standing at the door
// of a vacant unit points a camera at a card in the window and lands on the
// application FOR THAT UNIT — no typing an address, no hunting a listing, and
// crucially no account: 0152 already made applying open to anyone, because a
// person who has not decided to rent from you should not have to sign up to ask
// about it. "You only need to create an account for lease or for a short term
// lease" (Darrell) — the account is for taking the place, not for asking.
//
// The link carries a rental ID and NOTHING ELSE. Not the address, not the rent,
// not a token. Two reasons:
//   * A QR code is printed and left in a window. Anything encoded in it is
//     public forever, readable by anyone walking past, and cannot be revoked.
//     An id is only useful against public_vacancies(), which already refuses to
//     answer for a door that is not advertised or not free — so a stale card in
//     an old window degrades to "this one is not available", which is the truth.
//   * A token would imply a permission. There is no permission here: applying
//     grants nothing and reads nothing back (0152 — not even the applicant can
//     read their own application). A link that looks like a key invites someone
//     to treat it as one.
//
// The canonical origin is used, not the current one, because the card is
// scanned by a phone that has never been to a preview build or the NAS.
// =============================================================================
import { CANONICAL_APP_ORIGIN } from '../../lib/app-share.js';
import { POE_PROPERTIES } from './config.js';

/** The query key. One place, so the builder and the reader cannot drift. */
export const APPLY_PARAM = 'apply';

const isId = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v ?? '').trim());

/**
 * The URL a QR on a specific door encodes. Falls back to the general door when
 * no unit is given, so a card can also just say "Poe Properties" — a code that
 * silently pointed nowhere would be worse than one that points at the front.
 */
export function applyUrl(rentalId) {
  const base = `${CANONICAL_APP_ORIGIN}${POE_PROPERTIES.scope}`;
  return isId(rentalId) ? `${base}?${APPLY_PARAM}=${rentalId}` : base;
}

/** The same address without the scheme — easier to read aloud or type. */
export function applyUrlDisplay(rentalId) {
  return applyUrl(rentalId).replace(/^https?:\/\//, '');
}

/**
 * Read the unit out of a location. Returns null for anything that is not a
 * well-formed id, so a mangled scan or a hand-edited URL lands on the ordinary
 * door instead of querying with junk.
 */
export function readApplyTarget(search = '') {
  const s = String(search ?? '');
  try {
    const params = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s);
    const v = params.get(APPLY_PARAM);
    return isId(v) ? v.toLowerCase() : null;
  } catch { return null; }
}

/**
 * The unit a scan asked for, IF it is actually on offer. A card left in a
 * window after the unit was taken must not open an application for it — the
 * vacancies list is the authority, and it already excludes anything unadvertised
 * or occupied. Returns what the door should show and why.
 */
export function resolveScan(rentalId, vacancies = []) {
  if (!rentalId) return { unit: null, matched: false, reason: null };
  const unit = vacancies.find((v) => v.id === rentalId) || null;
  if (unit) return { unit, matched: true, reason: null };
  return {
    unit: null,
    matched: false,
    // Said plainly, and without implying the person did something wrong.
    reason: 'That unit is not available right now. Here is everything that is.',
  };
}

/** A line for the printed card, so the paper says what the code does. */
export function cardCaption(unitLabel) {
  const where = String(unitLabel ?? '').trim();
  return where
    ? `Scan to apply for ${where} — no account needed`
    : 'Scan to see what is available — no account needed';
}
