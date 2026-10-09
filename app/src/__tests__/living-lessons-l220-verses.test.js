// @vitest-environment node
//
// L220 — "Every Thought Captured and Tested": His Word written inside, and read
// daily for the gaps.
//
// Darrell sent this into the app by email on 2026-10-08 with one word on top,
// Lesson, and his own teaching under it (rendered for meaning, DR-0331):
// increase in knowledge, and the importance of His Knowledge being the highest
// and the standard, not my will but His; expect great outcomes when you lean on
// His Understanding rather than on the thousands of thoughts a waking day
// brings; we have the ability to choose the thoughts, which is capturing them
// and inspecting them for what should and should not be allowed inside this
// mental space, because whatever we fill this place with becomes who we are; He
// wrote His Word in there, and we keep that part highest by reading it daily to
// see the gaps between what He said and what we believe He means, until the
// perspectives are masterful because they are seen in the context of what He
// meant and not what we thought it meant before we studied to shew ourselves
// approved unto Him.
//
// The FIRST clause of that word is L219 (DR-0818), built the same day. This is
// the half L219 does not carry, and the lesson says so in its own words.
//
// Every double-quoted span in the module must be verbatim KJV from the in-repo
// corpus under a STRICT comparison (whitespace only, never apostrophes), every
// band must carry the full message in its own register, and the teaching that
// makes this lesson ITSELF is checked per band. DR-0820.
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

const ID = 'll220-every-thought-captured-and-tested-his-word-written-inside-and-read-daily-for-the-gaps';
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

describe('L220 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Every Thought Captured and Tested — His Word Written Inside, and Read Daily for the Gaps');
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
});

describe('L220 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(80);
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
    expect(checked).toBeGreaterThan(80);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ['mental space', 'becomes who we are', 'studied to show', 'six thousand', 'the gaps between'];
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

describe('L220 — the teaching that makes this lesson itself, per band', () => {
  it('each band opens on the posture: not my will but His', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 22:42`).toContain('(Luke 22:42)');
      const says = sentences(band(b)).some((s) => /not my will/i.test(s));
      expect(says, `${b} never says not my will`).toBe(true);
    }
  });
  it('each band says why the thought-stream cannot be the authority', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 8:6`).toMatch(/\(Romans 8:(6|6-7)\)/);
      const says = sentences(band(b)).some((s) => /carnal/i.test(s));
      expect(says, `${b} never explains carnally minded`).toBe(true);
    }
  });
  it('each band gives the law the volume obeys: what you think, you become', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 23:7`).toContain('(Proverbs 23:7)');
      const says = sentences(band(b)).some((s) => /you become|becom(e|es|ing) (who|the person|you)/i.test(s));
      expect(says, `${b} never says what you think you become`).toBe(true);
    }
  });
  it('each band takes the thought into custody instead of arguing with it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Corinthians 10:5`).toContain('(2 Corinthians 10:5)');
      const says = sentences(band(b)).some((s) => /captivity|custody|catch/i.test(s));
      expect(says, `${b} never says what capturing is`).toBe(true);
    }
  });
  it('each band runs the eight-part Test of Philippians 4:8', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Philippians 4:8`).toContain('(Philippians 4:8)');
      const says = sentences(band(b)).some((s) => /eight/i.test(s));
      expect(says, `${b} never names the eight`).toBe(true);
    }
  });
  it('each band guards the gate, because what is inside comes out', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 4:23`).toContain('(Proverbs 4:23)');
      const says = sentences(band(b)).some((s) => /comes out|flows out|guard/i.test(s));
      expect(says, `${b} never says why the gate matters`).toBe(true);
    }
  });
  it('each band says He already wrote it inside, and that we hide more there on purpose', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Jeremiah 31:33`).toContain('(Jeremiah 31:33)');
      expect(band(b), `${b} Psalms 119:11`).toContain('(Psalms 119:11)');
    }
  });
  it('each band sends the reader to read it DAILY, which is where the gaps are found', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Joshua 1:8`).toContain('(Joshua 1:8)');
      expect(band(b), `${b} Psalms 1:2`).toContain('(Psalms 1:2)');
      const says = sentences(band(b)).some((s) => /gap/i.test(s));
      expect(says, `${b} never names the gap`).toBe(true);
    }
  });
  it('each band names what does the finding: the Word reads the thoughts AND the intents', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Hebrews 4:12`).toContain('(Hebrews 4:12)');
      const says = sentences(band(b)).some((s) => /intent|why we think|the why|motive/i.test(s));
      expect(says, `${b} never says it reads the why`).toBe(true);
    }
  });
  it('each band names the work and refuses to stop at hearing it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Timothy 2:15`).toContain('(2 Timothy 2:15)');
      expect(band(b), `${b} James 1:22`).toContain('(James 1:22)');
    }
  });
  it('each band leaves the reader in peace rather than under a weight', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Isaiah 26:3`).toContain('(Isaiah 26:3)');
      expect(band(b), `${b} Ephesians 4:23`).toContain('(Ephesians 4:23)');
      expect(band(b), `${b} 1 Corinthians 2:16`).toContain('(1 Corinthians 2:16)');
    }
  });
  it('each band gives the four moves a reader can actually run', () => {
    for (const b of BANDS) {
      const t = band(b);
      for (const move of ['NOTICE', 'TEST', 'CAPTURE', 'REDIRECT']) {
        expect(t, `${b} missing ${move}`).toContain(move);
      }
    }
  });
  it('the adult lesson carries the whole spine and sets the affection above', () => {
    expect(L.lesson).toContain('(Colossians 3:2)');
    expect(L.lesson).toContain('(Romans 8:6-7)');
    expect(L.lesson).toContain('(1 Corinthians 2:16)');
  });
  it('the volume is stated honestly: his figure attributed, the Word carrying no number (DR-0076, DR-0100)', () => {
    const said = `${L.bigIdea} ${L.lesson} ${band('youth')} ${band('teen')} ${band('senior')}`;
    // His figure is HIS, and the lesson says the Word gives no count — so the
    // teaching never rests on a number Scripture does not supply.
    expect(said).toMatch(/thousand/i);
    expect(L.lesson, 'the adult lesson must say the Word gives no number').toMatch(/no (count|number)/i);
  });
  it("Darrell's own framing is carried, not paraphrased away, and it names its sibling lesson", () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said).toMatch(/mental space/i);
    expect(said).toMatch(/becomes who we are/i);
    expect(said).toMatch(/shew (thyself|ourselves|yourself) approved/i);
    expect(said).toMatch(/2026-10-08/);
    // The first clause of the same word became L219 the same day; this lesson
    // says so instead of quietly repeating it.
    expect(said).toMatch(/L219|highest authority in every dimension/i);
  });
});
