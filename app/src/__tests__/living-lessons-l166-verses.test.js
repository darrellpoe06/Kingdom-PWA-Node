// @vitest-environment node
//
// L166 — "Life Is Disrespectful, So Think On These Things": self against the
// servant-king, and the One who bought you twice.
//
// Darrell, 2026-09-17, spoken into this channel (rendered for meaning, DR-0331):
// "The reason you have to think on the whatever is good, kind, just... is
// because life is so disrespectful that if you don't focus on that, you will
// become the evil version of yourself... self is like selfishness or
// fleshiness... everybody's a servant and a king at the same time... he
// purchased us twice... blood in blood out... Humble yourself under the mighty
// hand of the Lord."
//
// WHAT THIS LESSON COULD MOST EASILY HAVE GOT WRONG, and why several checks
// below are shaped as they are.
//
//   1. THE REASON IS THE LESSON. L6 already teaches the Philippians 4:8 filter.
//      What is new here is the REASON Darrell gave it — life is disrespectful,
//      and an unfiltered mind becomes the evil version of itself. A band that
//      kept the eight questions and dropped the reason would be a duplicate of
//      L6 wearing a new title, so the reason is checked per band.
//   2. "BLOOD IN, BLOOD OUT" IS A STREET PHRASE, and it needed correcting, not
//      merely repeating. In the street version the blood both ways is YOURS.
//      In the covenant the blood that brought you in was HIS, and there is no
//      way out on offer (John 10:28-29; Hebrews 13:5; Romans 8:39). Every band
//      must carry that correction, and no band may present the phrase as
//      though the Word said it.
//   3. SERVANT AND KING MUST BE HELD TOGETHER. Drop the king and the lesson
//      teaches self-erasure; drop the servant and it teaches a tyrant. Both
//      halves are checked per band, along with both named failures.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
// STRICT: whitespace only, never apostrophes. Nine ASCII-apostrophe
// alterations reached L165 because the verifier normalised U+2019 in BOTH
// directions and so forgave the very character it was checking (DR-0076).
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// NO leading-numeral rewriting of the book name. A version of this helper
// elsewhere mapped /^(i|1st)/ to '1' and silently turned "isaiah" into
// "1saiah", reporting "no such book" for every Isaiah quotation; it went
// unnoticed because the lesson it was written for quoted no Isaiah. The corpus
// filenames already carry their digits (1Corinthians.json).
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
/** Our authored prose with every quotation of the Word removed. For checks
 *  about what WE say, so a quotation can never stand in for the teaching. */
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);

describe('L166 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Life Is Disrespectful, So Think On These Things — Self Against the Servant-King, and the One Who Bought You Twice');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
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
});

describe('L166 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(220);
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
    expect(checked).toBeGreaterThan(220);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = [
      'life is so disrespectful', 'the evil version of yourself', 'blood in, blood out',
      'servant and a king at the same time', 'purchased us twice', 'fleshiness',
    ];
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

describe('L166 — the REASON, which is what makes this not a second L6', () => {
  it('each band says life is disrespectful', () => {
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(disrespectful|life is rude|rude)/i.test(s));
      expect(says, `${b} never says life is disrespectful`).toBe(true);
    }
  });

  it('each band names the outcome of an UNFILTERED mind, in its own register', () => {
    // The teaching, not a keyword: without the filter you become the worse
    // version of yourself. The child band says "the mean version of you"; the
    // others say "the evil version of yourself". Either wording is accepted,
    // the absence is not (never require the adult's phrasing from a child).
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /(evil version of|mean version of)/i.test(s));
      expect(says, `${b} never names what an unfiltered mind becomes`).toBe(true);
    }
  });

  it('each band walks the CHAIN rather than asserting it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 23:7`).toContain('(Proverbs 23:7)');
      expect(band(b), `${b} Jeremiah 17:9`).toContain('(Jeremiah 17:9)');
      expect(band(b), `${b} Matthew 12:34`).toContain('(Matthew 12:34)');
      expect(band(b), `${b} Matthew 12:35`).toContain('(Matthew 12:35)');
    }
  });

  it('each band quotes the filter whole and treats the eight as gates', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('"Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things." (Philippians 4:8)');
      const gates = sentences(band(b)).some((s) => /(eight questions|each one (is )?a gate|every one (of them )?a gate|gate)/i.test(s));
      expect(gates, `${b} never treats the eight as gates`).toBe(true);
    }
  });

  it('each band settles the strategy: you do not answer disrespect in kind', () => {
    for (const b of BANDS) expect(band(b), `${b} Romans 12:21`).toContain('(Romans 12:21)');
  });
});

