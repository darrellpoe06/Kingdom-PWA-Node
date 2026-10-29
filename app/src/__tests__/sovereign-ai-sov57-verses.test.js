// @vitest-environment node
// =============================================================================
// sov57 — The code can be rebuilt; the register cannot: the priests who lost
// their record, and the roll that outlived the king who signed it (DR-1285)
// =============================================================================
// Darrell forwarded Gmail thread 1a0f23b12bf2ca45 on 2026-09-30 with one word
// above it: Lessons. The thread is a single message — one issue of the TLDR
// daily technology newsletter, sent to his university address and forwarded on.
//
// THIS THREAD WAS ALREADY BUILT ONCE, and the correction belongs at the top of
// the file rather than buried. The brief for this lesson asserted the thread was
// "the oldest of his forwarded teachings still unbuilt". That was FALSE. The
// repository's own instrument says so:
//
//   $ node scripts/lesson-row-shipped-sweep.mjs 1a0f23b12bf2ca45
//   SHIPPED   1a0f23b12bf2ca45  ->  DR-1246, DR-1285
//
// sov51 (DR-1246) built it on 2026-09-30, and it did NOT declare this item a
// leave-out: the item is one of its five SERVING items, and sov51 calls its
// sentence "the sentence this lesson turns on". So sov57 is the SECOND teaching
// from one forward, and the checks below require every reader text to SAY so.
// Measured, not asserted: 0 shared anchor verses, 0 shared chapters, and across
// sov51's whole module `record` 0, `register` 0, `rebuild` 0, `irreplaceable` 0
// -- it states the asymmetry as its premise and nowhere teaches it. Whether the
// two should be one lesson is Darrell's editorial call, not this file's (see
// one-teaching-one-lesson-guard.mjs:13-16). The gap that let it happen is closed
// by scripts/one-thread-one-record-guard.mjs; the full comparison is in DR-1285.
//
// THE FIRST DANGER IS PRETENDING THE ISSUE HELD AN ARGUMENT IT DID NOT. A
// newsletter is not a study. This issue is a run of short items, each one a
// paragraph compressing somebody else's longer article, with three paid
// placements set between them. MOST of the items carry no teaching whatever: a
// roundup of one firm's product announcements, a reorganisation at another, a
// spacecraft retirement, an uncrewed test flight, a browser redesign, a market
// analysis. EXACTLY ONE item carries a thesis, and that item is four sentences
// long: it reports a piece titled "Data is the application" — building has never
// been faster, none of that speed reaches the data, lose the data people gave
// you and you begin again, so let agents iterate the code and leave the data to
// humans. That thesis is the lesson, and the lesson says so in the reader's
// hearing rather than in a note somebody else keeps.
//
// THE SECOND DANGER IS THE ADVERTISING. Darrell's standing rule is to ignore
// ads unless they are related to the lesson, and NONE of these is. The issue
// carried three marked sponsor placements (Span, Doroni, Microsoft) plus a
// dozen other people's stories, and the check below refuses every one of those
// names a foothold in ANY string of the module. It is written with word
// boundaries rather than bare substring tests so that ordinary English —
// "spans", "metal", "chrome" — cannot trip it, while "Span's" and "Meta" do.
//
// THE THIRD DANGER IS A BORROWED FIGURE, AND THE LESSON STAKES NONE. The issue
// was thick with numbers — a projected market, a share price, an Azure credit,
// a count of advertisers, a plan multiplier, a browser version — and every one
// of them belongs to an advertisement or to a DIFFERENT story. None is germane
// and none is taught. The checks below pin that claim by requiring that no
// reader-facing text in this module carries a currency symbol, a percentage, or
// a number wearing a magnitude word. A "we stake no figure" claim that nothing
// enforces is the theatre DR-0076 §3 forbids, and a 0-figure row in
// lesson-sources.json is forbidden outright because it would make checked()
// count a lesson whose figures nobody read. The counted worklist in
// the-third-pile-is-a-worklist.test.js holds the other half of the admission.
//
// THE FOURTH DANGER IS A SPINE CHOSEN BY HEADLINE. "Keep your records" has
// obvious verses, and the obvious ones are spent: the sealed evidence of
// Jeremiah 32, the book of remembrance of Malachi 3, the book of records read to
// the king in Esther 6, the register of Nehemiah 7 — the direct parallel to this
// lesson's lead verse — and "write the vision" in Habakkuk 2 are all already
// anchors in this course. Every chapter below was MEASURED absent from sov1
// through sov56 and from the other two courses in the "A.I. The Way" department
// (church-classes.js, ai-legal-blueprint-class.js) before it was written in.
//
// AND THE FIRST ATTEMPT AT THAT MEASUREMENT WAS ITSELF WRONG, which is recorded
// here rather than quietly fixed. This lesson was first built on Isaiah 30:8,
// and the collision check keyed on the BOOK name instead of book-and-chapter,
// so it compared "Isaiah 30" against a set that held "Isaiah" and passed with
// nothing to report. Re-measured with `chapterOf` below, Isaiah 30 is already
// anchored by sov33 — at verses 9, 10 and 11, the three verses immediately
// after the one this lesson had taken. The anchor moved to Psalms 102:18, which
// is both free and a better fit ("the generation to come", "the people which
// shall be created" — a reader who cannot question the author, which is the
// lesson's own thesis). Isaiah 30 now sits in DECLINED_AS_SPENT with the rest.
//
// BOTH STORIES ARE PARABLES, IN THE THIRD PERSON. This lesson is built from a
// newsletter; nobody's life is in it. A `kind: 'testimony'` would render to the
// reader as a true story told with a named person's consent over an invented
// narrator, which is a lie on the page, so a check forbids it.
//
// EVERY DISCLOSURE PIN IS CHECKED FOR UNIQUENESS BEFORE IT IS TRUSTED. Two
// prior records passed with the disclosure DELETED because the pinned string
// also occurred elsewhere. So each pin below is asserted to occur in EXACTLY
// ONE reader text and to be the expected one, and the proven-to-catch block
// deletes a disclosure from a single band and watches that band be named.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
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
import { fourBandFaults } from './fixtures/four-band-ladder.js';

