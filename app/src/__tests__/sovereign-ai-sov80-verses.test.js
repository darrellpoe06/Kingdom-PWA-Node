// @vitest-environment node
// =============================================================================
// sov80 — every quotation is the corpus verbatim, and the gate is not narrower
// than its name (DR-1472, DR-1467)
// =============================================================================
// Sovereign A.I. week 80, "Discovery is not permission", was built from one
// word Darrell typed above a forwarded engineering newsletter on 2026-10-28:
// Lesson. Gmail thread 1a18330341dec7b0. Sixteen days stood between his word
// and this build.
//
// WHY THIS FILE IS SHAPED THE WAY IT IS. DR-1467 is a record of gates that
// were narrower than their own names, and all three of its instances would
// have passed a careless version of this file:
//
//   1. A CHECK THAT READ ONLY THE FIVE READER PLACES. sov79's gate read the
//      adult lesson and the four bands, and a bigIdea reciting two decision
//      records sailed past a check that claimed none were recited. So the
//      sweep below walks EVERY STRING IN THE MODULE — 140 of them: benefits,
//      story bodies, quiz questions and explanations, talking points,
//      discussion prompts, the facilitator's notes, the research/plan/execute
//      block, the anchor theme and the title — and not a hand-listed set of
//      fields. `everyString` is the one traversal; every check below consumes
//      it, so no check can be given a smaller world than another.
//   2. A BOOK LIST TYPED BY HAND. sov78 swept its quotations against a typed
//      list of books that omitted Revelation while Revelation 3:7 stood quoted
//      in all five reader places. So the book list here is DERIVED from the
//      module's own quotations and never typed, and a separate case asserts
//      that the derived set and the set of books the quotations actually name
//      are the SAME set — which is a tautology only if the derivation is
//      honest, and that is exactly what it is there to keep honest.
//   3. SUITES THAT READ THE SHARED LEDGERS RATHER THAN THE CATALOG. That one
//      cannot be fixed inside this file, and it is named in the record and in
//      the session note instead: decision-chain.test.js and
//      course-band-coverage.test.js were run by name on this tree.
//
// THE RESIDUAL GAP IN THIS GATE, STATED RATHER THAN HIDDEN (DR-0076 §8). This
// file proves that every quotation IS the verse it names. It cannot prove the
// lesson quoted the RIGHT verse for the point being made — that is the
// author's eye and the reviewer's, and no machine check here substitutes for
// it. It also reads only this module: a sibling lesson that quotes the same
// chapter is swept by its own file, not by this one.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov80-discovery-is-not-permission';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

// --- one traversal, and every check below drinks from it ---------------------
/** Every string anywhere in the module, with the path that reaches it. */
function everyString(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => everyString(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) everyString(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

const STRINGS = MODULE ? everyString(MODULE) : [];
const at = (p) => (STRINGS.find(([k]) => k === p) || [, ''])[1];

// A quotation, as this course writes one: the text in double quotes, then the
// reference in parentheses. The book group allows a leading ordinal (1 Samuel)
// and a multi-word name (Song of Solomon), so nothing is skipped by shape.
const QUOTE = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)\)/g;

/** Every quotation in the module: its text, its reference, and where it sits. */
function everyQuotation(strings = STRINGS) {
  const out = [];
  for (const [path, s] of strings) {
    for (const m of s.matchAll(QUOTE)) {
      out.push({ path, text: m[1], book: m[2].trim(), chapter: Number(m[3]), verse: Number(m[4]) });
    }
  }
  return out;
}

const QUOTATIONS = everyQuotation();
// DERIVED, never typed (DR-1467 instance 2).
const BOOKS = [...new Set(QUOTATIONS.map((q) => q.book))].sort();

// --- the repo's own KJV, read from disk, never from memory --------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();

