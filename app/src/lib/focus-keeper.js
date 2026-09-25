// =============================================================================
// focus-keeper — focus is never dropped to the page when a control changes shape
// =============================================================================
// Darrell reads on a Fire TV with a D-pad (DR-0657). Measured on a
// Fire-TV-shaped Chromium: pressing "Read this lesson" folds the reader's
// panel into its small bar, the button that held focus is unmounted, and focus
// falls to <body>. The next D-pad press then adopts the FIRST control on the
// page, the Give button at the top-left, and the reader is a long walk away
// again. A keyboard user can Tab back; a remote user has no Tab.
//
// This watches one region. When the focused control inside it disappears and
// focus has fallen to nothing, focus is put on the region's most useful
// control instead (the caller names it). A focus that moved somewhere real is
// left alone.
// =============================================================================
import { useEffect } from 'react';

/**
 * Pure: should focus be restored? `lost` is the last focused element inside
 * the region; `active` is document.activeElement now.
 */
export function focusWasDropped(lost, active, body) {
  if (!lost) return false;
  if (lost.isConnected) return false;
  return !active || active === body;
}

/**
 * Keep focus inside `ref` when the control holding it is unmounted.
 * `pick(root)` returns the element to focus, or null. `mounted` re-arms the
 * watch when the region itself appears later.
 */
export function useKeepFocusIn(ref, pick, mounted = true) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof MutationObserver === 'undefined') return undefined;
    const doc = root.ownerDocument;
    let lost = null;
    const onIn = (e) => { lost = e.target; };
    // Focus that LEFT the region on purpose is not the region's to restore.
    const onOut = (e) => { if (e.relatedTarget && !root.contains(e.relatedTarget)) lost = null; };
    root.addEventListener('focusin', onIn);
    root.addEventListener('focusout', onOut);
    const mo = new MutationObserver(() => {
      if (!focusWasDropped(lost, doc.activeElement, doc.body)) return;
      const el = pick(root);
      lost = null;
      if (el && typeof el.focus === 'function') {
        try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
      }
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => { root.removeEventListener('focusin', onIn); root.removeEventListener('focusout', onOut); mo.disconnect(); };
  }, [ref, pick, mounted]);
}

/** The reader's most useful control, in the shape it has now. */
export function pickReaderFocus(root) {
  if (!root || !root.querySelector) return null;
  return root.querySelector('[data-testid="reader-mini-playpause"]')
    || root.querySelector('button[aria-label="Expand reading controls"]')
    || root.querySelector('[data-testid="float-playpause"]')
    || root.querySelector('button[aria-label*="read-aloud controls"]')
    || root.querySelector('button');
}
