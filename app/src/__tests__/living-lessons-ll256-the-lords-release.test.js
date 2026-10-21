// @vitest-environment node
// =============================================================================
// L256 — "The LORD's Release Is for a Neighbor": the teaching Darrell SPOKE
// into the house on 2026-10-21, built the same session (a spoken teaching is
// build input). DR-1150.
// =============================================================================
// His words, verbatim: "Lords release is for a neighbor... the good neighbor
// took care of a Samaritan... we live in a mixed multitude of people here in
// America... our neighbors claim to be Christian and kill our children and
// make laws against Yahweh's Will... how do we use the Word to love our
// communities in the Way He means and what outcomes should we expect from the
// Way and paths based on how humans and the Word Works... we know Yahweh and
// the GodHead are always Working... lesson..."
//
// Rendered for meaning, never his typos (DR-0331). In Luke 10:25-37 it is the
// Samaritan who shows mercy to the wounded man, so the lesson says so in his
// favor and the text's: "the Samaritan was the one who proved neighbor". His
// point stands exactly as he made it: the release and the care are owed to the
// neighbor, and Jesus defines the neighbor by mercy shown across a mixed people.
//
// WHAT THIS GATE EXISTS TO PROTECT, in order of how badly it would hurt:
//
// 1. THE HARD PART NEVER TRAVELS WITHOUT THE LOVE COMMAND. Darrell named the
//    hardest thing plainly (neighbors who claim to be Christian kill our
//    children and make laws against Yahweh's Will), and the lesson names it
//    plainly by the Word (Matthew 7:21, Proverbs 6:17). A reader handed that
//    half alone is handed a reason to hate the neighbor. So every place that
//    quotes Matthew 7:21 must also carry "Love your enemies" (Matthew 5:44)
//    and "overcome evil with good" (Romans 12:21), per place.
// 2. BOTH PROMISED OUTCOMES, NEVER ONE. Darrell asked what outcomes to expect.
//    The Word promises a harvest AND opposition. A place that promises only
//    the peace (Proverbs 16:7) and drops the persecution (2 Timothy 3:12) sets
//    the reader up to quit at the first hostility; the reverse hands him
//    despair. Both are required in every place.
// 3. THE SAMARITAN IS THE ONE WHO PROVED NEIGHBOR, in every place, beside the
//    lawyer's answer "He that shewed mercy on him" and Jesus' command.
// 4. DARRELL'S SEVEN MOVES, IN HIS ORDER, EVERYWHERE, by the movement markers.
// 5. EVERY VERSE IS THE CORPUS, VERBATIM. Fetched from app/public/bible/kjv
//    before a sentence of this lesson was written, never from memory (DR-0076).
//
// PROVEN TO CATCH (DR-0076 Section 3): the in-file mutation cases below each
// assert their anchor is present before mutating, and DR-1150 records the
// live-file mutation run against the module itself.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, hasAllThree, missingDirections } from '../lib/talk-together.js';

const ID = 'll256-the-lords-release-is-for-a-neighbor-loving-a-mixed-multitude-the-way-he-means';
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** The verse exactly as the corpus on disk has it. No normalisation of marks. */
function corpusVerse(book, ch, n) {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
}

