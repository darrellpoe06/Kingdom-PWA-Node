// =============================================================================
// showcase — the landlord arranges his own shelf
// =============================================================================
// Darrell, 2026-08-28: "Users should be able move the squares to fit whatever
// Apt or home to showcase those at the time because of the turnover of that
// property so people can see it first."
//
// He first asked for 805 pinned to the front. This is the better shape of the
// same need and he corrected it himself: turnover moves, so a hardcoded first
// place is wrong the week after it is right — and it makes ME the one who has
// to change it, which is the opposite of "more control without needing to
// build again."
//
// WHY BUTTONS AND NOT DRAG. This is used one-handed on a phone, on a grid that
// scrolls. HTML5 drag does not fire on touch at all, and a long-press-drag
// inside a scrolling list fights the scroll — you reach for the card and the
// page moves. Move-left / move-right / show-first are unambiguous, reachable,
// and work identically with a keyboard and a screen reader. If a pointer drag
// is ever added it should be an ADDITION to these, never a replacement.
//
// SPARSE ORDERS ON PURPOSE. Positions are spaced by 10 so moving one card
// rewrites ONE row. A dense 0..n rank would rewrite the whole shelf on every
// nudge — eleven writes for one tap, and eleven chances for a partial failure
// to leave the order scrambled.
//
// Pure: every function returns the patches to apply and touches nothing.
// =============================================================================

/** The gap between neighbours. Big enough to slot between without renumbering. */
export const STEP = 10;

// NOT `Number.isFinite(Number(v))`: Number(null) is 0, and 0 is finite — so an
// UNPLACED door read as position zero and sorted to the very front, which is
// precisely the thing shelfOrder promises never happens. Caught by the test that
// adds a new door to an arranged shelf.
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const orderOf = (r) => num(r?.showcase_order);

/**
 * The shelf in the order it is shown: placed doors first by their position,
 * then unplaced ones in their existing order. An unplaced door NEVER jumps the
 * queue — adding a property must not rearrange what the landlord already
 * arranged.
 */
export function shelfOrder(rentals = []) {
  const list = Array.isArray(rentals) ? [...rentals] : [];
  return list
    .map((r, i) => ({ r, i, o: orderOf(r) }))
    .sort((a, b) => {
      if (a.o === null && b.o === null) return a.i - b.i;   // both unplaced: as given
      if (a.o === null) return 1;                            // unplaced sorts last
      if (b.o === null) return -1;
      return a.o - b.o || a.i - b.i;
    })
    .map((x) => x.r);
}

/**
 * Move one door one place toward the front (dir -1) or the back (dir +1).
 * Returns the patches to write — at most two rows, and usually one.
 *
 * Swapping positions with the neighbour is what keeps this a small write. When
 * neither door has a position yet the whole shelf is numbered once, which is
 * the only time a bulk write happens and it happens at most once per portfolio.
 */
export function moveDoor(rentals = [], id, dir) {
  const shelf = shelfOrder(rentals);
  const at = shelf.findIndex((r) => r?.id === id);
  if (at < 0) return { patches: [], reason: 'not-on-this-shelf' };
  const to = at + (dir < 0 ? -1 : 1);
  if (to < 0 || to >= shelf.length) return { patches: [], reason: 'already-at-the-end' };

  // First move on an unarranged shelf: give every door a position, then swap.
  if (shelf.some((r) => orderOf(r) === null)) {
    const numbered = shelf.map((r, i) => ({ ...r, showcase_order: (i + 1) * STEP }));
    const a = numbered[at];
    const b = numbered[to];
    const swapped = numbered.map((r) => {
      if (r.id === a.id) return { ...r, showcase_order: b.showcase_order };
      if (r.id === b.id) return { ...r, showcase_order: a.showcase_order };
      return r;
    });
    return {
      patches: swapped.map((r) => ({ id: r.id, patch: { showcase_order: r.showcase_order } })),
      reason: 'numbered-the-shelf',
    };
  }

  const a = shelf[at];
  const b = shelf[to];
  return {
    patches: [
      { id: a.id, patch: { showcase_order: orderOf(b) } },
      { id: b.id, patch: { showcase_order: orderOf(a) } },
    ],
    reason: 'swapped',
  };
}

/**
 * Put one door at the front — the turnover case, in one tap instead of six.
 * Writes ONE row: a position below the current minimum. Nothing else moves.
 */
export function showFirst(rentals = [], id) {
  const shelf = shelfOrder(rentals);
  if (!shelf.some((r) => r?.id === id)) return { patches: [], reason: 'not-on-this-shelf' };
  if (shelf[0]?.id === id) return { patches: [], reason: 'already-first' };

  const placed = shelf.map(orderOf).filter((o) => o !== null);
  if (placed.length === 0) {
    // Nothing arranged yet: number the shelf with this one leading.
    const rest = shelf.filter((r) => r.id !== id);
    const ordered = [shelf.find((r) => r.id === id), ...rest];
    return {
      patches: ordered.map((r, i) => ({ id: r.id, patch: { showcase_order: (i + 1) * STEP } })),
      reason: 'numbered-the-shelf',
    };
  }
  return {
    patches: [{ id, patch: { showcase_order: Math.min(...placed) - STEP } }],
    reason: 'moved-to-front',
  };
}

/** Undo an arrangement entirely — every door back to unplaced. */
export function clearArrangement(rentals = []) {
  return {
    patches: (Array.isArray(rentals) ? rentals : [])
      .filter((r) => orderOf(r) !== null)
      .map((r) => ({ id: r.id, patch: { showcase_order: null } })),
    reason: 'cleared',
  };
}
