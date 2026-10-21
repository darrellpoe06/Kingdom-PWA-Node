#!/usr/bin/env node
// =============================================================================
// derive-job-registry — every clocked GitHub workflow, by its actual name
// =============================================================================
// DR-1189 (Darrell 2026-10-21: "Actual job names... Number of jobs, last ran,
// never ran... sequence of things, logs... Cyclical calendars for stored
// procedures... Reminders"). The Jobs ledger on the OpsBoard needs, for each
// scheduled workflow, its NAME and its CRON. The GitHub API gives names and
// runs live, but the cron lives only in the YAML, and reading 38 files from
// the client would spend 38 of the hour's 60 unauthenticated requests. So the
// crons are DERIVED here, at build time, from .github/workflows, into
// app/src/lib/job-registry.json — derived, never typed (DR-0121) — and a test
// (job-registry.test.js) fails when the committed file drifts from the
// workflows on disk, proven to catch.
//
//   node scripts/derive-job-registry.mjs           # rewrite the file
//   node scripts/derive-job-registry.mjs --check   # exit 1 if it would change
//
// A commented-out cron is not a schedule (scripts/system-flow-graph.mjs
// liveYaml, measured 2026-09-25); the same rule is applied here.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WORKFLOWS_DIR = join(HERE, '..', '.github', 'workflows');
export const REGISTRY_PATH = join(HERE, '..', 'app', 'src', 'lib', 'job-registry.json');

export function liveYaml(text) {
  return String(text || '').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
}

/** The workflow's declared name (the `name:` at the top level), else its file. */
export function workflowName(text, file) {
  const m = liveYaml(text).match(/^name:\s*(.+)$/m);
  if (!m) return file;
  return m[1].trim().replace(/^['"]|['"]$/g, '');
}

/** Every live cron line in the workflow's `on.schedule` block, in file order. */
export function workflowCrons(text) {
  const live = liveYaml(text);
  const block = live.match(/^\s*schedule:\s*\n((?:\s+-\s*cron:[^\n]*\n?)+)/m);
  if (!block) return [];
  return [...block[1].matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1].trim());
}

/** Build the registry from a workflows directory: only files that carry a live schedule. */
export function deriveJobRegistry(dir = WORKFLOWS_DIR) {
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort();
  const jobs = [];
  for (const file of files) {
    const text = readFileSync(join(dir, file), 'utf8');
    const crons = workflowCrons(text);
    if (!crons.length) continue;
    jobs.push({ file, name: workflowName(text, file), crons });
  }
  return { derivedFrom: '.github/workflows', derivedBy: 'scripts/derive-job-registry.mjs', scheduled: jobs.length, jobs };
}

export function registryText(reg) {
  return `${JSON.stringify(reg, null, 2)}\n`;
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('derive-job-registry.mjs');
if (invokedDirectly) {
  const check = process.argv.includes('--check');
  const next = registryText(deriveJobRegistry());
  const current = existsSync(REGISTRY_PATH) ? readFileSync(REGISTRY_PATH, 'utf8') : '';
  if (check) {
    if (next !== current) {
      console.error('derive-job-registry --check: app/src/lib/job-registry.json drifts from .github/workflows — run `node scripts/derive-job-registry.mjs` and commit.');
      process.exit(1);
    }
    console.log(`derive-job-registry --check ok: ${JSON.parse(next).scheduled} scheduled workflows, file current.`);
  } else {
    writeFileSync(REGISTRY_PATH, next);
    console.log(`derive-job-registry: wrote ${JSON.parse(next).scheduled} scheduled workflows to app/src/lib/job-registry.json`);
  }
}
