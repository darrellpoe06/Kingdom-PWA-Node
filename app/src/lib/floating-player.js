// =============================================================================
// floating-player — the popped-out video outlives the tab it was opened from
// =============================================================================
// Darrell 2026-09-20, watching Bishop Gwin on the TV: "Going away from the tab
// should not close the popout video player... fix it..."
//
// It closed because it was never a floating player in the app's sense — it was
// a CSS position on a div inside ChurchHome. ChurchHome is tab-scoped, so
// leaving Church unmounts the subtree, the <iframe> goes with it, and the
// stream dies. The component already guarded the near-miss version of this: its
// own comment says the iframe "stays keyed + in the SAME wrapper so toggling
// size/float/drag never remounts it (a remount would restart the stream)". That
// solved remount-on-TOGGLE. Nothing could solve unmount-on-NAVIGATE from inside
// the component being unmounted.
//
// So the popped-out player moves OUT of the tab and into the shell, and this
// module is the handoff. It holds nothing but the facts needed to keep playing
// — which source, what to call it, where the person dragged it — published the
// way the rest of this codebase publishes cross-surface state (read-target.js,
// show-the-word.js): a module-level value plus subscribers, no context, no
// provider, nothing for a re-render to drop.
//
// WHY NOT A PORTAL. createPortal moves where a node is PAINTED, not where it is
// OWNED: the portal's contents still unmount with the component that rendered
// them. It would have looked right until the moment it mattered.

let state = { src: '', title: '', pos: null };
const subscribers = new Set();

function emit() {
  for (const fn of Array.from(subscribers)) {
    try { fn(state); } catch (_) { /* one bad subscriber never stops the rest */ }
  }
}

/** The current player state. Always an object; `src` empty means nothing is out. */
export function getFloating() { return state; }

/** True when a popped-out player should be on screen. */
export function isFloating() { return !!state.src; }

/**
 * Pop a player out. Re-opening the SAME src is a deliberate no-op: the whole
 * point is that the stream keeps running, and republishing an identical state
 * would re-render the iframe's key and restart it — the exact failure the
 * original in-place version had already learned to avoid.
 */
export function openFloating({ src, title = '' } = {}) {
  const next = String(src || '');
  if (!next) return;
  if (state.src === next) { state = { ...state, title }; emit(); return; }
  state = { src: next, title, pos: null };
  emit();
}

/** Dock it — the tab that owns it takes the picture back. */
export function closeFloating() {
  if (!state.src) return;
  state = { src: '', title: '', pos: null };
  emit();
}

/** Remember where it was dragged to. */
export function setFloatingPos(pos) {
  state = { ...state, pos: pos || null };
  emit();
}

/** Subscribe; returns the unsubscribe. */
export function subscribeFloating(fn) {
  if (typeof fn !== 'function') return () => {};
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Tests only — drop every subscriber and reset. */
export function resetFloating() {
  state = { src: '', title: '', pos: null };
  subscribers.clear();
}
