// =============================================================================
// reading-position — the exact place on the page, kept without being asked
// =============================================================================
// Darrell 2026-09-14: "Lessons keep being interrupted and I'm loosing my exact
// location!!!!!!!!!!!!!????? Fix it!!!!!!!!!!!!"
//
// This is the THIRD pass at his place-keeping, and the first two were both
// partly right and jointly useless. DR-0262 stored the lesson + arc stage +
// paced step. Then the sentence was added (learn-resume's fingerprint). Both
// were real, and he still lost his place, for three reasons found by reading
// the code rather than guessing:
//
//   1. ONLY THE READ-ALOUD EVER WROTE A SENTENCE. A reader using his EYES --
//      which is most reading -- produced no position at all beyond the paced
//      step, so there was nothing to come back to.
//   2. ONLY THE DEVICE VOICE WROTE IT. The cloud/cloned-voice path tracks its
//      own sentence (by playback fraction) and was never wired to the record,
//      so listening in the sovereign voice saved nothing either.
//   3. ARRIVAL SCROLLED TO THE TOP. `window.scrollTo({ top: 0 })` on the resume
//      path threw the view away even when the record was perfect. That is
//      LITERALLY losing the exact location, and it is the one he would feel
//      every single time.
//
// So this module does the two things nothing did: it watches where the reader
// actually IS on the page, and it puts him back there. It is deliberately
// independent of the reader, because reading silently is the common case.
//
// Pure where it can be: the geometry decision (`pickTopSentence`) takes plain
// numbers and is unit-tested without a DOM. The DOM/scroll parts take their
// document and window as arguments and no-op without them (DR-0076).
// =============================================================================

/**
 * Which sentence is the reader looking at?
 *
 * Not the first one on screen -- the first one at or below the READING LINE, a
 * little below the top edge, because a sentence half-scrolled off the top is
 * one he has finished rather than one he is on. `topInset` is that line.
 *
 * @param {{index:number, top:number, bottom:number}[]} boxes  sentence rects.
 * @param {number} topInset  the reading line, in the same coordinate space.
 * @returns {number} the chosen index, or -1 when nothing qualifies.
 */
export function pickTopSentence(boxes, topInset = 0) {
  const list = Array.isArray(boxes) ? boxes.filter((b) => b && Number.isFinite(b.top)) : [];
  if (!list.length) return -1;
  // The first sentence whose BOTTOM is still below the line: i.e. the first one
  // not yet fully read past.
  let best = -1;
  let bestTop = Infinity;
  for (const b of list) {
    const bottom = Number.isFinite(b.bottom) ? b.bottom : b.top;
    if (bottom <= topInset) continue;          // already scrolled past
    if (b.top < bestTop) { bestTop = b.top; best = b.index; }
  }
  if (best >= 0) return best;
  // Everything is above the line (the reader is at the very end): the last one.
  return list.reduce((a, b) => (b.top > a.top ? b : a), list[0]).index;
}

/** Measure every sentence of a follow map in viewport coordinates. */
export function sentenceBoxes(follow, rangeFor, doc) {
  if (!follow || !Array.isArray(follow.segments) || typeof rangeFor !== 'function') return [];
  const out = [];
  for (let i = 0; i < follow.segments.length; i += 1) {
    const seg = follow.segments[i];
    if (!seg) continue;
    try {
      const r = rangeFor(follow, seg.start, seg.end, doc);
      if (!r) continue;
      const box = r.getBoundingClientRect();
      if (!box || (box.top === 0 && box.bottom === 0)) continue; // not laid out
      out.push({ index: i, top: box.top, bottom: box.bottom, text: seg.text });
    } catch { /* an unmappable segment is skipped, never fatal */ }
  }
  return out;
}

/**
 * Put the reader back. Scrolls the saved sentence to the reading line and
 * returns the range it landed on so a caller can flash it.
 *
 * Returns null when the sentence could not be found -- and the caller must then
 * leave the scroll ALONE rather than jumping to the top, which is the whole
 * defect this module exists to remove.
 */
export function scrollToSentence({ follow, index, rangeFor, doc, win, topInset = 96 } = {}) {
  if (!follow || !Array.isArray(follow.segments) || index < 0) return null;
  const seg = follow.segments[index];
  if (!seg || typeof rangeFor !== 'function' || !win) return null;
  try {
    const r = rangeFor(follow, seg.start, seg.end, doc);
    if (!r) return null;
    const box = r.getBoundingClientRect();
    if (!box) return null;
    const y = (win.scrollY || 0) + box.top - topInset;
    win.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
    return r;
  } catch { return null; }
}

/** A tiny trailing throttle: the reader scrolls constantly, the record must not. */
export function throttle(fn, ms = 700, timers = { set: setTimeout, clear: clearTimeout }) {
  let t = null;
  let pending = false;
  const run = (...a) => {
    if (t) { pending = true; return; }
    fn(...a);
    t = timers.set(() => {
      t = null;
      if (pending) { pending = false; run(...a); }
    }, ms);
  };
  run.cancel = () => { if (t) timers.clear(t); t = null; pending = false; };
  return run;
}
