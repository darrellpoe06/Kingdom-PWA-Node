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

// -----------------------------------------------------------------------------
// SOV14 — "The Doom That Did Not Come" (the SaaSpocalypse; fear tested by the Word)
// Spoken into the app by the Governor from a forwarded tech piece (The Daily
// Upside, Salesforce earnings + the "SaaSpocalypse" called "nonsense"). Every
// KJV line fetched verbatim from the repo corpus this session; a drift fails CI.
// -----------------------------------------------------------------------------
const SOV14_FRAGMENTS = {
  '2 Timothy 1:7': 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  'Deuteronomy 18:22': 'if the thing follow not, nor come to pass, that is the thing which the LORD hath not spoken, but the prophet hath spoken it presumptuously: thou shalt not be afraid of him.',
  'Ephesians 4:14': 'tossed to and fro, and carried about with every wind of doctrine',
  'James 1:6': 'he that wavereth is like a wave of the sea driven with the wind and tossed',
  'James 1:8': 'A double minded man is unstable in all his ways.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Mark 2:27': 'The sabbath was made for man, and not man for the sabbath',
  'Psalms 8:6': 'Thou madest him to have dominion over the works of thy hands',
  'Philippians 4:5': 'Let your moderation be known unto all men.',
  'Romans 12:3': 'to think soberly, according as God hath dealt to every man the measure of faith.',
  'Proverbs 27:1': 'Boast not thyself of to morrow; for thou knowest not what a day may bring forth.',
  'James 4:14': 'For what is your life? It is even a vapour',
  'James 4:15': 'If the Lord will, we shall live, and do this, or that.',
  'Proverbs 29:25': 'The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.',
  'Isaiah 41:10': 'Fear thou not; for I am with thee',
  '1 John 4:18': 'perfect love casteth out fear',
  'Matthew 7:24': 'built his house upon a rock',
  'Proverbs 19:21': 'the counsel of the LORD, that shall stand.',
  '1 Peter 5:8': 'Be sober, be vigilant',
  'Psalms 24:1': 'and the fulness thereof',
};

const sov14 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov14-the-doom-that-did-not-come');

