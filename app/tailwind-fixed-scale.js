// =============================================================================
// tailwind-fixed-scale — the frame holds while the words grow (DR-1011)
// =============================================================================
// Darrell, 2026-10-14, on the Poe Properties door at A44: "The words/text need
// to be the only thing getting bigger... At 44 it doesn't read well."
//
// The large-print control (src/lib/text-size.js) scales the document ROOT
// font-size, so every rem in the app grows with it — Tailwind's padding,
// margins, gaps and radii are rem, so the frame around the words ballooned
// 2.75x along with them. DR-0438 already froze the chrome (headers, controls)
// with a zoomed region; this freezes the CONTENT frame.
//
// One unit does it: --ts-fixed is "one rem as it is at Normal", published by
// src/index.css as calc(1rem / var(--ts-mult)). A length written in it is
// pixel-identical at Normal and does not move at any step. The theme below
// maps Tailwind's rem scales for the frame (padding, margin, gap, space,
// border radius) onto that unit, so `p-4` stays 16px at A44 while `text-base`
// still reads 44px. Width/height scales are left on the root on purpose:
// a fixed-height box with growing text clips the words, which is the worse
// failure; the re-review is in the DR.
//
// Pure, no Tailwind import, so a test can pin the mapping byte for byte.
// =============================================================================

export const FIXED_UNIT = 'var(--ts-fixed, 1rem)';

/** `1rem` -> `calc(1 * var(--ts-fixed, 1rem))`; anything not in rem is returned as it is. */
export function fixedLength(value) {
  const s = String(value);
  const m = /^(-?\d*\.?\d+)rem$/.exec(s);
  if (!m) return s;
  return `calc(${Number(m[1])} * ${FIXED_UNIT})`;
}

/** A whole theme scale ({ '4': '1rem', px: '1px', ... }) mapped onto the fixed unit. */
export function fixedScale(scale = {}) {
  return Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, typeof v === 'string' ? fixedLength(v) : v]));
}

/** The theme keys that are the FRAME around the words, and so hold. */
export const FRAME_KEYS = Object.freeze(['padding', 'margin', 'gap', 'space', 'borderRadius']);
