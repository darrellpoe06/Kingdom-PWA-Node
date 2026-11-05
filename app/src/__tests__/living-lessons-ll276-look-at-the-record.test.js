// @vitest-environment node
// =============================================================================
// L276 — Look at the Record: bad leadership, a narrative louder than the data,
// and the gift that makes room
// =============================================================================
// Darrell spoke a second teaching into the app on 2026-11-05, minutes after the
// one behind L275: "Unhealthy environments caused by bad leadership, who don't
// have integrity, who take credit for things that they don't actually have
// credit for, who they only have a certain amount of time ... Yahweh is using
// these people ... to give me skill ... the joy of the Lord is your strength ...
// just look at the record and I'll be quiet over here as you see excellence ...
// give me a critique about my record ... and I will adjust and humble myself ...
// let your yay be yay and your nay be nay ... God will use your gift to make
// room for you ... He's the shepherd of our souls. Let him do his job ... it's
// his job to get him glory through me ... let the chips fall when they may.
// God's got the rest promise." (DR-1317.)
//
// THIS LESSON'S DANGERS are three, and all are about his framing. (1) Turning
// "I'll be quiet" into a teaching that never adjusts -- he said a critique of
// the record gets humility, so BOTH rules (silence for the false story,
// humility for the true critique) are pinned in the lesson AND every band.
// (2) Turning "the room is the problem" into revenge -- he said it fuels
// building better environments, not revenge, so Proverbs 24:29 is pinned
// everywhere. (3) Losing the follow-up shape: this lesson opens by naming
// L275 and sits directly after it. Each is pinned by its own case below, and
// each has a proof that it catches.
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

const ID = 'll276-look-at-the-record';
const PREV_ID = 'll275-integrity-is-the-only-thing-that-makes-you-rich';
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
  ['Ezekiel 34:2-3', 'Woe be to the shepherds of Israel that do feed themselves'],
  ['Proverbs 20:6', 'Most men will proclaim every one his own goodness'],
  ['Psalms 37:10', 'For yet a little while, and the wicked shall not be'],
  ['Proverbs 29:12', 'If a ruler hearken to lies, all his servants are wicked'],
  ['Judges 3:1-2', 'to teach them war'],
  ['1 Samuel 17:34-37', 'Thy servant slew both the lion and the bear'],
  ['Nehemiah 8:10', 'the joy of the LORD is your strength'],
  ['Psalms 37:13', 'The Lord shall laugh at him: for he seeth that his day is coming'],
  ['Proverbs 18:17', 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him'],
  ['Job 16:19', 'my record is on high'],
  ['Habakkuk 2:2', 'Write the vision, and make it plain upon tables'],
  ['Esther 6:2', 'it was found written, that Mordecai had told of Bigthana and Teresh'],
  ['Psalms 39:1', 'I will keep my mouth with a bridle, while the wicked is before me'],
  ['Nehemiah 6:8', 'thou feignest them out of thine own heart'],
  ['Psalms 141:5', 'Let the righteous smite me; it shall be a kindness'],
  ['Proverbs 24:29', 'Say not, I will do so to him as he hath done to me'],
  ['Matthew 5:37', 'Yea, yea; Nay, nay'],
  ['Ecclesiastes 7:21-22', 'take no heed unto all words that are spoken'],
  ['Proverbs 18:16', 'A man’s gift maketh room for him, and bringeth him before great men'],
  ['Genesis 31:42', 'God hath seen mine affliction and the labour of my hands'],
  ['1 Peter 2:25', 'the Shepherd and Bishop of your souls'],
  ['1 Corinthians 1:29-31', 'That no flesh should glory in his presence'],
  ['James 1:23-25', 'beholding his natural face in a glass'],
  ['Proverbs 16:33', 'The lot is cast into the lap; but the whole disposing thereof is of the LORD'],
  ['Psalms 37:7', 'fret not thyself because of him who prospereth in his way'],
];

describe('L276 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 276 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 276)).toEqual([276]);
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
  it('opens by naming the lesson it follows, and that lesson sits directly before it in the catalog', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Integrity Is the Only Thing That Makes You Rich/);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[i - 1] && LIVING_LESSONS_MODULES[i - 1].id).toBe(PREV_ID);
    expect(LIVING_LESSONS_MODULES[i - 1].title.startsWith('Integrity Is the Only Thing That Makes You Rich')).toBe(true);
  });

  it('names the bad leader the way he did, and puts his clock on him', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Proverbs 20:6\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Psalms 37:10\)/);
    expect(L.lesson).toMatch(/take credit for things they do not actually have credit for/);
    expect(L.lesson).toMatch(/only have a certain amount of time/);
  });

  it('keeps the turn the lesson hangs on: develop me, with the lion and the bear', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/develop me/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy servant slew both the lion and the bear');
  });

  it('keeps his words on pressure and perception, and the joy of Yahweh as the strength', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the joy of the LORD is your strength');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/laugh/);
    expect(L.lesson).toMatch(/not necessarily pressure/);
  });

  it('keeps the center: the documented record outranks the narrative, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/look at the record/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that is first in his own cause seemeth just');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Esther 6:2\)/);
    expect(L.lesson).toMatch(/documented reasons/);
    expect(L.lesson).toMatch(/timelines/);
  });

  it('keeps BOTH rules: silence for the false story, humility for the true critique', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Psalms 39:1\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/humble/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Proverbs 9:8(-9)?\)/);
    expect(L.lesson).toMatch(/A critique grounded in the record gets your full humility/);
  });

  it('PROVEN TO CATCH: a band that drops the humility rule is named', () => {
    const teen = L.levels.teen.replace(/humble/g, 'proud');
    expect(teen).not.toBe(L.levels.teen);
    expect(/humble/.test(teen)).toBe(false);
  });

  it('keeps the fuel as building, not revenge, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Say not, I will do so to him as he hath done to me');
    expect(L.lesson).toMatch(/building better environments for souls, not revenge/);
  });

  it('keeps yea be yea, the gift that makes room, the Shepherd of souls, and whose job His glory is', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Yea, yea; Nay, nay');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('maketh room for him');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Shepherd/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/(His|Yahweh’s) job/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/let the chips fall/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Proverbs 16:33\)/);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
  });

  it('names no employer, no colleague and no real leader: the teaching is about the pattern, not a person', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\b(my (boss|manager|director)|at my company|our CEO)\b/i);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(700);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(670);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('A man’s gift maketh room for him', 'A man’s gift maketh space for him');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"the joy of the LORD is your strength." (Nehemiah 8:10)', '"The joy of the LORD is your strength." (Nehemiah 8:10)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Nehemiah 8:10) is not the verse: The joy of the LORD is your strength.']);
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

  it('PROVEN TO CATCH: his spoken "God\'s got the rest", copied through unquoted, is refused', () => {
    const planted = 'He said God has the rest, promise.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('the joy of the LORD is your strength');
    expect(inQuotes).toContain('God hath seen mine affliction');
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
    const friend = /Friends, tell one friend this week about a door Yahweh opened[^.]*\./.exec(youth);
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
    for (const k of PLACES) expect(TEXTS[k].startsWith('LOOK AT THE RECORD — bad leadership, a narrative louder than the data, and the gift that makes room.'), k).toBe(true);
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
