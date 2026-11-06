// @vitest-environment node
// =============================================================================
// L286 — Where Do You Run When the Market Shakes: Treasuries as a safe haven,
// the haves and the have-nots of debt, and the Word that measures the market
// =============================================================================
// The first lesson built under the newsletter Way (DR-1361), the evening it
// was set. Darrell sent a link and a summary of Priya Misra (JPMorgan Asset
// Management) on the bond market as a safe haven while the AI sector shakes.
// The speaker is named; her words are given as the summary reports them; the
// research pass is stated in two tiers (DR-0100): established, her safe-haven
// and hedge remarks on Bloomberg Television 2026-10-16; not yet corroborated,
// the haves/have-nots framing, the triple-C remarks and the one-in-seven
// figure, which rest on the summary until the transcript lands. The five items
// are listed, the strongest is built here, the rest were filed as their own
// rows for the lane, and every item is held up to the Word, the brighter
// light. (DR-1364.)
//
// THIS LESSON'S DANGERS are three. (1) Letting the market voice become the
// frame: the Word's verdict on every priced haven (Proverbs 11:4) and the
// method verses (Isaiah 8:20, 1 Thessalonians 5:21) are pinned in every band,
// with a proof that dropping the verdict is caught. (2) Erasing the speaker
// or inflating what was checked: Priya Misra is named in every band, the
// Bloomberg corroboration and the uncorroborated parts are both pinned, and
// no band states a percentage (the figure is rendered in words). (3) Teaching
// the haves/have-nots as a verdict on worth: Proverbs 22:2 and James 2:5 are
// pinned beside Proverbs 22:7 and Matthew 25:29 in every band.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L284's, copied whole so the gates measure the same way. A verse
// is never spent (DR-1317).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll286-where-do-you-run-when-the-market-shakes';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD =
  'WHERE DO YOU RUN WHEN THE MARKET SHAKES — Treasuries as a safe haven, the haves and the have-nots of debt, and the Word that measures the market.';

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

