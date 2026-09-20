// @vitest-environment node
// =============================================================================
// How Investing Actually Works — course four of the Stock Market department
// =============================================================================
// The last quarter of Darrell's sentence, and the hardest course in the
// department to write honestly. Courses one to three teach MACHINERY: what a
// share is, what a bond is, what a deficit is. A reader handed those is
// strictly better off. THIS one is about a DECISION, and a decision is exactly
// where teaching turns into telling somebody what to do with their money
// without anybody noticing the step.
//
// So the tests below are weighted differently from its three siblings. Most of
// them are REFUSALS. What this course must not do is more load-bearing than
// what it must say, because everything it must say is safe and every way it
// could fail is a way of quietly becoming a sales document.
//
// THE SEVEN THINGS THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. DRIFTING INTO ADVICE. One named product, one "most people should", one
//      allocation, and the course has stopped teaching. Pinned by an explicit
//      refusal in the care note and the tutor blurb AND by the shape of the
//      lessons, which end on questions the reader takes away rather than
//      answers this house supplies.
//   2. FLATTENING RISK TO ONE THING. The word covers four phenomena that
//      behave completely differently. The test requires all four, separately,
//      and requires the fourth to be attributed to the HOUSEHOLD rather than
//      the market -- which is the one almost nobody lists and the one through
//      which nearly every avoidable harm actually arrives.
//   3. THE COMPOUNDING CURVE AS A FORECAST. Lesson three does the arithmetic
//      in the open with its assumption labelled. The test pins the assumption
//      language AND pins the bright line the lesson states: an illustration of
//      what a rate does over a period is arithmetic; the same illustration
//      with a purchasable name beside it is a sales document.
//   4. SELLING DIVERSIFICATION AS SAFETY. Ecclesiastes 11:2 gives the practice
//      and its limit in one verse, and the ground it gives is FOR THOU KNOWEST
//      NOT -- an admission of ignorance, not a promise. The test requires the
//      benefit and the limit in the same lesson, and requires the course to
//      say that a reader who leaves feeling SAFE has been sold something.
//   5. THE COST LESSON BECOMING A SLOGAN. "Cheapest is best" is one
//      unexamined rule swapped for another. The test requires the
//      qualification to be present, in the course's own voice.
//   6. LEAVING THE READER CYNICAL. Lesson six says plainly that nobody knows
//      what is coming. A course that stopped there would have disarmed a
//      person and handed them nothing. The test requires the four answerable
//      questions to be present as the reply to the unanswerable one.
//   7. THE LAST LESSON BECOMING A REBUKE. "Enough" taught badly is a room
//      congratulating itself on not being greedy. Proverbs 30:8 refuses BOTH
//      ends for the same non-financial reason, and the test requires the
//      course to refuse to hand anybody a number.
//
// AND WHAT THE PRE-FLIGHT CAUGHT, recorded because it is the more useful half:
// two arithmetic errors of my own and one truncated quotation, all three found
// before a line reached the repository. They are written up in DR-0554.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  INVESTING_MODULES, INVESTING_META, INVESTING_SESSION_FLOW, INVESTING_SESSION_MINUTES,
  INVESTING_CARE_NOTE, INVESTING_TUTOR_META, INVESTING_INTEREST_TAG, INVESTING_HELPER_TAG,
  buildInvestingSchedule, investingProgressSummary, exportInvestingCurriculumMarkdown,
  investingRefs,
} from '../lib/investing-course.js';
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
  push('meta.wordFirst', INVESTING_META.wordFirst.frame);
  push('meta.blurb', INVESTING_META.blurb);
  push('meta.tagline', INVESTING_META.tagline);
  push('care', INVESTING_CARE_NOTE);
  push('tutor.posture', INVESTING_TUTOR_META.posture);
  push('tutor.blurb', INVESTING_TUTOR_META.blurb);
  for (const m of INVESTING_MODULES) {
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
// "..." (Book C:V) and the two multi-verse forms this course uses: (Book C:V, W)
// and (Book C:V-W). Both are cited forms in the lessons, so both must be walked
// or the check silently skips the longest quotations in the course.
const SPAN = /"([^"]{6,})"\s*\(([1-3]?\s?[A-Z][a-zA-Z]+)\s+(\d+):(\d+)(?:\s*[,-]\s*(\d+))?(?:\s*,\s*(\d+))?\)/g;
const whole = (m) => m.lesson + m.levels.teen + m.levels.senior;
const byId = (frag) => INVESTING_MODULES.find((m) => m.id.startsWith(frag));

