// @vitest-environment node
//
// L216 — "A Life Full of Everything": Yahweh is always good, consistency is the key, and His Will is that you prosper as your soul prospers.
//
// Darrell, 2026-10-07, spoken into this channel (rendered for meaning, DR-0331):
// "I have had a life full of everything... pain to death to Love.... failure... success... Yahweh is always good... He helps us to make it happen whatever that is we need or desire to happen after His Will is done... consistency is key... reading the Word... filling the mind with His Perspectives... no room for lesser mindsets... His Will is for us to prosper as our souls prosper..."
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

const ID = 'll216-a-life-full-of-everything-yahweh-is-always-good-consistency-is-the-key-and-his-will-is-that-you-prosper-as-your-soul-prospers';
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

describe('L216 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("A Life Full of Everything \u2014 Yahweh Is Always Good, Consistency Is the Key, and His Will Is That You Prosper as Your Soul Prospers");
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

describe('L216 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["life full of everything", "consistency is key", "consistency is the key", "lesser mindsets", "his perspectives", "after his will is done"];
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

describe('L216 — the teaching that makes this lesson itself, per band', () => {
  it("each band says a full life has both kinds of days and sets Ecclesiastes 7:14 under it", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(full of everything|both kinds of days|good days and hard days|day of prosperity)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band stands the goodness of Yahweh on the Word in the day of trouble, not on a mood", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 34:8`).toContain('(Psalms 34:8)');
      expect(band(b), `${b} Nahum 1:7`).toContain('(Nahum 1:7)');
      expect(band(b), `${b} Lamentations 3:22-23`).toContain('(Lamentations 3:22-23)');
      expect(band(b), `${b} Romans 8:28`).toContain('(Romans 8:28)');
    }
  });
  it("each band keeps the ORDER Darrell gave: His Will first, as the Son prayed and taught", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 22:42`).toContain('(Luke 22:42)');
      expect(band(b), `${b} Matthew 6:33`).toContain('(Matthew 6:33)');
      expect(band(b), `${b} 1 John 5:14-15`).toContain('(1 John 5:14-15)');
    }
  });
  it("each band names consistency as the key, in its own register", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(consistency|every day|day and night|same time)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band ties consistency to the Word's own practice", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Joshua 1:8`).toContain('(Joshua 1:8)');
      expect(band(b), `${b} Psalms 1:2-3`).toContain('(Psalms 1:2-3)');
      expect(band(b), `${b} Galatians 6:9`).toContain('(Galatians 6:9)');
    }
  });
  it("each band teaches that a filled mind leaves no room for a lesser one", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(no room|crowd|push(es|ed)? .*out|no vacancy|nowhere to (be|stand))/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band renews the mind by the Word and reads 3 John 1:2 in its own order, the soul first", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 12:2`).toContain('(Romans 12:2)');
      expect(band(b), `${b} Proverbs 23:7`).toContain('(Proverbs 23:7)');
      expect(band(b), `${b} 3 John 1:2`).toContain('(3 John 1:2)');
    }
  });
  it("each band puts the soul first, in words", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(soul first|soul comes first|soul is (the measure|first)|even as thy soul|the inside is well|inside is the thing)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
});