const ID = 'sov57-the-code-can-be-rebuilt-the-register-cannot';
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

// --- the repo's own KJV, read off disk -------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names, or null when it does not resolve. */
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

/** Pairs by SPLITTING on the quote character, never by regex. */
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
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!verse.includes(inside.trim())) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// A BOOK-AND-CHAPTER key, which is the whole point of the counting rule. The
// first draft of this file keyed on the BOOK alone (`/^(.+?)\s+\d+:/` returns
// "Isaiah", not "Isaiah 30"), so the collision check compared "Isaiah 30"
// against a set of book names, matched nothing, and passed while the lesson's
// lead verse sat one verse away from sov33's spine (Isaiah 30:9-11). A gate
// that cannot fail is a lie (DR-0076 section 3); this is the fix, and the
// anchor moved to Psalms 102:18 as a result.
export function chapterOf(ref) {
  const m = /^(.+?)\s+(\d+)[:\s]/.exec(String(ref).trim());
  return m ? `${m[1].trim()} ${Number(m[2])}` : null;
}

// THE SPINE, pinned by literal text. Every span was read out of the corpus on
// disk before it was written into the lesson, and each must still be there.
const SPINE = [
  ['Psalms 102:18', 'This shall be written for the generation to come'],
  ['Psalms 102:18', 'the people which shall be created shall praise the LORD'],
  ['Ezra 2:62', 'These sought their register among those that were reckoned by genealogy, but they were not found'],
  ['Ezra 2:62', 'therefore were they, as polluted, put from the priesthood'],
  ['Ezra 2:63', 'that they should not eat of the most holy things, till there stood up a priest with Urim and with Thummim'],
  ['Deuteronomy 31:26', 'put it in the side of the ark of the covenant'],
  ['Deuteronomy 31:26', 'that it may be there for a witness against thee'],
  ['Job 19:23', 'oh that they were printed in a book'],
  ['Job 19:24', 'graven with an iron pen and lead in the rock for ever'],
  ['Ezra 6:1', 'search was made in the house of the rolls, where the treasures were laid up in Babylon'],
  ['Ezra 6:2', 'there was found at Achmetha'],
  ['Ezra 6:2', 'a roll, and therein was a record thus written'],
  ['1 Chronicles 9:1', 'So all Israel were reckoned by genealogies; and, behold, they were written in the book of the kings of Israel and Judah'],
];

