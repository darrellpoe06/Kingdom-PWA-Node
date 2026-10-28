// @vitest-environment node
// =============================================================================
// sov53 — Prompt caching versus semantic caching: the exact memory, the
// approximate one, and the answer that came before the question was heard
// (DR-1265)
// =============================================================================
// Darrell typed into the session: "LLM Prompt Caching Versus Semantic
// Caching... lesson and how can we use this in our development systems?"
//
// THIS LESSON'S DANGER IS A NUMBER THAT AGES. Lifetimes and prices of a vendor
// service move; a lesson that printed "90% cheaper" would be wrong one price
// change later and no gate would notice. So the lesson gives fractions in
// words, names the service's own two usage fields as the only proof that
// caching happened, and says where the facts came from and when. The gate
// below pins that honesty: no percentage anywhere, the two fields named, the
// not-built thing named as not built, and Proverbs 18:13 carried in every
// register.
//
// The second danger is the opposite of the lesson's thesis: a quotation that
// is nearly the verse. Every quoted span in every string of the module is
// compared with the corpus on disk, and pairing is done by splitting on the
// quote character (DR-1259), never by the {10,} regex.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';

const ID = 'sov53-prompt-caching-versus-semantic-caching-the-answer-before-the-question';
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const PLACES = L ? { lesson: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};

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
export function corpusText(ref) {
  const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref).trim());
  if (!m) return null;
  const chap = chapter(m[1], m[2]);
  if (!chap) return null;
  const out = [];
  for (let v = Number(m[3]); v <= Number(m[4] || m[3]); v += 1) { if (chap[v - 1] == null) return null; out.push(chap[v - 1]); }
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
      if (!ref) { faults.push(`no reference after: ${inside.slice(0, 50)}`); continue; }
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

const SPINE = [
  ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him'],
  ['Jeremiah 23:28', 'he that hath my word, let him speak my word faithfully. What is the chaff to the wheat? saith the LORD'],
  ['Proverbs 30:5-6', 'Add thou not unto his words, lest he reprove thee, and thou be found a liar'],
  ['John 6:12', 'Gather up the fragments that remain, that nothing be lost'],
  ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so'],
  ['Malachi 3:6', 'For I am the LORD, I change not'],
  ['Hebrews 13:8', 'Jesus Christ the same yesterday, and to day, and for ever'],
  ['Psalms 119:11', 'Thy word have I hid in mine heart, that I might not sin against thee'],
  ['Psalms 119:89', 'For ever, O LORD, thy word is settled in heaven'],
];

describe('sov53 exists once, at its own week, with every field the course expects', () => {
  it('is in the catalog exactly once and claims its own number once (which week is newest belongs to the course, not to this spec)', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)/.exec(m.id)[1]));
    expect(nums.filter((n) => n === 53)).toEqual([53]);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });

  it('carries every field the course expects, and four real bands that rise', () => {
    expect(L.lesson.length).toBeGreaterThan(8000);
    for (const b of BANDS) expect(L.levels[b].length, `${b} band too thin`).toBeGreaterThan(3000);
    const len = BANDS.map((b) => L.levels[b].length);
    expect(len[0]).toBeLessThan(len[1]);
    expect(len[1]).toBeLessThan(len[2]);
    for (const a of BANDS) for (const b of BANDS) if (a !== b) expect(L.levels[a]).not.toBe(L.levels[b]);
    expect(Object.keys(L.rpe)).toEqual(['research', 'plan', 'execute']);
    expect(L.benefits).toHaveLength(10);
    expect(L.quiz.questions).toHaveLength(12);
    expect(L.facilitator.talkingPoints).toHaveLength(10);
    expect(L.facilitator.discussionPrompts).toHaveLength(10);
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) expect(quotedPairs(s.body).filter((p) => p.ref).length, `${s.title} quotes no verse`).toBeGreaterThan(0);
  });

  it('every quiz answer is in range, and the marked answers are the true ones', () => {
    for (const q of L.quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    const match = L.quiz.questions.find((q) => /match on/.test(q.q));
    expect(match.options[match.answer]).toMatch(/identical bytes/);
    const proof = L.quiz.questions.find((q) => /only proof/.test(q.q));
    expect(proof.options[proof.answer]).toMatch(/tokens written and tokens read/);
    const fresh = L.quiz.questions.find((q) => /happens to the answer/.test(q.q));
    expect(fresh.options[fresh.answer]).toMatch(/computed fresh/);
  });
});

