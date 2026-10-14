// @vitest-environment node
// =============================================================================
// L244 — The Heavens Declare: what creation testifies, and the clocks (DR-1027)
// =============================================================================
// THE LAST UNMINED TEACHING IN PR #1255, and with it that PR holds nothing the
// series lacks. It was written 2026-08-15 on that branch as its own "L79",
// against a catalog of 81 modules, from a video conversation between Taylor
// Welch and Hugh Ross and Fuz Rana of Reasons to Believe.
//
// WHAT WAS ACTUALLY ABSENT FROM MAIN, measured and not assumed. The lesson's
// three-bucket FRAME already lives at ll213. What did not exist anywhere in
// app/src was the MEASUREMENT-HONESTY half: `radiocarbon`, `potassium-argon`,
// `uranium-lead`, `samarium`, `stratigraph` — every one of those returned ZERO
// hits against main at 7e6f254ca. So this lesson is not a second copy of
// ll213; it is the half ll213 never carried.
//
// AND #1255's GATE IS NOT MINED, DELIBERATELY. That branch also carried
// scripts/lesson-quote-guard.mjs with a 558-line baseline under its own
// DR-0305, "The verbatim gate claimed every quoted Scripture and read one
// field of thirteen — the child band was the least-gated prose in the
// repository". Two facts settle it: main's DR-0305 is a DIFFERENT and earlier
// decision (the audit-log delta record, 2026-08-14, PR #1239), so that record
// cannot merge as numbered; and the FINDING is already closed here by
// quotation-integrity plus the curriculum course-quotation checks. That is not
// an inference — building this lesson, those instruments caught faults in
// levels.youth, levels.teen, the facilitator notes and a quiz option, which
// are exactly the fields DR-0305 said nothing ever checked.
//
// THE DOCTRINAL LOAD-BEARING POINT, which every band must carry: the timetable
// is HELD OPEN. These scholars teach day-age; this house adopts neither it nor
// its opposite, because the Word does not make the timetable its point. That
// is a recorded position, not indecision, and its purpose is to keep a brother
// reading ordinary days and a brother reading ages both inside the family. A
// band that quietly settles the days would overwrite a house position through a
// video summary, which is how positions actually drift.
//
// WHAT THESE CHECKS CAUGHT WHILE WRITING, every one mine and mechanical:
//   · THREE STRAIGHT APOSTROPHES inside quotations — "man's heart" twice
//     (Proverbs 16:9) and "man's blood" (Genesis 9:6) — where the corpus
//     carries U+2019. Third lesson in a row for this class, and it was
//     predicted out loud before it happened and typed anyway, which is why it
//     is pinned below rather than merely noted.
//   · TWO CAPITALISED QUOTE OPENINGS: 2 Peter 3:8 reads "that one day is with
//     the Lord", lower case, and it was capitalised to start a sentence. Same
//     class as L242's "Let him shew".
//   · TWO TERMINAL MARKS belonging to the host sentence, both in the ORIGINAL
//     module's prose: "be ye transformed," where Romans 12:2 has no comma
//     there, and "without excuse." where Romans 1:20 ends with a colon.
//
// WHAT THE 2026-08 MODULE WAS SHORT OF BY TODAY'S STANDARD: no youth band at
// all; child 0.12, teen 0.23, senior 0.36 of adult prose against floors of
// 0.50/0.60/0.60; the child band ABOVE the 5.0 ceiling at 5.15 while also
// being a fifth of the length it owed; three bands never naming their own
// lesson; two elisions; two recited record ids; TALK directions missing from
// all four places it had; and no stories.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const ID = 'll244-the-heavens-declare-and-the-timetable-is-held-open';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};

// The measurement-honesty strands — the half of this teaching that existed
// NOWHERE in main — pinned so losing them fails the build.
const CLOCKS = ['radiocarbon', 'potassium-argon', 'uranium-lead', 'samarium-neodymium', 'stratigraph'];