// THE CHAPTERS THIS LESSON STANDS ON, and the ones DECLINED BY MEASUREMENT.
// Declined because they are already anchors in this course (measured, not
// assumed): Jeremiah 32, Malachi 3, Esther 6, Nehemiah 7, Habakkuk 2.
// Declined although free: 2 Kings 22 and 2 Chronicles 34 (a second "found
// book" would repeat the beat Ezra 6 already carries), Ezra 5 (the request for
// the search; Ezra 6 carries the search and the finding in two verses), and
// Numbers 1 (a census is a count, not a record that outlives its system).
const OURS = ['Psalms 102', 'Ezra 2', 'Deuteronomy 31', 'Job 19', 'Ezra 6', '1 Chronicles 9'];
const DECLINED_AS_SPENT = ['Jeremiah 32', 'Malachi 3', 'Esther 6', 'Nehemiah 7', 'Habakkuk 2', 'Isaiah 30'];

// Other people's stories and the sponsor copy from that same edition. None is
// germane, none is taught, and none may appear anywhere in the module. Written
// as word-boundary matchers so ordinary English cannot trip the gate.
const NOT_OURS = [
  // the three marked sponsor placements
  'Span', 'span.app', 'Doroni', 'H1-X', 'Microsoft', 'Azure',
  'Frontier Accelerate', 'Marketplace Premium', 'DevFinOps', 'Morgan Stanley',
  // other people's items in the same issue
  'OpenAI', 'ChatGPT', 'Codex', 'DevDay', 'Ultrafast', 'Apple', 'Ternus',
  'NASA', 'SpaceX', 'Dragon', 'Falcon', 'Joby', 'Cessna', 'Wichita',
  'Lemma', 'Meta', 'Muse', 'Reddit', 'Firefox', 'Mozilla', 'Chrome',
  'Google', 'Trump', 'TLDR', 'Dan Ni', 'Flanders', 'Riipen', 'SmartBrief',
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notOursRe = (name) => new RegExp(`\\b${escapeRe(name)}\\b`);

// A figure a reader could be misled by: a currency symbol, a percentage, or a
// number wearing a magnitude word. Dates and verse references are numbers and
// are not figures, which is why this is written as the three shapes a CLAIM
// takes rather than as "no digits".
const FIGURE_SHAPES = [
  /[$£€]/,
  /\d\s*%|\bper cent\b|\bpercent\b/i,
  /\b\d[\d,.]*\s*(?:million|billion|trillion|thousand)\b/i,
];

// BY ORDINAL, NOT BY POSITION (2026-10-29). These three cases pinned the
// COURSE's size — `toHaveLength(57)`, ids `1..57`, `weeks === 57`, `'57 weekly
// sessions'` — and asserted sov57 was the LAST module. All of that was true the
// day it was written and false the moment sov58 landed: CI shard 2/4 failed on
// #2498 with `expected 58 to be 57` and a diff whose only entry was `+ 58`.
//
// Nothing about sov57 had changed. The gate was measuring the course by
// POSITION, which is P62 exactly — decide by exact identity, never by position.
// A lesson's own gate must assert what is true of THAT LESSON, or every lesson
// in the course breaks its predecessor on the day it ships, forever.
//
// So: sov57 is the fifty-seventh module, at index 56, whatever comes after it;
// the course's ids are a gapless 1..N with N DERIVED from the course; and the
// meta still follows its own count, which is the real DR-0677 property the
// typed `57` was only standing in for.
describe('sov57 is in the course, fifty-seventh, and whole', () => {
  const ORDINAL = 57;

  it('exists exactly once, as the fifty-seventh lesson, with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.length).toBeGreaterThanOrEqual(ORDINAL);
    expect(
      SOVEREIGN_AI_MODULES[ORDINAL - 1].id,
      'sov57 must sit at the fifty-seventh position, whatever follows it',
    ).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course ids run sov1 upward with no gap and no repeat, counting the course itself', () => {
    const numbers = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: SOVEREIGN_AI_MODULES.length }, (_, i) => i + 1));
    expect(numbers, 'and 57 is one of them').toContain(ORDINAL);
  });

  it('the course meta follows its own module count rather than a hand-typed number', () => {
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(SOVEREIGN_AI_META.format).toContain(`${SOVEREIGN_AI_MODULES.length} weekly sessions`);
  });

  it('carries its build day from a real commit, not from the working tree', () => {
    const day = lessonCreatedDay('sovereign-ai', ID);
    expect(day).toBe('2026-10-29');
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
  });
});

