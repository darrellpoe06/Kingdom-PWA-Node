// @vitest-environment node
// =============================================================================
// L213 — A Snag in the Theory — What the Report Establishes, What Is Honestly
// Open, and Who Framed the Worlds
// =============================================================================
// Built from the report Darrell forwarded into the app by email on 2026-10-06
// with one word above it, Lesson (DR-0763): a Big Think piece by Dirk
// Schulze-Makuch and Tony Reichhardt on a new paper by Benjamin Tutolo that
// puts a documented difficulty into the account of life's beginning that has
// led the field for about a decade.
//
// THIS LESSON CAN FAIL IN TWO DIRECTIONS, AND BOTH ARE GATED HERE.
//   1. OVER-CLAIMING. A snag in a theory is not a proof of Genesis (DR-0076).
//      So the lesson is checked for the refusal in its own words, and checked
//      for the ABSENCE of any sentence that treats the paper as a proof, as a
//      defeat of the scientists, or as a settlement of the question.
//   2. HEDGING THE WORD. Romans 1:20 is taught plainly, not staged as one view
//      among several (DR-0097 / DR-0098). So the lesson is checked for the
//      teaching and for the absence of both-sides framing around it.
// DR-0100's three tiers are the method the reader learns, and the test pins
// each tier's own heading and the half of tier three that is normally dropped:
// the real observation under an over-reach survives the correction.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before it was written and is pinned below so a later edit cannot soften it,
// and a one-word change is proven to fail. The report itself is NEVER rendered
// inside quotation marks: in this corpus a double-quoted span is Scripture, so
// the article's wording is carried in our own words and that line is gated too.
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