describe('L166 — self is denied, not improved', () => {
  it('each band gives Darrell’s own definition of self', () => {
    for (const b of BANDS) {
      const defined = sentences(band(b)).some((s) => /(selfish|fleshi|fleshy|all about you)/i.test(s));
      expect(defined, `${b} never defines self`).toBe(true);
    }
  });

  it('each band carries the war inside, and the daily denial', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Galatians 5:17`).toContain('(Galatians 5:17)');
      expect(band(b), `${b} Luke 9:23`).toContain('(Luke 9:23)');
      const daily = sentences(band(b)).some((s) => /daily/i.test(s));
      expect(daily, `${b} never says daily`).toBe(true);
    }
  });
});

describe('L166 — servant AND king, both at once', () => {
  it('each band carries the KING half', () => {
    for (const b of BANDS) {
      const king = /\(Revelation 5:10\)|\(Revelation 1:6\)/.test(band(b));
      expect(king, `${b} drops the king half`).toBe(true);
      expect(band(b), `${b} 1 Peter 2:9`).toContain('(1 Peter 2:9)');
    }
  });

  it('each band carries the SERVANT half, with the King doing it first', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Mark 10:44`).toContain('(Mark 10:44)');
      expect(band(b), `${b} Matthew 20:28`).toContain('(Matthew 20:28)');
      expect(band(b), `${b} John 13:14`).toContain('(John 13:14)');
    }
  });

  it('each band names BOTH failures, so it curdles into neither', () => {
    // A king who will not serve, and a servant who forgets he is a king. Drop
    // either sentence and the lesson teaches half a truth.
    for (const b of BANDS) {
      const tyrant = /(tyrant|bully)/i.test(band(b));
      const usedUp = /(gets used|pushed around|used up)/i.test(band(b));
      expect(tyrant, `${b} never names the king who will not serve`).toBe(true);
      expect(usedUp, `${b} never names the servant who forgets he is a king`).toBe(true);
    }
  });
});

describe('L166 — purchased twice, and both purchases are in the Word', () => {
  it('each band carries the MAKING and the BUYING BACK', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 100:3 (the making)`).toContain('(Psalms 100:3)');
      expect(band(b), `${b} Isaiah 43:1 (the buying back)`).toContain('(Isaiah 43:1)');
      expect(band(b), `${b} 1 Corinthians 6:20`).toContain('(1 Corinthians 6:20)');
    }
  });

  it('each band names the currency, so nobody mistakes it for money', () => {
    for (const b of BANDS) expect(band(b), `${b} 1 Peter 1:19`).toContain('(1 Peter 1:19)');
  });

  it('each band draws the conclusion about whose orders you take', () => {
    for (const b of BANDS) expect(band(b), `${b} 1 Corinthians 7:23`).toContain('(1 Corinthians 7:23)');
  });
});

describe('L166 — blood in, blood out, CORRECTED', () => {
  it('each band grants the first half from the Word', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Leviticus 17:11`).toContain('(Leviticus 17:11)');
      expect(band(b), `${b} Hebrews 9:22`).toContain('(Hebrews 9:22)');
    }
  });

  it('each band says the blood that brought you in was HIS', () => {
    // The correction, not the phrase. A band that repeated the street saying
    // and left it uncorrected would be teaching an oath that holds men by fear.
    for (const b of BANDS) {
      const his = sentences(band(b)).some((s) => /(blood was His|blood that brought you in was His|the blood is yours|blood going in is yours)/i.test(s));
      expect(his, `${b} never corrects whose blood brought you in`).toBe(true);
    }
  });

  it('each band says there is no way OUT, from the Word', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 10:28`).toContain('(John 10:28)');
      const noOut = sentences(band(b)).some((s) => /(no out|no way out|never perish|nobody can pull you out|cannot be plucked)/i.test(s));
      expect(noOut, `${b} never says there is no way out`).toBe(true);
    }
  });

  it('the street phrase is named as a street phrase, never as Scripture', () => {
    for (const b of BANDS) {
      const named = sentences(band(b)).some((s) => /(street)/i.test(s));
      expect(named, `${b} never says the phrase comes from the street`).toBe(true);
    }
  });
});

describe('L166 — humble yourself under the mighty hand', () => {
  it('each band carries 1 Peter 5:6 and reads the two words together', () => {
    // MEASURED OUTSIDE THE QUOTATIONS, not by sentence. The first version of
    // this check split the band into sentences and excluded the one containing
    // the verse — but the child band writes "(1 Peter 5:6) Mighty hand.
    // Strong." with no full stop between the reference and the comment, so the
    // splitter glued our own words onto the quotation and the check reported a
    // band that plainly does the thing as failing to do it. Stripping the
    // quoted spans asks the real question: does OUR prose say it?
    for (const b of BANDS) {
      expect(band(b), b).toContain('"Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time:" (1 Peter 5:6)');
      expect(ourVoice(band(b)), `${b} never reads mighty hand as two words in our own voice`).toMatch(/mighty hand/i);
    }
  });

  it('each band leaves the lifting to Him, on His clock', () => {
    for (const b of BANDS) {
      expect(ourVoice(band(b)), `${b} never leaves the lifting to Him`).toMatch(/His time|His clock|in due time|He lifts you/i);
    }
  });
});

describe('L166 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God in OUR prose, in any band or the base', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      const ours = text.replace(ALL_SPANS, ' ');
      if (/\bGOD\b|\bGod\b/.test(ours)) offences.push(path);
    }
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('and Yahweh is named in our voice, not merely absent of the alternative', () => {
    for (const b of BANDS) expect(band(b).match(/Yahweh/g) || [], b).not.toHaveLength(0);
    expect((L.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it("the KJV's own God and LORD are left exactly as written inside every quotation", () => {
    let sawGod = 0; let sawLord = 0;
    for (const [, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\bGod\b/.test(span)) sawGod += 1;
        if (/\bLORD\b/.test(span)) sawLord += 1;
        expect(/Yahweh/.test(span), `Yahweh substituted into a quotation: ${span.slice(0, 60)}`).toBe(false);
      }
    }
    expect(sawGod, 'no quotation carries the KJV God — the sweep this guards against may already have run').toBeGreaterThan(10);
    expect(sawLord).toBeGreaterThan(3);
  });
});