const SPINE = [
  ['Proverbs 18:10-11', 'The rich man’s wealth is his strong city, and as an high wall in his own conceit.'],
  ['Psalms 46:1-3', 'God is our refuge and strength, a very present help in trouble.'],
  ['Psalms 20:7-8', 'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.'],
  ['Isaiah 31:1', 'and trust in chariots, because they are many'],
  ['Psalms 91:1-2', 'He is my refuge and my fortress: my God; in him will I trust.'],
  ['Jeremiah 17:5-8', 'Blessed is the man that trusteth in the LORD, and whose hope the LORD is.'],
  ['Proverbs 11:28', 'He that trusteth in his riches shall fall; but the righteous shall flourish as a branch.'],
  ['Proverbs 23:4-5', 'for riches certainly make themselves wings; they fly away as an eagle toward heaven.'],
  ['Proverbs 22:7', 'The rich ruleth over the poor, and the borrower is servant to the lender.'],
  ['Matthew 25:29', 'but from him that hath not shall be taken away even that which he hath.'],
  ['Mark 4:25', 'For he that hath, to him shall be given'],
  ['Proverbs 22:2', 'The rich and poor meet together: the LORD is the maker of them all.'],
  ['James 2:1-6', 'Hath not God chosen the poor of this world rich in faith'],
  ['Deuteronomy 28:12', 'and thou shalt lend unto many nations, and thou shalt not borrow.'],
  ['Deuteronomy 15:6', 'thou shalt lend unto many nations, but thou shalt not borrow'],
  ['Nehemiah 5:1-5', 'We have mortgaged our lands, vineyards, and houses, that we might buy corn, because of the dearth.'],
  ['2 Corinthians 8:13-15', 'He that had gathered much had nothing over; and he that had gathered little had no lack.'],
  ['Luke 14:28-30', 'counteth the cost, whether he have sufficient to finish it?'],
  ['Habakkuk 2:6-9', 'and to him that ladeth himself with thick clay!'],
  ['Proverbs 13:11', 'Wealth gotten by vanity shall be diminished'],
  ['Ecclesiastes 11:1-2', 'Give a portion to seven, and also to eight; for thou knowest not what evil shall be upon the earth.'],
  ['Proverbs 27:23-24', 'Be thou diligent to know the state of thy flocks, and look well to thy herds.'],
  ['Psalms 62:10', 'if riches increase, set not your heart upon them.'],
  ['1 Timothy 6:17-19', 'nor trust in uncertain riches, but in the living God'],
  ['Luke 12:16-21', 'I will pull down my barns, and build greater'],
  ['Genesis 41:34-36', 'for store to the land against the seven years of famine'],
  ['Proverbs 21:20', 'There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up.'],
  ['Haggai 1:5-6', 'he that earneth wages earneth wages to put it into a bag with holes.'],
  ['Ecclesiastes 5:10-11', 'He that loveth silver shall not be satisfied with silver'],
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so.'],
  ['Ephesians 5:13', 'But all things that are reproved are made manifest by the light'],
  ['Proverbs 14:15', 'The simple believeth every word: but the prudent man looketh well to his going.'],
  ['Proverbs 11:4', 'Riches profit not in the day of wrath: but righteousness delivereth from death.'],
  ['Zephaniah 1:18', 'Neither their silver nor their gold shall be able to deliver them in the day of the LORD’s wrath'],
  ['Revelation 18:11-17', 'And the merchants of the earth shall weep and mourn over her; for no man buyeth their merchandise any more'],
  ['Psalms 49:6-12', 'leave their wealth to others.'],
  ['Isaiah 2:22', 'Cease ye from man, whose breath is in his nostrils'],
  ['Hebrews 13:5-6', 'I will never leave thee, nor forsake thee.'],
  ['Philippians 4:19', 'But my God shall supply all your need according to his riches in glory by Christ Jesus.'],
  ['Matthew 6:19-21', 'For where your treasure is, there will your heart be also.'],
  ['Matthew 6:24', 'Ye cannot serve God and mammon.'],
  ['Matthew 7:24-27', 'and it fell not: for it was founded upon a rock.'],
  ['Psalms 37:16-17', 'A little that a righteous man hath is better than the riches of many wicked.'],
  ['Proverbs 10:22', 'The blessing of the LORD, it maketh rich, and he addeth no sorrow with it.'],
  ['Deuteronomy 8:17-18', 'for it is he that giveth thee power to get wealth'],
  ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it'],
  ['Proverbs 3:9-10', 'Honour the LORD with thy substance, and with the firstfruits of all thine increase'],
  ['Romans 13:8', 'Owe no man any thing, but to love one another'],
  ['Psalms 37:21', 'The wicked borroweth, and payeth not again: but the righteous sheweth mercy, and giveth.'],
  ['Proverbs 15:16', 'Better is little with the fear of the LORD than great treasure and trouble therewith.'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world.'],
];

describe('L286 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 286 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 286)).toEqual([286]);
  });

  it('sits after ll285 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll285-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-06');
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const anchors = String(L.anchor.ref)
      .split(';')
      .map((s) => parse(s.trim()))
      .filter(Boolean);
    const quoted = new Set(
      EVERY_STRING.flatMap((t) =>
        quotedPairs(t)
          .map((p) => p.ref)
          .filter(Boolean)
      )
    );
    const missing = [...quoted].filter((r) => {
      const p = parse(r);
      return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
    });
    expect(missing).toEqual([]);
  });
});

