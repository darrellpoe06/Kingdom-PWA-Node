// @vitest-environment node
// =============================================================================
// MANAGEMENT IS STEWARDSHIP — the capstone of the Real Estate department
// =============================================================================
// Darrell named the two ends of this department himself: from why owned
// property is a principle through management as stewardship. DR-0500 built the
// first end. This is the other one, and it answers the question the footing
// leaves open: how does a person RUN ground that belongs to Another and to the
// people living on it?
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG, and what holds each one:
//
//   1. RE-PREACHING COURSE ONE. A capstone that leaned on Leviticus 25 and
//      1 Kings 21 again would feel weighty and teach nothing new. This course
//      stands on entirely different passages, and that separation is CHECKED
//      here against course one's own reference list rather than trusted.
//   2. SCRIPTURE FROM MEMORY. 59 quoted spans, every one walked against the
//      repo's own KJV across the WHOLE module — and the generator caught SIX
//      ELISIONS inside quotations in the first draft, which DR-0459 forbids.
//      Each was replaced with shorter genuinely-verbatim spans; an ellipsis
//      inside a quotation is never the remedy, and the fix is pinned below.
//   3. A SUMMARY WEARING A BAND'S NAME. All eight teen bands measured 0.41 to
//      0.46 of the adult lesson on the first pass, under the 0.6 floor, and
//      three senior bands measured over the grade-10 ceiling (11.14, 10.79,
//      10.21). The measurement caught all eleven. The teen bands were extended
//      with real application content in their own register and the long senior
//      sentences were split — never padded, never re-registered from a
//      neighbour.
//   4. SAFETY TAUGHT AS A TRADE-OFF. Lesson 5 is the one place in the whole
//      department where cost-benefit reasoning is ruled out by the text:
//      Deuteronomy 22:8 owes a battlement to an anonymous person and names the
//      consequence as BLOOD upon the house. Pinned by content.
//   5. SOFTENING NEHEMIAH 5. Nothing there was illegal, the restitution carried
//      a DATE, and the stated cause was the fear of Yahweh rather than a rule.
//      All three are pinned, because each one is the part a reader would like
//      to lose.
//   6. A CAPSTONE WITH NO CLOSE. Lesson 8 returns to Leviticus 25:23 — the
//      title Yahweh kept — so the account is given to the same Owner the
//      department opened with.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  MANAGEMENT_STEWARDSHIP_MODULES, MANAGEMENT_STEWARDSHIP_META, MANAGEMENT_STEWARDSHIP_SESSION_FLOW,
  MANAGEMENT_STEWARDSHIP_CARE_NOTE, MANAGEMENT_STEWARDSHIP_TUTOR_META,
  buildManagementStewardshipSchedule, managementStewardshipProgressSummary,
  exportManagementStewardshipCurriculumMarkdown, managementStewardshipRefs,
} from '../lib/management-stewardship-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = MANAGEMENT_STEWARDSHIP_MODULES;
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

