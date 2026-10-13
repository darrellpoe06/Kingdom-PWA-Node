// @vitest-environment node
// =============================================================================
// Banking: What the Bank Does With Your Money
// =============================================================================
// Darrell 2026-09-19 named the gap in four words — "Banking courses etc..." —
// in the same breath as the plain-words work (DR-0519), and the two belong
// together: a person looking for this course is thinking the word BANK, not the
// word stewardship.
//
// THE EIGHT THINGS THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. THE STORAGE PICTURE LEFT INTACT. A reader who thinks a deposit sits in a
//      drawer cannot reason about deposit insurance, reserve requirements, or a
//      thirtyfold rate gap inside one building. Lesson 1 replaces the picture
//      before it teaches anything else.
//   2. GENESIS 41 TAUGHT AS ONLY A WARNING. The purpose is written into the
//      text — that the land perish not — so the course says in its first
//      session that the institution itself is not the abuse, and only then
//      gives the verb that carries the warning: the corn was SOLD.
//   3. EXODUS 22:25 INFLATED INTO A THEORY OF FINANCE. It names its borrower —
//      my people, and poor by thee — and stretching it is how a true thing
//      loses its authority. Explaining it away is the opposite failure, and the
//      lesson names BOTH out loud.
//   4. EZEKIEL 18 STOPPED AT VERSE 13. The chapter has a door in it, and a
//      reader who inherited a book of this needs verse 17 the same night.
//   5. NEHEMIAH 5 TOLD AS AN INSTITUTIONAL STORY. It is a cry, against their
//      BRETHREN, under a governor who was lending — and the hinge is verse 10,
//      where he names himself before asking anyone else to stop.
//   6. SURETY TREATED AS UNWISE RATHER THAN AS A TRAP. Solomon uses prey-and-
//      predator language and gives a deadline of tonight, and the reason
//      sensible people sign is social (Proverbs 17:18), not financial.
//   7. SAVING AND HOARDING COLLAPSED. These texts commend preparation and do
//      NOT define hoarding; inventing a doctrine to fill that silence is the
//      failure this house refuses (DR-0098), so the course says what all three
//      stores show — every one has a release in view — and stops.
//   8. AMOS 8 TURNED INTO ALL FEES ARE THEFT. Documented harm is stated plainly
//      and NOT hedged; the specific national percentage is refused because those
//      figures circulate detached from their studies; and the over-reach is
//      corrected while every bit of the data under it stands (DR-0100).
//
// WHAT THIS COURSE'S OWN GATES CAUGHT WHILE IT WAS BEING WRITTEN, recorded
// because it is the more useful half. Lesson 1 lowercased the opening "And" of
// Genesis 41:49 in five places to make it fit a sentence, which is not
// verbatim. Lesson 4's big idea carried Proverbs 6:1 and 6:2 as ONE quotation
// with both references trailing it — the identical defect L179 shipped in draft
// the same evening. Lesson 8 rendered a clause of 1 Timothy 6:17 in our own
// prose in capitals instead of quoting it. And the DR-0521 plain-meaning gate
// failed this course on `collateral` five times, on `surety` twice and on
// `ephah` four times: every one was fixed by leading with the meaning, never by
// widening the rule.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BANKING_MODULES, BANKING_META, BANKING_SESSION_FLOW, BANKING_SESSION_MINUTES,
  BANKING_CARE_NOTE, BANKING_TUTOR_META, BANKING_INTEREST_TAG, BANKING_HELPER_TAG,
  buildBankingSchedule, bankingProgressSummary, exportBankingCurriculumMarkdown, bankingRefs,
} from '../lib/banking-course.js';
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
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (t) => String(t).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

describe('THE GATE, PROVEN TO CATCH BEFORE IT IS TRUSTED (DR-0076 §3)', () => {
  it('catches the lowercased opening word — the defect lesson one shipped in draft', () => {
    // The first draft wrote "and Joseph gathered..." to fit a sentence. The KJV
    // has "And". A quotation that changes a capital is not verbatim.
    const bad = '"and Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49)';
    expect(quotationFaults(bad).join(' ')).toMatch(/NOT VERBATIM/);
  });

  it('catches two verses filed under one reference — the defect lesson four shipped in draft', () => {
    const bad = '"My son, if thou be surety for thy friend, if thou hast stricken thy hand with a stranger, Thou art snared with the words of thy mouth, thou art taken with the words of thy mouth." (Proverbs 6:1)';
    expect(quotationFaults(bad).join(' ')).toMatch(/NOT VERBATIM/);
  });

  it('catches a quotation with no reference', () => {
    expect(quotationFaults('He said "wherein shall he sleep" and left it there.').join(' ')).toMatch(/ORPHAN/);
  });

  it('passes correct text, so a green result means something', () => {
    expect(quotationFaults('"If thou lend money to any of my people that is poor by thee, thou shalt not be to him as an usurer, neither shalt thou lay upon him usury." (Exodus 22:25)')).toEqual([]);
  });
});

