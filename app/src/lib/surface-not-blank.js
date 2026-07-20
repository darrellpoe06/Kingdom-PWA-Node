// =============================================================================
// surface-not-blank — the "a rendered surface must not be blank" assertion
// =============================================================================
// The 2026-07-19 miss: Books → Imported rendered an EMPTY content area while
// every gate (CI, site-health, Ari's records read) stayed green — because none
// of them renders a surface and looks at what a user sees. This is the missing
// witness at its cheapest: a deterministic, jsdom-runnable check that a mounted
// surface produced VISIBLE, substantive content — not nothing, and not a thin
// low-contrast strip that reads as broken.
//
// It intentionally does NOT judge correctness (that's each surface's own tests);
// it only refuses the "renders blank" class. A denied/empty state PASSES when it
// says, visibly, why it is empty and what to do — which is the bar a trustworthy
// surface must clear. Pure (takes an element + its textContent); the DOM read is
// the caller's, so this is unit-testable without a DOM.
//
// Grounds: DR-0076 (measure the real artifact — here, the rendered output),
// DR-0061 (a surface is a live view), DR-0125 (prove the surface, not the proxy).
// =============================================================================

// Minimum trimmed visible-text length for a surface to count as "not blank".
// A real empty/denied state carries a heading + one sentence of guidance, which
// clears this comfortably; a bare "" or a one-word strip does not.
export const MIN_SURFACE_TEXT = 24;

// Assess a rendered surface. `text` is the element's visible textContent; `hasBox`
// is whether the surface drew at least one bordered/backgrounded container (a card,
// a table, a tile) rather than only floating text. Returns { ok, reason }.
export function assessSurface(text, hasBox) {
  const trimmed = (text || '').replace(/\s+/g, ' ').trim();
  if (trimmed.length === 0) return { ok: false, reason: 'blank: no visible text' };
  if (trimmed.length < MIN_SURFACE_TEXT) {
    return { ok: false, reason: `near-blank: only ${trimmed.length} chars of visible text` };
  }
  if (!hasBox) return { ok: false, reason: 'text-only: no visible container (card/table/tile)' };
  return { ok: true, reason: 'ok' };
}

// DOM convenience: read a mounted container and assess it. A "box" is any element
// that carries a border/background utility or is a table — the visible-container
// signal an unstyled floating strip lacks. jsdom-friendly (querySelector only).
export function assessSurfaceEl(el) {
  if (!el) return { ok: false, reason: 'blank: no element' };
  const box = el.querySelector(
    'table, [class*="border"], [class*="bg-white"], [class*="bg-["]'
  );
  return assessSurface(el.textContent || '', !!box);
}
