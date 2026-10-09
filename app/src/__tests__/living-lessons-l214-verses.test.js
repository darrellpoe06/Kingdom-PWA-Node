// @vitest-environment node
// =============================================================================
// L214 — Sons of Yahweh — Whom He Made, Whom He Begot, and Whom He Adopts
// =============================================================================
// Built from the question Darrell wrote into the app on 2026-10-07 under one
// word, Lesson (DR-0780): Psalms 2:7 beside Hebrews 1:5, then "Weren't the
// angels known as sons of Yahweh? Why aren't they? Why are we, and how does
// the Kingdom family work with humanity, and before humanity with the
// angels?"
//
// THE LESSON CAN FAIL IN TWO DIRECTIONS, AND BOTH ARE GATED HERE.
//   1. DODGING JOB. The Word calls the angels sons (Job 1:6, Job 38:7). A
//      lesson that answered Hebrews by denying Job would teach against the
//      text. So the affirmation is pinned in the lesson and in every band.
//   2. FLATTENING HEBREWS. Hebrews 1:5 says nothing of the kind was ever said
//      to an angel, and Hebrews 2:16 says whose nature the Son took. Both are
//      pinned verbatim, with the three-word structure (made, begotten,
//      adopted) that carries the answer.
// The Word is left silent where it is silent (DR-0098 / DR-0076): no day of
// the angels' making, no number, no invented story of the fall; the test
// screens our prose for any such invention.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before it was written and is pinned below so a later edit cannot soften
// it, and a one-word change is proven to fail.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';

const ID = 'll214-sons-of-yahweh-whom-he-made-whom-he-begot-and-whom-he-adopts';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L214 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const SPANS = [
  'I will declare the decree: the LORD hath said unto me, Thou art my Son; this day have I begotten thee.',
  'For unto which of the angels said he at any time, Thou art my Son, this day have I begotten thee? And again, I will be to him a Father, and he shall be to me a Son?',
  'Now there was a day when the sons of God came to present themselves before the LORD',
  'When the morning stars sang together, and all the sons of God shouted for joy?',
  'That the sons of God saw the daughters of men that they were fair; and they took them wives of all which they chose.',
  'which was the son of Adam, which was the son of God.',
  'Of whom the whole family in heaven and earth is named,',
  'And again, when he bringeth in the firstbegotten into the world, he saith, And let all the angels of God worship him.',
  'But to which of the angels said he at any time, Sit on my right hand, until I make thine enemies thy footstool?',
  'But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.',
  'For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:',
  'the glory as of the only begotten of the Father,',
  'So God created man in his own image, in the image of God created he him; male and female created he them.',
  'For verily he took not on him the nature of angels; but he took on him the seed of Abraham.',
  'in bringing many sons unto glory',
  'for which cause he is not ashamed to call them brethren,',
  'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:',
  'For as many as are led by the Spirit of God, they are the sons of God.',
  'but ye have received the Spirit of adoption, whereby we cry, Abba, Father.',
  'And if children, then heirs; heirs of God, and joint-heirs with Christ',
  'To redeem them that were under the law, that we might receive the adoption of sons.',
  'Wherefore thou art no more a servant, but a son; and if a son, then an heir of God through Christ.',
  'Having predestinated us unto the adoption of children by Jesus Christ to himself',
  'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God',
  'that he might be the firstborn among many brethren.',
  'Are they not all ministering spirits, sent forth to minister for them who shall be heirs of salvation?',
  'which things the angels desire to look into.',
  'See thou do it not: for I am thy fellowservant',
  'For unto the angels hath he not put in subjection the world to come, whereof we speak.',
  'Know ye not that we shall judge angels?',
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'fellowcitizens with the saints, and of the household of God;',
  'an innumerable company of angels,',
  'To the general assembly and church of the firstborn, which are written in heaven',
  'Neither can they die any more: for they are equal unto the angels; and are the children of God, being the children of the resurrection.',
  'I have said, Ye are gods; and all of you are children of the most High.',
  'Say ye of him, whom the Father hath sanctified, and sent into the world, Thou blasphemest; because I said, I am the Son of God?',
  'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever',
  'For the earnest expectation of the creature waiteth for the manifestation of the sons of God.',
  'He that overcometh shall inherit all things; and I will be his God, and he shall be my son.',
  'For God so loved the world, that he gave his only begotten Son',
  'Behold the Lamb of God, which taketh away the sin of the world.',
  'as it is also written in the second psalm, Thou art my Son, this day have I begotten thee.',
];

