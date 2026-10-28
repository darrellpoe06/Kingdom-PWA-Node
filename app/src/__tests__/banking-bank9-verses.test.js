// @vitest-environment node
// =============================================================================
// bank9 — The moat that moves: the bank changed its ground
// =============================================================================
// Darrell forwarded a business newsletter to himself on 2026-10-19 with one word
// typed above the body: Lessons. The newsletter was The Daily Upside for that
// morning (Gmail thread 1a1541f1da7acd58), and its banking item reported that
// Morgan Stanley's wealth management business had a record third quarter after a
// direction set in the years following the 2008 financial crisis.
//
// THE TWO FAILURES THIS LESSON SITS BETWEEN, and this gate holds both ends.
//
//   1. A BORROWED NUMBER WORN AS OUR OWN. A lesson that quotes every verse
//      verbatim and then states $232 billion as though we had opened the firm's
//      own release would pass every verse gate in the house and still
//      misrepresent what we know. So the figures sit in two DECLARED piles, and
//      the piles are pinned here: five figures a GitHub runner read straight
//      back off Morgan Stanley's own third-quarter release (lesson-sources.json
//      carries the row; witness runs 40776657937 / 40777096354 / 40777425081),
//      and three that remain The Daily Upside's report and are labelled as such
//      in the adult text and in all four bands.
//   2. HEDGING A REPORTED FACT INTO NOTHING, and sneering at competence. The
//      move from deal income to a yearly charge on administered assets really is
//      steadier, and the lesson says so plainly BEFORE it asks what the new
//      ground is made of. A gate below requires that sentence to be there.
//
// WHAT THE RUNNER ACTUALLY SETTLED, and what it did not. The sandbox cannot
// reach morganstanley.com at all -- the agent proxy answers 403 to the CONNECT
// -- so "we cannot check this" would have described one agent's reach and not
// the team's (DR-0108). Three probe runs on a throwaway branch found the release
// at .../shareholder/3q2026.pdf and then found which strings it really prints:
// "net new assets were $232 billion", "net revenues of $9.1 billion",
// "compared with $8.2 billion", "up 41%", "$10.5 trillion". It does NOT print
// "$81 billion", "$5.8 billion", "Sharon Yeshaya", "net new assets of $232
// billion" or "client assets of $10.5 trillion" -- so the FIGURES are the firm's
// and some of the LABELS are the newsletter's reading of them, and the lesson
// says exactly that rather than rounding it up.
//
// THE PIN THAT WOULD HAVE PROVED NOTHING. legacy8 pinned 367,000 for its own
// disclosure and the strip proof passed with the disclosure deleted, because the
// figure also appeared in the body. "nearly 40 percent" is that same trap here:
// it is in the teaching AND in the disclosure. So the pinned phrase is
// "nobody here opened", which occurs only inside the disclosure paragraph.
//
// The newsletter also carried a sponsor's tax-webinar advertisement and three
// unrelated items (sports betting, dating apps, a carmaker's quarter). None of
// it is germane and none of it is taught; a check below refuses it a foothold in
// any string of the module.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BANKING_MODULES, BANKING_META } from '../lib/banking-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'bank9-the-moat-that-moves';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = BANKING_MODULES.find((m) => m.id === ID);
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
/** The corpus text a reference names (plain or range), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it. Split on the quote
 *  character rather than a {10,} regex, so a long span cannot slip the pairing. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. Contiguous only. */
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

// THE SPINE, pinned by literal text. Every span was read off the corpus on disk
// before it was written, and one span stands for each anchored reference.
const SPINE = [
  ['Matthew 7:24', 'I will liken him unto a wise man, which built his house upon a rock'],
  ['Matthew 7:25', 'and beat upon that house; and it fell not: for it was founded upon a rock'],
  ['Matthew 7:26', 'shall be likened unto a foolish man, which built his house upon the sand'],
  ['Matthew 7:27', 'and beat upon that house; and it fell: and great was the fall of it'],
  ['Ecclesiastes 11:1', 'Cast thy bread upon the waters: for thou shalt find it after many days'],
  ['Ecclesiastes 11:2', 'Give a portion to seven, and also to eight; for thou knowest not what evil shall be upon the earth'],
  ['Ecclesiastes 11:6', 'In the morning sow thy seed, and in the evening withhold not thine hand'],
  ['Proverbs 23:4', 'Labour not to be rich: cease from thine own wisdom'],
  ['Proverbs 23:5', 'for riches certainly make themselves wings; they fly away as an eagle toward heaven'],
  ['Deuteronomy 8:17', 'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth'],
  ['Deuteronomy 8:18', 'for it is he that giveth thee power to get wealth, that he may establish his covenant'],
  ['Psalms 62:10', 'if riches increase, set not your heart upon them'],
  ['Jeremiah 9:23', 'Let not the wise man glory in his wisdom, neither let the mighty man glory in his might'],
  ['Jeremiah 9:24', 'that I am the LORD which exercise lovingkindness, judgment, and righteousness, in the earth'],
];

