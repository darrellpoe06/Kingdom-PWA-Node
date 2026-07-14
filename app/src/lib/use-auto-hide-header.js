// =============================================================================
// use-auto-hide-header — the standard PoeTech collapsing top bar
// =============================================================================
// Darrell (2026-07-14): "The top header needs to have the drop up then back down
// if when needed ... and is supposed to be a standard PoeTech build." A tall
// header (brand + comfort controls + actions) eats the small phone viewport while
// you read. This is the headroom pattern made a REUSABLE PoeTech primitive: the
// header "drops up" out of the way as you scroll DOWN into content, and "comes
// back down" the instant you scroll UP (or reach the top) — one gesture away,
// never in the way.
//
// The scroll decision is a PURE function (nextHidden) so it is regression-guarded
// (DR-0076): the hook is just the thin window-listener wrapper around it.
// =============================================================================
import { useEffect, useRef, useState } from 'react';

// nextHidden — should the header be hidden now? Pure so the truth table is
// pinned by tests. `revealAtTop` keeps the header shown near the very top (so it
// is always there when you land / scroll home); `threshold` ignores sub-pixel
// jitter so a resting finger doesn't flicker the bar.
export function nextHidden(prev, y, lastY, { threshold = 8, revealAtTop = 4 } = {}) {
  const cur = Math.max(0, Number(y) || 0);
  const last = Math.max(0, Number(lastY) || 0);
  if (cur <= revealAtTop) return false;        // at/near the top => always shown
  const dy = cur - last;
  if (Math.abs(dy) <= threshold) return !!prev; // jitter => hold current state
  return dy > 0;                                // scrolling down => hide; up => show
}

// The hook: returns `hidden` — true means translate the header off-screen. SSR /
// test-safe (no window => never hides). Uses rAF-coalesced, passive scrolling.
export function useAutoHideHeader(opts = {}) {
  const { threshold = 8, revealAtTop = 4 } = opts;
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    lastY.current = window.scrollY || 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        setHidden((prev) => nextHidden(prev, y, lastY.current, { threshold, revealAtTop }));
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, revealAtTop]);
  return hidden;
}

export default useAutoHideHeader;
