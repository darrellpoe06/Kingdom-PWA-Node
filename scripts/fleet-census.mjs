#!/usr/bin/env node
// =============================================================================
// fleet-census — how many jobs do we have, how many are on, how many have ever
// actually run, and which ones can nobody account for
// =============================================================================
// WHY. Darrell brought back a migration census in this shape:
//
//     Total jobs: 149 / Enabled jobs: 131 / Enabled jobs with a last run date: 78
//     Do the disabled jobs need to be migrated? Are these maybe jobs that are
//     only used at certain times?
//     Have the enabled jobs with no run dates never been run? Do they need to move?
//
// Those are the right questions and we could not answer them about our OWN
// automation. We have three separate fleets with three separate notions of
// "enabled" and no single place that counts them:
//
//   * GitHub workflows      .github/workflows/*.yml   — a file is "on" if it has
//                                                        a trigger GitHub fires
//   * NAS services + loops  infra/nas-loops/services.json — an `enabled` flag
//                                                        read by services-sync
//   * scheduled tasks       the account's own routines — not in the repo at all
//
// WHAT THIS DOES AND DOES NOT MEASURE. Trigger shape, enabled state and cron
// come from the files, so they are exact. LAST RUN cannot be read from the
// repository at all: it lives in GitHub's run history, in the NAS loop ledgers,
// and in the routine store. So this script takes last-run data as INPUT
// (`--runs <file>`), and when it is absent it says UNKNOWN and never says
// "never ran". That distinction is the whole point of the exercise:
//
//   UNKNOWN  = nobody asked the system that keeps the history
//   NEVER    = the system that keeps the history was asked, and it has no run
//
// Conflating them is how a census turns into a wrong answer. A job whose
// history was purged, or whose runs predate the window the report read, looks
// identical to a job that has never once fired — and the two have opposite
// migration decisions. "Unknown" never reads as "never" (DR-0076).
//
// Usage:
//   node scripts/fleet-census.mjs                 # shape + enabled state only
//   node scripts/fleet-census.mjs --runs runs.json
//   node scripts/fleet-census.mjs --json          # machine-readable
//
// --runs takes {"workflows": {"<file.yml>": {"last_run_at": "<iso>|null",
//               "state": "active|disabled_manually|disabled_inactivity",
//               "runs_counted": <n>}},
//               "services": {"<loop name>": {"last_run_at": "<iso>|null",
//               "from": "<which witness said so>"}},
//               "window": "<what was queried>"}
// Written by .github/workflows/fleet-census.yml, which can ask the API for the
// workflows and reads loops-health.yml's published witness for the NAS loops; a
// read with no window stated is not evidence of anything. A `services` entry
// carries no run COUNT on purpose -- see readServices below.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WF_DIR = join(ROOT, '.github/workflows');
const SERVICES = join(ROOT, 'infra/nas-loops/services.json');

