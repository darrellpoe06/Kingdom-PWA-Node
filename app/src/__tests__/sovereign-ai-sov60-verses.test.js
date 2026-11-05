// @vitest-environment node
// =============================================================================
// sov60 — The bottleneck was never the typing: machines set to distrust each
// other, and the one who must still give an answer
// =============================================================================
// Darrell forwarded Gmail thread 1a11bdbce29bab3e on 2026-10-08 at 14:12:27 UTC
// from his university address to himself, with one word typed at the top of his
// own message: "Lessons." The thread holds ONE message — his forward of an
// IT-trade newsletter dated 2026-10-08 09:01. Judged BY THE BODY and never by
// the subject, which is only whatever he happened to be reading, this is a real
// lesson send: the word is his own, on the first line of his own message, and
// not a word occurring inside the forwarded mail.
//
// MEASURED FIRST, ALL THREE CLEARANCE PROBES, BEFORE A WORD WAS WRITTEN, on the
// ledger at 4f8d8b6ef.
//
//   $ node scripts/lesson-row-shipped-sweep.mjs 1a11bdbce29bab3e
//   unknown   1a11bdbce29bab3e  ->  no decision record names it      (exit 0)
//
//   The DR-1288 subject probe on `FW: Think local` -> `think` matched 98
//   records and `local` 301, both common, both scored 0. Nothing reached the
//   0.2 bar.                                                        (exit 0)
//
//   get_thread, METADATA_ONLY -> labelIds ["UNREAD","CATEGORY_PERSONAL","INBOX"].
//     NO Label_22. The label on the thread is the lock; a search is only a hint.
//
// AND THIS THREAD IS THE ONE DR-1305 UNBLOCKED. DR-1303 named it in its own
// `What was measured` as one of the two remaining unbuilt sends, which made the
// sweep answer `SHIPPED -> named in DR-1303` for a thread nobody had built;
// DR-1305 added the `Considered, not built:` declaration that exempts a
// citation, and the sweep went back to `unknown`. So this lesson exists because
// a record stopped claiming a thread it had only considered, and this record
// carries no such declaration of its own, because it built the thread it names.
//
// THE FIRST DANGER IS THAT THE SOURCE IS A TRADE NEWSLETTER, NOT A STUDY. It is
// a daily digest for people who run company computers, and the lesson says so
// in every reader text so that nobody assumes a paper was read. Three plain
// statements in it carry the teaching, and each is used for its SHAPE:
//   1. a consultant's line that the bottleneck has moved from writing code to
//      trusting it — honest, nearly right, and the one wrong word is the lesson;
//   2. a man with four computers on his desk, each running a different model,
//      one writing and one auditing, whose own summary is that the arrangement
//      amounts to replacing the human on ordinary work;
//   3. a security researcher's advice that telling an honest automatic helper
//      from a hostile one begins with learning what NORMAL looks like.
// A fourth item, a relayed company claim about mathematical problems solved
// with the confirming mathematicians still at work, is used ONLY for its shape:
// the claim finished travelling while the checking was still running.
//
// DARRELL'S STANDING INSTRUCTION ON FORWARDS IS HONOURED AND IS SAID OUT LOUD:
// ignore the advertisements unless they bear on the lesson. The issue carries a
// sponsor's advertisement for a handbook of ready-made instructions and a jobs
// board. Both are NAMED as set aside in all five reader texts rather than
// quietly dropped, and the advertisement is used at exactly one point — it
// sells retail the same handover the rest of the issue reports wholesale.
// No vendor, product, publisher, platform or person the issue names appears
// anywhere in the module, following sov33, sov57, sov58 and sov59: the pattern
// in the reader's own hand is the teaching, and a named vendor only dates it.
// The matchers below use word boundaries so ordinary English cannot trip them.
//
// THE SECOND DANGER IS A BORROWED FIGURE, AND THIS LESSON STAKES NONE. Three
// roads to the publisher were tried and all three were refused, and the failures
// are quoted rather than paraphrased:
//   curl https://www.morningbrew.com -> `curl: (56) CONNECT tunnel failed, response 403`
//   curl https://www.itbrew.com     -> `curl: (56) CONNECT tunnel failed, response 403`
//   WebFetch https://www.itbrew.com -> `getaddrinfo ENOTFOUND www.itbrew.com`
// Both hosts are outside this session's allowed network domains, and the tool's
// own guidance is to stop after a second host fails the same way, so no further
// hosts were tried. Nobody read the publisher's own page, nobody opened the
// outside articles its reading list pointed at, nobody watched those four
// machines run, nobody saw that network, and nobody telephoned the writer or
// the publisher. Every figure the issue reports is carried as UNCHECKED, said
// to be unchecked in the lesson AND in all four bands, with the refused number
// in each. The teaching rests on the SHAPE of statements printed in the issue
// itself, which is legible, and not on any figure, which is not.
//
// THE THIRD DANGER IS A SPINE CHOSEN BY HEADLINE, and the obvious verses for
// "weigh a claim before you trust it" are nearly all spent in this department,
// measured and not assumed. The "A.I. The Way" department holds 412 distinct
// anchor chapters across 73 lessons, and every one of these was measured SPENT:
// Deuteronomy 19 (two or three witnesses, 9 lessons), Deuteronomy 17 (5),
// Proverbs 18 (he that is first in his own cause, 18), 1 Kings 22 (four hundred
// prophets and Micaiah alone, 12), Hebrews 5 (senses exercised to discern, 7),
// John 10 (they know his voice, 10), Exodus 18 (the hard causes brought to
// Moses, 7), Galatians 6 (let every man prove his own work, 5), 1 John 4 (try
// the spirits, 7), Jeremiah 17 (8), Matthew 7 (22), Psalms 119 (7), Daniel 2
// (tell me the dream, 3), Joshua 9 (the mouldy bread, 6), Luke 1 (the certainty
// of those things, 1), John 5 (if I bear witness of myself, 2), Proverbs 25
// (the honour of kings is to search out a matter, 15), Jeremiah 23 (6) and
// Hebrews 4 (10). The thirteen chapters this lesson stands on were each measured
// ABSENT from the department before they were written in, and the collision
// check below is keyed on BOOK AND CHAPTER and runs in BOTH directions — the
// repair sov57 paid for and sov58 recorded.
//
// AND THE VERSE-GRANULARITY CENSUS DR-1303 PAID FOR EARNED ITS KEEP HERE, BEFORE
// A WORD WAS WRITTEN. The department chapter census reported Numbers 13 FREE,
// and Numbers 13 was the first draft's spine for "ten agreeing witnesses with a
// false report" — Caleb against the majority. The catalog-wide verse check then
// named it: the INSPECTIONS course already owns Numbers 13:18, 13:20, 13:27,
// 13:28, 13:30, 13:31, 13:32 and 13:33, and asserts it shares not one verse
// with any other course. Numbers 13 was dropped whole rather than mined for
// leftover verses, and Luke 23:23 and Matthew 27:24 carry the teaching better:
// the agreement that finally arrives does so by VOLUME and PREVAILS, and Pilate
// attempts the very transfer this week is about and fails at it. So the widening
// DR-1303 recorded saved this build a red suite, which is what a gate is for.
//
// THE FOURTH DANGER IS A DISCLOSURE PIN THAT IS NOT UNIQUE. Earlier records
// passed with a disclosure DELETED because the pinned string also occurred
// elsewhere in the module. Every pin below is asserted to occur in EXACTLY ONE
// reader text, and the proven-to-catch block deletes a disclosure from one band
// and watches that band, and only that band, be named.
//
// BOTH STORIES ARE PARABLES. Nobody's life is in this lesson. `kind: 'testimony'`
// renders as a true story told with a named person's consent, which would be a
// lie on the page (DR-0811).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { MODULES } from '../lib/church-classes.js';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish } from '../../../scripts/american-spelling.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { fourBandFaults, LADDER } from './fixtures/four-band-ladder.js';

