#!/usr/bin/env node
// =============================================================================
// stamp-carries-its-year-guard — a record's stamp names its year (DR-1063)
// =============================================================================
// Darrell, 2026-10-16: "We need to have dates and time stamps... so we can sort
// out the dates and events over time historical accuracy."
//
// WHAT THIS CATCHES, and it is one specific thing rather than a style opinion:
// a date formatter that OMITS THE YEAR, applied to a value that is a RECORD'S
// OWN TIMESTAMP. Choir → Songs shipped exactly that — `{ month: 'short', day:
// 'numeric' }` rendering `idea.createdAt` as "Sep 6". Which September? A list
// carrying that stamp cannot be ordered across years, and on a record older
// than a year the stamp is not shorter, it is WRONG.
//
// WHY IT IS NARROW ON PURPOSE. A year-less stamp is CORRECT for something in
// the current week — "Sun, Oct 19" for this Sunday's service reads better with
// no year, and BusMinistry, ServiceProgram and MinistryOps are all right to use
// one. So this guard does not ban the format. It bans the PAIRING: a year-less
// formatter applied to a timestamp field, which is history rather than
// this-week.
//
// SHRINK-ONLY, like lessons-gate-coverage. The pairing exists in files this
// change does not touch, so the known set is a committed baseline: the count
// may fall and never rise, and a NEW name is refused by name. A guard that
// failed the whole build on day one would simply be reverted, and a reverted
// guard protects nothing.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'app', 'src');
const BASELINE = join(HERE, 'stamp-year-baseline.json');

/** A value that is a record's own timestamp — history, not this week. */
const TIMESTAMP_ARG = /\b\w+\.(createdAt|created_at|updatedAt|updated_at|recordedAt|loggedAt|decidedAt|decided_at)\b/;

/** Blank comments while keeping byte offsets, so a comment never self-matches. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '__tests__') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/** Formatter names in this file whose toLocaleDateString omits `year`. */
function yearlessFormatters(code) {
  const names = new Set();
  const re = /(?:const|let|function)\s+([A-Za-z_$][\w$]*)\s*(?:=|\()[\s\S]{0,400}?toLocaleDateString\(\s*[^)]*?\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(code))) {
    const [, name, opts] = m;
    if (/\byear\s*:/.test(opts)) continue;
    if (!/\b(month|day|weekday)\s*:/.test(opts)) continue;   // `{}` or locale-only: not our case
    names.add(name);
  }
  return names;
}

const findings = [];
for (const file of walk(SRC)) {
  const code = stripComments(readFileSync(file, 'utf8'));
  const rel = relative(ROOT, file);

  // 1. A year-less named formatter applied to a timestamp field.
  for (const name of yearlessFormatters(code)) {
    const use = new RegExp(`\\b${name}\\(\\s*([^)]{0,120})\\)`, 'g');
    let u;
    while ((u = use.exec(code))) {
      if (TIMESTAMP_ARG.test(u[1])) { findings.push(`${rel}: ${name}(${u[1].trim()}) drops the year`); break; }
    }
  }

  // 2. The inline form: new Date(x.createdAt).toLocaleDateString({...no year}).
  const inline = /new Date\(\s*([^)]{0,120})\)\s*\.toLocaleDateString\(\s*[^)]*?\{([^}]*)\}/g;
  let i;
  while ((i = inline.exec(code))) {
    const [, arg, opts] = i;
    if (/\byear\s*:/.test(opts)) continue;
    if (!/\b(month|day|weekday)\s*:/.test(opts)) continue;
    if (TIMESTAMP_ARG.test(arg)) findings.push(`${rel}: inline stamp of ${arg.trim()} drops the year`);
  }
}

const found = [...new Set(findings)].sort();
const key = (s) => s.split(':')[0];

let baseline = [];
try { baseline = JSON.parse(readFileSync(BASELINE, 'utf8')).known || []; } catch { baseline = []; }

if (process.argv.includes('--write-baseline')) {
  writeFileSync(BASELINE, `${JSON.stringify({
    note: 'DR-1063. Year-less stamps on record timestamps that predate the guard. SHRINK ONLY — this list may lose entries and must never gain one.',
    known: found,
  }, null, 2)}\n`);
  console.log(`stamp-carries-its-year-guard: baseline written with ${found.length} known pairing(s).`);
  process.exit(0);
}

const knownFiles = new Set(baseline.map(key));
const fresh = found.filter((f) => !baseline.includes(f) && !knownFiles.has(key(f)));

if (fresh.length) {
  console.error('stamp-carries-its-year-guard: FAIL — a record stamp was added that drops its year.');
  for (const f of fresh) console.error(`  - ${f}`);
  console.error('\n  A stamp on a record\'s own timestamp must name the year, or the list cannot be');
  console.error('  read over time (DR-1063). Use `stamp()` from app/src/lib/record-stamp.js.');
  console.error('  A year-less format is still right for something in the CURRENT WEEK — just not');
  console.error('  for a createdAt.');
  process.exit(1);
}

if (found.length > baseline.length) {
  console.error(`stamp-carries-its-year-guard: FAIL — ${found.length} pairings against a baseline of ${baseline.length}.`);
  process.exit(1);
}

const fixed = baseline.length - found.length;
console.log(
  `stamp-carries-its-year-guard: OK — no new year-less record stamp; ${found.length} known`
  + `${fixed > 0 ? `, ${fixed} fewer than the baseline (update it)` : ''}.`,
);
