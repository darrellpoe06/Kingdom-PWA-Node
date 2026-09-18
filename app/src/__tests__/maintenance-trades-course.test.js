// @vitest-environment node
// =============================================================================
// MAINTENANCE, REPAIRS AND THE TRADES — Real Estate, course five
// =============================================================================
// The building itself: what keeps it standing, who does that work, and the ways
// an owner quietly lets it go. Courses one through four covered the ground, the
// stewardship, the transaction and the person on the other side of it.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. A SLOGAN INSTEAD OF AN INSTRUMENT. "Deferred maintenance is a false
//      economy" is true and useless on its own. Lesson 6 names the actual
//      downstream channels (emergency rate, collateral damage, vacancy,
//      concession, lost tenant, management hours) and lesson 7 gives the
//      instrument — cost beside production, one page — rather than telling a
//      reader to spend more. Both are pinned.
//   2. MORALISING A REAL CONSTRAINT. Money IS finite and every repair cannot be
//      done at once; a course that pretends otherwise gets ignored by the very
//      owner it is for. Lesson 1 raises that objection in the text and answers
//      it with the blunt-iron verse rather than stepping around it. Pinned.
//   3. MISREADING 2 KINGS 12 AS "AUDITS ARE FAITHLESS". Lesson 4 states the
//      limit BEFORE the application, in the text. Pinned, because dropping the
//      limit is what would make the lesson dangerous rather than merely wrong.
//   4. LETTING THE TRUST LEDGER RUN ONE WAY. The half owners omit is whether a
//      tradesman would start work for THEM on their word alone. Pinned.
//   5. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with any of the OTHER FOUR Real Estate courses, measured against
//      their own refs lists. All nine here are fresh ground.
//   6. SCRIPTURE FROM MEMORY. 76 quoted spans walked against the repo's own
//      KJV — clean on the generator's FIRST run, the first course in this
//      department where that was true.
//   7. CHECKS WRITTEN FROM WHAT I MEANT INSTEAD OF WHAT THE TEXT SAYS. Six of
//      the leasing course's assertions failed on correct content for exactly
//      that reason (DR-0507). Every content assertion below was written by
//      reading the emitted text rather than from memory of what was intended.
//   8. A SUMMARY WEARING A BAND'S NAME. Measured across all eight lessons AT
//      ONCE before anything was fixed. ONE dimension failed — fullness, eight
//      teen bands at 0.38-0.58 and two senior at 0.56-0.60 against the 0.6
//      floor. Everything else passed on the first measurement: no collision,
//      teen FK 3.0-3.9 against a 6.0 ceiling, senior 7.5-9.8 against 10.0, the
//      ladder correct in all eight, overlap 0.051-0.199 against 0.25, and every
//      anchor theme already carrying real prose.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAINTENANCE_TRADES_MODULES, MAINTENANCE_TRADES_META, MAINTENANCE_TRADES_SESSION_FLOW,
  MAINTENANCE_TRADES_CARE_NOTE, MAINTENANCE_TRADES_TUTOR_META,
  buildMaintenanceTradesSchedule, maintenanceTradesProgressSummary,
  exportMaintenanceTradesCurriculumMarkdown, maintenanceTradesRefs,
} from '../lib/maintenance-trades-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { managementStewardshipRefs } from '../lib/management-stewardship-course.js';
import { buyingTermsRefs } from '../lib/buying-terms-course.js';
import { leasingTenantsRefs } from '../lib/leasing-tenants-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

/**
 * DR-0459 forbids an ellipsis INSIDE a quotation. It PERMITS one in our own
 * prose between two quotations. The first version of this check ran the regex
 * from one closing quote to the next opening one, so it flagged our own prose —
 * measured 2026-09-18 when it false-blocked a leasing-course band. Each quoted
 * span is now tested on its own.
 */
function elidedSpans(text) {
  const out = [];
  for (const m of String(text).matchAll(/"([^"]*)"/g)) {
    if (/\.\.\.|\u2026/.test(m[1])) out.push(m[1]);
  }
  return out;
}