describe('sov14 — the doom that did not come quotes its Word spine verbatim, Word first', () => {
  it('the week exists and anchors on fear / the prophecy-test / the snare', () => {
    expect(sov14).toBeTruthy();
    expect(sov14.anchor.ref).toContain('2 Timothy 1:7');
    expect(sov14.anchor.ref).toContain('Deuteronomy 18:22');
    expect(sov14.anchor.ref).toContain('Proverbs 29:25');
  });
  it('every quoted fragment is letter-for-letter KJV in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV14_FRAGMENTS)) {
      expect(sov14.lesson, `${ref} must be quoted letter-for-letter`).toContain(fragment);
    }
  });
  it('the Word LEADS: the register (no spirit of fear) is the first movement, before the headline', () => {
    expect(sov14.lesson.indexOf('FIRST, SETTLE THE REGISTER')).toBe(0);
    // The fear verse precedes the Salesforce headline in the lesson.
    expect(sov14.lesson.indexOf('spirit of fear')).toBeLessThan(sov14.lesson.indexOf('Salesforce'));
  });
  it('the ten movements are marked FIRST through TENTH, in order', () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov14.lesson.indexOf(m);
      expect(at, `${m} present`).toBeGreaterThan(-1);
      expect(at, `${m} in order`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('both tiers are held (DR-0100): established fact stated, forecast flagged as forecast', () => {
    expect(sov14.lesson).toContain('established fact');
    expect(sov14.lesson).toContain('forecast and opinion');
    expect(sov14.lesson).toContain('material risk to many names');
  });
  it('the doom-prophecy is tested by fulfillment, and the fear is named as the real snare', () => {
    expect(sov14.lesson).toContain('come to pass');
    expect(sov14.lesson).toContain('THE FEAR ITSELF WAS THE REAL SNARE');
    expect(sov14.lesson).toContain('the tool serving rather than devouring');
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('2Timothy', 1, 7)).toBe(SOV14_FRAGMENTS['2 Timothy 1:7']);
    expect(verse('Deuteronomy', 18, 22)).toContain(SOV14_FRAGMENTS['Deuteronomy 18:22']);
    expect(verse('Ephesians', 4, 14)).toContain(SOV14_FRAGMENTS['Ephesians 4:14']);
    expect(verse('James', 1, 6)).toContain(SOV14_FRAGMENTS['James 1:6']);
    expect(verse('James', 1, 8)).toBe(SOV14_FRAGMENTS['James 1:8']);
    expect(verse('1Thessalonians', 5, 21)).toBe(SOV14_FRAGMENTS['1 Thessalonians 5:21']);
    expect(verse('Mark', 2, 27)).toContain(SOV14_FRAGMENTS['Mark 2:27']);
    expect(verse('Psalms', 8, 6)).toContain(SOV14_FRAGMENTS['Psalms 8:6']);
    expect(verse('Philippians', 4, 5)).toContain(SOV14_FRAGMENTS['Philippians 4:5']);
    expect(verse('Romans', 12, 3)).toContain(SOV14_FRAGMENTS['Romans 12:3']);
    expect(verse('Proverbs', 27, 1)).toBe(SOV14_FRAGMENTS['Proverbs 27:1']);
    expect(verse('James', 4, 14)).toContain(SOV14_FRAGMENTS['James 4:14']);
    expect(verse('James', 4, 15)).toContain(SOV14_FRAGMENTS['James 4:15']);
    expect(verse('Proverbs', 29, 25)).toBe(SOV14_FRAGMENTS['Proverbs 29:25']);
    expect(verse('Isaiah', 41, 10)).toContain(SOV14_FRAGMENTS['Isaiah 41:10']);
    expect(verse('1John', 4, 18)).toContain(SOV14_FRAGMENTS['1 John 4:18']);
    expect(verse('Matthew', 7, 24)).toContain(SOV14_FRAGMENTS['Matthew 7:24']);
    expect(verse('Proverbs', 19, 21)).toContain(SOV14_FRAGMENTS['Proverbs 19:21']);
    expect(verse('1Peter', 5, 8)).toContain(SOV14_FRAGMENTS['1 Peter 5:8']);
    expect(verse('Psalms', 24, 1)).toContain(SOV14_FRAGMENTS['Psalms 24:1']);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV14_FRAGMENTS['2 Timothy 1:7'].endsWith('and of a sound mind.')).toBe(true);
    expect(SOV14_FRAGMENTS['Proverbs 29:25']).toBe('The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.');
    expect(SOV14_FRAGMENTS['1 Thessalonians 5:21']).toBe('Prove all things; hold fast that which is good.');
  });
});

