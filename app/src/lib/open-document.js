// =============================================================================
// open-document — a tap that opens a file actually opens it (DR-1062)
// =============================================================================
// Darrell, 2026-10-16, on Choir → Team Docs, with the focus ring sitting on an
// OPEN that had done nothing: **"Can't open team documents!!!!! Fix it
// please..."**
//
// TWO INDEPENDENT FAILURES, both silent, in one line (Choir.jsx:782):
//
//     const open = async (d) => {
//       const u = await openTeamDocument(d.documentUrl);
//       if (u) window.open(u, '_blank', 'noopener');
//     };
//
//   1. THE GESTURE IS GONE BY THE TIME IT OPENS. A browser only allows
//      window.open while it is still handling the tap. `createSignedUrl` is a
//      network round trip, so by the time this runs the user activation has
//      expired and the popup is blocked — nothing opens, nothing is said, and
//      it fails this way EVERY time rather than intermittently. An installed
//      PWA is stricter about this than a browser tab, which is where he met it.
//   2. EVERY FAILURE RETURNS null AND SAYS NOTHING. openDocument returns null
//      for a missing url, an RLS refusal, a deleted object, a renamed bucket —
//      and `if (u)` then does nothing at all. Same family as DR-1053 and
//      DR-1058: a thing that could not be done, reported as silence.
//
// THE CURE WAS ALREADY IN THIS REPO, a fifth time this week:
// TlcOnboardingReadout keeps the resolved url on screen as a real link, with
// the comment "the link below still works". That is the fallback that cannot
// be blocked, because the person taps it themselves.
//
// SO THE ORDER IS: reserve the tab WHILE THE TAP IS STILL HAPPENING, resolve
// the url, then send the reserved tab there. If the browser refused the
// reservation anyway, hand the caller the url so it can show a link — never
// navigate the app away from under someone, and never fail in silence.

/**
 * Reserve a tab synchronously, inside the tap handler, BEFORE any await.
 *
 * This is the whole fix for failure 1 and it only works if it is called first.
 * Returns the handle, or null when the browser refused it (which is survivable
 * — deliverTo falls back to a visible link).
 */
export function reserveTab(win = (typeof window !== 'undefined' ? window : null)) {
  if (!win || typeof win.open !== 'function') return null;
  try {
    const tab = win.open('', '_blank');
    // Opened with a handle, so `noopener` could not be passed; sever the link
    // back to this page by hand, which is what noopener would have done.
    if (tab) { try { tab.opener = null; } catch { /* cross-origin already */ } }
    return tab || null;
  } catch { return null; }
}

/**
 * Send a reserved tab to the resolved url.
 *
 * @returns {{ok: boolean, via?: string, reason?: string, url?: string}}
 *   ok:true  — it is open.
 *   ok:false with `url` — the browser blocked the tab; SHOW THIS URL as a link
 *             the person can tap. Their tap carries its own gesture.
 *   ok:false without `url` — nothing resolved; say why (openFailureMessage).
 */
export function deliverTo(tab, url) {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) {
    // Close the empty tab rather than leaving a blank window sitting there.
    if (tab) { try { tab.close(); } catch { /* already gone */ } }
    return { ok: false, reason: 'no-url' };
  }
  if (!tab) return { ok: false, reason: 'blocked', url: u };
  try {
    if (tab.location && typeof tab.location.replace === 'function') tab.location.replace(u);
    else tab.location = u;
    return { ok: true, via: 'reserved-tab' };
  } catch {
    return { ok: false, reason: 'blocked', url: u };
  }
}

/** Pure. What to say to the person, in words, for every way this can fail. */
export function openFailureMessage(res, { what = 'this document' } = {}) {
  if (!res || res.ok) return '';
  if (res.reason === 'blocked') return `Your browser blocked the new tab. Use the link below to open ${what}.`;
  return `${what[0].toUpperCase()}${what.slice(1)} could not be opened. It may have been removed, or your account may not have access to it — nothing was changed.`;
}

/**
 * The whole dance for a tap handler that has ALREADY reserved its tab.
 *
 *   const tab = reserveTab();              // first line of the handler
 *   const res = await openResolved(tab, () => openTeamDocument(d.documentUrl));
 *
 * Kept here so three surfaces cannot drift into three different orders.
 */
export async function openResolved(tab, resolve) {
  let url;
  try { url = await resolve(); } catch { url = null; }
  return deliverTo(tab, url);
}