const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
// The five places a reader actually reads. A reader reads ONE of them.
const PLACES = L ? { lesson: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACE_KEYS = Object.keys(PLACES);
const whole = PLACE_KEYS.map((k) => PLACES[k]).join('\n');

// Every reference this lesson quotes, with the longest span it quotes of it.
// Copied from the corpus, not from memory.
const PINNED = {
  'Deuteronomy 15:1': 'At the end of every seven years thou shalt make a release',
  'Deuteronomy 15:2': 'Every creditor that lendeth ought unto his neighbour shall release it; he shall not exact it of his neighbour, or of his brother; because it is called the LORD’s release',
  'Deuteronomy 15:3': 'Of a foreigner thou mayest exact it again: but that which is thine with thy brother thine hand shall release',
  'Deuteronomy 15:7': 'thou shalt not harden thine heart, nor shut thine hand from thy poor brother',
  'Deuteronomy 15:8': 'But thou shalt open thine hand wide unto him',
  'Luke 10:27': 'Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy strength, and with all thy mind; and thy neighbour as thyself',
  'Luke 10:28': 'this do, and thou shalt live',
  'Luke 10:29': 'But he, willing to justify himself, said unto Jesus, And who is my neighbour?',
  'Luke 10:30': 'and wounded him, and departed, leaving him half dead',
  'Luke 10:31': 'he passed by on the other side',
  'Luke 10:33': 'But a certain Samaritan, as he journeyed, came where he was: and when he saw him, he had compassion on him',
  'John 4:9': 'for the Jews have no dealings with the Samaritans',
  'Luke 10:34': 'went to him, and bound up his wounds, pouring in oil and wine, and set him on his own beast, and brought him to an inn, and took care of him',
  'Luke 10:35': 'whatsoever thou spendest more, when I come again, I will repay thee',
  'Luke 10:36': 'Which now of these three, thinkest thou, was neighbour unto him that fell among the thieves?',
  'Luke 10:37': 'Then said Jesus unto him, Go, and do thou likewise',
  'Exodus 12:38': 'And a mixed multitude went up also with them',
  'Exodus 12:49': 'One law shall be to him that is homeborn, and unto the stranger that sojourneth among you',
  'Leviticus 19:33': 'And if a stranger sojourn with thee in your land, ye shall not vex him',
  'Leviticus 19:34': 'But the stranger that dwelleth with you shall be unto you as one born among you, and thou shalt love him as thyself; for ye were strangers in the land of Egypt',
  'Leviticus 19:18': 'thou shalt love thy neighbour as thyself: I am the LORD',
  'Jeremiah 29:7': 'And seek the peace of the city whither I have caused you to be carried away captives, and pray unto the LORD for it: for in the peace thereof shall ye have peace',
  'Matthew 7:21': 'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven',
  'Matthew 7:23': 'And then will I profess unto them, I never knew you: depart from me, ye that work iniquity',
  'Matthew 7:16': 'Ye shall know them by their fruits',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them',
  'Titus 1:16': 'They profess that they know God; but in works they deny him',
  'Proverbs 6:16': 'These six things doth the LORD hate: yea, seven are an abomination unto him',
  'Proverbs 6:17': 'A proud look, a lying tongue, and hands that shed innocent blood',
  'Isaiah 10:1': 'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed',
  'Isaiah 10:2': 'To turn aside the needy from judgment, and to take away the right from the poor of my people',
  '1 Corinthians 5:11': 'if any man that is called a brother',
  '1 Corinthians 5:12': 'For what have I to do to judge them also that are without? do not ye judge them that are within?',
  '1 Corinthians 5:13': 'But them that are without God judgeth',
  'Matthew 22:37': 'Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind',
  'Matthew 22:39': 'And the second is like unto it, Thou shalt love thy neighbour as thyself',
  'Matthew 22:40': 'On these two commandments hang all the law and the prophets',
  'Romans 13:8': 'Owe no man any thing, but to love one another: for he that loveth another hath fulfilled the law',
  'Romans 13:10': 'Love worketh no ill to his neighbour: therefore love is the fulfilling of the law',
  'Matthew 5:44': 'Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you',
  'Matthew 5:45': 'for he maketh his sun to rise on the evil and on the good, and sendeth rain on the just and on the unjust',
  'Romans 12:17': 'Recompense to no man evil for evil',
  'Romans 12:18': 'If it be possible, as much as lieth in you, live peaceably with all men',
  'Romans 12:20': 'Therefore if thine enemy hunger, feed him; if he thirst, give him drink',
  'Romans 12:21': 'Be not overcome of evil, but overcome evil with good',
  'Matthew 5:13': 'Ye are the salt of the earth',
  'Matthew 5:14': 'Ye are the light of the world. A city that is set on an hill cannot be hid',
  'Matthew 5:16': 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven',
  'Ephesians 4:15': 'But speaking the truth in love, may grow up into him in all things',
  '1 John 3:18': 'let us not love in word, neither in tongue; but in deed and in truth',
  'Galatians 6:7': 'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap',
  'Galatians 6:9': 'And let us not be weary in well doing: for in due season we shall reap, if we faint not',
  'Galatians 6:10': 'As we have therefore opportunity, let us do good unto all men, especially unto them who are of the household of faith',
  'Isaiah 55:11': 'it shall not return unto me void, but it shall accomplish that which I please',
  'Proverbs 15:1': 'A soft answer turneth away wrath: but grievous words stir up anger',
  'Proverbs 16:7': 'When a man’s ways please the LORD, he maketh even his enemies to be at peace with him',
  'Matthew 5:9': 'Blessed are the peacemakers: for they shall be called the children of God',
  '2 Timothy 3:12': 'Yea, and all that will live godly in Christ Jesus shall suffer persecution',
  'John 15:18': 'If the world hate you, ye know that it hated me before it hated you',
  'John 15:20': 'If they have persecuted me, they will also persecute you; if they have kept my saying, they will keep yours also',
  'John 5:17': 'My Father worketh hitherto, and I work',
  'Deuteronomy 6:7': 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend',
};

const splitRef = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  return { book: m[1], ch: m[2], n: m[3] };
};