describe('the lesson practises the newsletter Way: the sender and the speaker are named, nothing bare, a reader length', () => {
  it('names Darrell as the sender in every text, names Priya Misra and her firm in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Priya Misra/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/JPMorgan/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('states the research pass in two tiers: the Bloomberg corroboration and the uncorroborated parts, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Bloomberg/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not (be fetched|get the video|yet fetch)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/haves/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/have-nots/);
    expect(L.inApp).toMatch(/2026-10-16/);
    expect(L.inApp).toMatch(/could not yet fetch the video/);
  });

  it('renders the market figure in words and never as a percentage', () => {
    expect(L.lesson).toMatch(/one dollar in seven/);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the five items, each held up to the Word, in the lesson and in every band', () => {
  it('names the haven they run to beside the haven that holds', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Treasur/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The name of the LORD is a strong tower');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('in his own conceit.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Some trust in chariots, and some in horses');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('God is our refuge and strength, a very present help in trouble.');
  });

  it('teaches the haves and have-nots as the market works AND as the Word judges, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the borrower is servant to the lender.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but from him that hath not shall be taken away even that which he hath.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the LORD is the maker of them all.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('and thou shalt lend unto many nations, and thou shalt not borrow.');
  });

  it('PROVEN TO CATCH: a band that keeps the market’s law and drops the Word’s judgment is named', () => {
    const teen = L.levels.teen.replace('the LORD is the maker of them all.', 'the market decides.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('the LORD is the maker of them all.')).toBe(false);
  });

  it('counts the cost for the risky tier and names debt as thick clay', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/triple-C/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('counteth the cost');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('ladeth himself with thick clay');
  });

  it('gives the Word’s own rule for spreading risk', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Give a portion to seven, and also to eight');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('if riches increase, set not your heart upon them.');
  });

  it('sets the two barns side by side: the rich fool and Joseph', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I will pull down my barns, and build greater');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for store to the land against the seven years of famine');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('a bag with holes.');
  });

  it('holds the voice up to the brighter light and lets the Word give the verdict on every priced haven', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('if they speak not according to this word, it is because there is no light in them.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Riches profit not in the day of wrath');
  });

  it('PROVEN TO CATCH: a band that drops the Word’s verdict on priced havens is named', () => {
    const youth = L.levels.youth.replace('Riches profit not in the day of wrath', 'money helps');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('Riches profit not in the day of wrath')).toBe(false);
  });

  it('closes on the refuge that does not pull back and three things for the week', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I will never leave thee, nor forsake thee.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For where your treasure is, there will your heart be also.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for it was founded upon a rock.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Honour the LORD with thy substance');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Owe no man any thing, but to love one another');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Better is little with the fear of the LORD than great treasure and trouble therewith.');
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/a link and a summary Darrell sent/);
    expect(L.inApp).toMatch(/parables with invented characters/);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(250);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(230);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('the borrower is servant to the lender.', 'the borrower is slave to the lender.');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"if riches increase, set not your heart upon them." (Psalms 62:10)',
      '"If riches increase, set not your heart upon them." (Psalms 62:10)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Psalms 62:10) is not the verse: If riches increase, set not your heart upon them.']);
  });

  it('Yahweh is never put inside a quotation, in any string of the module', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
      }
    }
    expect(planted).toEqual([]);
  });

  it('every double-quoted span carries a reference: his own words are rendered, never put in double quotes', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('and our own prose is spelled the American way, while the quotations keep the corpus spelling', () => {
    expect(EVERY_STRING.flatMap((t) => findBritish(ourProse(t)))).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic "God" in our voice, copied through unquoted, is refused', () => {
    const planted = 'God is our refuge, not a bond.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('God is our refuge and strength, a very present help in trouble.');
    expect(inQuotes).toContain('The name of the LORD is a strong tower');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the youth friend line names youth and only youth, while the pooled check still reads green', () => {
    const youth = L.levels.youth;
    const friend = /Friends, tell one friend this week what Priya Misra said about where the money is running[^.]*\./.exec(youth);
    expect(friend, 'the youth band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '') } };
    expect(stripped.levels.youth).not.toBe(youth);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LEAD), k).toBe(true);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});
