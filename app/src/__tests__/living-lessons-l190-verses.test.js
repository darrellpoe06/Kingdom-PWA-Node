// @vitest-environment node
// =============================================================================
// L190 — Were the Parables Real? — the One Who Made the Ages Told Them
// =============================================================================
// Darrell, 2026-09-23, one line into this app:
//
//   "Lesson. How do we know of the stories or parables Jesus told were real
//    or not? They could be from other timelines in other ages..."
//
// A question, not a teaching — so the lesson answers it FROM THE WORD ONLY
// (DR-0098: teach the Word, do not platform man's disagreement) and stops
// where the Word stops (Deuteronomy 29:29). Every claim below was checked
// against the in-repo KJV before a word was written; the movements the answer
// turns on are pinned so no later edit can soften them:
//
//   1. the form was chosen and PROPHESIED (Matthew 13:34-35 / Psalm 78:2);
//   2. the Word labels its own genres (likeness: Matthew 13:24; record:
//      Luke 1:2-4, 2 Peter 1:16, John 21:24);
//   3. a story can be invented and its verdict true (2 Samuel 12:1-7);
//   4. the Teller made the AGES (Hebrews 1:2; John 8:58; Hebrews 13:8);
//   5. other timelines are the Word's silence, and we do not fill it
//      (Deuteronomy 29:29; 1 Timothy 1:4; Colossians 2:8).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll190-'));
  expect(m, 'L190 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

describe('L190 is really in the series', () => {
  it('carries all nine fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Were the Parables Real? — the One Who Made the Ages Told Them');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref).toContain('Matthew 13:34-35');
    expect(m.anchor.ref).toContain('2 Samuel 12:7');
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
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(180);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    // A quoted phrase with no reference is a claim the gate cannot check. The
    // first draft carried one ("in order", Luke 1:3) three times; this is the
    // pin that keeps the next draft from doing it.
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

  it('1. the form was chosen on purpose and PROPHESIED', () => {
    carries('without a parable spake he not unto them');
    carries('I will open my mouth in a parable: I will utter dark sayings of old');
    carries('as they were able to hear it');
  });

  it('2. the Word labels its own genres — likeness AND record, both quoted', () => {
    carries('The kingdom of heaven is likened unto a man which sowed good seed in his field');
    carries('which from the beginning were eyewitnesses, and ministers of the word');
    carries('we have not followed cunningly devised fables');
    carries('we know that his testimony is true');
  });

  it('3. Nathan: an invented story and a true verdict, told to its end', () => {
    carries('There were two men in one city; the one rich, and the other poor');
    carries('one little ewe lamb');
    carries('the man that hath done this thing shall surely die');
    carries('Thou art the man');
  });

  it('4. the Teller made the AGES — the second half of his question, from the Word', () => {
    carries('by whom also he made the worlds');
    carries('Before Abraham was, I am');
    carries('Jesus Christ the same yesterday, and to day, and for ever');
    carries('there is no new thing under the sun');
    carries('things which have been kept secret from the foundation of the world');
    carries('the Lamb slain from the foundation of the world');
  });

  it('5. other timelines are the Word’s SILENCE, and the lesson says so instead of filling it', () => {
    carries('The secret things belong unto the LORD our God');
    carries('Neither give heed to fables and endless genealogies');
    carries('Beware lest any man spoil you through philosophy and vain deceit');
    // Reticence is a claim too: the lesson must say the Word does not describe
    // other timelines, in words, in the adult lesson and in every band. (The
    // quiz carries "Jesus visited other timelines" as a WRONG option on purpose,
    // so the check is on the teaching text, not on every surface.)
    expect(L().lesson).toMatch(/never describes other timelines/);
    for (const b of FULL_BANDS) {
      expect(L().levels[b], `${b} must carry the reticence`).toMatch(/(never|nowhere|does not) (talks? about|describes?) other timelines/);
    }
    const wrongOption = L().quiz.questions[3].options[0];
    expect(wrongOption).toMatch(/Jesus visited other timelines/);
    expect(L().quiz.questions[3].answer).not.toBe(0);
  });

  it('the one named parable is handled without invention', () => {
    carries('there was a certain beggar named Lazarus');
    expect(L().lesson).toMatch(/The Word does not say\. So this lesson does not say/);
  });

  it('the close turns the question around, and the lesson ends the way this house ends', () => {
    carries('Wherefore by their fruits ye shall know them');
    carries('the words that I speak unto you, they are spirit, and they are life');
    expect(L().lesson.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
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
