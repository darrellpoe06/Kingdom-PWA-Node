// Pure logic for the in-app Quality / Proof panel. The core promise under test
// (Verification Doctrine, DR-0076): a check is NEVER painted green for merely
// existing -- green requires a live CI pass on the SERVED build SHA, contrast
// green requires a measurement, a review is green only when 'addressed'.
import { describe, it, expect } from 'vitest';
import {
  normalizeManifest, normalizeReviews, shortSha, freshnessVerdict, ciVerdict,
  rowStatus, contrastStatus, reviewStatus, reviewFreshness,
} from '../lib/quality-proof.js';

describe('shortSha', () => {
  it('truncates + lowercases, null-safe', () => {
    expect(shortSha('ABCDEF1234567')).toBe('abcdef1');
    expect(shortSha(null)).toBe('');
    expect(shortSha(undefined)).toBe('');
  });
});

describe('freshnessVerdict', () => {
  it('green only when served === live main HEAD', () => {
    expect(freshnessVerdict('abc1234', 'abc1234').status).toBe('good');
  });
  it('red (stale) when served differs from main', () => {
    const v = freshnessVerdict('aaaaaaa', 'bbbbbbb');
    expect(v.status).toBe('problem');
    expect(v.latest).toBe(false);
  });
  it('idle for a dev build or unknown main (never a misleading green)', () => {
    expect(freshnessVerdict('dev', 'abc1234').status).toBe('idle');
    expect(freshnessVerdict('abc1234', null).status).toBe('idle');
  });
});

describe('ciVerdict', () => {
  it('green ONLY when CI passed on the served SHA (provenance)', () => {
    const ci = { status: 'good', latest: { sha: 'abc1234', conclusion: 'success' } };
    const v = ciVerdict(ci, 'abc1234');
    expect(v.green).toBe(true);
    expect(v.onServedBuild).toBe(true);
    expect(v.headline).toMatch(/served build/i);
  });
  it('green but NOT on served build when SHAs differ', () => {
    const ci = { status: 'good', latest: { sha: 'newone1', conclusion: 'success' } };
    const v = ciVerdict(ci, 'old1234');
    expect(v.green).toBe(true);
    expect(v.onServedBuild).toBe(false);
  });
  it('failing CI surfaces the failure honestly', () => {
    const ci = { status: 'problem', latest: { sha: 'abc1234', conclusion: 'failure' } };
    const v = ciVerdict(ci, 'abc1234');
    expect(v.green).toBe(false);
    expect(v.headline).toMatch(/failing|did not pass/i);
  });
  it('offline / missing CI is idle, not green', () => {
    expect(ciVerdict(null, 'abc1234').status).toBe('idle');
    expect(ciVerdict(null, 'abc1234').green).toBe(false);
  });
});

describe('rowStatus — existence is not a pass', () => {
  const greenOnServed = { green: true, onServedBuild: true, status: 'good' };
  it('green only with a passing CI run on the served build', () => {
    expect(rowStatus({ verified: true }, greenOnServed).status).toBe('good');
  });
  it('a verified row with no live pass is idle/wired, never green', () => {
    expect(rowStatus({ verified: true }, ciVerdict(null, 'x')).status).toBe('idle');
  });
  it('a failing CI run turns the row amber (in a failing run)', () => {
    const v = ciVerdict({ status: 'problem', latest: { sha: 'a', conclusion: 'failure' } }, 'a');
    expect(rowStatus({ verified: true }, v).status).toBe('attention');
  });
  it('an unverified row (test file missing) is always problem', () => {
    expect(rowStatus({ verified: false }, greenOnServed).status).toBe('problem');
  });
  it('green-in-CI on a DIFFERENT build is idle, not green', () => {
    const v = ciVerdict({ status: 'good', latest: { sha: 'other11', conclusion: 'success' } }, 'served1');
    expect(rowStatus({ verified: true }, v).status).toBe('idle');
  });
});

