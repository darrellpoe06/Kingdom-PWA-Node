// @vitest-environment node
// =============================================================================
// L68 (Out of the Way) — every quoted Scripture is KJV-VERBATIM (DR-0076).
// The lesson was captured from a Deep End episode (Taylor Welch with Ezekiel
// Azonwu) and quotes ~30 passages. This gate machine-checks the discipline the
// series claims: each "quoted text" (Reference) pair in the audience-facing
// lesson prose must match the in-repo KJV corpus (public/bible/kjv) exactly —
// an ellipsis splits a quote into parts that must EACH match verbatim. A
// paraphrase, a memory-slip, or a Yahweh-substitution INSIDE a quote (forbidden
// by DR-0210's bright line) fails the build.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const here = dirname(fileURLToPath(import.meta.url));
const IDX = JSON.parse(readFileSync(join(here, '../lib/bible-kjv-index.json'), 'utf8'));
const byName = new Map(IDX.map((b) => [b.name.toLowerCase(), b.file]));
// Common short-name aliases used in citations.
const ALIASES = { psalm: 'psalms', ps: 'psalms', matt: 'matthew', gen: 'genesis', gal: 'galatians', rom: 'romans', phil: 'philippians', hab: 'habakkuk', jas: 'james', eph: 'ephesians', prov: 'proverbs', isa: 'isaiah', ecc: 'ecclesiastes' };

function corpusText(book, ch, v1, v2) {
  const key = (ALIASES[book.toLowerCase()] || book.toLowerCase());
  const file = byName.get(key);
  if (!file) return null;
  const data = JSON.parse(readFileSync(join(here, `../../public/bible/kjv/${file}.json`), 'utf8'));
  const c = data.chapters[ch - 1];
  if (!c) return null;
  const out = [];
  for (let v = v1; v <= v2; v += 1) { if (c[v - 1] == null) return null; out.push(c[v - 1]); }
  return out.join(' ');
}

// Normalize typographic apostrophes/quotes so a straight-quoted lesson string
// can match the corpus's curly ones without weakening word-level fidelity.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

describe('L68 — Out of the Way: every quote is corpus-verbatim', () => {
  const l68 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll68-out-of-the-way-consecration-and-the-broken-bread');

  it('the lesson exists and is the 68th row', () => {
    expect(l68, 'L68 must exist').toBeTruthy();
    expect(LIVING_LESSONS_MODULES.indexOf(l68)).toBe(67);
  });

  it('every "quote" (Book C:V) pair in the lesson prose matches the KJV corpus verbatim', () => {
    // "quoted text" (Reference) — reference forms: Book 3:30 or Book 26:53-54.
    const RE = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;
    const failures = [];
    let checked = 0;
    for (const match of l68.lesson.matchAll(RE)) {
      const [, quote, book, ch, v1, v2] = match;
      const text = corpusText(book, +ch, +v1, +(v2 || v1));
      if (text == null) { failures.push(`${book} ${ch}:${v1} — not found in corpus`); continue; }
      checked += 1;
      // An ellipsis marks an honest elision; every part must still be verbatim.
      for (const part of quote.split('...')) {
        const p = norm(part);
        if (p && !norm(text).includes(p)) failures.push(`${book} ${ch}:${v1}${v2 ? '-' + v2 : ''}: "${p.slice(0, 60)}…" is not verbatim in the KJV text`);
      }
    }
    expect(checked, 'the quote-matcher must actually find quotes (a regex drift would silently pass)').toBeGreaterThan(20);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('attribution is carried (DR-0190): the teaching names its source, and the quiz/anchor keep the Word senior', () => {
    expect(l68.lesson).toMatch(/The Deep End/);
    expect(l68.lesson).toMatch(/Taylor Welch/);
    expect(l68.lesson).toMatch(/Ezekiel Azonwu/);
    expect(l68.anchor.ref).toBe('John 3:30; John 15:1-5');
    expect(l68.quiz.questions.length).toBeGreaterThanOrEqual(3);
  });
});
