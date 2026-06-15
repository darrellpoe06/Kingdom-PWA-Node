// =============================================================================
// generate-charter.mjs — generate charter.yml FROM the canonical CHARTER.md.
// =============================================================================
// The canonical Charter (infra/ai-orchestrator/portable/charter/CHARTER.md) is
// the single source of truth: the human-approved policy. The orchestrator does
// not read prose — it reads charter.yml, the machine config. This script is the
// one-way bridge: parse CHARTER.md -> emit charter.yml. Generated, never
// hand-edited (same discipline as the DR ledger, which is parsed from the per-DR
// markdown into __DR_LEDGER__ at build time in app/vite.config.js).
//
// Usage:
//   node scripts/generate-charter.mjs           # write charter.yml from CHARTER.md
//   node scripts/generate-charter.mjs --check    # exit 1 if charter.yml is stale (no write)
//
// The freshness gate (app/src/__tests__/portable-bundle-fresh.test.js) runs the
// same generation and FAILS THE BUILD if the committed charter.yml drifts from
// CHARTER.md — so source and config can never silently disagree (DR-0075 perpetual
// improvement / DR-0076 verification doctrine: the generated artifact is verified
// against its source, not trusted on anyone's word).
//
// Typographic theology (CLAUDE.md Layer 0) is carried through verbatim: whatever
// CHARTER.md says, charter.yml says. The source governs capitalization.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CHARTER_MD_REL = 'infra/ai-orchestrator/portable/charter/CHARTER.md';
export const CHARTER_YML_REL = 'infra/ai-orchestrator/portable/charter/charter.yml';

// --- Markdown parsing helpers -----------------------------------------------
// CHARTER.md is authored to a small, deterministic convention so the parse is
// unambiguous: `## §N` sections, `###` subsections, `- ` bullets, `- key: value`
// kv lines, and `N. **id** — text` numbered standing rules.

// The text block of a `## ` section whose heading contains `marker`.
function section(md, marker) {
  const lines = md.split('\n');
  let out = null;
  for (const line of lines) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h && !/^###/.test(line)) {
      if (out !== null) break; // next ## section ends the current one
      if (h[1].includes(marker)) out = [];
      continue;
    }
    if (out !== null) out.push(line);
  }
  if (out === null) throw new Error(`CHARTER.md: section not found for marker "${marker}"`);
  return out.join('\n');
}

// The text block under a `### ` subsection (within a section) whose heading
// contains `titleSubstr`.
function subsection(sectionText, titleSubstr) {
  const lines = sectionText.split('\n');
  let out = null;
  for (const line of lines) {
    const h = /^###\s+(.*)$/.exec(line);
    if (h) {
      if (out !== null) break;
      if (h[1].includes(titleSubstr)) out = [];
      continue;
    }
    if (out !== null) out.push(line);
  }
  if (out === null) throw new Error(`CHARTER.md: subsection not found for "${titleSubstr}"`);
  return out.join('\n');
}

// Plain bullets: every `- ...` line, raw text after the dash. Excludes kv lines.
function bullets(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^\s*-\s+(.*\S)\s*$/.exec(line);
    if (m && !/^[a-z][a-z0-9_]*:\s/.test(m[1])) out.push(m[1]);
  }
  return out;
}

// Key/value bullets: `- key: value` -> { key: typedValue }, insertion-ordered.
function kv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = /^\s*-\s+([a-z][a-z0-9_]*):\s*(.*\S)\s*$/.exec(line);
    if (m) out[m[1]] = coerce(m[2]);
  }
  return out;
}

// Numbered standing rules: `N. **id** — text` -> { id, rule }.
function numbered(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^\s*\d+\.\s+\*\*(.+?)\*\*\s+[—-]\s+(.*\S)\s*$/.exec(line);
    if (m) out.push({ id: m[1].trim(), rule: m[2].trim() });
  }
  return out;
}

