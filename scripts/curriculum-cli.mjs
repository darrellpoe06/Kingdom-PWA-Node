// =============================================================================
// curriculum-cli — one door for the NAS copy's tools (DR-0677)
// =============================================================================
// The course files use extensionless imports, so this runs under vite-node from
// app/ (the lessons-sync workflow and the CI curriculum job do exactly this):
//
//   npx vite-node ../scripts/curriculum-cli.mjs --gate
//       every curriculum gate on the code (scripts/curriculum-gates.mjs)
//   npx vite-node ../scripts/curriculum-cli.mjs --rows <file>
//       the code as table rows (JSON)
//   npx vite-node ../scripts/curriculum-cli.mjs --sql <file> [--commit <sha>]
//       the sync SQL — REFUSED (exit 1, no file) unless every gate passes
//   npx vite-node ../scripts/curriculum-cli.mjs --parity <nas-readback.json>
//       the code against a copy read back from the NAS; exit 1 on drift,
//       exit 2 when the read-back is empty (drift unknown, never zero)
//   npx vite-node ../scripts/curriculum-cli.mjs --gate-db <nas-readback.json>
//       every curriculum gate on the lessons AS THE DATABASE HOLDS THEM
//       (recomposed from the read-back), not as the code holds them
//   npx vite-node ../scripts/curriculum-cli.mjs --verse-baseline
//       re-measure the recorded verse debt (only ever to shrink it)
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRepoCurriculum, snapshotRows, stampRows, syncSql } from './curriculum-snapshot.mjs';
import { gateCorpus, scanCorpusVerses, buildVerseBaseline, VERSE_BASELINE_PATH } from './curriculum-gates.mjs';
import { parity, describeDrift } from './curriculum-parity.mjs';
import { rowsToCourses } from '../app/src/lib/curriculum-rows.js';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const arg = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return null;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
};

const { list, courses } = await loadRepoCurriculum();
const lessonCount = Object.values(courses).reduce((t, l) => t + l.length, 0);
const commit = typeof arg('--commit') === 'string' ? arg('--commit') : null;

if (arg('--verse-baseline')) {
  const scan = scanCorpusVerses(courses);
  writeFileSync(VERSE_BASELINE_PATH, `${JSON.stringify(buildVerseBaseline(scan, courses), null, 2)}\n`);
  console.log(`verse baseline written: ${VERSE_BASELINE_PATH}`);
}

let verdict = null;
if (arg('--gate') || arg('--sql')) {
  verdict = gateCorpus(courses);
  console.log(`curriculum gates: ${verdict.passed ? 'PASS' : 'FAIL'} ${JSON.stringify(verdict.evidence)}`);
  for (const f of verdict.fresh.slice(0, 80)) console.log(`  FRESH ${f}`);
  if (!verdict.passed) process.exitCode = 1;
}

if (typeof arg('--rows') === 'string' || typeof arg('--sql') === 'string') {
  const rows = snapshotRows(list);
  if (typeof arg('--rows') === 'string') {
    writeFileSync(arg('--rows'), JSON.stringify(rows));
    console.log(`rows written: ${rows.courses.length} courses, ${rows.lessons.length} lessons -> ${arg('--rows')}`);
  }
  if (typeof arg('--sql') === 'string') {
    if (!verdict || !verdict.passed) {
      console.error('REFUSED: the code fails the curriculum gates; no sync SQL was written (DR-0677).');
      process.exit(1);
    }
    stampRows(rows, { passed: true, commit });
    writeFileSync(arg('--sql'), syncSql(rows, { commit }));
    console.log(`sync SQL written: ${rows.lessons.length} lessons, ${rows.verse_spans.length} verse spans -> ${arg('--sql')}`);
  }
}

if (typeof arg('--parity') === 'string') {
  const raw = readFileSync(arg('--parity'), 'utf8').trim();
  if (!raw) {
    console.error('parity: the NAS read-back is EMPTY; drift is unknown, not zero (DR-0076)');
    process.exit(2);
  }
  const result = parity(courses, JSON.parse(raw));
  console.log(`curriculum parity: ${result.inStep ? 'IN STEP' : 'DRIFT'} — ${lessonCount} lessons in the code, ${result.drift.length} finding(s)`);
  for (const d of result.drift.slice(0, 200)) console.log(`  ${describeDrift(d)}`);
  console.log(`PARITY-JSON=${JSON.stringify({ lessons: lessonCount, inStep: result.inStep, drift: result.drift.slice(0, 500) })}`);
  if (!result.inStep) process.exitCode = 1;
}

if (typeof arg('--gate-db') === 'string') {
  const raw = readFileSync(arg('--gate-db'), 'utf8').trim();
  if (!raw) {
    console.error('gate-db: the read-back is EMPTY; nothing was gated (DR-0076)');
    process.exit(2);
  }
  // Every row the database holds, previews included: a preview is readable
  // (by Darrell and the Governor) the moment it lands, so it is judged too.
  const dbCourses = rowsToCourses(JSON.parse(raw));
  const v = gateCorpus(dbCourses);
  console.log(`curriculum gates ON THE DATABASE COPY: ${v.passed ? 'PASS' : 'FAIL'} ${JSON.stringify(v.evidence)}`);
  for (const f of v.fresh.slice(0, 80)) console.log(`  FRESH ${f}`);
  if (!v.passed) process.exitCode = 1;
}
