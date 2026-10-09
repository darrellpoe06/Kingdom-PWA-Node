// @vitest-environment node
//
// L234 — "Will We Have Angel-Like Experiences After Death?". Darrell asked it
// on 2026-10-09 with one word under it, Lesson. The Word answers in three
// parts that must stay together in every band: like the angels in the two ways
// Jesus names (Matthew 22:30; Luke 20:36); never angels (Hebrews 1:14, 2:16;
// 1 Corinthians 6:3); and like Him (1 John 3:2; Philippians 3:21; Luke 24:39).
// At death, present with the Lord (2 Corinthians 5:8; Luke 23:43). Where the
// Word is silent the lesson is silent (2 Corinthians 12:4; DR-0098). DR-0858.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0076.
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

const ID = 'll234-will-we-have-angel-like-experiences-after-death-like-the-angels-in-some-ways-never-angels-and-like-him';
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
const EVERY_BAND = ["Matthew 22:30", "Luke 20:36", "Luke 20:38", "2 Corinthians 5:8", "Luke 23:43", "Luke 16:22", "Hebrews 1:14", "Hebrews 2:16", "Revelation 22:9", "1 John 3:2", "Philippians 3:21", "Luke 24:39", "Revelation 22:4", "Psalms 16:11", "Revelation 21:4", "Matthew 13:43", "1 Thessalonians 4:17", "John 11:25"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Ecclesiastes 12:7)", "(Philippians 1:23)", "(Acts 7:56)", "(Revelation 14:13)", "(Psalms 8:5)", "(1 Corinthians 6:3)", "(1 Peter 1:12)", "(Job 19:26)", "(1 Corinthians 13:12)", "(Revelation 7:11)", "(Revelation 22:3)", "(2 Corinthians 12:4)", "(Hebrews 9:27)", "(Romans 8:18)"];

describe('L234 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Will We Have Angel-Like Experiences After Death? — Like the Angels in Some Ways, Never Angels, and Like Him");
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

describe('L234 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["angel like experiences", "angel-like experiences"];
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

describe('L234 — the whole spine, in every band', () => {
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
  it('carries its two stories, one light and one solemn, each a parable labelled as one (DR-0855)', () => {
    const st = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(st.length).toBeGreaterThanOrEqual(2);
    expect(new Set(st.map((s) => s.tone))).toEqual(new Set(['light', 'solemn']));
  });
  it('every band carries all three parts: like the angels in two ways, never angels, like Him', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/but are as the angels of God in heaven\." \(Matthew 22:30\)/);
      expect(band(b), `${b}`).toMatch(/\(Luke 20:36\)/);
      expect(band(b), `${b}`).toMatch(/\(Hebrews 1:14\)/);
      expect(band(b), `${b}`).toMatch(/\(Hebrews 2:16\)/);
      expect(band(b), `${b}`).toMatch(/we shall be like him; for we shall see him as he is\." \(1 John 3:2\)/);
    }
  });
  it('every band says plainly that people do not become angels', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/never be an angel|is not in the Bible|not in the Word|not a biblical one|not an angel|not true/);
  });
  it('every band says a resurrection body is not a ghost, and where believers are at death', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/for a spirit hath not flesh and bones, as ye see me have\." \(Luke 24:39\)/);
      expect(band(b), `${b}`).toMatch(/\(2 Corinthians 5:8\)/);
      expect(band(b), `${b}`).toMatch(/\(Luke 16:22\)/);
      expect(band(b), `${b}`).toMatch(/\(Revelation 21:4\)/);
    }
  });
  it('the lesson stops where the Word stops', () => {
    expect(L.lesson).toMatch(/\(2 Corinthians 12:4\)/);
    expect(L.lesson).toMatch(/It stays with what is written, which is more than enough/);
  });
});
