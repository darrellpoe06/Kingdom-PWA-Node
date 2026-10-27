// @vitest-environment node
// =============================================================================
// L269 — Where the Garden Was: and the gate the search keeps walking past
// =============================================================================
// Darrell sent a link into the PoeTech app under one word asking for a lesson,
// with a note asking for maps, timelines, connections to the Word, and games.
// The link proposed that Eden was the whole land of Mesopotamia and that the
// garden lay in a valley now beneath the Persian Gulf, its eastern door near
// the Strait of Hormuz. It is a careful, reverent piece of work that names its
// own weak points and ends by pointing the viewer to Christ.
//
// THIS LESSON'S DANGER IS NOT THE ONE ll268 HAD. ll268 handled a claim that
// flattered the account and had to be kept out of the evidence pile. Here the
// source is sober and mostly right, so the risk is the opposite: that the
// lesson simply agrees, repeats a synthesis as though it were a finding, and
// never reaches the verse that resets the question. So the gate below requires
// the three location theories to be present WITH their weaknesses, requires the
// synthesis to be named as a synthesis, and requires Genesis 3:24 to be carried
// in every band with the guard's stated purpose intact.
//
// EVERY GATE THAT BIT ll268 IS PRE-RUN HERE, not because they belong to this
// lesson but because paying for the same lesson twice is the avoidable kind of
// cost. ll268 was pushed three times: once red on elided quotations, once red
// on a British -our spelling and on quoted spans carrying the host sentence's
// punctuation. All three classes are asserted below against this module before
// it ever reaches CI.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const ID = 'll269-where-the-garden-was-and-the-gate-the-search-walks-past';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

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
/** The corpus text a reference names, handling ranges and a comma-joined second part. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) { if (chap[v - 1] == null) return false; out.push(chap[v - 1]); }
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

/** Pairs by SPLITTING on the quote character, never by regex (DR-1258 / DR-1259). */
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
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!verse.includes(inside.trim())) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// The spine, pinned by literal text. Every span was fetched from the corpus on
// disk before it was written into the lesson.
const SPINE = [
  ['Genesis 2:8', 'And the LORD God planted a garden eastward in Eden'],
  ['Genesis 2:10', 'And a river went out of Eden to water the garden; and from thence it was parted, and became into four heads'],
  ['Genesis 2:14', 'And the name of the third river is Hiddekel: that is it which goeth toward the east of Assyria. And the fourth river is Euphrates'],
  ['Genesis 3:23', 'to till the ground from whence he was taken'],
  ['Genesis 3:24', 'a flaming sword which turned every way, to keep the way of the tree of life'],
  ['Genesis 10:10', 'the beginning of his kingdom was Babel, and Erech, and Accad, and Calneh, in the land of Shinar'],
  ['Ezekiel 28:13', 'Thou hast been in Eden the garden of God'],
  ['Amos 1:5', 'him that holdeth the sceptre from the house of Eden'],
  ['Proverbs 25:2', 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter'],
  ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
  ['2 Peter 1:21', 'holy men of God spake as they were moved by the Holy Ghost'],
  ['Luke 23:43', 'To day shalt thou be with me in paradise'],
  ['Revelation 2:7', 'which is in the midst of the paradise of God'],
  ['Revelation 22:14', 'may enter in through the gates into the city'],
];

describe('L269 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands and two stories', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
  });

  it('claims 269 once and is the highest Living Lesson', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 269)).toHaveLength(1);
    expect(Math.max(...numbers)).toBe(269);
  });

  it('carries its build day, and an anchor whose every reference resolves', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    for (const r of refs) expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
  });
});

describe('every verse is the corpus on disk', () => {
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

  it('and the sweep asserts its own count', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(150);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('became into four heads', 'became into five heads');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('Yahweh is never inside a quotation, and a planted one is caught', () => {
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        expect(/\bYahweh\b/.test(inside), `Yahweh inside (${ref || 'no ref'})`).toBe(false);
      }
    }
    const tampered = L.lesson.replace('to keep the way of the tree of life', 'to keep Yahweh’s way of the tree of life');
    expect(tampered).not.toBe(L.lesson);
    expect(quotedPairs(tampered).some((p) => /\bYahweh\b/.test(p.inside))).toBe(true);
    expect(verbatimFaults([tampered]).length).toBeGreaterThan(0);
  });
});

