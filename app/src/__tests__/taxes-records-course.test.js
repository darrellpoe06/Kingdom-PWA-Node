// @vitest-environment node
// =============================================================================
// TAXES AND RECORDS: WHAT YOU OWE AND WHAT YOU CAN SHOW — Real Estate, course 8
// =============================================================================
// What the authorities take, and what an owner can actually prove. Seven
// courses covered the ground, the stewardship, the transaction, the tenant, the
// building, the partner and the lender.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. QUOTING HALF OF MATTHEW 22:21, which is what nearly everyone does. The
//      dropped half is the larger one, and the logic of the mark turns the
//      question on the man rather than the coin. Both claims pinned, and both
//      of the opposite errors a household falls into — resentment and
//      substitution — are pinned by name.
//   2. TURNING A CENSUS OFFERING INTO A TAX-POLICY ARGUMENT. Exodus 30 is the
//      lesson most likely to be pressed into service that way, so it states its
//      own limit in the text: a modern state cannot run on a flat half-shekel
//      and progressive rates are not condemned by this passage. Pinned.
//   3. SCOLDING A READER FOR BURDENS HE NEVER CHOSE. Israel consented with full
//      disclosure; many modern obligations arrive after a household is
//      committed. Lesson 5 splits the schedule into both, and the split is
//      pinned, because without it the chapter becomes a rebuke of the wrong
//      people.
//   4. TURNING LEVITICUS 6 OUTWARD. The statute addresses the OFFENDER. A
//      household that uses it to compute what others owe has inverted it, and
//      the comfortable evasion it closes — a general generosity instead of a
//      specific payment — is pinned too.
//   5. BOTH ABUSES OF MALACHI 3:10 — the investment-contract reading and the
//      withhold-because-others-abused-it reading. Refused by name in the text.
//   6. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with any of the OTHER SEVEN Real Estate courses. All eight here
//      are fresh against the 81 already in use.
//   7. SCRIPTURE FROM MEMORY. 137 quoted spans walked against the repo's own
//      KJV. The generator caught seven spans in the first draft that had
//      dropped a POSSESSIVE APOSTROPHE — Caesar's, God's, their father's house —
//      because the author was avoiding a straight quote inside a JS string. A
//      quotation missing an apostrophe is not verbatim.
//   8. A BARE SEND OR TEACH STAGE (DR-0509). Benefits and stories ship from the
//      first commit.
//   9. SHIPPING AT THE EDGE OF A CEILING. Lesson 6's senior~adult overlap
//      measured 0.249 against a 0.25 limit — passing, and too close to ship, so
//      four near-duplicate passages were re-authored rather than trimmed. It
//      now measures 0.147.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  TAXES_RECORDS_MODULES, TAXES_RECORDS_META, TAXES_RECORDS_SESSION_FLOW,
  TAXES_RECORDS_CARE_NOTE, TAXES_RECORDS_TUTOR_META,
  buildTaxesRecordsSchedule, taxesRecordsProgressSummary,
  exportTaxesRecordsCurriculumMarkdown, taxesRecordsRefs,
} from '../lib/taxes-records-course.js';
import { partnershipsRefs } from '../lib/partnerships-course.js';
import { financingDebtRefs } from '../lib/financing-debt-course.js';
import { maintenanceTradesRefs } from '../lib/maintenance-trades-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { managementStewardshipRefs } from '../lib/management-stewardship-course.js';
import { buyingTermsRefs } from '../lib/buying-terms-course.js';
import { leasingTenantsRefs } from '../lib/leasing-tenants-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

/** DR-0459: an ellipsis inside a QUOTATION is the defect; one in our own prose
 * between two quotations is not. Each quoted span is tested on its own. */
function elidedSpans(text) {
  const out = [];
  for (const m of String(text).matchAll(/"([^"]*)"/g)) {
    if (/\.\.\.|…/.test(m[1])) out.push(m[1]);
  }
  return out;
}

