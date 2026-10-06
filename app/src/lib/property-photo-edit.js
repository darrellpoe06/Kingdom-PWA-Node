// =============================================================================
// property-photo-edit — add a photo to an address, and take one off it
// =============================================================================
// Christina 2026-10-06, relayed by Darrell: "I would like to be able to delete
// and add photos to the different addresses in Real Estate." She is standing on
// Real Estate → a property card → PHOTOS, looking at the read-only strip headed
// "PROPERTY PHOTOS · OLDEST → LATEST · 66 IN THE ARCHIVE" (components/Rentals.jsx,
// PropertyGallery). Until now that strip could only be READ.
//
// THE REALITY-TRACE THIS IS BUILT ON (P15; run before a line of this was written).
// Two different real stores sit behind that one strip, and they are not the same
// kind of thing:
//
//   ARCHIVE (the 66) — rows in the NAS's Synology Chat postgres: `posts` joined
//     to `channels` on the channel name, filtered to is_image (photo_server.py,
//     query_rows). The address → channel name mapping is PROPERTY_CHANNELS in
//     nas-photos.js ('r-1508hh' → '1508HH'). The thumbnail is resolved off disk
//     from the chat file's own name against the phone-backup DCIM roots. So the
//     BYTES of an archive photo are the family's phone backup, and the RECORD is
//     Synology Chat history — two systems of record this app does not own.
//
//   ADDED (new) — real files under <upload_root>/<dest>/ on the NAS, written by
//     the existing sovereign write path POST /nas-photos/upload { dest, filename,
//     dataUrl } (photo_server.py do_POST). Passing the property's channel name as
//     `dest` gives each address its own real folder. This app owns those bytes.
//
// So ADD is simply the existing road with the address's own `dest`, and REMOVE
// means two different things — both of which are RECOVERABLE on purpose:
//
//   added   → the NAS MOVES the file into <dest>/.trash/. Nothing is unlinked.
//   archive → the NAS records the post id in <dest>/.hidden.json, so the photo
//             stops showing AT THIS ADDRESS on every family device while the
//             chat post and the phone-backup original stay exactly as they are.
//
// Deleting a chat post or a phone-backup original from a button in a PWA would be
// destructive against two systems of record that are not ours; we do not do it,
// and the confirm copy SAYS which removal the person is about to get rather than
// implying an erase that never happens (DR-0076 — the surface says the truth).
//
// This module is the pure, testable core: validation, the destination, the merge,
// the confirm copy, and a plain-words sentence for EVERY refusal — in the shape
// of uploadFailureMessage in lib/tax-upload.js. The network is injectable, so
// every branch is pinned by a test instead of by a claim. The road is reused:
// NAS_PHOTO_BASE, isValidDest, bridgeToken and uploadPlan all come from
// lib/nas-photos.js — there is no second photo road.
// =============================================================================

import { NAS_PHOTO_BASE, isValidDest, bridgeToken, uploadPlan } from './nas-photos.js';

/** The ceiling on a file this device will even try to read into memory. The NAS
 *  keeps up to 8 MiB of decoded image (photo_server.py MAX_UPLOAD_BYTES) and
 *  uploadPlan decides original-vs-reduced below that; this only stops a phone
 *  from trying to base64 a movie it picked by mistake. */
export const PHOTO_PICK_MAX_BYTES = 64 * 1024 * 1024;

export const PROPERTY_UPLOADS_PATH = `${NAS_PHOTO_BASE}/property-uploads`;
export const PROPERTY_PHOTO_REMOVE_PATH = `${NAS_PHOTO_BASE}/property-photo-remove`;

