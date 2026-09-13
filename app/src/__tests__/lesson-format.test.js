// =============================================================================
// lesson-format — numbered sections, breath lines, and NOT ONE WORD changed
// =============================================================================
// Darrell 2026-08-25: "I want all lessons to have the same flow or view or
// look... bullet points with the number next to the sections... instead of
// looking like run-on sentences... also the text when sharing needs the same
// clean up." The formatter may only ADD breaks and number labels; the verse
// pins depend on the words being byte-identical, so word preservation is the
// first gate here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatLessonText, lessonShareText } from '../lib/lesson-format.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const norm = (t) => t.replace(/\s+/g, ' ').trim();
const mod = (prefix) => LIVING_LESSONS_MODULES.find((m) => m.id.startsWith(prefix));

describe('word preservation — the one unbreakable rule', () => {
  const flatten = (items) => items
    .map((i) => (i.kind === 'point' ? i.lines.join(' ') : i.text))
    .join(' ');
  it('rejoining the formatted items reproduces every lesson text exactly (all modules, all fields)', () => {
    for (const m of LIVING_LESSONS_MODULES) {
      const texts = [m.bigIdea, m.lesson, ...(m.levels ? Object.values(m.levels) : [])].filter(Boolean);
      for (const t of texts) {
        const { items } = formatLessonText(t);
        expect(flatten(items)).toBe(norm(t));
      }
    }
  });
  it('share text strips back to the original: only "N. " labels and line breaks are added', () => {
    const t = mod('ll87').bigIdea;
    const share = lessonShareText(t);
    const restored = share
      .split('\n').filter(Boolean)
      .map((row) => row.replace(/^\d+\. /, ''))
      .join(' ');
    expect(restored).toBe(norm(t));
  });
});

describe('numbering comes from the author’s own markers (stable across chunks)', () => {
  it('FIRST..SIXTH in The King’s Program Part 1 number 1..6', () => {
    const { items, sectionCount } = formatLessonText(mod('ll87').bigIdea);
    const heads = items.filter((i) => i.kind === 'heading');
    expect(sectionCount).toBe(6);
    expect(heads.map((h) => h.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(heads[0].text).toContain('THE TWO WAYS');
  });
  it('Roman numerals I./II./III. number the Luke survey movements', () => {
    const { items } = formatLessonText(mod('ll86').levels.senior);
    const ns = items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns).toContain(1);
    expect(ns).toContain(2);
    expect(ns).toContain(3);
  });
  it('SOIL 1..4 number the four soils', () => {
    const { items } = formatLessonText(mod('ll88').levels.senior);
    const ns = items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns).toEqual(expect.arrayContaining([1, 2, 3, 4]));
  });
  it('a lesson with no markers still gains breath lines inside its points, never one wall', () => {
    const { items, sectionCount } = formatLessonText(mod('ll84').bigIdea);
    expect(sectionCount).toBe(0);
    const lines = items.flatMap((i) => (i.kind === 'point' ? i.lines : [i.text]));
    expect(lines.length).toBeGreaterThan(3);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(420);
  });
});

describe('3-6 numbered points for the WHOLE lesson (Darrell 2026-08-25: "maybe 3 to 6 points... for the whole lesson")', () => {
  it('an unmarked lesson derives 3-6 main points (or fewer only when the text is tiny)', () => {
    for (const m of LIVING_LESSONS_MODULES) {
      const texts = [m.bigIdea, m.lesson, ...(m.levels ? Object.values(m.levels) : [])].filter(Boolean);
      for (const t of texts) {
        const { items, sectionCount, pointCount } = formatLessonText(t);
        expect(pointCount).toBeGreaterThan(0);
        if (sectionCount === 0 && norm(t).length >= 900) {
          expect(pointCount).toBeGreaterThanOrEqual(3);
          expect(pointCount).toBeLessThanOrEqual(6);
          const ps = items.filter((i) => i.kind === 'point').map((i) => i.p);
          expect(ps).toEqual(Array.from({ length: pointCount }, (_, k) => k + 1));
        }
      }
    }
  });
  it('a marked lesson keeps the author-numbered sections AS the points', () => {
    const { sectionCount, pointCount } = formatLessonText(mod('ll87').bigIdea);
    expect(sectionCount).toBe(6);
    expect(pointCount).toBe(6);
  });
  it('share text numbers every point, marked and unmarked alike', () => {
    const marked = lessonShareText(mod('ll87').bigIdea).split('\n');
    expect(marked.some((r) => r.startsWith('1. FIRST'))).toBe(true);
    const unmarked = lessonShareText(mod('ll84').bigIdea).split('\n');
    expect(unmarked.some((r) => /^1\. /.test(r))).toBe(true);
    expect(unmarked.some((r) => /^3\. /.test(r))).toBe(true);
  });
});

