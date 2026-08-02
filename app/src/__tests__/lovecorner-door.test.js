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

  // THE GATE FOR THE CLASS (DR-0258, proven-to-catch): two installable PWAs on
  // one origin MUST have disjoint scopes. When Love Corner shared PoeTech's
  // /poetech-app/ scope, Chrome collapsed them into one app — installing either
  // made the other's install sheet say "This app is already installed"
  // (Darrell's 2026-07-31 screenshots; the 2026-07-30 "can't download PoeTech"
  // report). This test fails on any regression where one scope contains the
  // other, so the collision class can never silently return.
  it('EVERY installable face has a DISJOINT scope — no manifest scope contains another (DR-0258/DR-0261)', () => {
    // Extended 2026-08-01 after the on-device proof: Moore and TLC hit the same
    // "already installed" wall the church did (Darrell's screenshots), so the
    // gate now sweeps ALL FOUR faces pairwise. Any new installable manifest
    // added to public/ joins this list or the collision class returns.
    const faces = ['manifest.webmanifest', 'manifest-lovecorner.webmanifest',
      'manifest-moore.webmanifest', 'manifest-tlc.webmanifest']
      .map((f) => ({ f, m: JSON.parse(read(f)) }));
    for (const { f, m } of faces) {
      expect(m.id.startsWith(m.scope), `${f}: id must live inside its own scope`).toBe(true);
      expect(m.start_url.startsWith(m.scope), `${f}: start_url must live inside its own scope`).toBe(true);
    }
    for (const a of faces) {
      for (const b of faces) {
        if (a.f === b.f) continue;
        expect(a.m.scope.startsWith(b.m.scope), `${a.f} scope ${a.m.scope} is inside ${b.f} scope ${b.m.scope} — Chrome will collapse them into one app`).toBe(false);
      }
    }
  });
});

describe('the church app PAGE — static install identity under the church scope (DR-0258)', () => {
  const appHtmlPath = join(dirname(fileURLToPath(import.meta.url)), '../../lovecorner/app/index.html');

  it('the served church app page exists as a real Vite build input', () => {
    expect(existsSync(appHtmlPath), 'app/lovecorner/app/index.html missing — the church scope has no page to install from').toBe(true);
  });

  it('it links the church manifest STATICALLY and boots the same app entry', () => {
    const html = readFileSync(appHtmlPath, 'utf8');
    expect(html).toContain('href="/manifest-lovecorner.webmanifest"');
    expect(html).not.toContain('href="/manifest.webmanifest"');
    expect(html).toContain('src="/src/main.jsx"');
    // the boot watchdog rides along, same as the PoeTech page (LESSONS P32)
    expect(html).toContain('/poetech-app/watchdog.js');
  });

  it('the vite config actually builds it (an unbuilt input would 404 the whole scope)', () => {
    const cfg = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../vite.config.js'), 'utf8');
    expect(cfg).toMatch(/lovecorner\/app\/index\.html/);
  });

  it('the manifest start_url resolves to this page\'s directory (install opens the page that exists)', () => {
    const manifest = JSON.parse(read('manifest-lovecorner.webmanifest'));
    expect(manifest.start_url.startsWith('/lovecorner/app/')).toBe(true);
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

  it('isChurchDoorContext is true ONLY for a real church-door LAUNCH — never a bare in-app Church URL', () => {
    // The door's own param (the moore=1/tlc=1 convention) — the entry page and
    // the manifest start_url both carry it.
    expect(isChurchDoorContext('?view=church&lovecorner=1')).toBe(true);
    expect(isChurchDoorContext('?view=church&lovecorner=1&sub=home')).toBe(true);
    // Legacy installed Love Corner app: pre-param start_url, standalone display.
    expect(isChurchDoorContext('?view=church', { standalone: true })).toBe(true);
    expect(isChurchDoorContext('?view=church&sub=learn', { standalone: true })).toBe(true);
    // THE 2026-07-30 REGRESSION: a family member on the Church tab inside full
    // PoeTech (nav-history writes ?view=church) reloads in a BROWSER TAB — that
    // must stay PoeTech, never flip to the Love Corner app.
    expect(isChurchDoorContext('?view=church', { standalone: false })).toBe(false);
    expect(isChurchDoorContext('?view=church&sub=learn', { standalone: false })).toBe(false);
    // NOT the church door: PoeTech default, or any other view/door
    expect(isChurchDoorContext('', { standalone: false })).toBe(false);
    expect(isChurchDoorContext('?view=overview', { standalone: false })).toBe(false);
    expect(isChurchDoorContext('?moore=1', { standalone: false })).toBe(false);
    expect(isChurchDoorContext('?join=1', { standalone: false })).toBe(false);
  });

  it('the entry page and the manifest both launch WITH the door param (the signal actually ships)', () => {
    expect(read('lovecorner/index.html')).toMatch(/http-equiv="refresh"[^>]*view=church&lovecorner=1/);
    const manifest = JSON.parse(read('manifest-lovecorner.webmanifest'));
    expect(manifest.start_url).toContain('lovecorner=1');
    // DR-0258: the install identity moved to the church's OWN disjoint scope.
    // The old id (/poetech-app/?view=church) shared PoeTech's scope, and Chrome
    // treats overlapping-scope PWAs as ONE app — with either installed, the
    // other's install sheet said "already installed" (2026-07-31 screenshots).
    // Existing legacy installs keep their frozen old identity and keep working;
    // they are reinstalled once under the new identity to coexist with PoeTech.
    expect(manifest.id).toBe('/lovecorner/');
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
