// @vitest-environment node
//
// L223 — "The Storm You Can See Coming, and the Court Where a Life Hangs":
// what a warning asks of you.
//
// Darrell forwarded NPR's morning newsletter into the app by email on
// 2026-10-08 with one word on top, Lesson (thread 1a11be8ea0e58748). One
// subject line carried two stories: the Gulf preparing as a storm named Isaias
// strengthened into a hurricane, and a judge ordering that execution evidence
// in a capital case be preserved. Two warnings given in advance, and the
// lesson is what a person does with a warning before it is too late.
//
// PROVENANCE, GATED. Both items are carried as that letter's own report on
// that morning and nothing more. A forecast is a forecast, what the storm did
// was NOT verified from this machine and is not claimed, and the court item is
// kept to exactly what the headline said. The lesson recounts no crime, names
// no detail of one, and takes no position on any person's guilt. Tests below
// require all of that to be said in the lesson and require the lesson to stay
// clear of a verdict, because this is the one subject where drifting into
// particulars would do real harm (DR-0076 §8).
//
// AND IT TEACHES RATHER THAN DEBATES (DR-0098). On the sword, Scripture is not
// silent and not of two minds. It authorizes the magistrate (Genesis 9:6;
// Romans 13:4), it sets an evidentiary bar most readers have never seen
// (Numbers 35:30; Deuteronomy 17:6), and it states His own heart (Ezekiel
// 18:23,32). All three are written, so a test requires all three in every
// band: a lesson carrying only one of them would mislead a reader while every
// word in it was true.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under
// a STRICT comparison (whitespace only, never apostrophes). DR-0834.
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

const ID = 'll223-the-storm-you-can-see-coming-and-the-court-where-a-life-hangs-what-a-warning-asks-of-you';
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

describe('L223 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('The Storm You Can See Coming, and the Court Where a Life Hangs — What a Warning Asks of You');
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

describe('L223 — every quoted span is the Word, verbatim, with its reference', () => {
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
    const his = ['seat you sit on', 'all this beauty', 'war all day', 'pigeonhole', 'societal'];
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

describe('L223 — the storm half, in every band', () => {
  it('each band says whose way is in the whirlwind, and that He stills it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Nahum 1:3`).toContain('(Nahum 1:3)');
      expect(band(b), `${b} Psalms 107:29`).toMatch(/\(Psalms 107:(29|28-29)\)/);
      expect(band(b), `${b} Mark 4:39`).toContain('(Mark 4:39)');
    }
  });

  it('each band names Him as the refuge while it blows', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 46:1`).toMatch(/\(Psalms 46:(1|1-2)\)/);
      expect(band(b), `${b} Isaiah 25:4`).toContain('(Isaiah 25:4)');
    }
  });

  it('each band says He ALSO expects a man to move, and that these are not in tension', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 22:3`).toContain('(Proverbs 22:3)');
      expect(band(b), `${b} Proverbs 27:12`).toContain('(Proverbs 27:12)');
      const says = sentences(band(b)).some((s) => /prudent|careful/i.test(s));
      expect(says, `${b} never explains prudent`).toBe(true);
    }
  });

  it('each band gives Noah, and the word the text repeats: ALL of it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Genesis 6:22`).toContain('(Genesis 6:22)');
      expect(band(b), `${b} Genesis 7:5`).toContain('(Genesis 7:5)');
      const says = sentences(band(b)).some((s) => /\bALL\b/.test(s));
      expect(says, `${b} never emphasizes ALL`).toBe(true);
    }
  });

  it('each band sets the same storm against two houses, and names what changed', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Matthew 7:25`).toMatch(/\(Matthew 7:(25|24-25)\)/);
      expect(band(b), `${b} Matthew 7:27`).toMatch(/\(Matthew 7:(27|26-27)\)/);
      const says = sentences(band(b)).some((s) => /foundation|built on|founded/i.test(s));
      expect(says, `${b} never names the foundation as the difference`).toBe(true);
    }
  });
});

describe('L223 — the court half: ALL THREE parts, in every band (DR-0098)', () => {
  it('each band says the Word AUTHORIZES the magistrate', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 13:4`).toContain('(Romans 13:4)');
    }
  });

  it('each band sets the evidentiary bar: never one witness', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Numbers 35:30`).toContain('(Numbers 35:30)');
      expect(band(b), `${b} Deuteronomy 17:6`).toContain('(Deuteronomy 17:6)');
      const says = sentences(band(b)).some((s) => /one witness/i.test(s));
      expect(says, `${b} never says one witness is not enough`).toBe(true);
    }
  });

  it('each band states HIS OWN HEART, which keeps justice from becoming appetite', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ezekiel 18:23`).toContain('(Ezekiel 18:23)');
      expect(band(b), `${b} Ezekiel 18:32`).toContain('(Ezekiel 18:32)');
      expect(band(b), `${b} John 8:7`).toContain('(John 8:7)');
    }
  });

  it('each band says why preserving evidence matters: innocent blood is not given back', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Deuteronomy 19:10`).toContain('(Deuteronomy 19:10)');
      expect(band(b), `${b} Exodus 23:7`).toMatch(/\(Exodus 23:(7|6-7)\)/);
      expect(band(b), `${b} Deuteronomy 19:18`).toMatch(/\(Deuteronomy 19:(18|17-19|16)\)/);
    }
  });

  it('each band brings it to the reader\u2019s own small courts, and lands on Micah 6:8', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 18:17`).toContain('(Proverbs 18:17)');
      expect(band(b), `${b} Micah 6:8`).toContain('(Micah 6:8)');
    }
  });

  it('the grown bands carry the rest of the spine', () => {
    expect(grown).toContain('(Genesis 9:6)');
    expect(grown).toContain('(Proverbs 17:15)');
    expect(grown).toContain('(Proverbs 24:11-12)');
    expect(grown).toMatch(/\(Exodus 23:(1-2|2)\)/);
    expect(grown).toMatch(/\(Job 38:22(-23)?\)/);
    // BOTH errors named as one abomination is the clause that closes the usual argument
    const says = sentences(grown).some((s) => /both (errors|are named)/i.test(s));
    expect(says, 'neither grown band says both errors get the same word').toBe(true);
  });
});

