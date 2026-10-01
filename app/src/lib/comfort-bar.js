// =============================================================================
// comfort-bar — the big-text bottom block folds to one slim row (DR-0716)
// =============================================================================
// Darrell 2026-10-01, a screenshot of L202 at A44 on his Fold 7: "How do I get
// rid of the below header?!!!!! I need a button!!!!" At Largest and Big Print
// the header's controls row (account, Give, Subscribe, help, text size, voice,
// the theme swatches, the build line) becomes a fixed bar at the bottom of the
// screen (index.css .ts-escape-hatch, DR-0276: big text is always reversible).
// On his Fold it took about a fifth of the screen under the lesson.
//
// One choice, per device: open (the whole block) or collapsed (one slim row
// with "Show controls" and the text-size dropdown, so big text stays
// reversible). It is published as <html data-comfort-bar="collapsed|open">;
// index.css does the folding, so nothing in the block unmounts and everything
// it offers is one tap away. Remembered, so a reader who folded it once opens
// every lesson folded.
// =============================================================================
import { useEffect, useSyncExternalStore } from 'react';

export const COMFORT_BAR_KEY = 'poe-comfort-bar-collapsed';

function read() {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(COMFORT_BAR_KEY) === '1'; } catch (_) { return false; }
}

let collapsed = read();
// IN THE LESSON READER IT STARTS FOLDED (Darrell 2026-10-01, the Fold folded,
// L202 at A+++: "Bottom tab is too much!!!!! We needed less room undermining
// the reader...."). While a lesson's own space is open (<html
// data-lesson-space="open">, ChurchLearn) the block is folded from the first
// visit; "Controls" in the bottom bar opens it for as long as wanted and folds
// it again. Outside the reader the stored per-device choice holds.
let inReader = false;
let readerOpen = false;
const subs = new Set();

function effective() { return inReader ? !readerOpen : collapsed; }

function publish() {
  try {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-comfort-bar', effective() ? 'collapsed' : 'open');
  } catch (_) { /* no document */ }
}

function notify() { subs.forEach((f) => { try { f(); } catch (_) { /* one listener */ } }); }

export function isComfortCollapsed() { return effective(); }

/** True while a lesson's own space is open (the reader). */
export function isInReader() { return inReader; }

export function setComfortCollapsed(next) {
  if (inReader) {
    readerOpen = !next;
  } else {
    collapsed = !!next;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COMFORT_BAR_KEY, collapsed ? '1' : '0'); } catch (_) { /* private mode */ }
  }
  publish();
  notify();
}

/** The reader opened or closed (ChurchLearn's data-lesson-space). */
export function setInReader(next) {
  const v = !!next;
  if (v === inReader) return;
  inReader = v;
  readerOpen = false; // every lesson opens folded
  publish();
  notify();
}

/** Re-read the stored choice (a fresh page load; tests). */
export function reloadComfortCollapsed() {
  collapsed = read();
  readerOpen = false;
  publish();
  notify();
}

const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

/** React hook: [collapsed, setCollapsed]. Publishes the <html> attribute. */
export function useComfortCollapsed() {
  const value = useSyncExternalStore(subscribe, isComfortCollapsed, () => false);
  useEffect(() => { publish(); }, [value]);
  return [value, setComfortCollapsed];
}

/** React hook: true while the lesson reader is open. */
export function useInReader() {
  return useSyncExternalStore(subscribe, isInReader, () => false);
}

// Follow the reader's own attribute, so no surface has to call in.
function watchReader() {
  try {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    const root = document.documentElement;
    const sync = () => setInReader(root.getAttribute('data-lesson-space') === 'open');
    sync();
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-lesson-space'] });
  } catch (_) { /* no DOM */ }
}

// Publish the stored choice as soon as the module loads, so a folded block
// does not flash open before React mounts.
publish();
watchReader();
