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
    expect(html).toMatch(/apple-touch-icon"\s+href="\/tlc-icon\.svg"/);
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
  it('carries a real TLC-branded icon (any + maskable) that exists on disk', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const i of manifest.icons) expect(i.src).toBe('/tlc-icon.svg');
    const purposes = new Set(manifest.icons.map((i) => i.purpose));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);
    expect(existsSync(pub('tlc-icon.svg')), 'tlc-icon.svg missing — the install icon won\'t ship').toBe(true);
  });
  it('TLC_INSTALL_MANIFEST is wired to the manifest file', () => {
    expect(TLC_INSTALL_MANIFEST).toBe('/manifest-tlc.webmanifest');
  });
  it('the running door SWAPS the document manifest so in-app install carries TLC (source-pinned)', () => {
    const doorJsx = readFileSync(join(here, '../components/TlcPublicDoor.jsx'), 'utf8');
    expect(doorJsx).toMatch(/link\[rel="manifest"\]/);
    expect(doorJsx).toMatch(/TLC_INSTALL_MANIFEST/);
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

describe('NO-LEAK: the client door renders only public marketing facts', () => {
  // The entire module graph the door pulls in must not touch anything operator
  // or personal. We statically scan the door component + its lib for imports of
  // the store, auth, supabase, or the family shell. A prospective client opens
  // this with no account; there must be NOTHING here to leak.
  const doorJsx = readFileSync(join(here, '../components/TlcPublicDoor.jsx'), 'utf8');
  const doorLib = readFileSync(join(here, '../lib/tlc-door.js'), 'utf8');
  const FORBIDDEN = /from\s+['"][^'"]*(supabase|use-financial|financial-store|auth|instance|family|use-referral-ops|office-assistant|poe-financial-mvp)[^'"]*['"]/i;

  it('the door component imports no store / auth / family / shell surface', () => {
    expect(FORBIDDEN.test(doorJsx), 'TlcPublicDoor pulls in an operator/personal surface').toBe(false);
  });
  it('the door lib imports no store / auth / family / shell surface', () => {
    expect(FORBIDDEN.test(doorLib), 'tlc-door.js pulls in an operator/personal surface').toBe(false);
  });
  it('the door renders the public roster + insurance + booking, and nothing operator', () => {
    // Renders the public facts...
    expect(doorJsx).toMatch(/TLC_TEAM/);
    expect(doorJsx).toMatch(/TLC_INSURANCE/);
    expect(doorJsx).toMatch(/bookingUrl/);
    // ...and never the operator surfaces (Inbound intake, the Assistant, inquiries).
    expect(doorJsx).not.toMatch(/Inbound|TlcAssistant|inquir|Pre-Intake/i);
  });
});