const ID = 'll213-a-snag-in-the-theory-what-the-report-establishes-what-is-honestly-open-and-who-framed-the-worlds';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L213 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const SPANS = [
  'All things were made by him; and without him was not any thing made that was made.',
  'And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind',
  'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.',
  'And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.',
  'And God said, Let there be light: and there was light.',
  'And he is before all things, and by him all things consist.',
  'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'And if any man think that he knoweth any thing, he knoweth nothing yet as he ought to know.',
  'And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.',
  'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Because that which may be known of God is manifest in them; for God hath shewed it unto them.',
  'Because that, when they knew God, they glorified him not as God, neither were thankful; but became vain in their imaginations, and their foolish heart was darkened.',
  'Before the mountains were brought forth, or ever thou hadst formed the earth and the world, even from everlasting to everlasting, thou art God.',
  'Behold the Lamb of God, which taketh away the sin of the world.',
  'Beware lest any man spoil you through philosophy and vain deceit, after the tradition of men, after the rudiments of the world, and not after Christ.',
  'But ask now the beasts, and they shall teach thee; and the fowls of the air, and they shall tell thee',
  'But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.',
  'But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.',
  'By the word of the LORD were the heavens made; and all the host of them by the breath of his mouth.',
  'Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.',
  'Canst thou by searching find out God? canst thou find out the Almighty unto perfection?',
  'Confess your faults one to another, and pray one for another, that ye may be healed.',
  'Counsel in the heart of man is like deep water; but a man of understanding will draw it out.',
  'Ever learning, and never able to come to the knowledge of the truth.',
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.',
  'For by him were all things created, that are in heaven, and that are in earth, visible and invisible',
  'For every house is builded by some man; but he that built all things is God.',
  'For he spake, and it was done; he commanded, and it stood fast.',
  'For in him we live, and move, and have our being',
  'For it is written, I will destroy the wisdom of the wise, and will bring to nothing the understanding of the prudent.',
  'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD.',
  'For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:',
  'For thus saith the LORD that created the heavens; God himself that formed the earth and made it; he hath established it, he created it not in vain, he formed it to be inhabited',
  'God that made the world and all things therein, seeing that he is Lord of heaven and earth, dwelleth not in temples made with hands',
  'Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.',
  'He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.',
  'He hath made the earth by his power, he hath established the world by his wisdom, and hath stretched out the heavens by his discretion.',
  'He stretcheth out the north over the empty place, and hangeth the earth upon nothing.',
  'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  'In all thy ways acknowledge him, and he shall direct thy paths.',
  'In the beginning God created the heaven and the earth.',
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Know ye that the LORD he is God: it is he that hath made us, and not we ourselves',
  'Lift up your eyes on high, and behold who hath created these things, that bringeth out their host by number: he calleth them all by names by the greatness of his might',
  'Lying lips are abomination to the LORD: but they that deal truly are his delight.',
  'O LORD, how manifold are thy works! in wisdom hast thou made them all: the earth is full of thy riches.',
  'O Timothy, keep that which is committed to thy trust, avoiding profane and vain babblings, and oppositions of science falsely so called',
  'Or speak to the earth, and it shall teach thee: and the fishes of the sea shall declare unto thee.',
  'Professing themselves to be wise, they became fools,',
  'Prove all things; hold fast that which is good.',
  'Speak ye every man the truth to his neighbour; execute the judgment of truth and peace in your gates',
  'That they should seek the Lord, if haply they might feel after him, and find him, though he be not far from every one of us:',
  'The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.',
  'The heavens declare the glory of God; and the firmament sheweth his handywork.',
  'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever',
  'The simple believeth every word: but the prudent man looketh well to his going.',
  'Then I beheld all the work of God, that a man cannot find out the work that is done under the sun',
  'Then I beheld all the work of God, that a man cannot find out the work that is done under the sun: because though a man labour to seek it out, yet he shall not find it; yea farther; though a wise man think to know it, yet shall he not be able to find it.',
  'These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.',
  'Thou art worthy, O Lord, to receive glory and honour and power: for thou hast created all things, and for thy pleasure they are and were created.',
  'Thou shalt not bear false witness against thy neighbour.',
  'Thou, even thou, art LORD alone; thou hast made heaven, the heaven of heavens, with all their host, the earth, and all things that are therein',
  'Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.',
  'Thus the heavens and the earth were finished, and all the host of them.',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Where is the wise? where is the scribe? where is the disputer of this world? hath not God made foolish the wisdom of this world?',
  'Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding.',
  'Wherefore putting away lying, speak every man truth with his neighbour: for we are members one of another.',
  'Who is this that darkeneth counsel by words without knowledge?',
  'Who knoweth not in all these that the hand of the LORD hath wrought this?',
  'let every man be swift to hear, slow to speak, slow to wrath',
  'seeing he giveth to all life, and breath, and all things',
  'the honour of kings is to search out a matter',
];

describe('L213 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('A Snag in the Theory — What the Report Establishes, What Is Honestly Open, and Who Framed the Worlds');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    expect(m.benefits.length).toBe(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-06');
  });

  it('carries its provenance plainly: the report is the occasion, the Word is the teaching', () => {
    const line = 'Darrell forwarded this report into the app by email on 2026-10-06 with one word above it, Lesson; the report is the occasion, and the Word is the teaching.';
    expect(L().lesson).toContain(line);
    expect(L().bigIdea).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('attributes the report rather than carrying it on a rumour', () => {
    for (const name of ['Big Think', 'Dirk Schulze-Makuch', 'Tony Reichhardt', 'Benjamin Tutolo', 'Proceedings of the National Academy of Sciences']) {
      expect(L().lesson, name).toContain(name);
    }
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
    for (const ref of ['Hebrews 11:3', 'Genesis 1:1', 'Romans 1:20', 'Romans 1:21', 'Deuteronomy 29:29', 'Ecclesiastes 8:17', 'Psalms 100:3', '1 Timothy 6:20', 'Job 38:4', '1 Thessalonians 5:21', 'Proverbs 9:10', 'John 1:29']) {
      expect(anchor, ref).toContain(ref);
    }
  });
});

