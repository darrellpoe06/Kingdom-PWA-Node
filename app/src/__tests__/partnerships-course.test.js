// @vitest-environment node
// =============================================================================
// PARTNERSHIPS: WHO YOU BUILD WITH — Real Estate, course six
// =============================================================================
// The person standing next to you when you sign. Five courses covered the
// ground, the stewardship, the transaction, the tenant and the building.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG:
//
//   1. TEACHING SUSPICION INSTEAD OF THE WORD. Six of eight lessons are
//      cautionary by nature, so lesson 2 makes the case FOR partnership before
//      any warning arrives — and argues it, as Scripture does, from the FAILURE
//      state rather than from output. Pinned.
//   2. THE OPPOSITE ERROR. Lesson 6 refuses it: Acts 15 records a sharp
//      separation and assigns fault to NEITHER man. A course that treats every
//      dissolution as sin produces operators who stay yoked past usefulness
//      because leaving has been made to feel like betrayal. Both the permissive
//      half and the restrictive half are pinned, because dropping either one
//      breaks the lesson.
//   3. SUPERSTITION ABOUT FAILED VENTURES. Lesson 4 names the counterparty as
//      the cause in 2 Chronicles 20 — and states its own limit in the text,
//      because overstated this becomes a diagnostic to run over every
//      disappointment. The limit is pinned.
//   4. LOSING THE TRANSACTION/YOKE DISTINCTION, which commercial language works
//      hard to obscure by calling both "partnership". Pinned.
//   5. RE-PREACHING ITS SIBLINGS. Checked, not trusted: no book-and-chapter is
//      shared with any of the OTHER FIVE Real Estate courses. All nine here are
//      fresh against the 64 already in use.
//   6. SCRIPTURE FROM MEMORY. 58 quoted spans walked against the repo's own KJV.
//   7. A BARE SEND OR TEACH STAGE (DR-0509). This is the FIRST course to ship
//      benefits AND stories from its first commit. Five earlier courses shipped
//      without them and rendered a heading with nothing under it; Darrell found
//      that in the app before any gate did. The generator now refuses to emit a
//      course lacking either, and every-stage-reaches-the-reader fails one that
//      ships bare. Pinned here directly as well.
//   8. A SUMMARY WEARING A BAND'S NAME. Measured across all eight lessons AT
//      ONCE. Three dimensions failed in that one pass — eight teen bands at
//      0.43-0.57 against the 0.6 floor, two senior bands over grade 10 (10.2
//      and 11.4), and one senior~adult overlap at 0.351 against a 0.25 ceiling.
//      All closed; the last needed a genuine re-authoring rather than a split.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PARTNERSHIPS_MODULES, PARTNERSHIPS_META, PARTNERSHIPS_SESSION_FLOW,
  PARTNERSHIPS_CARE_NOTE, PARTNERSHIPS_TUTOR_META,
  buildPartnershipsSchedule, partnershipsProgressSummary,
  exportPartnershipsCurriculumMarkdown, partnershipsRefs,
} from '../lib/partnerships-course.js';
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