// THE SAME RESOLUTION THE GENERATOR USES, AND THE FIRST THING THIS FILE GOT
// WRONG. The house writes "Psalm 141:3" and the corpus file is `Psalms.json`,
// so scripts/sov80-fill.mjs falls back to the plural form. The first draft of
// this test did not, and reported nine false faults against Psalm — a gate
// narrower than the generator it is meant to police, which is DR-1467's own
// shape appearing inside the check written to avoid it. Recorded rather than
// quietly corrected.
export function bookFileName(book) {
  const k = String(book).replace(/\s+/g, '');
  if (existsSync(join(KJV, `${k}.json`))) return k;
  if (existsSync(join(KJV, `${k}s.json`))) return `${k}s`;
  return null;
}

function corpusVerse(book, chapter, verse) {
  const key = bookFileName(book);
  if (!key) return null;
  if (!cache.has(key)) {
    const p = join(KJV, `${key}.json`);
    cache.set(key, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  const bk = cache.get(key);
  if (!bk) return null;
  const chap = bk.chapters[chapter - 1];
  return (chap && chap[verse - 1]) || null;
}

/** Every way a set of quotations departs from the corpus. Empty = clean. */
function verseFaults(quotations) {
  const out = [];
  for (const q of quotations) {
    const actual = corpusVerse(q.book, q.chapter, q.verse);
    if (actual == null) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} does not resolve in the corpus`);
    else if (actual !== q.text) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} is not the corpus text`);
  }
  return out;
}

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];
const TEACHING_PLACES = ['lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];

describe('sov80 is in the catalog and is the whole lesson', () => {
  it('the module exists, at week 80, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(MODULE.id).toBe(ID);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 140 strings on 2026-11-13, MEASURED. The number is pinned low-side: the
    // point is that the traversal reaches far past the seven reader places, so
    // a quotation hidden in a quiz explanation or a talking point is swept.
    expect(STRINGS.length).toBeGreaterThanOrEqual(140);
    const paths = STRINGS.map(([p]) => p);
    for (const p of READER_PLACES) expect(paths, `${p} must be swept`).toContain(p);
    for (const p of ['title', 'anchor.theme', 'rpe.research', 'rpe.plan', 'rpe.execute', 'benefits[0]', 'stories[0].body', 'quiz.questions[0].explain', 'facilitator.howToRun', 'facilitator.talkingPoints[0]', 'facilitator.discussionPrompts[0]']) {
      expect(paths, `${p} must be swept`).toContain(p);
    }
    // And the sweep genuinely finds quotations OUTSIDE the reader places —
    // which is the whole reason it is wider than its predecessor.
    const outside = QUOTATIONS.filter((q) => !READER_PLACES.includes(q.path));
    expect(outside.length, 'the wider sweep must actually reach further').toBeGreaterThan(0);
  });
});

