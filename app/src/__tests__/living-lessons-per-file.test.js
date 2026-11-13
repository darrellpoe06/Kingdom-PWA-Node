// @vitest-environment node
// =============================================================================
// One file per new Living Lesson (DR-1468)
// =============================================================================
// Darrell, 2026-11-13: "Build 1, 2 and 3, and allow parallel branches." A new
// lesson is its own file under app/src/lib/living-lessons/, so two lesson
// branches add two files and never edit the same line. These cases pin the
// file contract, the order, the day, the plain-node road, and that every
// text-scanning guard that named the catalog file by path reads the directory.
// The end-to-end proof (a lesson planted in the directory, each guard red on
// its defect) is recorded in DR-1468; the integration is pinned in
// living-lessons-per-file-joins-the-catalog.test.js.
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectPerFileLessons, PER_FILE_CATALOG, PER_FILE_ADDED, NODE_PRELOAD_KEY } from '../lib/living-lessons-per-file.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  livingLessonFiles,
  libLessonFiles,
  preloadPerFileLessonsForNode,
  NODE_PRELOAD_KEY as SCRIPTS_KEY,
  ROOT,
} from '../../../scripts/lib/living-lesson-files.mjs';
import { judge, dirCeiling } from '../../../scripts/file-budget-guard.mjs';
import { spliceAppend } from '../../../scripts/splice-append.mjs';
import { declaresUnchecked } from '../../../scripts/unchecked-claims.mjs';
import { perFileUnattributed } from '../../../scripts/testimony-carries-its-source.mjs';
import { CORPUS_MODULES } from '../../../scripts/voice-clarity-corpus.mjs';

const lessonNs = (id, order, added = '2026-11-13') => ({ default: { id, title: 't' }, ORDER: order, ADDED: added });

describe('the file contract, checked at import', () => {
  it('sorts by ORDER, then id, never by the order the glob hands them back', () => {
    const got = collectPerFileLessons({
      './living-lessons/ll305-c.js': lessonNs('ll305-c', 305),
      './living-lessons/ll302-a.js': lessonNs('ll302-a', 302),
      './living-lessons/ll303-b.js': lessonNs('ll303-b', 303, '2026-11-14'),
    });
    expect(got.map((l) => l.module.id)).toEqual(['ll302-a', 'll303-b', 'll305-c']);
    expect(got[1].added).toBe('2026-11-14');
    expect(got[0].file).toBe('living-lessons/ll302-a.js');
  });

  it('PROVEN TO CATCH: each broken contract is refused by name', () => {
    const one = (path, ns) => () => collectPerFileLessons({ [path]: ns });
    expect(one('./living-lessons/ll302-a.js', { ORDER: 302, ADDED: '2026-11-13' })).toThrow(/no default export/);
    expect(one('./living-lessons/ll302-a.js', lessonNs('LL302-A', 302))).toThrow(/is not ll<number>-<lowercase-slug>/);
    expect(one('./living-lessons/ll302-other.js', lessonNs('ll302-a', 302))).toThrow(/named after its id/);
    expect(one('./living-lessons/ll302-a.js', lessonNs('ll302-a', 303))).toThrow(/ORDER 303 must equal the number in its id \(302\)/);
    expect(one('./living-lessons/ll302-a.js', lessonNs('ll302-a', 302, '13 Nov'))).toThrow(/is not a YYYY-MM-DD day/);
  });

  it('the plain-node preload key is one value in both places', () => {
    expect(SCRIPTS_KEY).toBe(NODE_PRELOAD_KEY);
  });
});

describe('the catalog reads the directory', () => {
  it('the per-file lessons ride at the end of LIVING_LESSONS_MODULES, after the catalog file’s own', () => {
    const own = (readFileSync(join(ROOT, 'app/src/lib/living-lessons-class.js'), 'utf8').match(/^\s*["']?id["']?\s*:\s*["']ll\d+-/gm) || []).length;
    expect(own).toBeGreaterThan(290); // both record shapes: id: 'll…' and "id": "ll…"
    expect(LIVING_LESSONS_MODULES.length).toBe(own + PER_FILE_CATALOG.length);
    PER_FILE_CATALOG.forEach((m, i) => expect(LIVING_LESSONS_MODULES[own + i]).toBe(m));
    expect(Object.keys(PER_FILE_ADDED).sort()).toEqual(PER_FILE_CATALOG.map((m) => m.id).sort());
  });

  it('withAdded reads the lesson file’s own day before living-lessons-dates.js', () => {
    const src = readFileSync(join(ROOT, 'app/src/lib/living-lessons-class.js'), 'utf8');
    expect(src).toMatch(/added: PER_FILE_ADDED\[m\.id\] \|\| LIVING_LESSONS_ADDED\[m\.id\] \|\| null/);
  });

  it('plain node is refused loudly without the preload, and reads the directory with it', () => {
    const probe = "import('./app/src/lib/living-lessons-class.js').then((m) => console.log('n=' + m.LIVING_LESSONS_MODULES.length))";
    let refused = '';
    try {
      execFileSync(process.execPath, ['-e', probe], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 });
    } catch (err) {
      refused = String(err.stderr);
    }
    expect(refused).toMatch(/plain node cannot read app\/src\/lib\/living-lessons/);
    const ok = execFileSync(process.execPath, ['--import', './scripts/register-json-imports.mjs', '-e', probe], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 15_000,
    });
    expect(ok.trim()).toBe(`n=${LIVING_LESSONS_MODULES.length}`);
  }, 40_000); // two plain-node loads of the 11 MB catalog, each under its own 15 s budget

  it('the voice witness samples only the catalog file’s lessons, so a new lesson never rewrites its fixture', () => {
    const perFile = new Set(PER_FILE_CATALOG.map((m) => m.id));
    expect(CORPUS_MODULES.length).toBe(LIVING_LESSONS_MODULES.length - PER_FILE_CATALOG.length);
    expect(CORPUS_MODULES.some((m) => perFile.has(m.id))).toBe(false);
  });
});

