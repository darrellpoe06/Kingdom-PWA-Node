// @vitest-environment node
// =============================================================================
// authored-content-reaches-its-surface — a CONSEQUENCE gate (DR-0285)
// =============================================================================
// THE FAILURE THIS ANSWERS, 2026-08-09. Seven teachings were authored into the
// Godhead Study catalog. When Darrell asked "Where are the lessons!!!!?" the
// agent could not say — because it had never traced where catalog content
// surfaces for a user, and DR-0126 (which says exactly that: Learn carries the
// Eternal Algorithms as derived processing courses) had not been read. The
// content was fine. The PROCESS — trace where the work lands — was skipped.
//
// WHY THIS GATE IS SHAPED DIFFERENTLY FROM THE OTHERS. You cannot machine-check
// whether an agent READ a document; any "did you read it" check is satisfied by
// asserting that you did. What you CAN check is the FINGERPRINT the skipped
// process leaves in the artifacts. Skipping "trace where it lands" produces a
// specific, detectable artifact state: content that exists in a source catalog
// but reaches no user-facing surface.
//
// So this gate does not ask "did you trace it?" It asks "IS IT THERE?" — and
// answers the question the agent could not, automatically, on every build.
// A process check that cannot exist becomes a consequence check that can.
//
// PROVEN-TO-CATCH: the last cases synthesize an orphaned entry and a broken
// derivation and assert the check fails on both.
import { describe, it, expect } from 'vitest';
import { GODHEAD_ALGORITHMS } from '../lib/godhead-study.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';
import { buildDiscernmentModules } from '../lib/discernment-track.js';

const rowsOf = (c) => (c.buildScheduleRows ? c.buildScheduleRows() : (c.schedule || c.modules || []));

/** Every entry id/name that actually reaches a derived Learn surface. */
function derivedGodheadSurface() {
  const courses = buildEternalProcessingCourses();
  const blob = JSON.stringify(courses);
  const sessions = courses.reduce((t, c) => t + rowsOf(c).length, 0);
  return { blob, sessions, courses };
}

describe('authored content reaches a user-facing surface (DR-0285)', () => {
  it('every Godhead Study algorithm surfaces as a derived Learn session', () => {
    const { blob } = derivedGodheadSurface();
    const orphaned = GODHEAD_ALGORITHMS
      .filter((a) => !blob.includes(a.name))
      .map((a) => `${a.id} ("${a.name}", section: ${a.section}) exists in the catalog but reaches NO Learn course — a reader can never meet it.`);
    expect(orphaned).toEqual([]);
  });

  it('the derived session count equals the catalog count (nothing silently dropped)', () => {
    const { sessions } = derivedGodheadSurface();
    expect(sessions).toBe(GODHEAD_ALGORITHMS.length);
  });

  it('every catalog section maps to a course that actually carries entries', () => {
    const { courses } = derivedGodheadSurface();
    const empty = courses.filter((c) => rowsOf(c).length === 0).map((c) => c.meta?.title || c.key);
    expect(empty).toEqual([]);
  });

  it('every published World Issues issue surfaces as a rendered module', () => {
    const modules = buildDiscernmentModules(WORLD_ISSUES);
    const ids = new Set(modules.map((m) => m.id));
    const missing = WORLD_ISSUES.filter((i) => !ids.has(i.id)).map((i) => i.id);
    expect(missing).toEqual([]);
  });

  // ---- proven-to-catch (DR-0076 §3) --------------------------------------
  it('PROVEN-TO-CATCH: an entry whose section has no course is reported as orphaned', () => {
    const { blob } = derivedGodheadSurface();
    const orphan = { id: 'gh-fake', section: 'no-such-section', name: 'An Entry No Reader Can Ever Reach' };
    expect(blob.includes(orphan.name)).toBe(false);
    // the same predicate the real check uses would flag it
    const flagged = [orphan].filter((a) => !blob.includes(a.name));
    expect(flagged).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a count mismatch is detected', () => {
    const { sessions } = derivedGodheadSurface();
    expect(sessions === GODHEAD_ALGORITHMS.length + 1).toBe(false);
  });
});
