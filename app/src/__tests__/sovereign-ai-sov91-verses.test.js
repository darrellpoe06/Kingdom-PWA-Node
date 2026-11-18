// @vitest-environment node
// =============================================================================
// sov91 — every quotation is the corpus verbatim, the house is traced to its
// real records, and the lesson is whole in every band (DR-1553)
// =============================================================================
// Sovereign A.I. week 91, "Know the state of thy flocks", was built from one
// word Darrell typed above a forwarded ByteByteGo issue carrying an excerpt of
// Evals for AI Engineers (Shreya Shankar and Hamel Husain), on 2026-11-18:
// Lesson. Gmail thread 1a1ef8ba7f9e2432. Built the same day by
// scripts/sov91-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name, so the same verbatim,
// voice, adversary, band, ladder, quiz and parable rules that bind a Living
// Lesson bind this week too; then the checks particular to this lesson.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. One teaching, one lesson (DR-0610): week
// 90 owns the second look; this week owns evaluation, and the test holds the
// two apart. The tiers are held apart (reported through the newsletter,
// established, measured, not measured), and every house claim is pinned to the
// record that makes it true: the builder's six silent days, the four of seven
// on one problem, the rule the writer already had, the count that gave no
// place, the named spans, the checker checked, and the verse fill that asks no
// model for Scripture. If any of that moves, this file goes red and the lesson
// is re-read.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';
import {
  lessonGateFaults,
  stringsOf,
  corpusText,
  quotedPairs,
  verbatimFaults,
  voiceFaults,
  adversaryFaults,
  bareQuoteFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'sov91-know-the-state-of-thy-flocks';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const flat = (s) => String(s).replace(/\s+/g, ' ');
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Proverbs 27:23', 'know the state of thy flocks'],
  ['Lamentations 3:40', 'search and try our ways'],
];
const REVIEW = 're-review: 2026-11-25';

// MEASURED 2026-11-18 on the spliced module (scripts/sov91-fill.mjs output):
// 20 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 20;
const QUOTED_FLOOR = 100;

describe('sov91 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 91, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b]).toBe('string');
    expect(MODULE.levels.child.startsWith(MODULE.title)).toBe(true);
  });
});