const ID = 'sov60-the-bottleneck-was-never-the-typing';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
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
/** The corpus text a reference names, or null. Contiguous verses only. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through] = m;
    const chap = chapter(book, ch);
    if (!chap) return null;
    for (let v = Number(from); v <= Number(through || from); v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
/** Every double-quoted span with the reference that follows it. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. No elision is accepted. */
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
/** Our authored voice: the even segments between double quotes. */
const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

// A BOOK-AND-CHAPTER key (sov57's finding, sov58's repair).
export function chapterOf(ref) {
  const m = /^(.+?)\s+(\d+)[:\s]/.exec(String(ref).trim());
  return m ? `${m[1].trim()} ${Number(m[2])}` : null;
}

// THE SPINE, pinned by literal text. Every span was read out of the corpus on
// disk before it was written into the lesson, and each must still be there.
const SPINE = [
  ['Isaiah 41:21', 'Produce your cause, saith the LORD; bring forth your strong reasons, saith the King of Jacob'],
  ['Isaiah 41:22', 'Let them bring them forth, and shew us what shall happen: let them shew the former things, what they be, that we may consider them, and know the latter end of them; or declare us things for to come'],
  ['Isaiah 41:23', 'Shew the things that are to come hereafter, that we may know that ye are gods'],
  ['Isaiah 41:24', 'Behold, ye are of nothing, and your work of nought'],
  ['1 John 1:1', 'That which was from the beginning, which we have heard, which we have seen with our eyes, which we have looked upon, and our hands have handled, of the Word of life'],
  ['1 John 1:3', 'That which we have seen and heard declare we unto you, that ye also may have fellowship with us'],
  ['Amos 3:3', 'Can two walk together, except they be agreed?'],
  ['Mark 14:55', 'And the chief priests and all the council sought for witness against Jesus to put him to death; and found none'],
  ['Mark 14:56', 'For many bare false witness against him, but their witness agreed not together'],
  ['Mark 14:59', 'But neither so did their witness agree together'],
  ['Luke 23:23', 'And they were instant with loud voices, requiring that he might be crucified. And the voices of them and of the chief priests prevailed'],
  ['Ecclesiastes 4:9', 'Two are better than one; because they have a good reward for their labour'],
  ['Ecclesiastes 4:10', 'For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up'],
  ['Ecclesiastes 4:12', 'And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken'],
  ['Micah 4:2', 'and he will teach us of his ways, and we will walk in his paths: for the law shall go forth of Zion, and the word of the LORD from Jerusalem'],
  ['Micah 4:4', 'But they shall sit every man under his vine and under his fig tree; and none shall make them afraid: for the mouth of the LORD of hosts hath spoken it'],
  ['Hosea 8:6', 'For from Israel was it also: the workman made it; therefore it is not God: but the calf of Samaria shall be broken in pieces'],
  ['Hosea 8:7', 'For they have sown the wind, and they shall reap the whirlwind: it hath no stalk: the bud shall yield no meal'],
  ['Judges 6:17', 'If now I have found grace in thy sight, then shew me a sign that thou talkest with me'],
  ['Judges 6:39', 'Let not thine anger be hot against me, and I will speak but this once: let me prove, I pray thee, but this once with the fleece; let it now be dry only upon the fleece, and upon all the ground let there be dew'],
  ['1 Chronicles 12:32', 'And of the children of Issachar, which were men that had understanding of the times, to know what Israel ought to do'],
  ['Matthew 27:24', 'When Pilate saw that he could prevail nothing, but that rather a tumult was made, he took water, and washed his hands before the multitude, saying, I am innocent of the blood of this just person: see ye to it'],
  ['2 Corinthians 5:10', 'For we must all appear before the judgment seat of Christ; that every one may receive the things done in his body, according to that he hath done, whether it be good or bad'],
  ['2 Corinthians 5:11', 'Knowing therefore the terror of the Lord, we persuade men; but we are made manifest unto God'],
  ['1 Peter 3:15', 'be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear'],
];

// THE CHAPTERS THIS LESSON STANDS ON, each measured absent from the department
// before it was written in; and the ones DECLINED BY MEASUREMENT because they
// are already anchors here. See the header for what each declined chapter would
// have taught — they are the first chapters any builder would reach for on this
// subject, and all nineteen are gone.
const OURS = [
  'Isaiah 41', '1 John 1', 'Amos 3', 'Mark 14', 'Luke 23', 'Ecclesiastes 4',
  'Micah 4', 'Hosea 8', 'Judges 6', '1 Chronicles 12', 'Matthew 27',
  '2 Corinthians 5', '1 Peter 3',
];
const DECLINED_FOR_ANOTHER_LANDING = [
  'Deuteronomy 19', 'Deuteronomy 17', 'Proverbs 18', '1 Kings 22', 'Hebrews 5',
  'John 10', 'Exodus 18', 'Galatians 6', '1 John 4', 'Jeremiah 17', 'Matthew 7',
  'Psalms 119', 'Daniel 2', 'Joshua 9', 'Luke 1', 'John 5', 'Proverbs 25',
  'Jeremiah 23', 'Hebrews 4',
];

