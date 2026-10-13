// @vitest-environment node
//
// L232 — "The Woman at the Well and the Samaritans Who Believed". Darrell
// spoke it into the app on 2026-10-09 and added to it: the people believed
// because of the woman at the well, Highest Authority; the scroll is the most
// important measure, all of Yahweh's scrolls; and he asked for the Samaritans
// to be researched, not guessed. The gates require BOTH witnesses in every
// band exactly as written: her saying (John 4:39) AND His own Word (John
// 4:41-42); the scroll of Moses that gave her hope (Deuteronomy 18:15; John
// 5:46); the Samaritans' record both ways (2 Kings 17:33; Luke 10:33; Luke
// 17:16); and the archaeology stated in three tiers, with the Mount Ebal
// claim named as not established (DR-0100). DR-0856.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0076, DR-0098.
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

const ID = 'll232-the-woman-at-the-well-and-the-samaritans-who-believed-the-scroll-her-saying-and-his-own-word';
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
const EVERY_BAND = ["John 4:4", "John 4:9", "John 4:7", "John 4:10", "John 4:14", "John 4:20", "John 4:23", "John 4:25", "John 4:26", "John 4:29", "John 4:39", "John 4:41", "John 4:42", "Romans 10:17", "Deuteronomy 18:15", "John 5:46", "John 5:39", "John 20:31", "2 Kings 17:33", "John 4:22", "Luke 10:33", "Luke 10:37", "Luke 17:16", "Acts 1:8", "Acts 8:8", "Matthew 5:17", "Hebrews 10:4", "John 1:29", "Revelation 19:16", "Isaiah 2:4", "John 16:33", "Matthew 6:10"];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = ["(John 4:40)", "(2 Kings 17:6)", "(Numbers 6:24-26)", "(Hebrews 10:1)", "(Galatians 3:24)", "(Hebrews 10:14)", "(Matthew 28:18)", "(Romans 8:2)", "(1 Corinthians 2:14)", "(Luke 24:45)"];

describe('L232 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe("The Woman at the Well and the Samaritans Who Believed — the Scroll, Her Saying, and His Own Word");
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

describe('L232 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ["Highest Authority", "most important measure", "I have no idea"];
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

describe('L232 — the whole spine, in every band', () => {
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
  it('every band carries BOTH witnesses: her saying and His own Word', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/believed on him for the saying of the woman,[^"]*" \(John 4:39\)/);
      expect(band(b), `${b}`).toMatch(/"And many more believed because of his own word;" \(John 4:41\)/);
      expect(band(b), `${b}`).toMatch(/\(John 4:42\)/);
    }
  });
  it('every band names the scroll that gave her hope (Deuteronomy 18:15; John 5:46)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/\(Deuteronomy 18:15\)/);
      expect(band(b), `${b}`).toMatch(/for he wrote of me\." \(John 5:46\)/);
    }
  });
  it("every band keeps the Samaritans' record both ways, as written", () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"They feared the LORD, and served their own gods," \(2 Kings 17:33\)/);
      expect(band(b), `${b}`).toMatch(/\(Luke 10:33\)/);
      expect(band(b), `${b}`).toMatch(/\(Luke 17:16\)/);
    }
  });
  it('every band answers the research honestly: not the oldest writing, the finds are real, the oldest Scripture is the priestly blessing', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/(oldest|earliest) writing/i);
      expect(band(b), `${b}`).toMatch(/\(Numbers 6:24(-26)?\)/);
      expect(band(b), `${b}`).toMatch(/eight hundred and forty/);
    }
    for (const b of ['youth', 'teen', 'senior']) expect(band(b), `${b}`).toMatch(/Mount Ebal[^.]*\.[^.]*(not proven|not established)|not (proven|established)/);
    expect(L.lesson).toMatch(/so that claim is not established/);
  });
  it('every band carries what the sacrifices could not do and the Lamb who did', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/"For it is not possible that the blood of bulls and of goats should take away sins\." \(Hebrews 10:4\)/);
      expect(band(b), `${b}`).toMatch(/\(John 1:29\)/);
      expect(band(b), `${b}`).toMatch(/"KING OF KINGS, AND LORD OF LORDS\." \(Revelation 19:16\)/);
    }
  });
});