describe('the capstone exists, and it is shaped like a course', () => {
  it('carries eight lessons in the order the argument runs', () => {
    expect(M.map((m) => m.id)).toEqual([
      'mgmt1-faithful-is-the-measurement',
      'mgmt2-entrusted-by-ability-judged-by-action',
      'mgmt3-faithful-in-a-very-little-authority-over-ten-cities',
      'mgmt4-the-manager-his-owner-stopped-worrying-about',
      'mgmt5-the-battlement-safety-is-blood-not-a-line-item',
      'mgmt6-their-portion-in-due-season',
      'mgmt7-when-management-became-extraction-restore-this-day',
      'mgmt8-the-account-given-with-joy-and-not-with-grief',
    ]);
    expect(MANAGEMENT_STEWARDSHIP_META.weeks).toBe(M.length);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      expect(words(m.anchor.theme), `${m.id} anchor theme`).toBeGreaterThan(12);
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

  it('states its limit on the meta, including that the safety lesson is a floor', () => {
    expect(MANAGEMENT_STEWARDSHIP_META.care).toBe(MANAGEMENT_STEWARDSHIP_CARE_NOTE);
    expect(MANAGEMENT_STEWARDSHIP_CARE_NOTE).toMatch(/not legal or financial advice/i);
    expect(MANAGEMENT_STEWARDSHIP_CARE_NOTE, 'the safety lesson must never read as a substitute for local code')
      .toMatch(/floor, never a substitute/i);
    expect(MANAGEMENT_STEWARDSHIP_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
  });

  it('opens Word-first on the metric and the timing, not on a method', () => {
    const wf = MANAGEMENT_STEWARDSHIP_META.wordFirst;
    expect(wf.ref).toContain('1 Corinthians 4:2');
    expect(wf.frame).toContain('Moreover it is required in stewards, that a man be found faithful');
    expect(wf.frame).toContain('to give them their portion of meat in due season');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(MANAGEMENT_STEWARDSHIP_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
  });
});

describe('it teaches something course one did not', () => {
  it('shares no Scripture reference with the department\u2019s first course', () => {
    // A capstone that re-preached the footing would feel weighty and teach
    // nothing. Measured against course one's own list rather than trusted.
    const first = new Set(propertyPrincipleRefs().map((r) => r.split(':')[0].trim()));
    const mine = managementStewardshipRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bookchap) => first.has(bookchap));
    expect(shared, `the capstone re-uses course one's passages: ${shared.join(', ')}`).toEqual([]);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = managementStewardshipRefs();
    expect(refs.length).toBeGreaterThan(9);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing`).toContain(part.trim());
      }
    }
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, not only the reader texts', () => {
    const bad = []; let spans = 0;
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        spans += spansWithRef(text).length;
        for (const f of quotationFaults(text)) bad.push(`${path}: ${f}`);
      });
    }
    expect(bad, bad.join('\n')).toEqual([]);
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(45);
  });

  it('never elides inside a quotation, which the first draft did six times', () => {
    // DR-0459: the remedy for a long verse is a shorter VERBATIM span, never an
    // ellipsis. The generator caught six of these before the course shipped.
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(/"[^"]*(?:\.\.\.|\u2026)[^"]*"/.test(text), `${path} elided a quotation`).toBe(false);
      });
    }
    // and the two-span replacements are present rather than the elisions
    expect(M[3].levels.teen).toContain('"he gathered up all the food of the seven years"');
    expect(M[7].bigIdea).toContain('"Well done, thou good and faithful servant"');
    expect(M[7].bigIdea).toContain('"enter thou into the joy of thy lord"');
  });

  it('says Yahweh in OUR voice and leaves "the LORD" exactly where the KJV has it', () => {
    const stray = [];
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        if (/\bthe LORD\b/.test(ours(text))) stray.push(`${path}: "the LORD" in our own prose`);
      });
    }
    expect(stray, stray.join('\n')).toEqual([]);
    expect(M.map((m) => m.lesson).join(' ')).toContain('Yahweh');
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

  it('renders both bands without losing a word (the L178 defect class)', () => {
    for (const m of M) {
      for (const band of ['teen', 'senior']) {
        const text = m.levels[band];
        const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z\u2019' ]/g, ' ');
        const missing = (text.match(/[A-Za-z\u2019']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
      }
    }
  });
});

describe('the eight moves each teach their own thing', () => {
  it('lesson 1 makes faithfulness the metric and takes it at the least', () => {
    expect(M[0].lesson).toContain('Moreover it is required in stewards, that a man be found faithful');
    expect(M[0].lesson).toContain('is unjust also in much');
    expect(M[0].lesson, 'the conflict with the trade\u2019s own measure must be named')
      .toMatch(/yield/i);
  });

  it('lesson 2 charges the third servant with INACTION, not a bad return', () => {
    expect(M[1].lesson).toContain('Thou oughtest therefore to have put my money to the exchangers');
    expect(M[1].lesson).toMatch(/[Ii]naction|INACTION/); // the text sets it in emphatic capitals
    expect(M[1].lesson).toContain('according to his several ability');
  });

  it('lesson 3 grants scope on evidence and calls the reward more weight', () => {
    expect(M[2].lesson).toContain('have thou authority over ten cities');
    expect(M[2].lesson).toMatch(/evidence, not on appetite|EVIDENCE, NOT ON APPETITE/);
    expect(M[2].lesson).toMatch(/more management|MORE MANAGEMENT/i); // ditto
  });

  it('lesson 4 praises a record, and names the opacity counterfeit', () => {
    expect(M[3].lesson).toContain('he knew not ought he had, save the bread which he did eat');
    expect(M[3].lesson).toMatch(/OPACITY|opacity/);
    expect(M[3].lesson).toContain('laid up the food in the cities');
  });

  it('lesson 5 refuses cost-benefit reasoning on a foreseeable hazard', () => {
    const l = M[4];
    expect(l.lesson).toContain('that thou bring not blood upon thine house');
    expect(l.lesson).toMatch(/BLOOD UPON THINE HOUSE|blood upon thine house/);
    expect(l.lesson, 'the bright line must be stated as a refusal of the arithmetic')
      .toMatch(/arithmetic is not permitted|cost-benefit/i);
    expect(l.lesson).toMatch(/carbon-monoxide/);
  });

  it('lesson 6 makes timeliness part of the duty and scales the requirement', () => {
    expect(M[5].lesson).toContain('to give them their portion of meat in due season');
    expect(M[5].lesson).toContain('of him shall be much required');
    expect(M[5].lesson).toMatch(/outlier/i);
  });

  it('lesson 7 keeps all three hard parts of Nehemiah 5', () => {
    const l = M[6];
    expect(l.lesson, 'nothing illegal happened — the weight of the chapter rests on it')
      .toMatch(/NOTHING ILLEGAL|nothing illegal/);
    expect(l.lesson).toContain('even this day');
    expect(l.lesson).toContain('but so did not I, because of the fear of God');
  });

  it('lesson 8 closes the frame on the Owner the department opened with', () => {
    const l = M[7];
    expect(l.lesson).toContain('that they may do it with joy, and not with grief');
    expect(l.lesson).toContain('enter thou into the joy of thy lord');
    expect(l.lesson, 'the capstone must return to the title Yahweh kept')
      .toContain('Leviticus 25:23');
  });
});

describe('it is wired into the school, in the department course one opened', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'management-stewardship');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the capstone is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
  });

  it('stands on the same shelf as course one rather than opening a second', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate');
    expect(re.map((c) => c.key).sort()).toEqual(['management-stewardship', 'property-principle']);
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    for (const r of rows) expect(r.dateISO == null || r.dateISO === '').toBe(true);
    const done = managementStewardshipProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportManagementStewardshipCurriculumMarkdown(null);
    expect(md).toContain('Management Is Stewardship');
    expect(md).toContain('battlement');
    expect(buildManagementStewardshipSchedule(null)).toHaveLength(M.length);
  });

  it('offers the interest door without promising legal help', () => {
    expect(row.interestTag).toBe('[Management Stewardship]');
    expect(row.interestCopy.blurb).toMatch(/not legal or financial advice/i);
  });
});

describe('proven-to-catch (DR-0076 \u00a73)', () => {
  const m = M[4];

  it('catches a quotation that drifted by one word', () => {
    expect(quotationFaults('He wrote it. "that thou bring not blood upon thy house" (Deuteronomy 22:8).').join(' '))
      .toMatch(/NOT VERBATIM/);
    expect(quotationFaults('He wrote it. "that thou bring not blood upon thine house" (Deuteronomy 22:8).')).toEqual([]);
  });

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('He wrote it. "that thou bring not blood upon thine house" (Deuteronomy 22:9).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an elision, which is what the first draft actually shipped', () => {
    const elided = '"he gathered up all the food of the seven years... laid he up in the same" (Genesis 41:48)';
    expect(/"[^"]*(?:\.\.\.|\u2026)[^"]*"/.test(elided), 'an elided quotation passed').toBe(true);
  });

  it('catches "the LORD" drifting into our own prose', () => {
    expect(/\bthe LORD\b/.test(ours('We teach that the LORD requires faithfulness.'))).toBe(true);
    expect(/\bthe LORD\b/.test(ours('The Word says "because of the fear of God" (Nehemiah 5:15).'))).toBe(false);
  });

  it('catches an inverted ladder and an adult-register teen band', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    expect(fk(m.lesson) <= TEEN_CEILING, 'the adult text would pass as a teen band').toBe(false);
  });

  it('catches a summary and a near-copy', () => {
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches a capstone that re-preached course one', () => {
    const first = new Set(propertyPrincipleRefs().map((r) => r.split(':')[0].trim()));
    expect(first.has('Leviticus 25'), 'course one no longer cites Leviticus 25 — re-pin this').toBe(true);
    const pretend = ['Leviticus 25:23', 'Hebrews 13:17'].map((r) => r.split(':')[0].trim());
    expect(pretend.filter((b) => first.has(b)), 'a shared passage passed unnoticed').toEqual(['Leviticus 25']);
  });
});
