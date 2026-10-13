// =============================================================================
// workflow-list-order-guard — PROVEN-TO-CATCH (DR-0697; LESSONS P62)
// =============================================================================
// 2026-09-30 (#1868, #1870): a filtered runs list answered a 2026-09-06
// deploy as "the latest", and a lesson row went untagged. The guard must catch
// that exact line, pass the head_sha form, and find nothing in the real
// workflows now that every read asks by exact identity.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { findListOrderReads, scanWorkflows, selftest, SELFTEST } from '../../../scripts/workflow-list-order-guard.mjs';

const REPO = join(process.cwd(), '..');

describe('workflow-list-order-guard', () => {
  it('catches the exact line #1868 replaced', () => {
    expect(findListOrderReads(SELFTEST.mustCatch[0]).length).toBe(1);
  });

  it('catches a continuation-line read and a gh run list --limit 1 read', () => {
    expect(findListOrderReads(SELFTEST.mustCatch[1]).length).toBe(1);
    expect(findListOrderReads(SELFTEST.mustCatch[2]).length).toBe(1);
  });

  it('passes asking by head_sha, the max run id, and issue lookups', () => {
    for (const t of SELFTEST.mustPass) expect(findListOrderReads(t), t).toEqual([]);
  });

  it('ignores comments that quote the old form', () => {
    expect(findListOrderReads(`# was: runs?status=success&per_page=1 --jq '.workflow_runs[0].head_sha'`)).toEqual([]);
  });

  it('the selftest agrees', () => {
    expect(selftest().ok).toBe(true);
  });

  it('the real workflows ask by exact identity', () => {
    expect(scanWorkflows(join(REPO, '.github', 'workflows'))).toEqual([]);
  });
});
