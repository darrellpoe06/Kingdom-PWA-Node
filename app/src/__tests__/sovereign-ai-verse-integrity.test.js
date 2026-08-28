// =============================================================================
// Sovereign A.I. class — the Word quoted in it is verbatim KJV (DR-0281)
// =============================================================================
// Born in the 2026-08-24 comprehensive Ways review (DR-0239 dimension 8):
// Week 9 (sov9, verification earns trust) introduced QUOTED Scripture into
// this catalog's anchors, and no machine gate covered it — the exact class the
// COMPREHENSIVE-REVIEW-STANDARD names ("a verbatim gate cannot see what it
// does not scan"). These pins hold every quoted fragment to the KJV text,
// letter for letter, the same discipline as living-lessons-l83-verses and
// world-issues-verse-integrity. A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));

// Verbatim KJV, verified against the repo's own KJV text.
const KJV = {
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
};

// The 2026-08-25 Word-first rebuild widened the Scripture spine. Every quoted
// fragment below was fetched from app/public/bible/kjv and is pinned to the
// lesson text letter for letter — a drifted quote fails the build (DR-0281).
const LESSON_FRAGMENTS = {
  'Genesis 1:31': 'And God saw every thing that he had made, and, behold, it was very good.',
  'Job 12:11': 'Doth not the ear try words? and the mouth taste his meat?',
  'Romans 3:4': 'let God be true, but every man a liar',
  'Jeremiah 17:9': 'The heart is deceitful above all things, and desperately wicked: who can know it?',
  'Jeremiah 17:10': 'I the LORD search the heart, I try the reins',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established',
  '2 Corinthians 13:1': 'In the mouth of two or three witnesses shall every word be established.',
  'John 5:31': 'If I bear witness of myself, my witness is not true.',
  'Proverbs 18:17': 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  '1 John 4:1': 'Beloved, believe not every spirit, but try the spirits whether they are of God',
};

const sov9 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov9-verification-earns-trust');

describe('sov9 — verification earns trust quotes the Word verbatim', () => {
  it('the week exists and anchors on the verification texts', () => {
    expect(sov9).toBeTruthy();
    expect(sov9.anchor.ref).toContain('1 Thessalonians 5:21');
    expect(sov9.anchor.ref).toContain('Proverbs 14:15');
  });
  it('every quoted fragment in the anchor is letter-for-letter KJV', () => {
    expect(sov9.anchor.theme).toContain('Prove all things; hold fast that which is good.');
  });
  it('tamper-catch: the pinned KJV lines themselves are exact', () => {
    // These two strings are the gate's own ground truth; a "helpful" edit to
    // either breaks the letter-for-letter promise and must fail loudly.
    expect(KJV['1 Thessalonians 5:21']).toBe('Prove all things; hold fast that which is good.');
    expect(KJV['Proverbs 14:15']).toBe('The simple believeth every word: but the prudent man looketh well to his going.');
    expect(KJV['1 Thessalonians 5:21'].length).toBe(47);
  });
  it('the Word-first rebuild quotes its whole Scripture spine verbatim in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(LESSON_FRAGMENTS)) {
      expect(sov9.lesson, `${ref} must be quoted letter-for-letter`).toContain(fragment);
    }
    // And the Word LEADS: the lesson's first movement is the Word's standard,
    // before any industry data (Darrell 2026-08-25: "Word first?!").
    expect(sov9.lesson.indexOf('FIRST, THE WORD')).toBe(0);
    expect(sov9.lesson.indexOf('Genesis 1:31')).toBeLessThan(sov9.lesson.indexOf('DORA'));
  });
  it('every fragment matches the repo KJV corpus, not memory', () => {
    // Independent witness: re-read each pinned fragment from the corpus files
    // themselves (the same discipline the lesson teaches — two witnesses).
    const readFileSyncLocal = readFileSync;
    const corpus = (book) => JSON.parse(readFileSyncLocal(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('Genesis', 1, 31)).toContain(LESSON_FRAGMENTS['Genesis 1:31']);
    expect(verse('Job', 12, 11)).toBe(LESSON_FRAGMENTS['Job 12:11']);
    expect(verse('Romans', 3, 4)).toContain(LESSON_FRAGMENTS['Romans 3:4']);
    expect(verse('Jeremiah', 17, 9)).toBe(LESSON_FRAGMENTS['Jeremiah 17:9']);
    expect(verse('Jeremiah', 17, 10)).toContain(LESSON_FRAGMENTS['Jeremiah 17:10']);
    expect(verse('Luke', 14, 28)).toBe(LESSON_FRAGMENTS['Luke 14:28']);
    expect(verse('Proverbs', 22, 3)).toBe(LESSON_FRAGMENTS['Proverbs 22:3']);
    expect(verse('Deuteronomy', 19, 15)).toContain(LESSON_FRAGMENTS['Deuteronomy 19:15']);
    expect(verse('2Corinthians', 13, 1)).toContain(LESSON_FRAGMENTS['2 Corinthians 13:1']);
    expect(verse('John', 5, 31)).toBe(LESSON_FRAGMENTS['John 5:31']);
    expect(verse('Proverbs', 18, 17)).toBe(LESSON_FRAGMENTS['Proverbs 18:17']);
    expect(verse('1John', 4, 1)).toContain(LESSON_FRAGMENTS['1 John 4:1']);
  });
  it('the 2026-08-25 case study lives in the tenth movement — the day the doctrine ran live twice', () => {
    // Darrell: "add this situation as a part of that lesson." Both cases are
    // pinned so neither can silently drift out of the teaching: the lane that
    // merged past the Governor's hold, and this lesson's own first version
    // falling to the human witness's search (Proverbs 18:17 as an event).
    expect(sov9.lesson).toContain('THE DAY THIS PAGE WAS REBUILT');
    expect(sov9.lesson).toContain('past the Governor\'s hold label');
    expect(sov9.lesson).toContain('DISARMS an already-armed merge');
    expect(sov9.lesson).toContain('its own review shared its own blind spots');
    expect(sov9.lesson).toContain('I gave more information in the prompt than that whole lesson');
    // And it sits INSIDE the tenth movement, after the marker.
    expect(sov9.lesson.indexOf('THE DAY THIS PAGE WAS REBUILT')).toBeGreaterThan(sov9.lesson.indexOf('TENTH,'));
  });
  it('the ten movements are marked FIRST through TENTH, in order', () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov9.lesson.indexOf(m);
      expect(at, `${m} must appear`).toBeGreaterThan(last);
      last = at;
    }
  });
});

