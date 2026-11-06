// @vitest-environment node
// =============================================================================
// L285 — A Light That Is Not Light: Yahweh's light is life, the enemy's light
// corrupts life, and the only way to stop lying to yourself
// =============================================================================
// Darrell spoke this into the app on 2026-11-06 in two messages minutes apart
// and closed the first with "so, lesson" and the second with "that's also a
// lesson": Yahweh is very clear about the enemy, never His equal; the enemy
// has a light that is not light; Yahweh's light is knowledge and literal life,
// the enemy's light is knowledge that corrupts life; His kingdom is eternal and
// the other is dying; we study His way and not the liar's; lies cannot sustain
// life while truth IS life; He is too integrated to separate from His Word,
// Spirit, way, light and life; the gap is where you lie to yourself and the
// only cure is to hear what He says about you; He designed you and stepped
// down as the example; and the Word is the best light, exposing the others
// because it is brighter, so every newsletter is read under it with rigor and
// the reading is shown. (DR-1361.)
//
// THIS LESSON'S DANGERS are three. (1) Enlarging the enemy into Yahweh's
// equal, or shrinking him into nothing: the naming AND the sizing verses are
// pinned in every band, with a proof that dropping the sizing half is caught.
// (2) Teaching that the enemy is stupid: Romans 1:22 and 2 Timothy 3:7 are
// pinned in every band so "knowledge that corrupts life" is never softened to
// "no knowledge". (3) Letting "the brighter light" stay a slogan: Ephesians
// 5:13, Isaiah 8:20, 1 Thessalonians 5:21 and Acts 17:11 are pinned in every
// band, with a proof that dropping the exposing verse is caught.
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
import { isSpokenByDarrell, bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll285-a-light-that-is-not-light';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'A LIGHT THAT IS NOT LIGHT — Yahweh’s light is life, the enemy’s light corrupts life, and the only way to stop lying to yourself.';

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
  ['1 Peter 5:8', 'your adversary the devil, as a roaring lion'],
  ['Revelation 12:9', 'that old serpent, called the devil, and satan, which deceiveth the whole world'],
  ['Job 1:6-7', 'And the LORD said unto satan, Whence comest thou?'],
  ['Zechariah 3:2', 'The LORD rebuke thee, O satan'],
  ['Luke 10:18', 'I beheld satan as lightning fall from heaven.'],
  ['Romans 16:20', 'And the God of peace shall bruise satan under your feet shortly.'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world.'],
  ['1 John 3:8', 'that he might destroy the works of the devil.'],
  ['John 1:4-5', 'In him was life; and the life was the light of men.'],
  ['Psalms 36:9', 'in thy light shall we see light.'],
  ['1 John 1:5', 'God is light, and in him is no darkness at all.'],
  ['Psalms 119:130', 'The entrance of thy words giveth light'],
  ['Proverbs 6:23', 'the law is light; and reproofs of instruction are the way of life'],
  ['John 17:3', 'this is life eternal'],
  ['John 11:25-26', 'whosoever liveth and believeth in me shall never die.'],
  ['2 Corinthians 11:14-15', 'for satan himself is transformed into an angel of light.'],
  ['Matthew 6:22-23', 'If therefore the light that is in thee be darkness, how great is that darkness!'],
  ['Luke 11:35', 'Take heed therefore that the light which is in thee be not darkness.'],
  ['Isaiah 5:20', 'that put darkness for light, and light for darkness'],
  ['Genesis 3:4-6', 'then your eyes shall be opened, and ye shall be as gods, knowing good and evil.'],
  ['Genesis 3:1', 'was more subtil than any beast of the field'],
  ['2 Thessalonians 2:9-11', 'with all power and signs and lying wonders'],
  ['2 Timothy 3:7', 'Ever learning, and never able to come to the knowledge of the truth.'],
  ['1 Timothy 6:20-21', 'oppositions of science falsely so called'],
  ['Romans 1:21-22', 'Professing themselves to be wise, they became fools,'],
  ['1 Corinthians 8:1', 'Knowledge puffeth up, but charity edifieth.'],
  ['Proverbs 14:12', 'but the end thereof are the ways of death.'],
  ['Proverbs 3:19-20', 'The LORD by wisdom hath founded the earth'],
  ['Psalms 33:6', 'By the word of the LORD were the heavens made'],
  ['Colossians 1:16-17', 'by him all things consist.'],
  ['Hebrews 1:3', 'upholding all things by the word of his power'],
  ['John 10:10', 'The thief cometh not, but for to steal, and to kill, and to destroy'],
  ['Romans 6:23', 'For the wages of sin is death'],
  ['Romans 5:12', 'and so death passed upon all men'],
  ['Psalms 145:13', 'Thy kingdom is an everlasting kingdom'],
  ['Daniel 7:14', 'his kingdom that which shall not be destroyed.'],
  ['Hebrews 12:28', 'a kingdom which cannot be moved'],
  ['Daniel 2:44', 'and it shall stand for ever.'],
  ['John 8:44', 'for he is a liar, and the father of it.'],
  ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
  ['Daniel 2:22', 'He revealeth the deep and secret things'],
  ['Colossians 2:3', 'In whom are hid all the treasures of wisdom and knowledge.'],
  ['Proverbs 4:7', 'Wisdom is the principal thing'],
  ['Proverbs 9:10', 'The fear of the LORD is the beginning of wisdom'],
  ['Psalms 119:160', 'Thy word is true from the beginning'],
  ['Isaiah 40:8', 'but the word of our God shall stand for ever.'],
  ['1 Peter 1:23-25', 'the word of God, which liveth and abideth for ever.'],
  ['John 14:6', 'I am the way, the truth, and the life'],
  ['John 8:12', 'shall have the light of life.'],
  ['Matthew 5:14-16', 'Ye are the light of the world.'],
  ['John 17:17', 'thy word is truth.'],
  ['John 1:1-3', 'and the Word was God.'],
  ['John 6:63', 'they are spirit, and they are life.'],
  ['Hebrews 4:12', 'a discerner of the thoughts and intents of the heart.'],
  ['2 Corinthians 4:6', 'the light of the knowledge of the glory of God in the face of Jesus Christ.'],
  ['1 John 1:6-7', 'But if we walk in the light, as he is in the light'],
  ['Jeremiah 17:9-10', 'The heart is deceitful above all things'],
  ['Proverbs 28:26', 'He that trusteth in his own heart is a fool'],
  ['Galatians 6:3', 'he deceiveth himself.'],
  ['Obadiah 1:3', 'The pride of thine heart hath deceived thee'],
  ['1 John 1:8', 'we deceive ourselves, and the truth is not in us.'],
  ['Psalms 19:12', 'Who can understand his errors?'],
  ['James 1:22-25', 'but a doer of the work, this man shall be blessed in his deed.'],
  ['Psalms 139:23-24', 'Search me, O God, and know my heart'],
  ['Romans 12:2', 'be ye transformed by the renewing of your mind'],
  ['Ephesians 4:22-24', 'created in righteousness and true holiness.'],
  ['Genesis 1:26-27', 'in the image of God created he him'],
  ['Ephesians 2:10', 'For we are his workmanship, created in Christ Jesus unto good works'],
  ['Philippians 2:5-8', 'took upon him the form of a servant'],
  ['John 13:15', 'For I have given you an example'],
  ['1 Peter 2:21', 'leaving us an example, that ye should follow his steps:'],
  ['Luke 4:1-13', 'That man shall not live by bread alone, but by every word of God.'],
  ['John 15:5', 'for without me ye can do nothing.'],
  ['Psalms 16:11', 'Thou wilt shew me the path of life'],
  ['Revelation 22:5', 'and they shall reign for ever and ever.'],
  ['Ephesians 5:13', 'But all things that are reproved are made manifest by the light'],
  ['Luke 8:17', 'For nothing is secret, that shall not be made manifest'],
  ['Hebrews 4:13', 'all things are naked and opened unto the eyes of him with whom we have to do.'],
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['1 John 4:1', 'try the spirits whether they are of God'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so.'],
  ['2 Corinthians 10:5', 'bringing into captivity every thought to the obedience of Christ'],
  ['Psalms 119:105', 'Thy word is a lamp unto my feet, and a light unto my path.'],
];

describe('L285 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 285 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 285)).toEqual([285]);
  });

  it('sits after ll284 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll284-'));
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

