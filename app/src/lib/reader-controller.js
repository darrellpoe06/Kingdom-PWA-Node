// =============================================================================
// reader-controller — the reader's controls on the SIDES of a TV, and full screen
// =============================================================================
// Darrell 2026-10-07, reading a lesson on the Firestick: "I can't change
// reading speed nor other items inside the reader tab because it's hard to
// scroll the reader section... it doesn't show all control options... maybe
// we need to pull out the controller for TV? And bigger screens when
// detected or on Firestick." Then, placing it: "Maybe put the other reader
// options on the sides in the black space... so all options are always
// there... unless we go to full screen then the controls are not there just
// listen to the app and seeing the Word..."
//
// WHAT WAS WRONG. The Read Aloud panel is one tall column, 16.25em wide,
// bottom-right, with max-height + overflow scroll. A phone thumb scrolls it
// without thinking. A Firestick drives a pointer that scrolls only the page,
// so a control below the fold of that box was unreachable — on a ten-foot
// screen the reader saw Read, Pause and the level, and never Speed, Voice,
// Follow along or Colors. The screen was 1920 px wide; the Word's column is
// at most 1440 (the shell's <main>); the black space either side held nothing.
//
// THE RAILS. On a TV (and on a genuinely big screen) the same panel is split
// across the two margins: the play controls on the LEFT rail (the header,
// Read / Resume / Start at, Back / Forward / Top, the level, the screen), the
// how-it-sounds-and-looks on the RIGHT rail (text size, colors, Follow along,
// kept on this device, Speed, Voice). Always there — no opening, no scroll —
// with the Word uncovered between them. Nothing is duplicated: the same JSX,
// a different shape.
//
// FULL SCREEN. One button on the left rail takes everything away: the rails,
// the dock and the header are hidden (index.css reads the html attribute),
// the browser is asked for real full screen where it allows it, and only the
// Word and the voice remain. A faint "Controls" mark in the corner, Esc, or the
// remote's Back brings it all back.
//
// WHO DECIDES. 'auto' (the default) reads the measured device class: a TV
// (device-roles / device-link isTvClass) or any screen at least WIDE_MIN_WIDTH
// px gets the rails; a phone, tablet or ordinary laptop keeps the tall column.
// One tap in the panel header flips it, and the choice is kept on the device
// ('sides' / 'tall'), as reader-follow-prefs keeps its three.
//
// Storage can be missing or throw (private window, a TV browser): every read
// falls back to 'auto', every write is best-effort.
export const CONTROLLER_KEY = 'poetech.reader.controller.v1';
export const CONTROLLER_MODES = Object.freeze(['auto', 'sides', 'tall']);
export const CONTROLLER_LAYOUTS = Object.freeze(['sides', 'tall']);
/** A screen this wide is a monitor or a TV, never a laptop lid or a tablet. */
export const WIDE_MIN_WIDTH = 1600;
/** Below this there is no margin for a rail, so the rails are never chosen. */
export const WIDE_FLOOR_WIDTH = 900;
/**
 * Each rail's width, in the reader's own chrome em (1rem × --ts-chrome-scale):
 * room for the five speed chips and the voice list. The shell's <main> is
 * FULL width (measured, ChurchLearn.jsx: "window 1440, <main> 1440"), so the
 * rails do not sit in empty margin — index.css gives <main> this much inset on
 * each side while RAILS_ATTR holds, and the Word's column narrows between them
 * instead of being covered. The number lives here and in index.css; a test
 * pins the two together.
 */
export const RAIL_WIDTH_EM = 15;
/** The html attribute index.css reads to inset <main> for the rails. */
export const RAILS_ATTR = 'data-reader-rails';
/** The html attribute index.css reads to hide the dock, the header and the rails. */
export const FULLSCREEN_ATTR = 'data-reader-fullscreen';

