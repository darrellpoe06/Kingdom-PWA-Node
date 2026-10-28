// @vitest-environment node
// =============================================================================
// legacy8 — The hoary head holds the harvest: the provision sits in the oldest
// hand
// =============================================================================
// Darrell forwarded a business newsletter to himself on 2026-10-13 with one
// word typed above the body: Lessons. The newsletter was Morning Brew for that
// morning (Gmail thread 1a1353f9e69525a6), and its lead item reported new
// Federal Reserve data from the Survey of Consumer Finances: families headed by
// someone aged 75 or older are now the wealthiest in the United States.
//
// THIS LESSON'S WHOLE DANGER IS A BORROWED NUMBER WORN AS OUR OWN. A lesson
// that quotes every verse verbatim and then states 37 percent as though we had
// opened the Federal Reserve's release would pass every verse gate in the house
// and still misrepresent what we actually know. So the reported figures are
// kept here as DATA, exactly as the newsletter printed them, and this gate pins
// the lesson's figures to that record — every figure the lesson speaks is the
// newsletter's figure, and the lesson says out loud, in its own prose and in
// every band, which sources we never opened.
//
// The second danger is the opposite one: hedging a reported fact into "nobody
// knows". The lesson states the report plainly and names its source plainly.
// Attribution is not a hedge, and this gate requires both halves.
//
// The newsletter also carried advertising (a car-connectivity ad, a drug ad, a
// fund ad, a candy riddle). None of it is germane and none of it is taught, and
// a check below refuses it a foothold in any string of the module.
//
// Quote pairing is done by splitting on the quote character, never by a {10,}
// regex, and the verbatim sweep asserts its own count so an empty scan cannot
// read as a pass.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LEGACY_PROVISIONS_MODULES, LEGACY_PROVISIONS_META } from '../lib/legacy-provisions-course.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'legacy8-the-hoary-head-holds-the-harvest';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LEGACY_PROVISIONS_MODULES.find((m) => m.id === ID);
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
/** Every quoted span with the reference that follows it. */
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