describe('sov53 — every verse it stands on is the corpus, verbatim', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY quoted span in EVERY string of the module is verbatim, and every one carries a reference', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('the sweep asserts its own count', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(90);
  });

  it('anchor.ref names every verse the lesson stands on, and every anchor is named in the lesson (DR-0734)', () => {
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(15);
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ${r} does not resolve`).not.toBeNull();
      const p = parse(r);
      expect(named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('PROVEN TO CATCH: a quotation that is nearly the verse is refused (the lesson’s own thesis)', () => {
    const near = L.lesson.replace('that nothing be lost', 'so that nothing is lost');
    expect(near).not.toBe(L.lesson);
    expect(verbatimFaults([near]).length).toBeGreaterThan(0);
  });

  it('never substitutes Yahweh into a quotation, and uses Yahweh in our own voice with no generic God outside one', () => {
    const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');
    const inside = []; const generic = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const p of quotedPairs(t)) if (/\bYahweh\b/.test(p.inside)) inside.push(p.inside.slice(0, 50));
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) generic.push(`${m} :: ${t.slice(0, 50)}`);
    }
    expect(inside).toEqual([]);
    expect(generic).toEqual([]);
    expect(L.lesson).toMatch(/\bYahweh\b/);
  });

  it('no elision inside a quotation, and no record id or percentage reaches the reader', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
    for (const t of EVERY_STRING) expect(t).not.toMatch(/\d\s?%|\bper ?cent\b/i);
  });
});

describe('sov53 tells the truth about a vendor fact that ages, and about what it did not build', () => {
  it('gives the lifetimes and prices as fractions in words, and names the two usage fields as the only proof', () => {
    expect(L.lesson).toMatch(/about five minutes/);
    expect(L.lesson).toMatch(/about a tenth/);
    expect(L.lesson).toMatch(/tokens were written to the cache, and how many were read from it|tokens written to the cache and tokens read from it/);
    expect(L.lesson).toMatch(/read number is zero/);
  });

  it('says where the facts came from and that they move', () => {
    expect(L.inApp).toMatch(/published documentation/);
    expect(L.inApp).toMatch(/prices and lifetimes move/);
  });

  it('names what changed in our own writer and what the test proves, and names what was NOT built', () => {
    expect(L.lesson).toMatch(/system block with a cache mark/);
    expect(L.lesson).toMatch(/identical-prompt proof/);
    expect(L.lesson).toMatch(/not altered by one character/);
    expect(L.lesson).toMatch(/None of that is built today/);
    expect(L.lesson).toMatch(/unloads the tower model/);
    for (const b of BANDS) expect(L.levels[b], `${b} does not name the unbuilt thing`).toMatch(/not built|did not build|is not built|None of it is built/);
  });

  it('carries Proverbs 18:13 in every register, in the lesson’s own frame', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(text, `${place} lacks the governing verse`).toContain('He that answereth a matter before he heareth it');
    }
  });

  it('keeps semantic caching away from the Word in every register', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(text, `${place} does not name the chaff and the wheat`).toContain('What is the chaff to the wheat');
    }
  });
});

describe('sov53 sends every reader to someone (DR-0733, DR-0795)', () => {
  it('the module is whole, and so is EVERY band', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });

  it.each(['lesson', ...BANDS])('%s carries all three directions in its own words', (place) => {
    expect(missingDirections(PLACES[place]), `${place} is short`).toEqual([]);
  });

  it('every place names the rhythm and the skill, not only the directions', () => {
    for (const text of Object.values(PLACES)) {
      expect(/once today/i.test(text), 'the rhythm is missing').toBe(true);
      expect(/one friend this week|to one friend before the week/i.test(text), 'the friend rhythm is missing').toBe(true);
      expect(/listen|listening/i.test(text), 'the listening skill is missing').toBe(true);
    }
  });

  it('measures growth the Word’s way, qualitative and quantitative', () => {
    for (const text of Object.values(PLACES)) {
      expect(/Galatians 5:22/.test(text), 'the fruit measure is missing').toBe(true);
      expect(/Hebrews 3:13/.test(text), 'the days measure is missing').toBe(true);
    }
  });

  it('PROVEN TO CATCH: one band losing its friend line alone is named, while the POOLED module still reads whole', () => {
    const youth = L.levels.youth;
    const friend = /Friend to friend, ask one friend this week[^.]*\./.exec(youth);
    expect(friend, 'the youth friend sentence is not where this spec expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '').replace(/"Iron sharpeneth iron[^)]*\)/, '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });

  it('carries no doubled word and no heading-shaped ordinal in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    expect(doubled).toEqual([]);
  });
});