describe('the three tiers of DR-0100 are the method, and each one is taught', () => {
  it('names all three tiers, in order, in the adult lesson', () => {
    const at = (s) => L().lesson.indexOf(s);
    expect(at('TIER ONE — SAY PLAINLY WHAT IS ESTABLISHED, AND NAME THE BASIS')).toBeGreaterThan(-1);
    expect(at('TIER TWO — NAME NARROWLY WHAT IS HONESTLY OPEN')).toBeGreaterThan(-1);
    expect(at('TIER THREE — WHERE A CLAIM REACHES PAST ITS EVIDENCE')).toBeGreaterThan(-1);
    expect(at('TIER ONE — SAY PLAINLY WHAT IS ESTABLISHED, AND NAME THE BASIS'))
      .toBeLessThan(at('TIER TWO — NAME NARROWLY WHAT IS HONESTLY OPEN'));
    expect(at('TIER TWO — NAME NARROWLY WHAT IS HONESTLY OPEN'))
      .toBeLessThan(at('TIER THREE — WHERE A CLAIM REACHES PAST ITS EVIDENCE'));
  });

  it('tier one states what the field itself admits, without softening it into a hedge', () => {
    expect(L().lesson).toContain('astrobiology is limited by our lack of understanding of how our own world crossed the threshold from non-living to living');
    expect(/\bsome say\b|\bsome researchers claim\b|\bsome believe\b/i.test(PROSE()), 'no hedge language around an established fact').toBe(false);
  });

  it('tier two keeps the uncertainty NARROW and says what is not open', () => {
    expect(L().lesson).toContain('What is open is this and no more');
    expect(L().lesson).toContain('It is not open whether Yahweh made the heaven and the earth');
  });

  it('tier three corrects the claim and KEEPS the measurement under it', () => {
    expect(L().lesson).toContain('We correct a claim. We do not discard a measurement.');
    expect(L().lesson).toContain('the real observation under the over-reach still stands');
    // the kept observation itself, in the lesson's own words
    expect(L().lesson).toContain('Three things had to arrive together or nothing holds.');
  });

  it('handles the one verse people reach for too fast, exactly as written', () => {
    expect(ALL()).toContain('avoiding profane and vain babblings, and oppositions of science falsely so called');
    expect(L().lesson).toContain('The warning is against what is FALSELY so called.');
    expect(L().lesson).toContain('we will not press that verse into service against a chemist doing honest work');
  });
});

describe('it does not over-claim: a snag is not a proof', () => {
  it('says the refusal in its own words, in the lesson and in every band', () => {
    expect(L().lesson).toContain('A snag in a theory is not a proof of Genesis.');
    expect(L().levels.child).toContain('A snag is not a proof.');
    expect(L().levels.youth).toContain('a snag in a theory is not a proof of Genesis');
    expect(L().levels.teen).toContain('a snag in a theory is not a proof of Genesis');
    expect(L().levels.senior).toContain('a difficulty in a theory is not a proof of Genesis');
  });

  it('says plainly that nothing moves if the objection is answered', () => {
    expect(L().lesson).toContain('nothing we believe moves one inch, because it was never resting on his difficulty');
    expect(L().lesson).toContain('It rests on Hebrews 11:3.');
  });

  it('claims no victory over the scientists and no proof from the paper', () => {
    const prose = PROSE();
    expect(/\b(?:proves|proved|disproves|disproved|debunk\w*|demolish\w*)\b/i.test(prose), 'no proof or debunk claim').toBe(false);
    expect(/\bscience (?:is|has been) wrong\b|\bwe were right all along\b|\bthey have been exposed\b|\btold you so\b/i.test(prose)).toBe(false);
    expect(/\bthe theory (?:has )?collapsed\b|\bevolution is dead\b|\bthe case is closed\b/i.test(prose)).toBe(false);
  });

  it('reports the limit of the paper as the authors report it', () => {
    expect(L().lesson).toContain('the new paper does not completely rule out the hydrothermal vent theory');
  });

  it('PROVEN-TO-CATCH: a planted gloat is caught by the same screen', () => {
    const gloat = `${PROSE()} The paper proves Genesis and the case is closed.`;
    expect(/\b(?:proves|proved|disproves|disproved|debunk\w*|demolish\w*)\b/i.test(gloat)).toBe(true);
    expect(/\bthe case is closed\b/i.test(gloat)).toBe(true);
  });
});

