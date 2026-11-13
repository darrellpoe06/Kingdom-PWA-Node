// @vitest-environment node
// =============================================================================
// L307 — Love Walks With You on the Training Ground
// =============================================================================
// A spoken teaching, the sixth of a thread Darrell spoke on 2026-11-13 (L302 to
// L306), continuing L305 (the heart searched with Him; body, soul and spirit)
// and L306 (enduring, coming out shining). Love walks with you while you learn
// good and evil; the Pattern Maker and who He says He is; the parts of a person
// brought into line; the ant with no overseer; the fire; the way to escape;
// wealth taught by Him; the Father of the fatherless. Word first (DR-0098),
// every verse filled from app/public/bible/kjv by scripts/fill-verses.mjs
// (DR-1468) and read back here (DR-0076). (DR-1475.)
//
// THIS LESSON'S DANGERS are five. (1) Inventing beyond the Word on the Godhead:
// every text gives "three persons and one being" as DARRELL's statement and
// carries Exodus 3:14, Deuteronomy 6:4 and Matthew 28:19 beside it. (2) His
// "25" passed off as the institution's number, or the research hedged away:
// every text names the National Institute of Mental Health, states its
// mid-to-late twenties plainly, and says the page itself was not read. (3) Evil
// to make ends meet taught as excusable: every text carries 1 Corinthians
// 10:13's way to escape. (4) A fatherlessness figure nobody read back: no text
// carries a number about it. (5) The easy start shamed, or the hard start made
// a boast: every text carries Luke 12:48 and Romans 12:15, and every text says
// his bus story is not told to brag.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259).
// The helpers are L301's, copied whole so the gates measure the same way.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll307-love-walks-with-you-on-the-training-ground.js';
import { LIVING_LESSONS_MODULES, buildLivingLessonsSchedule } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { declaresUnchecked } from '../../../scripts/unchecked-claims.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { bareMentionsInSpokenLesson, isSpokenByDarrell } from './spoken-lessons-name-darrell.test.js';

const ID = 'll307-love-walks-with-you-on-the-training-ground';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'LOVE WALKS WITH YOU ON THE TRAINING GROUND — learning good and evil with Yahweh.';
const FILE = join(process.cwd(), 'src', 'lib', 'living-lessons', `${ID}.js`);

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
  ['Hebrews 5:14', 'have their senses exercised to discern both good and evil'],
  ['1 Corinthians 13:4', 'Charity suffereth long, and is kind'],
  ['Psalms 23:4', 'for thou art with me'],
  ['Proverbs 25:2', 'the honour of kings is to search out a matter'],
  ['Exodus 3:14', 'I AM THAT I AM'],
  ['Deuteronomy 6:4', 'The LORD our God is one LORD'],
  ['Matthew 28:19', 'in the name of the Father, and of the Son, and of the Holy Ghost'],
  ['Genesis 1:27', 'So God created man in his own image'],
  ['1 Thessalonians 5:23', 'spirit and soul and body'],
  ['Proverbs 16:32', 'he that ruleth his spirit than he that taketh a city'],
  ['Proverbs 6:7', 'having no guide, overseer, or ruler'],
  ['1 Corinthians 10:13', 'make a way to escape'],
  ['Deuteronomy 8:18', 'it is he that giveth thee power to get wealth'],
  ['Romans 13:9', 'Thou shalt love thy neighbour as thyself'],
  ['Psalms 68:5', 'A father of the fatherless'],
  ['Hebrews 12:1', 'so great a cloud of witnesses'],
  ['Luke 12:48', 'unto whomsoever much is given'],
  ['Romans 12:15', 'weep with them that weep'],
];

// The research, stated plainly with its source in every text; his 25 named as his.
const SOURCE = /National Institute of Mental Health/;
const FINDING = /mid-to-late twenties/;
const NOT_READ = /\bwe did not read\b/i;
const HIS_STATEMENT = /Darrell[^.]{0,60}three persons and one being/;

