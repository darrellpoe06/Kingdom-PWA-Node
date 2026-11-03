// @vitest-environment node
// =============================================================================
// sov59 — Last call: the clock a seller sets, the year he cannot give, and the
// Now that is Yahweh's own
// =============================================================================
// Darrell forwarded Gmail thread 1a0d92de3dba5e7e on 2026-09-25 at 15:34:15 UTC
// from his university address to himself, with one word typed above the forward:
// "Lessons." The thread holds two messages — the original send from the
// publisher at 15:02:53 UTC, and his forward. Judged BY THE BODY and not by the
// subject, which is only whatever he happened to forward, this is a real lesson
// send: the word is his own, at the top of his own message, not a word occurring
// inside the forwarded mail.
//
// MEASURED FIRST, ALL THREE PROBES, BEFORE A WORD WAS WRITTEN.
//
//   $ node scripts/lesson-row-shipped-sweep.mjs 1a0d92de3dba5e7e
//   unknown   1a0d92de3dba5e7e  ->  no decision record names it      (exit 0)
//
//   $ node scripts/lesson-row-shipped-sweep.mjs 1a0d92de3dba5e7e \
//       --subject "FW: LAST CALL FOR ENROLLMENT: Rebuild YouTube with AI"
//     * enrollment -> 7 record(s), worth 0.143
//     * rebuild    -> 41 record(s), worth 0.024
//     * youtube    -> 41 record(s), worth 0.024
//     no record shares enough distinctive words with this subject    (exit 0)
//
//   get_thread, METADATA_ONLY -> labelIds ["UNREAD","CATEGORY_UPDATES","INBOX"]
//     on the original and ["UNREAD","CATEGORY_PERSONAL","INBOX"] on the
//     forward. NO Label_22 on either. The label is the lock; a search is a hint.
//
// The id probe alone is not trusted (DR-1288: it has twice handed a builder an
// already-built teaching), so the subject probe was run and nothing reached the
// 0.2 bar. AND THE OLDEST-REMAINING CLAIM WAS MEASURED BY DATE, NOT BY ID ORDER:
// the lane query {from:darrellpoe06 from:dpoe} Lesson -label:Lesson-Captured
// newer_than:365d before:2026/09/26 returns exactly two threads, and the other
// (1a0aaaf7d6952b4b, "FW: Cheat codes") sweeps SHIPPED -> DR-1272, DR-1300. The
// two threads the coordinator named as the only other unbuilt sends are both
// 2026-10-08 (14:12:27 and 14:26:23 UTC), thirteen days later. So this is the
// oldest genuinely-unbuilt send, by date and not by a hint.
//
// THE FIRST DANGER IS THAT THE WHOLE FORWARD IS AN ADVERTISEMENT. It is not a
// digest with one promoted item in it; it is a sales letter end to end, for a
// paid online course. Darrell's standing instruction in this lane is to ignore
// advertisements UNLESS they bear on the lesson — and he typed his intake word
// on this one, which relates it. So the lesson treats it as material to examine
// and says in the reader's hearing that it is an advertisement, rather than
// letting a reader assume a study was read. No vendor, product, school or
// instructor from the letter is named anywhere in the module, following sov33,
// sov57 and sov58: the pattern in the reader's own hand is the teaching, and a
// named vendor only dates it. The matchers below use word boundaries so that
// ordinary English cannot trip them.
//
// THE ONE ITEM THAT CARRIES A TEACHING is the letter's own argument, and it is
// exactly two numbers: enrollment closes in twenty-four hours, and buy now for
// twelve months of access to everything including material not yet made. One
// contracts deliberation, the other expands the apparent reward, and together
// they say decide faster than you can think and we will give you more than you
// can check. The enumerated curriculum — scoping, building across the stack,
// semantic search, testing, deploying — is the PRODUCT, and it carries no
// teaching. The roster of instructors sold by employer is a second, smaller
// move and is used, because the letter sets it directly beneath the first.
//
// THE SECOND DANGER IS A BORROWED FIGURE, AND THIS LESSON STAKES NONE. Three
// roads to the source were tried and all three were refused, which is recorded
// rather than paraphrased: WebFetch on the publisher's own post URL returned
// `getaddrinfo ENOTFOUND blog.bytebytego.com`, and curl on that host and on the
// letter's `substack.com` redirect both returned `CONNECT tunnel failed,
// response 403`. No further hosts were tried after the third denial. So nobody
// read the course page, nobody sat in a session, nobody telephoned the writer
// or the publisher, and every claim the letter makes about what a student will
// be able to do is carried as the letter's own UNCHECKED claim, said to be
// unchecked in the lesson AND in all four bands. The teaching rests on the
// SHAPE of the two numbers, which is printed in the letter itself and is
// legible, and not on the merit of the course, which is unknown.
//
// THE THIRD DANGER IS A SPINE CHOSEN BY HEADLINE, and this one bit hard. The
// obvious verses for "do not be rushed into buying" are nearly all spent in
// this department, measured and not assumed: James 4 (6 lessons), Proverbs 27
// (25), Isaiah 28 (7), Luke 12 (14), 1 Samuel 13 (3), Proverbs 21 (7),
// Proverbs 19 (3), Proverbs 28 (3), Ecclesiastes 3 (3), Proverbs 14 (21),
// Acts 17 (10), Luke 14 (22) and 1 Thessalonians 5 (19) are all already
// anchors. The department holds 399 distinct anchor chapters across 72 lessons.
// The thirteen chapters this lesson stands on were each measured ABSENT from
// sov1–sov58 and from the department's other two courses before they were
// written in, and the collision check below is keyed on BOOK AND CHAPTER and
// runs in BOTH directions — the repair sov57 paid for and sov58 recorded.
//
// THE FOURTH DANGER IS A DISCLOSURE PIN THAT IS NOT UNIQUE. Earlier records
// passed with a disclosure DELETED because the pinned string also occurred
// elsewhere in the module. So every pin below is asserted to occur in EXACTLY
// ONE reader text, and the proven-to-catch block deletes a disclosure from one
// band and watches that band, and only that band, be named.
//
// BOTH STORIES ARE PARABLES. This lesson is built from an advertisement; nobody's
// life is in it. `kind: 'testimony'` renders as a true story told with a named
// person's consent, which would be a lie on the page (DR-0811).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { MODULES } from '../lib/church-classes.js';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { fourBandFaults, LADDER } from './fixtures/four-band-ladder.js';

