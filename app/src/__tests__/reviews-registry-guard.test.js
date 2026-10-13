// =============================================================================
// reviews-registry-guard — the REV registry's integrity gate (REV-0239)
// =============================================================================
// docs/reviews/REVIEWS.md carries TWO append conventions (a newest-first run
// prepended atop the older oldest-first body). Sessions that minted the next
// id by reading only the visually-nearest neighbor double-minted EIGHT ids
// (REV-0088/0089/0159/0160/0174/0175/0176/0218 — renumbered 2026-08-05 to
// REV-0231–0238). The parser keys records on id (vite.config.js readUiuxReviews)
// and ReviewsPeek keys list rows on id, so a duplicate silently corrupts the
// in-app registry. This gate makes the class impossible to reintroduce:
//   * every `### REV-####` heading id is UNIQUE across the whole file,
//   * ids are exactly 4 digits (the parse + sort contract),
//   * every record's Date field parses (ReviewsPeek orders by Date, never by
//     file position — an unparseable date would sink a record to the bottom).
// Proven-to-catch: the same checker fails on fixtures carrying each defect.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Pure checker so the proven-to-catch cases can run it on fixtures. Mirrors the
// build parser's shape: records live under "## Records", one per "### " block,
// id = the heading's first `·`-separated token.
export function checkReviewRegistry(raw) {
  const problems = [];
  const recordsSection = (raw.split(/^##\s+Records\b.*$/m)[1] || raw);
  const blocks = recordsSection.split(/^###\s+/m).slice(1);
  const seen = new Map();
  blocks.forEach((b, i) => {
    const head = (b.split('\n')[0] || '').trim();
    const id = (head.split('·')[0] || '').trim();
    if (!/^REV-\d+/.test(id)) return; // non-record heading — the parser skips it too
    if (!/^REV-\d{4}$/.test(id)) problems.push(`malformed id (must be REV- + 4 digits): "${id}"`);
    if (seen.has(id)) problems.push(`duplicate id ${id}: "${seen.get(id)}" AND "${head}"`);
    else seen.set(id, head);
    const dm = b.match(/\*\*Date:\*\*\s*([^\n]+)/i);
    const date = dm ? dm[1].trim() : '';
    if (!date || Number.isNaN(Date.parse(date))) {
      problems.push(`record ${id || `#${i}`} has no parseable Date ("${date}")`);
    }
  });
  return { ok: problems.length === 0, count: seen.size, problems };
}

describe('docs/reviews/REVIEWS.md — the real registry holds the contract', () => {
  const raw = readFileSync(join(REPO_ROOT, 'docs/reviews/REVIEWS.md'), 'utf8');
  const res = checkReviewRegistry(raw);

  it('every REV id is unique, 4-digit, and every record carries a parseable Date', () => {
    expect(res.problems, res.problems.join('\n')).toEqual([]);
    expect(res.ok).toBe(true);
  });

  it('the registry is non-trivially populated (the parser found real records)', () => {
    expect(res.count).toBeGreaterThan(200);
  });
});

describe('proven-to-catch — the checker fails on each defect class', () => {
  const record = (id, date = '2026-08-05') =>
    `### ${id} · Fixture record\n- **Date:** ${date}\n- **Type:** ui-ux\n- **Status:** logged\n- **Findings:** x\n- **Source:** x\n\n`;

  it('catches a double-minted id (the 2026-08-05 class)', () => {
    const raw = `## Records\n\n${record('REV-0001')}${record('REV-0001')}`;
    const res = checkReviewRegistry(raw);
    expect(res.ok).toBe(false);
    expect(res.problems.join(' ')).toContain('duplicate id REV-0001');
  });

  it('catches a malformed id and an unparseable date', () => {
    const raw = `## Records\n\n${record('REV-001')}${record('REV-0002', 'not-a-date')}`;
    const res = checkReviewRegistry(raw);
    expect(res.ok).toBe(false);
    expect(res.problems.join(' ')).toContain('malformed id');
    expect(res.problems.join(' ')).toContain('no parseable Date');
  });

  it('passes a clean fixture (the gate is not theater in the other direction)', () => {
    const raw = `## Records\n\n${record('REV-0001')}${record('REV-0002')}`;
    expect(checkReviewRegistry(raw).ok).toBe(true);
  });
});
