#!/usr/bin/env node
// =============================================================================
// library-gaps — the fill lane's work list, from the catalog, as JSON (DR-1262)
// =============================================================================
// Prints the gap queue the app's own census derives (lib/library-census.js),
// newest first, each entry naming what it waits for; `--lesson <id>` prints
// one lesson's module, its course and the source file that holds it, which
// is what the fill job on the NAS reads before it writes. Counts and ids
// only on the queue; the module print is for the job, never a public log.
//   node --import ./scripts/register-json-imports.mjs scripts/library-gaps.mjs [--limit N] [--versions-only]
//   node --import ./scripts/register-json-imports.mjs scripts/library-gaps.mjs --lesson <id>
// =============================================================================
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalogCourseDescriptors } from '../app/src/lib/learn-catalog.js';
import { censusLibrary, censusCounts } from '../app/src/lib/library-census.js';

const HERE_FILE = import.meta.url.startsWith('file:') ? fileURLToPath(import.meta.url) : import.meta.url;
const HERE = dirname(HERE_FILE);
const SRC = join(HERE, '..', 'app', 'src');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

/**
 * The source file whose text declares this lesson id, or null. The course
 * files write a module's id four ways (`id: '…'`, `id: "…"`, `"id": "…"`,
 * `'id': '…'`), and some courses live below lib/, so the scan is recursive.
 */
export function fileOfLesson(lessonId, dir = SRC) {
  const needle = [`id: '${lessonId}'`, `id: "${lessonId}"`, `"id": "${lessonId}"`, `'id': '${lessonId}'`];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      if (ent.isDirectory()) { if (ent.name !== '__tests__' && ent.name !== 'node_modules') stack.push(join(d, ent.name)); continue; }
      if (!/\.(js|jsx)$/.test(ent.name)) continue;
      const file = join(d, ent.name);
      const src = readFileSync(file, 'utf8');
      if (needle.some((n) => src.includes(n))) return file;
    }
  }
  return null;
}

const isMain = !!process.argv[1] && HERE_FILE === process.argv[1];
const courses = isMain ? buildCatalogCourseDescriptors() : [];
const census = isMain ? censusLibrary(courses) : null;

if (isMain && value('--lesson')) {
  const id = value('--lesson');
  for (const c of courses) {
    const m = (c.schedule || []).find((x) => x && x.id === id);
    if (m) {
      const entry = census.queue.find((q) => q.lessonId === id) || null;
      process.stdout.write(JSON.stringify({ courseKey: c.key || c.meta?.key, courseTitle: c.meta?.title || '', file: fileOfLesson(id), module: m, waits: entry }) + '\n');
      process.exit(0);
    }
  }
  process.stderr.write(`no mounted lesson has id ${id}\n`);
  process.exit(2);
}

if (isMain) {
  let queue = census.queue;
  if (flag('--versions-only')) queue = queue.filter((q) => q.missingVersions.length);
  const limit = Number(value('--limit') || 0);
  if (limit > 0) queue = queue.slice(0, limit);
  process.stdout.write(JSON.stringify({ counts: censusCounts(census), queue: queue.map((q) => ({ ...q, file: fileOfLesson(q.lessonId) })) }, null, flag('--pretty') ? 2 : 0) + '\n');
}
