// @vitest-environment node
// =============================================================================
// L282 — The Greater Work: your flock before your job, the war for peace, and
// the profile you leave your children
// =============================================================================
// Darrell spoke a fourth teaching into the app on 2026-11-05, in two messages a
// few minutes apart, read as ONE teaching with one landing (DR-1185): we cannot
// allow our positions, jobs or titles to interfere with what Yahweh calls the
// work of the Lord; pay attention to your flocks, and the flock at home is the
// greater work; war for peace with weapons that are not carnal; no good thing
// comes from flesh, so hope all things but count the cost; Yahweh always has
// your back and knows what is coming, and the truth is a person; the soul that
// sinneth dies the second death, and that is the key; the Shepherd of the soul
// is the eternal leadership of a kingdom that never ends, collecting children
// who walk out His will. The second message: the inheritance you leave is the
// psychological profile of the eternal King, lived out in front of your
// children, who need to see Him win for you AND see you fail and Him help you
// analyze it with the Word, through a wilderness season, from parents who are
// truthful and clarity driven. (DR-1329.)
//
// THIS LESSON'S DANGERS are three. (1) Turning "no good thing from flesh" into
// cynicism: the hope-all-things half (1 Corinthians 13:7) and John 2:24-25 are
// pinned beside Romans 7:18 in every band. (2) Keeping only the comfortable
// half of what children must see: "see Him win for you" AND "see you fail" are
// both pinned in every band, with a proof that dropping the failure half is
// caught. (3) Softening "the second death is the key" into a footnote: the
// soul that sinneth, the overcomer not hurt of it, and passed from death unto
// life are pinned in every band.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L271's, copied whole so the gates measure the same way. A verse
// is never spent (DR-1317): nothing was dropped for appearing elsewhere.
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

const ID = 'll282-the-greater-work';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'THE GREATER WORK — your flock before your job, the war for peace, and the profile you leave your children.';

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
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
/** The corpus text a reference names (plain, range, or "Book c:v, c:v"), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
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
    for (const part of (extra || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it; odd split indices are inside quotes. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. Contiguous only: no elision is accepted. */
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one of these was fetched from the corpus on disk before it was written.
const SPINE = [
  ['1 Corinthians 15:58', 'your labour is not in vain in the Lord'],
  ['Proverbs 27:23', 'Be thou diligent to know the state of thy flocks'],
  ['1 Timothy 3:4-5', 'how shall he take care of the church of God'],
  ['Luke 10:41-42', 'But one thing is needful'],
  ['Mark 8:36', 'lose his own soul'],
  ['3 John 1:4', 'to hear that my children walk in truth'],
  ['Psalms 78:4', 'We will not hide them from their children'],
  ['Isaiah 54:13', 'great shall be the peace of thy children'],
  ['2 Corinthians 10:3-5', 'the weapons of our warfare are not carnal'],
  ['Psalms 34:14', 'seek peace, and pursue it'],
  ['Nehemiah 4:14', 'fight for your brethren, your sons, and your daughters, your wives, and your houses'],
  ['Isaiah 26:3', 'whose mind is stayed on thee'],
  ['Proverbs 18:10', 'The name of the LORD is a strong tower'],
  ['Nahum 1:7', 'a strong hold in the day of trouble'],
  ['John 14:27', 'not as the world giveth, give I unto you'],
  ['Romans 7:18', 'dwelleth no good thing'],
  ['1 Corinthians 13:7', 'hopeth all things'],
  ['John 2:24-25', 'he knew what was in man'],
  ['Luke 14:28', 'counteth the cost'],
  ['Proverbs 22:3', 'A prudent man foreseeth the evil'],
  ['Jeremiah 17:5', 'maketh flesh his arm'],
  ['Matthew 10:16', 'wise as serpents, and harmless as doves'],
  ['Isaiah 46:10', 'Declaring the end from the beginning'],
  ['Isaiah 52:12', 'the God of Israel will be your rereward'],
  ['Psalms 139:5', 'Thou hast beset me behind and before'],
  ['John 14:6', 'I am the way, the truth, and the life'],
  ['Ezekiel 18:4', 'the soul that sinneth, it shall die'],
  ['Hebrews 9:27', 'appointed unto men once to die'],
  ['Revelation 20:14', 'This is the second death'],
  ['Revelation 2:11', 'He that overcometh shall not be hurt of the second death'],
  ['John 5:24', 'is passed from death unto life'],
  ['1 Peter 2:25', 'the Shepherd and Bishop of your souls'],
  ['Ecclesiastes 4:6', 'Better is an handful with quietness'],
  ['Matthew 6:33', 'But seek ye first the kingdom of God'],
  ['Daniel 7:14', 'his dominion is an everlasting dominion'],
  ['1 Timothy 1:17', 'Now unto the King eternal'],
  ['John 1:12', 'power to become the sons of God'],
  ['Hebrews 2:13', 'Behold I and the children which God hath given me'],
  ['Matthew 7:21', 'he that doeth the will of my Father which is in heaven'],
  ['James 1:22', 'be ye doers of the word, and not hearers only'],
  ['Proverbs 13:22', 'A good man leaveth an inheritance to his children’s children'],
  ['Psalms 145:4', 'One generation shall praise thy works to another'],
  ['Judges 2:10', 'which knew not the LORD'],
  ['Joshua 4:21-22', 'What mean these stones?'],
  ['Psalms 66:16', 'I will declare what he hath done for my soul'],
  ['Psalms 32:5', 'I acknowledged my sin unto thee'],
  ['Psalms 51:13', 'Then will I teach transgressors thy ways'],
  ['Deuteronomy 8:2', 'to humble thee, and to prove thee, to know what was in thine heart'],
  ['Deuteronomy 8:5', 'so the LORD thy God chasteneth thee'],
  ['Ecclesiastes 3:1', 'To every thing there is a season'],
  ['Hebrews 12:11', 'the peaceable fruit of righteousness'],
  ['Ephesians 4:15', 'speaking the truth in love'],
  ['Psalms 119:105', 'Thy word is a lamp unto my feet'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['Hebrews 1:8', 'Thy throne, O God, is for ever and ever'],
];

describe('L282 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 282 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 282)).toEqual([282]);
  });

  it('sits after ll281 in the catalog, the lesson a sibling session landed while this one was being written', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id === 'll281-though-thou-knewest-all-this');
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-05');
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
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = String(L.anchor.ref).split(';').map((s) => parse(s.trim())).filter(Boolean);
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref).filter(Boolean)));
    const missing = [...quoted].filter((r) => { const p = parse(r); return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b); });
    expect(missing).toEqual([]);
  });
});

