// =============================================================================
// An allow-list is added to, never rewritten (DR-0976)
// =============================================================================
// MEASURED. rls-isolation failed every run from 2026-10-11T04:44:22Z onward —
// 10 runs, ~28 hours — always on the same line:
//
//   0263-document-signing-smoke.sql:203: ERROR: DOCUMENT SIGNING SMOKE FAIL:
//   the family asks for both signatures (expected succeeds=t, got f)
//
// 0275 rebuilt door_events_subject_check from 0262's two values plus 'stay',
// so 0263's 'document' and 0266's 'camera' were deleted. Lease signing (three
// writes) and door-camera access (a trigger) raised on every write, live.
//
// The values below are read from the REAL migration files, never retyped, so
// these cases cannot drift into testing a paraphrase of the bug — the mistake
// 0275 made was exactly a retyped list.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  allowListsIn,
  declarationsIn,
  judgeChain,
  migrationFiles,
} from '../../../scripts/constraint-allow-list-guard.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DIR = join(REPO_ROOT, 'infra/supabase/migrations-auto');
const read = (f) => readFileSync(join(DIR, f), 'utf8');
const find = (n) => readdirSync(DIR).find((f) => f.startsWith(n));

const subjectsOf = (prefix) => {
  const hit = allowListsIn(read(find(prefix))).find((l) => l.constraint === 'door_events_subject_check');
  return hit ? hit.values : null;
};

describe('the real constraint history, read from the real files', () => {
  it('is exactly the chain that broke: 0275 drops two values 0269 allowed', () => {
    expect(subjectsOf('0263')).toEqual(['rent', 'work', 'document']);
    expect(subjectsOf('0266')).toEqual(['rent', 'work', 'document', 'camera']);
    expect(subjectsOf('0269')).toEqual(['rent', 'work', 'document', 'camera', 'stay']);
    expect(subjectsOf('0275')).toEqual(['rent', 'work', 'application', 'stay', 'portal-request']);
    // The two that fell out, named rather than implied.
    expect(subjectsOf('0275')).not.toContain('document');
    expect(subjectsOf('0275')).not.toContain('camera');
  });

  it('0279 restores the UNION — nothing 0275 added is dropped in turn', () => {
    const final = subjectsOf('0279');
    for (const v of ['rent', 'work', 'document', 'camera', 'stay', 'application', 'portal-request']) {
      expect(final, `0279 must allow '${v}'`).toContain(v);
    }
    // A fix that fixed signing by deleting 0275's own values would be the same
    // mistake in the other direction.
    for (const v of subjectsOf('0275')) expect(final).toContain(v);
    for (const v of subjectsOf('0269')) expect(final).toContain(v);
  });
});

describe('PROVEN-TO-CATCH: the guard on the chain that actually shipped', () => {
  const chain = (...sets) =>
    sets.map((values, i) => ({
      name: `000${i}.sql`,
      sql: `ALTER TABLE public.t ADD CONSTRAINT c\n  CHECK (subject IN (${values.map((v) => `'${v}'`).join(', ')}));`,
    }));

  it('a rebuild that drops an earlier value FAILS, naming the values', () => {
    const { findings } = judgeChain(chain(['rent', 'work', 'document'], ['rent', 'work', 'stay']));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/DROPS 'document'/);
    expect(findings[0], 'the message must name the fix, not just the fault').toMatch(/allow-list-change/);
  });

  it('a rebuild that only ADDS passes', () => {
    expect(judgeChain(chain(['rent', 'work'], ['rent', 'work', 'document'])).findings).toEqual([]);
  });

  it('reordering the same values is not a drop', () => {
    expect(judgeChain(chain(['rent', 'work'], ['work', 'rent'])).findings).toEqual([]);
  });

  it('a drop is allowed when the SAME FILE declares it', () => {
    const files = chain(['rent', 'work', 'document'], ['rent', 'work']);
    files[1].sql = `-- allow-list-change: c document -- it moved to its own table\n${files[1].sql}`;
    expect(judgeChain(files).findings).toEqual([]);
  });

  it('A DECLARATION BINDS ONLY ITS OWN FILE — it is never a standing licence', () => {
    // My own mutation test caught this hole: accumulating declarations across
    // the chain meant that once 0275 declared 'document' removable, every
    // later file could drop it again in silence, and reverting 0279's union
    // produced no finding at all.
    const files = chain(['rent', 'work', 'document'], ['rent', 'work'], ['rent', 'work']);
    files[1].sql = `-- allow-list-change: c document -- declared here only\n${files[1].sql}`;
    const { findings } = judgeChain(files);
    expect(findings, 'the third file must still be caught').toHaveLength(1);
    expect(findings[0]).toMatch(/0002\.sql/);
  });

  it('a declaration for a DIFFERENT value does not cover this one', () => {
    const files = chain(['rent', 'work', 'document', 'camera'], ['rent', 'work']);
    files[1].sql = `-- allow-list-change: c document -- only this one\n${files[1].sql}`;
    const { findings } = judgeChain(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/DROPS 'camera'/);
    expect(findings[0]).not.toMatch(/'document'/);
  });

  it('constraints are tracked separately — one is not the other', () => {
    const files = [
      { name: '0001.sql', sql: "ALTER TABLE public.a ADD CONSTRAINT one\n  CHECK (s IN ('x', 'y'));" },
      { name: '0002.sql', sql: "ALTER TABLE public.b ADD CONSTRAINT two\n  CHECK (s IN ('z'));" },
    ];
    expect(judgeChain(files).findings).toEqual([]);
  });
});