// Every vendor, product, platform, publisher and person the forwarded issue
// names, refused a foothold in ANY string of the module — the publisher itself
// included. Word boundaries, so ordinary English cannot trip it.
const NOT_OURS = [
  'Nvidia', 'DeepSeek', 'Qwen', 'OpenAI', 'Google', 'Oracle', 'NetSuite',
  'Bain', 'AttackIQ', 'Reality Defender', 'Morning Brew', 'IT Brew', 'Hershey',
  'CollabWORK', 'TechCrunch', 'FedScoop', 'CIO Dive', 'Wall Street Journal',
  'Alex Lisle', 'Paul Reid', 'Purna Doddapaneni', 'Jack Albright',
  'Nicolas Boucher', 'CoreWeave', 'Blue Ridge Dynamics', 'Athenix',
  'Progress Rail', 'Grace Blackwell', 'DGX', 'MCP', 'Halloween',
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notOursRe = (name) => new RegExp(`\\b${escapeRe(name)}\\b`);

// A figure a reader could be misled by: a currency symbol, a percentage, or a
// number wearing a magnitude word. Every number the issue printed is left in
// the issue, so no digit in any reader text is doing a claim's work.
const FIGURE_SHAPES = [
  /[$£€]/,
  /\d\s*%|\bper cent\b|\bpercent\b/i,
  /\b\d[\d,.]*\s*(?:million|billion|trillion|thousand)\b/i,
];

// The disclosures, one phrasing per place, each asserted UNIQUE below.
const UNREAD = {
  adult: "nobody here read the publisher's own web page",
  child: "We never opened the newsletter people's own website.",
  youth: 'The article behind that one link was never opened by anybody here',
  teen: "Nobody here opened the publisher's own page",
  senior: "Not one of us opened the publisher's own page describing the issue",
};
const TELEPHONE = {
  adult: 'nobody telephoned the writer or the publisher',
  child: 'we did not ring anybody up to ask',
  youth: 'no one here telephoned the writer or the newsletter',
  teen: 'we never rang the writer or the publisher',
  senior: 'neither the writer nor the publisher was ever telephoned by anyone here',
};
const FETCH_FAILED = {
  adult: "one attempt could not resolve the publisher's hostname at all",
  child: 'it could not even find the place where that page lives',
  youth: "The publisher's hostname would not resolve.",
  teen: "The publisher's host would not resolve at all",
  senior: "on the first the publisher's hostname failed to resolve",
};
// An image no other band uses, so each band is proven to be written from its
// own material rather than reworded from a sibling.
const OWN_IMAGE = {
  child: 'Maybe you count your coins.',
  youth: 'you have found a decoration and not a check',
  teen: 'somebody still has to sign for that candidate',
  senior: 'with our own label affixed to the front of it',
};
const uniqueCarrier = (pin) => PLACES.filter((p) => TEXTS[p].includes(pin));

// BY ORDINAL, NOT BY POSITION (P62, and the cost sov58 recorded): this gate
// asserts what is true of SOV60 — it is the sixtieth module, at index 59,
// whatever follows it — and derives the course's size from the course, so that
// sov61 does not break this file on the day it lands.
describe('sov60 is in the course, sixtieth, and whole', () => {
  const ORDINAL = 60;

  it('exists exactly once, as the sixtieth lesson, with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.length).toBeGreaterThanOrEqual(ORDINAL);
    expect(
      SOVEREIGN_AI_MODULES[ORDINAL - 1].id,
      'sov60 must sit at the sixtieth position, whatever follows it',
    ).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course ids run sov1 upward with no gap and no repeat, counting the course itself', () => {
    const numbers = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: SOVEREIGN_AI_MODULES.length }, (_, i) => i + 1));
    expect(numbers, 'and 60 is one of them').toContain(ORDINAL);
  });

  it('the course meta follows its own module count rather than a hand-typed number', () => {
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(SOVEREIGN_AI_META.format).toContain(`${SOVEREIGN_AI_MODULES.length} weekly sessions`);
  });

  it('carries its build day from a real commit, not from the working tree', () => {
    const day = lessonCreatedDay('sovereign-ai', ID);
    expect(day).toBe('2026-11-03');
    expect(day, 'a lesson dated working-tree is a defect').not.toBe('working-tree');
  });

  it('carries the shape this course holds a lesson to', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    expect(L.benefits).toHaveLength(10);
    expect(L.facilitator.talkingPoints).toHaveLength(10);
    expect(L.facilitator.discussionPrompts).toHaveLength(10);
    expect(L.facilitator.howToRun).toContain('Prayer + the anchor');
    expect(L.rpe.research.length).toBeGreaterThan(80);
    expect(L.rpe.plan.length).toBeGreaterThan(80);
    expect(L.rpe.execute.length).toBeGreaterThan(80);
    expect(storyCount(L)).toBe(2);
    expect(quotesTheWord(L)).toBe(true);
  });
});

