// =============================================================================
// use-idle-reveal — floating controls rest, get out of the way, then remind
// =============================================================================
// Darrell 2026-07-14: the floating buttons (Feedback, read-aloud) "should move
// out the way after a certain amount of time and come up when the users move the
// screen as gentle reminders that those options exist." Best-practice FAB
// behavior: visible at rest, fade/settle out of the way after a few idle seconds,
// and re-reveal the instant the user scrolls or moves — the reappearance IS the
// gentle reminder. Pairs with the rule that these controls do NOT scale with the
// text-size control (they're chrome, sized in fixed px — Pattern 2b).
//
// Returns `visible`. SSR/test-safe (no window => always visible, never hidden).
// The decision is time + activity only; the caller maps `visible` to opacity /
// translate so the button stays tappable (dimmed, not gone).
// =============================================================================
import { useEffect, useRef, useState } from 'react';

export function useIdleReveal({ idleMs = 3500 } = {}) {
  const [visible, setVisible] = useState(true);
  const timer = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const arm = () => {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), idleMs);
    };
    // Any real interaction re-reveals + restarts the idle countdown.
    const onScroll = () => arm();
    const onMove = () => arm();
    arm();
    const passive = { passive: true };
    window.addEventListener('scroll', onScroll, passive);
    window.addEventListener('touchstart', onMove, passive);
    window.addEventListener('pointerdown', onMove, passive);
    window.addEventListener('keydown', onMove);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('scroll', onScroll, passive);
      window.removeEventListener('touchstart', onMove, passive);
      window.removeEventListener('pointerdown', onMove, passive);
      window.removeEventListener('keydown', onMove);
    };
  }, [idleMs]);
  return visible;
}

export default useIdleReveal;