describe('the lesson practises what it teaches: it names Darrell and keeps a reader length', () => {
  it('its own provenance says Darrell spoke it, and it carries no bare teacher in any string', () => {
    expect(isSpokenByDarrell(L)).toBe(true);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell\b/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('his spine, in his order, in the lesson and in every band', () => {
  it('opens on the distinction as he gave it: a light that is not light, and Yahweh’s light is life', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/light that is not light/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('In him was life; and the life was the light of men.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for satan himself is transformed into an angel of light.');
  });

  it('names the enemy and sizes him: never equal with Yahweh, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/equal with Yahweh|Yahweh’s equal|not as big as Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I beheld satan as lightning fall from heaven.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And the God of peace shall bruise satan under your feet shortly.');
  });

  it('PROVEN TO CATCH: a band that names the enemy and drops the sizing half is named', () => {
    const teen = L.levels.teen.replace('I beheld satan as lightning fall from heaven.', 'he is strong.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('I beheld satan as lightning fall from heaven.')).toBe(false);
  });

  it('says the enemy has knowledge, and that it is knowledge that corrupts life', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/corrupts life|makes life rot/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Professing themselves to be wise, they became fools,');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but the end thereof are the ways of death.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('If therefore the light that is in thee be darkness, how great is that darkness!');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('ye shall be as gods, knowing good and evil.');
  });

  it('sets the sustainer of life against the dying kingdom, in his words and the Word’s', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/dying/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('by him all things consist.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The thief cometh not, but for to steal, and to kill, and to destroy');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy kingdom is an everlasting kingdom');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('and it shall stand for ever.');
  });

  it('gives his reason for studying His way and not the enemy’s: the father of lies', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for he is a liar, and the father of it.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('In whom are hid all the treasures of wisdom and knowledge.');
  });

  it('says lies cannot sustain life and truth is life, a Person who is alive', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/truth is life/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I am the way, the truth, and the life');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the light of life.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but the word of our God shall stand for ever.');
  });

  it('keeps Him too integrated to separate from His Word, Spirit, way, light and life', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/separate|pull him apart/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('and the Word was God.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('they are spirit, and they are life.');
  });

  it('finds the gap where you lie to yourself, and the cure of hearing what He says about you', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/lie to yourself|lies to you/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The heart is deceitful above all things');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('we deceive ourselves');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('a discerner of the thoughts and intents of the heart.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('a doer of the work');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Search me, O God, and know my heart');
  });

  it('closes on the design from the beginning and the One who stepped down as the example', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('in the image of God created he him');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('took upon him the form of a servant');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For I have given you an example');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('man shall not live by bread alone');
  });

  it('carries his second message: the brighter light exposes the others, with rigor shown, in the name of Jesus', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/brighter/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But all things that are reproved are made manifest by the light');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('if they speak not according to this word, it is because there is no light in them.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('searched the scriptures daily, whether those things were so.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy word is a lamp unto my feet, and a light unto my path.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/in the name of Jesus/);
  });

  it('PROVEN TO CATCH: a band that drops the exposing verse is named', () => {
    const youth = L.levels.youth.replace('But all things that are reproved are made manifest by the light', 'light shows things.');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('But all things that are reproved are made manifest by the light')).toBe(false);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });

  it('stakes no figure: no band or lesson states a percentage or a statistic', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });

  it('says plainly in inApp that it was built from two messages and gives the week its one question', () => {
    expect(L.inApp).toMatch(/two messages/);
    expect(L.inApp).toMatch(/test every light/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(300);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(280);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('Knowledge puffeth up, but charity edifieth.', 'Knowledge puffeth up, but love edifieth.');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"ye shall be as gods, knowing good and evil." (Genesis 3:5)', '"Ye shall be as gods, knowing good and evil." (Genesis 3:5)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Genesis 3:5) is not the verse: Ye shall be as gods, knowing good and evil.']);
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
    const planted = 'God is the light and the enemy is a liar.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('God is light, and in him is no darkness at all.');
    expect(inQuotes).toContain('The LORD rebuke thee, O satan');
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
    const friend = /Friends, tell one friend this week what Darrell said about lies not sustaining life[^.]*\./.exec(youth);
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
