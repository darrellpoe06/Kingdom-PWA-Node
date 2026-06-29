// =============================================================================
// Bounded auto-resume (cap-resume) — proven-to-catch tests (DR-0071 / DR-0076).
// =============================================================================
// The cap-resume lane resumes ONLY explicitly-approved, queued work after a vendor
// cap/outage resets. The bounded guarantee — "approved-only, no new decisions" —
// is enforced by selectEligible; the cap-reset trigger by capWindowOpen; the count
// half of the budget brake by capCheck. These tests pin each as a real decision and
// fail loudly if the bounded gate ever loosens (a gate that always passes is a lie).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  validateQueueItem,
  validateQueue,
  selectEligible,
  capCheck,
  capWindowOpen,
  localWall,
  QUEUE_STATUSES,
} from '../../../scripts/lib/resume-queue.mjs';

const BUNDLE_REL = 'infra/ai-orchestrator/portable';
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, BUNDLE_REL, 'resume', 'approved-queue.schema.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`bundle resume/approved-queue.schema.json not found upward from ${start}`);
}
const repoRoot = findRepoRoot(process.cwd());
const RESUME_DIR = join(repoRoot, BUNDLE_REL, 'resume');
const schema = JSON.parse(readFileSync(join(RESUME_DIR, 'approved-queue.schema.json'), 'utf8'));
const example = JSON.parse(readFileSync(join(RESUME_DIR, 'example.approved-queue.json'), 'utf8'));

// A minimal valid, APPROVED, pending queue item.
const handoff = () => ({
  v: 1,
  id: 'handoff-resume-0001',
  issued_at: '2026-06-24T02:00:00Z',
  issued_by: 'claude',
  wake_at: { condition: 'cap-reset' },
  lane: 'test-lane',
  task: 'resume the approved thing',
  state_pointer: { kind: 'git-branch', ref: 'feat/x' },
});
const item = (over = {}) => ({ id: 'resume-test-001', approved: true, status: 'pending', handoff: handoff(), ...over });

describe('queue item + queue validation', () => {
  it('a minimal approved+pending item is valid', () => {
    expect(validateQueueItem(item()).ok).toBe(true);
  });
  it('requires approved to be an explicit boolean (no default-true path)', () => {
    const r = validateQueueItem(item({ approved: undefined }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/approved/);
  });
  it('rejects an unknown status', () => {
    expect(validateQueueItem(item({ status: 'maybe' })).ok).toBe(false);
  });
  it('rejects a structurally-bad embedded handoff (reuses the handoff validator)', () => {
    const bad = item(); delete bad.handoff.lane;
    const r = validateQueueItem(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/handoff\.lane/);
  });
  it('rejects a non-ISO not_before', () => {
    expect(validateQueueItem(item({ not_before: 'soon' })).ok).toBe(false);
  });
  it('catches duplicate ids in a queue', () => {
    const q = { v: 1, items: [item(), item()] };
    const r = validateQueue(q);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/duplicate id/);
  });
  it('rejects a wrong queue version', () => {
    expect(validateQueue({ v: 2, items: [] }).ok).toBe(false);
  });
});

describe('selectEligible — THE bounded gate (approved-only, pending-only)', () => {
  const now = Date.parse('2026-06-24T12:00:00Z');

  it('an APPROVED + pending item is eligible', () => {
    const { eligible } = selectEligible({ v: 1, items: [item()] }, now);
    expect(eligible.map((e) => e.id)).toEqual(['resume-test-001']);
  });

  it('proven-to-catch: an UNAPPROVED item is NEVER eligible', () => {
    const q = { v: 1, items: [item({ id: 'unapproved-1', approved: false })] };
    const { eligible, skipped } = selectEligible(q, now);
    expect(eligible).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/not approved/);
  });

  it('proven-to-catch: a DONE item is never resumed again (idempotent)', () => {
    const q = { v: 1, items: [item({ id: 'done-1', status: 'done' })] };
    const { eligible, skipped } = selectEligible(q, now);
    expect(eligible).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/only pending/);
  });

  it('honors a per-item not_before floor even when approved', () => {
    const q = { v: 1, items: [item({ id: 'floored-1', not_before: '2026-06-24T20:00:00Z' })] };
    expect(selectEligible(q, now).eligible).toHaveLength(0);
    expect(selectEligible(q, Date.parse('2026-06-24T21:00:00Z')).eligible).toHaveLength(1);
  });

  it('mixes: only the approved+pending+ready items pass; reasons are logged', () => {
    const q = { v: 1, items: [
      item({ id: 'yes' }),
      item({ id: 'no-approve', approved: false }),
      item({ id: 'no-done', status: 'done' }),
      item({ id: 'no-floor', not_before: '2026-06-24T23:00:00Z' }),
    ] };
    const { eligible, skipped } = selectEligible(q, now);
    expect(eligible.map((e) => e.id)).toEqual(['yes']);
    expect(skipped).toHaveLength(3);
  });
});

