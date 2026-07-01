#!/usr/bin/env node
// =============================================================================
// surface-audit.mjs — the PROACTIVE surface-audit HARNESS (I/O around the pure
// core). Walks EVERY served surface in the surfaces.js registry, checks each
// against the human-needs rubric, files findings to the in-app Concerns &
// Solutions board (via the audit-findings artifact the board reads through) and
// the event reel, and marks findings resolved when a re-audit no longer produces
// them. DR-0086. Deterministic + $0 + NO LLM.
//
// Darrell is the GOVERNOR, not the QA. This is the standing pass that catches the
// class of miss he had to name on 2026-07-01 (endless-scroll list, static tiles,
// admin unreachable, dead-ends) BEFORE he sees it.
//
// Usage (from repo root, or anywhere — paths resolve to the repo):
//   node scripts/surface-audit.mjs                 # audit + PRINT report (no write)
//   node scripts/surface-audit.mjs --write         # also write the findings artifact + reel
//   node scripts/surface-audit.mjs --online        # additionally run the (optional) live probes
//   node scripts/surface-audit.mjs --fail-on=high  # exit 1 if any finding >= this severity (gate mode)
//   node scripts/surface-audit.mjs --fail-on-new   # exit 1 if a NEW (surface,item) finding appeared
//                                                   # vs the committed artifact — the "new static never
//                                                   # creeps back" CI gate (DR-0086 / 2026-07-01 sweep)
//   node scripts/surface-audit.mjs --json          # machine output only
//
// The NAS loop (infra/nas-loops/loops/surface-audit.sh) invokes it with --write,
// behind the three brakes. It only OBSERVES + writes the artifact; it never
// commits or merges (the build driver / a session does that) — same read-only
// discipline as the health-check loop.
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runAudit, findingToConcern, diffFindings, summarize, SEVERITY_RANK,
} from './lib/surface-audit-core.mjs';
import { findingsFromFreshness } from './help-freshness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_SRC = join(ROOT, 'app', 'src');
const SURFACES_FILE = join(APP_SRC, 'surfaces.js');
const SHELL_FILE = join(APP_SRC, 'poe-financial-mvp-v28.jsx');
const RUBRIC_FILE = join(ROOT, 'scripts', 'surface-audit-rubric.json');
const FINDINGS_FILE = join(APP_SRC, 'lib', 'audit-findings.json');
const REEL_FILE = process.env.REEL_FILE
  ? (process.env.REEL_FILE)
  : join(ROOT, 'infra', 'nas-loops', 'events', '_reel.jsonl');

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
};
const hasFlag = (name) => process.argv.includes(`--${name}`);

// --- Parse the SURFACES registry from source (no React import in Node) --------
// surfaces.js declares `export const SURFACES = [ {...}, ... ];`. Each entry is a
// single object literal with id/label/nav/view/sub and a `load` thunk carrying a
// dynamic import path. We extract the metadata + the component file path by regex
// — deterministic and robust to the lazy()/pick() wrapping.
function parseSurfaces(src) {
  const block = src.match(/export\s+const\s+SURFACES\s*=\s*\[([\s\S]*?)\n\s*\];/);
  if (!block) throw new Error('could not locate the SURFACES array in surfaces.js');
  const body = block[1];
  const surfaces = [];
  // Match each top-level object literal { ... } (entries are one-per-line here).
  const entryRe = /\{[^{}]*\}/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const e = m[0];
    const idM = e.match(/\bid:\s*['"]([^'"]+)['"]/);
    if (!idM) continue;
    const field = (name) => { const mm = e.match(new RegExp(`\\b${name}:\\s*['"]([^'"]+)['"]`)); return mm ? mm[1] : null; };
    const imp = e.match(/import\(\s*['"]([^'"]+)['"]\s*\)/);
    surfaces.push({
      id: idM[1],
      label: field('label') || idM[1],
      nav: field('nav'),
      view: field('view'),
      sub: field('sub'),
      importPath: imp ? imp[1] : null,
    });
  }
  return surfaces;
}

