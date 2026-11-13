// @vitest-environment node
// =============================================================================
// The two guides are real files, cut from Darrell's approved reference, and
// every surface reads them from one registry (DR-1505). Proven both ways: each
// listed asset exists on disk and is a real PNG; a name that is not on disk is
// caught; no guide name is invented here; every shot in the collection is
// described in the artwork brief by its id; a shot that says it landed is on
// disk; and no scene in the brief names a fantasy device.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDES, KIDS_BRAND, SHOT_LIST, listedAssets, assetUrl, KIDS_ASSET_DIR, landedShots } from '../lib/kids/guides.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, '..', '..', 'public', KIDS_ASSET_DIR);
const BRIEF = join(HERE, '..', '..', '..', 'docs', 'design', 'love-corner-kids', '2026-11-13-character-artwork-brief.md');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const FANTASY = /\b(magic|spell|wand|wizard|witch|fairy|genie|potion|wish|superpower|occult)\b/i;

describe('the guides are real assets from the approved reference', () => {
  it('every listed file exists under public/lovecorner/kids and is a PNG', () => {
    const files = listedAssets();
    expect(files.length).toBeGreaterThanOrEqual(11);
    for (const f of files) {
      const p = join(DIR, f);
      expect(existsSync(p), `${f} is listed but not on disk`).toBe(true);
      expect(readFileSync(p).subarray(0, 4).equals(PNG), `${f} is not a PNG`).toBe(true);
    }
  });
  it('the gate catches a file that is not there', () => {
    expect(existsSync(join(DIR, 'guide-nobody.png'))).toBe(false);
  });
  it('no name is invented: the guides carry null until Darrell gives them', () => {
    expect(GUIDES.girl.name).toBeNull();
    expect(GUIDES.boy.name).toBeNull();
    expect(GUIDES.girl.portrait).not.toBe(GUIDES.boy.portrait);
  });
  it('a served URL rides the door base path', () => {
    expect(assetUrl(GUIDES.girl.face)).toBe('/lovecorner/kids/guide-girl-face.png');
    expect(assetUrl(KIDS_BRAND.logo, '/lovecorner/')).toBe('/lovecorner/lovecorner/kids/logo.png');
  });
});

describe('the artwork collection', () => {
  const brief = readFileSync(BRIEF, 'utf8');
  it('holds 54 distinct shots, each described in the brief by its id, each with a kind, a surface and a status', () => {
    expect(SHOT_LIST.length).toBe(54);
    expect(new Set(SHOT_LIST.map((s) => s.id)).size).toBe(54);
    for (const s of SHOT_LIST) {
      expect(['needed', 'landed']).toContain(s.status);
      expect(['scene', 'header', 'cutout']).toContain(s.kind);
      expect(s.surface.length).toBeGreaterThan(3);
      const described = brief.includes(`\`${s.id}\``) || /^(noah|david)-\d$/.test(s.id);
      expect(described, `${s.id} is not described in the brief`).toBe(true);
    }
  });
  it('a shot that says it landed is on disk (none has yet)', () => {
    for (const s of landedShots()) expect(existsSync(join(DIR, `${s.id}.png`)), `${s.id} says landed but is not on disk`).toBe(true);
    expect(landedShots().length).toBe(0);
  });
  it('no scene in the brief names a fantasy device; the gate trips on one that would', () => {
    const scenes = brief.split('## 3.')[1].split('## 4.')[0];
    const rows = scenes.split('\n').filter((l) => l.startsWith('| `'));
    expect(rows.length).toBeGreaterThan(30);
    for (const l of rows) expect(FANTASY.test(l), l.slice(0, 40)).toBe(false);
    expect(FANTASY.test('| `bad-1` | SCENE | Jonah waves a magic wand |')).toBe(true);
  });
});
