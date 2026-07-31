// @vitest-environment node
// =============================================================================
// Library + Bookstore — color rides THEMED CLASSES, never inline hex (DR-0076).
// The 2026-07-30 live screenshot: the whole Books → Library surface (titles,
// buttons, card borders) was invisible under the midnight theme, because every
// color was painted with inline `style={{ color: '#1A1815' }}` from a local
// PALETTE const. The theme engine (lib/theme-css.js) remaps CLASS tokens
// (`[data-theme] .text-\[\#1A1815\] { ... !important }`) — selectors that can
// never match an inline style — so NO theme (midnight, snow, slate, sapphire,
// rose) could re-skin the surface. The existing contrast-guard never caught it
// for the same reason: it audits class tokens.
//
// This gate holds the fix's class: any inline color/borderColor/background in
// these surfaces fails the build. Proven-to-catch below against the exact
// pre-fix pattern.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), 'utf8');

// An inline COLOR paint inside a style expression: a color-ish property fed a
// hex literal or a palette member. fontFamily / width / height stay legal.
const INLINE_COLOR_RE = /style=\{\{[^}]*(?:\bcolor:|borderColor:|borderLeftColor:|\bbackground(?:Color)?:)\s*(?:'#|"#|`#|[A-Z]+\.|P\.|styles\.|[a-z]+ === |[a-z]+ \?)/;

describe('Library/Bookstore — themed classes, never inline hex', () => {
  for (const file of ['../components/Library.jsx', '../components/Bookstore.jsx']) {
    it(`${file.replace('../components/', '')} paints no color via inline style (the midnight-invisibility class)`, () => {
      const src = read(file);
      const hit = src.match(INLINE_COLOR_RE);
      expect(hit, hit ? `inline color paint survives: "${hit[0].slice(0, 80)}…"` : '').toBeNull();
    });
  }

  it('the detector actually catches the pre-fix pattern (proven-to-catch, DR-0076 §3)', () => {
    for (const bad of [
      "style={{ color: PALETTE.ink, fontFamily: 'serif' }}",
      "style={{ borderColor: P.line, background: P.panel }}",
      "style={{ background: styles.bg, color: styles.fg }}",
      "style={{ color: '#1A1815' }}",
      "style={{ borderColor: mode === id ? PALETTE.accent : 'transparent' }}",
    ]) {
      expect(INLINE_COLOR_RE.test(bad), `detector must catch: ${bad}`).toBe(true);
    }
    // …and does NOT flag the legal non-color styles that remain.
    for (const ok of [
      'style={{ fontFamily: \'"Fraunces", serif\' }}',
      'style={{ width: `${t.percentElapsed}%` }}',
    ]) {
      expect(INLINE_COLOR_RE.test(ok), `detector must allow: ${ok}`).toBe(false);
    }
  });

  it('the rendered tokens are the THEMED ones the engine remaps (text/border/bg classes present)', () => {
    const lib = read('../components/Library.jsx');
    for (const token of ['text-[#1A1815]', 'text-[#5A5751]', 'border-[#E8E4DC]', 'bg-[#FAF8F4]', 'bg-[#1A1815]']) {
      expect(lib.includes(token), `Library must use themed token ${token}`).toBe(true);
    }
    // The tokens Library now leans on must each carry a midnight remap in the
    // theme engine — the pairing that makes the surface visible in the dark.
    const theme = read('../lib/theme-css.js');
    for (const sel of ['.text-\\\\[\\\\#1A1815\\\\]', '.text-\\\\[\\\\#5A5751\\\\]', '.border-\\\\[\\\\#E8E4DC\\\\]', '.bg-\\\\[\\\\#FAF8F4\\\\]', '.bg-white']) {
      expect(theme.includes(`[data-theme="midnight"] ${sel}`), `midnight must remap ${sel}`).toBe(true);
    }
  });
});
