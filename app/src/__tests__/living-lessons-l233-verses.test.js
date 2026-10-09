// @vitest-environment node
//
// L233 — "Yahweh Speaking With Yahweh". Darrell spoke it into the app on
// 2026-10-09 with one word under it, Lesson: Yahweh talking to Yahweh in all
// places in the Scriptures. The gates hold Deuteronomy 6:4 in every band, the
// counsel before time (Genesis 1:26), the Father to the Son (Psalms 110:1;
// Matthew 3:17), the Son to the Father (John 12:28; John 17:20), the Spirit
// hearing and speaking (John 16:13; Romans 8:26), the conversation still about
// us (Romans 8:34), and the invitation in (Galatians 4:6). Where the Word does
// not explain, the lesson says so (Deuteronomy 29:29; DR-0098). DR-0857.
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

const ID = 'll233-yahweh-speaking-with-yahweh-every-place-the-word-lets-us-overhear-the-father-the-son-and-the-holy-spirit';
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
const EVERY_BAND = ["Deuteronomy 6:4", "Genesis 1:2", "Genesis 1:3", "John 1:1", "Genesis 1:26", "Isaiah 6:8", "Titus 1:2", "Psalms 2:7", "Psalms 110:1", "Hebrews 1:8", "Matthew 3:16", "Matthew 3:17", "Matthew 17:5", "Psalms 40:8", "John 11:42", "John 12:28", "Mark 14:36", "Luke 23:34", "John 16:13", "1 Corinthians 2:10", "Romans 8:26", "Romans 8:34", "John 8:29", "John 5:20", "John 10:30", "Galatians 4:6"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(Deuteronomy 29:29)", "(Genesis 3:22)", "(Genesis 11:7)", "(1 Peter 1:20)", "(John 17:24)", "(Matthew 22:43)", "(Psalms 110:4)", "(Psalms 40:7)", "(Hebrews 10:5)", "(Luke 10:21)", "(John 17:4)", "(John 17:21)", "(Matthew 27:46)", "(Psalms 22:1)", "(Luke 23:46)", "(Isaiah 48:16)", "(Hebrews 7:25)", "(1 John 2:1)", "(Ephesians 2:18)"];

describe('L233 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("Yahweh Speaking With Yahweh — Every Place the Word Lets Us Overhear the Father, the Son and the Holy Spirit");
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

describe('L233 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["talking to Yahweh", "in all places"];
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

describe('L233 — the whole spine, in every band', () => {
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
  it('every band stands on one LORD', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/"Hear, O Israel: The LORD our God is one LORD:" \(Deuteronomy 6:4\)/);
  });
  it('every band lets us hear each voice: the counsel, the Father, the Son, the Spirit', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/Let us make man in our image[^"]*" \(Genesis 1:26\)/);
      expect(band(b), `${b}`).toMatch(/\(Psalms 110:1\)/);
      expect(band(b), `${b}`).toMatch(/This is my beloved Son, in whom I am well pleased\." \(Matthew 3:17\)/);
      expect(band(b), `${b}`).toMatch(/I have both glorified it, and will glorify it again\." \(John 12:28\)/);
      expect(band(b), `${b}`).toMatch(/whatsoever he shall hear, that shall he speak:" \(John 16:13\)/);
      expect(band(b), `${b}`).toMatch(/\(Romans 8:26\)/);
    }
  });
  it('every band says the conversation is still about us, and that we are invited in', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(Romans 8:34\)/);
      expect(band(b), `${b}`).toMatch(/\(Galatians 4:6\)/);
      expect(band(b), `${b}`).toMatch(/\(John 17:20\)/);
    }
  });
  it('the lesson stays with what is revealed and says so', () => {
    expect(L.lesson).toMatch(/\(Deuteronomy 29:29\)/);
    expect(L.lesson).toMatch(/The Word does not comment on that verse there, and the lesson adds nothing to it/);
  });
});
