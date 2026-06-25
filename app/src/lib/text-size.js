// =============================================================================
// text-size — one reusable LARGE-PRINT primitive for the whole app
// =============================================================================
// WCAG 2.1 Resize Text (1.4.4): text must be resizable up to 200% without loss
// of content or function. Many of our congregation — The Church of the Living
// God is the largest African American community in Champaign-Urbana, with
// elderly, tech-novice members (COMMUNITY-FIRST-MISSION) — need LARGER PRINT to
// read, which is distinct from text-to-speech: some need to SEE bigger text, not
// hear it. Both ship; neither replaces the other.
//
// Mechanism: scale the document ROOT font-size. Every rem/em-based size in the
// app (Tailwind's text-sm/base/lg/xl, spacing, etc. are rem by default) grows
// proportionally from a single setting — the clean, WCAG-correct approach, not
// per-component overrides. This is a shared-core / shell accessibility primitive:
// set once, every feature module inherits it for free (hybrid-modular direction,
// DR-0078). ONE universal control lives in the app header (no per-module duplicate).
//
// Coverage rule (decided by Darrell 2026-06-17): text in a reading surface that
// did NOT grow at A+++ was a bug — small fixed-px labels (text-[10px] etc.) are
// absolute px and do not inherit the root scale. The fix is to author those as
// rem at the SAME 16px baseline (text-[10px] -> text-[0.625rem]): pixel-identical
// at Normal, but now scaling with the control. Converted across the named reading
// surfaces (The Word, Engagement, the Center/ops boards, Choir); flex-wrap layouts
// absorb the 1.5x at Largest, so nothing shatters. New reading text uses rem, never
// fixed px. (Deep-chrome px in the financial monolith stays a tracked follow-up.)
//
// Persistence is PER DEVICE in localStorage (process-don't-store default), kept
// separate from the cloud-synced theme so a member sets it ONCE on their own
// phone — and it applies even before sign-in, on the public conference page.
//
// Pure functions are exported and unit-tested; the React hook is thin glue.
import { useCallback, useState } from 'react';
// The shared scroll-anchor mechanism (also powers reading-position resume). One-
// way dependency: reading-position.js never imports this, so no cycle.
import { captureAnchor, applyAnchor } from './reading-position.js';

const STORAGE_KEY = 'poe-text-size';

// Stepped, plain-language options with an "A / A+ / A++ / A+++" affordance.
// Multipliers: Largest = 1.5x root. On the reading bodies (which already use
// Tailwind text-base/lg/xl) that lands large-print text at ~200% of the smallest
// chrome baseline — the WCAG 1.4.4 target — while staying inside a layout that
// does not break. Big, plain labels for non-technical readers.
export const TEXT_SIZE_STEPS = [
  { key: 'normal',  mult: 1,    label: 'A',    name: 'Normal'  },
  { key: 'large',   mult: 1.15, label: 'A+',   name: 'Large'   },
  { key: 'larger',  mult: 1.3,  label: 'A++',  name: 'Larger'  },
  { key: 'largest', mult: 1.5,  label: 'A+++', name: 'Largest' },
];

export const DEFAULT_TEXT_SIZE = 'normal';

// -----------------------------------------------------------------------------
// Scope split (decided by Darrell 2026-06-17): CONTENT scales, CHROME is capped.
// -----------------------------------------------------------------------------
// The root-scale primitive grows every rem in the app uniformly — which means the
// big display header ("Financial Control System") and the nav/menu ballooned just
// as much as the cell text, wasting space and pushing the readable content down.
// That is backwards: the words people actually need bigger are the BODY/CELL
// content, not the already-large display type and the navigation chrome.
//
// The rule this primitive now enforces:
//   • CONTENT (cell text, card body, labels, list items, form text) scales FULLY
//     across A -> A+++ — it inherits the root scale for free, unchanged.
//   • DISPLAY / NAV chrome (the page-title <h1>, the primary nav, the sub-navs)
//     is CAPPED — it grows only gently so it stays roughly fixed, never balloons.
//
// Mechanism: we still scale the root font-size (so all content scales with zero
// per-component edits — the #251 win is preserved). We ALSO publish a per-step CSS
// variable, --ts-chrome-scale, that a reusable `.ts-chrome-region` class applies as
// `zoom` to a chrome region (the page-title row, each nav row). zoom is a re-layout
// in every current engine: it caps the region's FONT *and* its box (padding, gaps,
// line height) together — so the nav stops both ballooning its text and pushing
// content down — while preserving full width and `position: sticky` (both verified
// live). --ts-chrome-scale = chromeMult / mult: at Largest the root is 1.5x, the
// region zooms 0.75x, netting ~1.125x (capped). At Normal it is exactly 1 — an
// exact no-op (pixel-identical to today). The marked regions hold only rem-driven
// chrome (no fixed-px controls), so nothing already-fixed is shrunk.
//
// CHROME_SCALE_FACTOR controls how much of the content growth the chrome is
// allowed to follow. 0.25 => at Largest (1.5x content) the chrome is ~1.125x —
// "maybe slightly larger, capped," never ballooned.
export const CHROME_SCALE_FACTOR = 0.25;