describe('every guard that read the catalog file by path reads the directory too', () => {
  let tmp = null;
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
    tmp = null;
  });

  it('the shared lister finds a lesson file the day it is written, in both spellings, and preloads it in the glob’s shape', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'll-files-'));
    mkdirSync(join(tmp, 'app/src/lib/living-lessons'), { recursive: true });
    writeFileSync(
      join(tmp, 'app/src/lib/living-lessons/ll302-a.js'),
      "export const ORDER = 302;\nexport const ADDED = '2026-11-13';\nexport default { id: 'll302-a' };\n"
    );
    writeFileSync(join(tmp, 'app/src/lib/living-lessons/README.txt'), 'not a lesson');
    expect(livingLessonFiles(tmp)).toEqual(['app/src/lib/living-lessons/ll302-a.js']);
    expect(libLessonFiles(tmp)).toEqual(['living-lessons/ll302-a.js']);
    const saved = globalThis[NODE_PRELOAD_KEY];
    delete globalThis[NODE_PRELOAD_KEY];
    try {
      const found = await preloadPerFileLessonsForNode(tmp);
      expect(Object.keys(found)).toEqual(['./living-lessons/ll302-a.js']);
      expect(collectPerFileLessons(found)[0].module.id).toBe('ll302-a');
    } finally {
      if (saved) globalThis[NODE_PRELOAD_KEY] = saved;
      else delete globalThis[NODE_PRELOAD_KEY];
    }
  });

  it('each path-listing guard asks the shared lister rather than keeping its own copy', () => {
    for (const g of [
      'scripture-inference-guard.mjs',
      'scripture-provenance-audit.mjs',
      'surface-hollow-guard.mjs',
      'testimony-carries-its-source.mjs',
      'unchecked-claims.mjs',
      'voice-clarity-corpus.mjs',
      'register-json-imports.mjs',
    ]) {
      expect(readFileSync(join(ROOT, 'scripts', g), 'utf8'), g).toMatch(/from '\.\/lib\/living-lesson-files\.mjs'/);
    }
    for (const t of ['parables-never-wear-a-real-name.test.js', 'bible-study-session-names-bishop-gwin.test.js']) {
      expect(readFileSync(join(ROOT, 'app/src/__tests__', t), 'utf8'), t).toMatch(/libLessonFiles\(\)/);
    }
    expect(readFileSync(join(ROOT, 'app/src/__tests__/every-store-of-his-words.test.js'), 'utf8')).toMatch(/'\.\.\/lib\/living-lessons\/ll\*\.js'/);
  });

  it('a per-file lesson carries a testimony’s source and an unchecked claim’s reason itself, at zero tolerance', () => {
    expect(perFileUnattributed()).toEqual([]);
    expect(
      declaresUnchecked("export const UNCHECKED = 'The talk could not be watched from this sandbox, so her words stand as hers. re-review: 2026-11-30';")
    ).toBe(true);
    // PROVEN TO CATCH: no reason, a reason with no date, a date with no reason.
    expect(declaresUnchecked('export default {};')).toBe(false);
    expect(declaresUnchecked("export const UNCHECKED = 'The talk could not be watched from this sandbox, so her words stand.';")).toBe(false);
    expect(declaresUnchecked("export const UNCHECKED = 're-review: 2026-11-30';")).toBe(false);
  });
});

describe('the derived numbers a new lesson no longer edits', () => {
  it('the file budget holds every lesson file to the directory ceiling, with no line per lesson', () => {
    const doc = JSON.parse(readFileSync(join(ROOT, 'scripts/file-budgets.json'), 'utf8'));
    const dir = 'app/src/lib/living-lessons/';
    expect(doc.dirBudgets[dir]).toBe(600);
    expect(Object.keys(doc.budgets).some((f) => f.startsWith(dir))).toBe(false);
    expect(dirCeiling(`${dir}ll302-a.js`, doc.dirBudgets)).toEqual({ dir, ceiling: 600 });
    expect(judge({ counts: { [`${dir}ll302-a.js`]: 180 }, budgets: {}, dirBudgets: doc.dirBudgets })).toEqual([]);
    // PROVEN TO CATCH: the same file over the line is named, and without the
    // directory rule the old 1,500-line rule would have let it through.
    expect(judge({ counts: { [`${dir}ll302-a.js`]: 601 }, budgets: {}, dirBudgets: doc.dirBudgets })[0]).toMatch(/over the 600-line ceiling/);
    expect(judge({ counts: { [`${dir}ll302-a.js`]: 601 }, budgets: {} })).toEqual([]);
  });

  it('a per-file lesson is never spliced: two branches on one file is the same lesson twice', () => {
    const r = spliceAppend({ base: 'a', ours: 'a\nb', theirs: 'a\nc', file: 'app/src/lib/living-lessons/ll302-a.js' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/cannot be spliced/);
  });
});