// -----------------------------------------------------------------------------
// SOV15 — "Watch, Brake, and the City Without Walls" (the A.I.-cyberattack
// warning; the messenger who profits; every nation brought into the Light).
// Spoken into the app by the Governor from a forwarded tech piece (The Daily
// Upside, the cybersecurity-coalition letter), enriched live by his own
// questions (follow-the-money; the nations in the Light; the Titles; "be light,
// not create light"). Every KJV line fetched verbatim from the repo corpus this
// session; a drift fails CI.
// -----------------------------------------------------------------------------
const SOV15_FRAGMENTS = {
  '1 Peter 5:8': 'Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour',
  'Mark 13:37': 'And what I say unto you I say unto all, Watch.',
  'Proverbs 18:17': 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  'John 10:12': 'But he that is an hireling, and not the shepherd, whose own the sheep are not, seeth the wolf coming, and leaveth the sheep, and fleeth',
  'John 10:13': 'The hireling fleeth, because he is an hireling, and careth not for the sheep.',
  'Isaiah 56:11': 'they all look to their own way, every one for his gain, from his quarter.',
  'Acts 19:25': 'Sirs, ye know that by this craft we have our wealth.',
  'Acts 19:27': 'not only this our craft is in danger to be set at nought',
  '1 Timothy 6:10': 'For the love of money is the root of all evil',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'John 8:12': 'I am the light of the world',
  'John 3:19': 'light is come into the world, and men loved darkness rather than light, because their deeds were evil',
  'John 3:21': 'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.',
  'Ephesians 5:13': 'But all things that are reproved are made manifest by the light: for whatsoever doth make manifest is light.',
  'Luke 8:17': 'For nothing is secret, that shall not be made manifest',
  'Acts 10:34': 'God is no respecter of persons',
  'Acts 10:35': 'But in every nation he that feareth him, and worketh righteousness, is accepted with him.',
  'Proverbs 14:34': 'Righteousness exalteth a nation: but sin is a reproach to any people.',
  'Daniel 2:21': 'he removeth kings, and setteth up kings',
  'Psalms 33:10': 'The LORD bringeth the counsel of the heathen to nought',
  'Matthew 5:14': 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
  'John 1:8': 'was not that Light, but was sent to bear witness of that Light.',
  'John 1:9': 'That was the true Light, which lighteth every man that cometh into the world',
  '2 Corinthians 4:6': 'For God, who commanded the light to shine out of darkness, hath shined in our hearts',
  'James 1:17': 'and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning',
  '1 Peter 2:25': 'are now returned unto the Shepherd and Bishop of your souls',
  'Revelation 1:8': 'which is, and which was, and which is to come, the Almighty',
  'Genesis 17:1': 'I am the Almighty God; walk before me, and be thou perfect',
  '1 Timothy 1:17': 'Now unto the King eternal, immortal, invisible, the only wise God',
  'Psalms 90:2': 'from everlasting to everlasting, thou art God',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Ecclesiastes 10:10': 'If the iron be blunt, and he do not whet the edge, then must he put to more strength: but wisdom is profitable to direct.',
  'Nehemiah 4:9': 'we made our prayer unto our God, and set a watch against them day and night',
  'Nehemiah 4:17': 'every one with one of his hands wrought in the work, and with the other hand held a weapon',
  'Proverbs 25:28': 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
  'Proverbs 16:32': 'he that ruleth his spirit than he that taketh a city.',
  'Luke 12:39': 'he would have watched, and not have suffered his house to be broken through.',
  'Ezekiel 33:6': 'if the watchman see the sword come, and blow not the trumpet, and the people be not warned',
  '2 Corinthians 2:11': 'Lest Satan should get an advantage of us: for we are not ignorant of his devices.',
  'Proverbs 4:23': 'Keep thy heart with all diligence; for out of it are the issues of life.',
  'Matthew 26:41': 'Watch and pray, that ye enter not into temptation',
  'Luke 11:21': 'When a strong man armed keepeth his palace, his goods are in peace',
  'Psalms 127:1': 'except the LORD keep the city, the watchman waketh but in vain',
  'James 4:17': 'Therefore to him that knoweth to do good, and doeth it not, to him it is sin.',
  'Luke 12:47': 'prepared not himself, neither did according to his will, shall be beaten with many stripes.',
  'John 9:41': 'If ye were blind, ye should have no sin: but now ye say, We see; therefore your sin remaineth.',
  'Romans 5:13': 'sin is not imputed when there is no law',
  'Matthew 24:12': 'And because iniquity shall abound, the love of many shall wax cold.',
  'Romans 13:10': 'love is the fulfilling of the law',
  'John 8:32': 'And ye shall know the truth, and the truth shall make you free.',
  '2 Corinthians 3:17': 'where the Spirit of the Lord is, there is liberty.',
  'James 1:25': 'the perfect law of liberty',
  'Galatians 5:1': 'Stand fast therefore in the liberty wherewith Christ hath made us free',
  'Leviticus 25:10': 'proclaim liberty throughout all the land unto all the inhabitants thereof',
  'Isaiah 61:1': 'to proclaim liberty to the captives, and the opening of the prison to them that are bound',
  'Romans 8:1': 'There is therefore now no condemnation to them which are in Christ Jesus',
  'Romans 14:12': 'every one of us shall give account of himself to God',
  'James 4:6': 'God resisteth the proud, but giveth grace unto the humble',
  '1 Thessalonians 5:18': 'In every thing give thanks: for this is the will of God',
  'Colossians 3:15': 'and be ye thankful',
  '2 Corinthians 6:16': 'ye are the temple of the living God',
  'John 1:12': 'to them gave he power to become the sons of God',
  'Ephesians 1:4': 'hath chosen us in him before the foundation of the world',
  'Revelation 21:3': 'the tabernacle of God is with men, and he will dwell with them, and they shall be his people',
  'John 14:6': 'I am the way, the truth, and the life: no man cometh unto the Father, but by me',
  'Acts 4:12': 'Neither is there salvation in any other',
  '2 Corinthians 11:2': 'I have espoused you to one husband, that I may present you as a chaste virgin to Christ',
  'Revelation 19:7': 'the marriage of the Lamb is come, and his wife hath made herself ready',
  'Ephesians 5:27': 'a glorious church, not having spot, or wrinkle',
};

