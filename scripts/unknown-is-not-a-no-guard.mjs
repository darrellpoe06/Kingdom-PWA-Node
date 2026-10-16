#!/usr/bin/env node
// =============================================================================
// unknown-is-not-a-no-guard — an access read may not throw its error away
// (DR-1053; DR-0076 §3 proven-to-catch; DR-0239 gate-the-class)
// =============================================================================
// WHY THIS EXISTS. Darrell, 2026-10-15, from his phone at The Love Corner, sent
// a screenshot of the Choir tab reading "This is the choir's space. Ask the
// choir director to add you to the roster," and an hour later one of My Record
// reading "opening your record timed out after 15000 ms."
//
// The second explains the first. getChoirAccess was written like this:
//
//     const [{ data: role }, { data: inChoir }] = await Promise.all([
//       supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
//       supabase.rpc('user_in_choir',         { instance_uuid: tenantId }),
//     ]);
//     const { canEdit, canSee } = deriveAccess(role, inChoir);
//
// The `error` is destructured away. When the same stall that timed out My
// Record hit these two calls, `role` and `inChoir` came back undefined,
// deriveAccess said canSee:false, and the app told a member of the church that
// he was not on the roster. A failed read was printed to a human as a verdict
// about his standing.
//
// This is DR-0076's "unknown is never up" turned inside out: UNKNOWN IS NEVER A
// NO. The cure is lib/church-access.js, whose ask() returns a three-valued
// answer and whose knownOrUnavailable() short-circuits to `unavailable` instead
// of letting a missing answer fall through as a denial.
//
// WHAT THIS GUARD FORBIDS: destructuring `data` from a membership-or-role RPC
// without also taking `error`. That is the exact keystroke that produced the
// screenshot, and it is invisible in review because the code reads fine.
//
// WHAT IT DOES NOT FORBID: `const { data, error } = ...` (the error is in
// hand), the ask()/askRole()/askPredicate() helpers (the cure), or any RPC
// outside the access vocabulary — this guard is about the reads that decide
// whether a person is told they belong.
//
// PROVEN-TO-CATCH (DR-0076 §3): the unit tests feed this the ORIGINAL
// getChoirAccess body and REQUIRE a finding; they feed it the replacement and
// require none. A guard that cannot be shown to catch the break it was written
// for is theater.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');

// The RPCs whose answer decides whether a person is told they belong. A wrong
// answer here is not a missing list — it is a sentence about the person.
export const ACCESS_RPCS = [
  'user_role_in_instance',
  'user_in_instance',
  'user_in_choir',
  'user_in_ministry',
  'user_in_bus_ministry',
  'user_in_security',
  'user_in_group',
  'join_church_instance',
  'my_church_access',
];

// `{ data` ... `}` with no `error` before the closing brace, on a destructure
// whose right-hand side is a supabase.rpc call. Handles the renamed form
// (`{ data: role }`) and the array-destructured Promise.all form, which is
// matched per-element below.
const DESTRUCTURE = /(?:const|let|var)\s*(\[[^\]]*\]|\{[^}]*\})\s*=\s*await\s+([\s\S]{0,400}?);/g;

const hasError = (pattern) => /\berror\b/.test(pattern);
const namesAnAccessRpc = (rhs) => ACCESS_RPCS.some((n) => rhs.includes(`'${n}'`) || rhs.includes(`"${n}"`));

/**
 * Pure. Blank out comments while keeping every byte offset and newline, so
 * reported line numbers stay REAL.
 *
 * This guard needs it more than most: church-access.js quotes the exact broken
 * getChoirAccess body in its own header as the record of what went wrong, and a
 * guard that flagged its own cure's documentation would be a guard nobody could
 * keep green. (The same self-match bit the Python 3.9 check on 2026-10-14; the
 * cure there was real line numbers, and it is real line numbers here.)
 */
export function stripComments(src) {
  const text = String(src || '');
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:\\])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

/**
 * Pure. Every place an access RPC's answer is taken without its error.
 * Exported so the tests can prove it catches the real defect.
 */
export function findDiscardedErrors(text, file = '') {
  const out = [];
  const src = stripComments(text);
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;
  for (const m of src.matchAll(DESTRUCTURE)) {
    const [, pattern, rhs] = m;
    if (!namesAnAccessRpc(rhs)) continue;
    if (!/\bdata\b/.test(pattern)) continue;   // not taking the answer at all
    if (hasError(pattern)) continue;           // the error is in hand — fine
    out.push({
      file,
      line: lineOf(m.index),
      rpc: ACCESS_RPCS.find((n) => rhs.includes(`'${n}'`) || rhs.includes(`"${n}"`)) || '(access rpc)',
      text: pattern.replace(/\s+/g, ' ').trim().slice(0, 100),
    });
  }
  return out;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (name !== 'node_modules') walk(p, acc); }
    else if (/\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name)) acc.push(p);
  }
  return acc;
}

if (process.argv[1] && process.argv[1].endsWith('unknown-is-not-a-no-guard.mjs')) {
  const findings = [];
  for (const f of walk(SRC)) {
    for (const hit of findDiscardedErrors(readFileSync(f, 'utf8'), f.replace(`${ROOT}/`, ''))) findings.push(hit);
  }
  if (findings.length) {
    console.error('unknown-is-not-a-no-guard FAILED — an access read throws its error away, so a failed read');
    console.error('becomes a verdict about whether a person belongs (DR-1053). Take the error, or use');
    console.error('lib/church-access.js: askRole / askPredicate / knownOrUnavailable.');
    for (const h of findings) console.error(`  - ${h.file}:${h.line}  ${h.rpc}  ${h.text}`);
    process.exit(1);
  }
  console.log(`unknown-is-not-a-no-guard: OK — every access read in app/src keeps its error (${ACCESS_RPCS.length} RPCs watched).`);
}