const M = PARTNERSHIPS_MODULES;
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
      'part1-can-two-walk-together-except-they-be-agreed',
      'part2-two-are-better-than-one',
      'part3-unequally-yoked-what-a-yoke-actually-is',
      'part4-and-the-ships-were-broken',
      'part5-let-there-be-no-strife-separate-thyself',
      'part6-the-contention-was-so-sharp',
      'part7-in-the-multitude-of-counsellors',
      'part8-the-people-had-a-mind-to-work',
    ]);
    expect(PARTNERSHIPS_META.weeks).toBe(M.length);
  });

  it('closes by naming its own order as the teaching', () => {
    expect(M[7].lesson).toMatch(/WHY THIS LESSON COMES LAST/);
    expect(M[7].lesson, 'the seven before it are technique applied to other people')
      .toMatch(/technique is what you apply to other people/);
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

  it('ships benefits AND stories on every lesson, from the first commit (DR-0509)', () => {
    // The defect Darrell found in the app: the send stage's reader-facing side
    // carries ONLY benefits and the teach stage's carries ONLY stories, so a
    // course without them renders a heading with nothing under it. Five courses
    // shipped that way. This is the first one that never could.
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
        // the Living Lessons band, measured: 157-424 words
        const w = s.body.split(/\s+/).filter(Boolean).length;
        expect(w, `${m.id} story "${s.title}" is ${w} words`).toBeGreaterThanOrEqual(157);
        expect(w, `${m.id} story "${s.title}" is ${w} words`).toBeLessThanOrEqual(424);
      }
    }
  });

  it('states its limit on the meta and in the tutor posture', () => {
    expect(PARTNERSHIPS_META.care).toBe(PARTNERSHIPS_CARE_NOTE);
    expect(PARTNERSHIPS_CARE_NOTE).toMatch(/not legal advice/i);
    expect(PARTNERSHIPS_CARE_NOTE).toMatch(/guarantee/i);
    expect(PARTNERSHIPS_CARE_NOTE).toMatch(/dissolution/i);
    expect(PARTNERSHIPS_TUTOR_META.posture).toMatch(/[Nn]ever give legal/);
    // the two balance rules the tutor must not drop
    expect(PARTNERSHIPS_TUTOR_META.posture).toMatch(/never teach that an ending is a sin/);
    expect(PARTNERSHIPS_TUTOR_META.posture).toMatch(/FAILURE state/);
  });

  it('opens Word-first on the sequence and on the case FOR partnership', () => {
    const wf = PARTNERSHIPS_META.wordFirst;
    expect(wf.ref).toContain('Amos 3:3');
    expect(wf.frame).toContain('Can two walk together, except they be agreed?');
    expect(wf.frame).toContain('Two are better than one');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(PARTNERSHIPS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
    expect(PARTNERSHIPS_META.handsOnLabel).toBe('Work it on a real partnership');
  });
});

