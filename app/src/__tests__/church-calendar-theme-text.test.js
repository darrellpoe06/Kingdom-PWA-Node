// =============================================================================
// The church calendar's words are readable in every theme (DR-1644).
// =============================================================================
// Darrell's 2026-11-24 screenshot of the Times tab in the dark theme: the
// day's heading ("Tuesday, November 24, 2026 · today"), "This time of year,
// in past years" and the suggestion form's labels were near-black on a
// near-black card. The card is var(--lc-paper), which each theme repaints;
// those rules painted FIXED dark text on it (#1a1815). contrast-guard checks
// the theme tokens and inline colors, not a stylesheet rule's fixed color on
// a theme-painted card, so it stayed green. This is that check.
//
// THE RULE: in the calendar (.cc-*) and archive (.ca-*) styles, a rule that
// sets a fixed text color (#hex, rgb()) must sit on its own fixed background:
// the rule paints one itself, or it styles the inside of an element that does
// (listed below, by name). Otherwise its color is a theme token (var(--…)).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(HERE, '..', 'index.css'), 'utf8');

// Elements that paint their own white chip, and the parts drawn inside them.
const INSIDE_A_CHIP = { 'cc-day-name': 'cc-day', 'cc-day-dot': 'cc-day', 'cc-btn-quiet': 'cc-btn' };

/** [{ selector, body }] for every top-level rule in the CSS text. */
export function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css.replace(/\/\*[\s\S]*?\*\//g, '')))) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
}

/** Calendar/archive selectors that set a fixed text color on a surface they do not paint. */
export function fixedOnThemedCard(css) {
  const all = rules(css);
  const painted = new Set();
  for (const r of all) {
    const bg = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/.exec(r.body);
    if (!bg || /transparent|var\(/.test(bg[1])) continue;
    for (const c of r.selector.match(/\.(c[ac]-[a-z0-9-]+)/g) || []) painted.add(c.slice(1));
  }
  const bad = [];
  for (const r of all) {
    if (r.selector.startsWith('@') || r.selector.includes('[data-theme')) continue;
    for (const sel of r.selector.split(',').map((x) => x.trim())) {
      const classes = (sel.match(/\.(c[ac]-[a-z0-9-]+)/g) || []).map((c) => c.slice(1));
      if (!classes.length) continue;
      const color = /(?:^|;)\s*color\s*:\s*([^;]+)/.exec(r.body);
      if (!color || !/#[0-9a-f]{3,8}|rgb/i.test(color[1]) || /^\s*var\(/.test(color[1])) continue;
      const onChip = classes.some((c) => painted.has(c) || painted.has(INSIDE_A_CHIP[c]));
      if (!onChip) bad.push(sel);
    }
  }
  return bad;
}

describe('the calendar is readable in every theme', () => {
  it('no calendar or archive rule paints fixed text on the theme-painted card', () => {
    expect(fixedOnThemedCard(CSS)).toEqual([]);
  });
  it('PROVEN TO CATCH: the rules as they were before this fix', () => {
    const before =
      '.cc{background:var(--lc-paper,#fff)}.cc-btn{background:#fff;color:#1a1815}.cc-list-h{margin-top:.75rem;color:#1a1815}.ca-summary{color:#1a1815}.cc-said.is-good{color:#3d5226}';
    expect(fixedOnThemedCard(before)).toEqual(['.cc-list-h', '.ca-summary', '.cc-said.is-good']);
  });
  it('every theme that repaints the card also repaints the words on it', () => {
    for (const theme of ['midnight', 'night']) {
      const block = new RegExp(`\\[data-theme="${theme}"\\]\\{([^}]*)\\}`).exec(CSS);
      expect(block, theme).toBeTruthy();
      expect(block[1]).toMatch(/--lc-paper:/);
      expect(block[1]).toMatch(/--lc-ink:/);
      expect(block[1]).toMatch(/--lc-muted:/);
    }
  });
});