describe('the shared Living Lesson gate, run on this week check by check', () => {
  it('every check is empty', () => {
    const all = lessonGateFaults(MODULE, { spine: SPINE });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });

  it(`at least ${QUOTED_FLOOR} referenced quotations are swept, so the sweep is not vacuous`, () => {
    const n = stringsOf(MODULE).reduce((a, t) => a + quotedPairs(t).filter((p) => p.ref).length, 0);
    expect(n).toBeGreaterThanOrEqual(QUOTED_FLOOR);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quotation, in a quiz explanation, is caught', () => {
    const L = clone();
    L.quiz.questions[0].explain += ` "Be thou diligent to know the state of thy sheep, and look well to thy herds." (Proverbs 27:23)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the book’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The book says "the LLM cannot fill in these choices for you."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God sees every gulf. Satan hides the count.';
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const refs = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = new Set(
    READER_PLACES.flatMap((p) =>
      quotedPairs(place(MODULE, p))
        .map((q) => q.ref)
        .filter(Boolean)
    )
  );

  it(`the anchor carries exactly ${ANCHOR_COUNT} references, each resolving in the corpus`, () => {
    expect(refs.length).toBe(ANCHOR_COUNT);
    for (const r of refs) expect(corpusText(r), r).not.toBeNull();
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });
});

describe('the Word opens and frames the hour; no book stands above it', () => {
  it('in every teaching place both frame verses are quoted before the book’s own material', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = Math.max(t.indexOf('(Proverbs 27:23)'), t.indexOf('(Lamentations 3:40)'));
      const book = t.search(/\bgulfs?\b/i);
      expect(frame, `${p} quotes both frame verses`).toBeGreaterThan(0);
      expect(book, `${p} teaches the gulfs`).toBeGreaterThan(0);
      expect(frame, `${p}: the frame stands before the book`).toBeLessThan(book);
    }
  });

  it('every teaching place names all three gulfs and walks the three steps', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(/gulf (one|of comprehension)|comprehension/i);
      expect(t, p).toMatch(/specification|saying it clearly/i);
      expect(t, p).toMatch(/generalization|mistakes anyway/i);
      expect(t, p).toMatch(/search/i);
      expect(t, p).toContain('(Nehemiah 2:15)');
      expect(t, p).toContain('(Habakkuk 2:2)');
      expect(t, p).toContain('(James 3:2)');
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(Hebrews 4:15)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('the book is credited, the sponsors are left out, and no company or model is ranked', () => {
    expect(MODULE.lesson).toMatch(/Shreya Shankar and Hamel Husain/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/data summit|agent runtime/i);
      expect(s).not.toMatch(/\bbest model\b|is the winner|clearly better than/i);
      expect(s).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d/i);
    }
  });

  it('one teaching, one lesson: week 90’s second-look material is not re-taught here', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/two plus three|timetable|ninety-six|thirteen (answers|solutions)/i);
    }
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the reported source, and the unmeasured question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names the newsletter as the carrier`).toMatch(
        /newsletter('s)? (report|copy|at its word)|through the newsletter|carried to us by a newsletter|received here through the newsletter/i
      );
      expect(t, `${p} says the fix's effect was not measured`).toMatch(/not (yet )?(been )?measured|do not know yet|has not been taken|nobody has counted/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the records', () => {
  it('six silent days of other: 6, then the gates named: quotation four of seven, verse three, voice one, three crashed', () => {
    const t = flat(src('docs/decisions/DR-1551-which-problem-not-only-which-gate.md'));
    expect(t).toMatch(/ended six days of `other: 6`/);
    expect(t).toMatch(/`quotation` refused four of the seven waiting teachings, `verse` three, `voice` one, and three rows had crashed/);
    expect(MODULE.lesson).toMatch(/six days/);
    expect(MODULE.lesson).toMatch(/four of the seven waiting teachings, the verse gate three, the voice gate one, and three had crashed/);
  });

  it('the reader of the builder’s own records never prints a draft or a prompt', () => {
    const t = src('infra/nas-lesson-builder/why_the_builds_failed.py');
    expect(t).toMatch(/other: 6, transient: 1/);
    expect(t).toMatch(/NEVER A BODY, AND NEVER A PROMPT/);
    expect(MODULE.lesson).toMatch(/never prints a draft or a prompt/);
  });

  it('four of the seven died on one problem: a quoted span with no reference', () => {
    const t = flat(src('docs/decisions/DR-1552-name-the-span-do-not-only-count-it.md'));
    expect(t).toMatch(/four of the seven waiting teachings died on `span-without-reference`/);
    expect(src('infra/nas-loops/lesson-queue-census.py')).toMatch(/\("quoted spans,", "span-without-reference"\)/);
  });

  it('the rule was already in the writer’s hands, and earlier failures are fed back', () => {
    expect(flat(src('infra/nas-lesson-builder/lesson_writer.py'))).toMatch(
      /Every double-quoted span is Scripture and is followed IMMEDIATELY by its reference in parentheses/
    );
    expect(src('infra/nas-lesson-builder/lesson_builder.py')).toMatch(/def previous_failures\(/);
  });

  it('the count gave no place; the gate now names up to five spans', () => {
    const g = src('infra/nas-lesson-builder/lesson_gates.py');
    expect(g).toMatch(/quoted spans, \{\} with a reference/);
    expect(g).toMatch(/for q in bare\[:5\]/);
    expect(MODULE.lesson).toMatch(/up to five of them/);
  });

  it('the checker was checked: the tuple bug and the drift case are pinned in the builder’s and the census’s own tests', () => {
    expect(src('infra/nas-lesson-builder/test_lesson_builder.py')).toMatch(/def test_PROVEN_TO_CATCH_the_findall_tuple_bug/);
    expect(src('infra/nas-loops/test_lesson_queue_census.py')).toMatch(/for opening, kind in qc\.PROBLEM_KINDS/);
  });

  it('no verse in this week was asked of a model: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov91-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov91-fill.mjs: adult 2,125 prose words;
    // child 0.556 / youth 0.613 / teen 0.636 / senior 0.697; grades 2.14 <
    // 4.52 < 4.88 < 9.80. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2100);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });
});
