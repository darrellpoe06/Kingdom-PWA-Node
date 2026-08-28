// =============================================================================
// A merged migration always gets applied — the lane, gated
// =============================================================================
// THE INCIDENT (2026-08-28, measured on run 33137488317, the merge of #1361).
// A GITHUB_TOKEN merge fires no push workflows (DR-0107 / LESSONS P25), so
// auto-merge.yml dispatches both the deploy and db-migrate itself. Both waits
// are SEQUENTIAL steps in ONE job, so the migration poll always gets the first
// window and the deploy poll a later one:
//
//   migration poll   02:58:03 -> 03:04:30   (6m27s, gave up)
//   deploy poll      03:04:30 -> 03:06:56   (caught the merge)
//   the merge                   03:06:50
//
// The deploy landed and the migration did not — new code live against a database
// that never got its schema. And it was the P26 class twice over: the deploy
// step's own window had been raised 6 -> 12 minutes in July for exactly this
// reason, sixty lines up in the same file, and the migration step was left at 6.
//
// These are the properties that keep it closed. They read the real workflow
// files, so deleting the fix fails the build rather than quietly re-opening a
// gap whose symptom is invisible until somebody queries the database by hand.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const wf = (name) => join(process.cwd(), '..', '.github/workflows', name);
const read = (name) => readFileSync(wf(name), 'utf8');

describe('auto-merge — the migration question is asked after the deploy wait', () => {
  const src = read('auto-merge.yml');

  it('still dispatches db-migrate at all', () => {
    expect(src).toMatch(/gh workflow run db-migrate\.yml/);
  });

  it('asks a SECOND time, after the deploy step (the ordering hole)', () => {
    const firstMigrate = src.indexOf('Apply migrations if main');
    const deploy = src.indexOf("Deploy main's tip if it isn't the last-deployed commit");
    const recheck = src.indexOf('Re-check for a migration once the deploy wait has resolved');
    expect(firstMigrate).toBeGreaterThan(-1);
    expect(deploy).toBeGreaterThan(firstMigrate);
    // The whole point: the re-check must come AFTER the deploy wait, or it
    // inherits the same too-early window it exists to compensate for.
    expect(recheck).toBeGreaterThan(deploy);
  });

  it('dispatches at least twice across the job', () => {
    const hits = src.match(/gh workflow run db-migrate\.yml/g) || [];
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it('never treats an unreadable answer as "no migration"', () => {
    // DR-0076 §8: unknown freshness must not read as fresh. A failed API read
    // has to fall through to the cron, not silently conclude all-clear.
    const step = src.slice(src.indexOf('Re-check for a migration once the deploy wait has resolved'));
    expect(step).toContain('unknown');
    expect(step).toMatch(/could not tell whether main's tip carries a migration/);
  });

  it('does not re-dispatch when db-migrate already ran against this tip', () => {
    const step = src.slice(src.indexOf('Re-check for a migration once the deploy wait has resolved'));
    expect(step).toMatch(/\[ "\$main_sha" = "\$last_sha" \]/);
  });

  it('the job may still write actions, or no dispatch can happen', () => {
    expect(src).toMatch(/actions: write/);
  });
});

describe('migrate-freshness — the outer net a poll window can never be', () => {
  it('exists at all', () => {
    // The last merge in a quiet stretch has NO following PR event, so no poll
    // inside a PR-event workflow can reach it. Only a schedule can.
    expect(existsSync(wf('migrate-freshness.yml'))).toBe(true);
  });

  const src = existsSync(wf('migrate-freshness.yml')) ? read('migrate-freshness.yml') : '';

  it('runs on a schedule, not only on demand', () => {
    expect(src).toMatch(/schedule:/);
    expect(src).toMatch(/cron: '\*\/5 \* \* \* \*'/);
    expect(src).toMatch(/workflow_dispatch/);
  });

  it('carries the three brakes the timer-driven class requires', () => {
    expect(src).toMatch(/concurrency:\s*\n\s*group: migrate-freshness/);   // LOCK
    expect(src).toMatch(/cancel-in-progress: false/);                       // never abandon a half-run
    expect(src).toMatch(/timeout-minutes:/);                               // BUDGET
    expect(src).toMatch(/MIGRATE_FRESHNESS_ENABLED != 'false'/);           // KILL
  });

  it('dispatches when the repo has moved past what the lane last applied', () => {
    expect(src).toMatch(/gh workflow run db-migrate\.yml/);
    expect(src).toMatch(/db-migrate\.yml\/runs\?status=success/);
  });

  it('compares the migration files themselves, not just the commit sha', () => {
    // main advancing is not the question — a doc-only commit must be a no-op,
    // and an EDIT to an existing migration must NOT be. Blob SHAs answer both.
    expect(src).toMatch(/contents\/infra\/supabase\/migrations-auto\?ref=/);
    expect(src).toMatch(/\.sha/);
    expect(src).toMatch(/no migration changed — nothing to apply/);
  });

  it('dispatches rather than assuming, when it cannot read', () => {
    // Same DR-0076 §8 rule as above: a failed read is not an all-clear. Safe,
    // because db-migrate is idempotent by house rule.
    expect(src).toMatch(/UNREADABLE/);
    expect(src).toMatch(/dispatching rather than assuming/);
  });

  it('counts only SUCCESSFUL db-migrate runs as "applied"', () => {
    // A red lane means production is behind the repo — precisely when this
    // should fire, not stand down.
    expect(src).toMatch(/status=success/);
    expect(src).toMatch(/A failed run is/);
  });

  it('does not stack migrations against one cloud database', () => {
    // Two DDL runs at once deadlock on shared catalogs (observed 2026-07-01).
    // This file locks, and db-migrate holds its own group as well.
    expect(read('db-migrate.yml')).toMatch(/group: db-migrate/);
    expect(src).toMatch(/group: migrate-freshness/);
  });
});

describe('the two nets do not depend on the same failure mode', () => {
  it('one is event-driven and one is time-driven', () => {
    const auto = read('auto-merge.yml');
    const fresh = read('migrate-freshness.yml');
    expect(auto).toMatch(/pull_request/);
    expect(auto).not.toMatch(/cron:/);        // auto-merge never runs on a clock
    expect(fresh).toMatch(/cron:/);
    // If the PR-event net misses (window closed, or no event at all), the clock
    // still fires; if schedules are throttled on a busy repo, the event net has
    // already asked twice.
  });
});
