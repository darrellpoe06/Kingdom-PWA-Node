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
import {
  nextIdAnnotations,
  unionAnnotations,
  renderPointerLine,
  normalizeLedger,
} from '../../../scripts/resolve-ledger-conflicts.mjs';

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

// =============================================================================
// JOIN IS NOT THE INVERSE OF THE PARSE, so the renderer proves its own output
// =============================================================================
// 2026-10-29, DR-1292. CI shard 1/4 went red on PR #2487 with the case above
// reporting 42 segments and 41 unique. The merge was reproduced exactly
// (`git worktree add --detach … b134a6e6b` then `git merge --no-commit
// 9497057c2`) and the conflicted file measured:
//
//   pointer line 0 (the branch's side)   42 segments, 41 unique
//   pointer line 1 (main's side)         45 segments, 45 unique
//   unionAnnotations of the two          48 segments, 48 unique   <- CORRECT
//   re-parse of `union.join(' ')`        43 segments, 42 unique   <- what landed
//
// unionAnnotations was never the bug. SEVEN of the 48 segments — every one of
// them individually BALANCED — could not be recovered from the joined line,
// because once the line as a whole is unbalanced the tail is re-split only on
// `(DR-NNNN = ` markers, and a segment beginning `(DR-1272, ` (a comma, not
// ` = `) has no marker to be found by. One side held
// `(DR-1279 = …) (DR-1272, …)` as ONE segment and the other held it as TWO;
// the union rightly kept both strings, and the re-parse collapsed the pair
// back into the merged form, which is where the duplicate came from.
//
// The fixture below is that exact shape, reduced to four segments.
describe('the pointer line is rendered, read back, and proved (DR-1292)', () => {
  // Enough unbalanced prose that splitUnbalancedTail is the path taken, which
  // is the precondition for the absorption.
  const UNCLOSED_SEG = '(DR-1288 = the-sweep, 2026-10-29, amending nothing -- a note (with an unclosed aside.';
  const PART1 = '(DR-1279 = the-moat, 2026-10-28.)';
  const PART2 = '(DR-1272, DR-1273 and DR-1274 are held by sibling branches and are NOT free.)';
  const MERGED = `${PART1} ${PART2}`;
  const POINTER = '**Next ID:** DR-1290.';
  /** One side carries the pair merged, the other carries it split. */
  const LISTS = [[UNCLOSED_SEG, MERGED], [UNCLOSED_SEG, PART1, PART2]];

  /** The old renderer, kept verbatim so the regression is demonstrated. */
  const renderNaively = (pointer, lists) => `${pointer} ${unionAnnotations(lists).join(' ')}`;

  it('PROVEN-TO-CATCH: the naive render puts a duplicate on the line', () => {
    const union = unionAnnotations(LISTS);
    expect(union.length, 'the union itself is correct and deduplicated').toBe(new Set(union).size);
    const groups = nextIdAnnotations(renderNaively(POINTER, LISTS));
    expect(groups.length, 'and the re-parse of its own output is not').not.toBe(new Set(groups).size);
  });

  it('renderPointerLine reads back with no duplicate segments', () => {
    const { line } = renderPointerLine(POINTER, LISTS);
    const groups = nextIdAnnotations(line);
    expect(groups.length).toBe(new Set(groups).size);
  });

  it('it loses no annotation prose — segmentation may merge, the record may not', () => {
    const { line } = renderPointerLine(POINTER, LISTS);
    for (const segment of unionAnnotations(LISTS)) {
      expect(line, `this segment of the record is gone: ${segment.slice(0, 80)}`).toContain(segment);
    }
  });

  it('the rendered line is a FIXED POINT — rendering it again changes nothing', () => {
    const first = renderPointerLine(POINTER, LISTS).line;
    const again = renderPointerLine(POINTER, [nextIdAnnotations(first)]).line;
    expect(again).toBe(first);
  });

  it('it converges in few passes, so the loop is a convergence and not a budget', () => {
    expect(renderPointerLine(POINTER, LISTS).passes).toBeLessThanOrEqual(2);
  });

  it('PROVEN-TO-CATCH: given no passes it THROWS rather than writing a doubling line', () => {
    expect(() => renderPointerLine(POINTER, LISTS, { maxPasses: 0 }))
      .toThrow(/duplicate segments after 0 passes/);
    // And the message says the line was not written, because a quiet repair
    // here is how the 25.7 MB line grew.
    expect(() => renderPointerLine(POINTER, LISTS, { maxPasses: 0 })).toThrow(/was NOT written/);
  });

  it('an empty annotation list renders the bare pointer, with no trailing space', () => {
    expect(renderPointerLine(POINTER, [[]])).toEqual({ line: POINTER, passes: 0, segments: 0 });
  });

  it('the live ledger needs no repair pass, and still reads back clean', () => {
    const out = normalizeLedger(readFileSync(INDEX, 'utf8'));
    expect(out.pointerPasses, 'a pass above 1 means the committed line is already doubling').toBe(1);
    const groups = nextIdAnnotations(out.text.split('\n').find((l) => l.startsWith('**Next ID:**')));
    expect(groups.length).toBe(new Set(groups).size);
    expect(out.pointerSegments).toBe(groups.length);
  });

  // WHAT IS PINNED HERE, AND WHAT IS NOT — written because proven-to-catch
  // found the hole rather than because it was foreseen.
  //
  // Reverting normalizeLedger to the naive join left every behavioural case
  // above GREEN, because the committed INDEX.md happens to read back clean
  // right now, so the function never meets the asymmetry on today's data. A
  // suite that only passes on today's data is not a gate (DR-0076 §3).
  //
  // An end-to-end fixture was attempted and NOT achieved. The duplicate needs
  // one side to hold `(DR-1279 = …) (DR-1272, …)` as ONE parsed segment and
  // the other to hold it as TWO, with the merged pair landing adjacent inside
  // an unbalanced tail. Parsing normalises the two shapes whenever they sit in
  // the same region of the line, and `unionAnnotations` prepends a later
  // list's new groups, which moves them out of the tail — so with two pointer
  // lines the shapes collapse to the same list and the fold is clean. The real
  // case reached it with the pair deep inside 48 segments and several
  // unbalanced regions. Reproducing that minimally is unfinished work, not a
  // property that holds: `re-review: 2026-11-05`.
  //
  // So the wiring is pinned by SOURCE, the way this repo pins its workflow
  // behaviour. This is the assertion that fails when the naive join comes back.
  it('PROVEN-TO-CATCH: normalizeLedger renders through renderPointerLine, and joins nothing itself', () => {
    const src = readFileSync(join(REPO, 'scripts/resolve-ledger-conflicts.mjs'), 'utf8');
    const body = src.slice(src.indexOf('export function normalizeLedger'));
    const fn = body.slice(0, body.indexOf('\nexport '));
    expect(fn, 'normalizeLedger must render through renderPointerLine').toMatch(/renderPointerLine\(pointer, annotationLists\)/);
    expect(fn, 'and must not build the line by joining annotations itself').not.toMatch(/ann\.join\(/);
    expect(fn).toMatch(/pointerPasses/);
  });

  it('normalizeLedger reports the passes and the segment count it rendered', () => {
    const out = normalizeLedger(readFileSync(INDEX, 'utf8'));
    expect(typeof out.pointerPasses).toBe('number');
    const groups = nextIdAnnotations(out.text.split('\n').find((l) => l.startsWith('**Next ID:**')));
    expect(out.pointerSegments).toBe(groups.length);
  });
});
