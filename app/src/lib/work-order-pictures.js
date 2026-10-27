// =============================================================================
// work-order-pictures — a picture on a work order, a picture on a note, and
// the name a picture is given (DR-1235)
// =============================================================================
// Darrell, 2026-10-27, from his phone on the work-order triage (#13, "Exhaust
// Fan and microwave installation inside apartment 2", CHECK IT):
//   (1) "Need to be able to upload pictures to the workorders and notes for
//       images"
//   (2) "also when adding a new name for an image it should be automatically
//       one of the options moving forward"
//
// REALITY-TRACE (P15, run before a line of this was written). The record a
// picture lives in is property_photos (0153): it already carried request_id
// ("a work order's before/after") and the kinds work-order-before / -after,
// and nothing wrote it. 0310 adds note_id (the tenancy_notes row a picture
// rides on) and incident_ref (the shell's Real Estate incident, keyed by
// text), and lets a work order or an incident be the anchor. A picture on a
// door's work order still carries rental_ref, so it shows on the door's wall
// beside the move-out set — one record, surfaced where the person is
// (DR-0065). The name a picture is given lives in picture_names (0310), one
// row per name per instance, matched without case: a name typed once is one
// of the options after, on every device.
//
// This module is pure. The screen (components/WorkOrderPictures.jsx) and the
// store (modules/properties/cloud.js) are elsewhere; everything here is
// pinned by a test instead of a claim (DR-0076).
// =============================================================================

const text = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

/** The key two spellings of one name share: no case, no stray spaces. */
export function pictureNameKey(name) {
  return text(name).toLowerCase();
}

/**
 * The names every instance starts with. Fixed only in the sense that they are
 * offered before anyone types; anything typed joins them (DR-1235 §2).
 */
export const PICTURE_NAME_DEFAULTS = Object.freeze(['Before', 'After', 'As found', 'Finished work', 'Receipt', 'Damage']);

/** The label the control shows for "another name". */
export const NEW_NAME_LABEL = 'Another name…';

/**
 * The options a picker offers: the defaults in their own order, then every
 * remembered name not already among them, A→Z without case; duplicates by
 * key fold into the FIRST spelling seen (the default's, or the first typed).
 * Deterministic: the same inputs always give the same list.
 */
export function mergePictureNames(defaults = PICTURE_NAME_DEFAULTS, remembered = []) {
  const out = [];
  const seen = new Set();
  for (const d of defaults || []) {
    const k = pictureNameKey(d);
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(text(d));
  }
  const extra = [];
  const extraSeen = new Set();
  for (const r of remembered || []) {
    const name = text(typeof r === 'string' ? r : r && r.name);
    const k = pictureNameKey(name);
    if (!k || seen.has(k) || extraSeen.has(k)) continue;
    extraSeen.add(k); extra.push(name);
  }
  extra.sort((a, b) => (pictureNameKey(a) < pictureNameKey(b) ? -1 : pictureNameKey(a) > pictureNameKey(b) ? 1 : 0));
  return out.concat(extra);
}

/** Is this a name the picker does not offer yet (so it should be remembered)? */
export function isNewPictureName(name, options = []) {
  const k = pictureNameKey(name);
  if (!k) return false;
  return !(options || []).some((o) => pictureNameKey(typeof o === 'string' ? o : o && o.name) === k);
}

/**
 * The property_photos kind a named picture is filed under (0153's CHECK is a
 * guard, not a label: a person names the picture; the kind is derived).
 */
export function kindForPictureName(name) {
  const k = pictureNameKey(name);
  if (!k) return 'inspection';
  if (/^before\b|\bbefore$/.test(k) || /\bas found\b/.test(k)) return 'work-order-before';
  if (/^after\b|\bafter$/.test(k) || /\bfinished\b|\bdone\b|\bcomplete/.test(k)) return 'work-order-after';
  if (/\breceipt\b|\binvoice\b|\bbill\b/.test(k)) return 'document-scan';
  if (/\bdamage\b/.test(k)) return 'damage';
  return 'inspection';
}

