// @vitest-environment node
// =============================================================================
// LEASING AND TENANT SELECTION — Real Estate, course four
// =============================================================================
// The first course in the department with a PERSON on the other side of the
// transaction. DR-0500 established whose the ground is, DR-0501 what faithful
// management is measured by, DR-0504 how a deal is done honestly; this one
// covers who you let in, how you decide, what the paper says, and what happens
// when it goes wrong.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. COLLAPSING DILIGENCE INTO PARTIALITY. The two are opposite and a course
//      that blurs them makes a bad operator in one direction or the other.
//      Screening on the FACTS is the diligence Proverbs 18:13 commands.
//      Deciding by APPEARANCE is the sin James 2:9 names. Both edges pinned,
//      and the course states the distinction in its own words rather than
//      leaving a reader to infer it.
//   2. SENTIMENT INSTEAD OF A PRINCIPLE. Micah 4:4 could easily become a
//      promise no landlord can keep. The lesson holds the honest limit — no
//      landlord can give a renter a vineyard — and then names the half that IS
//      in his hand: none shall make him afraid, and none includes him. Pinned.
//   3. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with any of the OTHER THREE Real Estate courses, measured against
//      their own refs lists.
//   4. SCRIPTURE FROM MEMORY. 56 quoted spans walked against the repo's own KJV
//      across the whole module.
//   5. A CHECKER THAT FALSE-BLOCKS. The generator's elision check ran from one
//      closing quote to the next OPENING one, so it flagged an ellipsis in our
//      own prose between two quotations — which DR-0459 permits. It was the
//      CHECKER that was wrong, not the lesson. Fixed to test each quoted span
//      alone, in the generator and in all four course tests, and proven to
//      still catch a real elision in both the ASCII and the Unicode form.
//   6. CHECKS WRITTEN FROM WHAT I MEANT INSTEAD OF WHAT THE TEXT SAYS. Six of
//      the assertions below failed on their first run and every one of them was
//      the CHECK, not the lesson: "he read in the audience" against a text that
//      says "and read in the audience", "self-blame" against "carrying blame
//      for what another person chose", and a Deuteronomy 10:17 span the course
//      never quotes. Each was rewritten to assert the property as the text
//      actually states it. This is the same class as the /[Ii]naction/ and
//      /two witnesses/ misses on the two courses before this one, and it is
//      recorded here because a check that fails on correct content is a check
//      that will pass on wrong content.
//   7. A SUMMARY WEARING A BAND'S NAME. Measured across all eight lessons AT
//      ONCE (the lesson learned the hard way on the capstone): one pass found
//      every teen band at 0.42-0.49 against the 0.6 floor, four senior bands
//      over grade 10, and three anchor themes almost pure quotation. All three
//      dimensions closed in a single fix round.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  LEASING_TENANTS_MODULES, LEASING_TENANTS_META, LEASING_TENANTS_SESSION_FLOW,
  LEASING_TENANTS_CARE_NOTE, LEASING_TENANTS_TUTOR_META,
  buildLeasingTenantsSchedule, leasingTenantsProgressSummary,
  exportLeasingTenantsCurriculumMarkdown, leasingTenantsRefs,
} from '../lib/leasing-tenants-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { managementStewardshipRefs } from '../lib/management-stewardship-course.js';
import { buyingTermsRefs } from '../lib/buying-terms-course.js';
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