describe('L307 is its own file, in the catalog, numbered, dated and whole', () => {
  it('exists exactly once, on its own number and day, with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(L).toBe(lesson);
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(ORDER).toBe(307);
    expect(ADDED).toBe('2026-11-13');
    expect(buildLivingLessonsSchedule().find((m) => m.id === ID).added).toBe('2026-11-13');
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 307 exactly once, and sits after ll306 in the catalog', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 307)).toEqual([307]);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll306-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('declares why its unchecked material is unchecked, with a date to look again', () => {
    expect(declaresUnchecked(readFileSync(FILE, 'utf8'))).toBe(true);
    expect(UNCHECKED).toMatch(/www\.nimh\.nih\.gov/);
    expect(UNCHECKED).toMatch(/re-review: 2026-11-27/);
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

  it('carries a ten-question quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBe(10);
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

  it('names its provenance plainly: spoken, the thread, the research named and the stories invented', () => {
    expect(isSpokenByDarrell(L)).toBe(true);
    expect(L.inApp).toMatch(/Darrell spoke this lesson into the app on 2026-11-13, the same day as the five before it, and the testimony in it is his own/);
    expect(L.inApp).toMatch(/National Institute of Mental Health publication The Teen Brain: 7 Things to Know/);
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
    const youth = L.levels.youth.replace('"A father of the fatherless" (Psalms 68:5)', '');
    expect(youth).not.toBe(L.levels.youth);
    expect(SPINE.filter(([, span]) => !youth.includes(span)).map(([ref]) => ref)).toEqual(['Psalms 68:5']);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(150);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(130);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('Go to the ant, thou sluggard', 'Go to the bee, thou sluggard');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"for thou art with me" (Psalms 23:4)', '"For thou art with me" (Psalms 23:4)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Psalms 23:4) is not the verse: For thou art with me']);
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
    const planted = 'God gives the power to get wealth.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('The LORD our God is one LORD');
    expect(inQuotes).toContain('So God created man in his own image');
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
    const friend = /With a friend, talk honestly about one temptation[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = L ? measureFullness(L) : null;
  const grades = L ? measureLesson(L) : null;

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

describe('the Godhead as written, the research stated plainly, no evil to make ends meet, no figure unread', () => {
  it('three persons and one being is Darrell’s statement in every text, beside the verses it stands on', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toMatch(HIS_STATEMENT);
      for (const span of ['I AM THAT I AM', 'The LORD our God is one LORD', 'in the name of the Father, and of the Son, and of the Holy Ghost']) {
        expect(TEXTS[k], `${k}: ${span}`).toContain(span);
      }
    }
  });

  it('PROVEN TO CATCH: the same sentence in our own voice, with Darrell taken off it, is named', () => {
    const youth = L.levels.youth.replace('Darrell puts it this way: three persons and one being', 'The Bible teaches three persons and one being');
    expect(youth).not.toBe(L.levels.youth);
    expect(HIS_STATEMENT.test(youth)).toBe(false);
  });

  it('the research is stated plainly with its source in every text, and the page not read is said', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: source`).toMatch(SOURCE);
      expect(TEXTS[k], `${k}: finding`).toMatch(FINDING);
      expect(TEXTS[k], `${k}: not read`).toMatch(NOT_READ);
    }
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/twenty-five is a (?:common|fair) round (?:figure|number)/i);
  });

  it('PROVEN TO CATCH: a band that loses its source is named', () => {
    const teen = L.levels.teen.replaceAll('National Institute of Mental Health', 'a study');
    expect(teen).not.toBe(L.levels.teen);
    expect(SOURCE.test(teen)).toBe(false);
  });

  it('no evil to make ends meet: every text carries the way to escape and says you never have to', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('make a way to escape');
      expect(TEXTS[k], k).toMatch(/(?:never|do not) have to|no one is obliged|never need to/);
    }
  });

  it('no fatherlessness figure that nobody read back: no number sits in a sentence about fathers', () => {
    const faults = [];
    for (const k of PLACES) {
      for (const s of TEXTS[k].split(/(?<=[.!?])\s+/)) {
        if (/father/i.test(s) && /\b\d[\d,.]*\b(?![:\d]*\))|\bmillion\b|\bout of (?:every )?(?:two|three|four|five|ten)\b/i.test(s.replace(/\([^)]*\)/g, '')))
          faults.push(`${k}: ${s.slice(0, 80)}`);
      }
    }
    expect(faults).toEqual([]);
  });

  it('PROVEN TO CATCH: a figure planted into a sentence about fathers is named', () => {
    const planted = `${L.levels.senior} About 18 million children live without a father in the home.`;
    const hit = planted.split(/(?<=[.!?])\s+/).filter((s) => /father/i.test(s) && /\b\d[\d,.]*\b|\bmillion\b/i.test(s.replace(/\([^)]*\)/g, '')));
    expect(hit).toEqual(['About 18 million children live without a father in the home.']);
  });

  it('the easy start is a trust, and the hard start is not a boast, in every text', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('unto whomsoever much is given');
      expect(TEXTS[k], k).toContain('weep with them that weep');
      expect(TEXTS[k], k).toMatch(/to brag|toot(?:ing)? (?:his|a) (?:own )?horn/);
    }
  });

  it('the thread is named: the two lessons this one continues are in the catalog and in the text', () => {
    for (const t of ['Search Me, and Know My Heart', 'The Path of the Just Shineth']) expect(L.lesson).toContain(t);
    for (const id of ['ll305-search-me-and-know-my-heart', 'll306-the-path-of-the-just-shineth']) {
      expect(
        LIVING_LESSONS_MODULES.some((m) => m.id === id),
        id
      ).toBe(true);
    }
  });
});
