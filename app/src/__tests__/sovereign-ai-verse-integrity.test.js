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
