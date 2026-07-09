// =============================================================================
// session-handoff — fix the login loop at its seam (P0, 2026-07-07)
// =============================================================================
// Multiple users (Shay first) hit: password → PIN → password again. The gate
// logic is sound; the loop lives in the HANDOFF: the ?login=1 boot reloaded
// the page the instant sign-in succeeded, racing supabase's async write of the
// session token to localStorage — lose the race and the reloaded app boots
// signed out, showing the sign-in wall again. awaitPersistedSession() closes
// it: navigate only once the token is verifiably ON DISK (or a short timeout
// passes — no-lockout: we never trap a user on a spinner).
//
// The second seam: Instagram/Facebook/TikTok in-app browsers, which partition
// or drop site storage so NO session survives — every entry costs password +
// PIN again. isInAppBrowser() detects them so surfaces can say "open in your
// real browser" instead of silently looping people.
// Pure + injectable; pinned by tests.
// =============================================================================

// The supabase-js v2 session key looks like `sb-<project-ref>-auth-token`.
export function hasPersistedSession(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!s) return false;
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token') && s.getItem(k)) return true;
    }
    return false;
  } catch { return false; }
}

// Resolve when the session token is verifiably persisted, or after timeoutMs
// (no-lockout: a storage-blocked browser still proceeds; it just won't survive
// a reload — the isInAppBrowser affordance covers telling the user why).
export function awaitPersistedSession({ storage, timeoutMs = 3000, intervalMs = 50, setIntervalImpl, clearIntervalImpl } = {}) {
  const si = setIntervalImpl || setInterval;
  const ci = clearIntervalImpl || clearInterval;
  return new Promise((resolve) => {
    if (hasPersistedSession(storage)) { resolve(true); return; }
    const started = Date.now();
    const timer = si(() => {
      if (hasPersistedSession(storage)) { ci(timer); resolve(true); return; }
      if (Date.now() - started >= timeoutMs) { ci(timer); resolve(false); }
    }, intervalMs);
  });
}

// In-app browsers that partition/drop storage (the "signed in but never stays
// signed in" class). UA sniffing is imperfect by nature — used ONLY to show a
// helpful hint, never to block.
export function isInAppBrowser(ua) {
  const s = String(ua || (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
  return /\bInstagram\b|\bFBAN\b|\bFBAV\b|\bFB_IAB\b|\bTikTok\b|musical_ly|\bSnapchat\b|\bLine\/|\bMicroMessenger\b/i.test(s);
}

export const IN_APP_BROWSER_HINT =
  'Heads up: this in-app browser (Instagram/Facebook) does not keep you signed in. Open this page in Safari or Chrome to stay signed in.';
