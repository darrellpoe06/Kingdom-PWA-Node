// @vitest-environment node
//
// L230 — "Competence Before Submission". Darrell spoke it into the app on
// 2026-10-09: he is not sure many women can be wives on their study skills and
// then their doing skills, the same for a man; how can anyone submit to a
// person not competent in the Spiritual Mindset who believes he should be
// submitted to without understanding what He says; the skills matter; the
// future either comes or it does not. THIS IS A SUBJECT where a lesson can
// mislead while every word in it is true, by keeping the wife's verse and
// dropping the husband's standard, or the reverse. So the gates require BOTH
// in every band, exactly as written: Ephesians 5:22 AND the husband's
// competence (Ephesians 5:25-26 / 1 Peter 3:7), the wife's study verses AND
// doing verses (Proverbs 31), the choosing (Amos 3:3; 1 Corinthians 7:39),
// the marriage already made to a Nabal (1 Samuel 25:3, 25:33; 1 Peter 3:1-2),
// and the future that either comes or does not (Proverbs 27:1). DR-0853.
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

const ID = 'll230-competence-before-submission-the-study-skills-and-doing-skills-of-a-wife-and-a-husband-with-the-word-answering-first';
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
const EVERY_BAND = ["Ephesians 5:22", "1 Peter 3:7", "Proverbs 22:29", "Ezra 7:10", "Matthew 7:24", "Matthew 7:26", "Luke 6:46", "Luke 16:10", "Proverbs 31:26", "Proverbs 31:30", "Proverbs 31:13", "Proverbs 31:16", "Proverbs 31:27", "Proverbs 14:1", "1 Samuel 25:3", "Amos 3:3", "1 Corinthians 7:39", "Proverbs 13:20", "Proverbs 19:2", "Proverbs 15:22", "1 Samuel 25:33", "Proverbs 27:1", "Deuteronomy 30:19"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Ephesians 5:23)", "(1 Corinthians 11:3)", "(Ephesians 5:21)", "(Ephesians 5:25-26)", "(Ephesians 5:28)", "(Ephesians 5:29)", "(Ephesians 5:33)", "(Colossians 3:19)", "(1 Timothy 3:4-5)", "(Genesis 2:15)", "(Proverbs 24:27)", "(Proverbs 27:23)", "(Deuteronomy 6:7)", "(James 1:22)", "(2 Timothy 2:15)", "(Proverbs 31:10)", "(Proverbs 31:17)", "(Proverbs 31:20)", "(Proverbs 31:11)", "(Proverbs 31:31)", "(Proverbs 12:4)", "(Proverbs 19:14)", "(1 Peter 3:4)", "(Proverbs 11:22)", "(Ruth 3:11)", "(2 Corinthians 6:14)", "(Proverbs 18:22)", "(Genesis 2:18)", "(Genesis 2:24)", "(Ecclesiastes 4:9)", "(Ecclesiastes 4:12)", "(Hosea 4:6)", "(Proverbs 4:7)", "(1 Samuel 25:17)", "(1 Samuel 25:25)", "(1 Peter 3:1-2)", "(Proverbs 21:9)", "(Psalms 1:2-3)", "(Proverbs 24:3-4)", "(Proverbs 3:5-6)"];

describe('L230 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Competence Before Submission — the Study Skills and Doing Skills of a Wife and a Husband, With the Word Answering First");
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

describe('L230 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["study skills", "doing skills", "either comes or", "spiritual mindset"];
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

describe('L230 — the whole spine, in every band', () => {
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
  it("every band keeps the wife's verse exactly as written (Ephesians 5:22)", () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"Wives, submit yourselves unto your own husbands, as unto the Lord\." \(Ephesians 5:22\)/);
    }
  });
  it("every band names the husband's competence BEFORE it is done: the washing of water by the Word and dwelling according to knowledge", () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(Ephesians 5:(25|26|25-26|25-29)\)/);
      expect(band(b), `${b}`).toMatch(/according to knowledge" \(1 Peter 3:7\)/);
    }
  });
  it("every band carries the wife's STUDY verse and her DOING verses from her own chapter", () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(Proverbs 31:26\)/);
      expect(band(b), `${b}`).toMatch(/\(Proverbs 31:16\)/);
      expect(band(b), `${b}`).toMatch(/\(Proverbs 31:27\)/);
    }
  });
  it('every band weighs competence at the choosing (Amos 3:3; 1 Corinthians 7:39) with counsellors (Proverbs 15:22)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"Can two walk together, except they be agreed\?" \(Amos 3:3\)/);
      expect(band(b), `${b}`).toMatch(/\(1 Corinthians 7:39\)/);
      expect(band(b), `${b}`).toMatch(/\(Proverbs 15:22\)/);
    }
  });
  it('every band gives the marriage already made to a Nabal Abigail and Peter, not a licence', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(1 Samuel 25:3\)/);
      expect(band(b), `${b}`).toMatch(/blessed be thy advice, and blessed be thou" \(1 Samuel 25:33\)/);
      expect(band(b), `${b}`).toMatch(/\(1 Peter 3:1(-2)?\)/);
    }
  });
  it('every band says the future either comes or it does not, so the skill is built today (Proverbs 27:1)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"Boast not thyself of to morrow[^"]*" \(Proverbs 27:1\)/);
      expect(band(b), `${b}`).toMatch(/\(Deuteronomy 30:19\)/);
    }
  });
  it('the lesson gives no husband a pass and no wife a licence, in our own words', () => {
    expect(L.lesson).toMatch(/the Word gives no husband a pass for not knowing what He says, and it gives no wife a licence for contempt/);
  });
  it('the adversary name inside the quoted record stays lowercase (belial, 1 Samuel 25:17)', () => {
    for (const [path, text] of FLAT) expect(text, path).not.toMatch(/Belial/);
  });
});