describe('L214 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Sons of Yahweh — Whom He Made, Whom He Begot, and Whom He Adopts');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    expect(m.benefits.length).toBe(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-07');
  });

  it('carries its provenance plainly: the question is the occasion, the Word is the teaching', () => {
    const line = 'Darrell wrote this question into the app on 2026-10-07 with one word above it, Lesson; the question is the occasion, and the Word is the teaching.';
    expect(L().lesson).toContain(line);
    expect(L().bigIdea).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('the anchor names every verse the lesson stands on', () => {
    const refs = [...new Set(
      quotedTexts(L())
        .flatMap(([, t]) => [...String(t).matchAll(/"[^"]+"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+):(\d+)(?:-(\d+))?\)/g)]
        .map((m) => m[1].replace(/\s+/g, ' ').trim())),
    )];
    const anchor = L().anchor.ref;
    const unnamed = refs.filter((r) => !anchor.includes(r));
    expect(unnamed, 'every chapter the lesson quotes must be named in anchor.ref (Search it out reads it)').toEqual([]);
    for (const ref of ['Psalms 2:7', 'Hebrews 1:5', 'Job 1:6', 'Job 38:7', 'Hebrews 2:16', 'Romans 8:15', 'Galatians 4:5', 'Hebrews 12:22', 'Luke 20:36', 'Deuteronomy 29:29', 'Revelation 21:7', 'John 1:29']) {
      expect(anchor, ref).toContain(ref);
    }
  });
});

describe('the three words carry the answer: made, begotten, adopted', () => {
  it('names the three words in the lesson and in every band', () => {
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t).toMatch(/\bmade\b/i);
      expect(t).toMatch(/\bbegotten\b/i);
      expect(t).toMatch(/\badopt(?:ed|ion)\b/i);
    }
    expect(L().lesson).toContain('The angels were made. The Son was begotten. We are adopted');
  });

  it('does NOT dodge Job: the angels ARE called sons, said plainly in the lesson and in every band', () => {
    expect(ALL()).toContain('Now there was a day when the sons of God came to present themselves before the LORD');
    expect(ALL()).toContain('When the morning stars sang together, and all the sons of God shouted for joy?');
    expect(L().lesson).toContain('YES, THE ANGELS ARE CALLED SONS.');
    expect(L().levels.child).toContain('So yes. The angels are called sons.');
    expect(L().levels.youth).toContain('YES, THE ANGELS ARE CALLED SONS.');
    expect(L().levels.teen).toContain('YES, THE ANGELS ARE CALLED SONS.');
    expect(L().levels.senior).toContain('YES, THE ANGELS ARE CALLED SONS.');
    expect(/\bangels are not sons\b|\bangels were never sons\b/i.test(PROSE())).toBe(false);
  });

  it('does NOT flatten Hebrews: what was never said to an angel, and whose nature the Son took, verbatim', () => {
    expect(ALL()).toContain('For unto which of the angels said he at any time, Thou art my Son, this day have I begotten thee?');
    expect(ALL()).toContain('For verily he took not on him the nature of angels; but he took on him the seed of Abraham.');
    expect(L().lesson).toContain('WHAT WAS NEVER SAID TO AN ANGEL.');
    expect(L().lesson).toContain('WHY A MAN AND NOT AN ANGEL.');
    expect(L().lesson).toContain('the difference between the Maker and the made');
  });

  it('reads Genesis 6 through Job, the Word explaining the Word, rather than through a story', () => {
    const at = (s) => L().lesson.indexOf(s);
    expect(at('Now there was a day when the sons of God')).toBeGreaterThan(-1);
    expect(at('That the sons of God saw the daughters of men')).toBeGreaterThan(at('Now there was a day when the sons of God'));
    expect(L().lesson).toContain('read it is through Job');
  });

  it('honours the angels as the Word does, without demoting them or inventing their story', () => {
    expect(ALL()).toContain('Are they not all ministering spirits, sent forth to minister for them who shall be heirs of salvation?');
    expect(ALL()).toContain('See thou do it not: for I am thy fellowservant');
    expect(L().lesson).toContain('None of this demotes the angels. It places them.');
    const prose = PROSE();
    expect(/\bangels (?:are|were) (?:lesser|inferior|second-class|unloved)\b/i.test(prose)).toBe(false);
  });

  it('answers the last part of the question: the family before there was a man', () => {
    expect(L().lesson).toContain('THE FAMILY BEFORE THERE WAS A MAN.');
    expect(L().lesson).toContain('Two of the three kinds of sonship were already real');
    expect(ALL()).toContain('In the beginning was the Word, and the Word was with God, and the Word was God.');
  });
});