// Resolve a surface's component source path from its import path (relative to
// app/src). Returns the source text, or null if not found/parseable.
function readSurfaceSource(s) {
  if (!s.importPath) return null;
  const rel = s.importPath.replace(/^\.\//, '');
  const p = join(APP_SRC, rel);
  if (!existsSync(p)) return null;
  return { file: `app/src/${rel}`, source: readFileSync(p, 'utf8') };
}

// --- Optional live probes (deterministic HTTP; --online) ----------------------
async function runLiveProbes(rubric) {
  const probes = (rubric.liveProbes && rubric.liveProbes.probes) || [];
  const findings = [];
  for (const p of probes) {
    let ok = false; let detail = '';
    try {
      const res = await fetch(p.url, { method: p.method || 'GET' });
      const body = p.expectBodyMatches ? await res.text() : '';
      const statusOk = res.status <= (p.expectStatusMax || 399);
      const bodyOk = p.expectBodyMatches ? new RegExp(p.expectBodyMatches).test(body) : true;
      ok = statusOk && bodyOk;
      detail = `status ${res.status}${p.expectBodyMatches ? ` bodyMatch=${bodyOk}` : ''}`;
    } catch (e) { ok = false; detail = `fetch failed: ${e.message}`; }
    if (!ok) {
      findings.push({
        surface: p.id, surfaceLabel: p.label || p.id, item: `live-${p.id}`,
        title: `Live probe failed: ${p.label || p.id}`, dimension: p.dimension || 'freshness',
        severity: p.severity || 'high', severityRank: SEVERITY_RANK[p.severity || 'high'],
        detail, evidence: p.url, line: null, file: null, fix: p.fix || 'Investigate the live endpoint / pipeline.',
        detectedBy: 'surface-audit-live', key: `live::${p.id}::-`,
      });
    }
  }
  return findings;
}

function appendReel(rec) {
  try {
    mkdirSync(dirname(REEL_FILE), { recursive: true });
    const line = JSON.stringify({
      ts: rec.ts, node: process.env.NODE_NAME || 'surface-audit', agent: 'surface-audit',
      loop: 'surface-audit', event: rec.event, ok: rec.ok === true,
      duration_ms: rec.durationMs || 0, detail: String(rec.detail || '').slice(0, 800),
    });
    writeFileSync(REEL_FILE, line + '\n', { flag: 'a' });
  } catch { /* reel is best-effort observability; never block the audit */ }
}

function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }

async function main() {
  const started = Date.now();
  const rubric = JSON.parse(readFileSync(RUBRIC_FILE, 'utf8'));
  const surfaces = parseSurfaces(readFileSync(SURFACES_FILE, 'utf8'));
  const shellSource = existsSync(SHELL_FILE) ? readFileSync(SHELL_FILE, 'utf8') : '';

  const sources = {};
  const fileBySurface = {};
  for (const s of surfaces) {
    const r = readSurfaceSource(s);
    if (r) { sources[s.id] = r.source; s.file = r.file; fileBySurface[s.id] = r.file; }
  }

  const result = runAudit({ surfaces, sources, shellSource, rubric });
  let findings = result.findings;

  // Help-freshness: file STALE / MISSING self-explaining Help entries as concerns
  // too, so the Help tab is kept current on the NAS loop — not only in CI. A stale
  // Help entry is clutter creeping back onto the surface (Darrell 2026-07-01).
  try {
    const hf = findingsFromFreshness().map((f) => ({
      ...f,
      surfaceLabel: f.surfaceLabel || f.surface,
      line: null, file: 'app/src/lib/help-content.js',
      evidence: f.detail, severityRank: SEVERITY_RANK[f.severity],
    }));
    findings = findings.concat(hf);
  } catch { /* freshness is additive observability; never block the core audit */ }

  if (hasFlag('online')) {
    const live = await runLiveProbes(rubric);
    findings = findings.concat(live);
  }
  const summary = summarize(findings);

  // Diff against the previous artifact to report RESOLVED findings (fix landed).
  let prev = [];
  if (existsSync(FINDINGS_FILE)) {
    try { prev = (JSON.parse(readFileSync(FINDINGS_FILE, 'utf8')).findings) || []; } catch { prev = []; }
  }
  const diff = diffFindings(prev, findings);

  const concerns = findings.map(findingToConcern);
  const artifact = {
    _comment: 'GENERATED by scripts/surface-audit.mjs (DR-0086). Do not edit by hand — re-run the audit. `concerns` are read through onto the in-app Concerns & Solutions board (lib/concerns.js). A finding that disappears here has passed re-audit (auto-resolved).',
    generatedAt: nowIso(),
    rubricVersion: rubric.version,
    summary,
    coverage: result.coverage,
    resolvedSinceLast: diff.resolved.length,
    findings,
    concerns,
  };

  const wantWrite = hasFlag('write');
  if (wantWrite) {
    writeFileSync(FINDINGS_FILE, JSON.stringify(artifact, null, 2) + '\n');
    appendReel({
      ts: nowIso(), event: 'surface_audit', ok: summary.critical === 0,
      durationMs: Date.now() - started,
      detail: `surfaces=${result.coverage.auditedSource} findings=${summary.total} (crit ${summary.critical}/high ${summary.high}/med ${summary.medium}/low ${summary.low}); resolved=${diff.resolved.length}; introduced=${diff.introduced.length}`,
    });
  }

  if (hasFlag('json')) {
    process.stdout.write(JSON.stringify(artifact, null, 2) + '\n');
  } else {
    printReport(surfaces, result, summary, diff, wantWrite);
  }

  const failOn = arg('fail-on');
  if (failOn) {
    const bar = SEVERITY_RANK[failOn];
    if (bar == null) { console.error(`[refuse] unknown --fail-on severity '${failOn}'`); process.exit(2); }
    const worst = findings.some((f) => f.severityRank <= bar);
    if (worst) process.exit(1);
  }

  // --fail-on-new: the "new static never creeps back" merge gate (2026-07-01 sweep).
  // The COMMITTED artifact is the baseline. A finding whose (surface,item) pair is
  // absent from the baseline is NEW — a static tile / dead-end / unreachable surface
  // introduced by this change. We diff on (surface,item), NOT the line-bearing key,
  // so moving an existing tile within a file does not trip the gate (only genuinely
  // new class×surface does). Regenerate + commit the artifact (--write) to accept a
  // finding into the reviewed baseline. Non-breaking: with no new findings, exits 0.
  if (hasFlag('fail-on-new')) {
    const prevPairs = new Set(prev.map((f) => `${f.surface}::${f.item}`));
    const introducedNew = findings.filter((f) => !prevPairs.has(`${f.surface}::${f.item}`));
    if (introducedNew.length) {
      console.error(`\n[fail-on-new] ${introducedNew.length} NEW finding(s) not in the committed audit-findings.json baseline:`);
      for (const f of introducedNew) {
        console.error(`  [${f.severity.toUpperCase()}] ${f.surfaceLabel} · ${f.title}${f.line ? ` (L${f.line})` : ''}  ${f.file || ''}`);
      }
      console.error(`\nEither fix the finding, or (if intentional/accepted) run:  node scripts/surface-audit.mjs --write  and commit the updated artifact so it is reviewed in the diff.`);
      process.exit(1);
    }
  }
}

