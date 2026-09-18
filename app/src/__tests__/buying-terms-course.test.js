// @vitest-environment node
// =============================================================================
// BUYING: PRICE, TERMS AND THE COUNT TO FINISH — Real Estate, course three
// =============================================================================
// The first course BETWEEN the department's two ends (DR-0500 the footing,
// DR-0501 the capstone). It covers the transaction itself, which is where a
// believer is most often quietly compromised — not by a crime, but by a lawful
// practice nobody names.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with either of the other two Real Estate courses.
//   2. A MUSHY READING OF PROVERBS 20:14, which would make a bad operator in
//      the opposite direction — "never negotiate". The lesson draws the line
//      explicitly: a DEFECT is a fact and may be pressed hard; a verdict on
//      value the speaker does not hold is a lever made of a lie. Pinned.
//   3. FLATTERING OR FORBIDDING DEBT. Lesson 6 states BOTH edges and stops
//      where Scripture stops (DR-0098): borrowing is never called sin, and it
//      is never flattered — it is named as the ruled position. Both halves are
//      pinned, because dropping either one is the failure.
//   4. SCRIPTURE FROM MEMORY. 67 quoted spans walked against the repo's own
//      KJV across the whole module. The generator caught two ELISIONS inside
//      quotations in the first draft (DR-0459 forbids them); each became two
//      genuinely-verbatim spans.
//   5. A SUMMARY WEARING A BAND'S NAME. Measured across all eight at once — the
//      lesson learned the hard way on the capstone — every teen band came in at
//      0.40 to 0.60 of the adult lesson against the 0.6 floor. All eight were
//      extended with real application in the teen register, not padded.
//   6. AN ARC THAT DOES NOT ARGUE. Lesson 8 is last on purpose and says so:
//      integrity at the hard moment is mostly the accumulated result of the
//      seven decisions before it. The order is pinned.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BUYING_TERMS_MODULES, BUYING_TERMS_META, BUYING_TERMS_SESSION_FLOW,
  BUYING_TERMS_CARE_NOTE, BUYING_TERMS_TUTOR_META,
  buildBuyingTermsSchedule, buyingTermsProgressSummary,
  exportBuyingTermsCurriculumMarkdown, buyingTermsRefs,
} from '../lib/buying-terms-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { managementStewardshipRefs } from '../lib/management-stewardship-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = BUYING_TERMS_MODULES;
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
      'buy1-abraham-refused-the-gift-and-paid-in-public',
      'buy2-two-sets-of-weights-in-one-bag',
      'buy3-it-is-naught-it-is-naught-saith-the-buyer',
      'buy4-surety-the-trap-you-talk-yourself-into',
      'buy5-haste-is-the-most-expensive-thing-in-the-deal',
      'buy6-what-borrowing-makes-you-and-what-it-does-not',
      'buy7-give-a-portion-to-seven-and-also-to-eight',
      'buy8-he-that-sweareth-to-his-own-hurt-and-changeth-not',
    ]);
    expect(BUYING_TERMS_META.weeks).toBe(M.length);
  });

  it('closes by naming its own order as the teaching', () => {
    // A course whose last lesson does not depend on the earlier ones is a list,
    // not an argument.
    expect(M[7].lesson).toMatch(/WHY THIS LESSON COMES LAST|comes last/i);
    expect(M[7].lesson).toMatch(/accumulated result/);
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

  it('states its limit on the meta and in the tutor posture', () => {
    expect(BUYING_TERMS_META.care).toBe(BUYING_TERMS_CARE_NOTE);
    expect(BUYING_TERMS_CARE_NOTE).toMatch(/not legal or financial advice/i);
    expect(BUYING_TERMS_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
  });

  it('opens Word-first on the public price and the just weight', () => {
    const wf = BUYING_TERMS_META.wordFirst;
    expect(wf.ref).toContain('Genesis 23:13');
    expect(wf.frame).toContain('I will give thee money for the field; take it of me');
    expect(wf.frame).toContain('A false balance is abomination to the LORD');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(BUYING_TERMS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with either other Real Estate course', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs()]
      .map((r) => r.split(':')[0].trim()));
    const mine = buyingTermsRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(15);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = buyingTermsRefs();
    expect(refs.length).toBeGreaterThan(12);
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
    expect(spans, 'the walk found no quotations — it is measuring nothing').toBeGreaterThan(55);
  });

  it('never elides inside a quotation, which the first draft did twice', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(/"[^"]*(?:\.\.\.|\u2026)[^"]*"/.test(text), `${path} elided a quotation`).toBe(false);
      });
    }
    // the two-span replacements are present rather than the elisions
    expect(M[0].levels.senior).toContain('"four hundred shekels of silver, current money with the merchant"');
    expect(M[3].anchor.theme).toContain('"My son, if thou be surety for thy friend"');
  });

  it('says Yahweh in OUR voice and leaves "the LORD" where the KJV has it', () => {
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

  it('renders both bands without losing a word', () => {
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
  it('lesson 1 has a buyer refusing a gift, with all four elements of a close', () => {
    const l = M[0];
    expect(l.lesson).toContain('I will give thee money for the field; take it of me');
    expect(l.lesson).toContain('before all that went in at the gate of his city');
    expect(l.lesson, 'the reason the gift was worse must be stated')
      .toMatch(/unpriced transfer/);
  });

  it('lesson 2 bans the BAG, and explains why possession is the thing forbidden', () => {
    const l = M[1];
    expect(l.lesson).toContain('Thou shalt not have in thy bag divers weights');
    expect(l.lesson).toContain('A false balance is abomination to the LORD');
    expect(l.lesson).toMatch(/defensible on its own|defensible alone/);
  });

  it('lesson 3 draws the negotiation line rather than forbidding negotiation', () => {
    const l = M[2];
    expect(l.lesson).toContain('It is naught, it is naught, saith the buyer');
    expect(l.lesson, 'it must say plainly what it does NOT forbid')
      .toMatch(/does not forbid negotiation/i);
    expect(l.lesson).toMatch(/verdict on value/i);
  });

  it('lesson 4 closes the snare at the promise, not the default', () => {
    const l = M[3];
    expect(l.lesson).toContain('thou art taken with the words of thy mouth');
    expect(l.lesson).toMatch(/TRAP CLOSES AT AGREEMENT|closes at AGREEMENT/);
    expect(l.lesson).toMatch(/personal guarantee/i);
  });

  it('lesson 5 defines haste as closing before the truth arrives', () => {
    const l = M[4];
    expect(l.lesson).toContain('but of every one that is hasty only to want');
    expect(l.lesson).toContain('considereth not that poverty shall come upon him');
    expect(l.lesson).toMatch(/CLOSING BEFORE THE TRUTH ARRIVES|closing before the truth/i);
  });

  it('lesson 6 states BOTH edges on borrowing and stops where Scripture stops', () => {
    const l = M[5];
    expect(l.lesson).toContain('but thou shalt not borrow');
    expect(l.lesson).toContain('Owe no man any thing, but to love one another');
    expect(l.lesson, 'it must say the Word does not call borrowing sin')
      .toMatch(/does not call borrowing sin/);
    expect(l.lesson, 'and it must not flatter it either')
      .toMatch(/costs you sovereignty|ruled/);
  });

  it('lesson 7 rests on admitted ignorance, not a forecast', () => {
    const l = M[6];
    expect(l.lesson).toContain('for thou knowest not what evil shall be upon the earth');
    expect(l.lesson).toMatch(/confessed limit|YOU DO NOT KNOW WHAT IS COMING/);
    expect(l.lesson).toMatch(/LIQUID RESERVES|liquid reserves/i);
  });

  it('lesson 8 names attrition as the failure and removes silence', () => {
    const l = M[7];
    expect(l.lesson).toContain('He that sweareth to his own hurt, and changeth not');
    expect(l.lesson).toContain('he shall do according to all that proceedeth out of his mouth');
    expect(l.lesson).toMatch(/ATTRITION|attrition/);
    expect(l.lesson).toMatch(/removes is SILENCE|removes.*silence/i);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'buying-terms');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
  });

  it('makes the department three courses on ONE shelf', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate');
    expect(re.map((c) => c.key).sort()).toEqual(['buying-terms', 'management-stewardship', 'property-principle']);
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    for (const r of rows) expect(r.dateISO == null || r.dateISO === '').toBe(true);
    const done = buyingTermsProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportBuyingTermsCurriculumMarkdown(null);
    expect(md).toContain('Buying: Price, Terms and the Count to Finish');
    expect(md).toContain('surety');
    expect(buildBuyingTermsSchedule(null)).toHaveLength(M.length);
  });

  it('offers the interest door without promising legal help', () => {
    expect(row.interestTag).toBe('[Buying Terms]');
    expect(row.interestCopy.blurb).toMatch(/not legal or financial advice/i);
  });
});

