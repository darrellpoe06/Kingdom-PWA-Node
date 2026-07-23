// =============================================================================
// review-watcher.test.js — the watcher proven to run, and its brakes proven
// to CATCH (DR-0076 §3). Each runaway is staged first, then the brake pinned.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  runReviewWatch, formatWatchReport, WATCHER_NAME, MAX_CONSECUTIVE_FAILURES,
  REVIEW_WATCHER_MEMBER,
} from '../lib/review-watcher.js';
import { memoryStore, acquireLock, killSwitch, fleetOversight, BRAKE_DECLARATIONS } from '../lib/agent-brakes.js';

const NOW = Date.parse('2026-07-23T12:00:00Z');

// Real-shaped DR-ledger rows: the re-review dates live as literal prose, the
// exact form extractReReviews scans (nothing invented).
const DECISIONS = { items: [
  { id: 'DR-9001', title: 'Old parked item', status: 'accepted', decision: 'Parked with why. re-review: 2026-07-01.' },
  { id: 'DR-9002', title: 'Near item', status: 'accepted', decision: 'Deferred. re-review: 2026-07-28.' },
  { id: 'DR-9003', title: 'Far item', status: 'accepted', decision: 'Later. re-review: 2026-12-01.' },
] };

describe('runReviewWatch — drives the review sequence from the real ledgers', () => {
  it('reports overdue (act now) and due-soon (pull forward), each naming its source record', () => {
    const r = runReviewWatch({ decisions: DECISIONS, store: memoryStore(), nowMs: NOW });
    expect(r.ok).toBe(true);
    expect(r.report.counts.overdue).toBe(1);
    expect(r.report.overdue[0].sourceId).toBe('DR-9001'); // 2026-07-01 is past
    expect(r.report.counts.dueSoon).toBe(1);              // 2026-07-28 is within 7d
    expect(r.report.dueSoon[0].sourceId).toBe('DR-9002');
    const md = formatWatchReport(r.report);
    expect(md).toMatch(/DR-9001/);
    expect(md).toMatch(/act now/);
  });

  it('BRAKE lock: a concurrent fire SKIPS while a run holds the lock — never stacks', () => {
    const store = memoryStore();
    acquireLock(store, WATCHER_NAME, { nowMs: NOW, holder: 'other-run' });
    const r = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 1000 });
    expect(r.skipped).toBe(true);
    expect(r.report).toBeNull();
  });

  it('BRAKE kill-switch: a paused watcher does NO work and stays paused', () => {
    const store = memoryStore();
    killSwitch(store, WATCHER_NAME, { nowMs: NOW }).trip('governor hold');
    const r = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 1000 });
    expect(r.paused).toBe(true);
    expect(r.reason).toMatch(/governor hold/);
    // still paused on a later fire — no auto-resume (P11)
    expect(runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 99999 }).paused).toBe(true);
  });

  it('BRAKE budget: the item ceiling truncates the scan and SAYS so — no silent cap', () => {
    const r = runReviewWatch({ decisions: DECISIONS, store: memoryStore(), nowMs: NOW, limits: { maxItems: 2 } });
    expect(r.ok).toBe(true);
    expect(r.report.counts.scanned).toBe(2);
    expect(r.report.counts.truncated).toBe(1);
    expect(formatWatchReport(r.report)).toMatch(/not scanned this run/);
  });

  it('BRAKE repeated-failure: the Nth straight failure TRIPS the switch; success resets the streak', () => {
    const store = memoryStore();
    const boom = () => { throw new Error('ledger unreadable'); };
    for (let i = 1; i < MAX_CONSECUTIVE_FAILURES; i++) {
      const r = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + i, extract: boom });
      expect(r.failed).toBe(true);
      expect(r.tripped).toBe(false);
    }
    const last = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 10, extract: boom });
    expect(last.tripped).toBe(true);
    // now paused: even a healthy extractor is refused until an attributed reset
    expect(runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 20 }).paused).toBe(true);
    killSwitch(store, WATCHER_NAME, { nowMs: NOW + 30 }).reset('darrell', NOW + 30);
    const healthy = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 40 });
    expect(healthy.ok).toBe(true);
    // a lone failure after recovery does not trip (streak was reset)
    const oneFail = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 50, extract: boom });
    expect(oneFail.consecutiveFailures).toBe(1);
    expect(oneFail.tripped).toBe(false);
  });

  it('a failed run releases the lock — a wreck never wedges the next fire', () => {
    const store = memoryStore();
    runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW, extract: () => { throw new Error('x'); } });
    const next = runReviewWatch({ decisions: DECISIONS, store, nowMs: NOW + 1000 });
    expect(next.ok).toBe(true); // lock was released in finally
  });
});

describe('the watcher on Ari\'s fleet board', () => {
  it('is declared with all three brakes and self-describes braked + ACTIVE with its why', () => {
    const decl = BRAKE_DECLARATIONS[WATCHER_NAME];
    expect(decl).toBeTruthy();
    expect(decl.budget && decl.lock && decl.kill).toBe(true);
    const o = fleetOversight({ workflows: [], agents: [REVIEW_WATCHER_MEMBER] });
    const m = o.members.find((x) => x.id === WATCHER_NAME);
    expect(m.braked).toBe(true);
    // ACTIVE since 2026-07-23 — daily schedule activated on watched proof
    // run 30014172152 (DR-0225 activate-on-proof).
    expect(m.active).toBe(true);
    expect(m.whyRecorded).toBe(true);
    expect(o.counts.braked).toBe(1);
    expect(o.counts.activeUnbraked).toBe(0); // active AND braked raises nothing (P10 satisfied)
  });
});