function printReport(surfaces, result, summary, diff, wrote) {
  const line = (s) => process.stdout.write(s + '\n');
  line('# PROACTIVE SURFACE AUDIT (DR-0086) — deterministic, $0, no-LLM\n');
  line(`Surfaces in registry: ${result.coverage.surfacesTotal}`);
  line(`Source audited:       ${result.coverage.auditedSource}`);
  if (result.coverage.missingSource.length) line(`No source found for:  ${result.coverage.missingSource.join(', ')}`);
  line(`Reachability checked (top-level): ${result.coverage.reachabilityChecked.length} | not covered (church/books subs — documented limitation): ${result.coverage.reachabilitySkipped.length}`);
  line('');
  line(`## Findings: ${summary.total}  (critical ${summary.critical} · high ${summary.high} · medium ${summary.medium} · low ${summary.low})`);
  const byDim = Object.entries(summary.byDimension).map(([d, n]) => `${d}:${n}`).join('  ');
  if (byDim) line(`By dimension: ${byDim}`);
  line('');
  if (result.findings.length === 0) {
    line('PASS — no rubric findings on the audited surfaces.');
  } else {
    for (const f of result.findings) {
      line(`  [${f.severity.toUpperCase()}] ${f.surfaceLabel} · ${f.title}${f.line ? ` (L${f.line})` : ''}`);
      if (f.evidence) line(`        evidence: ${f.evidence}`);
      line(`        file: ${f.file || '(registry)'}  dim: ${f.dimension || '-'}`);
    }
  }
  line('');
  line(`Resolved since last run: ${diff.resolved.length}${diff.resolved.length ? ' — ' + diff.resolved.map((r) => `${r.surface}/${r.item}`).join(', ') : ''}`);
  line(`Newly introduced:        ${diff.introduced.length}`);
  line('');
  line(wrote
    ? `Wrote findings artifact -> app/src/lib/audit-findings.json (read through onto the Concerns board).`
    : `(dry run — pass --write to update app/src/lib/audit-findings.json + the event reel)`);
}

main().catch((e) => { console.error(`[error] ${e.message}\n${e.stack}`); process.exit(2); });
