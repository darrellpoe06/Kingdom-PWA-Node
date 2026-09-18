// @vitest-environment node
// =============================================================================
// WHY OWNED PROPERTY IS A PRINCIPLE — course one of the Real Estate department
// =============================================================================
// Darrell asked for a Real Estate DEPARTMENT: twenty-two courses, from why owned
// property is a principle through management as stewardship. Measured before it
// was built: the catalog carried no real-estate course of any kind, and no
// lesson anywhere in it mentioned property, landlord, tenant, lease, appraisal
// or zoning. The department did not exist. This is its first course.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG, and what holds each one:
//
//   1. A TRADE COURSE WITH A VERSE ON TOP. The arc is one argument in eight
//      moves — given, bounded, protected from power, time-limited, documented,
//      costed, just, handed forward — and the order is pinned here, because a
//      shuffled arc is a collection of tips rather than a footing.
//   2. SCRIPTURE FROM MEMORY. 105 quoted spans, every one walked against the
//      repo's own KJV, across the WHOLE module rather than the reader texts
//      only (the L178 lesson: a misquotation hides in a benefit or a quiz
//      explanation as easily as in a band).
//   3. "THE LORD" DRIFTING INTO OUR OWN VOICE. DR-0210's bright line runs both
//      ways: our prose says Yahweh, and quoted Scripture is left exactly as the
//      KJV has it. Both halves are checked, separately.
//   4. A BANDLESS LESSON. Every lesson carries teen and senior from the first
//      commit, measured on the ladder, the fullness floor and the overlap
//      ceiling — so this course arrives with zero course-band debt (DR-0497).
//   5. A SUMMARY WEARING A BAND'S NAME. Four teen bands measured below the 0.6
//      fullness floor on the first pass and were re-authored with the real
//      application rather than padded; the floor is checked here.
//   6. AN OPERATOR LESSON WITH NO CEILING ON PROFIT. Lesson 7 is the wage that
//      cannot wait; lesson 3 is the Naboth test. Both are pinned by content,
//      because they are the reason this department is taught at all.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PROPERTY_PRINCIPLE_MODULES, PROPERTY_PRINCIPLE_META, PROPERTY_PRINCIPLE_SESSION_FLOW,
  PROPERTY_PRINCIPLE_CARE_NOTE, PROPERTY_PRINCIPLE_TUTOR_META,
  buildPropertyPrincipleSchedule, propertyPrincipleProgressSummary,
  exportPropertyPrincipleCurriculumMarkdown, propertyPrincipleRefs,
} from '../lib/property-principle-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = PROPERTY_PRINCIPLE_MODULES;
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

describe('the course exists, and it is shaped like a course', () => {
  it('carries eight lessons in the order the argument runs', () => {
    expect(M.map((m) => m.id)).toEqual([
      'prop1-the-land-is-his-and-it-was-given-by-name',
      'prop2-the-landmark-is-a-moral-object',
      'prop3-naboths-vineyard-when-the-process-is-lawful-and-the-act-is-murder',
      'prop4-a-sale-was-a-lease-of-years',
      'prop5-the-deed-the-witnesses-and-the-earthen-vessel',
      'prop6-the-field-before-the-house',
      'prop7-the-tenant-is-a-neighbour-and-the-wage-cannot-wait',
      'prop8-handed-forward-or-handed-to-a-fool',
    ]);
    expect(PROPERTY_PRINCIPLE_META.weeks).toBe(M.length);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      expect(words(m.anchor.theme), `${m.id} anchor theme`).toBeGreaterThan(15);
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

  it('states its limit on the meta, where every surface renders it', () => {
    expect(PROPERTY_PRINCIPLE_META.care).toBe(PROPERTY_PRINCIPLE_CARE_NOTE);
    expect(PROPERTY_PRINCIPLE_CARE_NOTE).toMatch(/not legal or financial advice/i);
    expect(PROPERTY_PRINCIPLE_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
  });

  it('opens Word-first, under His frame rather than a market frame', () => {
    const wf = PROPERTY_PRINCIPLE_META.wordFirst;
    expect(wf.ref).toContain('Leviticus 25:23');
    expect(quotationFaults(`"${'The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me'}" (Leviticus 25:23)`)).toEqual([]);
    expect(wf.frame).toContain('The land shall not be sold for ever');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    const total = PROPERTY_PRINCIPLE_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);
    expect(total).toBe(65);
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
    expect(spans, 'the walk found no quotations at all — it is measuring nothing').toBeGreaterThan(90);
  });

  it('never elides inside a quotation (DR-0459)', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(/"[^"]*(?:\.\.\.|…)[^"]*"/.test(text), `${path} elided a quotation`).toBe(false);
      });
    }
  });

  it('says Yahweh in OUR voice and leaves "the LORD" exactly where the KJV has it', () => {
    // DR-0210's bright line, both halves. Our prose names Him by His covenant
    // name; a quotation is never edited to do so.
    const stray = [];
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        const mine = ours(text);
        if (/\bthe LORD\b/.test(mine)) stray.push(`${path}: "the LORD" in our own prose`);
      });
    }
    expect(stray, stray.join('\n')).toEqual([]);
    // and the quoted text still carries it, so nothing was scrubbed
    const quoted = M.map((m) => m.lesson).join(' ');
    expect(quoted).toContain('the LORD thy God giveth thee');
    expect(M[0].lesson).toContain('Yahweh');
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
        const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
        const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
      }
    }
  });
});