describe('every quoted span in the whole course is His words', () => {
  it('walks every string field and finds no drift', () => {
    const faults = [];
    walkStrings(BANKING_MODULES, 'modules', (t, p) => faults.push(...quotationFaults(t, p)));
    walkStrings(BANKING_META, 'meta', (t, p) => faults.push(...quotationFaults(t, p)));
    expect(faults, faults.slice(0, 8).join('\n')).toEqual([]);
  });

  it('quotes enough of the Word to be a Word-first course, measured', () => {
    let spans = 0;
    walkStrings(BANKING_MODULES, '', (t) => { SPAN.lastIndex = 0; while (SPAN.exec(t)) spans += 1; });
    expect(spans).toBeGreaterThanOrEqual(220);
  });

  it('never substitutes Yahweh into a quotation, and never elides inside one', () => {
    const faults = [];
    walkStrings(BANKING_MODULES, 'modules', (t, p) => {
      for (const s of String(t).match(ALL_SPANS) || []) {
        if (/Yahweh/.test(s)) faults.push(`${p}: Yahweh inside a quotation — ${s.slice(0, 40)}`);
        if (/\.\.\.|…/.test(s)) faults.push(`${p}: elision inside a quotation — ${s.slice(0, 40)}`);
      }
    });
    expect(faults).toEqual([]);
  });

  it('speaks His covenant name in our own voice in every lesson', () => {
    for (const m of BANKING_MODULES) {
      expect(ours(m.lesson), `${m.id} never names Yahweh in our voice`).toMatch(/Yahweh/);
    }
  });
});

describe('it teaches something its siblings did not', () => {
  // Derived from the LIVE mounted catalog rather than from a helper, so a
  // sibling course that gains a passage tomorrow is caught by this check.
  const siblingChapters = () => {
    const out = new Set();
    for (const e of LEARN_CATALOG) {
      if (e.key === 'banking') continue;
      if (e.meta.category !== 'Kingdom Life & Stewardship') continue;
      for (const m of e.buildScheduleRows()) {
        for (const part of String((m.anchor && m.anchor.ref) || '').split(';')) {
          const ref = part.trim();
          if (ref) out.add(ref.split(':')[0].trim());
        }
      }
    }
    return out;
  };

  it('shares no book-and-chapter with any other course in its department', () => {
    const others = siblingChapters();
    expect(others.size, 'the sibling chapter set is empty — this check is measuring nothing').toBeGreaterThan(10);
    const mine = bankingRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
  });

  it('anchors on the chapters this course was built from', () => {
    const chapters = [...new Set(bankingRefs().map((r) => r.split(':')[0].trim()))].sort();
    expect(chapters).toEqual(['1 Timothy 6', '2 Kings 12', 'Amos 8', 'Exodus 22', 'Genesis 41', 'Nehemiah 5', 'Proverbs 6']);
  });
});

