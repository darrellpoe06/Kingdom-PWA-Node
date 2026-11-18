// money-readiness.test.js — FOS Money Phase 1.4: the house says whether the
// migration's preconditions hold, with no key (DR-1360; migration 0334).
import { describe, it, expect } from 'vitest';
import { judgeReadiness, readMoneyReadiness } from '../lib/money-readiness.js';

const NOW = new Date('2026-11-18T12:00:00Z');
const GOOD = {
  transactions_columns: { outstanding: false, cleared_on: false, pending: false, source: false, doc_id: false, category: true },
  category_check: false,
  transactions_rls: true,
  obligations_table: true,
  obligation_settlements_table: true,
  backup: {
    seen: true,
    readable: true,
    ok: true,
    at: '2026-11-18T08:00:00Z',
    toc_entries: 4321,
    kept: 14,
    last_drill_at: '2026-11-16T08:05:00Z',
    drill: { verdict: 'passed', tables: 210, tables_live: 210 },
  },
};

describe('may the Phase 1.4 migration be applied?', () => {
  it('a fresh verified backup and a recent passing drill: ready', () => {
    const j = judgeReadiness(GOOD, NOW);
    expect(j.ready).toBe(true);
    expect(j.steps.find((s) => s.key === 'backup').line).toMatch(/Verified backup 4 hours ago/);
    expect(j.steps.find((s) => s.key === 'schema').line).toBe('The Phase 1.4 columns are not applied yet.');
  });
  it('no receipt, no backup row, or an unreadable one: never ready (PROVEN TO CATCH: unknown never reads as confirmed)', () => {
    expect(judgeReadiness(null, NOW).ready).toBe(false);
    expect(judgeReadiness({ ...GOOD, backup: { seen: false } }, NOW).ready).toBe(false);
    expect(judgeReadiness({ ...GOOD, backup: { seen: true, readable: false } }, NOW).ready).toBe(false);
  });
  it('a stale or failed backup, or a failed or old drill: not ready, and says which', () => {
    expect(judgeReadiness({ ...GOOD, backup: { ...GOOD.backup, at: '2026-11-15T08:00:00Z' } }, NOW).steps.find((s) => s.key === 'backup').line).toMatch(
      /76 hours old/
    );
    expect(judgeReadiness({ ...GOOD, backup: { ...GOOD.backup, ok: false, error: true } }, NOW).ready).toBe(false);
    expect(judgeReadiness({ ...GOOD, backup: { ...GOOD.backup, drill: { verdict: 'failed' } } }, NOW).steps.find((s) => s.key === 'drill').line).toMatch(
      /FAILED/
    );
    expect(judgeReadiness({ ...GOOD, backup: { ...GOOD.backup, last_drill_at: '2026-11-01T00:00:00Z' } }, NOW).ready).toBe(false);
  });
  it('a database rule on categories blocks the Tithes category until it includes it', () => {
    const j = judgeReadiness({ ...GOOD, category_check: true }, NOW);
    expect(j.ready).toBe(false);
    expect(j.steps.find((s) => s.key === 'category-check').line).toMatch(/tithes/);
  });
  it('says when the obligations tables are not live', () => {
    expect(judgeReadiness({ ...GOOD, obligations_table: false }, NOW).steps.find((s) => s.key === 'obligations').live).toBe(false);
  });
  it('reads through the app client and never throws', async () => {
    expect(await readMoneyReadiness({ rpc: async (name) => ({ data: name === 'money_readiness_receipt' ? GOOD : null, error: null }) })).toEqual({
      receipt: GOOD,
      error: null,
    });
    expect(await readMoneyReadiness({ rpc: async () => ({ data: null, error: { message: 'function not found' } }) })).toEqual({
      receipt: null,
      error: 'function not found',
    });
    expect(
      (
        await readMoneyReadiness({
          rpc: async () => {
            throw new Error('offline');
          },
        })
      ).error
    ).toBe('offline');
    expect((await readMoneyReadiness(null)).error).toBe('no database client');
  });
});

describe("the backup receipt rider's own Python tests run in CI", () => {
  // infra/nas-loops/test_db_backup_receipt.py runs here, inside the required
  // vitest job, the way DR-1399 runs test_heartbeat.py: a gate nothing runs
  // is not a gate.
  it('python3 -m unittest test_db_backup_receipt passes', { timeout: 30000 }, async () => {
    const { spawn } = await import('node:child_process');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const r = await new Promise((resolve) => {
      const child = spawn('python3', ['-m', 'unittest', 'test_db_backup_receipt'], { cwd: join(root, 'infra', 'nas-loops') });
      let out = '';
      child.stdout.on('data', (d) => (out += d));
      child.stderr.on('data', (d) => (out += d));
      child.on('close', (code) => resolve({ code, out }));
    });
    expect(r.out).toMatch(/Ran 5 tests/);
    expect(r.code, r.out).toBe(0);
  });
});

describe('the migrations are proven on a throwaway PostgreSQL, in CI', () => {
  // scripts/readiness-receipt-replay.sh (migration 0334: anon gets only
  // whitelisted facts) and scripts/money-migration-replay.sh (the staged Phase
  // 1.4 columns: additive, idempotent, reversible, when present on the branch).
  // Each starts its own PostgreSQL on a unix socket and deletes it on exit.
  const run = async (script) => {
    const { spawn } = await import('node:child_process');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const { existsSync } = await import('node:fs');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    if (!existsSync(join(root, 'scripts', script))) return { skipped: 'not on this branch' };
    return new Promise((resolve) => {
      const child = spawn('bash', [join(root, 'scripts', script)], { cwd: root });
      let out = '';
      child.stdout.on('data', (d) => (out += d));
      child.stderr.on('data', (d) => (out += d));
      child.on('close', (code) => resolve({ code, out }));
    });
  };
  it('0334: the backup and readiness receipts give anon only whitelisted facts', { timeout: 120000 }, async () => {
    const r = await run('readiness-receipt-replay.sh');
    if (/no PostgreSQL server binaries/.test(r.out || '')) return; // the runner image carries them; a laptop may not
    expect(r.out, r.out).toMatch(/replay: OK/);
    expect(r.code).toBe(0);
  });
});
