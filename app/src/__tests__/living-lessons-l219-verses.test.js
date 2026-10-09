// @vitest-environment node
//
// L219 — "Prudence, and Leaning Not on Our Own Understanding": His Knowledge is
// the highest authority in every dimension.
//
// Darrell, 2026-10-08, spoken into this channel while asking where our own
// evaluation and assessment framework lives, so we can be sure we are producing
// His will with our ways and tools (rendered for meaning, DR-0331):
// "Prudence and also leaning on His Understanding... which tells me to be
// prudent... His Knowledge is the Highest Authority And Level... in all
// dimensions..."
//
// Every double-quoted span in the module must be verbatim KJV from the in-repo
// corpus under a STRICT comparison (whitespace only, never apostrophes), every
// band must carry the full message in its own register, and the teaching that
// makes this lesson ITSELF is checked per band. DR-0818.
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

const ID = 'll219-prudence-and-leaning-not-on-our-own-understanding-his-knowledge-is-the-highest-authority-in-every-dimension';
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

describe('L219 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Prudence, and Leaning Not on Our Own Understanding — His Knowledge Is the Highest Authority in Every Dimension');
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

describe('L219 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ['highest authority', 'all dimensions', 'his knowledge is the highest', 'tells me to be prudent'];
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

describe('L219 — the teaching that makes this lesson itself, per band', () => {
  it('each band grounds prudence in Proverbs 3, where leaning on Him is what directs the walking', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 3:5`).toMatch(/\(Proverbs 3:5(-[67])?\)/);
      expect(band(b), `${b} Proverbs 3:6`).toMatch(/\(Proverbs 3:(5-[67]|6)\)/);
    }
  });
  it('each band defines prudence from the Word, not from a dictionary', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 14:15`).toContain('(Proverbs 14:15)');
      expect(band(b), `${b} Proverbs 22:3`).toContain('(Proverbs 22:3)');
      const says = sentences(band(b)).some((s) => /looketh well to his going|looks (at|where)|foresee/i.test(s));
      expect(says, `${b} never says what prudence does`).toBe(true);
    }
  });
  it('each band says Wisdom herself dwells with prudence', () => {
    for (const b of BANDS) expect(band(b), `${b} Proverbs 8:12`).toContain('(Proverbs 8:12)');
  });
  it('each band gives the reason His Knowledge outranks ours', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 147:5`).toContain('(Psalms 147:5)');
      expect(band(b), `${b} Isaiah 55`).toMatch(/\(Isaiah 55:(8|9|8-9)\)/);
      const says = sentences(band(b)).some((s) => /infinite|higher than|unsearchable/i.test(s));
      expect(says, `${b} never says how much higher`).toBe(true);
    }
  });
  it('each band carries the dimensions, including the darkness', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Daniel 2`).toMatch(/\(Daniel 2:(22|20-22)\)/);
      const says = sentences(band(b)).some((s) => /darkness|secret things|naked and opened/i.test(s));
      expect(says, `${b} never names a dimension`).toBe(true);
    }
  });
  it('each band counts the cost with the Lord’s own example', () => {
    for (const b of BANDS) expect(band(b), `${b} Luke 14:28`).toContain('(Luke 14:28)');
  });
  it('each band goes and looks at the real state instead of trusting a memory of it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 27:23`).toContain('(Proverbs 27:23)');
      const says = sentences(band(b)).some((s) => /state of (thy|the) flocks|go (and )?(look|count|find out)|really true|real state/i.test(s));
      expect(says, `${b} never sends the reader to look`).toBe(true);
    }
  });
  it('each band holds the MEASURE itself to a standard', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 20:10`).toContain('(Proverbs 20:10)');
      const says = sentences(band(b)).some((s) => /same measure|divers|abomination|one standard|same weight|same way every time/i.test(s));
      expect(says, `${b} never says the measure is judged`).toBe(true);
    }
  });
  it('each band proves its own work rather than another person’s', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Thessalonians 5:21`).toContain('(1 Thessalonians 5:21)');
      expect(band(b), `${b} Galatians 6:4`).toContain('(Galatians 6:4)');
    }
  });
  it('each band lands on Romans 12:2 — the proving is for His will', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 12:2`).toContain('(Romans 12:2)');
      const says = sentences(band(b)).some((s) => /will of God|what (He|Yahweh) wants|his will/i.test(s));
      expect(says, `${b} never says the proving is for His will`).toBe(true);
    }
  });
  it('each band leaves the reader able, not weighed: ask, and He gives', () => {
    for (const b of BANDS) expect(band(b), `${b} James 1:5`).toContain('(James 1:5)');
  });
  it('the adult lesson carries the whole ten-movement spine and the standard for a steward', () => {
    expect(L.lesson).toContain('(1 Corinthians 4:2)');
    expect(L.lesson).toContain('(Proverbs 24:3-4)');
    expect(L.lesson).toContain('(Job 38:4)');
    expect(L.lesson).toContain('(Hebrews 4:13)');
    expect(L.lesson).toContain('(Colossians 2:3)');
    expect(L.lesson).toContain('(Romans 11:33)');
    expect(L.lesson).toContain('(Psalms 139:23-24)');
    expect(L.lesson).toContain('(2 Corinthians 13:5)');
    expect(L.lesson).toContain('(1 Corinthians 2:16)');
  });
  it("Darrell's own framing is carried, not paraphrased away", () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said).toMatch(/all dimensions/i);
    expect(said).toMatch(/highest authority/i);
    expect(said).toMatch(/tells (him|me) to be prudent/i);
    expect(said).toMatch(/2026-10-08/);
  });
});
