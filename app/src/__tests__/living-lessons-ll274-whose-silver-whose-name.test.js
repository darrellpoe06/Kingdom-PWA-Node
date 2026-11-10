// @vitest-environment node
// =============================================================================
// L274 — Whose Silver, Whose Name: a public trust, and the account taken before
// the verdict
// =============================================================================
// The fourth-oldest genuinely-unbuilt send in the Gmail lesson-intake lane.
// Darrell forwarded an NPR Up First issue on 2026-10-13 12:24:44 UTC (thread
// 1a13539bf71aecae) with one word typed above the quoted mail: Lessons. Built
// across UTC midnight and landing 2026-11-05 (DR-1312).
//
// THE SOURCE IS POLITICALLY CHARGED, AND THAT GOVERNED EVERY DECISION HERE.
// Its two lead items were a dispute over public money spent on advertising that
// promoted a sitting official, and a judicially authorized search of a
// legislator's home inside an open federal investigation. A lesson that teaches
// either one AS POLITICS hands the reader a side to join, which is the staged
// two-sides posture CLAUDE.md's DR-0098 exists to remove. So this module names
// NO politician, NO party, NO department, NO publisher and NO accused person,
// and the tests below assert that absence by name rather than trusting it.
//
// THIS LESSON'S DANGERS, and what each one made this gate assert.
//  (1) BECOMING PARTISAN COMMENTARY. The lesson teaches the PRINCIPLE under the
//      news — what a trust is, who may spend it, whose name finishes on it, and
//      what spending it cost the spender. A names sweep over every string of
//      the module is the machine check, and it is proven-to-catch.
//  (2) HARDENING AN ALLEGATION, OR SOFTENING A DOCUMENTED FACT. DR-0100's three
//      tiers must be held apart in ALL FIVE reader texts: documented stated
//      plainly, alleged named narrowly as alleged, and unchecked-by-us said out
//      loud. Each band must carry "a search is not a conviction" in its own
//      words and the word "unchecked".
//  (3) STAKING THE TEACHING ON UNVERIFIED FIGURES. The publisher's page refused
//      three times: two command-line fetches each returned
//      `curl: (56) CONNECT tunnel failed, response 403` and a web fetch
//      returned `getaddrinfo ENOTFOUND www.npr.org`. Every link in the mail is
//      a tracking redirect and none was followed. So no reader text states a
//      dollar figure at all, and each one carries the refused number.
//  (4) GROUND ALREADY SPENT — AND THE REFUSAL THAT COST THIS BUILD ITS FIRST
//      READING. Measured before a word was written across the 270 Living
//      Lessons on origin/main (722 distinct anchor chapters): the obvious
//      reading of this source is EQUAL WEIGHTS AND EQUAL JUSTICE, and it is
//      built six ways over in this very course — ll98 (the just judge, equal
//      justice, and a just weight), ll111 (the just weight), ll134 (divers
//      weights), ll144 (a false balance), ll97, ll236 (honest weights), ll90
//      (no respecter of persons) and ll182 (two witnesses). Refused on DR-0610
//      grounds. The second candidate hinge, 2 Kings 12:15 "for they dealt
//      faithfully", is THE TITLE AND WHOLE TEACHING of an existing lesson in
//      `maintenance-trades-course.js`, and is also taught in
//      `banking-course.js` and `inspections-course.js`. Refused too, and 2
//      Kings 12 is absent from this module entirely.
//  (5) A PROSE-LEVEL COLLISION NO ANCHOR CENSUS CAN SEE (the DR-1310 finding,
//      applied). Five further candidates measured FREE at anchor level and
//      BUILT in this course's own prose, so all five were dropped before a line
//      was written: Psalms 115:1 (ll94, ll244 — the glory is His alone),
//      Psalms 15:4 (ll123, ll207, ll38 — he keeps his word when it hurts),
//      Exodus 18:21 (ll163 — character first), 1 Samuel 8:17 (ll142) and
//      Acts 12:23 (ll77 — Herod gave not the glory). The gate asserts the two
//      censuses genuinely DISAGREE on Psalms 115, so the finding is a
//      measurement rather than a memory.
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
import { findBritish } from '../../../scripts/american-spelling.mjs';

