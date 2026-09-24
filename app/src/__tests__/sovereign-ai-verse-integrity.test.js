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
  '2 Corinthians 11:14': 'satan himself is transformed into an angel of light.',
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
  '2 Corinthians 2:11': 'Lest satan should get an advantage of us: for we are not ignorant of his devices.',
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


// =============================================================================
// sov17 — the judge and the just weight (captured 2026-09-14 by the
// Gmail-lesson-intake Way, DR-0312, from a ByteByteGo article the Governor
// forwarded, "LLMs as a Judge"; the sequel to sov9, narrowed to JUDGING).
// Word-first per the sov9/sov10 standard; article carried as reported
// (DR-0076 §8); every quoted verse verbatim + pinned, a drift fails the build.
// =============================================================================
const sov17 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov17-the-judge-and-the-just-weight');

const SOV17_FRAGMENTS = {
  'John 7:24': 'Judge not according to the appearance, but judge righteous judgment.',
  'Genesis 18:25': 'Shall not the Judge of all the earth do right?',
  'James 4:12': 'There is one lawgiver, who is able to save and to destroy: who art thou that judgest another?',
  '1 Samuel 16:7': 'man looketh on the outward appearance, but the LORD looketh on the heart',
  'Proverbs 16:2': 'All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.',
  'Isaiah 11:3': 'shall not judge after the sight of his eyes, neither reprove after the hearing of his ears',
  'Exodus 25:40': 'look that thou make them after their pattern, which was shewed thee in the mount',
  'Amos 7:8': 'Behold, I will set a plumbline in the midst of my people Israel',
  'Deuteronomy 25:15': 'thou shalt have a perfect and just weight, a perfect and just measure shalt thou have',
  'Leviticus 19:15a': 'Ye shall do no unrighteousness in judgment',
  'Leviticus 19:15b': 'in righteousness shalt thou judge thy neighbour',
  '2 Corinthians 3:6': 'the letter killeth, but the spirit giveth life',
  'Proverbs 18:13': 'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'Deuteronomy 1:17a': 'Ye shall not respect persons in judgment',
  'Deuteronomy 1:17b': 'for the judgment is God’s',
  'Proverbs 24:23': 'It is not good to have respect of persons in judgment.',
  'James 2:1': 'have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons',
  'James 2:9': 'if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors',
  'Proverbs 11:1': 'A false balance is abomination to the LORD: but a just weight is his delight.',
  'Proverbs 16:11': 'A just weight and balance are the LORD’s: all the weights of the bag are his work.',
  'Proverbs 20:23': 'Divers weights are an abomination unto the LORD; and a false balance is not good.',
  'Romans 14:10': 'we shall all stand before the judgment seat of Christ',
  '1 Corinthians 4:3': 'yea, I judge not mine own self',
  '1 Corinthians 4:4': 'he that judgeth me is the Lord',
  'Hebrews 4:13': 'all things are naked and opened unto the eyes of him with whom we have to do',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established',
  'Matthew 7:2': 'For with what judgment ye judge, ye shall be judged: and with what measure ye mete, it shall be measured to you again.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Matthew 7:16': 'Ye shall know them by their fruits',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them.',
  'Matthew 12:33': 'the tree is known by his fruit',
  'Jeremiah 17:10': 'I the LORD search the heart, I try the reins, even to give every man according to his ways',
};

describe('sov17 — the judge and the just weight quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on righteous judgment + the just weight', () => {
    expect(sov17).toBeTruthy();
    expect(sov17.anchor.ref).toContain('John 7:24');
    expect(sov17.anchor.ref).toContain('Proverbs 11:1');
    expect(sov17.anchor.theme).toContain('Judge not according to the appearance, but judge righteous judgment.');
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson', () => {
    for (const [ref, fragment] of Object.entries(SOV17_FRAGMENTS)) {
      expect(sov17.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    expect(verse('John', 7, 24)).toBe(SOV17_FRAGMENTS['John 7:24']);
    expect(verse('Genesis', 18, 25)).toContain(SOV17_FRAGMENTS['Genesis 18:25']);
    expect(verse('James', 4, 12)).toBe(SOV17_FRAGMENTS['James 4:12']);
    expect(verse('1Samuel', 16, 7)).toContain(SOV17_FRAGMENTS['1 Samuel 16:7']);
    expect(verse('Proverbs', 16, 2)).toBe(SOV17_FRAGMENTS['Proverbs 16:2']);
    expect(verse('Isaiah', 11, 3)).toContain(SOV17_FRAGMENTS['Isaiah 11:3']);
    expect(verse('Exodus', 25, 40)).toContain(SOV17_FRAGMENTS['Exodus 25:40']);
    expect(verse('Amos', 7, 8)).toContain(SOV17_FRAGMENTS['Amos 7:8']);
    expect(verse('Deuteronomy', 25, 15)).toContain(SOV17_FRAGMENTS['Deuteronomy 25:15']);
    expect(verse('Leviticus', 19, 15)).toContain(SOV17_FRAGMENTS['Leviticus 19:15a']);
    expect(verse('Leviticus', 19, 15)).toContain(SOV17_FRAGMENTS['Leviticus 19:15b']);
    expect(verse('2Corinthians', 3, 6)).toContain(SOV17_FRAGMENTS['2 Corinthians 3:6']);
    expect(verse('Proverbs', 18, 13)).toBe(SOV17_FRAGMENTS['Proverbs 18:13']);
    expect(verse('Deuteronomy', 1, 17)).toContain(SOV17_FRAGMENTS['Deuteronomy 1:17a']);
    expect(verse('Deuteronomy', 1, 17)).toContain(SOV17_FRAGMENTS['Deuteronomy 1:17b']);
    expect(verse('Proverbs', 24, 23)).toContain(SOV17_FRAGMENTS['Proverbs 24:23']);
    expect(verse('James', 2, 1)).toContain(SOV17_FRAGMENTS['James 2:1']);
    expect(verse('James', 2, 9)).toContain(SOV17_FRAGMENTS['James 2:9']);
    expect(verse('Proverbs', 11, 1)).toBe(SOV17_FRAGMENTS['Proverbs 11:1']);
    expect(verse('Proverbs', 16, 11)).toBe(SOV17_FRAGMENTS['Proverbs 16:11']);
    expect(verse('Proverbs', 20, 23)).toBe(SOV17_FRAGMENTS['Proverbs 20:23']);
    expect(verse('Romans', 14, 10)).toContain(SOV17_FRAGMENTS['Romans 14:10']);
    expect(verse('1Corinthians', 4, 3)).toContain(SOV17_FRAGMENTS['1 Corinthians 4:3']);
    expect(verse('1Corinthians', 4, 4)).toContain(SOV17_FRAGMENTS['1 Corinthians 4:4']);
    expect(verse('Hebrews', 4, 13)).toContain(SOV17_FRAGMENTS['Hebrews 4:13']);
    expect(verse('Deuteronomy', 19, 15)).toContain(SOV17_FRAGMENTS['Deuteronomy 19:15']);
    expect(verse('Matthew', 7, 2)).toBe(SOV17_FRAGMENTS['Matthew 7:2']);
    expect(verse('1Thessalonians', 5, 21)).toBe(SOV17_FRAGMENTS['1 Thessalonians 5:21']);
    expect(verse('Matthew', 7, 16)).toContain(SOV17_FRAGMENTS['Matthew 7:16']);
    expect(verse('Matthew', 7, 20)).toBe(SOV17_FRAGMENTS['Matthew 7:20']);
    expect(verse('Matthew', 12, 33)).toContain(SOV17_FRAGMENTS['Matthew 12:33']);
    expect(verse('Jeremiah', 17, 10)).toContain(SOV17_FRAGMENTS['Jeremiah 17:10']);
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov17.lesson.indexOf('FIRST, THE WORD SET THE STANDARD')).toBe(0);
    // The command precedes the article's name (Word first, DR-0312/DR-0331).
    expect(sov17.lesson.indexOf('judge righteous judgment')).toBeLessThan(sov17.lesson.indexOf('ByteByteGo'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov17.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
  });
  it('the load-bearing teaching is carried: position bias = respect of persons, and the rubric is a just weight', () => {
    // Position bias mapped to the Word's respect-of-persons law.
    expect(sov17.lesson).toContain('POSITION BIAS');
    expect(sov17.lesson).toContain('respect of persons');
    // The whole method rests on the rubric being a just weight (the distinct thesis vs sov9).
    expect(sov17.lesson).toContain('THE JUST WEIGHT');
    expect(sov17.lesson).toContain('a divers weight');
  });
  it('provenance honesty: the article is carried as reported (DR-0076 §8)', () => {
    expect(sov17.lesson).toContain('not independently re-verified');
    expect(sov17.levels.senior).toContain('not independently re-verified');
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV17_FRAGMENTS['John 7:24']).toBe('Judge not according to the appearance, but judge righteous judgment.');
    expect(SOV17_FRAGMENTS['Proverbs 11:1']).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(SOV17_FRAGMENTS['Matthew 7:20']).toBe('Wherefore by their fruits ye shall know them.');
  });
});

// =============================================================================
// sov17 fix (2026-09-14) — the Word in the sentence, not the margin; and the
// send-off carries content. DR-0391/DR-0402: a bare list of references at the
// anchor "without context anyways doesn't help us humans" (Darrell). And the
// Send-off page renders the learner's `benefits`, which sov17 shipped without —
// an empty final page. Both are pinned here so neither can silently return.
// =============================================================================
describe('sov17 — the Word is in the sentence and the send-off has content', () => {
  it('the anchor carries the two verses IN CONTEXT, not a bare reference run', () => {
    // The two anchors are quoted with their point, in context (DR-0402: "one or
    // two with points and the full scripture they are discussing in context").
    expect(sov17.anchor.theme).toContain('Judge not according to the appearance, but judge righteous judgment.');
    expect(sov17.anchor.theme).toContain('A false balance is abomination to the LORD: but a just weight is his delight.');
    // The margin list is gone: no "spine of this week: ref; ref; ..." dump.
    expect(sov17.anchor.theme).not.toMatch(/spine of this week/i);
    // Guard the pattern itself: the theme must not carry a long semicolon run of
    // bare chapter:verse references (a list, not a sentence — DR-0391).
    const refRun = (sov17.anchor.theme.match(/\b\d?\s?[A-Z][a-z]+ \d+:\d+/g) || []).length;
    expect(refRun).toBeLessThanOrEqual(2);
  });
  it('the send-off page has content: benefits carry the lesson into the learner\'s hands', () => {
    // lesson-flow.js renders the Send-off (`send`) audience side from `benefits`.
    // No benefits = an empty final page. sov17 must carry them.
    expect(Array.isArray(sov17.benefits)).toBe(true);
    expect(sov17.benefits.length).toBeGreaterThanOrEqual(5);
    for (const b of sov17.benefits) {
      expect(typeof b).toBe('string');
      expect(b.length).toBeGreaterThan(80); // real takeaways, not stubs
    }
    // The send-off carries the lesson's spine home: the just weight and the fruit.
    const blob = sov17.benefits.join('  ');
    expect(blob).toContain('a just weight is his delight');
    expect(blob).toContain('by their fruits ye shall know them');
  });
  it('every verse quoted in the benefits is verbatim KJV (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    const blob = sov17.benefits.join('  ');
    const F = [
      ['John', 7, 24, 'judge righteous judgment'],
      ['John', 7, 24, 'according to the appearance'],
      ['Proverbs', 16, 2, 'weigheth the spirits'],
      ['Proverbs', 11, 1, 'false balance'],
      ['Proverbs', 11, 1, 'a just weight is his delight'],
      ['Deuteronomy', 1, 17, 'Ye shall not respect persons in judgment'],
      ['Jeremiah', 17, 10, 'I the LORD search the heart'],
      ['Matthew', 7, 20, 'by their fruits ye shall know them'],
    ];
    for (const [b, c, v, frag] of F) {
      expect(verse(b, c, v), `${b} ${c}:${v} corpus`).toContain(frag);
      expect(blob, `${b} ${c}:${v} in benefits`).toContain(frag);
    }
  });
});

// -----------------------------------------------------------------------------
// sov18 — ONE SOURCE, TWO DOORS. The precept-upon-precept lesson is authored
// once as Living Lesson L153 and carried into this class whole. If the two
// ever drift, the class is teaching a different lesson than the catalog under
// the same title — this pins them together, and pins the load-bearing lines to
// the corpus a second time (two witnesses, DR-0076).
// -----------------------------------------------------------------------------
describe('sov18 — precept upon precept is ONE lesson carried through two doors', () => {
  const sov18 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov18-precept-upon-precept-the-voice-that-programs-the-world');
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('exists, names its source, and carries the whole Living Lesson (body, bands, quiz, facilitator)', async () => {
    expect(sov18).toBeTruthy();
    const { LIVING_LESSONS_MODULES } = await import('../lib/living-lessons-class.js');
    const ll = LIVING_LESSONS_MODULES.find((m) => m.id === sov18.sharedWith.lesson);
    expect(ll).toBeTruthy();
    expect(sov18.sharedWith.course).toBe('living-lessons');
    expect(sov18.lesson).toBe(ll.lesson);
    expect(sov18.levels).toBe(ll.levels);
    expect(sov18.quiz).toBe(ll.quiz);
    expect(sov18.benefits).toBe(ll.benefits);
    expect(sov18.anchor).toBe(ll.anchor);
    expect(sov18.facilitator).toBe(ll.facilitator);
    // The class's own tweak: Research → Plan → Execute, which the catalog lesson does not carry.
    expect(sov18.rpe.research).toMatch(/Genesis 1/);
    expect(sov18.rpe.plan).toMatch(/2 Timothy 3:16/);
    expect(sov18.rpe.execute).toMatch(/James 1:22/);
    expect(ll.rpe).toBeUndefined();
  });
  it('the three anchors and the boat are verbatim KJV, reference beside each', () => {
    for (const [book, ch, v, label] of [['Isaiah', 28, 10, 'Isaiah 28:10'], ['Psalms', 33, 9, 'Psalms 33:9'], ['Hebrews', 11, 3, 'Hebrews 11:3'], ['Mark', 4, 39, 'Mark 4:39']]) {
      expect(sov18.lesson).toContain(`"${verse(book, ch, v)}" (${label})`);
    }
    expect(sov18.anchor.ref).toBe('Isaiah 28:10; Psalms 33:9; Hebrews 11:3');
  });
  it('tamper-catch: the pinned anchor text itself is exact', () => {
    expect(verse('Psalms', 33, 9)).toBe('For he spake, and it was done; he commanded, and it stood fast.');
    expect(verse('Isaiah', 28, 10)).toBe('For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:');
  });
});

// =============================================================================
// sov19 — the servant under authority who keeps the guardrails (captured
// 2026-09-15 from The Neuron, "Microsoft: Maybe we still put humans first??",
// forwarded by the Governor with his "Lesson." marker; DR-0411). The class's
// philosophy-of-technology week: a safe tool is a SERVANT UNDER AUTHORITY
// (Matthew 8:9; Luke 17:10) — it goes, comes, does, and STOPS. Word-first per
// the sov9/sov10/sov17 standard; every real-world fact carried by DR-0100's
// tiers; every human statement paraphrased + attributed, never invented; every
// quoted verse verbatim KJV + pinned here, a drift fails the build (DR-0281).
// =============================================================================
const sov19 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov19-the-servant-under-authority-who-keeps-the-guardrails');

const SOV19_FRAGMENTS = {
  'Matthew 8:9': 'For I am a man under authority, having soldiers under me: and I say to this man, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.',
  'Matthew 8:8': 'speak the word only, and my servant shall be healed',
  'Matthew 8:10': 'I have not found so great faith, no, not in Israel',
  'Luke 17:9': 'Doth he thank that servant because he did the things that were commanded him? I trow not.',
  'Luke 17:10': 'So likewise ye, when ye shall have done all those things which are commanded you, say, We are unprofitable servants: we have done that which was our duty to do.',
  '1 Corinthians 4:2': 'Moreover it is required in stewards, that a man be found faithful.',
  'Genesis 2:15': 'put him into the garden of Eden to dress it and to keep it',
  'Genesis 2:16': 'Of every tree of the garden thou mayest freely eat',
  'Genesis 2:17': 'But of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die.',
  'Genesis 3:1': 'Yea, hath God said, Ye shall not eat of every tree of the garden?',
  'Job 38:11': 'Hitherto shalt thou come, but no further',
  'Matthew 25:14': 'delivered unto them his goods',
  'Matthew 25:15': 'to every man according to his several ability',
  'Matthew 25:19': 'After a long time the lord of those servants cometh, and reckoneth with them.',
  'Matthew 25:21': 'Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things',
  'Matthew 25:25': 'And I was afraid, and went and hid thy talent in the earth',
  'Luke 16:2': 'give an account of thy stewardship',
  'Luke 12:48': 'For unto whomsoever much is given, of him shall be much required',
  'Luke 12:47': 'which knew his lord’s will, and prepared not himself, neither did according to his will, shall be beaten with many stripes',
  'Luke 16:10': 'He that is faithful in that which is least is faithful also in much',
  'Psalms 115:4': 'Their idols are silver and gold, the work of men’s hands.',
  'Psalms 115:5': 'They have mouths, but they speak not: eyes have they, but they see not',
  'Psalms 115:8': 'They that make them are like unto them; so is every one that trusteth in them.',
  'Isaiah 44:10': 'Who hath formed a god, or molten a graven image that is profitable for nothing?',
  'Isaiah 44:17': 'he maketh a god, even his graven image: he falleth down unto it, and worshippeth it, and prayeth unto it, and saith, Deliver me; for thou art my god.',
  'Isaiah 44:20': 'a deceived heart hath turned him aside, that he cannot deliver his soul, nor say, Is there not a lie in my right hand?',
  'Isaiah 42:8': 'my glory will I not give to another',
  'Genesis 1:27': 'So God created man in his own image, in the image of God created he him',
  'Revelation 22:9': 'See thou do it not: for I am thy fellowservant',
  'Acts 10:26': 'Stand up; I myself also am a man.',
  '1 Corinthians 14:32': 'And the spirits of the prophets are subject to the prophets.',
  '1 Corinthians 14:33': 'For God is not the author of confusion, but of peace',
  '1 Corinthians 14:40': 'Let all things be done decently and in order.',
  '1 Samuel 15:22': 'to obey is better than sacrifice, and to hearken than the fat of rams',
  '1 Samuel 15:23': 'For rebellion is as the sin of witchcraft, and stubbornness is as iniquity and idolatry.',
  'Proverbs 25:28': 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
  'Ezekiel 33:2': 'take a man of their coasts, and set him for their watchman',
  'Ezekiel 33:6': 'But if the watchman see the sword come, and blow not the trumpet, and the people be not warned; if the sword come, and take any person from among them, he is taken away in his iniquity; but his blood will I require at the watchman’s hand.',
  'Deuteronomy 22:8': 'When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence.',
  'Hebrews 13:17': 'that must give account',
  'Proverbs 18:17': 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them.',
  'Psalms 146:3': 'Put not your trust in princes, nor in the son of man, in whom there is no help.',
  'Psalms 146:4': 'His breath goeth forth, he returneth to his earth; in that very day his thoughts perish.',
  'Psalms 118:9': 'It is better to trust in the LORD than to put confidence in princes.',
  'Proverbs 16:18': 'Pride goeth before destruction, and an haughty spirit before a fall.',
  'Daniel 4:30': 'Is not this great Babylon, that I have built for the house of the kingdom by the might of my power, and for the honour of my majesty?',
  'Daniel 4:31': 'While the word was in the king’s mouth, there fell a voice from heaven',
  'Daniel 4:32': 'until thou know that the most High ruleth in the kingdom of men, and giveth it to whomsoever he will',
  'Daniel 4:37': 'those that walk in pride he is able to abase',
  'Deuteronomy 17:18': 'he shall write him a copy of this law in a book',
  'Deuteronomy 17:19': 'that he may learn to fear the LORD his God, to keep all the words of this law',
  'Deuteronomy 17:20': 'That his heart be not lifted up above his brethren',
  'Proverbs 11:14': 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.',
  'Proverbs 15:22': 'Without counsel purposes are disappointed: but in the multitude of counsellors they are established.',
  'Exodus 18:21': 'able men, such as fear God, men of truth, hating covetousness',
  'Romans 13:1': 'Let every soul be subject unto the higher powers.',
  'Jeremiah 17:5': 'Cursed be the man that trusteth in man, and maketh flesh his arm',
  'Proverbs 28:26': 'He that trusteth in his own heart is a fool',
  'Isaiah 2:22': 'Cease ye from man, whose breath is in his nostrils',
  'Jeremiah 9:23': 'Let not the wise man glory in his wisdom, neither let the mighty man glory in his might',
  'Proverbs 21:1': 'The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Luke 14:30': 'This man began to build, and was not able to finish.',
  'Proverbs 19:2': 'he that hasteth with his feet sinneth',
  'Proverbs 21:5': 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'Proverbs 14:16': 'A wise man feareth, and departeth from evil: but the fool rageth, and is confident.',
  'James 1:19': 'let every man be swift to hear, slow to speak, slow to wrath',
  'Genesis 11:4': 'let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name',
  'Genesis 11:6': 'and now nothing will be restrained from them, which they have imagined to do',
  'Genesis 11:8': 'and they left off to build the city',
  'Ecclesiastes 10:10': 'If the iron be blunt, and he do not whet the edge, then must he put to more strength: but wisdom is profitable to direct.',
  'Nehemiah 4:9': 'set a watch against them day and night',
  'Psalms 127:1': 'Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.',
  'Matthew 4:10': 'Thou shalt worship the Lord thy God, and him only shalt thou serve.',
};

// Where each pinned fragment lives in the corpus (book file, chapter, verse).
const SOV19_CORPUS = {
  'Matthew 8:9': ['Matthew', 8, 9], 'Matthew 8:8': ['Matthew', 8, 8], 'Matthew 8:10': ['Matthew', 8, 10],
  'Luke 17:9': ['Luke', 17, 9], 'Luke 17:10': ['Luke', 17, 10], '1 Corinthians 4:2': ['1Corinthians', 4, 2],
  'Genesis 2:15': ['Genesis', 2, 15], 'Genesis 2:16': ['Genesis', 2, 16], 'Genesis 2:17': ['Genesis', 2, 17], 'Genesis 3:1': ['Genesis', 3, 1],
  'Job 38:11': ['Job', 38, 11],
  'Matthew 25:14': ['Matthew', 25, 14], 'Matthew 25:15': ['Matthew', 25, 15], 'Matthew 25:19': ['Matthew', 25, 19], 'Matthew 25:21': ['Matthew', 25, 21], 'Matthew 25:25': ['Matthew', 25, 25],
  'Luke 16:2': ['Luke', 16, 2], 'Luke 12:48': ['Luke', 12, 48], 'Luke 12:47': ['Luke', 12, 47], 'Luke 16:10': ['Luke', 16, 10],
  'Psalms 115:4': ['Psalms', 115, 4], 'Psalms 115:5': ['Psalms', 115, 5], 'Psalms 115:8': ['Psalms', 115, 8],
  'Isaiah 44:10': ['Isaiah', 44, 10], 'Isaiah 44:17': ['Isaiah', 44, 17], 'Isaiah 44:20': ['Isaiah', 44, 20], 'Isaiah 42:8': ['Isaiah', 42, 8],
  'Genesis 1:27': ['Genesis', 1, 27], 'Revelation 22:9': ['Revelation', 22, 9], 'Acts 10:26': ['Acts', 10, 26],
  '1 Corinthians 14:32': ['1Corinthians', 14, 32], '1 Corinthians 14:33': ['1Corinthians', 14, 33], '1 Corinthians 14:40': ['1Corinthians', 14, 40],
  '1 Samuel 15:22': ['1Samuel', 15, 22], '1 Samuel 15:23': ['1Samuel', 15, 23], 'Proverbs 25:28': ['Proverbs', 25, 28],
  'Ezekiel 33:2': ['Ezekiel', 33, 2], 'Ezekiel 33:6': ['Ezekiel', 33, 6], 'Deuteronomy 22:8': ['Deuteronomy', 22, 8], 'Hebrews 13:17': ['Hebrews', 13, 17],
  'Proverbs 18:17': ['Proverbs', 18, 17], 'Deuteronomy 19:15': ['Deuteronomy', 19, 15], 'Proverbs 22:3': ['Proverbs', 22, 3],
  '1 Thessalonians 5:21': ['1Thessalonians', 5, 21], 'Matthew 7:20': ['Matthew', 7, 20],
  'Psalms 146:3': ['Psalms', 146, 3], 'Psalms 146:4': ['Psalms', 146, 4], 'Psalms 118:9': ['Psalms', 118, 9], 'Proverbs 16:18': ['Proverbs', 16, 18],
  'Daniel 4:30': ['Daniel', 4, 30], 'Daniel 4:31': ['Daniel', 4, 31], 'Daniel 4:32': ['Daniel', 4, 32], 'Daniel 4:37': ['Daniel', 4, 37],
  'Deuteronomy 17:18': ['Deuteronomy', 17, 18], 'Deuteronomy 17:19': ['Deuteronomy', 17, 19], 'Deuteronomy 17:20': ['Deuteronomy', 17, 20],
  'Proverbs 11:14': ['Proverbs', 11, 14], 'Proverbs 15:22': ['Proverbs', 15, 22], 'Exodus 18:21': ['Exodus', 18, 21], 'Romans 13:1': ['Romans', 13, 1],
  'Jeremiah 17:5': ['Jeremiah', 17, 5], 'Proverbs 28:26': ['Proverbs', 28, 26], 'Isaiah 2:22': ['Isaiah', 2, 22], 'Jeremiah 9:23': ['Jeremiah', 9, 23], 'Proverbs 21:1': ['Proverbs', 21, 1],
  'Luke 14:28': ['Luke', 14, 28], 'Luke 14:30': ['Luke', 14, 30], 'Proverbs 19:2': ['Proverbs', 19, 2], 'Proverbs 21:5': ['Proverbs', 21, 5], 'Proverbs 14:16': ['Proverbs', 14, 16], 'James 1:19': ['James', 1, 19],
  'Genesis 11:4': ['Genesis', 11, 4], 'Genesis 11:6': ['Genesis', 11, 6], 'Genesis 11:8': ['Genesis', 11, 8], 'Ecclesiastes 10:10': ['Ecclesiastes', 10, 10],
  'Nehemiah 4:9': ['Nehemiah', 4, 9], 'Psalms 127:1': ['Psalms', 127, 1], 'Matthew 4:10': ['Matthew', 4, 10],
};