// THE REPORT AS DATA, not as memory. Exactly the figures The Daily Upside
// printed on 2026-10-19, each with the places that must carry it. The child band
// carries the two largest figures and the concentration and not the revenue
// lines, by design, because it is written for a nine-year-old.
const REPORTED = [
  { figure: '$232 billion', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
  { figure: '$10.5 trillion', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
  { figure: 'nearly 40 percent', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
  { figure: '$81 billion', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '$9.1 billion', where: ['adult', 'teen', 'senior'] },
  { figure: '$8.2 billion', where: ['adult', 'teen', 'senior'] },
  { figure: '$5.8 billion', where: ['adult', 'teen', 'senior'] },
  { figure: '41 percent', where: ['adult', 'teen', 'senior'] },
];

// The five strings a GitHub runner read back off the publisher's own page, with
// the run that read each of them. Pinned so the lesson's claim to have checked
// them is backed by the sources file rather than by its own prose.
const READ_BACK = [
  'net new assets were $232 billion',
  'net revenues of $9.1 billion',
  'compared with $8.2 billion',
  'up 41%',
  '$10.5 trillion',
];

describe('bank9 is in the course, numbered, and whole', () => {
  it('exists exactly once as the ninth lesson with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(BANKING_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(BANKING_MODULES).toHaveLength(9);
    expect(BANKING_MODULES[8].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims bank9 exactly once, and the course numbers stay 1 to 9 with no gap', () => {
    // BOTH id shapes are counted, because reading only one of them is how the
    // maximum gets read wrong (the two-record-shape bug in unchecked-claims).
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'banking-course.js'), 'utf8');
    const js = [...src.matchAll(/\bid:\s*'(bank\d+-[^']*)'/g)].map((m) => m[1]);
    const json = [...src.matchAll(/"id"\s*:\s*"(bank\d+-[^"]*)"/g)].map((m) => m[1]);
    const both = [...js, ...json];
    expect(both.filter((x) => x === ID)).toHaveLength(1);
    const numbers = both.map((x) => Number(/^bank(\d+)-/.exec(x)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Math.max(...numbers)).toBe(9);
  });

  it('the course says nine lessons wherever it states a count, and is reachable with all nine', () => {
    expect(BANKING_META.format).toContain('9 lessons');
    expect(BANKING_META.weeks).toBe(9);
    const row = LEARN_CATALOG.find((e) => e.key === 'banking');
    expect(row.buildScheduleRows().map((m) => m.id)).toContain(ID);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = anchorRefs(L);
    expect(refs.length).toBe(14);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('every quoted reference is covered by the anchor, so Search it out can reach every verse the lesson stands on', () => {
    const anchors = new Set(anchorRefs(L));
    const quoted = [...new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref)).filter(Boolean))];
    expect(quoted.length).toBeGreaterThanOrEqual(13);
    expect(quoted.filter((r) => !anchors.has(r))).toEqual([]);
  });

  it('stands on ground no sibling course in its department holds, measured on the live catalog', () => {
    const siblings = new Set();
    for (const e of LEARN_CATALOG) {
      if (e.key === 'banking' || e.meta.category !== 'Kingdom Life & Stewardship') continue;
      for (const m of e.buildScheduleRows()) {
        for (const part of String((m.anchor && m.anchor.ref) || '').split(';')) {
          const ref = part.trim();
          if (ref) siblings.add(ref.split(':')[0].trim());
        }
      }
    }
    expect(siblings.size, 'the sibling chapter set is empty — this check measures nothing').toBeGreaterThan(10);
    const mine = [...new Set(anchorRefs(L).map((r) => r.split(':')[0].trim()))].sort();
    expect(mine).toEqual(['Deuteronomy 8', 'Ecclesiastes 11', 'Jeremiah 9', 'Matthew 7', 'Proverbs 23', 'Psalms 62']);
    expect(mine.filter((bc) => siblings.has(bc))).toEqual([]);
  });
});

describe('the newsletter is the source, said out loud, and never worn as our own', () => {
  it('names the Gmail forward, the one word on it, and the newsletter by name', () => {
    expect(L.lesson).toMatch(/forwarded a business newsletter to himself on October 19, 2026/);
    expect(L.lesson).toMatch(/one word typed above the body: Lessons/);
    expect(L.lesson).toMatch(/The Daily Upside/);
    expect(L.lesson).toMatch(/Morgan Stanley/);
  });

  it('every figure the lesson speaks is the newsletter’s figure, in the lesson and in each band that reports it', () => {
    const missing = [];
    for (const { figure, where } of REPORTED) {
      for (const place of where) if (!TEXTS[place].includes(figure)) missing.push(`${place}: ${figure}`);
    }
    expect(missing).toEqual([]);
  });

  // AND THE PRESENCE CHECK ALONE WOULD HAVE PASSED A TYPO, which is why this
  // second measure exists. Measured: a deliberate break changing the child
  // band's "$232 billion" to "$233 billion" left the presence check GREEN,
  // because the same figure also appears in that band's disclosure paragraph —
  // the identical trap legacy8's first strip proof fell into. So the real pin
  // is the EXACT SET of money and percentage tokens each place may contain. A
  // wrong figure is then a token that is not on the list, wherever it is
  // written, and a right figure cannot be shadowed by its own second mention.
  const MONEY = /\$[\d.,]+\s(?:billion|trillion)/g;
  const PCT = /\b(?:nearly\s)?\d+(?:\.\d+)?\spercent\b/g;
  const figureTokens = (t) => [...new Set([...(String(t).match(MONEY) || []), ...(String(t).match(PCT) || [])])].sort();
  const TOKENS = {
    adult: ['$10.5 trillion', '$232 billion', '$5.8 billion', '$8.2 billion', '$81 billion', '$9.1 billion', '41 percent', 'nearly 40 percent'],
    child: ['$10.5 trillion', '$232 billion', 'nearly 40 percent'],
    youth: ['$10.5 trillion', '$232 billion', '$81 billion', 'nearly 40 percent'],
    teen: ['$10.5 trillion', '$232 billion', '$5.8 billion', '$8.2 billion', '$81 billion', '$9.1 billion', '41 percent', 'nearly 40 percent'],
    senior: ['$10.5 trillion', '$232 billion', '$5.8 billion', '$8.2 billion', '$81 billion', '$9.1 billion', '41 percent', 'nearly 40 percent'],
  };

  it('speaks NO figure that is not the newsletter’s — the exact token set, place by place', () => {
    for (const k of PLACES) expect(figureTokens(TEXTS[k]), k).toEqual(TOKENS[k]);
  });

  it('PROVEN TO CATCH: one figure mistyped anywhere in a band is named, even where it is also written correctly', () => {
    const wrong = TEXTS.child.replace('$232 billion of new money', '$233 billion of new money');
    expect(wrong).not.toBe(TEXTS.child);
    // The weak pin would still pass, and that is the whole case for the strong one.
    expect(wrong.includes('$232 billion')).toBe(true);
    expect(figureTokens(wrong)).toContain('$233 billion');
    expect(figureTokens(wrong)).not.toEqual(TOKENS.child);
  });

  it('attributes rather than asserts — the report is stated plainly AND its source is named, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: names the reporter`).toMatch(/The Daily Upside|news email/);
      expect(TEXTS[k], `${k}: names the firm`).toMatch(/Morgan Stanley/);
      expect(TEXTS[k], `${k}: the record quarter is stated, not hedged`).toMatch(/record (third )?quarter|best three months ever/);
    }
  });

  it('REFUSES THE SNEER: the improvement is stated plainly before it is questioned, in every band', () => {
    // DR-0100's own failure mode, inverted: under-claiming a real thing. A
    // lesson that only warns has hedged a verified improvement into nothing.
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: never says the move is genuinely steadier`).toMatch(/steadier|steady/i);
    }
    expect(L.lesson).toMatch(/THE MOVE IS REAL, AND SAYING SO IS NOT FLATTERY/);
    expect(L.lesson).toMatch(/A STEADY INCOME AND A SOLID INCOME ARE NOT THE SAME THING/);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: never distinguishes steady from solid`).toMatch(/steady|steadier/i);
    }
  });

  it('says in its own prose, and in every band, exactly what was NOT checked', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: carries no disclosure heading`).toMatch(/WHAT WE DID NOT CHECK/);
      // NOT "nearly 40 percent" on its own: that figure is also in the teaching,
      // so pinning it would pass with the disclosure deleted — the exact trap
      // legacy8's first pin fell into. This phrase occurs only in the disclosure.
      expect(TEXTS[k], `${k}: does not name what nobody opened`).toMatch(/nobody here opened/);
      expect(TEXTS[k], `${k}: does not close the disclosure`).toMatch(/And that is where the checking stops\./);
      expect(TEXTS[k], `${k}: does not separate reported from checked`).toMatch(/Reported is not verified|Reported is not the same as checked/);
    }
  });

  it('PROVEN TO CATCH: deleting the not-checked paragraph from one band is seen', () => {
    const strip = (t) => t.replace(/WHAT WE DID NOT CHECK[\s\S]*?And that is where the checking stops\./, '');
    const stripped = strip(L.levels.youth);
    expect(stripped).not.toBe(L.levels.youth);
    expect(/nobody here opened/.test(L.levels.youth)).toBe(true);
    expect(/nobody here opened/.test(stripped)).toBe(false);
    // And the trap pin would NOT have caught it, which is why it is not used.
    expect(/nearly 40 percent/.test(stripped)).toBe(true);
  });

  it('THE TWO PILES: what a runner read off the publisher, and what stays the newsletter’s', () => {
    const sources = JSON.parse(readFileSync(join(process.cwd(), 'src', 'lib', 'lesson-sources.json'), 'utf8'));
    const rows = sources[ID];
    expect(rows, `${ID} has no row in lesson-sources.json`).toBeTruthy();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const says = rows.flatMap((r) => r.says || []);
    // A 0-figure row would make the third-pile census count a lesson whose
    // figures nobody read — anti-theatre (DR-0076 §3).
    expect(says.length).toBeGreaterThan(0);
    for (const s of READ_BACK) expect(says, `the row no longer claims ${s}`).toContain(s);
    expect(rows.every((r) => /^https:\/\/www\.morganstanley\.com\//.test(r.url))).toBe(true);
    // And the lesson says which three are NOT the firm's own, in every band.
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: does not keep the newsletter’s own figures labelled`).toMatch(/belongs to the news email|The Daily Upside’s|newsletter’s/);
    }
  });

  it('teaches none of the newsletter’s advertising or its unrelated items', () => {
    expect(L.lesson).toMatch(/Everything else in that email is other business items and advertising/);
    const all = EVERY_STRING.join(' ');
    for (const ad of ['Mission Wealth', 'Buffo', 'Roth conversion', 'Bumble', 'Tinder', 'Hinge', 'FanDuel', 'DraftKings', 'Porter', 'Eutelsat', 'Zacks', 'Barra', 'OnStar', 'Super Cruise']) {
      expect(all, `the newsletter item "${ad}" reached the teaching`).not.toContain(ad);
    }
  });

  it('is teaching, not advice, and the course’s own boundary still carries', () => {
    expect(L.lesson).toMatch(/teaching and not legal or financial advice/);
    expect(L.levels.senior).toMatch(/teaching and not legal or financial advice/);
    expect(BANKING_META.care).toMatch(/not financial or legal advice/i);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(60);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(55);
  });

  it('every double-quoted span carries a reference: nothing of ours is dressed as Scripture', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'Labour not to be rich: cease from thine own wisdom',
      'Labour not to be rich: cease from thine own counsel',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: lowercasing a quotation’s opening word to fit a sentence is not the verse', () => {
    // The defect lesson one of this course shipped in draft, five times over:
    // "and Joseph gathered..." written to fit a sentence where the KJV has
    // "And". A changed capital is a changed quotation.
    const broken = L.lesson.replace(
      '"Labour not to be rich: cease from thine own wisdom."',
      '"labour not to be rich: cease from thine own wisdom."',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: planting Yahweh inside a quotation is refused', () => {
    const planted = (texts) => {
      const out = [];
      for (const t of texts) for (const { inside, ref } of quotedPairs(t)) if (/\bYahweh\b/.test(inside)) out.push(ref || 'no ref');
      return out;
    };
    expect(planted(EVERY_STRING)).toEqual([]);
    const broken = L.lesson.replace('But thou shalt remember the LORD thy God:', 'But thou shalt remember Yahweh:');
    expect(broken).not.toBe(L.lesson);
    expect(planted([broken])).toEqual(['Deuteronomy 8:18']);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a decision-record identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

  it('no generic God, GOD or LORD in our authored voice', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('But thou shalt remember the LORD thy God');
    expect(inQuotes).toContain('Thus saith the LORD, Let not the wise man glory');
  });

  it('names Yahweh in our prose in every band', () => {
    for (const k of PLACES) expect(ourVoice(TEXTS[k]), k).toMatch(/\bYahweh\b/);
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check still reads green', () => {
    const teen = L.levels.teen;
    const friend = /Friends, tell one friend this week the one sentence[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });

  it('carries the skill and the rhythm in every band, not only the three addresses', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: listen to the end`).toMatch(/[Ll]isten (all the way )?to the end|[Ll]isten all the way/);
      expect(TEXTS[k], `${k}: retell`).toMatch(/in (their|your) own words/);
      expect(TEXTS[k], `${k}: the four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(TEXTS[k], `${k}: one friend this week`).toMatch(/one friend this week/);
    }
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
    for (const k of BANDS) {
      expect(TEXTS[k].startsWith('THE MOAT THAT MOVES — the bank changed its ground'), k).toBe(true);
    }
    expect(L.lesson.startsWith('THE MOAT THAT MOVES — the bank changed its ground.')).toBe(true);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('PROVEN TO CATCH: an explicit ordinal marker dropped into the prose restarts the count and is seen', () => {
    const broken = L.lesson.replace('WHERE THE GLORYING GOES.', 'THIRD, WHERE THE GLORYING GOES.');
    expect(broken).not.toBe(L.lesson);
    const ns = formatLessonText(broken).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    const contiguousFromOne = ns.length > 0 && ns[0] === 1 && ns.every((v, i) => i === 0 || v === ns[i - 1] + 1);
    expect(contiguousFromOne).toBe(false);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as an explicit marker', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });

  it('carries two real stories and six benefits, the shape every lesson of this course has', () => {
    expect(L.stories).toHaveLength(2);
    // CORRECTED 2026-10-28. This line used to demand exactly
    // ['parable', 'testimony'], and that demand is what produced a defect:
    // `kind: 'testimony'` renders to the reader as "A TRUE STORY", this lesson
    // is built from a newspaper article about a bank rather than from anybody's
    // life, so satisfying the shape meant inventing a first-person account --
    // an age, eleven years, a relative, a Wednesday table -- and labelling the
    // invention true. `a-true-story-names-whose-life-it-was` caught it: the
    // corpus count moved 93 -> 94 and this would have been the 53rd
    // unattributed first-person "true story" in the catalog.
    //
    // A shape that can only be met by fabricating is not a standard, so the
    // rule is now the one that actually matters (DR-0811 / DR-0550 / DR-0076):
    // both stories are real story kinds, and a testimony must name whose life
    // it was. A lesson with no testimony to tell honestly carries two parables.
    for (const s of L.stories) expect(['parable', 'testimony']).toContain(s.kind);
    for (const s of L.stories) {
      if (s.kind === 'testimony') {
        expect(s.source && s.source.trim(), `${s.title} is told as a true story and must name whose life it was`).toBeTruthy();
      }
    }
    for (const s of L.stories) expect(s.body.split(/\s+/).length, s.title).toBeGreaterThan(120);
    expect(L.benefits.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
  });
});
