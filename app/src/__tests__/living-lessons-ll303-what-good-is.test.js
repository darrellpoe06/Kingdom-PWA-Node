// @vitest-environment node
// =============================================================================
// L303 — What Good Is
// =============================================================================
// A spoken teaching. Darrell spoke it on 2026-11-13, the same day as L302: the
// popular saying about evil winning when good men do nothing contradicts itself,
// for how can someone be good and do nothing at the same time? He asked for good
// to be defined, Word first (DR-0098). Every verse is fetched from
// app/public/bible/kjv (DR-0076). (DR-NUMBER.)
//
// THIS LESSON'S DANGERS are four. (1) Good set by man: every text says none is
// good but Yahweh (Mark 10:18) and carries the key verse, Psalms 119:68. (2) Good
// that never moves called good: every text carries James 4:17 and the fruit test
// (Matthew 7:20). (3) Good taught as earned by works: every text carries
// Ephesians 2:10, created in Christ Jesus unto good works. (4) The Burke saying
// over-claimed: every text holds the attribution unverified, says what was not
// read, and never says Burke said it.
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

const ID = 'll303-what-good-is';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'WHAT GOOD IS — being good and doing good are one.';

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
  ['Mark 10:18', 'there is none good but one, that is, God'],
  ['Psalms 119:68', 'Thou art good, and doest good; teach me thy statutes'],
  ['Acts 10:38', 'went about doing good'],
  ['Matthew 7:17', 'every good tree bringeth forth good fruit'],
  ['Matthew 7:20', 'by their fruits ye shall know them'],
  ['Luke 6:45', 'A good man out of the good treasure of his heart bringeth forth that which is good'],
  ['James 4:17', 'to him that knoweth to do good, and doeth it not, to him it is sin'],
  ['Proverbs 3:27', 'Withhold not good from them to whom it is due'],
  ['1 John 3:18', 'let us not love in word, neither in tongue; but in deed and in truth'],
  ['Luke 10:37', 'Go, and do thou likewise'],
  ['Matthew 25:26', 'Thou wicked and slothful servant'],
  ['Ephesians 2:10', 'created in Christ Jesus unto good works'],
  ['Ezekiel 22:30', 'stand in the gap before me for the land'],
  ['Galatians 6:9', 'let us not be weary in well doing'],
];

// Our own voice on the research: what was not read, said in every text.
const NOT_READ = /\bwe did not read\b/i;
const BURKE_UNVERIFIED = /has not been found there|have not found those words there|has not been found in his writings/;
// Our prose may say the saying is credited TO Burke; never that he said or wrote it.
const BURKE_AS_FACT = /\bBurke (?:said|wrote|taught|once said)\b|\bas Burke (?:said|put it)\b/;
// The definition, in our own voice, in every text: being good and doing good go together.
const ONE = /being good and doing good (?:are one|go together)|good and does good|good and He does good|is good, and (?:Yahweh|He) does good/;

describe('L303 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 303 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 303)).toEqual([303]);
  });

  it('sits after ll302 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll302-'));
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
    expect(L.inApp).toMatch(/Darrell spoke this lesson into the app on 2026-11-13, the same day as the lesson before it/);
    expect(L.inApp).toMatch(/A Standard for Every Age came first, and the lesson on righteousness comes next/);
    expect(L.inApp).toMatch(/often credited to Edmund Burke/);
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
    const youth = L.levels.youth.replace('"Withhold not good from them to whom it is due, when it is in the power of thine hand to do it" (Proverbs 3:27)', '');
    expect(youth).not.toBe(L.levels.youth);
    expect(SPINE.filter(([, span]) => !youth.includes(span)).map(([ref]) => ref)).toEqual(['Proverbs 3:27']);
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
    const broken = L.lesson.replace('he passed by on the other side" (Luke 10:31)', 'he walked by on the other side" (Luke 10:31)');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"went about doing good" (Acts 10:38)', '"Went about doing good" (Acts 10:38)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual([`(Acts 10:38) is not the verse: ${'Went about doing good'.slice(0, 70)}`]);
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
    expect(inQuotes).toContain('there is none good but one, that is, God');
    expect(inQuotes).toContain('it was very good');
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
    const friend = /With a friend, talk honestly about one good[^.]*\./.exec(teen);
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

describe('good is what Yahweh is and does, and the saying is said the Word’s way', () => {
  it('every text gives good to Yahweh alone and carries the key verse that joins being and doing', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Mark 10:18`).toContain('there is none good but one, that is, God');
      expect(TEXTS[k], `${k}: Psalms 119:68`).toContain('Thou art good, and doest good');
      expect(TEXTS[k], `${k}: the definition in our voice`).toMatch(ONE);
    }
  });

  it('PROVEN TO CATCH: a band that loses the key verse is named', () => {
    const teen = L.levels.teen.replaceAll('"Thou art good, and doest good; teach me thy statutes" (Psalms 119:68)', '');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('Thou art good, and doest good')).toBe(false);
  });

  it('good that never moves is never called good: every text carries James 4:17 and the fruit test', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('to him that knoweth to do good, and doeth it not, to him it is sin');
      expect(TEXTS[k], k).toContain('by their fruits ye shall know them');
    }
  });

  it('good is never taught as earned: every text carries Ephesians 2:10 and names Jesus', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('created in Christ Jesus unto good works');
      expect(TEXTS[k], k).toMatch(/\bJesus\b/);
    }
    expect(L.lesson).toContain('dwelleth no good thing');
  });

  it('the two who passed by and the hidden talent are taught in every text', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('Go, and do thou likewise');
      expect(TEXTS[k], k).toContain('Thou wicked and slothful servant');
      expect(TEXTS[k], k).toMatch(/priest/);
    }
  });

  it('every text says what was not read, and holds the Burke attribution unverified', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: not read`).toMatch(NOT_READ);
      expect(TEXTS[k], `${k}: Burke named`).toMatch(/Edmund Burke/);
      expect(TEXTS[k], `${k}: Burke unverified`).toMatch(BURKE_UNVERIFIED);
    }
    for (const t of EVERY_STRING) expect(t, t.slice(0, 60)).not.toMatch(BURKE_AS_FACT);
  });

  it('PROVEN TO CATCH: a text that states the Burke attribution as fact is refused', () => {
    const planted = L.levels.teen.replace('The quote is usually attributed to Edmund Burke.', 'Burke said it in 1770.');
    expect(planted).not.toBe(L.levels.teen);
    expect(BURKE_AS_FACT.test(planted)).toBe(true);
  });

  it('the thread is named: the lesson before and the lesson after', () => {
    expect(L.lesson).toMatch(/A Standard for Every Age/);
    expect(L.lesson).toMatch(/what righteousness is/);
    const prev = LIVING_LESSONS_MODULES.find((m) => m.id === 'll302-a-standard-for-every-age');
    expect(prev, 'the lesson this one follows is in the catalog').toBeTruthy();
  });
});