// THE SPINE, pinned by literal text. Every span was fetched from the corpus on
// disk before it was written, and one span stands for each anchored reference
// the lesson quotes.
const SPINE = [
  ['Proverbs 16:31', 'The hoary head is a crown of glory, if it be found in the way of righteousness'],
  ['Leviticus 19:32', 'Thou shalt rise up before the hoary head, and honour the face of the old man'],
  ['Job 12:12', 'With the ancient is wisdom; and in length of days understanding'],
  ['Proverbs 17:6', 'Children’s children are the crown of old men'],
  ['Psalms 71:18', 'until I have shewed thy strength unto this generation'],
  ['Psalms 92:14', 'They shall still bring forth fruit in old age'],
  ['2 Corinthians 12:14', 'the children ought not to lay up for the parents, but the parents for the children'],
  ['1 Timothy 5:8', 'But if any provide not for his own, and specially for those of his own house, he hath denied the faith'],
  ['Proverbs 11:24', 'there is that withholdeth more than is meet, but it tendeth to poverty'],
  ['Proverbs 3:27', 'Withhold not good from them to whom it is due, when it is in the power of thine hand to do it'],
  ['Luke 12:20', 'then whose shall those things be, which thou hast provided?'],
  ['Luke 12:21', 'So is he that layeth up treasure for himself, and is not rich toward God'],
  ['Malachi 4:6', 'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
];

// THE REPORT AS DATA, not as memory. Exactly the figures Morning Brew printed
// on 2026-10-13, each with the bands that must carry it. The adult lesson
// carries every one; the child band carries the shape of the story without the
// dollar figures, by design, because it is written for a nine-year-old.
const REPORTED = [
  { figure: '$215,900', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '37 percent', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '23 percent', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '$505,000', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '$367,000', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '$1.96 million', where: ['adult', 'teen', 'senior'] },
  { figure: '12.2 percent', where: ['adult', 'youth', 'teen', 'senior'] },
  { figure: '2 percent', where: ['adult', 'youth', 'teen', 'senior'] },
];

describe('legacy8 is in the course, numbered, and whole', () => {
  it('exists exactly once as the eighth lesson with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(LEGACY_PROVISIONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(LEGACY_PROVISIONS_MODULES).toHaveLength(8);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims legacy8 exactly once, and the course numbers stay 1 to 8 with no gap', () => {
    const numbers = LEGACY_PROVISIONS_MODULES.map((m) => Number(/^legacy(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('the course meta counts eight lessons rather than the seven it carried before', () => {
    expect(LEGACY_PROVISIONS_META.format).toContain('8 lessons');
    expect(LEGACY_PROVISIONS_META.weeks).toBe(8);
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
    // Named exactly, or by a same-chapter reference whose verses overlap — the
    // rule every-anchor-is-named-in-the-lesson itself applies.
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`)
        || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b)
        || L.lesson.includes(`${p.book} ${p.ch}:${p.a}`);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('every quoted reference is covered by the anchor, so Search it out can reach every verse the lesson stands on', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = anchorRefs(L).map(parse).filter(Boolean);
    const quoted = [...new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref)).filter(Boolean))];
    expect(quoted.length).toBeGreaterThanOrEqual(13);
    const uncovered = quoted.filter((r) => {
      const p = parse(r);
      return !p || !anchors.some((a) => a.book === p.book && a.ch === p.ch && a.a <= p.b && p.a <= a.b);
    });
    expect(uncovered).toEqual([]);
  });
});

describe('the newsletter is the source, said out loud, and never worn as our own', () => {
  it('names the Gmail forward, the one word on it, and the newsletter by name', () => {
    expect(L.lesson).toMatch(/forwarded a business newsletter to himself on October 13, 2026/);
    expect(L.lesson).toMatch(/one word typed above the body: Lessons/);
    expect(L.lesson).toMatch(/Morning Brew/);
    expect(L.lesson).toMatch(/Survey of Consumer Finances/);
  });

  it('every figure the lesson speaks is the newsletter’s figure, in the lesson and in each band that reports it', () => {
    const missing = [];
    for (const { figure, where } of REPORTED) {
      for (const place of where) {
        if (!TEXTS[place].includes(figure)) missing.push(`${place}: ${figure}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('PROVEN TO CATCH: one figure remembered wrong is named by its place', () => {
    const wrong = { ...TEXTS, adult: TEXTS.adult.replaceAll('37 percent', '47 percent') };
    expect(wrong.adult).not.toBe(TEXTS.adult);
    const missing = [];
    for (const { figure, where } of REPORTED) {
      for (const place of where) if (!wrong[place].includes(figure)) missing.push(`${place}: ${figure}`);
    }
    expect(missing).toEqual(['adult: 37 percent']);
  });

  it('attributes rather than asserts — the report is stated plainly AND its source is named, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: names the reporter`).toMatch(/Morning Brew/);
      expect(TEXTS[k], `${k}: wealthiest claim is attributed`).toMatch(/wealth|wealthiest/i);
    }
    // The plain statement itself: not hedged into "some say" or "nobody knows".
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], k).toMatch(/aged 75 or older are now the wealthiest in the United States/);
    }
    // The child band carries the same claim in a nine-year-old's words rather
    // than the adult clause — plainly, with the reporter still named.
    expect(L.levels.child).toMatch(/families led by someone over 75 now hold more wealth than any other age group in America/);
  });

  it('says in its own prose, and in every band, exactly what was NOT verified', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: names the unopened Federal Reserve release`).toMatch(/did not (open|read) the Federal Reserve|never read the Federal Reserve/);
      expect(TEXTS[k], `${k}: names the unread newspaper piece`).toMatch(/Wall Street Journal|newspaper story/);
    }
    expect(L.lesson).toMatch(/Reported is not verified/);
    expect(L.levels.child).toMatch(/every number here belongs to them, not to us/);
  });

  it('PROVEN TO CATCH: deleting the not-verified paragraph from one band is seen', () => {
    const stripped = L.levels.youth.replace(/WHAT WE DID NOT VERIFY\.[\s\S]*?checked by us\./, '');
    expect(stripped).not.toBe(L.levels.youth);
    expect(/did not (open|read) the Federal Reserve|never read the Federal Reserve/.test(stripped)).toBe(false);
  });

  it('teaches none of the newsletter’s advertising — the ads are named as ads and nothing else', () => {
    expect(L.lesson).toMatch(/Everything else in the email is advertising/);
    const all = EVERY_STRING.join(' ');
    for (const ad of ['AT&T', 'Connected Car', 'Zepbound', 'Lilly', 'Chipotle', 'Starbucks', 'Kit Kat', 'PAVE']) {
      expect(all, `the ad "${ad}" reached the teaching`).not.toContain(ad);
    }
  });

  it('is teaching, not advice, and the course’s own boundary still carries', () => {
    expect(L.lesson).toMatch(/teaching and not legal or financial advice/);
    expect(L.levels.senior).toMatch(/teaching and not legal or financial advice/);
    expect(LEGACY_PROVISIONS_META.care).toMatch(/not legal advice/i);
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
      'With the ancient is wisdom; and in length of days understanding',
      'With the ancient is knowledge; and in length of days understanding',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.lesson.replace(
      '"the children ought not to lay up for the parents',
      '"The children ought not to lay up for the parents',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken])).toEqual([
      '(2 Corinthians 12:14) is not the verse: The children ought not to lay up for the parents, but the parents for ',
    ]);
  });

  it('PROVEN TO CATCH: planting Yahweh inside a quotation is refused', () => {
    const planted = (texts) => {
      const out = [];
      for (const t of texts) for (const { inside, ref } of quotedPairs(t)) if (/\bYahweh\b/.test(inside)) out.push(ref || 'no ref');
      return out;
    };
    expect(planted(EVERY_STRING)).toEqual([]);
    const broken = L.lesson.replace('But God said unto him, Thou fool', 'But Yahweh said unto him, Thou fool');
    expect(broken).not.toBe(L.lesson);
    expect(planted([broken])).toEqual(['Luke 12:19-20']);
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
    expect(inQuotes).toContain('O God, forsake me not');
    expect(inQuotes).toContain('and fear thy God: I am the LORD');
    expect(inQuotes).toContain('is not rich toward God');
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
    const friend = /Friends, tell one friend this week one thing this lesson showed you about the difference[^.]*\./.exec(teen);
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
    for (const k of PLACES) {
      expect(TEXTS[k].startsWith('THE HOARY HEAD HOLDS THE HARVEST — the provision sits in the oldest hand.'), k).toBe(true);
    }
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('PROVEN TO CATCH: an explicit ordinal marker dropped into the prose restarts the count and is seen', () => {
    // An explicit marker switches the capitalised-lead pass off entirely
    // (lesson-format's `hasExplicit`), so the whole lesson collapses to the one
    // number the marker names — here a THIRD with no first or second before it.
    const broken = L.lesson.replace('HOLDING IS NOT NEUTRAL.', 'THIRD, HOLDING IS NOT NEUTRAL.');
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
});