// =============================================================================
// sov10 — the settled Word (captured 2026-08-25 from Darrell's forwarded
// essay, the first catch of the Gmail-lesson-intake Way, DR-0312)
// =============================================================================
const sov10 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov10-the-settled-word');

// Every fragment quoted in the sov10 deep lesson, verbatim from the corpus.
const SOV10_FRAGMENTS = {
  'Psalms 119:89': 'For ever, O LORD, thy word is settled in heaven.',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Matthew 24:35': 'Heaven and earth shall pass away, but my words shall not pass away.',
  'John 14:6': 'I am the way, the truth, and the life',
  'John 17:17': 'Sanctify them through thy truth: thy word is truth.',
  'Jeremiah 36:23': 'cut it with the penknife, and cast it into the fire',
  'Jeremiah 36:28': 'Take thee again another roll, and write in it all the former words that were in the first roll',
  'Exodus 31:18': 'tables of stone, written with the finger of God',
  'Deuteronomy 17:18': 'write him a copy of this law in a book',
  'Habakkuk 2:2': 'Write the vision, and make it plain upon tables, that he may run that readeth it.',
  '2 Timothy 4:3': 'For the time will come when they will not endure sound doctrine; but after their own lusts shall they heap to themselves teachers, having itching ears;',
  '2 Timothy 4:4': 'And they shall turn away their ears from the truth, and shall be turned unto fables.',
  'Exodus 23:2': 'Thou shalt not follow a multitude to do evil; neither shalt thou speak in a cause to decline after many to wrest judgment',
  'Matthew 7:13': 'wide is the gate, and broad is the way, that leadeth to destruction, and many there be which go in thereat:',
  'Matthew 7:14': 'Because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'John 1:14a': 'And the Word was made flesh, and dwelt among us',
  'John 1:14b': 'full of grace and truth',
  'Hebrews 10:25a': 'Not forsaking the assembling of ourselves together',
  'Hebrews 10:25b': 'and so much the more, as ye see the day approaching.',
  'Joshua 1:8': 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night',
  'Acts 17:11': 'received the word with all readiness of mind, and searched the scriptures daily, whether those things were so',
  'Matthew 4:4': 'It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.',
};