let fetcher = (typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null;
/** Tests inject the network; nothing else ever calls this. */
export function __setPhotoEditFetcher(fn) {
  fetcher = fn || ((typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null);
}

export function propertyUploadsUrl(dest, { limit = 200 } = {}) {
  return `${PROPERTY_UPLOADS_PATH}?dest=${encodeURIComponent(dest)}&limit=${limit}`;
}

// --- validation (pure; runs BEFORE any network call) --------------------------

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i;

/** Is this pick a photo this device can send? { ok, error }. The error is the
 *  whole sentence the screen shows — never a code the person has to decode. */
export function validatePhotoPick(file) {
  if (!file || typeof file.name !== 'string') {
    return { ok: false, error: 'Choose a photo to add to this address.' };
  }
  const name = file.name;
  const type = String(file.type || '').toLowerCase();
  const size = Number.isFinite(file.size) ? file.size : null;
  if (size === 0) {
    return { ok: false, error: `“${name}” is empty — there are no picture bytes in it. Nothing was sent.` };
  }
  const looksLikeImage = type.startsWith('image/') || IMAGE_EXT.test(name);
  if (!looksLikeImage) {
    const what = type ? `a ${type} file` : 'not a picture file';
    return { ok: false, error: `“${name}” is ${what}, and this address keeps pictures only — JPEG, PNG, WebP, or a HEIC straight off the phone. Nothing was sent.` };
  }
  if (size != null && size > PHOTO_PICK_MAX_BYTES) {
    return { ok: false, error: `“${name}” is ${mb(size)} MB, which is larger than this device will try to send in one go. Nothing was sent.` };
  }
  return { ok: true, error: null };
}

function mb(bytes) {
  return (Math.round((bytes / (1024 * 1024)) * 10) / 10).toLocaleString();
}

/** Where this address's added photos live on the NAS: the property's own chat
 *  channel name, which is also its folder under the sovereign upload root.
 *  Returns '' when the property has no channel the road accepts. */
export function destinationFor(channel) {
  const dest = String(channel || '').trim();
  return isValidDest(dest) ? dest : '';
}

// --- the confirm (DR-0691: the copy and the behavior are tested together) ------

/** The words shown before a removal. It NAMES the photo, says which recoverable
 *  removal this is, and promises what Cancel does — and the test that presses
 *  Cancel checks the photo stayed, so the promise cannot drift from the code. */
export function removeConfirmMessage(photo, { addressLabel = 'this address' } = {}) {
  const p = photo || {};
  const name = p.name || p.caption || p.id || 'this photo';
  const when = p.date ? ` from ${p.date}` : '';
  if (p.kind === 'added') {
    return [
      `Remove “${name}”${when} from ${addressLabel}?`,
      '',
      'It moves into this address’s Trash folder on the NAS. The picture is not erased — a steward can put it back from File Station.',
      '',
      'Cancel keeps the photo exactly where it is.',
    ].join('\n');
  }
  return [
    `Remove “${name}”${when} from ${addressLabel}?`,
    '',
    'This one came from this address’s Synology Chat history, and its picture is part of the phone backup. Removing it here takes it off this address on every family device — the chat message and the original photo are NOT deleted, and it can be brought back.',
    '',
    'Cancel keeps the photo exactly where it is.',
  ].join('\n');
}

// --- the grid merge (pure) ----------------------------------------------------

/** What this address's strip should show, given what the two stores answered.
 *  Archive photos the family has taken off this address are dropped; added
 *  photos with no thumbnail are dropped (a tile with no picture is a lie, not a
 *  photo). Returns { archive, added } — the caller sorts them into its strip. */
export function applyPropertyPhotoEdits({ archive = [], added = [], hidden = [] } = {}) {
  const hide = new Set((hidden || []).map((x) => String(x)));
  return {
    archive: (archive || []).filter((p) => p && !hide.has(String(p.id))),
    added: (added || []).filter((p) => p && p.thumb),
  };
}

// --- the network (every refusal comes back as data, never as a thrown error) ---

/** Read this address's added photos + its hidden list. Never throws. */
export async function fetchPropertyUploads(dest, { token = null, limit = 200 } = {}) {
  const key = token != null ? token : bridgeToken();
  if (!key) return { ok: false, skipped: 'no-key', photos: [], hidden: [] };
  if (!destinationFor(dest)) return { ok: false, skipped: 'bad-dest', photos: [], hidden: [] };
  if (!fetcher) return { ok: false, skipped: 'no-fetch', photos: [], hidden: [] };
  try {
    const res = await fetcher(propertyUploadsUrl(dest, { limit }), {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!res || !res.ok) {
      return { ok: false, skipped: 'read-error', status: res ? res.status : 0, photos: [], hidden: [] };
    }
    const json = await res.json().catch(() => ({}));
    const body = Array.isArray(json) ? (json[0] || {}) : (json || {});
    return { ok: true, photos: body.photos || [], hidden: body.hidden || [], total: body.total || 0 };
  } catch {
    return { ok: false, skipped: 'network-error', photos: [], hidden: [] };
  }
}

/** Put ONE photo on this address. `dataUrl` is the original bytes when they fit
 *  (uploadPlan) or the reduced copy; the caller decides which and says so.
 *  Reuses the existing sovereign write road — POST /nas-photos/upload — with the
 *  address's own dest. Returns { ok } or a refusal carrying the status + reason
 *  so the screen can say what happened. Never throws. */
export async function sendPropertyPhoto({ dataUrl, dest, filename } = {}, { token = null } = {}) {
  const key = token != null ? token : bridgeToken();
  if (!key) return { ok: false, skipped: 'no-key' };
  const to = destinationFor(dest);
  if (!to) return { ok: false, skipped: 'bad-dest' };
  if (!dataUrl) return { ok: false, skipped: 'no-bytes' };
  if (!fetcher) return { ok: false, skipped: 'no-fetch' };
  const safeName = String(filename || `photo-${Date.now()}.jpg`).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  try {
    const res = await fetcher(`${NAS_PHOTO_BASE}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ dest: to, filename: safeName, dataUrl }),
    });
    if (!res || !res.ok) {
      let error = null;
      try { const b = res && typeof res.json === 'function' ? await res.json() : null; error = (b && b.error) || null; } catch { /* not JSON */ }
      return { ok: false, skipped: 'upload-error', status: res ? res.status : 0, error };
    }
    const body = await res.json().catch(() => ({}));
    const payload = Array.isArray(body) ? (body[0] || {}) : (body || {});
    return payload && payload.ok
      ? { ok: true, id: payload.id, dest: to }
      : { ok: false, skipped: 'upload-error', status: 200, error: (payload && payload.error) || null };
  } catch {
    return { ok: false, skipped: 'network-error' };
  }
}

/** Take ONE photo off this address. `kind` is 'added' (the NAS moves the file to
 *  this address's Trash) or 'archive' (the NAS records the id so it stops showing
 *  here; the chat post and the original are untouched). Never throws. */
export async function removePropertyPhoto({ dest, id, kind } = {}, { token = null } = {}) {
  const key = token != null ? token : bridgeToken();
  if (!key) return { ok: false, skipped: 'no-key' };
  const to = destinationFor(dest);
  if (!to) return { ok: false, skipped: 'bad-dest' };
  const photoId = String(id || '').trim();
  if (!photoId) return { ok: false, skipped: 'no-id' };
  if (kind !== 'added' && kind !== 'archive') return { ok: false, skipped: 'bad-kind' };
  if (!fetcher) return { ok: false, skipped: 'no-fetch' };
  try {
    const res = await fetcher(PROPERTY_PHOTO_REMOVE_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ dest: to, id: photoId, kind }),
    });
    if (!res || !res.ok) {
      let error = null;
      try { const b = res && typeof res.json === 'function' ? await res.json() : null; error = (b && b.error) || null; } catch { /* not JSON */ }
      return { ok: false, skipped: 'remove-error', status: res ? res.status : 0, error, kind };
    }
    const body = await res.json().catch(() => ({}));
    const payload = Array.isArray(body) ? (body[0] || {}) : (body || {});
    return payload && payload.ok
      ? { ok: true, id: photoId, kind, where: payload.where || '' }
      : { ok: false, skipped: 'remove-error', status: 200, error: (payload && payload.error) || null, kind };
  } catch {
    return { ok: false, skipped: 'network-error', kind };
  }
}

// --- plain words for every refusal (the shape of tax-upload's uploadFailureMessage)

const KEY_HELP = 'A steward publishes the family key once in Real Estate → Photos, and every family device picks it up.';

/** One sentence a person can act on, for ANY refusal from the two calls above.
 *  There is no silent failure and no blank: every branch here ends in words.
 *  `action` is 'add' or 'remove' so the sentence says what did not happen. */
export function photoFailureMessage(res, { action = 'add', name = '' } = {}) {
  const r = res || {};
  const status = typeof r.status === 'number' ? r.status : 0;
  const it = name ? `“${name}”` : (action === 'remove' ? 'that photo' : 'the photo');
  const notDone = action === 'remove'
    ? `${it} is still on this address.`
    : `${it} was not added.`;

  if (r.skipped === 'invalid' && r.error) return r.error;
  if (r.skipped === 'no-key') {
    return `This device does not hold the family key yet, so nothing was sent and ${notDone} Sign in as a family member so the device can ask for the key. ${KEY_HELP}`;
  }
  if (r.skipped === 'bad-dest') {
    return `This property has no photo folder name the NAS accepts, so nothing was sent and ${notDone} A steward adds the address to PROPERTY_CHANNELS so it has its own folder.`;
  }
  if (r.skipped === 'no-bytes') return `The picture could not be read off this device, so nothing was sent and ${notDone}`;
  if (r.skipped === 'no-id') return `That tile carries no photo id, so nothing was sent and ${notDone}`;
  if (r.skipped === 'bad-kind') return `This app could not tell which store that photo came from, so nothing was sent and ${notDone}`;
  if (r.skipped === 'no-fetch') return `This device has no way to reach the network right now, so nothing was sent and ${notDone}`;
  if (r.skipped === 'network-error') {
    return `Nothing left this device — you appear to be offline. ${notDone} Try again when you have signal.`;
  }
  if (r.error === 'not-found') {
    return `The NAS has no photo by that name at this address any more — someone may have taken it off already. Nothing was changed.`;
  }
  if (status === 401 || status === 403) {
    return `The NAS refused this as unauthorized: this device’s family key is missing or no longer matches the NAS. ${notDone} ${KEY_HELP}`;
  }
  if (status === 404 || status === 405) {
    return action === 'remove'
      ? `The NAS photo service answered ${status} for the removal — this NAS is still running the older photo service, which has no removal endpoint yet. ${notDone} Redeploying infra/nas-property-photos on the NAS turns this on; adding photos already works.`
      : `The NAS photo service answered ${status}, so ${notDone} The service may be stopped or not yet redeployed on the NAS.`;
  }
  if (status === 413) {
    return `The NAS refused ${it} as too large — it keeps up to 8 MB per picture. ${notDone} A smaller copy of the same picture will go through.`;
  }
  if (status === 415) {
    return `The NAS looked inside ${it} and it is not a JPEG, PNG or WebP. ${notDone} Pictures only.`;
  }
  if (status === 400) {
    return `The NAS refused the request as malformed${r.error ? ` (${r.error})` : ''}, so ${notDone}`;
  }
  if (status === 502 || status === 503) {
    return `The NAS did not answer (${status}) — the photo service or the road to it is down right now. ${notDone} It reconnects on its own; try again shortly.`;
  }
  if (status) {
    return `The NAS photo service answered ${status}, so ${notDone}`;
  }
  return `The NAS photo service could not be reached, so ${notDone}`;
}

/** What to say when it WORKED — so a success is as plain as a refusal, and the
 *  person knows which recoverable removal they just got. */
export function removalDoneMessage(res, { name = '' } = {}) {
  const it = name ? `“${name}”` : 'That photo';
  if (res && res.kind === 'added') {
    return `${it} is off this address. The picture moved into this address’s Trash folder on the NAS — it was not erased.`;
  }
  return `${it} is off this address on every family device. The Synology Chat message and the original photo on the NAS were not touched.`;
}

/** The per-file line after an add: which bytes went, in plain words. */
export function addDoneMessage(plan, { name = '' } = {}) {
  const it = name ? `“${name}”` : 'The photo';
  if (plan && plan.mode === 'original') {
    return `${it} was added to this address — the original picture, full size, on the NAS.`;
  }
  const why = plan && plan.reason === 'too-large'
    ? 'the original is larger than one upload carries'
    : plan && plan.reason === 'type-not-kept'
      ? 'the NAS keeps JPEG, PNG and WebP, and this was another kind'
      : 'this device could not read the original size';
  return `${it} was added to this address as a reduced copy, because ${why}.`;
}

export { uploadPlan };
