// =============================================================================
// prep-outline — parse a teacher's PRE-SERVICE prep document into a clean,
// structured teaching outline (numbered points + scripture refs).
// =============================================================================
// PROVEN-TO-CATCH (DR-0076): these lock the exact behaviors verified against BG's
// REAL prep documents (2026-07-02). The fixtures below are compact SYNTHETIC
// reconstructions of each structural shape observed in his real .docx files — his
// actual sermon content is not archived in the repo (it lives in private church
// storage); the fixtures reproduce only the FORMAT the parser must handle:
//   - arabic-numbered points ("1." "2.")            — Jul 1 "Double", 05-17
//   - roman-numbered points ("I." "II.")            — 06-24 "All Fathers Matter"
//   - MIXED roman+arabic in one doc ("I." then "2.")— 05-27
//   - lettered sub-points ("A." "B.") under a point — Jul 1, 04-29
//   - a scripture-READING service with NO points    — 06-17 "Are You Salty?"
//   - roman-numeral book names ("I Kings")          — canonicalized to "1 Kings"
//   - a trailing "Trivia for the Day!" quiz         — must NOT contaminate points
// If a change breaks any of these, the produced outline would regress to the rough
// state this feature replaced (scripture refs shown as points; broken numbering).
import { describe, it, expect } from 'vitest';
import { parsePrepOutline, extractRefs, themeFromSubject } from '../lib/prep-outline.js';

describe('extractRefs — BG-tuned scripture matcher', () => {
  it('canonicalizes roman-numeral books to arabic', () => {
    expect(extractRefs('I Kings 17:1 NKJV,')).toEqual(['1 Kings 17:1']);
    expect(extractRefs('II Samuel 7:12')).toEqual(['2 Samuel 7:12']);
  });
  it('preserves verse ranges (hyphen or en-dash)', () => {
    expect(extractRefs('2 Kings 2:9-10 KJV')).toEqual(['2 Kings 2:9-10']);
    expect(extractRefs('1 Samuel 17:34–37 NIV')).toEqual(['1 Samuel 17:34-37']);
  });
  it('tolerates a verse-letter suffix and mid-line citations', () => {
    expect(extractRefs('And in Hebrews 13:5 B NKJV, Never will I leave you')).toEqual(['Hebrews 13:5']);
    expect(extractRefs('Matthew 1:18 A NIV,')).toEqual(['Matthew 1:18']);
  });
  it('finds nothing in plain prose', () => {
    expect(extractRefs('Praise God, church, and good morning.')).toEqual([]);
  });
});

// Arabic points + a lettered sub-point + preamble anchor + a trailing trivia quiz.
const ARABIC = `Praise GOD!!!

Isaiah 61:7 KJV, For your shame ye shall have double

2 Kings 2:9-10 KJV
9 Elisha said, let a double portion of thy spirit be upon me.

Don't Allow Any Struggles To Distract You From Your Double!

1. Elijah Is Standing Before Ahab

I Kings 17:1 NKJV, And Elijah the Tishbite said to Ahab

2. God Sustains Elijah

A. By The Brook Cherith & Ravens

I Kings 17:2-6 NKJV, And it will be that you shall drink from the brook

Trivia for the Day!

1. What prophet confronted Ahab?
2. Where did Elijah hide?`;

describe('parsePrepOutline — arabic points, sub-point, trivia cut', () => {
  const o = parsePrepOutline(ARABIC, { subject: '07-01-2026 DONT LET ANY STRUGGLE DISTRACT YOU FROM YOUR DOUBLE' });

  it('reads the numbered points in order, numbering that increments', () => {
    expect(o.points.map((p) => p.n)).toEqual([1, 2]);
    expect(o.points[0].text).toBe('Elijah Is Standing Before Ahab');
  });
  it('does NOT let scripture-reference lines masquerade as points', () => {
    // The old bug: "Isaiah 61:7 ..." listed as a point. Never a point now.
    for (const p of o.points) expect(extractRefs(p.text)).toEqual([]);
  });
  it('attaches the scripture under each point and canonicalizes roman books', () => {
    expect(o.points[0].scriptures).toContain('1 Kings 17:1');
  });
  it('captures a lettered sub-point with its own scripture', () => {
    expect(o.points[1].subpoints).toHaveLength(1);
    expect(o.points[1].subpoints[0].label).toBe('A');
    expect(o.points[1].subpoints[0].scriptures).toContain('1 Kings 17:2-6');
  });
  it('does not swallow the trivia quiz as points', () => {
    expect(o.points).toHaveLength(2); // not 4 (the two trivia "1./2." are cut)
    expect(o.points.some((p) => /what prophet/i.test(p.text))).toBe(false);
  });
  it('rolls the preamble anchors into the scripture feed, anchor first', () => {
    expect(o.anchor).toBe('Isaiah 61:7');
    expect(o.scriptures.slice(0, 2)).toEqual(['Isaiah 61:7', '2 Kings 2:9-10']);
    expect(o.scriptures).toContain('1 Kings 17:1');
  });
});

