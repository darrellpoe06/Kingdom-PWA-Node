// =============================================================================
// Ari reviews WORKFLOW CURRENCY and LIVE-SYSTEM CAPACITY
// =============================================================================
// Darrell 2026-09-05: "Is Ari updating the surface of the apps to ensure
// alignment with the current state of the workflows and capacity of its live
// systems? If not, why and fix... comprehensively."
//
// He was right that it was not. Ari's comprehensive review carried nine
// dimensions — delivery, plan, reviews, backlog, inputs, data, rentals,
// recurrence, oversight — and none of them asked either question. The workflow
// registry was read ONLY to compute brake coverage; loop-health and site-health
// never reached the review at all, so "how is the app really doing" could answer
// in full without once consulting the live product.
//
// The governing rule for both new dimensions is DR-0076 / DR-0125: UNMEASURED
// NEVER READS AS OK. A signal nobody read produces a finding that says so.
import { describe, it, expect } from 'vitest';
import { buildAppReview, REVIEW_DIMENSIONS } from '../lib/ari-app-review.js';

const NOW = Date.UTC(2026, 8, 5, 12, 0, 0);
const dim = (review, key) => review.dimensions.find((d) => d.key === key);
const titles = (d) => d.findings.map((f) => f.title);

const HEALTHY_SITE = {
  ok: true,
  freshness: { known: true, fresh: true, deployedSha: 'abc1234', mainSha: 'abc1234', deployedAt: '2026-09-05T11:00:00Z' },
  probe: { measured: true, checksToday: 4, downToday: 0, lastDown: null, latest: {} },
  incidents: [],
};
const REGISTRY = [{ file: 'wf1.json', name: 'wf1', active: true, why: 'because' }];
const FRESH_LOOPS = [{ key: 'ledger', label: 'Transaction ledger', status: 'fresh', daysSince: 1, staleDays: 45 }];

describe('the two dimensions exist and are reviewed', () => {
  it('registers workflow currency and live-system capacity', () => {
    const keys = REVIEW_DIMENSIONS.map(([k]) => k);
    expect(keys).toContain('workflows');
    expect(keys).toContain('capacity');
  });

  it('buildAppReview actually runs them — they appear in the output', () => {
    const r = buildAppReview({}, NOW);
    expect(dim(r, 'workflows')).toBeTruthy();
    expect(dim(r, 'capacity')).toBeTruthy();
  });

  it('every dimension key has a label and a question', () => {
    const r = buildAppReview({}, NOW);
    for (const key of ['workflows', 'capacity']) {
      const d = dim(r, key);
      expect(d.label.length).toBeGreaterThan(3);
      expect(d.question.length).toBeGreaterThan(10);
    }
  });
});

describe('PROVEN-TO-CATCH — the gap Darrell named: an unread signal must not read as clear', () => {
  // This is the exact defect. Before this change a review with no workflow
  // registry, no loops and no live read reported nine clean dimensions and a
  // headline with nothing to say about either question.
  it('reports workflow currency as UNMEASURED rather than clear when nothing was handed in', () => {
    const d = dim(buildAppReview({}, NOW), 'workflows');
    expect(d.status).not.toBe('ok');
    expect(titles(d).join(' | ')).toMatch(/cannot see its own workflow registry/);
    expect(titles(d).join(' | ')).toMatch(/Loop currency was not measured/);
    expect(d.metrics.registryChecked).toBe(false);
    expect(d.metrics.loopsChecked).toBe(false);
  });

  it('reports live-system capacity as UNMEASURED rather than clear when nothing was handed in', () => {
    const d = dim(buildAppReview({}, NOW), 'capacity');
    expect(d.status).not.toBe('ok');
    expect(titles(d).join(' | ')).toMatch(/live system was not measured/);
    expect(d.metrics.siteChecked).toBe(false);
    expect(d.metrics.deployFresh).toBe(null);
  });

  it('an empty registry is named as a gap, not silently accepted', () => {
    const d = dim(buildAppReview({ workflows: [], loops: FRESH_LOOPS }, NOW), 'workflows');
    expect(titles(d).join(' | ')).toMatch(/cannot see its own workflow registry/);
    expect(d.findings.find((f) => /registry/.test(f.title)).evidence).toMatch(/0 rows/);
  });

  it('a failed live read surfaces its real notice rather than a generic clear', () => {
    const d = dim(buildAppReview({ site: { ok: false, notice: 'GitHub API rate limit reached (60/hr, unauthenticated). Try again later.' } }, NOW), 'capacity');
    expect(d.findings[0].evidence).toMatch(/rate limit reached/);
  });
});

describe('workflow currency — real loop states produce real findings', () => {
  it('flags stale loops with their measured age', () => {
    const d = dim(buildAppReview({
      workflows: REGISTRY,
      loops: [{ key: 'ledger', label: 'Transaction ledger', status: 'stale', daysSince: 60, staleDays: 45 }],
    }, NOW), 'workflows');
    expect(d.status).toBe('warning');
    expect(titles(d).join(' | ')).toMatch(/1 data loop has stopped updating/);
    expect(d.findings[0].evidence).toMatch(/Transaction ledger \(60d, stale past 45d\)/);
  });

  it('separates a never-updated loop from one honestly awaiting a named upstream', () => {
    const d = dim(buildAppReview({
      workflows: REGISTRY,
      loops: [
        { key: 'a', label: 'Dead loop', status: 'never', daysSince: null, staleDays: 30 },
        { key: 'b', label: 'Waiting loop', status: 'awaiting', daysSince: null, staleDays: 10, awaitingSource: 'upstream not wired' },
      ],
    }, NOW), 'workflows');
    const never = d.findings.find((f) => /never updated/.test(f.title));
    const awaiting = d.findings.find((f) => /waiting on a named upstream/.test(f.title));
    expect(never.severity, 'a dead loop is a warning').toBe('warning');
    expect(awaiting.severity, 'honest waiting is only a nit — not a dead loop').toBe('nit');
    expect(awaiting.evidence).toMatch(/honest waiting, not a dead loop/);
  });

  it('is CLEAR only when both signals were actually read and are healthy', () => {
    const d = dim(buildAppReview({ workflows: REGISTRY, loops: FRESH_LOOPS }, NOW), 'workflows');
    expect(d.status).toBe('ok');
    expect(d.findings).toEqual([]);
    expect(d.metrics).toMatchObject({ registryChecked: true, workflows: 1, activeWorkflows: 1, loopsChecked: true, loops: 1, loopsFresh: 1 });
  });

  it('does not restate the fleet-brake findings that reviewOversight already owns', () => {
    const d = dim(buildAppReview({ workflows: REGISTRY, loops: FRESH_LOOPS }, NOW), 'workflows');
    expect(JSON.stringify(d)).not.toMatch(/brake|budget\+lock|P10/i);
  });
});

