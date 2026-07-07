// =============================================================================
// board-validation — the Current → Future → Gap → Decision lane (DR-0118)
// =============================================================================
// Pins Darrell's Mosaic-board validation workflow as adopted into the working
// boards: the four flow steps, the honest outcome vocabulary (unknown by
// default, gap in rust never true red — DR-0099), lane grouping with
// 'All units' pinned first, and the decided-only-when-decision-done rollup.
import { describe, it, expect } from 'vitest';
import {
  FLOW_STEPS, FLOW_ORDER, VALIDATION_OUTCOMES, OUTCOME_ORDER, ALL_UNITS,
  flowOf, unitOf, outcomeOf, outcomeMeta, nextOutcome,
  hasValidationFlow, validationLanes, laneSummary,
} from '../lib/board-validation.js';
import { seedTasksForBoard } from '../lib/board.js';

const task = (flow, unit, outcome, status = 'done', extra = {}) => ({
  slug: `t-${unit}-${flow}`, status, title: `${unit} ${flow}`,
  links: { flow, unit, ...(outcome ? { outcome } : {}) }, ...extra,
});

describe('the flow and outcome vocabularies', () => {
  it('walks exactly Current → Future → Gap → Decision', () => {
    expect(FLOW_ORDER).toEqual(['current-state', 'future-state', 'gap', 'decision']);
    for (const k of FLOW_ORDER) expect(FLOW_STEPS[k].label).toBeTruthy();
  });

  it('has the four outcomes with themed colors only — gap wears rust, never true red (DR-0099)', () => {
    expect(OUTCOME_ORDER).toEqual(['fit', 'partial-fit', 'gap', 'unknown']);
    const allowed = ['#5A6E3D', '#2A5A8E', '#B85838', '#5A5751'];
    for (const k of OUTCOME_ORDER) expect(allowed).toContain(VALIDATION_OUTCOMES[k].color);
    expect(VALIDATION_OUTCOMES['gap'].color).toBe('#B85838');
  });

  it('defaults an absent or unrecognized outcome to unknown — a row can never accidentally read Fit', () => {
    expect(outcomeOf({ links: { flow: 'gap', unit: 'X' } })).toBe('unknown');
    expect(outcomeOf({ links: { flow: 'gap', unit: 'X', outcome: 'painted-green' } })).toBe('unknown');
    expect(outcomeOf(null)).toBe('unknown');
    expect(outcomeMeta('nope').label).toBe('Unknown');
  });

  it('cycles outcomes one-tap style through all four and wraps', () => {
    let o = 'fit';
    const seen = [o];
    for (let i = 0; i < 3; i++) { o = nextOutcome(o); seen.push(o); }
    expect(seen).toEqual(OUTCOME_ORDER);
    expect(nextOutcome('unknown')).toBe('fit');
  });
});

describe('lane grouping', () => {
  it('ignores plain tasks — a board without flow rows has no validation lane', () => {
    expect(hasValidationFlow([{ slug: 'a', status: 'done', links: {} }, { slug: 'b' }])).toBe(false);
    expect(validationLanes([{ slug: 'a' }]).lanes).toEqual([]);
  });

  it('pins All units first (case/suffix tolerant) and keeps other lanes in first-seen order', () => {
    const { lanes } = validationLanes([
      task('current-state', 'Orders', 'gap'),
      task('current-state', 'all units impacted', 'gap'),
      task('current-state', 'Classes', 'gap'),
    ]);
    expect(lanes.map((l) => l.unit)).toEqual([ALL_UNITS, 'Orders', 'Classes']);
    expect(lanes[0].allUnits).toBe(true);
  });

  it('keeps the first row of a duplicated step and reports the duplicate — never silently drops', () => {
    const dupe = task('gap', 'Orders', 'fit');
    dupe.slug = 't-Orders-gap-2';
    const { lanes, duplicates } = validationLanes([task('gap', 'Orders', 'gap'), dupe]);
    expect(lanes[0].steps['gap'].links.outcome).toBe('gap');
    expect(duplicates).toEqual([{ unit: 'Orders', step: 'gap', slug: 't-Orders-gap-2' }]);
  });
});

describe('laneSummary — the honest rollup', () => {
  it('is decided ONLY when the decision row exists and is done', () => {
    const open = { steps: { 'current-state': task('current-state', 'X', 'gap') } };
    expect(laneSummary(open).decided).toBe(false);
    const pending = { steps: { decision: task('decision', 'X', 'fit', 'in-progress') } };
    expect(laneSummary(pending).decided).toBe(false);
    const done = { steps: { decision: task('decision', 'X', 'fit', 'done') } };
    expect(laneSummary(done).decided).toBe(true);
  });

  it('worst outcome ranks gap > unknown > partial-fit > fit, and names missing steps', () => {
    const lane = { steps: {
      'current-state': task('current-state', 'X', 'fit'),
      'future-state': task('future-state', 'X', 'partial-fit'),
      'gap': task('gap', 'X', 'gap'),
    } };
    const s = laneSummary(lane);
    expect(s.worst).toBe('gap');
    expect(s.examined).toBe(3);
    expect(s.missing).toEqual(['decision']);
    expect(laneSummary({ steps: {} }).worst).toBe('unknown');
  });
});

describe('the real seed — Moore discovery validation on board-client-factory', () => {
  const rows = seedTasksForBoard('board-client-factory').filter((r) => r.links && r.links.flow);

  it('carries flow-tagged rows whose flow/unit/outcome all use the real vocabularies', () => {
    expect(rows.length).toBeGreaterThanOrEqual(12);
    for (const r of rows) {
      expect(FLOW_ORDER).toContain(flowOf(r));
      expect(unitOf(r)).toBeTruthy();
      expect(OUTCOME_ORDER).toContain(outcomeOf(r));
    }
  });

  it('forms lanes with All units pinned first and every lane carrying a decision row', () => {
    const { lanes, duplicates } = validationLanes(rows);
    expect(duplicates).toEqual([]);
    expect(lanes[0].unit).toBe(ALL_UNITS);
    for (const lane of lanes) expect(lane.steps['decision']).toBeTruthy();
  });

  it('stays honest: the not-yet-built registry decision reads unknown, not a painted fit', () => {
    const { lanes } = validationLanes(rows);
    const all = lanes.find((l) => l.allUnits);
    expect(all.steps['decision'].status).toBe('not-started');
    expect(outcomeOf(all.steps['decision'])).toBe('unknown');
    expect(laneSummary(all).decided).toBe(false);
  });
});
