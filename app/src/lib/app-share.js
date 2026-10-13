// =============================================================================
// app-share — the canonical "get the PoeTech app" link, single-sourced
// =============================================================================
// Darrell needs to SHOW people how to reach the app — over text, and now on a
// QR code someone can scan in person (COMMUNITY-FIRST: the elderly, tech-novice
// COLG congregation is the named first community; a scannable code removes the
// "type this long URL" friction that install-help already fights on iOS).
//
// This is the ONE place the public join URL lives. It was hardcoded in two
// spots in AppInterestAdmin; both now import from here so the address can never
// drift between the QR, the copy-link button, and the invite email.
//
// The QR must always encode the PUBLIC production address — the church member
// scans it from THEIR phone, so a preview/localhost/LAN origin would be useless.
// That is why this is a fixed canonical constant, not window.location.origin.

// Production front door (Vercel). The manifest scope is /poetech-app/, so the
// install target lives under that path. ?join=1 boots the platform-aware
// "get the app / I'm having trouble" capture (see main.jsx + AppInterestCapture).
export const CANONICAL_APP_ORIGIN = 'https://poetech.us';
export const APP_BASE_PATH = '/poetech-app/';

// The URL a phone opens when it scans the code or taps the shared link.
export function appJoinUrl() {
  return `${CANONICAL_APP_ORIGIN}${APP_BASE_PATH}?join=1`;
}

// The bare address for display next to the QR (no scheme — easier to read/say
// aloud, matches how AppInterestAdmin already prints it).
export function appJoinUrlDisplay() {
  return `${CANONICAL_APP_ORIGIN.replace(/^https?:\/\//, '')}${APP_BASE_PATH}?join=1`;
}

// A ready-to-send invite body — the same warmth AppInterestAdmin sends by
// mailto/sms, single-sourced here so name + link stay consistent everywhere.
export function inviteMessage(name) {
  const greeting = name && name.trim() ? name.trim() : 'there';
  return `Hi ${greeting},\n\n`
    + `Thanks for your interest in PoeTech! Here's how to get the app on your device:\n\n`
    + `${appJoinUrl()}\n\n`
    + `If you hit any trouble, just reply and we'll help you get set up.\n\n`
    + `— Darrell & Christina, PoeTech`;
}