const ID = 'sov59-last-call-the-clock-a-seller-sets';
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
  ['Isaiah 55:1', 'come ye, buy, and eat; yea, come, buy wine and milk without money and without price'],
  ['Isaiah 55:2', 'Wherefore do ye spend money for that which is not bread? and your labour for that which satisfieth not?'],
  ['Isaiah 55:6', 'Seek ye the LORD while he may be found, call ye upon him while he is near'],
  ['Genesis 25:31', 'Sell me this day thy birthright'],
  ['Genesis 25:32', 'Behold, I am at the point to die: and what profit shall this birthright do to me?'],
  ['Genesis 25:34', 'thus Esau despised his birthright'],
  ['Genesis 27:20', 'How is it that thou hast found it so quickly, my son?'],
  ['Exodus 32:1', 'And when the people saw that Moses delayed to come down out of the mount'],
  ['Numbers 14:41', 'Wherefore now do ye transgress the commandment of the LORD? but it shall not prosper'],
  ['Numbers 14:44', 'But they presumed to go up unto the hill top'],
  ['Proverbs 7:19', 'For the goodman is not at home, he is gone a long journey'],
  ['Proverbs 7:20', 'and will come home at the day appointed'],
  ['Proverbs 7:21', 'With her much fair speech she caused him to yield'],
  ['Acts 24:25', 'Go thy way for this time; when I have a convenient season, I will call for thee'],
  ['2 Corinthians 6:2', 'behold, now is the accepted time; behold, now is the day of salvation'],
  ['Philippians 3:7', 'But what things were gain to me, those I counted loss for Christ'],
  ['Philippians 3:8', 'I count all things but loss for the excellency of the knowledge of Christ Jesus my Lord'],
  ['1 Kings 13:18', 'I am a prophet also as thou art; and an angel spake unto me by the word of the LORD'],
  ['1 Kings 13:18', 'But he lied unto him'],
  ['Psalms 27:14', 'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD'],
  ['Psalms 37:7', 'Rest in the LORD, and wait patiently for him: fret not thyself because of him who prospereth in his way'],
  ['2 Kings 7:9', 'this day is a day of good tidings, and we hold our peace'],
];

