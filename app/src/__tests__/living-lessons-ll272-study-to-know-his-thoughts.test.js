// @vitest-environment node
// =============================================================================
// L272 — Study to Know His Thoughts: faith stands on the evidence of the unseen
// =============================================================================
// The follow-up word Darrell spoke into the app minutes after the teaching
// behind L271, the same evening (2026-10-29): "you can't say what he says if
// you don't know what he says. And you can't think his thoughts if you don't
// know what his thoughts are. So studying the word is a very important piece
// ... When I say study, I don't mean just reading it ... We can't see air
// either ... faith is the substance of things hoped for, the evidence of
// things not seen ... It's actually crazy not to believe God." Then: "It can
// also be a follow up to the lesson..." -- so it is its own lesson, the next
// one in the catalog, and both name each other (DR-1291).
//
// THIS LESSON'S DANGERS. (1) Teaching "study" as reading -- he said the
// opposite, so every band must say study is not just reading. (2) Inventing
// a lexicon: the worked example (evidence, Hebrews 11:1, Jeremiah 32) compares
// the ENGLISH of the King James text on the page and claims nothing about
// Hebrew or Greek, and the gate refuses either word in the reader's text. (3)
// Hedging established fact: air and atoms are real and unseen, stated plainly
// (DR-0100), in every band. The helpers are L270's, copied whole.
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

const ID = 'll272-study-to-know-his-thoughts';
const PREV_ID = 'll271-let-yahweh-defend-me';
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
  ['Isaiah 55:8-9', 'my thoughts than your thoughts'],
  ['1 Corinthians 2:16', 'But we have the mind of Christ'],
  ['Romans 10:17', 'So then faith cometh by hearing, and hearing by the word of God'],
  ['2 Timothy 2:15', 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so'],
  ['Hebrews 11:1', 'Now faith is the substance of things hoped for, the evidence of things not seen'],
  ['Jeremiah 32:9-10', 'And I subscribed the evidence, and sealed it'],
  ['Jeremiah 32:14-15', 'Houses and fields and vineyards shall be possessed again in this land'],
  ['John 3:8', 'The wind bloweth where it listeth'],
  ['2 Kings 6:15-17', 'the mountain was full of horses and chariots of fire round about Elisha'],
  ['2 Corinthians 4:18', 'the things which are not seen are eternal'],
  ['Matthew 7:24-25', 'it fell not: for it was founded upon a rock'],
  ['James 1:5-8', 'A double minded man is unstable in all his ways'],
  ['Acts 26:24-25', 'I am not mad, most noble Festus; but speak forth the words of truth and soberness'],
];

describe('L272 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 272 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 272)).toEqual([272]);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-29');
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
    expect(refs.length).toBeGreaterThanOrEqual(25);
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
  it('opens by naming the lesson it follows, and that lesson is the one before it in the catalog', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Let Yahweh Defend Me/);
    expect(L.lesson).toMatch(/This lesson follows Let Yahweh Defend Me/);
    expect(L.lesson).toMatch(/the same evening/);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[i - 1] && LIVING_LESSONS_MODULES[i - 1].id).toBe(PREV_ID);
  });

  it('says his opening line: you cannot say what He says if you do not know what He says', () => {
    expect(L.lesson).toMatch(/You cannot say what He says if you do not know what He says\. You cannot think His thoughts if you do not know what His thoughts are\./);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/say what (He|Yahweh) says/);
  });

  it('teaches study as more than reading, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/not mean (just|only) reading/);
  });

  it('PROVEN TO CATCH: a band that lets study collapse into reading is named', () => {
    const youth = L.levels.youth.replace(/not mean (just|only) reading/g, 'mean reading');
    expect(youth).not.toBe(L.levels.youth);
    expect(/not mean (just|only) reading/.test(youth)).toBe(false);
  });

  it('works one word through the Word (evidence: Hebrews 11:1 into Jeremiah 32) in the lesson and every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toContain('(Hebrews 11:1)');
      expect(TEXTS[k], k).toMatch(/\(Jeremiah 32:(9-10|10|14|14-15|15)\)/);
    }
  });

  it('claims nothing about Hebrew or Greek: the comparison is the English on the page, and the limit is stated', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\b(Hebrew|Greek)\b/);
    expect(L.inApp).toMatch(/makes no claim about Hebrew or Greek words/);
    expect(L.lesson).toMatch(/The King James Bible uses the same English word, evidence/);
  });

  it('states the unseen-but-real examples he gave as established fact, in the lesson and every band (DR-0100)', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: air`).toMatch(/\bsee (the )?air\b/);
      expect(TEXTS[k], `${k}: atoms`).toMatch(/\batoms?\b/);
      expect(TEXTS[k], k).not.toMatch(/some (say|claim)|no one knows|cannot be known/i);
    }
  });

  it('names the double mind and ends on his last line: it is crazy not to believe Him', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toMatch(/double minded|double-minded/i);
      expect(TEXTS[k], k).toContain('I am not mad, most noble Festus');
    }
    expect(L.lesson).toMatch(/It is actually crazy not to believe Him\./);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(155);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(140);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('And I subscribed the evidence, and sealed it', 'And I subscribed the evidence, and signed it');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    // The child band's first draft did this five times ("Blessed are they",
    // "And it fell not"): a quotation beginning mid-verse keeps the verse's case.
    const broken = L.levels.child.replace('"blessed are they that have not seen, and yet have believed."', '"Blessed are they that have not seen, and yet have believed."');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(John 20:29) is not the verse: Blessed are they that have not seen, and yet have believed.']);
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

  it('PROVEN TO CATCH: his spoken "crazy not to believe God", copied through unquoted, is refused', () => {
    const planted = 'It is actually crazy not to believe God.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('hearing by the word of God');
    expect(inQuotes).toContain('The LORD is my rock');
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
    const friend = /Friends, tell one friend this week about Elisha[^.]*\./.exec(youth);
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
    for (const k of PLACES) expect(TEXTS[k].startsWith('STUDY TO KNOW HIS THOUGHTS — faith stands on the evidence of the unseen.'), k).toBe(true);
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
