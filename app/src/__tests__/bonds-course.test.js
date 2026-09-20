// @vitest-environment node
// =============================================================================
// Bonds: Lending to Companies and to Countries — course two of the Stock
// Market department
// =============================================================================
// Course one answered STOCK and deliberately left a question open: a
// shareholder is paid LAST and is owed nothing. This one answers the other
// half — a bondholder is paid FIRST and is owed a specific sum on a specific
// date — and everything about the two instruments follows from that.
//
// THE SIX THINGS THIS COURSE COULD MOST EASILY HAVE GOT WRONG, held here
// rather than remembered:
//
//   1. DEUTERONOMY 23:19-20 QUOTED AS HALF A VERSE. This is the hardest line
//      in the department. Verse 19 alone yields a blanket prohibition on
//      interest the text does not deliver, because the permission is the very
//      next sentence. Verse 20 alone yields an unbounded licence, because the
//      same verse reasserts the limit. Both are the same error — stopping
//      where the stopping is convenient — and it is committed on every side of
//      this argument, sincerely. The test below requires BOTH clauses to be
//      present in the lesson, and requires the lesson to say what the passage
//      does NOT settle.
//   2. THE YIELD CURVE SOLD AS A CLOCK, OR DISMISSED AS NOISE. An inversion
//      has preceded most US recessions in fifty years; it causes nothing, its
//      timing varies enormously, and it has been wrong. DR-0100 cuts both
//      ways: under-claiming a verified pattern fails truth exactly as
//      over-claiming an unverified one does, and the test refuses both.
//   3. INFLATION TURNED INTO A CONSPIRACY. "So they are doing it on purpose"
//      is refused in the lesson itself — not because intent never exists, but
//      because it ends the reader's thinking, and the arithmetic works
//      identically whether intended or not.
//   4. 2 KINGS 4 TURNED INTO A CAUTIONARY TALE ABOUT A SPENDTHRIFT. The text
//      says the husband FEARED THE LORD. And it must not become a grievance
//      either: Elisha neither denounces the creditor nor voids the debt, and
//      the instruction has two halves — pay thy debt, AND live of the rest.
//   5. A LIVE FIGURE QUOTED. No yield, no debt total, no rate. Same reason as
//      course one: a number printed in a lesson is wrong by the time it is
//      read.
//   6. AN ALTERED QUOTATION. Every span is re-fetched from the repository's
//      own KJV below rather than trusted from the author.
//
// AND WHAT THE PRE-FLIGHT CAUGHT BEFORE A LINE OF THIS REACHED THE REPOSITORY,
// recorded because it is the more useful half: lesson eight's quiz clipped
// Deuteronomy 23:20 to "...that the LORD thy God may bless thee..." — an
// ellipsis inside a quotation (DR-0459), in the one lesson whose entire
// subject is that people quote this passage in halves. It is now quoted whole,
// and the lesson says why.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BONDS_MODULES, BONDS_META, BONDS_SESSION_FLOW, BONDS_SESSION_MINUTES,
  BONDS_CARE_NOTE, BONDS_TUTOR_META, BONDS_INTEREST_TAG, BONDS_HELPER_TAG,
  buildBondsSchedule, bondsProgressSummary, exportBondsCurriculumMarkdown, bondsRefs,
} from '../lib/bonds-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { plainWordsFor } from '../lib/learn-plain-words.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
function verseText(book, ch, v) {
  const d = load(book); if (!d) return null;
  const chs = d.chapters;
  const c = Array.isArray(chs) ? chs[ch - 1] : chs[String(ch)];
  if (!c) return null;
  const vs = (c && c.verses) || c;
  const row = Array.isArray(vs) ? vs[v - 1] : vs[String(v)];
  return row == null ? null : (typeof row === 'string' ? row : row.text);
}

