// =============================================================================
// lesson-walk — moving back and forth by PARAGRAPH, not only by section
// =============================================================================
// Darrell 2026-09-13: "we need the forward or backwards player to move back and
// fourth to last paragraph or sometimes a whole section... currently I believe
// we just get section jumps... fix these."
//
// He is right about the current behaviour, and the reason is structural rather
// than a bug: the only stepper in the reader is AgePacedLesson, and it steps
// AGE-PACED SEGMENTS. For the adult band `totalSegments <= 1`, so the component
// returns the whole lesson with no stepper at all (ChurchLearn.jsx) -- which
// means the only arrows an adult reader has are the ARC STAGE arrows (Open,
// Teach, Engage, Apply, Send-off). Those are the section jumps he is describing.
//
// So this is the missing layer: a pure walker over the rendered items, with
// BOTH strides, because he asked for both.
//   step  — one paragraph. The fine adjustment for a speaker who looked up,
//           lost the thread, and wants the line they just read.
//   point — the next or previous numbered point. The coarse move for "I am
//           done with this point, take me to the next one."
// Pure and index-based so it is testable without a DOM, and so the same walker
// drives the on-screen arrows, a keyboard, and (later) a foot pedal.
// =============================================================================

/** Indices of every numbered point in an items array, in document order. */
export function pointIndices(items) {
  const out = [];
  (items || []).forEach((it, i) => { if (it && it.kind === 'heading') out.push(i); });
  return out;
}

/** Clamp an index into the items range. A walker never lands out of bounds. */
function clamp(i, items) {
  const n = (items || []).length;
  if (n === 0) return 0;
  return Math.max(0, Math.min(n - 1, i));
}

/**
 * Move one paragraph. Returns the new index.
 * At the ends it STAYS rather than wrapping: a speaker who taps back twice at
 * the top of a lesson must not be thrown to the end of it mid-sentence.
 */
export function stepParagraph(items, from, dir) {
  return clamp(clamp(from, items) + (dir < 0 ? -1 : 1), items);
}

/**
 * Move to the next/previous numbered POINT.
 *
 * Going BACK from inside a point returns to the head of the point you are in,
 * not the one before it -- the same behaviour a music player's "previous track"
 * has, and for the same reason: the first press means "start this over", the
 * second means "the one before". A speaker mid-point who taps back wants the
 * top of what they are saying.
 */
export function stepPoint(items, from, dir) {
  const pts = pointIndices(items);
  if (!pts.length) return clamp(from, items);
  const cur = clamp(from, items);
  if (dir < 0) {
    // The largest point index strictly BEFORE here does both jobs at once, and
    // an earlier draft carried an extra `if (head < cur) return head` branch
    // above this believing it handled the mid-point case separately. Trying to
    // BREAK that branch failed to move a single test, which is how it was found
    // to be dead: when the head is below the cursor it IS the largest index
    // below the cursor, so the line could never change an answer. Removed
    // rather than left as a line no test can fail on (DR-0076 §3 — a check
    // that cannot catch anything is not protection).
    //   inside a point  → its own head   ("start this one over")
    //   already at head → the point before ("the one before")
    const before = [...pts].reverse().find((i) => i < cur);
    return before === undefined ? pts[0] : before;
  }
  const next = pts.find((i) => i > cur);
  return next === undefined ? pts[pts.length - 1] : next;
}

/**
 * Which point contains this index — the number a speaker sees as "you are on
 * point 3 of 7". Returns null before the first point (a lesson can open with
 * prose), which the surface renders as no badge rather than a wrong one.
 */
export function pointAt(items, index) {
  const pts = pointIndices(items);
  if (!pts.length) return null;
  const cur = clamp(index, items);
  const head = [...pts].reverse().find((i) => i <= cur);
  if (head === undefined) return null;
  return { itemIndex: head, n: items[head].n, ordinal: pts.indexOf(head) + 1, total: pts.length };
}

/**
 * What the back/forward controls should SAY right now. A disabled-looking arrow
 * that still moves, or an enabled one that does nothing, both cost a speaker
 * the half second they do not have.
 */
export function walkState(items, index) {
  const n = (items || []).length;
  const cur = clamp(index, items);
  const pts = pointIndices(items);
  return {
    index: cur,
    total: n,
    canBack: cur > 0,
    canForward: cur < n - 1,
    hasPoints: pts.length > 0,
    point: pointAt(items, cur),
  };
}
