// =============================================================================
// migration-return-type-guard — proven-to-catch (DR-0076 §3)
// =============================================================================
// The real incident, 2026-08-27 02:24: migration 0153 added two derived columns
// to public_vacancies() with a plain CREATE OR REPLACE. Postgres refused —
// "cannot change return type of existing function" — and because db-migrate
// applies each file in its own transaction, one statement 270 lines down rolled
// the ENTIRE migration back. property_rooms and property_photos never existed,
// rentals never got its coordinates, and every line above the error had looked
// perfectly correct in review.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeReturns, functionReturns, droppedFunctions, check,
} from '../../../scripts/migration-return-type-guard.mjs';

const fn = (name, returns, body = 'select 1') =>
  `CREATE OR REPLACE FUNCTION public.${name}()\nRETURNS ${returns}\nLANGUAGE sql STABLE\nAS $$\n  ${body}\n$$;`;

/** A throwaway migrations dir, so the guard is exercised end to end. */
function withDir(files, run) {
  const dir = mkdtempSync(join(tmpdir(), 'mig-'));
  try {
    for (const [name, sql] of Object.entries(files)) writeFileSync(join(dir, name), sql);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('reading a migration', () => {
  it('reads a function name and its RETURNS clause', () => {
    const [f] = functionReturns(fn('public_vacancies', 'TABLE ( id uuid, rent numeric )'));
    expect(f.name).toBe('public_vacancies');
    expect(f.returns).toContain('id uuid');
  });

  it('walks past an argument list containing its own parens', () => {
    const sql = `CREATE OR REPLACE FUNCTION public.thing(p_a text DEFAULT (now())::text, p_b int)\nRETURNS boolean\nLANGUAGE sql AS $$ select true $$;`;
    const [f] = functionReturns(sql);
    expect(f.name).toBe('thing');
    expect(f.returns).toBe('boolean');
  });

  it('treats formatting as no change at all', () => {
    expect(normalizeReturns('TABLE (\n  id   uuid,\n  rent numeric\n)'))
      .toBe(normalizeReturns('table (id uuid, rent numeric)'));
  });

  it('does not read a RETURNS out of a comment', () => {
    const sql = `-- RETURNS TABLE ( id uuid, gone text )\n${fn('x', 'boolean')}`;
    expect(functionReturns(sql)[0].returns).toBe('boolean');
  });

  it('finds the drops, with or without IF EXISTS and the schema', () => {
    const d = droppedFunctions('DROP FUNCTION IF EXISTS public.a(); drop function b(uuid);');
    expect(d.has('a')).toBe(true);
    expect(d.has('b')).toBe(true);
  });
});

describe('the rule', () => {
  it('CATCHES a widened RETURNS TABLE with no drop — the real 0153 defect', () => {
    const v = withDir({
      '0152-vacancies.sql': fn('public_vacancies', 'TABLE ( id uuid, rent numeric )'),
      '0153-photos.sql': fn('public_vacancies', 'TABLE ( id uuid, rent numeric, bedrooms integer )'),
    }, check);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'public_vacancies', file: '0153-photos.sql', definedBy: '0152-vacancies.sql' });
    expect(v[0].fix).toMatch(/DROP FUNCTION IF EXISTS public\.public_vacancies/);
  });

  it('PASSES once the drop is there', () => {
    const v = withDir({
      '0152-vacancies.sql': fn('public_vacancies', 'TABLE ( id uuid, rent numeric )'),
      '0153-photos.sql': `DROP FUNCTION IF EXISTS public.public_vacancies();\n${fn('public_vacancies', 'TABLE ( id uuid, rent numeric, bedrooms integer )')}`,
    }, check);
    expect(v).toEqual([]);
  });

  it('leaves an ordinary same-shape replace alone', () => {
    // Dropping needlessly discards grants and dependents, so the guard must not
    // push anyone toward a drop they do not need.
    const v = withDir({
      '0100-a.sql': fn('thing', 'boolean', 'select true'),
      '0101-b.sql': fn('thing', 'boolean', 'select false'),
    }, check);
    expect(v).toEqual([]);
  });

  it('catches a NARROWED return too — Postgres refuses either direction', () => {
    const v = withDir({
      '0100-a.sql': fn('thing', 'TABLE ( id uuid, extra text )'),
      '0101-b.sql': fn('thing', 'TABLE ( id uuid )'),
    }, check);
    expect(v).toHaveLength(1);
  });

  it('catches a scalar return type change', () => {
    const v = withDir({
      '0100-a.sql': fn('thing', 'boolean'),
      '0101-b.sql': fn('thing', 'jsonb'),
    }, check);
    expect(v).toHaveLength(1);
    expect(v[0].was).toBe('boolean');
    expect(v[0].now).toBe('jsonb');
  });

  it('says nothing about a function only one migration defines', () => {
    expect(withDir({ '0100-a.sql': fn('only', 'boolean') }, check)).toEqual([]);
  });

  it('compares against the NEWEST prior shape, not the oldest', () => {
    // a -> b -> b is fine at the last step even though a differs from b.
    const v = withDir({
      '0100-a.sql': fn('thing', 'boolean'),
      '0101-b.sql': `DROP FUNCTION IF EXISTS public.thing();\n${fn('thing', 'jsonb')}`,
      '0102-c.sql': fn('thing', 'jsonb'),
    }, check);
    expect(v).toEqual([]);
  });
});

describe('the repository as it stands', () => {
  it('has no migration that would be refused', () => {
    expect(check()).toEqual([]);
  });
});