const M = TAXES_RECORDS_MODULES;
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
      'tax1-render-unto-caesar',
      'tax2-then-are-the-children-free',
      'tax3-all-the-world-should-be-taxed',
      'tax4-the-rich-shall-not-give-more',
      'tax5-he-will-take-the-tenth',
      'tax6-they-sought-their-register',
      'tax7-restore-it-in-the-principal-and-add-the-fifth',
      'tax8-will-a-man-rob-god',
    ]);
    expect(TAXES_RECORDS_META.weeks).toBe(M.length);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      expect(words(m.anchor.theme), `${m.id} anchor theme is almost pure quotation`).toBeGreaterThan(12);
      expect(words(m.lesson), `${m.id} lesson`).toBeGreaterThan(200);
      expect(m.quiz.questions.length, `${m.id} quiz`).toBe(3);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(words(q.explain), `${m.id} explain`).toBeGreaterThan(10);
      }
      expect(m.facilitator.talkingPoints.length, `${m.id} talking points`).toBe(5);
      expect(m.facilitator.discussionPrompts.length, `${m.id} prompts`).toBe(4);
      expect(m.facilitator.howToRun, `${m.id} howToRun`).toBeTruthy();
    }
  });

  it('ships benefits AND stories on every lesson, from the first commit (DR-0509)', () => {
    for (const m of M) {
      expect(Array.isArray(m.benefits), `${m.id} has no benefits`).toBe(true);
      expect(m.benefits.length, `${m.id} benefits`).toBeGreaterThanOrEqual(5);
      for (const b of m.benefits) expect(words(b), `${m.id} thin benefit`).toBeGreaterThan(12);
      expect(Array.isArray(m.stories), `${m.id} has no stories`).toBe(true);
      expect(m.stories.length, `${m.id} stories`).toBe(2);
      for (const s of m.stories) {
        expect(['parable', 'testimony']).toContain(s.kind);
        expect(['light', 'solemn', 'sober', 'serious', 'hopeful']).toContain(s.tone);
        expect(s.title, `${m.id} story title`).toBeTruthy();
        const w = s.body.split(/\s+/).filter(Boolean).length;
        expect(w, `${m.id} story "${s.title}" is ${w} words`).toBeGreaterThanOrEqual(157);
        expect(w, `${m.id} story "${s.title}" is ${w} words`).toBeLessThanOrEqual(424);
      }
    }
  });

  it('states its limit on the meta and in the tutor posture', () => {
    expect(TAXES_RECORDS_META.care).toBe(TAXES_RECORDS_CARE_NOTE);
    expect(TAXES_RECORDS_CARE_NOTE).toMatch(/not tax or legal advice/i);
    expect(TAXES_RECORDS_CARE_NOTE).toMatch(/appeal deadlines/i);
    expect(TAXES_RECORDS_CARE_NOTE).toMatch(/basis/i);
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/[Nn]ever give tax or legal advice/);
    // the five rails the tutor must not drop, one per hazard named at the top
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/always carry BOTH claims/);
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/never press a census offering/);
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/always split the schedule/);
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/pointed at the OFFENDER/);
    expect(TAXES_RECORDS_TUTOR_META.posture).toMatch(/refuse both abuses by name/);
  });

  it('opens Word-first on both claims AND on what can be shown', () => {
    const wf = TAXES_RECORDS_META.wordFirst;
    expect(wf.ref).toContain('Matthew 22:21');
    expect(wf.ref).toContain('Ezra 2:62');
    expect(wf.frame).toContain('and unto God the things that are God’s');
    expect(wf.frame).toContain('but they were not found');
    expect(wf.frame, 'the second half of the course in one line')
      .toContain('the difference between what is true and what you can prove');
  });

  it('runs a session flow that adds up', () => {
    expect(TAXES_RECORDS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
    expect(TAXES_RECORDS_META.handsOnLabel).toBe('Work it on your own records');
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with ANY of the other seven Real Estate courses', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs(),
      ...buyingTermsRefs(), ...leasingTenantsRefs(), ...maintenanceTradesRefs(), ...partnershipsRefs(), ...financingDebtRefs()]
      .map((r) => r.split(':')[0].trim()));
    const mine = taxesRecordsRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(75);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = taxesRecordsRefs();
    // eight anchors; the two wordFirst refs are the same verses as lessons 1
    // and 6, so the deduped list is exactly eight rather than ten.
    expect(refs.length).toBe(8);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing`).toContain(part.trim());
      }
    }
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, stories and benefits included', () => {
    const bad = []; let spans = 0;
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        spans += spansWithRef(text).length;
        for (const f of quotationFaults(text)) bad.push(`${path}: ${f}`);
      });
    }
    expect(bad, bad.join('\n')).toEqual([]);
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(115);
  });

  it('never elides INSIDE a quotation, and does not flag our own prose', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(elidedSpans(text), `${path} elided a quotation`).toEqual([]);
      });
    }
    expect(elidedSpans('"Render therefore unto Caesar ... that are God’s" (Matthew 22:21)').length, 'a real elision passed').toBe(1);
    expect(elidedSpans('"Render therefore unto Caesar … that are God’s" (Matthew 22:21)').length, 'a unicode elision passed').toBe(1);
    expect(elidedSpans('He asked "Whose is this image" and then... then "Render therefore unto Caesar".'),
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
    // and the KJV's own wording is untouched inside genuine quotations
    expect(M[4].lesson).toContain('the LORD will not hear you in that day');
    expect(M[6].lesson).toContain('commit a trespass against the LORD');
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
  it('lesson 1 keeps BOTH claims and names both opposite errors', () => {
    const l = M[0].lesson;
    expect(l).toContain('Whose is this image and superscription?');
    expect(l).toContain('Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s');
    expect(l, 'two claims, not a claim and an exemption').toMatch(/TWO legitimate claims/);
    expect(l, 'the error the first half forecloses').toMatch(/RESENTMENT/);
    expect(l, 'the more respectable and more serious error').toMatch(/SUBSTITUTION/);
  });

  it('lesson 2 separates being right from insisting, with its limits', () => {
    const l = M[1].lesson;
    expect(l).toContain('Then are the children free');
    expect(l).toContain('Notwithstanding, lest we should offend them');
    expect(l, 'the transferable principle').toMatch(/TWO separate decisions/);
    expect(l, 'it must not become a doctrine of surrender').toMatch(/never conceded the point/);
    expect(l, 'nobody else bears the cost of the graciousness').toMatch(/did not pay from the common purse/);
  });

  it('lesson 3 puts the weight on the mechanism and states its own limit', () => {
    const l = M[2].lesson;
    expect(l).toContain('all the world should be taxed');
    expect(l).toContain('every one into his own city');
    expect(l, 'the mechanism is the point').toMatch(/MECHANISM/);
    expect(l, 'the claim must not be inflated').toMatch(/does not teach that every administrative burden/);
    expect(l, 'why the record fails when it matters').toMatch(/those are the same year/);
  });

  it('lesson 4 gives the three properties AND refuses to become tax policy', () => {
    const l = M[3].lesson;
    expect(l).toContain('The rich shall not give more, and the poor shall not give less than half a shekel');
    expect(l, 'first property').toMatch(/FIXED AND KNOWABLE/);
    expect(l, 'second property, the half nobody notices').toMatch(/EQUAL IN BOTH DIRECTIONS/);
    expect(l, 'third property').toMatch(/USE IS NAMED/);
    expect(l, 'the limit must be stated or the lesson loses credibility')
      .toMatch(/nothing in this session is a tax proposal/);
  });

  it('lesson 5 reads the specifications and splits consented from added', () => {
    const l = M[4].lesson;
    expect(l).toContain('He will take the tenth of your sheep: and ye shall be his servants');
    expect(l, 'a specification rather than rhetoric').toMatch(/QUALITY clause/);
    expect(l).toContain('even the best of them');
    expect(l, 'the gap the lesson identifies').toMatch(/informed and unaccounted/);
    expect(l, 'without this the chapter rebukes the wrong people').toMatch(/added to you afterwards/);
  });

  it('lesson 6 locates the failure in evidence, and keeps the mercy', () => {
    const l = M[5].lesson;
    expect(l).toContain('but they were not found');
    expect(l, 'not a moral failure').toMatch(/EVIDENTIARY failure/);
    expect(l).toContain('Urim and with Thummim');
    expect(l, 'suspended rather than extinguished').toMatch(/SUSPENDED pending a means of settling it/);
    expect(l, 'the drill has a clock for a reason').toMatch(/Inside ten minutes/);
  });

  it('lesson 7 works all three parts and stays pointed at the offender', () => {
    const l = M[6].lesson;
    expect(l).toContain('he shall even restore it in the principal, and shall add the fifth part more thereto');
    expect(l, 'part one').toMatch(/THE PRINCIPAL/);
    expect(l, 'part two, and it is arithmetic').toMatch(/THE FIFTH PART/);
    expect(l, 'part three, which closes the evasion').toMatch(/THE PROPER PAYEE/);
    expect(l, 'the statute is not an instrument for computing what others owe')
      .toMatch(/addresses the OFFENDER/);
  });

  it('lesson 8 is the capstone because this account has no examiner', () => {
    const l = M[7].lesson;
    expect(l).toContain('Wherein have we robbed thee?');
    expect(l, 'the hinge is that they asked sincerely').toMatch(/sincerely/);
    expect(l, 'what every other obligation in the course has').toMatch(/EXTERNAL instrument of measurement/);
    expect(l, 'named correctly').toMatch(/measurement failure rather than a character failure/);
    expect(l).toContain('prove me now herewith');
    expect(l, 'both abuses refused').toMatch(/abused in both directions/);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'taxes-records');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('joins the SAME single Real Estate shelf as the seven before it', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((l) => l.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate').map((c) => c.key);
    for (const k of ['taxes-records', 'financing-debt', 'partnerships', 'maintenance-trades',
      'leasing-tenants', 'buying-terms', 'property-principle', 'management-stewardship']) {
      expect(re, `${k} missing from the shelf`).toContain(k);
    }
    expect(re.length).toBeGreaterThanOrEqual(8);
  });

  it('hands the catalog a schedule, a summary and a download that all work', () => {
    const rows = row.buildScheduleRows();
    expect(rows.length).toBe(8);
    expect(row.progressSummary({}).done).toBe(0);
    const md = row.exportMarkdown();
    expect(md).toContain('Taxes and Records: What You Owe and What You Can Show');
    expect(md.length).toBeGreaterThan(2000);
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('carries its own interest and helper tags, and its own copy', () => {
    expect(row.interestTag).toBe('[Taxes and Records]');
    expect(row.helperTag).toBe('[Taxes and Records helper]');
    expect(row.interestText('Someone')).toContain('[Taxes and Records]');
    expect(row.interestCopy.blurb).toMatch(/not tax or legal advice/i);
    expect(row.tutorCourseMeta.key).toBe('taxes-records');
  });

  it('builds a schedule and a summary directly, too', () => {
    const sched = buildTaxesRecordsSchedule('2026-10-01');
    expect(sched.length).toBe(8);
    const sum = taxesRecordsProgressSummary({ 'tax1-render-unto-caesar': true });
    expect(sum.done).toBe(1);
    expect(sum.total).toBe(8);
    expect(exportTaxesRecordsCurriculumMarkdown(null)).toContain('Prayer + the anchor');
  });
});

describe('the checks above can actually fail', () => {
  const m = M[0];

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('"Then are the children free" (Matthew 17:25).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a quotation that drifted by one word', () => {
    expect(quotationFaults('"The wicked borroweth, and payeth not back" (Psalms 37:21)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches the defect this course actually shipped in draft — a dropped possessive', () => {
    // Seven spans in the first draft read "Caesar" where the KJV reads
    // "Caesar's", because the author was avoiding a straight quote inside a JS
    // string. The generator refused to emit; this is the same refusal, pinned.
    expect(quotationFaults('"the things which are Caesar; and unto God the things that are God" (Matthew 22:21)').join(' '))
      .toMatch(/NOT VERBATIM/);
    expect(quotationFaults('"could not shew their father house, and their seed" (Ezra 2:59)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a fabricated quotation outright', () => {
    expect(quotationFaults('"Thou shalt keep a full and orderly account" (Malachi 3:8)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an inverted ladder, a summary, and a near-copy', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches a lesson that would render a bare send or teach stage', () => {
    const bare = { ...m }; delete bare.benefits; delete bare.stories;
    expect(Array.isArray(bare.benefits), 'a lesson with no benefits passed').toBe(false);
    expect(Array.isArray(bare.stories), 'a lesson with no stories passed').toBe(false);
    const shortStory = { kind: 'parable', tone: 'light', title: 'x', body: 'too short.' };
    expect(shortStory.body.split(/\s+/).length >= 157, 'a two-word story passed the floor').toBe(false);
  });

  it('catches "the LORD" written into OUR prose', () => {
    expect(/\bthe LORD\b/.test(ours('And so the LORD requires this of a payer.')),
      'our prose using His title instead of His name passed').toBe(true);
  });
});
