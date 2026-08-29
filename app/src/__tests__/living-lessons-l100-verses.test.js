// =============================================================================
// L100 — Guard the Little Ones: children as a trust, the millstone warning, and
// being mastered by nothing. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 forwarded the Meta teen-safety settlement (NPR / 1440 /
// Morning Brew, 2026-08-27) with "Lesson." Held Word-first and two tiers honest
// (DR-0100): the settlement (~$17B, reported $16.7B-$18B) and the documented
// harm to the developing teen brain are stated plainly; the exact figure and
// Meta's denial are held as contested, not asserted. Non-partisan — the headline
// is the occasion, the eternal duty to guard children is the lesson. Every KJV
// line FETCHED from the repo's own KJV this session; a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools'");
const l = src.slice(start, start + 100000);

const QUOTED_FRAGMENTS = [
  // children are the Lord's heritage
  'Lo, children are an heritage of the LORD: and the fruit of the womb is his reward',
  // the millstone warning — all three
  'But whoso shall offend one of these little ones which believe in me, it were better for him that a millstone were hanged about his neck',
  'And whosoever shall offend one of these little ones that believe in me',
  'than that he should offend one of these little ones',
  // guard the eye and the heart
  'I will set no wicked thing before mine eyes',
  'Keep thy heart with all diligence; for out of it are the issues of life',
  'The light of the body is the eye: if therefore thine eye be single',
  'But if thine eye be evil, thy whole body shall be full of darkness',
  // the praise of men
  'For they loved the praise of men more than the praise of God',
  'or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ',
  'And be not conformed to this world: but be ye transformed by the renewing of your mind',
  // parents teach diligently
  'And thou shalt teach them diligently unto thy children',
  'Train up a child in the way he should go: and when he is old, he will not depart from it',
  'bring them up in the nurture and admonition of the Lord',
  // mastered by nothing
  'All things are lawful unto me, but all things are not expedient',
  'He that hath no rule over his own spirit is like a city that is broken down, and without walls',
  // treasure and rest
  'For where your treasure is, there will your heart be also',
  'for so he giveth his beloved sleep',
  'Come unto me, all ye that labour and are heavy laden, and I will give you rest',
];

describe('L100 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 127:3; Matthew 18:6; 1 Corinthians 6:12'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) CHILDREN ARE THE LORD',   // "LORD'S HERITAGE" — apostrophe-free anchor
      '2) THE MILLSTONE WARNING',
      '3) GUARD THE EYE AND THE HEART',
      '4) REFUSE THE TYRANNY OF LIKES',
      '5) PARENTS TEACH DILIGENTLY',
      '6) MASTERED BY NOTHING',
      '7) SET THE TREASURE AND THE REST',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the news two tiers honest (DR-0100) and stays non-partisan', () => {
    expect(l).toContain('DR-0100');
    // Tier 1 — the real event named plainly
    expect(l).toContain('August 26, 2026');
    expect(l).toContain('two-hour');
    // Tier 2 — the contested edges held, not asserted
    expect(l).toContain('denies');
    expect(l).toMatch(/16\.7 billion|16\.7B/);
    expect(l).toContain('contested');
    expect(l).toContain('non-partisan');
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
  it('child, teen, and senior each carry the trust-and-guard threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries children-as-heritage`).toContain('an heritage of the LORD');
      expect(t, `${band} carries guard the gate`).toMatch(/set no wicked thing before mine eyes|Keep thy heart|guard/i);
    }
    // teen and senior additionally carry the mastered-by-nothing tier and the praise-of-men snare.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('All things are lawful unto me');
      expect(t).toContain('the praise of men more than the praise of God');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Psalms', 127, 3)).toBe('Lo, children are an heritage of the LORD: and the fruit of the womb is his reward.');
    expect(verse('Matthew', 18, 6)).toContain('it were better for him that a millstone were hanged about his neck');
    expect(verse('Proverbs', 4, 23)).toBe('Keep thy heart with all diligence; for out of it are the issues of life.');
    expect(verse('Matthew', 6, 22)).toContain('The light of the body is the eye');
    expect(verse('John', 12, 43)).toBe('For they loved the praise of men more than the praise of God.');
    expect(verse('Romans', 12, 2)).toContain('be not conformed to this world: but be ye transformed by the renewing of your mind');
    expect(verse('Deuteronomy', 6, 7)).toContain('And thou shalt teach them diligently unto thy children');
    expect(verse('Ephesians', 6, 4)).toContain('bring them up in the nurture and admonition of the Lord');
    expect(verse('1Corinthians', 6, 12)).toBe('All things are lawful unto me, but all things are not expedient: all things are lawful for me, but I will not be brought under the power of any.');
    expect(verse('Proverbs', 25, 28)).toBe('He that hath no rule over his own spirit is like a city that is broken down, and without walls.');
    expect(verse('Psalms', 127, 2)).toContain('for so he giveth his beloved sleep');
    expect(verse('Matthew', 11, 28)).toBe('Come unto me, all ye that labour and are heavy laden, and I will give you rest.');
  });
});