const M = LEASING_TENANTS_MODULES;
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
      'lease1-ye-know-the-heart-of-a-stranger',
      'lease2-the-gold-ring-and-the-vile-raiment',
      'lease3-hear-it-before-you-answer-it',
      'lease4-read-the-covenant-in-their-hearing',
      'lease5-wherein-shall-he-sleep',
      'lease6-every-man-under-his-own-vine',
      'lease7-go-and-tell-him-between-thee-and-him-alone',
      'lease8-as-much-as-lieth-in-you',
    ]);
    expect(LEASING_TENANTS_META.weeks).toBe(M.length);
  });

  it('closes by naming its own order as the teaching', () => {
    // A course whose last lesson does not depend on the earlier ones is a list,
    // not an argument.
    expect(M[7].lesson).toMatch(/RIGHT ENDING FOR A LEASING COURSE|right ending for a leasing course/i);
    expect(M[7].lesson).toMatch(/NOT ONE OF THOSE REQUIRES THE TENANT TO COOPERATE|does not require the tenant/i);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      // OUR prose in the anchor theme, not the quotation it carries. Three of
      // the eight failed this on the first measurement with 7, 8 and 9 words.
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
    expect(LEASING_TENANTS_META.care).toBe(LEASING_TENANTS_CARE_NOTE);
    expect(LEASING_TENANTS_CARE_NOTE).toMatch(/not legal advice/i);
    // This course's limit is the sharpest in the department: fair-housing and
    // eviction procedure are state specific AND actionable.
    expect(LEASING_TENANTS_CARE_NOTE).toMatch(/fair-housing/i);
    expect(LEASING_TENANTS_CARE_NOTE).toMatch(/eviction/i);
    expect(LEASING_TENANTS_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
  });

  it('opens Word-first on the stranger and on respect of persons', () => {
    const wf = LEASING_TENANTS_META.wordFirst;
    expect(wf.ref).toContain('Exodus 23:9');
    expect(wf.frame).toContain('for ye know the heart of a stranger');
    expect(wf.frame).toContain('with respect of persons');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(LEASING_TENANTS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
    expect(LEASING_TENANTS_META.handsOnLabel).toBe('Work it on a real door');
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with ANY of the other three Real Estate courses', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs(), ...buyingTermsRefs()]
      .map((r) => r.split(':')[0].trim()));
    const mine = leasingTenantsRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(25);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = leasingTenantsRefs();
    expect(refs.length).toBeGreaterThan(10);
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
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(45);
  });

  it('never elides INSIDE a quotation, and does not flag our own prose', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(elidedSpans(text), `${path} elided a quotation`).toEqual([]);
      });
    }
    // PROVEN-TO-CATCH, both forms, on the same function the walk above uses.
    expect(elidedSpans('"Thou shalt not ... oppress a stranger" (Exodus 23:9)').length,
      'a real elision passed').toBe(1);
    expect(elidedSpans('"Thou shalt not … oppress a stranger" (Exodus 23:9)').length,
      'a unicode elision passed').toBe(1);
    // AND the permitted form is not flagged — this is the false positive that
    // blocked generation of this very course until the checker was fixed.
    expect(elidedSpans('They sat him well. And the poor man... "Stand thou there".'),
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
    // and the quotations that DO carry His titles are untouched (DR-0210's
    // bright line: never substitute Yahweh into a Bible quote)
    expect(M[1].lesson).toContain("for the judgment is God\u2019s");
    expect(M[3].lesson).toContain('All the words which the LORD hath said will we do');
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
  it('lesson 1 grounds the command in MEMORY and names the asymmetry', () => {
    const l = M[0];
    expect(l.lesson).toContain('for ye know the heart of a stranger');
    expect(l.lesson).toContain('loveth the stranger, in giving him food and raiment');
    expect(l.lesson, 'the asymmetry is the mechanism the lesson turns on')
      .toMatch(/INFORMATION ASYMMETRY|information asymmetry/);
  });

  it('lesson 2 names the failure as a SEATING decision, and gives the instrument', () => {
    const l = M[1];
    expect(l.lesson).toContain('Sit thou here in a good place');
    expect(l.lesson).toContain('Stand thou there, or sit here under my footstool');
    expect(l.lesson, 'the Word calls it sin, and the lesson must say so')
      .toContain('are convinced of the law as transgressors');
    expect(l.lesson, 'the remedy is written criteria before the showing')
      .toMatch(/WRITTEN CRITERIA, IN ORDER, BEFORE THE SHOWING|written criteria/i);
  });

  it('lesson 3 commands diligence WITHOUT making it partiality', () => {
    const l = M[2];
    expect(l.lesson).toContain('He that answereth a matter before he heareth it');
    expect(l.lesson).toContain('but his neighbour cometh and searcheth him');
    // the line this whole course depends on: facts yes, appearance no
    expect(l.lesson, 'screening on the facts must be named as the commanded diligence')
      .toMatch(/SCREENING/);
    expect(l.lesson).toMatch(/structurally insufficient/i);
  });

  it('lesson 4 puts the terms in their HEARING before anyone is bound', () => {
    const l = M[3];
    expect(l.lesson).toContain('All the words which the LORD hath said will we do');
    expect(l.lesson).toContain('read in the audience of the people');
    expect(l.lesson, 'the assent was taken twice, and the second time after a reading')
      .toMatch(/ASSENT WAS TAKEN TWICE|assent was taken twice/i);
    expect(l.lesson, 'a reading, not a recital')
      .toMatch(/READING, NOT A RECITAL|reading, not a recital/i);
  });

  it('lesson 5 keeps a pledge a PLEDGE, with the clock and the cry', () => {
    const l = M[4];
    expect(l.lesson).toContain('thou shalt deliver it unto him by that the sun goeth down');
    expect(l.lesson).toContain('wherein shall he sleep?');
    expect(l.lesson).toContain('when he crieth unto me, that I will hear; for I am gracious');
    expect(l.lesson).toMatch(/A SECURITY DEPOSIT IS A PLEDGE|security deposit is a pledge/i);
    expect(l.lesson).toMatch(/ITEMISED AND EVIDENCED|itemised and evidenced/i);
  });

  it('lesson 6 takes FEAR as the measure and then holds the honest limit', () => {
    const l = M[5];
    expect(l.lesson).toContain('every man under his vine and under his fig tree');
    expect(l.lesson).toContain('none shall make them afraid');
    expect(l.lesson, 'fear is the measurable thing')
      .toMatch(/TAKE FEAR AS THE MEASURE|fear as the measure/i);
    expect(l.lesson, 'and the limit must be stated so this is not sentiment')
      .toMatch(/HOLD THE HONEST LIMIT|honest limit/i);
    expect(l.lesson).toMatch(/cannot give a renter a vineyard/i);
  });

  it('lesson 7 keeps the ORDER Jesus gave, and the posture Paul added', () => {
    const l = M[6];
    expect(l.lesson).toContain('go and tell him his fault between thee and him alone');
    expect(l.lesson).toContain('in the spirit of meekness; considering thyself');
    expect(l.lesson, 'the trade characteristically inverts the order')
      .toMatch(/INVERTS THE ORDER|inverts the order/i);
    expect(l.lesson).toMatch(/gained/);
  });

  it('lesson 8 names the LIMIT as the last mark, in both directions', () => {
    const l = M[7];
    expect(l.lesson).toContain('as much as lieth in you, live peaceably with all men');
    expect(l.lesson).toContain('let us not be weary in well doing');
    expect(l.lesson, 'both limits must be named, not just the comfortable one')
      .toMatch(/TWO LIMITS|two limits/);
    // the boundary cuts BOTH ways -- no self-blame, and no excuse either
    expect(l.lesson, 'no carrying blame for what the other party chose')
      .toMatch(/carrying blame for what another person chose/i);
    expect(l.lesson, 'and no using their conduct as a release from yours')
      .toMatch(/release from yours/i);
    // Galatians 6:9 -- the failure is erosion, not a decision
    expect(l.lesson).toContain('let us not be weary in well doing');
    expect(l.lesson).toMatch(/erosion/i);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'leasing-tenants');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('joins the SAME single Real Estate shelf as the three before it', () => {
    // NOT an exhaustive census. The sibling tests pinned the shelf at an exact
    // key list twice and broke twice when the next course landed; the property
    // actually being guarded is one shelf, with this course on it.
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate').map((c) => c.key);
    expect(re).toContain('leasing-tenants');
    expect(re).toContain('property-principle');
    expect(re).toContain('management-stewardship');
    expect(re).toContain('buying-terms');
    expect(re.length).toBeGreaterThanOrEqual(4);
  });

  it('hands the catalog a schedule, a summary and a download that all work', () => {
    const rows = row.buildScheduleRows();
    expect(rows.length).toBe(8);
    expect(row.progressSummary({}).done).toBe(0);
    const md = row.exportMarkdown();
    expect(md).toContain('Leasing and Tenant Selection');
    expect(md.length).toBeGreaterThan(2000);
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('carries its own interest and helper tags, and its own copy', () => {
    expect(row.interestTag).toBe('[Leasing Tenants]');
    expect(row.helperTag).toBe('[Leasing Tenants helper]');
    expect(row.interestText('Someone')).toContain('[Leasing Tenants]');
    expect(row.interestCopy.blurb).toMatch(/not legal advice/i);
    expect(row.tutorCourseMeta.key).toBe('leasing-tenants');
  });

  it('builds a schedule and a summary directly, too', () => {
    const sched = buildLeasingTenantsSchedule('2026-10-01');
    expect(sched.length).toBe(8);
    const sum = leasingTenantsProgressSummary({ 'lease1-ye-know-the-heart-of-a-stranger': true });
    expect(sum.done).toBe(1);
    expect(sum.total).toBe(8);
    expect(exportLeasingTenantsCurriculumMarkdown(null)).toContain('Prayer + the anchor');
  });
});

describe('the checks above can actually fail', () => {
  const m = M[0];

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('He wrote it. "Also thou shalt not oppress a stranger" (Exodus 23:10).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a fabricated quotation outright', () => {
    expect(quotationFaults('"Thou shalt screen thy tenant by his raiment" (Exodus 23:9)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an inverted ladder, a summary, and a near-copy', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches an anchor theme that is only a quotation with glue', () => {
    // The exact defect three of these eight shipped with on the first pass.
    const glue = 'It says "Also thou shalt not oppress a stranger" and that is the rule.';
    expect(words(glue) > 12, 'a quotation with nine words of glue passed').toBe(false);
  });

  it('catches "the LORD" written into OUR prose', () => {
    expect(/\bthe LORD\b/.test(ours('And so the LORD requires this of a landlord.')),
      'our prose using His title instead of His name passed').toBe(true);
  });
});