const ID = 'll274-whose-silver-whose-name';
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
/** Our authored voice: the even segments between double quotes. */
const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

const TITLE_LINE = 'WHOSE SILVER, WHOSE NAME — a crown bought out of another house’s treasury, an altar David refused to get for free, and the hearing that cost the princes something.';

// The nine anchor chapters, each measured absent from the 270 lessons on
// origin/main at BOTH anchor level AND prose level before a word was written,
// plus the two chapters that carry the DR-0210 confession and nothing else.
const FREE_CHAPTERS = [
  'Nehemiah 13', 'Judges 9', '2 Samuel 18', '2 Samuel 24', 'Deuteronomy 23',
  '2 Samuel 16', '2 Samuel 19', 'Jeremiah 26', 'Job 29',
];
const CONFESSION_CHAPTERS = ['John 1', 'Titus 2'];

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one was fetched from the corpus on disk before it was written.
const SPINE = [
  ['Nehemiah 13:10', 'And I perceived that the portions of the Levites had not been given them'],
  ['Nehemiah 13:11', 'Then contended I with the rulers'],
  ['Nehemiah 13:13', 'for they were counted faithful, and their office was to distribute unto their brethren'],
  ['Nehemiah 13:14', 'Remember me, O my God, concerning this'],
  ['Judges 9:4', 'And they gave him threescore and ten pieces of silver out of the house of baalberith, wherewith Abimelech hired vain and light persons, which followed him'],
  ['Judges 9:9', 'Should I leave my fatness, wherewith by me they honour God and man, and go to be promoted over the trees?'],
  ['Judges 9:15', 'then come and put your trust in my shadow: and if not, let fire come out of the bramble, and devour the cedars of Lebanon'],
  ['Judges 9:16', 'if ye have done truly and sincerely, in that ye have made Abimelech king'],
  ['Judges 9:20', 'let fire come out from Abimelech, and devour the men of Shechem'],
  ['2 Samuel 18:18', 'and he called the pillar after his own name: and it is called unto this day, Absalom’s place'],
  ['2 Samuel 24:22', 'behold, here be oxen for burnt sacrifice'],
  ['2 Samuel 24:24', 'neither will I offer burnt offerings unto the LORD my God of that which doth cost me nothing'],
  ['Deuteronomy 23:21', 'thou shalt not slack to pay it'],
  ['Deuteronomy 23:22', 'But if thou shalt forbear to vow, it shall be no sin in thee'],
  ['Deuteronomy 23:23', 'That which is gone out of thy lips thou shalt keep and perform'],
  ['2 Samuel 16:3', 'To day shall the house of Israel restore me the kingdom of my father'],
  ['2 Samuel 16:4', 'Behold, thine are all that pertained unto Mephibosheth'],
  ['2 Samuel 19:24', 'had neither dressed his feet, nor trimmed his beard, nor washed his clothes'],
  ['2 Samuel 19:26', 'my servant deceived me'],
  ['2 Samuel 19:27', 'And he hath slandered thy servant unto my lord the king'],
  ['2 Samuel 19:29', 'Thou and Ziba divide the land'],
  ['Jeremiah 26:8', 'took him, saying, Thou shalt surely die'],
  ['Jeremiah 26:11', 'This man is worthy to die'],
  ['Jeremiah 26:14', 'behold, I am in your hand: do with me as seemeth good and meet unto you'],
  ['Jeremiah 26:16', 'This man is not worthy to die'],
  ['Jeremiah 26:19', 'Thus might we procure great evil against our souls'],
  ['Job 29:14', 'my judgment was as a robe and a diadem'],
  ['Job 29:16', 'I was a father to the poor: and the cause which I knew not I searched out'],
  ['Job 29:17', 'And I brake the jaws of the wicked, and plucked the spoil out of his teeth'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['Titus 2:14', 'Who gave himself for us, that he might redeem us from all iniquity'],
];

// NAMES THE MODULE MAY NOT CONTAIN ANYWHERE. Every one of these is in the
// forwarded source; not one belongs in a lesson about the Word's standard.
const FORBIDDEN_NAMES = [
  'Trump', 'MAGA', 'Ilhan', 'Omar', 'Vance', 'Republican', 'Democrat', 'Democrats',
  'GOP', 'Up First', 'AdImpact', 'Common Cause', 'Truth Social',
  'Ramaswamy', 'Husted', 'Stratton', 'Zacharia', 'Homeland Security', 'Somalia',
  'White House', 'Minnesota', 'Youngstown',
];
// THE PUBLISHER'S HOST IS THE ONE EXCEPTION, AND IT IS PINNED RATHER THAN WAVED
// THROUGH. DR-0108 requires a refused road to be quoted in the tool's own words,
// and the web fetch's words are `getaddrinfo ENOTFOUND www.npr.org`. Editing the
// host out of the error would be editing evidence. So the names sweep excludes
// the error string and a separate check below asserts that EVERY occurrence of
// the host in the whole module is inside that error, and that no reader text
// credits the digest to a named publisher. The matcher is scoped, not hollowed.
const FETCH_ERROR = 'getaddrinfo ENOTFOUND www.npr.org';
const withoutFetchError = (t) => String(t).split(FETCH_ERROR).join(' ');

describe('L274 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 274 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 274)).toEqual([274]);
  });

  it('carries its BUILD day, not the day it was sent', () => {
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
    expect(refs.length).toBe(49);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = String(L.anchor.ref).split(';').map((s) => parse(s.trim())).filter(Boolean);
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref).filter(Boolean)));
    const missing = [...quoted].filter((r) => { const p = parse(r); return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b); });
    expect(missing).toEqual([]);
  });

  it('stands only on chapters measured FREE of this course, plus the two confession chapters (DR-0610)', () => {
    const chapters = new Set(String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean)
      .map((r) => { const m = /^(.+?)\s+(\d+):/.exec(r); return m && `${m[1]} ${m[2]}`; }).filter(Boolean));
    const allowed = [...FREE_CHAPTERS, ...CONFESSION_CHAPTERS];
    expect([...chapters].filter((c) => !allowed.includes(c))).toEqual([]);
    expect(chapters.size).toBe(allowed.length);
  });

  it('carries NO Jeremiah 26:18, which ll198 already quotes verbatim in its own prose', () => {
    // MEASURED, not assumed, and it cost this build a rewrite of all five reader
    // texts after the first draft had been written: ll198 quotes Jeremiah 26:18
    // in full - "Micah the Morasthite prophesied in the days of Hezekiah king of
    // Judah" - to date Micah to a reign. Different proposition from this
    // lesson's (a precedent cited inside a hearing), different verse of the same
    // chapter, and invisible to any anchor-level census. The verse was dropped
    // rather than argued for, and Jeremiah 26:19 carries the precedent alone.
    for (const t of EVERY_STRING) expect(t, 'Jeremiah 26:18 is built in ll198').not.toMatch(/Jeremiah 26:18/);
    expect(L.lesson).toContain('(Jeremiah 26:19)');
    const elsewhere = LIVING_LESSONS_MODULES.filter((m) => m.id !== ID)
      .flatMap((m) => [...strings(m)]).join('\n');
    expect(elsewhere.includes('Jeremiah 26:18'), 'll198 should still hold it').toBe(true);
    expect(elsewhere.includes('Jeremiah 26:19'), 'Jeremiah 26:19 should be free').toBe(false);
  });

  it('carries NO verse of 2 Kings 12, whose teaching is already a whole lesson elsewhere in the catalog', () => {
    // "For they dealt faithfully" (2 Kings 12:12, 15) is the TITLE of a lesson
    // in maintenance-trades-course.js. It was this build's first choice of
    // hinge and was refused; the refusal is pinned so it cannot creep back.
    for (const t of EVERY_STRING) expect(t, '2 Kings 12 is spent elsewhere').not.toMatch(/2 Kings 12\b/);
    expect(L.anchor.ref).not.toMatch(/2 Kings/);
  });
});

