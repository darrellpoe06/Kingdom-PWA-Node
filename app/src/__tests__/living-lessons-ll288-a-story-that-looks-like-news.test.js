// @vitest-environment node
// =============================================================================
// L288 — A Story That Looks Like News: the agent who was never pulled over,
// the federal watch that is real, and the Word on the ruler who bears the sword
// =============================================================================
// The third send read under the newsletter Way (DR-1361) the evening it was
// set, and the one on which the light examined the send itself. The research
// pass found no record of the case, the agent, the officers, the department,
// the firings or the settlement, and found the narrated-story genre the video
// belongs to; so the lesson says so plainly (DR-0100), credits the real
// federal process the video borrowed (pattern-or-practice, consent decrees
// and monitors, the accountability database and its 2025 shutdown, qualified
// immunity), and holds all of it up to the Word on the ruler who bears the
// sword, the false report, the two or three witnesses and the housetops.
// (DR-1371.)
//
// THIS LESSON'S DANGERS are three. (1) Teaching the story as fact: every band
// says the record is empty and names the genre, with Exodus 23:1 and
// Deuteronomy 19:15 pinned, and a proof that dropping the "story, not an
// event" verdict is caught. (2) Swinging to contempt for the office: Romans
// 13:3-4 whole and Luke 3:14 are pinned in every band, with a proof that
// dropping "minister of God to thee for good" is caught. (3) Letting the real
// reforms be dismissed with the fake case: the federal process is named with
// its basis in every band.
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

const ID = 'll288-a-story-that-looks-like-news';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD =
  'A STORY THAT LOOKS LIKE NEWS — the agent who was never pulled over, the federal watch that is real, and the Word on the ruler who bears the sword.';

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
  ['Exodus 23:1-8', 'Thou shalt not raise a false report'],
  ['Proverbs 14:15', 'The simple believeth every word: but the prudent man looketh well to his going.'],
  ['Proverbs 18:17', 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.'],
  ['Deuteronomy 19:15', 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.'],
  ['Jeremiah 23:16', 'they speak a vision of their own heart, and not out of the mouth of the LORD.'],
  ['Ezekiel 13:6', 'They have seen vanity and lying divination'],
  ['2 Timothy 4:3-4', 'they shall turn away their ears from the truth, and shall be turned unto fables.'],
  ['Proverbs 13:5', 'A righteous man hateth lying'],
  ['Proverbs 12:17', 'He that speaketh truth sheweth forth righteousness: but a false witness deceit.'],
  ['Proverbs 14:25', 'A true witness delivereth souls: but a deceitful witness speaketh lies.'],
  [
    'Ecclesiastes 8:11',
    'Because sentence against an evil work is not executed speedily, therefore the heart of the sons of men is fully set in them to do evil.',
  ],
  ['Habakkuk 1:4', 'the law is slacked, and judgment doth never go forth'],
  ['Amos 5:12', 'they afflict the just, they take a bribe, and they turn aside the poor in the gate from their right.'],
  ['Proverbs 29:2', 'when the wicked beareth rule, the people mourn.'],
  ['Romans 13:1-4', 'For he is the minister of God to thee for good.'],
  ['1 Peter 2:13-14', 'for the punishment of evildoers, and for the praise of them that do well.'],
  ['2 Samuel 23:3-4', 'He that ruleth over men must be just, ruling in the fear of God.'],
  ['Luke 3:14', 'Do violence to no man, neither accuse any falsely; and be content with your wages.'],
  ['Exodus 18:21', 'able men, such as fear God, men of truth, hating covetousness'],
  ['Deuteronomy 16:18-20', 'Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift'],
  ['2 Chronicles 19:6-7', 'Take heed what ye do: for ye judge not for man, but for the LORD'],
  ['Deuteronomy 17:18-20', 'That his heart be not lifted up above his brethren'],
  ['Deuteronomy 1:16-17', 'hear the small as well as the great; ye shall not be afraid of the face of man'],
  ['Isaiah 1:23-26', 'I will restore thy judges as at the first'],
  ['Proverbs 25:5', 'Take away the wicked from before the king, and his throne shall be established in righteousness.'],
  ['Psalms 101:3-7', 'He that worketh deceit shall not dwell within my house'],
  ['Luke 12:2-3', 'whatsoever ye have spoken in darkness shall be heard in the light'],
  ['John 3:20-21', 'For every one that doeth evil hateth the light, neither cometh to the light'],
  ['Luke 8:17', 'For nothing is secret, that shall not be made manifest'],
  ['Ephesians 5:11', 'have no fellowship with the unfruitful works of darkness, but rather reprove them.'],
  ['Deuteronomy 19:16-19', 'Then shall ye do unto him, as he had thought to have done unto his brother'],
  ['Exodus 20:16', 'Thou shalt not bear false witness against thy neighbour.'],
  ['Proverbs 19:5', 'A false witness shall not be unpunished, and he that speaketh lies shall not escape.'],
  ['Isaiah 10:1-2', 'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed'],
  ['Psalms 94:20-21', 'Shall the throne of iniquity have fellowship with thee, which frameth mischief by a law?'],
  ['John 18:22-23', 'If I have spoken evil, bear witness of the evil: but if well, why smitest thou me?'],
  ['Acts 22:25', 'Is it lawful for you to scourge a man that is a Roman, and uncondemned?'],
  ['Acts 16:37-39', 'let them come themselves and fetch us out.'],
  ['Matthew 18:15-17', 'in the mouth of two or three witnesses every word may be established.'],
  ['1 Timothy 5:19-21', 'Against an elder receive not an accusation, but before two or three witnesses.'],
  ['Proverbs 11:14', 'in the multitude of counsellors there is safety.'],
  ['Proverbs 15:22', 'Without counsel purposes are disappointed'],
  ['Leviticus 19:15', 'but in righteousness shalt thou judge thy neighbour.'],
  ['Proverbs 16:12', 'It is an abomination to kings to commit wickedness: for the throne is established by righteousness.'],
  ['Proverbs 20:28', 'Mercy and truth preserve the king'],
  ['Psalms 72:4', 'shall break in pieces the oppressor.'],
  ['Jeremiah 22:3', 'deliver the spoiled out of the hand of the oppressor'],
  ['Ezekiel 34:2-4', 'with force and with cruelty have ye ruled them.'],
  ['Micah 3:9-11', 'The heads thereof judge for reward'],
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so.'],
  ['John 8:32', 'And ye shall know the truth, and the truth shall make you free.'],
  ['Proverbs 28:13', 'He that covereth his sins shall not prosper'],
  ['Numbers 32:23', 'be sure your sin will find you out.'],
  ['Proverbs 24:23-25', 'He that saith unto the wicked, Thou art righteous; him shall the people curse'],
  ['Proverbs 21:15', 'It is joy to the just to do judgment'],
  ['Proverbs 30:8', 'Remove far from me vanity and lies'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world.'],
];

describe('L288 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 288 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 288)).toEqual([288]);
  });

  it('sits after ll287 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll287-'));
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

