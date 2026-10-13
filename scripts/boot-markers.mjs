// =============================================================================
// What a booted page looks like (DR-0964)
// =============================================================================
// The pure core of boot-check: which strings mean "this app mounted", and how
// a page's text is compared against them. No browser, no playwright, so the
// decision can be tested without one — the same pure-core / thin-shell split
// `push-stranding-guard.mjs` uses for the same reason.
//
// WHY THIS FILE EXISTS AT ALL. On 2026-10-11 the deploy went red on two
// consecutive merges with "app did not mount within 30s" while the served
// body was the front door rendering perfectly. `MOUNT_MARKERS` named
// 'Create your profile' — the heading of the PIN form Darrell photographed
// that morning and told us to remove ("Why are you asking new users to create
// an account before seeing the listings?!!!!!!!!!!!!"). DR-0958 removed it and
// the witness still looked for it. The witness was pinned to the defect, and
// deleting the defect is what turned the deploy red.
//
// These twelve lines were buried in a file nothing could import. Now they are
// a module with a test, which is the actual fix: the rule and its proof live
// where both can be read.

// A healthy front door renders ONE of these. EVERY ENTRY NAMES ITS SCREEN,
// because the root cause was a marker outliving the screen it was written for
// with nothing recording what it had been for.
export const MOUNT_MARKERS = [
  'PROJECTIONS, NOT PROMISES',       // the disclaimer bar: signed-in and welcome
  'SIGNED IN AS',                    // a signed-in session
  'Create your profile',             // the PIN wall — still reachable behind Sign in
  'Poe Properties — places to live', // the public front door (DR-0958)
];

// Recovery-screen headlines = the app did NOT boot.
export const FAIL_MARKERS = ['Almost there — one more tap', 'Getting the latest version'];

/**
 * MATCHED CASE-INSENSITIVELY, and that is not tidiness.
 *
 * boot-check reads `document.body.innerText`, which Chrome returns with CSS
 * `text-transform` ALREADY APPLIED. The front door's heading carries
 * `uppercase`, so the browser hands back "POE PROPERTIES — PLACES TO LIVE" and
 * a literal `includes()` of the source string misses it — which is exactly
 * what the failing run's own log printed, in capitals.
 *
 * Writing the marker in capitals instead would have worked until somebody
 * dropped the class. Folding the comparison means a styling change can never
 * blind the witness again.
 */
export const hasMarker = (text, markers) => {
  const hay = String(text || '').toLowerCase();
  return markers.some((m) => hay.includes(String(m).toLowerCase()));
};
