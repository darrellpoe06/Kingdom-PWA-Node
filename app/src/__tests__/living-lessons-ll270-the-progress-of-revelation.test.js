// @vitest-environment node
// =============================================================================
// L270 — The Progress of Revelation: the Word came in order, by many hands,
// and stands forever
// =============================================================================
// Darrell sent two photographed pages into the app -- a study Bible's chart
// headed "The Progress of Revelation", the sixty-six books in the order the
// chart believes they were WRITTEN, each with an approximate date and an
// author -- with the words "Timelines for the bible? Lesson /s Word first...".
//
// THIS LESSON'S WHOLE DANGER IS A NUMBER REMEMBERED WRONG. A lesson that
// quotes every verse verbatim and then says James was written AD 45 to 50
// because that is what the author recalled would pass every verse gate in the
// house and still misquote its own source. So the chart is kept as DATA
// (app/src/lib/progress-of-revelation.js, transcribed from the photographs)
// and this gate pins the lesson's dates to it: every one of the sixty-six
// books is named in the lesson, and every date the lesson speaks is the
// chart's date, derived from the data and never typed twice.
//
// The second danger is the opposite one: filling a blank the chart left blank.
// The chart writes Unknown beside Job and Hebrews, Anonymous beside Samuel,
// Kings and Esther, and a question mark after Samuel (Ruth) and Ezra
// (Chronicles). The lesson must keep every one of those blanks, because the
// Word keeps them (Deuteronomy 29:29).
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import {
  PROGRESS_OF_REVELATION, PROGRESS_OF_REVELATION_SOURCE, chartDateOf, chartAuthorOf, chartOpenLines,
} from '../lib/progress-of-revelation.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll270-the-progress-of-revelation-the-word-came-in-order-and-stands-forever';
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
  ['Hebrews 1:1-2', 'who at sundry times and in divers manners spake in time past unto the fathers by the prophets'],
  ['2 Peter 1:20-21', 'holy men of God spake as they were moved by the Holy Ghost'],
  ['Exodus 17:14', 'Write this for a memorial in a book'],
  ['Revelation 1:11', 'What thou seest, write in a book'],
  ['Haggai 1:1', 'In the second year of Darius the king, in the sixth month, in the first day of the month'],
  ['2 Kings 25:27', 'in the seven and thirtieth year of the captivity of Jehoiachin king of Judah'],
  ['Proverbs 25:1', 'which the men of Hezekiah king of Judah copied out'],
  ['Daniel 9:2', 'I Daniel understood by books the number of the years'],
  ['2 Peter 3:16', 'as they do also the other scriptures'],
  ['Jeremiah 36:32', 'there were added besides unto them many like words'],
  ['John 14:26', 'bring all things to your remembrance'],
  ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
  ['Psalms 119:89', 'thy word is settled in heaven'],
  ['Isaiah 34:16', 'for my mouth it hath commanded, and his spirit it hath gathered them'],
];

// How the lesson names each book of the chart when the chart's own name is not
// the lesson's phrasing (the paired books are spoken as pairs).
const SPOKEN_AS = {
  '1 Samuel': /books of Samuel/, '2 Samuel': /books of Samuel/,
  '1 Kings': /books of Kings/, '2 Kings': /books of Kings|Second Kings/,
  '1 Chronicles': /books of Chronicles/, '2 Chronicles': /books of Chronicles|Second Chronicles/,
  '1 Thessalonians': /letters to Thessalonica/, '2 Thessalonians': /letters to Thessalonica/,
  '1 Corinthians': /First and Second Corinthians/, '2 Corinthians': /First and Second Corinthians/,
  '1 Timothy': /First Timothy/, '2 Timothy': /Second Timothy/,
  '1 Peter': /First Peter/, '2 Peter': /Second Peter/,
  '1 John': /three letters of John/, '2 John': /three letters of John/, '3 John': /three letters of John/,
  Psalms: /\bPsalms?\b/,
};

describe('L270 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 270 exactly once, and nothing else claims it (which lesson is newest belongs to living-lessons-order)', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 270)).toEqual([270]);
  });

  it('carries its build day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-28');
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
    // Named exactly, or by a same-chapter reference whose verses overlap -- the
    // rule every-anchor-is-named-in-the-lesson itself applies.
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });
});