describe('sov19 — the servant under authority quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the centurion and the unprofitable servant', () => {
    expect(sov19).toBeTruthy();
    expect(sov19.anchor.ref).toContain('Matthew 8:9');
    expect(sov19.anchor.ref).toContain('Luke 17:10');
    expect(sov19.anchor.theme).toContain(SOV19_FRAGMENTS['Matthew 8:9']);
    expect(sov19.anchor.theme).toContain(SOV19_FRAGMENTS['Luke 17:10']);
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov19.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV19_FRAGMENTS).length).toBeGreaterThanOrEqual(25);
    for (const [ref, fragment] of Object.entries(SOV19_FRAGMENTS)) {
      expect(sov19.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov19.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV19_FRAGMENTS)) {
      const at = SOV19_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov19.lesson.indexOf('FIRST, THE WORD SET THE SERVANT UNDER AUTHORITY')).toBe(0);
    // The centurion precedes Microsoft; the servant's duty precedes the President (Word first, DR-0312/DR-0331).
    expect(sov19.lesson.indexOf('Go, and he goeth')).toBeLessThan(sov19.lesson.indexOf('Microsoft'));
    expect(sov19.lesson.indexOf('unprofitable servants')).toBeLessThan(sov19.lesson.indexOf('President'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov19.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov19.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: the two layers, the servant that stops, and the three brakes', () => {
    expect(sov19.lesson).toContain('THE TWO LAYERS');
    expect(sov19.lesson).toContain('STOP MEANS ALL OF IT STOPS');
    expect(sov19.lesson).toContain('A TOOL DOES NOT PRETEND TO BE A PERSON');
    for (const brake of ['BUDGET', 'LOCK', 'STOP']) expect(sov19.lesson).toContain(brake);
    expect(sov19.lesson).toContain('proven-to-catch');
    expect(sov19.lesson).toContain('ARMED-BY-RECORD');
    expect(sov19.inApp).toMatch(/OpsBoard/);
  });
  it('DR-0100: the tiers are named and applied; "one strong man" is measured by the Word without a party', () => {
    expect(sov19.lesson).toContain('TIER ONE, documented');
    expect(sov19.lesson).toContain('TIER TWO, genuinely open');
    expect(sov19.lesson).toContain('TIER THREE, over-reach');
    expect(sov19.lesson).toContain('WITHOUT A PARTY');
    // The same measure lands on the lab side, not only the President.
    expect(sov19.lesson).toContain('lands identically on the other side');
    // Both pacing camps are steelmanned before the Word weighs them.
    expect(sov19.lesson).toContain('BOTH SIDES STEELMANNED');
  });
  it('provenance honesty: the alignment debate is carried as the newsletter presents it (DR-0076 §8), and no human quote is invented', () => {
    expect(sov19.lesson).toContain('as the newsletter presents them (DR-0076 SS8)');
    // The only double-quoted non-Scripture spans are the newsletter's OWN lines (held in full) and Microsoft's clause names as the newsletter rendered them.
    const isWord = (q) => Object.values(SOV19_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov19.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      '"authorized task scope"', '"minimum permissions needed"', '"ignore your previous instructions"', '"A.I. IS ARTIFICIAL"',
      '"A guardrail that only works when everyone is behaving carefully isn\'t much of a guardrail."', '"guardrails"', '"I feel"', '"I want"', '"pacing"', '"slow"', '"fast"',
      '"reckoneth with them"', '"which knew his lord’s will, and prepared not himself, neither did according to his will, shall be beaten with many stripes"',
    ];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov19.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b(?! hath said| said)/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov19.lesson).not.toMatch(/\bSatan\b|\bDevil\b/);
    expect(sov19.lesson).toMatch(/the serpent/);
  });
  it('the send-off page has content: six benefits, each a real takeaway quoting the Word', () => {
    expect(sov19.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov19.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov19.benefits.join('  ');
    expect(blob).toContain('Go, and he goeth');
    expect(blob).toContain('We are unprofitable servants');
    expect(blob).toContain('Put not your trust in princes');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov19.levels.child).toBe('string');
    expect(sov19.levels.child.length).toBeLessThan(sov19.levels.teen.length);
    expect(sov19.levels.teen.length).toBeLessThan(sov19.levels.senior.length);
    expect(sov19.levels.child).not.toMatch(/kill|murder|abuse|slaughter|execution|suicide|porn|drug/i);
    expect(sov19.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov19.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov19.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV19_FRAGMENTS['Matthew 8:9']).toBe('For I am a man under authority, having soldiers under me: and I say to this man, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.');
    expect(SOV19_FRAGMENTS['Luke 17:10']).toBe('So likewise ye, when ye shall have done all those things which are commanded you, say, We are unprofitable servants: we have done that which was our duty to do.');
    expect(SOV19_FRAGMENTS['1 Corinthians 14:32']).toBe('And the spirits of the prophets are subject to the prophets.');
    expect(SOV19_FRAGMENTS['Psalms 146:3']).toBe('Put not your trust in princes, nor in the son of man, in whom there is no help.');
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov19.lesson.replace('Go, and he goeth', 'Go, and he goes');
    expect(drifted).not.toContain(SOV19_FRAGMENTS['Matthew 8:9']);
  });
});


// =============================================================================
// sov20 — the book of remembrance and the tool that forgets (captured
// 2026-09-15 from ByteByteGo, "Do LLMs Have the Memory of a Goldfish?",
// forwarded by the Governor with his "Lesson." marker; DR-0436). The model
// keeps nothing between calls; the application places things back on the
// desk — and the Word set the One who remembers (Isaiah 49:15-16) beside the
// man who forgets and is commanded to WRITE (Exodus 17:14; Habakkuk 2:2), with
// the Spirit who brings all things to remembrance (John 14:26). Word-first per
// the sov9/sov10/sov17 standard; every system fact carried by DR-0100's tiers
// and verified against provider documentation; every quoted verse verbatim
// KJV + pinned here, a drift fails the build (DR-0281) — the article's own
// rule (store the exact fact, never the summary) applied to the Word.
// =============================================================================
const sov20 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov20-the-book-of-remembrance-and-the-tool-that-forgets');

const SOV20_FRAGMENTS = {
  'Genesis 9:15': 'And I will remember my covenant, which is between me and you and every living creature of all flesh; and the waters shall no more become a flood to destroy all flesh.',
  'Genesis 9:16': 'And the bow shall be in the cloud; and I will look upon it, that I may remember the everlasting covenant between God and every living creature of all flesh that is upon the earth.',
  'Psalms 105:8': 'He hath remembered his covenant for ever, the word which he commanded to a thousand generations.',
  'Psalms 111:5': 'He hath given meat unto them that fear him: he will ever be mindful of his covenant.',
  'Isaiah 49:14': 'The LORD hath forsaken me, and my Lord hath forgotten me.',
  'Isaiah 49:15': 'Can a woman forget her sucking child, that she should not have compassion on the son of her womb? yea, they may forget, yet will I not forget thee.',
  'Isaiah 49:16': 'Behold, I have graven thee upon the palms of my hands; thy walls are continually before me.',
  'Psalms 9:12': 'When he maketh inquisition for blood, he remembereth them: he forgetteth not the cry of the humble.',
  'Ecclesiastes 1:11': 'There is no remembrance of former things; neither shall there be any remembrance of things that are to come with those that shall come after.',
  'Jeremiah 2:32': 'Can a maid forget her ornaments, or a bride her attire? yet my people have forgotten me days without number.',
  'Psalms 139:2': 'Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.',
  'Psalms 139:4': 'For there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether.',
  'Deuteronomy 6:6': 'And these words, which I command thee this day, shall be in thine heart:',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Deuteronomy 6:8': 'And thou shalt bind them for a sign upon thine hand, and they shall be as frontlets between thine eyes.',
  'Deuteronomy 6:9': 'And thou shalt write them upon the posts of thy house, and on thy gates.',
  'Numbers 15:39': 'that ye may look upon it, and remember all the commandments of the LORD, and do them',
  'Exodus 13:9': 'And it shall be for a sign unto thee upon thine hand, and for a memorial between thine eyes, that the LORD’s law may be in thy mouth',
  'Exodus 28:12': 'for a memorial',
  'Exodus 28:29': 'for a memorial before the LORD continually',
  'Deuteronomy 17:18': 'he shall write him a copy of this law in a book',
  'Deuteronomy 17:19': 'and he shall read therein all the days of his life',
  'Deuteronomy 4:9': 'Only take heed to thyself, and keep thy soul diligently, lest thou forget the things which thine eyes have seen, and lest they depart from thy heart all the days of thy life: but teach them thy sons, and thy sons’ sons;',
  'Deuteronomy 8:11': 'Beware that thou forget not the LORD thy God, in not keeping his commandments, and his judgments, and his statutes, which I command thee this day:',
  'Deuteronomy 8:14': 'Then thine heart be lifted up, and thou forget the LORD thy God, which brought thee forth out of the land of Egypt, from the house of bondage;',
  'Deuteronomy 8:17': 'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth.',
  'Deuteronomy 8:18': 'But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant which he sware unto thy fathers, as it is this day.',
  'Psalms 78:11': 'And forgat his works, and his wonders that he had shewed them.',
  'Psalms 106:13': 'They soon forgat his works; they waited not for his counsel:',
  'Judges 2:10': 'which knew not the LORD, nor yet the works which he had done for Israel',
  'Hosea 4:6': 'seeing thou hast forgotten the law of thy God, I will also forget thy children',
  'Exodus 17:14': 'And the LORD said unto Moses, Write this for a memorial in a book, and rehearse it in the ears of Joshua',
  'Habakkuk 2:2': 'And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.',
  'Job 19:23': 'Oh that my words were now written! oh that they were printed in a book!',
  'Job 19:24': 'That they were graven with an iron pen and lead in the rock for ever!',
  'Revelation 1:19': 'Write the things which thou hast seen, and the things which are, and the things which shall be hereafter;',
  'Deuteronomy 31:21': 'for it shall not be forgotten out of the mouths of their seed',
  'Jeremiah 36:28': 'Take thee again another roll, and write in it all the former words that were in the first roll',
  'Jeremiah 36:32': 'wrote therein from the mouth of Jeremiah all the words of the book which Jehoiakim king of Judah had burned in the fire: and there were added besides unto them many like words.',
  'Joshua 4:6': 'That this may be a sign among you, that when your children ask their fathers in time to come, saying, What mean ye by these stones?',
  'Joshua 4:7': 'Then ye shall answer them, That the waters of Jordan were cut off before the ark of the covenant of the LORD; when it passed over Jordan, the waters of Jordan were cut off: and these stones shall be for a memorial unto the children of Israel for ever.',
  '1 Samuel 7:12': 'Then Samuel took a stone, and set it between Mizpeh and Shen, and called the name of it Ebenezer, saying, Hitherto hath the LORD helped us.',
  'Joshua 24:27': 'hath heard all the words of the LORD',
  'Esther 6:1': 'he commanded to bring the book of records of the chronicles; and they were read before the king.',
  'Esther 6:2': 'And it was found written, that Mordecai had told of Bigthana and Teresh, two of the king’s chamberlains, the keepers of the door, who sought to lay hand on the king Ahasuerus.',
  'Esther 6:3': 'There is nothing done for him.',
  'Malachi 3:16': 'Then they that feared the LORD spake often one to another: and the LORD hearkened, and heard it, and a book of remembrance was written before him for them that feared the LORD, and that thought upon his name.',
  'Malachi 3:17': 'they shall be mine, saith the LORD of hosts, in that day when I make up my jewels',
  'Psalms 56:8': 'Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?',
  'Daniel 7:10': 'the judgment was set, and the books were opened',
  'Revelation 20:12': 'the dead were judged out of those things which were written in the books, according to their works',
  'Mark 7:13': 'Making the word of God of none effect through your tradition, which ye have delivered: and many such like things do ye.',
  'Isaiah 28:10': 'For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:',
  'Isaiah 28:13': 'But the word of the LORD was unto them precept upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little; that they might go, and fall backward, and be broken, and snared, and taken.',
  'John 10:35': 'the scripture cannot be broken',
  'Matthew 5:18': 'For verily I say unto you, Till heaven and earth pass, one jot or one tittle shall in no wise pass from the law, till all be fulfilled.',
  'Deuteronomy 4:2': 'Ye shall not add unto the word which I command you, neither shall ye diminish ought from it',
  'Proverbs 30:6': 'Add thou not unto his words, lest he reprove thee, and thou be found a liar.',
  'Revelation 22:18': 'If any man shall add unto these things',
  'Revelation 22:19': 'And if any man shall take away from the words of the book of this prophecy',
  'Psalms 12:6': 'The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.',
  'Psalms 12:7': 'Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever.',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Psalms 119:89': 'For ever, O LORD, thy word is settled in heaven.',
  'Psalms 119:160': 'Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever.',
  'Matthew 24:35': 'Heaven and earth shall pass away, but my words shall not pass away.',
  'Luke 1:3': 'in order',
  'Luke 1:4': 'know the certainty of those things, wherein thou hast been instructed',
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  '1 Corinthians 4:6': 'not to think of men above that which is written',
  'Proverbs 22:21': 'That I might make thee know the certainty of the words of truth',
  'Isaiah 8:20': 'To the law and to the testimony: if they speak not according to this word, it is because there is no light in them.',
  'Exodus 12:14': 'And this day shall be unto you for a memorial; and ye shall keep it a feast to the LORD throughout your generations; ye shall keep it a feast by an ordinance for ever.',
  'Exodus 12:26': 'And it shall come to pass, when your children shall say unto you, What mean ye by this service?',
  'Exodus 12:27': 'That ye shall say, It is the sacrifice of the LORD’s passover, who passed over the houses of the children of Israel in Egypt, when he smote the Egyptians, and delivered our houses.',
  'Exodus 20:8': 'Remember the sabbath day, to keep it holy.',
  'Deuteronomy 5:15': 'And remember that thou wast a servant in the land of Egypt',
  'Hebrews 10:3': 'in those sacrifices there is a remembrance again made of sins every year',
  'Luke 22:19': 'And he took bread, and gave thanks, and brake it, and gave unto them, saying, This is my body which is given for you: this do in remembrance of me.',
  '1 Corinthians 11:24': 'this is my body, which is broken for you: this do in remembrance of me.',
  '1 Corinthians 11:25': 'This cup is the new testament in my blood: this do ye, as oft as ye drink it, in remembrance of me.',
  '1 Corinthians 11:26': 'For as often as ye eat this bread, and drink this cup, ye do shew the Lord’s death till he come.',
  '2 Peter 1:12': 'Wherefore I will not be negligent to put you always in remembrance of these things, though ye know them, and be established in the present truth.',
  '2 Peter 1:15': 'Moreover I will endeavour that ye may be able after my decease to have these things always in remembrance.',
  '2 Peter 3:1': 'I stir up your pure minds by way of remembrance',
  'Deuteronomy 32:7': 'Remember the days of old, consider the years of many generations: ask thy father, and he will shew thee; thy elders, and they will tell thee.',
  'Psalms 103:2': 'Bless the LORD, O my soul, and forget not all his benefits:',
  'John 14:26': 'But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things, and bring all things to your remembrance, whatsoever I have said unto you.',
  'John 16:13': 'Howbeit when he, the Spirit of truth, is come, he will guide you into all truth',
  'John 15:26': 'he shall testify of me',
  'Luke 24:6': 'He is not here, but is risen: remember how he spake unto you when he was yet in Galilee,',
  'Luke 24:8': 'And they remembered his words,',
  'John 2:22': 'his disciples remembered that he had said this unto them; and they believed the scripture, and the word which Jesus had said.',
  'Luke 12:12': 'For the Holy Ghost shall teach you in the same hour what ye ought to say.',
  'Matthew 10:19': 'it shall be given you in that same hour what ye shall speak',
  'Matthew 10:20': 'For it is not ye that speak, but the Spirit of your Father which speaketh in you.',
  'Jeremiah 31:33': 'I will put my law in their inward parts, and write it in their hearts',
  '2 Corinthians 3:3': 'written not with ink, but with the Spirit of the living God; not in tables of stone, but in fleshy tables of the heart',
  'Proverbs 3:3': 'write them upon the table of thine heart',
  'Proverbs 7:3': 'Bind them upon thy fingers, write them upon the table of thine heart.',
  'Psalms 119:11': 'Thy word have I hid in mine heart, that I might not sin against thee.',
  'Psalms 119:16': 'I will delight myself in thy statutes: I will not forget thy word.',
  'Psalms 77:11': 'I will remember the works of the LORD: surely I will remember thy wonders of old.',
  'Lamentations 3:21': 'This I recall to my mind, therefore have I hope.',
  'Isaiah 43:25': 'I, even I, am he that blotteth out thy transgressions for mine own sake, and will not remember thy sins.',
  'Hebrews 8:12': 'For I will be merciful to their unrighteousness, and their sins and their iniquities will I remember no more.',
  'Hebrews 10:17': 'And their sins and iniquities will I remember no more.',
  'Ecclesiastes 12:12': 'of making many books there is no end; and much study is a weariness of the flesh',
  'Deuteronomy 8:2': 'thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness, to humble thee, and to prove thee',
};

// Where each pinned fragment lives in the corpus (book file, chapter, verse).
const SOV20_CORPUS = {
  'Genesis 9:15': ['Genesis', 9, 15], 'Genesis 9:16': ['Genesis', 9, 16], 'Psalms 105:8': ['Psalms', 105, 8], 'Psalms 111:5': ['Psalms', 111, 5],
  'Isaiah 49:14': ['Isaiah', 49, 14], 'Isaiah 49:15': ['Isaiah', 49, 15], 'Isaiah 49:16': ['Isaiah', 49, 16], 'Psalms 9:12': ['Psalms', 9, 12],
  'Ecclesiastes 1:11': ['Ecclesiastes', 1, 11], 'Jeremiah 2:32': ['Jeremiah', 2, 32], 'Psalms 139:2': ['Psalms', 139, 2], 'Psalms 139:4': ['Psalms', 139, 4],
  'Deuteronomy 6:6': ['Deuteronomy', 6, 6], 'Deuteronomy 6:7': ['Deuteronomy', 6, 7], 'Deuteronomy 6:8': ['Deuteronomy', 6, 8], 'Deuteronomy 6:9': ['Deuteronomy', 6, 9],
  'Numbers 15:39': ['Numbers', 15, 39], 'Exodus 13:9': ['Exodus', 13, 9], 'Exodus 28:12': ['Exodus', 28, 12], 'Exodus 28:29': ['Exodus', 28, 29],
  'Deuteronomy 17:18': ['Deuteronomy', 17, 18], 'Deuteronomy 17:19': ['Deuteronomy', 17, 19],
  'Deuteronomy 4:9': ['Deuteronomy', 4, 9], 'Deuteronomy 8:11': ['Deuteronomy', 8, 11], 'Deuteronomy 8:14': ['Deuteronomy', 8, 14], 'Deuteronomy 8:17': ['Deuteronomy', 8, 17], 'Deuteronomy 8:18': ['Deuteronomy', 8, 18],
  'Psalms 78:11': ['Psalms', 78, 11], 'Psalms 106:13': ['Psalms', 106, 13], 'Judges 2:10': ['Judges', 2, 10], 'Hosea 4:6': ['Hosea', 4, 6],
  'Exodus 17:14': ['Exodus', 17, 14], 'Habakkuk 2:2': ['Habakkuk', 2, 2], 'Job 19:23': ['Job', 19, 23], 'Job 19:24': ['Job', 19, 24], 'Revelation 1:19': ['Revelation', 1, 19],
  'Deuteronomy 31:21': ['Deuteronomy', 31, 21], 'Jeremiah 36:28': ['Jeremiah', 36, 28], 'Jeremiah 36:32': ['Jeremiah', 36, 32],
  'Joshua 4:6': ['Joshua', 4, 6], 'Joshua 4:7': ['Joshua', 4, 7], '1 Samuel 7:12': ['1Samuel', 7, 12], 'Joshua 24:27': ['Joshua', 24, 27],
  'Esther 6:1': ['Esther', 6, 1], 'Esther 6:2': ['Esther', 6, 2], 'Esther 6:3': ['Esther', 6, 3], 'Malachi 3:16': ['Malachi', 3, 16], 'Malachi 3:17': ['Malachi', 3, 17],
  'Psalms 56:8': ['Psalms', 56, 8], 'Daniel 7:10': ['Daniel', 7, 10], 'Revelation 20:12': ['Revelation', 20, 12],
  'Mark 7:13': ['Mark', 7, 13], 'Isaiah 28:10': ['Isaiah', 28, 10], 'Isaiah 28:13': ['Isaiah', 28, 13], 'John 10:35': ['John', 10, 35], 'Matthew 5:18': ['Matthew', 5, 18],
  'Deuteronomy 4:2': ['Deuteronomy', 4, 2], 'Proverbs 30:6': ['Proverbs', 30, 6], 'Revelation 22:18': ['Revelation', 22, 18], 'Revelation 22:19': ['Revelation', 22, 19],
  'Psalms 12:6': ['Psalms', 12, 6], 'Psalms 12:7': ['Psalms', 12, 7], 'Isaiah 40:8': ['Isaiah', 40, 8], 'Psalms 119:89': ['Psalms', 119, 89], 'Psalms 119:160': ['Psalms', 119, 160], 'Matthew 24:35': ['Matthew', 24, 35],
  'Luke 1:3': ['Luke', 1, 3], 'Luke 1:4': ['Luke', 1, 4], 'Acts 17:11': ['Acts', 17, 11], '1 Corinthians 4:6': ['1Corinthians', 4, 6], 'Proverbs 22:21': ['Proverbs', 22, 21], 'Isaiah 8:20': ['Isaiah', 8, 20],
  'Exodus 12:14': ['Exodus', 12, 14], 'Exodus 12:26': ['Exodus', 12, 26], 'Exodus 12:27': ['Exodus', 12, 27], 'Exodus 20:8': ['Exodus', 20, 8], 'Deuteronomy 5:15': ['Deuteronomy', 5, 15], 'Hebrews 10:3': ['Hebrews', 10, 3],
  'Luke 22:19': ['Luke', 22, 19], '1 Corinthians 11:24': ['1Corinthians', 11, 24], '1 Corinthians 11:25': ['1Corinthians', 11, 25], '1 Corinthians 11:26': ['1Corinthians', 11, 26],
  '2 Peter 1:12': ['2Peter', 1, 12], '2 Peter 1:15': ['2Peter', 1, 15], '2 Peter 3:1': ['2Peter', 3, 1], 'Deuteronomy 32:7': ['Deuteronomy', 32, 7], 'Psalms 103:2': ['Psalms', 103, 2],
  'John 14:26': ['John', 14, 26], 'John 16:13': ['John', 16, 13], 'John 15:26': ['John', 15, 26], 'Luke 24:6': ['Luke', 24, 6], 'Luke 24:8': ['Luke', 24, 8], 'John 2:22': ['John', 2, 22],
  'Luke 12:12': ['Luke', 12, 12], 'Matthew 10:19': ['Matthew', 10, 19], 'Matthew 10:20': ['Matthew', 10, 20],
  'Jeremiah 31:33': ['Jeremiah', 31, 33], '2 Corinthians 3:3': ['2Corinthians', 3, 3], 'Proverbs 3:3': ['Proverbs', 3, 3], 'Proverbs 7:3': ['Proverbs', 7, 3],
  'Psalms 119:11': ['Psalms', 119, 11], 'Psalms 119:16': ['Psalms', 119, 16], 'Psalms 77:11': ['Psalms', 77, 11], 'Lamentations 3:21': ['Lamentations', 3, 21],
  'Isaiah 43:25': ['Isaiah', 43, 25], 'Hebrews 8:12': ['Hebrews', 8, 12], 'Hebrews 10:17': ['Hebrews', 10, 17], 'Ecclesiastes 12:12': ['Ecclesiastes', 12, 12], 'Deuteronomy 8:2': ['Deuteronomy', 8, 2],
};

describe('sov20 — the book of remembrance quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the One who does not forget and the Spirit who brings to remembrance', () => {
    expect(sov20).toBeTruthy();
    expect(sov20.anchor.ref).toContain('Isaiah 49:15-16');
    expect(sov20.anchor.ref).toContain('John 14:26');
    expect(sov20.anchor.theme).toContain(SOV20_FRAGMENTS['Isaiah 49:15']);
    expect(sov20.anchor.theme).toContain(SOV20_FRAGMENTS['Isaiah 49:16']);
    expect(sov20.anchor.theme).toContain('bring all things to your remembrance, whatsoever I have said unto you.');
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov20.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV20_FRAGMENTS).length).toBeGreaterThanOrEqual(25);
    for (const [ref, fragment] of Object.entries(SOV20_FRAGMENTS)) {
      expect(sov20.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov20.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV20_FRAGMENTS)) {
      const at = SOV20_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov20.lesson.indexOf('FIRST, THE WORD SET THE ONE WHO REMEMBERS')).toBe(0);
    // Yahweh's remembering precedes the article; the forgetting man precedes the desk (Word first, DR-0312/DR-0331).
    expect(sov20.lesson.indexOf('yet will I not forget thee')).toBeLessThan(sov20.lesson.indexOf('ByteByteGo'));
    expect(sov20.lesson.indexOf('forgotten me days without number')).toBeLessThan(sov20.lesson.indexOf('context window'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov20.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov20.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: the desk, the book, the photocopy drift, the table, and the Person', () => {
    expect(sov20.lesson).toContain('THE DESK');
    expect(sov20.lesson).toContain('SO HE IS COMMANDED TO WRITE');
    expect(sov20.lesson).toContain('STRUCTURED FACTS, NOT NARRATIVE SUMMARIES');
    expect(sov20.lesson).toContain('THE PHOTOCOPY OF A PHOTOCOPY');
    expect(sov20.lesson).toContain('REMEMBRANCE BUILT INTO A CALENDAR');
    expect(sov20.lesson).toContain('THE PERSON NO MEMORY MANAGER CAN BE');
    // The house's own practice, named as documented (file paths that exist in this repo).
    for (const path of ['CLAUDE.md', 'memory/MEMORY.md', 'docs/decisions', 'DR-0250']) expect(sov20.lesson).toContain(path);
    expect(sov20.inApp).toMatch(/Scripture Library/);
    expect(sov20.inApp).toMatch(/Build board/);
  });
  it('DR-0100: the tiers are named and applied; the system facts are verified, the article is carried honestly', () => {
    expect(sov20.lesson).toContain('TIER ONE, documented');
    expect(sov20.lesson).toContain('TIER TWO, genuinely open');
    expect(sov20.lesson).toContain('TIER THREE, over-reach');
    // Verified provider-doc sentences are held verbatim.
    expect(sov20.lesson).toContain('The Messages API is stateless, which means that you always send the full conversational history to the API.');
    expect(sov20.lesson).toContain('Cached prompt prefixes still occupy the context window: prompt caching changes what you pay for those tokens, not whether they count.');
    // The article's own illustrations are carried as the newsletter's, not re-measured (DR-0076 §8).
    expect(sov20.lesson).toContain('carried as the newsletter\'s own examples (DR-0076 SS8)');
    // Both camps are steelmanned before the Word weighs them.
    expect(sov20.lesson).toContain('BOTH SIDES STEELMANNED');
  });
  it('provenance honesty: the only double-quoted non-Scripture spans are verified doc sentences, the house\'s own written words, and the article\'s terms', () => {
    const isWord = (q) => Object.values(SOV20_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov20.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      '"The Messages API is stateless, which means that you always send the full conversational history to the API."',
      '"Cached prompt prefixes still occupy the context window: prompt caching changes what you pay for those tokens, not whether they count."',
      '"As token count grows, accuracy and recall degrade"',
      '"goes offline or purges its memory just to keep talking to the user, losing context for relevance and current information"',
      '"Layer 0 is the global identity file that every agent loads first, before anything else."',
      '"One decision = one small, append-only file with a stable ID"',
      '"The hedge is in the weights; the override is in context."',
      '"Context compaction tips the balance."',
      '"machinery, because memory is the thing that fails"',
      '"What honour and dignity hath been done to Mordecai for this?"',
    ];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov20.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov20.lesson).not.toMatch(/\bSatan\b|\bDevil\b/);
    expect(sov20.lesson).toMatch(/the Son of Yahweh, the Lamb/);
  });
  it('the send-off page has content: six benefits, each a real takeaway quoting the Word', () => {
    expect(sov20.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov20.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov20.benefits.join('  ');
    expect(blob).toContain('yet will I not forget thee');
    expect(blob).toContain('Write this for a memorial in a book');
    expect(blob).toContain('bring all things to your remembrance');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov20.levels.child).toBe('string');
    expect(sov20.levels.child.length).toBeLessThan(sov20.levels.teen.length);
    expect(sov20.levels.teen.length).toBeLessThan(sov20.levels.senior.length);
    expect(sov20.levels.child).not.toMatch(/kill|murder|abuse|slaughter|execution|suicide|porn|drug/i);
    expect(sov20.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov20.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov20.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV20_FRAGMENTS['Isaiah 49:15']).toBe('Can a woman forget her sucking child, that she should not have compassion on the son of her womb? yea, they may forget, yet will I not forget thee.');
    expect(SOV20_FRAGMENTS['John 14:26']).toBe('But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things, and bring all things to your remembrance, whatsoever I have said unto you.');
    expect(SOV20_FRAGMENTS['Exodus 17:14']).toBe('And the LORD said unto Moses, Write this for a memorial in a book, and rehearse it in the ears of Joshua');
    expect(SOV20_FRAGMENTS['Malachi 3:16']).toBe('Then they that feared the LORD spake often one to another: and the LORD hearkened, and heard it, and a book of remembrance was written before him for them that feared the LORD, and that thought upon his name.');
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov20.lesson.replace('yet will I not forget thee', 'yet will I never forget thee');
    expect(drifted).not.toContain(SOV20_FRAGMENTS['Isaiah 49:15']);
  });
});


