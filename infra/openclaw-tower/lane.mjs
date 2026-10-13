// =============================================================================
// lane.mjs -- the facts the report-only pilot (role b) is handed, and its prompt
// =============================================================================
// DR-0670. Role (b) is "report-only first (it reads lane state + reports)"
// (STEP 4 s4.5). The facts come from the SAME GitHub endpoints the OpsBoard
// reads live (app/src/lib/github-ops.js: open pulls, recent main runs) -- read
// by the witness workflow on a GitHub runner and carried to the tower as a
// file. The tower is handed facts; it never goes looking, and it holds no
// GitHub credential (credentials are a bright line).
//
// Pure: no fetch, no fs. The workflow calls normalizeLane() on the API JSON.
// =============================================================================

const clip = (s, n) => {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** GitHub API JSON -> the small lane record the prompt is built from. */
export function normalizeLane({ pulls = [], runs = {}, measuredAt = null } = {}) {
  const list = Array.isArray(pulls) ? pulls : [];
  const open = list.map((p) => ({
    number: p.number,
    title: clip(p.title, 140),
    branch: p.head && p.head.ref ? String(p.head.ref) : '',
    hold: Array.isArray(p.labels) && p.labels.some((l) => l && l.name === 'hold'),
    draft: p.draft === true,
    updatedAt: p.updated_at || null,
  }));
  const wr = runs && Array.isArray(runs.workflow_runs) ? runs.workflow_runs : [];
  const mainRuns = wr
    .filter((r) => r && r.head_branch === 'main')
    .slice(0, 8)
    .map((r) => ({ name: clip(r.name, 60), status: r.status || null, conclusion: r.conclusion || null, at: r.created_at || null }));
  return {
    measuredAt,
    openCount: open.length,
    held: open.filter((p) => p.hold).map((p) => p.number),
    open: open.slice(0, 25),
    mainRuns,
  };
}

/**
 * The report prompt. It states the facts, the one job, and what the pilot may
 * not do -- and it asks for plain lines only, so a model that wanders has
 * nothing to wander into (it has no tools either; report.json denies them).
 */
export function buildReportPrompt(lane) {
  const l = lane || {};
  const pr = (l.open || [])
    .map((p) => `#${p.number} ${p.hold ? '[hold] ' : ''}${p.draft ? '[draft] ' : ''}${p.branch} -- ${p.title}`)
    .join('\n');
  const runs = (l.mainRuns || [])
    .map((r) => `${r.name}: ${r.conclusion || r.status || 'unknown'}`)
    .join('\n');
  return [
    'You are the report-only chat-ops pilot for the PoeTech delivery lane.',
    'Your ONLY job: read the lane facts below and write a short status report.',
    'You may not act, send, post, change anything, or call tools. Report only.',
    'Use only the facts given. If a fact is missing, say it is unknown -- never guess.',
    'Write at most 8 short plain lines: what is in flight, what is parked on hold,',
    'whether main is green, and the one thing a steward should look at first.',
    '',
    `Measured at: ${l.measuredAt || 'unknown'}`,
    `Open pull requests (${Number.isFinite(l.openCount) ? l.openCount : 'unknown'}):`,
    pr || '(none)',
    `Parked on hold: ${(l.held || []).length ? l.held.map((n) => `#${n}`).join(', ') : 'none'}`,
    'Recent main runs:',
    runs || '(none read)',
  ].join('\n');
}
