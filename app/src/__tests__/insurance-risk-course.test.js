// @vitest-environment node
// =============================================================================
// INSURANCE AND RISK: WHAT YOU CANNOT AFFORD TO LOSE — the course's own gate
// =============================================================================
// Course NINE of the Real Estate department. Eight courses covered the ground,
// the stewardship, the transaction, the tenant, the building, the partner, the
// lender and the record. This one covers what every one of them assumes and
// none of them handles: what happens when it goes wrong, who bears the cost,
// and how a household decides in advance what it cannot afford to lose.
//
// WHAT THIS FILE IS FOR. The course carries four doctrinal limits, and every
// one of them is a place the material is routinely abused. A limit that lives
// only in prose is a limit a future edit can quietly delete, so each one is
// pinned here as a machine check (DR-0076 §2 — gates over claims).
//
//   Luke 13      -- BOTH sentences. Jesus denies twice that the victims were
//                   worse sinners AND says except ye repent ye shall all
//                   likewise perish. Quoting verse 4 and dropping verse 5
//                   flatters the reader; quoting verse 5 as though a loss were
//                   a verdict is the error He was correcting.
//   1 Timothy 5:8 - the limit is stated BEFORE the application: Paul is writing
//                   about care of relatives and widows, the passage does not
//                   mention insurance, and it must never be taught as a policy
//                   mandate. An inflated verse loses its authority the first
//                   time a hearer reads the chapter.
//   2 Samuel 24  -- David is speaking of WORSHIP, not premiums, and Yahweh was
//                   INTREATED rather than purchased. A transactional reading of
//                   the fifty shekels is corrected in the text itself.
//   Matthew 7    -- the storm clauses are IDENTICAL in both verses and both
//                   builders heard. The weather was never the variable.
//
// AND THE FRESHNESS CLAIM IS PINNED BECAUSE THE FIRST ONE WAS WRONG. The draft
// header said no book-and-chapter was shared with this department. True of the
// eight anchor chapters when written; false once the supporting passages went
// in. A measurement caught it, one real duplicate came out (Ecclesiastes 11:2,
// which is the whole anchor of buy7 in Buying and Terms), and the surviving
// claim -- zero SHARED VERSES, three shared chapters at different passages --
// is checked here rather than asserted in a comment (DR-0076 §4).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  INSURANCE_RISK_MODULES, INSURANCE_RISK_META, INSURANCE_RISK_SESSION_FLOW,
  INSURANCE_RISK_SESSION_MINUTES, INSURANCE_RISK_CARE_NOTE, INSURANCE_RISK_TUTOR_META,
  INSURANCE_RISK_INTEREST_TAG, INSURANCE_RISK_HELPER_TAG,
  buildInsuranceRiskSchedule, insuranceRiskProgressSummary,
  exportInsuranceRiskCurriculumMarkdown, insuranceRiskRefs,
} from '../lib/insurance-risk-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { scanModules } from '../lib/plain-before-the-term.js';
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
  // A double-quoted span with no reference after it reads as Scripture to a
  // reader and is not checkable. Three such phrases were in the draft (a
  // rhetorical question, reported speech in a parable, a phrase named in a quiz
  // question) and all three were rewritten rather than allow-listed, because an
  // allowlist is how this check gets hollowed out later.
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (t) => String(t).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

const lessonOf = (n) => INSURANCE_RISK_MODULES[n - 1];
const ROW = LEARN_CATALOG.find((c) => c.key === 'insurance-risk');
const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];
const readerText = (m) => [
  ...READER_FIELDS.map((f) => m[f]),
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.stories || []).map((s) => s.body),
  ...((m.quiz || {}).questions || []).map((q) => `${q.q} ${(q.options || []).join(' ')} ${q.explain}`),
  ...((m.facilitator || {}).talkingPoints || []),
].filter((x) => typeof x === 'string').join('\n');