describe('proven-to-catch (DR-0076 \u00a73)', () => {
  const m = M[1];

  it('catches a quotation that drifted by one word', () => {
    expect(quotationFaults('He wrote it. "A false balance is abomination unto the LORD" (Proverbs 11:1).').join(' '))
      .toMatch(/NOT VERBATIM/);
    expect(quotationFaults('He wrote it. "A false balance is abomination to the LORD" (Proverbs 11:1).')).toEqual([]);
  });

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('He wrote it. "A false balance is abomination to the LORD" (Proverbs 11:2).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an elision, which is what the first draft shipped twice', () => {
    const elided = '"Abraham weighed to Ephron the silver... current money with the merchant" (Genesis 23:16)';
    expect(/"[^"]*(?:\.\.\.|\u2026)[^"]*"/.test(elided), 'an elided quotation passed').toBe(true);
  });

  it('catches an inverted ladder, a summary, and a near-copy', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches a course that re-preached a sibling', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs()]
      .map((r) => r.split(':')[0].trim()));
    expect(others.has('Genesis 39'), 'the capstone no longer cites Genesis 39 — re-pin this').toBe(true);
    const pretend = ['Genesis 39:4', 'Genesis 23:13'].map((r) => r.split(':')[0].trim());
    expect(pretend.filter((b) => others.has(b)), 'a shared passage passed unnoticed').toEqual(['Genesis 39']);
  });
});
