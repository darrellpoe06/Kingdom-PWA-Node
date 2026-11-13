// @vitest-environment node
// =============================================================================
// The author never types a verse (DR-1468)
// =============================================================================
// scripts/verse.mjs prints a reference off app/public/bible/kjv; a lesson file
// carries {{kjv:Ref}} or {{kjv:Ref|part}} tokens that scripts/fill-verses.mjs
// fills in the house form, "words" (Ref); unfilled-verse-token-guard fails the
// build on any token left; scripts/new-lesson.mjs writes the skeleton those
// tokens live in. A filled quotation is proven to pass the catalog's own verse
// gate, and a hand-typed slip in the same place is proven to fail it -- which
// is why a new lesson needs no per-lesson verse test of its own.
import { describe, it, expect, afterEach } from 'vitest';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseRef, kjvText, kjvVerses, canonicalBook } from '../../../scripts/lib/kjv.mjs';
import { quoteOf } from '../../../scripts/verse.mjs';
import { fillVerses, contextAt, escapeFor, quotationFor } from '../../../scripts/fill-verses.mjs';
import { unfilledTokens, scan } from '../../../scripts/unfilled-verse-token-guard.mjs';
import { slugify, lessonNumbersIn, lessonSkeleton, testSkeleton, run } from '../../../scripts/new-lesson.mjs';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { formatFiles, prettierArgs } from '../../../scripts/lib/prettier-write.mjs';
import { readerTexts } from '../../../scripts/quotation-integrity.mjs';

const KJV = join(__dirname, '..', '..', 'public', 'bible', 'kjv');
const corpus = (file, ch, v) => JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')).chapters[ch - 1][v - 1];
// A lesson file is an ES module; compile it as a script to prove it parses.
const parses = (src) => {
  new vm.Script(src.replace(/^export default /m, 'const L = ').replace(/^export /gm, ''));
  return true;
};

describe('verse.mjs reads the corpus, never memory', () => {
  it('prints a single verse, a range and a cross-chapter range verbatim', () => {
    expect(kjvText('Romans 2:14-15')).toBe(`${corpus('Romans', 2, 14)} ${corpus('Romans', 2, 15)}`);
    expect(kjvText('John 11:35')).toBe('Jesus wept.');
    expect(kjvVerses('Genesis 1:31-2:1')).toEqual([corpus('Genesis', 1, 31), corpus('Genesis', 2, 1)]);
  });

  it('resolves the books the way prose writes them, through the corpus index', () => {
    expect(canonicalBook('Psalm')).toBe('Psalms');
    expect(canonicalBook('Song of Solomon')).toBe('Song of Solomon');
    expect(canonicalBook('1 John')).toBe('1 John');
    expect(quoteOf('Psalm 23:1')).toBe('"The LORD is my shepherd; I shall not want." (Psalms 23:1)');
    expect(quoteOf('Song of Solomon 2:4')).toBe(`"${corpus('SongofSolomon', 2, 4)}" (Song of Solomon 2:4)`);
  });

  it('refuses what the corpus does not hold, rather than guessing', () => {
    expect(() => parseRef('Hezekiah 1:1')).toThrow(/no such book/);
    expect(() => kjvText('Romans 99:1')).toThrow(/no chapter 99/);
    expect(() => kjvText('Jude 1:99')).toThrow(/no verse 99/);
    expect(() => parseRef('Romans 2:15-14')).toThrow(/backwards/);
    expect(() => parseRef('Romans two')).toThrow(/not a reference/);
  });
});