describe('the ground was measured BOTH ways, and the two censuses disagree', () => {
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
  // The VERSE-level census, added 2026-11-06 (DR-1352). The chapter census
  // above is right for the chapter question below, and WRONG for the verse
  // question further down -- see the comment on that case.
  const anchorVerses = () => {
    const out = new Set();
    for (const m of LIVING_LESSONS_MODULES) {
      if (m.id === ID) continue;
      for (const r of String((m.anchor && m.anchor.ref) || '').split(';')) {
        const t = r.trim(); if (t) out.add(t);
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
    const spent = anchorChapters();
    expect(spent.size).toBeGreaterThan(700);
    expect(courseProse().length).toBeGreaterThan(5_000_000);
  });

  it('every chapter this lesson stands on is FREE at anchor level', () => {
    // CORRECTED 2026-11-09 on DR-1317, which is Darrell's own correction at
    // law-tier and settles this exactly: **"one teaching" is decided by WHERE A
    // LESSON LANDS, never by the Scripture it stands on**, and **a verse is
    // never SPENT** — "there would be overlapping at times however not the
    // exact same lesson... How else would they connect?!" With DR-1323: no
    // lesson gate claims a verse for itself.
    //
    // At chapter granularity this case was a residual instance of the measure
    // DR-1317 removed. It retired ground for THIS lesson because a sibling
    // anchored a DIFFERENT verse in the same chapter, which is overlap doing
    // what DR-1317 says overlap is for. ll274 lands on the vow and what
    // forbearing to vow costs; ll289 lands on the escaped servant and the
    // verses the Slave Bible cut. Two landings, one chapter, no verse taken.
    //
    // (The same fix was made in the case below on 2026-11-06, where the comment
    // credits DR-1352. That attribution is loose: DR-1352 is ll283's lesson
    // record and says nothing about this gate — the fix was made on ll283's
    // branch a day after the record was written. DR-1352 does name DR-1317 and
    // DR-1323 in its Pairs-with line, which is where the principle lives.)
    //
    // MEASURED on this tree, by importing the modules rather than by regex:
    // ll289 ("Why the Oppressed Still Call on Him", DR-1380) anchors
    // Deuteronomy 23:15-16 — the escaped servant, the verses the Slave Bible
    // cut. This lesson stands on Deuteronomy 23:21-23 — the vow, and what
    // forbearing to vow costs. Zero verse overlap. The chapter census called
    // the ground spent; no verse this lesson stands on is taken.
    //
    // So the question is asked at the granularity it means: a chapter is spent
    // for THIS lesson when a sibling anchors one of the VERSES this lesson
    // stands on. A sibling teaching a different part of the same chapter is the
    // catalog working — two lessons meeting in Deuteronomy 23 on two different
    // commands — and is named here rather than silently allowed.
    //
    // This is NOT the exclusivity class DR-1317/1323/1326/1333/1344 removed,
    // and it is not a loosened pin: a sibling anchoring 23:21, 23:22 or 23:23
    // still reds this case, which is the proof below.
    const spentVerses = anchorVerses();
    const mine = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    const collisions = mine.filter((r) => FREE_CHAPTERS.includes(chapterOf(r)) && spentVerses.has(r));
    expect(collisions, `a sibling anchors a verse this lesson stands on:\n${collisions.join('\n')}`)
      .toEqual([]);
    // The chapter census still has to be real, or the check above is vacuous
    // against an empty set (DR-0076 §3) — and the one chapter a sibling now
    // shares is named, so a NEW chapter joining that set is visible in a diff.
    const spentChapters = anchorChapters();
    expect(FREE_CHAPTERS.filter((c) => spentChapters.has(c))).toEqual(['Deuteronomy 23']);
  });

  it('and FREE at prose level too, which is the check an anchor census cannot make', () => {
    const prose = courseProse();
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim())
      .filter((r) => !CONFESSION_CHAPTERS.includes(chapterOf(r)));
    expect(refs.length).toBeGreaterThan(40);
    expect(refs.filter((r) => prose.includes(r))).toEqual([]);
  });

  it('THE NEW CHECK: a prose-built verse that is FREE at anchor level is caught, which the anchor census cannot do', () => {
    // Psalms 115:1 reads FREE against every `anchor.ref` in this course and is
    // taught in ll94's and ll244's own prose for the very claim this lesson
    // would have made with it. The two censuses must genuinely disagree, or the
    // finding this build paid for has been lost.
    //
    // CORRECTED 2026-11-06 (DR-1352), and the correction is a granularity bug,
    // not a frozen census. This case asks a question about a VERSE -- "a
    // prose-built VERSE that is FREE at anchor level" -- and asked it of the
    // CHAPTER census. That read true for one reason only: no sibling had yet
    // anchored any verse in Psalms 115. ll283 ("Made In Our Image") anchors
    // Psalms 115:4, 115:5 and 115:8 for `they that make them are like unto
    // them`, which is the right verse for that lesson, so the chapter went
    // "spent" and this case went red -- while saying "spent" about a verse that
    // is still free. MEASURED on ll283's branch: 3,417 anchor verse refs across
    // 777 anchor chapters; "Psalms 115" IS anchored as a chapter; `Psalms 115:1`
    // is NOT anchored as a verse. So the claim this case exists to make is
    // untouched; only the census it was asked of was the wrong one.
    //
    // This is NOT the exclusivity class DR-1317/1323/1326/1333/1344 removed. No
    // verse is being refused to anybody here: the case is a proof that the two
    // censuses CAN disagree, and it now compares like with like.
    const spent = anchorVerses();
    expect(spent.has('Psalms 115:1'), 'Psalms 115:1 should be FREE at anchor level').toBe(false);
    expect(courseProse().includes('Psalms 115:1'), 'Psalms 115:1 should be BUILT in the course prose').toBe(true);
    // And the other four dropped on the same measurement really are in the prose.
    for (const v of ['Psalms 15:4', 'Exodus 18:21', '1 Samuel 8:17', 'Acts 12:23']) {
      expect(courseProse().includes(v), `${v} should be BUILT in the course prose`).toBe(true);
    }
    // None of the five reached this lesson.
    for (const v of ['Psalms 115:1', 'Psalms 15:4', 'Exodus 18:21', '1 Samuel 8:17', 'Acts 12:23']) {
      expect(EVERY_STRING.join('\n').includes(v), `${v} must not be in this lesson`).toBe(false);
    }
  });
});

