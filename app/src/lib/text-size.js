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
// DR-0078). Small fixed-px chrome labels (badges, uppercase tracking) intentionally
// stay put so layout does not break; the reading-critical body text scales.
//
// Persistence is PER DEVICE in localStorage (process-don't-store default), kept
// separate from the cloud-synced theme so a member sets it ONCE on their own
// phone — and it applies even before sign-in, on the public conference page.
//
// Pure functions are exported and unit-tested; the React hook is thin glue.
import { useCallback, useState } from 'react';

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
 */
export function applyTextSize(key, doc = (typeof document !== 'undefined' ? document : undefined)) {
  const step = stepFor(key);
  const root = doc && doc.documentElement;
  if (root) {
    root.style.fontSize = `${step.mult * 100}%`;
    root.setAttribute('data-text-size', step.key);
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

/** Set + persist + apply in one call. Returns the validated key actually used. */
export function setTextSize(key) {
  const k = isValidTextSize(key) ? key : DEFAULT_TEXT_SIZE;
  applyTextSize(k);
  saveTextSize(k);
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
