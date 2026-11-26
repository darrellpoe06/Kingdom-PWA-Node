// =============================================================================
// live-player-prefs — the viewer's choice for the live player, remembered
// =============================================================================
// Darrell, 2026-09-09: "the player doesn't open in full view when we choose
// for it to when it first opens... the player automation is live... before any
// amount of interaction from users." The Church home player has carried a real
// size choice since 2026-07-16 (Small / Medium / Large, Pop out / Dock, drag —
// REV-0097), but the choice lived in component state: gone on every remount,
// and never known to the shell-level LiveWorshipBar, which opens ON ITS OWN
// inside the service window before the viewer has touched anything. So a
// viewer who chose Large found Medium every first open, on both players.
//
// THE WAY THAT WORKED THIS MORNING (show-the-word.js), applied here: one
// module-level store + useSyncExternalStore, remembered on the device, read by
// BOTH players. The choice is made once and honoured at every first open —
// including the bar's automatic one. Fail-soft on storage (a private window
// just means the default until the viewer chooses). Nothing here remounts an
// iframe: the players apply the scale as pure layout on the same frame.
//
// scale: 's' | 'm' | 'l'   ('l' is "full view" — the player fills the width)
// barCollapsed: the bar's own show/hide video choice, remembered for the
//               session only (the bar is a different animal: it must never
//               come back collapsed a week later when the viewer meant "hide
//               it for now").
import { useSyncExternalStore } from 'react';

export const LIVE_PLAYER_SCALE_KEY = 'poetech-live-player-scale';
export const LIVE_BAR_COLLAPSED_KEY = 'poe.liveWorshipBar.collapsedSession';
export const LIVE_BAR_MINI_KEY = 'poe.liveWorshipBar.miniSession';
export const SCALES = ['s', 'm', 'l'];

function readScale() {
  try { const v = localStorage.getItem(LIVE_PLAYER_SCALE_KEY); return SCALES.includes(v) ? v : 'm'; } catch { return 'm'; }
}
// barCollapsed is THREE-valued (2026-09-30): true = the viewer hid the video,
// false = the viewer chose to show it, null = no choice yet. With no choice the
// bar decides by where the viewer is (a lesson open on a phone starts with the
// video folded, LiveWorshipBar.jsx); a choice, either way, is honoured for the
// session.
function readCollapsed() {
  try {
    const v = sessionStorage.getItem(LIVE_BAR_COLLAPSED_KEY);
    return v === '1' ? true : v === '0' ? false : null;
  } catch { return null; }
}

// barMini (2026-11-25, Darrell: "Watching the latest message shouldn't interfere with using the
// app... we should be able to do both"): true = the video floats small in a corner over the app
// while the bar keeps only its one-line strip; false = the full-width video across the top. It
// is the DEFAULT, because the wide video took the top half of the screen on every page. The
// viewer's choice holds for the session.
function readMini() {
  try { return sessionStorage.getItem(LIVE_BAR_MINI_KEY) !== '0'; } catch { return true; }
}

let state = { scale: readScale(), barCollapsed: readCollapsed(), barMini: readMini() };
const listeners = new Set();
const emit = () => { for (const l of listeners) l(); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

export function getLivePlayerScale() { return state.scale; }

export function setLivePlayerScale(scale) {
  if (!SCALES.includes(scale) || scale === state.scale) return;
  state = { ...state, scale };
  try { localStorage.setItem(LIVE_PLAYER_SCALE_KEY, scale); } catch { /* private window / blocked */ }
  emit();
}

export function setLiveBarCollapsed(collapsed) {
  const v = Boolean(collapsed);
  if (v === state.barCollapsed) return;
  state = { ...state, barCollapsed: v };
  try { sessionStorage.setItem(LIVE_BAR_COLLAPSED_KEY, v ? '1' : '0'); } catch { /* ignore */ }
  emit();
}

export function setLiveBarMini(mini) {
  const v = Boolean(mini);
  if (v === state.barMini) return;
  state = { ...state, barMini: v };
  try { sessionStorage.setItem(LIVE_BAR_MINI_KEY, v ? '1' : '0'); } catch { /* ignore */ }
  emit();
}

/** For tests: forget everything and start from the defaults. */
export function __resetLivePlayerPrefs() {
  state = { scale: 'm', barCollapsed: null, barMini: true };
  try { sessionStorage.removeItem(LIVE_BAR_MINI_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(LIVE_PLAYER_SCALE_KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem(LIVE_BAR_COLLAPSED_KEY); } catch { /* ignore */ }
  emit();
}

/** Both players read this. */
export function useLivePlayerPrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// The width the pinned bar gives the frame for a scale, as a CSS value. 'l' is
// full view: the whole width, the height following 16:9 up to a cap that still
// leaves the page usable beneath it. 'm' keeps the bar's original shape.
export function barFrameStyle(scale) {
  if (scale === 'l') return { width: '100%', maxHeight: '60vh', aspectRatio: '16 / 9' };
  if (scale === 's') return { width: '100%', maxWidth: '28rem', maxHeight: '30vh', aspectRatio: '16 / 9' };
  return { width: '100%', maxWidth: '56rem', maxHeight: '45vh', aspectRatio: '16 / 9' };
}

// The small floating player: bottom corner, above the app's bottom bar, 16:9. The same frame
// element as the wide player (only its style changes), so switching never restarts the video.
export const MINI_FRAME_STYLE = Object.freeze({
  position: 'fixed',
  right: '0.5rem',
  bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
  width: 'min(46vw, 20rem)',
  aspectRatio: '16 / 9',
  zIndex: 45,
  borderRadius: '0.75rem',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,.55)',
  border: '2px solid rgba(255,255,255,.35)',
  background: '#000',
});

// =============================================================================
// THE SMALL PLAYER MOVES (Darrell 2026-11-26, on his phone: "Should be able to
// move the hovering video... also close it from itself to not just top right
// corner"). Its offset from the default corner is held for the session, and is
// always clamped so the whole frame stays on screen.
// =============================================================================
export const LIVE_MINI_POS_KEY = 'poe.liveWorshipBar.miniPosSession';

/**
 * Clamp a drag offset so the frame (its rect at the default corner, i.e. with
 * no offset) stays fully inside a viewport of vw x vh, with a small margin. Pure.
 */
export function clampMiniOffset({ dx = 0, dy = 0 } = {}, base, vw, vh, margin = 4) {
  if (!base || !(vw > 0) || !(vh > 0)) return { dx: 0, dy: 0 };
  const minDx = margin - base.left;
  const maxDx = vw - margin - (base.left + base.width);
  const minDy = margin - base.top;
  const maxDy = vh - margin - (base.top + base.height);
  const clamp = (v, lo, hi) => (lo > hi ? 0 : Math.min(hi, Math.max(lo, v)));
  return { dx: Math.round(clamp(dx, minDx, maxDx)), dy: Math.round(clamp(dy, minDy, maxDy)) };
}

export function readMiniOffset() {
  try {
    const v = JSON.parse(sessionStorage.getItem(LIVE_MINI_POS_KEY) || 'null');
    return v && Number.isFinite(v.dx) && Number.isFinite(v.dy) ? { dx: v.dx, dy: v.dy } : { dx: 0, dy: 0 };
  } catch (_) {
    return { dx: 0, dy: 0 };
  }
}

export function saveMiniOffset(o) {
  try {
    sessionStorage.setItem(LIVE_MINI_POS_KEY, JSON.stringify(o));
  } catch (_) {
    /* no storage: the place holds for this view */
  }
}