describe('the Word is the authority, not a party (DR-0098)', () => {
  it('names no politician, party, department, publisher or accused person, in ANY string of the module', () => {
    const all = EVERY_STRING.map(withoutFetchError).join('\n');
    expect(FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/ /g, '\\s+')}\\b`, 'i').test(all))).toEqual([]);
  });

  it('and the publisher’s host appears ONLY inside the quoted fetch error, nowhere else', () => {
    // Measured, and the first draft of this check was WRONG: /npr/gi also fires
    // on "unprompted" and "unproven", so it read 7 where the host appears 4
    // times. Scoped to the host itself, which is what the rule is about.
    const hits = EVERY_STRING.join('\n').match(/npr\.org/gi) || [];
    const inError = (EVERY_STRING.join('\n').match(new RegExp(FETCH_ERROR, 'g')) || []).length;
    expect(hits.length, 'every npr occurrence must be one of the quoted errors').toBe(inError);
    expect(inError).toBeGreaterThan(0);
    // And no reader text hands the teaching a publisher to stand on.
    for (const k of PLACES) expect(withoutFetchError(TEXTS[k]), `${k}`).not.toMatch(/\bNPR\b|National Public Radio|Up First/i);
  });

  it('PROVEN TO CATCH: one politician’s name copied through is refused, and scoping the error does not hide it', () => {
    const planted = `${L.levels.teen} The order came from the White House.`;
    expect(FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/ /g, '\\s+')}\\b`, 'i').test(withoutFetchError(planted))))
      .toEqual(['White House']);
    // And a publisher credit planted OUTSIDE the error is still caught.
    const credited = `${L.levels.child} The numbers come from NPR.`;
    expect(/\bNPR\b/.test(withoutFetchError(credited))).toBe(true);
  });

  it('says out loud in every reader text that the lesson refuses to take a side, and why', () => {
    for (const k of PLACES) expect(TEXTS[k], `${k}: refuses a side`).toMatch(/not going to discuss those people|will not take a side|Not one of those people is named|names neither of those people|We will not talk about any of those people/i);
    // The child band says it in its own words - "The names change. The thing
    // under the story does not change when the names change." - so the matcher
    // recognises that register rather than being dropped.
    for (const k of PLACES) expect(TEXTS[k], `${k}: the reason`).toMatch(/does not change when the names change|needs no team|survives every change of name/i);
  });

  it('teaches the principle it says it will: a trust, who spends it, whose name, what it cost', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: a trust`).toMatch(/\btrust\b/);
      expect(TEXTS[k], `${k}: whose name`).toMatch(/his own name/);
      expect(TEXTS[k], `${k}: what it cost`).toMatch(/cost/);
    }
  });
});

describe('DR-0100’s three tiers, held apart in every reader text', () => {
  it('states the documented half plainly rather than hedging it', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: documented`).toMatch(/documented|on the record|written down|records/i);
      expect(TEXTS[k], `${k}: refuses the hedge`).toMatch(/some people say|some say/i);
    }
    expect(L.lesson).toMatch(/refusing to say so plainly would be its own kind of lie/);
  });

  it('names the allegation NARROWLY as an allegation, and never upgrades it', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: alleged`).toMatch(/alleged|allegation/i);
      expect(TEXTS[k], `${k}: a search is not a conviction`).toMatch(/search (is not|does not equal) a conviction/i);
      // Each register says it its own way and all five must say it: "An
      // investigation is not a verdict" (adult, senior), "does not equal a
      // verdict" (teen), "Being looked into is not being guilty" (youth), "that
      // is not the same as being guilty" (child). The matcher recognises all
      // four shapes; it still requires the teaching to be there.
      expect(TEXTS[k], `${k}: nor a verdict`).toMatch(/(investigation|being looked into) (is not|does not equal)( being)?( a)? (verdict|guilty)|not the same as being guilty/i);
      // The child band glosses the phrase instead of assuming it: "That means
      // looking in your house is not the same as a judge saying you did it."
      expect(TEXTS[k], `${k}: in plain words`).toMatch(/not a conviction|not the same as a judge saying|not a verdict|does not equal a verdict/i);
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

  it('reports the measured fetch refusal in the tool’s own words, and carries the refused number in every band', () => {
    expect(L.lesson).toContain('curl: (56) CONNECT tunnel failed, response 403');
    expect(L.lesson).toContain('getaddrinfo ENOTFOUND www.npr.org');
    for (const k of PLACES) expect(TEXTS[k], `${k}: the refused number`).toMatch(/\b403\b/);
  });

  it('stakes no figure: no reader text states a dollar amount or a percentage', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: no dollars`).not.toMatch(/\$\s?\d|\bmillion\b/i);
      expect(TEXTS[k], `${k}: no percentage`).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    }
  });
});