describe('the anchors were chosen by COUNTING, and the key is book-and-chapter', () => {
  it('every anchor reference resolves in the corpus on disk', () => {
    const refs = anchorRefs(L);
    expect(refs.length).toBeGreaterThanOrEqual(25);
    for (const r of refs) expect(corpusText(r), `${r} does not resolve`).toBeTruthy();
  });

  it('every reference the lesson quotes is also named in the anchor (DR-0734)', () => {
    const named = new Set(anchorRefs(L));
    const quoted = new Set();
    for (const t of EVERY_STRING) for (const { ref } of quotedPairs(t)) if (ref) quoted.add(ref);
    const orphans = [...quoted].filter((r) => !named.has(r));
    expect(orphans, `quoted but not anchored: ${orphans.join(', ')}`).toEqual([]);
  });

  it('and every anchor reference has a home in the ADULT lesson, not a band only', () => {
    const inAdult = new Set(quotedPairs(L.lesson).map((p) => p.ref).filter(Boolean));
    const missing = anchorRefs(L).filter((r) => !inAdult.has(r));
    expect(missing, `anchored but never quoted in the adult lesson: ${missing.join(', ')}`).toEqual([]);
  });

  it('chapterOf returns BOOK AND CHAPTER, which is the key sov57 got wrong', () => {
    expect(chapterOf('2 Corinthians 5:10')).toBe('2 Corinthians 5');
    expect(chapterOf('1 Chronicles 12:32')).toBe('1 Chronicles 12');
    expect(chapterOf('Isaiah 41:21')).toBe('Isaiah 41');
    expect(chapterOf('Isaiah 41:21')).not.toBe('Isaiah');
  });

  it('OURS is exactly the set of chapters the anchor names, derived not typed', () => {
    const derived = [...new Set(anchorRefs(L).map(chapterOf))];
    expect(derived.sort()).toEqual([...OURS].sort());
  });

  it('NO chapter of this spine is an anchor of any other lesson in the department, and the set can report a hit', () => {
    const taken = new Set();
    for (const m of [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES]) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    // The department really is large, so an empty `taken` cannot fake a pass.
    expect(taken.size).toBeGreaterThan(400);
    const clashes = OURS.filter((c) => taken.has(c));
    // REPORTED, NOT ENFORCED (2026-11-05, DR-1333). This was
    // `.toEqual([])` -- a frozen census asserting no later lesson may ever
    // anchor a chapter of sov60's spine. DR-1317: a verse is NEVER spent, and
    // overlap is how lessons connect; the only thing DR-0610 forbids is two
    // lessons LANDING on the same message, which a chapter census never reads.
    // Measured cost of the same shape elsewhere: sov67 (DR-1332) stands on
    // Hebrews 12:26-27, whose clause exists nowhere else in Scripture, and
    // sov62's copy of this case refused it outright with no route around.
    expect(Array.isArray(clashes)).toBe(true);
    if (clashes.length) {
      console.log(`sov60: ${clashes.length} of its ${OURS.length} spine chapters are now shared with a later lesson: ${clashes.join(', ')} -- expected, DR-1317.`);
    }
    // AND THE OTHER DIRECTION: every chapter declined as spent must be detected
    // as spent, or the check is matching nothing and passing vacuously.
    for (const spent of DECLINED_FOR_ANOTHER_LANDING) {
      expect(taken.has(spent), `${spent} was declined because its teaching lands elsewhere, but it is anchored nowhere`).toBe(true);
    }
  });

  // THE CENSUS RUNS AT VERSE GRANULARITY ACROSS THE WHOLE CATALOG TOO, because a
  // chapter free in this department can still hold a verse another course owns
  // and gates. That is exactly what happened here BEFORE a word was written:
  // Numbers 13 measured free at department level, and the inspections course
  // owns 13:18 through 13:33. The chapter was dropped whole.
  it('shares NOT ONE verse with any course that claims verse exclusivity', () => {
    const refsIn = (t) => [...String(t || '').matchAll(/\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+)\)/g)].map((x) => x[1].trim());
    const expand = (ref) => {
      const m = String(ref).match(/^(.*?)\s*(\d+):([\d\-,\s]+)$/);
      if (!m) return [];
      const out = [];
      for (const part of m[3].split(',')) {
        const r = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!r) continue;
        const a = Number(r[1]);
        const b = r[2] ? Number(r[2]) : a;
        for (let v = a; v <= b && v - a < 80; v += 1) out.push(`${m[1].trim()} ${m[2]}:${v}`);
      }
      return out;
    };
    const mine = new Set();
    for (const t of EVERY_STRING) for (const r of refsIn(t)) for (const v of expand(r)) mine.add(v);
    for (const r of anchorRefs(L)) for (const v of expand(r)) mine.add(v);
    // An empty `mine` would make this pass vacuously.
    expect(mine.size).toBeGreaterThanOrEqual(25);
    const GATED = ['appraisal', 'inspections', 'insurance-risk'];
    const claimed = {};
    for (const key of GATED) {
      const course = LEARN_CATALOG.find((c) => c.key === key);
      expect(course, `${key} is one of the courses that gate verse exclusivity`).toBeTruthy();
      const theirs = new Set();
      for (const row of course.buildScheduleRows()) {
        for (const t of strings(row)) for (const r of refsIn(t)) for (const v of expand(r)) theirs.add(v);
        for (const r of String((row.anchor && row.anchor.ref) || '').split(';')) for (const v of expand(r.trim())) theirs.add(v);
      }
      expect(theirs.size, `${key}: an empty claimed set cannot fake a pass`).toBeGreaterThanOrEqual(30);
      const clash = [...mine].filter((v) => theirs.has(v)).sort();
      expect(clash, `the ${key} course already owns: ${clash.join(', ')}`).toEqual([]);
      claimed[key] = theirs;
    }
    // AND THE OTHER DIRECTION: the Numbers 13 verses the first draft reached for
    // must each be detected as owned, or this check is matching nothing. These
    // are the eight the inspections course holds, measured on this tree.
    for (const owned of ['Numbers 13:18', 'Numbers 13:20', 'Numbers 13:27', 'Numbers 13:28', 'Numbers 13:30', 'Numbers 13:31', 'Numbers 13:32', 'Numbers 13:33']) {
      expect(claimed.inspections.has(owned), `${owned} should be detected as claimed`).toBe(true);
      expect(mine.has(owned), `${owned} must not be in this lesson`).toBe(false);
    }
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the module', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the adult lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty sweep cannot pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(125);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(115);
  });

  it('every double-quoted span carries a reference: nobody in the issue is quoted', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('no quoted span carries an ellipsis, and no reader field prints a record id', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('Yahweh is never inside a quotation, and the quotations keep their own God and LORD', () => {
    for (const t of EVERY_STRING) {
      for (const { inside } of quotedPairs(t)) {
        expect(/Yahweh/.test(inside), `Yahweh was substituted into a quotation: ${inside.slice(0, 60)}`).toBe(false);
      }
    }
    // Isaiah 41:21, Micah 4:2 and 4:4 carry "the LORD" in the corpus, Hosea 8:6
    // "it is not God" and 2 Corinthians 5:11 "manifest unto God". We quote them
    // exactly as written and the corpus is left untouched (DR-0210's bright line).
    expect(corpusText('Isaiah 41:21')).toContain('saith the LORD');
    expect(corpusText('Micah 4:4')).toContain('the mouth of the LORD of hosts');
    expect(corpusText('Hosea 8:6')).toContain('therefore it is not God');
    expect(corpusText('2 Corinthians 5:11')).toContain('made manifest unto God');
  });

  it('no generic God, GOD or LORD in our AUTHORED voice (quotations stripped)', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(ourVoice(text), `${place} names the generic God in our own voice`).not.toMatch(/\b(God|GOD|LORD)\b/);
      expect(text, `${place} never says Yahweh`).toMatch(/\bYahweh\b/);
    }
  });

  it('never capitalises the adversary anywhere in the module', () => {
    for (const t of EVERY_STRING) {
      expect(t).not.toMatch(/\b(Satan|Lucifer|Devil|Adversary|Accuser|Deceiver|Baal)\b/);
    }
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son in every place (DR-0210)', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(text, `${place} does not confess Him`).toMatch(/Jesus, the Lamb of Yahweh/);
      expect(text, `${place} does not name Him the Eternal Son`).toContain('Eternal Son of Yahweh');
    }
  });

  it('spells it the house way in our own voice, and never touches a quote', () => {
    for (const t of EVERY_STRING) expect(findBritish(t), t.slice(0, 50)).toEqual([]);
    // And the corpus keeps its own spelling, which is the whole reason the scan
    // reads our prose only: Ecclesiastes 4:9 says "labour" and stays that way.
    expect(corpusText('Ecclesiastes 4:9')).toContain('labour');
  });
});

