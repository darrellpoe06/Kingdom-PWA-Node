// =============================================================================
// gentle-motion — the still-screen primitives (DR-0274; grounds DR-0131).
//
// Darrell, 2026-07-09: "this needs to open in place and not move fast from that
// location because humans can get dizzy." UX-PATTERNS' accessibility bar makes
// reduced motion first-class ("Reduced motion mode respected (no auto-animation)").
// Every programmatic scroll in the app rides these helpers so both halves of
// that Way hold everywhere at once:
//   · content OPENS IN PLACE — the screen is never flown to content that chose
//     to render far from the user's finger (fix the placement, not the flight);
//   · when the user explicitly asks to travel (a "back to top" tap, a "full
//     editor ↗" jump), the trip animates only for users whose OS has not asked
//     for reduced motion — otherwise it is an instant, motionless cut.
//
// A source-scan guard (__tests__/still-screen-motion.test.js) fails the build
// if any surface hardcodes `behavior: 'smooth'` instead of coming through here.
// =============================================================================

/** True when the user's OS/browser asks for reduced motion. Fail-open to
 *  "no preference" only where the media query itself is unavailable. */
export function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { return false; }
}

/** The one sanctioned scroll behavior: 'smooth' only for users who have not
 *  asked for reduced motion; an instant cut for those who have. */
export function motionBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * Reveal the top edge of content that just opened IN PLACE — with the least
 * possible movement, usually none. If the element's top is already on screen
 * (the normal case: it opened right under the user's finger), the screen does
 * NOT move at all. Only when the top edge sits below the fold does the view
 * nudge down by exactly the overshoot (at most about one tile of travel),
 * honoring reduced motion. This is the opposite of the forbidden pattern
 * (render far away, then fly the screen there).
 *
 * Returns the number of pixels scrolled (0 = the screen stayed still).
 */
export function gentleReveal(el, { margin = 120 } = {}) {
  if (!el || typeof el.getBoundingClientRect !== 'function' || typeof window === 'undefined') return 0;
  let vh;
  try { vh = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0; } catch (e) { vh = 0; }
  if (!vh) return 0;
  const top = el.getBoundingClientRect().top;
  const delta = Math.ceil(top - (vh - margin));
  if (delta <= 0) return 0; // already in view — the screen holds still
  try { window.scrollBy({ top: delta, behavior: motionBehavior() }); }
  catch (e) { try { window.scrollBy(0, delta); } catch (e2) { /* non-fatal */ } }
  return delta;
}