// Roman points ("I." "II.") normalized to 1,2.
const ROMAN = `Praise GOD!!!

ALL FATHERS MATTER

Matthew 1:18 NIV, This is how the birth of Jesus came about

I. Joseph Endured Hardship

Matthew 1:18-21 NIV, an angel of the Lord appeared to him

II. Joseph Protected His Family

Matthew 2:13-14 NIV, take the child and escape to Egypt`;

describe('parsePrepOutline — roman-numeral points', () => {
  const o = parsePrepOutline(ROMAN, { subject: '06-24-2026 PROCLAIM - ALL FATHERS MATTER!' });
  it('normalizes roman I./II. to incrementing 1,2', () => {
    expect(o.points.map((p) => p.n)).toEqual([1, 2]);
    expect(o.points[0].text).toBe('Joseph Endured Hardship');
    expect(o.points[1].text).toBe('Joseph Protected His Family');
  });
});

// MIXED: roman "I." for point 1, arabic "2." for point 2 — one ascending outline.
const MIXED = `Praise GOD!!!

I Samuel 1:2-3 NIV, He had two wives

I. YOU CAN BE CHOSEN AND STILL STRUGGLE

1 Samuel 1:4-8 NIV, whenever the day came

2. GREAT PAIN LEADS TO DEEP PRAYER

1 Samuel 1:9-11 NIV, Hannah stood up and prayed`;

describe('parsePrepOutline — mixed roman + arabic numbering', () => {
  const o = parsePrepOutline(MIXED, {});
  it('treats "I." then "2." as points 1 and 2 (not one absorbing point)', () => {
    expect(o.points.map((p) => p.n)).toEqual([1, 2]);
    expect(o.points[0].text).toBe('YOU CAN BE CHOSEN AND STILL STRUGGLE');
    expect(o.points[0].scriptures).toContain('1 Samuel 1:4-8');
    expect(o.points[1].scriptures).toContain('1 Samuel 1:9-11');
  });
});

// A scripture-READING service: theme + scriptures, NO numbered points.
const READING = `Praise GOD!!!

ARE YOU SALTY?

Matthew 5:13 NKJV, You are the salt of the earth
Matthew 5:14-16 NKJV, You are the light of the world

Trivia for the Day!

1. What covenant is called a Covenant of Salt?`;

describe('parsePrepOutline — scripture-reading service (no points)', () => {
  const o = parsePrepOutline(READING, { subject: '06-17-2026 PROCLAIM - ARE YOU SALTY?' });
  it('yields zero points but a real scripture list — honest, not fabricated', () => {
    expect(o.points).toHaveLength(0);
    expect(o.hasPoints).toBe(false);
    expect(o.scriptures).toEqual(['Matthew 5:13', 'Matthew 5:14-16']);
  });
  it('still finds the theme', () => {
    expect(o.theme).toBe('ARE YOU SALTY?');
  });
});

describe('parsePrepOutline — robustness', () => {
  it('never throws on empty / junk input', () => {
    expect(parsePrepOutline('').points).toEqual([]);
    expect(parsePrepOutline(null).scriptures).toEqual([]);
    expect(parsePrepOutline('   \n\n  ').anchor).toBe(null);
  });
});

describe('themeFromSubject', () => {
  it('strips date, PROCLAIM, scripture, translation, trailing speaker', () => {
    expect(themeFromSubject('05-17-2026 - YOU WERE BUILT TO WIN - I SAMUEL 17.32-37 NIV! PROCLAIM'))
      .toMatch(/YOU WERE BUILT TO WIN/i);
  });
});
