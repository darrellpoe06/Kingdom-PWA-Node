// @vitest-environment node
// DR-0708 — the family-books-probe prints counts and ids, never a row's money.
//
// Run 36789202585 (2026-09-30) printed `transactions.slug` as an "id". For an
// imported row the slug IS the row (`imp-<account>|<date>|<amount>|<payee>|
// <balance>#n`), and this repository's run logs and summaries are public. The
// logs were deleted the same hour. This gate keeps the probe from selecting a
// transaction's slug, description or amount as OUTPUT, and from mirroring its
// raw output into the step summary.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const wf = readFileSync(path.resolve(here, '../../../.github/workflows/family-books-probe.yml'), 'utf8');

// Every SELECT list (the text between SELECT and its FROM) in the ledger SQL.
function selectLists(src) {
  const out = [];
  const re = /SELECT\s+([\s\S]*?)\s+FROM\s/gi;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

function leaks(src) {
  const bad = [];
  for (const list of selectLists(src)) {
    // Aggregates over amount (sum/min/max inside a comparison) are allowed:
    // they print yes/no, never the value. A bare column in the list is not.
    const bare = list.replace(/\b(sum|min|max|round|abs|count|coalesce)\s*\([^()]*(\([^()]*\)[^()]*)*\)/gi, '');
    if (/\bt\.slug\b/i.test(bare)) bad.push(`t.slug: ${list.slice(0, 80)}`);
    if (/\b(t\.)?description\b/i.test(bare)) bad.push(`description: ${list.slice(0, 80)}`);
    if (/(^|[\s,])(t\.)?amount\s*(,|$)/i.test(bare)) bad.push(`amount: ${list.slice(0, 80)}`);
  }
  if (/printf '%s\\n' "\$out"; echo '```'; \} >> "\$GITHUB_STEP_SUMMARY"/.test(src)) bad.push('raw output mirrored into the public step summary');
  return [...new Set(bad)];
}

describe('family-books-probe never prints a row\'s money', () => {
  it('the probe as committed selects no slug, description or amount as output', () => {
    expect(leaks(wf)).toEqual([]);
  });
  it('PROVEN-TO-CATCH: the run-36789202585 query and the raw summary are both named', () => {
    const old = `SELECT t.slug, t.txn_date FROM transactions t WHERE x
          { echo "### Family ledger probe"; echo '\`\`\`'; printf '%s\\n' "$out"; echo '\`\`\`'; } >> "$GITHUB_STEP_SUMMARY"`;
    const found = leaks(old);
    expect(found.some((f) => f.startsWith('t.slug'))).toBe(true);
    expect(found).toContain('raw output mirrored into the public step summary');
    expect(leaks('SELECT t.description, count(*) FROM transactions t')).not.toEqual([]);
    expect(leaks('SELECT t.id, t.amount FROM transactions t')).not.toEqual([]);
  });
});
