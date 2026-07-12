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
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { SHARE_DOOR_URL, SHARE_DOOR_ALIASES, INSTALL_MANIFEST, DOOR_PHASES, LOVE_CORNER_BRAND, isChurchDoorContext } from '../lib/church-own-door.js';

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

  it('carries the CHURCH\'s OWN logo icons (not the platform placeholder)', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const i of manifest.icons) expect(i.src).toMatch(/^\/lovecorner-icon-/);
    // both any + maskable purposes present so Android's adaptive mask is clean
    const purposes = new Set(manifest.icons.map((i) => i.purpose));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);
  });

  it('the church logo icon files actually exist in public/', () => {
    for (const rel of ['lovecorner-icon-192.png', 'lovecorner-icon-512.png',
      'lovecorner-icon-maskable-192.png', 'lovecorner-icon-maskable-512.png']) {
      expect(existsSync(pub(rel)), `${rel} missing — the church icon won't ship`).toBe(true);
    }
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
  it('phase install-identity is approved and shipping (the church cleared it 2026-07-11)', () => {
    const phase = DOOR_PHASES.find((p) => p.id === 'phase-install-identity');
    expect(phase).toBeTruthy();
    expect(phase.status).toBe('verified');          // approved by Darrell (COLG Dir. of Tech) + Bishop Gwin
    expect(phase.tier).toBe('C');
    expect(phase.evidence).toMatch(/Darrell|Bishop Gwin/); // 'verified' needs evidence (DR-0076)
    expect(phase.gate).toMatch(/CLEARED|approved/i);        // the gate is satisfied, not pending
  });
  it('the install constants are wired', () => {
    expect(INSTALL_MANIFEST).toBe('/manifest-lovecorner.webmanifest');
    expect(SHARE_DOOR_URL).toBe('https://poetech.us/lovecorner/');
  });
});

describe('the focused church app — church-door context (DR-0174)', () => {
  it('the church brand is the church, not PoeTech', () => {
    expect(LOVE_CORNER_BRAND.name).toBe('The Love Corner');
    expect(LOVE_CORNER_BRAND.eyebrow).toMatch(/Church of the Living God/);
    expect(LOVE_CORNER_BRAND.logo).toMatch(/^\/lovecorner-icon-/);
  });

  it('isChurchDoorContext is true ONLY for a ?view=church launch', () => {
    expect(isChurchDoorContext('?view=church')).toBe(true);
    expect(isChurchDoorContext('?view=church&sub=home')).toBe(true);
    // NOT the church door: PoeTech default, or any other view
    expect(isChurchDoorContext('')).toBe(false);
    expect(isChurchDoorContext('?view=overview')).toBe(false);
    expect(isChurchDoorContext('?moore=1')).toBe(false);
    expect(isChurchDoorContext('?join=1')).toBe(false);
  });
});

describe('the Sanctuary LED wall holding graphic (DR-0178)', () => {
  it('the church\'s "Get Up!" graphic file exists in public/', () => {
    expect(existsSync(pub('lovecorner/wall/get-up.png')), 'the wall holding graphic is missing — the wall page would 404').toBe(true);
  });

  it('the fullscreen wall page shows that graphic on black, no chrome, no inline script (CSP-safe)', () => {
    const html = read('lovecorner/wall/index.html');
    expect(html).toMatch(/src="\/lovecorner\/wall\/get-up\.png"/);   // points at the real asset
    expect(html).toMatch(/object-fit:\s*contain/);                  // letterboxed — never crops the emblem/text
    expect(html).toMatch(/background:\s*#000/i);                    // pure black field for the wall feed
    expect(html).not.toMatch(/<script/i);                          // CSP: script-src 'self'
  });
});

describe('the ?share=church projector boot (DR-0177) — source-pinned', () => {
  const mainPath = join(dirname(fileURLToPath(import.meta.url)), '../main.jsx');
  const main = readFileSync(mainPath, 'utf8').replace(/\/\/.*$/gm, ''); // strip line comments

  it('routes ?share=church to the SharePoster church poster', () => {
    expect(main).toMatch(/share'?\)\s*===\s*'church'/);
    expect(main).toMatch(/brandLine=["'][^"']*Love Corner/);
  });

  it('opts OUT of the service-worker update-reload (a mid-service deploy must NOT reload the projected screen)', () => {
    // The __standalone list gates SW registration + update reloads; the church
    // projector must be in it, exactly like ?share=1 / ?audience / ?teach.
    const standaloneBlock = main.slice(main.indexOf('__standalone ='), main.indexOf('__root ='));
    expect(standaloneBlock).toMatch(/get\('share'\)\s*===\s*'church'/);
  });
});