describe('the lesson practises the newsletter Way: the sender named, the record searched, the verdict said, a reader length', () => {
  it('names Darrell as the sender and the video’s own names in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Marcus Troy/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Deerfield/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('says in every text that the record is empty and the case is a story, not an event, and names the genre', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/found nothing|found no (record|FBI agent|Agent)|no record of/i);
    for (const k of PLACES)
      expect(TEXTS[k], k).toMatch(
        /a story,? (and )?not an event|story and not an event|story, not an event|not teach it as (one|something that really happened)/i
      );
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/staged skit|pretend show|paid actor/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not be fetched|could not get the video/);
    expect(L.inApp).toMatch(/could not find the case/);
  });

  it('PROVEN TO CATCH: a band that drops the verdict that the case is a story is named', () => {
    const youth = L.levels.youth.replace('this is a story, not an event, and this lesson does not teach it as one', 'this happened');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('this is a story, not an event')).toBe(false);
  });

  it('credits the real federal process with its basis in every text, and states no percentage', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Justice Department|government really can watch over/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/database/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/shut down/);
    expect(L.lesson).toMatch(/1994 crime bill/);
    expect(L.lesson).toMatch(/consent decree/);
    expect(L.lesson).toMatch(/not verified in this pass/);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(L.lesson).toMatch(/seventeen officers/);
    expect(L.lesson).toMatch(/over twelve million dollars/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure of the story, the office and the citizen, in the lesson and in every band', () => {
  it('opens the law of evidence on the send itself', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not raise a false report');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The simple believeth every word: but the prudent man looketh well to his going.');
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain('at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('they speak a vision of their own heart');
  });

  it('names the hunger the story feeds without excusing the lie', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/hungry|hunger|ache/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('when the wicked beareth rule, the people mourn.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/fake meal|counterfeit meal/);
  });

  it('teaches the sword as a ministry held on Yahweh’s terms, both halves of Romans 13, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For rulers are not a terror to good works, but to the evil.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For he is the minister of God to thee for good.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Do violence to no man, neither accuse any falsely; and be content with your wages.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('able men, such as fear God, men of truth, hating covetousness');
  });

  it('PROVEN TO CATCH: a band that keeps the terror and drops the ministry for good is named', () => {
    const teen = L.levels.teen.replace('For he is the minister of God to thee for good.', 'He is powerful.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('For he is the minister of God to thee for good.')).toBe(false);
  });

  it('puts the ruler under the law and the watch in the Word’s own words', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('That his heart be not lifted up above his brethren');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('hear the small as well as the great');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I will restore thy judges as at the first');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that worketh deceit shall not dwell within my house');
  });

  it('runs the camera policy from the housetops and judges the false charge', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('whatsoever ye have spoken in darkness shall be heard in the light');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For nothing is secret, that shall not be made manifest');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not bear false witness against thy neighbour.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('A false witness shall not be unpunished');
  });

  it('gives Jesus and Paul as the model under a wrongful hand: no violence, no silence, the record made', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('why smitest thou me?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Is it lawful for you to scourge a man that is a Roman, and uncondemned?');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/did not (hit back|swing|fight)|Neither of them swung|Neither swung|No violence, no silence/);
  });

  it('grounds citizen review in two or three witnesses and the multitude of counsellors', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('two or three witnesses');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('in the multitude of counsellors there is safety.');
  });

  it('holds both portraits of rule and the whole video up to the brighter light', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('shall break in pieces the oppressor.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('with force and with cruelty');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And ye shall know the truth, and the truth shall make you free.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('be sure your sin will find you out.');
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
    const broken = L.lesson.replace(
      'Do violence to no man, neither accuse any falsely; and be content with your wages.',
      'Do violence to no man, neither accuse any falsely; and be happy with your wages.'
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"whatsoever ye have spoken in darkness shall be heard in the light" (Luke 12:3)',
      '"Whatsoever ye have spoken in darkness shall be heard in the light" (Luke 12:3)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Luke 12:3) is not the verse: Whatsoever ye have spoken in darkness shall be heard in the light']);
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
    const planted = 'God gave the officer the sword for good.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('For he is the minister of God to thee for good.');
    expect(inQuotes).toContain('for ye judge not for man, but for the LORD');
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
    const friend = /Friends, tell one friend this week what the research pass found about the agent who was never pulled over[^.]*\./.exec(youth);
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
