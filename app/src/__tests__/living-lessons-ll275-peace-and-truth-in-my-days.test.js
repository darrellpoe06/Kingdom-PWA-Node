// @vitest-environment node
// =============================================================================
// L275 — Peace and Truth in My Days: the deferred correction, and who carries it
// =============================================================================
// Captured by the Gmail-lesson-intake Way from thread 1a15947c07008b99, one
// message, forwarded 2026-10-20 12:27:12 UTC from dpoe@illinois.edu to
// darrellpoe06@gmail.com, subject Fw: Voter Fraud Arrests, OpenAI Spy, and Leap
// Hours — a 1440 Daily Digest of 2026-10-20 — with one word typed above the
// forwarded header in his own hand: Lessons. Built and landing 2026-11-05
// (DR-1315).
//
// WHAT THIS GATE EXISTS TO HOLD, and what each check is paying for.
//  (1) THREE REFUSALS, EACH MEASURED. The digest's three lead items are all
//      already-built ground and all three were refused. The voting-arrests item
//      is ll274's own second half (a verdict issued at no cost; the cause which
//      I knew not I searched out) with the equal-weights reading under it built
//      eight ways in this course and the mail-in reading built as World Issues
//      13. The espionage item is sov46 (Hezekiah's open treasure house, the
//      sight that belongs to Yahweh alone) with sov11, sov31 and sov51 beside
//      it. The timekeeping item's OBVIOUS reading — who owns time, a day Yahweh
//      appointed, a season and a time to every purpose — is ll243, ll213,
//      ll257, ll70, ll99 and ll150. The refusals are pinned by measurement
//      below, not by prose.
//  (2) NO SIDE, AND THE ABSENCE IS A MACHINE CHECK. The digest's lead items are
//      charged; a lesson that names anybody in them hands the reader a team.
//      A forbidden-names sweep runs over EVERY string of the module and is
//      proven-to-catch twice.
//  (3) THE THREE TIERS HELD APART (DR-0100) in all five reader texts, and the
//      documented half stated FLAT rather than hedged.
//  (4) NOT STAKING THE TEACHING ON A FIGURE. The publisher's page refused
//      twice; the exact refusals are quoted, and no reader text states a
//      dollar figure, a percentage or a magnitude word.
//  (5) SHARED GROUND IS NAMED, NOT AVOIDED. Darrell, 2026-11-05, correcting
//      the instruction this build started under: "there would be overlapping at
//      times however not the exact same lesson... How else would they connect?!"
//      and "How can we have only reference one scripture ever?! Doesn't make
//      any sense!" So a verse is NEVER spent. DR-0610 is decided by WHERE A
//      LESSON LANDS — its point, its message, its in-app action — never by the
//      Scripture it stands on. This build had dropped FOUR readings for being
//      "spent" and RESTORED all four on the corrected test: Ecclesiastes 8:11
//      (sov62 holds it, landing on what a tool learns from a reward; this
//      lesson lands on what a man learns from a consequence that never comes),
//      Haggai 1:2 (ll178 and ll258's ground, landing on a renamed need and on
//      houses panelled first; this lesson takes only the clause about timing),
//      Isaiah 30:8 (ll127 and ll270, landing on how the Word itself was
//      committed to writing; here it is the duty owed to whoever inherits an
//      unfinished job) and 2 Chronicles 32:26 (ll160, landing on pride and what
//      humbling turns; here it is the fourth deferral, and the one written into
//      the record). The census is still run, as a MEASUREMENT: what it may no
//      longer do is veto a verse.
//  (6) AND THE READER TEXTS BELONG TO THE READER. Darrell, 2026-11-05, a second
//      correction the same day: "a user may never read everything inside so
//      each lesson is a courtroom of comprehension from Yahweh before we get
//      there... we can't assume.... just make them good!" So every lesson
//      stands ALONE and WHOLE: it teaches its own foundation in full, with the
//      Scripture that foundation needs, and assumes the reader has opened no
//      other lesson. Under the FIRST correction this build had written "this
//      course already teaches that verse for X" into all five reader texts;
//      that is bookkeeping for a reviewer and noise to a reader who will never
//      open the other lesson. ALL OF IT WAS REMOVED from the child, youth,
//      teen, adult and senior texts, and from the big idea and the anchor
//      theme, and moved into the decision record. Two checks below hold it: no
//      reader text may point at another lesson (proven to catch), and each
//      restored foundation must be TAUGHT in every band rather than cited.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { censusLesson } from '../lib/library-census.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish } from '../../../scripts/american-spelling.mjs';

const ID = 'll275-peace-and-truth-in-my-days';
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
/** The corpus text a reference names, or null. */
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
/** Referenced spans that are not what the corpus holds. Contiguous only: no elision accepted. */
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

/** The book names this lesson's anchor actually uses, longest first. */
const ANCHOR_BOOKS = [...new Set(String((L && L.anchor && L.anchor.ref) || '').split(';')
  .map((r) => /^\s*((?:[1-3]\s)?[A-Za-z]+)\s+\d+:/.exec(r)).filter(Boolean).map((m) => m[1]))]
  .sort((a, b) => b.length - a.length);