// Every double-quoted span standing beside the reference it cites.
const REF_SPAN = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (root) => {
  const out = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      REF_SPAN.lastIndex = 0;
      let g;
      while ((g = REF_SPAN.exec(node))) out.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(root, '');
  return out;
};

/** Every anchor.ref entry, with "Book c:v-w" expanded to one entry per verse. */
const anchoredRefs = (module) => {
  const set = new Set();
  for (const part of String(module.anchor.ref).split(';')) {
    const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!m) continue;
    const last = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= last; v += 1) set.add(`${m[1].trim()} ${m[2]}:${v}`);
  }
  return set;
};

// (a) THE MODULE EXISTS ONCE, AT ITS NUMBER
//
// NOT "as the last lesson" (amended 2026-10-21, DR-1159). As first written this
// block pinned `LIVING_LESSONS_MODULES[length - 1].id === ID` and
// `Math.max(...claimed) === 256` — a lesson's own gate pinning the SIZE of the
// catalog. It cost within hours of landing: ll257 broke both, so a green gate
// went red over a lesson it does not guard and nothing wrong with ll256, whose
// other 141 cases passed throughout. ll255's and ll254's gates assert no such
// thing, so this was never the convention. What stays true for good is that
// ll256 appears once and sits AFTER ll255; the claimed maximum is a floor.
describe('L256 exists exactly once, at its own number, dated the day it was spoken', () => {
  it('is in the catalog exactly once, after L255', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === 'll255-all-things-work-together-the-integrated-system-and-which-way-it-runs');
    expect(prev, 'L255 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L256 follows L255 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 256 and only 256, right after 255, and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 256)).toHaveLength(1);
    expect(claimed.includes(255), '256 follows 255 — no number was jumped').toBe(true);
    // a floor, not an equality: a later lesson raises the max and must not fail this
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(256);
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });

  it('carries 2026-10-21, the day it was spoken and its id landed, at or after L255’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-21');
    expect(LIVING_LESSONS_ADDED['ll255-all-things-work-together-the-integrated-system-and-which-way-it-runs'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('names Darrell as the one who spoke it, on the twenty-first of October, and carries his sentences', () => {
    expect(L.lesson.startsWith('This lesson was spoken into this house by Darrell on the twenty-first of October')).toBe(true);
    expect(L.lesson).toContain('rendered for its meaning');
    for (const his of [
      'the LORD’s release is for a neighbor',
      'we live in a mixed multitude of people here in America',
      'some of our neighbors claim to be Christian and kill our children and make laws against Yahweh’s Will',
      'how do we use the Word to love our communities in the Way He means',
      'what outcomes should we expect from The Way',
      'are always working',
    ]) expect(L.lesson, `drops his words: ${his}`).toContain(his);
  });

  it('renders his Samaritan line faithfully to the text: the Samaritan was the one who proved neighbor', () => {
    expect(L.lesson).toContain('the Samaritan was the one who proved neighbor');
    // and never says the good neighbor took care OF a Samaritan, which the text does not say
    expect(/took care of a Samaritan/i.test(whole)).toBe(false);
  });
});

// (b) EVERY QUOTED VERSE IS THE CORPUS, BYTE FOR BYTE
describe('L256 — every verse it stands on is the corpus, verbatim', () => {
  for (const [ref, text] of Object.entries(PINNED)) {
    it(`${ref} is quoted exactly as the corpus on disk has it`, () => {
      const { book, ch, n } = splitRef(ref);
      const v = corpusVerse(book, ch, n);
      expect(v, `${ref} resolves in the corpus`).toBeTruthy();
      expect(v.includes(norm(text)), `the pinned span is not in ${ref} as the corpus writes it`).toBe(true);
      expect(whole.includes(text), `the lesson does not carry ${ref}`).toBe(true);
    });
  }

  const spans = L ? spansOf(L) : [];

  it('quotes a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(250);
  });

  it('every referenced span anywhere in the module is verbatim in the verse it cites, case and marks included', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => corpusVerse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 80)}"`);
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every double-quoted span in a reader place stands beside its reference', () => {
    const loose = [];
    for (const k of PLACE_KEYS) {
      const quotes = (PLACES[k].match(/"[^"]*"/g) || []).length;
      const referenced = spansOf(PLACES[k]).length;
      if (quotes !== referenced) loose.push(`${k}: ${quotes} quoted, ${referenced} referenced`);
    }
    expect(loose).toEqual([]);
  });

  it('uses the corpus apostrophe inside every quotation', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });

  it('marks no elision and recites no record id in reader prose', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them, and never uses the generic in our own voice', () => {
    for (const u of ['because it is called the LORD’s release', 'They profess that they know God', 'Be not deceived; God is not mocked']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
    for (const k of PLACE_KEYS) {
      const ours = ourProseOnly(PLACES[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
    }
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from it, DR-0734)', () => {
    const anchored = anchoredRefs(L);
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r)), 'a verse is taught but missing from anchor.ref').toEqual([]);
    expect(anchored.has('Luke 10:25') && anchored.has('Luke 10:32'), 'the whole of Luke 10:25-37 that the lesson names').toBe(true);
  });
});