describe('the anchors were chosen by counting, not by theme', () => {
  it('every anchor reference resolves in the corpus on disk', () => {
    const refs = anchorRefs(L);
    expect(refs.length).toBeGreaterThanOrEqual(9);
    for (const r of refs) expect(corpusText(r), `${r} does not resolve`).toBeTruthy();
  });

  it('every reference the lesson quotes is also named in the anchor', () => {
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

  it('NO chapter of this spine is an anchor of any OTHER lesson in this course', () => {
    const taken = new Set();
    for (const m of SOVEREIGN_AI_MODULES) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    const clashes = OURS.filter((c) => taken.has(c));
    expect(clashes, `another week already stands on: ${clashes.join(', ')}`).toEqual([]);
  });

  it('and the obvious record-keeping chapters really ARE spent, so the detour was measured', () => {
    const taken = new Set();
    for (const m of SOVEREIGN_AI_MODULES) {
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    // If one of these ever frees up, this test is the place that says so.
    for (const spent of DECLINED_AS_SPENT) {
      expect(taken.has(spent), `${spent} was declined as spent but is not anchored anywhere`).toBe(true);
    }
  });
});

describe('every verse is the corpus on disk', () => {
  it('each pinned span of the spine is verbatim and present in the module', () => {
    const whole = EVERY_STRING.join('\n');
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).toBeTruthy();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus text`).toBe(true);
      expect(whole.includes(span), `${ref} is pinned but the module does not quote it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty sweep cannot pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(50);
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
    // Deuteronomy 31:26 carries "the LORD your God" in the corpus; we quote a
    // span that stops before it, and the corpus itself is left untouched.
    expect(corpusText('Deuteronomy 31:26')).toContain('the LORD your God');
    // and the psalm we quote ends on "the LORD" -- kept exactly as written
    expect(corpusText('Psalms 102:18')).toContain('shall praise the LORD');
  });

  it('no generic God, GOD or LORD in our AUTHORED voice (quotations stripped)', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      const ours = String(text).replace(/"[^"]*"/g, ' ');
      expect(ours, `${place} names the generic God in our own voice`).not.toMatch(/\b(God|GOD|LORD)\b/);
    }
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(text, `${place} never says Yahweh`).toMatch(/\bYahweh\b/);
    }
  });

  it('never capitalises the adversary anywhere in the module', () => {
    for (const t of EVERY_STRING) {
      expect(t).not.toMatch(/\b(Satan|Lucifer|Devil|Adversary|Accuser|Deceiver|Baal)\b/);
    }
  });

  it('confesses Jesus as the Lamb and the Eternal Son in every place', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(text, `${place} does not confess Him`).toMatch(/Jesus[^.]{0,60}Lamb of Yahweh/);
      expect(text, `${place} does not name Him the Eternal Son`).toContain('Eternal Son');
    }
  });
});

