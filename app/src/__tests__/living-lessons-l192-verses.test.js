// @vitest-environment node
// =============================================================================
// L192 — Two Hours Became Six — the Pattern, the Yea, the Inspection, and the
// Faithful Man
// =============================================================================
// Darrell, 2026-09-24, spoken into this app from a real job: a contractor
// agreed to detailed specifics on a video call with four people in the
// conversation, said it was clear, said two hours; six hours later the work
// was about six parts in ten of the plan and four parts in ten of something
// else. His two questions: how does the Word have us work through such
// relationships, and how do we edify, build and promote while not accepting
// what undermines and cannot be sustained? "Word first, lessons."
//
// Answered FROM THE WORD ONLY (DR-0098), by a builder's vocabulary the Word
// itself supplies. Every quoted span was fetched from the in-repo KJV before
// a word was written; the movements are pinned so no later edit can soften
// them:
//
//   1. the pattern is how Yahweh builds (Exodus 25:40; 39:42-43; Genesis 6:22);
//   2. a stated time is a vow (Matthew 5:37; James 5:12; Ecclesiastes 5:5;
//      Matthew 21:30);
//   3. witnesses establish the agreement (2 Corinthians 13:1; Amos 3:3);
//   4. inspection precedes blessing, and early (Exodus 39:43; Nehemiah 2:15;
//      Luke 16:10);
//   5. correction alone, plain, in love (Matthew 18:15; Ephesians 4:15;
//      Proverbs 27:5-6);
//   6. the settlement is just in both directions (Leviticus 19:13;
//      Matthew 20:13; Proverbs 11:1);
//   7. faithfulness is the qualification (1 Corinthians 4:2; Proverbs 25:19;
//      Matthew 25:21);
//   8. edify and refuse in one verse (1 Thessalonians 5:14;
//      2 Thessalonians 3:15); and the beam (Matthew 7:5).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll192-'));
  expect(m, 'L192 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

describe('L192 is really in the series', () => {
  it('carries all nine fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Two Hours Became Six — the Pattern, the Yea, the Inspection, and the Faithful Man');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref).toContain('Exodus 39:42-43');
    expect(m.anchor.ref).toContain('Matthew 18:15');
    expect(m.anchor.ref).toContain('1 Corinthians 4:2');
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
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(220);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    // The first draft quoted Darrell's own "put this specifically here" in
    // quote marks three times; his words are rendered, never quoted as if
    // they were the Word (DR-0331). This pin keeps it so.
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

  it('carries no ellipsis inside a quotation (DR-0459), recites no record id, and states no bare statistic', () => {
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
      // The case is told as "six parts in ten", never as a percentage the
      // research-integrity gate would read as an unattributed statistic.
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });
});

describe('the answer is the Word’s, and each movement is actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('1. the pattern is how Yahweh builds — specification is not pettiness', () => {
    carries('look that thou make them after their pattern, which was shewed thee in the mount');
    carries('according to all that God commanded him, so did he');
    carries('in wisdom, and in understanding, and in knowledge, and in all manner of workmanship');
  });

  it('2. a stated time is a vow, and the Word already named the clear yes with a different result', () => {
    carries('let your yea be yea; and your nay, nay');
    carries('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay');
    carries('I go, sir: and went not');
  });

  it('3. four in the room: the agreement is established', () => {
    carries('In the mouth of two or three witnesses shall every word be established');
    carries('Can two walk together, except they be agreed?');
  });

  it('4. inspection precedes blessing — Moses looked upon ALL the work — and the look is early', () => {
    carries('And Moses did look upon all the work, and, behold, they had done it as the LORD had commanded, even so had they done it: and Moses blessed them');
    carries('viewed the wall');
    carries('He that is faithful in that which is least is faithful also in much');
    // The operational close is stated in words in the adult text and every band.
    expect(L().lesson).toMatch(/first piece placed|first piece/);
    for (const b of FULL_BANDS) expect(L().levels[b], `${b} must say to look early`).toMatch(/first piece|hour one|first element|first hour/);
  });

  it('5. correction alone, plain, in love — to gain the brother', () => {
    carries('go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother');
    carries('speaking the truth in love');
    carries('Open rebuke is better than secret love');
    carries('Faithful are the wounds of a friend');
  });

  it('6. the settlement is just in both directions', () => {
    carries('the wages of him that is hired shall not abide with thee all night until the morning');
    carries('didst not thou agree with me for a penny?');
    carries('a just weight is his delight');
    expect(L().lesson).toMatch(/both directions|both ways/);
  });

  it('7. faithfulness is the qualification for the next job', () => {
    carries('it is required in stewards, that a man be found faithful');
    carries('Confidence in an unfaithful man in time of trouble is like a broken tooth, and a foot out of joint');
    carries('thou hast been faithful over a few things, I will make thee ruler over many things');
  });

  it('8. edify and refuse in ONE verse, and the beam is ours to check', () => {
    carries('warn them that are unruly, comfort the feebleminded, support the weak, be patient toward all men');
    carries('Yet count him not as an enemy, but admonish him as a brother');
    carries('first cast out the beam out of thine own eye');
    // The lesson does not reverse his finding to be even-handed: the witnesses
    // and his stated clarity stand in the text.
    expect(L().lesson).toMatch(/four people heard the plan and he said it was clear/);
  });

  it('the close turns to the reader, and the lesson ends the way this house ends', () => {
    carries('Well done, thou good and faithful servant');
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
