// =============================================================================
// eternal-algorithms-teaching — the full lesson an Eternal Algorithms pattern
// carries when its card alone would read in about a minute
// =============================================================================
// Darrell 2026-11-26: "Make sure the lessons are fully completed and well
// done... We should have no short one minute lessons... that doesn't make
// sense?... undermines our quality control of each lesson." Measured that day:
// 152 of the 156 Eternal Algorithms lessons rendered under 400 words, because a
// lesson was assembled from the pattern card's few fields (godhead-study.js).
//
// A pattern listed here keeps its card (IF / THEN, the three-D practice, the
// outcome, its quiz and its two stories) and gains an authored lesson: the
// adult reading and four age versions, each teaching every point of the
// pattern. moduleFromAlgorithm uses it when present and builds the old
// card-only text when not, so nothing is lost while the rest are written.
// Every quotation began as a kjv token filled from app/public/bible/kjv
// by scripts/fill-verses.mjs; the child version is sized to the child window
// (about three to ten minutes for ages 6-10), the others to the adult lesson.

//
// The lessons live in part files under ./eternal-algorithms-teaching/, because
// one file passed the 1,500-line budget every new file keeps (file-budget-guard,
// DR-1339) on 2026-11-26. A new lesson is appended to the LAST part; when that
// part nears 1,400 lines, start part-N+1.js and add it to PARTS below. The merge
// refuses a pattern id that appears in two parts, so a lesson is never silently
// shadowed by another copy.

import PART_1 from './eternal-algorithms-teaching/part-1.js';
import PART_2 from './eternal-algorithms-teaching/part-2.js';

export const PARTS = [PART_1, PART_2];

export function mergeParts(parts) {
  const out = {};
  parts.forEach((part, n) => {
    for (const [id, entry] of Object.entries(part)) {
      if (id in out) throw new Error(`eternal-algorithms-teaching: ${id} is in more than one part (part ${n + 1})`);
      out[id] = entry;
    }
  });
  return out;
}

export default mergeParts(PARTS);
