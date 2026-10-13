// =============================================================================
// derive-lesson-dates — writes app/src/lib/lesson-dates.json, the real day
// every lesson in every course was created (DR-0687). Rule and reasons:
// scripts/lesson-dates-core.mjs.
//
//   cd app && npm run lesson-dates          # write / refresh the file
//   cd app && npm run lesson-dates:check    # fail if the committed file drifts
//
// It runs under vite-node because it reads the MOUNTED catalog (the same
// course builders Learn renders), never a hand-kept list of lesson ids. It
// needs the full git history (a shallow clone cannot see first commits; the
// CI step checks out with fetch-depth: 0).
//
// A NEW LESSON JOINS AT BIRTH (DR-0621): lesson-dates.test.js fails when a
// mounted lesson has neither a day here nor a recorded reason, and names the
// command above. Run it after committing the lesson (a lesson still only in the
// working tree is dated today and held to git's day once it lands).
// =============================================================================
import { spawn, execFileSync } from 'node:child_process';
import readline from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScanner, buildDatesFile } from './lesson-dates-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'app/src/lib/lesson-dates.json');
const CHECK = process.argv.includes('--check');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });

async function mountedCatalog() {
  const { LEARN_CATALOG } = await import('../app/src/lib/learn-catalog.js');
  const { buildEternalProcessingCourses } = await import('../app/src/lib/eternal-algorithms-course.js');
  const { LIVING_LESSONS_ADDED } = await import('../app/src/lib/living-lessons-dates.js');
  const catalog = [
    ...LEARN_CATALOG.map((e) => ({ key: e.key, ids: e.buildScheduleRows().map((m) => m.id) })),
    ...buildEternalProcessingCourses().map((c) => ({ key: c.key || c.meta.key, ids: c.schedule.map((m) => m.id) })),
  ];
  return { catalog, recorded: LIVING_LESSONS_ADDED };
}

async function scanHistory() {
  const scanner = createScanner();
  const p = spawn('git', ['log', '--format=%x01%H %at', '-p', '--unified=0', '--no-renames', '--no-color', '--no-ext-diff', 'HEAD', '--', 'app/src'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  const rl = readline.createInterface({ input: p.stdout, crlfDelay: Infinity });
  for await (const line of rl) scanner.line(line);
  const code = await new Promise((r) => p.on('close', r));
  if (code !== 0) throw new Error(`git log exited ${code}`);
  const scan = scanner.result();
  // Lessons defined only in the working tree (not yet committed).
  const wt = createScanner();
  wt.line('\u0001working-tree 0');
  for (const line of git('diff', 'HEAD', '--unified=0', '--no-color', '--no-ext-diff', '--', 'app/src').split('\n')) wt.line(line);
  scan.workingTree = new Set(wt.result().firstDef.keys());
  return scan;
}

async function main() {
  if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
    console.error('derive-lesson-dates: this clone is shallow, so first commits cannot be seen. Fetch full history (git fetch --unshallow) and re-run.');
    process.exit(2);
  }
  const t0 = Date.now();
  const [{ catalog, recorded }, scan] = await Promise.all([mountedCatalog(), scanHistory()]);
  const reachable = new Set(git('rev-list', 'HEAD').split('\n').filter(Boolean).map((s) => s.slice(0, 8)));
  const committed = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  const previous = committed ? JSON.parse(committed) : null;
  const today = new Date().toISOString().slice(0, 10);
  const { file, report, problems } = buildDatesFile({ catalog, scan, reachable, previous, recorded, today: CHECK ? null : today });
  const text = `${JSON.stringify(file, null, 1).replace(/\[\n\s*("[^"]*"),\n\s*("[^"]*")\n\s*\]/g, '[$1, $2]')}\n`;
  const { totals } = report;
  const summary = `${totals.dated} of ${totals.lessons} lessons dated, ${totals.undated} undated, ${report.livingLessonsDisagreements.length} Living Lessons day(s) differ from git (${((Date.now() - t0) / 1000).toFixed(1)}s)`;
  if (process.argv.includes('--report')) {
    for (const [k, c] of Object.entries(report.counts)) console.log(`  ${k}: ${c.dated}/${c.lessons} dated${c.undated ? `, ${c.undated} undated` : ''}`);
    for (const [k, why] of Object.entries(file.undated)) console.log(`  undated ${k}: ${why}`);
  }
  for (const d of report.livingLessonsDisagreements) {
    console.log(`  Living Lessons ${d.id.split('-')[0]}: recorded ${d.recorded}, git ${d.git || `cannot trace (${d.why})`}${d.sha ? ` (${d.sha})` : ''} — the recorded day is kept`);
  }
  if (CHECK) {
    const stale = committed !== text;
    for (const p of problems) console.error(`  ${p.course}/${p.id}: ${p.why}`);
    if (problems.length || stale) {
      console.error(`derive-lesson-dates --check FAILED: ${problems.length} entr${problems.length === 1 ? 'y' : 'ies'} git does not support${stale ? '; app/src/lib/lesson-dates.json is not what the script derives' : ''}.`);
      console.error('Fix: cd app && npm run lesson-dates, then commit app/src/lib/lesson-dates.json. Never edit its days by hand.');
      process.exit(1);
    }
    console.log(`derive-lesson-dates --check ok: ${summary}`);
    return;
  }
  writeFileSync(OUT, text);
  for (const p of problems) console.log(`  replaced ${p.course}/${p.id}: ${p.why}`);
  console.log(`wrote app/src/lib/lesson-dates.json: ${summary}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
