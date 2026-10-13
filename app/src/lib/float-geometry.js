// =============================================================================
// float-geometry — where the floating reader may sit, and remembering it
// =============================================================================
// Darrell 2026-09-24: "Maybe be a popout reader that floating around? Then can
// be reset back to normal?" (DR-0641).
//
// The reader can pop out into a small window that floats over the app. These
// are its rules, pure so they are tested without a screen:
//   • clampRect: never off the screen (a window dragged away cannot be grabbed
//     back, and a phone has no window edge to recover it from), never smaller
//     than the size that keeps every control a 44 px target, never larger
//     than the viewport.
//   • avoidRects: at rest it does not sit on the Feedback or Give buttons; it
//     moves up above them, or below them when there is no room above.
//   • load/saveFloat: floating or docked, position and size, per device. Every
//     storage call is guarded; a device that cannot store starts docked.
// =============================================================================

export const FLOAT_KEY = 'poe-reader-float';
export const MIN_W = 260;   // four 44 px controls, their gaps, and padding
export const MIN_H = 220;   // title bar + text + a control row, each ≥ 44 px
export const EDGE = 8;

const num = (n, d = 0) => (Number.isFinite(Number(n)) ? Number(n) : d);

/** The size and place a fresh float takes: bottom-right, above the corner buttons. */
export function defaultRect(vw, vh) {
  const w = Math.min(Math.max(MIN_W, Math.round(vw * 0.9)), 360);
  const h = Math.min(Math.max(MIN_H, Math.round(vh * 0.4)), 320);
  return clampRect({ x: vw - w - 16, y: vh - h - 140, w, h }, vw, vh);
}

/** Keep a rect wholly on screen and at least the minimum size. */
export function clampRect(rect, vw, vh) {
  const maxW = Math.max(MIN_W, vw - 2 * EDGE);
  const maxH = Math.max(MIN_H, vh - 2 * EDGE);
  const w = Math.min(Math.max(num(rect && rect.w, MIN_W), MIN_W), maxW);
  const h = Math.min(Math.max(num(rect && rect.h, MIN_H), MIN_H), maxH);
  const x = Math.min(Math.max(num(rect && rect.x, EDGE), EDGE), Math.max(EDGE, vw - w - EDGE));
  const y = Math.min(Math.max(num(rect && rect.y, EDGE), EDGE), Math.max(EDGE, vh - h - EDGE));
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

const hits = (a, b) => !(a.x + a.w <= b.l || b.r <= a.x || a.y + a.h <= b.t || b.b <= a.y);

/**
 * At rest the float moves off the buttons it would cover. `avoid` is a list
 * of {l, r, t, b} boxes (the Feedback and Give buttons).
 */
export function avoidRects(rect, avoid, vw, vh) {
  let r = clampRect(rect, vw, vh);
  const boxes = (Array.isArray(avoid) ? avoid : []).filter(Boolean);
  for (let pass = 0; pass < 3; pass++) {
    const hit = boxes.find((b) => hits(r, b));
    if (!hit) return r;
    const above = hit.t - EDGE - r.h;
    const below = hit.b + EDGE;
    r = clampRect({ ...r, y: above >= EDGE ? above : below }, vw, vh);
  }
  return r;
}

/** { floating, rect } for this device, or the docked default. */
export function loadFloat(storage = safeStorage()) {
  try {
    const raw = storage && storage.getItem(FLOAT_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v !== 'object') return { floating: false, rect: null };
    const r = v.rect && typeof v.rect === 'object' ? v.rect : null;
    return { floating: !!v.floating, rect: r ? { x: num(r.x), y: num(r.y), w: num(r.w, MIN_W), h: num(r.h, MIN_H) } : null };
  } catch (_) { return { floating: false, rect: null }; }
}

export function saveFloat(state, storage = safeStorage()) {
  try { if (storage) storage.setItem(FLOAT_KEY, JSON.stringify({ floating: !!(state && state.floating), rect: (state && state.rect) || null })); } catch (_) { /* full or blocked */ }
}

function safeStorage() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; } }
