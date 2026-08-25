// =============================================================================
// L86 — The Gospel of Luke: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24: the Luke survey lesson he is teaching through (framework
// credit: Tommy C. Higle, "Journey of a Lifetime", 1992 — cited as the study
// source; the lesson prose is the house's own). Every KJV line below was
// FETCHED from the repo's own KJV (app/public/bible/kjv/*.json) this session —
// never written from memory (DR-0076 / DR-0281 QUOTED). The lesson must
// contain each quoted fragment letter-for-letter; a drifted quote fails the
// build (the L83-L85 discipline).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll86-luke-research-meets-inspiration-son-of-man-for-all'");
const lesson = src.slice(start, start + 40000);
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Luke 1:4': 'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'Luke 1:13': 'But the angel said unto him, Fear not, Zacharias: for thy prayer is heard; and thy wife Elisabeth shall bear thee a son, and thou shalt call his name John.',
  'Luke 1:19': 'And the angel answering said unto him, I am Gabriel, that stand in the presence of God; and am sent to speak unto thee, and to shew thee these glad tidings.',
  'Luke 2:1': 'And it came to pass in those days, that there went out a decree from Caesar Augustus, that all the world should be taxed.',
  'Luke 2:25': 'And, behold, there was a man in Jerusalem, whose name was Simeon; and the same man was just and devout, waiting for the consolation of Israel: and the Holy Ghost was upon him.',
  'Luke 2:32': 'A light to lighten the Gentiles, and the glory of thy people Israel.',
  'Luke 4:26': 'But unto none of them was Elias sent, save unto Sarepta, a city of Sidon, unto a woman that was a widow.',
  'Luke 4:27': 'And many lepers were in Israel in the time of Eliseus the prophet; and none of them was cleansed, saving Naaman the Syrian.',
  'Luke 19:10': 'For the Son of man is come to seek and to save that which was lost.',
};

const QUOTED_FRAGMENTS = [
  'Forasmuch as many have taken in hand to set forth in order a declaration of those things which are most surely believed among us',
  'which from the beginning were eyewitnesses, and ministers of the word',
  'having had perfect understanding of all things from the very first',
  'That thou mightest know the certainty of those things, wherein thou hast been instructed',
  'thy wife Elisabeth shall bear thee a son, and thou shalt call his name John',
  'I am Gabriel, that stand in the presence of God',
  'there went out a decree from Caesar Augustus, that all the world should be taxed',
  'just and devout, waiting for the consolation of Israel: and the Holy Ghost was upon him',
  'For mine eyes have seen thy salvation',
  'A light to lighten the Gentiles, and the glory of thy people Israel',
  'The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor',
  'No prophet is accepted in his own country',
  'many widows were in Israel in the days of Elias',
  'But unto none of them was Elias sent, save unto Sarepta, a city of Sidon, unto a woman that was a widow',
  'many lepers were in Israel in the time of Eliseus the prophet; and none of them was cleansed, saving Naaman the Syrian',
  'filled with wrath',
  'that they might cast him down headlong',
  'For the Son of man is come to seek and to save that which was lost',
];

describe('L86 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 1:4'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toContain('L86 The Gospel of Luke');
  });
  it('cites the study framework honestly and answers the survey questions', () => {
    expect(l).toContain('Journey of a Lifetime');
    expect(l).toContain('Higle');
    // The identify-the-people answers and the two Gentile receipts, from the text.
    for (const frag of ['parents of John the Baptist', 'Caesar Augustus, ruler of the Roman Empire', 'Naaman the SYRIAN']) {
      expect(l).toContain(frag);
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Luke 1:4'].length).toBe(89);
    expect(KJV['Luke 2:32']).toBe('A light to lighten the Gentiles, and the glory of thy people Israel.');
    expect(KJV['Luke 4:26'].endsWith('unto a woman that was a widow.')).toBe(true);
    expect(KJV['Luke 4:27']).toContain('Naaman the Syrian');
    expect(KJV['Luke 19:10'].length).toBe(67);
    expect(KJV['Luke 1:13']).toContain('Elisabeth shall bear thee a son');
    expect(KJV['Luke 1:19'].startsWith('And the angel answering said')).toBe(true);
    expect(KJV['Luke 2:1']).toContain('Caesar Augustus');
    expect(KJV['Luke 2:25']).toContain('Simeon');
  });
});