// THE CHAPTERS THIS LESSON STANDS ON, each measured absent from the department
// before it was written in, and the ones DECLINED BY MEASUREMENT because they
// are already anchors here: James 4 (go to now, ye that say we will continue
// there a year), Proverbs 27 (boast not thyself of to morrow), Isaiah 28 (he
// that believeth shall not make haste), Luke 12 (the rich fool's years),
// 1 Samuel 13 (Saul would not wait seven days), Proverbs 21 and Proverbs 19
// and Proverbs 28 (the hasty and the man who makes haste to be rich),
// Ecclesiastes 3 (a season to every thing), Proverbs 14 (the simple believeth
// every word), Acts 17 (the Bereans searched daily), Luke 14 (count the cost)
// and 1 Thessalonians 5 (prove all things).
const OURS = [
  'Isaiah 55', 'Genesis 25', 'Genesis 27', 'Exodus 32', 'Numbers 14',
  'Proverbs 7', 'Acts 24', '2 Corinthians 6', 'Philippians 3', '1 Kings 13',
  'Psalms 27', 'Psalms 37', '2 Kings 7',
];
const DECLINED_AS_SPENT = [
  'James 4', 'Proverbs 27', 'Isaiah 28', 'Luke 12', '1 Samuel 13',
  'Proverbs 21', 'Proverbs 19', 'Proverbs 28', 'Ecclesiastes 3',
  'Proverbs 14', 'Acts 17', 'Luke 14', '1 Thessalonians 5',
];

// Every vendor, product, platform, school and instructor the forwarded letter
// names, refused a foothold in ANY string of the module — including the
// publisher itself. Word boundaries, so ordinary English cannot trip it.
const NOT_OURS = [
  'ByteByteGo', 'Substack', 'Beehiiv', 'YouTube', 'Vercel', 'Postgres',
  'Playwright', 'React', 'Salesforce', 'Meta', 'Google', 'AMD', 'Berkeley',
  'Kent Beck', 'Manjeet Singh', 'Jeremy Hintz', 'Ali Aminian', 'John Kim',
  'Tanya Roosta', 'Claude', 'Codex', 'Lucide', 'TDD', 'MVP',
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notOursRe = (name) => new RegExp(`\\b${escapeRe(name)}\\b`);

// A figure a reader could be misled by: a currency symbol, a percentage, or a
// number wearing a magnitude word. The letter's own two numbers are written as
// WORDS on purpose, so no digit in any reader text is doing a claim's work.
const FIGURE_SHAPES = [
  /[$£€]/,
  /\d\s*%|\bper cent\b|\bpercent\b/i,
  /\b\d[\d,.]*\s*(?:million|billion|trillion|thousand)\b/i,
];

// The disclosures, one phrasing per place, each asserted UNIQUE below.
const UNREAD = {
  adult: 'nobody here read the course page',
  child: "We never read the class's own page.",
  youth: 'The article behind that one link was never opened by anybody here.',
  teen: "Nobody here opened the course's own page.",
  senior: "Not one of us opened the publisher's own page describing the course.",
};
const TELEPHONE = {
  adult: 'nobody telephoned the writer or the publisher',
  child: 'we did not call anybody up to ask',
  youth: 'No one here telephoned the writer or the newsletter',
  teen: 'we never rang the writer or the publisher',
  senior: 'Neither the writer nor the publisher was ever telephoned by anyone here',
};
const FETCH_FAILED = {
  adult: "the fetch could not resolve the publisher's host at all",
  child: 'it could not even find the place where that page lives',
  youth: "The publisher's hostname would not resolve.",
  teen: "the publisher's host would not resolve at all",
  senior: "the publisher's hostname failed to resolve",
};
// An image no other band uses, so each band is proven to be written from its
// own material rather than reworded from a sibling.
const OWN_IMAGE = {
  child: 'His tummy said he had no time.',
  youth: 'he can still do math on time',
  teen: 'Zero gap between the pitch and the step.',
  senior: 'a settled account',
};
const uniqueCarrier = (pin) => PLACES.filter((p) => TEXTS[p].includes(pin));

// BY ORDINAL, NOT BY POSITION (P62, and the cost sov58 recorded): this gate
// asserts what is true of SOV59 — it is the fifty-ninth module, at index 58,
// whatever follows it — and derives the course's size from the course, so that
// sov60 does not break this file on the day it lands.
describe('sov59 is in the course, fifty-ninth, and whole', () => {
  const ORDINAL = 59;

  it('exists exactly once, as the fifty-ninth lesson, with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.length).toBeGreaterThanOrEqual(ORDINAL);
    expect(
      SOVEREIGN_AI_MODULES[ORDINAL - 1].id,
      'sov59 must sit at the fifty-ninth position, whatever follows it',
    ).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course ids run sov1 upward with no gap and no repeat, counting the course itself', () => {
    const numbers = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: SOVEREIGN_AI_MODULES.length }, (_, i) => i + 1));
    expect(numbers, 'and 59 is one of them').toContain(ORDINAL);
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
    expect(refs.length).toBeGreaterThanOrEqual(21);
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
    expect(chapterOf('2 Corinthians 6:2')).toBe('2 Corinthians 6');
    expect(chapterOf('1 Kings 13:18')).toBe('1 Kings 13');
    expect(chapterOf('Isaiah 55:1')).toBe('Isaiah 55');
    expect(chapterOf('Isaiah 55:1')).not.toBe('Isaiah');
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
    expect(taken.size).toBeGreaterThan(300);
    const clashes = OURS.filter((c) => taken.has(c));
    expect(clashes, `another week already stands on: ${clashes.join(', ')}`).toEqual([]);
    // AND THE OTHER DIRECTION: every chapter declined as spent must be detected
    // as spent, or the check is matching nothing and passing vacuously.
    for (const spent of DECLINED_AS_SPENT) {
      expect(taken.has(spent), `${spent} was declined as spent but is anchored nowhere`).toBe(true);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(110);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(100);
  });

  it('every double-quoted span carries a reference: the letter’s words are rendered, never quoted', () => {
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
    // Isaiah 55:6 and Numbers 14:41 carry "the LORD" and Isaiah 55:7 "our God"
    // in the corpus; we quote them as written and the corpus is left untouched.
    expect(corpusText('Isaiah 55:6')).toContain('Seek ye the LORD');
    expect(corpusText('Numbers 14:41')).toContain('the commandment of the LORD');
    expect(corpusText('Psalms 37:7')).toContain('Rest in the LORD');
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
});

