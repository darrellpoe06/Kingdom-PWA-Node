// @vitest-environment node
//
// L218 — "Do Not Switch Up on His Way": Yahweh's principles documented, no offense taken, and letting Him win so we win.
//
// Darrell, 2026-10-07, spoken into this channel (rendered for meaning, DR-0331):
// "Don't switch up on Yahweh's Principals and Way... His Way... documented... don't take offense... let Him win... so we win... obviously..."
// He closed it with one word: Lesson.
//
// Every double-quoted span in the module must be verbatim KJV from the in-repo
// corpus under a STRICT comparison (whitespace only, never apostrophes), every
// band must carry the full message in its own register, and the teaching that
// makes this lesson ITSELF (not a neighbour wearing a new title) is checked per
// band. DR-0814.
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

const ID = 'll218-do-not-switch-up-on-his-way-yahwehs-principles-documented-no-offense-taken-and-letting-him-win-so-we-win';
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

describe('L218 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Do Not Switch Up on His Way \u2014 Yahweh's Principles Documented, No Offense Taken, and Letting Him Win So We Win");
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

describe('L218 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(130);
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
    expect(checked).toBeGreaterThan(130);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ["switch up", "let him win", "so we win", "take offense", "documented"];
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

describe('L218 — the teaching that makes this lesson itself, per band', () => {
  it("each band grounds not switching up in the God who does not change", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Malachi 3:6`).toContain('(Malachi 3:6)');
      expect(band(b), `${b} Hebrews 13:8`).toContain('(Hebrews 13:8)');
      expect(band(b), `${b} Numbers 23:19`).toContain('(Numbers 23:19)');
      expect(band(b), `${b} Psalms 119:89`).toContain('(Psalms 119:89)');
    }
  });
  it("each band names what switching up does to a person, from James 1:8", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(double minded|unstable|shaky|tossed)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band shows His Way as a Person and a path", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 14:6`).toContain('(John 14:6)');
      expect(band(b), `${b} Jeremiah 6:16`).toContain('(Jeremiah 6:16)');
      expect(band(b), `${b} Isaiah 30:21`).toContain('(Isaiah 30:21)');
      expect(band(b), `${b} Proverbs 14:12`).toContain('(Proverbs 14:12)');
    }
  });
  it("each band says documented with the Word's own writing-down", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Habakkuk 2:2`).toContain('(Habakkuk 2:2)');
      expect(band(b), `${b} Deuteronomy 6:6-7`).toContain('(Deuteronomy 6:6-7)');
      expect(band(b), `${b} Psalms 119:11`).toContain('(Psalms 119:11)');
      expect(band(b), `${b} Matthew 7:24-25`).toContain('(Matthew 7:24-25)');
    }
  });
  it("each band says documented or written down, in words", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(documented|written down|write it|write the vision|worn bible)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band refuses offense on Psalms 119:165 and the Lord's own example", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 119:165`).toContain('(Psalms 119:165)');
      expect(band(b), `${b} Proverbs 19:11`).toContain('(Proverbs 19:11)');
      expect(band(b), `${b} Luke 17:1`).toContain('(Luke 17:1)');
      expect(band(b), `${b} 1 Peter 2:23`).toContain('(1 Peter 2:23)');
      expect(band(b), `${b} Colossians 3:13`).toContain('(Colossians 3:13)');
    }
  });
  it("each band says NOTHING shall offend, the Word's word, not little", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /nothing (shall offend|offends)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
  it("each band lets Him win on the battle that is His, and wins with Him", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Chronicles 20:15`).toContain('(2 Chronicles 20:15)');
      expect(band(b), `${b} Luke 22:42`).toContain('(Luke 22:42)');
      expect(band(b), `${b} 1 Corinthians 15:57`).toContain('(1 Corinthians 15:57)');
      expect(band(b), `${b} Romans 8:37`).toContain('(Romans 8:37)');
      expect(band(b), `${b} Joshua 24:15`).toContain('(Joshua 24:15)');
    }
  });
  it("each band says let Him win, so we win", () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(let him win|let him fight|letting him win|when he wins, you win|when he won, you won|we win when he wins|win with him)/i.test(s));
      expect(says, `${b} never says it`).toBe(true);
    }
  });
});