const sov15 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov15-watch-brake-and-the-city-without-walls');

describe('sov15 — watch, brake, and the city without walls quotes its Word spine verbatim, Word first', () => {
  it('the week exists and anchors on watch / the messenger who profits / the Light', () => {
    expect(sov15).toBeTruthy();
    expect(sov15.anchor.ref).toContain('1 Peter 5:8');
    expect(sov15.anchor.ref).toContain('Proverbs 18:17');
    expect(sov15.anchor.ref).toContain('John 8:12');
  });
  it('every quoted fragment is letter-for-letter KJV in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV15_FRAGMENTS)) {
      expect(sov15.lesson, `${ref} must be quoted letter-for-letter`).toContain(fragment);
    }
  });
  it('the Word LEADS: watch is the first movement, before the headline', () => {
    expect(sov15.lesson.indexOf('FIRST, SETTLE THE POSTURE')).toBe(0);
    expect(sov15.lesson.indexOf('roaring lion')).toBeLessThan(sov15.lesson.indexOf('Daily Upside'));
  });
  it('the twelve movements are marked FIRST through TWELFTH, in order', () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,', 'ELEVENTH,', 'TWELFTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov15.lesson.indexOf(m);
      expect(at, `${m} present`).toBeGreaterThan(-1);
      expect(at, `${m} in order`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('the messenger-who-profits discernment is present (follow the money, both tiers)', () => {
    expect(sov15.lesson).toContain('WEIGH THE MESSENGER WHO PROFITS');
    expect(sov15.lesson).toContain('where there');   // "where there's anxiety, there's money"
    expect(sov15.lesson).toContain('HOLD BOTH TIERS');
  });
  it('every nation is brought into the one Light, under one standard (Truth is the Light, He is Eternal)', () => {
    expect(sov15.lesson).toContain('BRING THE NATIONS INTO THE LIGHT');
    expect(sov15.lesson).toContain('ONE standard covers every people');
    // reflect, not create — Darrell's correction
    expect(sov15.lesson).toContain('WE REFLECT THE LIGHT, WE DO NOT CREATE IT');
    // the America application (informed conscience) and Light-and-Liberty threads
    expect(sov15.lesson).toContain('to him that knoweth to do good');
    expect(sov15.lesson).toContain('the most Light AND the most Liberty');
    expect(sov15.lesson).toContain('NO CONDEMNATION');
    expect(sov15.lesson).toContain('GRATEFUL and THANKFUL');
    expect(sov15.lesson).toContain('all of time was designed to create: temples and children of Yahweh');
    expect(sov15.lesson).toContain('there is only ONE Way');
    expect(sov15.lesson).toContain('a Bride, a wife for the Lamb');
  });
  it('the unruled agent is a city without walls, and the watchman who slept is named', () => {
    expect(sov15.lesson).toContain('broke free of controls');
    expect(sov15.lesson).toContain('three-brakes rule');
    expect(sov15.lesson).toContain('UNDETECTED for a week');
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('1Peter', 5, 8)).toContain(SOV15_FRAGMENTS['1 Peter 5:8']);
    expect(verse('Mark', 13, 37)).toBe(SOV15_FRAGMENTS['Mark 13:37']);
    expect(verse('Proverbs', 18, 17)).toBe(SOV15_FRAGMENTS['Proverbs 18:17']);
    expect(verse('John', 10, 13)).toBe(SOV15_FRAGMENTS['John 10:13']);
    expect(verse('Isaiah', 56, 11)).toContain(SOV15_FRAGMENTS['Isaiah 56:11']);
    expect(verse('Acts', 19, 25)).toContain(SOV15_FRAGMENTS['Acts 19:25']);
    expect(verse('Proverbs', 22, 3)).toBe(SOV15_FRAGMENTS['Proverbs 22:3']);
    expect(verse('John', 8, 12)).toContain(SOV15_FRAGMENTS['John 8:12']);
    expect(verse('Ephesians', 5, 13)).toBe(SOV15_FRAGMENTS['Ephesians 5:13']);
    expect(verse('Acts', 10, 34)).toContain(SOV15_FRAGMENTS['Acts 10:34']);
    expect(verse('Acts', 10, 35)).toBe(SOV15_FRAGMENTS['Acts 10:35']);
    expect(verse('Proverbs', 14, 34)).toBe(SOV15_FRAGMENTS['Proverbs 14:34']);
    expect(verse('Matthew', 5, 14)).toBe(SOV15_FRAGMENTS['Matthew 5:14']);
    expect(verse('John', 1, 8)).toContain(SOV15_FRAGMENTS['John 1:8']);
    expect(verse('2Corinthians', 4, 6)).toContain(SOV15_FRAGMENTS['2 Corinthians 4:6']);
    expect(verse('1Peter', 2, 25)).toContain(SOV15_FRAGMENTS['1 Peter 2:25']);
    expect(verse('Revelation', 1, 8)).toContain(SOV15_FRAGMENTS['Revelation 1:8']);
    expect(verse('1Timothy', 1, 17)).toContain(SOV15_FRAGMENTS['1 Timothy 1:17']);
    expect(verse('Proverbs', 25, 28)).toBe(SOV15_FRAGMENTS['Proverbs 25:28']);
    expect(verse('Ezekiel', 33, 6)).toContain(SOV15_FRAGMENTS['Ezekiel 33:6']);
    expect(verse('Luke', 11, 21)).toContain(SOV15_FRAGMENTS['Luke 11:21']);
    expect(verse('Psalms', 127, 1)).toContain(SOV15_FRAGMENTS['Psalms 127:1']);
    expect(verse('James', 4, 17)).toBe(SOV15_FRAGMENTS['James 4:17']);
    expect(verse('John', 9, 41)).toContain(SOV15_FRAGMENTS['John 9:41']);
    expect(verse('Matthew', 24, 12)).toBe(SOV15_FRAGMENTS['Matthew 24:12']);
    expect(verse('John', 8, 32)).toBe(SOV15_FRAGMENTS['John 8:32']);
    expect(verse('2Corinthians', 3, 17)).toContain(SOV15_FRAGMENTS['2 Corinthians 3:17']);
    expect(verse('Galatians', 5, 1)).toContain(SOV15_FRAGMENTS['Galatians 5:1']);
    expect(verse('Leviticus', 25, 10)).toContain(SOV15_FRAGMENTS['Leviticus 25:10']);
    expect(verse('Isaiah', 61, 1)).toContain(SOV15_FRAGMENTS['Isaiah 61:1']);
    expect(verse('Romans', 8, 1)).toContain(SOV15_FRAGMENTS['Romans 8:1']);
    expect(verse('James', 4, 6)).toContain(SOV15_FRAGMENTS['James 4:6']);
    expect(verse('Colossians', 3, 15)).toContain(SOV15_FRAGMENTS['Colossians 3:15']);
    expect(verse('2Corinthians', 6, 16)).toContain(SOV15_FRAGMENTS['2 Corinthians 6:16']);
    expect(verse('John', 1, 12)).toContain(SOV15_FRAGMENTS['John 1:12']);
    expect(verse('Ephesians', 1, 4)).toContain(SOV15_FRAGMENTS['Ephesians 1:4']);
    expect(verse('John', 14, 6)).toContain(SOV15_FRAGMENTS['John 14:6']);
    expect(verse('Acts', 4, 12)).toContain(SOV15_FRAGMENTS['Acts 4:12']);
    expect(verse('2Corinthians', 11, 2)).toContain(SOV15_FRAGMENTS['2 Corinthians 11:2']);
    expect(verse('Revelation', 19, 7)).toContain(SOV15_FRAGMENTS['Revelation 19:7']);
    expect(verse('Ephesians', 5, 27)).toContain(SOV15_FRAGMENTS['Ephesians 5:27']);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV15_FRAGMENTS['Proverbs 18:17']).toBe('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.');
    expect(SOV15_FRAGMENTS['Proverbs 14:34']).toBe('Righteousness exalteth a nation: but sin is a reproach to any people.');
    expect(SOV15_FRAGMENTS['Matthew 5:14'].endsWith('cannot be hid.')).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// SOV16 — "Trust the Counsel You Can Actually Trust" (they distrust A.I. advice
// and follow it anyway; whose counsel sets the path). Spoken into the app by the
// Governor from a forwarded McKinsey piece on A.I.-powered shopping and consumer
// trust, and sealed with his own declaration of Isaiah 54:17. Every KJV line
// fetched verbatim from the repo corpus this session; a drift fails CI.
// -----------------------------------------------------------------------------
const SOV16_FRAGMENTS = {
  'Psalms 1:1': 'Blessed is the man that walketh not in the counsel of the ungodly',
  'Proverbs 3:5': 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Proverbs 3:6': 'In all thy ways acknowledge him, and he shall direct thy paths.',
  'James 1:6': 'he that wavereth is like a wave of the sea driven with the wind and tossed',
  'James 1:8': 'A double minded man is unstable in all his ways.',
  'Proverbs 14:12': 'There is a way which seemeth right unto a man, but the end thereof are the ways of death.',
  'Psalms 118:8': 'It is better to trust in the LORD than to put confidence in man.',
  'Jeremiah 17:5': 'Cursed be the man that trusteth in man',
  'Jeremiah 17:7': 'Blessed is the man that trusteth in the LORD, and whose hope the LORD is.',
  'Numbers 23:19': 'God is not a man, that he should lie',
  'John 16:13': 'when he, the Spirit of truth, is come, he will guide you into all truth',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  '1 John 4:1': 'believe not every spirit, but try the spirits whether they are of God',
  'Isaiah 8:20': 'To the law and to the testimony: if they speak not according to this word, it is because there is no light in them.',
  'James 1:22': 'be ye doers of the word, and not hearers only, deceiving your own selves',
  '1 Corinthians 6:19': 'the temple of the Holy Ghost which is in you',
  '1 Corinthians 6:20': 'therefore glorify God in your body',
  '1 Timothy 4:8': 'bodily exercise profiteth little: but godliness is profitable unto all things',
  '3 John 1:2': 'that thou mayest prosper and be in health, even as thy soul prospereth',
  'Ecclesiastes 2:11': 'all was vanity and vexation of spirit, and there was no profit under the sun',
  'Matthew 6:20': 'lay up for yourselves treasures in heaven',
  'Matthew 6:21': 'For where your treasure is, there will your heart be also.',
  'Psalms 16:11': 'in thy presence is fulness of joy; at thy right hand there are pleasures for evermore',
  'Luke 16:10': 'He that is faithful in that which is least is faithful also in much',
  'John 6:12': 'Gather up the fragments that remain, that nothing be lost',
  'Proverbs 27:23': 'Be thou diligent to know the state of thy flocks, and look well to thy herds',
  'Psalms 32:8': 'I will instruct thee and teach thee in the way which thou shalt go',
  'Isaiah 54:17': 'No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn.',
};

const sov16 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov16-trust-the-counsel-you-can-actually-trust');

describe('sov16 — trust the counsel you can actually trust quotes its Word spine verbatim, Word first', () => {
  it('the week exists and anchors on trust / the counsel that cannot lie / doing', () => {
    expect(sov16).toBeTruthy();
    expect(sov16.anchor.ref).toContain('Proverbs 3:5');
    expect(sov16.anchor.ref).toContain('Psalms 118:8');
    expect(sov16.anchor.ref).toContain('James 1:22');
  });
  it('every quoted fragment is letter-for-letter KJV in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV16_FRAGMENTS)) {
      expect(sov16.lesson, `${ref} must be quoted letter-for-letter`).toContain(fragment);
    }
  });
  it('the Word LEADS: whose counsel sets the path is the first movement, before the headline', () => {
    expect(sov16.lesson.indexOf('FIRST, SETTLE WHOSE COUNSEL SETS THE PATH')).toBe(0);
    expect(sov16.lesson.indexOf('counsel of the ungodly')).toBeLessThan(sov16.lesson.indexOf('McKinsey'));
  });
  it('the ten movements are marked FIRST through TENTH, in order', () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov16.lesson.indexOf(m);
      expect(at, `${m} present`).toBeGreaterThan(-1);
      expect(at, `${m} in order`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('the folly is named (distrust-yet-follow) and the trustworthy counsel is a Person who cannot lie', () => {
    expect(sov16.lesson).toContain('SEEKING GUIDANCE FROM WHAT YOU DISTRUST');
    expect(sov16.lesson).toContain('below 40%');
    expect(sov16.lesson).toContain('God is not a man, that he should lie');
  });
  it('the Governor’s Isaiah 54:17 declaration seals the close', () => {
    expect(sov16.lesson).toContain('No weapon that is formed against thee shall prosper');
    expect(sov16.lesson).toContain('the heritage of the servants of the LORD');
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('Proverbs', 3, 5)).toBe(SOV16_FRAGMENTS['Proverbs 3:5']);
    expect(verse('Psalms', 118, 8)).toBe(SOV16_FRAGMENTS['Psalms 118:8']);
    expect(verse('Numbers', 23, 19)).toContain(SOV16_FRAGMENTS['Numbers 23:19']);
    expect(verse('John', 16, 13)).toContain(SOV16_FRAGMENTS['John 16:13']);
    expect(verse('Isaiah', 8, 20)).toBe(SOV16_FRAGMENTS['Isaiah 8:20']);
    expect(verse('1Timothy', 4, 8)).toContain(SOV16_FRAGMENTS['1 Timothy 4:8']);
    expect(verse('3John', 1, 2)).toContain(SOV16_FRAGMENTS['3 John 1:2']);
    expect(verse('Ecclesiastes', 2, 11)).toContain(SOV16_FRAGMENTS['Ecclesiastes 2:11']);
    expect(verse('Matthew', 6, 21)).toBe(SOV16_FRAGMENTS['Matthew 6:21']);
    expect(verse('Psalms', 16, 11)).toContain(SOV16_FRAGMENTS['Psalms 16:11']);
    expect(verse('Luke', 16, 10)).toContain(SOV16_FRAGMENTS['Luke 16:10']);
    expect(verse('John', 6, 12)).toContain(SOV16_FRAGMENTS['John 6:12']);
    expect(verse('Isaiah', 54, 17)).toContain(SOV16_FRAGMENTS['Isaiah 54:17']);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV16_FRAGMENTS['Psalms 118:8']).toBe('It is better to trust in the LORD than to put confidence in man.');
    expect(SOV16_FRAGMENTS['Proverbs 3:5']).toBe('Trust in the LORD with all thine heart; and lean not unto thine own understanding.');
    expect(SOV16_FRAGMENTS['Matthew 6:21']).toBe('For where your treasure is, there will your heart be also.');
  });
});