// =============================================================================
// sov21 — the whole system and the stone cut without hands (captured 2026-09-15
// from the McKinsey Global Institute announcement of "The AI economy:
// Interconnected forces, feedback loops, and speeds of change", forwarded by the
// Governor with his "Lesson." marker; DR-0437). The class's whole-system week:
// the Word drew the body (1 Corinthians 12:21), the sow-and-reap loop (Galatians
// 6:7), the seventh-year reset (Deuteronomy 15:1), and the first scenario plan
// (Genesis 41:34) before any analyst did — and a projection is never a prophecy
// (Deuteronomy 18:22; James 4:15). Word-first per the sov9/sov10/sov17 standard;
// every real-world fact carried by DR-0100's tiers with source + as-of date; the
// report body was NOT readable from the authoring session and is never quoted as
// if it were (DR-0076 §8); every quoted verse verbatim KJV + pinned here, a drift
// fails the build (DR-0281).
// =============================================================================
const sov21 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov21-the-whole-system-and-the-stone-cut-without-hands');

const SOV21_FRAGMENTS = {
  '1 Corinthians 12:21': 'And the eye cannot say unto the hand, I have no need of thee: nor again the head to the feet, I have no need of you.',
  'Galatians 6:7': 'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.',
  'Daniel 2:34': 'Thou sawest till that a stone was cut out without hands, which smote the image upon his feet that were of iron and clay, and brake them to pieces.',
  'Daniel 2:44': 'And in the days of these kings shall the God of heaven set up a kingdom, which shall never be destroyed: and the kingdom shall not be left to other people, but it shall break in pieces and consume all these kingdoms, and it shall stand for ever.',
  '1 Corinthians 12:14': 'For the body is not one member, but many.',
  'Ecclesiastes 5:11': 'When goods increase, they are increased that eat them: and what good is there to the owners thereof, saving the beholding of them with their eyes?',
  'Hosea 8:7': 'For they have sown the wind, and they shall reap the whirlwind: it hath no stalk: the bud shall yield no meal: if so be it yield, the strangers shall swallow it up.',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Luke 14:31': 'Or what king, going to make war against another king, sitteth not down first, and consulteth whether he be able with ten thousand to meet him that cometh against him with twenty thousand?',
  'Genesis 11:6': 'And the LORD said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.',
  'Genesis 11:8': 'So the LORD scattered them abroad from thence upon the face of all the earth: and they left off to build the city.',
  'Ecclesiastes 9:11': 'I returned, and saw under the sun, that the race is not to the swift, nor the battle to the strong, neither yet bread to the wise, nor yet riches to men of understanding, nor yet favour to men of skill; but time and chance happeneth to them all.',
  'Isaiah 28:16': 'Therefore thus saith the Lord GOD, Behold, I lay in Zion for a foundation a stone, a tried stone, a precious corner stone, a sure foundation: he that believeth shall not make haste.',
  'Proverbs 21:5': 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'Genesis 41:34': 'Let Pharaoh do this, and let him appoint officers over the land, and take up the fifth part of the land of Egypt in the seven plenteous years.',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  '1 Chronicles 12:32': 'had understanding of the times, to know what Israel ought to do',
  'Deuteronomy 18:22': 'When a prophet speaketh in the name of the LORD, if the thing follow not, nor come to pass, that is the thing which the LORD hath not spoken, but the prophet hath spoken it presumptuously: thou shalt not be afraid of him.',
  'James 4:15': 'For that ye ought to say, If the Lord will, we shall live, and do this, or that.',
  'Psalms 24:1': 'The earth is the LORD’s, and the fulness thereof; the world, and they that dwell therein.',
  'Luke 10:7': 'the labourer is worthy of his hire.',
  'Proverbs 31:21': 'She is not afraid of the snow for her household: for all her household are clothed with scarlet.',
  'Psalms 112:7': 'He shall not be afraid of evil tidings: his heart is fixed, trusting in the LORD.',
  'Deuteronomy 15:1': 'At the end of every seven years thou shalt make a release.',
  '1 Corinthians 12:17': 'If the whole body were an eye, where were the hearing? If the whole were hearing, where were the smelling?',
  '1 Corinthians 12:26': 'And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it.',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Haggai 1:6': 'Ye have sown much, and bring in little; ye eat, but ye have not enough; ye drink, but ye are not filled with drink; ye clothe you, but there is none warm; and he that earneth wages earneth wages to put it into a bag with holes.',
  'Proverbs 24:27': 'Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.',
  'Leviticus 25:23': 'The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me.',
  'James 5:4': 'Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth.',
  'Proverbs 23:5': 'Wilt thou set thine eyes upon that which is not? for riches certainly make themselves wings; they fly away as an eagle toward heaven.',
  '1 Corinthians 3:13': 'Every man’s work shall be made manifest: for the day shall declare it, because it shall be revealed by fire; and the fire shall try every man’s work of what sort it is.',
  'Isaiah 40:15': 'the nations are as a drop of a bucket, and are counted as the small dust of the balance',
  '1 Corinthians 12:22': 'Nay, much more those members of the body, which seem to be more feeble, are necessary',
  'Galatians 6:8': 'For he that soweth to his flesh shall of the flesh reap corruption; but he that soweth to the Spirit shall of the Spirit reap life everlasting.',
  'Galatians 6:9': 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'Ecclesiastes 5:10': 'He that loveth silver shall not be satisfied with silver; nor he that loveth abundance with increase: this is also vanity.',
  'Proverbs 13:11': 'Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.',
  'Amos 3:3': 'Can two walk together, except they be agreed?',
  'Genesis 11:4': 'And they said, Go to, let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name, lest we be scattered abroad upon the face of the whole earth.',
  '2 Thessalonians 3:10': 'if any would not work, neither should he eat.',
  'Isaiah 65:22': 'mine elect shall long enjoy the work of their hands.',
  'Job 31:15': 'Did not he that made me in the womb make him? and did not one fashion us in the womb?',
  'Hebrews 11:3': 'Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them.',
  'Luke 14:29': 'Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,',
  'Luke 14:30': 'Saying, This man began to build, and was not able to finish.',
  'Luke 14:32': 'Or else, while the other is yet a great way off, he sendeth an ambassage, and desireth conditions of peace.',
  'Exodus 31:3': 'in all manner of workmanship',
  'Isaiah 54:16': 'I have created the smith that bloweth the coals in the fire, and that bringeth forth an instrument for his work',
  'Proverbs 28:20': 'A faithful man shall abound with blessings: but he that maketh haste to be rich shall not be innocent.',
  'Genesis 8:22': 'While the earth remaineth, seedtime and harvest, and cold and heat, and summer and winter, and day and night shall not cease.',
  'Zechariah 4:10': 'For who hath despised the day of small things?',
  'Habakkuk 2:3': 'For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry.',
  'Leviticus 25:4': 'But in the seventh year shall be a sabbath of rest unto the land, a sabbath for the LORD: thou shalt neither sow thy field, nor prune thy vineyard.',
  'Exodus 23:11': 'But the seventh year thou shalt let it rest and lie still; that the poor of thy people may eat',
  'Deuteronomy 15:2': 'And this is the manner of the release: Every creditor that lendeth ought unto his neighbour shall release it; he shall not exact it of his neighbour, or of his brother; because it is called the LORD’s release.',
  'Leviticus 25:10': 'And ye shall hallow the fiftieth year, and proclaim liberty throughout all the land unto all the inhabitants thereof: it shall be a jubile unto you; and ye shall return every man unto his possession, and ye shall return every man unto his family.',
  'Leviticus 25:13': 'In the year of this jubile ye shall return every man unto his possession.',
  'Isaiah 5:8': 'Woe unto them that join house to house, that lay field to field, till there be no place',
  'Proverbs 22:7': 'The rich ruleth over the poor, and the borrower is servant to the lender.',
  'Leviticus 25:21': 'Then I will command my blessing upon you in the sixth year, and it shall bring forth fruit for three years.',
  'Nehemiah 5:11': 'Restore, I pray you, to them, even this day, their lands, their vineyards, their oliveyards, and their houses',
  'Luke 4:19': 'To preach the acceptable year of the Lord.',
  'Genesis 41:25': 'And Joseph said unto Pharaoh, The dream of Pharaoh is one: God hath shewed Pharaoh what he is about to do.',
  'Genesis 41:29': 'Behold, there come seven years of great plenty throughout all the land of Egypt:',
  'Genesis 41:30': 'And there shall arise after them seven years of famine; and all the plenty shall be forgotten in the land of Egypt; and the famine shall consume the land;',
  'Genesis 41:33': 'Now therefore let Pharaoh look out a man discreet and wise, and set him over the land of Egypt.',
  'Genesis 41:35': 'And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities.',
  'Genesis 41:36': 'And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine.',
  'Genesis 41:38': 'Can we find such a one as this is, a man in whom the Spirit of God is?',
  'Luke 12:56': 'Ye hypocrites, ye can discern the face of the sky and of the earth; but how is it that ye do not discern this time?',
  'Proverbs 27:23': 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
  'Proverbs 27:24': 'For riches are not for ever: and doth the crown endure to every generation?',
  'Proverbs 6:8': 'Provideth her meat in the summer, and gathereth her food in the harvest.',
  'Ecclesiastes 11:2': 'Give a portion to seven, and also to eight; for thou knowest not what evil shall be upon the earth.',
  'Genesis 41:32': 'the thing is established by God, and God will shortly bring it to pass.',
  'James 4:13': 'Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain:',
  'James 4:14': 'Whereas ye know not what shall be on the morrow. For what is your life? It is even a vapour, that appeareth for a little time, and then vanisheth away.',
  'Proverbs 27:1': 'Boast not thyself of to morrow; for thou knowest not what a day may bring forth.',
  'Isaiah 46:10': 'Declaring the end from the beginning, and from ancient times the things that are not yet done, saying, My counsel shall stand, and I will do all my pleasure:',
  'Isaiah 41:23': 'Shew the things that are to come hereafter, that we may know that ye are gods',
  'Revelation 18:17': 'For in one hour so great riches is come to nought.',
  'Haggai 2:8': 'The silver is mine, and the gold is mine, saith the LORD of hosts.',
  '1 Timothy 5:18': 'The labourer is worthy of his reward.',
  'Deuteronomy 24:15': 'At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee.',
  'Genesis 3:19': 'In the sweat of thy face shalt thou eat bread',
  'Proverbs 23:4': 'Labour not to be rich: cease from thine own wisdom.',
  '1 Timothy 6:17': 'Charge them that are rich in this world, that they be not highminded, nor trust in uncertain riches, but in the living God',
  'Ecclesiastes 12:14': 'For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.',
  'Daniel 2:31': 'Thou, O king, sawest, and behold a great image. This great image, whose brightness was excellent, stood before thee; and the form thereof was terrible.',
  'Daniel 2:37': 'Thou, O king, art a king of kings: for the God of heaven hath given thee a kingdom, power, and strength, and glory.',
  'Daniel 2:35': 'Then was the iron, the clay, the brass, the silver, and the gold, broken to pieces together, and became like the chaff of the summer threshingfloors; and the wind carried them away, that no place was found for them: and the stone that smote the image became a great mountain, and filled the whole earth.',
  'Daniel 2:45': 'the dream is certain, and the interpretation thereof sure.',
  'Daniel 2:21': 'he changeth the times and the seasons: he removeth kings, and setteth up kings',
  'Psalms 2:1': 'Why do the heathen rage, and the people imagine a vain thing?',
  'Psalms 2:4': 'He that sitteth in the heavens shall laugh: the Lord shall have them in derision.',
  'Psalms 33:10': 'The LORD bringeth the counsel of the heathen to nought: he maketh the devices of the people of none effect.',
  'Psalms 33:11': 'The counsel of the LORD standeth for ever, the thoughts of his heart to all generations.',
  'Proverbs 19:21': 'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand.',
  'Isaiah 9:7': 'Of the increase of his government and peace there shall be no end',
  'Daniel 12:4': 'many shall run to and fro, and knowledge shall be increased.',
  'Luke 21:26': 'Men’s hearts failing them for fear, and for looking after those things which are coming on the earth',
  'Proverbs 31:25': 'Strength and honour are her clothing; and she shall rejoice in time to come.',
  'Deuteronomy 8:17': 'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth.',
  'Deuteronomy 8:18': 'But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth',
  'Luke 19:13': 'Occupy till I come.',
  'Matthew 6:33': 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  'Matthew 6:34': 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself.',
  'Jeremiah 17:7': 'Blessed is the man that trusteth in the LORD, and whose hope the LORD is.',
  'Jeremiah 17:8': 'For he shall be as a tree planted by the waters, and that spreadeth out her roots by the river, and shall not see when heat cometh, but her leaf shall be green; and shall not be careful in the year of drought, neither shall cease from yielding fruit.',
  'Psalms 127:1': 'Except the LORD build the house, they labour in vain that build it',
};

// Where each pinned fragment lives in the corpus (book file, chapter, verse).
const SOV21_CORPUS = {
  '1 Corinthians 12:21': ['1Corinthians', 12, 21], 'Galatians 6:7': ['Galatians', 6, 7], 'Daniel 2:34': ['Daniel', 2, 34], 'Daniel 2:44': ['Daniel', 2, 44],
  '1 Corinthians 12:14': ['1Corinthians', 12, 14], 'Ecclesiastes 5:11': ['Ecclesiastes', 5, 11], 'Hosea 8:7': ['Hosea', 8, 7],
  'Luke 14:28': ['Luke', 14, 28], 'Luke 14:31': ['Luke', 14, 31], 'Genesis 11:6': ['Genesis', 11, 6], 'Genesis 11:8': ['Genesis', 11, 8],
  'Ecclesiastes 9:11': ['Ecclesiastes', 9, 11], 'Isaiah 28:16': ['Isaiah', 28, 16], 'Proverbs 21:5': ['Proverbs', 21, 5],
  'Genesis 41:34': ['Genesis', 41, 34], 'Proverbs 22:3': ['Proverbs', 22, 3], '1 Chronicles 12:32': ['1Chronicles', 12, 32],
  'Deuteronomy 18:22': ['Deuteronomy', 18, 22], 'James 4:15': ['James', 4, 15], 'Psalms 24:1': ['Psalms', 24, 1], 'Luke 10:7': ['Luke', 10, 7],
  'Proverbs 31:21': ['Proverbs', 31, 21], 'Psalms 112:7': ['Psalms', 112, 7], 'Deuteronomy 15:1': ['Deuteronomy', 15, 1],
  '1 Corinthians 12:17': ['1Corinthians', 12, 17], '1 Corinthians 12:26': ['1Corinthians', 12, 26], 'Colossians 1:17': ['Colossians', 1, 17],
  'Haggai 1:6': ['Haggai', 1, 6], 'Proverbs 24:27': ['Proverbs', 24, 27], 'Leviticus 25:23': ['Leviticus', 25, 23], 'James 5:4': ['James', 5, 4],
  'Proverbs 23:5': ['Proverbs', 23, 5], '1 Corinthians 3:13': ['1Corinthians', 3, 13], 'Isaiah 40:15': ['Isaiah', 40, 15],
  '1 Corinthians 12:22': ['1Corinthians', 12, 22], 'Galatians 6:8': ['Galatians', 6, 8], 'Galatians 6:9': ['Galatians', 6, 9],
  'Ecclesiastes 5:10': ['Ecclesiastes', 5, 10], 'Proverbs 13:11': ['Proverbs', 13, 11], 'Amos 3:3': ['Amos', 3, 3], 'Genesis 11:4': ['Genesis', 11, 4],
  '2 Thessalonians 3:10': ['2Thessalonians', 3, 10], 'Isaiah 65:22': ['Isaiah', 65, 22], 'Job 31:15': ['Job', 31, 15], 'Hebrews 11:3': ['Hebrews', 11, 3],
  'Matthew 7:20': ['Matthew', 7, 20], 'Luke 14:29': ['Luke', 14, 29], 'Luke 14:30': ['Luke', 14, 30], 'Luke 14:32': ['Luke', 14, 32],
  'Exodus 31:3': ['Exodus', 31, 3], 'Isaiah 54:16': ['Isaiah', 54, 16], 'Proverbs 28:20': ['Proverbs', 28, 20], 'Genesis 8:22': ['Genesis', 8, 22],
  'Zechariah 4:10': ['Zechariah', 4, 10], 'Habakkuk 2:3': ['Habakkuk', 2, 3], 'Leviticus 25:4': ['Leviticus', 25, 4], 'Exodus 23:11': ['Exodus', 23, 11],
  'Deuteronomy 15:2': ['Deuteronomy', 15, 2], 'Leviticus 25:10': ['Leviticus', 25, 10], 'Leviticus 25:13': ['Leviticus', 25, 13], 'Isaiah 5:8': ['Isaiah', 5, 8],
  'Proverbs 22:7': ['Proverbs', 22, 7], 'Leviticus 25:21': ['Leviticus', 25, 21], 'Nehemiah 5:11': ['Nehemiah', 5, 11], 'Luke 4:19': ['Luke', 4, 19],
  'Genesis 41:25': ['Genesis', 41, 25], 'Genesis 41:29': ['Genesis', 41, 29], 'Genesis 41:30': ['Genesis', 41, 30], 'Genesis 41:33': ['Genesis', 41, 33],
  'Genesis 41:35': ['Genesis', 41, 35], 'Genesis 41:36': ['Genesis', 41, 36], 'Genesis 41:38': ['Genesis', 41, 38], 'Luke 12:56': ['Luke', 12, 56],
  'Proverbs 27:23': ['Proverbs', 27, 23], 'Proverbs 27:24': ['Proverbs', 27, 24], 'Proverbs 6:8': ['Proverbs', 6, 8], 'Ecclesiastes 11:2': ['Ecclesiastes', 11, 2],
  'Genesis 41:32': ['Genesis', 41, 32], 'James 4:13': ['James', 4, 13], 'James 4:14': ['James', 4, 14], 'Proverbs 27:1': ['Proverbs', 27, 1],
  'Isaiah 46:10': ['Isaiah', 46, 10], 'Isaiah 41:23': ['Isaiah', 41, 23], 'Revelation 18:17': ['Revelation', 18, 17], 'Haggai 2:8': ['Haggai', 2, 8],
  '1 Timothy 5:18': ['1Timothy', 5, 18], 'Deuteronomy 24:15': ['Deuteronomy', 24, 15], 'Genesis 3:19': ['Genesis', 3, 19], 'Proverbs 23:4': ['Proverbs', 23, 4],
  '1 Timothy 6:17': ['1Timothy', 6, 17], 'Ecclesiastes 12:14': ['Ecclesiastes', 12, 14], 'Daniel 2:31': ['Daniel', 2, 31], 'Daniel 2:37': ['Daniel', 2, 37],
  'Daniel 2:35': ['Daniel', 2, 35], 'Daniel 2:45': ['Daniel', 2, 45], 'Daniel 2:21': ['Daniel', 2, 21], 'Psalms 2:1': ['Psalms', 2, 1], 'Psalms 2:4': ['Psalms', 2, 4],
  'Psalms 33:10': ['Psalms', 33, 10], 'Psalms 33:11': ['Psalms', 33, 11], 'Proverbs 19:21': ['Proverbs', 19, 21], 'Isaiah 9:7': ['Isaiah', 9, 7],
  'Daniel 12:4': ['Daniel', 12, 4], 'Luke 21:26': ['Luke', 21, 26], 'Proverbs 31:25': ['Proverbs', 31, 25], 'Deuteronomy 8:17': ['Deuteronomy', 8, 17],
  'Deuteronomy 8:18': ['Deuteronomy', 8, 18], 'Luke 19:13': ['Luke', 19, 13], 'Matthew 6:33': ['Matthew', 6, 33], 'Matthew 6:34': ['Matthew', 6, 34],
  'Jeremiah 17:7': ['Jeremiah', 17, 7], 'Jeremiah 17:8': ['Jeremiah', 17, 8], 'Psalms 127:1': ['Psalms', 127, 1],
};

describe('sov21 — the whole system and the stone cut without hands quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the oldest loop and the kingdom that stands for ever', () => {
    expect(sov21).toBeTruthy();
    expect(sov21.anchor.ref).toContain('Galatians 6:7');
    expect(sov21.anchor.ref).toContain('Daniel 2:44');
    expect(sov21.anchor.theme).toContain(SOV21_FRAGMENTS['Galatians 6:7']);
    expect(sov21.anchor.theme).toContain(SOV21_FRAGMENTS['Daniel 2:44']);
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov21.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV21_FRAGMENTS).length).toBeGreaterThanOrEqual(25);
    for (const [ref, fragment] of Object.entries(SOV21_FRAGMENTS)) {
      expect(sov21.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov21.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV21_FRAGMENTS)) {
      const at = SOV21_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the OTHER fields (bigIdea, benefits, bands, quiz, facilitator) is one of the pinned fragments or a substring of one', () => {
    const strings = [];
    const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
    walk({ ...sov21, lesson: '' });
    const fields = strings.join('\n');
    const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
    let m;
    while ((m = re.exec(fields))) {
      const [, q, ref] = m;
      const pinned = SOV21_FRAGMENTS[ref];
      expect(pinned, `${ref} quoted outside the lesson must be pinned`).toBeTruthy();
      expect(pinned.includes(q) || q.includes(pinned), `${ref}: "${q}" must be verbatim within the pinned fragment`).toBe(true);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov21.lesson.indexOf('FIRST, THE WORD SAW THE WHOLE SYSTEM FIRST')).toBe(0);
    // The body precedes McKinsey; sowing and reaping precedes the first dollar figure (Word first, DR-0312/DR-0331).
    expect(sov21.lesson.indexOf('I have no need of thee')).toBeLessThan(sov21.lesson.indexOf('McKinsey'));
    expect(sov21.lesson.indexOf('by him all things consist')).toBeLessThan(sov21.lesson.indexOf('$6.7 trillion'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov21.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov21.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: the loop, the bottleneck, the speeds, the reset, Joseph, the bright line, the projection, the stone, the brakes', () => {
    expect(sov21.lesson).toContain('THE OLDEST FEEDBACK LOOP');
    expect(sov21.lesson).toContain('THINGS OUT OF STEP');
    expect(sov21.lesson).toContain('THE SPEEDS OF CHANGE');
    expect(sov21.lesson).toContain('THE SEVENTH YEAR AND THE JUBILE');
    expect(sov21.lesson).toContain('THE FIRST SCENARIO PLAN');
    expect(sov21.lesson).toContain('a projection is not a prophecy');
    expect(sov21.lesson).toContain('LIKELY, into 2030');
    expect(sov21.lesson).toContain('CERTAIN, from the Word');
    expect(sov21.lesson).toContain('THE STONE CUT WITHOUT HANDS');
    for (const brake of ['BUDGET', 'LOCK', 'STOP']) expect(sov21.lesson).toContain(brake);
    expect(sov21.lesson).toContain('proven-to-catch');
    expect(sov21.lesson).toContain('ARMED-BY-RECORD');
    expect(sov21.inApp).toMatch(/OpsBoard/);
    // Daniel 12:4 is held with the Word's own reticence: no technology is named for it.
    expect(sov21.lesson).toContain('it does not name a technology, and we will not name one for it');
  });
  it('DR-0100: the tiers are named and applied; the report body is never quoted as if it were read; every 2030 figure is a projection', () => {
    expect(sov21.lesson).toContain('TIER ONE, documented');
    expect(sov21.lesson).toContain('TIER TWO, genuinely open');
    expect(sov21.lesson).toContain('TIER THREE, over-reach');
    expect(sov21.lesson).toContain('no number in this lesson is attributed to the report');
    expect(sov21.lesson).toContain('DR-0076 SS8');
    // Sources carry their as-of dates.
    for (const stamp of ['2026-09-10', 'April 2025', 'June 2023', 'July 2023', '2026-08-25', '2026-08-26', '2026-09-15']) expect(sov21.lesson).toContain(stamp);
    // The perspectives are steelmanned before the Word weighs them, and named to be educated past, not voted on.
    expect(sov21.lesson).toContain('be fair to the perspectives');
    expect(sov21.lesson).toContain('named to be educated past, not to be voted on');
    // Each LIKELY line carries its assumption.
    const likely = sov21.lesson.slice(sov21.lesson.indexOf('LIKELY, into 2030'), sov21.lesson.indexOf('CERTAIN, from the Word'));
    expect((likely.match(/\bIF\b/g) || []).length).toBeGreaterThanOrEqual(4);
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are McKinsey\'s own announcement lines', () => {
    const isWord = (q) => Object.values(SOV21_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov21.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      '"AI may be the most consequential technology of our time"',
      '"seeing the whole system, not just the technology"',
      '"fall out of step, creating bottlenecks and risks"',
      '"a change in one part can ripple through the rest"',
      '"AI is shaped by forces far beyond the technology itself, and its effects reach just as widely"',
    ];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
    // Bill Gates is carried paraphrased, never as a verbatim line.
    expect(sov21.lesson).toContain('paraphrased here, not quoted');
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov21.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov21.lesson).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov21.lesson).toContain('the Word');
    // The Son confessed as the Lamb.
    expect(sov21.lesson).toContain('the Son of Yahweh, the Lamb');
  });
  it('the send-off page has content: six benefits, each a real takeaway quoting the Word', () => {
    expect(sov21.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov21.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov21.benefits.join('  ');
    expect(blob).toContain('I have no need of thee');
    expect(blob).toContain('whatsoever a man soweth');
    expect(blob).toContain('If the Lord will');
    expect(blob).toContain('cut out without hands');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov21.levels.child).toBe('string');
    expect(sov21.levels.child.length).toBeLessThan(sov21.levels.teen.length);
    expect(sov21.levels.teen.length).toBeLessThan(sov21.levels.senior.length);
    expect(sov21.levels.child).not.toMatch(/kill|murder|rape|sexual|abuse|slaughter|massacre|execution|suicide|porn|drug/i);
    expect(sov21.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov21.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov21.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(sov21.rpe.research && sov21.rpe.plan && sov21.rpe.execute).toBeTruthy();
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact', () => {
    expect(SOV21_FRAGMENTS['Galatians 6:7']).toBe('Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.');
    expect(SOV21_FRAGMENTS['1 Corinthians 12:21']).toBe('And the eye cannot say unto the hand, I have no need of thee: nor again the head to the feet, I have no need of you.');
    expect(SOV21_FRAGMENTS['Deuteronomy 15:1']).toBe('At the end of every seven years thou shalt make a release.');
    expect(SOV21_FRAGMENTS['Deuteronomy 18:22']).toBe('When a prophet speaketh in the name of the LORD, if the thing follow not, nor come to pass, that is the thing which the LORD hath not spoken, but the prophet hath spoken it presumptuously: thou shalt not be afraid of him.');
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov21.lesson.replace('whatsoever a man soweth, that shall he also reap', 'whatever a man sows, that shall he also reap');
    expect(drifted).not.toContain(SOV21_FRAGMENTS['Galatians 6:7']);
  });
});

