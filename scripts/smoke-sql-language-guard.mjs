#!/usr/bin/env node
// =============================================================================
// smoke-sql-language-guard — a smoke that stops at line 52 proves nothing
// =============================================================================
// THE INCIDENT (2026-09-12). 0209's smoke opened with two top-level PERFORM
// statements. PERFORM is plpgsql-only; at the psql top level it is a SYNTAX
// ERROR, so psql stopped dead at line 52 on every run and every assertion below
// it — the giving wall, the prayer wall, the roll, the shelf — was never
// reached. The rls-isolation leg was RED from the day the file was written, and
// it merged anyway because that workflow is not a required check on the PR.
//
// The file LOOKED like a thorough proof. It listed fourteen assertions in its
// header. It had simply never run.
//
// This guard is that incident turned into a machine check (DR-0076: every
// "a human would have known" failure becomes a gate that prevents recurrence).
// It is deliberately narrow and deliberately fast: it does not parse SQL, it
// tracks $$-quoted blocks and flags plpgsql-only statements outside them.
//
// WHAT IS PLPGSQL-ONLY, and therefore fatal at the top level:
//   PERFORM        — use SELECT
//   RAISE          — wrap in DO $$ BEGIN ... END $$;
//   IF / LOOP      — same
//   RETURN         — same
//   DECLARE        — same
//
// Inside $$ ... $$ (a DO block or a CREATE FUNCTION body) every one of them is
// correct. That is the whole difficulty: the same word is right in one place
// and fatal two lines away, and nothing says so until a run dies.
// =============================================================================
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const TESTS = join(ROOT, 'infra', 'supabase', 'tests');

/** Statements psql cannot run outside a $$ block. */
export const PLPGSQL_ONLY = Object.freeze([
  { word: 'PERFORM', use: 'SELECT' },
  { word: 'RAISE', use: 'a DO $$ BEGIN ... END $$; block' },
  { word: 'DECLARE', use: 'a DO $$ DECLARE ... BEGIN ... END $$; block' },
  { word: 'RETURN', use: 'a DO $$ ... $$; block, or drop it' },
]);

/**
 * Every plpgsql-only statement sitting at the psql top level.
 *
 * Pure, and exported so the suite can prove the guard catches the real 0209
 * line rather than trusting that it would.
 */
export function scanTopLevel(sql, file = '') {
  const out = [];
  let inDollar = false;
  const lines = String(sql || '').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.replace(/--.*$/, '');
    // Every $$ on the line toggles: an odd count flips the state, an even one
    // (a one-line body) leaves it where it was.
    const dollars = (line.match(/\$\$/g) || []).length;
    const startedInside = inDollar;
    if (dollars % 2 === 1) inDollar = !inDollar;
    if (startedInside) continue;          // the line began inside a body
    const t = line.trim();
    for (const { word, use } of PLPGSQL_ONLY) {
      if (new RegExp(`^${word}\\b`, 'i').test(t)) {
        out.push({ file, line: i + 1, word, use, text: t.slice(0, 90) });
      }
    }
  }
  return out;
}

function main() {
  let files = [];
  try {
    files = readdirSync(TESTS).filter((f) => f.endsWith('.sql')).sort();
  } catch {
    console.log('smoke-sql-language-guard: no infra/supabase/tests directory — nothing to check.');
    return 0;
  }
  const bad = [];
  for (const f of files) {
    bad.push(...scanTopLevel(readFileSync(join(TESTS, f), 'utf8'), relative(ROOT, join(TESTS, f))));
  }
  if (bad.length === 0) {
    console.log(`smoke-sql-language-guard: OK — ${files.length} smoke file(s), no plpgsql-only statement at the psql top level.`);
    return 0;
  }
  console.log('smoke-sql-language-guard FAILED — psql will stop dead here, and every assertion below it proves nothing:\n');
  for (const b of bad) {
    console.log(`  ${b.file}:${b.line}  ${b.word} at the top level — use ${b.use}`);
    console.log(`      ${b.text}`);
  }
  console.log('\nThis is the 0209 incident (2026-09-12): a smoke listing fourteen assertions');
  console.log('that had never once run past its first statement.');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
