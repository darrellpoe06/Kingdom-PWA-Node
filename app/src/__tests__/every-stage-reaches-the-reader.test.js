// @vitest-environment node
// =============================================================================
// EVERY ARC STAGE REACHES THE READER — the gate that was missing
// =============================================================================
// WHY THIS EXISTS. Darrell, 2026-09-18, from the app: "Send off is not
// populated in the latest lessons..." He was right, and the cause was not a
// rendering bug.
//
// MEASURED. buildLessonArc gives the send stage an AUDIENCE side carrying
// exactly one field — `benefits` — while the solo-task choreography lives on
// the FACILITATOR side (lesson-flow.js, the `send:` body). All 177 Living
// Lessons author `benefits`. NOT ONE of the 40 Real Estate course lessons did.
// So `hasContent` was true (the facilitator side had the howToRun-derived task,
// so the stage rendered) and the reader's half of it was empty. A populated
// heading with nothing underneath.
//
// WHY NO EXISTING GATE CAUGHT IT. Every course test measured the fields the
// COURSE AUTHOR chose to write — reading level, band fullness, overlap,
// verbatim spans, anchor prose. None compared a lesson's field set against what
// the RENDERER actually consumes. Five courses shipped that way. That is a
// reality-trace failure of the kind CLAUDE.md names: the surface was never
// observed, only the source.
//
// SO THIS GATE ASKS THE RENDERER'S QUESTION, not the author's: for every course
// in the catalog, at every age band, does each arc stage the learner is shown
// actually put something on the learner's side of it?
import { describe, it, expect } from 'vitest';
import { buildLessonArc, ARC_KINDS } from '../lib/lesson-flow.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import baseline from '../lib/stage-reaches-reader-baseline.json';

const BANDS = ['child', 'youth', 'teen', 'senior', 'adult'];

/**
 * Does this stage put anything on the AUDIENCE side — the half a learner sees?
 * Deliberately generous: any non-empty string, any non-empty array, any object,
 * or an explicit true (hasQuiz) counts. The defect this catches is a stage whose
 * learner-facing side is entirely empty while the stage still renders.
 */
function audienceHasSomething(audience) {
  if (!audience || typeof audience !== 'object') return false;
  for (const v of Object.values(audience)) {
    if (typeof v === 'string' && v.trim()) return true;
    if (Array.isArray(v)) { if (v.length) return true; continue; }
    if (v === true) return true;
    if (v && typeof v === 'object') return true;
  }
  return false;
}

/** Every self-paced course row the catalog actually serves. */
const COURSES = LEARN_CATALOG.filter((c) => typeof c.buildScheduleRows === 'function');

const lessonsOf = (c) => {
  let rows;
  // a course whose builder throws is reported as zero rather than crashing the
  // walk — an unreadable course is a finding for its own test, not for this one.
  try { rows = c.buildScheduleRows() || []; } catch (_) { return []; }
  return rows.map((r) => (r && (r.module || r))).filter((m) => m && m.id && (m.lesson || m.levels));
};

