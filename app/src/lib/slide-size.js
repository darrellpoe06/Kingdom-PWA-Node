// =============================================================================
// slide-size — the ROOM's text size, set by whoever is presenting
// =============================================================================
// Darrell 2026-09-17, from the presenting view on his phone: "Need to be able
// to work the text sizes on the PowerPoint and the controls are taking over
// the screen real-estate."
//
// WHY THIS IS NOT lib/text-size.js. That one is the READER's own size for their
// own device, and it is the right answer for a page someone holds. A presented
// slide is a different problem with a different owner:
//
//   • The words are for a ROOM — people at the back of a hall, a TV across a
//     living room, elders in the third pew. The person choosing is not the
//     person reading.
//   • Every size on the slide was viewport math (clamp(px, vw, px)), so it
//     answered the projector's width and nothing else. The reader's own control
//     could not touch it, and the presenting view is a full-screen overlay, so
//     that control was not even on screen to try.
//   • Raising the reader's own size to make the room's words bigger would also
//     inflate the presenter's control panel — which is the other half of what
//     he reported. The room's type and the speaker's chrome must move
//     independently, or fixing one breaks the other.
//
// So: one multiplier, persisted per device, applied as `--slide-scale` on the
// presenting container and read by every font size on the slide. Default 1, so
// a surface that never sets it renders exactly as it did.
//
// Pure functions are exported and unit-tested; the hook is thin glue.
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'poe-slide-size';

// Stepped, plain-language options in the language of a room, not of CSS. The
// top step is 2x because a slide already starts large (its clamp ceiling is
// ~96px for a title); doubling that is genuinely across-the-hall type, and
// going further would push a long lead paragraph off the slide rather than
// making it readable.
export const SLIDE_SIZE_STEPS = Object.freeze([
  { key: 'snug', scale: 0.85, label: 'A−', name: 'Snug', hint: 'Fits more on the slide' },
  { key: 'room', scale: 1, label: 'A', name: 'Room', hint: 'The normal projected size' },
  { key: 'big', scale: 1.25, label: 'A+', name: 'Big', hint: 'A larger hall, or a TV across the room' },
  { key: 'bigger', scale: 1.5, label: 'A++', name: 'Bigger', hint: 'The back row, or tired eyes' },
  { key: 'biggest', scale: 2, label: 'A+++', name: 'Biggest', hint: 'True large print for the room' },
]);

export const DEFAULT_SLIDE_SIZE = 'room';

/** Resolve a step by key, falling back to the normal projected size. */
export function slideStepFor(key) {
  return SLIDE_SIZE_STEPS.find((s) => s.key === key) || SLIDE_SIZE_STEPS[1];
}

/** True when key names a real step. */
export function isValidSlideSize(key) {
  return SLIDE_SIZE_STEPS.some((s) => s.key === key);
}

/** The multiplier for a key — always a positive number, never NaN. */
export function slideScaleFor(key) {
  const s = slideStepFor(key);
  return typeof s.scale === 'number' && s.scale > 0 ? s.scale : 1;
}

/**
 * The style object a presenting container spreads to publish the choice.
 * Returns `{}` at the normal size so the DOM carries no needless property and
 * an unset surface is byte-identical to before this shipped.
 */
export function slideScaleStyle(key) {
  const scale = slideScaleFor(key);
  return scale === 1 ? {} : { '--slide-scale': String(scale) };
}

/** The next / previous step from a key, clamped at both ends. */
export function stepSlideSize(key, delta) {
  const i = SLIDE_SIZE_STEPS.findIndex((s) => s.key === slideStepFor(key).key);
  const n = Math.max(0, Math.min(SLIDE_SIZE_STEPS.length - 1, i + (Number(delta) || 0)));
  return SLIDE_SIZE_STEPS[n].key;
}

/** Read the saved choice. Unknown or unreadable -> the normal projected size. */
export function loadSlideSize(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    const v = store && store.getItem(STORAGE_KEY);
    return isValidSlideSize(v) ? v : DEFAULT_SLIDE_SIZE;
  } catch { return DEFAULT_SLIDE_SIZE; }
}

/** Persist the choice. Quota or private mode never breaks a presentation. */
export function saveSlideSize(key, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try { if (store && isValidSlideSize(key)) store.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
}

/**
 * useSlideSize — `{ size, step, scale, style, set, bump }` for a presenting
 * surface. `style` is spread onto the container; `bump(+1 / -1)` walks the
 * steps for a keyboard shortcut or a pair of buttons.
 */
export function useSlideSize() {
  const [size, setSize] = useState(() => loadSlideSize());
  const set = useCallback((key) => {
    if (!isValidSlideSize(key)) return;
    setSize(key);
    saveSlideSize(key);
  }, []);
  const bump = useCallback((delta) => {
    setSize((cur) => {
      const next = stepSlideSize(cur, delta);
      saveSlideSize(next);
      return next;
    });
  }, []);
  return {
    size,
    step: slideStepFor(size),
    scale: slideScaleFor(size),
    style: slideScaleStyle(size),
    set,
    bump,
  };
}
