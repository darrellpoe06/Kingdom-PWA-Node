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

describe('buildAppReview — five dimensions, all evidence-backed', () => {
  it('has the five named dimensions in order, even on empty input', () => {
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
