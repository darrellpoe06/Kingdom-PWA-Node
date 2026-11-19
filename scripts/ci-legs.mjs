#!/usr/bin/env node
// =============================================================================
// ci-legs — which CI legs a branch's change cannot affect (DR-1601)
// =============================================================================
// MEASURED 2026-11-19: every push ran 24 CI jobs whatever it touched. A lesson
// PR (one course module, its test, a DR, two ledger lines) started 13
// PostgreSQL wall legs and the door journeys, none of which read a byte it
// changed, and the account's runner ceiling queued 40-50 runs behind them.
//
// THE RULE. A leg is skipped only when EVERY changed path is in LIGHT (paths
// none of the skippable legs read) — so one unrecognised path runs everything.
// The layout leg is also kept whenever a light path belongs to a course the
// layout probe opens (it reads `course=<id>` from scripts/chrome-layout-probe.mjs
// and scripts/e2e/*.mjs, so a new pinned course is picked up without an edit
// here). Anything that is not a push to a non-main branch runs everything, as
// does a missing, empty or truncated (>= 300, the compare API's cap) file list.
//
// It decides only WHICH legs run. The aggregator in ci.yml still fails unless
// every leg either passed or was skipped BY THIS LIST.
//
//   node scripts/ci-legs.mjs --event push --ref refs/heads/x < changed-paths.txt
//   -> prints `skip=["door-work",...]` (JSON) for $GITHUB_OUTPUT, reasons to stderr
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The PostgreSQL wall legs and the door journeys: they read infra/supabase,
 *  scripts/*-ci-*.sql, scripts/e2e and the door surfaces, never lesson content. */
export const WALL_LEGS = [
  'lesson-shares',
  'arrivals-push',
  'contacts-walls',
  'voice-enrollments',
  'dm-device-keys',
  'withdraw-walls',
  'auth-events',
  'vault-walls',
  'church-onboarding',
  'learner-records',
  'institute-walls',
  'door-work',
  'door-journeys',
];
export const LAYOUT_LEGS = ['layout'];
export const SKIPPABLE = [...WALL_LEGS, ...LAYOUT_LEGS];

/** Paths no skippable leg reads. Lesson content, its tests, the records. */
export const LIGHT = [
  /^docs\//,
  /^app\/src\/__tests__\//,
  /^app\/src\/lib\/living-lessons\/[^/]+\.js$/,
  /^app\/src\/lib\/[a-z0-9-]+-class\.js$/,
  /^app\/src\/lib\/[a-z0-9-]+-course(-part\d+)?\.js$/,
  /^app\/src\/lib\/(ai-usage-ledger|lesson-dates)\.json$/,
  /^app\/src\/lib\/[a-z0-9-]+-baseline\.json$/,
  /^scripts\/file-budgets\.json$/,
  /^scripts\/[a-z0-9-]+-fill\.mjs$/,
];

export const FILE_CAP = 300;

/** Course ids the layout probe and the browser journeys open by URL. */
export function pinnedCourses(root = ROOT) {
  const texts = [readFileSync(join(root, 'scripts/chrome-layout-probe.mjs'), 'utf8')];
  for (const f of readdirSync(join(root, 'scripts/e2e'))) {
    if (f.endsWith('.mjs')) texts.push(readFileSync(join(root, 'scripts/e2e', f), 'utf8'));
  }
  const ids = new Set();
  for (const t of texts) for (const m of t.matchAll(/course=([a-z0-9-]+)/g)) ids.add(m[1]);
  return [...ids].sort();
}

/** True when a light path is part of a course the layout probe opens. */
export function touchesPinnedCourse(path, courses) {
  const b = basename(path);
  return courses.some((c) => b.startsWith(`${c}-`) || path.includes(`/lib/${c}/`));
}

/**
 * @returns {{ skip: string[], reasons: string[] }}
 */
export function classify({ event, ref, paths, courses }) {
  const none = (why) => ({ skip: [], reasons: [why] });
  if (event !== 'push') return none(`event ${event || '(none)'}: every leg runs`);
  if (!ref || ref === 'refs/heads/main') return none('main: every leg runs');
  if (!Array.isArray(paths) || paths.length === 0) return none('no changed-file list: every leg runs');
  if (paths.length >= FILE_CAP) return none(`${paths.length} files (compare cap ${FILE_CAP}): every leg runs`);
  const heavy = paths.filter((p) => !LIGHT.some((re) => re.test(p)));
  if (heavy.length) return none(`not lesson-only (${heavy.slice(0, 5).join(', ')}${heavy.length > 5 ? ', ...' : ''}): every leg runs`);
  const pinned = paths.filter((p) => touchesPinnedCourse(p, courses));
  const skip = pinned.length ? [...WALL_LEGS] : [...SKIPPABLE];
  const reasons = [`all ${paths.length} changed paths are lesson content, tests or records`];
  if (pinned.length) reasons.push(`layout kept: ${pinned.join(', ')} is a course the layout probe opens`);
  return { skip, reasons };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > 0 ? process.argv[i + 1] : '';
  };
  let paths = null;
  try {
    paths = readFileSync(0, 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    paths = null;
  }
  let out;
  try {
    out = classify({ event: arg('--event'), ref: arg('--ref'), paths, courses: pinnedCourses() });
  } catch (e) {
    out = { skip: [], reasons: [`classifier error (${e.message}): every leg runs`] };
  }
  for (const r of out.reasons) console.error(r);
  console.error(out.skip.length ? `skipping: ${out.skip.join(' ')}` : 'skipping nothing');
  console.log(`skip=${JSON.stringify(out.skip)}`);
}