describe('L223 — the handling this subject could have got wrong', () => {
  it('the PROVENANCE is stated: a morning letter, a forecast unverified, the headline only', () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said).toMatch(/newsletter/i);
    expect(said, 'a forecast is named as a forecast').toMatch(/a forecast is a forecast/i);
    expect(said, 'and what the storm did is NOT claimed').toMatch(/not (checked|verified) from/i);
    expect(said, 'the court item kept to the headline').toMatch(/exactly what the headline said/i);
    expect(said).toMatch(/2026-10-08/);
  });

  it('it recounts NO crime and offers NO verdict, in any band or the lesson', () => {
    // The one place where drifting into particulars would do real harm. Every
    // band must say it is teaching the standard, and none may claim guilt.
    const everywhere = [...BANDS.map((b) => [b, band(b)]), ['lesson', L.lesson], ['bigIdea', L.bigIdea], ['inApp', L.inApp]];
    for (const [name, text] of everywhere) {
      expect(text, `${name} must not assert guilt`).not.toMatch(/\b(she|he) (did it|was guilty|committed)\b/i);
      expect(text, `${name} must not recount the crime`).not.toMatch(/\b(murdered|stabbed|tortured)\b/i);
    }
    expect(`${L.bigIdea} ${L.lesson}`, 'the lesson says what it is teaching instead').toMatch(/takes no position on any person\u2019s guilt|takes no position on anybody\u2019s guilt|takes no position on any person's guilt/i);
  });

  it('the standard, not the case, is what the lesson says it teaches', () => {
    expect(`${L.bigIdea} ${L.lesson}`).toMatch(/the STANDARD/);
    expect(L.lesson).toMatch(/a standard is never helped by particulars|a standard is not helped by particulars/i);
  });

  it('the two stories are joined by ONE question, said out loud', () => {
    expect(L.lesson).toMatch(/warning (given|was given)/i);
    expect(L.lesson).toMatch(/before it is too late/i);
  });
});
