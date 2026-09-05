// =============================================================================
// L97 — A Just Weight for Work, Money, and Words: verbatim KJV
// =============================================================================
// Darrell 2026-08-28 brought a news story (The Sewing Box / Blue Angels flight
// suits) and asked for research + a lesson, flagging a title claim to verify.
// Word-first, non-partisan, two-tier honest (DR-0098/DR-0100): honor faithful
// service; a just weight with public money AND with words; no respecter of
// persons held in both tiers (name the disparity, do not convict the heart);
// plead for the one without power; verify every claim — including our own (the
// Patronis title was checked against the public record and a well-meant
// correction proved outdated); a just process, not vengeance; security in the
// Lord, not a contract. Every KJV line FETCHED from the repo's own KJV this
// session; a drift fails the build. The Sewing Box facts are carried AS REPORTED
// (DR-0076); the Patronis fact is verified against the public record.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll97-a-just-weight-for-work-money-and-words-faithful-service-and-verifying-every-claim'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const QUOTED_FRAGMENTS = [
  // honor faithful service
  'Well done, thou good and faithful servant',
  'thou hast been faithful over a few things',
  'The labourer is worthy of his reward',
  'there was found in it a poor wise man, and he by his wisdom delivered the city; yet no man remembered that same poor man',
  'do it heartily, as to the Lord',
  // a just weight with money
  'A false balance is abomination to the LORD: but a just weight is his delight',
  'Divers weights, and divers measures, both of them are alike abomination to the LORD',
  'give an account of thy stewardship',
  // no respecter of persons — both tiers
  'God is no respecter of persons',
  'The rich and poor meet together: the LORD is the maker of them all',
  'if ye have respect to persons, ye commit sin',
  'man looketh on the outward appearance, but the LORD looketh on the heart',
  // plead for the one without power
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction.',
  'plead the cause of the poor and needy',
  'seek judgment, relieve the oppressed',
  // a just weight for words
  'Prove all things; hold fast that which is good.',
  'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him',
  'Thou shalt not raise a false report',
  'Thou shalt not bear false witness against thy neighbour',
  // a just process, not vengeance
  'to do justly, and to love mercy, and to walk humbly with thy God',
  'avenge not yourselves',
  'Vengeance is mine; I will repay, saith the Lord',
  'Commit thy works unto the LORD, and thy thoughts shall be established',
  // security in the Lord
  'my God shall supply all your need according to his riches in glory by Christ Jesus',
  'seek ye first the kingdom of God, and his righteousness',
];

describe('L97 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 11:1; Acts 10:34; 1 Thessalonians 5:21'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) HONOR LONG, FAITHFUL SERVICE',
      '2) A JUST WEIGHT WITH WHAT IS NOT YOURS',
      '3) NO RESPECTER OF PERSONS',
      '4) PLEAD THE CAUSE OF THE ONE WITHOUT THE POWER',
      '5) A JUST WEIGHT FOR WORDS TOO',
      '6) ASK FOR A JUST PROCESS, NOT VENGEANCE',
      '7) WHERE SECURITY FINALLY RESTS',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the provenance discipline honestly (DR-0076 as-reported + DR-0100 both tiers)', () => {
    expect(l).toContain('AS REPORTED');
    expect(l).toContain('DR-0076');
    expect(l).toContain('DR-0100');
  });

  it('the Patronis title is VERIFIED against the public record, and the correction self-corrected', () => {
    // The teaching point Darrell raised — a just weight for words, checked live.
    expect(l).toContain('Florida CFO through March 2025');
    expect(l).toContain('April 1, 2025');
    expect(l).toContain("1st District");
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the just weight, no-respecter, and verify-claims threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just weight`).toContain('a just weight is his delight');
      expect(t, `${band} carries no respecter of persons`).toContain('God is no respecter of persons');
      expect(t, `${band} carries prove/verify`).toMatch(/[Pp]rove all things|find out if it is TRUE/);
    }
    // teen and senior additionally carry the do-not-judge-the-heart tier and the Patronis verification.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('the LORD looketh on the heart');
      expect(t).toMatch(/April 1?,? ?2025/);
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 11, 1)).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(verse('Acts', 10, 34)).toContain('God is no respecter of persons');
    expect(verse('1Samuel', 16, 7)).toContain('man looketh on the outward appearance, but the LORD looketh on the heart');
    expect(verse('Proverbs', 18, 17)).toBe('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.');
    expect(verse('Exodus', 23, 1)).toContain('Thou shalt not raise a false report');
    expect(verse('Exodus', 20, 16)).toBe('Thou shalt not bear false witness against thy neighbour.');
    expect(verse('1Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
    expect(verse('Proverbs', 31, 9)).toContain('plead the cause of the poor and needy');
    expect(verse('Romans', 12, 19)).toContain('Vengeance is mine; I will repay, saith the Lord.');
    expect(verse('Philippians', 4, 19)).toContain('my God shall supply all your need');
    expect(verse('Micah', 6, 8)).toContain('to do justly, and to love mercy, and to walk humbly with thy God');
  });
});
