// @vitest-environment node
// L78 — every quoted fragment VERBATIM against the repo's own KJV (DR-0076;
// the DR-0288 discipline). Without these pins the lesson rides the suite green
// while quoting from memory — the vacuous-gate class caught three times on
// 2026-08-14/15, never again knowingly.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const PINS = [
  ['Proverbs', 29, 25, 'The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe'],
  ['2Timothy', 1, 7, 'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind'],
  ['Psalms', 139, 14, 'I am fearfully and wonderfully made'],
  ['1Samuel', 16, 7, 'man looketh on the outward appearance, but the LORD looketh on the heart'],
  ['Exodus', 4, 10, 'I am slow of speech, and of a slow tongue'],
  ['Exodus', 4, 12, 'Now therefore go, and I will be with thy mouth'],
  ['Philippians', 2, 4, 'Look not every man on his own things, but every man also on the things of others'],
  ['1Peter', 5, 7, 'Casting all your care upon him; for he careth for you'],
];

describe('L78 — the snare of the fear of man: verses verbatim', () => {
  const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === 'll78-the-snare-of-the-fear-of-man');

  it('the lesson is published', () => {
    expect(lesson).toBeTruthy();
  });

  it('every pinned fragment is an exact substring of the cited KJV verse', () => {
    const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    const failures = [];
    for (const [book, ch, vs, frag] of PINS) {
      if (!norm(kjv(book, ch, vs)).includes(norm(frag))) failures.push(`${book} ${ch}:${vs} — "${frag}"`);
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the lesson (no stale pin list)', () => {
    const blob = JSON.stringify(lesson).replace(/[’‘]/g, "'");
    const missing = PINS.filter(([, , , frag]) => !blob.includes(frag)).map(([b, c, v]) => `${b} ${c}:${v}`);
    expect(missing).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a one-word tamper fails', () => {
    const real = kjv('Proverbs', 29, 25);
    expect(real.includes('The fear of man bringeth freedom')).toBe(false);
    expect(real.includes('The fear of man bringeth a snare')).toBe(true);
  });
});
