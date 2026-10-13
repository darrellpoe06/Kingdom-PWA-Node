// @vitest-environment node
// =============================================================================
// THE NUMBERS BELONG TO THE LESSON, NOT TO THE STEP ON SCREEN (DR-0520)
// =============================================================================
// Darrell 2026-09-19, with two screenshots of L175 open on his phone:
//
//   "Stop adding numbers that don't make sense!!!!!!! Make it make sense!!!!!!!
//    Why do we count from 1 - whatever each section?!!!!!!!"
//   "Obvious!!!!!!!!!!!!!!!!!!!!!"
//
// It was obvious, and he had already raised it once (the L88 screenshot: "This
// Lesson has numbers that are confusing... 1 2 3 throughout... why?"). The
// screenshots show STEP 1 OF 13 rendering headings 1, 2 and 3; STEP 2 OF 13
// opening with another heading numbered 1; STEP 3 OF 13 rendering 1 and then 2.
// Three different points visible on one screen, all called 1.
//
// THE CAUSE IS MECHANICAL, not authorial. The paced reader chunks a band into
// steps and called formatLessonText ONCE PER STEP, so the auto counter reset at
// every step boundary — and so did the hasExplicit decision, which means a step
// containing an explicit FIRST/SECOND marker used the author's numbers while
// its neighbours auto-counted.
//
// MEASURED on the real ll176 adult band, 13 segments, before the fix:
//   step:n = 1:1 1:2 1:3 2:1 3:1 3:2 4:1 5:1 6:1 7:1 8:1 9:1 10:1 11:1 12:1 12:2
// and after:
//   step:n = 1:1 1:2 1:3 2:4 3:5 3:6 4:7 5:8 5:9 6:10 7:11 8:12 9:13 10:14 11:15 12:16 12:17
//
// NOT ONE WORD OF ANY LESSON CHANGES. The formatter only chooses break points
// at existing spaces and which number is rendered beside a heading the author
// already wrote; this fix changes only the number.
import { describe, it, expect } from 'vitest';
import { formatLessonText, lessonSectionPlan, lessonShareText } from '../lib/lesson-format.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { chunkLessonForAge } from '../lib/learn-framework.js';

const headingsOf = (text, plan) =>
  formatLessonText(text, plan).items.filter((i) => i.kind === 'heading');
const numbersAcross = (segments, plan) =>
  segments.flatMap((s) => headingsOf(s, plan).map((h) => h.n));

describe('PROVEN-TO-CATCH: the defect Darrell photographed', () => {
  const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll176-'));
  const segments = chunkLessonForAge(L.lesson, 'adult');

  it('the old behaviour — formatting each step alone — really does restart at 1', () => {
    // This is what the screenshots show, reproduced from the live lesson. If a
    // future change made per-chunk formatting continuous by accident, this
    // would fail and the gate below would be measuring nothing.
    expect(segments.length).toBeGreaterThan(3);
    const perChunk = numbersAcross(segments, null);
    expect(perChunk.filter((n) => n === 1).length,
      'per-chunk numbering no longer restarts, so this gate proves nothing').toBeGreaterThan(1);
  });

  it('with one plan for the whole lesson, the count runs straight through', () => {
    const plan = lessonSectionPlan(segments.join(' '));
    const ns = numbersAcross(segments, plan);
    expect(ns.length).toBeGreaterThan(5);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });
});