describe('capWindowOpen — the cap-reset trigger (timezone-correct, configurable)', () => {
  const cfg = { tz: 'America/Chicago', resetHHMM: '04:30', bufferMin: 10 };
  // 2026-06-24 is CDT (UTC-5): 09:39Z = 04:39 local (>= 04:40? no), 09:41Z = 04:41 local (>= 04:40 yes).
  it('CLOSED just before reset+buffer (03:00 Chicago)', () => {
    const r = capWindowOpen(Date.parse('2026-06-24T08:00:00Z'), cfg); // 03:00 CDT
    expect(r.open).toBe(false);
    expect(r.reason).toMatch(/before cap reset/);
  });
  it('OPEN after reset+buffer (11:00Z = 06:00 Chicago)', () => {
    const r = capWindowOpen(Date.parse('2026-06-24T11:00:00Z'), cfg); // 06:00 CDT
    expect(r.open).toBe(true);
    expect(r.dayKey).toBe('2026-06-24');
  });
  it('proven-to-catch: exactly the buffer boundary gates correctly', () => {
    // 04:39 local CDT = 09:39Z -> below 04:40 -> closed
    expect(capWindowOpen(Date.parse('2026-06-24T09:39:00Z'), cfg).open).toBe(false);
    // 04:40 local CDT = 09:40Z -> at the boundary -> open
    expect(capWindowOpen(Date.parse('2026-06-24T09:40:00Z'), cfg).open).toBe(true);
  });
  it('a malformed reset time is NOT open (never guesses the window)', () => {
    expect(capWindowOpen(Date.parse('2026-06-24T11:00:00Z'), { ...cfg, resetHHMM: 'nope' }).open).toBe(false);
  });
  it('localWall is deterministic given epoch + tz', () => {
    const w = localWall(Date.parse('2026-06-24T11:00:00Z'), 'America/Chicago');
    expect(w).toEqual({ minutes: 6 * 60, dayKey: '2026-06-24' });
  });
});

describe('capCheck — the count half of the budget brake (unset == missing == inert)', () => {
  it('unset caps are a MISSING brake (not ok)', () => {
    expect(capCheck({ maxCallsPerDay: 0, maxTasksPerRun: 0 }).ok).toBe(false);
  });
  it('within caps is ok', () => {
    expect(capCheck({ callsToday: 1, maxCallsPerDay: 10, tasksThisRun: 0, maxTasksPerRun: 3 }).ok).toBe(true);
  });
  it('proven-to-catch: per-run task cap stops the run', () => {
    const r = capCheck({ callsToday: 0, maxCallsPerDay: 10, tasksThisRun: 3, maxTasksPerRun: 3 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/per-run task cap/);
  });
  it('proven-to-catch: daily call cap stops the run', () => {
    const r = capCheck({ callsToday: 10, maxCallsPerDay: 10, tasksThisRun: 0, maxTasksPerRun: 3 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/daily call cap/);
  });
});

describe('shipped schema + example agree with the runtime validator', () => {
  it('the shipped example queue is valid', () => {
    expect(validateQueue(example).ok).toBe(true);
  });
  it('the example demonstrates the gate: it contains BOTH an approved and an unapproved item', () => {
    const approved = example.items.filter((i) => i.approved === true);
    const unapproved = example.items.filter((i) => i.approved === false);
    expect(approved.length).toBeGreaterThanOrEqual(1);
    expect(unapproved.length).toBeGreaterThanOrEqual(1);
    // and selectEligible drops the unapproved one
    const { eligible } = selectEligible(example, Date.parse('2026-06-24T12:00:00Z'));
    expect(eligible.every((e) => e.approved === true)).toBe(true);
    expect(eligible.length).toBe(approved.length);
  });
  it('schema item required list matches what the validator enforces', () => {
    const req = schema.definitions.queueItem.required;
    expect(req).toEqual(expect.arrayContaining(['id', 'approved', 'status', 'handoff']));
    for (const field of ['id', 'approved', 'status', 'handoff']) {
      const bad = item(); delete bad[field];
      expect(validateQueueItem(bad).ok, `dropping ${field} should invalidate`).toBe(false);
    }
  });
  it('status enum matches the schema', () => {
    expect(schema.definitions.queueItem.properties.status.enum).toEqual(QUEUE_STATUSES);
  });
});
