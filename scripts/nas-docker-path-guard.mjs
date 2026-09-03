#!/usr/bin/env node
// =============================================================================
// nas-docker-path-guard — a NAS script never assumes docker is on the PATH
// =============================================================================
// THE INCIDENT (2026-09-02, db-migrate run 33695466498). The first migration to
// ride the new sovereign replay lane (0167) never ran. Not because its SQL was
// wrong — nothing was applied at all, the ledger stayed at 151 — but because
// infra/nas-supabase/replay_migrations.sh opened with:
//
//     DOCKER="docker"
//     docker ps >/dev/null 2>&1 || DOCKER="sudo -n docker"
//
// DSM does not put docker on the PATH of a non-login ssh shell. So `docker ps`
// failed as command-not-found, the fallback `sudo -n docker` failed the same
// way, and `set -e` killed the script at the first psql call:
// "sudo: docker: command not found". The app's database sat behind the repo.
//
// THE STANDARD EXISTED — IN CODE ONLY. Its own caller,
// scripts/sovereign-replay-over-tailnet.sh, resolves the binary correctly and
// even carries the comment "DSM does not put docker on the PATH", citing the
// run where that was first measured. Ten scripts/nas-update-*.sh call
// /usr/local/bin/docker by absolute path. And NOTHING in docs/ said to.
// That is DR-0314's exact class: a standard that lives only in implementations
// is a coincidence, so the next sibling script misses it — and this one did.
//
// THE RULE this gate enforces: a shell script under infra/ or scripts/ that
// EXECUTES docker must resolve the binary first — an absolute path
// (/usr/local/bin/docker, /usr/bin/docker), a resolved variable ($DOCKER),
// or `command -v docker` — never a bare `docker` relying on the PATH.
//
// PROVEN-TO-CATCH (DR-0076 §3, DR-0314's ordering): this guard was written
// BEFORE the fix and observed FAILING on the real defect —
// replay_migrations.sh as it stood at commit e4982c6. The unit test re-proves
// it on that exact source rather than trusting the history.
//
// Comments are stripped before scanning: infra/nas-sme-pipeline/
// transcript_trickle_install.sh says "docker pulls" in prose and is not an
// offender. A guard that fires where it should not is noise, and noise is how
// a guard gets deleted (DR-0314 §3).
//
// CLI: node scripts/nas-docker-path-guard.mjs
// =============================================================================
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The trees whose shell scripts run ON THE NAS (or ssh into it). A GitHub
// runner may legitimately say `docker` — nothing here does today, and a file
// that genuinely must would be listed in PATH_IS_FINE below, with its reason.
export const SCAN_DIRS = ['infra', 'scripts'];

// Named exceptions, each with the reason it legitimately assumes the PATH.
// The list IS the argument (DR-0314 §3). Empty is the honest state today.
export const PATH_IS_FINE = {
  'infra/n8n/scripts/pull-deepseek-r1.sh':
    'It does not ASSUME the PATH — its pre-flight `command -v docker` fails loudly ' +
    '("docker not on PATH; cannot reach the Ollama container") before any docker call, ' +
    'so it can never misbehave silently the way replay_migrations.sh did. It is a ' +
    'hand-run operator script, not part of an automated lane. Honest consequence, ' +
    'carried rather than hidden: on DSM it therefore refuses to run over a non-login ' +
    'ssh shell. Resolving the binary would fix that too — re-review: 2026-10-02.',
};

// Strip shell comments so prose mentioning docker is never an offender. Only
// whole-line and trailing `#` comments — a `#` inside quotes is left alone,
// which is the conservative direction (it can only UNDER-strip, never invent).
export function stripComments(text) {
  return String(text || '')
    .split('\n')
    .map((line) => {
      if (/^\s*#/.test(line)) return '';
      let out = '';
      let quote = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quote) {
          out += c;
          if (c === quote && line[i - 1] !== '\\') quote = null;
          continue;
        }
        if (c === '"' || c === "'") { quote = c; out += c; continue; }
        if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) break;
        out += c;
      }
      return out;
    })
    .join('\n');
}

// A bare `docker` EXECUTION: at the start of a command position (line start,
// after a pipe/semicolon/&&/(, or inside $( ), optionally behind sudo), with a
// following space. `/usr/local/bin/docker`, `$DOCKER`, `"$DOCKER_BIN"` and
// `command -v docker` all fail this pattern, which is the point.
const BARE_DOCKER = /(^|[|;&(]|\$\()[ \t]*(?:sudo(?:[ \t]+-[A-Za-z]+)*[ \t]+)?docker[ \t]/;

/** Findings for one shell source. `path` is repo-relative. */
export function scanSource(path, text) {
  if (Object.prototype.hasOwnProperty.call(PATH_IS_FINE, path)) return [];
  const out = [];
  const lines = stripComments(text).split('\n');
  lines.forEach((line, i) => {
    if (BARE_DOCKER.test(line)) {
      out.push({
        file: path,
        line: i + 1,
        text: line.trim().slice(0, 120),
        message: `${path}:${i + 1} runs a bare \`docker\` and assumes it is on the PATH. DSM does not put it there for a non-login shell — resolve the binary first (command -v, then /usr/local/bin/docker, /usr/bin/docker) as scripts/sovereign-replay-over-tailnet.sh does.`,
      });
    }
  });
  return out;
}

export function scanFile(absPath) {
  return scanSource(relative(ROOT, absPath), readFileSync(absPath, 'utf8'));
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.sh')) acc.push(full);
  }
  return acc;
}

export function shellSources() {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

export function scanAll() {
  return shellSources().flatMap((f) => scanFile(f));
}

if (process.argv[1] && process.argv[1].endsWith('nas-docker-path-guard.mjs')) {
  const findings = scanAll();
  if (!findings.length) {
    console.log(`nas-docker-path-guard: OK — ${shellSources().length} shell scripts scanned, none assumes docker is on the PATH.`);
    process.exit(0);
  }
  for (const f of findings) console.error(`  ${f.message}\n      ${f.text}`);
  console.error(`\nnas-docker-path-guard: ${findings.length} finding(s).`);
  process.exit(1);
}