describe('every lesson, every band, counts once', () => {
  // The whole series, at the band that chunks hardest, so a lesson that numbers
  // itself twice cannot hide behind a band that happens to fit in one step.
  const BANDS = ['child', 'youth', 'teen', 'adult', 'senior'];
  const textFor = (m, band) => (band === 'adult' ? m.lesson : (m.levels && m.levels[band]) || '');

  it('no band of any lesson ever renders the same point number twice', () => {
    const faults = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        const segments = chunkLessonForAge(text, band);
        if (segments.length < 2) continue;
        const plan = lessonSectionPlan(segments.join(' '));
        // Where the AUTHOR numbered their own points, the numbers are theirs
        // and this gate does not overrule them. ll23 writes FIRST twice — once
        // opening a top-level point and once opening a sub-list inside it — so
        // its plan really does read 1, 1, 2. That is authored, it predates this
        // fix, and rewriting it would change a lesson's own structure, which
        // this change is not allowed to do. Recorded rather than silently
        // exempted: DR-0520 carries it with re-review 2026-09-26.
        if (plan.hasExplicit) continue;
        const ns = numbersAcross(segments, plan);
        const seen = new Set();
        for (const n of ns) {
          if (seen.has(n)) { faults.push(`${m.id} · ${band}: point ${n} rendered twice`); break; }
          seen.add(n);
        }
      }
    }
    expect(faults, faults.slice(0, 10).join('\n')).toEqual([]);
  });

  it('the numbers a reader sees are the lesson plan, in order, with nothing skipped', () => {
    const faults = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        const segments = chunkLessonForAge(text, band);
        const plan = lessonSectionPlan(segments.join(' '));
        if (plan.hasExplicit) continue; // the author's own numbers are theirs
        const ns = numbersAcross(segments, plan);
        if (!ns.length) continue;
        for (let i = 0; i < ns.length; i += 1) {
          if (ns[i] !== i + 1) { faults.push(`${m.id} · ${band}: point ${i + 1} rendered as ${ns[i]}`); break; }
        }
      }
    }
    expect(faults, faults.slice(0, 10).join('\n')).toEqual([]);
  });
});

describe('NOT ONE WORD CHANGES — the reconstruction still holds', () => {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

  it('joining every item reproduces the text exactly, plan or no plan', () => {
    for (const m of LIVING_LESSONS_MODULES.slice(-25)) {
      const segments = chunkLessonForAge(m.lesson, 'adult');
      const plan = lessonSectionPlan(segments.join(' '));
      for (const s of segments) {
        for (const p of [null, plan]) {
          const joined = formatLessonText(s, p).items.map((i) => i.text).join(' ');
          expect(norm(joined), `${m.id} lost or gained words`).toBe(norm(s));
        }
      }
    }
  });

  it('a plan changes the NUMBER on a heading and never which words are in it', () => {
    for (const m of LIVING_LESSONS_MODULES.slice(-25)) {
      const segments = chunkLessonForAge(m.lesson, 'adult');
      const plan = lessonSectionPlan(segments.join(' '));
      for (const s of segments) {
        const plain = formatLessonText(s, null).items;
        const planned = formatLessonText(s, plan).items;
        // Headings may differ at a chunk boundary — the plan sees the sentence
        // AFTER the cut and the chunk cannot — but every heading the planned
        // pass emits is a whole sentence of this chunk, never a rewritten one.
        for (const h of planned.filter((i) => i.kind === 'heading')) {
          expect(norm(s).includes(norm(h.text)), `${m.id}: invented heading text`).toBe(true);
        }
        expect(plain.map((i) => i.text).join(' ').length).toBe(planned.map((i) => i.text).join(' ').length);
      }
    }
  });
});

describe('a single-text caller is unaffected', () => {
  it('formats a whole lesson exactly as it always did when no plan is passed', () => {
    const m = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    const { items, sectionCount } = formatLessonText(m.lesson);
    expect(sectionCount).toBeGreaterThan(3);
    const ns = items.filter((i) => i.kind === 'heading').map((i) => i.n);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });

  it('the share text still numbers its sections and keeps every word', () => {
    const m = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    const share = lessonShareText(m.lesson);
    expect(share).toMatch(/^1\. /m);
    expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim())
      .toBe(String(m.lesson).replace(/\s+/g, ' ').trim());
  });

  it('empty and non-string input stay inert', () => {
    expect(formatLessonText('').items).toEqual([]);
    expect(formatLessonText(null).items).toEqual([]);
    expect(lessonSectionPlan(null)).toEqual({ hasExplicit: false, headings: [], total: 0 });
  });
});