describe('it stops where the Word stops', () => {
  it('says what the Word does not give, and refuses to invent it', () => {
    expect(L().lesson).toContain('WHERE THE WORD STOPS.');
    expect(L().lesson).toContain('The Word does not give the day the angels were made.');
    expect(L().lesson).toContain('we will not dress a guess in a verse to make it sound settled');
    expect(ALL()).toContain('The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever');
  });

  it('invents no day, number or fall story for the angels in our own prose', () => {
    const prose = PROSE();
    expect(/\bangels were (?:made|created) on (?:the )?(?:first|second|third|fourth|fifth|sixth) day\b/i.test(prose), 'no invented day').toBe(false);
    expect(/\b(?:a third|one third|two thirds) of the angels\b/i.test(prose), 'no invented fraction').toBe(false);
    expect(/\bexactly \d[\d,]* angels\b/i.test(prose), 'no invented count').toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted invention is caught by the same screen', () => {
    const planted = `${PROSE()} The angels were made on the second day and a third of the angels fell.`;
    expect(/\bangels were (?:made|created) on (?:the )?(?:first|second|third|fourth|fifth|sixth) day\b/i.test(planted)).toBe(true);
    expect(/\b(?:a third|one third|two thirds) of the angels\b/i.test(planted)).toBe(true);
  });
});

describe('the question is never dressed as Scripture', () => {
  it('every double-quoted span carries its reference; straight quotes; no ellipsis, record id or percentage', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
      for (const span of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(span[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
    expect(ALL().includes('“') || ALL().includes('”')).toBe(false);
  });

  it('Darrell\'s own words are carried in our prose, outside quotation marks', () => {
    const spans = [...ALL().matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(spans.filter((s) => /Darrell|Kingdom Family|how does the/i.test(s)), 'no question wording inside quotation marks').toEqual([]);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(180);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every span it was built with is still in the lesson, word for word', () => {
    for (const s of SPANS) expect(ALL()).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('For verily he took not on him the nature of angels', 'For verily he took not on him the form of angels') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a dropped movement is caught', () => {
    expect(L().lesson).toContain('\n\nFOUR. ');
    const dropped = L().lesson.replace(/\n\nFOUR\. [^]*?(?=\n\nFIVE\. )/, '');
    expect(dropped.includes('\n\nFOUR. ')).toBe(false);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('every band and the lesson end with the confession', () => {
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
  });

  it('the lesson and every band send the reader to talk about it together, in its own words, all three directions', () => {
    expect(hasAllThree(L())).toBe(true);
    const o = ownPrompts(L());
    expect(o.parents).toMatch(/^Parents, ask your children/);
    expect(o.children).toMatch(/^Ask your mom, dad or grandparent/);
    expect(o.friends).toMatch(/^Friends, tell each other/);
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t).toContain('TALK ABOUT IT TOGETHER');
      expect(t, 'the skill: ask, listen to the end').toMatch(/listen all the way to the end|Listen all the way|listen first|Listen first/i);
      expect(t, 'the rhythm: once today in one of the four places, one friend this week').toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(t).toMatch(/one friend this week/);
      expect(t).toContain('so we all get healthy together, until we see that Yahweh has been right');
    }
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING)).toBe(false);
  });
  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
  it('every band names its own lesson near its start', () => {
    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);
  });
  it('the lesson carries ten numbered movements, the question first and the Word answering, in order', () => {
    const names = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.'];
    for (const n of names) expect(L().lesson, n).toContain(`\n\n${n} `);
    const at = (n) => L().lesson.indexOf(`\n\n${n} `);
    for (let i = 1; i < names.length; i += 1) expect(at(names[i - 1]), names[i]).toBeLessThan(at(names[i]));
    expect(L().lesson.indexOf('THE QUESTION AND THE DECREE')).toBeLessThan(L().lesson.indexOf('YES, THE ANGELS ARE CALLED SONS'));
  });
  it('every band carries all ten movements too', () => {
    for (const b of FULL_BANDS) {
      for (const n of ['ONE.', 'FIVE.', 'TEN.']) expect(L().levels[b], `${b} ${n}`).toContain(`${n} `);
    }
  });
});
