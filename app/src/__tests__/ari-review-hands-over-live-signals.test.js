// =============================================================================
// GATE-THE-CLASS — the surface must HAND OVER every live signal it reads
// =============================================================================
// The miss this gates (Darrell 2026-09-05) was not a wrong computation. Every
// piece was individually honest: AriReview already read the workflow registry,
// LoopHealth already assessed the loops, OpsBoard already read the live site.
// The defect lived in the COMPOSITION — the surface read a signal and did not
// hand it to the review, so the comprehensive read answered "how is the app
// doing" without ever consulting the running system, and the headline said
// "clean" while two questions had never been asked.
//
// A behavioural test cannot catch that class: the review is correct for the
// input it is given, and the input is where the signal is dropped. So this gate
// is SOURCE-PINNED — it reads the component and fails if the wiring is removed.
// Pairs with ari-review-workflows-capacity.test.js, which proves the review
// reports unmeasured rather than ok when a signal does not arrive.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVIEW_DIMENSIONS } from '../lib/ari-app-review.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, '..', rel), 'utf8');
const ARI = read('components/AriReview.jsx');
const PROJECTS = read('components/Projects.jsx');
const REVIEW = read('lib/ari-app-review.js');

// The buildAppReview({...}) argument object, so a match cannot be satisfied by
// an unrelated mention elsewhere in the file.
const CALL = (() => {
  const i = ARI.indexOf('buildAppReview({');
  expect(i, 'AriReview must call buildAppReview').toBeGreaterThan(-1);
  return ARI.slice(i, ARI.indexOf('Date.now())', i));
})();

describe('AriReview hands the live signals to the review', () => {
  it('passes the workflow registry as a reviewed signal, not only as fleet brake input', () => {
    expect(CALL).toMatch(/\bworkflows:/);
    // The pre-existing brake path must still be there — this dimension adds to
    // it, it does not replace it.
    expect(CALL).toMatch(/fleet: fleetOversight\(/);
  });

  it('passes the assessed data loops', () => {
    expect(CALL).toMatch(/\bloops,|\bloops:/);
    expect(ARI, 'assessed with the same engine LoopHealth uses').toMatch(/assessLoops\(/);
    expect(ARI, 'with the real run records, as LoopHealth reads them').toMatch(/readLoopRuns\(/);
  });

  it('passes the outside-in live site read', () => {
    expect(CALL).toMatch(/\bsite,|\bsite:/);
    expect(ARI, 'read with the same client OpsBoard uses').toMatch(/fetchSiteHealth\(/);
  });

  it('treats an EMPTY loopData as unmeasured, never as a fleet of dead loops', () => {
    // Projects defaults loopData to {}, which is truthy. Assessing it would
    // manufacture "never updated" findings that are artifacts of missing input.
    expect(ARI).toMatch(/Object\.keys\(loopData\)\.length === 0/);
  });

  it('Projects hands down the loop data it already held', () => {
    const mount = PROJECTS.slice(PROJECTS.indexOf('<AriReview'), PROJECTS.indexOf('/>', PROJECTS.indexOf('<AriReview')));
    expect(mount).toMatch(/loopData=\{loopData\}/);
    expect(mount).toMatch(/financialDocAt=\{financialDocAt\}/);
  });
});

describe('the review keeps a home for every signal it accepts', () => {
  it('buildAppReview destructures the three signals', () => {
    const sig = REVIEW.slice(REVIEW.indexOf('export function buildAppReview'), REVIEW.indexOf('const raw = ['));
    for (const key of ['workflows', 'loops', 'site']) {
      expect(sig, `buildAppReview must accept ${key}`).toMatch(new RegExp(`\\b${key}\\b`));
    }
  });

  it('every declared dimension is actually run — a dimension cannot be declared and orphaned', () => {
    const raw = REVIEW.slice(REVIEW.indexOf('const raw = ['), REVIEW.indexOf('];', REVIEW.indexOf('const raw = [')));
    for (const [key] of REVIEW_DIMENSIONS) {
      // reviewDelivery / reviewPlan / … — the dimension's producer must appear
      // in the composed list, so adding a row to REVIEW_DIMENSIONS without
      // wiring it fails here instead of rendering an empty card.
      const fn = `review${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      const alt = { reviews: 'reviewFreshness' }[key];
      expect(raw.includes(fn) || (alt && raw.includes(alt)), `dimension "${key}" is declared but never run`).toBe(true);
    }
  });

  it('the surface copy tells the truth about what the review now reads (surface-says-truth)', () => {
    // The header used to say only "the app's own records" — true before this
    // change, and an under-description the moment the live system was added.
    expect(ARI).toMatch(/and over the running system itself/);
    expect(ARI).toMatch(/reported as unmeasured rather than counted as clear/);
  });
});
