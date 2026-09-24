// @vitest-environment node
// =============================================================================
// L191 — Who He Said He Was — Every Hearer, Every Situation, and the Keys of
// Hell and of Death
// =============================================================================
// Darrell, 2026-09-24, three lines into this app, minutes apart:
//
//   "Lesson. Didn't Jesus tell pilot He was from eternity and others in other
//    ways how many ways and what were the situations claims to be?"
//   "What are the keys of hell and death?"
//   "All in the lesson"
//
// Two questions, one lesson, answered FROM THE WORD ONLY (DR-0098) and by
// record rather than summary: sixteen hearers in order, each given the claim
// that hearer could bear, the last of them John on Patmos where the keys are
// named. Every quoted span was fetched from the in-repo KJV before a word was
// written; the movements the answer turns on are pinned so no later edit can
// soften them:
//
//   1. the Pilate correction — what the governor actually heard (John 18:36-37;
//      19:11), and where eternity WAS spoken (John 8:58; John 17:5);
//   2. the hearers are the witnesses to the meaning (John 10:33; 8:59);
//   3. worship received, confessions ratified (John 9:38; 20:28; Matthew 16:17);
//   4. under oath, "I am" (Mark 14:62) with Daniel's Son of man;
//   5. the keys defined by the Word (Isaiah 22:22; Revelation 3:7), the two
//      doors (Revelation 6:8; 20:13), why He holds them (Acts 2:24; Romans 6:9),
//      what the devil lost (Hebrews 2:14-15), what He does with them
//      (John 5:28-29; Revelation 20:14; 21:4).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll191-'));
  expect(m, 'L191 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

describe('L191 is really in the series', () => {
  it('carries all nine fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Who He Said He Was — Every Hearer, Every Situation, and the Keys of Hell and of Death');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref).toContain('Revelation 1:17-18');
    expect(m.anchor.ref).toContain('John 18:36-37');
    expect(m.anchor.ref).toContain('Hebrews 2:14-15');
    expect(m.benefits).toHaveLength(14);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count still equals the module count — the invariant, not a literal', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on EVERY surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(250);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('uses STRAIGHT quotation marks, or the gate would silently check nothing', () => {
    const all = ALL();
    expect(all.includes('“'), 'no curly open quote').toBe(false);
    expect(all.includes('”'), 'no curly close quote').toBe(false);
  });

  it('carries no ellipsis inside a quotation (DR-0459) and recites no record id', () => {
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
    }
  });
});

describe('the answer is the Word’s, and each movement is actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('1. the Pilate correction: what the governor heard, and where eternity WAS spoken', () => {
    carries('My kingdom is not of this world');
    carries('To this end was I born, and for this cause came I into the world');
    carries('Thou couldest have no power at all against me, except it were given thee from above');
    carries('Before Abraham was, I am');
    carries('the glory which I had with thee before the world was');
    // The correction is stated in words, in the adult lesson and in every band —
    // never a silent substitution of what he asked for.
    expect(L().lesson).toMatch(/To Pilate He did not say the word eternity/);
    expect(L().levels.child).toMatch(/did not say the word forever to Pilate/);
    for (const b of ['youth', 'teen', 'senior']) {
      expect(L().levels[b], `${b} must carry the correction`).toMatch(/did not (use|hear) the word eternity/);
    }
  });

  it('2. the hearers are the witnesses to the meaning', () => {
    carries('because that thou, being a man, makest thyself God');
    carries('Then took they up stones to cast at him');
    carries('making himself equal with God');
  });

  it('3. worship received and confessions ratified, never corrected', () => {
    carries('And he worshipped him');
    carries('My Lord and my God');
    carries('flesh and blood hath not revealed it unto thee, but my Father which is in heaven');
    carries('I that speak unto thee am he');
  });

  it('4. under oath, I am — with Daniel’s Son of man', () => {
    carries('And Jesus said, I am');
    carries('coming in the clouds of heaven');
    carries('an everlasting dominion, which shall not pass away');
  });

  it('5. the keys: defined by the Word, two doors, why He holds them, what the devil lost, what He does', () => {
    carries('and have the keys of hell and of death');
    carries('he shall open, and none shall shut; and he shall shut, and none shall open');
    carries('he that hath the key of David');
    carries('Death, and Hell followed with him');
    carries('death and hell delivered up the dead which were in them');
    carries('it was not possible that he should be holden of it');
    carries('death hath no more dominion over him');
    carries('that through death he might destroy him that had the power of death, that is, the devil');
    carries('deliver them who through fear of death were all their lifetime subject to bondage');
    carries('all that are in the graves shall hear his voice');
    carries('And death and hell were cast into the lake of fire');
    carries('there shall be no more death');
    // The Word never gives the devil keys, and the lesson says so in words rather
    // than letting a familiar picture stand in for the text.
    // Sentence-initial 'The devil' is a capitalised NAME by this house's rule
    // (adversary-is-never-capitalized.test.js caught the first draft in CI), so
    // the sentence is built to keep the name lower case mid-sentence.
    expect(L().lesson).toMatch(/the devil never held them, and the Word never says he did/);
    for (const b of FULL_BANDS) {
      expect(L().levels[b], `${b} must say the devil never had the keys`).toMatch(/never (had|held|gives him|assigns him) (the )?keys/);
    }
  });

  it('the count is stated as a count of the record, not a decree', () => {
    expect(L().lesson).toMatch(/more than two dozen distinct ways to sixteen distinct hearers/);
    expect(L().lesson).toMatch(/The Gospels hold more/);
  });

  it('the close turns the question around, and the lesson ends the way this house ends', () => {
    expect(L().lesson).toMatch(/which hearer are you today\?/);
    expect(L().lesson.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    for (const b of FULL_BANDS) expect(L().levels[b].trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`)
        .toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend and the child band is held to the AGE, not the corpus', () => {
    const m = measureLesson(L());
    expect(isInverted(m), 'a lesson authored today must not invert at any rung').toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING),
      `child reads ${m.bands.child.authored}; a lesson written after 2026-09-15 is held to ${NEW_LESSON_CHILD_CEILING}`).toBe(false);
  });

  it('the four bands are genuinely different texts, not one wearing four labels', () => {
    const d = measureDifferentiation(L());
    expect(d, 'all four bands must be present to measure').toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) {
      expect(namesItsLesson(m.title, m.levels[b]), `${b} does not name the lesson in its opening window`).toBe(true);
    }
  });
});