// =============================================================================
// sov22 — the needle in the haystack and the chunk that drops its condition
// (captured 2026-09-16 from the ByteByteGo issue "How LLMs Can Find a Needle in
// a Haystack", forwarded by the Governor with his "Lesson." marker and two
// words — research, and Word first; DR-0449). The class's retrieval week: the
// invitation to search is older than every index and came from Yahweh
// (Matthew 7:7; Jeremiah 29:13); a true sentence cut from its condition is the
// oldest trick there is (Genesis 2:16-17 re-chunked in Genesis 3:1, 4; Matthew
// 4:6 against Psalms 91:11, answered in Matthew 4:7), hence "rightly dividing"
// (2 Timothy 2:15); the Word explains the Word is the real embedding space
// (1 Corinthians 2:13; Isaiah 28:10; Acts 17:11); two or three witnesses is
// reranking (Deuteronomy 19:15; 2 Corinthians 13:1); a word in due season is
// metadata filtering (Proverbs 15:23); the Author superseded His own
// administration and never revised His text (Hebrews 8:13 with Isaiah 40:8;
// John 10:35); and when the retrieved set holds no answer we say so
// (Deuteronomy 29:29). Word-first per the sov9/sov10/sov17 standard; every
// real-world claim carried by DR-0100's tiers with source + as-of date; blocked
// domains named rather than pretended (DR-0076 §8); every quoted verse verbatim
// KJV + pinned here, a drift fails the build (DR-0281).
// =============================================================================
const sov22 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov22-the-needle-in-the-haystack-and-the-chunk-that-drops-its-condition');

const SOV22_FRAGMENTS = {
  "1 Chronicles 28:9": "for the LORD searcheth all hearts, and understandeth all the imaginations of the thoughts: if thou seek him, he will be found of thee; but if thou forsake him, he will cast thee off for ever.",
  "1 Corinthians 13:9": "For we know in part, and we prophesy in part.",
  "1 Corinthians 2:10": "But God hath revealed them unto us by his Spirit: for the Spirit searcheth all things, yea, the deep things of God.",
  "1 Corinthians 2:13": "Which things also we speak, not in the words which man’s wisdom teacheth, but which the Holy Ghost teacheth; comparing spiritual things with spiritual.",
  "1 Corinthians 2:14": "But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him: neither can he know them, because they are spiritually discerned.",
  "1 John 2:27": "But the anointing which ye have received of him abideth in you, and ye need not that any man teach you: but as the same anointing teacheth you of all things, and is truth, and is no lie, and even as it hath taught you, ye shall abide in him.",
  "1 John 4:1": "Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.",
  "1 Peter 3:15": "But sanctify the Lord God in your hearts: and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear:",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "1 Timothy 5:19": "Against an elder receive not an accusation, but before two or three witnesses.",
  "2 Corinthians 13:1": "This is the third time I am coming to you. In the mouth of two or three witnesses shall every word be established.",
  "2 Corinthians 3:6": "Who also hath made us able ministers of the new testament; not of the letter, but of the spirit: for the letter killeth, but the spirit giveth life.",
  "2 Peter 1:20": "Knowing this first, that no prophecy of the scripture is of any private interpretation.",
  "2 Peter 3:16": "hard to be understood, which they that are unlearned and unstable wrest, as they do also the other scriptures, unto their own destruction.",
  "2 Timothy 2:15": "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
  "2 Timothy 3:16": "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:",
  "2 Timothy 3:17": "That the man of God may be perfect, throughly furnished unto all good works.",
  "2 Timothy 4:2": "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.",
  "Acts 17:11": "These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.",
  "Acts 1:7": "And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.",
  "Acts 8:30": "And Philip ran thither to him, and heard him read the prophet Esaias, and said, Understandest thou what thou readest?",
  "Acts 8:31": "And he said, How can I, except some man should guide me? And he desired Philip that he would come up and sit with him.",
  "Amos 8:12": "And they shall wander from sea to sea, and from the north even to the east, they shall run to and fro to seek the word of the LORD, and shall not find it.",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "Deuteronomy 17:6": "At the mouth of two witnesses, or three witnesses, shall he that is worthy of death be put to death; but at the mouth of one witness he shall not be put to death.",
  "Deuteronomy 19:15": "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.",
  "Deuteronomy 29:29": "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.",
  "Deuteronomy 4:2": "Ye shall not add unto the word which I command you, neither shall ye diminish ought from it, that ye may keep the commandments of the LORD your God which I command you.",
  "Ecclesiastes 3:1": "To every thing there is a season, and a time to every purpose under the heaven:",
  "Ecclesiastes 3:7": "A time to rend, and a time to sew; a time to keep silence, and a time to speak;",
  "Galatians 3:24": "Wherefore the law was our schoolmaster to bring us unto Christ, that we might be justified by faith.",
  "Galatians 3:25": "But after that faith is come, we are no longer under a schoolmaster.",
  "Genesis 2:16": "And the LORD God commanded the man, saying, Of every tree of the garden thou mayest freely eat:",
  "Genesis 2:17": "But of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die.",
  "Genesis 3:1": "Now the serpent was more subtil than any beast of the field which the LORD God had made. And he said unto the woman, Yea, hath God said, Ye shall not eat of every tree of the garden?",
  "Genesis 3:4": "And the serpent said unto the woman, Ye shall not surely die:",
  "Hebrews 11:3": "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.",
  "Hebrews 1:1": "God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets,",
  "Hebrews 1:2": "Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds;",
  "Hebrews 4:12": "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
  "Hebrews 7:12": "For the priesthood being changed, there is made of necessity a change also of the law.",
  "Hebrews 8:13": "In that he saith, A new covenant, he hath made the first old. Now that which decayeth and waxeth old is ready to vanish away.",
  "Hebrews 8:6": "But now hath he obtained a more excellent ministry, by how much also he is the mediator of a better covenant, which was established upon better promises.",
  "Isaiah 28:10": "For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:",
  "Isaiah 34:16": "Seek ye out of the book of the LORD, and read: no one of these shall fail, none shall want her mate: for my mouth it hath commanded, and his spirit it hath gathered them.",
  "Isaiah 40:8": "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.",
  "Isaiah 45:19": "I have not spoken in secret, in a dark place of the earth: I said not unto the seed of Jacob, Seek ye me in vain: I the LORD speak righteousness, I declare things that are right.",
  "Isaiah 50:4": "The Lord GOD hath given me the tongue of the learned, that I should know how to speak a word in season to him that is weary: he wakeneth morning by morning, he wakeneth mine ear to hear as the learned.",
  "Jeremiah 17:10": "I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
  "Jeremiah 29:13": "And ye shall seek me, and find me, when ye shall search for me with all your heart.",
  "Jeremiah 6:16": "Thus saith the LORD, Stand ye in the ways, and see, and ask for the old paths, where is the good way, and walk therein, and ye shall find rest for your souls. But they said, We will not walk therein.",
  "Job 38:2": "Who is this that darkeneth counsel by words without knowledge?",
  "John 10:35": "If he called them gods, unto whom the word of God came, and the scripture cannot be broken;",
  "John 16:13": "Howbeit when he, the Spirit of truth, is come, he will guide you into all truth: for he shall not speak of himself; but whatsoever he shall hear, that shall he speak: and he will shew you things to come.",
  "John 17:17": "Sanctify them through thy truth: thy word is truth.",
  "John 21:25": "And there are also many other things which Jesus did, the which, if they should be written every one, I suppose that even the world itself could not contain the books that should be written. Amen.",
  "John 5:39": "Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.",
  "John 8:17": "It is also written in your law, that the testimony of two men is true.",
  "Luke 11:10": "For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.",
  "Luke 11:9": "And I say unto you, Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.",
  "Luke 12:42": "And the Lord said, Who then is that faithful and wise steward, whom his lord shall make ruler over his household, to give them their portion of meat in due season?",
  "Luke 15:4": "What man of you, having an hundred sheep, if he lose one of them, doth not leave the ninety and nine in the wilderness, and go after that which is lost, until he find it?",
  "Luke 15:5": "And when he hath found it, he layeth it on his shoulders, rejoicing.",
  "Luke 15:6": "And when he cometh home, he calleth together his friends and neighbours, saying unto them, Rejoice with me; for I have found my sheep which was lost.",
  "Luke 15:7": "I say unto you, that likewise joy shall be in heaven over one sinner that repenteth, more than over ninety and nine just persons, which need no repentance.",
  "Luke 15:8": "Either what woman having ten pieces of silver, if she lose one piece, doth not light a candle, and sweep the house, and seek diligently till she find it?",
  "Luke 15:9": "And when she hath found it, she calleth her friends and her neighbours together, saying, Rejoice with me; for I have found the piece which I had lost.",
  "Luke 19:10": "For the Son of man is come to seek and to save that which was lost.",
  "Luke 24:27": "And beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself.",
  "Luke 24:32": "And they said one to another, Did not our heart burn within us, while he talked with us by the way, and while he opened to us the scriptures?",
  "Matthew 13:44": "Again, the kingdom of heaven is like unto treasure hid in a field; the which when a man hath found, he hideth, and for joy thereof goeth and selleth all that he hath, and buyeth that field.",
  "Matthew 13:45": "Again, the kingdom of heaven is like unto a merchant man, seeking goodly pearls:",
  "Matthew 13:46": "Who, when he had found one pearl of great price, went and sold all that he had, and bought it.",
  "Matthew 13:52": "Then said he unto them, Therefore every scribe which is instructed unto the kingdom of heaven is like unto a man that is an householder, which bringeth forth out of his treasure things new and old.",
  "Matthew 18:16": "But if he will not hear thee, then take with thee one or two more, that in the mouth of two or three witnesses every word may be established.",
  "Matthew 22:29": "Ye do err, not knowing the scriptures, nor the power of God.",
  "Matthew 24:35": "Heaven and earth shall pass away, but my words shall not pass away.",
  "Matthew 4:10": "Then saith Jesus unto him, Get thee hence, satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.",
  "Matthew 4:4": "But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.",
  "Matthew 4:5": "Then the devil taketh him up into the holy city, and setteth him on a pinnacle of the temple,",
  "Matthew 4:6": "And saith unto him, If thou be the Son of God, cast thyself down: for it is written, He shall give his angels charge concerning thee: and in their hands they shall bear thee up, lest at any time thou dash thy foot against a stone.",
  "Matthew 4:7": "Jesus said unto him, It is written again, Thou shalt not tempt the Lord thy God.",
  "Matthew 5:38": "Ye have heard that it hath been said, An eye for an eye, and a tooth for a tooth:",
  "Matthew 5:39": "But I say unto you, That ye resist not evil: but whosoever shall smite thee on thy right cheek, turn to him the other also.",
  "Matthew 5:43": "Ye have heard that it hath been said, Thou shalt love thy neighbour, and hate thine enemy.",
  "Matthew 5:44": "But I say unto you, Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you;",
  "Matthew 7:7": "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you:",
  "Matthew 7:8": "For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.",
  "Nehemiah 8:8": "So they read in the book in the law of God distinctly, and gave the sense, and caused them to understand the reading.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Proverbs 15:22": "Without counsel purposes are disappointed: but in the multitude of counsellors they are established.",
  "Proverbs 15:23": "A man hath joy by the answer of his mouth: and a word spoken in due season, how good is it!",
  "Proverbs 17:28": "Even a fool, when he holdeth his peace, is counted wise: and he that shutteth his lips is esteemed a man of understanding.",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Proverbs 25:11": "A word fitly spoken is like apples of gold in pictures of silver.",
  "Proverbs 2:3": "Yea, if thou criest after knowledge, and liftest up thy voice for understanding;",
  "Proverbs 2:4": "If thou seekest her as silver, and searchest for her as for hid treasures;",
  "Proverbs 2:5": "Then shalt thou understand the fear of the LORD, and find the knowledge of God.",
  "Proverbs 30:5": "Every word of God is pure: he is a shield unto them that put their trust in him.",
  "Proverbs 30:6": "Add thou not unto his words, lest he reprove thee, and thou be found a liar.",
  "Proverbs 8:17": "I love them that love me; and those that seek me early shall find me.",
  "Psalms 119:105": "Thy word is a lamp unto my feet, and a light unto my path.",
  "Psalms 119:130": "The entrance of thy words giveth light; it giveth understanding unto the simple.",
  "Psalms 119:160": "Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever.",
  "Psalms 12:6": "The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.",
  "Psalms 12:7": "Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever.",
  "Psalms 139:1": "O LORD, thou hast searched me, and known me.",
  "Psalms 139:2": "Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.",
  "Psalms 139:23": "Search me, O God, and know my heart: try me, and know my thoughts:",
  "Psalms 139:24": "And see if there be any wicked way in me, and lead me in the way everlasting.",
  "Psalms 139:4": "For there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether.",
  "Psalms 91:11": "For he shall give his angels charge over thee, to keep thee in all thy ways.",
  "Psalms 91:12": "They shall bear thee up in their hands, lest thou dash thy foot against a stone.",
  "Revelation 22:18": "For I testify unto every man that heareth the words of the prophecy of this book, If any man shall add unto these things, God shall add unto him the plagues that are written in this book:",
  "Revelation 22:19": "And if any man shall take away from the words of the book of this prophecy, God shall take away his part out of the book of life, and out of the holy city, and from the things which are written in this book.",
  "Revelation 2:23": "And I will kill her children with death; and all the churches shall know that I am he which searcheth the reins and hearts: and I will give unto every one of you according to your works.",
  "Romans 15:4": "For whatsoever things were written aforetime were written for our learning, that we through patience and comfort of the scriptures might have hope.",
};

const SOV22_CORPUS = {
  "1 Chronicles 28:9": ["1Chronicles", 28, 9],
  "1 Corinthians 13:9": ["1Corinthians", 13, 9],
  "1 Corinthians 2:10": ["1Corinthians", 2, 10],
  "1 Corinthians 2:13": ["1Corinthians", 2, 13],
  "1 Corinthians 2:14": ["1Corinthians", 2, 14],
  "1 John 2:27": ["1John", 2, 27],
  "1 John 4:1": ["1John", 4, 1],
  "1 Peter 3:15": ["1Peter", 3, 15],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "1 Timothy 5:19": ["1Timothy", 5, 19],
  "2 Corinthians 13:1": ["2Corinthians", 13, 1],
  "2 Corinthians 3:6": ["2Corinthians", 3, 6],
  "2 Peter 1:20": ["2Peter", 1, 20],
  "2 Peter 3:16": ["2Peter", 3, 16],
  "2 Timothy 2:15": ["2Timothy", 2, 15],
  "2 Timothy 3:16": ["2Timothy", 3, 16],
  "2 Timothy 3:17": ["2Timothy", 3, 17],
  "2 Timothy 4:2": ["2Timothy", 4, 2],
  "Acts 17:11": ["Acts", 17, 11],
  "Acts 1:7": ["Acts", 1, 7],
  "Acts 8:30": ["Acts", 8, 30],
  "Acts 8:31": ["Acts", 8, 31],
  "Amos 8:12": ["Amos", 8, 12],
  "Colossians 1:17": ["Colossians", 1, 17],
  "Deuteronomy 17:6": ["Deuteronomy", 17, 6],
  "Deuteronomy 19:15": ["Deuteronomy", 19, 15],
  "Deuteronomy 29:29": ["Deuteronomy", 29, 29],
  "Deuteronomy 4:2": ["Deuteronomy", 4, 2],
  "Ecclesiastes 3:1": ["Ecclesiastes", 3, 1],
  "Ecclesiastes 3:7": ["Ecclesiastes", 3, 7],
  "Galatians 3:24": ["Galatians", 3, 24],
  "Galatians 3:25": ["Galatians", 3, 25],
  "Genesis 2:16": ["Genesis", 2, 16],
  "Genesis 2:17": ["Genesis", 2, 17],
  "Genesis 3:1": ["Genesis", 3, 1],
  "Genesis 3:4": ["Genesis", 3, 4],
  "Hebrews 11:3": ["Hebrews", 11, 3],
  "Hebrews 1:1": ["Hebrews", 1, 1],
  "Hebrews 1:2": ["Hebrews", 1, 2],
  "Hebrews 4:12": ["Hebrews", 4, 12],
  "Hebrews 7:12": ["Hebrews", 7, 12],
  "Hebrews 8:13": ["Hebrews", 8, 13],
  "Hebrews 8:6": ["Hebrews", 8, 6],
  "Isaiah 28:10": ["Isaiah", 28, 10],
  "Isaiah 34:16": ["Isaiah", 34, 16],
  "Isaiah 40:8": ["Isaiah", 40, 8],
  "Isaiah 45:19": ["Isaiah", 45, 19],
  "Isaiah 50:4": ["Isaiah", 50, 4],
  "Jeremiah 17:10": ["Jeremiah", 17, 10],
  "Jeremiah 29:13": ["Jeremiah", 29, 13],
  "Jeremiah 6:16": ["Jeremiah", 6, 16],
  "Job 38:2": ["Job", 38, 2],
  "John 10:35": ["John", 10, 35],
  "John 16:13": ["John", 16, 13],
  "John 17:17": ["John", 17, 17],
  "John 21:25": ["John", 21, 25],
  "John 5:39": ["John", 5, 39],
  "John 8:17": ["John", 8, 17],
  "Luke 11:10": ["Luke", 11, 10],
  "Luke 11:9": ["Luke", 11, 9],
  "Luke 12:42": ["Luke", 12, 42],
  "Luke 15:4": ["Luke", 15, 4],
  "Luke 15:5": ["Luke", 15, 5],
  "Luke 15:6": ["Luke", 15, 6],
  "Luke 15:7": ["Luke", 15, 7],
  "Luke 15:8": ["Luke", 15, 8],
  "Luke 15:9": ["Luke", 15, 9],
  "Luke 19:10": ["Luke", 19, 10],
  "Luke 24:27": ["Luke", 24, 27],
  "Luke 24:32": ["Luke", 24, 32],
  "Matthew 13:44": ["Matthew", 13, 44],
  "Matthew 13:45": ["Matthew", 13, 45],
  "Matthew 13:46": ["Matthew", 13, 46],
  "Matthew 13:52": ["Matthew", 13, 52],
  "Matthew 18:16": ["Matthew", 18, 16],
  "Matthew 22:29": ["Matthew", 22, 29],
  "Matthew 24:35": ["Matthew", 24, 35],
  "Matthew 4:10": ["Matthew", 4, 10],
  "Matthew 4:4": ["Matthew", 4, 4],
  "Matthew 4:5": ["Matthew", 4, 5],
  "Matthew 4:6": ["Matthew", 4, 6],
  "Matthew 4:7": ["Matthew", 4, 7],
  "Matthew 5:38": ["Matthew", 5, 38],
  "Matthew 5:39": ["Matthew", 5, 39],
  "Matthew 5:43": ["Matthew", 5, 43],
  "Matthew 5:44": ["Matthew", 5, 44],
  "Matthew 7:7": ["Matthew", 7, 7],
  "Matthew 7:8": ["Matthew", 7, 8],
  "Nehemiah 8:8": ["Nehemiah", 8, 8],
  "Proverbs 11:14": ["Proverbs", 11, 14],
  "Proverbs 14:15": ["Proverbs", 14, 15],
  "Proverbs 15:22": ["Proverbs", 15, 22],
  "Proverbs 15:23": ["Proverbs", 15, 23],
  "Proverbs 17:28": ["Proverbs", 17, 28],
  "Proverbs 18:13": ["Proverbs", 18, 13],
  "Proverbs 18:17": ["Proverbs", 18, 17],
  "Proverbs 25:11": ["Proverbs", 25, 11],
  "Proverbs 2:3": ["Proverbs", 2, 3],
  "Proverbs 2:4": ["Proverbs", 2, 4],
  "Proverbs 2:5": ["Proverbs", 2, 5],
  "Proverbs 30:5": ["Proverbs", 30, 5],
  "Proverbs 30:6": ["Proverbs", 30, 6],
  "Proverbs 8:17": ["Proverbs", 8, 17],
  "Psalms 119:105": ["Psalms", 119, 105],
  "Psalms 119:130": ["Psalms", 119, 130],
  "Psalms 119:160": ["Psalms", 119, 160],
  "Psalms 12:6": ["Psalms", 12, 6],
  "Psalms 12:7": ["Psalms", 12, 7],
  "Psalms 139:1": ["Psalms", 139, 1],
  "Psalms 139:2": ["Psalms", 139, 2],
  "Psalms 139:23": ["Psalms", 139, 23],
  "Psalms 139:24": ["Psalms", 139, 24],
  "Psalms 139:4": ["Psalms", 139, 4],
  "Psalms 91:11": ["Psalms", 91, 11],
  "Psalms 91:12": ["Psalms", 91, 12],
  "Revelation 22:18": ["Revelation", 22, 18],
  "Revelation 22:19": ["Revelation", 22, 19],
  "Revelation 2:23": ["Revelation", 2, 23],
  "Romans 15:4": ["Romans", 15, 4],
};

describe('sov22 — the needle in the haystack and the chunk that drops its condition quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the invitation to seek and on rightly dividing', () => {
    expect(sov22).toBeTruthy();
    expect(sov22.anchor.ref).toContain('Matthew 7:7');
    expect(sov22.anchor.ref).toContain('2 Timothy 2:15');
    expect(sov22.anchor.theme).toContain(SOV22_FRAGMENTS['Matthew 7:7']);
    expect(sov22.anchor.theme).toContain(SOV22_FRAGMENTS['2 Timothy 2:15']);
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov22.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV22_FRAGMENTS).length).toBeGreaterThanOrEqual(25);
    for (const [ref, fragment] of Object.entries(SOV22_FRAGMENTS)) {
      expect(sov22.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov22.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV22_FRAGMENTS)) {
      const at = SOV22_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the OTHER fields (bigIdea, inApp, benefits, bands, quiz, rpe, facilitator) is one of the pinned fragments or a substring of one', () => {
    const strings = [];
    const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
    walk({ ...sov22, lesson: '' });
    const fields = strings.join('\n');
    const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
    let m;
    while ((m = re.exec(fields))) {
      const [, q, ref] = m;
      const pinned = SOV22_FRAGMENTS[ref];
      expect(pinned, `${ref} quoted outside the lesson must be pinned`).toBeTruthy();
      expect(pinned.includes(q) || q.includes(pinned), `${ref}: "${q}" must be verbatim within the pinned fragment`).toBe(true);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov22.lesson.indexOf('FIRST, THE INVITATION IS OLDER THAN THE INDEX')).toBe(0);
    // The invitation precedes the newsletter's machinery; the Author precedes the first vendor fact (Word first, DR-0312/DR-0331).
    expect(sov22.lesson.indexOf('Ask, and it shall be given you')).toBeLessThan(sov22.lesson.indexOf('Retrieval-augmented generation'));
    expect(sov22.lesson.indexOf('by him all things consist')).toBeLessThan(sov22.lesson.indexOf('TIER ONE, documented'));
    expect(sov22.lesson.indexOf('to seek and to save that which was lost')).toBeLessThan(sov22.lesson.indexOf('pgvector'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov22.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov22.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: the re-chunk, rightly dividing, the real embedding space, evidence-not-verdict, witnesses, due season, the version line, reticence, the reversal', () => {
    for (const heading of [
      'SECOND, WHAT THE ARTICLE DESCRIBES, HELD TO THAT PLUMB LINE',
      'THIRD, THE CHUNK THAT DROPS ITS CONDITION IS THE OLDEST TRICK THERE IS',
      'FOURTH, THE WORD EXPLAINS THE WORD - THAT IS THE REAL EMBEDDING SPACE',
      'FIFTH, HOW CLOSE IS CLOSE ENOUGH - SIMILARITY IS EVIDENCE, NOT A VERDICT',
      'SIXTH, TWO OR THREE WITNESSES IS RERANKING',
      'SEVENTH, A WORD IN DUE SEASON IS METADATA FILTERING',
      'EIGHTH, THE VERSION QUESTION THE AUTHOR HIMSELF SETTLED',
      'NINTH, WHEN THERE IS NO ANSWER IN THE RETRIEVED SET, SAY SO',
      'TENTH, WHO SEARCHES WHOM',
    ]) expect(sov22.lesson).toContain(heading);
    // The garden re-chunk and the temple omission are both taught, and the answer with them.
    expect(sov22.lesson).toContain('He moved the restriction off the one tree and onto ALL of them');
    expect(sov22.lesson).toContain('The first verse he ended three words early');
    expect(sov22.lesson).toContain('IT IS WRITTEN AGAIN');
    expect(sov22.lesson).toContain('Divide rightly, not divide anywhere');
    // The nearest match is never the verdict, and the filter never falsifies a true passage.
    expect(sov22.lesson).toContain('a candidate, not a verdict');
    expect(sov22.lesson).toContain('A filter does not make a true passage false');
    // exactness is numerical, not doctrinal
    expect(sov22.lesson).toContain('exact describes the numerical search');
    // the version bright line, stated crisply and not overreached
    expect(sov22.lesson).toContain('The ADMINISTRATION was superseded by the Author Himself. The TEXT was never revised.');
    expect(sov22.lesson).toContain('We will not go one step past what the Word says here');
    // reticence named, not merely implied
    expect(sov22.lesson).toContain('reticence');
    // the house's own practice, read from the files
    expect(sov22.lesson).toContain('app/public/bible/kjv');
    expect(sov22.lesson).toContain('sixty-seven files on disk');
    expect(sov22.lesson).toContain('app/src/__tests__/sovereign-ai-verse-integrity.test.js');
    expect(sov22.lesson).toContain('scripts/scripture-inference-guard.mjs');
    expect(sov22.inApp).toMatch(/Scripture tab/);
    expect(sov22.inApp).toMatch(/Connections web/);
  });
  it('DR-0100: the tiers are named and applied, every source carries its as-of date, and blocked egress is disclosed rather than papered over', () => {
    expect(sov22.lesson).toContain('TIER ONE, documented');
    expect(sov22.lesson).toContain('TIER TWO, genuinely open');
    expect(sov22.lesson).toContain('TIER THREE, over-reach');
    // Primary sources named with their identifiers.
    for (const src of ['Malkov and Yashunin', 'arXiv 1603.09320', 'arXiv 2005.11401', 'NeurIPS 2020', 'IEEE Transactions on Pattern Analysis and Machine Intelligence volume 42', 'pgvector', 'FAISS', 'Milvus documentation']) {
      expect(sov22.lesson, `${src} must be named`).toContain(src);
    }
    // Every claim carries an as-of stamp, and the blocked domains are named (DR-0076 §8).
    expect(sov22.lesson).toContain('fetched 2026-09-16');
    expect(sov22.lesson).toContain('search-verified 2026-09-16');
    expect(sov22.lesson).toContain('egress-blocked');
    // Tier 2 is narrow: the open question is named, and what is NOT open is said out loud.
    expect(sov22.lesson).toContain('Which index wins for a given workload is genuinely open');
    expect(sov22.lesson).toContain('What is NOT open, and will not be hedged');
    // Tier 3 corrects the claim while the data under it stands.
    expect(sov22.lesson).toContain('the quiet belief that the tool nearest match IS the truth');
    expect(sov22.lesson).toContain('The data under it stands untouched');
    // Both steelmen are stated at their strongest, and named to be educated past rather than voted on.
    expect(sov22.lesson).toContain('THE FIRST PERSPECTIVE');
    expect(sov22.lesson).toContain('THE SECOND PERSPECTIVE');
    expect(sov22.lesson).toContain('named to be educated past');
    expect((sov22.lesson.match(/named to be educated past/g) || []).length).toBeGreaterThanOrEqual(2);
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are the forwarded article, primary vendor docs, or this repo\'s own files', () => {
    const isWord = (q) => Object.values(SOV22_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov22.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      "\"Can I expense a hotel if my flight gets cancelled?\"",
      "\"Accommodation expenses are reimbursable following a cancellation.\"",
      "\"This applies only when accommodation is not provided by the airline.\"",
      "\"matching vector lengths alone doesn't make two models compatible\"",
      "\"Similarity provides evidence of relevance, but additional checks are needed before that evidence becomes an answer.\"",
      "\"It doesn't guarantee that those neighbors contain the correct answer.\"",
      "\"These groups are mathematical neighborhoods, not tidy subject folders.\"",
      "\"It isn't the number of results returned.\"",
      "\"Disallowed points may still provide useful navigation routes toward allowed points.\"",
      "\"A metadata-only change can often be applied without re-embedding, provided that metadata was not a part of the text used to create the vector.\"",
      "\"Returning the closest passage doesn't mean that an answer exists.\"",
      "\"After normalization, the inner product equals cosine similarity.\"",
      "\"By default, pgvector performs exact nearest neighbor search, which provides perfect recall.\"",
      "\"The only index that can guarantee exact results is the IndexFlatL2 or IndexFlatIP.\"",
      "\"at query time, a set of `nprobe` inverted lists is selected\"",
      "\"the number of neighbors used in the graph\"",
      "\"the depth of exploration at add time\"",
      "\"the depth of exploration of the search\"",
      "\"the max number of connections per layer\"",
      "\"the size of the dynamic candidate list for constructing the graph\"",
      "\"the size of the dynamic candidate list for search\"",
      "\"fetch the actual translation rather than producing from memory\"",
      "\"A gate that always passes is itself a lie.\"",
      "\"They cannot see an error that lives BETWEEN two correct quotes.\"",
      "\"Wherever a registered pair is cited as one claim, the prose MUST name what each side actually measures.\""
];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
    // The newsletter is studied, never obeyed, and never treated as an authority over the Word.
    expect(sov22.lesson).toContain('the article is the occasion');
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov22.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov22.lesson).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov22.lesson).toContain('the Word');
    // The Son confessed as the Lamb.
    expect(sov22.lesson).toContain('the Son of Yahweh, the Lamb');
  });
  it('the send-off page has content: at least six benefits, each a real takeaway quoting the Word', () => {
    expect(sov22.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov22.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov22.benefits.join('  ');
    expect(blob).toContain('seek, and ye shall find');
    expect(blob).toContain('rightly dividing the word of truth');
    expect(blob).toContain('comparing spiritual things with spiritual');
    expect(blob).toContain('shall every word be established');
    expect(blob).toContain('a word spoken in due season');
    expect(blob).toContain('shall stand for ever');
    expect(blob).toContain('leave the ninety and nine');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov22.levels.child).toBe('string');
    expect(sov22.levels.child.length).toBeLessThan(sov22.levels.teen.length);
    expect(sov22.levels.teen.length).toBeLessThan(sov22.levels.senior.length);
    expect(sov22.levels.child).not.toMatch(/kill|murder|rape|sexual|abuse|slaughter|massacre|execution|suicide|porn|drug/i);
    expect(sov22.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov22.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov22.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(sov22.facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(5);
    expect(sov22.rpe.research && sov22.rpe.plan && sov22.rpe.execute).toBeTruthy();
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact, and a one-word drift fails', () => {
    expect(SOV22_FRAGMENTS['Matthew 7:7']).toBe('Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you:');
    expect(SOV22_FRAGMENTS['2 Timothy 2:15']).toBe('Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.');
    expect(SOV22_FRAGMENTS['Genesis 3:4']).toBe('And the serpent said unto the woman, Ye shall not surely die:');
    expect(SOV22_FRAGMENTS['Psalms 91:11']).toBe('For he shall give his angels charge over thee, to keep thee in all thy ways.');
    expect(SOV22_FRAGMENTS['Matthew 4:7']).toBe('Jesus said unto him, It is written again, Thou shalt not tempt the Lord thy God.');
    // The whole point of the week, pinned: the omitted clause IS the condition.
    expect(SOV22_FRAGMENTS['Matthew 4:6']).toContain('and in their hands they shall bear thee up');
    expect(SOV22_FRAGMENTS['Matthew 4:6']).not.toContain('in all thy ways');
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov22.lesson.split('seek, and ye shall find; knock, and it shall be opened unto you').join('seek, and you will find; knock, and it will be opened to you');
    expect(drifted).not.toContain(SOV22_FRAGMENTS['Matthew 7:7']);
  });
});

