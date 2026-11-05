#!/usr/bin/env node
// =============================================================================
// dependency-audit-guard — a known vulnerability in what we ship is a red
// build, and a deferred one carries a why and a date
// =============================================================================
// DR-1330 D3 (2026-11-05). The Ways review measured that no `npm audit`,
// `pip-audit` or secret scanner ran anywhere in 95 workflows; the first audit
// run answered the open question: 21 known vulnerabilities (2 critical, 6
// high). `npm audit fix` cleared 8 the same hour; what remained is either a
// production package with no fix (xlsx) or a dev-tool major migration DR-1262
// already sorted from the bumps (vitest 5, vite 8). This guard keeps that
// honest from here on:
//
//   1. PRODUCTION high/critical (npm audit --omit=dev) FAILS unless the
//      package is in scripts/dependency-audit-allowlist.json with a why and a
//      re-review date that has not passed.
//   2. DEV high/critical FAILS under the same rule — a deferred migration is a
//      dated decision, never a silent default (DR-0075).
//   3. Moderate and low, prod or dev, are COUNTED and printed, never failed:
//      a gate that reads red on every transitive moderate gets disabled.
//   4. Every `pip install` in .github/workflows names its version through
//      infra/requirements-ci.txt (a `-r` of it, or a `$(grep '^name==' ...)`
//      pin from it); a bare `pip install name` is unpinned and FAILS.
//   5. An allowlist entry without a why, without a date, or past its date
//      FAILS — the list can only carry live decisions.
//
// Pure functions exported for vitest (proven to catch: a prod high with no
// entry, a dated entry past its date, a bare pip install). The live run reads
// `npm audit --json` twice (prod, all) in app/ and the workflow files.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FAIL_LEVELS = ['high', 'critical'];
export const REQUIREMENTS = 'infra/requirements-ci.txt';

/** Findings from one npm audit JSON report: [{name, severity, direct, fix}]. */
export function findingsOf(report) {
  const v = (report && report.vulnerabilities) || {};
  return Object.entries(v).map(([name, x]) => {
    const fa = x.fixAvailable;
    const fix = fa === false ? 'none' : fa === true ? 'patch' : `${fa.name}@${fa.version}${fa.isSemVerMajor ? ' (major)' : ''}`;
    return { name, severity: x.severity, direct: !!x.isDirect, fix };
  });
}

/**
 * Judge the two reports against the allowlist.
 * @returns {{failures:string[], counted:string[]}}
 */
export function judge({ prod, all, allowlist, today }) {
  const failures = [];
  const counted = [];
  const byName = Object.fromEntries((allowlist || []).map((e) => [e.name, e]));
  for (const e of allowlist || []) {
    if (!e.why || !e.reReview) failures.push(`allowlist entry '${e.name}' has no why or no reReview date`);
    else if (e.reReview <= today) failures.push(`allowlist entry '${e.name}' passed its re-review date ${e.reReview}: fix it, or re-date it with a new why`);
  }
  const prodNames = new Set(findingsOf(prod).map((f) => f.name));
  for (const f of findingsOf(all)) {
    const scope = prodNames.has(f.name) ? 'prod' : 'dev';
    const line = `${scope} ${f.severity} ${f.name} (${f.direct ? 'direct' : 'transitive'}; fix: ${f.fix})`;
    if (!FAIL_LEVELS.includes(f.severity)) {
      counted.push(line);
      continue;
    }
    const e = byName[f.name];
    if (!e) failures.push(`${line} — not in the allowlist: fix it, or add a dated entry with a why`);
    else if (e.scope && e.scope !== scope) failures.push(`${line} — allowlisted as ${e.scope}, found in ${scope}`);
    else counted.push(`${line} — deferred: ${e.why} (re-review ${e.reReview})`);
  }
  return { failures, counted };
}

/** Workflow lines that pip-install something not pinned through the requirements file. */
export function unpinnedPipInstalls(workflows) {
  const out = [];
  for (const [file, text] of Object.entries(workflows)) {
    text.split('\n').forEach((line, i) => {
      const t = line.trim();
      if (!/\bpip install\b/.test(t) || t.startsWith('#')) return;
      if (/pip install\b[^|&;]*-r\s+\S*requirements-ci\.txt/.test(t)) return;
      if (/\$\(grep '\^[A-Za-z0-9_.-]+==' \S*requirements-ci\.txt\)/.test(t)) return;
      if (/pip install\b[^|&;]*\bpip-audit==\d/.test(t)) return; // the auditor pins itself in the guards leg
      out.push(`${file}:${i + 1}: ${t.slice(0, 120)}`);
    });
  }
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const audit = (args) => {
    try {
      return JSON.parse(
        execFileSync('npm', ['audit', '--json', ...args], {
          cwd: join(ROOT, 'app'),
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: 64 * 1024 * 1024,
        })
      );
    } catch (e) {
      const out = e.stdout && String(e.stdout);
      if (out && out.trim().startsWith('{')) return JSON.parse(out);
      throw e;
    }
  };
  const prod = audit(['--omit=dev']);
  const all = audit([]);
  const allowlist = JSON.parse(readFileSync(join(ROOT, 'scripts/dependency-audit-allowlist.json'), 'utf8')).entries;
  const today = new Date().toISOString().slice(0, 10);
  const { failures, counted } = judge({ prod, all, allowlist, today });
  const wfDir = join(ROOT, '.github/workflows');
  const workflows = Object.fromEntries(
    readdirSync(wfDir)
      .filter((f) => f.endsWith('.yml'))
      .map((f) => [`.github/workflows/${f}`, readFileSync(join(wfDir, f), 'utf8')])
  );
  for (const u of unpinnedPipInstalls(workflows)) failures.push(`unpinned pip install (pin it through ${REQUIREMENTS}): ${u}`);
  for (const c of counted) console.log(`  counted  ${c}`);
  const meta = (all.metadata && all.metadata.vulnerabilities) || {};
  if (failures.length) {
    console.error(`dependency-audit-guard: ${failures.length} finding(s):\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `dependency-audit-guard: OK — npm audit ${meta.total || 0} known (${meta.critical || 0} critical, ${meta.high || 0} high, ${meta.moderate || 0} moderate, ${meta.low || 0} low); every high/critical deferred with a date; every workflow pip install pinned through ${REQUIREMENTS}.`
  );
}