describe('the chart is data, and the lesson speaks the chart’s own dates', () => {
  it('the data holds the sixty-six books, thirty-nine and twenty-seven, with the chart’s honesty kept', () => {
    expect(PROGRESS_OF_REVELATION).toHaveLength(66);
    expect(PROGRESS_OF_REVELATION.filter((r) => r.testament === 'OT')).toHaveLength(39);
    expect(PROGRESS_OF_REVELATION.filter((r) => r.testament === 'NT')).toHaveLength(27);
    expect(new Set(PROGRESS_OF_REVELATION.map((r) => r.book)).size).toBe(66);
    expect(chartDateOf('Job')).toBe('Unknown');
    expect(chartAuthorOf('Hebrews')).toBe('Unknown');
    expect(chartAuthorOf('Ruth')).toBe('Samuel (?)');
    expect(chartAuthorOf('1 Chronicles')).toBe('Ezra (?)');
    expect(chartAuthorOf('Psalms')).toBe('Multiple Authors');
    expect(chartAuthorOf('Proverbs')).toBe('Solomon primarily');
    expect(chartOpenLines().map((x) => x.book)).toEqual([
      'Job', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Esther', 'Hebrews',
    ]);
    expect(PROGRESS_OF_REVELATION_SOURCE).toMatch(/photographed/);
  });

  it('every one of the sixty-six books is named in the lesson', () => {
    const missing = PROGRESS_OF_REVELATION.filter((r) => !(SPOKEN_AS[r.book] || new RegExp(`\\b${r.book}\\b`)).test(L.lesson)).map((r) => r.book);
    expect(missing).toEqual([]);
  });

  it('every date the lesson gives is the chart’s date, derived from the data', () => {
    // The lesson writes a BC range as "1445 to 1405" (with or without " BC"
    // after the pair), a "ca." date as "about 775", an AD date as "AD 62" or
    // "AD 60 to 62". The chart's own form is derived, never typed twice.
    const missing = [];
    for (const r of PROGRESS_OF_REVELATION) {
      if (r.unknownDate) { if (!/Job.{0,80}Unknown/.test(L.lesson)) missing.push('Job: Unknown'); continue; }
      const span = r.from === r.to ? String(r.from) : `${r.from} to ${r.to}`;
      const said = r.era === 'AD' ? `AD ${span}` : `${r.ca ? 'about ' : ''}${span}`;
      if (!L.lesson.includes(said)) missing.push(`${r.book}: ${said}`);
    }
    expect(missing).toEqual([]);
  });

  it('PROVEN TO CATCH: one remembered-wrong date is named by book', () => {
    // The date is spoken twice (the opening count and the New Testament walk),
    // so both are altered; a proof that altered one and found the other would
    // be the gate passing on a remembered number, the very defect it guards.
    const wrong = L.lesson.replaceAll('AD 44 to 49', 'AD 45 to 50');
    expect(wrong).not.toBe(L.lesson);
    const r = PROGRESS_OF_REVELATION.find((x) => x.book === 'James');
    expect(wrong.includes(`AD ${r.from} to ${r.to}`)).toBe(false);
  });

  it('keeps every blank the chart keeps: Unknown, Anonymous, and the two question marks', () => {
    expect(L.lesson).toMatch(/Job.{0,120}Unknown.{0,40}Anonymous/);
    expect(L.lesson).toMatch(/Hebrews.{0,120}Unknown/);
    expect(L.lesson).toMatch(/Kings.{0,200}Anonymous/);
    expect(L.lesson).toMatch(/Esther.{0,60}Anonymous/);
    expect(L.lesson).toMatch(/Ruth.{0,400}Samuel with a question mark/);
    expect(L.lesson).toMatch(/Ezra with a question mark/);
    // and never fills them: no sentence names Paul as the writer of Hebrews
    expect(L.lesson).not.toMatch(/Paul wrote Hebrews|Hebrews, by Paul|Hebrews was written by Paul/);
    for (const b of BANDS) expect(L.levels[b], `${b} band fills the Hebrews blank`).not.toMatch(/Paul wrote Hebrews|Hebrews, by Paul/);
  });

  it('states its own limit: the chart was not checked against any other chart', () => {
    expect(L.lesson).toMatch(/did not check the chart against any other chart/);
    expect(L.inApp).toMatch(/not compared against any other chart/);
  });

  it('teaches the two rules by name, in the lesson and in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: first rule`).toMatch(/no older than (its|the) last (event|thing)/i);
      expect(TEXTS[k], `${k}: second rule`).toMatch(/no younger than (its|the) first (reader|book that quotes)/i);
    }
  });

  it('names the road it came in on: two photographed pages, sent into the app, Word first', () => {
    expect(L.lesson).toMatch(/two photographed pages/);
    expect(L.lesson).toMatch(/Word first/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(400);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(380);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('there were added besides unto them many like words', 'there were added besides unto them many new words');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    // The child band's first draft did this five times ("Holy men of God
    // spake", "They read in the book"): a quotation beginning mid-verse keeps
    // the verse's own case, so the sweep must refuse the capital.
    const broken = L.levels.child.replace('"holy men of God spake as they were moved by the Holy Ghost"', '"Holy men of God spake as they were moved by the Holy Ghost"');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(2 Peter 1:21) is not the verse: Holy men of God spake as they were moved by the Holy Ghost']);
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

  it('every double-quoted span carries a reference: the chart’s own words (Unknown, Anonymous) are never put in double quotes', () => {
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

  it('writes years the way the house does (BC and AD without periods), so the reader’s sentence splitter never cuts "A.D." from its year', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\bB\.C\.|\bA\.D\./);
    expect(L.lesson).toMatch(/\b1445 to 1405 BC\b/);
    expect(L.lesson).toMatch(/\bAD 94 to 96\b/);
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

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('God, who at sundry times and in divers manners');
    expect(inQuotes).toContain('the word of the LORD came to Jeremiah the prophet');
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
    const friend = /Friends, tell one friend this week about the two rules[^.]*\./.exec(youth);
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
    for (const k of PLACES) expect(TEXTS[k].startsWith('THE PROGRESS OF REVELATION — the Word came in order, by many hands, and stands forever.'), k).toBe(true);
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
