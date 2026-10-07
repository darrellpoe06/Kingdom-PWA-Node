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
// (device-roles / device-link isTvClass) gets the rails; a phone, tablet or
// laptop keeps the tall column — a mouse and a wheel already reach every
// control, and the CI layout probe showed rails on a 1920px laptop covering
// the header's tab row. One tap in the panel header flips it on any screen
// wide enough (SIDES_MIN_WIDTH), and the choice is kept on the device
// ('sides' / 'tall'), as reader-follow-prefs keeps its three.
//
// Storage can be missing or throw (private window, a TV browser): every read
// falls back to 'auto', every write is best-effort.
export const CONTROLLER_KEY = 'poetech.reader.controller.v1';
export const CONTROLLER_MODES = Object.freeze(['auto', 'sides', 'tall']);
export const CONTROLLER_LAYOUTS = Object.freeze(['sides', 'tall']);
/** A chosen 'sides' on a phone, tablet or laptop needs at least this much width. */
export const SIDES_MIN_WIDTH = 1280;
/** A TV narrower than this (CSS px) cannot hold two rails and the Word; the column it is. */
export const TV_FLOOR_WIDTH = 900;
/**
 * Each rail's width: one column of the bottom bar's own buttons, or less on a
 * narrow TV — a Firestick's Silk reports 960 CSS px — so the rail shrinks to
 * keep at least 32rem for the Word; the whole thing scales with the reader's
 * chrome size. The shell's <main> is FULL width (measured, ChurchLearn.jsx:
 * "window 1440, <main> 1440"), so the rails do not sit in empty margin —
 * index.css gives <main> AND the shell header this much inset on each side
 * while RAILS_ATTR holds, and the Word's column narrows between them instead
 * of being covered. The one expression lives here and in index.css; a test
 * pins the two together.
 *
 * NARROWED 2026-10-07 (DR-0796) from 15rem. Darrell, on the Firestick looking
 * at the first cut: "The sides are larger and not like the buttons below...
 * the user just needs the functions to look like the buttons below... just the
 * missing ones I specified in the small side spaces... until we say full
 * screen." The rails stopped carrying the panel's prose, its section headings
 * and its lists; they carry the same square icon-and-word buttons the bottom
 * bar carries, one per function the bottom bar does NOT already have. A column
 * of those needs 6.5rem, so the Word gains 17rem on a 1920px screen.
 */
export const RAIL_WIDTH_REM = 6.5;
export const WORD_MIN_REM = 32;
export const RAIL_WIDTH_CSS = `calc(min(${RAIL_WIDTH_REM}rem, (100vw - ${WORD_MIN_REM}rem) / 2) * var(--ts-chrome-scale, 1))`;
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
  const tv = deviceClass === 'tv';
  const roomy = tv ? (w <= 0 || w >= TV_FLOOR_WIDTH) : w >= SIDES_MIN_WIDTH;
  const p = normalizeControllerPref(pref);
  if (p === 'tall') return 'tall';
  if (p === 'sides') return roomy ? 'sides' : 'tall';
  return tv && roomy ? 'sides' : 'tall';
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

/** Each rail's width, as the rail's own inline style. */
export function railWidth() {
  return RAIL_WIDTH_CSS;
}

/** The inset index.css gives <main> and the header on each side while the rails are on — the rail plus the gap. */
export function mainInset() {
  return `calc(${RAIL_WIDTH_CSS} + 1.5rem)`;
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

// =============================================================================
// WHAT GOES IN THE SMALL SIDE SPACES (DR-0796)
// =============================================================================
// Darrell 2026-10-07, on the Firestick: "The sides are larger and not like the
// buttons below... the user just needs the functions to look like the buttons
// below... just the missing ones I specified in the small side spaces... until
// we say full screen... make sense?"
//
// Two rules, and they are the whole design:
//   1. A rail control LOOKS LIKE a bottom-bar button — a square icon with one
//      word under it (chrome-dock's DOCK_BTN), not a heading with prose and a
//      row of chips.
//   2. A rail carries ONLY what the bottom bar does not. The bar already has
//      Read, Follow, Back, Pause, Next, Window, Top, A- / A+, Up, Down,
//      Feedback, Give, Online — so none of those is repeated on a side.
// Full screen still takes everything away; that is unchanged.
//
// A control with more than two settings becomes ONE button that CYCLES: the
// word under the icon is the setting it is on now, a tap moves to the next.
// That is what a remote can drive — a D-pad reaches one button, not a row of
// five chips. The tall panel keeps every chip and list for a mouse.

/** What the bottom bar already carries, so no rail repeats it. */
export const DOCK_CARRIES = Object.freeze([
  'read', 'follow', 'back', 'pause', 'next', 'window', 'top',
  'size', 'up', 'down', 'feedback', 'give', 'online', 'new', 'controls',
]);

/**
 * Every reader function, the side it belongs on, and whether the bottom bar
 * already has it. `cycle` marks the ones whose word changes with the setting.
 * Order is the order they stand in the rail, top to bottom.
 */
export const RAIL_BUTTONS = Object.freeze([
  // left: the voice and what it reads
  { id: 'level', side: 'left', cycle: true },
  { id: 'start', side: 'left' },
  { id: 'resume', side: 'left' },
  { id: 'tap', side: 'left' },
  { id: 'stop', side: 'left' },
  { id: 'talk', side: 'left' },
  { id: 'awake', side: 'left', cycle: true },
  { id: 'panel', side: 'left' },
  { id: 'full', side: 'left' },
  // right: how it sounds and how it looks
  { id: 'speed', side: 'right', cycle: true },
  { id: 'voice', side: 'right', cycle: true },
  { id: 'colors', side: 'right', cycle: true },
  { id: 'highlight', side: 'right', cycle: true },
  { id: 'place', side: 'right', cycle: true },
  { id: 'word', side: 'right', cycle: true },
  { id: 'offline', side: 'right' },
  // already in the bottom bar — listed so the rule is visible, never rendered
  { id: 'read', side: 'left', dock: true },
  { id: 'pause', side: 'left', dock: true },
  { id: 'back', side: 'left', dock: true },
  { id: 'next', side: 'left', dock: true },
  { id: 'top', side: 'left', dock: true },
  { id: 'window', side: 'left', dock: true },
  { id: 'follow', side: 'right', dock: true },
  { id: 'size', side: 'right', dock: true },
]);

/**
 * The ids that stand in one rail: that side's functions, minus everything the
 * bottom bar carries. `carries` is injectable so a test can prove that adding
 * a function to the bar takes it off the rail.
 */
export function railButtonIds(side, { carries = DOCK_CARRIES } = {}) {
  const has = new Set(carries || []);
  return RAIL_BUTTONS.filter((b) => b.side === side && !b.dock && !has.has(b.id)).map((b) => b.id);
}

/**
 * The ONE word that goes under a rail button's icon. A bar button is a square,
 * so a setting's full name ("Midnight · OLED black", "Cream · warm light")
 * does not fit: the part before the separator is the name a reader uses.
 */
export function railWord(label, max = 12) {
  const s = String(label == null ? '' : label).trim();
  if (!s) return '';
  const head = s.split(/\s*[·—–(|]/)[0].trim() || s;
  if (head.length <= max) return head;
  const cut = head.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (space >= 4 ? cut.slice(0, space) : cut).trim();
}

/** The next setting a cycling button moves to; wraps, and an unknown current starts at the first. */
export function nextInCycle(values, current) {
  const list = Array.isArray(values) ? values : [];
  if (list.length === 0) return undefined;
  const i = list.indexOf(current);
  return list[(i + 1) % list.length];
}