describe('the source is named for what it is: an advertisement, not a study', () => {
  it('names the intake word in every reader text, and the lesson says what arrived', () => {
    for (const place of PLACES) expect(TEXTS[place], place).toMatch(/\bLessons\b/);
    expect(L.lesson).toMatch(/Darrell forwarded an advertisement into this course under one word: Lessons\./);
    expect(L.bigIdea).toMatch(/Darrell forwarded an advertisement into this course under one word: Lessons\./);
  });

  it('every reader text calls the material an advertisement, so nobody thinks a study was read', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} never calls it an advertisement or an ad`).toMatch(/\badvertisement\b|\bad\b/);
    }
    expect(L.levels.senior).toMatch(/It is an advertisement from beginning to end/);
  });

  it('names the two numbers that are the letter’s whole argument, in every reader text', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place}: the closing door`).toMatch(/twenty-four hours|one day/);
      expect(TEXTS[place], `${place}: the promised span`).toMatch(/twelve (?:full )?months|a whole year/);
    }
    expect(L.lesson).toMatch(/decide faster than you can think, and we will give you more than you can check/);
  });

  it('states the hinge plainly: the clock was manufactured, not discovered', () => {
    expect(L.lesson).toMatch(/the twenty-four hours is not a feature of the world/);
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} does not say a person chose it`).toMatch(/could have (chosen|picked)/);
    }
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

  it('says in every place, in one word, that the course’s claims are unchecked', () => {
    for (const place of PLACES) expect(TEXTS[place], place).toMatch(/\bunchecked\b/);
  });

  it('refuses every vendor, product, school and instructor the letter names a foothold', () => {
    const found = [];
    for (const name of NOT_OURS) {
      const re = notOursRe(name);
      for (const t of EVERY_STRING) if (re.test(t)) found.push(`${name} :: ${t.slice(0, 50)}`);
    }
    expect(found, `the letter’s own names reached the module: ${found.join(' | ')}`).toEqual([]);
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
  it('reads what Isaiah 55:1 DOES to the language of a market, not just the picture', () => {
    expect(L.lesson).toMatch(/He uses the language of a market - come, buy, eat - and then removes the two things every market runs on/);
  });

  it('turns on Isaiah 55:2’s actual question, which is substance and not affordability', () => {
    expect(L.lesson).toMatch(/Not: can you pay\. But: is it bread\./);
  });

  it('presses the VERDICT of Genesis 25:34, which is consent and not theft', () => {
    expect(L.lesson).toMatch(/A manufactured urgency does not steal from you\. It persuades you to sell\./);
  });

  it('reads Genesis 27:20 as the right question AND names where Isaac still failed', () => {
    expect(L.lesson).toMatch(/Speed deserves the question\. And asking the question is not the same as checking the answer\./);
  });

  it('credits Exodus 32:1 with locating the pressure INSIDE the reader', () => {
    expect(L.lesson).toMatch(/it is renting one that was there before the letter arrived/);
  });

  it('refuses to let this become a lesson in stalling, which is the DR-0100 balance', () => {
    expect(L.lesson).toMatch(/So hesitation is not a virtue and delay is not safety\./);
    expect(L.lesson).toMatch(/A clock Yahweh set is obeyed on the hour\./);
  });

  it('names the mechanism in Proverbs 7:21 and what straightway costs', () => {
    expect(L.lesson).toMatch(/Not forced him with a weapon\. Yielded him with speech\./);
    expect(L.lesson).toMatch(/Straightway is the whole fall\./);
  });

  it('marks Felix’s sentence as deferral wearing the clothes of discernment', () => {
    expect(L.lesson).toMatch(/it is deferral wearing the clothes of both/);
  });

  it('distinguishes the two clocks by what each COSTS and whom each PROFITS', () => {
    expect(L.lesson).toMatch(/A deadline that costs you to meet it and profits the one who set it is a sales tool\./);
    expect(L.lesson).toMatch(/A deadline that costs you nothing to meet and profits you entirely is a mercy\./);
  });

  it('weighs the credential roster by Philippians 3:7-8 without calling a badge worthless (DR-0100)', () => {
    expect(L.lesson).toMatch(/And a badge is not nothing - experience is real/);
    expect(L.lesson).toMatch(/He did not say his credentials were fake\. He said they were the wrong currency\./);
  });

  it('settles the appeal to authority on the four words of 1 Kings 13:18', () => {
    expect(L.lesson).toMatch(/A badge tells you where somebody has been\. It does not tell you whether this particular sentence is true\./);
  });

  it('concedes the real half of the speed claim rather than sneering at it (DR-0100)', () => {
    expect(L.lesson).toMatch(/the speed is partly real/);
    expect(L.levels.senior).toMatch(/under-claiming a real thing is as much a failure as over-claiming a false one/);
  });

  it('ends on an urgency that is real, free, and profits the speaker nothing', () => {
    expect(L.lesson).toMatch(/it costs the hearer nothing and profits the speaker nothing/);
  });

  it('and every band carries the hinge and the balance in its OWN words', () => {
    for (const band of BANDS) {
      expect(L.levels[band], `${band} drops the hinge`).toMatch(/\bclock\b/);
      expect(L.levels[band], `${band} drops the ownership question`).toMatch(/[Ww]hose clock/);
      expect(L.levels[band], `${band} drops the balance`).toMatch(/Felix/);
      expect(L.levels[band], `${band} drops the real now`).toContain('(2 Corinthians 6:2)');
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
    expect(L.stories[0].body).toMatch(/the sign never moved once in a month/);
    expect(L.stories[1].body).toMatch(/a clock belongs to the man who wound it/);
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
// anchor — the correction the previous round paid for, where three of seven
// breaks SKIPPED instead of failing because the probe keyed on a string that
// appeared in several bands. Where a break is deliberately scoped to ONE band,
// the pin is first asserted unique to that band by `uniqueCarrier`.
// ===========================================================================
describe('PROVEN-TO-CATCH: each check was watched to fail on the live text', () => {
  it('a quotation that drifted by one word is caught', () => {
    const bent = 'He asked it. "How is it that thou hast found it so fast, my son?" (Genesis 27:20).';
    expect(verbatimFaults([bent])).toEqual(['(Genesis 27:20) is not the verse: How is it that thou hast found it so fast, my son?']);
  });

  it('a verbatim span hung on the WRONG reference is caught', () => {
    const bent = 'He wrote. "But he lied unto him" (1 Kings 13:19).';
    expect(verbatimFaults([bent]).length).toBe(1);
    expect(verbatimFaults([bent])[0]).toContain('(1 Kings 13:19) is not the verse');
  });

  it('substituting Yahweh into a quotation is caught, at every site the span occurs', () => {
    const sites = PLACES.filter((p) => TEXTS[p].includes('Rest in the LORD, and wait patiently for him'));
    expect(sites.length, 'the Psalms 37:7 span must occur in more than one place for this to be a real test').toBeGreaterThan(1);
    for (const p of sites) {
      const bent = TEXTS[p].replace(/Rest in the LORD, and wait patiently for him/g, 'Rest in Yahweh, and wait patiently for him');
      expect(bent, p).not.toBe(TEXTS[p]);
      expect(verbatimFaults([bent]).length, `${p}: the verbatim sweep did not fire`).toBeGreaterThan(0);
      const planted = quotedPairs(bent).filter((q) => /Yahweh/.test(q.inside));
      expect(planted.length, `${p}: the bright-line pin did not fire`).toBeGreaterThan(0);
    }
  });

  it('an ELIDED quotation is caught, so no span may be trimmed with dots', () => {
    const bent = { ...L, lesson: L.lesson.replace('For the goodman is not at home, he is gone a long journey', 'For the goodman is not at home ... gone a long journey') };
    expect(bent.lesson).not.toBe(L.lesson);
    expect(elidedQuotations(bent).length).toBeGreaterThan(0);
  });

  it('planting a currency figure in a band is caught, in every band', () => {
    for (const place of PLACES) {
      const bent = `${TEXTS[place]} The course cost $499 to join.`;
      expect(FIGURE_SHAPES.some((s) => s.test(bent)), place).toBe(true);
      expect(FIGURE_SHAPES.some((s) => s.test(TEXTS[place])), `${place} already carries a figure`).toBe(false);
    }
  });

  it('planting a percentage is caught too, which a currency check alone would miss', () => {
    for (const place of PLACES) {
      const bent = `${TEXTS[place]} Ninety 90% of students finished it.`;
      expect(FIGURE_SHAPES.some((s) => s.test(bent)), place).toBe(true);
    }
  });

  it('a vendor name from the letter reaching the teaching is caught, and ordinary English is not', () => {
    expect(notOursRe('Google').test('A famous Google engineer taught it.')).toBe(true);
    expect(notOursRe('Meta').test('They worked at Meta for years.')).toBe(true);
    // ordinary English must NOT trip the word-boundary matchers
    expect(notOursRe('Meta').test('The metadata was missing.')).toBe(false);
    expect(notOursRe('React').test('He did not react to the price.')).toBe(false);
    expect(notOursRe('Claude').test('The clouded sky broke open.')).toBe(false);
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
    const bent = { ...L, inApp: `${L.inApp} See DR-1301 for the record.` };
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
      const bent = { ...L, levels: { ...L.levels, [band]: L.levels[band].slice(120) } };
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
    const bentOurs = [...OURS, 'Luke 14'];
    expect(bentOurs.filter((c) => taken.has(c))).toEqual(['Luke 14']);
    // And the real set still reports clean, so the above is not a tautology.
    expect(OURS.filter((c) => taken.has(c))).toEqual([]);
  });

  it('dropping the Lamb confession from ONE band is caught, at every site in that band', () => {
    for (const place of PLACES) {
      const bent = TEXTS[place].replace(/Jesus, the Lamb of Yahweh and the Eternal Son of Yahweh/g, 'He');
      expect(bent, place).not.toBe(TEXTS[place]);
      expect(/Jesus, the Lamb of Yahweh/.test(bent), `${place}: a site was left behind`).toBe(false);
      expect(bent.includes('Eternal Son of Yahweh'), `${place}: the Eternal Son pin did not fire`).toBe(false);
    }
  });
});
