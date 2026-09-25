#!/usr/bin/env node
// =============================================================================
// live-db-reach-guard — a test lane never touches a real database (DR-0659)
// =============================================================================
// THE INCIDENT THIS ENDS (2026-09-25). The rls-isolation matrix re-applied each
// feature's migration chain, DROP FUNCTION pre-steps included, against
// SUPABASE_DB_URL. db-migrate run 36090407494's live-definition witness read
// public_vacancies() ABSENT while the poe-properties leg was mid-chain. The
// test lane was mutating a real database; nothing in the repo said it must not.
// The legs now run on a throwaway container (scripts/test-db-throwaway.sh).
//
// TWO RULES, both over .github/workflows/*.yml (comment lines ignored, so the
// history written in a comment never counts as a reach):
//
//   1. A TEST workflow reaches NO live database and no live host at all. A test
//      workflow is one that runs files from infra/supabase/tests/, restores the
//      throwaway database, or is named for isolation / smoke / e2e. It may not
//      name SUPABASE_DB_URL, a service-role key, AGENT_DB_URL, the NAS key, the
//      tailnet, live-sql.sh, any *-over-tailnet.sh or the supabase-db container
//      -- and it can never be registered below. The scripts it calls are held to
//      the same rule.
//
//   2. Every OTHER workflow that reaches a live database is REGISTERED here with
//      the database it reaches and the reason it may. An unregistered reach
//      fails the build; so does a registration whose workflow no longer reaches
//      (a stale list is a false record). The list is DR-0659's register.
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/live-db-reach-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WF_DIR = join(ROOT, '.github/workflows');

// What reaching a live DATABASE looks like in this repo.
export const DB_REACH = /SUPABASE_DB_URL|SERVICE_ROLE|AGENT_DB_URL|live-sql\.sh|[\w-]+-over-tailnet\.sh|\bsupabase-db\b/g;
// A test lane is held stricter still: not even the road to the NAS.
export const TEST_FORBIDDEN = /SUPABASE_DB_URL|SERVICE_ROLE|AGENT_DB_URL|live-sql\.sh|[\w-]+-over-tailnet\.sh|\bsupabase-db\b|NAS_SSH_KEY|TS_AUTHKEY|tailscale\/github-action|\.ts\.net\b|poetech\.us|supabase\.co\b/g;

/**
 * The register (DR-0659). db = which database: 'hosted' is SUPABASE_DB_URL (the
 * project the app stopped reading at REPOINT-ARMED, 2026-08-19); 'sovereign' is
 * the NAS database the app reads. A reason is required; the DR carries which
 * of these WRITE and which were line-checked.
 */
export const REGISTER = {
  'db-migrate.yml': { db: 'both', reason: 'THE migration lane: applies migrations to hosted, replays them onto the sovereign database, witnesses live definitions, and takes the read-only schema baseline the isolation proofs restore.' },
  'sovereign-replay.yml': { db: 'sovereign', reason: 'Replays migrations onto the database the app reads, by hand; the same script db-migrate runs.' },
  'sovereign-read.yml': { db: 'sovereign', reason: 'Read-only questions of the database the app reads (feedback, definitions, tables, instances, intake) and the schema-only baseline for the proofs.' },
  'sovereign-drift.yml': { db: 'both', reason: 'Compares the two databases so drift between them is measured, not assumed.' },
  'sovereign-content-sync.yml': { db: 'sovereign', reason: 'Named data-sync lane: carries content rows to the sovereign database.' },
  'nas-storage-sync.yml': { db: 'sovereign', reason: 'Named data-sync lane: carries stored files and their rows to the sovereign stack.' },
  'nas-user-rescue.yml': { db: 'sovereign', reason: 'Named data-sync lane: restores a person who cannot sign in, on the sovereign auth tables.' },
  'nas-email-door.yml': { db: 'sovereign', reason: 'The email door: files mail that arrives into the sovereign database.' },
  'intake-autofix.yml': { db: 'sovereign', reason: 'Reads intake rows and applies the reviewed categorization back to them.' },
  'push-outbox-drain.yml': { db: 'sovereign', reason: 'Sends queued pushes and marks each one sent or failed in push_outbox.' },
  'push-sender-credentials.yml': { db: 'sovereign', reason: 'Installs the push sender credentials the sovereign stack needs (service role).' },
  'nas-clock.yml': { db: 'sovereign', reason: 'The NAS clock: runs the timed jobs that post to the sovereign stack with the service role.' },
  'nas-health.yml': { db: 'sovereign', reason: 'Health of the NAS stack, including probes inside supabase-db.' },
  'system-flow-proof.yml': { db: 'sovereign', reason: 'Measures live flow and records its own readings (system_flow_proof).' },
  'video-stats.yml': { db: 'sovereign', reason: 'Writes the sermon video reach figures the app shows.' },
  'feedback-fixed.yml': { db: 'sovereign', reason: 'Marks feedback fixed once its fix merges, so the sender sees it.' },
  'voice-intake-health.yml': { db: 'sovereign', reason: 'Health monitor of the voice intake rows.' },
  'harvest-health.yml': { db: 'both', reason: 'Harvest health monitor; reads through live-sql.sh (the database the app reads) and still names the hosted secret.' },
  'ops-queue-health.yml': { db: 'both', reason: 'Operations-queue health monitor; reads through live-sql.sh and still names the hosted secret.' },
  'corpus-reconcile.yml': { db: 'hosted', reason: 'Named data-sync lane: backfills the choir sermon corpus.' },
  'transcript-backfill.yml': { db: 'hosted', reason: 'Named data-sync lane: backfills service transcripts.' },
};

