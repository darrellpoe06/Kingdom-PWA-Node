// @vitest-environment node
//
// L229 — "The Word Is Spirit and Life". Darrell spoke it into the app on
// 2026-10-09 as a question with one word under it: what does it mean that the
// Word is Spirit and Life? The Word explains the Word (DR-0098): the sentence
// is John 6:63 in its own chapter, the Word is a Person before it is a page
// (John 1:1, 1:14; Revelation 19:13), spirit is breath and the breath is His
// (Genesis 2:7; 2 Peter 1:21; 2 Corinthians 3:6), life is the thing that
// raises the dead (Ezekiel 37:10; John 11:43-44; John 5:24; Psalms 119:25),
// and the lesson says what that asks: eat it, hide it, do it. These gates
// require the whole spine in every band, every quoted span verbatim KJV under
// a STRICT comparison (whitespace only, never apostrophes). DR-0852.
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

const ID = 'll229-the-word-is-spirit-and-life-what-it-means-in-his-own-words';
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
const EVERY_BAND = ["John 6:63", "John 6:35", "John 6:66", "John 6:67", "John 1:1", "John 1:4", "John 1:14", "Revelation 19:13", "Psalms 33:6", "Psalms 33:9", "Genesis 2:7", "2 Corinthians 3:6", "2 Peter 1:21", "John 14:26", "John 4:24", "Ezekiel 37:10", "John 11:43", "John 11:44", "John 5:24", "Psalms 119:25", "Psalms 119:50", "Luke 8:11", "1 Peter 1:23", "John 15:3", "Jeremiah 23:29", "Ephesians 6:17", "Deuteronomy 32:47", "Romans 10:17", "Isaiah 40:8", "Matthew 24:35", "Jeremiah 15:16", "1 Peter 2:2", "Psalms 119:11", "Colossians 3:16", "James 1:22", "Romans 8:11"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(John 6:51)", "(John 6:68-69)", "(1 John 1:1)", "(Hebrews 1:3)", "(Genesis 1:2-3)", "(Hebrews 11:3)", "(Job 33:4)", "(John 16:13)", "(1 Corinthians 2:13)", "(John 3:6)", "(Romans 8:6)", "(Ezekiel 37:4-5)", "(Ezekiel 37:7)", "(Ezekiel 37:14)", "(John 5:25)", "(Psalms 119:93)", "(Psalms 107:20)", "(Deuteronomy 8:3)", "(Matthew 4:4)", "(Luke 8:15)", "(James 1:18)", "(James 1:21)", "(Ephesians 5:26)", "(John 17:17)", "(Hebrews 4:12)", "(Luke 4:32)", "(1 Thessalonians 2:13)", "(Deuteronomy 32:46)", "(Proverbs 4:20-22)", "(Psalms 19:7)", "(Romans 10:8)", "(John 8:51)", "(Philippians 2:16)", "(Psalms 119:89)", "(1 Peter 1:25)", "(Psalms 119:130)", "(Luke 24:32)", "(Romans 8:2)"];

describe('L229 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("The Word Is Spirit and Life — What It Means, in His Own Words");
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

describe('L229 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["in his own words", "what does it mean", "what it means"];
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

describe('L229 — the whole spine, in every band', () => {
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
  it('every band quotes the sentence itself, whole, from its own chapter', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"It is the spirit that quickeneth; the flesh profiteth nothing: the words that I speak unto you, they are spirit, and they are life\." \(John 6:63\)/);
    }
    expect(L.lesson).toMatch(/the words that I speak unto you, they are spirit, and they are life\." \(John 6:63\)/);
  });
  it('every band teaches quicken as makes alive, in our own words', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/quicken/i);
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/makes? (it |us |them |you |the dead )?alive|make alive|alive again/i);
  });
  it('every band says the Word is a Person before it is a page (John 1:1, 1:14; Revelation 19:13)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(John 1:1\)/);
      expect(band(b), `${b}`).toMatch(/\(John 1:14\)/);
      expect(band(b), `${b}`).toMatch(/\(Revelation 19:13\)/);
    }
  });
  it('every band says spirit is breath and the breath is His, and names the dry bones', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/breath/i);
      expect(band(b), `${b}`).toMatch(/\(Genesis 2:7\)/);
      expect(band(b), `${b}`).toMatch(/\(Ezekiel 37:10\)/);
    }
  });
  it('every band ends in doing, not only hearing (James 1:22), and eating it (Jeremiah 15:16)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(James 1:22\)/);
      expect(band(b), `${b}`).toMatch(/\(Jeremiah 15:16\)/);
    }
  });
  it('the lesson says what life in His sentence is, in our own words', () => {
    expect(L.lesson).toMatch(/not information about life, but the thing that raises what was dead/);
  });
});
