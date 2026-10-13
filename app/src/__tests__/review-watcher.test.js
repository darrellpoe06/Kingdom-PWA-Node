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

// =============================================================================
// The report has to be ACTIONABLE, and the brake must not choose the finding
// (2026-09-08). Both cases below were observed on the real repo before the fix:
// a drive report where five overdue rows rendered identically, and a ceiling
// that withheld 99 commitments picked by scan order rather than urgency.
// =============================================================================

// One record carrying several OPEN commitments that share a date — the exact
// shape of docs/decisions/INDEX.md, which had five for 2026-08-25.
const SAME_DATE_SIBLINGS = { items: [
  { id: 'INDEX.md', title: 'Decision ledger index',
    findings: [
      'Tenancy guard soak on the church surfaces — re-review: 2026-07-01.',
      'Funnel throttle measurement on the photo route — re-review: 2026-07-01.',
      'Reading-ladder debt for the senior band — re-review: 2026-07-01.',
    ].join('\n'), source: 'docs/decisions/INDEX.md' },
] };

describe('the drive report names WHICH commitment, not just which file', () => {
  it('renders same-date siblings as distinguishable rows — three commitments, three different lines', () => {
    const r = runReviewWatch({ reviews: SAME_DATE_SIBLINGS, store: memoryStore(), nowMs: NOW });
    expect(r.report.counts.overdue).toBe(3);
    const md = formatWatchReport(r.report);
    // Each commitment is identifiable by its own clause, so a reader can act.
    expect(md).toMatch(/tenancy guard soak/i);
    expect(md).toMatch(/funnel throttle measurement/i);
    expect(md).toMatch(/reading-ladder debt/i);
    // PROVEN TO CATCH: the pre-fix report was sourceId + status + date + source
    // only. Rebuild that line here and assert it is NOT what ships — identical
    // text for all three is precisely the unreadable report this pins against.
    const bare = r.report.overdue.map((it) => `- **${it.sourceId}** · overdue · due ${it.date} · ${it.source}`);
    expect(new Set(bare).size).toBe(1);        // the old shape collapsed to ONE row
    const shipped = md.split('\n').filter((l) => l.startsWith('  - ')); // the detail sub-lines
    expect(shipped).toHaveLength(3);
    expect(new Set(shipped).size).toBe(3);     // the shipped shape keeps all three
  });
});

describe('BRAKE budget: it bounds the WORK, it never biases the FINDING', () => {
  // An overdue item deliberately placed LAST in scan order, behind enough
  // far-future items to exhaust a small ceiling. Pre-fix, the ceiling dropped
  // it and the report read clean while a real overdue commitment was withheld.
  const BURIED_OVERDUE = { items: [
    { id: 'DR-9101', title: 'Far A', status: 'accepted', decision: 'Later. re-review: 2026-12-01.' },
    { id: 'DR-9102', title: 'Far B', status: 'accepted', decision: 'Later. re-review: 2026-12-02.' },
    { id: 'DR-9103', title: 'Far C', status: 'accepted', decision: 'Later. re-review: 2026-12-03.' },
    { id: 'DR-9104', title: 'Buried overdue', status: 'accepted', decision: 'Parked with why. re-review: 2026-06-01.' },
  ] };

  it('a truncated run keeps the OVERDUE item and drops a far-future one', () => {
    const r = runReviewWatch({ decisions: BURIED_OVERDUE, store: memoryStore(), nowMs: NOW, limits: { maxItems: 2 } });
    expect(r.ok).toBe(true);
    expect(r.report.counts.truncated).toBe(2);
    expect(r.report.counts.overdue).toBe(1);
    expect(r.report.overdue[0].sourceId).toBe('DR-9104'); // survived despite being last in scan order
  });

  it('the ceiling itself is unchanged — same units spent, and the truncation still SAYS so', () => {
    const r = runReviewWatch({ decisions: BURIED_OVERDUE, store: memoryStore(), nowMs: NOW, limits: { maxItems: 2 } });
    expect(r.report.counts.scanned).toBe(2);
    expect(r.report.counts.total).toBe(4);
    expect(formatWatchReport(r.report)).toMatch(/not scanned this run/);
  });

  it('an unbounded run reports every commitment — the fix changes ORDER, never coverage', () => {
    const r = runReviewWatch({ decisions: BURIED_OVERDUE, store: memoryStore(), nowMs: NOW });
    expect(r.report.counts.scanned).toBe(4);
    expect(r.report.counts.truncated).toBe(0);
    expect(r.report.truncatedNote).toBeNull();
  });
});

