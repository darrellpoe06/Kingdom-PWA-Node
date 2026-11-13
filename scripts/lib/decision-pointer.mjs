// =============================================================================
// decision-pointer — the INDEX "Next ID" line is derived, never typed (DR-1477)
// =============================================================================
// Every branch used to rewrite one line of docs/decisions/INDEX.md, the
// `**Next ID:** DR-NNNN. (...)` pointer, so any two branches that each added a
// record conflicted there, whatever else they touched. Since DR-1468 the number
// is RESERVED on origin (claim-decision-number --reserve), and a value on disk
// cannot see a reservation or a branch in flight anyway. So the line is now one
// fixed sentence that names the tool, no branch edits it, and every reader that
// wants the number derives it: the highest record on disk, plus one, past every
// reserve/dr-* on origin.
//
// The annotations the old line had collected are kept word for word on the
// frozen history line under it, which nothing edits either. A stale branch that
// still rewrites the old line has its new annotations moved there by
// resolve-ledger-conflicts, so no word of the record is dropped (DR-0011).
// =============================================================================
import { readdirSync } from 'node:fs';

/** The one pointer line. It names no number, so no renumber ever has to touch it. */
export const DERIVED_POINTER =
  '**Next ID:** derived, never typed. Run `node scripts/claim-decision-number.mjs --reserve`: it reads the highest record on disk and on origin/main, every unlanded branch and every `reserve/dr-*` on origin, and holds the next number for you. No branch edits this line.';

/** The frozen line that keeps what the old pointer line had said. */
export const HISTORY_PREFIX = '**Pointer history, frozen by DR-1477 when the pointer became derived; no branch edits it:**';

const POINTER_RE = /^\*\*Next ID:\*\*/;

/** Pure. Is this line the pointer (in either shape)? */
export function isPointerLine(line) {
  return POINTER_RE.test(String(line || ''));
}

/** Pure. Is this line the derived pointer, exactly? */
export function isDerivedPointer(line) {
  return String(line || '').trimEnd() === DERIVED_POINTER;
}

/** Pure. Is this line the frozen history line? */
export function isHistoryLine(line) {
  return String(line || '').startsWith(HISTORY_PREFIX);
}

/** Pure. The next decision number from a list of file names: highest DR-NNNN plus one. */
export function nextIdFromNames(names = []) {
  let max = 0;
  for (const f of names) {
    const m = /(?:^|\/)DR-(\d{4})-/.exec(String(f || ''));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

/** The next decision number on disk (no reservation is counted; claim-decision-number counts them). */
export function nextIdOnDisk(decisionsDir) {
  return nextIdFromNames(readdirSync(decisionsDir));
}
