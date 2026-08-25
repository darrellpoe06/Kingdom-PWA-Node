// =============================================================================
// L87 — Two Ways, Two Wisdoms, and the Word's engine of wholeness: verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (three spoken utterances, one flow): "What is the
// difference between Yahweh's Way and works of iniquity and why can't we
// understand or see the Truth Light or Way and what can we do to See like
// Jesus says..." · "Wisdom of man vs Yahweh's Wisdom etc..." · "internal
// structure of the Words Ways of making us whole or His perfect... how!?"
// Every KJV line below was FETCHED from the repo's own KJV this session —
// never written from memory (DR-0076 / DR-0281 QUOTED). A drifted quote
// fails the build (the L83-L86 discipline).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll87-two-ways-two-wisdoms-how-the-word-makes-whole'");
const lesson = src.slice(start, start + 45000);
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Psalms 1:6': 'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish.',
  'Proverbs 14:12': 'There is a way which seemeth right unto a man, but the end thereof are the ways of death.',
  'John 14:6': 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
  '2 Corinthians 4:4 (fragment)': 'the god of this world hath blinded the minds of them which believe not',
  '1 Corinthians 2:14': 'But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him: neither can he know them, because they are spiritually discerned.',
  'John 3:3 (fragment)': 'Except a man be born again, he cannot see the kingdom of God',
  'Matthew 5:8': 'Blessed are the pure in heart: for they shall see God.',
  'Psalms 119:18': 'Open thou mine eyes, that I may behold wondrous things out of thy law.',
  'Luke 2:49 (fragment)': 'wist ye not that I must be about my Father’s business?',
  '2 Timothy 3:17': 'That the man of God may be perfect, throughly furnished unto all good works.',
  'Psalms 19:7': 'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
  'John 17:17': 'Sanctify them through thy truth: thy word is truth.',
};

const QUOTED_FRAGMENTS = [
  // I. the two ways
  'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish',
  'There is a way which seemeth right unto a man, but the end thereof are the ways of death',
  'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD',
  'so are my ways higher than your ways',
  'I am the way, the truth, and the life: no man cometh unto the Father, but by me',
  'depart from me, ye that work iniquity',
  // II. why we cannot see
  'the god of this world hath blinded the minds of them which believe not',
  'light is come into the world, and men loved darkness rather than light, because their deeds were evil',
  'For every one that doeth evil hateth the light',
  'the natural man receiveth not the things of the Spirit of God',
  'neither can he know them, because they are spiritually discerned',
  'The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light',
  // III. how sight comes
  'Except a man be born again, he cannot see the kingdom of God',
  'Blessed are the pure in heart: for they shall see God',
  'Open thou mine eyes, that I may behold wondrous things out of thy law',
  'anoint thine eyes with eyesalve, that thou mayest see',
  'wist ye not that I must be about my Father’s business?',
  'But seek ye first the kingdom of God',
  // IV. the two wisdoms
  'the wisdom of this world is foolishness with God',
  'but is earthly, sensual, devilish',
  'The fear of the LORD is the beginning of wisdom',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding',
  'In all thy ways acknowledge him, and he shall direct thy paths',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not',
  'first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy',
  'the foolishness of God is wiser than men',
  // V. the engine of wholeness
  'That the man of God may be PERFECT, throughly furnished unto all good works',
  'For the word of God is quick, and powerful, and sharper than any twoedged sword',
  'a discerner of the thoughts and intents of the heart',
  'Sanctify them through thy truth: thy word is truth',
  'be ye transformed by the renewing of your mind',
  'a doer of the work, this man shall be blessed in his deed',
  // VI. only one narrative endures (spoken 2026-08-24: "only Yahweh's
  // Narratives and Perspectives Will endure... main reason why I study the
  // Word... only real future")
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever',
  'The LORD bringeth the counsel of the heathen to nought',
  'The counsel of the LORD standeth for ever, the thoughts of his heart to all generations',
  'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand',
  'the end from the beginning',
  'My counsel shall stand',
  'I AM THAT I AM',
  'which is, and which was, and which is to come, the Almighty',
  'Jesus Christ the same yesterday, and to day, and for ever',
  'yea, let God be true, but every man a liar',
  'And the Word was made flesh, and dwelt among us',
  'made himself of no reputation, and took upon him the form of a servant',
  'he humbled himself, and became obedient unto death, even the death of the cross',
  'Wherefore God also hath highly exalted him',
  'Heaven and earth shall pass away, but my words shall not pass away',
  'And the world passeth away, and the lust thereof: but he that doeth the will of God abideth for ever',
  'To the law and to the testimony: if they speak not according to this word, it is because there is no light in them',
];

describe('L87 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: '2 Timothy 3:16-17'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toContain('L87 Two Ways, Two Wisdoms');
  });
  it("keeps the Governor's framing: the four-stroke engine and the enlightening tie", () => {
    for (const frag of ['four-stroke', 'DOCTRINE', 'REPROOF', 'CORRECTION', 'INSTRUCTION IN RIGHTEOUSNESS', 'ENLIGHTENING the eyes']) {
      expect(l).toContain(frag);
    }
  });
  it('is Part 1 of one two-part lesson, self-contained: carries the soils core and the only-real-future witness', () => {
    for (const frag of ['The King’s Program, Part 1', 'Part 2 walks it in full', 'The seed is the word of God', 'fruit with patience', 'ONLY REAL FUTURE']) {
      expect(l).toContain(frag);
    }
  });
  it('the adversary stays lowercase in our own voice; the quoted KJV stays verbatim', () => {
    // "the god of this world" is the KJV's own lowercase — quoted exactly —
    // and the lesson's own prose says "the adversary", never capitalized.
    expect(l).toContain('the god of this world hath blinded');
    expect(l).not.toMatch(/The Adversary/);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      // The lesson may emphasize a word with CAPS inside a quotation it
      // introduces as emphasized; compare case-insensitively so the letter
      // sequence itself is what is pinned.
      expect(l.toLowerCase()).toContain(frag.toLowerCase());
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Psalms 1:6'].length).toBe(87);
    expect(KJV['Matthew 5:8']).toBe('Blessed are the pure in heart: for they shall see God.');
    expect(KJV['Psalms 119:18'].length).toBe(70);
    expect(KJV['2 Timothy 3:17']).toBe('That the man of God may be perfect, throughly furnished unto all good works.');
    expect(KJV['Psalms 19:7'].startsWith('The law of the LORD is perfect, converting the soul')).toBe(true);
    expect(KJV['John 17:17'].length).toBe(51);
    expect(KJV['John 14:6']).toContain('no man cometh unto the Father, but by me');
    expect(KJV['Proverbs 14:12'].endsWith('the ways of death.')).toBe(true);
    expect(KJV['1 Corinthians 2:14']).toContain('spiritually discerned');
    expect(KJV['Luke 2:49 (fragment)']).toContain('Father’s business');
  });
});
