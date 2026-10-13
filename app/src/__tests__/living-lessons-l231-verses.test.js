// @vitest-environment node
//
// L231 — "Does Yahweh Rank a Wife Over a Woman?". Darrell spoke it into the
// app on 2026-10-09 as a question: does a woman in covenant with a man hold
// more rank in Yahweh's eyes than one who is not; how can the Proverbs 31
// woman run systems like that and still submit; what exactly does Scripture
// say; how can relationships be as fruitful as possible. THIS IS A SUBJECT
// where a lesson can mislead while every word in it is true, by keeping the
// wife's capability and dropping the order, or the reverse. So the gates
// require BOTH in every band, exactly as written: no respecter of persons and
// the praise of a woman that feareth the LORD (Acts 10:34; Proverbs 31:30);
// the unmarried calling (1 Corinthians 7:34; Luke 2:37); her systems under
// her husband's trust (Proverbs 31:11, 31:16, 31:24, 31:31); Ephesians 5:22
// AND 5:25 under 5:21; the head of Christ (1 Corinthians 11:3); helper in the
// Word's own usage (Genesis 2:18; Psalms 121:2); and the wife who lifts her
// husband (Acts 18:26). DR-0854.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0076, DR-0098.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThreeEverywhere } from '../lib/talk-together.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll231-does-yahweh-rank-a-wife-over-a-woman-covenant-the-proverbs-31-woman-and-the-order-with-the-word-answering-first';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase();
const flow = (name, ch) => {
  const c = chapters[bookKey(name)];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

const FLAT = [];
(function flatten(node, path) {
  if (typeof node === 'string') { FLAT.push([path, node]); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${path}[${i}]`)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k);
  }
}(L, ''));

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;
const band = (b) => String(L.levels[b]);
const grown = `${L.lesson} ${band('teen')} ${band('senior')}`;

// The references every band must carry, verbatim-gated below.
const EVERY_BAND = ["Genesis 1:27", "Galatians 3:28", "1 Peter 3:7", "Proverbs 31:30", "Proverbs 18:22", "1 Corinthians 7:34", "Luke 2:37", "Luke 10:42", "Proverbs 31:16", "Proverbs 31:18", "Proverbs 31:24", "Proverbs 31:11", "Proverbs 31:23", "Proverbs 31:28", "Proverbs 31:31", "Proverbs 31:1", "Proverbs 14:1", "Ruth 3:11", "Ephesians 5:21", "Ephesians 5:22", "Ephesians 5:25", "1 Corinthians 11:3", "Mark 10:45", "Acts 18:26", "1 Samuel 25:33", "John 15:5", "Genesis 2:18", "Psalms 121:2", "Matthew 19:6", "Ecclesiastes 4:9", "Psalms 128:3", "Malachi 2:15"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Proverbs 19:14)", "(Isaiah 56:5)", "(Proverbs 31:20)", "(Colossians 3:19)", "(Mark 10:43)", "(Judges 4:4)", "(Acts 16:14)", "(Proverbs 12:4)", "(Psalms 33:20)"];

describe('L231 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Does Yahweh Rank a Wife Over a Woman? — Covenant, the Proverbs 31 Woman, and the Order, With the Word Answering First");
  });
  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1000);
    for (const b of BANDS) {
      const ratio = proseWords(L.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });
  it('the reading ladder rises and the child band clears the NEW-lesson ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(fk.child).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen).toBeLessThanOrEqual(fk.senior);
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('every band and the lesson send the reader to someone: parents to children, children to parents, friend to friend (DR-0733)', () => {
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });
  it('was spoken on 2026-10-09 and the lesson says so', () => {
    expect(`${L.bigIdea} ${L.lesson}`).toMatch(/2026-10-09/);
  });
});

describe('L231 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(100);
    expect(quoted - referenced, `${quoted - referenced} unreferenced span(s)`).toBe(0);
  });
  it('every referenced span is verbatim in the KJV corpus, strictly', () => {
    const bad = [];
    let checked = 0;
    for (const [path, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        checked += 1;
        const [, span, book, ch] = m;
        const f = flow(book, ch);
        if (!f) { bad.push(`${path}: no such book ${book}`); continue; }
        if (!f.includes(norm(span))) bad.push(`${path}: ${book} ${ch} — ${norm(span).slice(0, 70)}`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ["male authority", "upgrade", "rank in"];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase.toLowerCase())) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
  it('Yahweh in our voice, never the generic name outside a quotation (DR-0210)', () => {
    for (const [path, text] of FLAT) {
      const ours = ourProseOnly(text).replace(/\((?:[1-3] )?[A-Za-z]+ \d+:[\d\-,]+\)/g, '');
      expect(ours, `${path} uses the generic name in our voice`).not.toMatch(/\bGod\b/);
    }
  });
});

describe('L231 — the whole spine, in every band', () => {
  it('every band carries every reference of the spine', () => {
    const missing = [];
    for (const b of BANDS) for (const r of EVERY_BAND) if (!band(b).includes(`(${r})`)) missing.push(`${b}: ${r}`);
    expect(missing, missing.join('\n')).toEqual([]);
  });
  it('the lesson carries every reference of the spine too', () => {
    const missing = EVERY_BAND.filter((r) => !L.lesson.includes(`(${r})`));
    expect(missing, missing.join('\n')).toEqual([]);
  });
  it('the grown bands carry the rest', () => {
    const missing = GROWN.filter((r) => !grown.includes(r));
    expect(missing, missing.join('\n')).toEqual([]);
  });
  it('every band says He is no respecter of persons and names what He praises', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"God is no respecter of persons:" \(Acts 10:34\)/);
      expect(band(b), `${b}`).toMatch(/"a woman that feareth the LORD, she shall be praised\." \(Proverbs 31:30\)/);
    }
  });
  it('every band honours the unmarried calling beside marriage (1 Corinthians 7:34; Luke 2:37; Luke 10:42)', () => {
    for (const b of BANDS) for (const r of ['1 Corinthians 7:34', 'Luke 2:37', 'Luke 10:42', 'Proverbs 18:22']) expect(band(b), `${b} ${r}`).toContain(`(${r})`);
  });
  it("every band carries her systems AND the trust they run under", () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"The heart of her husband doth safely trust in her,[^"]*" \(Proverbs 31:11\)/);
      expect(band(b), `${b}`).toMatch(/"She considereth a field, and buyeth it:[^"]*" \(Proverbs 31:16\)/);
      expect(band(b), `${b}`).toMatch(/\(Proverbs 31:31\)/);
    }
  });
  it('every band keeps BOTH halves of the order exactly as written, under mutual submission', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"Wives, submit yourselves unto your own husbands, as unto the Lord\." \(Ephesians 5:22\)/);
      expect(band(b), `${b}`).toMatch(/"Husbands, love your wives, even as Christ also loved the church, and gave himself for it;" \(Ephesians 5:25\)/);
      expect(band(b), `${b}`).toMatch(/"Submitting yourselves one to another in the fear of God\." \(Ephesians 5:21\)/);
    }
  });
  it('every band says order is not worth: the head of Christ is the Father', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/"the head of Christ is God\." \(1 Corinthians 11:3\)/);
  });
  it('every band teaches helper from the Word\'s own usage (Genesis 2:18 with Psalms 121:2)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(Genesis 2:18\)/);
      expect(band(b), `${b}`).toMatch(/"My help cometh from the LORD, which made heaven and earth\." \(Psalms 121:2\)/);
    }
  });
  it('every band carries the wife who lifts her husband (Acts 18:26)', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/expounded unto him the way of God more perfectly\." \(Acts 18:26\)/);
  });
  it('the lesson invents nothing about where her skill came from, and says so', () => {
    expect(L.lesson).toMatch(/The chapter does not say either, and this lesson will not add to it/);
    expect(L.lesson).toMatch(/This lesson erases neither the wife's verse nor the husband's/);
  });
});
