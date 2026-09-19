// @vitest-environment node
// =============================================================================
// L187 — The Acceptable Year and the Whole Counsel
// =============================================================================
// Darrell 2026-09-19, in two shouts around an episode of The Just Life in which
// Benjamin Watson sat with Dr. Tony Evans on the Kingdom agenda, biblical
// justice, the twofold gospel, restitution and unity:
//
//   "Whole council of Yahweh not just what benefits your group..."
//   "Acceptable Year Of The Lord!!!!"
//
// (His first word is rendered for MEANING per DR-0331 — counsel, as Acts 20:27
// has it. The claim is his; only the spelling is ours.)
//
// MEASURED BEFORE A WORD WAS WRITTEN, across the 186 lessons already standing:
//   Luke 4:18        3 lessons
//   Luke 4:19        ZERO
//   Luke 4:20        ZERO
//   Luke 4:21        ZERO
//   Isaiah 61:2      ZERO
//   "acceptable year" ZERO occurrences in the entire school
//
// That measurement IS the lesson's second half. This house has stood up three
// separate times, read His anointing out loud, and stopped one line short of
// what He said He came to proclaim — the same SHAPE as the 1807 abridgement it
// condemns, with none of the malice. An omission cannot be felt from the
// inside; only counting finds it. Those counts are pinned below so the claim
// stays honest as the corpus grows (it is a claim about what was true when the
// lesson was written, so it is asserted as a floor, not a fixed number).
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//   1. COLLAPSING HIS STOP INTO THE 1807 EDIT. He read to Luke 4:19 and closed
//      the book — and HANDED IT BACK WHOLE. Nothing removed, the rest reachable
//      within the hour. Treating that as cherry-picking would teach the exact
//      opposite of the lesson, and would accuse Him of the sin it names.
//   2. LETTING A MAN'S AUTHORITY CARRY THE ATONEMENT-FIRST ORDER. Evans is
//      right that jubilee cannot be inaugurated without the day of atonement.
//      The reason to receive it is Leviticus 25:9, which schedules the trumpet
//      ON that day. The verse carries it; his reputation does not.
//   3. HEDGING ESTABLISHED EVIL. DR-0100 tier 1: the trade was manstealing
//      (Exodus 21:16), churches endorsed it, the 1807 book is a real object.
//      Softening documented harm into "some say" is a failure of truth.
//   4. ASSERTING A MAN'S READING AS OURS. DR-0076 §8: Evans reads the Civil War
//      as Yahweh's judgment. That is HIS theological reading of an event. It is
//      reported as his and never asserted, because the text does not hand it to
//      us and we will not put a verdict about a war in Yahweh's mouth.
//   5. BECOMING A FACTION'S BANNER. Leviticus 19:15 forbids BOTH tilts — the
//      poor as firmly as the mighty. Without that verse this lesson is a team
//      jersey, and it must appear in every band.
//   6. TEACHING ONLY THE HISTORY. The deliverable is a habit a reader can run
//      this week: read to the end of the sentence, then the paragraph, then ask
//      what the same writer says four verses later.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';

const ID = 'll187-the-acceptable-year-and-the-whole-counsel';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const verse = (book, ch, n) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  const bk = cache.get(k); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  return chap[Number(n) - 1] == null ? null : norm(chap[Number(n) - 1]);
};

/** Every string a reader actually meets, with a path naming where it lives. */
const readerTexts = (m) => {
  const out = [['bigIdea', m.bigIdea], ['inApp', m.inApp], ['lesson', m.lesson]];
  for (const b of BANDS) out.push([`levels.${b}`, m.levels[b]]);
  m.benefits.forEach((x, i) => out.push([`benefits[${i}]`, x]));
  m.quiz.questions.forEach((q, i) => {
    out.push([`quiz[${i}].q`, q.q]);
    out.push([`quiz[${i}].explain`, q.explain]);
    q.options.forEach((o, j) => out.push([`quiz[${i}].options[${j}]`, o]));
  });
  m.facilitator.talkingPoints.forEach((x, i) => out.push([`talkingPoints[${i}]`, x]));
  return out;
};

const ALL = () => readerTexts(L).map(([, t]) => t).join(' ');

