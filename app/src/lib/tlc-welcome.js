// =============================================================================
// tlc-welcome — when the TLC door opens on its welcome screen (pure)
// =============================================================================
// Darrell, 2026-10-21, with DR-1171 live on his phone and the reference beside
// it: "Still does not look like this." The reference's FIRST screen is a
// welcome: the brand alone on the field, Sign In, Create Account, a way past.
// DR-1171 drew that as a card UNDER the door's header, so the phone still
// opened on the bar, the tagline, the blurb and three buttons — the old door
// with a green card in it. The welcome is now its own screen, in front of the
// door, and these rules say WHEN it stands there:
//
//   - a guest, on a fresh open of the app (per browser session, so an
//     installed app shows it each launch the way the reference does, and a
//     reload mid-visit does not);
//   - never for a signed-in person — they meet their greeting;
//   - never under a link that lands somewhere (a lesson, the jobs page, an
//     onboarding invite): the person came for that, not for a door.
//
// Pure: the door passes what it knows; storage is injectable and fail-soft.
// =============================================================================

export const TLC_WELCOME_KEY = 'tlc-door-entered';

function safeSession(store) {
  try {
    if (store) return store;
    return (typeof sessionStorage !== 'undefined' && sessionStorage) ? sessionStorage : null;
  } catch { return null; }
}

/** Has this visitor already gone past the welcome in this session? */
export function readEntered(store) {
  const s = safeSession(store);
  if (!s) return false;
  try { return s.getItem(TLC_WELCOME_KEY) === '1'; } catch { return false; }
}

/** Remember that the visitor went past the welcome (this session only). */
export function writeEntered(store) {
  const s = safeSession(store);
  if (!s) return;
  try { s.setItem(TLC_WELCOME_KEY, '1'); } catch { /* blocked storage: the welcome shows again, nothing breaks */ }
}

/**
 * Does the welcome screen stand in front of the door right now?
 * Every reason it should NOT is a real destination the person already has.
 */
export function welcomeShows({ signedIn = false, entered = false, onboardToken = '', deepLink = null, jobs = false } = {}) {
  if (signedIn) return false;
  if (entered) return false;
  if (onboardToken) return false;
  if (deepLink) return false;
  if (jobs) return false;
  return true;
}

/**
 * The door's hideaway on a PHONE starts tucked — the slim bar only, the
 * tagline, blurb, Appearance and share one tap away — so the first screen
 * reads as the reference's home and not as a control panel. On a wider
 * screen it stays open, the way the door's own tests pin it. A saved choice
 * ("it should stay however I leave it") always wins; this is only what an
 * ABSENT choice means.
 */
export function firstHeaderCollapsed(phone) { return !!phone; }
