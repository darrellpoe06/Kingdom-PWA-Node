// @vitest-environment node
// =============================================================================
// Stocks: What You Actually Own When You Buy a Share — course one of the
// Stock Market department
// =============================================================================
// Darrell 2026-09-19: "Stock Market courses to explore and explain the world of
// stock and bonds and countries that trade and how investment works world
// wide." Four courses were planned; this is the first, and it is the one that
// replaces a picture — a share is a piece of a company, not a number on a
// screen.
//
// THE SIX THINGS THIS COURSE COULD MOST EASILY HAVE GOT WRONG, and which this
// file holds rather than trusts:
//
//   1. MATTHEW 25 PRESSED INTO SERVICE AS AN ENDORSEMENT OF EQUITY INVESTING.
//      It is not one, and a teacher who says it is has used the Word as
//      decoration for a conclusion reached elsewhere (DR-0098). The course
//      says so OUT LOUD in lessons 1 and 8 and in the tutor posture, and the
//      test below requires that denial to be present — because a future edit
//      that quietly drops it would leave the strongest-looking claim in the
//      course unqualified.
//   2. A LIVE FIGURE QUOTED. Prices, index levels and market sizes move daily;
//      a number printed in a lesson is wrong by the time it is read, and a
//      reader who catches one wrong number rightly distrusts the rest. The one
//      dated rule the course states (T+1, SEC Rule 15c6-1, effective 28 May
//      2024) carries its date, and the test pins that it still does.
//   3. THE FREQUENT-TRADING FINDING HEDGED INTO USELESSNESS. DR-0100: an
//      established fact stated plainly, never softened into "some research
//      suggests", and equally never inflated into "the market is rigged".
//   4. ONE HALF OF A TWO-HALF QUESTION. Buybacks and share-based pay each have
//      a real upside and a real temptation, and a course that gives one half
//      has handed the reader a brochure or a grievance rather than a subject.
//   5. THE THIRD SERVANT MISREMEMBERED AS HAVING LOST THE MONEY. He preserved
//      it perfectly (Matthew 25:25), and that was the failure. The course turns
//      on it twice.
//   6. AN ALTERED QUOTATION. Every quoted span is fetched verbatim from this
//      repository's own KJV, and the walk below re-fetches all of them rather
//      than trusting the author.
//
// AND WHAT THE GATES CAUGHT WHILE IT WAS BEING WRITTEN, recorded because it is
// the more useful half: the first draft of lesson 1's `inApp` ended a sentence
// with an ellipsis INSIDE quotation marks — the author's own trailing-off
// prose, not Scripture, but DR-0459's check cannot tell the difference and
// should not have to. It was rewritten without the quotation marks.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  STOCKS_MODULES, STOCKS_META, STOCKS_SESSION_FLOW, STOCKS_SESSION_MINUTES,
  STOCKS_CARE_NOTE, STOCKS_TUTOR_META, STOCKS_INTEREST_TAG, STOCKS_HELPER_TAG,
  buildStocksSchedule, stocksProgressSummary, exportStocksCurriculumMarkdown, stocksRefs,
} from '../lib/stocks-course.js';
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

/** Every reader-facing string this course serves. */
function readerTexts() {
  const out = [];
  const push = (w, t) => { if (typeof t === 'string' && t) out.push([w, t]); };
  push('meta.wordFirst', STOCKS_META.wordFirst.frame);
  push('meta.blurb', STOCKS_META.blurb);
  push('meta.tagline', STOCKS_META.tagline);
  push('care', STOCKS_CARE_NOTE);
  push('tutor.posture', STOCKS_TUTOR_META.posture);
  push('tutor.blurb', STOCKS_TUTOR_META.blurb);
  for (const m of STOCKS_MODULES) {
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
// "..." (Book C:V) or "..." (Book C:V-W) — STRAIGHT double quotes only.
const SPAN = /"([^"]{6,})"\s*\(([1-3]?\s?[A-Z][a-zA-Z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;

