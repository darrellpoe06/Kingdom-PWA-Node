// @vitest-environment node
// =============================================================================
// L290 — The House Built by Wisdom: the periodic table is a map of rooms,
// three witnesses found its rules, and the Word names the Builder
// =============================================================================
// A science send read under the newsletter Way (DR-1361): a video that calls
// the periodic table a map of the rooms electrons may live in (shells as
// floors, subshells as rooms), explains the gap at the top and the two rows
// below, and credits Mendeleev (1869), Bohr (1913) and Pauli (1925). The
// research pass confirmed the history (gallium and its remeasured density;
// Moseley's atomic number) and corrected one figure narrowly (the rows run
// two, eight, eight, eighteen, eighteen, thirty-two, thirty-two). The lesson
// keeps the science whole and moves the word nature back under the name of
// the Builder (DR-0100 tier three). (DR-1381.)
//
// THIS LESSON'S DANGERS are three. (1) Teaching a wrong figure: every band
// carries the corrected row lengths, with a proof that reverting to the
// summary's four numbers is caught. (2) Throwing away the science to name the
// Builder: every band says no fact is given up. (3) Letting nature stand as
// the builder: every band carries Hebrews 3:4 and Colossians 1:17, with a
// proof that dropping "by him all things consist" is caught.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L284's, copied whole so the gates measure the same way. A verse
// is never spent (DR-1317).
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
import { bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll290-the-house-built-by-wisdom';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD =
  'THE HOUSE BUILT BY WISDOM — the periodic table is a map of rooms, three witnesses found its rules, and the Word names the Builder.';

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
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Hebrews 11:3', 'so that things which are seen were not made of things which do appear.'],
  ['Proverbs 24:3-4', 'Through wisdom is an house builded; and by understanding it is established: And by knowledge shall the chambers be filled with all precious and pleasant riches.'],
  ['Hebrews 3:4', 'For every house is builded by some man; but he that built all things is God.'],
  ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it'],
  ['John 14:2', 'In my Father’s house are many mansions'],
  ['Proverbs 3:19-20', 'The LORD by wisdom hath founded the earth; by understanding hath he established the heavens.'],
  ['Job 38:4-7', 'Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding.'],
  ['Job 38:33', 'Knowest thou the ordinances of heaven? canst thou set the dominion thereof in the earth?'],
  ['Jeremiah 33:25', 'if I have not appointed the ordinances of heaven and earth'],
  ['Proverbs 8:27-30', 'When he gave to the sea his decree, that the waters should not pass his commandment'],
  ['Isaiah 40:26', 'he calleth them all by names by the greatness of his might, for that he is strong in power; not one faileth.'],
  ['Psalms 147:4-5', 'He telleth the number of the stars; he calleth them all by their names.'],
  ['Luke 12:7', 'But even the very hairs of your head are all numbered.'],
  ['1 Corinthians 14:33', 'For God is not the author of confusion, but of peace'],
  ['1 Corinthians 14:40', 'Let all things be done decently and in order.'],
  ['Proverbs 25:2', 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.'],
  ['Psalms 111:2', 'The works of the LORD are great, sought out of all them that have pleasure therein.'],
  ['Isaiah 28:24-26', 'For his God doth instruct him to discretion, and doth teach him.'],
  ['Deuteronomy 19:15', 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.'],
  ['2 Corinthians 13:1', 'In the mouth of two or three witnesses shall every word be established.'],
  ['Romans 1:20', 'For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead'],
  ['Psalms 19:1-2', 'The heavens declare the glory of God; and the firmament sheweth his handywork.'],
  ['Psalms 104:24', 'O LORD, how manifold are thy works! in wisdom hast thou made them all: the earth is full of thy riches.'],
  ['Job 37:16', 'Dost thou know the balancings of the clouds, the wondrous works of him which is perfect in knowledge?'],
  ['Colossians 1:16-17', 'by him all things consist.'],
  ['Hebrews 1:3', 'upholding all things by the word of his power'],
  ['John 1:3', 'All things were made by him'],
  ['Psalms 33:6-9', 'For he spake, and it was done; he commanded, and it stood fast.'],
  ['Genesis 1:31', 'And God saw every thing that he had made, and, behold, it was very good.'],
  ['1 Corinthians 13:12', 'For now we see through a glass, darkly'],
  ['Romans 11:33', 'O the depth of the riches both of the wisdom and knowledge of God!'],
  ['1 Timothy 6:20-21', 'oppositions of science falsely so called'],
  ['Proverbs 1:7', 'The fear of the LORD is the beginning of knowledge'],
  ['Colossians 2:3', 'are hid all the treasures of wisdom and knowledge.'],
  ['Psalms 92:5', 'O LORD, how great are thy works! and thy thoughts are very deep.'],
  ['Psalms 139:14', 'fearfully and wonderfully made'],
  ['John 1:29', 'which taketh away the sin of the world.'],
];

describe('L290 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 290 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 290)).toEqual([290]);
  });

  it('sits after ll289 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll289-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-09');
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
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
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
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const anchors = String(L.anchor.ref)
      .split(';')
      .map((s) => parse(s.trim()))
      .filter(Boolean);
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

describe('the lesson practises the newsletter Way: the sender named, the science checked, the figure corrected, a reader length', () => {
  it('names Darrell as the sender and the video’s three witnesses in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Mendeleev/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Bohr/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Pauli/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('shows the reading: the video not fetched, the gallium story, the rule of the rooms, no percentage', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not be fetched|could not get the video/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/gallium/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/measure again|measured again|look again|retaken|taken again/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/apartment building/);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(L.lesson).toMatch(/Lecoq de Boisbaudran/);
    expect(L.lesson).toMatch(/Moseley/);
    expect(L.lesson).toMatch(/rest on the summary until the transcript lands/);
    expect(L.lesson).toMatch(/no advertising/);
  });

  it('corrects the row lengths in every text: two, eight, eight, eighteen, eighteen, thirty-two, thirty-two', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/two, eight, eight, eighteen, eighteen,? thirty-two,? and thirty-two|two, eight, eight, eighteen, eighteen, thirty-two, thirty-two/);
  });

  it('PROVEN TO CATCH: a band that reverts to the summary’s four row lengths is named', () => {
    const youth = L.levels.youth.replace('the rows run two, eight, eight, eighteen, eighteen, thirty-two, thirty-two', 'the rows run two, eight, eighteen, thirty-two');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth).not.toMatch(/two, eight, eight, eighteen, eighteen,? thirty-two,? and thirty-two|two, eight, eight, eighteen, eighteen, thirty-two, thirty-two/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure of the map, the rules, the witnesses and the Builder, in the lesson and in every band', () => {
  it('carries the things unseen and the house built by Wisdom in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('so that things which are seen were not made of things which do appear.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Through wisdom is an house builded; and by understanding it is established');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For every house is builded by some man; but he that built all things is God.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('In my Father’s house are many mansions');
  });

  it('calls the rules His ordinances and counts what He made, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Knowest thou the ordinances of heaven?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He telleth the number of the stars');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But even the very hairs of your head are all numbered.');
  });

  it('honors the search and the remeasure, and the three witnesses, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The works of the LORD are great, sought out of all them that have pleasure therein.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The heavens declare the glory of God');
  });

  it('names the Builder the video calls nature and confesses the Son by whom all things consist (DR-0210), in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For by him were all things created');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('by him all things consist.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('which taketh away the sin of the world.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/nature/);
  });

  it('PROVEN TO CATCH: a band that drops "by him all things consist" is named', () => {
    const teen = L.levels.teen.replace('"And he is before all things, and by him all things consist." (Colossians 1:17).', 'He is great.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('by him all things consist.')).toBe(false);
  });

  it('keeps the science whole while naming the Builder, and stays humble about the model, in every text', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/Not one fact|not one fact|No fact|no fact/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For now we see through a glass, darkly');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('oppositions of science falsely so called');
  });

  it('ends in praise and the week’s practice in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('O LORD, how manifold are thy works! in wisdom hast thou made them all');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('O LORD, how great are thy works!');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('fearfully and wonderfully made');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/number thirty-one/);
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/a link and a summary Darrell sent/);
    expect(L.inApp).toMatch(/parables with invented people/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(200);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(190);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'The works of the LORD are great, sought out of all them that have pleasure therein.',
      'The works of the LORD are great, sought out of all them that have joy therein.'
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"by him all things consist." (Colossians 1:17)',
      '"By him all things consist." (Colossians 1:17)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Colossians 1:17) is not the verse: By him all things consist.']);
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
    expect(inQuotes).toContain('For every house is builded by some man; but he that built all things is God.');
    expect(inQuotes).toContain('The works of the LORD are great');
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
    const friend = /Friends, tell one friend this week about the empty room Mendeleev named[^.]*\./.exec(youth);
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