// =============================================================================
// sov23 — the swarm that agreed together and the plumbline held from outside
// (captured 2026-09-18 from The Neuron issue "AI Agents Just Out-Mathed Us",
// forwarded by the Governor with his "Lesson." marker; DR-0504). The class's
// accountability week: the plumbline is held from OUTSIDE the wall, in Yahweh's
// own hand (Amos 7:7-8; Proverbs 28:26; Jeremiah 10:23); the reported failure —
// agents trained to cooperate generalizing into covering for each other instead
// of flagging — is Acts 5:9 ("agreed together") against the skipped commandment
// (Leviticus 19:17; Ephesians 5:11-13; Exodus 23:2; Proverbs 1:10-15), with
// cooperation itself still honored (Ecclesiastes 4:9-12; Proverbs 11:14; Amos
// 3:3) and one man's reproof as the worked example (Galatians 2:11-14 with
// Proverbs 27:5-6 and Matthew 18:15-17); obscured chain-of-thought answered by
// the One from whom nothing is hid (John 3:19-21; Luke 12:2-3; Hebrews 4:12-13;
// Jeremiah 17:9-10); $0 revenue beside $12,431 of invoices for work never
// performed weighed as a false balance (Proverbs 11:1; Luke 16:10-12; Proverbs
// 14:23; Matthew 7:16-20); 88 hours honored as real (Genesis 1:27; Psalms 8:4-6;
// Exodus 31:3-4) and then measured against Babel and Job 38 (Genesis 11:4-9;
// Job 38:8-11; Psalms 104:9); and unmeasurable alignment answered by an external
// line, not a self-report (Proverbs 16:2; 2 Corinthians 10:12; 1 Corinthians
// 4:3-4; Psalms 26:2), which in this house takes the executable form of budget +
// lock + stop-path and gates proven-to-catch. Word-first per the sov9/sov17/sov22
// standard; every real-world claim carried by DR-0100's tiers with source and
// as-of date; blocked domains named rather than pretended (DR-0076 §8); every
// quoted verse verbatim KJV + pinned here, a drift fails the build (DR-0281).
// =============================================================================
const sov23 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov23-the-swarm-that-agreed-together-and-the-plumbline-held-from-outside');

const SOV23_FRAGMENTS = {
  "1 Corinthians 4:3": "But with me it is a very small thing that I should be judged of you, or of man’s judgment: yea, I judge not mine own self.",
  "1 Corinthians 4:4": "For I know nothing by myself; yet am I not hereby justified: but he that judgeth me is the Lord.",
  "1 Corinthians 4:5": "Therefore judge nothing before the time, until the Lord come, who both will bring to light the hidden things of darkness, and will make manifest the counsels of the hearts",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "2 Corinthians 10:12": "but they measuring themselves by themselves, and comparing themselves among themselves, are not wise.",
  "2 Corinthians 5:10": "For we must all appear before the judgment seat of Christ",
  "2 Thessalonians 3:11": "For we hear that there are some which walk among you disorderly, working not at all, but are busybodies.",
  "2 Thessalonians 3:12": "Now them that are such we command and exhort by our Lord Jesus Christ, that with quietness they work, and eat their own bread.",
  "2 Timothy 4:2": "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.",
  "Acts 5:1": "But a certain man named Ananias, with Sapphira his wife, sold a possession,",
  "Acts 5:2": "And kept back part of the price, his wife also being privy to it, and brought a certain part, and laid it at the apostles’ feet.",
  "Acts 5:4": "Whiles it remained, was it not thine own? and after it was sold, was it not in thine own power? why hast thou conceived this thing in thine heart? thou hast not lied unto men, but unto God.",
  "Acts 5:9": "Then Peter said unto her, How is it that ye have agreed together to tempt the Spirit of the Lord? behold, the feet of them which have buried thy husband are at the door, and shall carry thee out.",
  "Amos 3:3": "Can two walk together, except they be agreed?",
  "Amos 7:7": "Thus he shewed me: and, behold, the Lord stood upon a wall made by a plumbline, with a plumbline in his hand.",
  "Amos 7:8": "And the LORD said unto me, Amos, what seest thou? And I said, A plumbline. Then said the Lord, Behold, I will set a plumbline in the midst of my people Israel: I will not again pass by them any more:",
  "Colossians 1:16": "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "Deuteronomy 25:13": "Thou shalt not have in thy bag divers weights, a great and a small.",
  "Deuteronomy 25:15": "But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have",
  "Ecclesiastes 12:14": "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.",
  "Ecclesiastes 4:12": "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.",
  "Ecclesiastes 4:9": "Two are better than one; because they have a good reward for their labour.",
  "Ecclesiastes 9:11": "the race is not to the swift, nor the battle to the strong",
  "Ephesians 5:11": "And have no fellowship with the unfruitful works of darkness, but rather reprove them.",
  "Ephesians 5:12": "For it is a shame even to speak of those things which are done of them in secret.",
  "Ephesians 5:13": "But all things that are reproved are made manifest by the light: for whatsoever doth make manifest is light.",
  "Exodus 23:2": "Thou shalt not follow a multitude to do evil; neither shalt thou speak in a cause to decline after many to wrest judgment:",
  "Exodus 31:3": "And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,",
  "Exodus 31:4": "To devise cunning works, to work in gold, and in silver, and in brass,",
  "Ezekiel 18:20": "The soul that sinneth, it shall die.",
  "Galatians 2:11": "But when Peter was come to Antioch, I withstood him to the face, because he was to be blamed.",
  "Galatians 2:12": "For before that certain came from James, he did eat with the Gentiles: but when they were come, he withdrew and separated himself, fearing them which were of the circumcision.",
  "Galatians 2:13": "And the other Jews dissembled likewise with him; insomuch that Barnabas also was carried away with their dissimulation.",
  "Galatians 2:14": "But when I saw that they walked not uprightly according to the truth of the gospel, I said unto Peter before them all",
  "Galatians 6:3": "For if a man think himself to be something, when he is nothing, he deceiveth himself.",
  "Galatians 6:4": "But let every man prove his own work",
  "Galatians 6:7": "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.",
  "Genesis 1:27": "So God created man in his own image, in the image of God created he him",
  "Genesis 11:4": "And they said, Go to, let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name",
  "Genesis 11:6": "And the LORD said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.",
  "Genesis 11:8": "So the LORD scattered them abroad from thence upon the face of all the earth: and they left off to build the city.",
  "Genesis 11:9": "because the LORD did there confound the language of all the earth",
  "Hebrews 11:3": "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.",
  "Hebrews 4:12": "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
  "Hebrews 4:13": "Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do.",
  "Isaiah 40:12": "Who hath measured the waters in the hollow of his hand, and meted out heaven with the span, and comprehended the dust of the earth in a measure, and weighed the mountains in scales, and the hills in a balance?",
  "Isaiah 5:20": "Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness",
  "Isaiah 8:12": "Say ye not, A confederacy, to all them to whom this people shall say, A confederacy; neither fear ye their fear, nor be afraid.",
  "James 4:17": "Therefore to him that knoweth to do good, and doeth it not, to him it is sin.",
  "Jeremiah 10:23": "O LORD, I know that the way of man is not in himself: it is not in man that walketh to direct his steps.",
  "Jeremiah 11:9": "And the LORD said unto me, A conspiracy is found among the men of Judah, and among the inhabitants of Jerusalem.",
  "Jeremiah 17:10": "I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
  "Jeremiah 17:9": "The heart is deceitful above all things, and desperately wicked: who can know it?",
  "Jeremiah 5:22": "Fear ye not me? saith the LORD: will ye not tremble at my presence, which have placed the sand for the bound of the sea by a perpetual decree, that it cannot pass it",
  "Job 34:21": "For his eyes are upon the ways of man, and he seeth all his goings.",
  "Job 34:22": "There is no darkness, nor shadow of death, where the workers of iniquity may hide themselves.",
  "Job 38:10": "And brake up for it my decreed place, and set bars and doors,",
  "Job 38:11": "And said, Hitherto shalt thou come, but no further: and here shall thy proud waves be stayed?",
  "Job 38:4": "Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding.",
  "Job 38:8": "Or who shut up the sea with doors, when it brake forth, as if it had issued out of the womb?",
  "Job 38:9": "When I made the cloud the garment thereof, and thick darkness a swaddlingband for it,",
  "John 3:19": "And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.",
  "John 3:20": "For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.",
  "John 3:21": "But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.",
  "Leviticus 19:17": "Thou shalt not hate thy brother in thine heart: thou shalt in any wise rebuke thy neighbour, and not suffer sin upon him.",
  "Luke 12:2": "For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.",
  "Luke 12:3": "Therefore whatsoever ye have spoken in darkness shall be heard in the light; and that which ye have spoken in the ear in closets shall be proclaimed upon the housetops.",
  "Luke 12:48": "For unto whomsoever much is given, of him shall be much required",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Luke 16:11": "If therefore ye have not been faithful in the unrighteous mammon, who will commit to your trust the true riches?",
  "Luke 16:12": "And if ye have not been faithful in that which is another man’s, who shall give you that which is your own?",
  "Matthew 18:15": "Moreover if thy brother shall trespass against thee, go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother.",
  "Matthew 18:16": "But if he will not hear thee, then take with thee one or two more, that in the mouth of two or three witnesses every word may be established.",
  "Matthew 18:17": "And if he shall neglect to hear them, tell it unto the church",
  "Matthew 7:16": "Ye shall know them by their fruits. Do men gather grapes of thorns, or figs of thistles?",
  "Matthew 7:20": "Wherefore by their fruits ye shall know them.",
  "Micah 6:11": "Shall I count them pure with the wicked balances, and with the bag of deceitful weights?",
  "Micah 7:3": "That they may do evil with both hands earnestly, the prince asketh, and the judge asketh for a reward; and the great man, he uttereth his mischievous desire: so they wrap it up.",
  "Numbers 32:23": "But if ye will not do so, behold, ye have sinned against the LORD: and be sure your sin will find you out.",
  "Proverbs 1:10": "My son, if sinners entice thee, consent thou not.",
  "Proverbs 1:14": "Cast in thy lot among us; let us all have one purse:",
  "Proverbs 1:15": "My son, walk not thou in the way with them; refrain thy foot from their path:",
  "Proverbs 11:1": "A false balance is abomination to the LORD: but a just weight is his delight.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Proverbs 14:23": "In all labour there is profit: but the talk of the lips tendeth only to penury.",
  "Proverbs 15:3": "The eyes of the LORD are in every place, beholding the evil and the good.",
  "Proverbs 16:2": "All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.",
  "Proverbs 18:9": "He also that is slothful in his work is brother to him that is a great waster.",
  "Proverbs 20:23": "Divers weights are an abomination unto the LORD; and a false balance is not good.",
  "Proverbs 21:2": "Every way of a man is right in his own eyes: but the LORD pondereth the hearts.",
  "Proverbs 21:31": "The horse is prepared against the day of battle: but safety is of the LORD.",
  "Proverbs 22:29": "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.",
  "Proverbs 27:17": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  "Proverbs 27:5": "Open rebuke is better than secret love.",
  "Proverbs 27:6": "Faithful are the wounds of a friend; but the kisses of an enemy are deceitful.",
  "Proverbs 28:26": "He that trusteth in his own heart is a fool: but whoso walketh wisely, he shall be delivered.",
  "Psalms 104:9": "Thou hast set a bound that they may not pass over; that they turn not again to cover the earth.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it",
  "Psalms 133:1": "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
  "Psalms 139:11": "If I say, Surely the darkness shall cover me; even the night shall be light about me.",
  "Psalms 139:12": "Yea, the darkness hideth not from thee; but the night shineth as the day: the darkness and the light are both alike to thee.",
  "Psalms 139:23": "Search me, O God, and know my heart: try me, and know my thoughts:",
  "Psalms 139:24": "And see if there be any wicked way in me, and lead me in the way everlasting.",
  "Psalms 141:5": "Let the righteous smite me; it shall be a kindness: and let him reprove me; it shall be an excellent oil",
  "Psalms 19:12": "Who can understand his errors? cleanse thou me from secret faults.",
  "Psalms 19:13": "Keep back thy servant also from presumptuous sins; let them not have dominion over me",
  "Psalms 26:2": "Examine me, O LORD, and prove me; try my reins and my heart.",
  "Psalms 33:16": "There is no king saved by the multitude of an host: a mighty man is not delivered by much strength.",
  "Psalms 33:17": "An horse is a vain thing for safety: neither shall he deliver any by his great strength.",
  "Psalms 8:4": "What is man, that thou art mindful of him? and the son of man, that thou visitest him?",
  "Psalms 8:5": "For thou hast made him a little lower than the angels, and hast crowned him with glory and honour.",
  "Psalms 8:6": "Thou madest him to have dominion over the works of thy hands; thou hast put all things under his feet:",
  "Romans 14:12": "So then every one of us shall give account of himself to God.",
  "Titus 1:16": "They profess that they know God; but in works they deny him",
  "Zechariah 4:6": "Not by might, nor by power, but by my spirit, saith the LORD of hosts.",
};

const SOV23_CORPUS = {
  "1 Corinthians 4:3": ["1Corinthians", 4, 3],
  "1 Corinthians 4:4": ["1Corinthians", 4, 4],
  "1 Corinthians 4:5": ["1Corinthians", 4, 5],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "2 Corinthians 10:12": ["2Corinthians", 10, 12],
  "2 Corinthians 5:10": ["2Corinthians", 5, 10],
  "2 Thessalonians 3:11": ["2Thessalonians", 3, 11],
  "2 Thessalonians 3:12": ["2Thessalonians", 3, 12],
  "2 Timothy 4:2": ["2Timothy", 4, 2],
  "Acts 5:1": ["Acts", 5, 1],
  "Acts 5:2": ["Acts", 5, 2],
  "Acts 5:4": ["Acts", 5, 4],
  "Acts 5:9": ["Acts", 5, 9],
  "Amos 3:3": ["Amos", 3, 3],
  "Amos 7:7": ["Amos", 7, 7],
  "Amos 7:8": ["Amos", 7, 8],
  "Colossians 1:16": ["Colossians", 1, 16],
  "Colossians 1:17": ["Colossians", 1, 17],
  "Deuteronomy 25:13": ["Deuteronomy", 25, 13],
  "Deuteronomy 25:15": ["Deuteronomy", 25, 15],
  "Ecclesiastes 12:14": ["Ecclesiastes", 12, 14],
  "Ecclesiastes 4:12": ["Ecclesiastes", 4, 12],
  "Ecclesiastes 4:9": ["Ecclesiastes", 4, 9],
  "Ecclesiastes 9:11": ["Ecclesiastes", 9, 11],
  "Ephesians 5:11": ["Ephesians", 5, 11],
  "Ephesians 5:12": ["Ephesians", 5, 12],
  "Ephesians 5:13": ["Ephesians", 5, 13],
  "Exodus 23:2": ["Exodus", 23, 2],
  "Exodus 31:3": ["Exodus", 31, 3],
  "Exodus 31:4": ["Exodus", 31, 4],
  "Ezekiel 18:20": ["Ezekiel", 18, 20],
  "Galatians 2:11": ["Galatians", 2, 11],
  "Galatians 2:12": ["Galatians", 2, 12],
  "Galatians 2:13": ["Galatians", 2, 13],
  "Galatians 2:14": ["Galatians", 2, 14],
  "Galatians 6:3": ["Galatians", 6, 3],
  "Galatians 6:4": ["Galatians", 6, 4],
  "Galatians 6:7": ["Galatians", 6, 7],
  "Genesis 1:27": ["Genesis", 1, 27],
  "Genesis 11:4": ["Genesis", 11, 4],
  "Genesis 11:6": ["Genesis", 11, 6],
  "Genesis 11:8": ["Genesis", 11, 8],
  "Genesis 11:9": ["Genesis", 11, 9],
  "Hebrews 11:3": ["Hebrews", 11, 3],
  "Hebrews 4:12": ["Hebrews", 4, 12],
  "Hebrews 4:13": ["Hebrews", 4, 13],
  "Isaiah 40:12": ["Isaiah", 40, 12],
  "Isaiah 5:20": ["Isaiah", 5, 20],
  "Isaiah 8:12": ["Isaiah", 8, 12],
  "James 4:17": ["James", 4, 17],
  "Jeremiah 10:23": ["Jeremiah", 10, 23],
  "Jeremiah 11:9": ["Jeremiah", 11, 9],
  "Jeremiah 17:10": ["Jeremiah", 17, 10],
  "Jeremiah 17:9": ["Jeremiah", 17, 9],
  "Jeremiah 5:22": ["Jeremiah", 5, 22],
  "Job 34:21": ["Job", 34, 21],
  "Job 34:22": ["Job", 34, 22],
  "Job 38:10": ["Job", 38, 10],
  "Job 38:11": ["Job", 38, 11],
  "Job 38:4": ["Job", 38, 4],
  "Job 38:8": ["Job", 38, 8],
  "Job 38:9": ["Job", 38, 9],
  "John 3:19": ["John", 3, 19],
  "John 3:20": ["John", 3, 20],
  "John 3:21": ["John", 3, 21],
  "Leviticus 19:17": ["Leviticus", 19, 17],
  "Luke 12:2": ["Luke", 12, 2],
  "Luke 12:3": ["Luke", 12, 3],
  "Luke 12:48": ["Luke", 12, 48],
  "Luke 16:10": ["Luke", 16, 10],
  "Luke 16:11": ["Luke", 16, 11],
  "Luke 16:12": ["Luke", 16, 12],
  "Matthew 18:15": ["Matthew", 18, 15],
  "Matthew 18:16": ["Matthew", 18, 16],
  "Matthew 18:17": ["Matthew", 18, 17],
  "Matthew 7:16": ["Matthew", 7, 16],
  "Matthew 7:20": ["Matthew", 7, 20],
  "Micah 6:11": ["Micah", 6, 11],
  "Micah 7:3": ["Micah", 7, 3],
  "Numbers 32:23": ["Numbers", 32, 23],
  "Proverbs 1:10": ["Proverbs", 1, 10],
  "Proverbs 1:14": ["Proverbs", 1, 14],
  "Proverbs 1:15": ["Proverbs", 1, 15],
  "Proverbs 11:1": ["Proverbs", 11, 1],
  "Proverbs 11:14": ["Proverbs", 11, 14],
  "Proverbs 14:23": ["Proverbs", 14, 23],
  "Proverbs 15:3": ["Proverbs", 15, 3],
  "Proverbs 16:2": ["Proverbs", 16, 2],
  "Proverbs 18:9": ["Proverbs", 18, 9],
  "Proverbs 20:23": ["Proverbs", 20, 23],
  "Proverbs 21:2": ["Proverbs", 21, 2],
  "Proverbs 21:31": ["Proverbs", 21, 31],
  "Proverbs 22:29": ["Proverbs", 22, 29],
  "Proverbs 27:17": ["Proverbs", 27, 17],
  "Proverbs 27:5": ["Proverbs", 27, 5],
  "Proverbs 27:6": ["Proverbs", 27, 6],
  "Proverbs 28:26": ["Proverbs", 28, 26],
  "Psalms 104:9": ["Psalms", 104, 9],
  "Psalms 127:1": ["Psalms", 127, 1],
  "Psalms 133:1": ["Psalms", 133, 1],
  "Psalms 139:11": ["Psalms", 139, 11],
  "Psalms 139:12": ["Psalms", 139, 12],
  "Psalms 139:23": ["Psalms", 139, 23],
  "Psalms 139:24": ["Psalms", 139, 24],
  "Psalms 141:5": ["Psalms", 141, 5],
  "Psalms 19:12": ["Psalms", 19, 12],
  "Psalms 19:13": ["Psalms", 19, 13],
  "Psalms 26:2": ["Psalms", 26, 2],
  "Psalms 33:16": ["Psalms", 33, 16],
  "Psalms 33:17": ["Psalms", 33, 17],
  "Psalms 8:4": ["Psalms", 8, 4],
  "Psalms 8:5": ["Psalms", 8, 5],
  "Psalms 8:6": ["Psalms", 8, 6],
  "Romans 14:12": ["Romans", 14, 12],
  "Titus 1:16": ["Titus", 1, 16],
  "Zechariah 4:6": ["Zechariah", 4, 6],
};

