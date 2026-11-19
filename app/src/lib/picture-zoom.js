// =============================================================================
// picture-zoom — a picture grows with the reader's text size (DR-1575)
// =============================================================================
// Darrell 2026-11-18, at a large text size on the church door: "Larger text
// doesn't enlarge the fonts on the images.... or documents..." A picture's
// lettering is pixels: the text-size setting scales rem, and a calendar the
// office published as a picture, a flyer, or a PDF page has no rem in it. The
// lettering cannot be re-set, so the honest answer is to make the PICTURE
// bigger by the same step the reader chose for the words, and to let them go
// further (or back) with buttons they can see.
//
// One ladder, pure. Its first five rungs are the text-size multipliers
// themselves (lib/text-size.js TEXT_SIZE_STEPS), so a reader at Larger opens a
// picture at 150% of the width it fits in, and a reader at Big Print 44 at
// 275%. Past that it keeps going for the small print of a calendar grid.
// 100% is "fits the width it is shown in", never smaller: below that the
// picture only loses lettering.
import { stepFor } from './text-size.js';

export const ZOOM_STEPS = [1, 1.2, 1.5, 2, 2.75, 3.5, 4.5, 6];

/** The rung a viewer opens on for a text-size key: the first rung at or above that size's multiplier. */
export function zoomIndexForTextSize(key) {
  const mult = stepFor(key).mult;
  const i = ZOOM_STEPS.findIndex((z) => z >= mult - 0.001);
  return i < 0 ? ZOOM_STEPS.length - 1 : i;
}

/** The rung `delta` places from `index` (+1 larger, -1 smaller), held inside the ladder. */
export function stepZoomIndex(index, delta) {
  const i = Number.isFinite(index) ? Math.round(index) : 0;
  const d = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  return Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + d));
}

/** The zoom factor at a rung (1 for anything outside the ladder). */
export function zoomAt(index) {
  return ZOOM_STEPS[index] || 1;
}

/** "150%" for a rung: what the viewer says out loud and on screen. */
export function zoomLabel(index) {
  return `${Math.round(zoomAt(index) * 100)}%`;
}

/**
 * The widest a PDF page's canvas is drawn, in device pixels. A page asked for
 * at 6x on a 3x screen would be a canvas wider than phones allow (they refuse
 * past roughly 4096 to 16384 and draw nothing); past this the browser
 * stretches what was drawn instead.
 */
export const MAX_CANVAS_PX = 4096;
