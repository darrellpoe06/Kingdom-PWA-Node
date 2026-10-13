// =============================================================================
// tv-device — is this page on a television?
// =============================================================================
// Darrell 2026-09-25: "Will this work with the Firestick still?" and "All new
// features too?" (DR-0657). The app already had a TV ring in index.css, keyed
// to `(min-width: 1600px)`: "any viewport this wide is a television". A Fire
// TV is not that wide. Amazon's Fire TV web-app FAQ gives its app display as
// 960x540, scaled up to the set. So the TV ring never switched on for the one
// TV this app is actually read on, and neither did anything else keyed to width.
//
// A television is known by what it says it is. Amazon's own guidance for
// Fire TV is to read the user agent: every Fire TV model carries an `AFT…`
// model code. The other sets name themselves too. This answers once, at boot,
// and marks the document so CSS and the remote's navigation can ask the same
// question the same way.
// =============================================================================

const TV_UA = [
  /\bAFT[A-Z0-9]{1,8}\b/,          // Amazon Fire TV model codes (AFTKA, AFTMM, AFTSSS...)
  /\bAndroid TV\b/i,
  /\bGoogleTV\b|\bGoogle TV\b/i,
  /\bSMART-TV\b|\bSmartTV\b/i,
  /\bTizen\b.*\bTV\b|\bTV\b.*\bTizen\b/i,
  /\bWeb0S\b|\bwebOS\b.*\bTV\b/i,
  /\bBRAVIA\b/i,
  /\bCrKey\b/,
  /\bRoku\b/i,
  /\bAppleTV\b/i,
];

/** Does this user agent name a television or a streaming stick? Pure. */
export function isTvUserAgent(ua) {
  const s = String(ua || '');
  return TV_UA.some((re) => re.test(s));
}

/**
 * Mark the document as a TV (`<html data-device="tv">`) when the user agent
 * says so. Returns true when marked. Never throws.
 */
export function markTvDevice(doc = typeof document === 'undefined' ? null : document,
  nav = typeof navigator === 'undefined' ? null : navigator) {
  try {
    if (!doc || !doc.documentElement || !nav) return false;
    if (!isTvUserAgent(nav.userAgent)) return false;
    doc.documentElement.setAttribute('data-device', 'tv');
    return true;
  } catch (_) { return false; }
}

/** Is this document marked as a TV? */
export function isTvDocument(doc = typeof document === 'undefined' ? null : document) {
  try { return !!(doc && doc.documentElement && doc.documentElement.getAttribute('data-device') === 'tv'); } catch (_) { return false; }
}