describe('THE GATE, PROVEN TO CATCH BEFORE IT IS TRUSTED (DR-0076 §3)', () => {
  it('catches a quotation that is not verbatim', () => {
    const bad = 'He said, "then they shall sell the live ox, and divide the silver of it" (Exodus 21:35)';
    expect(quotationFaults(bad, 'x')).toHaveLength(1);
    expect(quotationFaults(bad, 'x')[0]).toContain('NOT VERBATIM');
  });

  it('catches a double-quoted span with no reference behind it', () => {
    expect(quotationFaults('He said, "the dead shall be his own" and moved on.', 'x')[0]).toContain('ORPHAN');
  });

  it('passes the real thing', () => {
    const good = '"Or if it be known that the ox hath used to push in time past, and his owner hath not kept him in; he shall surely pay ox for ox; and the dead shall be his own." (Exodus 21:36)';
    expect(quotationFaults(good, 'x')).toEqual([]);
  });

  it('resolves the repository KJV at all — this is not measuring nothing', () => {
    expect(versesOf('Exodus', 21, '36')).toContain('the dead shall be his own');
    expect(versesOf('Luke', 13, '5')).toContain('except ye repent');
  });
});

describe('every quoted span in the course is verbatim, referenced, and un-elided', () => {
  it('walks every string the reader can reach', () => {
    const faults = [];
    walkStrings(INSURANCE_RISK_MODULES, 'modules', (text, path) => faults.push(...quotationFaults(text, path)));
    walkStrings(INSURANCE_RISK_META, 'meta', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const bad = [];
    walkStrings(INSURANCE_RISK_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) {
        if (/…|\.\.\./.test(span)) bad.push(`${path}: ${span.slice(0, 60)}`);
      }
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('really is checking a large body of quotation, not a handful', () => {
    let spans = 0;
    walkStrings(INSURANCE_RISK_MODULES, 'modules', (text) => {
      SPAN.lastIndex = 0; while (SPAN.exec(text)) spans += 1;
    });
    expect(spans).toBeGreaterThan(200);
  });
});

describe('the build contract — nine exports and a catalog row', () => {
  it('ships eight lessons with stable ids', () => {
    expect(INSURANCE_RISK_MODULES).toHaveLength(8);
    expect(INSURANCE_RISK_MODULES.map((m) => m.id)).toEqual([
      'ins1-the-pit-you-dug',
      'ins2-i-bare-the-loss-of-it',
      'ins3-into-two-bands',
      'ins4-the-tower-in-siloam',
      'ins5-four-messengers-one-day',
      'ins6-provide-for-his-own',
      'ins7-of-that-which-doth-cost-me-nothing',
      'ins8-it-beat-upon-that-house',
    ]);
  });

  it('exports the meta, the flow, the minutes and the tags', () => {
    expect(INSURANCE_RISK_META.key).toBe('insurance-risk');
    expect(INSURANCE_RISK_META.weeks).toBe(8);
    expect(INSURANCE_RISK_META.wordFirst.ref).toBe('Exodus 21:35; Exodus 21:36');
    expect(INSURANCE_RISK_SESSION_FLOW.length).toBeGreaterThan(4);
    expect(INSURANCE_RISK_SESSION_MINUTES).toBe(INSURANCE_RISK_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
    expect(INSURANCE_RISK_INTEREST_TAG).toBe('[Insurance and Risk]');
    expect(INSURANCE_RISK_HELPER_TAG).toBe('[Insurance and Risk helper]');
    expect(INSURANCE_RISK_TUTOR_META.key).toBe('insurance-risk');
  });

  it('builds a schedule, a progress summary and a markdown export', () => {
    const rows = buildInsuranceRiskSchedule(null);
    expect(rows).toHaveLength(8);
    expect(rows[0].id).toBe('ins1-the-pit-you-dug');
    expect(insuranceRiskProgressSummary({}).total).toBe(8);
    const md = exportInsuranceRiskCurriculumMarkdown(null);
    expect(md).toContain(INSURANCE_RISK_META.title);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('reports every reference it cites, deduped', () => {
    const refs = insuranceRiskRefs();
    expect(refs).toContain('Exodus 21:35');
    expect(refs).toContain('Luke 13:5');
    expect(refs).toContain('Matthew 7:27');
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
    expect(ROW.tutorCourseMeta).toBe(INSURANCE_RISK_TUTOR_META);
  });

  it('is reachable by an everyday word (DR-0519)', () => {
    expect(plainWordsFor('insurance-risk')).toContain('insurance');
    expect(plainWordsFor('insurance-risk').length).toBeGreaterThanOrEqual(4);
  });

  it('carries the teaching-not-advice note, and says where a hurt reader should start', () => {
    expect(INSURANCE_RISK_CARE_NOTE).toMatch(/not insurance or legal advice/i);
    expect(INSURANCE_RISK_CARE_NOTE).toMatch(/licensed professional in your own state/i);
    expect(INSURANCE_RISK_CARE_NOTE).toMatch(/start at lesson four and lesson five/i);
    expect(INSURANCE_RISK_META.care).toBe(INSURANCE_RISK_CARE_NOTE);
  });
});

describe('the DR-0509 lesson contract, on every lesson', () => {
  for (const m of INSURANCE_RISK_MODULES) {
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
    const missing = INSURANCE_RISK_MODULES.filter((m) => !/Yahweh/.test(ours(readerText(m)))).map((m) => m.id);
    expect(missing, `no Yahweh in our own prose: ${missing.join(', ')}`).toEqual([]);
  });

  it('never substitutes Yahweh into a quotation — the KJV God and LORD stand', () => {
    const inserted = [];
    walkStrings(INSURANCE_RISK_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) if (/Yahweh/.test(span)) inserted.push(`${path}: ${span.slice(0, 50)}`);
    });
    expect(inserted, inserted.join('\n')).toEqual([]);
    // And the KJV wording really is being carried through untouched.
    expect(readerText(lessonOf(5))).toContain('blessed be the name of the LORD');
  });

  it('recites no decision-record id at a reader', () => {
    const recited = [];
    walkStrings(INSURANCE_RISK_MODULES, 'modules', (text, path) => {
      if (/\bDR-\d{4}\b/.test(text)) recited.push(`${path}: ${String(text).match(/\bDR-\d{4}\b/)[0]}`);
    });
    expect(recited, recited.join('\n')).toEqual([]);
  });

  it('leads with the plain meaning of every hard term (DR-0521)', () => {
    expect(scanModules(INSURANCE_RISK_MODULES)).toEqual([]);
  });
});

describe('THE FOUR DOCTRINAL LIMITS, pinned so an edit cannot quietly delete one', () => {
  it('Luke 13 teaches BOTH sentences — the Nay and the call', () => {
    const t = readerText(lessonOf(4));
    expect(t).toContain('"I tell you, Nay: but, except ye repent, ye shall all likewise perish." (Luke 13:3)');
    expect(t).toContain('"I tell you, Nay: but, except ye repent, ye shall all likewise perish." (Luke 13:5)');
    // And the abuse of dropping verse 5 is named as an abuse, not merely avoided.
    expect(t).toMatch(/drops verse 5 flatters the room and misreports Him/);
    // The other abuse too: a calamity read as a verdict on the person.
    expect(t).toMatch(/report card on that household/);
  });

  it('Luke 13 also keeps the second case, the one with nobody to blame', () => {
    const t = readerText(lessonOf(4));
    expect(t).toContain('the tower in Siloam fell, and slew them');
    expect(t).toMatch(/no human agent in it|nobody to blame|no human villain/);
  });

  it('1 Timothy 5:8 carries its limit BEFORE any application', () => {
    const t = readerText(lessonOf(6));
    expect(t).toContain('"But if any provide not for his own, and specially for those of his own house, he hath denied the faith, and is worse than an infidel." (1 Timothy 5:8)');
    expect(t).toMatch(/does not mention insurance/);
    expect(t).toMatch(/It cannot be made to command insurance|cannot be made to command it/);
    // The limit is stated up front in the lesson itself, not buried at the end.
    const body = lessonOf(6).lesson;
    expect(body.indexOf('does not mention insurance')).toBeLessThan(body.length * 0.6);
  });

  it('2 Samuel 24 says David is speaking of worship, and refuses the transactional reading', () => {
    const t = readerText(lessonOf(7));
    expect(t).toContain('neither will I offer burnt offerings unto the LORD my God of that which doth cost me nothing');
    expect(t).toMatch(/David is speaking about WORSHIP/);
    expect(t).toMatch(/He was not purchased/);
    expect(t).toMatch(/fifty shekels the cause of/);
  });

  it('Matthew 7 keeps the storm clauses identical and both builders hearing', () => {
    const t = readerText(lessonOf(8));
    const first = '"And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock." (Matthew 7:25)';
    const second = '"And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell: and great was the fall of it." (Matthew 7:27)';
    expect(t).toContain(first);
    expect(t).toContain(second);
    expect(t).toMatch(/BOTH OF THEM HEARD|both men HEARD|BOTH HEARD/);
    expect(t).toMatch(/weather is not the variable|weather was never the variable/);
  });

  it('Exodus 21:35 and 21:36 are separate quotations with their own references', () => {
    const t = readerText(lessonOf(1));
    expect(t).toContain('and the dead ox also they shall divide." (Exodus 21:35)');
    expect(t).toContain('and the dead shall be his own." (Exodus 21:36)');
    // The pair is the find the course is built on, so the distinction is named.
    expect(t).toMatch(/IF IT BE KNOWN/);
  });

  it('Exodus 22 gives BOTH halves of the keeper rule, so it is proportion and not indulgence', () => {
    const t = readerText(lessonOf(2));
    expect(t).toContain('"If it be torn in pieces, then let him bring it for witness, and he shall not make good that which was torn." (Exodus 22:13)');
    expect(t).toContain('"And if it be stolen from him, he shall make restitution unto the owner thereof." (Exodus 22:12)');
    expect(t).toMatch(/THE KEEPER ANSWERS FOR WHAT KEEPING COULD HAVE PREVENTED/);
  });

  it('Job 1 holds grief and worship together, and keeps the inspired verdict', () => {
    const t = readerText(lessonOf(5));
    expect(t).toContain('"Then Job arose, and rent his mantle, and shaved his head, and fell down upon the ground, and worshipped," (Job 1:20)');
    expect(t).toContain('"In all this Job sinned not, nor charged God foolishly." (Job 1:22)');
    expect(t).toMatch(/composure is the measure of faith|going to the ground is not the failure/);
  });

  it('the tutor carries the same limits it would otherwise be free to ignore', () => {
    const p = INSURANCE_RISK_TUTOR_META.posture;
    expect(p).toMatch(/BOTH sentences/);
    expect(p).toMatch(/care of relatives and widows/);
    expect(p).toMatch(/intreated, not purchased/);
    expect(p).toMatch(/both builders heard/);
    expect(p).toMatch(/never give insurance or legal advice/i);
    expect(p).toMatch(/lesson four and lesson five/);
  });
});

describe('FRESHNESS INSIDE THE DEPARTMENT, measured rather than claimed (DR-0076 §4)', () => {
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
      for (let v = a; v <= b && v - a < 60; v += 1) out.push(`${m[1].trim()} ${m[2]}:${v}`);
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

  it('shares NOT ONE verse with any other course in the department', () => {
    const mine = versesCited(ROW);
    expect(mine.size).toBeGreaterThan(40);
    const shared = [];
    for (const c of dept) {
      if (c.key === 'insurance-risk') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) shared.push(`${v} <- ${c.key}`);
    }
    expect(shared, `verse shared inside the department:\n${shared.join('\n')}`).toEqual([]);
  });

  it('shares exactly three CHAPTERS, each at a different passage, and they are named', () => {
    const chOf = (v) => v.replace(/:.*$/, '');
    const mine = new Set([...versesCited(ROW)].map(chOf));
    const theirs = new Set();
    for (const c of dept) if (c.key !== 'insurance-risk') for (const v of versesCited(c)) theirs.add(chOf(v));
    const overlap = [...mine].filter((c) => theirs.has(c)).sort();
    // If this list grows, the header comment is no longer true and must be
    // re-measured and re-written — which is the failure the first claim had.
    expect(overlap).toEqual(['Exodus 22', 'Proverbs 22', 'Proverbs 27']);
  });

  it('no longer carries Ecclesiastes 11:2, which is the whole anchor of buy7', () => {
    let found = false;
    walkStrings(INSURANCE_RISK_MODULES, '', (t) => { if (/Ecclesiastes/.test(t)) found = true; });
    walkStrings(INSURANCE_RISK_META, '', (t) => { if (/Ecclesiastes/.test(t)) found = true; });
    expect(found).toBe(false);
    // And the ground it was carrying is still taught, from James.
    expect(readerText(lessonOf(3))).toContain('"Whereas ye know not what shall be on the morrow. For what is your life? It is even a vapour, that appeareth for a little time, and then vanisheth away." (James 4:14)');
  });
});
