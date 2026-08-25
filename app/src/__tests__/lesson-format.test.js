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

describe('the surfaces are wired — screen and share carry the same structure', () => {
  it('ChurchLearn renders lessons through LessonProse at every text site', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/export function LessonProse/);
    expect((src.match(/<LessonProse text=\{/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(src).toMatch(/import \{ formatLessonText \} from '\.\.\/lib\/lesson-format\.js'/);
    expect(src).toMatch(/\{it\.p\}/); // the point-number chip renders on every point
  });
  it('the copy/share block runs both bigIdea and body through lessonShareText', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'lesson-links.js'), 'utf8');
    expect(src).toMatch(/lessonShareText\(line\(module\.bigIdea\)\)/);
    expect(src).toMatch(/lessonShareText\(line\(body\)\)/);
  });
});
