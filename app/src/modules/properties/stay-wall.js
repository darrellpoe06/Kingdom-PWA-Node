// =============================================================================
// stay-wall — a picture of life at the property, signed over and approved
// (DR-1010, migration 0289)
// =============================================================================
// The task as spoken: "Tenant and guest stay pictures: a community wall ('Life
// at 805') plus advertising, with a signed rights assignment and the family's
// approval."
//
// Pure data and rules. The WORDING here is the same text 0289 seeds as
// version v1 — a test proves the two are byte-for-byte the same, because the
// database fingerprints its copy (SHA-256) and refuses a signature whose
// fingerprint differs. The form signs what the DATABASE handed it
// (stay_wall_wording), never this copy; this copy is for the record and the
// proof. A new wording is a new version row in the database, and a new
// constant here beside it — never a rewrite of either.
// =============================================================================
import { ESIGN_CONSENT, acknowledgmentAttestation } from '../../lib/tlc-signing.js';
import { sha256Hex } from './doc-signing.js';

export { ESIGN_CONSENT, sha256Hex };

/** The checkbox sentence a poster agrees to (the house's own, DR-0350). */
export const STAY_WALL_ATTESTATION = acknowledgmentAttestation('rights assignment');

export const WORDING_VERSION_V1 = 'v1';

/** The words 0289 seeds as v1. Plain ASCII, straight quotes, on purpose. */
export const WORDING_V1 = `Rights assignment for a picture shared on the Life wall

1. What I am giving. I assign to the owner of this property (the "Family") all right, title and interest, including copyright, in each picture I submit with this form, together with its caption. This assignment is made under 17 U.S.C. 204(a) and is signed electronically under the federal E-SIGN Act (15 U.S.C. 7001) and the Illinois Electronic Commerce Security Act.

2. What the Family may do. The Family may show these pictures on the community wall for this property, in its advertising and listings for this property, and on the Poe Properties and PoeTech surfaces that carry them, with or without my name as I have chosen on this form, now and in the future, without payment to me.

3. What I promise. I took these pictures myself, or I hold the rights to them and may assign them. Everyone who can be recognized in them has agreed to be shown. No one under eighteen appears in them unless a parent or guardian agreed. The pictures show nothing unlawful and nothing of another resident's private space without that resident's agreement.

4. What stays with me. I may ask at any time that a picture be taken down, and it will leave the public wall and any listing when I ask. The Family keeps the file as a record of the stay. The Family may decline or remove a picture at any time.

5. The record. My typed name on this form is my signature. The app records the version of these words, their fingerprint, the time on my device and the time on the server with each picture.`;

/** The three things a poster says are true, in the order the form asks. */
export const ATTESTATIONS = Object.freeze([
  { key: 'own', label: 'These are my own pictures, or I hold the rights to them.' },
  { key: 'consent', label: 'Everyone who can be recognized in them agreed to be shown.' },
  { key: 'minors', label: 'No one under eighteen is in them, or a parent or guardian agreed.' },
]);

export const LIMITS = Object.freeze({ caption: 300, name: 120, pictures: 6 });

/** The size the phone shrinks a picture to before it is sent (DR-0908's road). */
export const PICTURE_MAX_WIDTH = 1600;
export const PICTURE_QUALITY = 0.8;
export const THUMB_MAX_WIDTH = 320;
export const THUMB_QUALITY = 0.6;

/**
 * What stops a submission before it is sent, in the poster's words. Pure.
 * { ok, errors: { pictures?, name?, own?, consent?, minors?, read?, sign? } }
 */
export function validateSubmission(form = {}) {
  const errors = {};
  if (!Array.isArray(form.pictures) || form.pictures.length === 0) errors.pictures = 'Choose at least one picture.';
  if (Array.isArray(form.pictures) && form.pictures.length > LIMITS.pictures) errors.pictures = `Up to ${LIMITS.pictures} pictures at a time.`;
  if (String(form.name || '').trim().length < 2) errors.name = 'Type your full name; it is your signature.';
  if (String(form.name || '').trim().length > LIMITS.name) errors.name = `Up to ${LIMITS.name} characters.`;
  if (String(form.caption || '').length > LIMITS.caption) errors.caption = `Up to ${LIMITS.caption} characters.`;
  for (const a of ATTESTATIONS) if (!form[a.key]) errors[a.key] = 'Say this is true, or do not send the picture.';
  if (!form.read) errors.read = 'Read the rights assignment and say so.';
  if (!form.sign) errors.sign = 'Agree to sign electronically.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Where a picture stands, in words the poster and the family both read. */
export function statusLine(p = {}) {
  if (!p) return '';
  if (p.status === 'pending') return 'Waiting for the family to look at it';
  if (p.status === 'declined') return p.decline_reason ? `Not shown: ${p.decline_reason}` : 'Not shown';
  if (p.status === 'removed') return 'Taken down';
  if (p.status === 'approved' && p.removal_asked_at) return 'You asked for it to come down; it is off the wall';
  if (p.status === 'approved') return p.listing_photo_id ? 'On the wall and in the listing' : 'On the wall';
  return String(p.status || '');
}

/**
 * The public walls, grouped: public_stay_walls() returns one row per picture
 * with its wall's key, label and listed doors; the shelf wants walls.
 * Pure. [{ key, label, doorIds, pictures: [...] }] in the order received.
 */
export function groupWalls(rows = []) {
  const walls = new Map();
  for (const r of rows || []) {
    if (!r || !r.wall_key) continue;
    if (!walls.has(r.wall_key)) walls.set(r.wall_key, { key: r.wall_key, label: r.wall_label || 'Life here', doorIds: (r.door_ids || []).map(String), pictures: [] });
    walls.get(r.wall_key).pictures.push(r);
  }
  return [...walls.values()];
}

/** Only the walls whose building has a card on this shelf. Pure. */
export function wallsForShelf(walls = [], shelfIds = []) {
  const on = new Set((shelfIds || []).map(String));
  return (walls || []).filter((w) => w.doorIds.some((id) => on.has(id)));
}

/** The storage key for the ids a guest card's device shared (to ask a take-down later). */
export const GUEST_SHARED_KEY = 'poe-stay-wall-shared';

export function rememberGuestShare(token, id, storage = globalThis.localStorage) {
  try {
    const all = JSON.parse(storage.getItem(GUEST_SHARED_KEY) || '{}');
    all[token] = [...new Set([...(all[token] || []), id])].slice(-20);
    storage.setItem(GUEST_SHARED_KEY, JSON.stringify(all));
  } catch { /* a device with no storage simply cannot ask later from this screen */ }
}

export function guestShares(token, storage = globalThis.localStorage) {
  try { return (JSON.parse(storage.getItem(GUEST_SHARED_KEY) || '{}')[token] || []).map(String); } catch { return []; }
}