/**
 * The row for ONE picture on a work order (or on an incident), riding a note
 * when it was taken with one. `record` is the triage entry's record:
 *   { kind: 'request', id, instanceId, tenancyId, rentalId }  (Poe Properties)
 *   { kind: 'incident', id }                                    (Real Estate)
 * `instanceId` is the family instance for an incident (the shell's own).
 */
export function buildWorkOrderPhotoRow({ record, instanceId = null, noteId = null, name = '', dataUrl = '', thumbUrl = '', takenAt = null, authorLabel = '' } = {}) {
  const r = record || {};
  const isRequest = r.kind === 'request';
  const isIncident = r.kind === 'incident';
  if (!isRequest && !isIncident) return null;
  const inst = isRequest ? (r.instanceId || instanceId || null) : (instanceId || null);
  if (!inst || !r.id || !dataUrl) return null;
  const caption = text(name);
  return {
    instance_id: inst,
    rental_ref: isRequest ? (r.rentalId || null) : null,
    tenancy_id: isRequest ? (r.tenancyId || null) : null,
    request_id: isRequest ? r.id : null,
    incident_ref: isIncident ? String(r.id) : null,
    // A note row exists only for a Poe Properties work order (tenancy_notes);
    // an incident's words go on its lifecycle log, which has no id to name.
    note_id: isRequest ? (noteId || null) : null,
    kind: kindForPictureName(caption),
    caption,
    storage_path: dataUrl,
    thumb_path: thumbUrl || null,
    taken_at: takenAt || null,
    author_label: text(authorLabel),
  };
}

/** Can this triage entry carry pictures? (A Projects board item cannot yet.) */
export function canCarryPictures(w) {
  const k = w && w.record && w.record.kind;
  return k === 'request' || k === 'incident';
}

/**
 * The pictures that belong to a triage entry, oldest first: by request id or
 * by incident ref. Archived pictures are never drawn.
 */
export function picturesOf(photos = [], w) {
  if (!w || !w.record) return [];
  const { kind, id } = w.record;
  const mine = (photos || []).filter((p) => p && !p.archived_at
    && ((kind === 'request' && p.request_id && p.request_id === id)
      || (kind === 'incident' && p.incident_ref && String(p.incident_ref) === String(id))));
  return mine.sort((a, b) => Date.parse(a.uploaded_at || a.taken_at || 0) - Date.parse(b.uploaded_at || b.taken_at || 0));
}

/** The pictures riding one note, by its id. */
export function picturesOnNote(photos = [], noteId) {
  if (!noteId) return [];
  return (photos || []).filter((p) => p && !p.archived_at && p.note_id === noteId);
}

/** The pictures on an entry that ride no note at all (filed straight on the work order). */
export function loosePictures(photos = [], w) {
  return picturesOf(photos, w).filter((p) => !p.note_id);
}

/** One line for a thumbnail's alt / the count. */
export function pictureLine(n) {
  return `${n} picture${n === 1 ? '' : 's'}`;
}

/**
 * The words the Add pictures control says after a save, from counts: never
 * "saved" for a picture the store refused (DR-0076).
 */
export function savedLine({ saved = 0, lost = 0, noted = false } = {}) {
  if (!saved && !lost) return '';
  if (lost && !saved) return `Not saved: ${pictureLine(lost)} did not reach the store.`;
  const first = `${pictureLine(saved)} saved${noted ? ' with the note' : ''}.`;
  return lost ? `${first} ${pictureLine(lost)} did not reach the store.` : first;
}

/** A note id made on this device, so the pictures can name the note they ride. */
export function newNoteId() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // The fallback is a v4-shaped id from Math.random: good enough to be a
  // primary key on one device; never used where crypto exists.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
}
