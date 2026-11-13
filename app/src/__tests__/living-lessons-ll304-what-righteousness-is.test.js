// @vitest-environment node
// =============================================================================
// L304 — What Righteousness Is
// =============================================================================
// A spoken teaching, the third of a thread Darrell spoke on 2026-11-13 (L302 the
// standard, L303 good). Some say they are righteous and Yahweh says no: what is
// righteousness by Yahweh, what is it not, and what is the precept-upon-precept
// way, its jewels seen in many facets? Word first (DR-0098), every verse fetched
// from app/public/bible/kjv (DR-0076). No outside research. (DR-NUMBER.)
//
// THIS LESSON'S DANGERS are four. (1) Self-righteousness taught as
// righteousness: every text carries Proverbs 21:2 and the publican going home
// justified (Luke 18:14). (2) Righteousness taught as earned: every text carries
// the gift (Genesis 15:6; 2 Corinthians 5:21). (3) The gift taught as a label
// that changes nothing: every text carries 1 John 3:7. (4) No road back: every
// text carries 1 John 1:9. And Isaiah 28:10 is taught in its own context.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259).
// The helpers are L301's, copied whole so the gates measure the same way.
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
import { bareMentionsInSpokenLesson, isSpokenByDarrell } from './spoken-lessons-name-darrell.test.js';

const ID = 'll304-what-righteousness-is';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'WHAT RIGHTEOUSNESS IS — precept upon precept, jewel by jewel.';

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
  ['Isaiah 28:10', 'precept upon precept; line upon line'],
  ['Deuteronomy 32:4', 'just and right is he'],
  ['Psalms 11:7', 'the righteous LORD loveth righteousness'],
  ['Jeremiah 23:6', 'THE LORD OUR RIGHTEOUSNESS'],
  ['Proverbs 21:2', 'Every way of a man is right in his own eyes: but the LORD pondereth the hearts'],
  ['Luke 18:9', 'trusted in themselves that they were righteous'],
  ['Luke 18:13', 'God be merciful to me a sinner'],
  ['Luke 18:14', 'went down to his house justified'],
  ['Matthew 5:20', 'except your righteousness shall exceed the righteousness of the scribes and Pharisees'],
  ['Genesis 15:6', 'he counted it to him for righteousness'],
  ['2 Corinthians 5:21', 'that we might be made the righteousness of God in him'],
  ['Isaiah 61:10', 'he hath covered me with the robe of righteousness'],
  ['1 John 3:7', 'he that doeth righteousness is righteous, even as he is righteous'],
  ['Ephesians 6:14', 'the breastplate of righteousness'],
  ['Amos 5:24', 'righteousness as a mighty stream'],
  ['1 John 1:9', 'If we confess our sins, he is faithful and just to forgive us our sins'],
];

// The seven facets, named in our own voice in every text.
const JEWELS = ['His nature', 'His standard', 'the gift', 'the robe', 'the path', 'the breastplate', 'the stream'];
const named = (t, j) => t.toLowerCase().includes(j.toLowerCase());

describe('L304 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 304 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 304)).toEqual([304]);
  });

  it('sits after ll303 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll303-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-13');
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(30);
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
    const anchors = refs.map(parse);
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

