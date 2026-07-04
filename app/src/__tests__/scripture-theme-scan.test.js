// @vitest-environment node
//
// scripture-theme-scan — the one-click "Highlighted Bible" engine (Darrell
// 2026-07-04: "one click ... shows all the verses with highlighted words based on
// the key and color code ... to see the patterns of the Word"). Proves the scan
// is DETERMINISTIC and whole-word: it colors the right theme words on REAL KJV
// verses (fetched from the shipped assets) and never lights up inside another
// word. The lexicon is validated against the theme catalog so a stray key can't
// point a color at nothing.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef, chapterVerses, __setBibleFetcher } from '../lib/bible-kjv.js';
import { THEMES, themeMarkerStyle } from '../lib/scripture-themes.js';
import { THEME_WORDS, scanThemeSpans, themesPresent } from '../lib/scripture-theme-scan.js';

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

// Pull one real verse verbatim from the shipped KJV.
async function verse(ref) {
  const p = parseRef(ref);
  const verses = await chapterVerses(p.book, p.chapter);
  return (verses.find((v) => v.v === p.v1) || {}).text || '';
}
// The lowercased words the scan colored, and the theme it assigned each.
const scanned = (text) => scanThemeSpans(text).map((s) => ({ word: text.slice(s.start, s.end).toLowerCase(), theme: s.theme, style: s.style }));

describe('the lexicon is well-formed', () => {
  it('every lexicon key is a real theme, and every marker style resolves', () => {
    const themeKeys = new Set(THEMES.map((t) => t.key));
    for (const key of Object.keys(THEME_WORDS)) {
      expect(themeKeys.has(key), `lexicon key ${key} is not a theme`).toBe(true);
      expect(THEME_WORDS[key].length, `${key} has no words`).toBeGreaterThan(0);
      expect(themeMarkerStyle(key), `${key} marker`).not.toBe('none');
    }
  });
});

describe('whole-word matching (no false positives)', () => {
  it('colors a theme word but not a longer word that merely contains it', () => {
    // "sin" must not fire inside "since" or "singing"; "love" not inside "glove".
    const rows = scanned('Since the singing, sin met love in a glove.');
    const words = rows.map((r) => r.word);
    expect(words).toContain('sin');
    expect(words).toContain('love');
    expect(words).not.toContain('since');
    expect(words).not.toContain('singing');
    expect(words).not.toContain('glove');
  });
  it('assigns the correct theme + a real color to each hit', () => {
    const byWord = Object.fromEntries(scanned('grace and faith, a kingdom of mercy').map((r) => [r.word, r]));
    expect(byWord.grace.theme).toBe('grace');
    expect(byWord.faith.theme).toBe('faith');
    expect(byWord.kingdom.theme).toBe('kingdom');
    expect(byWord.mercy.theme).toBe('love');           // mercy reads under Love
    for (const r of Object.values(byWord)) expect(r.style).toBe(themeMarkerStyle(r.theme));
  });
  it('returns nothing for empty / theme-less text', () => {
    expect(scanThemeSpans('')).toEqual([]);
    expect(scanThemeSpans('and the of a to')).toEqual([]);
  });
});

describe('REAL KJV: the patterns light up on the actual text', () => {
  it('John 3:16 marks love / faith / life the way the verse reads', async () => {
    const t = await verse('John 3:16');           // "...God so loved... whosoever believeth... everlasting life."
    const rows = scanned(t);
    const byTheme = (theme) => rows.filter((r) => r.theme === theme).map((r) => r.word);
    expect(byTheme('love')).toContain('loved');
    expect(byTheme('faith')).toContain('believeth');
    expect(byTheme('life').some((w) => w === 'everlasting' || w === 'life')).toBe(true);
    expect(themesPresent(t)).toEqual(expect.arrayContaining(['love', 'faith', 'life']));
  });
  it('Romans 6:23 marks sin and life', async () => {
    const t = await verse('Romans 6:23');          // "the wages of sin is death; but the gift of God is eternal life..."
    const rows = scanned(t);
    expect(rows.some((r) => r.word === 'sin' && r.theme === 'sin')).toBe(true);
    expect(rows.some((r) => r.theme === 'life')).toBe(true);
  });
  it('the theme legend for a verse lists themes in canonical order', async () => {
    const t = await verse('John 3:16');
    const present = themesPresent(t);
    const order = THEMES.map((x) => x.key);
    for (let i = 1; i < present.length; i += 1) {
      expect(order.indexOf(present[i - 1])).toBeLessThan(order.indexOf(present[i]));
    }
  });
});