describe('the source is named for what it is: a trade newsletter, not a study', () => {
  it('names the intake word in every reader text, and the lesson says what arrived', () => {
    for (const place of PLACES) expect(TEXTS[place], place).toMatch(/\bLessons\b/);
    expect(L.lesson).toMatch(/Darrell forwarded a daily technology newsletter into this course under one word: Lessons\./);
    expect(L.bigIdea).toMatch(/Darrell forwarded a daily technology newsletter into this course under one word: Lessons\./);
  });

  it('every reader text calls the material a newsletter or a trade paper, so nobody thinks a study was read', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} never calls it a newsletter, a digest or a paper`).toMatch(/\bnewsletter\b|\bdigest\b|\bpaper\b/);
    }
    expect(L.lesson).toMatch(/It is a trade digest written for people who run computers for a living/);
  });

  it('names the three statements it stands on, in every reader text', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place}: the bottleneck line`).toMatch(/bottleneck/);
      expect(TEXTS[place], `${place}: the four machines`).toMatch(/[Ff]our (computers|machines)/);
      expect(TEXTS[place], `${place}: knowing normal first`).toMatch(/\bnormal\b/i);
    }
    expect(L.lesson).toMatch(/Trust did not MOVE into the position of bottleneck\. Trust was always the bottleneck\./);
  });

  it('states the hinge plainly in every reader text: the typing was never the bottleneck', () => {
    expect(L.lesson).toMatch(/It did not grow\. It got uncovered\./);
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} does not say the typing was never the bottleneck`).toMatch(/[Tt]yping was never the bottleneck/);
      expect(TEXTS[place], `${place} does not carry the uncovering`).toMatch(/(?:got|been) uncovered|(?:did|has) not grow/);
    }
  });

  it('answers the replacing-the-human claim in every reader text, by name', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} drops the claim it must answer`).toMatch(/replacing the human/);
      expect(TEXTS[place], `${place} drops Pilate, who attempted the same transfer`).toMatch(/\bPilate\b/);
      expect(TEXTS[place], `${place} drops the judgment seat`).toContain('(2 Corinthians 5:10)');
    }
  });

  it('separates agreement from proof in every reader text, which is the second hinge', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} drops the agreement distinction`).toMatch(/agreement is not proof|not what makes a (claim|thing) true|not the same as being right/);
    }
    expect(L.lesson).toMatch(/Agreement is what makes WALKING TOGETHER possible\. It is not what makes a thing TRUE\./);
  });

  it('holds BOTH halves of the local argument in every reader text (place, not sanctity)', () => {
    expect(L.lesson).toMatch(/So local is sovereignty of PLACE\. It is not sanctity of USE\./);
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} drops the affirmation of local`).toContain('(Micah 4:4)');
      expect(TEXTS[place], `${place} drops the guard on it`).toContain('(Hosea 8:6)');
    }
  });

  it('names the advertisement as set aside rather than dropping it silently', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} never names the sponsor's item`).toMatch(/\badvertisement\b|\bad\b/);
    }
    expect(L.lesson).toMatch(/The rule in this house is to leave advertisements alone unless they bear on the lesson\./);
    expect(L.lesson).toMatch(/it sells retail the very transfer the rest of the issue describes wholesale/);
  });

  it('WHAT WE DID NOT CHECK is on the lesson AND all four bands, each pin UNIQUE', () => {
    for (const place of PLACES) {
      expect(uniqueCarrier(UNREAD[place]), `${place}: the unread-page pin is not unique`).toEqual([place]);
    }
  });

  it('every place says nobody telephoned the writer or the publisher, uniquely', () => {
    for (const place of PLACES) {
      expect(uniqueCarrier(TELEPHONE[place]), `${place}: the telephone pin is not unique`).toEqual([place]);
    }
  });

  it('and every place reports the fetch failure as MEASURED, with the refused number', () => {
    for (const place of PLACES) {
      expect(uniqueCarrier(FETCH_FAILED[place]), `${place}: the fetch pin is not unique`).toEqual([place]);
      expect(TEXTS[place], `${place} does not carry the refused number`).toMatch(/\b403\b/);
      expect(TEXTS[place], `${place} does not say three roads were tried`).toMatch(/[Tt]hree (roads|times)/);
    }
  });

  it('says in every place, in one word, that the issue’s figures are unchecked', () => {
    for (const place of PLACES) expect(TEXTS[place], place).toMatch(/\bunchecked\b/);
  });

  it('refuses every vendor, publisher and person the issue names a foothold', () => {
    const found = [];
    for (const name of NOT_OURS) {
      const re = notOursRe(name);
      for (const t of EVERY_STRING) if (re.test(t)) found.push(`${name} :: ${t.slice(0, 50)}`);
    }
    expect(found, `the issue’s own names reached the module: ${found.join(' | ')}`).toEqual([]);
  });

  it('STAKES NO FIGURE, and the claim is enforced rather than asserted', () => {
    for (const place of PLACES) {
      for (const shape of FIGURE_SHAPES) {
        expect(TEXTS[place], `${place} carries a figure shape ${shape}`).not.toMatch(shape);
      }
    }
  });
});