/**
 * Figures stated in OUR voice that come from the SOURCE rather than from the
 * machinery of the lesson. The matcher is SCOPED rather than hollowed: a
 * Scripture reference lives in our-voice prose by design (DR-0734 requires the
 * anchor to name every verse and the lesson to name every anchor), so every
 * reference built from this lesson's OWN anchor books is removed first, along
 * with the forwarded mail's ISO date and the two quoted error codes. Whatever
 * numeral survives is a figure from the news item, and this lesson rests on
 * none, because the reports disagreed with each other on every count.
 */
export function figuresFromSource(text) {
  let scrubbed = ourVoice(text);
  for (const book of ANCHOR_BOOKS) {
    scrubbed = scrubbed.replace(new RegExp(`\\b${book}\\s+\\d+(?::\\d+(?:-\\d+)?)?`, 'g'), ' ');
  }
  scrubbed = scrubbed
    .replace(/\([^)]*\d[^)]*\)/g, ' ')
    .replace(/\b2026-10-20\b/g, ' ')
    .replace(/\bresponse 403\b|\bcurl: \(56\)/g, ' ')
    .replace(/\b403\b/g, ' ')
    .replace(/\bautumn of 2026\b/g, ' ');
  return scrubbed.match(/\b\d[\d,.]*\b/g) || [];
}

const TITLE_LINE = 'PEACE AND TRUTH IN MY DAYS — THE CORRECTION THEY STOPPED MAKING, THE WALL THAT SWELLS BEFORE IT BREAKS, AND THE ONE SHADOW YAHWEH EVER MOVED.';