function readerTexts() {
  const out = [];
  const push = (w, t) => { if (typeof t === 'string' && t) out.push([w, t]); };
  push('meta.wordFirst', BONDS_META.wordFirst.frame);
  push('meta.blurb', BONDS_META.blurb);
  push('meta.tagline', BONDS_META.tagline);
  push('care', BONDS_CARE_NOTE);
  push('tutor.posture', BONDS_TUTOR_META.posture);
  push('tutor.blurb', BONDS_TUTOR_META.blurb);
  for (const m of BONDS_MODULES) {
    push(`${m.id}.bigIdea`, m.bigIdea);
    push(`${m.id}.inApp`, m.inApp);
    push(`${m.id}.anchor.theme`, m.anchor.theme);
    push(`${m.id}.lesson`, m.lesson);
    for (const b of ['teen', 'senior']) push(`${m.id}.levels.${b}`, m.levels[b]);
    (m.benefits || []).forEach((x, i) => push(`${m.id}.benefits[${i}]`, x));
    (m.stories || []).forEach((s, i) => push(`${m.id}.stories[${i}].body`, s.body));
    (m.quiz.questions || []).forEach((q, i) => {
      push(`${m.id}.quiz[${i}].q`, q.q);
      push(`${m.id}.quiz[${i}].explain`, q.explain);
      (q.options || []).forEach((o, j) => push(`${m.id}.quiz[${i}].options[${j}]`, o));
    });
    push(`${m.id}.facilitator.howToRun`, m.facilitator.howToRun);
    (m.facilitator.talkingPoints || []).forEach((x, i) => push(`${m.id}.tp[${i}]`, x));
    (m.facilitator.discussionPrompts || []).forEach((x, i) => push(`${m.id}.dp[${i}]`, x));
  }
  return out;
}

const TEXTS = readerTexts();
const ALL = TEXTS.map(([, t]) => t).join('\n');
const SPAN = /"([^"]{6,})"\s*\(([1-3]?\s?[A-Z][a-zA-Z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;

describe('the course is built and it is real', () => {
  it('carries eight lessons, each with the whole contract', () => {
    expect(BONDS_MODULES).toHaveLength(8);
    for (const m of BONDS_MODULES) {
      expect(m.id).toBeTruthy();
      expect(m.title.length, `${m.id} has no title`).toBeGreaterThan(10);
      expect(m.bigIdea.length, `${m.id} has no big idea`).toBeGreaterThan(200);
      expect(m.inApp.length, `${m.id} has no hands-on step`).toBeGreaterThan(100);
      expect(m.anchor.ref, `${m.id} has no anchor reference`).toBeTruthy();
      expect(m.anchor.theme.length, `${m.id} has no anchor theme`).toBeGreaterThan(100);
      expect(m.lesson.length, `${m.id} has no adult lesson`).toBeGreaterThan(1500);
      expect(m.benefits, `${m.id} does not carry six benefits`).toHaveLength(6);
      expect(m.stories, `${m.id} does not carry two stories`).toHaveLength(2);
      expect(m.quiz.questions, `${m.id} does not carry six questions`).toHaveLength(6);
      expect(m.facilitator.talkingPoints, `${m.id} does not carry ten talking points`).toHaveLength(10);
    }
  });

  it('carries teen and senior on every lesson from the first commit (DR-0509)', () => {
    for (const m of BONDS_MODULES) {
      for (const band of ['teen', 'senior']) {
        expect(m.levels[band], `${m.id} has no ${band} band`).toBeTruthy();
        expect(m.levels[band].length, `${m.id}.${band} is a stub`).toBeGreaterThan(900);
      }
      expect(
        m.levels.senior.length,
        `${m.id}: the senior band is not longer than the teen band`,
      ).toBeGreaterThan(m.levels.teen.length);
    }
  });

  it('every quiz answer index points at a real option', () => {
    for (const m of BONDS_MODULES) {
      m.quiz.questions.forEach((q, i) => {
        expect(q.options.length, `${m.id} q${i} has too few options`).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer], `${m.id} q${i} answers nothing`).toBeTruthy();
        expect(q.explain.length, `${m.id} q${i} explains nothing`).toBeGreaterThan(60);
      });
    }
  });

  it('builds a schedule, a progress summary and an export without throwing', () => {
    expect(buildBondsSchedule(null)).toHaveLength(8);
    expect(bondsProgressSummary({})).toBeTruthy();
    expect(exportBondsCurriculumMarkdown(null).length).toBeGreaterThan(2000);
    expect(BONDS_SESSION_MINUTES).toBe(BONDS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
  });

  it('is REGISTERED in the Stock Market department (built ⇒ surfaced)', () => {
    const row = LEARN_CATALOG.find((e) => e.key === 'bonds');
    expect(row, 'the course is built but not surfaced').toBeTruthy();
    expect(row.meta.category).toBe('Stock Market');
    expect(row.buildScheduleRows()).toHaveLength(8);
    expect(row.interestTag).toBe(BONDS_INTEREST_TAG);
    expect(row.helperTag).toBe(BONDS_HELPER_TAG);
  });

  it('the department now has more than one course in it', () => {
    // A department of one is a shelf with a grand name. This pins that the
    // second course actually joined the first rather than replacing it.
    const dept = LEARN_CATALOG.filter((e) => e.meta.category === 'Stock Market').map((e) => e.key);
    expect(dept).toContain('stocks');
    expect(dept).toContain('bonds');
  });

  it('is reachable by the plain words a person would actually type (DR-0519)', () => {
    const words = plainWordsFor('bonds');
    expect(words.length).toBeGreaterThanOrEqual(5);
    const title = BONDS_META.title.toLowerCase();
    expect(
      words.some((w) => !title.includes(w)),
      'every plain word is already in the title',
    ).toBe(true);
  });
});

