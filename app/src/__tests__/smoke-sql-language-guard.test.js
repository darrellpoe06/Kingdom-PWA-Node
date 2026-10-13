// @vitest-environment node
//
// A smoke that stops at line 52 proves nothing.
//
// THE INCIDENT (2026-09-12): 0209's smoke opened with two top-level PERFORM
// statements. PERFORM is plpgsql-only; at the psql top level it is a syntax
// error, so psql stopped dead on every run and every assertion below it — the
// giving wall, the prayer wall, the roll, the shelf — was never reached. The
// file listed fourteen assertions in its header and had never once run past
// its first statement. The rls-isolation leg was RED the whole time, and it
// merged anyway because that workflow is not a required check on the PR.
//
// This is the guard built from that, and this is the test that proves the
// guard CATCHES it — because a gate that always passes is itself a lie
// (DR-0076 rule 3).
import { describe, it, expect } from 'vitest';
import { scanTopLevel, PLPGSQL_ONLY } from '../../../scripts/smoke-sql-language-guard.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TESTS = join(ROOT, 'infra', 'supabase', 'tests');

describe('PROVEN-TO-CATCH — the exact line that shipped', () => {
  it('catches the real 0209 statement, verbatim', () => {
    // This is the line as it was written, letter for letter.
    const sql = [
      "SET LOCAL ROLE authenticated;",
      "PERFORM public.church_member_record_patch(jsonb_build_object(",
      "  'fullName', 'Sister Ruth'));",
    ].join('\n');
    const hits = scanTopLevel(sql, '0209.sql');
    expect(hits.length).toBe(1);
    expect(hits[0]).toMatchObject({ line: 2, word: 'PERFORM', use: 'SELECT' });
  });

  it('catches a top-level RAISE, IF-less and alone', () => {
    expect(scanTopLevel("RAISE NOTICE 'hello';").length).toBe(1);
  });

  it('is not fooled into flagging the SAME word inside a DO block', () => {
    const sql = [
      'DO $$',
      'BEGIN',
      "  PERFORM public.something();",
      "  RAISE NOTICE 'fine';",
      'END $$;',
    ].join('\n');
    expect(scanTopLevel(sql)).toEqual([]);
  });

  it('is not fooled by a CREATE FUNCTION body either', () => {
    const sql = [
      'CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid)',
      'RETURNS boolean LANGUAGE plpgsql AS $$',
      'BEGIN',
      "  PERFORM set_config('role','authenticated',true);",
      '  RETURN true;',
      'END $$;',
      'SELECT 1;',
    ].join('\n');
    expect(scanTopLevel(sql)).toEqual([]);
  });

  it('handles a one-line $$ body without losing its place', () => {
    const sql = [
      "CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;",
      'PERFORM f();',
    ].join('\n');
    const hits = scanTopLevel(sql);
    expect(hits.length, 'the even $$ count on line 1 must not flip the state').toBe(1);
    expect(hits[0].line).toBe(2);
  });

  it('ignores it inside a comment', () => {
    expect(scanTopLevel('-- PERFORM something();')).toEqual([]);
  });
});

describe('every smoke in the repo is clean', () => {
  const files = readdirSync(TESTS).filter((f) => f.endsWith('.sql')).sort();

  it('there are smokes to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('none carries a plpgsql-only statement at the psql top level', () => {
    const bad = [];
    for (const f of files) bad.push(...scanTopLevel(readFileSync(join(TESTS, f), 'utf8'), f));
    expect(bad, bad.map((b) => `${b.file}:${b.line} ${b.word}`).join('\n')).toEqual([]);
  });

  it('the 0209 smoke reaches its own PASS line now', () => {
    // The fix, pinned: SELECT where it used to say PERFORM, and the file still
    // ends in the NOTICE that says it got there.
    const src = readFileSync(join(TESTS, '0209-church-record-and-shelf-smoke.sql'), 'utf8');
    expect(src).toContain('SELECT public.church_member_record_patch(');
    expect(scanTopLevel(src, '0209').length).toBe(0);
    expect(src).toContain("CHURCH RECORD AND SHELF SMOKE: PASS");
    // ...and the story is kept where the next person writing a smoke will read it.
    expect(src).toMatch(/PROVED NOTHING FOR ITS FIRST DAY/);
  });
});

describe('the vocabulary is the plpgsql-only one', () => {
  it('names each word with what to use instead', () => {
    for (const { word, use } of PLPGSQL_ONLY) {
      expect(word).toMatch(/^[A-Z]+$/);
      expect(use.length).toBeGreaterThan(3);
    }
    expect(PLPGSQL_ONLY.map((x) => x.word)).toContain('PERFORM');
  });
  it('does NOT flag SELECT, INSERT, SET or BEGIN — they are fine at the top level', () => {
    for (const stmt of ['SELECT 1;', 'INSERT INTO t VALUES (1);', "SET LOCAL ROLE authenticated;", 'BEGIN;', 'ROLLBACK;']) {
      expect(scanTopLevel(stmt), stmt).toEqual([]);
    }
  });
});
