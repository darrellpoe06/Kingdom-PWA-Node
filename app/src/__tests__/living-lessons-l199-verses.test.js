// @vitest-environment node
// =============================================================================
// L199 — Faith in Good Faith — No False Witness, the Real Question, and the
// Word That Answers (DR-0681)
// =============================================================================
// Darrell forwarded a Big Think email on 2026-09-29 and marked it "Lesson"
// (Gmail thread 1a0ed1197eb970e5): Jonny Thomson's invitation, sent
// 2026-09-28, to a live conversation with Andrew Henry on "what people get
// wrong about religion", arguing for steelmen over strawmen and naming three
// cartoons people use. The lesson is taught Word first, and where the email
// stages "a variety of sides" the lesson names it only to teach past it
// (DR-0098).
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before a word was written. The seven movements are pinned so a later edit
// cannot drop one:
//   1. no false witness (Exodus 20:16; Proverbs 14:5; 12:22; Ephesians 4:25);
//   2. hear the real question (Proverbs 18:13, 17; James 1:19-20;
//      Matthew 22:39);
//   3. Paul on Mars' hill (Acts 17:16, 23, 24, 28, 30, 31, 32, 34);
//   4. the first cartoon answered (John 4:24; 1 Timothy 1:17; 1 Kings 8:27;
//      Jeremiah 23:24; Psalms 139:8; Acts 17:29; Isaiah 40:18; Daniel 7:9;
//      Revelation 1:14; John 1:18, 14; 14:9; Colossians 1:15);
//   5. the other two cartoons and one honest scale (Proverbs 20:10;
//      Matthew 26:52; John 18:36; Luke 9:55-56; Matthew 5:44; Hebrews 9:27;
//      Ephesians 2:8-9);
//   6. answer in good faith (Matthew 22:15-22; 1 Peter 3:15-16;
//      Colossians 4:6; 2 Timothy 2:23-25; Proverbs 15:1; 2 Corinthians 4:2;
//      Acts 26:25);
//   7. why we do not line up the sides (John 17:17; Isaiah 55:8; 45:22;
//      John 14:6; Acts 4:12; Isaiah 1:18; Acts 17:11; 1 Thessalonians 5:21;
//      1 Corinthians 2:5; Hebrews 4:12; Isaiah 55:11);
//   and the close (Luke 19:10; John 3:17).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll199-faith-in-good-faith-no-false-witness-the-real-question-and-the-word-that-answers';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L199 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

describe('L199 is really in the series', () => {
  it('carries all the fields, four authored bands, and a quiz', () => {
    const m = L();
    expect(m.title).toBe('Faith in Good Faith — No False Witness, the Real Question, and the Word That Answers');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Exodus 20:16', 'Proverbs 18:13', 'Acts 17:23', 'Acts 17:28', 'John 4:24', '1 Kings 8:27', 'John 1:18', 'Hebrews 9:27', '1 Peter 3:15', 'John 17:17']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 199, comes after L197, and carries its day', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l197 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll197-'));
    expect(l197).toBeTruthy();
    expect(num(L())).toBe(199);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l197));
    // Counts are derived (DR-0677): the week count is the array, never a literal.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-29');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll199-/.test(m.id))).toHaveLength(1);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(250);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture, and no man is quoted', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('straight quotation marks, no ellipsis inside a quotation, no record id, no percentage', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });
});

