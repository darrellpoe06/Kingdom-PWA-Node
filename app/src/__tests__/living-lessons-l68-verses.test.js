// @vitest-environment node
// =============================================================================
// Captured-teaching lessons — every quoted Scripture is KJV-VERBATIM (DR-0076).
// Began with L68 (Out of the Way, The Deep End — Welch/Azonwu, ~30 passages);
// every captured lesson added since joins VERBATIM_GATED below. The gate
// machine-checks the discipline the series claims: each "quoted text"
// (Reference) pair in the audience-facing lesson prose must match the in-repo
// KJV corpus (public/bible/kjv) exactly — an ellipsis splits a quote into
// parts that must EACH match verbatim. A paraphrase, a memory-slip, or a
// Yahweh-substitution INSIDE a quote (forbidden by DR-0210's bright line)
// fails the build.
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

// Captured lessons under the verbatim gate: [id, expected row index, min quotes,
// attribution tokens the prose must carry (DR-0190)].
const VERBATIM_GATED = [
  ['ll68-out-of-the-way-consecration-and-the-broken-bread', 67, 20, ['The Deep End', 'Taylor Welch', 'Ezekiel Azonwu']],
  ['ll69-faithful-over-a-few-things-stewardship-and-increase', 68, 20, ['Zach', 'NetWorth']],
  ['ll70-the-bridegrooms-answer-only-the-father-names-the-day', 69, 25, ['video teaching', 'reconstruction']],
  ['ll73-the-house-of-el-and-the-only-saviour', 72, 60, ['video teaching', 'summary']],
  ['ll74-church-hurt-the-counterfeit-comfort-and-the-blood', 73, 25, ['Karen', 'Bloodbought', 'video teaching', 'summary']],
  ['ll75-the-greater-yeshua', 74, 25, ['BLK SHP Bible Talk', 'video teaching', 'summary', 'frame']],
  // L76 quotes less than its neighbours by design — its subject is a silence in
  // the Word, and the restraint IS the teaching — so its floor is set lower.
  ['ll76-the-sky-the-speculation-and-the-test-that-works', 75, 16, ['DLM Christian Perspective', 'video teaching', 'summary', 'canon']],
  ['ll77-the-king-over-the-children-of-pride', 76, 60, ['William Jackson', 'video teaching', 'summary', 'frame']],
  ['ll79-justice-and-righteousness-travel-together', 78, 55, ['Manny Scott', 'video teaching', 'summary', 'testimony']],
  ['ll80-the-heavens-declare-and-the-timetable-is-held-open', 79, 45, ['Hugh Ross', 'Fuz Rana', 'Taylor Welch', 'Reasons to Believe', 'video teaching', 'summary']],
  // L81's source is a SOCIAL POST plus its replies, not a video — the shortest
  // captured source yet, so its quote floor sits lower. The replies carry real
  // teaching weight here (the wettest-August farmer supplies the lesson's hinge),
  // which is why the attribution list names the post AND its register.
  ['ll81-the-stork-knows-her-appointed-times', 80, 14, ['Massimo', 'The Nature Conservancy', 'BirdReturns', 'social post', 'summary']],
];

describe.each(VERBATIM_GATED)('%s — every quote is corpus-verbatim', (id, row, minQuotes, attribs) => {
  const mod = LIVING_LESSONS_MODULES.find((m) => m.id === id);

  it('the lesson exists at its row', () => {
    expect(mod, `${id} must exist`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.indexOf(mod)).toBe(row);
  });

  it('every "quote" (Book C:V) pair in the lesson prose matches the KJV corpus verbatim', () => {
    // "quoted text" (Reference) — reference forms: Book 3:30 or Book 26:53-54.
    const RE = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;
    const failures = [];
    let checked = 0;
    for (const match of mod.lesson.matchAll(RE)) {
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
    expect(checked, 'the quote-matcher must actually find quotes (a regex drift would silently pass)').toBeGreaterThan(minQuotes);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('attribution is carried (DR-0190) and the quiz keeps the Word senior', () => {
    for (const token of attribs) expect(mod.lesson, `lesson must attribute "${token}"`).toContain(token);
    expect(mod.quiz.questions.length).toBeGreaterThanOrEqual(3);
  });
});

describe('L68 anchor pin', () => {
  it('holds the consecration anchor', () => {
    const l68 = LIVING_LESSONS_MODULES.find((m) => m.id === VERBATIM_GATED[0][0]);
    expect(l68.anchor.ref).toBe('John 3:30; John 15:1-5');
  });
});