describe('every arc stage that renders reaches the reader', () => {
  it('the walk covers a real catalog — it is not measuring nothing', () => {
    expect(COURSES.length).toBeGreaterThan(20);
    const total = COURSES.reduce((t, c) => t + lessonsOf(c).length, 0);
    expect(total, 'no lessons walked').toBe(baseline.lessons);
  });

  it('no course is WORSE than the recorded debt, and an unrecorded course is at zero', () => {
    // SHRINK-ONLY, from the first commit. The reported defect (the five Real
    // Estate courses) is fixed to zero here. The same walk found 345 more
    // across EIGHT other courses that predate this work — ai, broadcast,
    // infrastructure, sovereign-ai, ai-legal-blueprint, handed-forward,
    // legacy-provisions and kingdom-economics. Recording that honestly beats
    // either pretending it is not there or holding the reported fix hostage to
    // 345 hastily written lines, which is the exact thinness being complained
    // about. The numbers may only fall.
    const found = {};
    let checked = 0;
    for (const course of COURSES) {
      for (const m of lessonsOf(course)) {
        for (const band of BANDS) {
          const arc = buildLessonArc(m, {
            ageBand: band,
            sessionFlow: course.sessionFlow,
            handsOnLabel: (course.meta && course.meta.handsOnLabel) || 'Work it',
          });
          for (const seg of arc.segments) {
            // a stage with NO content at all is hidden by the renderer and is
            // not this gate's concern; a stage that RENDERS and gives the
            // learner nothing is exactly the reported defect.
            if (!seg.hasContent) continue;
            checked += 1;
            if (!audienceHasSomething(seg.audience)) found[course.key] = (found[course.key] || 0) + 1;
          }
        }
      }
    }
    expect(checked, 'the walk found no rendered stages').toBeGreaterThan(1000);

    const worse = [];
    for (const [key, n] of Object.entries(found)) {
      const was = baseline.courses[key];
      if (was === undefined) worse.push(`${key}: ${n} empty reader-facing stages, and it was at ZERO — a new course must never ship one`);
      else if (n > was) worse.push(`${key}: ${n} empty, baseline recorded ${was}`);
    }
    // a recorded course the catalog no longer carries can never heal, so it is
    // reported rather than left to inflate the total for ever.
    const stale = Object.keys(baseline.courses).filter((k) => !(k in found) && COURSES.some((c) => c.key === k));
    expect(worse, worse.join('\n')).toEqual([]);
    expect(stale, `healed — lower these in the baseline: ${stale.join(', ')}`).toEqual([]);
  });

  it('the five Real Estate courses give the reader every stage, at every band', () => {
    // The reported defect, pinned directly rather than only through the totals.
    const re = COURSES.filter((c) => c.meta && c.meta.category === 'Real Estate');
    expect(re.length, 'the Real Estate shelf is empty — this check measures nothing').toBeGreaterThanOrEqual(5);
    const empty = [];
    for (const course of re) {
      for (const m of lessonsOf(course)) {
        for (const band of BANDS) {
          const arc = buildLessonArc(m, {
            ageBand: band, sessionFlow: course.sessionFlow,
            handsOnLabel: (course.meta && course.meta.handsOnLabel) || 'Work it',
          });
          for (const seg of arc.segments) {
            if (seg.hasContent && !audienceHasSomething(seg.audience)) empty.push(`${course.key} / ${m.id} / ${band} / ${seg.kind}`);
          }
        }
      }
    }
    expect(empty.slice(0, 20), `${empty.length} Real Estate stages give the reader nothing`).toEqual([]);
  });

  it('every arc kind is actually exercised by the walk', () => {
    // a gate that silently stopped covering the `send` stage would be the same
    // class of defect it exists to catch.
    const seen = new Set();
    const course = COURSES[0];
    const m = lessonsOf(course)[0];
    const arc = buildLessonArc(m, { ageBand: 'adult', sessionFlow: course.sessionFlow, handsOnLabel: 'Work it' });
    for (const seg of arc.segments) seen.add(seg.kind);
    for (const kind of ARC_KINDS) expect(seen, `arc kind ${kind} never appeared`).toContain(kind);
  });
});

describe('the gate can actually fail', () => {
  const course = COURSES.find((c) => c.key === 'maintenance-trades') || COURSES[0];
  const sample = lessonsOf(course)[0];

  it('catches a lesson whose send-off gives the reader nothing', () => {
    // PROVEN-TO-CATCH on the exact reported defect: strip `benefits` and the
    // send stage still renders (the facilitator solo task keeps hasContent
    // true) while the reader's side goes empty. This is the state all five
    // Real Estate courses shipped in.
    const stripped = { ...sample };
    delete stripped.benefits;
    const arc = buildLessonArc(stripped, {
      ageBand: 'adult', sessionFlow: course.sessionFlow, handsOnLabel: 'Work it',
    });
    const send = arc.segments.find((s) => s.kind === 'send');
    expect(send.hasContent, 'the stage must still render — that is what made this invisible').toBe(true);
    expect(audienceHasSomething(send.audience), 'the stripped lesson passed the gate').toBe(false);
  });

  it('and passes the same lesson with its benefits restored', () => {
    const arc = buildLessonArc(sample, {
      ageBand: 'adult', sessionFlow: course.sessionFlow, handsOnLabel: 'Work it',
    });
    const send = arc.segments.find((s) => s.kind === 'send');
    expect(audienceHasSomething(send.audience)).toBe(true);
    expect(send.audience.benefits.length).toBeGreaterThan(0);
  });

  it('the predicate is not vacuously true', () => {
    expect(audienceHasSomething({})).toBe(false);
    expect(audienceHasSomething({ benefits: [] })).toBe(false);
    expect(audienceHasSomething(null)).toBe(false);
    expect(audienceHasSomething({ benefits: ['x'] })).toBe(true);
    expect(audienceHasSomething({ inApp: 'do this' })).toBe(true);
    expect(audienceHasSomething({ inApp: '   ' })).toBe(false);
  });
});
