// @vitest-environment node
// =============================================================================
// The TLC client door — TLC Therapy Solutions' sendable, public app (2026-07-13)
// =============================================================================
// Darrell: "This [Match a Preferred Provider] needs to be the first thing we
// see... when will I be able to send a TLC Therapy Solutions App out?" This is
// the sendable client door. These tests pin, proven-to-catch:
//   1. the door context detects ONLY ?tlc=1 (never the operator ?view=tlc tab),
//   2. the entry page previews as TLC and meta-refreshes into the door,
//   3. the share aliases resolve, and
//   4. the NO-LEAK guarantee: the client door renders only public marketing
//      facts — its module graph imports NO store / auth / family / shell surface,
//      so there is nothing operator or personal to leak to a prospective client.
// HELD Tier C — this proves the artifact EXISTS; Christina's content review
// governs when it opens publicly.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { isTlcDoorContext, TLC_SHARE_URL, TLC_SHARE_ALIASES, TLC_DOOR_BRAND, TLC_INSTALL_MANIFEST } from '../lib/tlc-door.js';

const here = dirname(fileURLToPath(import.meta.url));
const pub = (rel) => join(here, '../../public/', rel);
const read = (rel) => readFileSync(pub(rel), 'utf8');

describe('the TLC door context — client door, NOT the operator tab', () => {
  it('is true ONLY for a ?tlc=1 launch', () => {
    expect(isTlcDoorContext('?tlc=1')).toBe(true);
    expect(isTlcDoorContext('?tlc=1&utm=text')).toBe(true);
    expect(isTlcDoorContext('?tlc=yes')).toBe(true);
  });
  it('is NEVER the operator TLC tab (?view=tlc) or the plain app', () => {
    expect(isTlcDoorContext('?view=tlc')).toBe(false);      // the family/business operator workspace
    expect(isTlcDoorContext('')).toBe(false);
    expect(isTlcDoorContext('?view=overview')).toBe(false);
    expect(isTlcDoorContext('?tlc=0')).toBe(false);
    expect(isTlcDoorContext('?tlc=false')).toBe(false);
    expect(isTlcDoorContext('?tlc=')).toBe(false);
  });
});