describe('the parser reads the real files', () => {
  it('finds 0275s declarations, and reads them as constraint+value pairs', () => {
    const d = declarationsIn(read(find('0275')));
    expect(d.has('door_events_subject_check document')).toBe(true);
    expect(d.has('door_events_subject_check camera')).toBe(true);
  });

  it('0275 keeps the SQL it actually applied — only its record is corrected', () => {
    // An applied migration's effect is never edited. The correction is a
    // comment; the statement must still be the narrow one that shipped.
    expect(subjectsOf('0275')).toEqual(['rent', 'work', 'application', 'stay', 'portal-request']);
    expect(read(find('0275'))).toMatch(/CORRECTION, ADDED 2026-10-12/);
  });

  it('walks the migrations in replay order, by numeric prefix', () => {
    const files = migrationFiles(DIR);
    const nums = files.map((f) => parseInt(f, 10));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(files.some((f) => f.startsWith('0279'))).toBe(true);
  });

  it('THE WHOLE REAL CHAIN PASSES — this is the gate, not a sample of it', () => {
    const files = migrationFiles(DIR).map((name) => ({ name, sql: read(name) }));
    const { findings, checked } = judgeChain(files);
    expect(findings, `the live chain must be clean:\n${findings.join('\n')}`).toEqual([]);
    expect(checked, 'and it must actually have examined some allow-lists').toBeGreaterThan(5);
  });
});

describe('0279 gives every allowed subject a read arm — the third bug', () => {
  // 0275 added 'portal-request' to the constraint and never touched the
  // door_events_read policy, which still ended at 0269's arms and fell through
  // to `ELSE false`. So its own audit events were written and then invisible
  // to every authenticated reader. The guard cannot check this (a regex cannot
  // read a policy whose arms are composed into a variable), so it is pinned
  // here and proven on a real PostgreSQL — see DR-0976.
  const sql = read(find('0279'));
  const arms = [...sql.matchAll(/WHEN\s+''([a-z-]+)''/g)].map((m) => m[1]);

  it('has an arm for every value the constraint allows, except the declared one', () => {
    const allowed = subjectsOf('0279');
    const expected = allowed.filter((v) => v !== 'application');
    expect(arms.sort()).toEqual(expected.sort());
  });

  it('restores the arms 0269 had, and adds the one 0275 forgot', () => {
    for (const v of ['rent', 'work', 'document', 'camera', 'stay']) expect(arms).toContain(v);
    expect(arms, "0275's own subject was write-only until this").toContain('portal-request');
  });

  it("omits 'application' ON PURPOSE, and says why in the file", () => {
    expect(arms).not.toContain('application');
    // 0272 (PR #2106) is the file that adds that value and defines the table
    // it points at. Inventing a table name would be a guess that does not
    // compile, so the value stays ALLOWED and its arm ships with 0272.
    expect(sql).toMatch(/0272/);
    expect(sql).toMatch(/would be a guess/);
  });

  it('still ends in ELSE false, so an unarmed subject is hidden rather than leaked', () => {
    expect(sql).toMatch(/ELSE false END/);
  });

  it('composes the portal-request arm only when that table exists, so it replays from any point', () => {
    expect(sql).toMatch(/table_name = 'tenant_portal_requests'/);
    expect(sql).toMatch(/IF has_portal THEN/);
  });
});