describe('the lesson exists and is wired', () => {
  it('is the 187th Living Lesson and sits after L186', () => {
    expect(L, 'L187 is not in the series').toBeTruthy();
    // INVARIANT, never a literal. Pinning the digit is what taught four earlier
    // test files to break on an append that had nothing to do with them.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll186-/);
  });

  it('carries every field, every band clears its floor, and no two bands are near-duplicates', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(shortBands(measureFullness(L))).toEqual([]);
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('EVERY quotation is the verse it names', () => {
  it('resolves and matches letter for letter, across every field a reader meets', () => {
    const r = scanQuotedVerses([L], readerTexts);
    expect(r.spans, 'far too few referenced spans for a lesson this size').toBeGreaterThan(200);
    expect(r.faults).toEqual([]);
    expect(r.verbatim).toBe(r.spans);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    for (const [where, text] of readerTexts(L)) {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${where}: ${m[1].slice(0, 50)}`);
    }
    expect(elided).toEqual([]);
  });
});

describe('the passage the lesson turns on, pinned against the KJV', () => {
  it('He read one line past the anointing, and that line is the acceptable year', () => {
    expect(verse('Luke', 4, 18)).toContain('he hath anointed me to preach the gospel to the poor');
    expect(verse('Luke', 4, 19)).toBe('To preach the acceptable year of the Lord.');
  });

  it('and then He closed the book and said it was fulfilled that day', () => {
    expect(verse('Luke', 4, 20)).toContain('And he closed the book, and he gave it again to the minister, and sat down');
    expect(verse('Luke', 4, 21)).toBe('And he began to say unto them, This day is this scripture fulfilled in your ears.');
  });

  it('the sentence He was reading does NOT end where He ended it', () => {
    // Without this the whole hinge of the lesson is an assertion. With it, the
    // clause He did not read is in the file, and anyone can see it.
    const isa = verse('Isaiah', 61, 2);
    expect(isa).toContain('To proclaim the acceptable year of the LORD');
    expect(isa).toContain('and the day of vengeance of our God');
  });

  it('the acceptable year is jubilee, and jubilee is legislated not felt', () => {
    const lev = verse('Leviticus', 25, 10);
    expect(lev).toContain('proclaim liberty throughout all the land unto all the inhabitants thereof');
    expect(lev).toContain('it shall be a jubile unto you');
    expect(verse('Leviticus', 25, 23)).toContain('for the land is mine');
  });

  it('and the trumpet is scheduled for the day of atonement — the order is IN the verse', () => {
    // This is the single most load-bearing check in the file. Evans's claim
    // that the social half cannot be inaugurated without the atonement is
    // received because THIS verse schedules it, not because he said it.
    expect(verse('Leviticus', 25, 9)).toContain('in the day of atonement shall ye make the trumpet sound throughout all your land');
    expect(verse('Leviticus', 16, 30)).toContain('clean from all your sins before the LORD');
  });

  it('the proof-text carries its own undoing four verses later', () => {
    expect(verse('Ephesians', 6, 5)).toContain('Servants, be obedient to them that are your masters according to the flesh');
    const nine = verse('Ephesians', 6, 9);
    expect(nine).toContain('ye masters, do the same things unto them, forbearing threatening');
    expect(nine).toContain('neither is there respect of persons with him');
  });

  it('and the trade itself was already under sentence, twice, plus the epistles', () => {
    expect(verse('Exodus', 21, 16)).toBe('And he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death.');
    expect(verse('Deuteronomy', 24, 7)).toContain('maketh merchandise of him, or selleth him; then that thief shall die');
    expect(verse('1 Timothy', 1, 10)).toContain('for menstealers');
  });

  it('justice forbids BOTH tilts in one verse', () => {
    const lev = verse('Leviticus', 19, 15);
    expect(lev).toContain('thou shalt not respect the person of the poor');
    expect(lev).toContain('nor honor the person of the mighty');
  });

  it('He refuses the either-or, in His own mouth', () => {
    expect(verse('Matthew', 23, 23)).toContain('these ought ye to have done, and not to leave the other undone');
  });

  it('forgiveness is the release of a debt — the same word jubilee uses', () => {
    expect(verse('Matthew', 6, 12)).toBe('And forgive us our debts, as we forgive our debtors.');
    expect(verse('Matthew', 18, 27)).toContain('loosed him, and forgave him the debt');
    expect(verse('Deuteronomy', 15, 2)).toContain('because it is called the LORD’s release');
  });
});

describe('the measurement that turns the rebuke on this house', () => {
  const others = LIVING_LESSONS_MODULES.filter((m) => m.id !== ID);
  const hits = (ref) => others.filter((m) => JSON.stringify(m).includes(ref)).length;

  it('Luke 4:18 was already being taught — so the omission was never ignorance', () => {
    expect(hits('Luke 4:18')).toBeGreaterThanOrEqual(3);
  });

  it('and Luke 4:19 was taught NOWHERE ELSE, which is the finding', () => {
    // A floor rather than a fixed zero: the honest claim is about what was true
    // when L187 was written, and later lessons SHOULD pick these up (that is
    // the point of the lesson). What must never happen is this lesson being the
    // only place the verse appears while the claim quietly goes stale.
    expect(hits('Luke 4:19')).toBeLessThanOrEqual(2);
    expect(hits('Isaiah 61:2')).toBeLessThanOrEqual(2);
  });

  it('this lesson now carries all four, and says the count out loud', () => {
    for (const ref of ['Luke 4:18', 'Luke 4:19', 'Luke 4:20', 'Luke 4:21', 'Isaiah 61:2']) {
      expect(JSON.stringify(L), `L187 must itself teach ${ref}`).toContain(ref);
    }
    expect(ALL()).toMatch(/Luke 4:18 (appears|shows up|had been quoted) three times/i);
  });
});

describe('the six things it could have got wrong', () => {
  it('never collapses His stop into the 1807 edit — the scroll went back WHOLE', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} band loses the stop-versus-cut distinction`)
        .toMatch(/handed it back|gave it again|handed it over whole|handed the scroll back|gave the scroll back|rolled the scroll/i);
    }
    expect(ALL()).toMatch(/opposite|not the same as cutting|different act/i);
  });

  it('grounds the atonement-first order in Leviticus 25:9 rather than in a man', () => {
    expect(ALL()).toContain('Leviticus 25:9');
    expect(ALL()).toMatch(/check him|check us|not .{0,40}because he said it|his standing|his reputation|his years/i);
  });

  it('states the established evil flat, with no hedge (DR-0100 tier 1)', () => {
    expect(ALL()).toMatch(/was evil/);
    expect(ALL()).toMatch(/1,189/);
    expect(ALL()).toMatch(/282/);
    expect(ALL()).not.toMatch(/some say slavery|allegedly evil|arguably evil/i);
  });

  it('attributes the Civil War reading to Evans and never asserts it (DR-0076 §8)', () => {
    const all = ALL();
    expect(all).toMatch(/Civil War/);
    // It must ALWAYS appear as his reading. There must be no sentence in which
    // this house says it in its own voice.
    expect(all).toMatch(/his theological reading|his reading of an event|report it as his|reported as his/i);
    expect(all).not.toMatch(/The Civil War was Yahweh['’]s judgment\b(?!.{0,80}(reading|Evans|his))/i);
  });

  it('carries the both-tilts guard in EVERY band, so no faction can fly it', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} band drops the Leviticus 19:15 guard`)
        .toMatch(/nor honor the person of the mighty/);
    }
  });

  it('ends with a habit a reader can run this week, not with history', () => {
    expect(ALL()).toMatch(/read to the end of the sentence/i);
    expect(ALL()).toMatch(/four verses later|four verses down|four verses on/i);
    for (const b of BANDS) {
      expect(L.levels[b], `${b} band never hands the reader the habit`).toMatch(/READ TO THE END OF THE SENTENCE/);
    }
  });
});

describe('Darrell’s own words are carried, and the Word is not bent to fit them', () => {
  it('his shout is in the lesson, rendered for meaning', () => {
    expect(ALL()).toMatch(/whole counsel of Yahweh, not just what benefits your group/i);
    expect(ALL()).toMatch(/acceptable year/i);
  });

  it('and Acts 20:27 is the Word he was reaching for', () => {
    expect(verse('Acts', 20, 27)).toBe('For I have not shunned to declare unto you all the counsel of God.');
    expect(ALL()).toContain('Acts 20:27');
  });
});