describe('live-system capacity — the DR-0107 stale-deploy class is caught', () => {
  it('calls a served build behind main a BUG, with both shas as evidence', () => {
    const d = dim(buildAppReview({
      site: { ...HEALTHY_SITE, freshness: { known: true, fresh: false, deployedSha: 'aaa1111', mainSha: 'bbb2222', deployedAt: '2026-09-05T02:00:00Z' } },
    }, NOW), 'capacity');
    const f = d.findings.find((x) => /behind main/.test(x.title));
    expect(f.severity).toBe('bug');
    expect(f.evidence).toMatch(/aaa1111/);
    expect(f.evidence).toMatch(/bbb2222/);
    expect(f.evidence, 'the lesson from 2026-07-06 is stated').toMatch(/CI-green is not deployed/);
    expect(d.metrics.deployFresh).toBe(false);
  });

  it('an UNKNOWN build never reads as a current one', () => {
    const d = dim(buildAppReview({ site: { ...HEALTHY_SITE, freshness: { known: false, fresh: false } } }, NOW), 'capacity');
    expect(titles(d).join(' | ')).toMatch(/served build is unknown/);
    expect(d.metrics.deployFresh).toBe(null);
    expect(d.status).not.toBe('ok');
  });

  it('flags observed downtime today as a bug with the measured count', () => {
    const d = dim(buildAppReview({
      site: { ...HEALTHY_SITE, probe: { measured: true, checksToday: 6, downToday: 2, lastDown: { at: '2026-09-05T09:30:00Z' } } },
    }, NOW), 'capacity');
    const f = d.findings.find((x) => /observed DOWN/.test(x.title));
    expect(f.severity).toBe('bug');
    expect(f.evidence).toMatch(/2 of 6 probe/);
    expect(d.metrics.downToday).toBe(2);
  });

  it('an unobserved day is a nit, not a healthy day', () => {
    const d = dim(buildAppReview({
      site: { ...HEALTHY_SITE, probe: { measured: true, checksToday: 0, downToday: 0, lastDown: null } },
    }, NOW), 'capacity');
    const f = d.findings.find((x) => /No uptime check has run today/.test(x.title));
    expect(f.severity).toBe('nit');
    expect(f.evidence).toMatch(/unobserved/);
  });

  it('counts open incidents from the rolling ledger, ignoring closed ones', () => {
    const d = dim(buildAppReview({
      site: {
        ...HEALTHY_SITE,
        incidents: [
          { number: 12, state: 'open', observations: 3 },
          { number: 9, state: 'closed', observations: 5 },
        ],
      },
    }, NOW), 'capacity');
    const f = d.findings.find((x) => /downtime incident/.test(x.title));
    expect(f.title).toMatch(/^1 downtime incident is still open$/);
    expect(f.evidence).toMatch(/#12 \(3 observations\)/);
    expect(f.evidence).not.toMatch(/#9/);
    expect(d.metrics.openIncidents).toBe(1);
  });

  it('is CLEAR only on a real, healthy, measured read', () => {
    const d = dim(buildAppReview({ site: HEALTHY_SITE }, NOW), 'capacity');
    expect(d.status).toBe('ok');
    expect(d.findings).toEqual([]);
    expect(d.metrics).toMatchObject({ siteChecked: true, deployFresh: true, checksToday: 4, downToday: 0, openIncidents: 0 });
  });
});

describe('the new findings reach the summary — they are not a decorative panel', () => {
  it('a stale deploy raises the whole review to bug and lands in the top actions', () => {
    const r = buildAppReview({
      workflows: REGISTRY,
      loops: FRESH_LOOPS,
      site: { ...HEALTHY_SITE, freshness: { known: true, fresh: false, deployedSha: 'aaa1111', mainSha: 'bbb2222' } },
    }, NOW);
    expect(r.summary.status).toBe('bug');
    expect(r.summary.counts.bug).toBeGreaterThan(0);
    expect(r.summary.topActions.map((a) => a.action || a).join(' | ')).toMatch(/Dispatch the deploy immediately/);
  });

  it('every new finding carries evidence and an action (DR-0076)', () => {
    const r = buildAppReview({ workflows: [], loops: null, site: null }, NOW);
    const mine = r.findings.filter((f) => f.dimension === 'workflows' || f.dimension === 'capacity');
    expect(mine.length).toBeGreaterThan(0);
    for (const f of mine) {
      expect(f.evidence, `no evidence on: ${f.title}`).toBeTruthy();
      expect(f.action, `no action on: ${f.title}`).toBeTruthy();
      expect(f.evidence.length).toBeGreaterThan(20);
    }
  });
});
