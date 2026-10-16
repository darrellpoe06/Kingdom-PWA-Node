// @vitest-environment node
// =============================================================================
// A sentence outside a comment is not SQL (DR-1080)
// =============================================================================
// THE INCIDENT, 2026-10-16. Rebuilding migration 0298 on top of 0257, a script
// sliced from `body.index('CREATE OR REPLACE FUNCTION')` — and the FIRST match
// was inside 0257's own header comment. The slice began mid-comment and left
// a bare sentence with no `--`. Postgres refused the file, BOTH databases
// refused it, and every migration queued behind it waited.
//
// WHAT DID NOT CATCH IT: 23 gates (none parses SQL), 26,422 tests (none
// applies a migration), and — worst — the migration's OWN test, which asserted
// the file still contained "CREATE OR REPLACE FUNCTION" to prove its
// comment-stripper had not blanked it. That assertion passed BECAUSE OF the
// broken line: the stripper dropped `--` lines, the corrupted line had none,
// so it survived and satisfied the check written to prove the file was whole.
//
// So the first case below is the real line, verbatim.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { proseOutsideComment } from '../../../scripts/migration-prose-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('PROVEN-TO-CATCH — the line that stopped the migration queue', () => {
  it('catches the real 0298 line, verbatim', () => {
    const sql = [
      '-- 0298 — our own probe is not a person',
      'CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).',
      'CREATE OR REPLACE FUNCTION public.x() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;',
    ].join('\n');
    const hits = proseOutsideComment(sql, '0298.sql');
    expect(hits.length).toBe(1);
    expect(hits[0]).toMatchObject({ file: '0298.sql', line: 2 });
    expect(hits[0].text).toMatch(/same RETURNS shape/);
  });

  it('catches a header paragraph that lost its markers entirely', () => {
    // The other shape of the same paste error.
    const sql = 'This migration adds a category and filters the counts.\nSELECT 1;';
    expect(proseOutsideComment(sql)).toHaveLength(1);
  });
});

describe('...and does NOT cry wolf — the first version flagged ten real lines', () => {
  it('a column definition with a trailing comment ending in a period passes', () => {
    // infra/supabase/migrations-auto/0011-choir-module.sql:71, verbatim.
    expect(proseOutsideComment('  notes         text,                 -- arrangement notes, who leads, etc.')).toEqual([]);
    // 0153, where the trailing comment is two sentences.
    expect(proseOutsideComment('  rental_ref     uuid,                 -- the door. Survives every tenancy on it.')).toEqual([]);
  });

  it('a whole-line comment is allowed to be prose — that is what comments are', () => {
    expect(proseOutsideComment('-- This file does a thing. It does it carefully.')).toEqual([]);
  });

  it('a /* … */ banner is prose by design, across lines', () => {
    // 0202:403 lives inside one of these.
    const sql = ['/*', ' * owner/admin of the household.', ' * Another sentence.', ' */', 'SELECT 1;'].join('\n');
    expect(proseOutsideComment(sql)).toEqual([]);
  });

  it('a function BODY is opaque — a period inside it is none of our business', () => {
    const sql = [
      'CREATE FUNCTION f() RETURNS text LANGUAGE plpgsql AS $$',
      'BEGIN',
      "  RAISE NOTICE 'this sentence ends in a period.';",
      "  RETURN 'done.';",
      'END $$;',
    ].join('\n');
    expect(proseOutsideComment(sql)).toEqual([]);
  });

  it('a decimal at end of line is a number, not a sentence', () => {
    expect(proseOutsideComment('  rate numeric NOT NULL DEFAULT 0.')).toEqual([]);
  });
});

describe('the whole tree is clean, and the check actually read it', () => {
  it('every migration and smoke on disk passes', () => {
    const dirs = [join(ROOT, 'infra', 'supabase', 'migrations-auto'), join(ROOT, 'infra', 'supabase', 'tests')];
    let files = 0;
    const bad = [];
    for (const dir of dirs) {
      for (const n of readdirSync(dir)) {
        if (!n.endsWith('.sql')) continue;
        files += 1;
        bad.push(...proseOutsideComment(readFileSync(join(dir, n), 'utf8'), n));
      }
    }
    // A guard that read nothing would also report nothing wrong.
    expect(files, 'the scan found no SQL files at all').toBeGreaterThan(300);
    expect(bad.map((b) => `${b.file}:${b.line} ${b.text}`)).toEqual([]);
  });

  it('0298 itself is whole — the file the incident was about', () => {
    const sql = readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto',
      '0298-our-own-probe-is-not-a-person.sql'), 'utf8');
    expect(proseOutsideComment(sql, '0298')).toEqual([]);
    // And the line it should have been all along is a comment again.
    expect(sql).toMatch(/--.*CREATE OR REPLACE FUNCTION, same RETURNS shape/);
  });
});
