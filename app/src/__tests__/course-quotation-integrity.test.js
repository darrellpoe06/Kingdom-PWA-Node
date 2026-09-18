// @vitest-environment node
// =============================================================================
// THE CATALOG COURSES GET THE SAME RATCHET THE SERIES HAS HAD SINCE DR-0473
// =============================================================================
// WHY THIS EXISTS. Authoring the Send-off out of the 69 bare lessons (DR-0511)
// meant reading eight course files closely, and the reading turned up a defect
// nothing was watching for: quotations carrying an ellipsis. DR-0459 allows no
// ellipsis inside a quotation — the only remedy is a shorter genuinely-verbatim
// span — and eight were repaired by hand on the way through.
//
// Then the obvious question: how many are left? The repo already owns the
// instrument that answers it (scripts/quotation-integrity.mjs, built for
// DR-0473) but it was only ever pointed at the Living Lessons SERIES. The
// CATALOG COURSES — every self-paced course in Learn — were never scanned, so
// the debt was invisible rather than absent. Measured: 908 elided spans across
// 156 lessons, 798 of them His own words, and a contiguous verbatim alternative
// available for 767 of them. The remedy exists; nobody was being asked for it.
//
// SO THIS GATE POINTS THE SAME INSTRUMENT AT THE COURSES, freezes what is
// there, and lets it only shrink. Writing 908 replacement spans tonight would
// be the hasty opposite of DR-0459's whole point, and recording the debt
// honestly beats both pretending and rushing.
import { describe, it, expect } from 'vitest';
import { scanQuotationIntegrity, ratchetQuotationIntegrity } from '../../../scripts/quotation-integrity.mjs';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import baseline from '../lib/course-quotation-integrity-baseline.json';

const COURSES = LEARN_CATALOG.filter((c) => typeof c.buildScheduleRows === 'function');

const lessonsOf = (c) => {
  let rows;
  try { rows = c.buildScheduleRows() || []; } catch (_) { return []; }
  return rows.map((r) => (r && (r.module || r))).filter((m) => m && m.id && (m.lesson || m.levels));
};

const MODULES = COURSES.flatMap(lessonsOf);
const scan = scanQuotationIntegrity(MODULES);

describe('the catalog courses carry no NEW elided quotation', () => {
  it('the walk covers the real catalog — it is not measuring nothing', () => {
    expect(COURSES.length).toBeGreaterThan(20);
    expect(MODULES.length, 'lesson count moved — re-measure the baseline').toBe(baseline.measuredLessons);
  });

  it('the committed baseline is the REAL debt, not a painted number', () => {
    expect(Object.keys(scan.elided).sort()).toEqual(Object.keys(baseline.elided).sort());
    expect(Object.keys(scan.recited).sort()).toEqual(Object.keys(baseline.recited).sort());
    expect(scan.totals.spans).toBe(baseline.totals.spans);
    expect(scan.totals.scripture).toBe(baseline.totals.scripture);
    expect(scan.lessonsElided).toBe(baseline.lessonsElided);
  });

  it('the recorded debt is HONEST about what it is — most of it is His words, and the remedy exists', () => {
    // If either of these inverts, the baseline has stopped describing the
    // problem it was written for and must be re-measured rather than trusted.
    expect(baseline.totals.scripture).toBeGreaterThan(baseline.totals.ours);
    expect(baseline.totals.contiguousAvailable).toBeGreaterThan(baseline.totals.scripture * 0.9);
  });

  it('no FRESH elision and no fresh recited record — the ratchet only turns one way', () => {
    const r = ratchetQuotationIntegrity(scan, baseline);
    expect(r.fresh, `new quotation-integrity debt in a catalog course, not recorded:\n${r.fresh.join('\n')}`).toEqual([]);
  });

  it('reports healing, so the baseline can be shrunk deliberately', () => {
    const r = ratchetQuotationIntegrity(scan, baseline);
    expect(r.healed, `these are now clean — remove them from the baseline:\n${r.healed.join('\n')}`).toEqual([]);
  });

  it('no baseline id has fallen out of the catalog — a ghost can never heal', () => {
    const ids = new Set(MODULES.map((m) => m.id));
    const stale = [...Object.keys(baseline.elided), ...Object.keys(baseline.recited)].filter((id) => !ids.has(id));
    expect(stale, `baseline ids no longer in the catalog: ${stale.join(', ')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a clean lesson that ADDS an elision is reported fresh', () => {
    // The whole value of a ratchet at this size is that it fires on the 909th.
    // Built from a lesson the baseline records as clean, so the report can only
    // come from the ellipsis that was just introduced.
    const cleanId = MODULES.map((m) => m.id).find((id) => !(id in baseline.elided));
    expect(cleanId, 'every lesson is already in the baseline — this proof would be vacuous').toBeTruthy();
    const dirtied = MODULES.map((m) => (m.id === cleanId
      ? { ...m, lesson: `${m.lesson || ''} "Prove all things... hold fast that which is good" (1 Thessalonians 5:21).` }
      : m));
    const r = ratchetQuotationIntegrity(scanQuotationIntegrity(dirtied), baseline);
    expect(r.fresh.join('\n')).toContain(cleanId);
  });

  it('PROVEN-TO-CATCH: a recorded lesson that gains ANOTHER elision is fresh too', () => {
    // A lesson already in the baseline is the harder case: the gate must count,
    // not merely check membership, or the debt could grow inside a listed id.
    const dirtyId = Object.keys(baseline.elided)[0];
    const dirtied = MODULES.map((m) => (m.id === dirtyId
      ? { ...m, bigIdea: `${m.bigIdea || ''} "Prove all things... hold fast that which is good" (1 Thessalonians 5:21).` }
      : m));
    const r = ratchetQuotationIntegrity(scanQuotationIntegrity(dirtied), baseline);
    expect(r.fresh.join('\n')).toContain(dirtyId);
  });
});
