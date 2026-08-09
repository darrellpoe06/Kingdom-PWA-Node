// @vitest-environment node
// =============================================================================
// word-first-coverage — every knowledge space OPENS with Yahweh's frame,
// ENFORCED rather than reported (DR-0127; born 2026-08-09, DR-0282).
// =============================================================================
// THE MISS THIS ENDS. DR-0127 is binding: "a knowledge space opens with the
// Word/His frame BEFORE its material wherever we have it," carried by the
// derived wordFirstLead(). But the enforcement DR-0127 shipped was a census that
// REPORTS a missing lead. Reporting is not blocking. So the World Issues track —
// the space handling the most charged claims in the app (race, medicine,
// incarceration, empire) — silently fell through to its FIRST ISSUE's anchor and
// opened under the Musk lesson's frame instead of His. Nothing failed. No one saw
// it until a Ways review went looking.
//
// Darrell 2026-08-09: "Ai has a hard time keeping the pattern... we have to make
// it prioritize Yahweh's Perspectives." That is why this file exists. The pattern
// cannot live in an agent's attention; it has to live in machinery that fails the
// build. A doc says what should happen; a gate makes it happen.
//
// PROVEN-TO-CATCH is a TEST here, not a flag: the last case strips the World
// Issues declared lead in memory and asserts the check fails. A gate that always
// passes is itself a lie (DR-0076 §3).
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { wordFirstLead } from '../lib/eternal-algorithms-course.js';

// Spaces whose material is charged enough that a borrowed anchor is not enough:
// they must DECLARE their own meta.wordFirst. World Issues is the founding
// member because it is the space that silently borrowed the Musk lesson's anchor.
const DECLARE_REQUIRED = new Set(['world-issues']);

// Catalog entries expose their rows through buildScheduleRows() (the same
// accessor the Learn header counts from), not a plain `schedule` property.
// Mirror what the app hands wordFirstLead() so the gate tests the real path.
const asCourse = (e) => {
  let schedule = e.schedule || e.modules || [];
  if (!schedule.length && typeof e.buildScheduleRows === 'function') {
    try { schedule = e.buildScheduleRows() || []; } catch { schedule = []; }
  }
  return { meta: e.meta, schedule };
};

/** Pure check over one catalog entry. Returns violation objects. */
export function checkCourse(entry) {
  const key = entry?.meta?.key || entry?.key || '(unkeyed)';
  const title = entry?.meta?.title || key;
  const out = [];
  const declared = entry?.meta?.wordFirst;
  const lead = wordFirstLead(asCourse(entry));

  if (!lead || !lead.ref) {
    out.push({ code: 'word-first/no-lead', key,
      message: `"${title}" opens with NO Word-first lead. DR-0127: a knowledge space opens with Yahweh's frame before its material. Declare meta.wordFirst { ref, frame }, or give its first session a Scripture anchor.` });
    return out;
  }
  if (declared && !String(declared.frame || '').trim()) {
    out.push({ code: 'word-first/bare-citation', key,
      message: `"${title}" declares wordFirst.ref (${declared.ref}) with no frame. A citation alone is not His perspective — say what He sets, in words the reader meets first.` });
  }
  if (DECLARE_REQUIRED.has(key) && !declared) {
    out.push({ code: 'word-first/borrowed-anchor', key,
      message: `"${title}" is carrying a BORROWED lead (derived "${lead.ref}" from its first item) instead of declaring its own meta.wordFirst. This space handles charged material; its opening frame must be chosen for the space, not inherited from whichever item happens to sit first.` });
  }
  return out;
}

describe("every knowledge space opens with Yahweh's frame (DR-0127 / DR-0282)", () => {
  it('the catalog is non-empty (the registry actually loaded)', () => {
    expect(Array.isArray(LEARN_CATALOG)).toBe(true);
    expect(LEARN_CATALOG.length).toBeGreaterThan(10);
  });

  it('every course resolves a Word-first lead with a real Scripture reference', () => {
    const missing = LEARN_CATALOG
      .flatMap((e) => checkCourse(e))
      .filter((v) => v.code === 'word-first/no-lead')
      .map((v) => v.message);
    expect(missing).toEqual([]);
  });

  it('no declared lead is a bare citation without His frame in words', () => {
    const bare = LEARN_CATALOG
      .flatMap((e) => checkCourse(e))
      .filter((v) => v.code === 'word-first/bare-citation')
      .map((v) => v.message);
    expect(bare).toEqual([]);
  });

  it('charged spaces DECLARE their own lead instead of borrowing the first item’s anchor', () => {
    const borrowed = LEARN_CATALOG
      .flatMap((e) => checkCourse(e))
      .filter((v) => v.code === 'word-first/borrowed-anchor')
      .map((v) => v.message);
    expect(borrowed).toEqual([]);
  });

  // ---- proven-to-catch (DR-0076 §3) -------------------------------------
  it('PROVEN-TO-CATCH: stripping the World Issues declared lead fails the check', () => {
    const wi = LEARN_CATALOG.find((e) => (e?.meta?.key || e?.key) === 'world-issues');
    expect(wi, 'world-issues must be in the catalog').toBeTruthy();
    const stripped = { ...wi, meta: { ...wi.meta } };
    delete stripped.meta.wordFirst;
    const v = checkCourse(stripped);
    expect(v.map((x) => x.code)).toContain('word-first/borrowed-anchor');
  });

  it('PROVEN-TO-CATCH: a declared lead with an empty frame fails the check', () => {
    const fake = { meta: { key: 'x', title: 'X', wordFirst: { ref: 'John 1:1', frame: '   ' } }, schedule: [] };
    expect(checkCourse(fake).map((x) => x.code)).toContain('word-first/bare-citation');
  });

  it('PROVEN-TO-CATCH: a space with neither a declared lead nor an anchor fails', () => {
    const empty = { meta: { key: 'y', title: 'Y' }, schedule: [{ id: 'm1' }] };
    expect(checkCourse(empty).map((x) => x.code)).toContain('word-first/no-lead');
  });
});
