// =============================================================================
// The ledger's pointer line cannot double itself again (DR-0245, DR-0644)
// =============================================================================
// MEASURED on main 2026-10-19 at 3a3cbcbe3: docs/decisions/INDEX.md was
// 27,573,001 bytes and its single "**Next ID:**" line was 25,721,382 of them.
// That line held 28,240 annotation segments of which 34 were distinct; several
// appeared 1,074 times. CLAUDE.md's own fold discipline says every byte there
// is paid by every session before any work, so this was the largest standing
// tax in the repo, and it was invisible because nobody reads a 27 MB file.
//
// ROOT CAUSE, measured not reasoned: nextIdAnnotations split on paren BALANCE.
// The accumulated prose carried 70,959 "(" against 69,237 ")" -- final depth
// 1,722, never negative. One unclosed paren is enough: depth never returns to
// zero, so the whole remainder was kept as ONE opaque group. Two opaque blobs
// from opposite sides of a merge are never string-equal, so unionAnnotations
// could not dedupe them and each fold appended blob to blob.
//
// These cases hold BOTH halves of the fix and the budget that makes a
// regression visible while it is still small.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextIdAnnotations, unionAnnotations } from '../../../scripts/resolve-ledger-conflicts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const INDEX = join(REPO, 'docs/decisions/INDEX.md');

/** The shape that caused it: three segments, and an unclosed paren in prose. */
const UNCLOSED = '**Next ID:** DR-1118. '
  + '(DR-1042 = the-verdict-is-printed, 2026-10-15, amending nothing -- a note (with an unclosed aside '
  + '(DR-1041 = the-reader-was-defeated, 2026-10-15, amending nothing -- another note. '
  + '(DR-1040 = the-sovereign-bell, 2026-10-14, amending nothing -- a third note.';

/** The old parser, kept verbatim so the regression is demonstrated, not described. */
function parseByParenBalanceOnly(line) {
  const rest = line.replace(/^\*\*Next ID:\*\*\s*(?:DR-\d{4})?\.?\s*/, '');
  const groups = [];
  let depth = 0; let buf = ''; let loose = '';
  for (const ch of rest) {
    if (depth === 0) {
      if (ch === '(') { if (loose.trim()) groups.push(loose.trim()); loose = ''; buf = '('; depth = 1; } else loose += ch;
    } else {
      buf += ch;
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) { groups.push(buf); buf = ''; } }
    }
  }
  if (depth !== 0) loose += buf;
  if (loose.trim()) groups.push(loose.trim());
  return groups;
}

describe('the ledger pointer line cannot double itself again', () => {
  it('an unclosed paren no longer collapses the tail into one opaque group', () => {
    expect(nextIdAnnotations(UNCLOSED)).toHaveLength(3);
  });

  it('PROVEN-TO-CATCH: the paren-balance parser returns exactly ONE group for the same input', () => {
    const old = parseByParenBalanceOnly(UNCLOSED);
    expect(old).toHaveLength(1);                       // the blob
    expect(old[0].length).toBeGreaterThan(200);        // the whole tail, swallowed
    // and the two parsers genuinely disagree on this input
    expect(nextIdAnnotations(UNCLOSED).length).toBeGreaterThan(old.length);
  });

  it('two blobs that differ only by one extra segment fold WITHOUT appending whole blobs', () => {
    const a = nextIdAnnotations(UNCLOSED);
    const b = nextIdAnnotations(`${UNCLOSED} (DR-1117 = one-road-says-what-went-wrong, 2026-10-19, amending nothing -- new.`);
    const folded = unionAnnotations([a, b]);
    expect(folded).toHaveLength(4);                    // 3 shared + 1 new, not 3 + 4
  });

  it('PROVEN-TO-CATCH: under the old parser that same fold doubles instead', () => {
    const a = parseByParenBalanceOnly(UNCLOSED);
    const b = parseByParenBalanceOnly(`${UNCLOSED} (DR-1117 = one-road, 2026-10-19, amending nothing -- new.`);
    const folded = unionAnnotations([a, b]);
    expect(folded).toHaveLength(2);                    // two blobs, neither equal to the other
    expect(folded.join(' ').length).toBeGreaterThan(a[0].length * 1.9);  // ~doubled
  });

  it('the FIRST list is de-duplicated against itself', () => {
    const dup = ['(DR-1 = a.)', '(DR-2 = b.)', '(DR-1 = a.)', '(DR-2 = b.)', '(DR-1 = a.)'];
    expect(unionAnnotations([dup])).toEqual(['(DR-1 = a.)', '(DR-2 = b.)']);
  });

  it('folding is idempotent — running the resolver twice cannot grow the line', () => {
    const once = unionAnnotations([nextIdAnnotations(UNCLOSED)]);
    expect(unionAnnotations([once, once])).toEqual(once);
    expect(unionAnnotations([once, nextIdAnnotations(UNCLOSED)])).toEqual(once);
  });

  it('a stale blob merged against a repaired line does NOT re-inflate it', () => {
    // The property that let the repair land while two lesson branches still
    // carried the 25.7 MB line in their own trees.
    const repaired = unionAnnotations([nextIdAnnotations(UNCLOSED)]);
    const stale = `${UNCLOSED} ${UNCLOSED.replace(/^\*\*Next ID:\*\* DR-1118\. /, '')}`;
    const merged = unionAnnotations([repaired, nextIdAnnotations(stale)]);
    expect(merged).toEqual(repaired);
  });

  // The budget. 41,091 bytes when repaired; 200 KB leaves room for many years
  // of real annotations and still catches a doubling while it is small.
  it('the real pointer line stays within its budget', () => {
    const line = readFileSync(INDEX, 'utf8').split('\n').find((l) => l.startsWith('**Next ID:**'));
    expect(line, 'INDEX.md must have a "**Next ID:**" line').toBeTruthy();
    expect(line.length).toBeLessThan(200 * 1024);
  });

  it('the real pointer line carries no duplicate annotation segments', () => {
    const line = readFileSync(INDEX, 'utf8').split('\n').find((l) => l.startsWith('**Next ID:**'));
    const groups = nextIdAnnotations(line);
    expect(groups.length).toBe(new Set(groups).size);
  });

  it('INDEX.md as a whole stays within its budget', () => {
    // 1.67 MB repaired. 4 MB catches a return to the 27 MB state long before
    // anyone has to read the file to notice.
    expect(readFileSync(INDEX, 'utf8').length).toBeLessThan(4 * 1024 * 1024);
  });

  it('the pointer VALUE still parses, and the repair did not eat it', () => {
    const line = readFileSync(INDEX, 'utf8').split('\n').find((l) => l.startsWith('**Next ID:**'));
    expect(line).toMatch(/^\*\*Next ID:\*\* DR-\d{4}\./);
  });
});
