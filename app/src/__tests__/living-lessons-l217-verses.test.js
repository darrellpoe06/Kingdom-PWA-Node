// @vitest-environment node
//
// L217 — "The Holy Spirit Brings a Sound Mind, Not Confusion": His clarity, the eyes of the heart, and the Word as the only source.
//
// Darrell, 2026-10-07, spoken into this channel (rendered for meaning, DR-0331):
// "The Holy Spirit brings a sound mind... not confusion... we get His clarity... and see with our deep parts... our hearts... have eyes... not the 3rd eye fake spiritual stuff... we only source the Word!!!!!!!"
// He closed it with one word: Lesson.
//
// Every double-quoted span in the module must be verbatim KJV from the in-repo
// corpus under a STRICT comparison (whitespace only, never apostrophes), every
// band must carry the full message in its own register, and the teaching that
// makes this lesson ITSELF (not a neighbour wearing a new title) is checked per
// band. DR-0812.
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

const ID = 'll217-the-holy-spirit-brings-a-sound-mind-not-confusion-his-clarity-the-eyes-of-the-heart-and-the-word-as-the-only-source';
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

describe('L217 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("The Holy Spirit Brings a Sound Mind, Not Confusion \u2014 His Clarity, the Eyes of the Heart, and the Word as the Only Source");
  });
  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) { expect(q.options.length).toBe(3); expect(q.options[q.answer]).toBeTruthy(); expect(q.explain.length).toBeGreaterThan(40); }
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
});

describe('L217 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(90);
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
    expect(checked).toBeGreaterThan(90);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ["sound mind, not confusion", "our hearts have eyes", "deep parts", "third eye", "fake spiritual", "only source the word"];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase)) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

describe('L217 — the teaching that makes this lesson itself, per band', () => {
  it("each band stands the sound mind on 2 Timothy 1:7 and the no-confusion on 1 Corinthians 14:33", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Timothy 1:7`).toContain('(2 Timothy 1:7)');
      expect(band(b), `${b} 1 Corinthians 14:33`).toContain('(1 Corinthians 14:33)');
    }
  });
  it("each band says confusion is not from Him (a warning, never a doorway)", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(confusion is not|not the author of confusion|not from him|not on the list|is not it)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band names the Giver of clarity: the Spirit who teaches and guides", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 14:26`).toContain('(John 14:26)');
      expect(band(b), `${b} John 16:13`).toContain('(John 16:13)');
      expect(band(b), `${b} James 1:5`).toContain('(James 1:5)');
    }
  });
  it("each band shows the eyes of the heart are the Word's own picture, and where the light comes from", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ephesians 1:17-18`).toContain('(Ephesians 1:17-18)');
      expect(band(b), `${b} Psalms 119:18`).toContain('(Psalms 119:18)');
      expect(band(b), `${b} Psalms 119:130`).toContain('(Psalms 119:130)');
    }
  });
  it("each band names the counterfeit plainly: a third eye and the fake spiritual stuff", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(third eye|fake spiritual|fortune|tarot|horoscope|medium|chakra|talking to the dead|seance)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band forbids the counterfeit with the Word's own names and gives the test", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Deuteronomy 18:10-12`).toContain('(Deuteronomy 18:10-12)');
      expect(band(b), `${b} Isaiah 8:19-20`).toContain('(Isaiah 8:19-20)');
      expect(band(b), `${b} 1 John 4:1`).toContain('(1 John 4:1)');
    }
  });
  it("each band says there is NO light in a voice outside the Word, not less light", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /no light/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band sources the Word only: lamp, light, sufficient, and the heart kept", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 119:105`).toContain('(Psalms 119:105)');
      expect(band(b), `${b} 2 Timothy 3:16-17`).toContain('(2 Timothy 3:16-17)');
      expect(band(b), `${b} Proverbs 4:23`).toContain('(Proverbs 4:23)');
      expect(band(b), `${b} Proverbs 3:5-6`).toContain('(Proverbs 3:5-6)');
    }
  });
  it("each band says we source the Word only, in words", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(only source the word|source the word|the word only|only the word|answers from the word)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
});
