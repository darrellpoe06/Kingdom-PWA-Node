// @vitest-environment node
// A migration never CREATEs a table another one did (the 2026-10-10 0262 /
// 0052 record_events collision that stopped db-migrate after #2096).
import { describe, it, expect } from 'vitest';
import { reuseFindings, repoSources, tableCreators } from '../../../scripts/table-name-reuse-guard.mjs';

describe('table-name-reuse-guard', () => {
  it('the repository holds no unreviewed reuse', () => {
    expect(reuseFindings(repoSources())).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the incident itself — 0052 and the old 0262 both creating record_events', () => {
    const sources = {
      '0052-systems-of-record.sql': 'CREATE TABLE IF NOT EXISTS record_events (\n  id uuid PRIMARY KEY, record_kind text\n);',
      '0262-rent.sql': '-- the clock\nCREATE TABLE IF NOT EXISTS public.record_events (\n  id uuid PRIMARY KEY, subject text\n);',
    };
    expect(reuseFindings(sources)).toEqual([{ table: 'record_events', files: ['0052-systems-of-record.sql', '0262-rent.sql'] }]);
  });

  it('a name only in a comment, or created twice in ONE file, is not a reuse', () => {
    const sources = {
      'a.sql': '-- CREATE TABLE IF NOT EXISTS x (\nCREATE TABLE y (id int);\nCREATE TABLE IF NOT EXISTS y (id int);',
      'b.sql': '/* CREATE TABLE y ( */ SELECT 1;',
    };
    expect(tableCreators(sources)).toEqual({ y: ['a.sql'] });
    expect(reuseFindings(sources)).toEqual([]);
  });

  it('the door clock is its own table now', () => {
    const creators = tableCreators(repoSources());
    expect(creators.door_events).toEqual(['0262-rent-is-reported-the-way-it-is-paid-and-every-change-keeps-its-time.sql']);
    expect(creators.record_events).toEqual(['0052-systems-of-record.sql']);
  });
});