// THE CHAPTERS THIS LESSON STANDS ON, SPLIT BY WHAT WAS MEASURED RATHER THAN BY
// WHAT IS ALLOWED. Nine are untouched by any other lesson of this course at
// anchor level; the rest are SHARED, which is the Word being the common
// foundation rather than a defect (Darrell 2026-11-05). The sharing ones carry
// the other lesson's verses so the overlap is machine-readable.
const UNSHARED_CHAPTERS = [
  'Amos 6', 'Ezekiel 12', 'Exodus 8', '2 Kings 20', 'Isaiah 39',
  '1 Kings 21', 'Zephaniah 1', 'Jeremiah 48', 'Psalms 50', '2 Chronicles 32',
];
const SHARED_CHAPTERS = {
  'Isaiah 38': ['Isaiah 38:19'],                    // ll205
  '2 Kings 22': ['2 Kings 22:14', '2 Kings 22:15'], // ll228
  '2 Chronicles 34': ['2 Chronicles 34:3'],         // ll224
  'Isaiah 56': ['Isaiah 56:5'],                     // ll231
  'Exodus 9': ['Exodus 9:16', 'Exodus 9:19'],       // ll259, ll238
  'Isaiah 22': ['Isaiah 22:22'],                    // ll191
  'Ecclesiastes 8': ['Ecclesiastes 8:17'],          // ll213
  'Haggai 1': ['Haggai 1:4', 'Haggai 1:9'],         // ll178, ll258, ll171, ll270
  'Isaiah 30': ['Isaiah 30:15', 'Isaiah 30:18', 'Isaiah 30:21'],
  'Jeremiah 8': ['Jeremiah 8:7', 'Jeremiah 8:11', 'Jeremiah 8:22'],
  'Romans 2': ['Romans 2:11', 'Romans 2:13'],
  'Matthew 5': ['Matthew 5:48', 'Matthew 5:44', 'Matthew 5:37'],
  '2 Peter 3': ['2 Peter 3:9', '2 Peter 3:16'],
  'Hebrews 9': ['Hebrews 9:22', 'Hebrews 9:27'],
};
// THE FOUR READINGS RESTORED BY DARRELL'S CORRECTION, each with the ground it
// shares and the DIFFERENT PLACE the neighbouring lesson lands. The reader
// texts must name each one; the check below asserts that, which is the whole
// substance of "name the neighbour and state the difference".
const RESTORED = [
  // `teaches` is the POINT of the verse in the lesson's own words, asserted in
  // every band. It is not a cross-reference; it is proof the foundation is
  // taught HERE rather than deferred to a lesson the reader may never open.
  { verse: 'Ecclesiastes 8:11', teaches: /heart of the sons of men|what a PERSON becomes|inside a PERSON|what a MAN becomes/ },
  { verse: 'Haggai 1:2', teaches: /oldest excuse/i },
  { verse: 'Isaiah 30:8', teaches: /planned around|got ready for|note it in a book|write it down/i },
  { verse: '2 Chronicles 32:26', teaches: /in the BOOK|written down, in the book|record of the reign|written into the record|all written down/i },
];
const CONFESSION_CHAPTERS = ['John 1', 'John 3', 'Hebrews 1'];

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one was fetched from the corpus on disk before it was written, and
// Ezekiel 12:28 is here because MEMORY HAD IT WRONG: the clause is "prolonged
// any more", not "deferred". The corpus corrected it before a line was written.
const SPINE = [
  ['1 Kings 21:29', 'I will not bring the evil in his days: but in his son’s days will I bring the evil upon his house'],
  ['Exodus 8:9', 'Glory over me: when shall I intreat for thee'],
  ['Exodus 8:10', 'And he said, To morrow.'],
  ['Exodus 9:5', 'And the LORD appointed a set time'],
  ['Amos 6:3', 'Ye that put far away the evil day, and cause the seat of violence to come near'],
  ['Ezekiel 12:27', 'The vision that he seeth is for many days to come, and he prophesieth of the times that are far off'],
  ['Ezekiel 12:28', 'There shall none of my words be prolonged any more'],
  ['Isaiah 56:12', 'to morrow shall be as this day, and much more abundant'],
  ['Isaiah 22:13', 'let us eat and drink; for to morrow we shall die'],
  ['Zephaniah 1:12', 'punish the men that are settled on their lees'],
  ['Jeremiah 48:11', 'hath not been emptied from vessel to vessel'],
  ['2 Peter 3:4', 'all things continue as they were from the beginning of the creation'],
  ['Psalms 50:21', 'I kept silence'],
  ['Psalms 50:21', 'but I will reprove thee, and set them in order before thine eyes'],
  ['Isaiah 30:13', 'swelling out in a high wall, whose breaking cometh suddenly at an instant'],
  ['Isaiah 30:14', 'there shall not be found in the bursting of it a sherd to take fire from the hearth'],
  ['Romans 2:5', 'treasurest up unto thyself wrath'],
  ['2 Kings 20:9', 'shall the shadow go forward ten degrees, or go back ten degrees?'],
  ['2 Kings 20:10', 'nay, but let the shadow return backward ten degrees'],
  ['2 Kings 20:11', 'he brought the shadow ten degrees backward, by which it had gone down in the dial of Ahaz'],
  ['Isaiah 38:8', 'So the sun returned ten degrees, by which degrees it was gone down'],
  ['Isaiah 39:7', 'And of thy sons that shall issue from thee, which thou shalt beget, shall they take away'],
  ['Isaiah 39:8', 'For there shall be peace and truth in my days'],
  ['2 Kings 22:19', 'Because thine heart was tender'],
  ['2 Kings 22:20', 'thine eyes shall not see all the evil which I will bring upon this place'],
  ['2 Chronicles 34:28', 'neither shall thine eyes see all the evil that I will bring upon this place'],
  ['Matthew 5:25', 'Agree with thine adversary quickly, whiles thou art in the way with him'],
  ['Jeremiah 8:20', 'The harvest is past, the summer is ended, and we are not saved'],
  ['Hebrews 9:26', 'now once in the end of the world hath he appeared to put away sin by the sacrifice of himself'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
];

// NAMES THE MODULE MAY NOT CONTAIN ANYWHERE. Every one of these is in the
// forwarded digest; not one belongs in a lesson about the Word's standard.
const FORBIDDEN_NAMES = [
  'Trump', 'Republican', 'Democrat', 'Democrats', 'GOP',
  'California', 'Justice Department', 'DOJ', 'Census Bureau',
  'Saudi', 'OpenAI', 'Alfozan', 'HUMAIN', 'Houthi',
  'Israeli', 'Israel police', 'Palestine', 'West Bank', 'Washington Post',
  'Netflix', 'Dan Lin', 'Jon Stewart', 'Amanpour', 'CNN', 'Paramount',
  'Musk', 'SpaceX', 'Anthropic', 'Apple', 'MacBook', 'Tesla', 'Meta',
  'Jalen', 'Hurts', 'Eagles', 'Tampa Bay', 'Milwaukee', 'Cleveland',
  'Ukraine', 'Helen Haines', 'Lille', 'Gaddafi', 'Hoover', 'Mickey Mantle',
  'Tom Petty', 'Terracotta', 'Hershey', 'Grub Street', 'Smithsonian',
  '1440', 'Guardian', 'Yellowstone', 'Amelia Earhart',
];
// THE PUBLISHER'S HOST IS THE ONE EXCEPTION, AND IT IS PINNED RATHER THAN WAVED
// THROUGH. DR-0108 requires a refused road to be quoted in the tool's own
// words, and the fetch tool's words name the host. Editing the host out of the
// error would be editing evidence. So the names sweep excludes the error string
// and a separate check asserts that EVERY occurrence of the host in the whole
// module is inside that error, and that no reader text credits the teaching to
// a named publisher. The matcher is scoped, not hollowed.
const FETCH_ERROR = 'Claude Code is unable to fetch from www.theguardian.com';
const CURL_ERROR = 'curl: (56) CONNECT tunnel failed, response 403';
const withoutFetchError = (t) => String(t).split(FETCH_ERROR).join(' ');

describe('L275 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 275 exactly once, and is contiguous on the course', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 275)).toEqual([275]);
    expect(numbers.includes(274), 'll274 should be the lesson before it').toBe(true);
    // NOT asserted: that 275 is the HIGHEST number. A sibling landing ll276
    // would turn this gate red for no reason, and a lesson gate may not claim
    // to be the last lesson.
  });

  it('carries its BUILD day, not the day it was sent', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-05');
  });

  // THE CHECK THAT COST PR #2531 A RED SHARD, RUN HERE BEFORE THE PUSH (DR-1312).
  // The library ratchet is the only gate in the house that asks whether a
  // lesson is FINISHED rather than whether it is right, and it was not in that
  // build's pre-push set. It is in this one.
  it('is WHOLE by the library census: every reading version and every component', () => {
    const c = censusLesson(L);
    expect(c.missingVersions).toEqual([]);
    expect(c.missingComponents).toEqual([]);
    expect(c.whole).toBe(true);
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

  it('carries a quiz whose answers are in range, and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBe(42);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = String(L.anchor.ref).split(';').map((s) => parse(s.trim())).filter(Boolean);
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref).filter(Boolean)));
    expect(quoted.size).toBeGreaterThan(25);
    const missing = [...quoted].filter((r) => { const p = parse(r); return !p || !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b); });
    expect(missing).toEqual([]);
  });

  it('every chapter it stands on is accounted for: ten unshared, fourteen shared, three confession', () => {
    const chapters = new Set(String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean)
      .map((r) => { const m = /^(.+?)\s+(\d+):/.exec(r); return m && `${m[1]} ${m[2]}`; }).filter(Boolean));
    const accounted = [...UNSHARED_CHAPTERS, ...Object.keys(SHARED_CHAPTERS), ...CONFESSION_CHAPTERS];
    expect([...chapters].filter((c) => !accounted.includes(c))).toEqual([]);
    expect(chapters.size).toBe(accounted.length);
    expect(UNSHARED_CHAPTERS).toHaveLength(10);
    expect(Object.keys(SHARED_CHAPTERS)).toHaveLength(14);
  });

  it('carries NO verse of 2 Kings 20:12-18 or Isaiah 39:2, which sov46 already teaches', () => {
    // MEASURED, not assumed. sov46 (the helper that must see everything) stands
    // on 2 Kings 20:12, 20:13, 20:15, 20:16, 20:17, 20:18 and Isaiah 39:2 for
    // Hezekiah's open treasure house. The sign on the dial (20:8-11) and the
    // reply about his sons (39:5-8) are a different passage and a different
    // teaching, so this lesson takes those and leaves the treasure house alone.
    for (const v of ['2 Kings 20:12', '2 Kings 20:13', '2 Kings 20:15', '2 Kings 20:16', '2 Kings 20:17', '2 Kings 20:18', 'Isaiah 39:2']) {
      for (const t of EVERY_STRING) expect(t, `${v} is spent in sov46`).not.toContain(v);
    }
    expect(L.lesson).toContain('(2 Kings 20:11)');
    expect(L.lesson).toContain('(Isaiah 39:8)');
  });

  it('CARRIES the four readings the spent-verse rule had dropped, in the lesson AND in every band', () => {
    // Darrell's first correction, applied and pinned. Each of these verses is
    // taught elsewhere in this catalog on different ground, and each is taught
    // HERE anyway, because the Word is the common foundation and a lesson that
    // needs a foundation teaches it. Dropping them was the defect.
    for (const { verse } of RESTORED) {
      expect(L.lesson, `${verse} must be IN the lesson`).toContain(`(${verse})`);
      expect(L.anchor.ref, `${verse} must be in the anchor`).toContain(verse);
      for (const b of BANDS) expect(L.levels[b], `${b}: ${verse}`).toContain(`(${verse})`);
    }
    expect(RESTORED).toHaveLength(4);
  });

  it('TEACHES EACH RESTORED FOUNDATION IN ITS OWN WORDS, in every band, so nothing is deferred elsewhere', () => {
    // The second correction's substance. A reader may open exactly one lesson.
    // So each restored verse is not merely cited here: its point is taught, in
    // every band, in that band's own register.
    for (const { verse, teaches } of RESTORED) {
      for (const k of PLACES) expect(TEXTS[k], `${k}: ${verse} is cited but not taught`).toMatch(teaches);
    }
  });

  it('AND NO READER TEXT POINTS AT ANOTHER LESSON: the reader texts belong to the reader', () => {
    const POINTERS = [
      /this course (already )?(teaches|stands on|uses)/i,
      /the course teaches/i,
      /another lesson/i,
      /taught elsewhere/i,
      /elsewhere in this (course|catalog)/i,
      /neighbo(u)?ring (lesson|teaching)/i,
      /\bll\d{2,3}\b/,
      /\bsov\d{1,2}\b/,
      /already taught in this/i,
    ];
    for (const k of PLACES) {
      expect(POINTERS.filter((re) => re.test(TEXTS[k])).map(String), `${k} points at another lesson`).toEqual([]);
    }
    expect(POINTERS.filter((re) => re.test(L.bigIdea)).map(String), 'bigIdea points at another lesson').toEqual([]);
    expect(POINTERS.filter((re) => re.test(L.anchor.theme)).map(String), 'anchor.theme points at another lesson').toEqual([]);
  });

  it('PROVEN TO CATCH: a cross-reference note planted in one band is found, and only that band', () => {
    const planted = `${L.levels.child} This course already teaches that verse somewhere else.`;
    const re = /this course (already )?(teaches|stands on|uses)/i;
    expect(re.test(planted)).toBe(true);
    const named = Object.entries({ ...TEXTS, child: planted }).filter(([, t]) => re.test(t)).map(([k]) => k);
    expect(named).toEqual(['child']);
  });

  it('and each restored verse really IS taught elsewhere, so the naming is not decoration', () => {
    const elsewhere = LIVING_LESSONS_MODULES.filter((m) => m.id !== ID).flatMap((m) => [...strings(m)]).join('\n');
    const libFile = (name) => readFileSync(join(process.cwd(), 'src', 'lib', name), 'utf8');
    expect(elsewhere, 'Isaiah 30:8 is taught in this course').toContain('Isaiah 30:8');
    expect(elsewhere, '2 Chronicles 32:26 is taught in this course').toContain('2 Chronicles 32:26');
    expect(libFile('sovereign-ai-class.js'), 'Ecclesiastes 8:11 is taught in Sovereign A.I.').toContain('Ecclesiastes 8:11');
    expect(libFile('maintenance-trades-course.js'), 'Haggai 1:2 is taught outside this course').toContain('Haggai 1:2');
  });
});

