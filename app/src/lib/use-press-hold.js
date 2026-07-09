// =============================================================================
// use-press-hold — the texting-app interaction primitive (Darrell 2026-07-03:
// "long hold gives options not a touch the choose... it's clunky... makes it
// feel cheap").
// =============================================================================
// One element, two intents, zero menus-before-meaning:
//   TAP  (press + release under the threshold)  -> onTap   — the instant action
//   HOLD (press held past the threshold)        -> onHold  — the options reveal
// Exactly how Messenger/WhatsApp reactions feel: tap does the common thing
// immediately; holding opens the palette under your finger.
//
// Details that make it feel right (and not fire by accident):
//   * pointer events (mouse + touch + pen through one path);
//   * a MOVE past ~10px cancels (the user is scrolling, not holding);
//   * after a hold fires, the following click is SWALLOWED so the tap action
//     never double-fires;
//   * context-menu is suppressed only while holding (long-press on mobile
//     otherwise pops the browser menu over our palette);
//   * keyboard stays first-class: Enter/Space = tap, and the caller should
//     provide a visible alternate route to the options (we return nothing
//     keyboard-specific — pair the hold with an explicit affordance).
//
// Returns props to spread on the target: { onPointerDown, onPointerUp,
// onPointerMove, onPointerCancel, onClick, onContextMenu }.
// =============================================================================
import { useRef } from 'react';

export const HOLD_MS = 420;   // the texting-app sweet spot: deliberate, not laggy
const MOVE_TOLERANCE_PX = 10; // beyond this the gesture is a scroll, not a hold

export function usePressHold({ onTap, onHold, holdMs = HOLD_MS } = {}) {
  const state = useRef({ timer: null, held: false, x: 0, y: 0, active: false });

  const clear = () => {
    if (state.current.timer) { clearTimeout(state.current.timer); state.current.timer = null; }
    state.current.active = false;
  };

  const onPointerDown = (e) => {
    // Primary button / touch only.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    state.current.held = false;
    state.current.active = true;
    state.current.x = e.clientX;
    state.current.y = e.clientY;
    state.current.timer = setTimeout(() => {
      if (!state.current.active) return;
      state.current.held = true;
      state.current.timer = null;
      onHold && onHold();
    }, holdMs);
  };

  const onPointerMove = (e) => {
    if (!state.current.active) return;
    const dx = Math.abs(e.clientX - state.current.x);
    const dy = Math.abs(e.clientY - state.current.y);
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clear(); // it's a scroll
  };

  const onPointerUp = () => { clear(); };
  const onPointerCancel = () => { clear(); state.current.held = false; };

  // The click AFTER the gesture: a completed hold swallows it; a plain tap
  // (or keyboard Enter/Space, which arrives as a click with no pointerdown
  // hold in flight) runs the instant action.
  const onClick = (e) => {
    if (state.current.held) {
      state.current.held = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTap && onTap(e);
  };

  // While a hold is mid-flight or just fired, keep the browser's long-press
  // context menu out of the way of our palette.
  const onContextMenu = (e) => {
    if (state.current.active || state.current.held) e.preventDefault();
  };

  return { onPointerDown, onPointerUp, onPointerMove, onPointerCancel, onClick, onContextMenu };
}