/** A workflow's trigger shape, read from its own `on:` block. */
export function triggersOf(text) {
  // Only the top-level `on:` mapping counts: a `schedule:` nested under a job
  // or quoted in a comment is not a trigger. Keys sit at two or four spaces.
  const at = (k) => new RegExp(`^\\s{2,4}${k}:`, 'm').test(text);
  const cron = [...text.matchAll(/^\s+- cron:\s*['"]?([^'"#\n]+)/gm)].map((m) => m[1].trim());
  return {
    schedule: at('schedule'),
    dispatch: at('workflow_dispatch'),
    // Anything GitHub fires on its own from repository activity.
    event: at('push') || at('pull_request') || at('pull_request_target')
      || at('issues') || at('issue_comment') || at('release')
      || at('workflow_run') || at('check_suite') || at('repository_dispatch')
      || at('schedule_dispatch'),
    cron,
  };
}

/** What kind of job this is, in the words the questions need. */
export function kindOf(t) {
  if (t.schedule) return 'scheduled';          // fires on a clock by itself
  if (t.event) return 'event-driven';          // fires when the repo moves
  if (t.dispatch) return 'on-demand';          // fires only when something asks
  return 'inert';                              // nothing can fire it
}

/** The three classes a census has to keep apart. */
export function lastRunClass(entry) {
  if (!entry || !('last_run_at' in entry)) return 'unknown';
  if (entry.last_run_at) return 'ran';
  if (entry.runs_counted === 0) return 'never';
  return 'unknown';
}

export function readWorkflows(runs = {}) {
  if (!existsSync(WF_DIR)) return [];
  return readdirSync(WF_DIR)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => {
      const t = triggersOf(readFileSync(join(WF_DIR, f), 'utf8'));
      const r = (runs.workflows || {})[f];
      return {
        fleet: 'github-workflow',
        name: basename(f),
        kind: kindOf(t),
        // A workflow file in the default branch is enabled unless GitHub itself
        // has disabled it, which only the API knows. Absent that, state is
        // unknown rather than assumed active.
        state: r ? (r.state || 'unknown') : 'unknown',
        onDemandOnly: t.dispatch && !t.schedule && !t.event,
        cron: t.cron,
        lastRun: r && r.last_run_at ? r.last_run_at : null,
        lastRunClass: lastRunClass(r),
      };
    });
}

// THE NAS HALF NOW GETS ASKED TOO (DR-1150). This used to hardcode
// `lastRunClass: 'unknown'` with the comment "loops-health.yml reads them; it
// is not in the repo, so from here it is unknown" -- and that was true of the
// REPO and false of the FLEET. loops-health.yml already measures every one of
// these loops on the same Tailscale road, fifteen minutes apart, and the
// census simply never took the parameter: `readServices()` did not accept
// `runs` at all. So 28 of 118 jobs in the report read blank because of a
// missing argument, not a missing road, and the deferral I wrote ("data, not
// code") was wrong twice over.
//
// `runs.services[name]` now goes through the SAME `lastRunClass` as a
// workflow, which keeps one definition of ran/never/unknown across both
// fleets. One asymmetry is deliberate: a NAS entry must never produce
// **never**. "Never" means the system that keeps the history was asked and
// had no run, and nothing we can ask holds a NAS loop's run COUNT -- only its
// most recent evidence. So a NAS row either has a timestamp (ran) or stays
// unknown, and `runs_counted` is dropped on the way in rather than trusted.
export function readServices(runs = {}) {
  if (!existsSync(SERVICES)) return [];
  const raw = JSON.parse(readFileSync(SERVICES, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.services;
  const asked = runs.services || {};
  return list.map((s) => {
    const r = asked[s.name];
    // Only `last_run_at` is honoured; a count is not evidence we can have.
    const entry = r && 'last_run_at' in r ? { last_run_at: r.last_run_at } : undefined;
    return {
      fleet: 'nas-service',
      name: s.name,
      // Every one of these rides the services-sync clock, so an enabled service
      // is a scheduled job even though no cron line appears beside it.
      kind: 'scheduled',
      state: s.enabled ? 'active' : 'disabled_manually',
      onDemandOnly: false,
      cron: ['(services-sync, every 15 min)'],
      lastRun: entry && entry.last_run_at ? entry.last_run_at : null,
      lastRunClass: lastRunClass(entry),
      // How the timestamp was arrived at, carried with it so a reader never
      // has to guess which witness spoke (DR-0076 provenance).
      lastRunFrom: (r && r.from) || null,
      why: s.description ? String(s.description).slice(0, 160) : '',
    };
  });
}

export function census(runs = {}) {
  const jobs = [...readWorkflows(runs), ...readServices(runs)];
  const enabled = jobs.filter((j) => j.state !== 'disabled_manually' && j.state !== 'disabled_inactivity');
  const disabled = jobs.filter((j) => !enabled.includes(j));
  return {
    window: runs.window || null,
    total: jobs.length,
    enabled: enabled.length,
    disabled: disabled.length,
    withALastRun: jobs.filter((j) => j.lastRunClass === 'ran').length,
    neverRun: jobs.filter((j) => j.lastRunClass === 'never').length,
    unknownLastRun: jobs.filter((j) => j.lastRunClass === 'unknown').length,
    byKind: jobs.reduce((a, j) => ({ ...a, [j.kind]: (a[j.kind] || 0) + 1 }), {}),
    jobs,
  };
}

function report(c) {
  const L = [];
  L.push('=== FLEET CENSUS ===');
  L.push(`Total jobs: ${c.total}`);
  L.push(`Enabled jobs: ${c.enabled}`);
  L.push(`Disabled jobs: ${c.disabled}`);
  L.push(`Enabled jobs with a last run date: ${c.withALastRun}`);
  L.push(`  of the rest -- never run (history was asked): ${c.neverRun}`);
  L.push(`  of the rest -- UNKNOWN (nobody asked the history): ${c.unknownLastRun}`);
  L.push(`Run history window read: ${c.window || 'NONE -- no --runs file was given, so every last-run below is UNKNOWN, not "never"'}`);
  L.push('');
  L.push('By what can fire it:');
  for (const [k, n] of Object.entries(c.byKind).sort((a, b) => b[1] - a[1])) {
    L.push(`  ${k.padEnd(14)} ${n}`);
  }
  L.push('');
  L.push('--- QUESTION 1: the disabled jobs. Do they need to move? ---');
  const dis = c.jobs.filter((j) => j.state.startsWith('disabled'));
  if (!dis.length) L.push('  (none)');
  for (const j of dis) {
    L.push(`  ${j.fleet}/${j.name} -- ${j.state}${j.why ? `\n      ${j.why}` : ''}`);
  }
  L.push('');
  L.push('--- QUESTION 2: jobs that only run when something asks ---');
  L.push('  These have no schedule at all. A census that reads "enabled with no');
  L.push('  last run date" will list them, and they are NOT broken: nothing is');
  L.push('  meant to fire them on a clock.');
  const od = c.jobs.filter((j) => j.onDemandOnly);
  L.push(`  on-demand only: ${od.length}`);
  for (const j of od) L.push(`    ${j.name}`);
  L.push('');
  L.push('--- QUESTION 2b: inert -- nothing can fire these at all ---');
  const inert = c.jobs.filter((j) => j.kind === 'inert');
  L.push(inert.length ? inert.map((j) => `    ${j.name}`).join('\n') : '  (none)');
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf('--runs');
  const runs = i > -1 && process.argv[i + 1] ? JSON.parse(readFileSync(process.argv[i + 1], 'utf8')) : {};
  const c = census(runs);
  console.log(process.argv.includes('--json') ? JSON.stringify(c, null, 2) : report(c));
}
