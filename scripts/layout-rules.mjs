// =============================================================================
// layout-rules — the layout DECISIONS, separated from the browser MEASUREMENT
// =============================================================================
// chrome-layout-probe.mjs is a script: importing it starts an HTTP server,
// launches Chromium and calls process.exit. That makes anything defined inside
// it untestable by construction — which is exactly how a rule ends up shipping
// unproven. The browser measures; this decides; vitest pins the deciding.
// =============================================================================

/**
 * A ONE-SIDED gutter — content pinned to one edge with dead space opposite.
 *
 * Born 2026-08-16: ChurchLearn's root carried `max-w-3xl` (768px) with NO
 * `mx-auto`, so on a wide viewport the whole surface hugged the LEFT edge —
 * dead space down the right and every control stranded in the left portion.
 * Darrell found it on a phone; no gate could, because the probe measured only
 * OVERFLOW (scrollWidth > clientWidth) and under-use overflows nothing.
 *
 * A CENTRED narrow column is good typography and MUST pass, so this compares
 * the two margins rather than the column width. Below 900px a narrow column is
 * normal, not a defect.
 *
 * @param {{left:number,right:number,vw:number,width:number}} m measured gutters
 * @returns {boolean} true when the layout strands content to one side
 */
export function strandedGutter({ left, right, vw, width } = {}) {
  if (!Number.isFinite(left) || !Number.isFinite(right) || !vw || !width) return false;
  if (width < 900) return false;
  return right > vw * 0.25 && right > left * 3;
}
