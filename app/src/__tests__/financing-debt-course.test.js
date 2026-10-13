// @vitest-environment node
// =============================================================================
// FINANCING: THE DEBT YOU SIGN AND THE LENDER YOU FACE — Real Estate, course 7
// =============================================================================
// The money behind every other course in the department, and the party on the
// other end of it.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. INVENTING A PROHIBITION YAHWEH DID NOT GIVE. Scripture nowhere forbids
//      borrowing. A course that treats debt as sin produces households that
//      HIDE their position, and a hidden position cannot be worked. Lesson 1
//      says so in the text, and it is pinned — because this is the single
//      easiest way for a Word-first financing course to go wrong.
//   2. THE OPPOSITE ERROR — flattering debt. Pinned too: Habakkuk's "suddenly",
//      the staged surrender of Genesis 47, and the four powers of the head.
//   3. MISREADING PSALMS 37:21, which is the verse everyone reaches for. The
//      fault is at "payeth not again", not at "borroweth", and the righteous man
//      opposite is not debt-free — he is open-handed. Both halves pinned.
//   4. QUOTING HALF OF THE USURY COMMAND. Deuteronomy 23:19 alone teaches that
//      interest is banned; 23:20 alone teaches that it is fine. Both halves are
//      pinned together because either alone is a false teaching.
//   5. DARKENING A TEXT TO MAKE A WARNING LAND (DR-0100). Genesis 47 ends with
//      a fifth to Pharaoh and four fifths retained, which is a better ratio than
//      many modern arrangements. The lesson says so, and that is pinned.
//   6. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with any of the OTHER SIX Real Estate courses. All eight here are
//      fresh against the 73 already in use.
//   7. SCRIPTURE FROM MEMORY. 108 quoted spans walked against the repo's own KJV.
//   8. A BARE SEND OR TEACH STAGE (DR-0509). Benefits and stories ship from the
//      first commit, and the generator refuses to emit a course without them.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  FINANCING_DEBT_MODULES, FINANCING_DEBT_META, FINANCING_DEBT_SESSION_FLOW,
  FINANCING_DEBT_CARE_NOTE, FINANCING_DEBT_TUTOR_META,
  buildFinancingDebtSchedule, financingDebtProgressSummary,
  exportFinancingDebtCurriculumMarkdown, financingDebtRefs,
} from '../lib/financing-debt-course.js';
import { partnershipsRefs } from '../lib/partnerships-course.js';
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

