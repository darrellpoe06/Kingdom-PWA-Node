// @vitest-environment node
// =============================================================================
// APPRAISAL: WHAT A THING IS ACTUALLY WORTH — the course's own gate
// =============================================================================
// Course TWELVE of the Real Estate department. Eleven courses covered the
// ground, the stewardship, the transaction, the tenant, the building, the
// partner, the lender, the record, the loss, the looking and the hardest hour.
// This one covers the number every one of them runs on and none of them
// examines: what a thing is actually worth, and who says so.
//
// THE FIND IT IS BUILT ON. Leviticus 27 is a COMPLETE VALUATION STATUTE that
// almost nobody teaches: a published schedule (27:3-7) with an ability-to-pay
// override written beside it (27:8), a binding estimate by a disinterested
// valuer (27:14), land priced by productive capacity (27:16) and pro-rated by
// the years remaining (27:18), a fixed fifth-part addition on redemption
// (27:15, 19, 31), an expiry with no reversion (27:20, 21), and the unit
// defined in the same chapter (27:25).
//
// WHAT THIS FILE IS FOR. Four limits, each a place the material is routinely
// abused, pinned as machine checks rather than trusted to prose (DR-0076 §2):
//
//   Leviticus 27:2-7 -- the money equivalent of a VOW, NEVER what a person is
//     worth. Verse 8 is the proof: poverty sets the schedule aside, and a
//     measure of intrinsic worth could not fall because a pocket is empty.
//   Leviticus 27:14 vs 27:33 -- the same chapter says "whether it be good or
//     bad" TWICE with opposite force. Flattening them inverts one of them
//     either way. What you TRANSACT you appraise; what you OWE you do not shop.
//   1 Kings 21 -- Ahab's offer was genuinely FAIR (a better vineyard, or the
//     money, with the choice given to Naboth). Nothing here teaches that fair
//     offers are wrong. The failure is that IS IT FOR SALE precedes WHAT IS IT
//     WORTH, and that a man who believes everything has a price concludes a
//     failed sale is about the seller.
//   Genesis 25 -- the text gives its own verdict, "thus Esau despised his
//     birthright" (25:34), so the lesson invents none; and the passage is not
//     a comment on Jacob's conduct here, so neither is the lesson.
//
// AND ONE TEXTUAL CLAIM IS PINNED AGAINST THE KJV ITSELF. Lesson five says
// Leviticus 27:25 and Ezekiel 45:12 set the same definition from opposite ends
// of the sentence. That is checkable, so it is checked here against the
// repository's own KJV rather than asserted in prose — the same discipline the
// evictions course adopted after its first draft overstated a repetition in
// Matthew 18.
//
// FRESHNESS IS PINNED: 34 verses cited, ZERO shared with the department's
// eleven other courses, ZERO shared with the rest of the catalog either, and
// TWO shared chapters named — both property-principle, both at other verses.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  APPRAISAL_MODULES, APPRAISAL_META, APPRAISAL_SESSION_FLOW,
  APPRAISAL_SESSION_MINUTES, APPRAISAL_CARE_NOTE, APPRAISAL_TUTOR_META,
  APPRAISAL_INTEREST_TAG, APPRAISAL_HELPER_TAG,
  buildAppraisalSchedule, appraisalProgressSummary,
  exportAppraisalCurriculumMarkdown, appraisalRefs,
} from '../lib/appraisal-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { scanModules, HARD_TERMS } from '../lib/plain-before-the-term.js';
import { plainWordsFor } from '../lib/learn-plain-words.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i); else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};
const quotationFaults = (text, path = '') => {
  const out = [];
  SPAN.lastIndex = 0;
  let m;
  while ((m = SPAN.exec(text))) {
    const real = versesOf(m[2].trim(), m[3], m[4].trim());
    if (real == null) out.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
    else if (!norm(real).includes(norm(m[1]))) out.push(`${path}: NOT VERBATIM ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
  }
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (t) => String(t).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

const lessonOf = (n) => APPRAISAL_MODULES[n - 1];
const ROW = LEARN_CATALOG.find((c) => c.key === 'appraisal');
const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];
const readerText = (m) => [
  ...READER_FIELDS.map((f) => m[f]),
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.stories || []).map((s) => s.body),
  ...((m.quiz || {}).questions || []).map((q) => `${q.q} ${(q.options || []).join(' ')} ${q.explain}`),
  ...((m.facilitator || {}).talkingPoints || []),
  (m.anchor || {}).theme,
].filter((x) => typeof x === 'string').join('\n');

describe('THE GATE, PROVEN TO CATCH BEFORE IT IS TRUSTED (DR-0076 §3)', () => {
  it('catches a quotation that is not verbatim', () => {
    const bad = 'He said, "thirty gerahs shall be the shekel" (Leviticus 27:25)';
    expect(quotationFaults(bad, 'x')[0]).toContain('NOT VERBATIM');
  });

  it('catches a double-quoted span with no reference behind it', () => {
    expect(quotationFaults('He said, "thy estimation" and stopped.', 'x')[0]).toContain('ORPHAN');
  });

  it('passes the real thing', () => {
    const good = '"And all thy estimations shall be according to the shekel of the sanctuary: twenty gerahs shall be the shekel." (Leviticus 27:25)';
    expect(quotationFaults(good, 'x')).toEqual([]);
  });

  it('resolves the repository KJV at all — this is not measuring nothing', () => {
    expect(versesOf('Leviticus', 27, '8')).toContain('poorer than thy estimation');
    expect(versesOf('Hosea', 12, '7')).toContain('balances of deceit');
  });
});

describe('every quoted span in the course is verbatim, referenced, and un-elided', () => {
  it('walks every string the reader can reach', () => {
    const faults = [];
    walkStrings(APPRAISAL_MODULES, 'modules', (text, path) => faults.push(...quotationFaults(text, path)));
    walkStrings(APPRAISAL_META, 'meta', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const bad = [];
    walkStrings(APPRAISAL_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) {
        if (/…|\.\.\./.test(span)) bad.push(`${path}: ${span.slice(0, 60)}`);
      }
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('really is checking a large body of quotation, not a handful', () => {
    let spans = 0;
    walkStrings(APPRAISAL_MODULES, 'modules', (text) => { SPAN.lastIndex = 0; while (SPAN.exec(text)) spans += 1; });
    expect(spans).toBeGreaterThan(160);
  });
});

describe('the build contract — nine exports and a catalog row', () => {
  it('ships eight lessons with stable ids', () => {
    expect(APPRAISAL_MODULES).toHaveLength(8);
    expect(APPRAISAL_MODULES.map((m) => m.id)).toEqual([
      'appr1-thy-estimation',
      'appr2-whether-it-be-good-or-bad',
      'appr3-according-to-the-years-that-remain',
      'appr4-he-shall-add-the-fifth-part',
      'appr5-twenty-gerahs-shall-be-the-shekel',
      'appr6-the-balances-of-deceit',
      'appr7-the-worth-of-it-in-money',
      'appr8-what-profit-shall-this-birthright-do-to-me',
    ]);
  });

  it('exports the meta, the flow, the minutes and the tags', () => {
    expect(APPRAISAL_META.key).toBe('appraisal');
    expect(APPRAISAL_META.weeks).toBe(8);
    expect(APPRAISAL_META.wordFirst.ref).toBe('Leviticus 27:18; Leviticus 27:25');
    expect(APPRAISAL_SESSION_FLOW.length).toBeGreaterThan(4);
    expect(APPRAISAL_SESSION_MINUTES).toBe(APPRAISAL_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
    expect(APPRAISAL_INTEREST_TAG).toBe('[Appraisal]');
    expect(APPRAISAL_HELPER_TAG).toBe('[Appraisal helper]');
    expect(APPRAISAL_TUTOR_META.key).toBe('appraisal');
  });

  it('builds a schedule, a progress summary and a markdown export', () => {
    const rows = buildAppraisalSchedule(null);
    expect(rows).toHaveLength(8);
    expect(rows[0].id).toBe('appr1-thy-estimation');
    expect(appraisalProgressSummary({}).total).toBe(8);
    const md = exportAppraisalCurriculumMarkdown(null);
    expect(md).toContain(APPRAISAL_META.title);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('reports every reference it cites, deduped', () => {
    const refs = appraisalRefs();
    expect(refs).toContain('Leviticus 27:8');
    expect(refs).toContain('Ezekiel 45:12');
    expect(refs).toContain('Genesis 25:34');
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('is mounted in the catalog under Real Estate, with everything the shelf needs', () => {
    expect(ROW).toBeTruthy();
    expect(ROW.meta.category).toBe('Real Estate');
    expect(ROW.wiring).toBe('self-paced');
    expect(ROW.unitCap).toBe('Lesson');
    expect(ROW.buildScheduleRows()).toHaveLength(8);
    expect(ROW.exportMarkdown().length).toBeGreaterThan(2000);
    expect(ROW.downloadName).toMatch(/\.md$/);
    expect(typeof ROW.interestText('Somebody')).toBe('string');
    expect(ROW.interestCopy.cta.length).toBeGreaterThan(3);
    expect(ROW.tutorCourseMeta).toBe(APPRAISAL_TUTOR_META);
  });

  it('is reachable by an everyday word (DR-0519)', () => {
    expect(plainWordsFor('appraisal')).toContain('price');
    expect(plainWordsFor('appraisal').length).toBeGreaterThanOrEqual(4);
  });

  it('carries the teaching-not-advice note, and says where a wronged reader should start', () => {
    expect(APPRAISAL_CARE_NOTE).toMatch(/not appraisal, tax or investment advice/i);
    expect(APPRAISAL_CARE_NOTE).toMatch(/licensed in your own state/i);
    // The note refuses the one thing a reader will most want from it.
    expect(APPRAISAL_CARE_NOTE).toMatch(/Nothing in this course produces a number for your house/);
    expect(APPRAISAL_CARE_NOTE).toMatch(/start at lesson two and lesson five/i);
    expect(APPRAISAL_META.care).toBe(APPRAISAL_CARE_NOTE);
  });
});

describe('the DR-0509 lesson contract, on every lesson', () => {
  for (const m of APPRAISAL_MODULES) {
    it(`${m.id} is whole`, () => {
      expect(typeof m.levels.teen).toBe('string');
      expect(typeof m.levels.senior).toBe('string');
      expect(m.lesson.trim().split(/\s+/).length).toBeGreaterThan(400);
      expect(m.levels.teen.trim().split(/\s+/).length).toBeGreaterThan(300);
      expect(m.levels.senior.trim().split(/\s+/).length).toBeGreaterThan(300);
      expect(m.benefits.length).toBeGreaterThanOrEqual(5);
      expect(m.stories).toHaveLength(2);
      for (const s of m.stories) {
        expect(['parable', 'testimony']).toContain(s.kind);
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.body.trim().split(/\s+/).length).toBeGreaterThan(120);
      }
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer]).toBeTruthy();
        expect(q.explain.length).toBeGreaterThan(40);
      }
      expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
      expect(m.facilitator.howToRun.length).toBeGreaterThan(200);
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
      expect(m.anchor.ref.length).toBeGreaterThan(5);
      expect(m.anchor.theme.length).toBeGreaterThan(200);
      expect(m.inApp.length).toBeGreaterThan(200);
    });
  }

  it('names Yahweh in our OWN voice in every lesson, never inside a quotation (DR-0210)', () => {
    const missing = APPRAISAL_MODULES.filter((m) => !/Yahweh/.test(ours(readerText(m)))).map((m) => m.id);
    expect(missing, `no Yahweh in our own prose: ${missing.join(', ')}`).toEqual([]);
  });

  it('never substitutes Yahweh into a quotation — the KJV God and LORD stand', () => {
    const inserted = [];
    walkStrings(APPRAISAL_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) if (/Yahweh/.test(span)) inserted.push(`${path}: ${span.slice(0, 50)}`);
    });
    expect(inserted, inserted.join('\n')).toEqual([]);
    expect(readerText(lessonOf(1))).toContain('the persons shall be for the LORD by thy estimation.');
    expect(readerText(lessonOf(8))).toContain('O Lord GOD, Buy thee the field for money');
  });

  it('recites no decision-record id at a reader', () => {
    const recited = [];
    walkStrings(APPRAISAL_MODULES, 'modules', (text, path) => {
      if (/\bDR-\d{4}\b/.test(text)) recited.push(`${path}: ${String(text).match(/\bDR-\d{4}\b/)[0]}`);
    });
    expect(recited, recited.join('\n')).toEqual([]);
  });

  it('leads with the plain meaning of every hard term (DR-0521)', () => {
    expect(scanModules(APPRAISAL_MODULES)).toEqual([]);
  });

  it('avoids the word PREMIUM entirely rather than widening its cues', () => {
    // `premium` is on the hard-terms list with INSURANCE cues. In this course
    // the word would mean a markup over an appraised value — a second sense.
    // Widening the cues would give the term a second way to pass and weaken
    // the check, so the course was reworded instead. It is checked over every
    // field, not only the scanned ones: keeping the word in a title or a
    // benefit while avoiding it in the lesson body would be gaming the gate.
    expect(HARD_TERMS.premium, 'premium must still be a hard term').toBeTruthy();
    const hits = [];
    walkStrings(APPRAISAL_MODULES, 'modules', (text, path) => { if (/\bpremium/i.test(text)) hits.push(path); });
    walkStrings(APPRAISAL_META, 'meta', (text, path) => { if (/\bpremium/i.test(text)) hits.push(path); });
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

describe('THE FOUR DOCTRINAL LIMITS, pinned so an edit cannot quietly delete one', () => {
  it('Leviticus 27:2-7 is a VOW schedule and never a price on a person', () => {
    const t = readerText(lessonOf(1));
    expect(t).toContain('"Speak unto the children of Israel, and say unto them, When a man shall make a singular vow, the persons shall be for the LORD by thy estimation." (Leviticus 27:2)');
    const body = lessonOf(1).lesson;
    expect(body).toContain('THIS PASSAGE NEVER PRICES A PERSON');
    expect(body).toMatch(/nothing here is a statement about men, women, the young or the old/);
    // And the PROOF is verse 8, taught as the argument rather than an aside.
    expect(t).toContain('"But if he be poorer than thy estimation, then he shall present himself before the priest, and the priest shall value him; according to his ability that vowed shall the priest value him." (Leviticus 27:8)');
    expect(body).toMatch(/THIS FIGURE MOVES — therefore it was never measuring the man/);
  });

  it('Leviticus 27:14 and 27:33 are resolved rather than flattened', () => {
    const t = readerText(lessonOf(2));
    expect(t).toContain('"And when a man shall sanctify his house to be holy unto the LORD, then the priest shall estimate it, whether it be good or bad: as the priest shall estimate it, so shall it stand." (Leviticus 27:14)');
    expect(t).toContain('"He shall not search whether it be good or bad, neither shall he change it: and if he change it at all, then both it and the change thereof shall be holy; it shall not be redeemed." (Leviticus 27:33)');
    const body = lessonOf(2).lesson;
    expect(body).toContain('WHAT YOU TRANSACT, YOU APPRAISE CAREFULLY. WHAT YOU OWE, YOU DO NOT SHOP.');
    // The warning about flattening is stated in BOTH directions.
    expect(body).toMatch(/inverts one of them whichever direction they flatten it/);
    expect(body).toMatch(/refuse to examine what he is buying/);
    expect(body).toMatch(/will sort his herd/);
  });

  it('1 Kings 21 says plainly that the offer was FAIR before it says anything else', () => {
    const t = readerText(lessonOf(7));
    expect(t).toContain('"And Ahab spake unto Naboth, saying, Give me thy vineyard, that I may have it for a garden of herbs, because it is near unto my house: and I will give thee for it a better vineyard than it; or, if it seem good to thee, I will give thee the worth of it in money." (1 Kings 21:2)');
    const body = lessonOf(7).lesson;
    expect(body).toContain('SAY PLAINLY TO THE ROOM THAT THE OFFER WAS FAIR');
    expect(body).toContain('NOTHING HERE TEACHES THAT FAIR OFFERS ARE WRONG');
    expect(body).toMatch(/AHAB ASKED WHAT IS IT WORTH\. NABOTH ANSWERED IT IS NOT FOR SALE\./);
    // Naboth's refusal is SUMMARISED and flagged as such rather than quoted,
    // which is what keeps the department verse count at zero without hiding
    // anything from the reader.
    expect(body).toMatch(/flag this as a summary rather than a quotation/);
    expect(t).toContain('"And it came to pass, when Jezebel heard that Naboth was stoned, and was dead, that Jezebel said to Ahab, Arise, take possession of the vineyard of Naboth the Jezreelite, which he refused to give thee for money: for Naboth is not alive, but dead." (1 Kings 21:15)');
  });

  it('Genesis 25 lets the text give its own verdict and stops short of Jacob', () => {
    const t = readerText(lessonOf(8));
    expect(t).toContain('"Then Jacob gave Esau bread and pottage of lentiles; and he did eat and drink, and rose up, and went his way: thus Esau despised his birthright." (Genesis 25:34)');
    const body = lessonOf(8).lesson;
    expect(body).toMatch(/THIS PASSAGE IS NOT COMMENTING ON JACOB’S CONDUCT HERE/);
    expect(body).toMatch(/DESPISED — not erred, not miscalculated/);
    // And Esau's reasoning is taken seriously rather than mocked, which is the
    // only way the lesson reaches anybody in the room.
    expect(body).toMatch(/THE ARITHMETIC WAS NEVER THE PROBLEM\. THE INPUT WAS\./);
    expect(body).toMatch(/A VALUATION MADE IN AN EXTREME STATE PRICES THE STATE, NOT THE ASSET/);
  });

  it('the fifth part is taught by its EFFECT, with no motive put in Yahweh’s mouth', () => {
    const body = lessonOf(4).lesson;
    expect(body).toContain('THE TEXT GIVES NO REASON FOR THE FIFTH.');
    expect(body).toMatch(/We are not going to supply Yahweh with a motive He did not state/);
    expect(body).toMatch(/what the fifth DOES/);
    // And the hard end of the redemption right is kept.
    expect(readerText(lessonOf(4))).toContain('"But the field, when it goeth out in the jubile, shall be holy unto the LORD, as a field devoted; the possession thereof shall be the priest’s." (Leviticus 27:21)');
  });

  it('the mirrored shekel definition is checked against the KJV, not asserted in prose', () => {
    // Lesson five claims Leviticus 27:25 and Ezekiel 45:12 set the same
    // definition from opposite ends of the sentence. That is checkable, so it
    // is checked — the discipline the evictions course adopted after its own
    // first draft overstated a repetition in Matthew 18.
    const lev = versesOf('Leviticus', 27, '25');
    const eze = versesOf('Ezekiel', 45, '12');
    expect(lev).toContain('twenty gerahs shall be the shekel');
    expect(eze).toContain('the shekel shall be twenty gerahs');
    expect(lev).not.toContain('the shekel shall be twenty gerahs');
    expect(eze).not.toContain('twenty gerahs shall be the shekel');
    const t = readerText(lessonOf(5));
    expect(t).toMatch(/Leviticus says twenty gerahs shall be the shekel; Ezekiel says the shekel shall be twenty gerahs/);
    // And the honest note that Ezekiel 45:12 continues beyond what we quote.
    expect(lessonOf(5).lesson).toMatch(/the verse continues on to define a larger weight as well, which this course does not treat/);
  });

  it('the tutor carries the same limits it would otherwise be free to ignore', () => {
    const p = APPRAISAL_TUTOR_META.posture;
    expect(p).toMatch(/never what a person is worth/);
    expect(p).toMatch(/never flatten them/);
    expect(p).toMatch(/never supply a reason the text does not give/);
    expect(p).toMatch(/Ahab’s offer was FAIR/);
    expect(p).toMatch(/take Esau’s reasoning SERIOUSLY/);
    expect(p).toMatch(/never extend the passage into a comment on Jacob’s conduct/);
    expect(p).toMatch(/never give appraisal, tax or investment advice/i);
    expect(p).toMatch(/lesson two and lesson five/);
  });
});

describe('FRESHNESS, measured rather than claimed (DR-0076 §4)', () => {
  const dept = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate');
  const refsIn = (t) => [...String(t || '').matchAll(/\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+)\)/g)].map((x) => x[1].trim());
  const expand = (ref) => {
    const m = String(ref).match(/^(.*?)\s*(\d+):([\d\-,\s]+)$/);
    if (!m) return [];
    const out = [];
    for (const part of m[3].split(',')) {
      const r = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!r) continue;
      const a = Number(r[1]); const b = r[2] ? Number(r[2]) : a;
      for (let v = a; v <= b && v - a < 80; v += 1) out.push(`${m[1].trim()} ${m[2]}:${v}`);
    }
    return out;
  };
  const versesCited = (course) => {
    const set = new Set();
    const eat = (t) => { for (const r of refsIn(t)) for (const v of expand(r)) set.add(v); };
    for (const row of course.buildScheduleRows()) {
      walkStrings(row, '', (text) => eat(text));
      for (const r of String((row.anchor && row.anchor.ref) || '').split(';')) for (const v of expand(r.trim())) set.add(v);
    }
    for (const r of String((course.meta.wordFirst && course.meta.wordFirst.ref) || '').split(';')) for (const v of expand(r.trim())) set.add(v);
    return set;
  };

  it('cites 34 verses and shares NOT ONE with any other course in the department', () => {
    const mine = versesCited(ROW);
    // The header names this number. If it moves, the header is no longer true
    // and must be re-measured and re-written.
    expect(mine.size).toBe(34);
    const shared = [];
    for (const c of dept) {
      if (c.key === 'appraisal') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) shared.push(`${v} <- ${c.key}`);
    }
    expect(shared, `verse shared inside the department:\n${shared.join('\n')}`).toEqual([]);
  });

  it('shares NOT ONE verse with the rest of the catalog either', () => {
    const mine = versesCited(ROW);
    const outside = [];
    for (const c of LEARN_CATALOG) {
      if (!c.buildScheduleRows || c.key === 'appraisal') continue;
      if (c.meta && c.meta.category === 'Real Estate') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) outside.push(`${v} <- ${c.key}`);
    }
    expect([...new Set(outside)].sort(), `verse shared outside the department:\n${outside.join('\n')}`).toEqual([]);
  });

  it('shares exactly TWO chapters, at different verses, and both are named', () => {
    const chOf = (v) => v.replace(/:.*$/, '');
    const mine = new Set([...versesCited(ROW)].map(chOf));
    const theirs = new Set();
    for (const c of dept) if (c.key !== 'appraisal') for (const v of versesCited(c)) theirs.add(chOf(v));
    expect([...mine].filter((c) => theirs.has(c)).sort()).toEqual(['1 Kings 21', 'Jeremiah 32']);
  });

  it('carries none of the eight passages the measurement ruled out', () => {
    // Every obvious appraisal anchor was already mounted in this department:
    // Genesis 23 (buying-terms), Jeremiah 32:6-15 (property-principle),
    // Proverbs 11:1 and Deuteronomy 25:13-16 (buying-terms), Ruth 4
    // (property-principle), Luke 14:28 (property-principle), 2 Samuel 24:24
    // (insurance-risk), Micah 6:11 (buying-terms), Haggai 1:6
    // (maintenance-trades). Eight natural lessons died there, and the course is
    // better for it, because the loss drove it into Leviticus 27.
    const found = [];
    const scan = (t) => {
      for (const bad of ['Genesis 23', 'Proverbs 11:1', 'Deuteronomy 25:1', 'Ruth 4', 'Luke 14:2', '2 Samuel 24', 'Micah 6:1', 'Haggai 1']) {
        if (String(t).includes(bad)) found.push(bad);
      }
    };
    walkStrings(APPRAISAL_MODULES, '', scan);
    walkStrings(APPRAISAL_META, '', scan);
    expect([...new Set(found)]).toEqual([]);
  });
});
