// @vitest-environment node
// =============================================================================
// The Love Corner door — the church's standalone branded install (DR-0174)
// =============================================================================
// Darrell 2026-07-11: he wants "standalone Love Corner–branded install or its
// own door at thechurchofthelivinggod.com." DR-0133 planned it (phase
// install-identity); this is the artifact. Mirrors moore-door.test.js: the
// entry page, the manifest, and the share aliases are pinned so the church's
// own-named install can never silently regress, and the plan/artifact never
// drift apart. HELD Tier C — this proves the artifact EXISTS; the DR-0133 gate
// (Bishop Gwin + Governor) governs when it opens publicly.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { SHARE_DOOR_URL, SHARE_DOOR_ALIASES, INSTALL_MANIFEST, DOOR_PHASES } from '../lib/church-own-door.js';

const pub = (rel) => join(dirname(fileURLToPath(import.meta.url)), '../../public/', rel);
const read = (rel) => readFileSync(pub(rel), 'utf8');

describe('the church-branded install manifest', () => {
  const manifest = JSON.parse(read('manifest-lovecorner.webmanifest'));

  it('installs under the CHURCH\'s own name — not "PoeTech"', () => {
    expect(manifest.short_name).toBe('The Love Corner');
    expect(manifest.name).toMatch(/Church of the Living God/);
    expect(manifest.name).not.toMatch(/^PoeTech/);
  });

  it('opens the church view, and stays in scope so it can actually install', () => {
    expect(manifest.start_url).toContain('view=church');
    expect(manifest.display).toBe('standalone');
    // scope must contain the start_url (Chrome refuses to install otherwise)
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
  });

  it('carries real icons (reused platform art until COLG supplies its own)', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const i of manifest.icons) expect(i.src).toMatch(/^\/icon-/);
  });
});

describe('the shareable entry page', () => {
  const html = read('lovecorner/index.html');

  it('previews as THE CHURCH in a texted link (og tags), not the platform', () => {
    expect(html).toMatch(/og:site_name"\s+content="[^"]*Church of the Living God/i);
    expect(html).toMatch(/og:url"\s+content="https:\/\/poetech\.us\/lovecorner\//);
  });

  it('meta-refreshes into the real church door (?view=church)', () => {
    expect(html).toMatch(/http-equiv="refresh"[^>]*view=church/);
  });

  it('links the church manifest and carries no inline script (CSP-safe)', () => {
    expect(html).toContain('manifest-lovecorner.webmanifest');
    expect(html).not.toMatch(/<script/i);
  });

  it('the og:url matches the SHARE_DOOR_URL the app encodes (one source of truth)', () => {
    expect(html).toContain(`content="${SHARE_DOOR_URL}"`);
  });
});

describe('the share aliases resolve to the entry page', () => {
  const redirects = read('_redirects');
  it('every declared alias has a redirect rule to /lovecorner/', () => {
    for (const alias of SHARE_DOOR_ALIASES) {
      const re = new RegExp(`^${alias.replace('/', '\\/')}\\/?\\s+\\/lovecorner\\/\\s+30[12]`, 'm');
      expect(redirects, `no redirect for ${alias}`).toMatch(re);
    }
  });
});

describe('the plan and the artifact never drift (DR-0121)', () => {
  it('phase install-identity reflects the BUILT artifact, still Tier C gated', () => {
    const phase = DOOR_PHASES.find((p) => p.id === 'phase-install-identity');
    expect(phase).toBeTruthy();
    expect(phase.status).toBe('in-progress');       // built, not yet publicly live
    expect(phase.tier).toBe('C');
    expect(phase.gate).toMatch(/Bishop Gwin|Governor/); // the opening is gated
  });
  it('the install constants are wired', () => {
    expect(INSTALL_MANIFEST).toBe('/manifest-lovecorner.webmanifest');
    expect(SHARE_DOOR_URL).toBe('https://poetech.us/lovecorner/');
  });
});