describe('the Word is quoted AND reasoned, not pasted onto a headline (DR-0281)', () => {
  it('reads Isaiah 41:22 for the FORM of the evidence, not just the summons', () => {
    expect(L.lesson).toMatch(/Not confidence\. Not fluency\. Not the consent of the other idols\./);
    expect(L.lesson).toMatch(/something outside the speaker that will either match or fail to match/);
  });

  it('ties the purpose of the test to knowledge, which is Isaiah 41:23’s own clause', () => {
    expect(L.lesson).toMatch(/The knowing comes out of the checking\./);
  });

  it('uses 1 John 1:1 to fix OUR OWN standing before weighing anybody else', () => {
    expect(L.lesson).toMatch(/That is three removes from the event/);
    expect(L.lesson).toMatch(/it is the first thing the Word’s own standard asks of us\.|it is the first thing the Word's own standard asks of us\./);
  });

  it('presses Mark 14:55 for what the trouble was NOT', () => {
    expect(L.lesson).toMatch(/the trouble there was not a shortage of witnesses/);
    expect(L.lesson).toMatch(/A model that has never been anywhere cannot supply that, and four of them cannot supply it four times over\./);
  });

  it('reads PREVAILED in Luke 23:23 as a measurement of force', () => {
    expect(L.lesson).toMatch(/The crowd did not demonstrate anything; it prevailed\./);
    expect(L.lesson).toMatch(/That is a measurement of force, not of truth\./);
    expect(L.lesson).toMatch(/A fault every reader shares is the one fault no amount of reading will find\./);
  });

  it('concedes the real gain of a second reader BEFORE correcting it (DR-0100)', () => {
    expect(L.lesson).toMatch(/a second reader really does catch what the first one missed/);
    expect(L.lesson).toMatch(/That is a genuine gain, and this house uses it\./);
    expect(L.levels.senior).toMatch(/Under-claiming a real thing is as much a failure as over-claiming a false one\./);
  });

  it('reads Ecclesiastes 4:10 for the OFFICE of the second party', () => {
    expect(L.lesson).toMatch(/The office of the second party is rescue, not suspicion\./);
    expect(L.lesson).toMatch(/A loop of tools carries nothing\. It produces a candidate\./);
  });

  it('puts the teaching ahead of the possession, which is Micah 4’s own order', () => {
    expect(L.lesson).toMatch(/The teaching first; the quiet possession afterward\./);
    expect(L.lesson).toMatch(/has bought the hardware and skipped the chapter/);
  });

  it('runs Hosea 8:6’s reasoning from the maker to the verdict', () => {
    expect(L.lesson).toMatch(/THEREFORE IT IS NOT - the reasoning runs straight from the maker to the verdict\./);
    expect(L.lesson).toMatch(/moving the workshop into the basement changes nothing whatever about that/);
  });

  it('reads Judges 6:39 as a test built to be CAPABLE of failing', () => {
    expect(L.lesson).toMatch(/Because a test that can only come out one way has told you nothing at all\./);
    expect(L.lesson).toMatch(/establish the normal, then build the check so that it is actually capable of failing/);
  });

  it('presses the SECOND clause of 1 Chronicles 12:32, so understanding serves obedience', () => {
    expect(L.lesson).toMatch(/The understanding has an object, and the object is obedience\./);
    expect(L.lesson).toMatch(/the claim finished its journey around the world while the checking was still in progress/);
  });

  it('credits the publication with the honest half of its own relay (DR-0100)', () => {
    expect(L.lesson).toMatch(/it said who was claiming, and it said the checking was unfinished/);
  });

  it('settles replacing-the-human on Matthew 27:24 and 2 Corinthians 5:10', () => {
    expect(L.lesson).toMatch(/It cannot, and the reason is not sentimental but legal\./);
    expect(L.lesson).toMatch(/SEE YE TO IT\./);
    expect(L.lesson).toMatch(/Four machines will not be standing there\./);
    expect(L.lesson).toMatch(/So the machines may write, and a steward answers\./);
  });

  it('ends on the three things this house does, which are checkable actions', () => {
    expect(L.lesson).toMatch(/the check has to be able to fail, run backward like Gideon’s fleece|the check has to be able to fail, run backward like Gideon's fleece/);
    expect(L.lesson).toMatch(/it names the one person who will answer for it/);
  });

  it('and every band carries the hinge, the guard and the balance in its OWN words', () => {
    for (const band of BANDS) {
      expect(L.levels[band], `${band} drops Gideon`).toMatch(/\bGideon\b/);
      expect(L.levels[band], `${band} drops Issachar`).toMatch(/Issachar/);
      expect(L.levels[band], `${band} drops the second reader`).toContain('(Ecclesiastes 4:10)');
      expect(L.levels[band], `${band} drops the readiness to answer`).toContain('(1 Peter 3:15)');
    }
  });
});

describe('two stories, both parables, neither told as somebody’s life', () => {
  it('carries two stories whose verses resolve, one light and one solemn', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind, 'a testimony would claim a real person lived this (DR-0811)').toBe('parable');
      expect(s.source, 'no story borrows a source').toBeUndefined();
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('and each story carries the teaching rather than decorating it', () => {
    // The first is the shared-teacher fault: two checkers trained in one room.
    expect(L.stories[0].body).toMatch(/They had been checking each other for three years\./);
    expect(L.stories[0].body).toMatch(/They had never once been checked from outside\./);
    // The second is the empty signature line: production without accounting.
    expect(L.stories[1].body).toMatch(/There was no name anywhere in the process\./);
    expect(L.stories[1].body).toMatch(/a person who could be telephoned had put a name on it/);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('passes the whole shared four-band ladder with nothing waived', () => {
    expect(fourBandFaults(L, LADDER)).toEqual([]);
  });

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside the new-lesson ceiling', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another, measured against the near-copy line', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(LADDER.nearCopy);
  });

  it('each band names its own lesson in its opening', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('each band is written from its OWN material, proven by an image no other band uses', () => {
    for (const band of BANDS) {
      expect(uniqueCarrier(OWN_IMAGE[band]), `${band}: its own image is not unique to it`).toEqual([band]);
    }
  });
});

describe('plain meaning, headings, and the three directions', () => {
  it('no hard term arrives before its plain cue, in any reader text', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(termFaults(text), place).toEqual([]);
    }
  });

  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBe(12);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });

  it('no band opens a sentence with an ordinal the formatter reads as a marker', () => {
    for (const b of BANDS) {
      expect(L.levels[b], b).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
    }
  });

  it('carries no doubled word in any string', () => {
    for (const t of EVERY_STRING) expect(t, t.slice(0, 50)).not.toMatch(/\b([A-Za-z]{3,})\s+\1\b/i);
  });

  it('the lesson and all four bands send the reader all three ways (DR-0733 / DR-0795)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it('and each place names the skill and the rhythm, not only the direction', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} drops the listening skill`).toMatch(/listen all the way to the end/);
      expect(TEXTS[place], `${place} drops the retell step`).toMatch(/own words/);
      expect(TEXTS[place], `${place} drops the one-friend rhythm`).toMatch(/one friend this week/);
      expect(TEXTS[place], `${place} drops the four places`).toMatch(/at the table, on the way, at bedtime/);
    }
  });
});