describe('the ground is measured both ways, and shared ground is named rather than avoided', () => {
  const chapterOf = (v) => String(v).replace(/:.*$/, '');
  const anchorChapters = () => {
    const out = new Set();
    for (const m of LIVING_LESSONS_MODULES) {
      if (m.id === ID) continue;
      for (const r of String((m.anchor && m.anchor.ref) || '').split(';')) {
        const t = r.trim(); if (!t) continue;
        const mm = /^(.+?)\s+(\d+):/.exec(t);
        if (mm) out.add(`${mm[1].trim()} ${mm[2]}`);
      }
    }
    return out;
  };
  const courseProse = () => {
    const out = [];
    for (const m of LIVING_LESSONS_MODULES) { if (m.id === ID) continue; out.push(...strings(m)); }
    return out.join('\n');
  };

  it('the department census is big enough that an empty set cannot fake a free-ground pass', () => {
    expect(anchorChapters().size).toBeGreaterThan(700);
    expect(courseProse().length).toBeGreaterThan(5_000_000);
  });

  it('the ten unshared chapters really are untouched by this course at anchor level', () => {
    const spent = anchorChapters();
    expect(UNSHARED_CHAPTERS.filter((c) => spent.has(c))).toEqual([]);
  });

  it('and the fourteen shared chapters really ARE shared at chapter level, so the list is not padding', () => {
    const spent = anchorChapters();
    expect(Object.keys(SHARED_CHAPTERS).filter((c) => !spent.has(c))).toEqual([]);
  });

  it('THE PROSE CENSUS IS RUN AS A MEASUREMENT, AND IT NO LONGER VETOES A VERSE', () => {
    // The check a per-course anchor census cannot make, and the one that cost
    // sov63 a finished lesson and ll274 a rewritten movement. It reads every
    // .js/.jsx/.json under lib — 900+ files — rather than this course alone,
    // because a free verse can still be a built TEACHING in another course.
    const LIB = join(process.cwd(), 'src', 'lib');
    const files = [];
    (function walk(d) {
      for (const name of readdirSync(d)) {
        const full = join(d, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(js|jsx|json)$/.test(name)) files.push(full);
      }
    }(LIB));
    expect(files.length).toBeGreaterThan(500);
    let corpus = '';
    for (const f of files) {
      if (f.endsWith(join('src', 'lib', 'living-lessons-class.js'))) continue;
      corpus += readFileSync(f, 'utf8');
    }
    expect(corpus.length).toBeGreaterThan(15_000_000);
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim())
      .filter((r) => !CONFESSION_CHAPTERS.includes(chapterOf(r)));
    expect(refs.length).toBeGreaterThan(30);
    const whole = `${corpus}\n${courseProse()}`;
    const shared = refs.filter((r) => whole.includes(r));
    // THE MEASUREMENT, pinned by its own shape rather than by a count that
    // would rot: exactly the four restored verses are shared at prose level,
    // and nothing else is. The old rule would have vetoed all four. The rule
    // now is that each must be NAMED with its neighbour's landing, which the
    // check above asserts.
    expect(shared.sort()).toEqual(['2 Chronicles 32:26', 'Ecclesiastes 8:11', 'Haggai 1:2', 'Isaiah 30:8'].sort());
    expect(shared.every((r) => RESTORED.some((x) => x.verse === r))).toBe(true);
  });

  it('THE CHECK THAT EARNED ITS PLACE: the two censuses genuinely disagree, which is why both are run', () => {
    // 2 Chronicles 32 reads FREE against every anchor.ref in this course and
    // 2 Chronicles 32:26 is quoted in ll160's own prose. An anchor-level census
    // alone cannot see that. Under Darrell's correction the disagreement is no
    // longer a reason to drop the verse — it is the reason the neighbour has to
    // be NAMED, and naming it is impossible without first knowing it is there.
    const spent = anchorChapters();
    expect(spent.has('2 Chronicles 32'), 'FREE at anchor level').toBe(false);
    expect(courseProse().includes('2 Chronicles 32:26'), 'BUILT in the course prose').toBe(true);
    expect(courseProse()).toContain('came not upon them in the days of Hezekiah');
    expect(courseProse().includes('Isaiah 30:8'), 'Isaiah 30:8 BUILT elsewhere in this course').toBe(true);
    // And BOTH reached this lesson, with their neighbours named.
    for (const v of ['2 Chronicles 32:26', 'Isaiah 30:8']) {
      expect(EVERY_STRING.join('\n').includes(v), `${v} must be IN this lesson now`).toBe(true);
    }
  });

  it('and the refused reading is refused by measurement: no just-weight verse of this course appears here', () => {
    // The equal-weights reading of the digest's charged items LANDS where eight
    // lessons of this course already land (ll97, ll98, ll111, ll134, ll144,
    // ll182, ll236, ll90) — on a just weight and one measure for every person.
    // That is the one thing DR-0610 still forbids, and it is refused on the
    // LANDING rather than on the Scripture: these verses are absent because
    // taking them would pull this lesson onto that message, not because any
    // verse is spent.
    const JUST_WEIGHT = ['Deuteronomy 25:13', 'Deuteronomy 25:15', 'Leviticus 19:36', 'Proverbs 11:1', 'Proverbs 20:10', 'Proverbs 20:23', 'Micah 6:11'];
    const prose = courseProse();
    expect(JUST_WEIGHT.filter((v) => prose.includes(v)).length, 'the just-weight ground really is built in this course').toBeGreaterThanOrEqual(4);
    for (const v of JUST_WEIGHT) expect(EVERY_STRING.join('\n')).not.toContain(v);
  });
});

