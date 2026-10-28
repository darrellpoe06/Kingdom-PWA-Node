// =============================================================================
// THE SPLICE LANDS IN EVERY COURSE FILE — the fill lane's one risky move,
// proven on the real sources (DR-1262)
// =============================================================================
// Writing a missing version INTO an existing lesson is a change to the
// course's own source file, and the files are not one shape (inline levels,
// JSON-style modules, one-line modules, lessons built from data with no
// literal at all). scripts/splice-lesson-level.mjs does it by the file's
// parse tree. Proven here: every lesson the census can place in a file is
// located by the splicer; a marker version spliced into a COPY of every file
// that declares lessons imports back as that lesson's version; the lessons
// no file declares are exactly the ones built from data, and the lane skips
// them by name.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { censusLibrary } from '../lib/library-census.js';
import { locateModule, spliceLevel, literal } from '../../../scripts/splice-lesson-level.mjs';
import { fileOfLesson } from '../../../scripts/library-gaps.mjs';

const SRC = join(process.cwd(), 'src');
const courses = buildCatalogCourseDescriptors();
const lessons = courses.flatMap((c) => (c.schedule || []).map((m) => ({ courseKey: c.key || c.meta?.key, id: m.id })));

function findModule(value, id, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (value.id === id && value.levels) return value;
  for (const v of Array.isArray(value) ? value : Object.values(value)) {
    const hit = findModule(v, id, seen);
    if (hit) return hit;
  }
  return null;
}

describe('every lesson has a file, or is known not to', () => {
  const placed = lessons.map((l) => ({ ...l, file: fileOfLesson(l.id, SRC) }));
  const unplaced = placed.filter((l) => !l.file);
  it('the lessons no file declares are the ones built from data (two courses), and only those', () => {
    expect(lessons.length).toBeGreaterThan(600);
    // healthy-living and who-he-is build their modules from data, so no
    // source literal carries an id; the lane names and skips them.
    const DATA_BUILT = new Set(['healthy-living', 'who-he-is']);
    expect(unplaced.length).toBeLessThanOrEqual(26);
    for (const l of unplaced) expect(DATA_BUILT.has(l.courseKey), `${l.id} (${l.courseKey}) must be a data-built course lesson`).toBe(true);
  });
  it('the splicer locates every placed lesson in its file by the parse tree', () => {
    const byFile = new Map();
    for (const l of placed) if (l.file) byFile.set(l.file, [...(byFile.get(l.file) || []), l.id]);
    let located = 0;
    for (const [file, ids] of byFile) {
      const src = readFileSync(file, 'utf8');
      for (const id of ids) { expect(locateModule(src, id), `${basename(file)}: ${id}`).toBeTruthy(); located += 1; }
    }
    expect(located).toBe(placed.length - unplaced.length);
  });
});

describe('a marker version spliced into a copy of every course file imports back', () => {
  const byFile = new Map();
  for (const l of lessons) { const f = fileOfLesson(l.id, SRC); if (f) byFile.set(f, l.id); }
  it(`${byFile.size} files, one lesson each, through added-band / replaced / added-levels`, async () => {
    expect(byFile.size).toBeGreaterThan(30);
    const marker = `Marker youth words for the splice proof: it's "quoted", with a back\\slash and a new\nline.`;
    for (const [file, id] of byFile) {
      const src = readFileSync(file, 'utf8');
      const { src: out, action } = spliceLevel(src, id, 'youth', marker);
      expect(['added-band', 'replaced', 'added-levels']).toContain(action);
      const tmp = join(dirname(file), `.splice-proof-${basename(file)}`);
      writeFileSync(tmp, out);
      try {
        const mod = await import(/* @vite-ignore */ `${tmp}?t=${Date.now()}`);
        const found = findModule(mod, id);
        expect(found, `${basename(file)} → ${id}`).toBeTruthy();
        expect(found.levels.youth, `${basename(file)}: the marker is the youth version`).toBe(marker);
      } finally {
        if (existsSync(tmp)) unlinkSync(tmp);
      }
    }
  }, 120000);
  it('refuses a lesson the file does not hold, and never writes what would not parse', () => {
    expect(() => spliceLevel("export const X = [{ id: 'a', lesson: 'x' }];\n", 'b', 'youth', 'y')).toThrow(/not declared/);
    expect(() => spliceLevel("export const X = [{ id: 'a', lesson: 'x' }];\n", 'a', 'grown', 'y')).toThrow(/unknown band/);
    expect(literal("it's\nhere")).toBe("'it\\'s\\nhere'");
  });
});