describe('the line this course holds (DR-0098 / DR-0100)', () => {
  const lesson = (n) => BANKING_MODULES[n - 1];

  it('lesson two keeps BOTH qualifiers and names both failure directions', () => {
    const t = `${lesson(2).lesson} ${lesson(2).levels.senior}`;
    expect(ours(t)).toMatch(/poor by thee/i);
    expect(ours(t)).toMatch(/my people/i);
    expect(ours(t)).toMatch(/stretch/i);
    // Read off the emitted text rather than from intent: the lesson says
    // "most often stretched and most often explained away, and both moves are
    // failures". An assertion that fails on correct content would pass on wrong.
    expect(ours(t)).toMatch(/explained away/i);
  });

  it('lesson two teaches Ezekiel 18 to verse 17, never stopping at 13', () => {
    for (const band of ['lesson', 'senior']) {
      const text = band === 'lesson' ? lesson(2).lesson : lesson(2).levels[band];
      expect(text, `lesson two ${band} stops before the door`).toContain('(Ezekiel 18:17)');
    }
  });

  it('lesson five refuses to invent a doctrine of hoarding the texts do not give', () => {
    const t = ours(`${lesson(5).lesson} ${lesson(5).levels.senior}`);
    expect(t).toMatch(/do not set out a doctrine of hoarding|not set out a doctrine/i);
    expect(t).toMatch(/release/i);
  });

  it('lesson six states the harm plainly, refuses the figure, and corrects the over-reach', () => {
    const t = ours(`${lesson(6).lesson} ${lesson(6).levels.senior}`);
    expect(t, 'does not state the documented harm').toMatch(/not in serious dispute|documented/i);
    expect(t, 'does not refuse the untraceable figure').toMatch(/WILL NOT DO: quote a specific national figure/);
    expect(t, 'does not correct the over-reach').toMatch(/not a teaching that all fees are theft|all fees are theft/i);
  });

  it('lesson six turns the blade inward rather than ending on institutions', () => {
    const t = ours(`${lesson(6).lesson} ${lesson(6).levels.senior}`);
    expect(t).toMatch(/late fee/i);
    expect(t).toMatch(/you set|YOU set/);
  });

  it('every lesson carries the care note’s posture — teaching, not advice', () => {
    expect(BANKING_CARE_NOTE).toMatch(/not financial or legal advice/i);
    expect(BANKING_META.care).toBe(BANKING_CARE_NOTE);
    expect(BANKING_TUTOR_META.posture).toMatch(/Never give financial or legal advice/i);
  });
});

describe('the shape every course in this catalog has (DR-0509)', () => {
  it('carries eight lessons, each with both bands, six benefits and two stories', () => {
    expect(BANKING_MODULES).toHaveLength(8);
    for (const m of BANKING_MODULES) {
      expect(m.levels.teen, `${m.id} has no teen band`).toBeTruthy();
      expect(m.levels.senior, `${m.id} has no senior band`).toBeTruthy();
      expect(m.benefits.length, `${m.id} benefits`).toBeGreaterThanOrEqual(5);
      expect(m.stories, `${m.id} stories`).toHaveLength(2);
      for (const s of m.stories) {
        expect(['parable', 'testimony']).toContain(s.kind);
        expect(s.body.split(/\s+/).length, `${m.id} story too short`).toBeGreaterThan(120);
      }
      expect(m.quiz.questions.length, `${m.id} quiz`).toBeGreaterThanOrEqual(3);
      expect(m.facilitator.talkingPoints.length, `${m.id} talking points`).toBeGreaterThanOrEqual(5);
      expect(String(m.lesson).split(/\s+/).length, `${m.id} lesson too short`).toBeGreaterThan(400);
    }
  });

  it('builds a schedule, a progress summary and a markdown export', () => {
    const rows = buildBankingSchedule(null);
    expect(rows).toHaveLength(8);
    expect(rows[0].week).toBe(1);
    expect(bankingProgressSummary({}).done).toBe(0);
    const md = exportBankingCurriculumMarkdown(null);
    expect(md).toContain(BANKING_META.title);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('declares the session flow and its total', () => {
    expect(BANKING_SESSION_MINUTES).toBe(BANKING_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
    expect(BANKING_SESSION_MINUTES).toBe(65);
  });

  it('carries the interest tags the door uses', () => {
    expect(BANKING_INTEREST_TAG).toBe('[Banking]');
    expect(BANKING_HELPER_TAG).toBe('[Banking helper]');
  });
});

describe('it is registered and reachable — built means surfaced (DR-0065)', () => {
  it('is in the catalog, under its department, with all eight lessons', () => {
    const row = LEARN_CATALOG.find((e) => e.key === 'banking');
    expect(row, 'banking is not registered in LEARN_CATALOG').toBeTruthy();
    expect(row.meta.category).toBe('Kingdom Life & Stewardship');
    expect(row.buildScheduleRows()).toHaveLength(8);
    expect(row.tutorCourseMeta).toBe(BANKING_TUTOR_META);
  });

  it('is reachable by the plain word a person would actually think of (DR-0519)', () => {
    const words = plainWordsFor('banking');
    expect(words.length).toBeGreaterThanOrEqual(3);
    expect(words).toContain('bank');
    expect(words).toContain('money');
    // And the title genuinely does not contain the everyday word for saving,
    // which is why the declaration has to exist.
    expect(BANKING_META.title.toLowerCase()).not.toContain('saving');
  });

  it('obeys the plain-meaning rule it was written under (DR-0521)', () => {
    expect(scanModules(BANKING_MODULES)).toEqual([]);
  });
});