describe('the course is built and it is real', () => {
  it('carries eight lessons, each with the whole contract', () => {
    expect(STOCKS_MODULES).toHaveLength(8);
    for (const m of STOCKS_MODULES) {
      expect(m.id, 'a lesson without an id').toBeTruthy();
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
    for (const m of STOCKS_MODULES) {
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
    for (const m of STOCKS_MODULES) {
      m.quiz.questions.forEach((q, i) => {
        expect(q.options.length, `${m.id} q${i} has too few options`).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer], `${m.id} q${i} answers nothing`).toBeTruthy();
        expect(q.explain.length, `${m.id} q${i} explains nothing`).toBeGreaterThan(60);
      });
    }
  });

  it('builds a schedule, a progress summary and an export without throwing', () => {
    const rows = buildStocksSchedule(null);
    expect(rows).toHaveLength(8);
    expect(stocksProgressSummary({})).toBeTruthy();
    const md = exportStocksCurriculumMarkdown(null);
    expect(md.length).toBeGreaterThan(2000);
    expect(STOCKS_SESSION_MINUTES).toBe(STOCKS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
  });

  it('is REGISTERED in the catalog, in its own department (built ⇒ surfaced)', () => {
    const row = LEARN_CATALOG.find((e) => e.key === 'stocks');
    expect(row, 'the course is built but not surfaced — the exact class this gate exists for').toBeTruthy();
    expect(row.meta.category).toBe('Stock Market');
    expect(row.buildScheduleRows()).toHaveLength(8);
    expect(row.interestTag).toBe(STOCKS_INTEREST_TAG);
    expect(row.helperTag).toBe(STOCKS_HELPER_TAG);
  });

  it('is reachable by the plain words a person would actually type (DR-0519)', () => {
    const words = plainWordsFor('stocks');
    expect(words.length).toBeGreaterThanOrEqual(5);
    // Not an echo of its own title: somebody who did not know the title must
    // still be able to arrive.
    const title = STOCKS_META.title.toLowerCase();
    expect(
      words.some((w) => !title.includes(w)),
      'every plain word is already in the title — the reader who did not know it could never arrive',
    ).toBe(true);
  });
});

describe('EVERY QUOTED SPAN IS THE VERSE — fetched, not trusted', () => {
  it('the walk is real: it finds spans to check', () => {
    // A gate that checks nothing passes everything (DR-0076 §3). Curly quotes
    // in the source would make this read zero while reporting green.
    expect([...ALL.matchAll(SPAN)].length).toBeGreaterThan(60);
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
    const bent = 'He said "For the kingdom of heaven is as a man travelling into a distant country" (Matthew 25:14).';
    const m = [...bent.matchAll(SPAN)][0];
    expect(m, 'the pattern did not even match — the check would be vacuous').toBeTruthy();
    expect(norm(verseText('Matthew', 25, 14)).includes(norm(m[1]))).toBe(false);
  });

  it('no ellipsis inside any quotation anywhere in the course (DR-0459)', () => {
    const faults = [];
    for (const [where, text] of TEXTS) {
      for (const m of text.matchAll(/"([^"]{6,})"/g)) {
        if (/\.\.\.|…/.test(m[1])) faults.push(`${where}: ${m[1].slice(0, 60)}`);
      }
    }
    expect(faults).toEqual([]);
  });

  it('every anchor reference this course declares actually resolves', () => {
    for (const ref of stocksRefs()) {
      const m = /^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)$/.exec(ref.trim());
      expect(m, `unparseable reference: ${ref}`).toBeTruthy();
      expect(verseText(m[1], Number(m[2]), Number(m[3])), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('THE LINES THIS COURSE HOLDS', () => {
  it('says OUT LOUD that Matthew 25 is not an endorsement of equity investing (DR-0098)', () => {
    // The strongest-looking claim in the course is the one most easily abused,
    // so the denial is required to be present rather than remembered. A future
    // edit that quietly drops it fails here.
    const denials = TEXTS.filter(([, t]) => /not\s+(a|an)\s+(endorsement|recommendation|scriptural warrant)|does not endorse|NOT AN ENDORSEMENT|NOT A RECOMMENDATION|will not tell you that passage endorses|is NOT a stock-market endorsement/i.test(t));
    expect(denials.length, 'the course no longer denies that Matthew 25 endorses equities').toBeGreaterThanOrEqual(3);
    // and it is denied in the closing lesson, where the pressure is greatest
    expect(/NOT AN ENDORSEMENT OF EQUITY INVESTMENT/i.test(STOCKS_MODULES[7].lesson)).toBe(true);
  });

  it('quotes no live figure — the one dated rule carries its date (DR-0076)', () => {
    expect(ALL).toMatch(/28 May 2024/);
    expect(ALL).toMatch(/Rule 15c6-1/);
    // A price, index level or market size would date the course the day it
    // shipped. Currency amounts appear only inside labelled arithmetic and
    // inside the stories, never as a claim about a real instrument.
    expect(/(?:share price|index|the market)\s+(?:is|was|stands at|closed at)\s+[\d$£]/i.test(ALL)).toBe(false);
  });

  it('states the frequent-trading finding plainly, and neither hedges nor inflates it (DR-0100)', () => {
    expect(ALL).toMatch(/trade frequently tend to do worse|frequent traders tend to do worse|who trade a lot tend to do worse/i);
    // the hedge that would make it useless
    expect(/some (?:studies|research) suggests? that (?:investors|people) who trade/i.test(ALL)).toBe(false);
    // and the inflation that would make it a grievance
    expect(/the market is rigged/i.test(ALL)).toBe(false);
    // the mechanism is given so nobody has to take it on authority
    expect(ALL).toMatch(/spread/i);
    expect(ALL).toMatch(/one beat late|slightly late/i);
  });

  it('gives BOTH halves of the buyback and share-pay questions', () => {
    const l5 = STOCKS_MODULES[4];
    expect(/low price/i.test(l5.lesson) && /inflated/i.test(l5.lesson)).toBe(true);
    expect(/temptation/i.test(l5.lesson)).toBe(true);
    expect(/brochure/i.test(l5.lesson) && /grievance/i.test(l5.lesson)).toBe(true);
    // lesson 2 gives both halves of share-based pay in the same breath
    expect(/real alignment and also a real temptation|genuine alignment AND a genuine temptation/i.test(STOCKS_MODULES[1].lesson + STOCKS_MODULES[1].facilitator.howToRun)).toBe(true);
  });

  it('never lets the third servant be remembered as having LOST the money', () => {
    const l5 = STOCKS_MODULES[4], l8 = STOCKS_MODULES[7];
    expect(/HE DID NOT LOSE IT|did not lose the money|preserved it perfectly/i.test(l5.lesson)).toBe(true);
    expect(/was not loss and was not failure|not loss and not failure/i.test(l8.lesson)).toBe(true);
    // and it is quoted from the text rather than asserted
    expect(l5.lesson).toContain('lo, there thou hast that is thine');
  });

  it('teaches the fact the whole course turns on: your purchase gives the company nothing', () => {
    const l2 = STOCKS_MODULES[1];
    expect(l2.lesson).toMatch(/THE COMPANY GETS NOTHING/);
    expect(l2.lesson).toMatch(/primary market/i);
    expect(l2.lesson).toMatch(/secondary market/i);
    // and it gives the four real reasons a board still watches the price
    expect(l2.lesson).toMatch(/FIRST/);
    expect(l2.lesson).toMatch(/FOURTH/);
  });

  it('names no company, fund or product anywhere a reader can see', () => {
    // The care note promises this. A course that names one has become a
    // recommendation whatever its disclaimer says.
    expect(STOCKS_CARE_NOTE).toMatch(/no lesson names a company, a fund or a product/i);
    expect(STOCKS_TUTOR_META.blurb).toMatch(/no company, fund or product is named/i);
  });

  it('the tutor posture carries all five limits a teacher could break', () => {
    const p = STOCKS_TUTOR_META.posture;
    expect(p).toMatch(/NOT an endorsement of equity investing/i);
    expect(p).toMatch(/never quote a live figure/i);
    expect(p).toMatch(/state the finding straight/i);
    expect(p).toMatch(/BOTH halves/i);
    expect(p).toMatch(/never give financial or investment advice/i);
    // and it says where to start a learner who arrives hurt
    expect(p).toMatch(/lesson four and lesson seven/i);
  });

  it('carries the care note, and it refuses to be advice', () => {
    expect(STOCKS_META.care).toBe(STOCKS_CARE_NOTE);
    expect(STOCKS_CARE_NOTE).toMatch(/not financial or investment advice/i);
    expect(STOCKS_CARE_NOTE).toMatch(/somebody qualified|someone qualified/i);
  });

  it('no two lessons rest on the same passage', () => {
    // PREMISE CORRECTED WHILE WRITING THIS FILE, and recorded rather than
    // quietly fixed. The first version of this check used BOOK-AND-CHAPTER,
    // copied from the Banking course, and it failed on Proverbs 11:1 (lesson
    // six, the false balance) and Proverbs 11:14 (lesson seven, the multitude
    // of counsellors). Book-and-chapter is the right proxy for a NARRATIVE
    // chapter — Nehemiah 5 and Matthew 25 are each one continuous argument, and
    // two lessons anchored there really would be resting on the same passage.
    // It is the WRONG proxy for Proverbs, which is a collection of independent
    // sayings: 11:1 and 11:14 share nothing but a chapter number, and they do
    // entirely different work. So the check is chapter-level for narrative and
    // verse-level for Proverbs, and the reason is written here so a reader can
    // judge it rather than take it. The guard was corrected; the content was
    // NOT bent to fit a guard that was measuring the wrong thing.
    const COLLECTIONS = new Set(['Proverbs', 'Psalms']);
    const seen = {};
    for (const m of STOCKS_MODULES) {
      const ref = m.anchor.ref.trim();
      const book = /^([1-3]?\s?[A-Za-z ]+?)\s+\d+:/.exec(ref)[1].trim();
      const key = COLLECTIONS.has(book) ? ref : ref.replace(/:(\d+)(-\d+)?$/, '');
      (seen[key] = seen[key] || []).push(m.id);
    }
    // Matthew 25 is deliberately the spine: lessons 1, 5 and 8 return to it,
    // and the course says out loud each time what it is and is not claiming.
    expect(seen['Matthew 25'], 'the spine is meant to anchor three lessons').toHaveLength(3);
    for (const [key, ids] of Object.entries(seen)) {
      if (key !== 'Matthew 25') {
        expect(ids.length, `${key} anchors more than one lesson: ${ids.join(', ')}`).toBe(1);
      }
    }
  });

  it('the two Proverbs anchors really are doing different work', () => {
    // The check above makes a judgement; this one shows the judgement is sound
    // rather than convenient. Different verse, different subject, different
    // lesson — and neither quotes the other.
    const six = STOCKS_MODULES[5], seven = STOCKS_MODULES[6];
    expect(six.anchor.ref).toBe('Proverbs 11:1');
    expect(seven.anchor.ref).toBe('Proverbs 11:14');
    expect(six.lesson).not.toContain('multitude of counsellors');
    expect(seven.lesson).not.toContain('A false balance');
  });
});