describe('fill-verses writes the house form, escaped for where it lands', () => {
  it('fills a whole reference and a checked part, and the file still parses', () => {
    const src = 'export default { a: \'{{kjv:Psalm 23:1}}\', b: "x {{kjv:Joel 2:28|your old men shall dream dreams}} y", c: `{{kjv:John 11:35}}` };\n';
    const { text, filled, errors } = fillVerses(src);
    expect(errors).toEqual([]);
    expect(filled).toBe(3);
    expect(text).toContain('a: \'"The LORD is my shepherd; I shall not want." (Psalms 23:1)\'');
    expect(text).toContain('b: "x \\"your old men shall dream dreams\\" (Joel 2:28) y"');
    expect(text).toContain('c: `"Jesus wept." (John 11:35)`');
    expect(parses(text)).toBe(true);
  });

  it('knows which string it is in, and escapes for exactly that one', () => {
    const src = "const a = 'x'; // {{kjv:John 11:35}}\nconst b = \"it's {{kjv:John 11:35}}\";";
    expect(contextAt(src, src.indexOf('{{'))).toBe('line');
    expect(contextAt(src, src.lastIndexOf('{{'))).toBe('"');
    expect(escapeFor("'", 'it\'s "so"')).toBe('it\\\'s "so"');
    expect(escapeFor('"', 'it\'s "so"')).toBe('it\'s \\"so\\"');
    expect(escapeFor('`', 'a `b` ${c}')).toBe('a \\`b\\` \\${c}');
  });

  it('PROVEN TO CATCH: a part that is not in the verse, a bad reference, and a token in bare code are refused, and nothing is filled', () => {
    expect(() => quotationFor('Joel 2:28', 'your old men shall see visions')).toThrow(/is not in Joel 2:28/);
    const bad = fillVerses("x = '{{kjv:Joel 2:28|your old men shall see visions}} {{kjv:Hezekiah 1:1}}'; y = {{kjv:John 11:35}};");
    expect(bad.errors).toHaveLength(3);
    expect(bad.filled).toBe(0);
    expect(bad.errors.join('\n')).toMatch(/outside any string/);
  });

  it('allows only the opening letter of a part to change case, as the verse gate does', () => {
    expect(quotationFor('Joel 2:28', 'Your old men shall dream dreams')).toBe('"Your old men shall dream dreams" (Joel 2:28)');
    expect(() => quotationFor('Joel 2:28', 'your Old men shall dream dreams')).toThrow(/is not in/);
  });

  it('a filled quotation passes the catalog verse gate, and the same quotation typed by hand with one slip does not', () => {
    const q = quotationFor('Romans 2:14-15');
    const filled = { id: 'll999-filled', title: 'x', lesson: `TAUGHT. Paul writes ${q} and that is the point.` };
    expect(scanQuotedVerses([filled], readerTexts).faults).toEqual([]);
    expect(scanQuotedVerses([filled], readerTexts).spans).toBeGreaterThan(0);
    const typed = { ...filled, lesson: filled.lesson.replace('accusing or else excusing', 'accusing or excusing') };
    expect(scanQuotedVerses([typed], readerTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('no token ships', () => {
  it('finds both kinds of token, with their lines', () => {
    expect(unfilledTokens("a\nb: '{{kjv:John 3:16}}'\n// {{write: the hook}}")).toEqual([
      { line: 2, token: '{{kjv:John 3:16}}', kind: 'kjv' },
      { line: 3, token: '{{write: the hook}}', kind: 'write' },
    ]);
    expect(unfilledTokens('"For God so loved the world" (John 3:16) {{ not a token }}')).toEqual([]);
  });

  it('app/src holds none today', () => {
    expect(scan()).toEqual([]);
  });
});

describe('new-lesson writes the skeleton in the newest lessons’ full shape', () => {
  let tmp = null;
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
    tmp = null;
  });

  it('slugs a title and reads lesson numbers in both record shapes and from file names', () => {
    expect(slugify('Your Old Men Shall Dream Dreams — the Spirit Poured Out')).toBe('your-old-men-shall-dream-dreams-the-spirit-poured-out');
    expect(slugify("Let's Go")).toBe('lets-go');
    expect(slugify('a '.repeat(80)).length).toBeLessThanOrEqual(60);
    expect([...lessonNumbersIn('  id: \'ll12-a\',\n  "id": "ll300-b",', ['app/src/lib/living-lessons/ll302-c.js'])].sort((a, b) => a - b)).toEqual([
      12, 300, 302,
    ]);
  });

  it('the skeleton has four bands, the adult lesson, two parables, ten questions and an UNCHECKED slot, and parses once filled', () => {
    const src = lessonSkeleton({ id: 'll302-a', n: 302, title: "Let's Go", anchor: 'Joel 2:28', added: '2026-11-13', dr: 'DR-1468' });
    const { text, errors, filled } = fillVerses(src);
    expect(errors).toEqual([]);
    expect(filled).toBeGreaterThan(10);
    expect(parses(text)).toBe(true);
    for (const band of ['child:', 'youth:', 'teen:', 'senior:', 'lesson:', 'quiz:', 'facilitator:', 'benefits:', 'stories:']) expect(text).toContain(band);
    expect((text.match(/kind: 'parable'/g) || []).length).toBe(2);
    expect((text.match(/^ {8}\{\n {10}q: /gm) || []).length, 'ten questions, as L307 and L308 carry (DR-1477)').toBe(10);
    // The UNCHECKED slot: commented, and a {{write:}} the guard refuses until it is filled or deleted.
    expect(text).toMatch(/\/\/ UNCHECKED: fill this in, or DELETE these lines/);
    expect(text).toMatch(/^export const UNCHECKED = '\{\{write: /m);
    expect(text).toMatch(/export const ORDER = 302;/);
    // What is left after filling is prose owed, and the guard still refuses it.
    expect(unfilledTokens(text).every((t) => t.kind === 'write')).toBe(true);
    expect(unfilledTokens(text).length).toBeGreaterThan(10);
    const t = testSkeleton({ id: 'll302-a', n: 302, added: '2026-11-13', anchor: 'Joel 2:28' });
    expect(t).toMatch(/import lesson, \{ ORDER, ADDED, UNCHECKED \} from '\.\.\/lib\/living-lessons\/ll302-a\.js'/);
    // The test is a few lines on the shared gate, naming its spine (DR-1477).
    expect(t).toMatch(/import \{ livingLessonGate \} from '\.\/helpers\/living-lesson-gate\.js'/);
    expect(t).toMatch(/spine: \[\['Joel 2:28', '\{\{write: /);
    expect(t.split('\n').length).toBeLessThan(30);
  });

  it('takes the next number above the catalog, writes both files, and refuses a taken --id', () => {
    tmp = mkdtempSync(join(tmpdir(), 'new-lesson-'));
    mkdirSync(join(tmp, 'app/src/lib/living-lessons'), { recursive: true });
    mkdirSync(join(tmp, 'app/src/__tests__'), { recursive: true });
    writeFileSync(join(tmp, 'app/src/lib/living-lessons-class.js'), "  {\n    id: 'll301-x',\n  },\n");
    writeFileSync(join(tmp, 'app/src/lib/living-lessons/ll302-y.js'), 'export default {};\n');
    const out = [];
    const formatted = [];
    const code = run(['--title', 'A Fresh Word', '--anchor', 'Joel 2:28', '--added', '2026-11-13', '--no-reserve'], {
      cwd: tmp,
      log: (s) => out.push(s),
      err: (s) => out.push(s),
      preflight: false,
      format: (paths, opts) => {
        formatted.push(...paths, opts);
        return { ok: true, formatted: paths, skipped: [], reason: '' };
      },
    });
    expect(code, out.join('\n')).toBe(0);
    const made = readFileSync(join(tmp, 'app/src/lib/living-lessons/ll303-a-fresh-word.js'), 'utf8');
    expect(made).toMatch(/id: 'll303-a-fresh-word'/);
    expect(readFileSync(join(tmp, 'app/src/__tests__/living-lessons-ll303-a-fresh-word.test.js'), 'utf8')).toMatch(/order: 303,/);
    expect(out.join('\n')).toMatch(/claude\/lesson-ll303/);
    expect(formatted.slice(0, 2).map((p) => p.replace(tmp, ''))).toEqual([
      '/app/src/lib/living-lessons/ll303-a-fresh-word.js',
      '/app/src/__tests__/living-lessons-ll303-a-fresh-word.test.js',
    ]);
    expect(formatted[2], 'new files are formatted whatever the base says').toEqual({ force: true });
    expect(run(['--title', 'Again', '--id', 'll302', '--no-reserve'], { cwd: tmp, log: () => {}, err: (s) => out.push(s), preflight: false })).toBe(1);
    expect(out.join('\n')).toMatch(/ll302 is taken/);
  });
});

describe('what new-lesson and fill-verses write is already formatted (DR-1477)', () => {
  let tmp = null;
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
    tmp = null;
  });
  const APP = join(__dirname, '..', '..');
  // format-guard's own check, on the same files (it runs from app/ with the repo config).
  const prettierCheck = (paths) =>
    spawnSync('npx', ['--no-install', 'prettier', '--check', ...prettierArgs(paths).slice(3)], { cwd: APP, encoding: 'utf8', timeout: 20_000 });

  it('PROVEN TO CATCH: the raw skeleton is not what format-guard accepts, and the formatted one is, filled or not', () => {
    tmp = mkdtempSync(join(tmpdir(), 'new-lesson-fmt-'));
    const lessonFile = join(tmp, 'll303-a-fresh-word.js');
    const testFile = join(tmp, 'living-lessons-ll303-a-fresh-word.test.js');
    const raw = lessonSkeleton({ id: 'll303-a-fresh-word', n: 303, title: 'A Fresh Word', anchor: 'Joel 2:28', added: '2026-11-13', dr: 'DR-1477' });
    writeFileSync(lessonFile, raw);
    writeFileSync(testFile, testSkeleton({ id: 'll303-a-fresh-word', n: 303, added: '2026-11-13', anchor: 'Joel 2:28' }));
    expect(prettierCheck([lessonFile]).status, 'the unformatted skeleton must fail the check, or this case proves nothing').not.toBe(0);
    const fmt = formatFiles([lessonFile, testFile], { force: true });
    expect(fmt.ok, fmt.reason).toBe(true);
    const checked = prettierCheck([lessonFile, testFile]);
    expect(checked.status, checked.stdout + checked.stderr).toBe(0);
    // fill-verses then fills, and formats again: the filled file still checks clean.
    const filled = fillVerses(readFileSync(lessonFile, 'utf8'));
    expect(filled.errors).toEqual([]);
    writeFileSync(lessonFile, filled.text);
    // base: HEAD, not origin/main: CI's checkout carries no origin/main ref, and an
    // unreadable base reads as "already held" on purpose (never reformat an old file).
    // HEAD always exists, and the temp file is never on it, so this asks the real question.
    expect(formatFiles([lessonFile], { base: 'HEAD' }).formatted, 'a file the base does not hold is new, so it is formatted').toEqual([lessonFile]);
    expect(prettierCheck([lessonFile]).status).toBe(0);
  }, 90_000);

  it('never reformats a file main already holds unless forced (DR-1343)', () => {
    const old = join(__dirname, '..', 'lib', 'living-lessons', 'll308-only-yahweh-can-judge-me.js');
    const calls = [];
    const r = formatFiles([old], { run: (args) => (calls.push(args), { status: 0, out: '' }) });
    expect(r.skipped).toEqual([old]);
    expect(calls).toEqual([]);
  });
});