describe('it teaches something its siblings did not', () => {
  it('shares no book-and-chapter with ANY of the other five Real Estate courses', () => {
    const others = new Set([...propertyPrincipleRefs(), ...managementStewardshipRefs(),
      ...buyingTermsRefs(), ...leasingTenantsRefs(), ...maintenanceTradesRefs()]
      .map((r) => r.split(':')[0].trim()));
    const mine = partnershipsRefs().map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `re-uses a sibling course's passages: ${shared.join(', ')}`).toEqual([]);
    expect(others.size, 'the sibling refs lists are empty — this check is measuring nothing').toBeGreaterThan(55);
  });

  it('names every anchor it cites in its refs list', () => {
    const refs = partnershipsRefs();
    expect(refs.length).toBeGreaterThan(8);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing`).toContain(part.trim());
      }
    }
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, stories included', () => {
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
    expect(elidedSpans('"Can two walk ... together" (Amos 3:3)').length, 'a real elision passed').toBe(1);
    expect(elidedSpans('"Can two walk … together" (Amos 3:3)').length, 'a unicode elision passed').toBe(1);
    expect(elidedSpans('He asked "Can two walk together" and then... then "except they be agreed".'),
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
    expect(M[3].lesson).toContain('the LORD hath broken thy works');
    expect(M[5].lesson).toContain('recommended by the brethren unto the grace of God');
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
  it('lesson 1 puts agreement FIRST and names the four blanks', () => {
    const l = M[0];
    expect(l.lesson).toContain('Can two walk together, except they be agreed?');
    expect(l.lesson, 'the order is the teaching').toMatch(/AGREED comes first/);
    expect(l.lesson, 'partnerships form on complementarity, which is why the talk is postponed')
      .toMatch(/COMPLEMENTARITY/);
    expect(l.lesson).toMatch(/NAME THE FOUR BLANKS/);
  });

  it('lesson 2 argues FOR partnership, and from the failure state', () => {
    const l = M[1];
    expect(l.lesson).toContain('Two are better than one');
    expect(l.lesson).toContain('woe to him that is alone when he falleth');
    expect(l.lesson).toContain('a threefold cord is not quickly broken');
    // the sharper claim readers usually miss
    expect(l.lesson, 'it must correct the expectation of an output argument')
      .toMatch(/THAT IS NOT THE ARGUMENT SCRIPTURE MAKES/);
    expect(l.lesson).toMatch(/FAILURE STATE/);
  });

  it('lesson 3 rebuilds the yoke image and separates it from a transaction', () => {
    const l = M[2];
    expect(l.lesson).toContain('Be ye not unequally yoked together with unbelievers');
    expect(l.lesson).toContain('what communion hath light with darkness');
    expect(l.lesson, 'the damage runs both ways').toMatch(/BOTH directions/);
    expect(l.lesson, 'the mismatch is direction, not temperament')
      .toMatch(/DIRECTION AND ALLEGIANCE/);
    expect(l.lesson).toMatch(/A TRANSACTION is bounded/);
  });

  it('lesson 4 names the counterparty AND states its own limit', () => {
    const l = M[3];
    expect(l.lesson).toContain('who did very wickedly');
    expect(l.lesson).toContain('the LORD hath broken thy works');
    expect(l.lesson).toContain('the ships were broken at Eziongeber');
    expect(l.lesson, 'the cause named is the counterparty').toMatch(/THE COUNTERPARTY/);
    // without the limit this becomes superstition, which is the real hazard
    expect(l.lesson, 'the limit must be stated').toMatch(/NOT that every failed venture reveals a bad partner/);
    expect(l.lesson).toMatch(/you do not get a prophet/i);
  });

  it('lesson 5 has the senior party initiating AND surrendering the choice', () => {
    const l = M[4];
    expect(l.lesson).toContain('Let there be no strife, I pray thee');
    expect(l.lesson).toContain('if thou wilt take the left hand, then I will go to the right');
    expect(l.lesson, 'the object protected is the relationship').toMatch(/FOR WE BE BRETHREN/);
    expect(l.lesson).toMatch(/CUT-AND-CHOOSE/);
    expect(l.lesson, 'timing carries the weight').toMatch(/behind a veil/);
  });

  it('lesson 6 keeps BOTH halves — the permissive and the restrictive', () => {
    const l = M[5];
    expect(l.lesson).toContain('the contention was so sharp between them');
    expect(l.lesson).toContain('being recommended by the brethren unto the grace of God');
    expect(l.lesson, 'no verdict is assigned, and that is the lesson')
      .toMatch(/THE NARRATIVE ASSIGNS NO FAULT/);
    // dropping either half breaks it
    expect(l.lesson, 'permissive half').toMatch(/THE FIRST IS PERMISSIVE/);
    expect(l.lesson, 'restrictive half').toMatch(/THE SECOND IS RESTRICTIVE/);
    expect(l.lesson).toMatch(/DOUBLED/);
  });

  it('lesson 7 offers counsel as a third instrument, with its limit', () => {
    const l = M[6];
    expect(l.lesson).toContain('in the multitude of counsellors they are established');
    expect(l.lesson, 'the absences are the teaching').toMatch(/ATTEND FIRST TO WHAT IS ABSENT/);
    expect(l.lesson).toMatch(/MULTITUDE/);
    expect(l.lesson, 'it must not become an argument against partnership')
      .toMatch(/CLOSE WITH THE HONEST LIMIT/);
    expect(l.lesson).toMatch(/cannot supply capital/i);
  });

  it('lesson 8 names the disposition, and turns the question round', () => {
    const l = M[7];
    expect(l.lesson).toContain('for the people had a mind to work');
    expect(l.lesson, 'the conjunction is the claim').toMatch(/READ THE CONJUNCTION/);
    expect(l.lesson, 'all seven are necessary and none sufficient')
      .toMatch(/NECESSARY AND NOT ONE OF THEM IS SUFFICIENT/);
    expect(l.lesson, 'what a perfect agreement actually guarantees').toMatch(/the failure will be orderly|orderly/);
    expect(l.lesson, 'it must turn on the reader').toMatch(/Ask the question of yourself/);
  });
});

describe('it is wired into the school, on the Real Estate shelf', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'partnerships');

  it('appears in the catalog as a self-paced Real Estate course', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Real Estate');
    expect(row.unitCap).toBe('Lesson');
  });

  it('joins the SAME single Real Estate shelf as the five before it', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((l) => l.label);
    expect(labels.filter((l) => l === 'Real Estate')).toHaveLength(1);
    const re = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate').map((c) => c.key);
    for (const k of ['partnerships', 'maintenance-trades', 'leasing-tenants', 'buying-terms',
      'property-principle', 'management-stewardship']) {
      expect(re, `${k} missing from the shelf`).toContain(k);
    }
    expect(re.length).toBeGreaterThanOrEqual(6);
  });

  it('hands the catalog a schedule, a summary and a download that all work', () => {
    const rows = row.buildScheduleRows();
    expect(rows.length).toBe(8);
    expect(row.progressSummary({}).done).toBe(0);
    const md = row.exportMarkdown();
    expect(md).toContain('Partnerships: Who You Build With');
    expect(md.length).toBeGreaterThan(2000);
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('carries its own interest and helper tags, and its own copy', () => {
    expect(row.interestTag).toBe('[Partnerships]');
    expect(row.helperTag).toBe('[Partnerships helper]');
    expect(row.interestText('Someone')).toContain('[Partnerships]');
    expect(row.interestCopy.blurb).toMatch(/not legal advice/i);
    expect(row.tutorCourseMeta.key).toBe('partnerships');
  });

  it('builds a schedule and a summary directly, too', () => {
    const sched = buildPartnershipsSchedule('2026-10-01');
    expect(sched.length).toBe(8);
    const sum = partnershipsProgressSummary({ 'part1-can-two-walk-together-except-they-be-agreed': true });
    expect(sum.done).toBe(1);
    expect(sum.total).toBe(8);
    expect(exportPartnershipsCurriculumMarkdown(null)).toContain('Prayer + the anchor');
  });
});

describe('the checks above can actually fail', () => {
  const m = M[0];

  it('catches a quotation hung on the wrong reference', () => {
    expect(quotationFaults('He wrote it. "Can two walk together, except they be agreed?" (Amos 3:4).').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches a fabricated quotation outright', () => {
    expect(quotationFaults('"Thou shalt not enter a partnership unadvisedly" (Amos 3:3)').join(' '))
      .toMatch(/NOT VERBATIM/);
  });

  it('catches an inverted ladder, a summary, and a near-copy', () => {
    expect(fk(m.levels.senior) < fk(m.levels.teen), 'already inverted').toBe(false);
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches a lesson that would render a bare send or teach stage', () => {
    // the DR-0509 defect, tested on the same predicates the walk above uses
    const bare = { ...m }; delete bare.benefits; delete bare.stories;
    expect(Array.isArray(bare.benefits), 'a lesson with no benefits passed').toBe(false);
    expect(Array.isArray(bare.stories), 'a lesson with no stories passed').toBe(false);
    const shortStory = { kind: 'parable', tone: 'light', title: 'x', body: 'too short.' };
    expect(shortStory.body.split(/\s+/).length >= 157, 'a two-word story passed the floor').toBe(false);
  });

  it('catches "the LORD" written into OUR prose', () => {
    expect(/\bthe LORD\b/.test(ours('And so the LORD requires this of a partner.')),
      'our prose using His title instead of His name passed').toBe(true);
  });
});