describe('one chronological count per lesson — never restarting (Darrell 2026-08-25: "the whole lesson should be building... never starting over inside the same lesson")', () => {
  it('derived points continue across paced segments: a segment picks up where the last one ended', () => {
    // Simulate the age-band pacing: the same unmarked lesson split into two
    // chunks at a sentence boundary. Threading startAt through them must yield
    // one sequence 1..N — the exact "1-3 then 1-3 again" restart is the bug.
    const t = norm(mod('ll84').bigIdea);
    const half = Math.floor(t.length / 2);
    const cut = t.indexOf('. ', half);
    expect(cut).toBeGreaterThan(0);
    const seg1 = t.slice(0, cut + 1);
    const seg2 = t.slice(cut + 2);
    const r1 = formatLessonText(seg1);
    const r2 = formatLessonText(seg2, { startAt: r1.nextStart });
    const ps = [...r1.items, ...r2.items].filter((i) => i.kind === 'point').map((i) => i.p);
    expect(ps.length).toBeGreaterThanOrEqual(3);
    expect(ps).toEqual(Array.from({ length: ps.length }, (_, k) => k + 1));
    // And the restart the Governor saw is provably gone: segment 2 never re-numbers from 1.
    expect(r2.items.find((i) => i.kind === 'point').p).toBe(r1.pointCount + 1);
  });
  it('the speaker’s own section numbers are never overridden by the thread', () => {
    // A marked text keeps the author’s numbers regardless of where the pacing
    // cuts — FOURTH is 4 even when it opens a segment ("the speakers create
    // points"; the machine only threads the unmarked ones).
    const { items, nextStart } = formatLessonText(mod('ll87').bigIdea);
    const heads = items.filter((i) => i.kind === 'heading');
    expect(heads.map((h) => h.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(nextStart).toBe(7);
  });
  it('unnumbered share mode keeps the structure but drops the labels (the big idea is the thesis)', () => {
    const t = mod('ll84').bigIdea;
    const share = lessonShareText(t, { numbered: false });
    expect(share.split('\n').some((r) => /^\d+\. /.test(r))).toBe(false);
    const restored = share.split('\n').filter(Boolean).join(' ');
    expect(restored).toBe(norm(t));
  });
});

describe('the surfaces are wired — screen and share carry the same structure', () => {
  it('ChurchLearn renders lessons through LessonProse at every text site', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/export function LessonProse/);
    expect((src.match(/<LessonProse text=\{/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(src).toMatch(/import \{ formatLessonText \} from '\.\.\/lib\/lesson-format\.js'/);
    expect(src).toMatch(/\{it\.p\}/); // the point-number chip renders on every point
    // The paced stepper threads ONE count across its segments — both the
    // read-along map and the stepper pass the running startAt.
    expect((src.match(/<LessonProse text=\{[^}]+\} startAt=\{segStarts\[/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(src).toMatch(/formatLessonText\(s, \{ startAt: n \}\)\.nextStart/);
  });
  it('the copy/share block: unnumbered thesis, then the body’s single numbered run', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'lesson-links.js'), 'utf8');
    expect(src).toMatch(/lessonShareText\(line\(module\.bigIdea\), \{ numbered: false \}\)/);
    expect(src).toMatch(/lessonShareText\(line\(body\)\)/);
  });
});
