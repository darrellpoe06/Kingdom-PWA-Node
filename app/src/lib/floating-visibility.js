// =============================================================================
// floating-visibility — the shared "leave, then come back when wanted" behavior
// for the corner floaters (Feedback, Give, TTS, Network pill).
// =============================================================================
// Darrell, 2026-07-12: "The lower prompts like feedback etc BLOCK when they
// should leave after a certain amount of time and come back when we believe they
// will want it — like during giving time and during the livestreams."
//
// So a floater: shows briefly, then AUTO-HIDES after an idle period so it stops
// covering content; and REVEALS again on the signals that mean the person wants
// it — scrolling up (reaching for it), or an explicit context cue (`forceVisible`
// = giving time / a live service). It never unmounts — it slides to its corner
// and returns, so state (an open panel) is preserved and the return is smooth.
//
// The pure reducer `scrollAction` is unit-tested (floating-visibility.test.js):
// scroll DOWN past the threshold hides; scroll UP past it reveals; near the top
// always reveals; small jitter changes nothing. The hook wires it to the window.

import { useEffect, useRef, useState } from 'react';

// Pure: given the previous scrollY and the new one, what should happen?
// Returns 'hide' | 'reveal' | 'none'. Threshold ignores small jitter so the
// floater doesn't flicker on every pixel.
export function scrollAction(prevY, nextY, { threshold = 14, topZone = 8 } = {}) {
  if (nextY <= topZone) return 'reveal';          // at the top: always available
  const delta = nextY - prevY;
  if (delta > threshold) return 'hide';           // scrolling down → get out of the way
  if (delta < -threshold) return 'reveal';        // scrolling up → they're reaching for it
  return 'none';
}

// useAutoHideOnScroll — returns { visible } for a corner floater.
//   idleMs      — after showing with no scroll, hide (0 disables the idle-hide).
//   forceVisible — a context cue that PINS it visible (giving time / live service).
//   disabled     — opt out entirely (always visible), e.g. reduced-motion or SSR.
export function useAutoHideOnScroll({ idleMs = 6000, forceVisible = false, disabled = false } = {}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (disabled || forceVisible) { setVisible(true); return undefined; }
    if (typeof window === 'undefined') return undefined;

    lastY.current = window.scrollY || 0;
    const armIdle = () => {
      if (!idleMs) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), idleMs);
    };
    armIdle();

    const onScroll = () => {
      const y = window.scrollY || 0;
      const action = scrollAction(lastY.current, y);
      lastY.current = y;
      if (action === 'hide') { setVisible(false); if (hideTimer.current) clearTimeout(hideTimer.current); }
      else if (action === 'reveal') { setVisible(true); armIdle(); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [idleMs, forceVisible, disabled]);

  // forceVisible always wins (giving time / live service pins the floater up).
  return { visible: forceVisible || disabled ? true : visible };
}

// The class an auto-hiding corner floater adds when hidden: slide toward its
// corner + fade, and stop intercepting taps. `side` picks the slide direction so
// it tucks off the nearest edge. Pair with `transition-all duration-300`.
export function hiddenFloaterClass(visible, side = 'bottom') {
  if (visible) return '';
  const slide = side === 'left' ? 'translate-x-[-140%]'
    : side === 'right' ? 'translate-x-[140%]'
    : 'translate-y-[140%]';
  return `${slide} opacity-0 pointer-events-none`;
}
