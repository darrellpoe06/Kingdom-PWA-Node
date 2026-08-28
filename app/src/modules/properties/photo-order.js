// =============================================================================
// photo-order — the landlord arranges a door's pictures, and picks the cover
// =============================================================================
// Darrell, 2026-08-28: "no way to reorder the images? does work..." — the doors
// board lets him arrange the shelf (showcase.js) and it works; the pictures on a
// door had no such control. Same need, same shape: the ORDER is data he sets,
// the first picture is the cover, and both the gallery and the public listing
// read it, so what he arranges is what a renter sees.
//
// This mirrors showcase.js exactly, keyed on property_photos.sort_order instead
// of rentals.showcase_order — a deliberate parallel rather than a shared
// generic, so a change to how DOORS arrange can never silently alter how
// PICTURES do, and neither module's tests can drift the other.
//
// Buttons, not drag (same reasons as the shelf): one-handed on a phone, over a
// scrolling grid, HTML5 drag does not fire on touch. Sparse orders spaced by 10
// so moving one picture rewrites ONE row.
//
// Default order when nothing is placed: the list is left in the order it came
// in — loadDoorPhotos returns newest-first (taken_at desc) — so an unarranged
// gallery shows the newest picture as the cover, exactly as before.
//
// Pure: every function returns the patches to apply and touches nothing.
// =============================================================================

/** The gap between neighbours. Big enough to slot between without renumbering. */
export const PHOTO_STEP = 10;

// Number(null) is 0 and 0 is finite, so an UNPLACED picture would read as
// position zero and jump to the front — the one thing photoOrder must never do.
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const orderOf = (p) => num(p?.sort_order);

/**
 * The gallery in the order it is shown: placed pictures first by their position,
 * then unplaced ones in the order they arrived (newest-first from the loader).
 * Adding a picture never rearranges what the landlord already arranged.
 */
export function photoOrder(photos = []) {
  const list = Array.isArray(photos) ? [...photos] : [];
  return list
    .map((p, i) => ({ p, i, o: orderOf(p) }))
    .sort((a, b) => {
      if (a.o === null && b.o === null) return a.i - b.i;   // both unplaced: as given
      if (a.o === null) return 1;                            // unplaced sorts last
      if (b.o === null) return -1;
      return a.o - b.o || a.i - b.i;
    })
    .map((x) => x.p);
}

/** The cover: the first picture in the arranged order, or null for an empty gallery. */
export function coverPhoto(photos = []) {
  return photoOrder(photos)[0] || null;
}

/**
 * Move one picture one place toward the front (dir -1) or the back (dir +1).
 * Returns the patches to write — at most two rows, usually one. On an unarranged
 * gallery the whole set is numbered once, then it is a two-row swap thereafter.
 */
export function movePhoto(photos = [], id, dir) {
  const shelf = photoOrder(photos);
  const at = shelf.findIndex((p) => p?.id === id);
  if (at < 0) return { patches: [], reason: 'not-in-this-gallery' };
  const to = at + (dir < 0 ? -1 : 1);
  if (to < 0 || to >= shelf.length) return { patches: [], reason: 'already-at-the-end' };

  if (shelf.some((p) => orderOf(p) === null)) {
    const numbered = shelf.map((p, i) => ({ ...p, sort_order: (i + 1) * PHOTO_STEP }));
    const a = numbered[at];
    const b = numbered[to];
    const swapped = numbered.map((p) => {
      if (p.id === a.id) return { ...p, sort_order: b.sort_order };
      if (p.id === b.id) return { ...p, sort_order: a.sort_order };
      return p;
    });
    return {
      patches: swapped.map((p) => ({ id: p.id, patch: { sort_order: p.sort_order } })),
      reason: 'numbered-the-gallery',
    };
  }

  const a = shelf[at];
  const b = shelf[to];
  return {
    patches: [
      { id: a.id, patch: { sort_order: orderOf(b) } },
      { id: b.id, patch: { sort_order: orderOf(a) } },
    ],
    reason: 'swapped',
  };
}

/**
 * Make one picture the cover — put it first, in one tap. Writes ONE row: a
 * position below the current minimum. Nothing else moves.
 */
export function makeCover(photos = [], id) {
  const shelf = photoOrder(photos);
  if (!shelf.some((p) => p?.id === id)) return { patches: [], reason: 'not-in-this-gallery' };
  if (shelf[0]?.id === id) return { patches: [], reason: 'already-cover' };

  const placed = shelf.map(orderOf).filter((o) => o !== null);
  if (placed.length === 0) {
    const rest = shelf.filter((p) => p.id !== id);
    const ordered = [shelf.find((p) => p.id === id), ...rest];
    return {
      patches: ordered.map((p, i) => ({ id: p.id, patch: { sort_order: (i + 1) * PHOTO_STEP } })),
      reason: 'numbered-the-gallery',
    };
  }
  return {
    patches: [{ id, patch: { sort_order: Math.min(...placed) - PHOTO_STEP } }],
    reason: 'made-cover',
  };
}
