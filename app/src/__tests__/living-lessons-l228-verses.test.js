// @vitest-environment node
//
// L228 — "Can a Man Be Taught by a Woman?". Darrell spoke it into the app on
// 2026-10-09 as a question, with the frame that knowing Him is most
// important, He can use anyone, and the Word answers first. THIS IS THE ONE
// SUBJECT where a lesson can mislead while every word in it is true, by
// leaving half of the text out in either direction. So the gates require BOTH
// halves in every band, exactly as written: the order verses (1 Timothy 2:12;
// 1 Corinthians 14:34) AND the record (Acts 18:26; Judges 4:4; 2 Kings 22:15;
// Luke 2:38; Acts 2:18; John 20:18; Titus 2:3; 2 Timothy 1:5), the Word's
// diagnosis of the hardness (Proverbs 16:18; James 4:6), and the closing
// line that neither half is erased (DR-0098, DR-0076).
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0850.
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

const ID = 'll228-can-a-man-be-taught-by-a-woman-knowing-him-is-most-important-he-can-use-anyone-and-the-word-answers-first';
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
const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);
const grown = `${L.lesson} ${band('teen')} ${band('senior')}`;

// The references every band must carry, verbatim-gated below.
const EVERY_BAND = ["John 17:3", "Hosea 4:6", "Numbers 22:28", "Luke 19:40", "Acts 10:34", "1 Corinthians 12:11", "Acts 18:26", "2 Kings 22:15", "Micah 6:4", "Luke 2:38", "Joel 2:28", "Acts 2:18", "John 20:17", "John 20:18", "2 Timothy 1:5", "2 Timothy 3:15", "Proverbs 1:8", "Proverbs 31:26", "Proverbs 16:18", "James 4:6", "Proverbs 13:10", "Proverbs 12:1", "Proverbs 19:20", "Galatians 3:28", "Psalms 68:11"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(1 Timothy 2:11-14)", "(1 Corinthians 14:34-35)", "(Judges 4:4-5)", "(Titus 2:3-5)", "(1 Samuel 25:32-33)", "(Romans 16:1)", "(Philippians 4:3)", "(John 4:39)", "(Ephesians 4:11-12)"];

describe('L228 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Can a Man Be Taught by a Woman? — Knowing Him Is Most Important, He Can Use Anyone, and the Word Answers First");
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

describe('L228 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["half of humanity", "answers first", "does not seem biblical"];
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

describe('L228 — the whole spine, in every band', () => {
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
  it("every band carries the ORDER verses, exactly as written", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /\(1 Timothy 2:(12|11-14)\)/.test(s)) || /\(1 Timothy 2:(12|11-14)\)/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band carries 1 Corinthians 14:34, exactly as written", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /\(1 Corinthians 14:(34|34-35)\)/.test(s)) || /\(1 Corinthians 14:(34|34-35)\)/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band says Deborah judged Israel", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /\(Judges 4:(4|4-5)\)/.test(s)) || /\(Judges 4:(4|4-5)\)/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band says the aged women are teachers of good things", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /\(Titus 2:(3|3-4|3-5)\)/.test(s)) || /\(Titus 2:(3|3-4|3-5)\)/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band says both halves are kept", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /[Bb]oth are (true|written)|[Bb]oth halves|keeps? both|keep both|hold both/.test(s)) || /[Bb]oth are (true|written)|[Bb]oth halves|keeps? both|keep both|hold both/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it('the order verses are kept AS WRITTEN and the record is kept AS WRITTEN, and the lesson says so', () => {
    expect(L.lesson).toMatch(/does not erase them, does not soften them/);
    expect(L.lesson).toMatch(/it is not erased either/);
    expect(L.lesson).toMatch(/Making half of humanity silent about Him is not what the Word does/);
    expect(L.lesson).toMatch(/Nor will this lesson erase the order verses/);
  });
  it('the diagnosis names pride, never the woman, in every band', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/pride problem|Pride\./);
  });
});