describe('the default ceiling is itself pinned', () => {
  // Found 2026-09-08 while proving the two fixes above: mutating the default
  // maxItems from 500 to 100000 broke NO test. That is the tempting wrong fix
  // for a truncated run — raise the ceiling until the truncation note goes away
  // — and it is the exact brake-weakening P10 / DR-0225 forbid. The ceiling is
  // now behaviour, not a comment: widening it has to be a deliberate, visible
  // edit to this expectation.
  const many = { items: Array.from({ length: 501 }, (_, i) => ({
    id: `DR-${8000 + i}`, title: `Item ${i}`, status: 'accepted',
    decision: `Parked ${i}. re-review: 2026-12-01.`,
  })) };

  it('a run with NO limits still stops at 500 items and says what it did not scan', () => {
    const r = runReviewWatch({ decisions: many, store: memoryStore(), nowMs: NOW });
    expect(r.ok).toBe(true);
    expect(r.report.counts.total).toBe(501);
    expect(r.report.counts.scanned).toBe(500);
    expect(r.report.counts.truncated).toBe(1);
    expect(r.report.truncatedNote).toMatch(/1 item\(s\) not scanned/);
  });
});

// =============================================================================
// The ceiling must not answer questions about the backlog (2026-09-08, found by
// measuring the real repo unbounded). Two further defects, both the same shape
// as the spend-order one: a brake deciding what the reader learns.
// =============================================================================
describe('a truncated run still reports the TRUE totals', () => {
  // 6 overdue + 3 due-soon, against a ceiling of 4.
  const MANY = { items: [
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `DR-71${i}`, title: `Old ${i}`, status: 'accepted',
      decision: `Parked. re-review: 2026-06-0${i + 1}.`,
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `DR-72${i}`, title: `Soon ${i}`, status: 'accepted',
      decision: `Deferred. re-review: 2026-07-2${i + 4}.`,
    })),
  ] };
  // NOW sits so the 2026-06-0x dates are past and the 2026-07-2x are within 7d.
  const AT = Date.parse('2026-07-23T12:00:00Z');

  it('counts every overdue item, not just the ones the ceiling could list', () => {
    const r = runReviewWatch({ decisions: MANY, store: memoryStore(), nowMs: AT, limits: { maxItems: 4 } });
    expect(r.report.counts.overdue).toBe(6);       // the truth
    expect(r.report.counts.overdueShown).toBeLessThan(6); // what fitted
    // PROVEN TO CATCH: pre-fix, counts.overdue WAS the shown length. If the two
    // are ever the same under truncation, the ceiling is answering again.
    expect(r.report.counts.overdue).not.toBe(r.report.counts.overdueShown);
  });

  it('says so in the report rather than letting the listed rows read as the whole truth', () => {
    const md = formatWatchReport(runReviewWatch({
      decisions: MANY, store: memoryStore(), nowMs: AT, limits: { maxItems: 4 },
    }).report);
    expect(md).toMatch(/\*\*Overdue \(6\)\*\* — showing the \d+ most urgent/);
  });
});

describe('the ceiling never erases a whole category', () => {
  // 502 overdue and 27 due-soon against a ceiling of 500 — the real repo's
  // shape, where the pull-forward section rendered EMPTY and nothing said so.
  const REAL_SHAPE = { items: [
    ...Array.from({ length: 502 }, (_, i) => ({
      id: `DR-8${i}`, title: `Overdue ${i}`, status: 'accepted',
      decision: `Parked ${i}. re-review: 2026-06-01.`,
    })),
    ...Array.from({ length: 27 }, (_, i) => ({
      id: `DR-9${i}`, title: `Soon ${i}`, status: 'accepted',
      decision: `Deferred ${i}. re-review: 2026-07-26.`,
    })),
  ] };
  const AT = Date.parse('2026-07-23T12:00:00Z');

  it('due-soon items are listed even when overdue alone would consume the ceiling', () => {
    const r = runReviewWatch({ decisions: REAL_SHAPE, store: memoryStore(), nowMs: AT });
    expect(r.report.counts.overdue).toBe(502);
    expect(r.report.counts.dueSoon).toBe(27);
    expect(r.report.dueSoon.length).toBe(27);   // the whole category survives
    expect(r.report.overdue.length).toBeGreaterThan(400); // overdue still dominates
    expect(r.report.counts.scanned).toBe(500);  // ceiling unchanged
  });

  it('the floor returns what it does not need — a run with few due-soon is unaffected', () => {
    const few = { items: [
      ...Array.from({ length: 502 }, (_, i) => ({
        id: `DR-A${i}`, title: `Overdue ${i}`, status: 'accepted',
        decision: `Parked ${i}. re-review: 2026-06-01.`,
      })),
      { id: 'DR-B1', title: 'Soon', status: 'accepted', decision: 'Deferred. re-review: 2026-07-26.' },
    ] };
    const r = runReviewWatch({ decisions: few, store: memoryStore(), nowMs: AT });
    expect(r.report.dueSoon.length).toBe(1);
    expect(r.report.overdue.length).toBe(499); // the other 99 units all went to overdue
  });
});
