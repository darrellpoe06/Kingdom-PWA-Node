// =============================================================================
// install-help — platform-aware "how to install PoeTech" steps + capture helpers
// =============================================================================
// Darrell 2026-06-16: church folks "keep trying to download this app and have
// been having issues." The #1 cause is iOS install friction — iPhone/iPad can't
// show a native install prompt; you must use Safari → Share → Add to Home Screen,
// which nobody discovers on their own. This module is the PURE core: detect the
// platform and hand back the RIGHT steps, plus validate a consented interest
// submission. UI lives in AppInterestCapture; the admin list in AppInterestAdmin.
// =============================================================================

// Detect the visitor's platform from a user-agent string (defaults to the live
// navigator). Returns 'ios' | 'android' | 'desktop' | 'other'.
export function detectPlatform(ua) {
  const s = (ua != null
    ? ua
    : (typeof navigator !== 'undefined' ? navigator.userAgent : '')) || '';
  if (/iPad|iPhone|iPod/i.test(s)) return 'ios';
  // iPadOS 13+ reports as Mac; treat a touch-capable "Mac" as iOS-style install.
  if (/Macintosh/i.test(s) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(s)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/i.test(s)) return 'desktop';
  return 'other';
}

// True if the app is already running installed (standalone). Never throws.
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  try {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
  } catch (e) {
    return false;
  }
}

// The right install instructions for a platform. `canPrompt` (Android/desktop
// Chrome caught a beforeinstallprompt) gets the one-tap path; everyone else gets
// the manual steps. Always returns { title, steps:[...] } — never empty.
export function installSteps(platform, canPrompt = false) {
  if (canPrompt) {
    return { title: 'Install in one tap', steps: ['Tap “Install on this device,” then confirm. PoeTech opens like a normal app.'] };
  }
  switch (platform) {
    case 'ios':
      return {
        title: 'On iPhone or iPad',
        steps: [
          'Open this page in Safari (not Chrome — Add to Home Screen only works in Safari on iPhone).',
          'Tap the Share button (the square with an arrow) at the bottom of the screen.',
          'Scroll down and tap “Add to Home Screen.”',
          'Tap “Add.” PoeTech now opens like a regular app.',
        ],
      };
    case 'android':
      return {
        title: 'On Android',
        steps: [
          'Open this page in Chrome.',
          'Tap the ⋮ menu (top-right).',
          'Tap “Install app” or “Add to Home screen,” then confirm.',
        ],
      };
    case 'desktop':
      return {
        title: 'On a computer',
        steps: [
          'In Chrome or Edge, look for the install icon (a small screen with a down-arrow) at the right of the address bar.',
          'Click it and choose “Install.” If you don’t see it, use the ⋮ menu → “Install PoeTech.”',
        ],
      };
    default:
      return {
        title: 'Add to your home screen',
        steps: ['Open this page in your phone’s main browser and look for “Add to Home Screen” or “Install app” in the menu.'],
      };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate a consented interest submission. Returns { ok, errors:{field:msg} }.
// Requires a name and a contactable email; phone/issue optional. A flagged minor
// must have the parent-confirm box checked before we accept it.
export function validateInterest(form = {}) {
  const errors = {};
  const name = (form.name || '').trim();
  const email = (form.email || '').trim();
  if (!name) errors.name = 'Please add a name so we know who to help.';
  if (!email) errors.email = 'We need an email to send your invite.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That email doesn’t look right.';
  if (form.isMinor && !form.parentConfirmed) {
    errors.parentConfirmed = 'For anyone under 18, a parent or guardian needs to confirm.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