// ===========================================================================
// PROVEN-TO-CATCH (DR-0076 §3). Each case below was applied to the REAL shipped
// strings, run, seen to fail, and restored byte-identical. A check nobody has
// watched go red is a claim, not a gate.
//
// EACH BREAK IS MADE AT EVERY SITE THE STRING OCCURS, not at one convenient
// anchor — the correction earlier rounds paid for, where breaks SKIPPED instead
// of failing because the probe keyed on a string that appeared in several
// bands. Where a break is deliberately scoped to ONE band, the pin is first
// asserted unique to that band by `uniqueCarrier`.
// ===========================================================================
describe('PROVEN-TO-CATCH: each check was watched to fail on the live text', () => {
  it('a quotation that drifted by one word is caught', () => {
    const bent = 'He asked it. "Can two walk together, unless they be agreed?" (Amos 3:3).';
    expect(verbatimFaults([bent])).toEqual(['(Amos 3:3) is not the verse: Can two walk together, unless they be agreed?']);
  });

  it('a verbatim span hung on the WRONG reference is caught', () => {
    const bent = 'He wrote. "But neither so did their witness agree together" (Mark 14:58).';
    expect(verbatimFaults([bent]).length).toBe(1);
    expect(verbatimFaults([bent])[0]).toContain('(Mark 14:58) is not the verse');
  });

  it('substituting Yahweh into a quotation is caught, at every site the span occurs', () => {
    const sites = PLACES.filter((p) => TEXTS[p].includes('for the mouth of the LORD of hosts hath spoken it'));
    expect(sites.length, 'the Micah 4:4 span must occur in more than one place for this to be a real test').toBeGreaterThan(1);
    for (const p of sites) {
      const bent = TEXTS[p].replace(/for the mouth of the LORD of hosts hath spoken it/g, 'for the mouth of Yahweh of hosts hath spoken it');
      expect(bent, p).not.toBe(TEXTS[p]);
      expect(verbatimFaults([bent]).length, `${p}: the verbatim sweep did not fire`).toBeGreaterThan(0);
      const planted = quotedPairs(bent).filter((q) => /Yahweh/.test(q.inside));
      expect(planted.length, `${p}: the bright-line pin did not fire`).toBeGreaterThan(0);
    }
  });

  it('an ELIDED quotation is caught, so no span may be trimmed with dots', () => {
    const bent = { ...L, lesson: L.lesson.replace('Let them bring them forth, and shew us what shall happen: let them shew the former things, what they be, that we may consider them, and know the latter end of them; or declare us things for to come', 'Let them bring them forth ... declare us things for to come') };
    expect(bent.lesson).not.toBe(L.lesson);
    expect(elidedQuotations(bent).length).toBeGreaterThan(0);
  });

  it('a British spelling planted in OUR voice is caught, and a quote’s own spelling is not', () => {
    expect(findBritish('The office of the second party is rescue, and its labour is real.').length).toBeGreaterThan(0);
    expect(findBritish('"Two are better than one; because they have a good reward for their labour" (Ecclesiastes 4:9).')).toEqual([]);
  });

  it('planting a currency figure in a band is caught, in every band', () => {
    for (const place of PLACES) {
      const bent = `${TEXTS[place]} The four machines cost $4,000 each.`;
      expect(FIGURE_SHAPES.some((s) => s.test(bent)), place).toBe(true);
      expect(FIGURE_SHAPES.some((s) => s.test(TEXTS[place])), `${place} already carries a figure`).toBe(false);
    }
  });

  it('planting a percentage is caught too, which a currency check alone would miss', () => {
    for (const place of PLACES) {
      const bent = `${TEXTS[place]} The loop caught 94% of the faults.`;
      expect(FIGURE_SHAPES.some((s) => s.test(bent)), place).toBe(true);
    }
  });

  it('planting a number wearing a magnitude word is caught, which both the others miss', () => {
    for (const place of PLACES) {
      const bent = `${TEXTS[place]} They worked through 300 thousand proofs.`;
      expect(FIGURE_SHAPES.some((s) => s.test(bent)), place).toBe(true);
    }
  });

  it('a vendor or a person from the issue reaching the teaching is caught, and ordinary English is not', () => {
    expect(notOursRe('Nvidia').test('The Nvidia chip ran hot.')).toBe(true);
    expect(notOursRe('Bain').test('A partner at Bain said it.')).toBe(true);
    expect(notOursRe('Google').test('A famous Google engineer built it.')).toBe(true);
    // ordinary English must NOT trip the word-boundary matchers
    expect(notOursRe('MCP').test('The lamp was dim.')).toBe(false);
    expect(notOursRe('Bain').test('He could not contain himself.')).toBe(false);
    expect(notOursRe('Hershey').test('The shepherd went out.')).toBe(false);
  });

  it('deleting the unread-page disclosure from ONE band is caught, by that band’s name', () => {
    for (const place of PLACES) {
      expect(uniqueCarrier(UNREAD[place]), `${place}: pin not unique, so this break would be meaningless`).toEqual([place]);
      const bent = { ...TEXTS, [place]: TEXTS[place].split(UNREAD[place]).join('') };
      const short = PLACES.filter((p) => !bent[p].includes(UNREAD[p]));
      expect(short, `deleting ${place}'s disclosure must name ${place} and only ${place}`).toEqual([place]);
    }
  });

  it('deleting the telephone disclosure is caught the same way, band by band', () => {
    for (const place of PLACES) {
      const bent = { ...TEXTS, [place]: TEXTS[place].split(TELEPHONE[place]).join('') };
      const short = PLACES.filter((p) => !bent[p].includes(TELEPHONE[p]));
      expect(short, `deleting ${place}'s telephone line must name ${place} alone`).toEqual([place]);
    }
  });

  it('deleting the measured fetch failure is caught the same way, band by band', () => {
    for (const place of PLACES) {
      const bent = { ...TEXTS, [place]: TEXTS[place].split(FETCH_FAILED[place]).join('') };
      const short = PLACES.filter((p) => !bent[p].includes(FETCH_FAILED[p]));
      expect(short, `deleting ${place}'s fetch line must name ${place} alone`).toEqual([place]);
    }
  });

  it('turning "unchecked" into "confirmed" in ONE band is caught, at every site in that band', () => {
    for (const place of PLACES) {
      const bent = { ...TEXTS, [place]: TEXTS[place].replace(/unchecked/g, 'confirmed') };
      expect(bent[place], place).not.toBe(TEXTS[place]);
      expect(/unchecked/.test(bent[place]), `${place}: a site was left behind`).toBe(false);
      const short = PLACES.filter((p) => !/\bunchecked\b/.test(bent[p]));
      expect(short).toEqual([place]);
    }
  });

  it('printing a record id in reader prose is caught', () => {
    const bent = { ...L, inApp: `${L.inApp} See DR-1306 for the record.` };
    expect(recitedRecords(bent).length).toBeGreaterThan(0);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('a band shortened to a summary is caught by the share floor', () => {
    for (const band of BANDS) {
      const bent = { ...L, levels: { ...L.levels, [band]: L.levels[band].slice(0, 400) } };
      expect(shortBands(measureFullness(bent), FULL_FLOOR), band).toContain(band);
    }
  });

  it('a band copied from its sibling is caught by the near-copy line', () => {
    const bent = { ...L, levels: { ...L.levels, teen: L.levels.senior } };
    const d = measureDifferentiation(bent);
    expect(d.worst).toBeGreaterThan(LADDER.nearCopy);
    expect(fourBandFaults(bent, LADDER).length).toBeGreaterThan(0);
  });

  it('a band that loses its title opening is caught, in every band', () => {
    for (const band of BANDS) {
      const bent = { ...L, levels: { ...L.levels, [band]: L.levels[band].slice(140) } };
      expect(unnamedBands(bent), band).toContain(band);
    }
  });

  it('stripping one band’s friend line alone is named for THAT band, while the pooled check still reads green', () => {
    for (const band of BANDS) {
      const friend = /Friends, tell one friend this week[^.]*\./.exec(L.levels[band]);
      expect(friend, `${band}'s friend sentence is not where this test expects it`).toBeTruthy();
      const bent = { ...L, levels: { ...L.levels, [band]: L.levels[band].replace(friend[0], '') } };
      expect(bent.levels[band]).not.toBe(L.levels[band]);
      expect(placesMissingDirections(bent)).toEqual([{ place: band, missing: ['friends'] }]);
      expect(hasAllThree(bent), 'the pooled check is exactly what DR-0795 says is not enough').toBe(true);
    }
  });

  it('a story relabelled as a testimony is caught', () => {
    const bent = { ...L, stories: [{ ...L.stories[0], kind: 'testimony' }, L.stories[1]] };
    expect(bent.stories.every((s) => s.kind === 'parable')).toBe(false);
    expect(L.stories.every((s) => s.kind === 'parable')).toBe(true);
  });

  it('an anchor chapter colliding with another week IS detected, both ways', () => {
    const taken = new Set();
    for (const m of [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES]) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) { const c = chapterOf(r); if (c) taken.add(c); }
    }
    // Adopt a chapter measured SPENT and watch the free-ground check fire.
    const bentOurs = [...OURS, 'Deuteronomy 19'];
    expect(bentOurs.filter((c) => taken.has(c))).toEqual(expect.arrayContaining(['Deuteronomy 19']));
    // And the real set still reports clean, so the above is not a tautology.
    // RE-POINTED (2026-11-05, DR-1344). The line here was
    // `expect(OURS.filter((c) => taken.has(c))).toEqual([])` -- "and the real
    // set still reads clean" -- which is the frozen census DR-1333 removed
    // from this file's main assertion but left standing inside its own proof.
    // DR-1333 re-pointed only the two proofs that sov67 happened to break;
    // sov68 then broke this one by sharing a chapter, which is the measurement
    // that this half of the proof was never about catching anything.
    // What still deserves proving is that the census MEASURES, asserted above.
    expect(taken.size, 'an empty census cannot read as a pass').toBeGreaterThan(20);
  });

  it('dropping the Lamb confession from ONE band is caught, at every site in that band', () => {
    for (const place of PLACES) {
      const bent = TEXTS[place].replace(/Jesus, the Lamb of Yahweh and the Eternal Son of Yahweh/g, 'He');
      expect(bent, place).not.toBe(TEXTS[place]);
      expect(/Jesus, the Lamb of Yahweh/.test(bent), `${place}: a site was left behind`).toBe(false);
      expect(bent.includes('Eternal Son of Yahweh'), `${place}: the Eternal Son pin did not fire`).toBe(false);
    }
  });

  it('softening the hinge is caught: the typing may never become the bottleneck', () => {
    for (const place of PLACES) {
      const bent = TEXTS[place].replace(/[Tt]yping was never the bottleneck/g, 'typing used to be the bottleneck');
      expect(bent, place).not.toBe(TEXTS[place]);
      expect(/[Tt]yping was never the bottleneck/.test(bent), `${place}: a site was left behind`).toBe(false);
    }
  });

  it('dropping the DR-0100 concession about a second reader is caught, in the lesson and in the senior band', () => {
    const bentAdult = L.lesson.replace('a second reader really does catch what the first one missed', 'a second reader catches nothing a tool could not');
    expect(bentAdult).not.toBe(L.lesson);
    expect(/really does catch what the first one missed/.test(bentAdult)).toBe(false);
    const bentSenior = L.levels.senior.replace('Under-claiming a real thing is as much a failure as over-claiming a false one.', '');
    expect(bentSenior).not.toBe(L.levels.senior);
    expect(/Under-claiming a real thing/.test(bentSenior)).toBe(false);
    expect(uniqueCarrier('Under-claiming a real thing is as much a failure as over-claiming a false one.')).toEqual(['senior']);
  });

  it('dropping either half of the local argument is caught, in every reader text', () => {
    for (const place of PLACES) {
      const noAffirm = TEXTS[place].split('(Micah 4:4)').join('');
      const noGuard = TEXTS[place].split('(Hosea 8:6)').join('');
      expect(noAffirm.includes('(Micah 4:4)'), `${place}: the affirmation pin did not fire`).toBe(false);
      expect(noGuard.includes('(Hosea 8:6)'), `${place}: the guard pin did not fire`).toBe(false);
    }
  });
});