/**
 * The capped multiplier for display/nav chrome, given the full content multiplier.
 * Chrome follows only CHROME_SCALE_FACTOR of the content's growth above 1x, so it
 * stays roughly fixed while content scales fully. Pure + unit-tested.
 *   mult 1    -> 1      (Normal: identical)
 *   mult 1.15 -> 1.0375
 *   mult 1.3  -> 1.075
 *   mult 1.5  -> 1.125  (Largest: chrome ~12.5% larger vs content 50% larger)
 */
export function chromeMultFor(mult) {
  const m = typeof mult === 'number' && mult > 0 ? mult : 1;
  return 1 + (m - 1) * CHROME_SCALE_FACTOR;
}

/**
 * The `zoom` factor a `.ts-chrome-region` applies to undo most of the root scale.
 * = chromeMult / mult. Net rendered size of a chrome region = root(mult) * zoom =
 * chromeMult (the cap). 1 at Normal (no-op); 0.75 at Largest (1.5x root -> 1.125x).
 */
export function chromeScaleFor(mult) {
  const m = typeof mult === 'number' && mult > 0 ? mult : 1;
  return chromeMultFor(m) / m;
}

/** Resolve a step record by key, falling back to Normal for anything unknown. */
export function stepFor(key) {
  return TEXT_SIZE_STEPS.find((s) => s.key === key) || TEXT_SIZE_STEPS[0];
}

/** True when key names a real step. */
export function isValidTextSize(key) {
  return TEXT_SIZE_STEPS.some((s) => s.key === key);
}

/**
 * Apply a size by scaling the root font-size as a PERCENTAGE (browser default
 * root = 16px). A percentage composes with the user's own browser/OS zoom rather
 * than overriding it. rem/em inherit and scale; px does not (intentional). Also
 * stamps data-text-size on <html> so CSS can react if ever needed. Returns the
 * resolved step. Safe in a non-DOM (test) environment.
 *
 * Publishes the CSS variables the content-vs-chrome scope split reads (see above):
 * --ts-mult (the full content multiplier), --ts-chrome-mult (the capped chrome
 * multiplier), and --ts-chrome-scale (the `zoom` a `.ts-chrome-region` applies).
 * All are 1 at Normal, so the chrome cap is an exact no-op there.
 */
export function applyTextSize(key, doc = (typeof document !== 'undefined' ? document : undefined)) {
  const step = stepFor(key);
  const root = doc && doc.documentElement;
  if (root) {
    root.style.fontSize = `${step.mult * 100}%`;
    root.setAttribute('data-text-size', step.key);
    // Variables for the content-vs-chrome scope split. style.setProperty is the
    // standards API; guard it so the lightweight test DOM stand-in (plain object
    // style) doesn't throw.
    if (root.style && typeof root.style.setProperty === 'function') {
      root.style.setProperty('--ts-mult', String(step.mult));
      root.style.setProperty('--ts-chrome-mult', String(chromeMultFor(step.mult)));
      root.style.setProperty('--ts-chrome-scale', String(chromeScaleFor(step.mult)));
    }
  }
  return step;
}

/** Read the saved per-device size, or the default. Never throws. */
export function loadTextSize(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    const v = store && store.getItem(STORAGE_KEY);
    if (v && isValidTextSize(v)) return v;
  } catch (e) { /* private mode / no storage — fall through to default */ }
  return DEFAULT_TEXT_SIZE;
}

/** Persist the per-device size. Never throws. */
export function saveTextSize(key, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    if (store) store.setItem(STORAGE_KEY, key);
  } catch (e) { /* private mode / no storage — non-fatal, size still applied this session */ }
}

/**
 * Boot hook: apply the stored size BEFORE React paints, so there is no flash of
 * default-size text that then jumps. Called from main.jsx for the full app AND
 * every standalone boot (?register, ?audience, ...) — so the conference page a
 * senior opens is already large if they set it large. Returns the active key.
 */
export function initTextSize() {
  const key = loadTextSize();
  applyTextSize(key);
  return key;
}

/**
 * Set + persist + apply in one call. Returns the validated key actually used.
 *
 * SCROLL-ANCHOR (anti-whiplash, Darrell 2026-06-25): a font-size change reflows
 * the page, which used to throw the reader to the top. We capture the element
 * the reader is looking at BEFORE the reflow and restore it to the same viewport
 * offset AFTER — so changing text size keeps you exactly where you were. This is
 * the SAME anchor mechanism the resume primitive uses (reading-position.js), so
 * every reading/scroll surface the global control affects (The Word, Scripture,
 * lessons, books) gets it for free — no per-surface wiring. Guarded: no-ops in
 * SSR/boot (initTextSize calls applyTextSize directly, before any scroll).
 */
export function setTextSize(key) {
  const k = isValidTextSize(key) ? key : DEFAULT_TEXT_SIZE;
  let anchor;
  try { anchor = captureAnchor(); } catch (e) { anchor = null; }
  applyTextSize(k);
  saveTextSize(k);
  if (anchor) { try { applyAnchor(anchor); } catch (e) { /* non-fatal */ } }
  return k;
}

/**
 * React glue: [activeKey, setSize, STEPS]. The hook keeps component state in sync
 * with the persisted + applied root scale. Use anywhere a control wants to drive
 * text size; the underlying functions are the source of truth.
 */
export function useTextSize() {
  const [key, setKey] = useState(() => loadTextSize());
  const update = useCallback((next) => {
    setKey(setTextSize(next));
  }, []);
  return [key, update, TEXT_SIZE_STEPS];
}
