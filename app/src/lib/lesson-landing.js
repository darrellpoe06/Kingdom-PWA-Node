// =============================================================================
// lesson-landing — the SENTENCE is the place, for the eye as well as the ear
// =============================================================================
// Darrell 2026-09-24, from the live app: "Continuing a lesson doesn't work
// well... it needs to be way better." (DR-0631.)
//
// MEASURED in a real browser at 390x844 before this file existed: a reader
// three steps into a lesson and half-way down the teaching, who reloaded,
// tabbed away and back, or switched course and back, was brought back to the
// right STEP — and then left at the top of the page (scrollY 0, the course
// header on screen), a long scroll above the words they had been reading. Two
// reasons, both real:
//
//   1. Only the READ-ALOUD wrote a sentence into the place record. A person
//      reading with their eyes recorded nothing finer than the paragraph, so
//      there was no sentence to return to.
//   2. The lesson's scroll memory (reading-position.js) saved a raw scrollY,
//      captured on unmount AFTER the page had already changed under it, and
//      a lesson has no reading anchors — so what came back was a number that
//      no longer pointed at the words.
//
// This file closes both with the machinery the reader already trusts:
//   • `currentSentence` finds the sentence at the reading line (just under the
//     sticky chrome) using the SAME follow map and segmentation the reader
//     uses (read-follow.js), and its fingerprint is written into the same
//     place record — so the eye and the ear keep ONE place, not two that can
//     disagree.
//   • `landOnPlace` resolves that fingerprint in the rendered lesson, scrolls
//     the sentence to just under the chrome, and marks it for a few seconds.
//     When the sentence cannot be found (the lesson was updated), it lands on
//     the saved step instead and SAYS so — a place-keeper that guesses is
//     worse than one that admits it lost the thread (learn-resume.js).
//
// Layout is injected (`rectOf`, `win`, `doc`) so the decisions are unit-tested
// in jsdom, which has no layout (DR-0076); the real-browser journeys measure
// the pixels.
// =============================================================================

import { buildFollowMap, rangeFor, stickyTopInset, highlightResume } from './read-follow.js';
import { sentenceKeyOf, findSentence } from './learn-resume.js';

/** How long the "you were here" mark stays before it clears itself. */
export const RESUME_MARK_MS = 6000;
/** Breathing room between the sticky chrome and the landed sentence, px —
 * room for the one-line "picked up where you left off" note that appears in
 * the sticky block just after landing, plus a line of air. */
export const LANDING_MARGIN = 44;

const defaultRect = (range) => {
  try { return range && typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null; }
  catch { return null; }
};

/**
 * The index of the first sentence whose box reaches below the reading line —
 * the sentence the eye is on. Sentences with no box (not rendered, or no
 * layout) are skipped. -1 when none qualifies.
 *
 * @param {{segments: Array<{start:number,end:number}|null>}} follow
 * @param {number} line  viewport y of the reading line
 * @param {(i:number) => ({top:number,bottom:number,height?:number}|null)} boxOf
 */
// THE NEAREST SENTENCE, NOT MERELY THE NEXT ONE. Measured in the first
// after-run: the reading line fell on a row of buttons between two passages,
// and "the first sentence below the line" was a story heading 150px further
// down — so the reader came back ~130px lower than they left. A sentence that
// straddles the line wins outright; across a gap of controls, the closer of
// the sentence just above and the one just below wins.
export function sentenceIndexAtLine(follow, line, boxOf) {
  const segs = follow && Array.isArray(follow.segments) ? follow.segments : [];
  let above = -1;
  let aboveGap = Infinity;
  for (let i = 0; i < segs.length; i += 1) {
    if (!segs[i]) continue;
    const r = boxOf(i);
    if (!r) continue;
    const h = Number.isFinite(r.height) ? r.height : (r.bottom - r.top);
    if (!(h > 0)) continue;
    if (r.bottom > line) {
      if (r.top <= line) return i;                  // straddles the line
      return (above >= 0 && aboveGap <= r.top - line) ? above : i;
    }
    above = i;
    aboveGap = line - r.bottom;
  }
  return above;
}

/**
 * The sentence at the reading line inside `root`, as the place record wants
 * it: `{ index, text, key }`, or null when the root holds no readable text or
 * the reading line is past all of it.
 */