describe('the eight moves each teach their own thing', () => {
  it('lesson 1 keeps the title with Yahweh and the use with the holder', () => {
    expect(M[0].lesson).toContain('for the land is mine');
    expect(M[0].lesson).toMatch(/stranger and a sojourner|strangers and sojourners/);
  });

  it('lesson 3 is the Naboth test — a lawful process that was still murder', () => {
    const l = M[2];
    expect(l.lesson).toContain('Hast thou killed, and also taken possession?');
    expect(l.lesson).toMatch(/[Tt]wo witnesses/); // the text capitalises it at the start of the sentence — the check was wrong, not the lesson
    expect(l.levels.teen).toMatch(/[Ll]egal is not the same as right/);
    expect(l.levels.senior).toMatch(/form is carrying the violence|no defence/);
  });

  it('lesson 4 prices a holding by its remaining years', () => {
    expect(M[3].lesson).toContain('According to the multitude of years thou shalt increase the price thereof');
    expect(M[3].levels.senior).toMatch(/remaining term|number of years/);
  });

  it('lesson 7 puts a ceiling on profit that the market does not set', () => {
    const l = M[6];
    expect(l.lesson).toContain('shall not abide with thee all night');
    expect(l.lesson).toContain('for he is poor, and setteth his heart upon it');
    expect(l.lesson).toMatch(/deposit/i);
    expect(l.lesson).toMatch(/late fee/i);
  });

  it('lesson 8 aims three generations out and names successor risk honestly', () => {
    expect(M[7].lesson).toContain('A good man leaveth an inheritance to his children’s children');
    expect(M[7].lesson).toMatch(/wise man or a fool/);
    expect(M[7].lesson).toContain('even my God');
  });

  it('cites every anchor it names, and names them all in the refs list', () => {
    const refs = propertyPrincipleRefs();
    expect(refs.length).toBeGreaterThan(15);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing from refs`).toContain(part.trim());
      }
    }
  });
});

describe('it is wired into the school, and it opens the Real Estate department', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'property-principle');

  it('appears in the catalog as a self-paced course under Real Estate', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('creates the department with no new machinery — the category IS the shelf', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels, 'Real Estate did not open as a department').toContain('Real Estate');
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    // Self-paced: no cohort start, so a fabricated date is the defect to avoid.
    for (const r of rows) expect(r.dateISO == null || r.dateISO === '').toBe(true);
    const done = propertyPrincipleProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportPropertyPrincipleCurriculumMarkdown(null);
    expect(md).toContain('Why Owned Property Is a Principle');
    expect(md).toContain('Naboth');
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('offers the interest door without promising legal help', () => {
    expect(row.interestTag).toBe('[Property Principle]');
    expect(row.interestCopy.blurb).toMatch(/not legal or financial advice/i);
    expect(row.interestText('Someone')).toContain('[Property Principle]');
  });

  it('matches the schedule the shared framework builds directly', () => {
    expect(buildPropertyPrincipleSchedule(null)).toHaveLength(M.length);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  const m = M[2];

  it('catches a quotation that drifted by one word', () => {
    const drifted = 'He said it. "Hast thou killed, and also taken the possession?" (1 Kings 21:19).';
    expect(quotationFaults(drifted).join(' '), 'a drifted quotation passed').toMatch(/NOT VERBATIM/);
    const right = 'He said it. "Hast thou killed, and also taken possession?" (1 Kings 21:19).';
    expect(quotationFaults(right)).toEqual([]);
  });

  it('catches a quotation hung on the wrong reference', () => {
    const wrong = 'He said it. "Hast thou killed, and also taken possession?" (1 Kings 21:18).';
    expect(quotationFaults(wrong).join(' '), 'a mislabelled reference passed').toMatch(/NOT VERBATIM/);
  });

  it('catches "the LORD" drifting into our own prose', () => {
    const drifted = 'We teach that the LORD kept the title to the ground.';
    expect(/\bthe LORD\b/.test(ours(drifted)), 'our prose said "the LORD" and nothing objected').toBe(true);
    // and a real quotation carrying it is NOT a fault, which is the other half
    const quoted = 'The Word says "which the LORD thy God giveth thee to possess it" (Deuteronomy 19:14).';
    expect(/\bthe LORD\b/.test(ours(quoted))).toBe(false);
  });

  it('catches an inverted ladder', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'the bands are already inverted').toBe(false);
    expect(fk(m.levels.teen) < fk(m.levels.senior)).toBe(true);
    // swap them and the predicate fails
    expect(fk(m.levels.senior) < fk(m.levels.teen)).toBe(false);
    expect(fk(m.lesson) <= TEEN_CEILING, 'the adult text would pass as a teen band').toBe(false);
  });

  it('catches a band that is a summary rather than a lesson', () => {
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
  });

  it('catches a near-copy band', () => {
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches a lesson that lost a band or a quiz question', () => {
    const bare = { id: 'x', lesson: 'words', levels: { senior: 'words' }, quiz: { questions: [{}] } };
    expect(['teen', 'senior'].filter((b) => !bare.levels[b])).toEqual(['teen']);
    expect(bare.quiz.questions.length === 2, 'a one-question quiz passed').toBe(false);
  });
});