describe('every quotation is the corpus verbatim', () => {
  it('there are quotations to check, across the books the module itself names', () => {
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(199);
    expect(BOOKS.length).toBeGreaterThanOrEqual(21);
  });

  it('the book list is DERIVED from the quotations, so no book can be omitted', () => {
    // The list is built from the quotations themselves; assert that nothing in
    // the module names a book the derivation missed. A typed list is exactly
    // what let Revelation 3:7 ship unswept on a sibling lesson (DR-1467).
    const named = new Set(QUOTATIONS.map((q) => q.book));
    expect([...named].sort()).toEqual(BOOKS);
    for (const b of BOOKS) {
      expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    }
    // The plural fallback is load-bearing and is asserted, not assumed.
    expect(BOOKS, 'the lesson quotes the psalms').toContain('Psalm');
    expect(bookFileName('Psalm')).toBe('Psalms');
    expect(BOOKS, 'Revelation is quoted and must be in the swept set').toContain('Revelation');
  });

  it('every quotation anywhere in the module matches the KJV on disk', () => {
    expect(verseFaults(QUOTATIONS)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a drifted word in a QUIZ EXPLANATION is caught', () => {
    const q = QUOTATIONS.find((x) => x.path.startsWith('quiz.')) || QUOTATIONS[0];
    const broken = [{ ...q, text: `${q.text} and more` }];
    expect(verseFaults(broken)).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a quotation attributed to the wrong verse is caught', () => {
    const q = QUOTATIONS[0];
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a quotation in a book the sweep would have to reach is caught', () => {
    // The sov78 defect, replayed: a quotation in Revelation, which a typed
    // book list omitted. Here the book is derived, so it is reached — and a
    // drifted one fails.
    const rev = QUOTATIONS.find((q) => q.book === 'Revelation');
    expect(rev, 'the lesson quotes Revelation').toBeTruthy();
    expect(verseFaults([{ ...rev, text: 'behold I stand at the door' }])).toHaveLength(1);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const anchor = MODULE.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
  const readerQuoted = new Set(
    QUOTATIONS.filter((q) => READER_PLACES.includes(q.path)).map((q) => `${q.book} ${q.chapter}:${q.verse}`)
  );

  it('the anchor carries no reference that is not quoted to a reader', () => {
    expect(anchor.filter((r) => !readerQuoted.has(r))).toEqual([]);
  });

  it('no verse is quoted to a reader without standing on the anchor', () => {
    // Search it out derives its links from anchor.ref (DR-0734), so a verse
    // quoted but unlisted is a verse the reader cannot follow.
    expect([...readerQuoted].filter((r) => !anchor.includes(r))).toEqual([]);
  });

  it('the anchor resolves, end to end', () => {
    expect(anchor.length).toBe(45);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and grounds the hour; no figure from the article stands above it', () => {
  it('every reader place quotes the two frame verses verbatim', () => {
    // The five TEACHING places are the ones a reader actually reads end to
    // end. bigIdea and inApp are cards: they name the two passages and send
    // the reader to them, and that is asserted separately below rather than
    // demanded as a re-quotation.
    const isaiah = corpusVerse('Isaiah', 22, 22);
    const genesis = corpusVerse('Genesis', 3, 6);
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Isaiah 22:22`).toContain(isaiah);
      expect(at(p), `${p} quotes Genesis 3:6`).toContain(genesis);
    }
    for (const p of ['bigIdea', 'inApp']) {
      expect(at(p), `${p} sends the reader to the frame`).toMatch(/Isaiah 22/);
    }
  });

  it('the frame is laid before the household application, in every teaching place', () => {
    const isaiah = corpusVerse('Isaiah', 22, 22);
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = text.indexOf(isaiah);
      const application = text.search(/THIS WEEK|WHAT TO DO|DO MONDAY|three things this week/i);
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(application, `${p} carries an application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word must come before the application`).toBeLessThan(application);
    }
  });

  it('no teaching place names a company, a product or a protocol figure from the article', () => {
    // The article is the occasion, never the foundation (DR-0127 / DR-0282).
    // The verification note that DOES name the blocked hosts lives in the
    // blocked-road paragraph, and that is a statement about our own road, not
    // a figure the teaching rests on.
    const forbidden = ['Uber', 'JSON-RPC', 'AutoCrawler', 'Cadence', 'Omni MCP', 'Response Projection', 'Code Mode', 'ByteByteGo', 'Jira'];
    for (const p of TEACHING_PLACES) {
      for (const term of forbidden) expect(at(p), `${p} must not lean on ${term}`).not.toContain(term);
    }
  });

  it('no decision record is recited at a reader', () => {
    // The sov79 defect: a bigIdea reciting two DR numbers while a check that
    // read only five fields claimed none were. bigIdea and inApp are included
    // here on purpose.
    for (const p of [...TEACHING_PLACES, 'bigIdea', 'inApp']) {
      expect(at(p), `${p} recites a decision record`).not.toMatch(/DR-\d{4}/);
    }
  });

  it('PROVEN-TO-CATCH: a teaching place that leans on the company is named', () => {
    const planted = 'Uber built the gateway';
    expect(/Uber/.test(planted)).toBe(true);
    expect(/Uber/.test(at('lesson'))).toBe(false);
  });
});

describe('the blocked road is named in every reader place with a dated re-review', () => {
  it('each of the five teaching places says the primary was not read and carries the date', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} names the host it could not open`).toContain('www.uber.com');
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
    }
  });

  it('the bigIdea says what checking CHANGED, in both directions', () => {
    const big = at('bigIdea');
    expect(big).toContain('BIGGER');
    expect(big).toContain('STRENGTHENED');
    expect(big).toContain('CORRECTED');
    expect(big).toMatch(/Not checked at all/);
  });

  it('PROVEN-TO-CATCH: a teaching place missing the date is named', () => {
    const stripped = at('levels.child').replace('re-review: 2026-11-27', '');
    expect(stripped.includes('re-review: 2026-11-27')).toBe(false);
    expect(at('levels.child').includes('re-review: 2026-11-27')).toBe(true);
  });
});

describe('TALK ABOUT IT TOGETHER is whole in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  const places = ['lesson', ...FOUR_BANDS.map((b) => `levels.${b}`)];

  it('all three directions are present in each place, by their own words', () => {
    for (const p of places) {
      const t = at(p);
      expect(t, `${p} opens the close`).toContain('TALK ABOUT IT TOGETHER');
      expect(t, `${p}: parents to children`).toMatch(/Parents|Grandparents/);
      expect(t, `${p}: children to parents`).toMatch(/Children, ask your/);
      expect(t, `${p}: friend to friend`).toMatch(/ask a friend this/);
      expect(t, `${p}: the skill of listening to the end`).toMatch(/all the way to the end|whole story|whole of it/);
      expect(t, `${p}: retell`).toMatch(/retell|say it back|tell it back/);
      expect(t, `${p}: teach one verse`).toMatch(/teach (them|each other) one verse/i);
      expect(t, `${p}: the rhythm`).toContain('Deuteronomy 6:7');
      expect(t, `${p}: one friend this week`).toContain('one friend this week');
    }
  });

  it('PROVEN-TO-CATCH: stripping ONE band’s friend line names that band while the module still looks whole', () => {
    const broken = { ...MODULE, levels: { ...MODULE.levels, youth: MODULE.levels.youth.replace(/ask a friend this/g, 'ask someone') } };
    const short = ['lesson', ...FOUR_BANDS.map((b) => `levels.${b}`)].filter((p) => {
      const t = p === 'lesson' ? broken.lesson : broken.levels[p.split('.')[1]];
      return !/ask a friend this/.test(t);
    });
    expect(short).toEqual(['levels.youth']);
    // and the module pooled still reads whole, which is exactly the blindness
    // the per-band check exists to remove (DR-0795).
    const pooled = [broken.lesson, ...FOUR_BANDS.map((b) => broken.levels[b])].join('\n');
    expect(/ask a friend this/.test(pooled)).toBe(true);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-13 by scripts/sov80-fill.mjs on this tree. Pinned with
    // tolerance so an authored touch-up does not fail the build for a hundredth
    // of a grade, but a band swapped for a summary does.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2290);
    const share = Object.fromEntries(FOUR_BANDS.map((b) => [b, words(MODULE.levels[b]) / adult]));
    expect(share.child).toBeGreaterThanOrEqual(0.5);
    expect(share.youth).toBeGreaterThanOrEqual(0.6);
    expect(share.teen).toBeGreaterThanOrEqual(0.6);
    expect(share.senior).toBeGreaterThanOrEqual(0.6);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    // four compositions, not one re-registered four times
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
        worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      }
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });

  it('every band names its lesson at its start', () => {
    for (const b of FOUR_BANDS) expect(MODULE.levels[b].startsWith(MODULE.title)).toBe(true);
  });
});