// Coerce a raw markdown scalar to boolean / number / string.
function coerce(raw) {
  const v = raw.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

// --- Structured model -------------------------------------------------------
// Parse CHARTER.md into the structured object charter.yml is built from. Pure;
// the gate imports this to compare against the committed file.
export function parseCharter(md) {
  const s1 = section(md, '§1');
  const s2 = section(md, '§2');
  const s3 = section(md, '§3 —');   // "§3 —" so it does not match "§3a —"
  const s3a = section(md, '§3a');
  const budgetSec = section(md, 'Budget ceilings');

  const posture = kv(subsection(s3, 'Posture'));
  const budget = kv(budgetSec);

  return {
    autonomy: kv(subsection(s3, 'Autonomy posture')),
    ask_vs_act: {
      act_conditions: bullets(subsection(s1, 'ACT now')),
      ask_triggers: bullets(subsection(s1, 'ASK first')),
    },
    standing_rules: numbered(s2),
    sovereignty: {
      role: posture.role,
      summons_vendor_on_unmet_need: posture.summons_vendor_on_unmet_need,
      restarts_vendor_after_offline: posture.restarts_vendor_after_offline,
      brakes_non_negotiable: posture.brakes_non_negotiable,
      routing_tiered_cheapest_first: bullets(subsection(s3, 'Routing')),
    },
    brakes: {
      budget: {
        per_task_usd: budget.per_task_usd,
        daily_usd: budget.daily_usd,
        monthly_usd: budget.monthly_usd,
      },
      ...kv(subsection(s3, 'Brakes')), // concurrency_lock, kill_switch, ...
    },
    resource: kv(subsection(s3a, 'Resource caps')),
    portability: kv(subsection(s3a, 'Portability')),
  };
}

// --- YAML emission ----------------------------------------------------------
// Hand-emitted so comments (the pending-confirmation mark) land exactly where
// intended and output is byte-deterministic. No YAML dependency in this repo.

// The budget keys ship as PROPOSED DEFAULTS until Darrell confirms; the mark is
// carried into the machine config so the unconfirmed status is visible there too.
const PENDING = '# DEFAULT — pending Darrell confirmation';

function scalar(v) {
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (/^[A-Za-z0-9_.\-/]+$/.test(s)) return s;        // bare token is safe + readable
  return `'${s.replace(/'/g, "''")}'`;                // single-quoted, YAML-escaped
}

export function generateCharterYml(md) {
  const c = parseCharter(md);
  const L = [];

  L.push('# =============================================================================');
  L.push('# charter.yml  --  GENERATED from CHARTER.md. DO NOT HAND-EDIT.');
  L.push('# =============================================================================');
  L.push('# Source of truth: infra/ai-orchestrator/portable/charter/CHARTER.md');
  L.push('# Regenerate:      npm run charter:gen   (node scripts/generate-charter.mjs)');
  L.push('# The portable-bundle freshness gate FAILS THE BUILD if this file drifts from');
  L.push('# CHARTER.md (DR-0075 / DR-0076). Change policy in CHARTER.md, then regenerate.');
  L.push('#');
  L.push('# Typographic theology (CLAUDE.md Layer 0) is carried through from the source.');
  L.push('# The orchestrator reads this at runtime, mounted read-only at /charter.');
  L.push('# =============================================================================');
  L.push('');

  // Autonomy posture (the supervisor honors self_drive_implemented as a HARD gate
  // ABOVE the ARM flag; ships false -> inert no matter what else is set).
  L.push('autonomy:');
  for (const [k, v] of Object.entries(c.autonomy)) L.push(`  ${k}: ${scalar(v)}`);
  L.push('');

  // Ask-vs-Act (default ACT).
  L.push('ask_vs_act:');
  L.push('  act_conditions:        # ACT now, report after -- only when ALL hold');
  for (const item of c.ask_vs_act.act_conditions) L.push(`    - ${scalar(item)}`);
  L.push('  ask_triggers:          # ASK first -- surface for human approval');
  for (const item of c.ask_vs_act.ask_triggers) L.push(`    - ${scalar(item)}`);
  L.push('');

  // Standing rules (always in force).
  L.push('standing_rules:');
  for (const r of c.standing_rules) {
    L.push(`  - id: ${scalar(r.id)}`);
    L.push(`    rule: ${scalar(r.rule)}`);
  }
  L.push('');

  // Sovereignty / the bridge.
  L.push('sovereignty:');
  L.push(`  role: ${scalar(c.sovereignty.role)}`);
  L.push(`  summons_vendor_on_unmet_need: ${scalar(c.sovereignty.summons_vendor_on_unmet_need)}`);
  L.push(`  restarts_vendor_after_offline: ${scalar(c.sovereignty.restarts_vendor_after_offline)}`);
  L.push(`  brakes_non_negotiable: ${scalar(c.sovereignty.brakes_non_negotiable)}`);
  L.push('  routing_tiered_cheapest_first:');
  for (const t of c.sovereignty.routing_tiered_cheapest_first) L.push(`    - ${scalar(t)}`);
  L.push('');

  // Brakes (the three brakes; non-negotiable).
  L.push('brakes:');
  L.push('  budget:');
  L.push(`    per_task_usd: ${scalar(c.brakes.budget.per_task_usd)}   ${PENDING}`);
  L.push(`    daily_usd: ${scalar(c.brakes.budget.daily_usd)}      ${PENDING}`);
  L.push(`    monthly_usd: ${scalar(c.brakes.budget.monthly_usd)}   ${PENDING}`);
  for (const [k, v] of Object.entries(c.brakes)) {
    if (k === 'budget') continue;
    L.push(`  ${k}: ${scalar(v)}`);
  }
  L.push('');

  // Resource caps (cpus=1/mem=1g is itself a brake) + portability.
  L.push('resource:');
  for (const [k, v] of Object.entries(c.resource)) L.push(`  ${k}: ${scalar(v)}`);
  L.push('');
  L.push('portability:');
  for (const [k, v] of Object.entries(c.portability)) L.push(`  ${k}: ${scalar(v)}`);
  L.push('');

  return L.join('\n');
}

// --- CLI --------------------------------------------------------------------
function main() {
  const md = readFileSync(join(repoRoot, CHARTER_MD_REL), 'utf8');
  const yml = generateCharterYml(md);
  const out = join(repoRoot, CHARTER_YML_REL);
  const check = process.argv.includes('--check');
  if (check) {
    let current = '';
    try { current = readFileSync(out, 'utf8'); } catch { /* missing => stale */ }
    if (current !== yml) {
      console.error('charter.yml is STALE — regenerate: npm run charter:gen');
      process.exit(1);
    }
    console.log('charter.yml is fresh (matches CHARTER.md).');
    return;
  }
  writeFileSync(out, yml);
  console.log('generated', CHARTER_YML_REL, 'from', CHARTER_MD_REL);
}

// Run only when invoked directly (not when imported by the gate).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