describe('the Word first, and each movement is actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('the Word leads: the first movement opens before any cartoon is answered', () => {
    const t = L().lesson;
    const one = t.indexOf('ONE. NO FALSE WITNESS.');
    expect(one).toBeGreaterThan(0);
    expect(t.indexOf('We begin, as every lesson in this house begins, in the Word.')).toBeLessThan(one);
    for (const h of ['TWO. HEAR THE REAL QUESTION', 'THREE. PAUL ON MARS’ HILL', 'FOUR. THE FIRST CARTOON', 'FIVE. THE OTHER TWO CARTOONS', 'SIX. ANSWER IN GOOD FAITH', 'SEVEN. WHY WE DO NOT LINE UP THE SIDES', 'THE CLOSE.']) {
      expect(t.indexOf(h), h).toBeGreaterThan(one);
    }
  });

  it('1. a strawman is false witness', () => {
    carries('Thou shalt not bear false witness against thy neighbour');
    carries('A faithful witness will not lie: but a false witness will utter lies');
    carries('speak every man truth with his neighbour: for we are members one of another');
    expect(L().lesson).toMatch(/A strawman is a false witness/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Exodus 20:16/);
  });

  it('2. hear the real question before you answer', () => {
    carries('He that answereth a matter before he heareth it, it is folly and shame unto him');
    carries('He that is first in his own cause seemeth just');
    carries('let every man be swift to hear, slow to speak');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Proverbs 18:13/);
  });

  it('3. Paul on Mars’ hill: described truly, then declared the truth', () => {
    carries('I found an altar with this inscription, TO THE UNKNOWN GOD');
    carries('For we are also his offspring');
    carries('Whom therefore ye ignorantly worship, him declare I unto you');
    carries('but now commandeth all men every where to repent');
    carries('in that he hath raised him from the dead');
    carries('some mocked: and others said, We will hear thee again of this matter');
    expect(L().lesson).toMatch(/The accurate description is not the end\. It is the doorway/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Acts 17:23/);
  });

  it('4. the man-in-the-sky cartoon answered from the Word, with the visions kept as written', () => {
    carries('God is a Spirit');
    carries('the King eternal, immortal, invisible');
    carries('the heaven and heaven of heavens cannot contain thee');
    carries('Do not I fill heaven and earth?');
    carries('the hair of his head like the pure wool');
    carries('he that hath seen me hath seen the Father');
    expect(L().lesson).toMatch(/Those are visions given to prophets, and we keep them exactly as written/);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/John 4:24/);
      expect(t).toMatch(/Daniel 7:9/);
    }
  });

  it('5. no ruling on a neighbor’s faith from a slogan; the kingdom and the sword; once to die; grace', () => {
    carries('Put up again thy sword into his place');
    carries('My kingdom is not of this world');
    carries('it is appointed unto men once to die, but after this the judgment');
    carries('For by grace are ye saved through faith');
    expect(L().lesson).toMatch(/This lesson does not rule on another faith from a one-line slogan/);
    expect(L().lesson).toMatch(/L195, How Yahweh Keeps His Word/);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll195-'))).toBe(true);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Hebrews 9:27/);
      expect(t).toMatch(/Matthew 26:52/);
    }
  });

  it('6. answer in good faith', () => {
    carries('took counsel how they might entangle him in his talk');
    carries('with meekness and fear');
    carries('Let your speech be alway with grace');
    carries('A soft answer turneth away wrath');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/1 Peter 3:15/);
  });

  it('7. the Word is not one side on a panel: the debate is named only to teach past it', () => {
    carries('thy word is truth');
    carries('I am the way, the truth, and the life');
    carries('searched the scriptures daily');
    expect(L().lesson).toMatch(/Here is where this house teaches past the debate/);
    expect(L().lesson).toMatch(/we do not put the Word on a panel and ask the reader to pick a side/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/John 17:17/);
  });

  it('the close: the aim is the neighbor, and every band ends the way this house ends', () => {
    carries('For the Son of man is come to seek and to save that which was lost');
    for (const t of BANDS_AND_LESSON()) expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('provenance is honest, and our voice keeps the bindings', () => {
  it('names the email, its date, its sender, and what was not verified', () => {
    expect(L().lesson).toMatch(/On 2026-09-29 Darrell forwarded an email to the app and marked it Lesson/);
    expect(L().lesson).toMatch(/sent on 2026-09-28 by Jonny Thomson, whom the email calls/);
    expect(L().lesson).toMatch(/We worked from the email alone/);
    expect(L().lesson).toMatch(/we did not verify the names, roles and books the email gives/);
    expect(L().lesson).toMatch(/That is his account, and we did not check it/);
    // The cartoons are his examples of bad argument, not his views.
    expect(L().lesson).toMatch(/He gives those as examples of bad argument, not as his own views/);
    expect(L().inApp).toMatch(/We worked from the email alone/);
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted generic name, a one-word misquote, a wrong reference, and a dropped movement each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God is not a man in the sky.` };
    const prose = quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);

    const misquote = { ...L(), lesson: L().lesson.replace('false witness against thy neighbour" (Exodus 20:16)', 'false witness against thy brother" (Exodus 20:16)') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);

    const wrongRef = { ...L(), lesson: L().lesson.replace('it is folly and shame unto him" (Proverbs 18:13)', 'it is folly and shame unto him" (Proverbs 18:14)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);

    const dropped = L().lesson.replace('The accurate description is not the end. It is the doorway.', '');
    expect(dropped).not.toBe(L().lesson);
    expect(/The accurate description is not the end\. It is the doorway/.test(dropped)).toBe(false);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING), `child reads ${m.bands.child.authored}`).toBe(false);
  });

  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), b).toBe(true);
  });
});
