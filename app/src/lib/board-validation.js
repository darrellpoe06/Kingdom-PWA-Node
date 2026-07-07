// =============================================================================
// board-validation — the Current State → Future State → Gap → Decision lane
// =============================================================================
// Adopted from Darrell's own validation workflow on the IL Union WinPrism→Mosaic
// implementation board (2026-07-07: "These are the workflows I came up with for
// the physical stores and virtual stores... use these workflows to help our
// project workflows to look and flow better"). His pattern, kept faithfully:
//
//   * Every UNIT under validation (a store, a module, a business area) walks the
//     SAME four steps, left to right: Current State → Future State (what the
//     system is expected to do) → Gap → Decision.
//   * Every step carries an honest VALIDATION OUTCOME — Fit / Partial Fit /
//     Gap / Unknown — a separate axis from work status: status says whether the
//     examination step is done; outcome says what the examination FOUND.
//   * Cross-cutting rows ("All units impacted") sit ABOVE the per-unit lanes.
//
// This is the board-shaped form of the reality-trace + DR-0076: current reality
// named first, the expectation stated, the gap made explicit, and a decision
// recorded — never a build straight from assumption. Recorded as DR-0118.
//
// DATA SHAPE — additive, no migration: a task opts into the lane view via its
// synced `links` jsonb: links.flow = one of FLOW_ORDER, links.unit = the lane
// name ('All units' = the pinned cross-cutting lane). links.outcome = one of
// OUTCOME_ORDER (absent → 'unknown' — honest default, never a painted Fit).
// Plain tasks without links.flow are untouched; boards without any flow-tagged
// task render exactly as before.
//
// PURE (no React, no network) so every helper is unit-testable.
// =============================================================================

// The four flow steps, in walking order. Symbols are geometric (never emoji).
export const FLOW_STEPS = {
  'current-state': { label: 'Current state', short: 'Current', blurb: 'How it really works today — named first, from the person who lives it' },
  'future-state':  { label: 'Future state',  short: 'Future',  blurb: 'What the system is expected to do for this unit' },
  'gap':           { label: 'Gap',           short: 'Gap',     blurb: 'What the expectation does not cover — made explicit, never papered over' },
  'decision':      { label: 'Decision',      short: 'Decision', blurb: 'What we decided to do about the gap — recorded, dated' },
};
export const FLOW_ORDER = ['current-state', 'future-state', 'gap', 'decision'];

// The validation-outcome vocabulary. Themed accent tokens only (the same three
// accents the contrast guard remaps per-theme + textSecondary grey) — and per
// Color Theology (DR-0099) a Gap wears RUST (#B85838), never true red: red is
// reserved for the Blood alone, and a workflow shortfall does not borrow it.
export const VALIDATION_OUTCOMES = {
  'fit':         { label: 'Fit',         color: '#5A6E3D', text: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]', symbol: '✓', blurb: 'Verified: the system serves this as-is' },
  'partial-fit': { label: 'Partial fit', color: '#2A5A8E', text: 'text-[#2A5A8E]', border: 'border-[#2A5A8E]', symbol: '◐', blurb: 'Serves it in part — the uncovered part is named in the notes' },
  'gap':         { label: 'Gap',         color: '#B85838', text: 'text-[#B85838]', border: 'border-[#B85838]', symbol: '✕', blurb: 'Does not serve this — needs a decision' },
  'unknown':     { label: 'Unknown',     color: '#5A5751', text: 'text-[#5A5751]', border: 'border-[#5A5751]', symbol: '?', blurb: 'Not verified yet — never guessed (DR-0076)' },
};
export const OUTCOME_ORDER = ['fit', 'partial-fit', 'gap', 'unknown'];

// The pinned cross-cutting lane name (matches the Mosaic board's "All Units
// Impacted" rows). Case-insensitive match; canonical display form below.
export const ALL_UNITS = 'All units';
const isAllUnits = (u) => String(u || '').trim().toLowerCase().replace(/\s+impacted$/, '') === 'all units';

export function flowOf(task) {
  const f = task && task.links && task.links.flow;
  return FLOW_STEPS[f] ? f : null;
}

export function unitOf(task) {
  const u = task && task.links && typeof task.links.unit === 'string' ? task.links.unit.trim() : '';
  if (!u) return null;
  return isAllUnits(u) ? ALL_UNITS : u;
}

// Absent/unrecognized outcome reads as 'unknown' — the honest default. A row
// can never accidentally display as Fit.
export function outcomeOf(task) {
  const o = task && task.links && task.links.outcome;
  return VALIDATION_OUTCOMES[o] ? o : 'unknown';
}

export function outcomeMeta(outcome) {
  return VALIDATION_OUTCOMES[outcome] || VALIDATION_OUTCOMES['unknown'];
}

// One-tap outcome advance (mirrors the status chip's cycle affordance).
export function nextOutcome(outcome) {
  const i = OUTCOME_ORDER.indexOf(outcome);
  return OUTCOME_ORDER[(i + 1) % OUTCOME_ORDER.length];
}

// Does this board carry the validation lane at all?
export function hasValidationFlow(tasks) {
  return (Array.isArray(tasks) ? tasks : []).some((t) => flowOf(t) && unitOf(t));
}

// -----------------------------------------------------------------------------
// validationLanes — group flow-tagged tasks into ordered lanes. 'All units'
// pins first (the Mosaic cross-cutting rows), then lanes in first-seen order
// (seed order = the spec's declared order). Each lane exposes steps keyed by
// flow id; a step the lane has no row for is null — rendered as "not examined",
// never invented. A lane with two rows on one step keeps the first and reports
// the duplicate (data smell surfaced, not silently dropped).
// -----------------------------------------------------------------------------
export function validationLanes(tasks) {
  const list = (Array.isArray(tasks) ? tasks : []).filter((t) => flowOf(t) && unitOf(t));
  const byUnit = new Map();
  const duplicates = [];
  for (const t of list) {
    const unit = unitOf(t);
    if (!byUnit.has(unit)) byUnit.set(unit, { unit, steps: {}, allUnits: unit === ALL_UNITS });
    const lane = byUnit.get(unit);
    const step = flowOf(t);
    if (lane.steps[step]) duplicates.push({ unit, step, slug: t.slug });
    else lane.steps[step] = t;
  }
  const lanes = [...byUnit.values()].sort((a, b) => (a.allUnits === b.allUnits ? 0 : a.allUnits ? -1 : 1));
  return { lanes, duplicates };
}

// -----------------------------------------------------------------------------
// laneSummary — the honest per-lane readout: a lane is DECIDED only when its
// decision row exists and is done; otherwise it is still open. worst = the most
// attention-needing outcome across the lane's examined steps (gap > unknown >
// partial-fit > fit), driving the lane's edge accent.
// -----------------------------------------------------------------------------
const OUTCOME_SEVERITY = { 'gap': 3, 'unknown': 2, 'partial-fit': 1, 'fit': 0 };
export function laneSummary(lane) {
  const steps = lane && lane.steps ? lane.steps : {};
  const present = FLOW_ORDER.map((k) => steps[k]).filter(Boolean);
  const decision = steps['decision'] || null;
  const decided = !!decision && decision.status === 'done';
  let worst = null;
  for (const t of present) {
    const o = outcomeOf(t);
    if (worst == null || OUTCOME_SEVERITY[o] > OUTCOME_SEVERITY[worst]) worst = o;
  }
  return {
    decided,
    worst: worst || 'unknown',
    examined: present.length,
    missing: FLOW_ORDER.filter((k) => !steps[k]),
  };
}