// Every verse the lesson leans on, pinned by a real span.
const STRANDS = [
  ['natural revelation leaves no excuse', 'Romans', 1, 20, 'being understood by the things that are made'],
  ['the sky is doing a job right now', 'Psalms', 19, 1, 'The heavens declare the glory of God'],
  ['named individually, and none missing', 'Isaiah', 40, 26, 'he calleth them all by names'],
  ['framed by the word, not from existing stock', 'Hebrews', 11, 3, 'the worlds were framed by the word of God'],
  ['the gap between speaking and existing is nothing', 'Genesis', 1, 3, 'Let there be light: and there was light'],
  ['what is held with full confidence', 'Genesis', 1, 1, 'In the beginning God created the heaven and the earth'],
  ['and that it was very good', 'Genesis', 1, 31, 'it was very good'],
  ['the secret things stay His', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God'],
  ['measurement is a moral category', 'Leviticus', 19, 36, 'Just balances, just weights, a just ephah, and a just hin'],
  ['a tool past its range is a false balance', 'Proverbs', 11, 1, 'A false balance is abomination to the LORD'],
  ['the image is conferred', 'Genesis', 1, 27, 'in the image of God created he him'],
  ['and the life is breathed', 'Genesis', 2, 7, 'breathed into his nostrils the breath of life'],
  ['the ages set in the heart, and its limit', 'Ecclesiastes', 3, 11, 'he hath set the world in their heart'],
  ['searching a matter out is honourable', 'Proverbs', 25, 2, 'the honour of kings is to search out a matter'],
  ['Yahweh measures, with a line', 'Job', 38, 5, 'who hath stretched the line upon it'],
  ['the posture every party shares', 'Job', 38, 4, 'Where wast thou when I laid the foundations of the earth'],
  ['transformation is passive', 'Romans', 12, 2, 'but be ye transformed by the renewing of your mind'],
  ['and the agency is named', 'Philippians', 2, 13, 'For it is God which worketh in you'],
  ['capability affirmed, and that is the problem', 'Genesis', 11, 6, 'nothing will be restrained from them'],
];

describe('L244 exists, is numbered, and is dated', () => {
  it('is in the catalog exactly once', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
  });

  it('takes 244 and leaves the 79/211/212 gaps alone', () => {
    const claimed = LIVING_LESSONS_MODULES
      .map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 244)).toHaveLength(1);
    for (const n of [79, 211, 212]) {
      expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
    }
  });

  it('carries the commit day, and never precedes the lesson numbered before it', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-14');
    const before = Object.entries(LIVING_LESSONS_ADDED).find(([k]) => k.startsWith('ll243-'));
    expect(before, 'll243 is dated').toBeTruthy();
    expect(LIVING_LESSONS_ADDED[ID] >= before[1]).toBe(true);
  });
});

describe('the measurement-honesty half, which existed nowhere in main', () => {
  it.each(CLOCKS)('teaches %s somewhere in the lesson', (term) => {
    expect(whole.toLowerCase()).toContain(term);
  });

  it('says what radiocarbon dates, and that it is a death and not a rock', () => {
    for (const k of ['adult', 'child', 'youth', 'teen', 'senior']) {
      expect(/once-living|was alive|were alive/i.test(TEXTS[k]), `${k} never says what it dates`).toBe(true);
      // The senior band states the same fact in its own register — "elapsed
      // time since a once-living organism ceased carbon exchange" — so the
      // check accepts that phrasing rather than forcing the word "death" into
      // eldership prose. The regex was narrower than the lesson, not the
      // lesson narrower than the point.
      expect(/death|died|dies|ceased carbon exchange/i.test(TEXTS[k]), `${k} never says it dates a death`).toBe(true);
    }
  });

  it('states the ceiling, in every band', () => {
    for (const k of ALL) {
      expect(/fifty|50,000|50,?000/i.test(TEXTS[k]), `${k} drops the ceiling`).toBe(true);
    }
  });

  it('refuses the argument in BOTH directions, not just the convenient one', () => {
    // The whole point of the arm: the wrong-instrument error belongs to
    // whoever is holding it, and the gate is that both sentences appear.
    for (const k of ['adult', 'child', 'youth', 'teen', 'senior']) {
      expect(/either direction|both directions|wrong tool|wrong instrument/i.test(TEXTS[k]), `${k} drops the symmetry`).toBe(true);
      expect(/young|lands on nothing|never (claimed|said)/i.test(TEXTS[k]), `${k} never answers the young-earth misuse`).toBe(true);
    }
  });

  it('keeps stratigraphy as ORDER and not as an age', () => {
    for (const k of ['adult', 'child', 'youth', 'teen', 'senior']) {
      expect(/order/i.test(TEXTS[k]), `${k} drops order-not-age`).toBe(true);
    }
  });
});