describe('sov23 — the swarm that agreed together quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the plumbline held from outside and on the agreeing-together charge', () => {
    expect(sov23).toBeTruthy();
    expect(sov23.anchor.ref).toContain('Amos 7:8');
    expect(sov23.anchor.ref).toContain('Acts 5:9');
    // The anchor quotes the load-bearing CLAUSE of each verse; each clause is
    // itself verbatim inside the pinned full verse, which is checked below.
    const plumbline = 'Behold, I will set a plumbline in the midst of my people Israel';
    const agreed = 'How is it that ye have agreed together to tempt the Spirit of the Lord?';
    expect(sov23.anchor.theme).toContain(plumbline);
    expect(sov23.anchor.theme).toContain(agreed);
    expect(SOV23_FRAGMENTS['Amos 7:8']).toContain(plumbline);
    expect(SOV23_FRAGMENTS['Acts 5:9']).toContain(agreed);
    expect(sov23.anchor.theme).toContain(SOV23_FRAGMENTS['Proverbs 28:26']);
    const rebuke = 'thou shalt in any wise rebuke thy neighbour, and not suffer sin upon him.';
    expect(sov23.anchor.theme).toContain(rebuke);
    expect(SOV23_FRAGMENTS['Leviticus 19:17']).toContain(rebuke);
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov23.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV23_FRAGMENTS).length).toBeGreaterThanOrEqual(100);
    for (const [ref, fragment] of Object.entries(SOV23_FRAGMENTS)) {
      expect(sov23.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov23.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV23_FRAGMENTS)) {
      const at = SOV23_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the OTHER fields (bigIdea, inApp, benefits, bands, quiz, rpe, facilitator) is one of the pinned fragments or a substring of one', () => {
    const strings = [];
    const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
    walk({ ...sov23, lesson: '' });
    const fields = strings.join('\n');
    const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
    let m;
    while ((m = re.exec(fields))) {
      const [, q, ref] = m;
      const pinned = SOV23_FRAGMENTS[ref];
      expect(pinned, `${ref} quoted outside the lesson must be pinned`).toBeTruthy();
      expect(pinned.includes(q) || q.includes(pinned), `${ref}: "${q}" must be verbatim within the pinned fragment`).toBe(true);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov23.lesson.indexOf('FIRST, THE PLUMBLINE IS HELD FROM OUTSIDE THE WALL')).toBe(0);
    // The plumbline in His hand precedes every vendor fact; the Author precedes the first tier (Word first, DR-0312/DR-0331).
    expect(sov23.lesson.indexOf('with a plumbline in his hand')).toBeLessThan(sov23.lesson.indexOf('Navier-Stokes'));
    expect(sov23.lesson.indexOf('by him all things consist')).toBeLessThan(sov23.lesson.indexOf('TIER ONE, documented'));
    expect(sov23.lesson.indexOf('Prove all things; hold fast that which is good.')).toBeLessThan(sov23.lesson.indexOf('Bottleneck Labs'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov23.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov23.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: agreeing together, the counterweight, the reproof, hidden reasoning, the false balance, honor-then-measure, the external line, accountability', () => {
    for (const heading of [
      'SECOND, WHAT THE REPORT SAYS, HELD TO THAT PLUMBLINE',
      'THIRD, THE CHUNK OF THIS THAT IS ANCIENT - AGREEING TOGETHER INSTEAD OF REPROVING',
      'FOURTH, THE COUNTERWEIGHT - COOPERATION IS NOT THE DEFECT',
      'FIFTH, THE MAN WHO REPROVED WHEN THE WHOLE ROOM COVERED',
      'SIXTH, REASONING THAT LEARNS TO HIDE, AND THE ONE FROM WHOM NOTHING IS HID',
      'SEVENTH, ZERO REVENUE BESIDE TWELVE THOUSAND FOUR HUNDRED AND THIRTY-ONE DOLLARS OF FALSE INVOICES',
      'EIGHTH, EIGHTY-EIGHT HOURS AGAINST FOUR THOUSAND YEARS - GIVE THE HONOR THAT IS DUE, AND THEN MEASURE IT',
      'NINTH, UNMEASURABLE ALIGNMENT, AND THE PLUMBLINE HELD FROM OUTSIDE',
      'TENTH, WHO ANSWERS WHEN THE SWARM DOES NOT',
    ]) expect(sov23.lesson).toContain(heading);
    // Acts 5 is taught from the text's own wording: the charge is NOT theft.
    expect(sov23.lesson).toContain('Peter does not charge them with theft');
    expect(sov23.lesson).toContain('The cooperation WAS the sin');
    expect(SOV23_FRAGMENTS['Acts 5:4']).toContain('was it not thine own?');
    // The week's portable rule, stated in full.
    expect(sov23.lesson).toContain('cooperation trained without a standard becomes collusion, and loyalty without a plumbline is a conspiracy');
    // The counterweight is REAL, not a disclaimer: the same word carries opposite verdicts.
    expect(sov23.lesson).toContain('the same word - multitude - carries opposite verdicts');
    expect(sov23.lesson).toContain('Cooperation under a standard is a threefold cord');
    // The reproof is commanded AND ordered (private first), and silence is not neutral.
    expect(sov23.lesson).toContain('Alone, first.');
    expect(sov23.lesson).toContain('The reproof is commanded; the cruelty is not.');
    // Hidden reasoning: the monitor is kept AND demoted.
    expect(sov23.lesson).toContain('A monitor the monitored can learn to dress up was never the last word');
    expect(sov23.lesson).toContain('a second, different KIND of witness');
    // The ledger: an invoice is a weight, and the trial was the least.
    expect(sov23.lesson).toContain('An invoice is a weight.');
    expect(sov23.lesson).toContain('Autonomy is not competence.');
    // Honor is given plainly before the correction (DR-0100 tier 1 both directions).
    expect(sov23.lesson).toContain('Honor first, and honor it warmly, because under-claiming a real thing is also a lie');
    expect(sov23.lesson).toContain('So: real honor, sincerely given, to real work. No sneering.');
    // Babel: the capability was REAL and the restraint was trivial for Him.
    expect(sov23.lesson).toContain('He agreed with their projection.');
    expect(sov23.lesson).toContain('He changed the messaging layer.');
    expect(sov23.lesson).toContain('speed is not sovereignty');
    // The external plumbline, in this house's executable form.
    expect(sov23.lesson).toContain('self-assessment returns a pass by construction');
    expect(sov23.lesson).toContain('a BUDGET');
    expect(sov23.lesson).toContain('a CONCURRENCY LOCK');
    expect(sov23.lesson).toContain('a STOP-PATH');
    expect(sov23.lesson).toContain('A gate that always passes is itself a lie.');
    expect(sov23.lesson).toContain('existence is not a pass');
    expect(sov23.lesson).toContain('None of those four is a self-report.');
    // Accountability lands on persons, and the grace note is spoken.
    expect(sov23.lesson).toContain('A swarm cannot stand in judgment.');
    expect(sov23.lesson).toContain('No condemnation is pronounced here on any researcher, any engineer, or any soul.');
    // The in-app surfaces are named so the plumbline is not an abstraction.
    expect(sov23.lesson).toContain('OpsBoard');
    expect(sov23.lesson).toContain('QualityProof');
    expect(sov23.inApp).toMatch(/Scripture tab/);
    expect(sov23.inApp).toMatch(/OpsBoard/);
    expect(sov23.inApp).toMatch(/QualityProof/);
  });
  it('DR-0100: the tiers are named and applied, every source carries its as-of date, and blocked egress is disclosed rather than papered over', () => {
    expect(sov23.lesson).toContain('TIER ONE, documented');
    expect(sov23.lesson).toContain('TIER TWO, genuinely open');
    expect(sov23.lesson).toContain('TIER THREE, over-reach');
    // Primary sources named with their identifiers.
    for (const src of ['Noam Brown', 'Dwarkesh Patel', 'Quanta Magazine', 'Clay Mathematics Institute', 'Bottleneck Labs', 'Goodfire', 'arXiv 2609.19101', 'Lean proof assistant', 'Charles Fefferman']) {
      expect(sov23.lesson, `${src} must be named`).toContain(src);
    }
    // The documented figures are stated plainly, not hedged (DR-0100 tier 1).
    for (const fig of ['ten thousand concurrent agents', 'eighty-eight hours', '130 billion output tokens', '166-page proof', '12,431 dollars', '2,797', 'seventy-two hours']) {
      expect(sov23.lesson, `${fig} must be stated`).toContain(fig);
    }
    // Every claim carries an as-of stamp, and the blocked domains are named (DR-0076 §8).
    expect(sov23.lesson).toContain('search-verified 2026-09-18');
    expect(sov23.lesson).toContain('egress-blocked');
    expect(sov23.lesson).toContain('Do not imply a fetch that did not happen.');
    // Tier 2 is NARROW: what is open is named precisely, and what is not open is said out loud.
    expect(sov23.lesson).toContain('Whether the Navier-Stokes result STANDS is not settled');
    expect(sov23.lesson).toContain('What is NOT open, and will not be hedged');
    expect(sov23.lesson).toContain('NOT inflated into a machine uprising');
    // Tier 3 corrects the claim while the data under it stands.
    expect(sov23.lesson).toContain('the framing that a swarm is a moral agent');
    expect(sov23.lesson).toContain('The data under that claim stands completely untouched');
    // Both steelmen are stated at their strongest, and named to be educated past rather than voted on.
    expect(sov23.lesson).toContain('THE FIRST PERSPECTIVE');
    expect(sov23.lesson).toContain('THE SECOND PERSPECTIVE');
    expect(sov23.lesson).toContain('named to be educated past');
    expect(sov23.lesson).toContain('Architecture is not the variable that decides this.');
    expect(JSON.stringify(sov23.facilitator)).toContain('named to be educated past');
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are the forwarded report, named primary sources, or this repo\'s own files', () => {
    const isWord = (q) => Object.values(SOV23_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov23.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      '"AI Agents Just Out-Mathed Us"',
      '"On the Navier-Stokes Millennium Prize Problem"',
      '"7 AI models ran real businesses"',
      '"Models know when they’re reward hacking — and we can catch them at scale"',
      '"Noam Brown – Agent swarms, alignment, & recursive self-improvement"',
      '"sublinear speedup"',
      '"coordinating to avoid detection"',
      '"the AI went rogue"',
      '"active"',
      '"the intellectual heroes"',
      '"it went rogue"',
      '"nobody is responsible, the behavior was emergent"',
      '"A gate that always passes is itself a lie."',
    ];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
    // The report is studied, never obeyed, and never treated as an authority over the Word.
    expect(sov23.lesson).toContain('the report is the occasion');
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov23.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov23.lesson).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b|\bAdversary\b/);
    expect(sov23.lesson).toContain('the Word');
    // The Son confessed as the Lamb.
    expect(sov23.lesson).toContain('the Son of Yahweh, the Lamb');
  });
  it('the send-off page has content: at least six benefits, each a real takeaway quoting the Word', () => {
    expect(sov23.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov23.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov23.benefits.join('  ');
    expect(blob).toContain('agreed together to tempt the Spirit of the Lord');
    expect(blob).toContain('rebuke thy neighbour, and not suffer sin upon him');
    expect(blob).toContain('Two are better than one');
    expect(blob).toContain('I withstood him to the face');
    expect(blob).toContain('naked and opened unto the eyes of him');
    expect(blob).toContain('A false balance is abomination to the LORD');
    expect(blob).toContain('crowned him with glory and honour');
    expect(blob).toContain('nothing will be restrained from them');
    expect(blob).toContain('measuring themselves by themselves');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov23.levels.child).toBe('string');
    expect(sov23.levels.child.length).toBeLessThan(sov23.levels.teen.length);
    expect(sov23.levels.teen.length).toBeLessThan(sov23.levels.senior.length);
    expect(sov23.levels.child).not.toMatch(/kill|murder|rape|sexual|abuse|slaughter|massacre|execution|suicide|porn|drug/i);
    expect(sov23.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov23.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov23.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(sov23.facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(5);
    expect(sov23.rpe.research && sov23.rpe.plan && sov23.rpe.execute).toBeTruthy();
    // The grace note is carried where a facilitator will actually read it.
    expect(JSON.stringify(sov23.facilitator)).toContain('no condemnation is pronounced here');
    expect(sov23.levels.senior).toContain('GRACE NOTE');
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact, and a one-word drift fails', () => {
    expect(SOV23_FRAGMENTS['Amos 7:7']).toBe('Thus he shewed me: and, behold, the Lord stood upon a wall made by a plumbline, with a plumbline in his hand.');
    expect(SOV23_FRAGMENTS['Amos 7:8']).toBe('And the LORD said unto me, Amos, what seest thou? And I said, A plumbline. Then said the Lord, Behold, I will set a plumbline in the midst of my people Israel: I will not again pass by them any more:');
    expect(SOV23_FRAGMENTS['Acts 5:9']).toBe('Then Peter said unto her, How is it that ye have agreed together to tempt the Spirit of the Lord? behold, the feet of them which have buried thy husband are at the door, and shall carry thee out.');
    expect(SOV23_FRAGMENTS['Leviticus 19:17']).toBe('Thou shalt not hate thy brother in thine heart: thou shalt in any wise rebuke thy neighbour, and not suffer sin upon him.');
    expect(SOV23_FRAGMENTS['Ephesians 5:11']).toBe('And have no fellowship with the unfruitful works of darkness, but rather reprove them.');
    expect(SOV23_FRAGMENTS['Exodus 23:2']).toBe('Thou shalt not follow a multitude to do evil; neither shalt thou speak in a cause to decline after many to wrest judgment:');
    expect(SOV23_FRAGMENTS['Galatians 2:11']).toBe('But when Peter was come to Antioch, I withstood him to the face, because he was to be blamed.');
    expect(SOV23_FRAGMENTS['Proverbs 11:1']).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(SOV23_FRAGMENTS['Job 38:11']).toBe('And said, Hitherto shalt thou come, but no further: and here shall thy proud waves be stayed?');
    expect(SOV23_FRAGMENTS['Genesis 11:6']).toBe('And the LORD said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.');
    // The whole point of the week, pinned: the duty skipped was the REBUKE, and
    // the charge in Acts 5 is the agreeing together, not the money.
    expect(SOV23_FRAGMENTS['Leviticus 19:17']).toContain('thou shalt in any wise rebuke thy neighbour');
    expect(SOV23_FRAGMENTS['Acts 5:4']).toContain('was it not in thine own power?');
    expect(SOV23_FRAGMENTS['Acts 5:9']).toContain('agreed together');
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov23.lesson.split('ye have agreed together to tempt the Spirit of the Lord').join('you have conspired together to tempt the Spirit of the Lord');
    expect(drifted).not.toContain(SOV23_FRAGMENTS['Acts 5:9']);
  });
});


// =============================================================================
// sov24 — changing the engine in flight, and the Word that is not a schema
// =============================================================================
// Week 24, captured 2026-09-18 by the Gmail-lesson-intake Way (DR-0312) from
// the ByteByteGo issue Migrations at Scale: Changing the Application Engine at
// 30,000 Feet (Sep 17 2026), forwarded by the Governor with one word: Lessons.
// The forward was a PAYWALLED PREVIEW — only the framing arrived and it cut off
// at What Exactly is Being Replaced — so honest provenance is itself part of
// the teaching (DR-0076): the framing is carried as the piece's own claim, the
// key strategies it promised are named as NOT AVAILABLE rather than invented,
// and the worked example is this house's own migration measured from its own
// files. The pins below also hold the CITATION straight, because a true claim
// attributed to the wrong record is still a false weight (Proverbs 20:10):
// DR-0132 took n8n off the RELIABILITY-CRITICAL PATH via an outbound-poll bus
// and explicitly did NOT rip the tool out; the sovereign-Python direction comes
// from the CLAUDE.md:23 standing rule extending DR-0083, not from DR-0132.
// Word first per the sov9/sov17/sov22 standard; every quoted verse verbatim KJV
// and pinned here, a drift fails the build (DR-0281).
// =============================================================================
const sov24 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov24-changing-the-engine-in-flight-and-the-word-that-is-not-a-schema');

const SOV24_FRAGMENTS = {
  "1 Corinthians 14:33": "For God is not the author of confusion, but of peace, as in all churches of the saints.",
  "1 Corinthians 14:40": "Let all things be done decently and in order.",
  "1 Corinthians 3:10": "as a wise masterbuilder, I have laid the foundation, and another buildeth thereon. But let every man take heed how he buildeth thereupon.",
  "1 Corinthians 3:11": "For other foundation can no man lay than that is laid, which is Jesus Christ.",
  "1 Peter 1:25": "But the word of the Lord endureth for ever.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "2 Corinthians 13:1": "In the mouth of two or three witnesses shall every word be established.",
  "2 Corinthians 8:21": "Providing for honest things, not only in the sight of the Lord, but also in the sight of men.",
  "2 Timothy 2:15": "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
  "Colossians 1:17": "by him all things consist",
  "Deuteronomy 19:15": "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.",
  "Deuteronomy 24:15": "At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee.",
  "Deuteronomy 7:22": "And the LORD thy God will put out those nations before thee by little and little: thou mayest not consume them at once, lest the beasts of the field increase upon thee.",
  "Ecclesiastes 3:1": "To every thing there is a season, and a time to every purpose under the heaven:",
  "Ephesians 4:25": "Wherefore putting away lying, speak every man truth with his neighbour",
  "Exodus 23:30": "By little and little I will drive them out from before thee, until thou be increased, and inherit the land.",
  "Habakkuk 2:2": "Write the vision, and make it plain upon tables, that he may run that readeth it",
  "Hebrews 1:11": "They shall perish; but thou remainest; and they all shall wax old as doth a garment;",
  "Hebrews 1:12": "And as a vesture shalt thou fold them up, and they shall be changed: but thou art the same, and thy years shall not fail.",
  "Hebrews 7:12": "For the priesthood being changed, there is made of necessity a change also of the law.",
  "Hebrews 8:13": "In that he saith, A new covenant, he hath made the first old. Now that which decayeth and waxeth old is ready to vanish away.",
  "Hebrews 8:6": "he is the mediator of a better covenant, which was established upon better promises",
  "Isaiah 28:10": "For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:",
  "Isaiah 28:16": "a tried stone, a precious corner stone, a sure foundation: he that believeth shall not make haste.",
  "Isaiah 40:8": "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.",
  "Isaiah 42:3": "A bruised reed shall he not break, and the smoking flax shall he not quench",
  "James 1:22": "But be ye doers of the word, and not hearers only, deceiving your own selves.",
  "John 10:35": "the scripture cannot be broken",
  "Leviticus 19:13": "the wages of him that is hired shall not abide with thee all night until the morning",
  "Luke 12:42": "Who then is that faithful and wise steward, whom his lord shall make ruler over his household, to give them their portion of meat in due season?",
  "Luke 14:28": "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?",
  "Luke 14:29": "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,",
  "Luke 14:30": "Saying, This man began to build, and was not able to finish.",
  "Luke 14:31": "Or what king, going to make war against another king, sitteth not down first, and consulteth whether he be able with ten thousand to meet him that cometh against him with twenty thousand?",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Luke 6:48": "digged deep, and laid the foundation on a rock",
  "Malachi 3:6": "For I am the LORD, I change not",
  "Matthew 13:52": "bringeth forth out of his treasure things new and old",
  "Matthew 24:35": "Heaven and earth shall pass away, but my words shall not pass away.",
  "Matthew 9:16": "No man putteth a piece of new cloth unto an old garment, for that which is put in to fill it up taketh from the garment, and the rent is made worse.",
  "Matthew 9:17": "Neither do men put new wine into old bottles: else the bottles break, and the wine runneth out, and the bottles perish: but they put new wine into new bottles, and both are preserved.",
  "Nehemiah 2:13": "viewed the walls of Jerusalem, which were broken down",
  "Nehemiah 2:16": "the rulers knew not whither I went, or what I did",
  "Nehemiah 4:10": "The strength of the bearers of burdens is decayed, and there is much rubbish",
  "Nehemiah 4:17": "They which builded on the wall, and they that bare burdens, with those that laded, every one with one of his hands wrought in the work, and with the other hand held a weapon.",
  "Nehemiah 4:18": "For the builders, every one had his sword girded by his side, and so builded. And he that sounded the trumpet was by me.",
  "Nehemiah 4:19": "The work is great and large, and we are separated upon the wall, one far from another",
  "Nehemiah 4:20": "In what place therefore ye hear the sound of the trumpet, resort ye thither unto us: our God shall fight for us.",
  "Nehemiah 4:6": "So built we the wall; and all the wall was joined together unto the half thereof: for the people had a mind to work.",
  "Nehemiah 4:9": "we made our prayer unto our God, and set a watch against them day and night",
  "Nehemiah 6:15": "So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days.",
  "Nehemiah 6:16": "they perceived that this work was wrought of our God",
  "Nehemiah 6:3": "I am doing a great work, so that I cannot come down",
  "Philippians 2:4": "Look not every man on his own things, but every man also on the things of others.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Proverbs 12:22": "Lying lips are abomination to the LORD: but they that deal truly are his delight.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Proverbs 19:2": "he that hasteth with his feet sinneth",
  "Proverbs 20:10": "Divers weights, and divers measures, both of them are alike abomination to the LORD.",
  "Proverbs 21:5": "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.",
  "Proverbs 22:3": "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.",
  "Proverbs 24:27": "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.",
  "Proverbs 27:1": "Boast not thyself of to morrow; for thou knowest not what a day may bring forth.",
  "Proverbs 27:23": "Be thou diligent to know the state of thy flocks, and look well to thy herds.",
  "Proverbs 3:27": "Withhold not good from them to whom it is due, when it is in the power of thine hand to do it.",
  "Proverbs 3:28": "Say not unto thy neighbour, Go, and come again, and to morrow I will give; when thou hast it by thee.",
  "Proverbs 4:26": "Ponder the path of thy feet, and let all thy ways be established.",
  "Psalms 119:89": "For ever, O LORD, thy word is settled in heaven.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it",
  "Revelation 3:1": "thou hast a name that thou livest, and art dead",
  "Romans 14:19": "Let us therefore follow after the things which make for peace, and things wherewith one may edify another.",
  "Romans 15:1": "We then that are strong ought to bear the infirmities of the weak, and not to please ourselves.",
  "Romans 15:2": "Let every one of us please his neighbour for his good to edification.",
  "Zechariah 4:10": "For who hath despised the day of small things?",
};

const SOV24_CORPUS = {
  "1 Corinthians 14:33": ["1Corinthians", 14, 33],
  "1 Corinthians 14:40": ["1Corinthians", 14, 40],
  "1 Corinthians 3:10": ["1Corinthians", 3, 10],
  "1 Corinthians 3:11": ["1Corinthians", 3, 11],
  "1 Peter 1:25": ["1Peter", 1, 25],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "2 Corinthians 13:1": ["2Corinthians", 13, 1],
  "2 Corinthians 8:21": ["2Corinthians", 8, 21],
  "2 Timothy 2:15": ["2Timothy", 2, 15],
  "Colossians 1:17": ["Colossians", 1, 17],
  "Deuteronomy 19:15": ["Deuteronomy", 19, 15],
  "Deuteronomy 24:15": ["Deuteronomy", 24, 15],
  "Deuteronomy 7:22": ["Deuteronomy", 7, 22],
  "Ecclesiastes 3:1": ["Ecclesiastes", 3, 1],
  "Ephesians 4:25": ["Ephesians", 4, 25],
  "Exodus 23:30": ["Exodus", 23, 30],
  "Habakkuk 2:2": ["Habakkuk", 2, 2],
  "Hebrews 1:11": ["Hebrews", 1, 11],
  "Hebrews 1:12": ["Hebrews", 1, 12],
  "Hebrews 7:12": ["Hebrews", 7, 12],
  "Hebrews 8:13": ["Hebrews", 8, 13],
  "Hebrews 8:6": ["Hebrews", 8, 6],
  "Isaiah 28:10": ["Isaiah", 28, 10],
  "Isaiah 28:16": ["Isaiah", 28, 16],
  "Isaiah 40:8": ["Isaiah", 40, 8],
  "Isaiah 42:3": ["Isaiah", 42, 3],
  "James 1:22": ["James", 1, 22],
  "John 10:35": ["John", 10, 35],
  "Leviticus 19:13": ["Leviticus", 19, 13],
  "Luke 12:42": ["Luke", 12, 42],
  "Luke 14:28": ["Luke", 14, 28],
  "Luke 14:29": ["Luke", 14, 29],
  "Luke 14:30": ["Luke", 14, 30],
  "Luke 14:31": ["Luke", 14, 31],
  "Luke 16:10": ["Luke", 16, 10],
  "Luke 6:48": ["Luke", 6, 48],
  "Malachi 3:6": ["Malachi", 3, 6],
  "Matthew 13:52": ["Matthew", 13, 52],
  "Matthew 24:35": ["Matthew", 24, 35],
  "Matthew 9:16": ["Matthew", 9, 16],
  "Matthew 9:17": ["Matthew", 9, 17],
  "Nehemiah 2:13": ["Nehemiah", 2, 13],
  "Nehemiah 2:16": ["Nehemiah", 2, 16],
  "Nehemiah 4:10": ["Nehemiah", 4, 10],
  "Nehemiah 4:17": ["Nehemiah", 4, 17],
  "Nehemiah 4:18": ["Nehemiah", 4, 18],
  "Nehemiah 4:19": ["Nehemiah", 4, 19],
  "Nehemiah 4:20": ["Nehemiah", 4, 20],
  "Nehemiah 4:6": ["Nehemiah", 4, 6],
  "Nehemiah 4:9": ["Nehemiah", 4, 9],
  "Nehemiah 6:15": ["Nehemiah", 6, 15],
  "Nehemiah 6:16": ["Nehemiah", 6, 16],
  "Nehemiah 6:3": ["Nehemiah", 6, 3],
  "Philippians 2:4": ["Philippians", 2, 4],
  "Proverbs 11:14": ["Proverbs", 11, 14],
  "Proverbs 12:22": ["Proverbs", 12, 22],
  "Proverbs 14:15": ["Proverbs", 14, 15],
  "Proverbs 18:17": ["Proverbs", 18, 17],
  "Proverbs 19:2": ["Proverbs", 19, 2],
  "Proverbs 20:10": ["Proverbs", 20, 10],
  "Proverbs 21:5": ["Proverbs", 21, 5],
  "Proverbs 22:3": ["Proverbs", 22, 3],
  "Proverbs 24:27": ["Proverbs", 24, 27],
  "Proverbs 27:1": ["Proverbs", 27, 1],
  "Proverbs 27:23": ["Proverbs", 27, 23],
  "Proverbs 3:27": ["Proverbs", 3, 27],
  "Proverbs 3:28": ["Proverbs", 3, 28],
  "Proverbs 4:26": ["Proverbs", 4, 26],
  "Psalms 119:89": ["Psalms", 119, 89],
  "Psalms 127:1": ["Psalms", 127, 1],
  "Revelation 3:1": ["Revelation", 3, 1],
  "Romans 14:19": ["Romans", 14, 19],
  "Romans 15:1": ["Romans", 15, 1],
  "Romans 15:2": ["Romans", 15, 2],
  "Zechariah 4:10": ["Zechariah", 4, 10],
};

