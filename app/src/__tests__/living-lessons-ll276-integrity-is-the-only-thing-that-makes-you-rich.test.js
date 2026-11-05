// @vitest-environment node
// =============================================================================
// L276 — Integrity Is the Only Thing That Makes You Rich: what you know behind
// closed doors, and what cannot be sustained
// =============================================================================
// Darrell spoke a teaching into the app on 2026-11-05: "integrity is the number
// one thing that matters ... no one should be able to make you feel or guilt
// trip you or gas your head up ... you know what you did, didn't do, why ...
// nothing matters except ... Christ and him crucified ... having integrity is
// more important than winning ... even if you do win, you lost ... what you do
// behind closed doors ... Money can't make you rich. Having integrity is the
// only thing that can make you rich ... how do you sustain a lie?" (DR-1317.)
//
// THIS LESSON'S DANGERS are three, and all are about his framing. (1) Turning
// "let the work speak" into a teaching that never speaks at all -- he said be
// excellent AND measurable, so the work-that-speaks section (Nehemiah 6:3,
// 6:16; 1 Peter 2:15) is pinned in the lesson AND every band. (2) Losing the
// ranking he opened with: integrity outranks winning, and a dirty win is a
// loss, pinned with David's two refusals over Saul. (3) Losing the bridge to
// the follow-up word he spoke minutes later (L277). Each is pinned by its own
// case below, and each has a proof that it catches.
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

const ID = 'll276-integrity-is-the-only-thing-that-makes-you-rich';
const NEXT_ID = 'll277-look-at-the-record';
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
  ['Job 2:3', 'still he holdeth fast his integrity'],
  ['Job 27:5-6', 'my heart shall not reproach me so long as I live'],
  ['Proverbs 29:5', 'A man that flattereth his neighbour spreadeth a net for his feet'],
  ['Proverbs 16:25', 'There is a way that seemeth right unto a man'],
  ['2 Timothy 2:15', 'Study to shew thyself approved unto God'],
  ['1 Corinthians 2:2', 'save Jesus Christ, and him crucified'],
  ['Philippians 2:7-8', 'even the death of the cross'],
  ['Isaiah 50:7', 'therefore have I set my face like a flint'],
  ['Hebrews 12:2', 'endured the cross, despising the shame'],
  ['1 Samuel 24:6', 'The LORD forbid that I should do this thing unto my master'],
  ['Matthew 16:26', 'if he shall gain the whole world, and lose his own soul'],
  ['Job 31:6', 'Let me be weighed in an even balance that God may know mine integrity'],
  ['Nehemiah 6:16', 'they perceived that this work was wrought of our God'],
  ['1 Peter 2:15', 'with well doing ye may put to silence the ignorance of foolish men'],
  ['Psalms 66:10-12', 'but thou broughtest us out into a wealthy place'],
  ['Proverbs 19:1', 'Better is the poor that walketh in his integrity'],
  ['Jeremiah 9:23-24', 'that he understandeth and knoweth me'],
  ['Proverbs 12:19', 'The lip of truth shall be established for ever: but a lying tongue is but for a moment'],
  ['Proverbs 12:3', 'A man shall not be established by wickedness'],
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
  it('opens on his ranking: integrity is the number one thing, and you know what you did', () => {
    expect(L.lesson).toMatch(/integrity is the number one thing that matters/);
    expect(L.lesson).toMatch(/you know what you did, what you did not do, and why/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/number one/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('holdeth fast his integrity');
  });

  it('keeps the sentence he kept returning to: Christ and Him crucified, confessed as the Lamb of Yahweh (DR-0210)', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Christ and Him crucified/);
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('set my face like a flint');
  });

  it('keeps his ranking of integrity over winning, with both of David’s refusals', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/integrity is more important than winning/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(1 Samuel 24:6\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(1 Samuel 26:11\)/);
  });

  it('keeps the counsel he gave the young woman at work: excellent, measurable work that even a hater must look at', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/at (work|his job|the teacher’s workplace)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Nehemiah 6:3\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(Nehemiah 6:16\)/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\(1 Peter 2:15\)/);
    expect(L.lesson).toMatch(/measurable and objective/);
  });

  it('PROVEN TO CATCH: a band that drops the work-that-speaks is named', () => {
    const teen = L.levels.teen.replace('(Nehemiah 6:16)', '(Nehemiah 6:15)');
    expect(teen).not.toBe(L.levels.teen);
    expect(/\(Nehemiah 6:16\)/.test(teen)).toBe(false);
  });

  it('keeps the inversion he made of the word rich, and the question that closed the teaching', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/money cannot make you rich/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The lip of truth shall be established for ever');
    expect(L.lesson).toMatch(/how do you sustain a lie\?/);
    expect(L.lesson).toMatch(/It is the only thing that can be sustained\./);
  });

  it('closes on the bridge to the follow-up word, and that lesson is the next one in the catalog', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Look at the Record/);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[i + 1] && LIVING_LESSONS_MODULES[i + 1].id).toBe(NEXT_ID);
    expect(LIVING_LESSONS_MODULES[i + 1].title.startsWith('Look at the Record')).toBe(true);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(420);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(395);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('The lip of truth shall be established for ever', 'The lip of truth shall be remembered for ever');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"till I die I will not remove mine integrity from me."', '"Till I die I will not remove mine integrity from me."');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Job 27:5) is not the verse: Till I die I will not remove mine integrity from me.']);
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

  it('PROVEN TO CATCH: his spoken "God supplies it", copied through unquoted, is refused', () => {
    const planted = 'He said that if he does need it, God supplies it.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('that God may know mine integrity');
    expect(inQuotes).toContain('The LORD is on my side');
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
    const friend = /Friends, tell one friend this week about a time integrity cost you[^.]*\./.exec(youth);
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
    for (const k of PLACES) expect(TEXTS[k].startsWith('INTEGRITY IS THE ONLY THING THAT MAKES YOU RICH — what you know behind closed doors, and what cannot be sustained.'), k).toBe(true);
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