export function currentSentence(root, { win, doc, rectOf = defaultRect, line } = {}) {
  const W = win || (typeof window !== 'undefined' ? window : null);
  const D = doc || (typeof document !== 'undefined' ? document : null);
  if (!root || !D) return null;
  const follow = buildFollowMap(root, D);
  if (!follow || !follow.segments.length) return null;
  const readingLine = Number.isFinite(line) ? line : (stickyTopInset(W, D) + LANDING_MARGIN);
  const boxOf = (i) => {
    const s = follow.segments[i];
    return s ? rectOf(rangeFor(follow, s.start, s.end, D)) : null;
  };
  const i = sentenceIndexAtLine(follow, readingLine, boxOf);
  if (i < 0) return null;
  const text = follow.segments[i].text;
  return { index: i, text, key: sentenceKeyOf(text) };
}

/**
 * Find the saved sentence in the rendered lesson. Only a FINGERPRINT match is
 * trusted here — an index alone is never followed, because the reader's
 * indexes count the whole lesson while the page may be showing one part of it;
 * the same number is a different sentence in a different rendering.
 * Returns `{ index, range, how }` where how is exact | moved, or
 * `{ index: -1, range: null, how }` with the reason.
 */
export function locateSentence(root, place, { doc } = {}) {
  const D = doc || (typeof document !== 'undefined' ? document : null);
  if (!root || !D || !place || !place.sentenceKey) return { index: -1, range: null, how: 'no-sentence' };
  const follow = buildFollowMap(root, D);
  if (!follow) return { index: -1, range: null, how: 'no-text' };
  const texts = follow.segments.map((s) => (s ? s.text : ''));
  const found = findSentence(texts, place);
  if (found.how !== 'exact' && found.how !== 'moved') return { index: -1, range: null, how: found.how };
  const seg = follow.segments[found.index];
  return { index: found.index, range: rangeFor(follow, seg.start, seg.end, D), how: found.how };
}

/**
 * How far to scroll so a box that is `rectTop` from the viewport top sits just
 * under the chrome. Pure, so the landing rule is pinned without layout.
 */
export function landingScrollDelta(rectTop, topInset, margin = LANDING_MARGIN) {
  const t = Number(rectTop); const inset = Number(topInset) || 0;
  if (!Number.isFinite(t)) return 0;
  return Math.round(t - (inset + margin));
}

let markTimer = null;

/**
 * Take the reader back to their place inside an opened lesson.
 *
 *   sentence → the saved sentence is scrolled to just under the chrome and
 *              marked for RESUME_MARK_MS;
 *   step     → the sentence could not be found (or none was saved) but the
 *              reader had moved into the lesson: the saved step's box lands
 *              under the chrome instead;
 *   none     → nothing to land on; the caller leaves the view alone.
 *
 * @returns {{how:'sentence'|'step'|'none', why?:string}}
 */
export function landOnPlace(root, place, { win, doc, stepEl = null, rectOf = defaultRect, mark = true } = {}) {
  const W = win || (typeof window !== 'undefined' ? window : null);
  const D = doc || (typeof document !== 'undefined' ? document : null);
  if (!root || !W || !D || !place) return { how: 'none', why: 'nothing-open' };
  const inset = stickyTopInset(W, D);
  const hit = locateSentence(root, place, { doc: D });
  if (hit.range) {
    const r = rectOf(hit.range);
    if (r && Number.isFinite(r.top)) {
      try { W.scrollBy(0, landingScrollDelta(r.top, inset)); } catch { /* no scroll, still marked */ }
    }
    if (mark) {
      highlightResume(hit.range, W);
      if (markTimer) clearTimeout(markTimer);
      markTimer = setTimeout(() => { markTimer = null; highlightResume(null, W); }, RESUME_MARK_MS);
    }
    return { how: 'sentence', why: hit.how };
  }
  const moved = place.stage > 0 || place.step > 0 || !!place.sentenceKey;
  if (stepEl && moved) {
    try {
      const r = stepEl.getBoundingClientRect();
      W.scrollBy(0, landingScrollDelta(r.top, inset));
    } catch { /* ignore */ }
    return { how: 'step', why: hit.how };
  }
  return { how: 'none', why: hit.how };
}
