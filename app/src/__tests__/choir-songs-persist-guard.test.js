// =============================================================================
// choir-songs persist guard — every column the archive seed WRITES must exist in
// a migration. (Proven-to-catch for the "insert-error keeps the list empty" class.)
// =============================================================================
// The archive seed (importRepertoireJson / scanArchiveForSongs) inserts into
// choir_songs via archiveRowToInsert. If any column it writes is NOT declared by
// a migration — e.g. the archive columns live in 0042-choir-sme-notes.sql, whose
// number COLLIDES with 0042-service-program.sql, so the wrong one could be the
// only one applied — every insert fails with insert-error and the Songbook stays
// empty even after a successful scan/import. This test ties the insert's REAL
// column set to the migration files, so that drift fails CI instead of silently
// emptying the choir's library in production.
//
// NOTE: this guards the migration FILES are correct + present. Whether the cloud
// DB has APPLIED 0042-choir-sme-notes is an operational step (see
// infra/nas-sme-pipeline/CHOIR-REPERTOIRE-SOURCE.md) a test cannot verify.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { archiveRowToInsert } from '../lib/choir-songbook-sync.js';

const here = dirname(fileURLToPath(import.meta.url));
const migDir = resolve(here, '../../../infra/supabase/migrations-auto');
const read = (f) => readFileSync(resolve(migDir, f), 'utf8');

// The migrations that, together, define every column the archive insert writes.
const FILES = ['0011-choir-module.sql', '0041-choir-songbook-crossref.sql', '0042-choir-sme-notes.sql'];
const combined = FILES.map(read).join('\n');
const smeNotes = read('0042-choir-sme-notes.sql');

// True if `col` is declared as a real column (a CREATE TABLE line or an ADD COLUMN).
function declaresColumn(text, col) {
  const type = '(text|uuid|integer|boolean|date|timestamptz|text\\[\\])';
  const createLine = new RegExp('(^|\\n)\\s*' + col + '\\s+' + type, 'i');
  const addColumn = new RegExp('ADD COLUMN IF NOT EXISTS\\s+' + col + '\\b', 'i');
  return createLine.test(text) || addColumn.test(text);
}

// The exact column set the archive seed writes (the source of truth — not a copy).
const insertCols = Object.keys(archiveRowToInsert({ tenantId: 't', userId: 'u' }, {
  title: 'Total Praise', youtubeUrl: 'https://youtu.be/x', videoId: 'x', startSeconds: 1,
  serviceDate: '2026-05-10', serviceType: 'sunday', scriptureRef: 'Psalm 121',
  source: 'archive', confidence: 'high', needsReview: false,
}));

describe('choir_songs archive insert is fully backed by migrations', () => {
  it('every column the archive seed writes is declared in a migration', () => {
    const missing = insertCols.filter((c) => !declaresColumn(combined, c));
    expect(missing).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the archive columns are added by 0042-choir-sme-notes (the colliding one that must be applied)', () => {
    for (const col of ['source', 'video_id', 'confidence', 'needs_review']) {
      expect(declaresColumn(smeNotes, col), `0042-choir-sme-notes must ADD COLUMN ${col}`).toBe(true);
    }
  });

  it('the guard would catch a dropped column (it is tied to the real insert shape)', () => {
    // Sanity: the insert really does write the at-risk archive columns.
    expect(insertCols).toEqual(expect.arrayContaining(['source', 'video_id', 'confidence', 'needs_review']));
  });
});
