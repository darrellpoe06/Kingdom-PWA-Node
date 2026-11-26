// =============================================================================
// useLanding -- the Read place survives the landing (DR-1671)
// (Not lib/lesson-landing.js, which finds the classic page's sentence on screen; this only
// keeps the page's own settling from being saved as the reader's place.)
// =============================================================================
// Darrell 2026-11-26: reopened lesson 140 from Recently opened after an update and
// it started at the top -- "it didn't take me back to paragraph 6 out of 12". The
// landing scrolled while the picture and fonts were still loading; anything that
// moved the page then (the picture arriving, the app resetting to the top) was read
// as the reader's new place and saved over the real one.
//
// For SETTLE_MS after a landing, only the reader's own touch, pointer, wheel or key
// can move the place; the landing is re-applied as the page settles unless the
// reader has already moved. Nothing the reader does is held back: their first
// gesture ends the guard at once.
// =============================================================================
import { useCallback, useEffect, useRef } from 'react';

export const SETTLE_MS = 1500;
export const RELAND_MS = Object.freeze([350, 1100]);
const READER_GESTURES = ['touchstart', 'pointerdown', 'wheel', 'keydown'];

export function useLanding() {
  const moved = useRef(false);
  const until = useRef(0);
  const timers = useRef([]);
  useEffect(() => {
    const mine = () => {
      moved.current = true;
    };
    READER_GESTURES.forEach((e) => window.addEventListener(e, mine, { passive: true }));
    return () => {
      READER_GESTURES.forEach((e) => window.removeEventListener(e, mine, { passive: true }));
      timers.current.forEach(clearTimeout);
    };
  }, []);
  /** True while a scroll is the page settling, not the reader reading. */
  const settling = useCallback(() => !moved.current && Date.now() < until.current, []);
  /** Land on getEl() now, and again as the page settles, unless the reader moves first. */
  const land = useCallback((getEl, scroll) => {
    until.current = Date.now() + SETTLE_MS;
    scroll(getEl());
    timers.current = RELAND_MS.map((ms) =>
      setTimeout(() => {
        if (!moved.current) scroll(getEl());
      }, ms)
    );
  }, []);
  return { settling, land };
}