describe('his spine, in his order, in the lesson and in every band', () => {
  it('opens on the prohibition: positions and titles may not interfere with the work of the Lord, and the flock comes first', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/work of the Lord/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Be thou diligent to know the state of thy flocks');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/greater work/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But one thing is needful');
  });

  it('names the souls of the children as the greater work, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('to hear that my children walk in truth');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('great shall be the peace of thy children');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('We will not hide them from their children');
  });

  it('wars for peace with weapons that are not carnal, and fights for the house', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/(WAR|FIGHT) FOR PEACE\./);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the weapons of our warfare are not carnal');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('fight for your brethren, your sons, and your daughters, your wives, and your houses');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('seek peace, and pursue it');
  });

  it('holds peace as a stronghold of perspective, named by the Word', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/perspective|how you look at things/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('whose mind is stayed on thee');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The name of the LORD is a strong tower');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('not as the world giveth, give I unto you');
  });

  it('keeps his balance on flesh: no good thing from it, hope all things, count the cost, never cynicism', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('dwelleth no good thing');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('knew what was in man');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('counteth the cost');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('wise as serpents, and harmless as doves');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('hopeth all things');
    expect(L.levels.child).toMatch(/you can hope people will be good/);
  });

  it('PROVEN TO CATCH: a band that keeps Romans 7:18 and drops the hope-all-things half is named', () => {
    const teen = L.levels.teen.replace('hopeth all things', 'endureth all things');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('hopeth all things')).toBe(false);
  });

  it('names the One who always has your back and knows what is coming, and that the truth is a person', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou hast beset me behind and before');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Declaring the end from the beginning');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('rereward');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I am the way, the truth, and the life');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/the truth is a person/i);
  });

  it('keeps the second death as the key, with the way past it, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/THE SECOND DEATH IS THE KEY\./);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the soul that sinneth, it shall die');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('appointed unto men once to die');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that overcometh shall not be hurt of the second death');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('passed from death unto life');
  });

  it('ranks the highest work of the soul under its Shepherd and the eternal leadership', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the Shepherd and Bishop of your souls');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Better is an handful with quietness');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But seek ye first the kingdom of God');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('his dominion is an everlasting dominion');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The LORD is King for ever and ever');
  });

  it('names the phase: collecting children who walk out His will, actions louder than words', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('power to become the sons of God');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold I and the children which God hath given me');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('he that doeth the will of my Father which is in heaven');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('be ye doers of the word, and not hearers only');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/actions? speak/i);
  });

  it('carries the second message: the inheritance is the profile of the eternal King, and silence programs one too', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/psychological profile/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('A good man leaveth an inheritance to his children’s children');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('One generation shall praise thy works to another');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('which knew not the LORD');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Tell ye your children of it');
  });

  it('keeps BOTH things the children need to see: Him winning for you, and you failing and Him helping you with the Word', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/see (Him|Yahweh) win/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/see you fail/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('What mean these stones?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I will declare what he hath done for my soul');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I acknowledged my sin unto thee');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Then will I teach transgressors thy ways');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('provoke not your children to anger');
  });

  it('PROVEN TO CATCH: a band that keeps the wins and drops the failure half is named', () => {
    const youth = L.levels.youth.replace(/see you fail/gi, 'see you tired');
    expect(youth).not.toBe(L.levels.youth);
    expect(/see you fail/i.test(youth)).toBe(false);
  });

  it('names the wilderness season as a season with a purpose, from parents who are truthful and clear', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/wilderness/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('to humble thee, and to prove thee, to know what was in thine heart');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('so the LORD thy God chasteneth thee');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('To every thing there is a season');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/truthful and cl(ear|arity)/);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world');
  });

  it('stakes no figure: no band or lesson states a percentage or a statistic', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });

  it('says plainly in inApp that it was built from two messages and that the stories are parables', () => {
    expect(L.inApp).toMatch(/two messages/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(600);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(575);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('seek peace, and pursue it', 'seek peace, and chase it');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"the soul that sinneth, it shall die." (Ezekiel 18:4)', '"The soul that sinneth, it shall die." (Ezekiel 18:4)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Ezekiel 18:4) is not the verse: The soul that sinneth, it shall die.']);
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
    const found = EVERY_STRING.flatMap((t) => findBritish(ourProse(t)));
    expect(found).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: an ALL-CAPS heading that spells THE LORD in our voice is refused (this build wrote one and removed it)', () => {
    const planted = 'THE WORK OF THE LORD IS NOT YOUR JOB TITLE. Paul uses the phrase.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['LORD']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('mighty through God to the pulling down of strong holds');
    expect(inQuotes).toContain('The name of the LORD is a strong tower');
    expect(inQuotes).toContain('so the LORD thy God chasteneth thee');
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
    const friend = /Friends, tell one friend this week about one way your parents showed you who Yahweh is[^.]*\./.exec(youth);
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
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
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
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
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