describe('the Word is the authority, not a party (DR-0098)', () => {
  it('names no politician, party, company, publisher or accused person, in ANY string of the module', () => {
    const all = EVERY_STRING.map(withoutFetchError).join('\n');
    expect(FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/ /g, '\\s+')}\\b`, 'i').test(all))).toEqual([]);
  });

  it('and the publisher’s host appears ONLY inside the quoted fetch error, nowhere else', () => {
    const joined = EVERY_STRING.join('\n');
    const hits = (joined.match(/theguardian\.com/gi) || []).length;
    const inError = (joined.split(FETCH_ERROR).length - 1);
    expect(hits, 'every host occurrence must be one of the quoted errors').toBe(inError);
    expect(inError).toBeGreaterThan(0);
    for (const k of PLACES) expect(withoutFetchError(TEXTS[k]), `${k}`).not.toMatch(/\bGuardian\b|\b1440\b/i);
  });

  it('PROVEN TO CATCH: a planted name is refused, and scoping the error does not hide it', () => {
    const planted = `${L.levels.teen} The arrests were in California.`;
    expect(FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/ /g, '\\s+')}\\b`, 'i').test(withoutFetchError(planted))))
      .toEqual(['California']);
    // And a publisher credit planted OUTSIDE the error is still caught.
    const credited = `${L.levels.child} The story came from the Guardian.`;
    expect(/\bGuardian\b/.test(withoutFetchError(credited))).toBe(true);
  });

  it('says out loud in every reader text that it takes no side, and why', () => {
    for (const k of PLACES) expect(TEXTS[k], `${k}: refuses a side`).toMatch(/will not talk about any of those people|takes no side|names none of those people|not naming any of them/i);
    for (const k of PLACES) expect(TEXTS[k], `${k}: the reason`).toMatch(/does not change when the names change|needs no team/i);
  });

  it('refuses the three obvious readings by name, in the lesson’s own voice', () => {
    for (const k of ['adult', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: refuses who-owns-time`).toMatch(/not about who owns time/i);
      expect(TEXTS[k], `${k}: refuses a season and a time`).toMatch(/season and a time to every purpose/i);
      expect(TEXTS[k], `${k}: refuses just weights`).toMatch(/honest weights and a just measure/i);
    }
  });

  it('teaches the proposition it says it will: a correction, where it accrues, and who carries it', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: the correction`).toMatch(/correction|fix\b/i);
      expect(TEXTS[k], `${k}: it does not vanish`).toMatch(/does not go away|is not cancelled|does not disappear/i);
      expect(TEXTS[k], `${k}: who carries it`).toMatch(/whose days|who is going to be standing there|carries it|carrying it/i);
    }
  });
});

