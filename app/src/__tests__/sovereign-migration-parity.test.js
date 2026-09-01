// =============================================================================
// THE MIGRATION LANE COVERS THE DATABASE THE APP ACTUALLY READS
// =============================================================================
// Darrell, 2026-09-01: "fix the migration lane too so this never happens again."
//
// WHAT HAPPENED. db-migrate.yml applied every migration through SUPABASE_DB_URL,
// which names the HOSTED project. The app has read the SOVEREIGN stack since
// infra/nas-supabase/REPOINT-ARMED landed on 2026-08-19. Nothing replayed
// migrations to the sovereign side, so a migration merged green, the lane went
// green, and the change landed on a database the app no longer reads. Every gate
// was pointed at the wrong database, so no gate could see it.
//
// MEASURED by sovereign-drift on 2026-09-01: 179 migrations in the repo, 151 on
// the sovereign database, 28 MISSING — twelve days' worth. It surfaced as the
// Properties tab being unable to load at all (0150-0161 were among the 28, so
// rental_tenancies did not exist and rentals had no showcase_order column), and
// it had also silently broken the Road-to-150 food log (0164-0166).
//
// "Never again" cannot rest on remembering to run a backfill. These are the
// machine checks that keep the lane honest: remove the sovereign step, or split
// the shared script back into two drifting copies, and CI goes red here.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SHARED = 'scripts/sovereign-replay-over-tailnet.sh';
const DB_MIGRATE = '.github/workflows/db-migrate.yml';
const REPLAY_WF = '.github/workflows/sovereign-replay.yml';

describe('the migration lane reaches the database the app reads', () => {
  it('db-migrate lands migrations on the sovereign database, not only the hosted one', () => {
    const wf = read(DB_MIGRATE);
    // The hosted apply must still be there — it is the baseline the sovereign
    // replay's own pg_dump lineage descends from.
    expect(wf).toMatch(/SUPABASE_DB_URL/);
    // ...and the live database must be covered by the SAME run.
    expect(wf).toContain(SHARED);
  });

  it('gates the sovereign step on the same record the deploy reads', () => {
    const wf = read(DB_MIGRATE);
    // One source of truth for "which database is live". If the migration lane
    // and the deploy read different records they can disagree about it, which
    // is the class of split that caused this in the first place.
    expect(wf).toMatch(/hashFiles\('infra\/nas-supabase\/REPOINT-ARMED'\)/);
    expect(read('.github/workflows/deploy-cloudflare-pages.yml'))
      .toMatch(/hashFiles\('infra\/nas-supabase\/REPOINT-ARMED'\)/);
  });

  it('runs the sovereign replay even when the hosted apply failed', () => {
    // A hosted failure must not leave the live database behind — that would
    // reproduce the exact gap, just triggered by a different cause.
    const wf = read(DB_MIGRATE);
    const step = wf.slice(wf.indexOf('Replay onto the sovereign database'));
    expect(step.slice(0, 400)).toMatch(/always\(\)/);
  });

  it('keeps ONE copy of the replay path, shared by both lanes', () => {
    // The gap this closes was caused by two halves drifting apart. Two copies of
    // the ssh block would be the same mistake in a new place.
    expect(existsSync(join(ROOT, SHARED))).toBe(true);
    expect(read(DB_MIGRATE)).toContain(SHARED);
    expect(read(REPLAY_WF)).toContain(SHARED);
  });

  it('never reports an unreachable database as up to date', () => {
    // DR-0076: unknown is not healthy. Every early-exit path must be non-zero,
    // so the lane goes RED rather than green-over-a-stale-database.
    const s = read(SHARED);
    expect(s).toMatch(/NAS_SSH_KEY missing/);
    expect(s).toMatch(/NAS unreachable/);
    expect(s).toMatch(/exit 2/);
    expect(s).toMatch(/exit 3/);
  });

  it('sends the remote body through a QUOTED heredoc', () => {
    // An unquoted heredoc expands locally first, so every remote $VAR needs a
    // backslash and one missed escape is a silently wrong result rather than an
    // error — the three-quoting-layers hazard sovereign-drift.yml documents.
    // This was live in the first draft of the shared script and caught by
    // extracting the body and running bash -n on it.
    const s = read(SHARED);
    expect(s).toContain("<<'REMOTE'");
    const body = s.slice(s.indexOf("<<'REMOTE'"), s.indexOf('\nREMOTE\n'));
    expect(body).not.toMatch(/\\\$/);
  });

  it('adds no n8n — the target is zero (DR-0218)', () => {
    // DR-0218 overrode DR-0132's "some flows stay on n8n": the endpoint is ZERO,
    // and no new n8n webhook is ever added. The sovereign backend is Python;
    // this lane is CI-runner glue, which DR-0226's algorithm answers with bash
    // ("CI runners speak bash", and it joins replay_migrations.sh's language).
    for (const f of [SHARED, DB_MIGRATE, REPLAY_WF]) {
      expect(read(f).toLowerCase()).not.toMatch(/n8n/);
    }
  });
});