const M = MAINTENANCE_TRADES_MODULES;
const TEEN_CEILING = 6.0;
const SENIOR_CEILING = 10.0;
const FULL_FLOOR = 0.6;
const NEAR_COPY = 0.25;

const fk = (t) => fleschKincaidGrade(ourProseOnly(String(t || '')));
const words = (t) => (ourProseOnly(String(t || '')).match(/[A-Za-z’']+/g) || []).length;
const overlapOf = (a, b) => overlap(shingles(ourProseOnly(a)), shingles(ourProseOnly(b)));

// --- the repo's own KJV, read from disk -------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
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
const norm = (s) => String(s).replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansWithRef = (text) => {
  const out = []; SPAN_WITH_REF.lastIndex = 0; let m;
  while ((m = SPAN_WITH_REF.exec(text))) out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  return out;
};
const quotationFaults = (text) => {
  const out = [];
  for (const sp of spansWithRef(String(text || ''))) {
    const real = versesOf(sp.book, sp.ch, sp.vs);
    if (!real) { out.push(`cannot load ${sp.book} ${sp.ch}:${sp.vs}`); continue; }
    if (!norm(real).toLowerCase().includes(norm(sp.quote).toLowerCase())) {
      out.push(`NOT VERBATIM "${sp.quote}" vs ${sp.book} ${sp.ch}:${sp.vs} — ${norm(real)}`);
    }
  }
  return out;
};
/** Walk every string in the module tree, with its path. */
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g;
/** OUR prose only: quotations and their reference parentheses removed. */
const ours = (text) => String(text || '').replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');



describe('the course exists, and it argues in order', () => {
  it('carries eight lessons in the order the argument runs', () => {
    expect(M.map((m) => m.id)).toEqual([
      'maint1-by-much-slothfulness-the-building-decayeth',
      'maint2-called-by-name-and-filled-for-the-work',
      'maint3-daubed-with-untempered-morter',
      'maint4-for-they-dealt-faithfully',
      'maint5-stone-made-ready-before-it-was-brought',
      'maint6-wages-into-a-bag-with-holes',
      'maint7-where-no-oxen-are-the-crib-is-clean',
      'maint8-the-repairer-of-the-breach',
    ]);
    expect(MAINTENANCE_TRADES_META.weeks).toBe(M.length);
  });

  it('closes by naming its own order as the teaching', () => {
    expect(M[7].lesson).toMatch(/WHY THIS LESSON COMES LAST/);
    expect(M[7].lesson, 'it must say what the seven before it were')
      .toMatch(/the preceding seven are all technique/);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      expect(words(m.anchor.theme), `${m.id} anchor theme is almost pure quotation`).toBeGreaterThan(12);
      expect(words(m.lesson), `${m.id} lesson`).toBeGreaterThan(200);
      expect(m.quiz.questions.length, `${m.id} quiz`).toBe(2);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBe(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(words(q.explain), `${m.id} explain`).toBeGreaterThan(10);
      }
      expect(m.facilitator.talkingPoints.length, `${m.id} talking points`).toBe(4);
      expect(m.facilitator.discussionPrompts.length, `${m.id} prompts`).toBe(3);
      expect(m.facilitator.howToRun, `${m.id} howToRun`).toContain('Prayer + the anchor');
    }
  });

  it('states its limit on the meta and in the tutor posture', () => {
    expect(MAINTENANCE_TRADES_META.care).toBe(MAINTENANCE_TRADES_CARE_NOTE);
    expect(MAINTENANCE_TRADES_CARE_NOTE).toMatch(/not legal or trade advice/i);
    // this course's specific hazard: it must not read as permission to do work
    // that requires a licensed trade
    expect(MAINTENANCE_TRADES_CARE_NOTE).toMatch(/licensed/i);
    expect(MAINTENANCE_TRADES_CARE_NOTE).toMatch(/permit/i);
    expect(MAINTENANCE_TRADES_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
    expect(MAINTENANCE_TRADES_TUTOR_META.posture).toMatch(/qualifies anyone to perform licensed work/);
  });

  it('opens Word-first on the decay and on the gifting', () => {
    const wf = MAINTENANCE_TRADES_META.wordFirst;
    expect(wf.ref).toContain('Ecclesiastes 10:18');
    expect(wf.frame).toContain('By much slothfulness the building decayeth');
    expect(wf.frame).toContain('in all manner of workmanship');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(MAINTENANCE_TRADES_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
    expect(MAINTENANCE_TRADES_META.handsOnLabel).toBe('Work it on a real building');
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with ANY of the other four Real Estate courses', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs(),
      ...buyingTermsRefs(), ...leasingTenantsRefs()].map((r) => r.split(':')[0].trim()));
    const mine = maintenanceTradesRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(40);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = maintenanceTradesRefs();
    expect(refs.length).toBeGreaterThan(8);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing`).toContain(part.trim());
      }
    }
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module', () => {
    const bad = []; let spans = 0;
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        spans += spansWithRef(text).length;
        for (const f of quotationFaults(text)) bad.push(`${path}: ${f}`);
      });
    }
    expect(bad, bad.join('\n')).toEqual([]);
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(60);
  });

  it('never elides INSIDE a quotation, and does not flag our own prose', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(elidedSpans(text), `${path} elided a quotation`).toEqual([]);
      });
    }
    // PROVEN-TO-CATCH, both forms, on the same function the walk above uses.
    expect(elidedSpans('"By much slothfulness ... the house droppeth through" (Ecclesiastes 10:18)').length,
      'a real elision passed').toBe(1);
    expect(elidedSpans('"By much slothfulness … droppeth through" (Ecclesiastes 10:18)').length,
      'a unicode elision passed').toBe(1);
    expect(elidedSpans('The roof went. And then... then "the house droppeth through".'),
      'our own prose between two quotations was flagged').toEqual([]);
  });

  it('says Yahweh in OUR voice and leaves "the LORD" and "God" where the KJV has them', () => {
    const stray = [];
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        if (/\bthe LORD\b/.test(ours(text))) stray.push(`${path}: "the LORD" in our own prose`);
      });
    }
    expect(stray, stray.join('\n')).toEqual([]);
    expect(M.map((m) => m.lesson).join(' ')).toContain('Yahweh');
    // and the quotations that DO carry His titles are untouched (DR-0210)
    expect(M[1].lesson).toContain('I have filled him with the spirit of God');
    expect(M[3].lesson).toContain('to repair the breaches of the house of the LORD');
  });

  it('never capitalises the adversary', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        for (const w of ['Satan', 'Lucifer', 'The Devil', 'The Adversary']) {
          expect(text.includes(w), `${path} capitalised ${w}`).toBe(false);
        }
      });
    }
  });
});

describe('two bands from the first commit, measured', () => {
  for (const m of M) {
    it(`${m.id}: the ladder, the floor and the ceiling all hold`, () => {
      const t = fk(m.levels.teen); const s = fk(m.levels.senior);
      expect(t, `teen ${t} does not read easier than senior ${s}`).toBeLessThan(s);
      expect(t, `teen grade ${t}`).toBeLessThanOrEqual(TEEN_CEILING);
      expect(s, `senior grade ${s}`).toBeLessThanOrEqual(SENIOR_CEILING);
      for (const band of ['teen', 'senior']) {
        const share = words(m.levels[band]) / words(m.lesson);
        expect(share, `${band} carries only ${share.toFixed(2)} of the adult text`).toBeGreaterThanOrEqual(FULL_FLOOR);
      }
      expect(NEAR_COPY).toBeLessThan(DIFF_CEILING);
      expect(overlapOf(m.levels.teen, m.levels.senior), 'teen~senior').toBeLessThanOrEqual(NEAR_COPY);
      expect(overlapOf(m.levels.teen, m.lesson), 'teen~adult').toBeLessThanOrEqual(NEAR_COPY);
      expect(overlapOf(m.levels.senior, m.lesson), 'senior~adult').toBeLessThanOrEqual(NEAR_COPY);
    });
  }

  it('renders both bands without losing a word', () => {
    for (const m of M) {
      for (const band of ['teen', 'senior']) {
        const text = m.levels[band];
        const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
        const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
      }
    }
  });
});

describe('the eight moves each teach their own thing', () => {
  it('lesson 1 states decay as a RATE and answers the money objection', () => {
    const l = M[0];
    expect(l.lesson).toContain('By much slothfulness the building decayeth');
    expect(l.lesson).toContain('then must he put to more strength');
    // the objection must be RAISED in the text, not stepped around
    expect(l.lesson, 'the money constraint is real and must be named')
      .toMatch(/NOW THE OBJECTION/);
    expect(l.lesson).toMatch(/maintenance is a RATE, not a project/);
  });

  it('lesson 2 puts workmanship in the filling, and makes it operational', () => {
    const l = M[1];
    expect(l.lesson).toContain('I have called by name Bezaleel');
    expect(l.lesson).toContain('in knowledge, and in all manner of workmanship');
    expect(l.lesson).toContain('in cutting of stones, to set them, and in carving of timber');
    expect(l.lesson, 'it must not stop at the observation')
      .toMatch(/NOW THE CONSEQUENCE FOR HOW A PROPERTY IS RUN/);
    expect(l.lesson).toMatch(/HOW FAST HE IS PAID/);
  });

  it('lesson 3 charges the CONCEALMENT, and names the aggravating factor', () => {
    const l = M[2];
    expect(l.lesson).toContain('others daubed it with untempered morter');
    expect(l.lesson).toContain('saying, Peace; and there was no peace');
    expect(l.lesson).toContain('there shall be an overflowing shower');
    expect(l.lesson, 'the sin is the false report, not the poor workmanship')
      .toMatch(/FALSE REPORT ABOUT THE CONDITION OF A STRUCTURE/);
    // the factor that makes daubing worse than plain neglect
    expect(l.lesson).toMatch(/AGGRAVATING FACTOR/);
    expect(l.lesson, 'a visible stain is an instrument').toMatch(/removes the only gauge/);
  });

  it('lesson 4 states the LIMIT before the application, and runs the ledger both ways', () => {
    const l = M[3];
    expect(l.lesson).toContain('they reckoned not with the men');
    expect(l.lesson).toContain('for they dealt faithfully');
    // dropping the limit is what would make this lesson dangerous
    expect(l.lesson, 'the limit must come first').toMatch(/SAY THE LIMIT FIRST/);
    expect(l.lesson).toMatch(/Nothing here makes an audit faithless/);
    // and the half owners omit
    expect(l.lesson).toMatch(/THE HALF THAT OWNERS CONSISTENTLY OMIT/);
    expect(l.lesson).toMatch(/start work for YOU on your word alone/);
  });

  it('lesson 5 reads the grammar, then inverts it into a diagnostic', () => {
    const l = M[4];
    expect(l.lesson).toContain('built of stone made ready before it was brought thither');
    expect(l.lesson).toContain('neither hammer nor axe nor any tool of iron heard in the house');
    expect(l.lesson, 'SO THAT is the whole teaching').toMatch(/READ THE GRAMMAR/);
    expect(l.lesson).toMatch(/decisions being made LATE/);
    expect(l.lesson, 'the cultural obstacle is what actually defeats this')
      .toMatch(/preparation is invisible/i);
  });

  it('lesson 6 names the downstream channels and the ORDER edge', () => {
    const l = M[5];
    expect(l.lesson).toContain('to dwell in your cieled houses, and this house lie waste');
    expect(l.lesson).toContain('earneth wages to put it into a bag with holes');
    expect(l.lesson).toContain('Ye looked for much, and lo, it came to little');
    // a slogan would stop here; the instrument is the named channels
    expect(l.lesson).toMatch(/emergency call-out/);
    expect(l.lesson).toMatch(/declines to renew/);
    expect(l.lesson, 'the second edge is order, not amount').toMatch(/about ORDER rather than amount/);
  });

  it('lesson 7 makes a low cost line AMBIGUOUS rather than good', () => {
    const l = M[6];
    expect(l.lesson).toContain('Where no oxen are, the crib is clean');
    expect(l.lesson).toContain('In all labour there is profit');
    expect(l.lesson, 'the whole point is that one number cannot be read alone')
      .toMatch(/AMBIGUOUS/);
    expect(l.lesson).toMatch(/PAIRED READING/);
    // and it must not become "always spend more"
    expect(l.lesson).toMatch(/indistinguishable from the expense line alone/);
  });

  it('lesson 8 attaches the name to Isaiah 58:7, not to competence', () => {
    const l = M[7];
    expect(l.lesson).toContain('thou shalt be called, The repairer of the breach');
    expect(l.lesson).toContain('The restorer of paths to dwell in');
    expect(l.lesson).toContain('that thou bring the poor that are cast out to thy house');
    expect(l.lesson, 'the title follows conduct, not skill')
      .toMatch(/not out of skill, not out of licensure/);
    expect(l.lesson).toMatch(/keeping a roof over a person/);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'maintenance-trades');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('joins the SAME single Real Estate shelf as the four before it', () => {
    // NOT an exhaustive census — that pin has broken twice in this department.
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate').map((c) => c.key);
    for (const k of ['maintenance-trades', 'leasing-tenants', 'buying-terms',
      'property-principle', 'management-stewardship']) {
      expect(re, `${k} missing from the shelf`).toContain(k);
    }
    expect(re.length).toBeGreaterThanOrEqual(5);
  });

  it('hands the catalog a schedule, a summary and a download that all work', () => {
    const rows = row.buildScheduleRows();
    expect(rows.length).toBe(8);
    expect(row.progressSummary({}).done).toBe(0);
    const md = row.exportMarkdown();
    expect(md).toContain('Maintenance, Repairs and the Trades');
    expect(md.length).toBeGreaterThan(2000);
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('carries its own interest and helper tags, and its own copy', () => {
    expect(row.interestTag).toBe('[Maintenance Trades]');
    expect(row.helperTag).toBe('[Maintenance Trades helper]');
    expect(row.interestText('Someone')).toContain('[Maintenance Trades]');
    expect(row.interestCopy.blurb).toMatch(/not legal or trade advice/i);
    expect(row.tutorCourseMeta.key).toBe('maintenance-trades');
  });

  it('builds a schedule and a summary directly, too', () => {
    const sched = buildMaintenanceTradesSchedule('2026-10-01');
    expect(sched.length).toBe(8);
    const sum = maintenanceTradesProgressSummary({ 'maint1-by-much-slothfulness-the-building-decayeth': true });
    expect(sum.done).toBe(1);
    expect(sum.total).toBe(8);
    expect(exportMaintenanceTradesCurriculumMarkdown(null)).toContain('Prayer + the anchor');
  });
});

describe('the checks above can actually fail', () => {
  const m = M[0];

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('He wrote it. "By much slothfulness the building decayeth" (Ecclesiastes 10:19).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a fabricated quotation outright', () => {
    expect(quotationFaults('"Thou shalt service thy roof every autumn" (Ecclesiastes 10:18)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an inverted ladder, a summary, and a near-copy', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches an anchor theme that is only a quotation with glue', () => {
    const glue = 'It says "By much slothfulness the building decayeth" and that is the rule.';
    expect(words(glue) > 12, 'a quotation with nine words of glue passed').toBe(false);
  });

  it('catches "the LORD" written into OUR prose', () => {
    expect(/\bthe LORD\b/.test(ours('And so the LORD requires this of a landlord.')),
      'our prose using His title instead of His name passed').toBe(true);
  });
});