describe('DR-0100’s three tiers, held apart in every reader text', () => {
  it('states the documented half plainly rather than hedging it', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: documented`).toMatch(/documented/i);
      expect(TEXTS[k], `${k}: refuses the hedge`).toMatch(/some people say|some say/i);
    }
    expect(L.lesson).toMatch(/refusing to say so plainly would be its own kind of lie/);
  });

  it('names the open half NARROWLY, and never upgrades an allegation', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: an arrest is not a conviction`).toMatch(/arrest is not a conviction/i);
    }
    for (const k of ['adult', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: the reports disagree`).toMatch(/do not agree|disagree/i);
      expect(TEXTS[k], `${k}: charge is not a crime`).toMatch(/charge is not a crime/i);
    }
  });

  it('says in every band, in one word, that the figures are unchecked', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bunchecked\b/);
  });

  it('PROVEN TO CATCH: a band that drops the unchecked limit is named, and only it', () => {
    const youth = L.levels.youth.replace(/unchecked/g, 'confirmed');
    expect(youth).not.toBe(L.levels.youth);
    const short = Object.entries({ ...TEXTS, youth })
      .filter(([, t]) => !/\bunchecked\b/.test(t)).map(([k]) => k);
    expect(short).toEqual(['youth']);
  });

  it('reports the measured fetch refusals in the tools’ own words, and the refused number in every band', () => {
    expect(L.lesson).toContain(CURL_ERROR);
    expect(L.lesson).toContain(FETCH_ERROR);
    for (const k of PLACES) expect(TEXTS[k], `${k}: the refused number`).toMatch(/\b403\b/);
  });

  it('stakes no figure: no reader text states a dollar amount, a magnitude word, a percentage or a year count', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: no dollars`).not.toMatch(/\$\s?\d|\bmillion\b|\bbillion\b/i);
      expect(TEXTS[k], `${k}: no percentage`).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
      // AND NO FIGURE FROM THE SOURCE AT ALL. The matcher is SCOPED rather than
      // hollowed: a Scripture reference lives in our-voice prose by design
      // (DR-0734 requires it), as does the forwarded mail's own date and the
      // quoted error codes, so those three are removed before the sweep. What
      // is left must be empty, because the reports disagreed with each other on
      // every count and no reader text may rest on one.
      expect(figuresFromSource(TEXTS[k]), `${k}: a figure from the source`).toEqual([]);
    }
  });

  it('PROVEN TO CATCH: a figure planted in our own voice is found, and a Scripture reference is not', () => {
    expect(figuresFromSource('The gap will take 3,000 years to grow.')).toEqual(['3,000']);
    expect(figuresFromSource('It cost 40 percent more.')).toEqual(['40']);
    // While the shapes the matcher is scoped around really are invisible to it.
    expect(figuresFromSource('the shadow went backward (2 Kings 20:11) on 2026-10-20, and curl: (56) said response 403')).toEqual([]);
    // A bare reference in prose, which DR-0734's convention puts there, is not a figure.
    expect(ANCHOR_BOOKS.length).toBeGreaterThan(10);
    expect(figuresFromSource('teach them one verse back, Exodus 8:10, and read the Isaiah 30 material')).toEqual([]);
    // But a figure sitting right beside one is still caught.
    expect(figuresFromSource('read Isaiah 30:13, then note the 1,500 outages it caused')).toEqual(['1,500']);
  });
});