describe('the timetable stays open, in every band', () => {
  it('says the house holds it open and adopts NEITHER reading', () => {
    for (const k of ALL) {
      expect(/open/i.test(TEXTS[k]), `${k} never says it is held open`).toBe(true);
    }
  });

  it('never quietly settles the length of the days', () => {
    // A band that concluded the question would overwrite a recorded house
    // position through a video summary. This is the check that forbids it.
    for (const k of ALL) {
      expect(/the days (were|are) (ordinary|literal|long ages|ages)\b(?!.{0,40}(or|and))/i.test(TEXTS[k]),
        `${k} appears to settle the days`).toBe(false);
    }
  });

  it('keeps both brothers inside the family, explicitly', () => {
    for (const k of ['adult', 'child', 'youth', 'teen', 'senior']) {
      expect(/believers differ|both of them|sincere believers|one of them (is )?out|family/i.test(TEXTS[k]),
        `${k} never protects the other reading`).toBe(true);
    }
  });

  it('handles 2 Peter 3:8 as patience and not as a conversion factor', () => {
    for (const k of ['adult', 'youth', 'teen']) {
      expect(/patience|forbearance|unrepentant|unsaved/i.test(TEXTS[k]), `${k} drops Peter's actual subject`).toBe(true);
    }
  });
});

describe('the three buckets, and the ordering that holds', () => {
  it('names all three in every band that can carry them', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(/STATES|states/.test(TEXTS[k]), `${k} drops bucket one`).toBe(true);
      expect(/MEASURED|measured/.test(TEXTS[k]), `${k} drops bucket two`).toBe(true);
      expect(/REASONED|reasoned/.test(TEXTS[k]), `${k} drops bucket three`).toBe(true);
    }
  });

  it('puts the image BEFORE the neuroanatomy, never after it', () => {
    for (const k of ['adult', 'child', 'youth', 'teen', 'senior']) {
      expect(/would (not )?(move|shift|change)|not because of a parietal|survive its complete revision|not the foundation/i.test(TEXTS[k]),
        `${k} never states the dependency direction`).toBe(true);
    }
  });

  it('credits their method rather than sniffing at it', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(/cross-check|cross-verif|independent/i.test(TEXTS[k]), `${k} withholds the credit due`).toBe(true);
    }
  });

  it('declines to repeat their specific figures as established', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(/not (repeated|verified)|have not (verified|checked)|not .{0,20}established/i.test(TEXTS[k]),
        `${k} never marks the figures unverified`).toBe(true);
    }
  });

  it('carries BOTH guards, including the one aimed at us', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(/knowledge/i.test(TEXTS[k]), `${k} drops the 1 Timothy 6:20 correction`).toBe(true);
    }
  });
});

describe('every quoted span is the verse', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');

  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(80);
  });

  it('every referenced span is verbatim in the verse it cites', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) {
        bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
      }
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('uses the corpus apostrophe inside quotations (proven-to-catch, third lesson running)', () => {
    for (const s of spans) {
      expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
    }
    const p = verse('Proverbs', 16, 9);
    expect(p.includes('A man’s heart deviseth his way')).toBe(true);
    expect(p.includes("A man's heart deviseth his way"), 'the straight form is NOT the verse').toBe(false);
  });

  it('does not capitalise a mid-verse opening (proven-to-catch)', () => {
    // 2 Peter 3:8 reads "that one day is with the Lord" — lower case.
    const v = verse('2Peter', 3, 8);
    expect(v && v.includes('one day is with the Lord')).toBe(true);
    expect(whole.includes('"One day is with the Lord'), 'a sentence-initial capital was pushed into the verse').toBe(false);
  });

  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it('carries a youth band at all — the hole the 2026-08 module had', () => {
    expect(typeof L.levels.youth).toBe('string');
    expect(measured.bands.youth.words).toBeGreaterThan(2000);
  });

  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, senior: L.levels.senior.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('senior');
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });

  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });
});

describe('the ladder rises, and the child band came DOWN to get there', () => {
  const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));

  it('is not inverted', () => {
    expect(isInverted(measureLesson(L))).toBe(false);
  });

  it('keeps the child band under the ceiling it STARTED above', () => {
    // As mined it read 5.15 against a 5.0 ceiling while carrying a fifth of
    // the words it owed. It had to get longer and simpler at the same time.
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
  });

  it('steps clearly at every rung', () => {
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('it carries its two stories, which the mined module had none of', () => {
  it('carries two real stories, one light and one solemn', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
  });

  it('holds no double-quoted span, so it cannot grow the terminal debt', () => {
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });

  it('teaches this lesson rather than decorating it', () => {
    const bodies = L.stories.map((s) => `${s.title} ${s.body}`).toString().toLowerCase();
    expect(/range|scale/.test(bodies), 'neither story reaches the instrument past its range').toBe(true);
    expect(/days|certainty|open/.test(bodies), 'neither story reaches the held-open question').toBe(true);
  });
});

describe('Yahweh in our voice, the quotations untouched (DR-0210)', () => {
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });

  it('leaves "God" exactly as the verses carry it', () => {
    expect(whole.includes('In the beginning God created the heaven and the earth')).toBe(true);
    expect(whole.includes('The heavens declare the glory of God')).toBe(true);
  });
});
