// =============================================================================
// The tables witness must answer the question a data-loss report actually asks
// =============================================================================
// 2026-09-14. Darrell reported his wife's rental doors information and tenant
// information gone. Asked of the database the app reads, every tenant table
// answered the same thing:
//
//   rental_tenancies  18 columns  RLS on  11 policies  0 rows
//   tenancy_household  9 columns  RLS on  11 policies  0 rows
//   rent_records      17 columns  RLS on  11 policies  0 rows
//
// And that answer is ambiguous in the worst possible way. n_live_tup alone
// cannot distinguish:
//
//   a feature that never saved   -> 0 live, 0 ever inserted, 0 ever deleted
//   data that was lost           -> 0 live, N ever inserted, N ever deleted
//
// Opposite findings, identical report. A witness that cannot separate them
// leaves the question to be answered by guessing, which is the failure DR-0076
// exists to stop -- so the cumulative counters are reported too, with
// stats_reset beside them so a reset counter is never read as history.
//
// These run against the real script text. The pre-change shape is asserted to
// FAIL them (proven-to-catch, DR-0076 section 3).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = readFileSync(join(ROOT, 'scripts/sovereign-read-over-tailnet.sh'), 'utf8');

// The tables mode only -- the feedback and definitions branches are other tests'.
const tablesMode = SCRIPT.slice(SCRIPT.indexOf('elif [ "$MODE" = "tables" ]'), SCRIPT.indexOf('---LEDGER---'));

describe('tables mode reports whether a row was EVER there', () => {
  it('asks for the insert counter, so "never written" is a provable answer', () => {
    expect(tablesMode).toContain("'ever_inserted', (SELECT n_tup_ins");
  });

  it('asks for the delete counter, so "written then lost" is a provable answer', () => {
    expect(tablesMode).toContain("'ever_deleted', (SELECT n_tup_del");
  });

  it('still reports the live count -- the counters are added, not substituted', () => {
    expect(tablesMode).toContain("'rows', (SELECT n_live_tup");
  });

  it('reports when the counters were last reset, so none of them reads as history it is not', () => {
    expect(tablesMode).toContain('---STATS-RESET---');
    expect(tablesMode).toContain('stats_reset');
    // 'never' is the honest answer for a database that never had a reset; an
    // empty answer would read as "no reset" while meaning "did not ask".
    expect(tablesMode).toContain("'never'");
  });

  it('reads no row CONTENTS to answer it -- a counter is not a record', () => {
    // The whole point is that the loss question is answerable WITHOUT reading
    // anyone's tenancy. pg_stat_user_tables holds counters, never row values.
    expect(tablesMode).toContain('pg_stat_user_tables');
    for (const forbidden of ['tenant_name', 'SELECT * FROM public.rental', 'applicant_']) {
      expect(tablesMode, `tables mode must not read ${forbidden}`).not.toContain(forbidden);
    }
  });
});

describe('PROVEN-TO-CATCH -- the shape that shipped yesterday fails these', () => {
  const preChange = `elif [ "$MODE" = "tables" ]; then
  psql_q "SELECT coalesce(json_agg(json_build_object(
                   'name', c.relname,
                   'rls_enabled', c.relrowsecurity,
                   'rows', (SELECT n_live_tup FROM pg_stat_user_tables st WHERE st.relid = c.oid)
                 ) ORDER BY c.relname), '[]'::json)::text"`;

  it('the live-count-only witness carries neither counter', () => {
    expect(preChange.includes("'ever_inserted'")).toBe(false);
    expect(preChange.includes("'ever_deleted'")).toBe(false);
  });

  it('and so it reports the two opposite cases identically', () => {
    // What the reader can conclude from each report, given 0 live rows.
    const fromPreChange = (report) => (report.rows === 0 ? 'cannot tell' : 'has rows');
    const fromNow = (report) => {
      if (report.rows > 0) return 'has rows';
      if (report.ever_deleted > 0) return 'rows were lost';
      if (report.ever_inserted === 0) return 'nothing was ever written';
      return 'writes were attempted and none survived';
    };
    const neverWritten = { rows: 0, ever_inserted: 0, ever_deleted: 0 };
    const lost = { rows: 0, ever_inserted: 40, ever_deleted: 40 };

    expect(fromPreChange(neverWritten)).toBe(fromPreChange(lost));       // the defect
    expect(fromNow(neverWritten)).toBe('nothing was ever written');
    expect(fromNow(lost)).toBe('rows were lost');
    expect(fromNow(neverWritten)).not.toBe(fromNow(lost));               // the fix
  });
});
