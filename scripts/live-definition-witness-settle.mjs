#!/usr/bin/env node
// =============================================================================
// live-definition-witness-settle — read the live definitions again while an
// isolation run is mid-apply, never longer than a budget (DR-0943)
// =============================================================================
// THE INCIDENT (2026-10-10, db-migrate run 38093330311). The witness read the
// hosted database at 23:03:21 and reported document_route (0204) and
// obligation_record (0203) OLDER than the repo. The rls-isolation matrix
// (run 38093504020, dispatched by the db-migrate run just before) was in its
// product-forms leg from 23:02:44 to 23:03:41, applying 0200 → 0213 one file
// per transaction since DR-0831. 0202 had committed its definitions and 0203 /
// 0204 had not yet replaced them. Thirty seconds later the database was whole
// again; the witness had read a chain halfway through.
//
// The two workflows cannot share one concurrency group: GitHub keeps one
// PENDING run per group, so a dispatched isolation run would cancel a waiting
// db-migrate. So the witness itself tells a chain halfway through from a real
// revert: on an "older" finding while an rls-isolation run is queued or in
// progress, it reads again every 20 s until the read is clean, the isolation
// run ends (then one last read decides), or the budget is spent. A finding with
// no isolation run in motion fails at once, exactly as before. A plumbing fault
// (exit 2) never retries.
//
// Importable for vitest; the CLI exits with the last read's code.
// =============================================================================
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const EVERY_MS = 20_000;
export const BUDGET_MS = 20 * 60_000;

/**
 * read()  → {code: 0 clean | 1 older | 2 fault, report}
 * busy()  → true while an isolation run is queued or in progress
 * Returns the deciding read plus {reads, waitedMs, timedOut}.
 */
export async function settle({ read, busy, wait, now = Date.now, everyMs = EVERY_MS, budgetMs = BUDGET_MS }) {
  const start = now();
  let reads = 0;
  let waited = false;
  let lastLook = false;
  for (;;) {
    const r = await read();
    reads++;
    const done = (extra = {}) => ({ ...r, reads, waitedMs: now() - start, timedOut: false, ...extra });
    if (r.code !== 1) return done();
    if (!(await busy())) {
      // The run may have ended between this read and that look: once we have
      // waited on it, one more read is owed before an "older" stands.
      if (waited && !lastLook) {
        lastLook = true;
        continue;
      }
      return done();
    }
    if (now() - start >= budgetMs) return done({ timedOut: true });
    waited = true;
    lastLook = false;
    await wait(everyMs);
  }
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WITNESS = join(ROOT, 'scripts/live-definition-witness.mjs');

function readLive(dbUrl, sqlFile) {
  let json;
  try {
    json = execFileSync('psql', [dbUrl, '-At', '-v', 'ON_ERROR_STOP=1', '-f', sqlFile], { encoding: 'utf8', timeout: 60_000 });
  } catch (e) {
    return { code: 2, report: `live-definition-witness-settle: the live query failed: ${String(e.stderr || e.message).trim()}` };
  }
  const c = spawnSync(process.execPath, [WITNESS, '--check'], { input: json, encoding: 'utf8', timeout: 60_000 });
  return { code: c.status ?? 2, report: `${c.stdout || ''}${c.stderr || ''}`.trim() };
}

async function isolationBusy(repo, token) {
  if (!repo || !token) return false;
  for (const status of ['in_progress', 'queued']) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/rls-isolation.yml/runs?status=${status}&per_page=1`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15_000) },
      );
      if (!res.ok) return false;
      if ((await res.json()).total_count > 0) return true;
    } catch {
      return false; // no observation is not a reason to wait
    }
  }
  return false;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dbUrl = String(process.env.SUPABASE_DB_URL || '').replace(/\s+/g, '');
  if (!dbUrl) {
    console.error('::error::SUPABASE_DB_URL is not set; the witness cannot observe the database.');
    process.exit(2);
  }
  const sql = spawnSync(process.execPath, [WITNESS, '--sql'], { encoding: 'utf8' });
  if (sql.status !== 0) {
    console.error(sql.stderr);
    process.exit(2);
  }
  const sqlFile = join(process.env.RUNNER_TEMP || tmpdir(), 'witness.sql');
  writeFileSync(sqlFile, sql.stdout);
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  const r = await settle({
    read: () => readLive(dbUrl, sqlFile),
    busy: async () => {
      const b = await isolationBusy(repo, token);
      if (b) console.log('live-definition-witness-settle: an rls-isolation run is applying chains to this database; reading again in 20 s.');
      return b;
    },
    wait: (ms) => new Promise((ok) => setTimeout(ok, ms)),
  });
  const how = `${r.reads} read(s) over ${Math.round(r.waitedMs / 1000)} s${r.timedOut ? ', budget spent' : ''}`;
  (r.code === 0 ? console.log : console.error)(`${r.report}\nlive-definition-witness-settle: ${how}.`);
  process.exit(r.code);
}
