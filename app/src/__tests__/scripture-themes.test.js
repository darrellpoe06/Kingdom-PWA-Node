// @vitest-environment node
//
// scripture-themes — the Inductive / Precept thematic markers (Darrell 2026-07-04).
// The load-bearing test is REAL-DATA (DR-0061 / P15 + DR-0076): EVERY theme anchor
// must resolve to a real verse in the shipped in-app KJV. A mistyped book, a wrong
// chapter, or a verse that does not exist fails the build here — a study link can
// never ship dead. The fetcher points at the on-disk per-book KJV assets the app
// serves at /bible/kjv/<file>.json.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef, chapterVerses, __setBibleFetcher } from '../lib/bible-kjv.js';
import {
  THEMES, getTheme, themeMarkerStyle, allThemeAnchors, THEMES_SOURCE,
} from '../lib/scripture-themes.js';
import { HIGHLIGHT_STYLES } from '../lib/scripture-highlights.js';

const KJV_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');

beforeAll(() => {
  __setBibleFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(KJV_ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

describe('the thematic markers are well-formed', () => {
  it('each theme has a key, label, abbr, definition, a palette color, and anchors', () => {
    const seen = new Set();
    for (const t of THEMES) {
      expect(t.key, 'key').toBeTruthy();
      expect(seen.has(t.key), `duplicate theme key ${t.key}`).toBe(false);
      seen.add(t.key);
      expect(t.label, `${t.key} label`).toBeTruthy();
      expect(t.abbr, `${t.key} abbr`).toMatch(/^[A-Za-z]{2,4}$/);
      expect(t.definition, `${t.key} definition`).toBeTruthy();
      expect(Array.isArray(t.anchors) && t.anchors.length >= 2, `${t.key} anchors`).toBe(true);
    }
  });

  it('every marker color is a real key in the shared highlight palette', () => {
    const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
    for (const t of THEMES) {
      expect(known.has(t.style), `${t.key} borrows unknown style ${t.style}`).toBe(true);
      expect(themeMarkerStyle(t.key)).toBe(t.style);
    }
    expect(themeMarkerStyle('not-a-theme')).toBe('none');
  });

  it('getTheme resolves by key and allThemeAnchors de-dupes in order', () => {
    expect(getTheme('grace').label).toBe('Grace');
    expect(getTheme('nope')).toBe(null);
    const all = allThemeAnchors();
    expect(new Set(all).size).toBe(all.length);         // no duplicates
    expect(all).toContain('John 3:16');
  });

  it('carries its provenance (our legend, grounded in the source)', () => {
    expect(THEMES_SOURCE.name).toMatch(/PoeTech/);
    expect(THEMES_SOURCE.basis).toMatch(/Worldview/);
  });
});

describe('REAL-DATA: every anchor resolves to a real verse in the shipped KJV', () => {
  it('resolves each theme anchor to an existing book/chapter/verse', async () => {
    for (const t of THEMES) {
      for (const ref of t.anchors) {
        const p = parseRef(ref);
        expect(p, `${t.key}: "${ref}" does not parse`).toBeTruthy();
        const verses = await chapterVerses(p.book, p.chapter);
        expect(verses.length, `${t.key}: ${ref} — chapter empty/missing`).toBeGreaterThan(0);
        const hit = verses.find((v) => v.v === p.v1);
        expect(hit, `${t.key}: ${ref} — verse ${p.v1} not found in ${p.book} ${p.chapter}`).toBeTruthy();
        expect(hit.text.trim().length, `${t.key}: ${ref} — empty verse text`).toBeGreaterThan(0);
      }
    }
  });
});