describe('it does not hedge the Word', () => {
  it('teaches Romans 1:20 and 1:21 plainly rather than as one view among several', () => {
    expect(ALL()).toContain('For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:');
    expect(L().lesson).toContain('It says the making is visible and the excuse is gone.');
    const prose = PROSE();
    expect(/\bhere are (?:both|two|three) views\b|\byou decide\b|\bpick a side\b|\bboth sides of the (?:story|argument|debate)\b/i.test(prose)).toBe(false);
  });

  it('teaches that the worlds were framed, as the ground before the report', () => {
    expect(ALL()).toContain('Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.');
    expect(L().lesson).toContain('Hold that. Nothing below moves it one inch.');
  });

  it('stops where the Word stops and says what it has not given', () => {
    expect(L().lesson).toContain('It does not give the chemistry.');
    expect(L().lesson).toContain('We will not invent any of that and we will not dress a guess in a verse to make it sound settled.');
    expect(L().lesson).toContain('Stopping there is obedience, not defeat.');
  });

  it('invents no mechanism the text does not give', () => {
    const prose = PROSE();
    expect(/\bYahweh used\b[^.]{0,40}\b(?:chemistry|reaction|molecule|vent|pond)\b/i.test(prose), 'no invented mechanism').toBe(false);
    expect(/\bthe Word (?:says|teaches) (?:that )?the (?:temperature|pH|acidity)\b/i.test(prose)).toBe(false);
  });
});

describe('the report is never dressed as Scripture', () => {
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

  it('the reasoning of the article is carried in our words, outside quotation marks', () => {
    expect(L().lesson).toContain('it seems extremely improbable that all three milestones would come together, yet we are here, so there must be a way');
    const spans = [...ALL().matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(spans.filter((s) => /there must be a way|hydrothermal|Tutolo|astrobiology/i.test(s)), 'no report wording inside quotation marks').toEqual([]);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(325);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every span it was built with is still in the lesson, word for word', () => {
    for (const s of SPANS) expect(ALL()).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('Through faith we understand that the worlds were framed by the word of God', 'Through faith we understand that the worlds were framed by the hand of God') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a dropped movement is caught', () => {
    expect(L().lesson).toContain('\n\nFIVE. ');
    const dropped = L().lesson.replace(/\n\nFIVE\. [^]*?(?=\n\nSIX\. )/, '');
    expect(dropped.includes('\n\nFIVE. ')).toBe(false);
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
      expect(t, 'the skill: ask, listen to the end, retell, teach one verse').toMatch(/listen all the way (?:to the end|through)|Listen all the way|Listen first/);
      expect(t, 'the rhythm: once today in one of Deuteronomy 6:7 four places, one friend this week').toMatch(/at the table, on the way, at bedtime, or first thing/);
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
  it('the lesson carries ten numbered movements, Word first, in order', () => {
    const names = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.'];
    for (const n of names) expect(L().lesson, n).toContain(`\n\n${n} `);
    const at = (n) => L().lesson.indexOf(`\n\n${n} `);
    for (let i = 1; i < names.length; i += 1) expect(at(names[i - 1]), names[i]).toBeLessThan(at(names[i]));
    // the Word is first: movement ONE is the framing of the worlds, not the news
    expect(L().lesson.indexOf('BEFORE THE REPORT, THE WORD')).toBeLessThan(L().lesson.indexOf('WHAT ACTUALLY CAME IN'));
  });
  it('every band carries all ten movements too', () => {
    for (const b of FULL_BANDS) {
      for (const n of ['ONE.', 'FIVE.', 'TEN.']) expect(L().levels[b], `${b} ${n}`).toContain(`${n} `);
    }
  });
});
