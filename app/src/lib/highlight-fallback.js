// =============================================================================
// highlight-fallback — paint the reading highlight where CSS.highlights is absent
// =============================================================================
// Darrell 2026-09-20, watching a lesson read itself on a Fire TV: "Make sure
// the highlighting works with the reader."
//
// It did not, and the reason is one API. read-follow.js paints the follow-along
// with the CSS Custom Highlight API — CSS.highlights plus ::highlight() — which
// is elegant (no DOM mutation, no reflow) and shipped in Chromium 105. Fire
// TV's Silk is built on a much older Chromium, so supportsHighlight() answers
// false, setNamed() returns false, and NOTHING IS PAINTED. index.css even says
// so outright: "browsers without the API simply never paint these and the
// auto-scroll floor still follows."
//
// On a phone that floor is a fair trade — the page still scrolls to the right
// place and your thumb is an inch away. On a television it is the whole
// feature: the viewer is across a room, cannot see a caret, and the highlight
// IS how they keep their place. DR-0264 asked for "highlighted as it reads so
// users can see their place, readers age 6 to 60"; a 6-year-old on a sofa gets
// nothing from a scroll position.
//
// SO THIS PAINTS BOXES. Range.getClientRects() is available in every browser
// that can render the app at all, and it returns one rect per line-box the
// range covers — which is exactly the shape of a highlighter stroke across
// wrapped text. The boxes go into one absolutely-positioned layer that never
// touches the document's own nodes.
//
// WHY NOT WRAP THE RANGE IN A <span>. Because surroundContents() throws on any
// range crossing an element boundary (a sentence with a <strong> in it, which
// this corpus is full of), and splitting nodes to force it would mutate the
// reader's DOM mid-read — reflowing the text under someone's eyes and breaking
// every offset the follow map just computed. A non-destructive overlay cannot
// do that by construction.

/** The one layer that holds every painted box. */
export const LAYER_ID = 'poe-read-highlight-layer';

/**
 * Viewport rects → document-space boxes.
 *
 * PURE, and separated for the same reason the D-pad geometry is: jsdom runs no
 * layout, so a DOM-coupled version could not be tested with real coordinates
 * and would prove nothing (DR-0076 §3).
 *
 * Zero-area rects are dropped. A range that begins exactly at a line break
 * yields an empty leading rect, and painting it leaves a 0×0 artefact that some
 * engines still render as a hairline.
 */
export function boxesFor(rects, { scrollX = 0, scrollY = 0 } = {}) {
  return Array.from(rects || [])
    .filter((r) => r && r.width > 0 && r.height > 0)
    .map((r) => ({
      left: r.left + scrollX,
      top: r.top + scrollY,
      width: r.width,
      height: r.height,
    }));
}

/** Get (or build) the overlay layer. */
export function ensureLayer(doc) {
  if (!doc || !doc.body) return null;
  let layer = doc.getElementById(LAYER_ID);
  if (layer) return layer;
  layer = doc.createElement('div');
  layer.id = LAYER_ID;
  // aria-hidden: the highlight is a VISUAL aid for a sighted reader following
  // along. A screen-reader user is already being read to by the same engine,
  // and announcing a stack of empty divs would be noise over the top of it.
  layer.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(layer);
  return layer;
}

/**
 * Paint `range` for `name`, or clear that name when range is null.
 * Returns the number of boxes painted — 0 is a real answer, not a failure.
 */
export function paint(name, range, win = typeof window !== 'undefined' ? window : null) {
  const doc = win && win.document ? win.document : null;
  if (!doc) return 0;
  const layer = ensureLayer(doc);
  if (!layer) return 0;

  // Clear this name's previous boxes. Only this name's: the sentence wash and
  // the word emphasis are independent and must not erase one another.
  for (const old of Array.from(layer.querySelectorAll(`[data-hl="${name}"]`))) old.remove();
  if (!range) return 0;

  let rects;
  try { rects = typeof range.getClientRects === 'function' ? range.getClientRects() : []; } catch (_) { return 0; }
  const boxes = boxesFor(rects, { scrollX: win.scrollX || 0, scrollY: win.scrollY || 0 });
  for (const b of boxes) {
    const el = doc.createElement('div');
    el.setAttribute('data-hl', name);
    el.className = `poe-hl-box poe-hl-${name}`;
    el.style.left = `${b.left}px`;
    el.style.top = `${b.top}px`;
    el.style.width = `${b.width}px`;
    el.style.height = `${b.height}px`;
    layer.appendChild(el);
  }
  return boxes.length;
}

/** Remove every painted box and the layer itself. */
export function clearAll(win = typeof window !== 'undefined' ? window : null) {
  const doc = win && win.document ? win.document : null;
  const layer = doc && doc.getElementById ? doc.getElementById(LAYER_ID) : null;
  if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
}
