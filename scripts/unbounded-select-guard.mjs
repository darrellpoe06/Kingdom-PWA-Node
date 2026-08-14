// =============================================================================
// unbounded-select-guard — no NEW `.select('*')` without a bound
// =============================================================================
// Born from the 2026-08-14 lockout (DR-0303). Every account across all four
// apps was locked out for over a day because ONE query was
// `.select('*')` with no limit against a table that had grown base64 screenshot
// columns — 6.2 MB pulled on every sign-in, for every user, plus a full re-pull
// on every realtime insert. Nothing in the repo objected, because nothing was
// looking.
//
// The class is not "someone wrote bad code." It is that a query written when a
// table was small stays written after the table grows a blob column, and the
// cost only shows up as a bill. A `select('*')` is a standing promise to
// transfer every column that table will ever have.
//
// THIS IS A RATCHET, NOT A SWEEP. There are 47 such calls today. Failing all of
// them would be a week of work and would tell Darrell nothing he can act on. So
// today's set is frozen as a grandfathered baseline — exactly the shape of
// scripts/monolith-budget.json and lessons-gate-coverage.mjs — and the guard
// fails only on a NEW one. Fixing an old one shrinks the baseline; it can only
// improve.
//
// A query is BOUND when it carries any of: `.limit(`, `.range(`, `.single()`,
// `.maybeSingle()`, or an explicit column list instead of `*`. Any of those
// makes the transfer size predictable, which is the whole point.
//
// Usage:
//   node scripts/unbounded-select-guard.mjs
//   node scripts/unbounded-select-guard.mjs --list   # print the current baseline
// =============================================================================
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'app/src');
const BASELINE = join(HERE, 'unbounded-select-baseline.json');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) { if (e !== '__tests__' && e !== 'node_modules') walk(p, out); }
    else if (/\.(js|jsx)$/.test(e)) out.push(p);
  }
  return out;
}

/** Strip // and /* *\/ comments so prose is never measured as code. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/^\s*\/\/.*$/, '')).join('\n');
}

const BOUND = /\.limit\(|\.range\(|\.single\(\)|\.maybeSingle\(\)/;

export function findUnbounded(files = walk(SRC)) {
  const hits = [];
  for (const file of files) {
    const code = stripComments(readFileSync(file, 'utf8'));
    const lines = code.split('\n');
    lines.forEach((line, i) => {
      if (!/\.select\(\s*'\*'\s*\)/.test(line)) return;
      // A query chain can span lines; look at a small window for the bound.
      const window = lines.slice(i, i + 6).join('\n');
      if (BOUND.test(window)) return;
      const rel = relative(ROOT, file);
      // Prefer the table name when it is on the same line, for a readable key.
      const m = line.match(/\.from\(\s*'([\w.]+)'\s*\)/);
      hits.push({ key: `${rel}:${m ? m[1] : 'unknown'}`, file: rel, line: i + 1, table: m ? m[1] : null });
    });
  }
  return hits;
}

function main() {
  if (!existsSync(SRC)) { console.log('unbounded-select-guard: app/src not found — skipping.'); process.exit(0); }
  const hits = findUnbounded();
  const keys = [...new Set(hits.map((h) => h.key))].sort();

  if (process.argv.includes('--list')) {
    console.log(JSON.stringify(keys, null, 2));
    process.exit(0);
  }

  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
  const known = new Set(baseline);
  const fresh = keys.filter((k) => !known.has(k));
  const healed = baseline.filter((k) => !keys.includes(k));

  console.log(`unbounded-select-guard: ${keys.length} unbounded select('*') call sites; ${baseline.length} grandfathered.`);

  const problems = [];
  for (const k of fresh) problems.push(`NEW unbounded select('*') — ${k}\n     add .limit(...) or name the columns; a bare '*' ships every column the table will ever have`);
  for (const k of healed) problems.push(`${k} is now bounded — remove it from ${relative(ROOT, BASELINE)} (shrink-only).`);

  if (problems.length === 0) {
    console.log('OK — no new unbounded select; the baseline holds (shrink-only).');
    process.exit(0);
  }
  console.error('\nunbounded-select-guard: FAIL —');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nThe 2026-08-14 lockout was one unbounded select on a table that grew blob columns (DR-0303).');
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('unbounded-select-guard.mjs')) main();
