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
const subs = new Set();

function publish() {
  try {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-comfort-bar', collapsed ? 'collapsed' : 'open');
  } catch (_) { /* no document */ }
}

export function isComfortCollapsed() { return collapsed; }

export function setComfortCollapsed(next) {
  collapsed = !!next;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(COMFORT_BAR_KEY, collapsed ? '1' : '0'); } catch (_) { /* private mode */ }
  publish();
  subs.forEach((f) => { try { f(); } catch (_) { /* one listener */ } });
}

/** Re-read the stored choice (a fresh page load; tests). */
export function reloadComfortCollapsed() {
  collapsed = read();
  publish();
  subs.forEach((f) => { try { f(); } catch (_) { /* one listener */ } });
}

const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

/** React hook: [collapsed, setCollapsed]. Publishes the <html> attribute. */
export function useComfortCollapsed() {
  const value = useSyncExternalStore(subscribe, isComfortCollapsed, () => false);
  useEffect(() => { publish(); }, [value]);
  return [value, setComfortCollapsed];
}

// Publish the stored choice as soon as the module loads, so a folded block
// does not flash open before React mounts.
publish();