const codeOf = (text) => String(text || '').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const hits = (re, text) => [...new Set((codeOf(text).match(re) || []))].sort();

/** Is this workflow a TEST lane? */
export function isTestWorkflow(name, text) {
  const code = codeOf(text);
  return /infra\/supabase\/tests\//.test(code)
    || /test-db-throwaway\.sh/.test(code)
    || /(isolation|smoke|e2e)/i.test(name);
}

/** The scripts a workflow runs (scripts/<name>), for rule 1's reach-through. */
export function scriptsOf(text) {
  return [...new Set((codeOf(text).match(/scripts\/[\w.-]+\.(?:sh|mjs|js|py)/g) || []))];
}

/**
 * workflows: { 'name.yml': text }, scripts: { 'scripts/x.sh': text }.
 * Returns a list of problems; empty = green.
 */
export function check(workflows, scripts = {}, register = REGISTER) {
  const problems = [];
  for (const [name, text] of Object.entries(workflows).sort()) {
    if (isTestWorkflow(name, text)) {
      const own = hits(TEST_FORBIDDEN, text);
      if (own.length) problems.push(`TEST LANE REACHES A LIVE DATABASE: ${name} names ${own.join(', ')}. A test runs on the throwaway database (scripts/test-db-throwaway.sh), never a real one.`);
      for (const s of scriptsOf(text)) {
        const through = hits(TEST_FORBIDDEN, scripts[s]);
        if (through.length) problems.push(`TEST LANE REACHES A LIVE DATABASE THROUGH ${s}: ${name} runs it and it names ${through.join(', ')}.`);
      }
      if (register[name]) problems.push(`${name} is a test lane and can never be registered to reach a live database.`);
      continue;
    }
    const reach = hits(DB_REACH, text);
    if (reach.length && !register[name]) {
      problems.push(`UNREGISTERED LIVE-DATABASE REACH: ${name} names ${reach.join(', ')}. Register it in scripts/live-db-reach-guard.mjs with the database and the reason (DR-0659), or stop reaching.`);
    }
    if (!reach.length && register[name]) {
      problems.push(`STALE REGISTRATION: ${name} is registered but no longer reaches a live database; remove it so the register stays true.`);
    }
    if (register[name] && !String(register[name].reason || '').trim()) {
      problems.push(`${name} is registered without a reason.`);
    }
  }
  for (const name of Object.keys(register)) {
    if (!(name in workflows)) problems.push(`STALE REGISTRATION: ${name} is registered but no such workflow exists.`);
  }
  return problems;
}

export function loadRepo() {
  const workflows = {};
  for (const f of readdirSync(WF_DIR).filter((x) => /\.ya?ml$/.test(x))) workflows[f] = readFileSync(join(WF_DIR, f), 'utf8');
  const scripts = {};
  for (const text of Object.values(workflows)) {
    for (const s of scriptsOf(text)) {
      const p = join(ROOT, s);
      if (existsSync(p) && !(s in scripts)) scripts[s] = readFileSync(p, 'utf8');
    }
  }
  return { workflows, scripts };
}

if (process.argv[1] && process.argv[1].endsWith('live-db-reach-guard.mjs')) {
  const { workflows, scripts } = loadRepo();
  const problems = check(workflows, scripts);
  if (problems.length) {
    console.error('live-db-reach-guard FAILED:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  const tests = Object.entries(workflows).filter(([n, t]) => isTestWorkflow(n, t)).map(([n]) => n);
  console.log(`live-db-reach-guard: OK — ${tests.length} test lane(s) (${tests.join(', ')}) reach no live database; ${Object.keys(REGISTER).length} registered lanes reach one, each with a reason.`);
}
