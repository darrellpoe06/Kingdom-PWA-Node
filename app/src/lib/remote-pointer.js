// =============================================================================
// remote-pointer — a pointer the D-pad moves, for a screen driven by a remote
// =============================================================================
// Darrell 2026-10-07: "Make sure the app has a hovering pointer option for
// devices that use a remote... make sense?"
//
// WHY IT IS AN OPTION AND NOT A DEFAULT. A Firestick's Silk browser already
// drives a pointer of its own, and two pointers on one screen fight each
// other. Other remote-driven browsers send nothing but arrow keys and Enter,
// and on those a control with no keyboard focus is simply unreachable. We
// cannot測 reliably detect which one we are on, and guessing wrong is worse
// than either answer — so this is what he asked for: an OPTION. Off by
// default, offered where the device class is a TV, kept on the device.
//
// WHAT IT DOES. Arrow keys move a pointer across the page; holding one makes
// it travel faster, as a thumb-stick does, so crossing a 1920px screen does
// not take fifty presses. Enter (or OK, or Space) clicks whatever is under
// it. Escape puts the pointer away. It never swallows a key a real control is
// already using: when the focused element is a text box, a select or a
// textarea, every key passes straight through.
//
// Pure: no DOM, no React, no timers. The component owns the clock and the
// document; this owns the arithmetic and the key names, so both are testable
// with real numbers. Storage can throw (a TV browser, a private window):
// every read falls back to off, every write is best-effort.

export const POINTER_KEY = 'poetech.remote.pointer.v1';

/** How far one press moves, and how fast a held key ramps up. */
export const STEP_PX = 24;          // one tap, at rest
export const MAX_STEP_PX = 180;     // the fastest a held key travels, per tick
export const RAMP_PER_TICK = 1.22;  // the multiplier each tick a key stays down
export const TICK_MS = 16;          // one animation frame
export const EDGE_PAD = 2;          // the pointer never leaves the screen

/** The remote keys we answer to. A TV remote does not agree with a keyboard. */
export const MOVE_KEYS = Object.freeze({
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  Up: [0, -1], Down: [0, 1], Left: [-1, 0], Right: [1, 0],
});
export const CLICK_KEYS = Object.freeze(['Enter', ' ', 'Spacebar', 'Select', 'OK']);
export const DISMISS_KEYS = Object.freeze(['Escape', 'GoBack', 'BrowserBack', 'Back']);

/** Elements that own their own arrow keys — the pointer keeps its hands off. */
const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
export function keysBelongToTheElement(el) {
  if (!el || !el.tagName) return false;
  if (TYPING.has(el.tagName)) return true;
  try { return !!(el.isContentEditable); } catch { return false; }
}

function store(s) {
  if (s) return s;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

/** Is the pointer switched on, on this device? Never throws; default off. */
export function loadPointerPref(storage) {
  try {
    const s = store(storage);
    return (s ? s.getItem(POINTER_KEY) : null) === 'on';
  } catch {
    return false;
  }
}

export function savePointerPref(on, storage) {
  try {
    const s = store(storage);
    if (s) {
      if (on) s.setItem(POINTER_KEY, 'on');
      else s.removeItem(POINTER_KEY);
    }
  } catch { /* best-effort */ }
  return !!on;
}

/** The pointer is OFFERED where a remote is likely: the measured TV class. */
export function pointerOffered(deviceClass) {
  return deviceClass === 'tv';
}

/** The middle of the screen — where a pointer first appears. */
export function startAt(width, height) {
  return { x: Math.round((Number(width) || 0) / 2), y: Math.round((Number(height) || 0) / 2) };
}

/**
 * One tick of travel. `held` is how many ticks the key has been down (0 = the
 * first), so a tap moves STEP_PX and a hold accelerates to MAX_STEP_PX.
 */
export function stepFor(held) {
  const n = Math.max(0, Number(held) || 0);
  return Math.min(MAX_STEP_PX, STEP_PX * (RAMP_PER_TICK ** n));
}

/** Move a pointer by one tick, kept inside the screen. Pure arithmetic. */
export function movePointer(at, dir, held, bounds) {
  const b = bounds || {};
  const w = Math.max(0, Number(b.width) || 0);
  const h = Math.max(0, Number(b.height) || 0);
  const step = stepFor(held);
  const x = (Number(at && at.x) || 0) + (dir[0] * step);
  const y = (Number(at && at.y) || 0) + (dir[1] * step);
  return {
    x: Math.round(Math.min(Math.max(x, EDGE_PAD), Math.max(EDGE_PAD, w - EDGE_PAD))),
    y: Math.round(Math.min(Math.max(y, EDGE_PAD), Math.max(EDGE_PAD, h - EDGE_PAD))),
  };
}

/**
 * What a key press means to the pointer. Returns one of:
 *   { kind: 'move', dir }  { kind: 'click' }  { kind: 'dismiss' }  null
 * null means "not ours" — the key is left alone, which is what keeps a text
 * box, a select and every real shortcut working.
 */
export function readKey(key, { target, on = true } = {}) {
  if (!on) return null;
  if (keysBelongToTheElement(target)) return null;
  if (MOVE_KEYS[key]) return { kind: 'move', dir: MOVE_KEYS[key] };
  if (CLICK_KEYS.includes(key)) return { kind: 'click' };
  if (DISMISS_KEYS.includes(key)) return { kind: 'dismiss' };
  return null;
}

/**
 * The thing a click at this point should press: the element under the
 * pointer, or the nearest clickable ancestor of it. Returns null when there
 * is nothing to press, so a click on empty page does nothing rather than
 * something surprising.
 */
export function targetAt(doc, x, y) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || typeof d.elementFromPoint !== 'function') return null;
  let el = null;
  try { el = d.elementFromPoint(x, y); } catch { return null; }
  while (el && el !== d.body) {
    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
      || el.getAttribute?.('role') === 'button' || el.getAttribute?.('role') === 'radio'
      || el.getAttribute?.('role') === 'switch' || el.getAttribute?.('role') === 'tab'
      || typeof el.onclick === 'function' || el.hasAttribute?.('data-pointer-target')) return el;
    el = el.parentElement;
  }
  return null;
}
