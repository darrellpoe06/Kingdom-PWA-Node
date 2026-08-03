// @vitest-environment node
//
// corpus-freshness-pins — the two structural fixes from the 2026-08-03
// harvest-process review (REV-0227 / DR-0267) cannot silently revert:
//
//   1. THE SCHEDULE: corpus-reconcile.yml fires on a cron, not dispatch-only.
//      The dispatch-only kill brake left the corpus frozen at the 2026-07-10
//      reconcile — ~4 weeks of services never imported because no human
//      dispatched. A PR that drops the schedule block goes red here, so
//      un-arming the freshness loop is a visible decision, never a drift.
//
//   2. THE STREAMS TAB: choir-youtube-backfill.mjs lists /streams alongside
//      /videos. Every pre-2026-08-03 listing was /videos-only, which is
//      structurally blind to a channel whose services land as live streams —
//      the exact "BG should have double" gap. A revert to single-tab goes red.
//
// Same content-pin pattern as started-by-record.test.js: read the real files,
// assert the load-bearing lines. Proven-to-catch: each assertion fails on the
// exact regression it names (verified by inverting against the pre-fix text).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const WORKFLOW = readFileSync(join(ROOT, '.github/workflows/corpus-reconcile.yml'), 'utf-8');
const BACKFILL = readFileSync(join(ROOT, 'scripts/choir-youtube-backfill.mjs'), 'utf-8');

describe('corpus-reconcile stays scheduled (freshness is armed by record)', () => {
  it('carries a schedule trigger with a real cron line', () => {
    expect(WORKFLOW).toMatch(/^\s*schedule:\s*$/m);
    expect(WORKFLOW).toMatch(/^\s*-\s*cron:\s*'[^']+'\s*$/m);
  });
  it('keeps workflow_dispatch too (a hand-run stays possible)', () => {
    expect(WORKFLOW).toMatch(/workflow_dispatch:/);
  });
  it('keeps the concurrency lock (a second fire queues, never stacks)', () => {
    expect(WORKFLOW).toMatch(/concurrency:/);
    expect(WORKFLOW).toMatch(/group:\s*corpus-reconcile/);
  });
});

describe('the backfill lists BOTH channel tabs (streams are half the corpus)', () => {
  it('the default tab set includes videos AND streams', () => {
    const m = BACKFILL.match(/TAB_NAMES\s*=\s*\[([^\]]*)\]/);
    expect(m, 'TAB_NAMES constant must exist').toBeTruthy();
    expect(m[1]).toContain("'videos'");
    expect(m[1]).toContain("'streams'");
  });
  it('a failed /videos listing still throws (honest red, never a smaller corpus)', () => {
    expect(BACKFILL).toMatch(/tab === 'videos'.*throw e|throw e.*tab === 'videos'/s);
  });
});
