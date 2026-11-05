// =============================================================================
// The bloat ratchets (DR-1339, DR-1330 D9): a record from DR-1339 on stays
// within 60 lines and a 700-character row; a budgeted file never grows past
// its ceiling and a new file is never born over 1,500 lines. Proven to catch
// on fixtures; the live ledger and the live tree pass today.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judge as judgeRecords, recordNumber, MAX_LINES, MAX_ROW_CHARS, FIRST_RATCHETED_DR } from '../../../scripts/record-length-guard.mjs';
import { judge as judgeFiles, regenerate, countLines, NEW_FILE_MAX, BUDGETS } from '../../../scripts/file-budget-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('record-length-guard: proven to catch', () => {
  const short = '# DR-1340: x\n\n## Context\n\nc\n\n## What was measured\n\nm\n\n## Impact\n\ni\n\n## Decision\n\nd\n\n## Verification\n\nv\n';
  const long = Array.from({ length: MAX_LINES + 1 }, (_, i) => `line ${i}`).join('\n');
  const row = (id, n) => `| [${id}](${id}-x.md) | **${'t'.repeat(n)}** | accepted | A | x | y |`;
  it('passes a short record with a short row, and leaves records before the ratchet alone', () => {
    expect(judgeRecords({ records: { 'DR-1340-x.md': short }, indexText: row('DR-1340', 100) })).toEqual([]);
    expect(judgeRecords({ records: { 'DR-1000-x.md': long }, indexText: row('DR-1000', 5000) })).toEqual([]);
  });
  it('fails an over-long record and an over-long row from the ratchet on', () => {
    expect(judgeRecords({ records: { 'DR-1340-x.md': long }, indexText: row('DR-1340', 100) })[0]).toMatch(/61 lines/);
    expect(judgeRecords({ records: { 'DR-1340-x.md': short }, indexText: row('DR-1340', MAX_ROW_CHARS) })[0]).toMatch(/INDEX row is/);
  });
  it('reads the record number from the filename', () => {
    expect(recordNumber('DR-1339-a.md')).toBe(1339);
    expect(recordNumber('README.md')).toBeNull();
  });
  it('the live ledger passes', () => {
    const dir = join(ROOT, 'docs/decisions');
    const files = readdirSync(dir).filter((f) => /^DR-\d{4}-.*\.md$/.test(f));
    const records = Object.fromEntries(files.map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
    expect(judgeRecords({ records, indexText: readFileSync(join(dir, 'INDEX.md'), 'utf8') })).toEqual([]);
    expect(files.some((f) => (recordNumber(f) || 0) >= FIRST_RATCHETED_DR)).toBe(true);
  });
});

describe('file-budget-guard: proven to catch', () => {
  const budgets = { 'app/src/lib/big.js': 3000 };
  it('passes a budgeted file at its ceiling and a new small file', () => {
    expect(judgeFiles({ counts: { 'app/src/lib/big.js': 3000, 'app/src/lib/small.js': 120 }, budgets })).toEqual([]);
  });
  it('fails a budgeted file that grew, and a new file born big', () => {
    expect(judgeFiles({ counts: { 'app/src/lib/big.js': 3001 }, budgets })[0]).toMatch(/over its ceiling of 3000/);
    expect(judgeFiles({ counts: { 'app/src/lib/big.js': 10, 'app/src/lib/born.js': NEW_FILE_MAX + 1 }, budgets })[0]).toMatch(/must stay under 1500/);
  });
  it('names a baseline entry whose file is gone', () => {
    expect(judgeFiles({ counts: {}, budgets })[0]).toMatch(/not on disk/);
  });
  it('re-freezes down only', () => {
    expect(regenerate({ 'app/src/lib/big.js': 2900 }, budgets)).toEqual({ 'app/src/lib/big.js': 2900 });
    expect(regenerate({ 'app/src/lib/big.js': 3100 }, budgets)).toEqual({ 'app/src/lib/big.js': 3000 });
  });
  it('counts lines the way wc does on a trailing newline', () => {
    expect(countLines('a\nb\n')).toBe(2);
    expect(countLines('')).toBe(0);
  });
  it('the live baseline names only files on disk, each at or above the new-file line', () => {
    const doc = JSON.parse(readFileSync(join(ROOT, BUDGETS), 'utf8'));
    for (const [file, ceiling] of Object.entries(doc.budgets)) {
      expect(ceiling, file).toBeGreaterThan(NEW_FILE_MAX);
      expect(countLines(readFileSync(join(ROOT, file), 'utf8')), file).toBeLessThanOrEqual(ceiling);
    }
  });
});