describe('the source is named for what it is, not dressed as an argument', () => {
  it('the lesson says the issue is a newsletter and that ONE item carried the thesis', () => {
    expect(L.lesson).toContain('one issue of a daily technology newsletter');
    expect(L.lesson).toContain('ONE item in the issue carries an actual thesis');
    expect(L.lesson).toContain('four sentences long');
    expect(L.lesson).toContain('Data is the application');
  });

  it('and it says the rest of the issue carried no teaching, rather than implying it did', () => {
    expect(L.lesson).toContain('Most of the items carry no teaching at all');
  });

  it('WHAT WE DID NOT CHECK is on the lesson AND all four bands, each pin unique to its place', () => {
    const pins = {
      adult: 'we did not read the article itself',
      child: 'We never got to read the whole writing it came from',
      youth: 'Nobody here opened the article that sat behind the link',
      teen: 'The article behind that one link was never opened by anybody here',
      senior: 'Not one of us opened the article that stood behind the link',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('every place says nobody telephoned the writer or the publisher, uniquely', () => {
    const pins = {
      adult: 'We did not telephone the writer, the newsletter, or any company the issue names',
      child: 'We did not call anybody up to ask them about it',
      youth: 'We never rang the writer or the newsletter to check a line of it',
      teen: 'No one here telephoned the writer or the newsletter to confirm a word of it',
      senior: 'Neither the writer nor the newsletter was ever telephoned by anyone here',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('and every place reports the fetch failure as MEASURED, not as a polite phrase', () => {
    const pins = {
      adult: 'could not resolve the host at all',
      child: 'It could not even find the place where it lives',
      youth: 'could not even find the host',
      teen: 'The hostname would not resolve',
      senior: 'the hostname failed to resolve',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
    expect(L.lesson).toContain('a measured failure and not a figure of speech');
  });

  it('SAYS THE THREAD WAS ALREADY BUILT ONCE, on the lesson and all four bands, each pin unique', () => {
    // The brief for this lesson asserted the thread was "the oldest of his
    // forwarded teachings still unbuilt". That was FALSE -- the sweep reports it
    // SHIPPED as sov51 / DR-1246 on 2026-09-30 -- and the reader is told so here
    // rather than only in the ledger. sov51's own convention is to name the
    // weeks it does not re-teach; this returns the courtesy.
    const pins = {
      adult: 'This digest has ALREADY produced a week of this course.',
      child: 'This same email already gave us a lesson once.',
      youth: 'AND ONE MORE THING ABOUT THE SOURCE, because it was nearly got wrong.',
      teen: 'AND THE SOURCE HAS ALREADY BEEN BUILT ONCE, which was nearly got wrong here',
      senior: 'AND THE SOURCE HAS ALREADY BEEN BUILT ONCE, which this lesson nearly failed to say.',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('and every place sends the reader to that week by name, not by record id', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} does not name the earlier week`).toContain('week fifty-one');
      expect(TEXTS[place], `${place} does not name its title`).toContain('the office that does not transfer');
      // case-insensitive: the adult lesson shouts it (SECOND teaching), the
      // child band says it plainly (second lesson).
      expect(TEXTS[place], `${place} does not say it is the second`).toMatch(/second (?:teaching|lesson)/i);
      // A reader-facing surface never prints an internal record id. recitedRecords
      // enforces this and CAUGHT a first draft of these very paragraphs, which
      // printed DR-1246 in four of the five places.
      expect(TEXTS[place], `${place} prints a record id`).not.toMatch(/DR-\d{4}/);
    }
    expect(recitedRecords(L)).toEqual([]);
  });

  it('refuses every advertiser and every other story a foothold anywhere in the module', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      for (const name of NOT_OURS) if (notOursRe(name).test(t)) found.push(name);
    }
    expect([...new Set(found)], `advertising or another story reached the teaching: ${found.join(', ')}`).toEqual([]);
  });

  it('STAKES NO FIGURE, and that claim is enforced rather than asserted', () => {
    expect(L.lesson).toContain('this lesson stakes no figure');
    const offenders = [];
    for (const place of PLACES) {
      for (const shape of FIGURE_SHAPES) {
        const m = shape.exec(TEXTS[place]);
        if (m) offenders.push(`${place}: ${m[0]}`);
      }
    }
    expect(offenders, `a figure reached a reader text: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('the Word is quoted AND reasoned, not pasted onto a headline (DR-0281)', () => {
  it('takes the psalm\u2019s command apart clause by clause and lands on its purpose', () => {
    expect(L.lesson).toContain('THIS SHALL BE WRITTEN');
    expect(L.lesson).toContain('FOR THE GENERATION TO COME');
    expect(L.lesson).toContain('They do not exist yet');
    expect(L.lesson).toContain('The end of the writing is praise, not administration');
  });

  it('reads what Ezra 2:62 does NOT say before giving the consequence', () => {
    expect(L.lesson).toContain('It does not say they lied');
    expect(L.lesson).toContain('the word for men who believed their own claim');
    expect(L.lesson).toContain('The office went');
  });

  it('gives the four parts of the hold in Ezra 2:63, including the admission', () => {
    expect(L.lesson).toContain('TILL');
    expect(L.lesson).toContain('named condition for release');
    expect(L.lesson).toContain('we do not know, so we will not act as though we do');
    expect(L.lesson).toContain('an invented record is worse than an absent one');
  });

  it('presses the word AGAINST in Deuteronomy 31:26 rather than only citing it', () => {
    expect(L.lesson).toContain('AGAINST');
    expect(L.lesson).toContain('advertising with dates on it');
  });

  it('climbs Job’s ladder in order and names what he was really asking for', () => {
    expect(L.lesson).toContain('DURABILITY');
    expect(L.lesson).toMatch(/Speech[^.]*\.\s*Writing/);
  });

  it('counts what had changed around the roll in Ezra 6, which is the whole point', () => {
    expect(L.lesson).toContain('A different king sat on the throne');
    expect(L.lesson).toContain('The capital had moved');
    expect(L.lesson).toContain('house OF THE ROLLS');
  });

  it('refuses to sell a register as a charm, from 1 Chronicles 9:1', () => {
    expect(L.lesson).toContain('A kept record is not a charm');
    expect(L.lesson).toContain('carry identity THROUGH the judgement');
  });

  it('states the asymmetry PLAINLY rather than hedging it both ways (DR-0100)', () => {
    expect(L.lesson).toContain('The thesis is true, and this house says so plainly');
    expect(L.lesson).toContain('It is a lopsided pair');
    expect(L.lesson).toContain('pretending they are equal is not fairness');
  });

  it('names the one genuinely open thing NARROWLY, and does not smear it (DR-0100)', () => {
    expect(L.lesson).toContain('one thing is honestly open, narrowly');
    expect(L.lesson).toContain('READABLE, as distinct from stored');
    expect(L.lesson).toContain('That uncertainty is about the formats, not about the practice');
    expect(L.lesson).toContain('The practice is not in doubt');
  });

  it('says where this house is still thin instead of describing only other people', () => {
    expect(L.lesson).toContain('genuinely thin on the first');
    expect(L.lesson).toContain('does not exist as a single page');
  });

  it('every band carries the thesis, the cost and the remedy in its own words', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} loses the thesis`).toMatch(/start (?:again|over)|begin again|restarts/i);
      expect(L.levels[b], `${b} loses the hold`).toMatch(/\bTILL\b/);
      expect(L.levels[b], `${b} loses the AGAINST`).toContain('AGAINST');
      expect(L.levels[b], `${b} loses the psalm's command`).toContain('GENERATION TO COME');
    }
  });
});

describe('two stories, both invented, neither told as somebody’s life', () => {
  it('carries two stories and quotes the Word inside its own text', () => {
    expect(storyCount(L)).toBe(2);
    expect(quotesTheWord(L)).toBe(true);
  });

  it('both are PARABLES, so no page claims a real person lived this', () => {
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    for (const s of L.stories) {
      expect(s.kind, 'a newsletter-built lesson has nobody’s life in it').not.toBe('testimony');
      expect(s.source, 'a parable must not borrow a person’s name to look true').toBeUndefined();
      expect(String(s.body).length).toBeGreaterThan(600);
    }
    expect(L.stories.map((s) => s.title)).toEqual([
      'The ledger in the bottom drawer',
      'The sick book and the three better versions',
    ]);
  });

  it('and each story carries the lesson rather than decorating it', () => {
    expect(L.stories[0].body).toContain('belief is not an entry');
    expect(L.stories[1].body).toContain('there was nothing that could be withdrawn from it');
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  it('passes the whole shared four-band ladder with nothing waived', () => {
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('each band is a real share of the adult lesson', () => {
    const m = measureFullness(L);
    expect(shortBands(m)).toEqual([]);
    for (const b of BANDS) expect(m.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside the new-lesson ceiling', () => {
    const m = measureLesson(L);
    const g = Object.fromEntries(BANDS.map((b) => [b, m.bands[b].authored]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(isInverted(m)).toBe(false);
  });

  it('no band is a reworded copy of another, measured against both ceilings', () => {
    expect(duplicatedBands(measureDifferentiation(L), DIFF_CEILING)).toEqual([]);
  });

  it('each band names its own lesson in its opening', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('each band is written from its OWN material, proven by an image no other band uses', () => {
    const own = {
      child: 'a toy you built out of blocks',
      youth: 'Think about your phone',
      teen: 'A test plane flew with nobody in it',
      senior: 'an uncrewed demonstration flight',
    };
    for (const [place, phrase] of Object.entries(own)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(phrase));
      expect(carriers, `"${phrase}" should be ${place}'s alone`).toEqual([place]);
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

  it('the lesson and all four bands send the reader all three ways', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });
});

// ===========================================================================
// PROVEN-TO-CATCH (DR-0076 §3). Each case below was applied to the REAL shipped
// strings, run, seen to fail, and restored. A check nobody has watched go red
// is a claim, not a gate.
// ===========================================================================
describe('PROVEN-TO-CATCH: each check was watched to fail on the live text', () => {
  it('a quotation that drifted by one word is caught', () => {
    const bent = 'He wrote it. "These sought their register among those that were reckoned by genealogy, but they were not there" (Ezra 2:62).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(verbatimFaults(['He wrote it. "These sought their register among those that were reckoned by genealogy, but they were not found" (Ezra 2:62).'])).toEqual([]);
  });

  it('a verbatim span hung on the WRONG reference is caught', () => {
    const bent = 'He wrote it. "graven with an iron pen and lead in the rock for ever" (Job 19:23).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(verbatimFaults(['He wrote it. "graven with an iron pen and lead in the rock for ever" (Job 19:24).'])).toEqual([]);
  });

  it('substituting Yahweh into a quotation is caught', () => {
    const bent = 'He said "put it in the side of the ark of the covenant of Yahweh your God" (Deuteronomy 31:26).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    const planted = quotedPairs(bent).some((p) => /Yahweh/.test(p.inside));
    expect(planted).toBe(true);
    for (const t of EVERY_STRING) for (const { inside } of quotedPairs(t)) expect(/Yahweh/.test(inside)).toBe(false);
  });

  it('planting a currency figure in a band is caught', () => {
    const bent = `${L.levels.youth} The projection was $2 billion.`;
    const hits = FIGURE_SHAPES.filter((s) => s.test(bent));
    expect(hits.length, 'both the currency and the magnitude shape should fire').toBeGreaterThanOrEqual(2);
    for (const s of FIGURE_SHAPES) expect(s.test(L.levels.youth)).toBe(false);
  });

  it('planting a percentage is caught too, which a currency check alone would miss', () => {
    expect(FIGURE_SHAPES.some((s) => s.test('Only 37% of them could show the register.'))).toBe(true);
    expect(FIGURE_SHAPES[0].test('Only 37% of them could show the register.'), 'the currency shape alone would miss it').toBe(false);
    expect(FIGURE_SHAPES.some((s) => s.test('Only a third of them could show the register.'))).toBe(false);
  });

  it('an advertiser name reaching the teaching is caught, and ordinary English is not', () => {
    const bent = `${L.lesson} The tooling was measured by Span.`;
    expect(NOT_OURS.filter((n) => notOursRe(n).test(bent))).toEqual(['Span']);
    expect(NOT_OURS.filter((n) => notOursRe(n).test(L.lesson))).toEqual([]);
    // the word-boundary form is why these do not fire on real prose
    for (const innocent of ['The register spans four reigns.', 'a metal box', 'the chrome handle']) {
      expect(NOT_OURS.filter((n) => notOursRe(n).test(innocent)), innocent).toEqual([]);
    }
  });

  it('deleting the disclosure from ONE band is caught, and by that band’s name', () => {
    const pin = 'The article behind that one link was never opened by anybody here';
    expect(L.levels.teen).toContain(pin);
    // the pin is unique, so no other band can cover for the deletion
    expect(PLACES.filter((p) => TEXTS[p].includes(pin))).toEqual(['teen']);
    const stripped = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(`${pin}.`, '') } };
    const texts = { adult: stripped.lesson, ...Object.fromEntries(BANDS.map((b) => [b, stripped.levels[b]])) };
    const carriers = Object.keys(texts).filter((p) => texts[p].includes(pin));
    expect(carriers, 'the teen disclosure was deleted and nothing noticed').toEqual([]);
  });

  it('and deleting the telephone disclosure from the SENIOR band is caught the same way', () => {
    const pin = 'Neither the writer nor the newsletter was ever telephoned by anyone here';
    expect(PLACES.filter((p) => TEXTS[p].includes(pin))).toEqual(['senior']);
    const stripped = L.levels.senior.replace(`${pin}.`, '');
    expect(stripped.includes(pin), 'the senior disclosure was deleted and nothing noticed').toBe(false);
  });

  it('deleting the ALREADY-BUILT provenance from one band is caught by that band’s name', () => {
    const pin = 'This same email already gave us a lesson once.';
    expect(PLACES.filter((p) => TEXTS[p].includes(pin))).toEqual(['child']);
    const stripped = L.levels.child.replace(pin, '');
    expect(stripped.includes(pin), 'the child provenance was deleted and nothing noticed').toBe(false);
    // and no sibling band can cover for it, which is what makes the pin a witness
    for (const p of PLACES.filter((x) => x !== 'child')) expect(TEXTS[p].includes(pin)).toBe(false);
  });

  it('printing the record id in reader prose is caught, which a first draft did', () => {
    const bent = { ...L, levels: { ...L.levels, teen: `${L.levels.teen} See DR-1246 for that week.` } };
    expect(recitedRecords(bent).map((r) => r.where)).toContain('levels.teen');
    expect(recitedRecords(L)).toEqual([]);
  });

  it('a band shortened to a summary is caught by the share floor', () => {
    const stub = L.levels.teen.split('. ').slice(0, 4).join('. ');
    const broken = { ...L, levels: { ...L.levels, teen: stub } };
    expect(shortBands(measureFullness(broken))).toContain('teen');
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('a band copied from its sibling is caught by the near-copy line', () => {
    const broken = { ...L, levels: { ...L.levels, youth: L.levels.teen } };
    expect(fourBandFaults(broken).join(' ')).toMatch(/near copy/);
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('a band that loses its title opening is caught', () => {
    const headline = L.levels.child.split('\n\n')[0];
    expect(headline).toContain('THE CODE CAN BE REBUILT');
    const broken = { ...L, levels: { ...L.levels, child: L.levels.child.replace(headline, 'Here is an idea.') } };
    expect(unnamedBands(broken)).toEqual(['child']);
    expect(unnamedBands(L)).toEqual([]);
  });

  it('a story relabelled as a testimony is caught', () => {
    const broken = { ...L, stories: [{ ...L.stories[0], kind: 'testimony' }, L.stories[1]] };
    expect(broken.stories.map((s) => s.kind)).not.toEqual(['parable', 'parable']);
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
  });

  it('an anchor chapter that collides with another week would be caught', () => {
    // Nehemiah 7 is the direct parallel to Ezra 2 and is already anchored
    // elsewhere in this course; adopting it is exactly the fault the counting
    // check exists to refuse.
    const taken = new Set();
    for (const m of SOVEREIGN_AI_MODULES) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    expect(['Nehemiah 7'].filter((c) => taken.has(c))).toEqual(['Nehemiah 7']);
    expect(OURS.filter((c) => taken.has(c))).toEqual([]);
  });
});
