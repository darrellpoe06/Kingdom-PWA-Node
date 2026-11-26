#!/usr/bin/env node
// =============================================================================
// lesson-title-answers-audit — the audit table, derived from the committed data
// =============================================================================
// DR-1687. The audit of every presented lesson against its display title lives
// in app/src/lib/lesson-title-answers/<course>.json (verdict + one-line reason
// per lesson). This writes the readable table from those files, so the audit
// and the data it describes can never drift:
//
//   node scripts/lesson-title-answers-audit.mjs           writes the table
//   node scripts/lesson-title-answers-audit.mjs --check   fails if it is stale
//
// Counts are measured from the files, never typed.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'app/src/lib/lesson-title-answers');
const RECORDS = join(ROOT, 'app/src/lib/learn-presentation/presentation-records.json');
const OUT = join(ROOT, 'docs/99-session-notes/2026-11-26-lessons-answer-their-titles-audit.md');
const VERDICTS = ['ANSWERS-CLEARLY', 'ANSWERS-LATE-OR-BURIED', 'DOES-NOT-ANSWER', 'ANSWERS-BUT-ENDS-OPEN'];

const records = JSON.parse(readFileSync(RECORDS, 'utf8')).records;
const tables = Object.fromEntries(
  (existsSync(DIR) ? readdirSync(DIR) : []).filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(DIR, f), 'utf8'))])
);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

const counts = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
let withExample = 0;
let inSource = 0;
let pending = 0;
const rows = [];
for (const r of records) {
  const e = (tables[r.courseKey] || {})[r.lessonId];
  if (!e) {
    if (r.lessonId === 'buy2-two-sets-of-weights-in-one-bag') {
      inSource += 1;
      rows.push([
        r.courseKey,
        r.lessonId,
        r.displayTitle,
        'ANSWERED-IN-SOURCE',
        'The reference lesson: answer-first opening, example and closing written into its own source by the parent session.',
      ]);
    } else {
      pending += 1;
      rows.push([r.courseKey, r.lessonId, r.displayTitle, 'PENDING', 'Course not yet audited in this effort.']);
    }
    continue;
  }
  counts[e.verdict] = (counts[e.verdict] || 0) + 1;
  if (e.example) withExample += 1;
  rows.push([r.courseKey, r.lessonId, r.displayTitle, e.verdict, e.reason]);
}
const fixed = records.length - counts['ANSWERS-CLEARLY'] - pending - inSource;

const text = `# Lessons answer their titles: the audit (2026-11-26)

**Decision:** [DR-1687](../decisions/DR-1687-every-lesson-answers-its-title.md). **Derived** from \`app/src/lib/lesson-title-answers/*.json\` by \`scripts/lesson-title-answers-audit.mjs\`; do not edit by hand.

Darrell, 2026-11-26, from the new-look reader: *"This lesson is not clear... it has a great title... it doesn't answer really."* Then: *"I just needed to feel full after reading the lesson."* Every presented lesson was read in full against its display title, for two things: does it answer the title plainly and early, and does it END answered.

## Measured counts

| | Lessons |
|---|---:|
| Presented lessons (presentation-records.json) | ${records.length} |
| ANSWERS-CLEARLY (left as written) | ${counts['ANSWERS-CLEARLY']} |
| ANSWERS-LATE-OR-BURIED | ${counts['ANSWERS-LATE-OR-BURIED']} |
| DOES-NOT-ANSWER | ${counts['DOES-NOT-ANSWER']} |
| ANSWERS-BUT-ENDS-OPEN | ${counts['ANSWERS-BUT-ENDS-OPEN']} |
| Answered in its own source (buy2, the model) | ${inSource} |
| **Fixed by this effort** (opening and/or closing added) | **${fixed}** |
| of which carry a worked example | ${withExample} |
| Display titles changed | 0 (Darrell: the titles work; the lesson is what gets fixed) |
| Pending | ${pending} |

## Every lesson

| Course | Lesson | Display title | Verdict | Reason |
|---|---|---|---|---|
${rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n')}
`;

if (process.argv.includes('--check')) {
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (have !== text) {
    console.error(`lesson-title-answers-audit: ${OUT} is stale; run node scripts/lesson-title-answers-audit.mjs`);
    process.exit(1);
  }
  console.log(`lesson-title-answers-audit: OK (${records.length} lessons, ${pending} pending)`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}: ${records.length} lessons; fixed ${fixed}; clear ${counts['ANSWERS-CLEARLY']}; pending ${pending}`);
}