function store(s) {
  if (s) return s;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function normalizeControllerPref(v) {
  // The first build of this called the rails 'wide'; a device that kept that word gets the rails.
  if (v === 'wide') return 'sides';
  return CONTROLLER_MODES.includes(v) ? v : 'auto';
}

export function loadControllerPref(storage) {
  try {
    const s = store(storage);
    return normalizeControllerPref(s ? s.getItem(CONTROLLER_KEY) : null);
  } catch {
    return 'auto';
  }
}

export function saveControllerPref(mode, storage) {
  const m = normalizeControllerPref(mode);
  try {
    const s = store(storage);
    if (s) {
      if (m === 'auto') s.removeItem(CONTROLLER_KEY);
      else s.setItem(CONTROLLER_KEY, m);
    }
  } catch { /* best-effort */ }
  return m;
}

/**
 * The layout the panel takes, from the kept preference and the measurement.
 *   pref         'auto' | 'sides' | 'tall'
 *   deviceClass  'phone' | 'tablet' | 'laptop' | 'tv' (device-roles)
 *   width        CSS px of the viewport
 * An explicit choice wins — but 'sides' still needs margins, so a phone that
 * somehow kept 'sides' is not handed rails it cannot show.
 */
export function controllerLayout({ pref = 'auto', deviceClass = 'phone', width = 0 } = {}) {
  const w = Number(width) || 0;
  const roomy = w <= 0 ? deviceClass === 'tv' : w >= WIDE_FLOOR_WIDTH;
  const p = normalizeControllerPref(pref);
  if (p === 'tall') return 'tall';
  if (p === 'sides') return roomy ? 'sides' : 'tall';
  if (deviceClass === 'tv') return roomy ? 'sides' : 'tall';
  if (w >= WIDE_MIN_WIDTH) return 'sides';
  return 'tall';
}

/** The pref a header tap sets: the opposite of what is on screen, said plainly. */
export function flippedControllerPref(layout) {
  return layout === 'sides' ? 'tall' : 'sides';
}

/** What the header button offers — the shape the panel is NOT in. */
export function controllerToggleLabel(layout) {
  return layout === 'sides' ? '⇕ Tall' : '⇔ Sides';
}

export function controllerToggleTitle(layout) {
  return layout === 'sides'
    ? 'Tall — one column in the corner, the page uncovered'
    : 'Sides — every control on the two sides of the screen, always there (made for a TV)';
}

/** Each rail's width, as the rail's own style (its font-size is the chrome scale). */
export function railWidth() {
  return `${RAIL_WIDTH_EM}em`;
}

/** The inset index.css gives <main> on each side while the rails are on — the same width plus the gap. */
export function mainInset() {
  return `calc(${RAIL_WIDTH_EM}em * var(--ts-chrome-scale, 1) + 1.5rem)`;
}

/** Mark the page so <main> makes room for the rails (index.css). Never throws. */
export function markRails(doc, on) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.documentElement) return;
  try {
    if (on) d.documentElement.setAttribute(RAILS_ATTR, 'sides');
    else d.documentElement.removeAttribute(RAILS_ATTR);
  } catch { /* ignore */ }
}

/**
 * Ask the browser for real full screen, best-effort: a TV browser that allows
 * it loses its address bar too; one that refuses still gets the attribute and
 * the CSS. Returns true when the request was made.
 */
export function enterFullScreen(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.documentElement) return false;
  try { d.documentElement.setAttribute(FULLSCREEN_ATTR, 'true'); } catch { /* ignore */ }
  const el = d.documentElement;
  const ask = el.requestFullscreen || el.webkitRequestFullscreen;
  if (typeof ask !== 'function') return false;
  try {
    const p = ask.call(el);
    if (p && typeof p.catch === 'function') p.catch(() => { /* the browser said no; the CSS still hides the chrome */ });
    return true;
  } catch { return false; }
}

export function exitFullScreen(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return false;
  try { if (d.documentElement) d.documentElement.removeAttribute(FULLSCREEN_ATTR); } catch { /* ignore */ }
  const el = d.fullscreenElement || d.webkitFullscreenElement;
  const leave = d.exitFullscreen || d.webkitExitFullscreen;
  if (!el || typeof leave !== 'function') return false;
  try {
    const p = leave.call(d);
    if (p && typeof p.catch === 'function') p.catch(() => { /* ignore */ });
    return true;
  } catch { return false; }
}

/** Keys that leave full screen: Esc on a keyboard, Back on a remote. */
export function leavesFullScreen(key) {
  return key === 'Escape' || key === 'GoBack' || key === 'BrowserBack';
}
