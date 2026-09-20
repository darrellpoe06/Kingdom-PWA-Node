// @vitest-environment node
// =============================================================================
// The World Market: Countries That Trade — course three of the Stock Market
// department
// =============================================================================
// Courses one and two were each about an INSTRUMENT held by a person: a share,
// a bond. This one is about the system those instruments sit inside, and it
// answers the half of Darrell's sentence neither of them touched — "countries
// that trade."
//
// THE SIX THINGS THIS COURSE COULD MOST EASILY HAVE GOT WRONG, held here as
// assertions rather than remembered as intentions:
//
//   1. LEAVING "TRADE DEFICIT" WHERE IT WAS FOUND. The phrase is among the
//      most confidently misused in public life and the confusion is not
//      partisan, it is arithmetic. A deficit is not a debt; nobody is owed
//      anything at the end of a year of one; the money that went out came
//      back. A course that hedged that to avoid sounding political would have
//      failed truth by UNDER-claiming (DR-0100), so the test requires the
//      plain statement AND requires the real question the word hides to be
//      handed back to the reader.
//   2. THE THEOREM WITHOUT THE TOWN. The gain from two countries trading is
//      real and is stated without hedging. AND a gain spread thinly across a
//      country and a loss concentrated in one town are not the same
//      experience; the aggregate being positive is no comfort at all to the
//      town. Either half alone is a lie of omission, so both are pinned.
//   3. A SIDE TAKEN ON A LIVE CASE. Sanctions, tariffs and controls are live
//      political fights. This course names no country as a villain and none as
//      a model and holds no position on any live dispute — while still
//      insisting on the thing the coverage omits: closing a pipe is never
//      precise. "Justified" and "landed where it was not aimed" are both true
//      at once, and the test requires that sentence rather than a both-sides
//      shrug (DR-0098).
//   4. THE CENTRAL BANK AS AUTHOR OF EVERYTHING, OR AS POWERLESS. The
//      narrowness is the lesson: it can move money and change its price; it
//      cannot grow wheat, build a house, train a nurse or invent a machine.
//      Both over-readings are refused in the text, and the test refuses both.
//   5. A LIVE FIGURE QUOTED. No exchange rate, no balance, no reserve total,
//      no tariff schedule. These move daily and a number printed in a lesson
//      is wrong by the time it is read — the same rule courses one and two
//      hold.
//   6. AN ALTERED QUOTATION. Every span is re-fetched from this repository's
//      own KJV below rather than trusted from the author.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  WORLD_MARKET_MODULES, WORLD_MARKET_META, WORLD_MARKET_SESSION_FLOW,
  WORLD_MARKET_SESSION_MINUTES, WORLD_MARKET_CARE_NOTE, WORLD_MARKET_TUTOR_META,
  WORLD_MARKET_INTEREST_TAG, WORLD_MARKET_HELPER_TAG,
  buildWorldMarketSchedule, worldMarketProgressSummary,
  exportWorldMarketCurriculumMarkdown, worldMarketRefs,
} from '../lib/world-market-course.js';
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
  push('meta.wordFirst', WORLD_MARKET_META.wordFirst.frame);
  push('meta.blurb', WORLD_MARKET_META.blurb);
  push('meta.tagline', WORLD_MARKET_META.tagline);
  push('care', WORLD_MARKET_CARE_NOTE);
  push('tutor.posture', WORLD_MARKET_TUTOR_META.posture);
  push('tutor.blurb', WORLD_MARKET_TUTOR_META.blurb);
  for (const m of WORLD_MARKET_MODULES) {
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
const whole = (m) => m.lesson + m.levels.teen + m.levels.senior;

describe('the course is built and it is real', () => {
  it('carries eight lessons, each with the whole contract', () => {
    expect(WORLD_MARKET_MODULES).toHaveLength(8);
    for (const m of WORLD_MARKET_MODULES) {
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
    for (const m of WORLD_MARKET_MODULES) {
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
    for (const m of WORLD_MARKET_MODULES) {
      m.quiz.questions.forEach((q, i) => {
        expect(q.options.length, `${m.id} q${i} has too few options`).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer], `${m.id} q${i} answers nothing`).toBeTruthy();
        expect(q.explain.length, `${m.id} q${i} explains nothing`).toBeGreaterThan(60);
      });
    }
  });

  it('builds a schedule, a progress summary and an export without throwing', () => {
    expect(buildWorldMarketSchedule(null)).toHaveLength(8);
    expect(worldMarketProgressSummary({})).toBeTruthy();
    expect(exportWorldMarketCurriculumMarkdown(null).length).toBeGreaterThan(2000);
    expect(WORLD_MARKET_SESSION_MINUTES).toBe(WORLD_MARKET_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
  });

  it('is REGISTERED in the Stock Market department (built ⇒ surfaced)', () => {
    const row = LEARN_CATALOG.find((e) => e.key === 'world-market');
    expect(row, 'the course is built but not surfaced').toBeTruthy();
    expect(row.meta.category).toBe('Stock Market');
    expect(row.buildScheduleRows()).toHaveLength(8);
    expect(row.interestTag).toBe(WORLD_MARKET_INTEREST_TAG);
    expect(row.helperTag).toBe(WORLD_MARKET_HELPER_TAG);
  });

  it('the interest tag is its OWN, not a sibling course’s', () => {
    // The assembly script for this course was made from the Bonds one by
    // renaming identifiers, and a rename changes symbols without touching
    // strings: the first draft of this file shipped WORLD_MARKET_INTEREST_TAG
    // = '[Bonds]', which would have routed every request for help with a
    // trade headline into the bond course's inbox, silently. Caught before it
    // reached the repository; pinned here so it cannot come back.
    expect(WORLD_MARKET_INTEREST_TAG).toBe('[World market]');
    expect(WORLD_MARKET_HELPER_TAG).toBe('[World market helper]');
    expect(WORLD_MARKET_INTEREST_TAG).not.toMatch(/bond/i);
  });

  it('the tutor posture is this course’s own, with no inherited Bonds text', () => {
    // The same rename left the ENTIRE Bonds posture behind — Deuteronomy
    // 23:19-20, the yield curve, 2 Kings 4 — under a World Market name. A
    // tutor holding those limits would have answered a question about a trade
    // deficit with the law of usury. Prose does not get renamed; it gets
    // rewritten.
    const p = WORLD_MARKET_TUTOR_META.posture + WORLD_MARKET_TUTOR_META.blurb;
    expect(p).not.toMatch(/yield curve/i);
    expect(p).not.toMatch(/Deuteronomy 23/);
    expect(p).not.toMatch(/2 Kings 4/);
    expect(p).not.toMatch(/\bbondholder\b/i);
  });

  it('the department now has three courses in it', () => {
    const dept = LEARN_CATALOG.filter((e) => e.meta.category === 'Stock Market').map((e) => e.key);
    expect(dept).toContain('stocks');
    expect(dept).toContain('bonds');
    expect(dept).toContain('world-market');
  });

  it('is reachable by the plain words a person would actually type (DR-0519)', () => {
    const words = plainWordsFor('world-market');
    expect(words.length).toBeGreaterThanOrEqual(5);
    const title = WORLD_MARKET_META.title.toLowerCase();
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
    const bent = 'He wrote "She is like the merchant ships; she bringeth her bread from afar" (Proverbs 31:14).';
    const m = [...bent.matchAll(SPAN)][0];
    expect(m, 'the pattern did not even match — the check would be vacuous').toBeTruthy();
    expect(norm(verseText('Proverbs', 31, 14)).includes(norm(m[1]))).toBe(false);
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
    for (const ref of worldMarketRefs()) {
      const m = /^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)$/.exec(ref.trim());
      expect(m, `unparseable reference: ${ref}`).toBeTruthy();
      expect(verseText(m[1], Number(m[2]), Number(m[3])), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('THE LINES THIS COURSE HOLDS', () => {
  it('says plainly that a trade deficit is NOT a debt — and does not hedge it', () => {
    const l3 = WORLD_MARKET_MODULES[2];
    const body = whole(l3);
    expect(/is not a debt/i.test(body)).toBe(true);
    // The absence of a creditor is the whole claim, however the band words it.
    expect(/(?:nobody|no one|anybody|any party) is owed anything/i.test(body)).toBe(true);
    expect(/there is no (?:lender|creditor)/i.test(body)).toBe(true);
    // the hedge that would have made it useless
    expect(/some economists argue that a deficit is not/i.test(body)).toBe(false);
    // and the arithmetic, not an opinion
    expect(/arithmetic/i.test(body)).toBe(true);
  });

  it('hands the reader back the question the word DEFICIT hides', () => {
    const l3 = WORLD_MARKET_MODULES[2];
    expect(l3.lesson).toMatch(/came back to do|came back to DO/i);
    expect(/that is the wrong question|THE REAL QUESTION IS/i.test(whole(l3))).toBe(true);
    // the word itself is named as the source of the trouble, from budgeting
    expect(/borrowed from budget|the word DEFICIT is responsible/i.test(whole(l3))).toBe(true);
  });

  it('gives the theorem AND the town — neither half alone (DR-0100)', () => {
    const l1 = WORLD_MARKET_MODULES[0];
    const body = whole(l1) + l1.bigIdea;
    // the gain, stated without hedging
    expect(/both gain/i.test(body)).toBe(true);
    expect(/even when one (?:is better at making everything|could make everything)/i.test(body)).toBe(true);
    // and the loss, in the same breath
    expect(/THE GAIN IS DIFFUSE AND THE LOSS IS CONCENTRATED/.test(body)).toBe(true);
    expect(/no comfort/i.test(body)).toBe(true);
    // the refusal to stop at the pleasant half
    expect(/WILL NOT LEAVE OUT|will not skip/i.test(body)).toBe(true);
  });

  it('takes no position on any live case, and still insists on what coverage omits', () => {
    const l7 = WORLD_MARKET_MODULES[6];
    const body = whole(l7);
    expect(/takes no position on any live case|TAKES NO POSITION ON ANY LIVE CASE/i.test(body)).toBe(true);
    expect(/CLOSING A PIPE IS NEVER PRECISE/.test(body)).toBe(true);
    // the sentence that is not a both-sides shrug: both halves true at once
    expect(/a measure can be justified/i.test(body)).toBe(true);
    expect(/land where it was not aimed/i.test(body)).toBe(true);
    // and it refuses to be read as an argument that sanctions are always wrong
    expect(/NOT AN ARGUMENT THAT SANCTIONS ARE ALWAYS WRONG/i.test(body)).toBe(true);
  });

  it('holds the central bank narrow — refusing BOTH over-readings', () => {
    const l5 = WORLD_MARKET_MODULES[4];
    const body = whole(l5);
    expect(/IT CANNOT MAKE ANYTHING/.test(body)).toBe(true);
    expect(/grow a field of wheat/i.test(body)).toBe(true);
    expect(/train a nurse/i.test(body)).toBe(true);
    // both sides of the usual argument, not one
    expect(/BOTH SIDES OF THE (?:USUAL ARGUMENT|CUSTOMARY DISPUTE) OVERSTATE/i.test(body)).toBe(true);
    // and the honest qualification that keeps it from becoming a dismissal
    expect(/HONEST QUALIFICATION/i.test(body)).toBe(true);
  });

  it('names the reserve advantages plainly and refuses the conspiracy reading', () => {
    const l6 = WORLD_MARKET_MODULES[5];
    const body = whole(l6);
    expect(/NEITHER (?:OF THOSE IS A SECRET|ADVANTAGE IS CONCEALED)/i.test(body)).toBe(true);
    expect(/conspiracy|plot/i.test(body)).toBe(true);
    // and the advantages are not denied either — under-claiming fails too
    expect(/cheaper borrowing/i.test(body)).toBe(true);
    expect(/nor is it permanent/i.test(body)).toBe(true);
  });

  it('closes on the just weight, and says the border does not end the rule', () => {
    const l8 = WORLD_MARKET_MODULES[7];
    const body = whole(l8);
    expect(body).toContain('Just balances, just weights, a just ephah, and a just hin');
    // The rule's own silence is the argument: the statute contains no clause
    // limiting it to your own people, and the lesson makes the reader look
    // for the exemption that is not there rather than asserting it for them.
    expect(body).toContain('within your own borders');
    expect(/does not stop being required at a border/i.test(ALL)).toBe(true);
    // and it lands on what one person can actually do, rather than a lament
    expect(/be a just weight in every measure you personally hold/i.test(body)).toBe(true);
  });

  it('quotes no live figure anywhere', () => {
    expect(/(?:exchange rate|deficit|reserves?|tariff)\s+(?:is|was|stands at|now at)\s+[\d.]+\s*(?:per cent|%)/i.test(ALL)).toBe(false);
    expect(/trade deficit (?:is|of) [\d$£]/i.test(ALL)).toBe(false);
    expect(/\bcurrently\s+[\d.]+\s*(?:per cent|%)/i.test(ALL)).toBe(false);
  });

  it('names no country as a villain and none as a model', () => {
    expect(WORLD_MARKET_CARE_NOTE).toMatch(/names no country as a villain and none as a model/i);
    expect(WORLD_MARKET_TUTOR_META.blurb).toMatch(/no country is named here as a villain or a model/i);
  });

  it('the tutor posture carries all five limits a teacher could break', () => {
    const p = WORLD_MARKET_TUTOR_META.posture;
    expect(p).toMatch(/TRADE DEFICIT IS NOT A DEBT/);
    expect(p).toMatch(/gain spread thinly across a country and a loss concentrated in one town/i);
    expect(p).toMatch(/never quote a live figure/i);
    expect(p).toMatch(/justified AND land where it was not aimed/i);
    expect(p).toMatch(/narrowness is the lesson/i);
    expect(p).toMatch(/lesson one and lesson seven/i);
  });

  it('carries the care note, and it refuses to be advice', () => {
    expect(WORLD_MARKET_META.care).toBe(WORLD_MARKET_CARE_NOTE);
    expect(WORLD_MARKET_CARE_NOTE).toMatch(/not financial or policy advice/i);
    expect(WORLD_MARKET_CARE_NOTE).toMatch(/somebody qualified|someone qualified|people who can look/i);
  });

  it('no two lessons rest on the same passage, and none collides with courses one or two', async () => {
    // Chapter-level for narrative books, verse-level for Proverbs and Psalms,
    // which are collections of independent sayings sharing nothing but a
    // chapter number. Same judgement the two sibling courses make.
    const COLLECTIONS = new Set(['Proverbs', 'Psalms']);
    const keyOf = (ref) => {
      const book = /^([1-3]?\s?[A-Za-z ]+?)\s+\d+:/.exec(ref.trim())[1].trim();
      return COLLECTIONS.has(book) ? ref.trim() : ref.trim().replace(/:(\d+)(-\d+)?$/, '');
    };
    const mine = WORLD_MARKET_MODULES.map((m) => keyOf(m.anchor.ref.split(';')[0]));
    expect(new Set(mine).size, `a passage anchors two lessons: ${mine.join(', ')}`).toBe(mine.length);
    const { STOCKS_MODULES } = await import('../lib/stocks-course.js');
    const { BONDS_MODULES } = await import('../lib/bonds-course.js');
    const theirs = new Set([...STOCKS_MODULES, ...BONDS_MODULES].map((m) => keyOf(m.anchor.ref.split(';')[0])));
    for (const k of mine) {
      expect(theirs.has(k), `${k} already anchors a lesson elsewhere in this department`).toBe(false);
    }
  });
});
