#!/usr/bin/env node
// =============================================================================
// workflow-list-order-guard — a workflow decides by exact identity, never by
// the first item of a runs list (LESSONS-LEARNED P62; DR-0697)
// =============================================================================
// THE INCIDENT (2026-09-30, PRs #1868 and #1870). inbox-lesson-tag.yml decided
// "is this lesson live?" from `.workflow_runs[0].head_sha` of
// `deploy-cloudflare-pages.yml/runs?status=success&per_page=1`. The filtered
// runs list did not come back newest-first: minutes after a651130e deployed it
// answered ef3a87f1, a deploy from 2026-09-06, and L201's row was tagged
// without `lesson-published`. The first fix (#1868) still trusted a list
// (`?branch=main&per_page=30`, newest by created_at) and the same old run came
// back. The fix that held (#1870) asks about the exact commit:
// `runs?head_sha=<sha>&status=success`.
//
// THE RULE: in .github/workflows/*.yml,
//   1. a runs-list API read that takes `.workflow_runs[0]` must filter by
//      `head_sha=` (exact identity: "is there a run FOR THIS commit?");
//   2. `gh run list ... --limit 1` whose answer is read as `.[0]` is refused
//      (take the max databaseId of a wider page, or ask by head_sha).
// A position in a list is not a fact about the newest run.
//
// PROVEN-TO-CATCH (DR-0076 §3): `--selftest` feeds the exact line #1868
// replaced and requires a finding, and the head_sha form and requires none.
// app/src/__tests__/workflow-list-order-guard.test.js runs the same cases.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WF = join(ROOT, '.github', 'workflows');

// Join shell continuation lines so a URL and its --jq on the next line are one
// command, and keep the first line's number for the report.
export function commandsOf(text) {
  const lines = String(text || '').split('\n');
  const out = [];
  let buf = ''; let start = 0;
  lines.forEach((line, i) => {
    if (!buf) start = i + 1;
    buf += (buf ? ' ' : '') + line.trim();
    if (/\\$/.test(line.trimEnd())) { buf = buf.replace(/\\$/, ''); return; }
    out.push({ line: start, text: buf });
    buf = '';
  });
  if (buf) out.push({ line: start, text: buf });
  return out;
}

export function findListOrderReads(text, file = '<text>') {
  const findings = [];
  for (const { line, text: cmd } of commandsOf(text)) {
    if (/^\s*#/.test(cmd)) continue;
    const runsApi = /actions\/(?:workflows\/[^/\s"']+\/)?runs\?/.test(cmd);
    if (runsApi && /\.workflow_runs\[0\]/.test(cmd) && !/[?&]head_sha=/.test(cmd)) {
      findings.push(`${file}:${line}: reads .workflow_runs[0] from a runs list with no head_sha= filter — the list is not newest-first (P62); ask by exact commit instead`);
    }
    if (/\bgh run list\b/.test(cmd) && /--limit[ =]1\b/.test(cmd) && /\.\[0\]/.test(cmd)) {
      findings.push(`${file}:${line}: reads .[0] of \`gh run list --limit 1\` — position is not identity (P62); take the max databaseId of a wider page, or ask by head_sha`);
    }
  }
  return findings;
}

export function scanWorkflows(dir = WF) {
  if (!existsSync(dir)) return [];
  const findings = [];
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    findings.push(...findListOrderReads(readFileSync(join(dir, f), 'utf8'), `.github/workflows/${f}`));
  }
  return findings;
}

// The exact line #1868 replaced, and the forms that are lawful.
export const SELFTEST = {
  mustCatch: [
    `SHA=$(gh api "repos/$REPO/actions/workflows/deploy-cloudflare-pages.yml/runs?status=success&per_page=1" --jq '.workflow_runs[0].head_sha // ""')`,
    `last=$(gh api "repos/$REPO/actions/workflows/db-migrate.yml/runs?status=success&per_page=1" \\\n  --jq '.workflow_runs[0].head_sha // ""')`,
    `RUN=$(gh run list --workflow deploy-cloudflare-pages.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId // 0')`,
  ],
  mustPass: [
    `N=$(gh api "repos/$REPO/actions/workflows/deploy-cloudflare-pages.yml/runs?head_sha=$SHA&status=success&per_page=1" --jq '.total_count')`,
    `x=$(gh api "repos/$REPO/actions/workflows/deploy-cloudflare-pages.yml/runs?head_sha=$main_sha&per_page=1" \\\n  --jq '.workflow_runs[0].head_sha // ""')`,
    `RUN=$(gh run list --workflow deploy-cloudflare-pages.yml --branch main --limit 20 --json databaseId --jq 'map(.databaseId) | max // 0')`,
    `n=$(gh issue list --repo "$REPO" --label incident --state open --json number --jq '.[0].number // ""')`,
  ],
};

export function selftest() {
  const missed = SELFTEST.mustCatch.filter((t) => findListOrderReads(t).length === 0);
  const cried = SELFTEST.mustPass.filter((t) => findListOrderReads(t).length !== 0);
  return { ok: !missed.length && !cried.length, missed, cried };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv.includes('--selftest')) {
    const r = selftest();
    if (!r.ok) {
      console.error('workflow-list-order-guard selftest FAILED', JSON.stringify(r, null, 2));
      process.exit(1);
    }
    console.log(`workflow-list-order-guard selftest: ${SELFTEST.mustCatch.length} breaks caught, ${SELFTEST.mustPass.length} lawful forms pass`);
    process.exit(0);
  }
  const findings = scanWorkflows();
  if (findings.length) {
    console.error(`workflow-list-order-guard: ${findings.length} list-position read(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  console.log('workflow-list-order-guard: OK — every run check in .github/workflows asks by exact identity');
}
