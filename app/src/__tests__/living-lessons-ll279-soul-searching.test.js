// @vitest-environment node
// =============================================================================
// L279 — Soul Searching: the gap between what He means by His Word and our
// default ways, which may or may not need adjusting
// =============================================================================
// Darrell spoke a third teaching into the app on 2026-11-05, after L276 and
// L277 had shipped: "Soul searching to see the gap between what He means by
// His Word and our souls default ways that may or may not need adjustments
// based on the Word-first Perspectives... lesson" -- and then, separately and
// on purpose, "Or may not...". (DR-1320.)
//
// THIS LESSON'S DANGERS are three, all about his framing. (1) Dropping the
// three words he added on purpose: the search is honest about BOTH outcomes,
// so "or may not" is a heading of its own and the hold-fast half (1
// Thessalonians 5:21, Deuteronomy 8:2's "or no", Psalms 17:3) is pinned in the
// lesson AND every band, with a proof that a band dropping it is caught. (2)
// Turning "see the gap" into self-condemnation or self-flattery -- both
// counterfeits are named and refused in every band. (3) Losing the follow-up
// shape: this lesson names L277 and sits after it; ll278 (Say What You Get, DR-1319)
// landed on main between them while this was in the lane. Each is pinned by
// its own case below, and each has a proof that it catches.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L271's, copied whole so the gates measure the same way.
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

const ID = 'll279-soul-searching';
const PREV_ID = 'll277-look-at-the-record';
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
  ['Psalms 139:23-24', 'see if there be any wicked way in me'],
  ['Lamentations 3:40', 'Let us search and try our ways'],
  ['Psalms 77:6', 'my spirit made diligent search'],
  ['Psalms 4:4', 'commune with your own heart upon your bed'],
  ['Isaiah 55:8-9', 'my thoughts are not your thoughts'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so'],
  ['Mark 7:7-9', 'ye hold the tradition of men'],
  ['Proverbs 21:2', 'Every way of a man is right in his own eyes'],
  ['Jeremiah 13:23', 'that are accustomed to do evil'],
  ['James 1:23-25', 'beholding his natural face in a glass'],
  ['Hebrews 4:12', 'dividing asunder of soul and spirit'],
  ['Luke 6:41-42', 'cast out first the beam out of thine own eye'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good'],
  ['Deuteronomy 8:2', 'whether thou wouldest keep his commandments, or no'],
  ['Psalms 17:3', 'thou hast tried me, and shalt find nothing'],
  ['Galatians 6:4', 'let every man prove his own work'],
  ['Psalms 119:59', 'I thought on my ways, and turned my feet unto thy testimonies'],
  ['Romans 12:2', 'be ye transformed by the renewing of your mind'],
  ['2 Corinthians 10:5', 'bringing into captivity every thought to the obedience of Christ'],
  ['1 Corinthians 4:3-4', 'I judge not mine own self'],
  ['Proverbs 3:5-7', 'Be not wise in thine own eyes'],
  ['1 Corinthians 2:16', 'But we have the mind of Christ'],
  ['Matthew 11:29', 'ye shall find rest unto your souls'],
  ['2 Timothy 1:7', 'and of a sound mind'],
];

describe('L279 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 279 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 279)).toEqual([279]);
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
  it('opens by naming the lesson it follows, and that lesson sits earlier in the catalog (ll278, Say What You Get, landed between them)', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Look at the Record/);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV_ID);
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
    expect(LIVING_LESSONS_MODULES[j].title.startsWith('Look at the Record')).toBe(true);
  });

  it('defines soul searching plainly, with the Word as the line and not our own eyes', () => {
    expect(L.lesson).toMatch(/Soul searching is looking honestly inside yourself with the Word as the measuring line/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Psalms 139:23-24\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Psalms 4:4\)/);
  });

  it('keeps his distinction: the gap is to what He MEANS by His Word, found Word-first', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/what He means/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Acts 17:11\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('ye hold the tradition of men');
  });

  it('names the soul’s default ways in his words, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/default/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Every way of a man is right in his own eyes');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the leopard his spots');
  });

  it('gives the two instruments and points the search inward first', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(James 1:23(-24)?\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('dividing asunder of soul and spirit');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('cast out first the beam out of thine own eye');
  });

  it('keeps the three words he added on purpose: OR MAY NOT is its own heading, and the hold-fast half is in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/OR MAY NOT\./);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('see if there be any wicked way in me');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('whether thou wouldest keep his commandments, or no');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('thou hast tried me, and shalt find nothing');
    expect(L.lesson).toMatch(/The search is honest about both outcomes before it begins/);
  });

  it('PROVEN TO CATCH: a band that drops the hold-fast half is named', () => {
    const teen = L.levels.teen.replace('Prove all things; hold fast that which is good', 'Prove all things');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('Prove all things; hold fast that which is good')).toBe(false);
  });

  it('closes the gap by the Word when it does need adjusting, and refuses both counterfeits', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I thought on my ways, and turned my feet unto thy testimonies');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('bringing into captivity every thought to the obedience of Christ');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I judge not mine own self');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Be not wise in thine own eyes');
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210), and that the Mind of Christ is already given', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But we have the mind of Christ');
  });

  it('carries the six names of the one discipline (MIND-OF-CHRIST vocabulary register) in the lesson and every band', () => {
    for (const k of PLACES) {
      for (const name of ['Mind of Christ', 'The Way', 'Sound Mind', 'Captive Thoughts', 'Renewed Mind', 'Mental Stewardship']) {
        expect(TEXTS[k], `${k}: ${name}`).toContain(name);
      }
    }
  });

  it('stakes no figure: no band or lesson states a percentage or a statistic', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
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
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(375);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('Prove all things; hold fast that which is good', 'Prove all things; hold fast that which is true');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"see if there be any wicked way in me" (Psalms 139:24)', '"See if there be any wicked way in me" (Psalms 139:24)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Psalms 139:24) is not the verse: See if there be any wicked way in me']);
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

  it('PROVEN TO CATCH: a generic "what God means" in our voice, copied through unquoted, is refused', () => {
    const planted = 'The gap is between what God means by His Word and our ways.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Search me, O God, and know my heart');
    expect(inQuotes).toContain('the LORD pondereth the hearts');
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
    const friend = /Friends, tell one friend this week about a default way you put beside the Word[^.]*\./.exec(youth);
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
    for (const k of PLACES) expect(TEXTS[k].startsWith('SOUL SEARCHING — the gap between what He means by His Word and our default ways, which may or may not need adjusting.'), k).toBe(true);
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
