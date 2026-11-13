#!/usr/bin/env node
// =============================================================================
// sweep-reservations — delete the reservations main has passed (DR-1468)
// =============================================================================
// A reservation (refs/heads/reserve/dr-NNNN or reserve/ll-NNN, written by
// scripts/lib/reserve-ref.mjs) only has to live until main holds a number at or
// above it; after that the number is taken on disk and the ref is clutter. This
// lists them on origin, reads main's highest decision record and highest Living
// Lesson, and deletes every reservation at or below those.
//
//   node scripts/sweep-reservations.mjs           # report only
//   node scripts/sweep-reservations.mjs --apply   # delete (keep-prs-current.yml)
//
// Budget: at most MAX_DELETE refs per run, every git call under a timeout.
// A reservation ABOVE main's highest is left alone, whatever its age: its
// branch may still be in flight, and a held number only ever leaves a gap.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReserveRef } from './lib/reserve-ref.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MAX_DELETE = 50;

const git = (args) =>
  execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
    maxBuffer: 64 * 1024 * 1024,
  });

/** Pure. The highest DR number among decision-record paths. */
export function highestDecision(paths) {
  let max = 0;
  for (const p of paths) {
    const m = /(?:^|\/)DR-(\d{4})-/.exec(p);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/** Pure. The highest Living Lesson number in the catalog text and the per-file names. */
export function highestLesson(catalogText, perFileNames = []) {
  let max = 0;
  for (const m of String(catalogText || '').matchAll(/\bid["']?\s*:\s*["']ll(\d+)-/g)) max = Math.max(max, Number(m[1]));
  for (const f of perFileNames) {
    const m = /(?:^|\/)ll(\d+)-[^/]*\.js$/.exec(f);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/** Pure. Which reservation refs main has passed. */
export function sweepable(refs, { dr, ll }) {
  return refs.filter((ref) => {
    const r = parseReserveRef(ref);
    if (!r) return false;
    return r.kind === 'dr' ? r.n <= dr : r.n <= ll;
  });
}

function readMain() {
  git(['fetch', '--quiet', '--no-tags', 'origin', 'main']);
  const base = 'FETCH_HEAD';
  const decisions = git(['ls-tree', '--name-only', base, 'docs/decisions/']).split('\n').filter(Boolean);
  const catalog = git(['show', `${base}:app/src/lib/living-lessons-class.js`]);
  let perFile = [];
  try {
    perFile = git(['ls-tree', '--name-only', base, 'app/src/lib/living-lessons/']).split('\n').filter(Boolean);
  } catch {
    /* the directory does not exist on main yet */
  }
  return { dr: highestDecision(decisions), ll: highestLesson(catalog, perFile) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apply = process.argv.includes('--apply');
  const refs = git(['ls-remote', '--heads', 'origin', 'refs/heads/reserve/*'])
    .split('\n')
    .map((l) => l.split('\t')[1])
    .filter(Boolean);
  const high = readMain();
  if (!high.dr) {
    console.error('sweep-reservations: main holds no decision record that could be read; deleting nothing.');
    process.exit(1);
  }
  const gone = sweepable(refs, high).slice(0, MAX_DELETE);
  console.log(
    `sweep-reservations: ${refs.length} reservation(s) on origin; main's highest DR-${String(high.dr).padStart(4, '0')}, L${high.ll}; ${gone.length} passed.`
  );
  for (const r of gone) console.log(`  ${apply ? 'deleting' : 'would delete'} ${r}`);
  if (apply && gone.length) git(['push', '--quiet', 'origin', ...gone.map((r) => `:${r}`)]);
}