describe('sov10 — the settled Word quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the settled Word', () => {
    expect(sov10).toBeTruthy();
    expect(sov10.anchor.ref).toContain('Psalms 119:89');
    expect(sov10.anchor.ref).toContain('John 17:17');
    expect(sov10.anchor.theme).toContain('For ever, O LORD, thy word is settled in heaven.');
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV10_FRAGMENTS)) {
      expect(sov10.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('Psalms', 119, 89)).toBe(SOV10_FRAGMENTS['Psalms 119:89']);
    expect(verse('Isaiah', 40, 8)).toBe(SOV10_FRAGMENTS['Isaiah 40:8']);
    expect(verse('Matthew', 24, 35)).toBe(SOV10_FRAGMENTS['Matthew 24:35']);
    expect(verse('John', 14, 6)).toContain(SOV10_FRAGMENTS['John 14:6']);
    expect(verse('John', 17, 17)).toBe(SOV10_FRAGMENTS['John 17:17']);
    expect(verse('Jeremiah', 36, 23)).toContain(SOV10_FRAGMENTS['Jeremiah 36:23']);
    expect(verse('Jeremiah', 36, 28)).toContain(SOV10_FRAGMENTS['Jeremiah 36:28']);
    expect(verse('Exodus', 31, 18)).toContain(SOV10_FRAGMENTS['Exodus 31:18']);
    expect(verse('Deuteronomy', 17, 18)).toContain(SOV10_FRAGMENTS['Deuteronomy 17:18']);
    expect(verse('Habakkuk', 2, 2)).toContain(SOV10_FRAGMENTS['Habakkuk 2:2']);
    expect(verse('2Timothy', 4, 3)).toBe(SOV10_FRAGMENTS['2 Timothy 4:3']);
    expect(verse('2Timothy', 4, 4)).toBe(SOV10_FRAGMENTS['2 Timothy 4:4']);
    expect(verse('Exodus', 23, 2)).toContain(SOV10_FRAGMENTS['Exodus 23:2']);
    expect(verse('Matthew', 7, 13)).toContain(SOV10_FRAGMENTS['Matthew 7:13']);
    expect(verse('Matthew', 7, 14)).toBe(SOV10_FRAGMENTS['Matthew 7:14']);
    expect(verse('Colossians', 1, 17)).toBe(SOV10_FRAGMENTS['Colossians 1:17']);
    expect(verse('John', 1, 14)).toContain(SOV10_FRAGMENTS['John 1:14a']);
    expect(verse('John', 1, 14)).toContain(SOV10_FRAGMENTS['John 1:14b']);
    expect(verse('Hebrews', 10, 25)).toContain(SOV10_FRAGMENTS['Hebrews 10:25a']);
    expect(verse('Hebrews', 10, 25)).toContain(SOV10_FRAGMENTS['Hebrews 10:25b']);
    expect(verse('Joshua', 1, 8)).toContain(SOV10_FRAGMENTS['Joshua 1:8']);
    expect(verse('Acts', 17, 11)).toContain(SOV10_FRAGMENTS['Acts 17:11']);
    expect(verse('Matthew', 4, 4)).toContain(SOV10_FRAGMENTS['Matthew 4:4']);
  });
  it('the Word LEADS and the eight movements run in order', () => {
    expect(sov10.lesson.indexOf('FIRST, THE WORD')).toBe(0);
    expect(sov10.lesson.indexOf('Psalms 119:89')).toBeLessThan(sov10.lesson.indexOf('Gonja'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov10.lesson.indexOf(m);
      expect(at, `${m} must appear`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('provenance honesty: the essay\'s scholarship is carried as the essay\'s own (DR-0076 §8)', () => {
    expect(sov10.lesson).toContain('not independently re-read');
    expect(sov10.levels.senior).toContain('not re-verified at the underlying books');
  });
});

// =============================================================================
// sov11 — the sealed trace (captured 2026-08-25 by the Gmail-lesson-intake
// Way's first self-caught tick, DR-0312)
// =============================================================================
const sov11 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov11-the-sealed-trace');

const SOV11_FRAGMENTS = {
  '1 Kings 8:39': 'for thou, even thou only, knowest the hearts of all the children of men',
  'Psalms 139:2': 'thou understandest my thought afar off',
  'Psalms 139:4': 'For there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether.',
  'Hebrews 4:13': 'all things are naked and opened unto the eyes of him with whom we have to do.',
  'Luke 12:2': 'For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.',
  'Luke 12:3': 'that which ye have spoken in the ear in closets shall be proclaimed upon the housetops.',
  '1 Corinthians 5:6': 'Know ye not that a little leaven leaveneth the whole lump?',
  'Proverbs 4:23': 'Keep thy heart with all diligence; for out of it are the issues of life.',
  'Proverbs 25:9': 'discover not a secret to another',
  'Proverbs 25:10': 'Lest he that heareth it put thee to shame',
  'Matthew 6:19': 'where thieves break through and steal:',
  'Matthew 6:19-open': 'Lay not up for yourselves treasures upon earth',
  'Matthew 6:21': 'For where your treasure is, there will your heart be also.',
  'Matthew 13:25': 'while men slept, his enemy came and sowed tares among the wheat, and went his way.',
  '2 Corinthians 11:14': 'Satan himself is transformed into an angel of light.',
  '1 Samuel 16:7': 'looketh on the outward appearance, but the LORD looketh on the heart',
  'Revelation 5:2': 'Who is worthy to open the book, and to loose the seals thereof?',
  'Revelation 5:5': 'behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book, and to loose the seven seals thereof.',
};

describe('sov11 — the sealed trace quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the heart-Reader and the sealed book', () => {
    expect(sov11).toBeTruthy();
    expect(sov11.anchor.ref).toContain('1 Kings 8:39');
    expect(sov11.anchor.ref).toContain('Revelation 5:5');
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV11_FRAGMENTS)) {
      expect(sov11.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('1Kings', 8, 39)).toContain(SOV11_FRAGMENTS['1 Kings 8:39']);
    expect(verse('Psalms', 139, 2)).toContain(SOV11_FRAGMENTS['Psalms 139:2']);
    expect(verse('Psalms', 139, 4)).toBe(SOV11_FRAGMENTS['Psalms 139:4']);
    expect(verse('Hebrews', 4, 13)).toContain(SOV11_FRAGMENTS['Hebrews 4:13']);
    expect(verse('Luke', 12, 2)).toBe(SOV11_FRAGMENTS['Luke 12:2']);
    expect(verse('Luke', 12, 3)).toContain(SOV11_FRAGMENTS['Luke 12:3']);
    expect(verse('1Corinthians', 5, 6)).toContain(SOV11_FRAGMENTS['1 Corinthians 5:6']);
    expect(verse('Proverbs', 4, 23)).toBe(SOV11_FRAGMENTS['Proverbs 4:23']);
    expect(verse('Proverbs', 25, 9)).toContain(SOV11_FRAGMENTS['Proverbs 25:9']);
    expect(verse('Proverbs', 25, 10)).toContain(SOV11_FRAGMENTS['Proverbs 25:10']);
    expect(verse('Matthew', 6, 19)).toContain(SOV11_FRAGMENTS['Matthew 6:19']);
    expect(verse('Matthew', 6, 19)).toContain(SOV11_FRAGMENTS['Matthew 6:19-open']);
    expect(verse('Matthew', 6, 21)).toBe(SOV11_FRAGMENTS['Matthew 6:21']);
    expect(verse('Matthew', 13, 25)).toContain(SOV11_FRAGMENTS['Matthew 13:25']);
    expect(verse('2Corinthians', 11, 14)).toContain(SOV11_FRAGMENTS['2 Corinthians 11:14']);
    expect(verse('1Samuel', 16, 7)).toContain(SOV11_FRAGMENTS['1 Samuel 16:7']);
    expect(verse('Revelation', 5, 2)).toContain(SOV11_FRAGMENTS['Revelation 5:2']);
    expect(verse('Revelation', 5, 5)).toContain(SOV11_FRAGMENTS['Revelation 5:5']);
  });
  it('the Word LEADS and the eight movements run in order', () => {
    expect(sov11.lesson.indexOf('FIRST, ONE READER')).toBe(0);
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov11.lesson.indexOf(m);
      expect(at, `${m} must appear`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('carries no vendor self-reference as fact — the principle stands without naming a model (DR-0076/DR-0100)', () => {
    const blob = `${sov11.lesson} ${sov11.levels.teen} ${sov11.levels.senior} ${sov11.bigIdea} ${JSON.stringify(sov11.facilitator)}`;
    expect(blob).not.toMatch(/Fable-?5/i);
    expect(sov11.lesson).toContain('thing is safe only when it is bound to the one who may open it');
  });
});

describe('sov9 postscript — the primary-source figures stay pinned (2026-08-24 verification pass)', () => {
  // Darrell: "research the same outside sources for comprehensive understanding."
  // These figures were read from / corroborated against the primary sources in
  // that session (DORA 2024+2025, METR trial + follow-up, Veracode 2025 report
  // accounts, GitClear research PDF, the 100x-provenance investigation). The
  // postscript may be reworded, but a changed NUMBER must be a deliberate
  // re-verification, never drift — so each is pinned here.
  it('carries the verified numbers, the honest provenance flag, and the fallen claim', () => {
    const p = sov9.lesson;
    for (const pin of [
      '7.2% DECREASE in delivery stability', '39.2%',            // DORA 2024
      'throughput has since flipped POSITIVE',                   // DORA 2025 nuance
      '246 real issues', '19% LONGER', '24% forecast',           // METR
      'early-2025 snapshot',                                     // METR's own caveat
      '45% of completions introduced an OWASP Top-10',           // Veracode
      'unreachable from this session',                           // honest provenance
      '0.45% (2022) to 6.66% (2024)', '24.8% to 9.5%',           // GitClear
      'no documented empirical study',                           // the 100x folklore
    ]) {
      expect(p).toContain(pin);
    }
  });
});


// =============================================================================
// sov12 — the engineering disaster (captured 2026-08-25 from a forwarded video
// quoting The Atlantic; tech routed to the Sovereign A.I. class per DR-0312)
// =============================================================================
const sov12 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov12-the-engineering-disaster');

const SOV12_FRAGMENTS = {
  'Zechariah 4:6': 'Not by might, nor by power, but by my spirit, saith the LORD of hosts.',
  'Psalms 20:7': 'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.',
  'Proverbs 21:31': 'The horse is prepared against the day of battle: but safety is of the LORD.',
  'Haggai 1:6': 'Ye have sown much, and bring in little',
  'Haggai 1:6b': 'he that earneth wages earneth wages to put it into a bag with holes.',
  'Proverbs 13:11': 'Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.',
  'Genesis 2:15': 'to dress it and to keep it',
  'Jeremiah 2:13': 'broken cisterns, that can hold no water.',
  'Genesis 11:4': 'let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name',
  'Luke 12:18': 'I will pull down my barns, and build greater',
  'Luke 12:20': 'Thou fool, this night thy soul shall be required of thee',
  'Ecclesiastes 10:10': 'If the iron be blunt, and he do not whet the edge, then must he put to more strength: but wisdom is profitable to direct.',
  'Ecclesiastes 9:16': 'Wisdom is better than strength',
  'Ecclesiastes 9:18': 'Wisdom is better than weapons of war: but one sinner destroyeth much good.',
  'Proverbs 16:18': 'Pride goeth before destruction, and an haughty spirit before a fall.',
  'Proverbs 26:11': 'As a dog returneth to his vomit, so a fool returneth to his folly.',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Proverbs 28:13': 'He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.',
};

describe('sov12 — the engineering disaster quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on Not-by-might and the whetted edge', () => {
    expect(sov12).toBeTruthy();
    expect(sov12.anchor.ref).toContain('Zechariah 4:6');
    expect(sov12.anchor.ref).toContain('Ecclesiastes 10:10');
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV12_FRAGMENTS)) {
      expect(sov12.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('Zechariah', 4, 6)).toContain(SOV12_FRAGMENTS['Zechariah 4:6']);
    expect(verse('Psalms', 20, 7)).toBe(SOV12_FRAGMENTS['Psalms 20:7']);
    expect(verse('Proverbs', 21, 31)).toBe(SOV12_FRAGMENTS['Proverbs 21:31']);
    expect(verse('Haggai', 1, 6)).toContain(SOV12_FRAGMENTS['Haggai 1:6b']);
    expect(verse('Proverbs', 13, 11)).toBe(SOV12_FRAGMENTS['Proverbs 13:11']);
    expect(verse('Genesis', 2, 15)).toContain(SOV12_FRAGMENTS['Genesis 2:15']);
    expect(verse('Jeremiah', 2, 13)).toContain(SOV12_FRAGMENTS['Jeremiah 2:13']);
    expect(verse('Genesis', 11, 4)).toContain(SOV12_FRAGMENTS['Genesis 11:4']);
    expect(verse('Luke', 12, 18)).toContain(SOV12_FRAGMENTS['Luke 12:18']);
    expect(verse('Luke', 12, 20)).toContain(SOV12_FRAGMENTS['Luke 12:20']);
    expect(verse('Ecclesiastes', 10, 10)).toBe(SOV12_FRAGMENTS['Ecclesiastes 10:10']);
    expect(verse('Ecclesiastes', 9, 16)).toContain(SOV12_FRAGMENTS['Ecclesiastes 9:16']);
    expect(verse('Ecclesiastes', 9, 18)).toBe(SOV12_FRAGMENTS['Ecclesiastes 9:18']);
    expect(verse('Proverbs', 16, 18)).toBe(SOV12_FRAGMENTS['Proverbs 16:18']);
    expect(verse('Proverbs', 26, 11)).toBe(SOV12_FRAGMENTS['Proverbs 26:11']);
    expect(verse('Luke', 14, 28)).toBe(SOV12_FRAGMENTS['Luke 14:28']);
    expect(verse('Proverbs', 28, 13)).toBe(SOV12_FRAGMENTS['Proverbs 28:13']);
  });
  it('the Word LEADS and the eight movements run in order', () => {
    expect(sov12.lesson.indexOf('FIRST, THE KINGDOM')).toBe(0);
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov12.lesson.indexOf(m);
      expect(at, `${m} must appear`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('provenance honesty: the video/Atlantic figures are carried as reported (DR-0076 §8)', () => {
    expect(sov12.lesson).toContain('not independently re-verified here');
    expect(sov12.levels.senior).toContain('not independently re-verified');
  });
  it('teen and senior carry the whole message at full coverage', () => {
    for (const band of ['teen', 'senior']) {
      const t = sov12.levels[band];
      expect(t.toLowerCase()).toContain('scaling laws');
      expect(t).toContain('wisdom is profitable to direct');
      expect(t).toContain('Zechariah 4:6');
      expect(t.length).toBeGreaterThan(2000);
    }
  });
});

// =============================================================================
// sov13 — The Whole Stack (Nvidia/Hugging Face consolidation, captured 2026-08-28)
// Word first (the true Owner), the headline carried AS REPORTED (DR-0076), and
// the Revelation trajectory named soberly (the DIRECTION, never a claim about a
// deal). Every quoted fragment pinned letter-for-letter to the KJV corpus.
// =============================================================================
const SOV13_FRAGMENTS = {
  'Colossians 1:17': 'and by him all things consist',
  'Matthew 6:24': 'No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon.',
  'Psalms 146:3': 'Put not your trust in princes, nor in the son of man, in whom there is no help.',
  'Jeremiah 17:5': 'Cursed be the man that trusteth in man, and maketh flesh his arm, and whose heart departeth from the LORD.',
  'Jeremiah 17:7': 'Blessed is the man that trusteth in the LORD, and whose hope the LORD is.',
  'Proverbs 22:7': 'The rich ruleth over the poor, and the borrower is servant to the lender.',
  'Genesis 47:19': 'buy us and our land for bread, and we and our land will be servants unto Pharaoh',
  'Genesis 47:20': 'And Joseph bought all the land of Egypt for Pharaoh',
  '1 Corinthians 6:12': 'All things are lawful unto me, but all things are not expedient: all things are lawful for me, but I will not be brought under the power of any.',
  'Revelation 13:17': 'no man might buy or sell, save he that had the mark, or the name of the beast',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Deuteronomy 8:17': 'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth.',
  'Deuteronomy 8:18': 'for it is he that giveth thee power to get wealth',
  'Proverbs 18:10': 'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.',
  'Proverbs 11:1': 'A false balance is abomination to the LORD: but a just weight is his delight.',
  'Psalms 24:1': 'and the fulness thereof; the world, and they that dwell therein.',
};

const sov13 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov13-the-whole-stack');

describe('sov13 — the whole stack quotes its Word spine verbatim, Word first', () => {
  it('the week exists and anchors on the ownership + master texts', () => {
    expect(sov13).toBeTruthy();
    expect(sov13.anchor.ref).toContain('Psalms 24:1');
    expect(sov13.anchor.ref).toContain('Matthew 6:24');
    expect(sov13.anchor.ref).toContain('1 Corinthians 6:12');
  });
  it('every quoted fragment is letter-for-letter KJV in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV13_FRAGMENTS)) {
      expect(sov13.lesson, `${ref} must be quoted letter-for-letter`).toContain(fragment);
    }
  });
  it('the Word LEADS: the true Owner is the first movement, before the headline', () => {
    expect(sov13.lesson.indexOf('FIRST, SETTLE WHO ACTUALLY OWNS EVERYTHING')).toBe(0);
    // The ownership verse precedes the Nvidia headline in the lesson.
    expect(sov13.lesson.indexOf('The earth is the LORD')).toBeLessThan(sov13.lesson.indexOf('Nvidia'));
  });
  it('the ten movements are marked FIRST through TENTH, in order', () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov13.lesson.indexOf(m);
      expect(at, `${m} present`).toBeGreaterThan(-1);
      expect(at, `${m} in order`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('the headline is carried AS REPORTED, not as fact (DR-0076 provenance honesty)', () => {
    expect(sov13.lesson).toContain('AS REPORTED');
    expect(sov13.lesson).toContain('$12.9 billion');
    expect(sov13.lesson).toContain('neither company has confirmed');
  });
  it('the Revelation trajectory is named soberly — a direction, never a claim about a deal', () => {
    expect(sov13.lesson).toContain('We do NOT identify any business deal with that end');
    expect(sov13.lesson).toContain('the DIRECTION');
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('Colossians', 1, 17)).toContain(SOV13_FRAGMENTS['Colossians 1:17']);
    expect(verse('Matthew', 6, 24)).toBe(SOV13_FRAGMENTS['Matthew 6:24']);
    expect(verse('Psalms', 146, 3)).toBe(SOV13_FRAGMENTS['Psalms 146:3']);
    expect(verse('Jeremiah', 17, 5)).toContain(SOV13_FRAGMENTS['Jeremiah 17:5']);
    expect(verse('Jeremiah', 17, 7)).toBe(SOV13_FRAGMENTS['Jeremiah 17:7']);
    expect(verse('Proverbs', 22, 7)).toBe(SOV13_FRAGMENTS['Proverbs 22:7']);
    expect(verse('Genesis', 47, 19)).toContain(SOV13_FRAGMENTS['Genesis 47:19']);
    expect(verse('Genesis', 47, 20)).toContain(SOV13_FRAGMENTS['Genesis 47:20']);
    expect(verse('1Corinthians', 6, 12)).toBe(SOV13_FRAGMENTS['1 Corinthians 6:12']);
    expect(verse('Revelation', 13, 17)).toContain(SOV13_FRAGMENTS['Revelation 13:17']);
    expect(verse('Luke', 14, 28)).toBe(SOV13_FRAGMENTS['Luke 14:28']);
    expect(verse('Deuteronomy', 8, 17)).toBe(SOV13_FRAGMENTS['Deuteronomy 8:17']);
    expect(verse('Deuteronomy', 8, 18)).toContain(SOV13_FRAGMENTS['Deuteronomy 8:18']);
    expect(verse('Proverbs', 18, 10)).toBe(SOV13_FRAGMENTS['Proverbs 18:10']);
    expect(verse('Proverbs', 11, 1)).toBe(SOV13_FRAGMENTS['Proverbs 11:1']);
    expect(verse('Psalms', 24, 1)).toContain(SOV13_FRAGMENTS['Psalms 24:1']);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV13_FRAGMENTS['Matthew 6:24'].endsWith('Ye cannot serve God and mammon.')).toBe(true);
    expect(SOV13_FRAGMENTS['Proverbs 22:7']).toBe('The rich ruleth over the poor, and the borrower is servant to the lender.');
    expect(SOV13_FRAGMENTS['1 Corinthians 6:12'].includes('not be brought under the power of any')).toBe(true);
  });
});
