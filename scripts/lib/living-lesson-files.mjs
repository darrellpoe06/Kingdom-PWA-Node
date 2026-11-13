// =============================================================================
// living-lesson-files — where the per-file Living Lessons live, for every
// scanner that reads lesson TEXT by path (DR-1468)
// =============================================================================
// A guard that names app/src/lib/living-lessons-class.js and nothing else is
// blind to a lesson written as its own file under app/src/lib/living-lessons/.
// Every text-scanning guard asks this module instead of keeping its own copy
// of the path, so a new lesson file is scanned the day it lands.
//
// preloadPerFileLessonsForNode() gives plain `node` what import.meta.glob gives
// Vite: { './living-lessons/<id>.js': namespace }, set on globalThis before the
// catalog is imported (app/src/lib/living-lessons-per-file.js reads it).
// =============================================================================
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LIVING_LESSONS_DIR_REL = 'app/src/lib/living-lessons';
// Must equal NODE_PRELOAD_KEY in app/src/lib/living-lessons-per-file.js (pinned by a test).
export const NODE_PRELOAD_KEY = '__LIVING_LESSONS_PER_FILE__';
const LESSON_FILE = /^ll[^/]*\.js$/;

/** The lesson file names in the directory, sorted; [] when it does not exist yet. */
export function lessonFileNames(root = ROOT) {
  const dir = join(root, LIVING_LESSONS_DIR_REL);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => LESSON_FILE.test(f))
    .sort();
}

/** Repo-relative paths, for guards that list files from the repository root. */
export function livingLessonFiles(root = ROOT) {
  return lessonFileNames(root).map((f) => `${LIVING_LESSONS_DIR_REL}/${f}`);
}

/** app/src/lib-relative paths, for guards that read `join(LIB, file)`. */
export function libLessonFiles(root = ROOT) {
  return lessonFileNames(root).map((f) => `living-lessons/${f}`);
}

/** Plain node only: load every per-file lesson in the glob's shape. Idempotent. */
export async function preloadPerFileLessonsForNode(root = ROOT) {
  if (globalThis[NODE_PRELOAD_KEY]) return globalThis[NODE_PRELOAD_KEY];
  const found = {};
  for (const f of lessonFileNames(root)) {
    found[`./living-lessons/${f}`] = await import(pathToFileURL(join(root, LIVING_LESSONS_DIR_REL, f)).href);
  }
  globalThis[NODE_PRELOAD_KEY] = found;
  return found;
}
