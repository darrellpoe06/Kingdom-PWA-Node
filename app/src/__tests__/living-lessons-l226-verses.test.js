// @vitest-environment node
//
// L226 — "The Mind of Christ Is Our Identity". Darrell spoke it into the app
// on 2026-10-09 in two breaths and a closing line: a soul worth more than
// money; the war against the mind; the Mind of Christ as identity, solid,
// the whole armour; sound minds from the Helper; His eternal mindsets and
// our lane; all nations into the Kingdom Ways; only the image-bearers go
// through it, not angels; the Son was always going to be man; and He died
// to make the church, a host from all nations. The gates require every band
// to carry each piece with its verse.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0847.
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

const ID = 'll226-the-mind-of-christ-is-our-identity-sound-minds-the-whole-armour-and-the-kingdom-ways-every-nation-is-going-into';
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
const EVERY_BAND = ["1 Samuel 16:7", "Mark 8:37", "James 2:5", "Proverbs 18:22", "Proverbs 19:14", "Proverbs 16:18", "1 Peter 5:8", "1 Corinthians 2:16", "Romans 12:2", "Isaiah 26:3", "Matthew 6:22", "2 Timothy 1:7", "John 14:26", "Romans 8:14", "James 4:7", "1 Corinthians 7:20", "Luke 9:62", "Psalms 86:9", "Matthew 28:19", "Habakkuk 2:14", "Revelation 7:9", "Genesis 1:26", "Genesis 1:27", "Genesis 2:24", "Genesis 5:3", "Psalms 127:3", "1 Thessalonians 5:23", "Hebrews 1:14", "1 Peter 1:20", "Revelation 13:8", "John 1:14", "Hebrews 2:16", "Hebrews 1:5", "Acts 20:28", "1 Corinthians 12:27", "Galatians 3:28"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Isaiah 14:13)", "(2 Timothy 2:3-4)", "(Isaiah 55:8-9)", "(Hebrews 12:1-2)", "(Revelation 5:9-10)", "(Ephesians 2:14-16)", "(Luke 24:39)", "(Psalms 8:4-5)"];

describe('L226 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("The Mind of Christ Is Our Identity — Sound Minds, the Whole Armour, and the Kingdom Ways Every Nation Is Going Into");
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

describe('L226 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["game of life", "operating system", "historical reasons"];
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

describe('L226 — the whole spine, in every band', () => {
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
  it("every band says not angels", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /[Nn]ot angels|not become an angel|took not on him the nature of angels/.test(s)) || /[Nn]ot angels|not become an angel|took not on him the nature of angels/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band says the armour is whole", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /\bwhole armour\b|\bWhole\b|All of it/.test(s)) || /\bwhole armour\b|\bWhole\b|All of it/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it('the lesson teaches the Son was man before the fall, from the text, and only humans go through the process', () => {
    expect(L.lesson).toMatch(/never a response to the fall/);
    expect(L.lesson).toMatch(/not angel, not animal/);
  });
});