describe('the house rules that cost ll268 three pushes are pre-run here', () => {
  it('no quoted span carries an ellipsis (DR-0459)', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  // The British -our spelling of color is NOT checked here. american-spelling
  // .test.js owns that rule and scans every file under app/src, test files
  // included, so a spec that must spell the banned word in order to look for it
  // fails that gate on itself -- which is exactly what happened on the first
  // run of this file. Re-implementing an enforced gate inside a lesson spec was
  // already the error made with talk-together in ll268; this is the same error
  // wearing a different coat, so the assertion is deleted rather than reworded.

  it('no quoted span ends with punctuation the verse does not have', () => {
    const drifted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (!ref) continue;
        const last = inside.trim().slice(-1);
        if (!'.,;:!?'.includes(last)) continue;
        const verse = corpusText(ref);
        if (verse && !verse.includes(inside.trim())) drifted.push(`(${ref}) ${inside.slice(-40)}`);
      }
    }
    expect(drifted).toEqual([]);
  });

  it('no generic God, GOD or LORD in our authored voice, while the quotations keep theirs', () => {
    const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 55)}`);
    }
    expect(found).toEqual([]);
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('And the LORD God planted a garden eastward in Eden');
    expect(inQuotes).toContain('It is the glory of God to conceal a thing');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('the lesson teaches past the debate instead of staging it', () => {
  it('carries the distinction the whole subject turns on, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Eden and the garden are not distinguished`).toMatch(/Eden is (a|not the)/i);
    }
  });

  it('names all three theories AND a weakness for each', () => {
    expect(L.lesson).toMatch(/Ararat|highlands/i);
    expect(L.lesson).toMatch(/Persian Gulf/);
    expect(L.lesson).toMatch(/Harran/);
    // each is given its failure, not just its case
    expect(L.lesson).toMatch(/do not come from one source/i);
    expect(L.lesson).toMatch(/reading Genesis 2:10 backwards/i);
    expect(L.lesson).toMatch(/one river becom(es|ing) four/i);
    expect(L.lesson).toMatch(/None (of them )?(explains|accounts|holds)/i);
  });

  it('names the speaker’s verdict as a synthesis rather than a finding', () => {
    expect(L.lesson).toMatch(/synthesis/i);
    expect(L.lesson).toMatch(/not a finding anyone has made/i);
  });

  it('keeps the three tiers apart and says what the Word corrects', () => {
    expect(L.lesson).toMatch(/Established|settled/i);
    expect(L.lesson).toMatch(/Asserted|merely said/i);
    expect(L.lesson).toMatch(/A dry valley is not a garden/);
    expect(L.lesson).toMatch(/load-bearing/);
    expect(L.lesson).toContain('holy men of God spake as they were moved by the Holy Ghost');
  });

  it('carries the sentence the search walks past, in EVERY band, with the purpose clause intact', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k} does not carry Genesis 3:24`).toContain('to keep the way of the tree of life');
      expect(TEXTS[k], `${k} does not say the garden is kept rather than lost`).toMatch(/\bkept\b|\bguarded\b/i);
    }
  });

  it('answers the ask it was given: maps, timeline, and the games', () => {
    expect(L.lesson).toContain('Harran');
    expect(L.lesson).toContain('Ur of the Chaldees');
    expect(L.lesson).toMatch(/dotted/i);
    expect(L.lesson).toMatch(/FOUR RIVERS/);
    expect(L.lesson).toMatch(/FIVE EDENS/);
    expect(L.lesson).toMatch(/TWO PILES/);
    for (const k of PLACES) expect(TEXTS[k], `${k} carries no game`).toMatch(/FOUR RIVERS|game/i);
  });

  it('does not reach a verdict on the location, and says the searching is honourable', () => {
    expect(L.lesson).toMatch(/never urgent|can never be urgent/i);
    expect(L.lesson).toContain('It is the glory of God to conceal a thing: but the honour of kings is to search out a matter');
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check stays green', () => {
    const teen = L.levels.teen;
    const friend = /Friends, discuss the five Edens[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another, and the senior band earned that', () => {
    // IT DID NOT, FIRST TIME. The senior band was written by lengthening the
    // teen band's sentences and measured teen~senior 0.50 -- exactly the
    // ceiling, which duplicatedBands fails on `>=`. It was rewritten with its
    // own material (what to say when a grandchild brings this home; the
    // teacher's need for the vocabulary before the geography; a reader who has
    // watched this cycle turn before) and the pair fell to 0.06. Then the
    // ladder inverted, because the new register was plainer, and the sentences
    // had to be made periodic again without going back to teen's wording.
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.pairs['teen~senior']).toBeLessThan(0.3);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('no band opens a sentence with an ordinal the formatter would read as a heading', () => {
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