describe('contrastStatus — carries its own measured verdict', () => {
  it('green when measured + pass', () => {
    expect(contrastStatus({ ok: true, pass: true, themeCount: 5 }).status).toBe('good');
  });
  it('problem when measured + fail', () => {
    expect(contrastStatus({ ok: true, pass: false, violations: [{}, {}] }).status).toBe('problem');
  });
  it('idle when not measured (not a misleading green)', () => {
    expect(contrastStatus({ ok: false }).status).toBe('idle');
    expect(contrastStatus(null).status).toBe('idle');
  });
});

describe('reviewStatus — addressed is the only green', () => {
  it('addressed -> good', () => expect(reviewStatus('addressed').status).toBe('good'));
  it('open -> attention', () => expect(reviewStatus('open').status).toBe('attention'));
  it('logged / unknown -> idle (never green)', () => {
    expect(reviewStatus('logged').status).toBe('idle');
    expect(reviewStatus('').status).toBe('idle');
    expect(reviewStatus(null).status).toBe('idle');
  });
});

describe('reviewFreshness — the registry polices its own staleness (DR-0102)', () => {
  const NOW = Date.parse('2026-07-05T12:00:00Z');
  const reg = (dates) => ({ ok: true, count: dates.length, items: dates.map((d, i) => ({ id: `REV-000${i + 1}`, date: d })) });

  it('CATCHES a silently-aging registry: 20 days since the newest record -> attention/stale', () => {
    const v = reviewFreshness(reg(['2026-06-01', '2026-06-15']), NOW);
    expect(v.stale).toBe(true);
    expect(v.status).toBe('attention');
    expect(v.daysSince).toBe(20);
    expect(v.lastDate).toBe('2026-06-15');
  });
  it('stays quiet on a fresh registry: a record within 7 days -> good', () => {
    const v = reviewFreshness(reg(['2026-06-15', '2026-07-05']), NOW);
    expect(v.stale).toBe(false);
    expect(v.status).toBe('good');
    expect(v.daysSince).toBe(0);
  });
  it('the newest date wins regardless of record order', () => {
    expect(reviewFreshness(reg(['2026-07-04', '2026-05-01']), NOW).lastDate).toBe('2026-07-04');
  });
  it('exactly the threshold is still fresh; one past it is stale', () => {
    expect(reviewFreshness(reg(['2026-06-28']), NOW).stale).toBe(false);
    expect(reviewFreshness(reg(['2026-06-27']), NOW).stale).toBe(true);
  });
  it('undated / empty / missing registry -> idle, never a misleading green', () => {
    expect(reviewFreshness(reg([]), NOW).status).toBe('idle');
    expect(reviewFreshness({ ok: true, items: [{ id: 'REV-0001', date: 'not-a-date' }] }, NOW).status).toBe('idle');
    expect(reviewFreshness(null, NOW).status).toBe('idle');
  });
  it('no real clock -> idle, never green (a freshness claim needs a measurement)', () => {
    const v = reviewFreshness(reg(['2026-07-05']), NaN);
    expect(v.status).toBe('idle');
    expect(v.label).toContain('clock');
  });
});

describe('normalizeManifest / normalizeReviews — null-safe degradation', () => {
  it('degrades a missing manifest to an honest empty shape', () => {
    const m = normalizeManifest(undefined);
    expect(m.ok).toBe(false);
    expect(m.gates).toEqual([]);
    expect(m.loops).toEqual([]);
    expect(m.contrast.pass).toBe(false);
  });
  it('preserves a real manifest', () => {
    const m = normalizeManifest({ ok: true, gates: [{ id: 'g' }], loops: [], contrast: { ok: true, pass: true, themes: ['white'] } });
    expect(m.ok).toBe(true);
    expect(m.gates).toHaveLength(1);
    expect(m.contrast.themeCount).toBe(1);
  });
  it('degrades missing reviews to ok:false', () => {
    expect(normalizeReviews(null).ok).toBe(false);
    expect(normalizeReviews({ ok: true, items: [] }).ok).toBe(false);
  });
  it('normalizes review items to strings', () => {
    const r = normalizeReviews({ ok: true, items: [{ id: 'REV-1', title: 't', status: 'addressed' }] });
    expect(r.ok).toBe(true);
    expect(r.items[0].findings).toBe('');
    expect(r.items[0].status).toBe('addressed');
  });
});