describe('the course is built and it is real', () => {
  it('carries eight lessons, each with the whole contract', () => {
    expect(INVESTING_MODULES).toHaveLength(8);
    for (const m of INVESTING_MODULES) {
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
    for (const m of INVESTING_MODULES) {
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
    for (const m of INVESTING_MODULES) {
      m.quiz.questions.forEach((q, i) => {
        expect(q.options.length, `${m.id} q${i} has too few options`).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer], `${m.id} q${i} answers nothing`).toBeTruthy();
        expect(q.explain.length, `${m.id} q${i} explains nothing`).toBeGreaterThan(60);
      });
    }
  });

  it('builds a schedule, a progress summary and an export without throwing', () => {
    expect(buildInvestingSchedule(null)).toHaveLength(8);
    expect(investingProgressSummary({})).toBeTruthy();
    expect(exportInvestingCurriculumMarkdown(null).length).toBeGreaterThan(2000);
    expect(INVESTING_SESSION_MINUTES).toBe(INVESTING_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
  });

  it('is REGISTERED in the Stock Market department (built ⇒ surfaced)', () => {
    const row = LEARN_CATALOG.find((e) => e.key === 'investing');
    expect(row, 'the course is built but not surfaced').toBeTruthy();
    expect(row.meta.category).toBe('Stock Market');
    expect(row.buildScheduleRows()).toHaveLength(8);
    expect(row.interestTag).toBe(INVESTING_INTEREST_TAG);
    expect(row.helperTag).toBe(INVESTING_HELPER_TAG);
  });

  it('completes the department — all four courses of the sentence are present', () => {
    // Darrell named four in one breath: stock, bonds, countries that trade,
    // and how investment works world wide. This pins that the fourth actually
    // joined the other three rather than replacing any of them.
    const dept = LEARN_CATALOG.filter((e) => e.meta.category === 'Stock Market').map((e) => e.key);
    expect(dept).toContain('stocks');
    expect(dept).toContain('bonds');
    expect(dept).toContain('world-market');
    expect(dept).toContain('investing');
  });

  it('carries no text inherited from a sibling course', () => {
    // The World Market course shipped a draft whose tag read '[Bonds]' and
    // whose entire tutor posture was the Bonds posture, because it had been
    // assembled by renaming identifiers and a rename does not touch strings.
    // This file was written fresh for that reason, and the guard stays.
    const p = INVESTING_TUTOR_META.posture + INVESTING_TUTOR_META.blurb + INVESTING_CARE_NOTE;
    expect(INVESTING_INTEREST_TAG).toBe('[Investing]');
    expect(INVESTING_HELPER_TAG).toBe('[Investing helper]');
    expect(p).not.toMatch(/yield curve/i);
    expect(p).not.toMatch(/trade deficit/i);
    expect(p).not.toMatch(/Deuteronomy 23/);
  });

  it('is reachable by the plain words a person would actually type (DR-0519)', () => {
    const words = plainWordsFor('investing');
    expect(words.length).toBeGreaterThanOrEqual(5);
    const title = INVESTING_META.title.toLowerCase();
    expect(
      words.some((w) => !title.includes(w)),
      'every plain word is already in the title',
    ).toBe(true);
  });
});

describe('EVERY QUOTED SPAN IS THE VERSE — fetched, not trusted', () => {
  it('the walk is real: it finds spans to check', () => {
    expect([...ALL.matchAll(SPAN)].length).toBeGreaterThan(40);
  });

  it('every span resolves verbatim against this repository’s own KJV', () => {
    const faults = [];
    for (const [where, text] of TEXTS) {
      for (const m of text.matchAll(SPAN)) {
        const [, span, book, ch, v1, v2, v3] = m;
        const last = Number(v3 || v2 || v1);
        let full = '';
        for (let v = Number(v1); v <= last; v++) {
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

  it('PROVEN-TO-CATCH: a quotation truncated at a colon is reported', () => {
    // This is the exact fault the pre-flight found in this course. Luke 16:10
    // reads "...faithful also in much: and he that is unjust...", and the draft
    // teen band closed the quotation with a FULL STOP after "much" — a
    // truncation wearing the clothes of a complete sentence. The words are all
    // present in the verse; the punctuation is what makes it a misquotation,
    // and a check that normalised punctuation away would have passed it.
    const bent = 'He said "He that is faithful in that which is least is faithful also in much." (Luke 16:10)';
    const m = [...bent.matchAll(SPAN)][0];
    expect(m, 'the pattern did not match — the check would be vacuous').toBeTruthy();
    expect(norm(verseText('Luke', 16, 10)).includes(norm(m[1]))).toBe(false);
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
    for (const ref of investingRefs()) {
      const m = /^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)$/.exec(ref.trim());
      expect(m, `unparseable reference: ${ref}`).toBeTruthy();
      expect(verseText(m[1], Number(m[2]), Number(m[3])), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('THE REFUSALS — what this course must never do', () => {
  it('gives no advice, names no product, and says so in its own voice', () => {
    expect(INVESTING_CARE_NOTE).toMatch(/not financial advice/i);
    expect(INVESTING_CARE_NOTE).toMatch(/names no product, fund, company, platform or strategy/i);
    expect(INVESTING_CARE_NOTE).toMatch(/recommends no allocation/i);
    expect(INVESTING_CARE_NOTE).toMatch(/makes no forecast/i);
    expect(INVESTING_META.care).toBe(INVESTING_CARE_NOTE);
    expect(INVESTING_TUTOR_META.posture).toMatch(/NEVER GIVE ADVICE/);
  });

  // A refusal guard has to distinguish USE from MENTION, and the first draft of
  // the two below did not. Both fired on this course, and all three hits were
  // the course refusing the very thing being searched for: the tutor posture
  // instructs a teacher never to say what "most people should" do, and a quiz
  // lists 'What returns will be' as a WRONG option the reader is meant to
  // reject. A guard that cannot tell a prohibition from a violation, or a
  // distractor from a claim, fires on correct content — which is the failure
  // these guards exist to prevent, committed by the guard.
  //
  // So each is narrowed on a stated principle, and each is then shown to still
  // catch the real thing. Narrowing without that proof would be hollowing the
  // check out (DR-0076 §3).
  //
  // PRINCIPLE ONE: strip quoted spans before looking for advice. Naming a
  // forbidden phrase in quotation marks in order to forbid it is a mention.
  const unquoted = (t) => String(t).replace(/"[^"]*"/g, ' ');
  // PRINCIPLE TWO: a wrong quiz option is content the reader is asked to
  // REJECT, so it is not the course speaking. Prose is.
  const PROSE = TEXTS.filter(([w]) => !/\.options\[/.test(w)).map(([, t]) => t).join('\n');

  const advises = (t) => /most people should/i.test(unquoted(t))
    || /you should (?:buy|invest in|put your money)/i.test(unquoted(t))
    || /we recommend/i.test(unquoted(t));
  const forecasts = (t) => /(?:returns?|the market|shares?) (?:will|is going to) (?:be|rise|fall|reach)\b/i.test(t)
    || /\bcurrently\s+[\d.]+\s*(?:per cent|%)/i.test(t)
    || /expect(?:ed)? returns? of [\d.]+/i.test(t);

  it('never tells the reader what MOST PEOPLE SHOULD do', () => {
    // The commonest way a teaching voice becomes an advising one, and it
    // arrives in a form that does not feel like advice to the person saying it.
    expect(advises(ALL)).toBe(false);
  });

  it('PROVEN-TO-CATCH: the advice guard still fires on real advice', () => {
    expect(advises('Most people should hold more of this than they do.')).toBe(true);
    expect(advises('We recommend starting with the balanced option.')).toBe(true);
    expect(advises('You should buy it while it is cheap.')).toBe(true);
    // and it is not fooled by advice that merely sits near a quotation
    expect(advises('He said "hello" and then: most people should do it.')).toBe(true);
  });

  it('quotes no live figure and makes no forecast', () => {
    expect(forecasts(PROSE)).toBe(false);
  });

  it('PROVEN-TO-CATCH: the forecast guard still fires on a real forecast', () => {
    expect(forecasts('Returns will be higher over the next decade.')).toBe(true);
    expect(forecasts('The market will rise once rates settle.')).toBe(true);
    expect(forecasts('It is currently 6.4 per cent.')).toBe(true);
    expect(forecasts('an expected return of 8.2 a year')).toBe(true);
  });

  it('the prose walk is not empty — the narrowed guard still reads the course', () => {
    // Filtering quiz options out could have filtered everything out; that would
    // make the guard above pass by reading nothing at all, which is the exact
    // shape of a check that lies. So the remaining corpus is pinned as large.
    expect(PROSE.length).toBeGreaterThan(60000);
    expect(PROSE).toContain('CHOOSING NOT TO USE SOMETHING NOW');
  });

  it('wants the reader harder to sell to — including by this house', () => {
    // The stated aim, and the one line that makes the refusals coherent rather
    // than merely cautious.
    expect(INVESTING_CARE_NOTE).toMatch(/harder to sell to, including by us/i);
    expect(INVESTING_TUTOR_META.blurb).toMatch(/harder to sell to, including by us/i);
  });
});

describe('THE LINES THIS COURSE HOLDS', () => {
  it('keeps the FOUR risks separate, and puts the fourth in the household', () => {
    const l2 = byId('inv2-');
    const body = whole(l2) + l2.bigIdea;
    expect(/FOUR DIFFERENT THINGS|four different things/i.test(body)).toBe(true);
    // each of the four, named
    expect(/does not come back/i.test(body)).toBe(true);
    expect(/cannot reach it/i.test(body)).toBe(true);
    expect(/buys less/i.test(body)).toBe(true);
    expect(/forced to sell/i.test(body)).toBe(true);
    // the distinction that costs the most
    expect(/safe and reachable are two different properties|SAFE AND REACHABLE/i.test(body)).toBe(true);
    // and the fourth attributed correctly
    expect(/NOT THE INVESTMENT|not come from the investment/i.test(body)).toBe(true);
    expect(/household/i.test(body)).toBe(true);
    // with the actual defence, which is not a cleverer investment
    expect(/dull/i.test(l2.lesson)).toBe(true);
  });

  it('does the compounding arithmetic with its assumption on its face', () => {
    const l3 = byId('inv3-');
    const body = whole(l3);
    expect(/ASSUMPTION/i.test(body)).toBe(true);
    expect(/not a promise|not a projection|forecasts nothing|does not forecast/i.test(body)).toBe(true);
    // the exact figures, which were checked rather than estimated
    expect(body).toMatch(/7\.00/);
    expect(body).toMatch(/49\.80/);
    // and the honesty about what a real holding does
    expect(/do not (?:advance|move) in a smooth line/i.test(body)).toBe(true);
  });

  it('states the bright line between arithmetic and a sales document', () => {
    const l3 = byId('inv3-');
    expect(l3.lesson).toMatch(/SALES DOCUMENT/);
    expect(l3.lesson).toMatch(/one line of type/i);
    expect(/this house shows the arithmetic and does not print the name/i.test(l3.lesson)).toBe(true);
  });

  it('gives spreading its benefit AND its limit in the same lesson', () => {
    const l4 = byId('inv4-');
    const body = whole(l4) + l4.bigIdea;
    // the benefit, stated without hedging
    expect(/reduces the harm from any (?:ONE|one)/i.test(body)).toBe(true);
    // the limit, in the same breath
    expect(/nothing (?:at all )?about everything falling together|nothing whatever against a common cause/i.test(body)).toBe(true);
    // and the refusal of the comfortable reading
    expect(/feeling SAFE|feeling safe/i.test(body)).toBe(true);
    expect(/been sold something/i.test(body)).toBe(true);
    // the ground the verse actually gives
    expect(body).toContain('for thou knowest not what evil shall be upon the earth');
    expect(/admission (?:of|that)/i.test(body)).toBe(true);
  });

  it('names the concentration a household actually carries', () => {
    const l4 = byId('inv4-');
    const body = whole(l4);
    expect(/one employer/i.test(body)).toBe(true);
    expect(/three (?:separate )?(?:items|lines)/i.test(body)).toBe(true);
    expect(/does not look like an investment decision/i.test(body)).toBe(true);
  });

  it('gets the cost arithmetic RIGHT, including what the figure already contains', () => {
    // My first draft said the rough estimate UNDERSTATES the true cost because
    // the removed money also stops compounding. That is backwards twice over:
    // 0.99^25 is 0.7778, so the true drag is 22.2% of the FINAL value and it
    // already includes everything the removed sums would have earned; and the
    // familiar shortcut of 1% x 25 years gives 25%, which is HIGH, not low.
    // Both are pinned here so the wrong version cannot come back.
    const l5 = byId('inv5-');
    const body = whole(l5);
    expect(/seventy-eight per cent|78 per cent/i.test(body)).toBe(true);
    expect(/already include/i.test(body)).toBe(true);
    expect(/double-counting/i.test(body)).toBe(true);
    expect(/slightly HIGH|slightly high/i.test(body)).toBe(true);
    // and the property that actually matters
    expect(/does not depend on|independent of performance/i.test(body)).toBe(true);
    expect(/cannot outrun|nobody outruns/i.test(body)).toBe(true);
    // the arithmetic is verified here rather than trusted from the prose
    expect(Math.round((0.99 ** 25) * 10000) / 10000).toBe(0.7778);
  });

  it('refuses to let the cost lesson become a slogan', () => {
    const l5 = byId('inv5-');
    const body = whole(l5);
    expect(/CHEAPEST IS NOT AUTOMATICALLY BEST|Cheapest is not automatically best/i.test(body)).toBe(true);
    expect(/cannot see your(?:s)?|cannot see yours/i.test(body)).toBe(true);
  });

  it('says nobody knows — and refuses to leave the reader cynical', () => {
    const l6 = byId('inv6-');
    const body = whole(l6);
    expect(/NOBODY KNOWS WHAT IS COMING|No person knows what is coming/i.test(body)).toBe(true);
    // the mechanism, which is structural rather than a conspiracy
    expect(/not lying|not dissembling/i.test(body)).toBe(true);
    expect(/selected for/i.test(body)).toBe(true);
    expect(/scored almost never|evaluated hardly ever/i.test(body)).toBe(true);
    // and the reply, which is the part that keeps it from being despair
    expect(/neither despair nor paralysis|not despair/i.test(body)).toBe(true);
    expect(/four (?:answerable )?questions|the ones that do/i.test(body)).toBe(true);
    expect(/van dies/i.test(body)).toBe(true);
  });

  it('reads James 4:13 as a correction of the certainty, not of the plan', () => {
    const l6 = byId('inv6-');
    const body = whole(l6);
    expect(/does not forbid the journey|He does not tell them not to go/i.test(body)).toBe(true);
    expect(/THE PLAN IS NOT THE (?:OBJECT OF THE CORRECTION|PROBLEM)/i.test(body)).toBe(true);
    expect(/diligence and presumption/i.test(body)).toBe(true);
  });

  it('puts the steward’s three questions before any product', () => {
    const l7 = byId('inv7-');
    const body = whole(l7) + l7.bigIdea;
    expect(/whose (?:money is it|is it)/i.test(body)).toBe(true);
    expect(/what is it for/i.test(body)).toBe(true);
    expect(/by when/i.test(body)).toBe(true);
    // the distinction the first question turns on
    expect(/AN OWNER ASKS WHAT HE WANTS|An owner asks what he wants/i.test(body)).toBe(true);
    // and the test that keeps the answer from being decorative
    expect(/decorative/i.test(body)).toBe(true);
    // money in its right place
    expect(body).toContain('who will commit to your trust the true riches');
    expect(/THE MONEY IS NOT THE TRUE RICHES|money is not the true riches/i.test(body)).toBe(true);
  });

  it('closes on enough, refusing BOTH ends for the same non-financial reason', () => {
    const l8 = byId('inv8-');
    const body = whole(l8) + l8.bigIdea;
    expect(body).toContain('give me neither poverty nor riches');
    expect(/NEITHER END IS ASKED FOR|NEITHER\./i.test(body)).toBe(true);
    // the reason, which is relational rather than economic
    expect(/not financial at all|nothing to do with money at all/i.test(body)).toBe(true);
    expect(body).toContain('Who is the LORD');
    // Paul relocating rather than rejecting the word
    expect(body).toContain('godliness with contentment is great gain');
    expect(/relocate/i.test(body)).toBe(true);
    // and the refusal to hand anybody a number
    expect(/NOBODY HERE WILL TELL YOU WHAT YOUR NUMBER SHOULD BE|nobody here is telling you what your number should be/i.test(body)).toBe(true);
    expect(/preaching/i.test(body)).toBe(true);
    // the question the course ends on
    expect(/would the number move|would the figure move/i.test(body)).toBe(true);
  });

  it('the tutor posture carries all six limits a teacher could break', () => {
    const p = INVESTING_TUTOR_META.posture;
    expect(p).toMatch(/NEVER GIVE ADVICE/);
    expect(p).toMatch(/FOUR RISKS/);
    expect(p).toMatch(/sales document/i);
    expect(p).toMatch(/FOR THOU KNOWEST NOT/);
    expect(p).toMatch(/CHEAPEST IS NOT AUTOMATICALLY BEST/);
    expect(p).toMatch(/how much is enough/i);
    // and it must not hand a learner a number for the last one
    expect(p).toMatch(/Never hand anybody a number/i);
  });

  it('no two lessons rest on the same passage, and none collides with the other three courses', async () => {
    // Chapter-level for narrative books, verse-level for Proverbs and Psalms,
    // which are collections of independent sayings sharing nothing but a
    // chapter number. The same judgement the three sibling courses make.
    const COLLECTIONS = new Set(['Proverbs', 'Psalms']);
    const keyOf = (ref) => {
      const book = /^([1-3]?\s?[A-Za-z ]+?)\s+\d+:/.exec(ref.trim())[1].trim();
      return COLLECTIONS.has(book) ? ref.trim() : ref.trim().replace(/:(\d+)(-\d+)?$/, '');
    };
    const mine = INVESTING_MODULES.map((m) => keyOf(m.anchor.ref.split(';')[0]));
    expect(new Set(mine).size, `a passage anchors two lessons: ${mine.join(', ')}`).toBe(mine.length);
    const { STOCKS_MODULES } = await import('../lib/stocks-course.js');
    const { BONDS_MODULES } = await import('../lib/bonds-course.js');
    const { WORLD_MARKET_MODULES } = await import('../lib/world-market-course.js');
    const theirs = new Set(
      [...STOCKS_MODULES, ...BONDS_MODULES, ...WORLD_MARKET_MODULES]
        .map((m) => keyOf(m.anchor.ref.split(';')[0])),
    );
    for (const k of mine) {
      expect(theirs.has(k), `${k} already anchors a lesson elsewhere in this department`).toBe(false);
    }
  });
});