describe('a spoken lesson: his name given, his words rendered, a reader length', () => {
  it('names Darrell as the one who spoke it in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell spoke this lesson into the app\b/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('names its provenance plainly: SPOKEN, in two parts, with the research named and the stories invented', () => {
    expect(isSpokenByDarrell(L)).toBe(true);
    expect(L.inApp).toMatch(/Darrell spoke this lesson into the app on 2026-11-13, the same day as the two before it/);
    expect(L.inApp).toMatch(/A Standard for Every Age, then What Good Is, then this one/);
    expect(L.inApp).toMatch(/this lesson names no outside research/);
    expect(L.inApp).toMatch(/parables with invented people/);
  });

  it('carries no percentage, and sits inside the reader-length band, measured not claimed', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure, in the lesson and in every band', () => {
  it('carries the lesson’s spine in every text', () => {
    for (const [, span] of SPINE) {
      for (const k of PLACES) expect(TEXTS[k], `${k}: ${span}`).toContain(span);
    }
  });

  it('PROVEN TO CATCH: a band that drops a spine verse is named', () => {
    const youth = L.levels.youth
      .replace('"Stand therefore, having your loins girt about with truth, and having on the breastplate of righteousness" (Ephesians 6:14)', '')
      .replace('"the breastplate of righteousness" (Ephesians 6:14)', '');
    expect(youth).not.toBe(L.levels.youth);
    expect(SPINE.filter(([, span]) => !youth.includes(span)).map(([ref]) => ref)).toEqual(['Ephesians 6:14']);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(100);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(80);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('God be merciful to me a sinner" (Luke 18:13)', 'God be merciful to me the sinner" (Luke 18:13)');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"just and right is he" (Deuteronomy 32:4)', '"Just and right is he" (Deuteronomy 32:4)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual([`(Deuteronomy 32:4) is not the verse: ${'Just and right is he'.slice(0, 70)}`]);
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
    expect(inQuotes).toContain('THE LORD OUR RIGHTEOUSNESS');
    expect(inQuotes).toContain('God be merciful to me a sinner');
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

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check still reads green', () => {
    const teen = L.levels.teen;
    const friend = /With a friend, talk honestly about which facet[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
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

describe('righteousness is His, given and lived, and never our verdict on ourselves', () => {
  it('every text names the seven jewels in our own voice', () => {
    for (const k of PLACES) for (const j of JEWELS) expect(named(TEXTS[k], j), `${k}: ${j}`).toBe(true);
  });

  it('PROVEN TO CATCH: a band that loses a jewel is named', () => {
    const stripped = L.levels.teen.replace(/the stream/gi, 'the river');
    expect(stripped).not.toBe(L.levels.teen);
    expect(JEWELS.filter((j) => !named(stripped, j))).toEqual(['the stream']);
  });

  it('self-righteousness is named for what it is in every text: our verdict, overruled by the One who weighs the heart', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('but the LORD pondereth the hearts');
      expect(TEXTS[k], k).toContain('went down to his house justified');
    }
    expect(L.lesson).toMatch(/Self-righteousness is a verdict a person passes on himself/);
  });

  it('righteousness is never taught as earned: every text carries the gift and names Jesus', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('he counted it to him for righteousness');
      expect(TEXTS[k], k).toContain('that we might be made the righteousness of God in him');
      expect(TEXTS[k], k).toMatch(/\bJesus\b|\bChrist\b/);
    }
  });

  it('the gift is never a label that changes nothing, and the road back is always given', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('he that doeth righteousness is righteous');
      expect(TEXTS[k], k).toContain('If we confess our sins, he is faithful and just to forgive us our sins');
    }
  });

  it('precept upon precept is taught in its own context in the adult, teen and senior texts', () => {
    for (const k of ['adult', 'teen', 'senior']) expect(TEXTS[k], k).toContain('and fall backward, and be broken');
  });

  it('the definition is said plainly in the lesson', () => {
    expect(L.lesson).toMatch(/Righteousness is right standing and right living by Yahweh’s standard, not man’s\./);
    expect(L.lesson).toMatch(/It begins as a gift/);
  });

  it('the thread is named: the two lessons before and the lesson after', () => {
    expect(L.lesson).toMatch(/A Standard for Every Age/);
    expect(L.lesson).toMatch(/What Good Is/);
    expect(L.lesson).toMatch(/search our own hearts with Him/);
    for (const id of ['ll302-a-standard-for-every-age', 'll303-what-good-is']) {
      expect(
        LIVING_LESSONS_MODULES.some((m) => m.id === id),
        id
      ).toBe(true);
    }
  });

  it('this lesson makes no outside claim, so it admits nothing unchecked', () => {
    for (const t of EVERY_STRING) expect(t).not.toMatch(/we did not (?:read|telephone|reproduce)|WHAT WE DID NOT CHECK/i);
  });
});
