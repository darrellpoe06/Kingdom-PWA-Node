// =============================================================================
// The department a course belongs to survives the trip to the shelf (DR-0447)
// =============================================================================
// Darrell 2026-09-16, reading the live church door: "One course.... 8 lessons?"
// — the A.I. The Way department showed ONE course while three are registered,
// and a phantom "General Studies" held four courses that each declare a real
// category. The registry was right the whole way through; the host dropped the
// category when it retyped a cohort course's meta. These are the checks that
// make that drop fail the build instead of shipping as a one-course shelf.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEARN_CATALOG, catalogMeta, catalogCategory, buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { courseDepartment, departmentCode, learnDepartments, placeDepartments, DEPARTMENT_AFTER } from '../lib/learn-organize.js';

describe('catalogMeta carries the registry department', () => {
  it('every registered course declares a department', () => {
    const undeclared = LEARN_CATALOG.filter((e) => !catalogCategory(e.key)).map((e) => e.key);
    expect(undeclared).toEqual([]);
  });

  it('merges the registry category onto a meta that has none', () => {
    const meta = catalogMeta('sovereign-ai', { title: 'Sovereign A.I.' });
    expect(meta.key).toBe('sovereign-ai');
    expect(meta.category).toBe('A.I. The Way');
    expect(courseDepartment({ meta })).toBe('A.I. The Way');
  });

  it('keeps the course meta it is given', () => {
    expect(catalogMeta('ai', { title: 'Learning A.I. The Way' }).title).toBe('Learning A.I. The Way');
  });

  it('invents no department for an unregistered key', () => {
    expect(catalogMeta('not-a-course', { title: 'x' })).toEqual({ title: 'x', key: 'not-a-course' });
    expect(catalogCategory('not-a-course')).toBe(null);
  });

  it('no registered course falls through to General Studies', () => {
    const strays = LEARN_CATALOG
      .map((e) => ({ key: e.key, dept: courseDepartment({ meta: catalogMeta(e.key, e.meta) }) }))
      .filter((c) => c.dept === 'General Studies');
    expect(strays).toEqual([]);
  });

  it('the three A.I. courses share one department', () => {
    const ai = LEARN_CATALOG.filter((e) => catalogCategory(e.key) === 'A.I. The Way').map((e) => e.key);
    expect(ai).toEqual(['ai', 'sovereign-ai', 'ai-legal-blueprint']);
  });
});

// THE DROP ITSELF, CAUGHT AT ITS SOURCE. The bug was not a wrong value; it was
// a descriptor assembling `meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai' }`
// by hand, where the category simply is not mentioned. Route every mounted
// descriptor through catalogMeta and the class of miss cannot come back.
describe('no mounted descriptor retypes a course meta', () => {
  const HOSTS = ['src/poe-financial-mvp-v28.jsx', 'src/components/ChurchLearn.jsx'];
  it('spreads no *_META into a hand-built meta literal', () => {
    const offenders = [];
    for (const f of HOSTS) {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (/meta:\s*\{\s*\.\.\.[A-Z0-9_]*META\b/.test(line)) offenders.push(`${f}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('a department code a reader recognizes', () => {
  it('reads an initialism as itself', () => {
    expect(departmentCode('A.I. The Way')).toBe('AI');
  });
  it('still initials a plain multi-word name', () => {
    expect(departmentCode('The Word & The Way')).toBe('WW');
    expect(departmentCode('Kingdom Life & Stewardship')).toBe('KLS');
    expect(departmentCode('The Eternal Algorithms')).toBe('EA');
  });
  it('still shortens a one-word name', () => {
    expect(departmentCode('Mathematics')).toBe('MAT');
  });
});

describe('A.I. The Way sits after The Eternal Algorithms', () => {
  const at = (list, label) => list.findIndex((d) => d.label === label);
  it('is placed immediately after its anchor whatever its weight', () => {
    const placed = placeDepartments([
      { label: 'The Word & The Way' }, { label: 'The Eternal Algorithms' },
      { label: 'Serve the House' }, { label: 'A.I. The Way' }, { label: 'Mathematics' },
    ]);
    expect(at(placed, 'A.I. The Way')).toBe(at(placed, 'The Eternal Algorithms') + 1);
    expect(placed.map((d) => d.label)).toEqual([
      'The Word & The Way', 'The Eternal Algorithms', 'A.I. The Way', 'Serve the House', 'Mathematics',
    ]);
  });

  it('leaves the order alone when the anchor is not mounted', () => {
    const placed = placeDepartments([{ label: 'Serve the House' }, { label: 'A.I. The Way' }]);
    expect(placed.map((d) => d.label)).toEqual(['Serve the House', 'A.I. The Way']);
  });

  it('names an anchor that is a real department of the catalog', () => {
    const labels = new Set(LEARN_CATALOG.map((e) => catalogCategory(e.key)).concat(['The Eternal Algorithms']));
    for (const [label, after] of Object.entries(DEPARTMENT_AFTER)) {
      expect(labels.has(label)).toBe(true);
      expect(labels.has(after)).toBe(true);
    }
  });

  it('holds on the real catalog: A.I. The Way follows the Algorithms, and every course is placed', () => {
    const courses = buildCatalogCourseDescriptors().map((c) => ({ ...c, key: c.meta.key }))
      .concat([{ key: 'eternal-torah', meta: { title: 'Torah', key: 'eternal-torah' }, schedule: [{ id: 'p1' }] }]);
    const depts = learnDepartments(courses);
    const labels = depts.map((d) => d.label);
    expect(labels).not.toContain('General Studies');
    expect(at(depts, 'A.I. The Way')).toBe(at(depts, 'The Eternal Algorithms') + 1);
    const aiDept = depts.find((d) => d.label === 'A.I. The Way');
    expect(aiDept.code).toBe('AI');
    // 'ai' is component-wired so it is absent from this harness; the other two
    // A.I. courses must both be here — the shelf is never one course again.
    expect(aiDept.courses.map((c) => c.key)).toEqual(['sovereign-ai', 'ai-legal-blueprint']);
  });
});
