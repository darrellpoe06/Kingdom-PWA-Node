// =============================================================================
// living-lessons-per-file — one file per new Living Lesson (DR-1468)
// =============================================================================
// Darrell, 2026-11-13: "Build 1, 2 and 3, and allow parallel branches." Every
// Living Lesson used to be appended to ONE array in living-lessons-class.js and
// one map in living-lessons-dates.js, so two branches each adding a lesson
// edited the same lines and one of them always lost the merge. A lesson written
// under app/src/lib/living-lessons/ is a NEW FILE, and two new files never
// conflict.
//
// THE FILE CONTRACT, checked here at import so a malformed lesson breaks every
// suite rather than shipping (DR-0076 §2):
//   app/src/lib/living-lessons/<id>.js
//     export const ORDER = 302;            // the lesson number, the sort key
//     export const ADDED = '2026-11-13';   // the day it joined the course
//     export default { id: 'll302-…', title, bigIdea, … };
//   - the file name is the id, so no two files can hold one lesson;
//   - ORDER equals the number in the id, so the key cannot drift from the name;
//   - ADDED is a calendar day, read by withAdded() before living-lessons-dates.js.
// The lessons join LIVING_LESSONS_MODULES after the 300 that live in the
// monolith, sorted by ORDER then id — never by the order the glob returns.
//
// HOW IT LOADS. Under Vite, vitest and vite-node, import.meta.glob reads the
// directory at build time. Plain `node` has no glob, so a plain-node caller
// preloads the same shape first (scripts/lib/living-lesson-files.mjs,
// preloadPerFileLessonsForNode, which register-json-imports.mjs runs). A plain
// node import WITHOUT that preload throws, by design: a scanner that silently
// saw no per-file lessons would pass on exactly the lessons it never read.
// =============================================================================
import { LIVING_LESSONS_ADDED } from './living-lessons-dates.js';

export const PER_FILE_DIR = 'app/src/lib/living-lessons';
export const NODE_PRELOAD_KEY = '__LIVING_LESSONS_PER_FILE__';
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Pure. The glob's { './living-lessons/<id>.js': namespace } record, validated
 * and sorted. Throws on the first broken contract, naming the file.
 */
export function collectPerFileLessons(found) {
  const out = [];
  for (const [path, ns] of Object.entries(found || {})) {
    const file = path.split('/').pop();
    const mod = ns && ns.default;
    const where = `living-lessons/${file}`;
    if (!mod || typeof mod !== 'object') throw new Error(`${where}: no default export holding the lesson object`);
    const num = /^ll(\d+)-[a-z0-9-]+$/.exec(String(mod.id || ''));
    if (!num) throw new Error(`${where}: id '${mod.id}' is not ll<number>-<lowercase-slug>`);
    if (file !== `${mod.id}.js`) throw new Error(`${where}: the file must be named after its id (${mod.id}.js)`);
    if (ns.ORDER !== Number(num[1])) throw new Error(`${where}: ORDER ${ns.ORDER} must equal the number in its id (${num[1]})`);
    if (!ISO_DAY.test(String(ns.ADDED || ''))) throw new Error(`${where}: ADDED '${ns.ADDED}' is not a YYYY-MM-DD day`);
    out.push({ file: where, order: ns.ORDER, added: ns.ADDED, module: mod });
  }
  return out.sort((a, b) => a.order - b.order || (a.module.id < b.module.id ? -1 : a.module.id > b.module.id ? 1 : 0));
}

const FOUND = import.meta.env ? import.meta.glob('./living-lessons/ll*.js', { eager: true }) : globalThis[NODE_PRELOAD_KEY];
if (!FOUND) {
  throw new Error(
    'living-lessons-per-file: plain node cannot read app/src/lib/living-lessons/. Run under vite-node, ' +
      'or call preloadPerFileLessonsForNode() from scripts/lib/living-lesson-files.mjs first ' +
      '(node --import ./scripts/register-json-imports.mjs does).'
  );
}

export const PER_FILE_LESSONS = collectPerFileLessons(FOUND);
export const PER_FILE_CATALOG = PER_FILE_LESSONS.map((l) => l.module);
export const PER_FILE_ADDED = Object.fromEntries(PER_FILE_LESSONS.map((l) => [l.module.id, l.added]));

// One record of every lesson's day for the readers that key on
// LIVING_LESSONS_ADDED (the order view, lesson-dates, the sort). A day recorded
// in BOTH places is two records that may disagree, so it is refused.
for (const [id, day] of Object.entries(PER_FILE_ADDED)) {
  if (LIVING_LESSONS_ADDED[id] && LIVING_LESSONS_ADDED[id] !== day) {
    throw new Error(`living-lessons/${id}.js: ADDED ${day} disagrees with living-lessons-dates.js (${LIVING_LESSONS_ADDED[id]}); keep one`);
  }
  LIVING_LESSONS_ADDED[id] = day;
}