describe('EVERY QUOTED SPAN IS THE VERSE — fetched, not trusted', () => {
  it('the walk is real: it finds spans to check', () => {
    expect([...ALL.matchAll(SPAN)].length).toBeGreaterThan(45);
  });

  it('every span resolves verbatim against this repository’s own KJV', () => {
    const faults = [];
    for (const [where, text] of TEXTS) {
      for (const m of text.matchAll(SPAN)) {
        const [, span, book, ch, v1, v2] = m;
        let full = '';
        for (let v = Number(v1); v <= Number(v2 || v1); v++) {
          const t = verseText(book, Number(ch), v);
          if (t == null) { full = null; break; }
          full += (full ? ' ' : '') + t;
        }
        if (full == null) { faults.push(`${where}: ${book} ${ch}:${v1} does not resolve`); continue; }
        if (!norm(full).includes(norm(span))) faults.push(`${where}: not ${book} ${ch}:${v1} — "${span.slice(0, 70)}"`);
      }
    }
    expect(faults).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an altered quotation is reported', () => {
    const bent = 'He wrote "The wicked borroweth, and payeth it not again" (Psalms 37:21).';
    const m = [...bent.matchAll(SPAN)][0];
    expect(m, 'the pattern did not even match — the check would be vacuous').toBeTruthy();
    expect(norm(verseText('Psalms', 37, 21)).includes(norm(m[1]))).toBe(false);
  });

  it('no ellipsis inside any quotation anywhere in the course (DR-0459)', () => {
    // This one caught a real fault in the draft: lesson eight clipped
    // Deuteronomy 23:20 to "...may bless thee...", in the lesson about people
    // quoting that passage in halves.
    const faults = [];
    for (const [where, text] of TEXTS) {
      for (const m of text.matchAll(/"([^"]{6,})"/g)) {
        if (/\.\.\.|…/.test(m[1])) faults.push(`${where}: ${m[1].slice(0, 60)}`);
      }
    }
    expect(faults).toEqual([]);
  });

  it('every anchor reference this course declares actually resolves', () => {
    for (const ref of bondsRefs()) {
      const m = /^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)$/.exec(ref.trim());
      expect(m, `unparseable reference: ${ref}`).toBeTruthy();
      expect(verseText(m[1], Number(m[2]), Number(m[3])), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('THE LINES THIS COURSE HOLDS', () => {
  it('teaches Deuteronomy 23:19 AND 23:20 whole, in the same lesson', () => {
    const l8 = BONDS_MODULES[7];
    const body = l8.lesson + l8.levels.teen + l8.levels.senior;
    // both clauses, from the text
    expect(body).toContain('Thou shalt not lend upon usury to thy brother');
    expect(body).toContain('Unto a stranger thou mayest lend upon usury');
    // and the blessing is not clipped off the end
    expect(l8.lesson).toContain('in the land whither thou goest to possess it');
    // both mirror-image failures are NAMED
    expect(/blanket ban|general prohibition/i.test(body)).toBe(true);
    expect(/unbounded licence|permission with no limits/i.test(body)).toBe(true);
    expect(/stopping where the stopping is convenient|stopping where it suits you/i.test(body)).toBe(true);
  });

  it('says what the usury passage does NOT settle', () => {
    const l8 = BONDS_MODULES[7];
    expect(/does not settle|DOES NOT SETTLE|does not give you a theory/i.test(l8.lesson + l8.levels.teen)).toBe(true);
    expect(/sets no rate|does not set a rate|It does not set a rate/i.test(l8.lesson + l8.levels.teen)).toBe(true);
    // and it refuses the opposite failure too
    expect(/explaining the rule away|explaining it away/i.test(l8.lesson)).toBe(true);
  });

  it('holds a STRONG pattern and a WEAK mechanism on the yield curve (DR-0100)', () => {
    const l6 = BONDS_MODULES[5];
    const body = l6.lesson + l6.levels.teen + l6.levels.senior;
    // stated without hedging
    expect(/preceded most (?:United States|US) recessions/i.test(body)).toBe(true);
    expect(/some (?:studies|research) suggests? that an inversion/i.test(body)).toBe(false);
    // and not sold as a clock
    expect(/not a mechanism|NOT A MECHANISM/i.test(body)).toBe(true);
    expect(/has been wrong/i.test(body)).toBe(true);
    // the sentence that makes both refusals one rule
    expect(l6.lesson).toMatch(/UNDER-CLAIMING A VERIFIED PATTERN IS AS MUCH A FAILURE OF TRUTH/);
  });

  it('refuses the conspiracy sentence on inflation, and says who gains anyway', () => {
    const l7 = BONDS_MODULES[6];
    expect(l7.lesson).toMatch(/doing it on purpose/);
    expect(/ENDS a person’s thinking|ends your thinking|ends the learner/i.test(l7.lesson + BONDS_TUTOR_META.posture)).toBe(true);
    // who gains is named plainly rather than darkly — including the borrower
    // the reader is most likely to be
    expect(l7.lesson).toMatch(/THE BORROWER GAINS/);
    expect(/fixed mortgage/i.test(l7.lesson)).toBe(true);
    // and the real-return discipline is the take-home
    expect(/REAL return|real return/.test(l7.lesson)).toBe(true);
  });

  it('never lets 2 Kings 4 become a tale about a spendthrift, or a grievance', () => {
    const l5 = BONDS_MODULES[4];
    const body = l5.lesson + l5.levels.teen + l5.levels.senior;
    // the text's own clause, kept
    expect(body).toContain('thy servant did fear the LORD');
    expect(/not a cautionary tale|NOT A CAUTIONARY TALE|not a story about a fool/i.test(body)).toBe(true);
    // Elisha neither denounces nor voids
    expect(/does not denounce/i.test(body)).toBe(true);
    expect(/does not declare the (?:debt|obligation) void|never speaks to the creditor|never addresses him/i.test(body)).toBe(true);
    // BOTH halves of 4:7
    expect(l5.lesson).toContain('pay thy debt, and live thou and thy children of the rest');
    expect(/only the first half|carries only the first half/i.test(l5.lesson)).toBe(true);
  });

  it('teaches the one mechanism that makes the rest legible', () => {
    const l2 = BONDS_MODULES[1];
    expect(l2.lesson).toMatch(/THE PROMISE CANNOT CHANGE|promise cannot move/i);
    expect(l2.lesson).toMatch(/OPPOSITE DIRECTIONS/);
    // the take-home distinction
    expect(l2.lesson).toMatch(/SAFETY FROM DEFAULT AND STABILITY OF PRICE ARE TWO DIFFERENT PROPERTIES/);
  });

  it('teaches the currency question that governs sovereign debt', () => {
    const l4 = BONDS_MODULES[3];
    expect(l4.lesson).toMatch(/in whose currency is the debt denominated/i);
    // and refuses the misreading in the same breath
    expect(l4.lesson).toMatch(/WILL NOT LET THAT BE READ AS "SUCH DEBT IS FREE"|THE RISK HAS MOVED, NOT VANISHED/);
  });

  it('quotes no live figure anywhere', () => {
    expect(/(?:yield|rate|debt)\s+(?:is|was|stands at|now at)\s+[\d.]+\s*(?:per cent|%)/i.test(ALL)).toBe(false);
    expect(/national debt (?:is|of) [\d$£]/i.test(ALL)).toBe(false);
  });

  it('names no bond, fund, issuer or country as an opportunity', () => {
    expect(BONDS_CARE_NOTE).toMatch(/no lesson names a bond, a fund, an issuer or a country as an opportunity/i);
    expect(BONDS_TUTOR_META.blurb).toMatch(/no bond, fund, issuer or country is named here as an opportunity/i);
  });

  it('the tutor posture carries all five limits a teacher could break', () => {
    const p = BONDS_TUTOR_META.posture;
    expect(p).toMatch(/taught WHOLE, both clauses/i);
    expect(p).toMatch(/never quote a live figure/i);
    expect(p).toMatch(/STRONG pattern and a WEAK mechanism/i);
    expect(p).toMatch(/doing it on purpose/i);
    expect(p).toMatch(/never let it become a cautionary tale about a spendthrift/i);
    expect(p).toMatch(/lesson three and lesson five/i);
  });

  it('carries the care note, and it refuses to be advice', () => {
    expect(BONDS_META.care).toBe(BONDS_CARE_NOTE);
    expect(BONDS_CARE_NOTE).toMatch(/not financial or investment advice/i);
    expect(BONDS_CARE_NOTE).toMatch(/somebody qualified|someone qualified/i);
  });

  it('no two lessons rest on the same passage, and none collides with course one', async () => {
    // Same judgement as the Stocks course: chapter-level for narrative books,
    // verse-level for Proverbs and Psalms, which are collections of
    // independent sayings sharing nothing but a chapter number.
    const COLLECTIONS = new Set(['Proverbs', 'Psalms']);
    const keyOf = (ref) => {
      const book = /^([1-3]?\s?[A-Za-z ]+?)\s+\d+:/.exec(ref.trim())[1].trim();
      return COLLECTIONS.has(book) ? ref.trim() : ref.trim().replace(/:(\d+)(-\d+)?$/, '');
    };
    const mine = BONDS_MODULES.map((m) => keyOf(m.anchor.ref));
    expect(new Set(mine).size, `a passage anchors two lessons: ${mine.join(', ')}`).toBe(mine.length);
    // and the department does not teach one passage twice under two courses
    const { STOCKS_MODULES } = await import('../lib/stocks-course.js');
    const theirs = new Set(STOCKS_MODULES.map((m) => keyOf(m.anchor.ref)));
    for (const k of mine) {
      expect(theirs.has(k), `${k} already anchors a lesson in the Stocks course`).toBe(false);
    }
  });
});
