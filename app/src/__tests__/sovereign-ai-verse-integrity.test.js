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