const M = FINANCING_DEBT_MODULES;
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
      'fin1-the-head-and-the-tail',
      'fin2-when-the-money-failed',
      'fin3-they-shall-rise-up-suddenly',
      'fin4-the-wicked-borroweth-and-payeth-not-again',
      'fin5-what-hast-thou-in-the-house',
      'fin6-usury-and-who-your-brother-is',
      'fin7-alas-for-it-was-borrowed',
      'fin8-he-frankly-forgave-them-both',
    ]);
    expect(FINANCING_DEBT_META.weeks).toBe(M.length);
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
    expect(FINANCING_DEBT_META.care).toBe(FINANCING_DEBT_CARE_NOTE);
    expect(FINANCING_DEBT_CARE_NOTE).toMatch(/not legal or financial advice/i);
    expect(FINANCING_DEBT_CARE_NOTE).toMatch(/foreclosure/i);
    expect(FINANCING_DEBT_CARE_NOTE).toMatch(/bankruptcy/i);
    expect(FINANCING_DEBT_TUTOR_META.posture).toMatch(/[Nn]ever give legal or financial advice/);
    // the two doctrinal rails the tutor must not drop
    expect(FINANCING_DEBT_TUTOR_META.posture).toMatch(/never invent a prohibition/);
    expect(FINANCING_DEBT_TUTOR_META.posture).toMatch(/never flatter debt/);
  });

  it('opens Word-first on the position AND on where the fault is located', () => {
    const wf = FINANCING_DEBT_META.wordFirst;
    expect(wf.ref).toContain('Deuteronomy 28:44');
    expect(wf.ref).toContain('Psalms 37:21');
    expect(wf.frame).toContain('he shall be the head, and thou shalt be the tail');
    expect(wf.frame).toContain('The wicked borroweth, and payeth not again');
    expect(wf.frame, 'the whole course rests on this not being called sin').toContain('It is never called sin');
  });

  it('runs a session flow that adds up', () => {
    expect(FINANCING_DEBT_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
    expect(FINANCING_DEBT_META.handsOnLabel).toBe('Work it on a real note');
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with ANY of the other six Real Estate courses', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs(),
      ...buyingTermsRefs(), ...leasingTenantsRefs(), ...maintenanceTradesRefs(), ...partnershipsRefs()]
      .map((r) => r.split(':')[0].trim()));
    const mine = financingDebtRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(65);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = financingDebtRefs();
    // eight anchors; the two wordFirst refs are the same verses as lessons 1
    // and 4, so the deduped list is exactly eight rather than ten.
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
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(90);
  });

  it('never elides INSIDE a quotation, and does not flag our own prose', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(elidedSpans(text), `${path} elided a quotation`).toEqual([]);
      });
    }
    expect(elidedSpans('"he shall be the head ... the tail" (Deuteronomy 28:44)').length, 'a real elision passed').toBe(1);
    expect(elidedSpans('"he shall be the head … the tail" (Deuteronomy 28:44)').length, 'a unicode elision passed').toBe(1);
    expect(elidedSpans('He wrote "he shall be the head" and then... then "thou shalt be the tail".'),
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
    expect(M[4].lesson).toContain('thy servant did fear the LORD');
    expect(M[5].lesson).toContain('that the LORD thy God may bless thee in all that thou settest thine hand to');
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
  it('lesson 1 refuses to call borrowing sin, and names the position instead', () => {
    const l = M[0].lesson;
    expect(l).toContain('he shall be the head, and thou shalt be the tail');
    expect(l).toContain('thou shalt lend unto many nations, and thou shalt not borrow');
    expect(l, 'the prohibition must be explicitly refused').toMatch(/Scripture nowhere forbids borrowing/);
    expect(l, 'and this course must not invent one').toMatch(/will not invent a prohibition Yahweh did not give/);
    expect(l, 'the pastoral cost of the wrong reading').toMatch(/he hides it, or he despairs/);
    expect(l, 'timing is the power borrowers underestimate').toMatch(/controls TIMING/);
  });

  it('lesson 2 walks the stages AND refuses to darken the ending', () => {
    const l = M[1].lesson;
    expect(l).toContain('when money failed in the land of Egypt');
    expect(l).toContain('buy us and our land for bread, and we and our land will be servants unto Pharaoh');
    expect(l, 'the mechanism, not a moral').toMatch(/The mechanism is STAGING/);
    expect(l, 'no fraud anywhere is the uncomfortable half').toMatch(/there is no fraud anywhere in the chapter/);
    // DR-0100: the better-than-expected ratio is stated rather than softened away
    expect(l).toContain('lo, here is seed for you, and ye shall sow the land');
    expect(l).toContain('that Pharaoh should have the fifth part');
    expect(l, 'the honest comparison must be made').toMatch(/better ratio than a great many modern arrangements/);
  });

  it('lesson 3 puts the weight on the verbs and on the dates', () => {
    const l = M[2].lesson;
    expect(l).toContain('Shall they not rise up suddenly that shall bite thee');
    expect(l).toContain('Woe to him that increaseth that which is not his');
    expect(l, 'the verbs are the teaching').toMatch(/RISE UP\. AWAKE\./);
    expect(l, 'patience is mistaken for goodwill').toMatch(/patience is constantly mistaken for goodwill/);
    expect(l, 'the quiet period is not evidence').toMatch(/treating the quiet period as evidence/);
    expect(l, 'it is a timing problem, which is the fixable part').toMatch(/It was a timing problem/);
  });

  it('lesson 4 locates the fault at payeth not again, and keeps the second half', () => {
    const l = M[3].lesson;
    expect(l).toContain('The wicked borroweth, and payeth not again');
    expect(l, 'the predicate that condemns').toMatch(/The condemning predicate is PAYETH NOT AGAIN/);
    expect(l, 'the open hand is the real contrast').toMatch(/a closed hand with an open one/);
    expect(l).toContain('He is ever merciful, and lendeth; and his seed is blessed');
    expect(l, 'the failures are the undocumented ones').toMatch(/It is almost never the mortgage/);
  });

  it('lesson 5 answers a creditor with production, and keeps both halves of the settlement', () => {
    const l = M[4].lesson;
    expect(l).toContain('what hast thou in the house?');
    expect(l).toContain('borrow not a few');
    expect(l, 'the three things the prophet did not do').toMatch(/He does not take up a collection/);
    expect(l, 'her preparation set the ceiling').toMatch(/her preparation set the ceiling on her provision/);
    expect(l).toContain('pay thy debt, and live thou and thy children of the rest');
    expect(l, 'production rather than a better arrangement').toMatch(/Consumption answered by production/);
  });

  it('lesson 6 keeps BOTH halves of the usury command', () => {
    const l = M[5].lesson;
    expect(l).toContain('Thou shalt not lend upon usury to thy brother');
    expect(l).toContain('Unto a stranger thou mayest lend upon usury');
    expect(l, 'the shape of the command is the argument').toMatch(/comprehensive as to KIND/);
    expect(l, 'and specific as to person').toMatch(/specific as to PERSON/);
    expect(l, 'why the distinction is coherent').toMatch(/take a profit from his trouble/);
    expect(l, 'the blessing clause must not be dropped').toContain('that the LORD thy God may bless thee in all that thou settest thine hand to');
  });

  it('lesson 7 locates the conscience, and keeps the reporting half', () => {
    const l = M[6].lesson;
    expect(l).toContain('Alas, master! for it was borrowed');
    expect(l, 'the grief is in the ownership').toMatch(/belonged to somebody else/);
    expect(l, 'the department pattern, a fourth object').toMatch(/four times on four different objects/);
    expect(l).toContain('And the man of God said, Where fell it? And he shewed him the place');
    expect(l, 'concealment is arrived at, not chosen').toMatch(/one postponed conversation at a time/);
  });

  it('lesson 8 ends the subject where Jesus ends it', () => {
    const l = M[7].lesson;
    expect(l).toContain('when they had nothing to pay, he frankly forgave them both');
    expect(l, 'nothing to pay must not be softened').toMatch(/not a workout plan — nothing whatever/);
    expect(l, 'Simon judges himself without noticing').toMatch(/a verdict on himself/);
    expect(l, 'the test is conduct, not recall').toMatch(/conduct toward other debtors/);
    expect(l, 'the capstone must name the seven before it').toMatch(/This course has taught position/);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'financing-debt');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('joins the SAME single Real Estate shelf as the six before it', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((l) => l.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate').map((c) => c.key);
    for (const k of ['financing-debt', 'partnerships', 'maintenance-trades', 'leasing-tenants',
      'buying-terms', 'property-principle', 'management-stewardship']) {
      expect(re, `${k} missing from the shelf`).toContain(k);
    }
    expect(re.length).toBeGreaterThanOrEqual(7);
  });

  it('hands the catalog a schedule, a summary and a download that all work', () => {
    const rows = row.buildScheduleRows();
    expect(rows.length).toBe(8);
    expect(row.progressSummary({}).done).toBe(0);
    const md = row.exportMarkdown();
    expect(md).toContain('Financing: The Debt You Sign and the Lender You Face');
    expect(md.length).toBeGreaterThan(2000);
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('carries its own interest and helper tags, and its own copy', () => {
    expect(row.interestTag).toBe('[Financing]');
    expect(row.helperTag).toBe('[Financing helper]');
    expect(row.interestText('Someone')).toContain('[Financing]');
    expect(row.interestCopy.blurb).toMatch(/not legal or financial advice/i);
    expect(row.tutorCourseMeta.key).toBe('financing-debt');
  });

  it('builds a schedule and a summary directly, too', () => {
    const sched = buildFinancingDebtSchedule('2026-10-01');
    expect(sched.length).toBe(8);
    const sum = financingDebtProgressSummary({ 'fin1-the-head-and-the-tail': true });
    expect(sum.done).toBe(1);
    expect(sum.total).toBe(8);
    expect(exportFinancingDebtCurriculumMarkdown(null)).toContain('Prayer + the anchor');
  });
});

describe('the checks above can actually fail', () => {
  const m = M[0];

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('"he shall be the head, and thou shalt be the tail" (Deuteronomy 28:43).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a quotation that drifted by one word', () => {
    expect(quotationFaults('"The wicked borroweth, and payeth not back" (Psalms 37:21)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a fabricated quotation outright', () => {
    expect(quotationFaults('"Thou shalt not sign a note unadvisedly" (Deuteronomy 28:44)').join(' '))
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
    expect(/\bthe LORD\b/.test(ours('And so the LORD requires this of a borrower.')),
      'our prose using His title instead of His name passed').toBe(true);
  });
});
