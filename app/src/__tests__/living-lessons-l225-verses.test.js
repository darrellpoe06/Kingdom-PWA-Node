// @vitest-environment node
//
// L225 — "Spiritual Knowledge Is the Most Important Factor". Darrell spoke
// it into the app on 2026-10-09 in four breaths: spiritual Knowledge and His
// Ways for the highest quality of life in every season, even with less money;
// He GIVES the power to get wealth and the things are added, not worked for;
// the Philippians' giving and Abraham's tenth, with his own marker that the
// tenth-and-Philippians thought is not studied yet; submitted to Yahweh is the
// highest level; and the three in the fire, but if not. The gates require
// every band to carry the soul as the measure (3 John 1:2), the factor named
// by its absence (Hosea 4:6), the price list, a lean season as a season
// (Ecclesiastes 3:1), Joseph prosperous in a prison (Genesis 39:2, 39:23),
// where money comes from (Deuteronomy 8:18), gives and added (Matthew 6:33),
// the Philippians (4:15, 4:17, 4:19), submission (James 4:7; Isaiah 55:9),
// and the fire (Daniel 3:17-18; 3:25). And the HONEST LINE is gated: the
// Word says giving and receiving of the Philippians and never names the
// tenth there, so every grown band must say so (DR-0076 §8).
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

const ID = 'll225-spiritual-knowledge-is-the-most-important-factor-the-highest-quality-of-life-in-every-season-with-money-or-without-it';
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
const EVERY_BAND = ["3 John 1:2", "Mark 8:36", "Luke 12:15", "Hosea 4:6", "Proverbs 4:7", "Proverbs 2:6", "James 1:5", "Proverbs 16:16", "Proverbs 24:3-4", "Psalms 119:105", "Joshua 1:8", "Ecclesiastes 3:1", "Matthew 4:4", "Hebrews 13:5", "Psalms 23:1", "Psalms 34:10", "Genesis 39:2", "Genesis 39:23", "Genesis 41:41", "1 Kings 17:16", "Job 42:12", "Deuteronomy 8:18", "Proverbs 10:22", "Matthew 6:33", "Philippians 4:15", "Philippians 4:17", "Philippians 4:19", "Luke 6:38", "2 Peter 1:5-7", "Daniel 1:17", "John 10:10", "Jeremiah 29:11", "James 4:7", "Isaiah 55:9", "Deuteronomy 8:5", "Psalms 32:8", "Matthew 11:29", "Romans 8:14", "Daniel 3:17-18", "Daniel 3:25", "Luke 22:42"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Philippians 4:11-13)", "(1 Timothy 6:6-8)", "(Proverbs 15:16-17)", "(Hebrews 7:2)", "(Proverbs 3:9-10)", "(Revelation 22:17)", "(2 Peter 1:3)", "(Revelation 12:11)"];

describe('L225 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Spiritual Knowledge Is the Most Important Factor — the Highest Quality of Life in Every Season, With Money or Without It");
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

describe('L225 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["highest quality of life", "most important factor", "not studied yet"];
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

describe('L225 — the whole spine, in every band', () => {
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
  it("every band says added, not worked for", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /Added\.? ?Not worked for|Added, not worked for/.test(s)) || /Added\.? ?Not worked for|Added, not worked for/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band says but if not", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /But if not\./.test(s)) || /But if not\./.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it("every band carries the honest line: the Philippians passage does not name the tenth", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /does not (say|name) the tenth|does not say they gave a tenth/.test(s)) || /does not (say|name) the tenth|does not say they gave a tenth/.test(band(b));
      expect(says, `${b} is silent`).toBe(true);
    }
  });
  it('states what the Word promises PRECISELY and adds nothing (DR-0100)', () => {
    expect(L.lesson).toMatch(/does not promise that every season is a rich one/);
    expect(L.lesson).toMatch(/a study to run, not a claim to make/);
  });
});
