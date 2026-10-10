// =============================================================================
// use-address — the browser half of a Poe Properties address
// =============================================================================
// addressing.js is pure: it maps an address to a query string and back. This
// is the ONE place that touches window.history, kept apart so the mapping can
// be proven for all 21 surfaces without a browser and so there is a single
// answer to "who writes the URL?".
//
// WHAT IT BUYS, beyond the deep link the feedback report needs (DR-0901):
//
//   * A RELOAD KEEPS YOUR PLACE. Before this, every reload threw the person
//     back to the landing tab and dropped the door they had selected -- on a
//     PWA on a phone, where the tab is reloaded whenever the OS reclaims it,
//     that is a surface that forgets what you were doing every time you take
//     a call.
//   * BACK STEPS A TAB instead of leaving the app. Poe Properties pushed no
//     history, so the browser's back gesture -- and the Fire TV remote's back
//     button, which is the only navigation a remote has -- exited the module
//     entirely from any tab. A person on Guest ready pressing back lost the
//     app, not the tab.
//
// WHY pushState AND NOT replaceState for a tab. Pressing back is how a person
// says "I meant the thing before this", and on a remote it is the ONLY way to
// say it. replaceState would keep the address shareable while leaving the back
// button exiting the app, which is the broken half. The door and the sub-area
// REPLACE rather than push, because picking a door inside a tab is refining
// one view, not travelling, and pushing it would make back feel like it does
// nothing (you would step through five doors before leaving the tab).
//
// EVERY CALL IS GUARDED. This runs inside a PWA, inside an iframe on at least
// one surface, and on a Fire TV browser; history.pushState throws on a
// cross-origin or opaque-origin document, and the whole module failing to
// render because a URL could not be written would be far worse than an
// address that does not update. So nothing here can throw, and the app is
// fully usable with every one of these calls silently failing.
// =============================================================================
import { useEffect, useRef } from 'react';
import { addressFromSearch, searchWithAddress } from './addressing.js';

/** The address the page was opened at. Safe anywhere, including no-DOM. */
export function addressNow(win = typeof window === 'undefined' ? null : window) {
  try {
    return addressFromSearch(win && win.location ? win.location.search : '');
  } catch {
    return { tab: null, door: null, area: null };
  }
}

/**
 * Put an address into the URL bar. `mode` is 'push' (a new place, back
 * returns here) or 'replace' (the same place, refined).
 * Returns true when the URL actually changed, so a caller can tell.
 */
export function writeAddress(address, { mode = 'replace', win = typeof window === 'undefined' ? null : window } = {}) {
  try {
    if (!win || !win.history || !win.location) return false;
    const next = searchWithAddress(win.location.search, address);
    if (next === win.location.search) return false;
    const url = `${win.location.pathname}${next}${win.location.hash || ''}`;
    if (mode === 'push') win.history.pushState(null, '', url);
    else win.history.replaceState(null, '', url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Keep the URL and the module's state in step.
 *
 *   address  — the address the app is currently showing
 *   onBack   — called with the address the URL moved to, when the person uses
 *              the browser's or the remote's back/forward gesture
 *
 * The FIRST render never writes. A person arriving on a plain `?properties=1`
 * link has not navigated anywhere yet, and writing the landing tab into their
 * URL would mean their very first back press goes to the same page they are
 * already on -- a back button that appears not to work, which reads as a
 * broken app rather than as a tidy URL.
 */
// Destructured in the parameter list on purpose: the effect below then depends
// on three PRIMITIVES rather than on an object's identity, so a caller that
// builds the address inline cannot cause a write on every render.
export function useAddress({ tab = null, door = null, area = null } = {}, onBack) {
  const last = useRef(null);
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const key = `${tab || ''}|${door || ''}|${area || ''}`;
    if (last.current === null) { last.current = key; return; }
    if (last.current === key) return;
    const prev = last.current.split('|');
    last.current = key;
    // A tab change is travel; a door or area change inside the same tab is
    // refinement. See the note above on why that distinction is load-bearing.
    writeAddress({ tab, door, area }, { mode: prev[0] !== (tab || '') ? 'push' : 'replace' });
  }, [tab, door, area]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return undefined;
    const onPop = () => {
      const at = addressNow();
      // Keep our own record in step BEFORE telling the caller, or the state
      // change the caller makes would be read as a fresh navigation and
      // pushed right back onto the history stack -- a back press that
      // bounces forward again.
      last.current = `${at.tab || ''}|${at.door || ''}|${at.area || ''}`;
      if (backRef.current) backRef.current(at);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