describe('the spine, in order, in the lesson and in every band', () => {
  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LINE), k).toBe(true);
  });

  it('carries the counter-note FIRST, with the days named, in the lesson and every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: 1 Kings 21:29`).toContain('(1 Kings 21:29)');
      expect(TEXTS[k], `${k}: the naming`).toMatch(/whose days|days named|days would carry|days will carry/i);
    }
    // And it is placed before the mechanism in the adult lesson, on purpose.
    expect(L.lesson.indexOf('(1 Kings 21:29)')).toBeLessThan(L.lesson.indexOf('(Isaiah 30:13)'));
    expect(L.lesson.indexOf('(1 Kings 21:29)')).toBeLessThan(L.lesson.indexOf('(Isaiah 39:8)'));
  });

  it('carries the hour Pharaoh was handed, and what he bought with it, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Exodus 8:10`).toContain('(Exodus 8:10)');
      expect(TEXTS[k], `${k}: one more night`).toMatch(/one more (whole )?night/i);
    }
  });

  it('carries the set time against the empty word, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Exodus 9:5`).toContain('(Exodus 9:5)');
      expect(TEXTS[k], `${k}: nothing attached`).toMatch(/nothing attached|nothing in it/i);
    }
  });

  it('carries the swelling wall rather than a crack, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Isaiah 30:13`).toContain('(Isaiah 30:13)');
      // Each register says it its own way: "Not a crack. A bump." in the child
      // band, "Not a crack, a bulge" in the others.
      expect(TEXTS[k], `${k}: not a crack`).toMatch(/not a crack/i);
      expect(TEXTS[k], `${k}: it swells`).toMatch(/bulge|bump|swell/i);
    }
  });

  it('carries the one measure Yahweh ever moved, with its direction and its purpose, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: 2 Kings 20:10`).toContain('(2 Kings 20:10)');
      expect(TEXTS[k], `${k}: 2 Kings 20:11`).toContain('(2 Kings 20:11)');
      expect(TEXTS[k], `${k}: backward`).toMatch(/backward/);
      expect(TEXTS[k], `${k}: once, by Yahweh`).toMatch(/One time|once/i);
    }
  });

  it('carries the sentence the lesson is named for, and refuses to pass a verdict on the man', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Isaiah 39:8`).toContain('(Isaiah 39:8)');
      expect(TEXTS[k], `${k}: he was a good king`).toMatch(/good king|good man/i);
    }
    for (const k of ['adult', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: stays with what is written`).toMatch(/reticent|stays with what is written|pass(es)? no verdict|must not either/i);
    }
  });

  it('carries the window, and the sound of it shutting, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Matthew 5:25`).toContain('(Matthew 5:25)');
      expect(TEXTS[k], `${k}: Jeremiah 8:20`).toContain('(Jeremiah 8:20)');
    }
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], `${k}: Hebrews 9:26`).toContain('(Hebrews 9:26)');
    for (const k of PLACES) expect(TEXTS[k], `${k}: John 1:29`).toContain('(John 1:29)');
    for (const k of PLACES) expect(TEXTS[k], `${k}: John 3:16`).toContain('(John 3:16)');
    for (const k of PLACES) expect(TEXTS[k], `${k}: Hebrews 1:8`).toContain('(Hebrews 1:8)');
  });

  it('PROVEN TO CATCH: a band that drops the confession is named, and only it', () => {
    const child = L.levels.child.replace(/Lamb of Yahweh/g, 'good teacher');
    expect(child).not.toBe(L.levels.child);
    const short = Object.entries({ ...TEXTS, child })
      .filter(([, t]) => !/Lamb of Yahweh/.test(t)).map(([k]) => k);
    expect(short).toEqual(['child']);
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
    expect(SPINE.length).toBeGreaterThanOrEqual(28);
  });

  it('THE CORPUS CORRECTED MEMORY, and the correction is pinned', () => {
    // Ezekiel 12:28 was written from memory as "There shall none of my words be
    // deferred" — which would have been a fabricated quotation of the exact
    // verse this lesson turns on. The corpus says "prolonged any more", and
    // that is what the lesson carries. sov64 lost its title to this same class
    // of fault; this one was caught before a line was written.
    expect(corpusText('Ezekiel 12:28')).toContain('There shall none of my words be prolonged any more');
    expect(corpusText('Ezekiel 12:28')).not.toContain('deferred');
    for (const t of EVERY_STRING) expect(t).not.toContain('none of my words be deferred');
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(195);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(195);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'nay, but let the shadow return backward ten degrees',
      'nay, but let the shadow return backward nine degrees',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: the corpus’s curly apostrophe cannot be replaced with an ASCII one', () => {
    // 1 Kings 21:29 reads "his son’s days" with U+2019, and Isaiah 30:14 reads
    // "potters’ vessel". A straight quote in either is a real alteration.
    const broken = L.lesson.replace('but in his son’s days will I bring the evil', "but in his son's days will I bring the evil");
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
    expect(corpusText('1 Kings 21:29')).toContain('son’s');
    expect(corpusText('Isaiah 30:14')).toContain('potters’');
  });

  it('CARRIES NO CURLY-QUOTED SCRIPTURE, so the house quotation gates can actually see every span', () => {
    // DR-1312's finding, applied before the fact: five repository quotation
    // gates and 22 checks passed over Scripture delimited with U+201C/U+201D
    // because every one of them splits on the ASCII double quote. Verbatim but
    // invisible. This module carries zero typographic quotation marks, and
    // every double-quoted span is balanced.
    expect(EVERY_STRING.join('').match(/[“”]/g)).toBeNull();
    for (const t of EVERY_STRING) expect((t.match(/"/g) || []).length % 2, t.slice(0, 50)).toBe(0);
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

  it('every double-quoted span carries a reference: the digest’s words are rendered, never quoted', () => {
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

describe('our own voice names Yahweh, spells American, and never capitalises the adversary', () => {
  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic God copied through unquoted is refused', () => {
    const planted = 'A correction nobody makes is still God’s to collect.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('there is none like unto the LORD our God');
    expect(inQuotes).toContain('Thus saith the Lord GOD');
    expect(inQuotes).toContain('revelation of the righteous judgment of God');
  });

  it('never capitalises the adversary in our own voice, while Matthew 5:25 keeps its own lowercase', () => {
    expect(EVERY_STRING.map(ourVoice).join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal|Dragon|Accuser|Deceiver)\b/);
    expect(corpusText('Matthew 5:25')).toContain('lest at any time the adversary deliver thee to the judge');
  });

  it('spells it the house way in our own prose', () => {
    for (const t of EVERY_STRING) expect(findBritish(t).map((h) => h.word), t.slice(0, 50)).toEqual([]);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check still reads green', () => {
    const teen = L.levels.teen;
    const friend = /Friends, tell one friend this week[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
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

  it('and the child and youth bands carry NONE of the digest’s particulars, asserted', () => {
    for (const b of ['child', 'youth']) {
      expect(L.levels[b], `${b}: no particulars`).not.toMatch(/espionage|election|occupied|engineer|recording device|olive|settler|voting illegally/i);
      // They still carry the principle, the honest limit and the tiers.
      expect(L.levels[b], `${b}: the principle`).toMatch(/correction|fix\b/i);
      expect(L.levels[b], `${b}: the limit`).toMatch(/\bunchecked\b/);
      expect(L.levels[b], `${b}: documented`).toMatch(/documented/i);
    }
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(18);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in OUR voice', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of ourVoice(t).match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});
