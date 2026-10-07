// =============================================================================
// tv-paging — a page that a pointer-only TV browser can still walk end to end
// =============================================================================
// Darrell 2026-10-07, on the Firestick, in the Learn tree: "Can't scroll
// lists of lessons on Firestick... how can we choose from the whole list in a
// Firestick?!!!" The screenshot showed OCTOBER 2026 · 7 lessons, four of
// them visible, the box cut off at the fourth.
//
// WHY A TV CANNOT SCROLL THAT BOX. Fire TV's Silk drives a POINTER with the
// D-pad. It scrolls the PAGE when the pointer leans on the screen's edge, and
// that is the only scrolling it does: an inner box with its own max-height
// and overflow-y: auto has no edge to lean on, no wheel, no thumb, and the
// pointer sailing over it never moves it. The remote-navigation module
// (ArrowDown → focus the next item → scrollIntoView) only runs when Silk is
// sending arrow KEYS, which in pointer mode it is not. So on the exact device
// with the most room, the list showed the fewest lessons and no way to the rest.
//
// TWO FIXES, BOTH STRUCTURAL.
//   1. index.css: on <html data-device-class="tv"> every inner scroll box
//      inside <main> is FLATTENED — max-height off, overflow visible — so the
//      page is the only scroller, and the page is what the pointer can scroll.
//      (A fixed overlay keeps its own scroll: it is not in <main>.)
//   2. The dock grows ▲ Up / ▼ Down page chips on a TV (this module's step):
//      a pointer click moves the page most of a screen, so the whole list is
//      reachable by clicking, without finding the edge.
export const PAGE_FRACTION = 0.8;

/** How far one page chip moves: most of the screen, so lines carry over. */
export function pageStep(viewportHeight) {
  const h = Number(viewportHeight) || 0;
  if (h <= 0) return 0;
  return Math.round(h * PAGE_FRACTION);
}

/**
 * Move the page one step up or down. `behavior` is the motion preference the
 * app already honours ('smooth' | 'auto'). Never throws: an old engine that
 * rejects the options object gets the two-argument form.
 */
export function pageBy(dir, { win, behavior = 'auto' } = {}) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  if (!w) return 0;
  const step = pageStep(w.innerHeight);
  if (!step) return 0;
  const delta = dir === 'up' ? -step : step;
  try { w.scrollBy({ top: delta, left: 0, behavior }); } catch { try { w.scrollBy(0, delta); } catch { /* no scroller */ } }
  return delta;
}

/** The chips are for a TV; a phone thumb and a mouse wheel already page. */
export function showsPageChips(deviceClass) {
  return deviceClass === 'tv';
}
