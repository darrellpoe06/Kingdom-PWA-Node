// =============================================================================
// ari-app-review.test.js — Ari's comprehensive app review, proven-to-catch
// =============================================================================
// Pins (DR-0076): each dimension fires on a REAL contradiction and stays SILENT
// when the records are clean; findings rank most-severe first; the summary
// counts and headline are honest. Deterministic (nowMs injected).
import { describe, it, expect } from 'vitest';
import { buildAppReview, reviewHeadline, rankFindings, REVIEW_DIMENSIONS } from '../lib/ari-app-review.js';
import { seedTasksForBoard } from '../lib/board.js';

const NOW = Date.parse('2026-07-11T12:00:00Z');

// A real drifted task: the build record (seed spec) marks this shipped ('done')
// while the live board row reads 'not-started' — the exact screenshot case.
const DRIFT_BOARD = 'board-modular-cutover';
const DRIFT_SLUG = 'bt-seed-board-modular-cutover-s0';
const driftedTask = { slug: DRIFT_SLUG, boardSlug: DRIFT_BOARD, status: 'not-started' };

describe('buildAppReview — seven dimensions, all evidence-backed', () => {
  it('has the seven named dimensions in order, even on empty input', () => {
    const r = buildAppReview({}, NOW);
    expect(r.dimensions.map((d) => d.key)).toEqual(REVIEW_DIMENSIONS.map((d) => d[0]));
    expect(r.dimensions.every((d) => Array.isArray(d.findings))).toBe(true);
  });

  it('delivery: flags the build-record-vs-board drift with a count and the sync action', () => {
    const r = buildAppReview({ tasks: [driftedTask] }, NOW);
    const delivery = r.dimensions.find((d) => d.key === 'delivery');
    const drift = delivery.findings.find((f) => /still read "Not started"/.test(f.title));
    expect(drift).toBeTruthy();
    expect(drift.severity).toBe('warning');
    expect(drift.count).toBe(1);
    expect(drift.action).toBe('Sync statuses from the build record');
    expect(delivery.status).toBe('warning');
  });

  it('plan: flags undated open items and overdue open items separately', () => {
    const tasks = [
      { slug: 'a', boardSlug: 'b', status: 'not-started' },                       // undated open
      { slug: 'c', boardSlug: 'b', status: 'in-progress', dueDate: '2026-01-01' }, // overdue
      { slug: 'd', boardSlug: 'b', status: 'done', dueDate: '2020-01-01' },        // done -> ignored
    ];
    const plan = buildAppReview({ tasks }, NOW).dimensions.find((d) => d.key === 'plan');
    expect(plan.metrics.undated).toBe(1);  // only 'a' is open+undated ('c' is dated, 'd' is done)
    expect(plan.metrics.overdue).toBe(1);   // 'c' is open and past due
    expect(plan.findings.some((f) => /no target date/.test(f.title))).toBe(true);
    expect(plan.findings.some((f) => /past the committed target date/.test(f.title))).toBe(true);
  });

  it('reviews: an overdue dated re-review from the ledger becomes a warning', () => {
    const reviews = [{ id: 'REV-9', title: 't', findings: 'We will revisit this. re-review: 2026-01-01' }];
    const rev = buildAppReview({ reviews }, NOW).dimensions.find((d) => d.key === 'reviews');
    expect(rev.findings.some((f) => /overdue/.test(f.title))).toBe(true);
    expect(rev.status).toBe('warning');
  });

  it('reviews: NAMES the specific overdue decision + its date (no rotting date hides in a count)', () => {
    const decisions = [{ id: 'DR-0172', title: 'phone door', decision: 'ship it. re-review: 2026-01-05' }];
    const rev = buildAppReview({ decisions }, NOW).dimensions.find((d) => d.key === 'reviews');
    const named = rev.findings.find((f) => /DR-0172/.test(f.title));
    expect(named).toBeTruthy();
    expect(named.title).toMatch(/overdue \d+d/);        // how overdue, not just "some are"
    expect(named.evidence).toMatch(/2026-01-05/);        // the actual due date is shown
    expect(named.action).toMatch(/re-date it with a reason/); // owned outcome, not a shelf
  });

  it('reviews: a deep overdue backlog names the first few and rolls the rest into one remainder', () => {
    // 7 distinct overdue dated re-reviews across the DR ledger.
    const decisions = Array.from({ length: 7 }, (_, i) => ({
      id: `DR-90${i}`, title: `d${i}`, decision: `x. re-review: 2026-01-0${i + 1}`,
    }));
    const rev = buildAppReview({ decisions }, NOW).dimensions.find((d) => d.key === 'reviews');
    const named = rev.findings.filter((f) => /re-review overdue/.test(f.title));
    const remainder = rev.findings.find((f) => /more dated re-review/.test(f.title));
    expect(named.length).toBe(5);          // capped at OVERDUE_NAMED_CAP
    expect(remainder).toBeTruthy();
    expect(remainder.title).toMatch(/2 more/);
    expect(rev.metrics.overdue).toBe(7);   // the count is still whole
  });

  it('backlog: open concerns are a warning, in-progress a nit, and open feedback a nit', () => {
    const concerns = [{ status: 'open', concern: 'x' }, { status: 'in-progress', concern: 'y' }, { status: 'done', concern: 'z' }];
    const feedback = [{ status: 'open' }, { status: 'resolved' }];
    const bl = buildAppReview({ concerns, feedback }, NOW).dimensions.find((d) => d.key === 'backlog');
    expect(bl.metrics).toEqual({ openConcerns: 1, wipConcerns: 1, openFeedback: 1 });
    expect(bl.findings.find((f) => /open \(named/.test(f.title)).severity).toBe('warning');
  });

  it('inputs: a declared debt with no balance is a warning (the inert-input bug class)', () => {
    // A manual debt at $0 owed — the "Add as debt, leave balance blank" record that
    // used to vanish. Ari now catches it so the tap never silently goes nowhere.
    const debts = [{ id: 'd1', manual: true, balance: 0, needsTerms: true, leaveAlone: false }];
    const inp = buildAppReview({ debts }, NOW).dimensions.find((d) => d.key === 'inputs');
    expect(inp.metrics.noBalance).toBe(1);
    expect(inp.findings.find((f) => /no amount owed/.test(f.title)).severity).toBe('warning');
  });
  it('inputs: a debt with a balance but missing terms is a nit, not a no-balance warning', () => {
    const debts = [{ id: 'd1', manual: true, balance: 9843, needsTerms: true, leaveAlone: false }];
    const inp = buildAppReview({ debts }, NOW).dimensions.find((d) => d.key === 'inputs');
    expect(inp.metrics).toEqual({ noBalance: 0, needTerms: 1 });
    expect(inp.findings.find((f) => /payoff date until terms/.test(f.title)).severity).toBe('nit');
  });
  it('inputs: a fully-termed debt raises nothing, and leaveAlone debts are ignored', () => {
    const debts = [
      { id: 'd1', manual: true, balance: 9843, needsTerms: false, leaveAlone: false },
      { id: 'd2', manual: true, balance: 0, needsTerms: true, leaveAlone: true },
    ];
    const inp = buildAppReview({ debts }, NOW).dimensions.find((d) => d.key === 'inputs');
    expect(inp.findings).toHaveLength(0);
    expect(inp.status).toBe('ok');
  });

  it('recommends Avalanche when the highest-rate debt is only visible across the whole picture', () => {
    const debts = [
      { id: 'd1', name: 'Store Card', rate: 24.99, balance: 1200, leaveAlone: false },
      { id: 'd2', name: 'Auto Loan', rate: 6.5, balance: 18000, leaveAlone: false },
    ];
    const r = buildAppReview({ debts }, NOW);
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0].recommendation).toMatch(/Store Card/);
    expect(r.recommendations[0].recommendation).toMatch(/Avalanche/);
    expect(r.recommendations[0].basis).toMatch(/24.99%/);
  });
  it('no upgrade recommendation with fewer than two rated debts (nothing to compare)', () => {
    const debts = [{ id: 'd1', name: 'Only Card', rate: 24.99, balance: 1200, leaveAlone: false }];
    expect(buildAppReview({ debts }, NOW).recommendations).toHaveLength(0);
  });

  it('recurrence P30: an open concern aged past the bar fires, naming the principle', () => {
    // NOW is 2026-07-11; created 2026-06-01 = 40 days — past QUEUE_AGE_DAYS (21).
    const concerns = [{ status: 'open', concern: 'x', created: '2026-06-01' }];
    const rec = buildAppReview({ concerns }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.agedConcerns).toBe(1);
    const f = rec.findings.find((x) => /P30 recurrence/.test(x.title) && /sitting open/.test(x.title));
    expect(f.severity).toBe('warning');
    expect(f.principle).toBe('P30');
    expect(f.title).toMatch(/oldest 40d/);
  });
  it('recurrence P30: a concern past its own targetDate fires; a done one does not', () => {
    const concerns = [
      { status: 'in-progress', concern: 'slipping', created: '2026-07-01', targetDate: '2026-07-05' },
      { status: 'done', concern: 'finished', created: '2026-06-01', targetDate: '2026-06-05' },
    ];
    const rec = buildAppReview({ concerns }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.slippedTargets).toBe(1);
    expect(rec.findings.find((x) => /past (its|their) own target date/.test(x.title)).severity).toBe('warning');
  });
  it('recurrence: a FRESH open concern raises nothing (age is the signal, not existence)', () => {
    const concerns = [{ status: 'open', concern: 'new', created: '2026-07-08' }];
    const rec = buildAppReview({ concerns }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.findings).toHaveLength(0);
    expect(rec.status).toBe('ok');
  });
  it('recurrence: a REFRESHED old concern stops firing — refresh actually clears the finding (DR-0225)', () => {
    // Created 40d ago (would fire) but refreshed 3d ago: the refresh pass counts.
    const concerns = [{ status: 'open', concern: 'tended', created: '2026-06-01', refreshed: '2026-07-08' }];
    const rec = buildAppReview({ concerns }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.agedConcerns).toBe(0);
    // And a STALE refreshed date does NOT shield it: refreshed 30d ago still fires.
    const stale = [{ status: 'open', concern: 'slid', created: '2026-05-01', refreshed: '2026-06-11' }];
    const rec2 = buildAppReview({ concerns: stale }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec2.metrics.agedConcerns).toBe(1);
  });
  it('recurrence P30: aged open feedback fires; addressed feedback does not', () => {
    const feedback = [
      { status: 'open', createdAt: '2026-06-01T10:00:00Z' },
      { status: 'resolved', createdAt: '2026-05-01T10:00:00Z' },
    ];
    const rec = buildAppReview({ feedback }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.agedFeedback).toBe(1);
    expect(rec.findings.find((x) => /feedback item/.test(x.title)).severity).toBe('warning');
  });
  it('recurrence P14: a demo-only row in the live signed-in data is a BUG-severity leak', () => {
    const transactions = [{ id: 'demo-t1', amount: -5 }, { id: 't-real', amount: -10 }];
    const r = buildAppReview({ transactions, demoRowIds: new Set(['demo-t1']) }, NOW);
    const rec = r.dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.demoLeaks).toBe(1);
    expect(rec.metrics.provenanceChecked).toBe(true);
    expect(rec.findings.find((x) => /P14 recurrence/.test(x.title)).severity).toBe('bug');
    expect(r.summary.status).toBe('bug'); // a provenance leak tops the whole review
  });
  it('recurrence P14: without demoRowIds the provenance check honestly reports unchecked (never a silent pass)', () => {
    const transactions = [{ id: 'demo-t1', amount: -5 }];
    const rec = buildAppReview({ transactions }, NOW).dimensions.find((d) => d.key === 'recurrence');
    expect(rec.metrics.provenanceChecked).toBe(false);
    expect(rec.metrics.demoLeaks).toBe(0);
    expect(rec.findings).toHaveLength(0);
  });

  it('clean input reports every dimension ok and a clean headline (no painted score)', () => {
    const r = buildAppReview({}, NOW);
    expect(r.summary.total).toBe(0);
    expect(r.summary.status).toBe('ok');
    expect(r.dimensions.every((d) => d.status === 'ok')).toBe(true);
    expect(reviewHeadline(r)).toMatch(/clean/);
  });

  it('summary ranks most-severe first, counts by severity, and dedupes top actions', () => {
    const tasks = [driftedTask, { slug: 'u', boardSlug: 'b', status: 'not-started' }];
    const concerns = [{ status: 'open', concern: 'x' }];
    const r = buildAppReview({ tasks, concerns }, NOW);
    // ranking: warnings before nits
    const sevSeq = r.findings.map((f) => f.severity);
    const firstNit = sevSeq.indexOf('nit');
    const lastWarn = sevSeq.lastIndexOf('warning');
    if (firstNit !== -1 && lastWarn !== -1) expect(lastWarn).toBeLessThan(firstNit);
    expect(r.summary.counts.warning).toBeGreaterThanOrEqual(2);
    expect(r.summary.topActions.length).toBeGreaterThan(0);
    expect(reviewHeadline(r)).toMatch(/to address/);
  });

  it('rankFindings is pure and stable within a severity', () => {
    const input = [
      { severity: 'nit', title: 'n1' }, { severity: 'warning', title: 'w1' },
      { severity: 'nit', title: 'n2' }, { severity: 'bug', title: 'b1' },
    ];
    expect(rankFindings(input).map((f) => f.title)).toEqual(['b1', 'w1', 'n1', 'n2']);
  });
});

describe('ari-app-review — the drift signal matches the build record exactly', () => {
  it('a task whose seed spec is done but live status is not-started is the drift', () => {
    const spec = seedTasksForBoard(DRIFT_BOARD).find((s) => s.slug === DRIFT_SLUG);
    expect(spec.status).toBe('done'); // guards the fixture against seed-data drift
  });
});
