#!/usr/bin/env node
// =============================================================================
// migration-return-type-guard — widening a RETURNS TABLE needs a DROP first,
// and forgetting one rolls back the WHOLE migration (DR-0076 §2 gate-the-class)
// =============================================================================
// THE INCIDENT THIS ENDS (measured live, 2026-08-27 02:24). Migration 0153 added
// two derived columns — bedrooms, bathrooms — to public_vacancies() with a plain
// CREATE OR REPLACE. Postgres refuses:
//
//     ERROR: cannot change return type of existing function
//     DETAIL: Row type defined by OUT parameters is different.
//     HINT: Use DROP FUNCTION public_vacancies() first.
//
// The damage was far wider than the function. db-migrate applies each file in
// its OWN --single-transaction, so one statement 270 lines down rolled the
// entire migration back: property_rooms and property_photos never existed,
// rentals never got its coordinate columns, and the ledger recorded the file
// 'failed' while everything upstream of the error looked perfectly correct in
// review. A return-type mistake is not a local mistake.
//
// THE RULE. If a migration redefines a function that an EARLIER migration
// already defined, and the RETURNS shape differs, that migration must carry a
// DROP FUNCTION for it BEFORE the CREATE. Same-shape redefinitions — the normal
// CREATE OR REPLACE case — are untouched, and must stay untouched: dropping a
// function needlessly discards its grants and its dependents.
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/migration-return-type-guard.mjs
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');

const stripComments = (sql) =>
  sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');

/**
 * Normalize a RETURNS clause so formatting alone never reads as a change.
 * Spacing around parens counts: a reformat that trips this guard is a false
 * alarm, and a false alarm is a broken gate exactly as surely as a silent one.
 */
export function normalizeReturns(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .trim()
    .toLowerCase();
}

/**
 * Every `CREATE OR REPLACE FUNCTION` in one migration, with the RETURNS clause
 * that decides whether a replace is legal.
 */
export function functionReturns(sql = '') {
  const clean = stripComments(sql);
  const out = [];
  const re = /create\s+or\s+replace\s+function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const name = m[1].toLowerCase();
    // Walk the argument list to its matching paren, then read to the body.
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < clean.length && depth > 0) {
      if (clean[i] === '(') depth += 1;
      else if (clean[i] === ')') depth -= 1;
      i += 1;
    }
    const bodyAt = clean.slice(i).search(/\bas\s*\$|\blanguage\b/i);
    if (bodyAt === -1) continue;
    const tail = clean.slice(i, i + bodyAt);
    const ret = /\breturns\b([\s\S]*)$/i.exec(tail);
    out.push({ name, returns: ret ? normalizeReturns(ret[1]) : '' });
  }
  return out;
}

/** The functions this migration drops before recreating. */
export function droppedFunctions(sql = '') {
  const clean = stripComments(sql);
  const out = new Set();
  const re = /drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi;
  let m;
  while ((m = re.exec(clean)) !== null) out.add(m[1].toLowerCase());
  return out;
}

export function migrationFiles(dir = MIGRATIONS) {
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * Every place a later migration changes a function's RETURNS shape without
 * dropping it first — the statement Postgres will refuse.
 */
export function check(dir = MIGRATIONS) {
  const lastShape = new Map();   // name -> { returns, file }
  const violations = [];
  for (const file of migrationFiles(dir)) {
    const sql = readFileSync(join(dir, file), 'utf8');
    const drops = droppedFunctions(sql);
    for (const { name, returns } of functionReturns(sql)) {
      const prior = lastShape.get(name);
      if (prior && prior.returns !== returns && !drops.has(name)) {
        violations.push({
          name,
          file,
          definedBy: prior.file,
          was: prior.returns,
          now: returns,
          fix: `add "DROP FUNCTION IF EXISTS public.${name}(...);" before the CREATE in ${file}`,
        });
      }
      lastShape.set(name, { returns, file });
    }
  }
  return violations;
}

const isMain = process.argv[1] && process.argv[1].endsWith('migration-return-type-guard.mjs');
if (isMain) {
  const violations = check();
  if (violations.length === 0) {
    console.log('migration-return-type-guard: OK — no migration changes a function\'s return type without dropping it first.');
    process.exit(0);
  }
  console.error(`::error::migration-return-type-guard: ${violations.length} migration(s) would be REFUSED by Postgres, rolling the whole file back.`);
  for (const v of violations) {
    console.error(`  ${v.name} in ${v.file}`);
    console.error(`    first defined by: ${v.definedBy}`);
    console.error(`    was: ${v.was.slice(0, 100)}`);
    console.error(`    now: ${v.now.slice(0, 100)}`);
    console.error(`    ${v.fix}`);
  }
  process.exit(1);
}
