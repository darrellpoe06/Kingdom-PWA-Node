// =============================================================================
// space-photos — the arithmetic behind the Church Spaces picture console (DR-1059)
// =============================================================================
// Darrell, 2026-10-15, on Observation → Church Spaces: "the images need to be
// able to be like Poe Properties Apps pictures console... We need a better
// flow... pictures can be deleted easily not doing what we expected."
//
// TWO FAULTS, and this file is the half of the cure with no React in it — the
// same split PropertyPhotoActions uses, so every branch is reachable in a test.
//
//   1. THE DELETE WAS A MODAL DIALOG ON A PWA. Every thumbnail carried a bare
//      16px "×" that called `window.confirm('Remove this photo?')`. This repo
//      already learned, the hard way, that these dialogs do not work in the
//      INSTALLED standalone app — no-prompt-guard exists because Darrell
//      reported the Books → Debts button "not working when you push it", and it
//      was a window.prompt() that silently no-ops on his phone. A confirm that
//      is suppressed returns falsy, the handler returns, and nothing happens:
//      a delete that does nothing, with no sign that it refused.
//
//      And the other way round, where the dialog DOES appear, a 16px × sitting
//      on the corner of a 48px thumbnail is a destructive control the size of a
//      fingernail. Either reading of "pictures can be deleted easily not doing
//      what we expected" lands on the same cure, so no guess is needed: the
//      dialog goes, and removal becomes an INLINE two-step that cannot fire by
//      accident and cannot be suppressed by the browser.
//
//   2. THERE WAS NO CONSOLE, only a strip. A thumbnail did nothing when
//      tapped except carry its own delete button. Poe Properties has an
//      ordering ("the landlord orders a door's pictures", 0161) and a cover;
//      the church's spaces had neither, so the cover photo was whichever file
//      happened to be picked first and could never be changed.
//
// THE CONFIRM COPY MUST BE TRUE FOR *THIS* STORE, which is why it is not
// copied from property-photo-edit.js. A property photo moves to a Trash folder
// on the NAS and "can be brought back". These photos are data URLs held on the
// one device, as the surface's own banner says — nothing is uploaded, so there
// is no trash and no second copy. Telling a steward it can be recovered would
// be the exact class of comfortable lie this app keeps removing.

/**
 * Pure. A space's photos, newest schema first.
 *
 * The first build stored a single `photo` string; those records still display
 * by migrating transparently here, so nothing a steward uploaded is orphaned.
 */
export function photosOf(space) {
  if (!space) return [];
  if (Array.isArray(space.photos)) return space.photos;
  if (space.photo) return [{ id: `legacy-${space.id}`, src: space.photo, at: space.updatedAt || '' }];
  return [];
}

/** Pure. The cover is simply the first photo — so "set as cover" is a move. */
export const coverOf = (space) => photosOf(space)[0] || null;

// Writing photos[] always drops the legacy single `photo`, or the old field
// would keep winning in photosOf for records that still carry it.
const withPhotos = (space, photos, at) => {
  const { photo, ...rest } = space;
  return { ...rest, photos, updatedAt: at };
};

/** Pure. Append picked images. */
export function addPhotos(space, dataUrls = [], at = new Date().toISOString(), seed = Date.now()) {
  const added = (Array.isArray(dataUrls) ? dataUrls : [])
    .filter((src) => typeof src === 'string' && src)
    .map((src, i) => ({ id: `ph-${seed}-${i}`, src, at }));
  if (!added.length) return space;
  return withPhotos(space, [...photosOf(space), ...added], at);
}

/** Pure. Take one photo off a space. */
export function removePhoto(space, photoId, at = new Date().toISOString()) {
  const photos = photosOf(space);
  const next = photos.filter((p) => p.id !== photoId);
  if (next.length === photos.length) return space;      // nothing matched
  return withPhotos(space, next, at);
}

/** Pure. Make one photo the cover by moving it to the front. */
export function setCover(space, photoId, at = new Date().toISOString()) {
  const photos = photosOf(space);
  const i = photos.findIndex((p) => p.id === photoId);
  if (i <= 0) return space;                             // absent, or already cover
  const next = [photos[i], ...photos.slice(0, i), ...photos.slice(i + 1)];
  return withPhotos(space, next, at);
}

/**
 * Pure. Move one photo one place earlier or later.
 *
 * At either end it returns the space UNCHANGED rather than wrapping around —
 * a picture that jumps from the end to the front because a steward tapped once
 * too often is a surprise, and the surface disables the control instead.
 */
export function movePhoto(space, photoId, direction, at = new Date().toISOString()) {
  const step = direction === 'back' ? 1 : direction === 'forward' ? -1 : 0;
  if (!step) return space;
  const photos = photosOf(space);
  const i = photos.findIndex((p) => p.id === photoId);
  const j = i + step;
  if (i < 0 || j < 0 || j >= photos.length) return space;
  const next = [...photos];
  [next[i], next[j]] = [next[j], next[i]];
  return withPhotos(space, next, at);
}

/** Pure. Where this photo sits, for the console's "3 of 12". */
export function positionOf(space, photoId) {
  const i = photosOf(space).findIndex((p) => p.id === photoId);
  return i < 0 ? null : { index: i, position: i + 1, total: photosOf(space).length, isCover: i === 0 };
}

/**
 * Pure. What the second tap is about to do, in words that are TRUE here.
 *
 * No "it can be brought back": these bytes live on this one device and nothing
 * is uploaded, so a removal is final and the steward is told so plainly before
 * the second tap, not after.
 */
export function removeConfirmText(space, photoId) {
  const at = positionOf(space, photoId);
  const where = space && space.name ? space.name : 'this space';
  if (!at) return 'That photo is no longer on this space.';
  const which = at.isCover ? 'the cover photo' : `photo ${at.position} of ${at.total}`;
  const after = at.isCover && at.total > 1 ? ' The next picture becomes the cover.' : '';
  return `Remove ${which} from ${where} for good? These pictures are held on this device only — nothing was uploaded, so there is no copy to restore.${after}`;
}
