// =============================================================================
// games-heritage — the games' real-photo foundation is REAL (Reality-Trace)
// =============================================================================
// Darrell declared his family photos as the games' foundational data
// (2026-07-07). This gate keeps that foundation honest (DR-0076):
//   1. every photo src resolves to an actual file under app/public — a painted
//      path can never ship on a surface whose whole value is trust;
//   2. every Scripture reference resolves to VERBATIM text in the verified KJV
//      store (never typed from memory);
//   3. the dedication carries his own naming (the uncles and aunts, and
//      K'Shawna) — his words, not a generic caption;
//   4. the gallery actually renders the photos with alt text on BOTH grounds
//      (the light single-player surface and the dark big screen).
import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { HERITAGE, heritagePhotos } from '../lib/games/heritage.js';
import { hasVerse, resolveScripture } from '../lib/games/scripture-link.js';
import HeritageGallery from '../components/games/HeritageGallery.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(SRC, '..', 'public');

beforeEach(() => { document.body.innerHTML = ''; });

describe('heritage data — every photo is a real asset', () => {
  it('ships exactly the three declared photos, ids unique', () => {
    const ids = heritagePhotos().map((p) => p.id);
    expect(ids).toEqual(['turnkey-housing', 'raised-by-soldiers', 'family-today']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every src resolves to an actual file under app/public (no painted paths)', () => {
    for (const p of heritagePhotos()) {
      expect(p.src.startsWith('/games/heritage/'), `${p.id} src convention`).toBe(true);
      expect(existsSync(join(PUBLIC, p.src)), `${p.src} must exist on disk`).toBe(true);
    }
  });

  it('every photo carries alt text, a title and a caption (accessibility + honesty)', () => {
    for (const p of heritagePhotos()) {
      expect(p.alt?.trim().length, `${p.id} alt`).toBeGreaterThan(10);
      expect(p.title?.trim().length, `${p.id} title`).toBeGreaterThan(0);
      expect(p.caption?.trim().length, `${p.id} caption`).toBeGreaterThan(0);
    }
  });
});

describe('heritage scripture — verbatim from the verified store (DR-0076)', () => {
  it('the banner and every photo reference resolve to real KJV text', () => {
    expect(hasVerse(HERITAGE.scripture), HERITAGE.scripture).toBe(true);
    for (const p of heritagePhotos()) {
      expect(hasVerse(p.scripture), `${p.id}: ${p.scripture}`).toBe(true);
    }
  });

  it('the banner is the goodly-heritage verse', () => {
    const v = resolveScripture(HERITAGE.scripture);
    expect(v.ref).toBe('Psalm 16:6');
    expect(v.text).toContain('goodly heritage');
  });
});

describe('heritage dedication — his words, his naming', () => {
  it('names the uncles and aunts who covered, and K’Shawna his oldest daughter', () => {
    expect(HERITAGE.dedication).toContain('uncles and aunts');
    expect(HERITAGE.dedication).toContain('covered me and loved me and my family');
    expect(HERITAGE.dedication).toContain('K’Shawna');
    expect(HERITAGE.dedication).toContain('oldest daughter');
  });

  it('does not guess names onto individual faces (dignity: no per-photo people labels until Darrell assigns them)', () => {
    for (const p of heritagePhotos()) {
      expect(p.people, `${p.id} must not carry guessed identities`).toBeUndefined();
    }
  });
});

function mount(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  return host;
}

describe('HeritageGallery — renders the real photos on both grounds', () => {
  it.each(['light', 'dark'])('on=%s: three imgs with alt, the dedication, the banner verse', (on) => {
    const host = mount(createElement(HeritageGallery, { on }));
    const imgs = [...host.querySelectorAll('img')];
    expect(imgs.length).toBe(3);
    for (const img of imgs) {
      expect(img.getAttribute('alt')?.trim().length).toBeGreaterThan(10);
      expect(img.getAttribute('src')).toMatch(/^\/games\/heritage\//);
    }
    expect(host.textContent).toContain('K’Shawna');
    expect(host.textContent).toContain('goodly heritage');
    expect(host.textContent).toContain('The Turnkey days');
  });
});
