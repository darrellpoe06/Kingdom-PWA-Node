// =============================================================================
// tlc-door — TLC Therapy Solutions' own sendable client app (the front door)
// =============================================================================
// Darrell 2026-07-13: "This [Match a Preferred Provider] needs to be the first
// thing we see... when will I be able to send a TLC Therapy Solutions App out?"
//
// This is the CLIENT door — the focused, sendable TLC app a prospective client
// meets when they open a texted link / QR / installed icon. It is NOT the
// operator TLC workspace (Practice / Intake / Assistant, family/business gated).
// The door boots straight into "Find your therapist" (the provider match +
// services + insurance + Book), and NOTHING operator or family is reachable
// from it — no nav, no books, no dashboards, no PHI.
//
// Mirrors the church door (church-own-door.js / DR-0174): a static entry page
// under public/tlc/ previews as TLC in a texted link, then meta-refreshes into
// the door context. The distinct `?tlc=1` marker (NOT `?view=tlc`, which is the
// operator tab) is what tells the shell to present the client door instead of
// the full PoeTech app.
//
// PRIVACY (the TLC bright line): the door renders ONLY tlc-practice.js — public
// marketing facts already on tlctherapysolutions.me (names, roles, specialties,
// insurance, headshots). No clients, no PHI, nothing clinical, nothing family.
// PURE (no React, no network); TlcPublicDoor.jsx renders it.
// =============================================================================
import { TLC_BRAND } from './tlc-practice.js';
import { setThemeScope, TLC_DEFAULT_THEME } from './theme-css.js';

// The door's shareable front-door on poetech.us: the static entry page
// (public/tlc/index.html) that previews as TLC in a texted link, then meta-
// refreshes into ?tlc=1. Every share surface (QR, texted link) encodes THIS
// url. Mirrors the church's SHARE_DOOR_URL.
// The install manifest that makes "Add to Home Screen" install "TLC Therapy",
// its own icon, opening standalone (no browser chrome) — an app, not a website.
export const TLC_INSTALL_MANIFEST = '/manifest-tlc.webmanifest';
export const TLC_SHARE_URL = 'https://poetech.us/tlc/';
// Canonical is /tlc/ (the entry-page directory, served automatically); these are
// alternate spellings that redirect to it. Each has a rule in public/_redirects.
export const TLC_SHARE_ALIASES = ['/tlctherapy', '/tlctherapysolutions'];

// The brand used to SKIN the client door (the header/entry a client meets). Its
// public facts come from the one source (tlc-practice.js), never restated here.
export const TLC_DOOR_BRAND = {
  name: TLC_BRAND.name,
  tagline: TLC_BRAND.tagline,
  blurb: TLC_BRAND.blurb,
};

// Is this load in TLC's CLIENT-door context? True only for the distinct door
// marker (`?tlc=1`), so a family/business operator tapping the in-app TLC tab
// (which sets `?view=tlc`) is NEVER scoped to the client door. Pure; the search
// string is injectable for tests. Accepts `?tlc=1` (any truthy, non-"0" value).
export function isTlcDoorContext(search) {
  const s = typeof search === 'string' ? search
    : (typeof window !== 'undefined' && window.location ? window.location.search : '');
  try {
    const v = new URLSearchParams(s).get('tlc');
    return v !== null && v !== '' && v !== '0' && v !== 'false';
  } catch {
    return false;
  }
}

// THE DOOR ENTERS ITS OWN PALETTE (DR-1170). The shell asks this once at boot,
// in place of isTlcDoorContext: the same answer, and when it is yes the theme
// store is scoped to the door BEFORE the shell's first read of the preference,
// so the door opens in TLC's ivory & forest on every device -- including one
// that chose a palette in the family app long ago -- and a choice made inside
// the door is the door's alone. Pure apart from that one scope write.
export function enterTlcDoorContext(search) {
  const on = isTlcDoorContext(search);
  if (on) setThemeScope('tlc', TLC_DEFAULT_THEME);
  return on;
}