// (c) THE THREE DIRECTIONS, ON THE MODULE AND ON EACH BAND SEPARATELY
describe('L256 — TALK ABOUT IT TOGETHER, in all three directions, in every place', () => {
  it('the lesson and every band send the reader all three ways in the lesson’s own words', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it.each(PLACE_KEYS)('%s names TALK ABOUT IT TOGETHER and carries the skill and the rhythm', (k) => {
    const t = PLACES[k];
    expect(t).toContain('TALK ABOUT IT TOGETHER');
    expect(/listen (?:all the way )?to the (?:whole|end)/i.test(t), `${k} drops the listening skill`).toBe(true);
    expect(/retell|tell it back|in your own words/i.test(t), `${k} drops the retelling skill`).toBe(true);
    expect(/teach (?:them|each other|one verse)/i.test(t), `${k} drops teaching one verse back`).toBe(true);
    expect(/once today/i.test(t), `${k} drops the daily rhythm`).toBe(true);
    expect(/one friend this week/i.test(t), `${k} drops the one-friend-this-week rhythm`).toBe(true);
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line names that band while the pooled check still reads green', () => {
    const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);
    const friendless = sentences(L.levels.youth)
      .filter((s) => missingDirections(s).includes('friends'))
      .join(' ');
    expect(friendless).not.toBe(L.levels.youth);
    const mutated = { ...L, levels: { ...L.levels, youth: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is exactly the hazard (DR-0795)').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'youth', missing: ['friends'] }]);
  });
});

// (d) HIS SEVEN MOVES, IN HIS ORDER, IN ALL FIVE PLACES
describe('L256 — Darrell’s seven moves, kept distinct and in his order, everywhere', () => {
  const MARKERS = [
    'ONE. THE LORD’S RELEASE IS FOR A NEIGHBOR',
    'TWO. WHO IS MY NEIGHBOR',
    'THREE. A MIXED MULTITUDE',
    'FOUR. A CLAIM IS NOT A FRUIT',
    'FIVE. LOVE IN THE WAY HE MEANS',
    'SIX. WHAT TO EXPECT FROM THE WAY',
    'SEVEN. HE IS ALWAYS WORKING',
    'TALK ABOUT IT TOGETHER',
  ];

  it.each(PLACE_KEYS)('%s carries all seven movements and the close, in the same order', (k) => {
    const at = MARKERS.map((m) => PLACES[k].indexOf(m));
    expect(MARKERS.filter((m, i) => at[i] < 0), `${k} drops a movement`).toEqual([]);
    for (let i = 1; i < at.length; i += 1) {
      expect(at[i], `${k} has ${MARKERS[i]} out of order`).toBeGreaterThan(at[i - 1]);
    }
  });

  it.each(PLACE_KEYS)('%s carries his own words in its own register', (k) => {
    const t = PLACES[k];
    for (const phrase of ['release', 'neighbor', 'mixed multitude', 'claim', 'Yahweh', 'always working']) {
      expect(t.toLowerCase().includes(phrase.toLowerCase()), `${k} drops "${phrase}"`).toBe(true);
    }
  });

  it.each(PLACE_KEYS)('%s says whose the release is and who it is for, from Deuteronomy 15:2 itself', (k) => {
    expect(PLACES[k].includes('because it is called the LORD’s release') || PLACES[k].includes('Every creditor that lendeth ought unto his neighbour shall release it'), `${k} drops Deuteronomy 15:2`).toBe(true);
    expect(PLACES[k].includes('(Deuteronomy 15:2)')).toBe(true);
  });

  it.each(PLACE_KEYS)('%s teaches the Samaritan as the one who proved neighbor, beside the lawyer’s answer and the command', (k) => {
    const t = PLACES[k];
    expect(t.includes('the Samaritan was the one who proved neighbor') || t.includes('The Samaritan was the one who proved neighbor') || t.includes('in the role of the one who proved neighbor'), `${k} never names who proved neighbor`).toBe(true);
    expect(t.includes('"He that shewed mercy on him" (Luke 10:37)'), `${k} drops the lawyer’s answer`).toBe(true);
    expect(t.includes('(Luke 10:29)'), `${k} drops the lawyer’s question`).toBe(true);
    expect(t.includes('(John 4:9)'), `${k} drops the line between the peoples`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s carries the mixed multitude as the Word’s own phrase, under one law', (k) => {
    expect(PLACES[k].includes('(Exodus 12:38)'), `${k} drops Exodus 12:38`).toBe(true);
    expect(PLACES[k].includes('(Exodus 12:49)'), `${k} drops the one law`).toBe(true);
    expect(PLACES[k].includes('(Jeremiah 29:7)'), `${k} drops the peace of the city`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s closes on the Father and the Son always working (John 5:17)', (k) => {
    expect(PLACES[k].includes('"My Father worketh hitherto, and I work" (John 5:17)')).toBe(true);
    expect(/Hitherto means up to/.test(PLACES[k]), `${k} uses "hitherto" without its plain meaning`).toBe(true);
  });
});

// (e) THE HARD PART NEVER TRAVELS WITHOUT THE LOVE COMMAND
describe('L256 — the hard part is named plainly and never without the command to love', () => {
  const HARD = '(Matthew 7:21)';
  const LOVE = ['(Matthew 5:44)', '(Romans 12:21)'];

  /** Places that quote the hard verse WITHOUT both halves of the love command. */
  const loveless = (module) => {
    const places = { lesson: module.lesson, ...Object.fromEntries(BANDS.map((b) => [b, module.levels[b]])) };
    return Object.entries(places)
      .filter(([, t]) => String(t || '').includes(HARD) && !LOVE.every((x) => String(t || '').includes(x)))
      .map(([place]) => place);
  };

  it.each(PLACE_KEYS)('%s names the claim and the fruit by the Word', (k) => {
    expect(PLACES[k].includes(HARD), `${k} drops Matthew 7:21`).toBe(true);
    expect(PLACES[k].includes('"Ye shall know them by their fruits" (Matthew 7:16)'), `${k} drops the fruit test`).toBe(true);
    expect(PLACES[k].includes('hands that shed innocent blood'), `${k} drops Proverbs 6:17`).toBe(true);
  });

  it('no place hands the reader the hard half alone', () => {
    expect(loveless(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: deleting the enemy-love verse from one band names that band', () => {
    expect(L.levels.teen.includes('(Matthew 5:44)'), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, levels: { ...L.levels, teen: L.levels.teen.split('(Matthew 5:44)').join('(removed)') } };
    expect(mutated.levels.teen).not.toBe(L.levels.teen);
    expect(loveless(mutated)).toEqual(['teen']);
  });

  it('the adult lesson and the older bands teach where judging belongs (1 Corinthians 5:12-13)', () => {
    for (const k of ['lesson', 'youth', 'teen', 'senior']) {
      expect(PLACES[k].includes('(1 Corinthians 5:12)') && PLACES[k].includes('(1 Corinthians 5:13)'), `${k} drops the line between within and without`).toBe(true);
    }
    expect(PLACES.lesson).toContain('Naming the sin is not hatred of the neighbor');
  });

  it('states it as settled, not as two sides to pick from (DR-0098)', () => {
    expect(PLACES.lesson).toContain('The Word does not soften that, and neither do we');
    expect(PLACES.lesson).toContain('So this is settled');
    expect(/both sides|some say|others believe|scholars (?:debate|disagree)/i.test(ourProseOnly(whole))).toBe(false);
  });

  it('the child band carries the hard part gently: no killing in a six-year-old’s words, and a trusted grown-up named', () => {
    const ours = ourProseOnly(L.levels.child);
    expect(/\bkill/i.test(ours)).toBe(false);
    expect(ours).toContain('tell a grown-up you trust');
    expect(ours).toContain('He is the Judge, and we are not');
  });
});

// (f) BOTH PROMISED OUTCOMES, NEVER ONE
describe('L256 — what to expect from The Way: the harvest and the opposition, both promised', () => {
  const PEACE = '(Proverbs 16:7)';
  const OPPOSITION = '(2 Timothy 3:12)';

  const oneSided = (module) => {
    const places = { lesson: module.lesson, ...Object.fromEntries(BANDS.map((b) => [b, module.levels[b]])) };
    return Object.entries(places)
      .filter(([, t]) => String(t || '').includes(PEACE) !== String(t || '').includes(OPPOSITION))
      .map(([place]) => place);
  };

  it.each(PLACE_KEYS)('%s carries the harvest, the soft answer, the peace, and the persecution', (k) => {
    const t = PLACES[k];
    for (const ref of ['(Galatians 6:7)', '(Galatians 6:9)', '(Proverbs 15:1)', PEACE, '(Matthew 5:9)', OPPOSITION]) {
      expect(t.includes(ref), `${k} drops ${ref}`).toBe(true);
    }
  });

  it('no place promises one outcome without the other', () => {
    expect(oneSided(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: deleting the persecution promise from one band names that band', () => {
    expect(L.levels.senior.includes(OPPOSITION), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, levels: { ...L.levels, senior: L.levels.senior.split(OPPOSITION).join('(removed)') } };
    expect(oneSided(mutated)).toEqual(['senior']);
  });
});

// (g) FOUR BANDS, EACH CARRYING THE WHOLE MESSAGE (P60)
describe('L256 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it.each(BANDS)('%s clears its floor share of the adult lesson’s prose', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, youth: L.levels.youth.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('youth');
  });

  it('every band names its own lesson near its start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });

  it('the reading ladder ascends and the child band sits under the new-lesson ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(PLACES[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });

  it('the child band teaches the mixed multitude in a child’s own world', () => {
    const t = L.levels.child;
    expect(/Think about your school/.test(t)).toBe(true);
    expect(/other languages at home/.test(t)).toBe(true);
    expect(/A fruit is what a life makes/.test(t)).toBe(true);
  });
});

// (h) TWO STORIES, A WORKING QUIZ, AND NO DOUBLE-QUOTED SPAN IN A STORY
describe('L256 — two stories that teach this lesson, and a quiz that works', () => {
  const words = (s) => String(s).trim().split(/\s+/).length;

  it('carries exactly two parables, one light and one solemn, 180-320 words, with no quoted Scripture', () => {
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(String(s.body)).not.toMatch(/"/);
      expect(words(s.body)).toBeGreaterThanOrEqual(180);
      expect(words(s.body)).toBeLessThanOrEqual(320);
    }
  });

  it('each story’s verse is one the lesson is anchored on', () => {
    const anchored = anchoredRefs(L);
    for (const s of L.stories) {
      for (const part of s.verse.split(';')) {
        const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(part.trim());
        expect(m, `${s.title}: ${part}`).toBeTruthy();
        const last = m[4] ? Number(m[4]) : Number(m[3]);
        for (let v = Number(m[3]); v <= last; v += 1) expect(anchored.has(`${m[1]} ${m[2]}:${v}`), `${s.title}: ${m[1]} ${m[2]}:${v}`).toBe(true);
      }
    }
  });

  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the neighbor he had left out was the one who proved neighbor
    expect(/which one of them had been the good neighbor/.test(light.body)).toBe(true);
    // the hard part named calmly, revenge refused, the release kept, and the harvest not promised as applause
    expect(/without one insult/.test(solemn.body)).toBe(true);
    expect(/every seventh year they wrote off whatever was still owed/.test(solemn.body)).toBe(true);
    expect(/The law has not changed/.test(solemn.body)).toBe(true);
  });

  it('the quiz has 6-7 questions, answers are not all in one position, and every answer resolves', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.quiz.questions.length).toBeLessThanOrEqual(7);
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) {
      expect(q.options[q.answer]).toBeTruthy();
      expect(String(q.explain).length).toBeGreaterThan(20);
    }
  });

  it('the facilitator notes name the guard rails this lesson needs', () => {
    const notes = `${L.facilitator.howToRun}\n${L.facilitator.talkingPoints.join('\n')}`;
    expect(/do not let the hard part become a license to hate the neighbor/i.test(notes)).toBe(true);
    expect(/do not turn the hard part into a both-sides debate/i.test(notes)).toBe(true);
    expect(/do not promise that love always wins applause/i.test(notes)).toBe(true);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
  });
});
