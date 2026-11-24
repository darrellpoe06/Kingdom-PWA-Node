// A KIDS ZONE BUTTON ALWAYS NAMES ITS COLOR (DR-1642).
// `.kz-act` alone is white words with no background (kids-zone.css). The
// lesson library's "Show more" shipped that way on 2026-11-24: the page said
// 337 lessons and the button that showed them could not be seen. Every other
// kz-act in the zone already named a color; this holds the next one to it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DIR = resolve(import.meta.dirname, '../components/kids');
const COLORS = ['plain', 'blue', 'violet', 'orange', 'green', 'teal'];

/** Every kz-act use in a source that names no color: "file:line". */
export function colorlessActs(name, src) {
  const out = [];
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/kz-act(?![\w-])([^'"`]*)/g)) {
      if (/^\s*\/\/|\{\/\*/.test(line.trim())) continue;
      if (!COLORS.some((c) => new RegExp(`(^|\\s)${c}(\\s|$)`).test(m[1].replace(/\$\{[^}]*\}/g, ' ')))) out.push(`${name}:${i + 1}`);
    }
  });
  return out;
}

describe('Kids Zone buttons', () => {
  it('the stylesheet still makes a bare kz-act white with no background, which is why this gate exists', () => {
    const css = readFileSync(resolve(DIR, 'kids-zone.css'), 'utf8');
    const base = css.match(/^\.kz-act\{[^}]*\}/m)[0];
    expect(base).toMatch(/color:#fff/);
    expect(base).not.toMatch(/background/);
    for (const c of COLORS) expect(css, c).toContain(`.kz-act.${c}{`);
  });
  it('every kz-act in the zone names one of its colors', () => {
    const bad = readdirSync(DIR)
      .filter((f) => f.endsWith('.jsx'))
      .flatMap((f) => colorlessActs(f, readFileSync(resolve(DIR, f), 'utf8')));
    expect(bad).toEqual([]);
  });
  it('PROVEN-TO-CATCH: the line that shipped is reported, and its fix is not', () => {
    expect(colorlessActs('x.jsx', '<button className={`kz-act ${KZ_FOCUS}`}>Show more</button>')).toEqual(['x.jsx:1']);
    expect(colorlessActs('x.jsx', '<button className={`kz-act violet ${KZ_FOCUS}`}>Show more</button>')).toEqual([]);
    expect(colorlessActs('x.jsx', '<div className="kz-actions">')).toEqual([]);
  });
});