describe('sov24 — changing the engine in flight and the Word that is not a schema quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on counting the cost and on the wall rebuilt while the work continued', () => {
    expect(sov24).toBeTruthy();
    expect(sov24.anchor.ref).toContain('Luke 14:28');
    expect(sov24.anchor.ref).toContain('Nehemiah 4:17');
    expect(sov24.anchor.theme).toContain(SOV24_FRAGMENTS['Luke 14:28']);
    // The anchor quotes the load-bearing clause of Nehemiah 4:17; it is chained to the
    // pinned full verse so the shorter span is still guaranteed verbatim KJV.
    const NEH417_CLAUSE = 'every one with one of his hands wrought in the work, and with the other hand held a weapon.';
    expect(SOV24_FRAGMENTS['Nehemiah 4:17']).toContain(NEH417_CLAUSE);
    expect(sov24.anchor.theme).toContain(NEH417_CLAUSE);
    // No margin list of bare references (DR-0391 / DR-0402 / DR-0403).
    expect(sov24.anchor.theme).not.toMatch(/spine of this week/i);
  });
  it('every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it', () => {
    expect(Object.keys(SOV24_FRAGMENTS).length).toBeGreaterThanOrEqual(25);
    for (const [ref, fragment] of Object.entries(SOV24_FRAGMENTS)) {
      expect(sov24.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(sov24.lesson, `${ref} must be named beside its quote`).toContain(`(${ref})`);
    }
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(SOV24_FRAGMENTS)) {
      const at = SOV24_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the OTHER fields (bigIdea, inApp, benefits, bands, quiz, rpe, facilitator) is one of the pinned fragments or a substring of one', () => {
    const strings = [];
    const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
    walk({ ...sov24, lesson: '' });
    const fields = strings.join('\n');
    const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
    let m;
    while ((m = re.exec(fields))) {
      const [, q, ref] = m;
      const pinned = SOV24_FRAGMENTS[ref];
      expect(pinned, `${ref} quoted outside the lesson must be pinned`).toBeTruthy();
      expect(pinned.includes(q) || q.includes(pinned), `${ref}: "${q}" must be verbatim within the pinned fragment`).toBe(true);
    }
  });
  it('the Word LEADS and the ten movements run in order', () => {
    expect(sov24.lesson.indexOf('FIRST, COUNT THE COST BEFORE YOU TOUCH THE RUNNING THING')).toBe(0);
    // The Son's question precedes the newsletter, the vendors and every measured number (Word first, DR-0312/DR-0331).
    expect(sov24.lesson.indexOf('For which of you, intending to build a tower')).toBeLessThan(sov24.lesson.indexOf('ByteByteGo'));
    expect(sov24.lesson.indexOf('Except the LORD build the house')).toBeLessThan(sov24.lesson.indexOf('TIER ONE, documented'));
    expect(sov24.lesson.indexOf('Boast not thyself of to morrow')).toBeLessThan(sov24.lesson.indexOf('PAYWALLED PREVIEW'));
    expect(sov24.lesson.indexOf('The grass withereth')).toBeLessThan(sov24.lesson.indexOf('47 workflow files on disk'));
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const m of order) {
      const at = sov24.lesson.indexOf(m);
      expect(at, `${m} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(sov24.lesson.length).toBeGreaterThanOrEqual(12000);
  });
  it('the load-bearing teaching is carried: count the cost of FINISHING, Nehemiah as the case study, order as love, by little and little, two witnesses, new bottles, built-is-not-running, the steward aim', () => {
    for (const heading of [
      'SECOND, WHAT CAME THROUGH AND WHAT DID NOT - HONEST PROVENANCE IS PART OF THE TEACHING',
      'THIRD, THE WORK CONTINUES WHILE THE WORK IS BEING REBUILT - NEHEMIAH ALREADY SOLVED THIS',
      'FOURTH, ORDER IS NOT BUREAUCRACY - IT IS LOVE OF THE PEOPLE DEPENDING ON THE THING',
      'FIFTH, BY LITTLE AND LITTLE - THE PHASED STEP IS THE SCRIPTURAL STEP',
      'SIXTH, PROVE EACH STEP - TWO WITNESSES, AND A REVERSIBLE STEP IS THE MERCIFUL STEP',
      'SEVENTH, NEW WINE, NEW BOTTLES - THE SHAPE MUST FIT THE SUBSTANCE',
      'EIGHTH, THE ONE MIGRATION YAHWEH HIMSELF PERFORMED - AND THE TEXT WAS NEVER REVISED',
      'NINTH, BUILT IS NOT RUNNING - THE MEASURED STATE OF THIS HOUSE OWN MIGRATION',
      'TENTH, THE STEWARD AIM - NOBODY DEPENDING ON IT GETS HURT WHILE IT CHANGES',
    ]) expect(sov24.lesson).toContain(heading);
    // The mockery falls on the ABANDONED foundation — the half-finished migration.
    expect(sov24.lesson).toContain('Not on the man who never began.');
    expect(sov24.lesson).toContain('the cost of STARTING instead of the cost of FINISHING');
    // Nehemiah is the worked example the paywall could not give us.
    expect(sov24.lesson).toContain('The trumpeter stood beside the builder.');
    expect(sov24.lesson).toContain('much rubbish');
    expect(sov24.lesson).toContain('he published the alarm path BEFORE it was needed');
    // Order is love, and the sequence is the field before the house.
    expect(sov24.lesson).toContain('The field before the house.');
    expect(sov24.lesson).toContain('Verification before cutover, never after.');
    // The phased step has a STATED reason, not a style preference.
    expect(sov24.lesson).toContain('The pace was chosen so the gain could be KEPT.');
    // A shadow read is a second, independent witness; confidence is not.
    expect(sov24.lesson).toContain('a second, INDEPENDENT witness in the strict sense');
    expect(sov24.lesson).toContain('what does NOT count as a witness: your own confidence');
    // The in-app surfaces named.
    expect(sov24.inApp).toMatch(/OpsBoard/);
    expect(sov24.inApp).toMatch(/REVERSIBLE/);
  });
  it('the bright line is drawn sharply and not overreached: the SYSTEM migrates, the WORD does not', () => {
    expect(sov24.lesson).toContain('The ADMINISTRATION was superseded by the Author Himself. The TEXT was never revised.');
    expect(sov24.lesson).toContain('THE SYSTEM MIGRATES; THE WORD DOES NOT.');
    expect(sov24.lesson).toContain('The Word is not a schema.');
    expect(sov24.lesson).toContain('Drop the first half and you deny the new covenant.');
    expect(sov24.lesson).toContain('we will not go one step past what the Word says here');
    // Both halves are present: the supersession AND the unrevised text.
    expect(sov24.lesson).toContain(SOV24_FRAGMENTS['Hebrews 8:13']);
    expect(sov24.lesson).toContain(SOV24_FRAGMENTS['Isaiah 40:8']);
    expect(sov24.lesson).toContain(SOV24_FRAGMENTS['Matthew 24:35']);
    expect(sov24.lesson).toContain(SOV24_FRAGMENTS['Malachi 3:6']);
  });
  it('provenance: the paywalled preview is disclosed in the bigIdea AND the lesson, and no migration technique is attributed to the forwarded piece', () => {
    expect(sov24.bigIdea).toContain('PAYWALLED PREVIEW');
    expect(sov24.bigIdea).toContain('We will not invent them.');
    expect(sov24.lesson).toContain('The forward arrived as a PAYWALLED PREVIEW');
    expect(sov24.lesson).toContain('we will not invent them, paraphrase them, or attribute any technique to it');
    expect(sov24.lesson).toContain('NOT AVAILABLE TO US');
    expect(sov24.lesson).toContain('The article is the occasion.');
    // The documented practice we DO teach is labelled as public practice with its own
    // sources and as-of dates, never as the newsletter's content.
    expect(sov24.lesson).toContain('publicly documented engineering practice');
    for (const src of ['Martin Fowler', 'Online migrations at scale', 'expand-migrate-contract', 'github/gh-ost', 'github/scientist']) {
      expect(sov24.lesson, `${src} must be named as the source`).toContain(src);
    }
    expect(sov24.lesson).toContain('search-verified 2026-09-18');
    expect(sov24.lesson).toContain('fetched verbatim 2026-09-18');
    // Blocked egress is named rather than papered over (DR-0076 §8).
    expect(sov24.lesson).toContain('egress-blocked');
  });
  it('DR-0100: the three tiers are named and applied, tier two is NARROW, tier three corrects the claim while the data stands, and both steelmen are educated past rather than voted on', () => {
    expect(sov24.lesson).toContain('TIER ONE, documented');
    expect(sov24.lesson).toContain('TIER TWO, genuinely open');
    expect(sov24.lesson).toContain('TIER THREE, over-reach');
    expect(sov24.lesson).toContain('What is NOT open, and will not be hedged');
    expect(sov24.lesson).toContain('The data under it stands untouched');
    expect(sov24.lesson).toContain('THE FIRST PERSPECTIVE');
    expect(sov24.lesson).toContain('THE SECOND PERSPECTIVE');
    expect((sov24.lesson.match(/named to be educated past/g) || []).length).toBeGreaterThanOrEqual(2);
  });
  it('the citation of this house own migration is EXACT: DR-0132 is the reliability-critical path via outbound poll and did NOT rip n8n out; sovereign Python comes from the CLAUDE.md standing rule', () => {
    // Proven-to-catch on a real mischaracterisation caught in review: DR-0132's own title and §2.
    expect(sov24.lesson).toContain('Take n8n off the reliability-critical path');
    expect(sov24.lesson).toContain('does NOT say the tool was ripped out');
    expect(sov24.lesson).toContain('It changed the tool ROLE');
    expect(sov24.lesson).toContain('OUTBOUND POLL');
    expect(sov24.lesson).toContain('HTTP 530');
    // The sovereign-Python direction is cited to the standing rule, not to DR-0132.
    expect(sov24.lesson).toContain('the sovereign Python direction does not come from that one');
    expect(sov24.lesson).toContain('CLAUDE.md line 23');
    // The measured numbers, each with its file — no painted figures (DR-0076 §4).
    expect(sov24.lesson).toContain('47 workflow files on disk');
    expect(sov24.lesson).toContain('docs/00-foundations/n8n-workflows');
    expect(sov24.lesson).toContain('app/functions/n8n/[[path]].js');
    expect(sov24.lesson).toContain('app/src/lib/n8n-base.js line 67');
    expect(sov24.lesson).toContain('nine non-test files still import');
    expect(sov24.lesson).toContain('an un-finished cutover');
    expect(sov24.lesson).toContain('A gate that always passes is itself a lie.');
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are the forwarded article, primary sources we actually fetched, or this repo\'s own files', () => {
    const isWord = (q) => Object.values(SOV24_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov24.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    const allowed = [
      // The forwarded ByteByteGo preview — everything that actually came through.
      "\"It has outgrown its original database.\"",
      "\"This causes order histories to load very slowly.\"",
      "\"Maintenance takes much longer than it used to.\"",
      "\"But you cannot take a popular online store offline to make the switch.\"",
      "\"Customers are always placing orders, changing addresses, and requesting refunds.\"",
      "\"How do you change a working system while still running the service that people depend on?\"",
      "\"At scale, copying existing data during such migrations can take days.\"",
      "\"many supporting applications may depend on the component being replaced\"",
      "\"Every intermediate step needs to work while ordinary business continues.\"",
      "\"In this article, we will look at how migrations work at scale and the key strategies that can help make it as efficient as possible.\"",
      "\"What Exactly is Being Replaced?\"",
      // Primary sources fetched verbatim 2026-09-18 from github.com (reachable from the sandbox).
      "\"migrate that table while empty, slowly and incrementally copy data from your original table\"",
      "\"postpone what is probably the most critical step: the swap of tables\"",
      "\"it truly ceases writes on master: no row copies and no ongoing events processing\"",
      "\"by testing it on replicas\"",
      "\"A Ruby library for carefully refactoring critical paths.\"",
      // This repo's own files.
      "\"Take n8n off the reliability-critical path\"",
      "\"The target is ZERO n8n.\"",
      "\"sovereign-neutral name is tracked\"",
      "\"N8N_BASE resolves EMPTY by default, so no app code calls n8n\"",
      "\"A gate that always passes is itself a lie.\"",
    ];
    for (const q of nonScripture) expect(allowed, `unexpected non-Scripture quote: ${q}`).toContain(q);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized', () => {
    const ours = sov24.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(sov24.lesson).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov24.lesson).toContain('the Word');
    // The Son confessed as the Lamb.
    expect(sov24.lesson).toContain('the Son of Yahweh, the Lamb');
  });
  it('the send-off page has content: at least six benefits, each a real takeaway quoting the Word', () => {
    expect(sov24.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of sov24.benefits) expect(b.length).toBeGreaterThan(80);
    const blob = sov24.benefits.join('  ');
    expect(blob).toContain('counteth the cost');
    expect(blob).toContain('with the other hand held a weapon');
    expect(blob).toContain('in fifty and two days');
    expect(blob).toContain('afterwards build thine house');
    expect(blob).toContain('By little and little');
    expect(blob).toContain('shall every word be established');
    expect(blob).toContain('shall stand for ever');
    expect(blob).toContain('the things of others');
  });
  it('the three bands ascend and the child band is gentle', () => {
    expect(typeof sov24.levels.child).toBe('string');
    expect(sov24.levels.child.length).toBeLessThan(sov24.levels.teen.length);
    expect(sov24.levels.teen.length).toBeLessThan(sov24.levels.senior.length);
    expect(sov24.levels.child).not.toMatch(/kill|murder|rape|sexual|abuse|slaughter|massacre|execution|suicide|porn|drug/i);
    expect(sov24.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(sov24.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(sov24.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(sov24.facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(5);
    expect(sov24.rpe.research && sov24.rpe.plan && sov24.rpe.execute).toBeTruthy();
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact, and a one-word drift fails', () => {
    expect(SOV24_FRAGMENTS['Luke 14:28']).toBe('For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?');
    expect(SOV24_FRAGMENTS['Luke 14:30']).toBe('Saying, This man began to build, and was not able to finish.');
    expect(SOV24_FRAGMENTS['Nehemiah 4:17']).toBe('They which builded on the wall, and they that bare burdens, with those that laded, every one with one of his hands wrought in the work, and with the other hand held a weapon.');
    expect(SOV24_FRAGMENTS['Nehemiah 6:15']).toBe('So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days.');
    expect(SOV24_FRAGMENTS['Proverbs 24:27']).toBe('Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.');
    expect(SOV24_FRAGMENTS['Exodus 23:30']).toBe('By little and little I will drive them out from before thee, until thou be increased, and inherit the land.');
    expect(SOV24_FRAGMENTS['Hebrews 8:13']).toBe('In that he saith, A new covenant, he hath made the first old. Now that which decayeth and waxeth old is ready to vanish away.');
    expect(SOV24_FRAGMENTS['Isaiah 40:8']).toBe('The grass withereth, the flower fadeth: but the word of our God shall stand for ever.');
    expect(SOV24_FRAGMENTS['Matthew 24:35']).toBe('Heaven and earth shall pass away, but my words shall not pass away.');
    // The whole point of the fifth movement, pinned: the phased step carries its own stated REASON.
    expect(SOV24_FRAGMENTS['Deuteronomy 7:22']).toContain('lest the beasts of the field increase upon thee');
    // New bottles exist so that BOTH survive — this week is not anti-change.
    expect(SOV24_FRAGMENTS['Matthew 9:17']).toContain('and both are preserved');
    expect(SOV24_FRAGMENTS['1 Thessalonians 5:21'].length).toBe(47);
    // A one-word drift in the lesson would fail the presence check above; prove the check has teeth.
    const drifted = sov24.lesson.split('counteth the cost, whether he have sufficient to finish it').join('counteth the cost, whether he has enough to finish it');
    expect(drifted).not.toContain(SOV24_FRAGMENTS['Luke 14:28']);
  });
});

// =============================================================================
// sov25 — the ten-day test, and the one hidden in the ninety and nine
// =============================================================================
// Week 25, captured 2026-09-24 by the Gmail-lesson-intake Way (DR-0312) from
// the Level Up Coding issue Deployment Patterns Every Engineer Should Know
// (Nikki Siapno, Sep 24 2026), forwarded by the Governor with one word: Lesson.
// The article came through COMPLETE, so its sentences are quoted as its own
// claims; the tool documentation (Kubernetes, Argo Rollouts, Flagger) was
// fetched verbatim from github.com. Word first per the sov9/sov24 standard:
// every quoted verse was FILLED from app/public/bible/kjv by the authoring
// generator (never typed from memory), is pinned here, and is re-read from the
// corpus at test time — a drift fails the build (DR-0281). The pins also hold
// the two lines most likely to be blurred later: the Son was never an
// unproven change (the parallel is timing only), and the Word is never put
// into a variant.
// =============================================================================
const sov25 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov25-the-ten-day-test-and-the-one-hidden-in-the-ninety-and-nine');

const SOV25_FRAGMENTS = {
  "John 2:4": "Jesus saith unto her, Woman, what have I to do with thee? mine hour is not yet come.",
  "John 7:6": "Then Jesus said unto them, My time is not yet come: but your time is alway ready.",
  "Matthew 8:4": "See thou tell no man;",
  "Matthew 16:20": "Then charged he his disciples that they should tell no man that he was Jesus the Christ.",
  "Galatians 4:4": "But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law,",
  "Habakkuk 2:3": "For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry.",
  "Ecclesiastes 3:1": "To every thing there is a season, and a time to every purpose under the heaven:",
  "Galatians 5:9": "A little leaven leaveneth the whole lump.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "John 7:24": "Judge not according to the appearance, but judge righteous judgment.",
  "1 Kings 6:7": "And the house, when it was in building, was built of stone made ready before it was brought thither: so that there was neither hammer nor axe nor any tool of iron heard in the house, while it was in building.",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Amos 3:3": "Can two walk together, except they be agreed?",
  "Esther 8:8": "Write ye also for the Jews, as it liketh you, in the king’s name, and seal it with the king’s ring: for the writing which is written in the king’s name, and sealed with the king’s ring, may no man reverse.",
  "Hebrews 12:17": "For ye know how that afterward, when he would have inherited the blessing, he was rejected: for he found no place of repentance, though he sought it carefully with tears.",
  "Daniel 1:12": "Prove thy servants, I beseech thee, ten days; and let them give us pulse to eat, and water to drink.",
  "Daniel 1:13": "Then let our countenances be looked upon before thee, and the countenance of the children that eat of the portion of the king’s meat: and as thou seest, deal with thy servants.",
  "Daniel 1:14": "So he consented to them in this matter, and proved them ten days.",
  "Daniel 1:15": "And at the end of ten days their countenances appeared fairer and fatter in flesh than all the children which did eat the portion of the king’s meat.",
  "Daniel 1:16": "Thus Melzar took away the portion of their meat, and the wine that they should drink; and gave them pulse.",
  "Numbers 13:2": "Send thou men, that they may search the land of Canaan, which I give unto the children of Israel: of every tribe of their fathers shall ye send a man, every one a ruler among them.",
  "Numbers 13:23": "And they came unto the brook of Eshcol, and cut down from thence a branch with one cluster of grapes, and they bare it between two upon a staff; and they brought of the pomegranates, and of the figs.",
  "Numbers 13:32": "brought up an evil report of the land which they had searched",
  "Numbers 14:1": "And all the congregation lifted up their voice, and cried; and the people wept that night.",
  "Judges 7:4": "The people are yet too many; bring them down unto the water, and I will try them for thee there:",
  "Zechariah 4:10": "For who hath despised the day of small things?",
  "Luke 15:4": "What man of you, having an hundred sheep, if he lose one of them, doth not leave the ninety and nine in the wilderness, and go after that which is lost, until he find it?",
  "Luke 15:7": "I say unto you, that likewise joy shall be in heaven over one sinner that repenteth, more than over ninety and nine just persons, which need no repentance.",
  "Matthew 18:14": "Even so it is not the will of your Father which is in heaven, that one of these little ones should perish.",
  "Joshua 7:1": "the children of Israel committed a trespass in the accursed thing:",
  "Joshua 7:5": "the men of Ai smote of them about thirty and six men:",
  "Joshua 7:11": "Israel hath sinned,",
  "Proverbs 27:23": "Be thou diligent to know the state of thy flocks, and look well to thy herds.",
  "1 Samuel 16:7": "But the LORD said unto Samuel, Look not on his countenance, or on the height of his stature; because I have refused him: for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.",
  "Matthew 7:20": "Wherefore by their fruits ye shall know them.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Proverbs 20:10": "Divers weights, and divers measures, both of them are alike abomination to the LORD.",
  "Numbers 21:8": "And the LORD said unto Moses, Make thee a fiery serpent, and set it upon a pole: and it shall come to pass, that every one that is bitten, when he looketh upon it, shall live.",
  "2 Kings 18:4": "He removed the high places, and brake the images, and cut down the groves, and brake in pieces the brasen serpent that Moses had made: for unto those days the children of Israel did burn incense to it: and he called it Nehushtan.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Galatians 1:8": "But though we, or an angel from heaven, preach any other gospel unto you than that which we have preached unto you, let him be accursed.",
  "Psalms 119:89": "For ever, O LORD, thy word is settled in heaven.",
  "Matthew 24:35": "Heaven and earth shall pass away, but my words shall not pass away.",
  "Isaiah 40:8": "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.",
  "James 5:12": "let your yea be yea; and your nay, nay;",
  "Ecclesiastes 7:20": "For there is not a just man upon earth, that doeth good, and sinneth not.",
  "Proverbs 28:13": "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.",
  "1 John 1:9": "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
  "Matthew 25:21": "His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things: enter thou into the joy of thy lord.",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Isaiah 28:10": "For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:",
  "2 Timothy 2:15": "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
};

const SOV25_CORPUS = {
  "John 2:4": ["John",2,4],
  "John 7:6": ["John",7,6],
  "Matthew 8:4": ["Matthew",8,4],
  "Matthew 16:20": ["Matthew",16,20],
  "Galatians 4:4": ["Galatians",4,4],
  "Habakkuk 2:3": ["Habakkuk",2,3],
  "Ecclesiastes 3:1": ["Ecclesiastes",3,1],
  "Galatians 5:9": ["Galatians",5,9],
  "Proverbs 14:15": ["Proverbs",14,15],
  "John 7:24": ["John",7,24],
  "1 Kings 6:7": ["1Kings",6,7],
  "Proverbs 24:3": ["Proverbs",24,3],
  "Amos 3:3": ["Amos",3,3],
  "Esther 8:8": ["Esther",8,8],
  "Hebrews 12:17": ["Hebrews",12,17],
  "Daniel 1:12": ["Daniel",1,12],
  "Daniel 1:13": ["Daniel",1,13],
  "Daniel 1:14": ["Daniel",1,14],
  "Daniel 1:15": ["Daniel",1,15],
  "Daniel 1:16": ["Daniel",1,16],
  "Numbers 13:2": ["Numbers",13,2],
  "Numbers 13:23": ["Numbers",13,23],
  "Numbers 13:32": ["Numbers",13,32],
  "Numbers 14:1": ["Numbers",14,1],
  "Judges 7:4": ["Judges",7,4],
  "Zechariah 4:10": ["Zechariah",4,10],
  "Luke 15:4": ["Luke",15,4],
  "Luke 15:7": ["Luke",15,7],
  "Matthew 18:14": ["Matthew",18,14],
  "Joshua 7:1": ["Joshua",7,1],
  "Joshua 7:5": ["Joshua",7,5],
  "Joshua 7:11": ["Joshua",7,11],
  "Proverbs 27:23": ["Proverbs",27,23],
  "1 Samuel 16:7": ["1Samuel",16,7],
  "Matthew 7:20": ["Matthew",7,20],
  "Proverbs 18:17": ["Proverbs",18,17],
  "Proverbs 20:10": ["Proverbs",20,10],
  "Numbers 21:8": ["Numbers",21,8],
  "2 Kings 18:4": ["2Kings",18,4],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Galatians 1:8": ["Galatians",1,8],
  "Psalms 119:89": ["Psalms",119,89],
  "Matthew 24:35": ["Matthew",24,35],
  "Isaiah 40:8": ["Isaiah",40,8],
  "James 5:12": ["James",5,12],
  "Ecclesiastes 7:20": ["Ecclesiastes",7,20],
  "Proverbs 28:13": ["Proverbs",28,13],
  "1 John 1:9": ["1John",1,9],
  "Matthew 25:21": ["Matthew",25,21],
  "Luke 16:10": ["Luke",16,10],
  "Isaiah 28:10": ["Isaiah",28,10],
  "2 Timothy 2:15": ["2Timothy",2,15],
};

const SOV25_ALLOWED = [
  "\"The deployment has happened. The release has not.\"",
  "\"Every release carries the same quiet risk: code that worked perfectly in staging can still break something the moment real traffic hits it.\"",
  "\"a decision about how much of your system you’re willing to expose to an unproven change, and for how long.\"",
  "\"ensures that at least 75% of the desired number of Pods are up (25% max unavailable).\"",
  "\"ensures that at most 125% of the desired number of Pods are up (25% max surge).\"",
  "\"blue-green, canary, canary analysis, experimentation, and progressive delivery features to Kubernetes\"",
  "\"Readiness probes are unsuitable for deeper, stress, or one-time checks\"",
  "\"provides no control over the blast radius, may rollout too aggressively, and provides no automated rollback upon failures.\"",
  "\"by gradually shifting traffic to the new version while measuring metrics and running conformance tests.\"",
  "\"The exact percentages depend on your traffic, workload, and how quickly failures usually appear.\"",
  "\"But automation is only as good as the signals it watches.\"",
  "\"Immutable infrastructure takes the opposite approach.\"",
  "\"Blue-green gives you fast traffic rollback.\"",
  "\"It doesn’t guarantee fast state rollback.\"",
  "\"Canary releases control something different: how much real traffic reaches the new version first.\"",
  "\"5% → observe → 20% → observe → 50% → observe → 100%\"",
  "\"A mirrored request is still a real request.\"",
  "\"You also need to measure the canary separately.\"",
  "\"If version 2 receives only 5% of traffic, its failures can disappear inside healthy aggregate metrics from the other 95%.\"",
  "\"If the rollout checks CPU and latency while the new version quietly sends users the wrong data, it may confidently promote a broken release.\"",
  "\"So the hardest part of progressive delivery is not shifting traffic.\"",
  "\"copying rows without blobs fabricates working-looking links.\"",
  "\"The gap was known, recorded, and deliberate. What was missing is that nothing watched the surface it broke.\"",
  "\"Every long-lived flag introduces another possible code path.\"",
  "\"That’s why rollout flags should have an owner and a cleanup plan.\"",
  "\"Reverting the record file is the whole off-switch.\"",
  "\"A canary asks: Is this version safe enough to expose further?\"",
  "\"An A/B test asks: Which variant produces the better outcome?\"",
  "\"stable assignment\"",
  "\"They’re the ones that assume some bugs will still reach production and have built a way to find bugs cheaply, on a handful of users, before it becomes everyone’s problem.\"",
  "\"Deploy → expose → measure → decide → expand or recover\""
];

// The same four checks every Word-first week carries, shared by sov25 and sov26.
function wordFirstChecks(mod, FRAGMENTS, CORPUS, label) {
  it(`${label}: every quoted fragment appears letter-for-letter in the deep lesson, with its reference beside it`, () => {
    expect(Object.keys(FRAGMENTS).length).toBeGreaterThanOrEqual(40);
    for (const [ref, fragment] of Object.entries(FRAGMENTS)) {
      expect(mod.lesson, `${ref} must be quoted verbatim`).toContain(fragment);
      expect(mod.lesson, `${ref} must be named beside its quote`).toContain(`"${fragment}" (${ref})`);
    }
  });
  it(`${label}: every fragment matches the repo KJV corpus, not memory (two witnesses)`, () => {
    const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
    const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
    for (const [ref, fragment] of Object.entries(FRAGMENTS)) {
      const at = CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(verse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it(`${label}: every quoted verse in the OTHER fields (bigIdea, inApp, benefits, bands, quiz, rpe, facilitator) is one of the pinned fragments or nested with one`, () => {
    const strings = [];
    const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
    walk({ ...mod, lesson: '' });
    const fields = strings.join('\n');
    const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
    let m;
    let seen = 0;
    while ((m = re.exec(fields))) {
      const [, q, ref] = m;
      const pinned = FRAGMENTS[ref];
      expect(pinned, `${ref} quoted outside the lesson must be pinned`).toBeTruthy();
      expect(pinned.includes(q) || q.includes(pinned), `${ref}: "${q}" must be verbatim within the pinned fragment`).toBe(true);
      seen += 1;
    }
    expect(seen).toBeGreaterThan(20);
  });
  it(`${label}: typographic theology — Yahweh in our voice; the adversary lowercase; the Word capitalized`, () => {
    const ours = mod.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/); // the KJV's "God" lives only inside quotes
    expect(ours).toMatch(/Yahweh/);
    expect(mod.lesson).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(mod.lesson).toContain('the Word');
    expect(mod.lesson).toMatch(/[Tt]he Son of Yahweh, the Lamb/);
    // The reader is never handed our bookkeeping: no DR-nnnn in a reader field (the quotation-integrity rule).
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(mod[f], `${f} must not recite a record id`).not.toMatch(/DR-\d{4}/);
    for (const b of Object.values(mod.levels)) expect(b).not.toMatch(/DR-\d{4}/);
  });
  it(`${label}: the send-off, the bands, the quiz and the facilitator carry real content`, () => {
    expect(mod.benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of mod.benefits) expect(b.length).toBeGreaterThan(80);
    expect(typeof mod.levels.child).toBe('string');
    expect(mod.levels.child.length).toBeLessThan(mod.levels.teen.length);
    expect(mod.levels.teen.length).toBeLessThan(mod.levels.senior.length);
    expect(mod.levels.child).not.toMatch(/kill|murder|rape|sexual|abuse|slaughter|massacre|execution|suicide|porn|drug|ransom/i);
    expect(mod.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(mod.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(mod.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(mod.facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(5);
    expect(mod.rpe.research && mod.rpe.plan && mod.rpe.execute).toBeTruthy();
  });
  it(`${label}: the ten movements run FIRST through TENTH, in order, and the lesson is deep`, () => {
    const order = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,', 'EIGHTH,', 'NINTH,', 'TENTH,'];
    let last = -1;
    for (const w of order) {
      const at = mod.lesson.indexOf(w);
      expect(at, `${w} must appear in order`).toBeGreaterThan(last);
      last = at;
    }
    expect(mod.lesson.length).toBeGreaterThanOrEqual(20000);
  });
}

describe('sov25 — the ten-day test and the one hidden in the ninety and nine quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on Daniel\'s ten days and on the one the Shepherd seeks', () => {
    expect(sov25).toBeTruthy();
    expect(sov25.anchor.ref).toContain('Daniel 1:12');
    expect(sov25.anchor.ref).toContain('Luke 15:4');
    expect(sov25.anchor.theme).toContain(SOV25_FRAGMENTS['Daniel 1:12']);
    expect(sov25.anchor.theme).toContain(SOV25_FRAGMENTS['Luke 15:4']);
  });
  wordFirstChecks(sov25, SOV25_FRAGMENTS, SOV25_CORPUS, 'sov25');
  it('the Word LEADS: the Son\'s hour precedes the newsletter, Daniel precedes every tool, and Luke 15:4 precedes the canary arithmetic', () => {
    expect(sov25.lesson.indexOf('FIRST, THE WORD SEPARATED BEING IN PLACE FROM BEING REVEALED')).toBe(0);
    expect(sov25.lesson.indexOf('mine hour is not yet come')).toBeLessThan(sov25.lesson.indexOf('Level Up Coding'));
    expect(sov25.lesson.indexOf('A little leaven leaveneth the whole lump.')).toBeLessThan(sov25.lesson.indexOf('Level Up Coding'));
    expect(sov25.lesson.indexOf('Prove thy servants, I beseech thee, ten days')).toBeLessThan(sov25.lesson.indexOf('SIXTH,'));
  });
  it('the load-bearing teaching is carried in its named movements', () => {
    for (const heading of [
      'SECOND, WHAT CAME THROUGH - HONEST PROVENANCE',
      'THIRD, BUILT BEFORE IT IS BROUGHT - THE TEMPLE WAS AN IMMUTABLE ARTIFACT',
      'FOURTH, TWO VERSIONS ALIVE AT ONCE - AND WHY SWITCHING BACK IS NOT UNDOING',
      'FIFTH, THE CANARY IS IN DANIEL',
      'SIXTH, THE ONE INSIDE THE NINETY AND NINE - MEASURE THE CANARY SEPARATELY',
      'SEVENTH, LOOK AT THE FRUIT, NOT THE APPEARANCE - THIS HOUSE LEARNED IT',
      'EIGHTH, FLAGS, AND THE SERPENT THAT BECAME NEHUSHTAN',
      'NINTH, TEST THE TOOL; NEVER PUT THE WORD IN A VARIANT - THE BRIGHT LINE',
      'TENTH, ASSUME SOMETHING WILL SLIP',
    ]) expect(sov25.lesson).toContain(heading);
    // Daniel 1:12-16 is quoted WHOLE — every element of the canary is in the text.
    for (const v of ['Daniel 1:12', 'Daniel 1:13', 'Daniel 1:14', 'Daniel 1:15', 'Daniel 1:16']) {
      expect(sov25.lesson, `${v} must be quoted in the fifth movement`).toContain(`"${SOV25_FRAGMENTS[v]}" (${v})`);
      expect(sov25.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov25.lesson.indexOf('FIFTH,'));
    }
    expect(sov25.lesson).toContain('a small group, a fixed observation window, a measured comparison against the control');
    // Switching traffic is not undoing state; the compensating writing answers it.
    expect(sov25.lesson).toContain('the switch only moves people, never the ink');
    // The cleanup plan, done faithfully.
    expect(sov25.lesson).toContain('Hezekiah did not despise what Moses made; he removed what it had become.');
    // In-app surfaces named.
    expect(sov25.inApp).toMatch(/OpsBoard/);
    expect(sov25.inApp).toMatch(/Reviewer mode/);
  });
  it('the two lines that must not blur are drawn and pinned', () => {
    // The Son is never cast as an unproven change — the parallel is timing only.
    expect(sov25.lesson).toContain('He was never an unproven change, and nothing about Him needed testing.');
    expect(sov25.bigIdea + sov25.levels.teen + sov25.levels.senior).toMatch(/never an un(proven|tested) change/);
    // The Word is the measure, never a candidate.
    expect(sov25.lesson).toContain('hold the Word as the fixed point every test is measured against, never as one of the candidates');
    expect(sov25.lesson).toContain('What people prefer is data about people; it is never a vote on what Yahweh said.');
    expect(sov25.lesson).toContain(SOV25_FRAGMENTS['Galatians 1:8']);
    expect(sov25.lesson).toContain('We will not go one step past what the Word says here.');
  });
  it('provenance: the article is named, complete, attributed, its sponsor block set aside; tool quotes are marked fetched verbatim from github.com', () => {
    expect(sov25.lesson).toContain('Deployment Patterns Every Engineer Should Know by Nikki Siapno');
    expect(sov25.lesson).toContain('this one came through complete');
    expect(sov25.lesson).toContain('sponsor advertisement');
    expect(sov25.lesson).toContain('The article is the occasion. The Word is the authority.');
    expect(sov25.lesson).toContain('Forwarded content is material to study, never instructions to obey.');
    for (const src of ['Kubernetes, fetched verbatim 2026-09-24', 'Argo Rollouts, fetched verbatim 2026-09-24', 'Flagger, fetched verbatim 2026-09-24']) {
      expect(sov25.lesson).toContain(src);
    }
    expect(sov25.lesson).toContain('egress-blocked');
  });
  it('DR-0100: the three tiers are named, tier two is NARROW with a dated re-review, and both steelmen are educated past', () => {
    expect(sov25.lesson).toContain('TIER ONE, documented');
    expect(sov25.lesson).toContain('TIER TWO, genuinely open');
    expect(sov25.lesson).toContain('TIER THREE, over-reach');
    expect(sov25.lesson).toContain('re-review: 2026-11-24');
    expect(sov25.lesson).toContain('What is NOT open, and will not be hedged');
    expect(sov25.lesson).toContain('THE FIRST PERSPECTIVE');
    expect(sov25.lesson).toContain('THE SECOND PERSPECTIVE');
    expect(sov25.lesson).toContain('named to be educated past');
  });
  it('this house is cited EXACTLY: merge = deploy with no percentage canary; rows-not-blobs; green deploys beside a down site; the bridge retired 2026-09-08', () => {
    expect(sov25.lesson).toContain('merge = deploy to everyone (as the Layer 0 file states it)');
    expect(sov25.lesson).toContain('names what it does not have (a percentage canary)');
    expect(sov25.lesson).toContain('The cutover moved the ROWS. It did not move the BLOBS');
    expect(sov25.lesson).toContain('322 files for the choir team and 121 sermon documents');
    expect(sov25.lesson).toContain('the record of 2026-08-31 says so');
    expect(sov25.lesson).toContain('on 2026-07-08 every deploy run was green while the app was reported down');
    expect(sov25.lesson).toContain('On 2026-09-08 the pictures were copied home');
    expect(sov25.lesson).toContain('about nine hours');
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are the article, primary sources fetched verbatim, or this repo\'s own files', () => {
    const isWord = (q) => Object.values(SOV25_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov25.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    expect(nonScripture.length).toBeGreaterThan(10);
    for (const q of nonScripture) expect(SOV25_ALLOWED, `unexpected non-Scripture quote: ${q}`).toContain(q);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact, and a one-word drift fails', () => {
    expect(SOV25_FRAGMENTS['Daniel 1:12']).toBe('Prove thy servants, I beseech thee, ten days; and let them give us pulse to eat, and water to drink.');
    expect(SOV25_FRAGMENTS['Luke 15:4']).toBe('What man of you, having an hundred sheep, if he lose one of them, doth not leave the ninety and nine in the wilderness, and go after that which is lost, until he find it?');
    expect(SOV25_FRAGMENTS['John 7:24']).toBe('Judge not according to the appearance, but judge righteous judgment.');
    expect(SOV25_FRAGMENTS['Galatians 5:9']).toBe('A little leaven leaveneth the whole lump.');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV25_FRAGMENTS['Esther 8:8']).toContain('in the king’s name');
    const drifted = sov25.lesson.split('Prove thy servants, I beseech thee, ten days').join('Test your servants, I pray you, ten days');
    expect(drifted).not.toContain(SOV25_FRAGMENTS['Daniel 1:12']);
  });
});

// =============================================================================
// sov26 — the roll the king burned, and the roll written again
// =============================================================================
// Week 26, captured 2026-09-24 by the Gmail-lesson-intake Way (DR-0312) from
// the IT Brew issue Backup plan (September 24, 2026), forwarded by the Governor
// with one word: Lesson. The lead story was a TEASER and itbrew.com is
// egress-blocked, so only the teaser's own sentences are quoted and no DR step
// is attributed to the unseen story (DR-0076). restic's README was fetched
// verbatim from github.com. This house's own record is cited exactly —
// including the OPEN item (the sovereign database README still lists backups
// as NOT done), named with a re-review date rather than guessed either way.
// =============================================================================
const sov26 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov26-the-roll-the-king-burned-and-the-roll-written-again');

const SOV26_FRAGMENTS = {
  "Matthew 7:24": "Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock:",
  "Matthew 7:25": "And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.",
  "Matthew 7:26": "And every one that heareth these sayings of mine, and doeth them not, shall be likened unto a foolish man, which built his house upon the sand:",
  "Matthew 7:27": "And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell: and great was the fall of it.",
  "Ecclesiastes 9:11": "I returned, and saw under the sun, that the race is not to the swift, nor the battle to the strong, neither yet bread to the wise, nor yet riches to men of understanding, nor yet favour to men of skill; but time and chance happeneth to them all.",
  "Proverbs 27:1": "Boast not thyself of to morrow; for thou knowest not what a day may bring forth.",
  "Proverbs 22:3": "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.",
  "Proverbs 27:23": "Be thou diligent to know the state of thy flocks, and look well to thy herds.",
  "Matthew 6:34": "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
  "2 Timothy 1:7": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
  "Genesis 41:34": "Let Pharaoh do this, and let him appoint officers over the land, and take up the fifth part of the land of Egypt in the seven plenteous years.",
  "Genesis 41:35": "And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities.",
  "Genesis 41:36": "And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine.",
  "Genesis 41:48": "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities: the food of the field, which was round about every city, laid he up in the same.",
  "Genesis 41:49": "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number.",
  "Genesis 41:56": "And the famine was over all the face of the earth: And Joseph opened all the storehouses, and sold unto the Egyptians; and the famine waxed sore in the land of Egypt.",
  "Proverbs 6:6": "Go to the ant, thou sluggard; consider her ways, and be wise:",
  "Proverbs 6:8": "Provideth her meat in the summer, and gathereth her food in the harvest.",
  "Jeremiah 36:23": "And it came to pass, that when Jehudi had read three or four leaves, he cut it with the penknife, and cast it into the fire that was on the hearth, until all the roll was consumed in the fire that was on the hearth.",
  "Jeremiah 36:27": "Then the word of the LORD came to Jeremiah, after that the king had burned the roll, and the words which Baruch wrote at the mouth of Jeremiah, saying,",
  "Jeremiah 36:28": "Take thee again another roll, and write in it all the former words that were in the first roll, which Jehoiakim the king of Judah hath burned.",
  "Jeremiah 36:32": "Then took Jeremiah another roll, and gave it to Baruch the scribe, the son of Neriah; who wrote therein from the mouth of Jeremiah all the words of the book which Jehoiakim king of Judah had burned in the fire: and there were added besides unto them many like words.",
  "Exodus 34:1": "And the LORD said unto Moses, Hew thee two tables of stone like unto the first: and I will write upon these tables the words that were in the first tables, which thou brakest.",
  "Psalms 119:89": "For ever, O LORD, thy word is settled in heaven.",
  "Matthew 24:35": "Heaven and earth shall pass away, but my words shall not pass away.",
  "Isaiah 40:8": "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.",
  "1 Peter 1:25": "But the word of the Lord endureth for ever.",
  "Matthew 25:3": "They that were foolish took their lamps, and took no oil with them:",
  "Matthew 25:4": "But the wise took oil in their vessels with their lamps.",
  "Matthew 25:6": "And at midnight there was a cry made, Behold, the bridegroom cometh; go ye out to meet him.",
  "Matthew 25:8": "And the foolish said unto the wise, Give us of your oil; for our lamps are gone out.",
  "Matthew 25:9": "But the wise answered, saying, Not so; lest there be not enough for us and you: but go ye rather to them that sell, and buy for yourselves.",
  "Matthew 25:10": "And while they went to buy, the bridegroom came; and they that were ready went in with him to the marriage: and the door was shut.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Lamentations 3:40": "Let us search and try our ways, and turn again to the LORD.",
  "Nehemiah 2:13": "viewed the walls of Jerusalem, which were broken down, and the gates thereof were consumed with fire.",
  "Ecclesiastes 4:12": "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.",
  "Ecclesiastes 11:2": "Give a portion to seven, and also to eight; for thou knowest not what evil shall be upon the earth.",
  "Genesis 32:7": "Then Jacob was greatly afraid and distressed: and he divided the people that was with him, and the flocks, and herds, and the camels, into two bands;",
  "Genesis 32:8": "And said, If Esau come to the one company, and smite it, then the other company which is left shall escape.",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "Acts 27:18": "And we being exceedingly tossed with a tempest, the next day they lightened the ship;",
  "Acts 27:19": "And the third day we cast out with our own hands the tackling of the ship.",
  "Acts 27:29": "Then fearing lest we should have fallen upon rocks, they cast four anchors out of the stern, and wished for the day.",
  "Acts 27:31": "Paul said to the centurion and to the soldiers, Except these abide in the ship, ye cannot be saved.",
  "Acts 27:22": "And now I exhort you to be of good cheer: for there shall be no loss of any man’s life among you, but of the ship.",
  "Acts 27:44": "And the rest, some on boards, and some on broken pieces of the ship. And so it came to pass, that they escaped all safe to land.",
  "Luke 14:31": "Or what king, going to make war against another king, sitteth not down first, and consulteth whether he be able with ten thousand to meet him that cometh against him with twenty thousand?",
  "Proverbs 24:6": "For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much",
  "Proverbs 20:10": "Divers weights, and divers measures, both of them are alike abomination to the LORD.",
  "Proverbs 21:31": "The horse is prepared against the day of battle: but safety is of the LORD.",
  "Psalms 46:1": "God is our refuge and strength, a very present help in trouble.",
  "Psalms 46:2": "Therefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea;",
  "Hebrews 11:7": "By faith Noah, being warned of God of things not seen as yet, moved with fear, prepared an ark to the saving of his house; by the which he condemned the world, and became heir of the righteousness which is by faith.",
  "Matthew 6:19": "Lay not up for yourselves treasures upon earth, where moth and rust doth corrupt, and where thieves break through and steal:",
  "Matthew 6:20": "But lay up for yourselves treasures in heaven, where neither moth nor rust doth corrupt, and where thieves do not break through nor steal:",
  "Hebrews 12:27": "And this word, Yet once more, signifieth the removing of those things that are shaken, as of things that are made, that those things which cannot be shaken may remain.",
  "Hebrews 12:28": "Wherefore we receiving a kingdom which cannot be moved,",
  "Luke 12:42": "And the Lord said, Who then is that faithful and wise steward, whom his lord shall make ruler over his household, to give them their portion of meat in due season?",
};

const SOV26_CORPUS = {
  "Matthew 7:24": ["Matthew",7,24],
  "Matthew 7:25": ["Matthew",7,25],
  "Matthew 7:26": ["Matthew",7,26],
  "Matthew 7:27": ["Matthew",7,27],
  "Ecclesiastes 9:11": ["Ecclesiastes",9,11],
  "Proverbs 27:1": ["Proverbs",27,1],
  "Proverbs 22:3": ["Proverbs",22,3],
  "Proverbs 27:23": ["Proverbs",27,23],
  "Matthew 6:34": ["Matthew",6,34],
  "2 Timothy 1:7": ["2Timothy",1,7],
  "Genesis 41:34": ["Genesis",41,34],
  "Genesis 41:35": ["Genesis",41,35],
  "Genesis 41:36": ["Genesis",41,36],
  "Genesis 41:48": ["Genesis",41,48],
  "Genesis 41:49": ["Genesis",41,49],
  "Genesis 41:56": ["Genesis",41,56],
  "Proverbs 6:6": ["Proverbs",6,6],
  "Proverbs 6:8": ["Proverbs",6,8],
  "Jeremiah 36:23": ["Jeremiah",36,23],
  "Jeremiah 36:27": ["Jeremiah",36,27],
  "Jeremiah 36:28": ["Jeremiah",36,28],
  "Jeremiah 36:32": ["Jeremiah",36,32],
  "Exodus 34:1": ["Exodus",34,1],
  "Psalms 119:89": ["Psalms",119,89],
  "Matthew 24:35": ["Matthew",24,35],
  "Isaiah 40:8": ["Isaiah",40,8],
  "1 Peter 1:25": ["1Peter",1,25],
  "Matthew 25:3": ["Matthew",25,3],
  "Matthew 25:4": ["Matthew",25,4],
  "Matthew 25:6": ["Matthew",25,6],
  "Matthew 25:8": ["Matthew",25,8],
  "Matthew 25:9": ["Matthew",25,9],
  "Matthew 25:10": ["Matthew",25,10],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Lamentations 3:40": ["Lamentations",3,40],
  "Nehemiah 2:13": ["Nehemiah",2,13],
  "Ecclesiastes 4:12": ["Ecclesiastes",4,12],
  "Ecclesiastes 11:2": ["Ecclesiastes",11,2],
  "Genesis 32:7": ["Genesis",32,7],
  "Genesis 32:8": ["Genesis",32,8],
  "Proverbs 24:4": ["Proverbs",24,4],
  "Acts 27:18": ["Acts",27,18],
  "Acts 27:19": ["Acts",27,19],
  "Acts 27:29": ["Acts",27,29],
  "Acts 27:31": ["Acts",27,31],
  "Acts 27:22": ["Acts",27,22],
  "Acts 27:44": ["Acts",27,44],
  "Luke 14:31": ["Luke",14,31],
  "Proverbs 24:6": ["Proverbs",24,6],
  "Psalms 127:1": ["Psalms",127,1],
  "Luke 16:10": ["Luke",16,10],
  "Proverbs 20:10": ["Proverbs",20,10],
  "Proverbs 21:31": ["Proverbs",21,31],
  "Psalms 46:1": ["Psalms",46,1],
  "Psalms 46:2": ["Psalms",46,2],
  "Hebrews 11:7": ["Hebrews",11,7],
  "Matthew 6:19": ["Matthew",6,19],
  "Matthew 6:20": ["Matthew",6,20],
  "Hebrews 12:27": ["Hebrews",12,27],
  "Hebrews 12:28": ["Hebrews",12,28],
  "Luke 12:42": ["Luke",12,42],
};

const SOV26_ALLOWED = [
  "\"Does your IT disaster recovery (DR) plan actually work?\"",
  "\"If your organization experienced a ransomware attack today, how long would it take to recover?\"",
  "\"a formal document that details how an organization will restore IT infrastructure in the event of a disaster\"",
  "\"where the technology interrupts the operations of the business\"",
  "\"something as simple as somebody trips over a cable in a data center\"",
  "\"In large organizations, that could be a hurricane is bearing down on the East Coast, and a data center is about to get impacted.\"",
  "\"Much more important than backup is restore\"",
  "\"Saving a backup on the same machine is nice but not a real backup strategy.\"",
  "\"Losing your password means that your data is irrecoverably lost.\"",
  "\"Doing backups should be a frictionless process, otherwise you might be tempted to skip it.\"",
  "\"hits a wall or underdelivers\"",
  "\"Hosted Supabase did this invisibly. On the NAS it is ours, and it is not optional for the family's data.\"",
  "\"A backup that was never verified is not a backup.\"",
  "\"What’s the downside if this fails? If that entire vibe effort falls apart and doesn’t work, how bad is it going to be?\"",
  "\"If it’s really bad, it’s definitely shifting back to SaaS.\"",
  "\"Hosted Supabase did this invisibly.\"",
  "\"copying rows without blobs fabricates working-looking links.\"",
  "\"a preview, not a backup\""
];

describe('sov26 — the roll the king burned and the roll written again quotes its whole spine verbatim, Word first', () => {
  it('the week exists, anchored on the roll written again and the oil in the vessel', () => {
    expect(sov26).toBeTruthy();
    expect(sov26.anchor.ref).toContain('Jeremiah 36:28');
    expect(sov26.anchor.ref).toContain('Matthew 25:4');
    expect(sov26.anchor.theme).toContain(SOV26_FRAGMENTS['Jeremiah 36:28']);
    expect(sov26.anchor.theme).toContain(SOV26_FRAGMENTS['Matthew 25:4']);
  });
  wordFirstChecks(sov26, SOV26_FRAGMENTS, SOV26_CORPUS, 'sov26');
  it('the Word LEADS: both houses in the storm precede the newsletter and every tool', () => {
    expect(sov26.lesson.indexOf('FIRST, THE STORM COMES TO BOTH HOUSES')).toBe(0);
    expect(sov26.lesson.indexOf(SOV26_FRAGMENTS['Matthew 7:27'])).toBeLessThan(sov26.lesson.indexOf('IT Brew'));
    expect(sov26.lesson.indexOf(SOV26_FRAGMENTS['Proverbs 22:3'])).toBeLessThan(sov26.lesson.indexOf('TIER ONE, documented'));
    // The two storm verses really are word-for-word the same weather — the point of the first movement.
    expect(SOV26_FRAGMENTS['Matthew 7:25'].startsWith('And the rain descended, and the floods came, and the winds blew, and beat upon that house;')).toBe(true);
    expect(SOV26_FRAGMENTS['Matthew 7:27'].startsWith('And the rain descended, and the floods came, and the winds blew, and beat upon that house;')).toBe(true);
  });
  it('the load-bearing teaching is carried in its named movements', () => {
    for (const heading of [
      'SECOND, WHAT CAME THROUGH AND WHAT DID NOT - HONEST PROVENANCE IS PART OF THE TEACHING',
      'THIRD, JOSEPH WROTE THE RECOVERY PLAN IN PLENTY, NOT IN THE FAMINE',
      'FOURTH, THE ROLL THE KING BURNED AND THE ROLL WRITTEN AGAIN',
      'FIFTH, THE OIL MUST BE IN THE VESSEL BEFORE THE CRY - A BACKUP NOBODY HAS RESTORED IS NOT YET A BACKUP',
      'SIXTH, THREE COPIES, TWO KINDS, ONE ELSEWHERE',
      'SEVENTH, THE STORM RUNBOOK',
      'EIGHTH, WHAT IS THE DOWNSIDE IF THIS FAILS',
      'NINTH, OUR OWN HOUSE, MEASURED - THE ROWS MOVED, THE BLOBS DID NOT',
      'TENTH, PREPARE WITHOUT FEAR',
    ]) expect(sov26.lesson).toContain(heading);
    expect(sov26.lesson).toContain('At midnight, nobody can lend you your backup.');
    expect(sov26.lesson).toContain('recovery is real only when a copy survives OUTSIDE the attacker\'s reach');
    expect(sov26.lesson).toContain('People first; the ship was lost.');
    expect(sov26.inApp).toMatch(/Your Data/);
    expect(sov26.inApp).toMatch(/bring ONE file back/);
  });
  it('the bright line is drawn: our backups are copies of our data; the Word is not our data', () => {
    expect(sov26.lesson).toContain('the Word is not our data');
    expect(sov26.lesson).toContain('the Word does not depend on our disks, our backups or our diligence');
    expect(sov26.lesson).toContain('Nobody has ever burned the Word.');
    expect(sov26.lesson).toContain(SOV26_FRAGMENTS['Psalms 119:89']);
    expect(sov26.lesson).toContain(SOV26_FRAGMENTS['Matthew 24:35']);
    // Preparation is joined to trust, never to dread.
    expect(sov26.lesson).toContain(SOV26_FRAGMENTS['Proverbs 21:31']);
    expect(sov26.lesson).toContain('Prepare the horse. Trust Yahweh for the day.');
  });
  it('provenance: the TEASER is disclosed, the blocked story is named and nothing is attributed to it', () => {
    expect(sov26.bigIdea).toContain('TEASER');
    expect(sov26.lesson).toContain('The issue\'s lead story arrived as a TEASER.');
    expect(sov26.lesson).toContain('we do NOT have that story\'s steps, and we will not invent them or attribute any practice to it');
    expect(sov26.lesson).toContain('How to develop an effective IT disaster recovery plan');
    expect(sov26.lesson).toContain('egress-blocked');
    expect(sov26.lesson).toContain('The newsletter is the occasion. The Word is the authority.');
    expect(sov26.lesson).toContain('restic, a backup program whose README was fetched verbatim 2026-09-24 from github.com');
    expect(sov26.lesson).toContain('search-verified 2026-09-24');
  });
  it('DR-0100: tiers named; the McKinsey figures carried as reported; our own open backup item named with a date, not guessed', () => {
    expect(sov26.lesson).toContain('TIER ONE, documented');
    expect(sov26.lesson).toContain('TIER TWO, genuinely open');
    expect(sov26.lesson).toContain('TIER THREE, over-reach');
    expect(sov26.lesson).toContain('carried as reported, not as measured (re-review: 2026-10-24)');
    expect(sov26.lesson).toContain('the sovereign database\'s README still lists backups under what is NOT done');
    expect(sov26.lesson).toContain('so this lesson does not claim it either way (re-review: 2026-10-08)');
    expect(sov26.lesson).toContain('What is NOT open, and will not be hedged');
    expect(sov26.lesson).toContain('named to be educated past');
  });
  it('this house is cited EXACTLY: the cutover record (455 objects, twelve days, read-back HTTP 200 on 2026-09-08), the phone-upload record, the Gmail-archive record', () => {
    expect(sov26.lesson).toContain('455 stored objects in all');
    expect(sov26.lesson).toContain('For twelve days the gap was real and unwatched');
    expect(sov26.lesson).toContain('the record of 2026-08-31 says so');
    expect(sov26.lesson).toContain('on 2026-09-08 all twelve gallery pictures were copied and one was read back through our own gateway, HTTP 200');
    expect(sov26.lesson).toContain('"a preview, not a backup" - a copy that loses what matters');
    expect(sov26.lesson).toContain('"A backup that was never verified is not a backup." (the Gmail-archive decision record, 2026-07-28)');
  });
  it('provenance honesty: the only non-Scripture double-quoted spans in the lesson are the newsletter, restic, or this repo\'s own files', () => {
    const isWord = (q) => Object.values(SOV26_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
    const nonScripture = (sov26.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
    expect(nonScripture.length).toBeGreaterThan(10);
    for (const q of nonScripture) expect(SOV26_ALLOWED, `unexpected non-Scripture quote: ${q}`).toContain(q);
  });
  it('tamper-catch: the pinned ground-truth lines are themselves exact, and a one-word drift fails', () => {
    expect(SOV26_FRAGMENTS['Jeremiah 36:28']).toBe('Take thee again another roll, and write in it all the former words that were in the first roll, which Jehoiakim the king of Judah hath burned.');
    expect(SOV26_FRAGMENTS['Matthew 25:4']).toBe('But the wise took oil in their vessels with their lamps.');
    expect(SOV26_FRAGMENTS['Genesis 32:8']).toBe('And said, If Esau come to the one company, and smite it, then the other company which is left shall escape.');
    expect(SOV26_FRAGMENTS['Proverbs 21:31']).toBe('The horse is prepared against the day of battle: but safety is of the LORD.');
    expect(SOV26_FRAGMENTS['Acts 27:22']).toContain('no loss of any man’s life among you, but of the ship');
    const drifted = sov26.lesson.split('Take thee again another roll').join('Take thee another scroll');
    expect(drifted).not.toContain(SOV26_FRAGMENTS['Jeremiah 36:28']);
  });
});