describe('the spine, in order, in the lesson and in every band', () => {
  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LINE), k).toBe(true);
  });

  it('carries the silver taken out of the house, in the lesson and every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Judges 9:4`).toContain('(Judges 9:4)');
      expect(TEXTS[k], `${k}: out of the house`).toMatch(/Out of the house|out of a house of worship/);
    }
  });

  it('carries the bramble’s shadow it does not have, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Judges 9:15`).toContain('(Judges 9:15)');
      expect(TEXTS[k], `${k}: no shade`).toMatch(/no shade|throws no shade|casts no shade|No shade exists/i);
    }
  });

  it('carries the pillar called after his own name, and the fear under it, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: 2 Samuel 18:18`).toContain('(2 Samuel 18:18)');
      // Every band names the fear; the child band says "He was scared people
      // would forget him. He did not want to go out of everyone's memory."
      expect(TEXTS[k], `${k}: the fear`).toMatch(/forgot|forgotten|vanishing|memory/i);
    }
  });

  it('carries the altar that cost something, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: 2 Samuel 24:24`).toContain('(2 Samuel 24:24)');
      expect(TEXTS[k], `${k}: fifty shekels`).toMatch(/fifty shekels/);
    }
  });

  it('carries judgment as a trust, the costless report, and the hearing that cost something, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: 2 Samuel 16:4`).toContain('(2 Samuel 16:4)');
      expect(TEXTS[k], `${k}: Jeremiah 26:16`).toContain('(Jeremiah 26:16)');
      expect(TEXTS[k], `${k}: Job 29:16`).toContain('(Job 29:16)');
      expect(TEXTS[k], `${k}: the cause he did not know`).toMatch(/cause (he|which) (did not know|I knew not)|case he did not know|case he did not understand/i);
    }
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], `${k}: John 1:29`).toContain('(John 1:29)');
    for (const k of PLACES) expect(TEXTS[k], `${k}: Titus 2:14`).toContain('(Titus 2:14)');
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
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(230);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(230);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'neither will I offer burnt offerings unto the LORD my God of that which doth cost me nothing',
      'neither will I offer burnt offerings unto the LORD my God of that which doth cost me little',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: the corpus’s curly apostrophe cannot be replaced with an ASCII one', () => {
    // Judges 9:5 reads "his father’s house" with U+2019. A straight quote here
    // is the exact class of fault sov63 found three of in its own draft.
    const broken = L.lesson.replace('And he went unto his father’s house at Ophrah', "And he went unto his father's house at Ophrah");
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
    expect(corpusText('Judges 9:5')).toContain('father’s');
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
    const planted = 'A trust that costs nothing is not God’s standard.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Why is the house of God forsaken?');
    expect(inQuotes).toContain('rear an altar unto the LORD in the threshingfloor');
  });

  it('leaves the corpus’s own lowercase baalberith alone, and never capitalises it in our voice', () => {
    expect(corpusText('Judges 9:4')).toContain('out of the house of baalberith');
    expect(corpusText('Judges 9:4')).not.toContain('Baal');
    expect(EVERY_STRING.map(ourVoice).join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });

  it('spells it the house way in our own prose, while the quotations keep their own honour', () => {
    for (const t of EVERY_STRING) expect(findBritish(t).map((h) => h.word), t.slice(0, 50)).toEqual([]);
    // Judges 9:9's own "they honour God and man" stays exactly as the corpus has it.
    expect(corpusText('Judges 9:9')).toContain('they honour God and man');
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

  it('and the child and youth bands carry NONE of the political particulars', () => {
    for (const b of ['child', 'youth']) {
      expect(L.levels[b], `${b}: no search warrant`).not.toMatch(/search warrant|legislator|advertising|politically motivated/i);
      // They still carry the principle and the honest limit.
      expect(L.levels[b], `${b}: the principle`).toMatch(/\btrust\b/);
      expect(L.levels[b], `${b}: the limit`).toMatch(/\bunchecked\b/);
    }
    // The teen and senior bands are where the particulars belong, and they say so.
    for (const b of ['teen', 'senior']) {
      expect(L.levels[b], `${b}: the particulars`).toMatch(/search/i);
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
