// =============================================================================
// ops-commands — guards for the app-first operations queue (DR-0088)
// =============================================================================
// The whole point of the queue is that a button in the app RELIABLY becomes an
// executed job on the NAS. That crosses three seams — the lib (insert), the
// table (0068), and the runner (whitelist) — and each seam can silently drift.
// PROVEN-TO-CATCH (DR-0076): these guards go RED if a job is offered in the
// app that the runner would skip, if the lib stops writing the columns RLS
// keys on, or if the surface stops gating the card on the steward role.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { toCommandShape, runnerHint, OPS_JOBS, STALE_QUEUED_MS } from '../lib/ops-commands.js';

const here = dirname(fileURLToPath(import.meta.url));
const libSrc = readFileSync(join(here, '../lib/ops-commands.js'), 'utf8');
const surfaceSrc = readFileSync(join(here, '../components/HarvestLedger.jsx'), 'utf8');
const runnerSrc = readFileSync(join(here, '../../../infra/nas-sme-pipeline/ops-runner.py'), 'utf8');
const migrationSrc = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0068-ops-commands.sql'), 'utf8');

describe('toCommandShape', () => {
  it('maps a full row and defaults the gaps honestly', () => {
    const c = toCommandShape({
      id: 'x', job: 'transcript-backfill', params: { max: 10 }, status: 'done',
      log: 'ok', result: { exit: 0 }, created_at: 't1', started_at: 't2', finished_at: 't3',
    });
    expect(c).toEqual({
      id: 'x', job: 'transcript-backfill', params: { max: 10 }, status: 'done',
      log: 'ok', result: { exit: 0 }, createdAt: 't1', startedAt: 't2', finishedAt: 't3',
    });
    const bare = toCommandShape({ id: 'y', job: 'z' });
    expect(bare.status).toBe('queued');
    expect(bare.params).toEqual({});
    expect(bare.log).toBeNull();
    expect(bare.result).toBeNull();
  });
});

describe('runnerHint — the honest "is the NAS runner alive?" signal', () => {
  const now = Date.parse('2026-07-03T12:00:00Z');
  const at = (msAgo) => new Date(now - msAgo).toISOString();
  it('is null with nothing pending', () => {
    expect(runnerHint([], now)).toBeNull();
    expect(runnerHint([{ status: 'done', createdAt: at(0) }], now)).toBeNull();
  });
  it('reports running while a command executes', () => {
    expect(runnerHint([{ status: 'running', createdAt: at(0) }], now)).toBe('running');
  });
  it('reports queued fresh, then queued-stale past the threshold (runner likely offline)', () => {
    expect(runnerHint([{ status: 'queued', createdAt: at(60_000) }], now)).toBe('queued');
    expect(runnerHint([{ status: 'queued', createdAt: at(STALE_QUEUED_MS + 60_000) }], now)).toBe('queued-stale');
  });
});

describe('the three seams stay wired', () => {
  it('every job the app offers exists in the NAS runner whitelist', () => {
    for (const job of Object.keys(OPS_JOBS)) {
      expect(runnerSrc, `runner JOBS must contain '${job}'`).toMatch(new RegExp(`["']${job}["']\\s*:`));
    }
  });
  it('the lib writes the columns RLS keys on (instance_id + requested_by) into ops_commands', () => {
    expect(libSrc).toMatch(/from\('ops_commands'\)/);
    expect(libSrc).toMatch(/instance_id:\s*ctx\.tenantId/);
    expect(libSrc).toMatch(/requested_by:\s*ctx\.userId/);
  });
  it('the migration walls the table to owner/admin and streams it (realtime)', () => {
    expect(migrationSrc).toMatch(/user_role_in_instance\(instance_id\) IN \('owner','admin'\)/);
    expect(migrationSrc).not.toMatch(/TO anon/);
    expect(migrationSrc).toMatch(/ALTER PUBLICATION supabase_realtime ADD TABLE ops_commands/);
  });
  it('the Harvest surface renders the admin card only for stewards (canEdit)', () => {
    expect(surfaceSrc).toMatch(/access\?\.canEdit && <OpsAdminCard \/>/);
  });
  it('cancel only touches still-queued rows (race with the runner is a no-op)', () => {
    expect(libSrc).toMatch(/\.eq\('status',\s*'queued'\)/);
  });
});
