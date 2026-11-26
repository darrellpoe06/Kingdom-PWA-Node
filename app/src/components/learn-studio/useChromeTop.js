// =============================================================================
// useChromeTop — how much of the top of the screen the app's own header covers
// =============================================================================
// Darrell 2026-11-25, from the live Watch screen: "Hard to find the controller at
// times." The player is sticky at top:0, which is UNDER the app's sticky header and
// tab row, so the picture and its controls slid behind them. This measures the
// bottom edge of whatever fixed or sticky chrome sits at the top of the viewport
// (outside the lesson itself) and publishes it as --le-chrome-top on the lesson
// root, so the player pins just below it. Re-measured on scroll and resize because
// the header hides and returns as the reader scrolls. Fail-soft: no window, no
// elementsFromPoint, or any throw leaves the variable unset (the CSS falls back to 0).
import { useEffect } from 'react';

/** Bottom edge (px) of the fixed/sticky chrome at the top of the viewport, ignoring `root`'s own subtree. */
export function measureChromeTop(root, doc = typeof document !== 'undefined' ? document : null, win = typeof window !== 'undefined' ? window : null) {
  if (!doc || !win || typeof doc.elementsFromPoint !== 'function') return 0;
  const limit = Math.round((win.innerHeight || 0) * 0.45);
  let bottom = 0;
  for (let y = 2; y < limit; y += 12) {
    let hit = false;
    for (const el of doc.elementsFromPoint((win.innerWidth || 0) / 2, y)) {
      if (root && root.contains(el)) continue;
      for (let e = el; e && e !== doc.body; e = e.parentElement) {
        const pos = win.getComputedStyle(e).position;
        if (pos === 'fixed' || pos === 'sticky') {
          const r = e.getBoundingClientRect();
          if (r.top <= y && r.bottom > y && r.bottom < limit + 24) {
            bottom = Math.max(bottom, r.bottom);
            hit = true;
          }
          break;
        }
      }
      if (hit) break;
    }
    if (!hit && y > bottom) break;
  }
  return Math.max(0, Math.round(bottom));
}

export default function useChromeTop(ref) {
  useEffect(() => {
    const el = ref && ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    let raf = 0;
    const set = () => {
      raf = 0;
      try {
        el.style.setProperty('--le-chrome-top', `${measureChromeTop(el)}px`);
      } catch {
        /* leave the fallback */
      }
    };
    const ask = () => {
      if (!raf) raf = window.requestAnimationFrame(set);
    };
    set();
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    return () => {
      window.removeEventListener('scroll', ask);
      window.removeEventListener('resize', ask);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [ref]);
}