describe('the shareable entry page', () => {
  const html = read('tlc/index.html');
  it('previews as TLC in a texted link (og tags), not the platform', () => {
    expect(html).toMatch(/og:site_name"\s+content="[^"]*TLC Therapy Solutions/i);
    expect(html).toMatch(/og:url"\s+content="https:\/\/poetech\.us\/tlc\//);
  });
  it('meta-refreshes into the real client door (?tlc=1)', () => {
    expect(html).toMatch(/http-equiv="refresh"[^>]*tlc=1/);
  });
  it('carries no inline script (CSP-safe)', () => {
    expect(html).not.toMatch(/<script/i);
  });
  it('the og:url matches the TLC_SHARE_URL the app encodes (one source)', () => {
    expect(html).toContain(`content="${TLC_SHARE_URL}"`);
  });
  it('links the TLC manifest + icon so it installs as TLC (an app, not a website)', () => {
    expect(html).toContain('manifest-tlc.webmanifest');
    // Raster-parity upgrade (DR-0227): apple-touch is a real 180px PNG now.
    expect(html).toMatch(/apple-touch-icon"\s+href="\/tlc-apple-touch\.png"/);
  });
});

describe('the installable app — manifest + icon (Add to Home Screen)', () => {
  const manifest = JSON.parse(read('manifest-tlc.webmanifest'));
  it('installs under TLC\'s own name — not "PoeTech"', () => {
    expect(manifest.name).toBe('TLC Therapy Solutions');
    expect(manifest.short_name).toBe('TLC Therapy');
    expect(manifest.name).not.toMatch(/^PoeTech/);
  });
  it('opens the TLC door standalone, and stays in scope so it can actually install', () => {
    expect(manifest.start_url).toContain('tlc=1');
    expect(manifest.display).toBe('standalone');
    // scope must contain the start_url (Chrome refuses to install otherwise)
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
  });
  it('carries real TLC-branded icons (PNG rasters + SVG, any + maskable), every one on disk', () => {
    // Raster-parity upgrade (DR-0227): PNG 192/512 lead (older Android/Samsung
    // installers), SVGs kept. Every listed src must exist — no phantom icons.
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    const srcs = manifest.icons.map((i) => i.src);
    expect(srcs).toContain('/tlc-icon-192.png');
    expect(srcs).toContain('/tlc-icon-512.png');
    expect(srcs).toContain('/tlc-icon.svg');
    const purposes = new Set(manifest.icons.map((i) => i.purpose));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);
    for (const s of srcs) {
      expect(existsSync(pub(s.replace(/^\//, ''))), `${s} missing — a listed install icon won't ship`).toBe(true);
    }
    expect(existsSync(pub('tlc-apple-touch.png')), 'tlc-apple-touch.png missing').toBe(true);
  });
  it('TLC_INSTALL_MANIFEST is wired to the manifest file', () => {
    expect(TLC_INSTALL_MANIFEST).toBe('/manifest-tlc.webmanifest');
  });
  it('install identity is STATIC — the door never swaps the document manifest (DR-0261 scope split)', () => {
    // The old runtime swap collapsed every face into PoeTech's /poetech-app/
    // scope ("already installed", Darrell's 2026-08-01 screenshots). TLC's
    // manifest now lives at its own scope, linked statically by its served
    // page — a swap surviving here would break installability both ways.
    const doorJsx = readFileSync(join(here, '../components/TlcPublicDoor.jsx'), 'utf8');
    expect(doorJsx).not.toMatch(/link\[rel="manifest"\]/);
    const appHtml = readFileSync(join(here, '../../tlc/app/index.html'), 'utf8');
    expect(appHtml).toContain('href="/manifest-tlc.webmanifest"');
    expect(appHtml).not.toContain('href="/manifest.webmanifest"');
    expect(appHtml).toContain('src="/src/main.jsx"');
  });
});

describe('the share aliases resolve to the entry page', () => {
  const redirects = read('_redirects');
  it('every declared alias has a redirect rule to /tlc/', () => {
    for (const alias of TLC_SHARE_ALIASES) {
      const re = new RegExp(`^${alias.replace('/', '\\/')}\\/?\\s+\\/tlc\\/\\s+30[12]`, 'm');
      expect(redirects, `no redirect for ${alias}`).toMatch(re);
    }
  });
});

describe('the brand a client meets', () => {
  it('is TLC, sourced from the one public-facts module', () => {
    expect(TLC_DOOR_BRAND.name).toBe('TLC Therapy Solutions');
    expect(TLC_DOOR_BRAND.tagline).toMatch(/Real Solutions/);
  });
});

describe('NO-LEAK: a signed-OUT client sees only public marketing facts', () => {
  // The door now carries a STAFF LOGIN (Darrell 2026-07-14: "a menu so we can
  // login before downloading"): auth + the TLC Assistant are intentional, but
  // gated behind sign-in — a signed-out client renders ONLY ClientDoor. The real
  // leak guard is now: the door must never pull in the FAMILY / FINANCIAL store
  // or the monolith shell, and the Assistant must stay login-gated.
  const doorJsx = readFileSync(join(here, '../components/TlcPublicDoor.jsx'), 'utf8');
  const doorLib = readFileSync(join(here, '../lib/tlc-door.js'), 'utf8');
  // Family/financial/personal surfaces that must NEVER enter the TLC door.
  const FORBIDDEN_FAMILY = /from\s+['"][^'"]*(use-financial|financial-store|poe-financial-mvp|use-referral-ops)[^'"]*['"]/i;
  // The door LIB stays pure — nothing operator or auth at all.
  const FORBIDDEN_LIB = /from\s+['"][^'"]*(supabase|use-financial|financial-store|auth|instance|family|office-assistant|poe-financial-mvp)[^'"]*['"]/i;

  it('the door component imports no family / financial / shell surface', () => {
    expect(FORBIDDEN_FAMILY.test(doorJsx), 'TlcPublicDoor pulls in a family/financial surface').toBe(false);
  });
  it('the door lib imports nothing operator / auth (stays pure)', () => {
    expect(FORBIDDEN_LIB.test(doorLib), 'tlc-door.js pulls in an operator/personal surface').toBe(false);
  });
  it('the Assistant is rendered ONLY behind sign-in (signed-out clients never see it)', () => {
    // The Assistant tab is inside the `signedIn ?` branch; a signed-out client
    // gets <ClientDoor/> only.
    expect(doorJsx).toMatch(/signedIn\s*\?/);
    expect(doorJsx).toMatch(/TlcAssistant/);          // present, but gated
    expect(doorJsx).not.toMatch(/Inbound|inquir|Pre-Intake/i); // intake data never here
  });
  it('the door renders the public roster + insurance + booking', () => {
    expect(doorJsx).toMatch(/TLC_TEAM/);
    expect(doorJsx).toMatch(/TLC_INSURANCE/);
    expect(doorJsx).toMatch(/bookingUrl/);
  });
});
