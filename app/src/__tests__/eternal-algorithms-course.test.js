// @vitest-environment node
//
// eternal-algorithms-course (DR-0126/DR-0127) — the Learn tab's processing
// courses DERIVE from the Godhead-Study catalog; every session is Word-first
// and multi-level. These pin: the derivation (catalog → courses ripples),
// Word-first by construction (the big idea OPENS with the Scripture refs),
// the three neurological levels composed by depth selection, and the
// wordFirstLead resolver every course header renders from.
import { describe, it, expect } from 'vitest';
import {
  buildEternalProcessingCourses, moduleFromAlgorithm, modulesForSection, wordFirstLead,
} from '../lib/eternal-algorithms-course.js';
import { GODHEAD_SECTIONS, GODHEAD_ALGORITHMS } from '../lib/godhead-study.js';
import { resolveLevel as resolveThemeLevel } from '../lib/scripture-teaching.js';
import { THEMES } from '../lib/scriptures.js';

const ALG = {
  id: 'test-alg', section: 'torah', name: 'A Test Pattern',
  refs: ['Deuteronomy 30:19'],
  condition: 'the condition is met',
  consequence: 'the consequence follows',
  threeD: 'The practical walk.',
  psyche: 'Why it works inside.',
  outcome: 'The win.',
};

describe('the courses derive from the catalog', () => {
  it('yields one course per section that has patterns, sized by the catalog', () => {
    const courses = buildEternalProcessingCourses();
    const bySection = Object.fromEntries(courses.map((c) => [c.meta.key, c]));
    for (const s of GODHEAD_SECTIONS) {
      const count = GODHEAD_ALGORITHMS.filter((a) => a.section === s.key).length;
      const course = bySection[`eternal-${s.key}`];
      if (count === 0) { expect(course).toBeUndefined(); continue; }
      expect(course).toBeTruthy();
      expect(course.schedule).toHaveLength(count);
      expect(course.meta.weeks).toBe(count);
      expect(course.meta.unit.selfPaced).toBe(true);
    }
  });
  it('CATCHES catalog drift: a pattern added to a section joins its course', () => {
    const extra = { ...ALG, id: 'new-one', section: 'revelation' };
    const before = modulesForSection('revelation').length;
    const after = modulesForSection('revelation', [...GODHEAD_ALGORITHMS, extra]).length;
    expect(after).toBe(before + 1);
  });
});

describe('Word-first by construction (DR-0127)', () => {
  it('every derived session OPENS its big idea with the Scripture references', () => {
    for (const course of buildEternalProcessingCourses()) {
      for (const m of course.schedule) {
        expect(m.bigIdea.indexOf(m.anchor.ref)).toBe(0);
      }
    }
  });
  it('every derived course declares a Word-first lead the header renders', () => {
    for (const course of buildEternalProcessingCourses()) {
      const lead = wordFirstLead(course);
      expect(lead).toBeTruthy();
      expect(lead.ref.length).toBeGreaterThan(0);
    }
  });
  it('wordFirstLead falls back to the first session anchor, and reports null honestly', () => {
    const derived = wordFirstLead({ meta: {}, schedule: [{ anchor: { ref: 'John 3:16', theme: 't' } }] });
    expect(derived).toMatchObject({ ref: 'John 3:16' });
    expect(wordFirstLead({ meta: {}, schedule: [{}] })).toBeNull();
  });
});

describe('multi-neurological levels by depth selection (never an invented rephrase)', () => {
  it('each derived session carries standard/teen/senior composed from the catalog fields', () => {
    const m = moduleFromAlgorithm(ALG);
    expect(m.levels.standard).toContain('The practical walk.');
    expect(m.levels.teen).toContain('IF the condition is met');
    expect(m.levels.teen).toContain('The win.');
    expect(m.levels.teen).not.toContain('Why it works inside.');
    expect(m.levels.senior).toContain('Why it works inside.');
    expect(m.levels.senior).toContain('THEN the consequence follows');
  });
  it('the Scripture study level switch now truly branches: child ← essential, scholar ← deep (authored variants senior)', () => {
    for (const t of THEMES) {
      const child = resolveThemeLevel(t, 'child');
      const scholar = resolveThemeLevel(t, 'scholar');
      expect(child.text.length).toBeGreaterThan(0);
      expect(scholar.text.length).toBeGreaterThan(0);
      if (child.branched) expect(child.adaptedFrom).toBe('essential');
      if (scholar.branched) expect(scholar.adaptedFrom).toBe('deep');
      // The gap that triggered this (2026-07-08): scholar silently reading the
      // standard adult text. Where both derive, they now differ whenever the
      // theme's own tiers differ.
      if (child.branched && scholar.branched && t.depths && t.depths.essential !== t.depths.deep) {
        expect(child.text).not.toBe(scholar.text);
      }
    }
  });
});

// -----------------------------------------------------------------------------
// THE CHILD BAND (2026-08-14). Darrell, looking at Pattern 18 on his phone:
// "The lessons were supposed to add more or less depth based on time and
// competence of the age", after asking for a "young to old curriculum".
//
// Measured before building: these 42 generated patterns carried
// teen/standard/senior and ZERO child levels, while Living Lessons carried 77.
// A child landing on a pattern fell back to the teen text via depthChainForAge
// (child -> teen -> standard). Graceful, but not a child band.
//
// PROVEN-TO-CATCH (DR-0076 §3): removing the `child` key from the generator
// fails 'every generated pattern has a child band'; making child longer than
// teen fails the gradient case; rewording the catalog's sentence fails the
// no-rephrase case.
// -----------------------------------------------------------------------------
describe('the child band — young to old, on every generated pattern', () => {
  const ALG = {
    id: 'demo', name: 'Demo', refs: ['Romans 1:1'],
    condition: 'the condition is met', consequence: 'the consequence follows',
    outcome: 'The win.', threeD: 'The practical walk.', psyche: 'Why it works.',
  };

  it('every generated pattern has a child band', () => {
    const m = moduleFromAlgorithm(ALG);
    expect(m.levels.child, 'a child must not fall back to the teen text').toBeTruthy();
    expect(Object.keys(m.levels).sort()).toEqual(['child', 'senior', 'standard', 'teen']);
  });

  it('the ladder actually gets deeper — child is the shortest true read', () => {
    const m = moduleFromAlgorithm(ALG);
    expect(m.levels.child.length, 'child must be shorter than teen').toBeLessThan(m.levels.teen.length);
    expect(m.levels.teen.length, 'teen must be shorter than senior').toBeLessThan(m.levels.senior.length);
  });

  it('uses the catalog\'s OWN sentences — never a rephrase of doctrine', () => {
    // This file's binding rule: depth SELECTION, never an invented rephrase
    // (DR-0076). The child band may frame; it may not reword the conditional.
    const m = moduleFromAlgorithm(ALG);
    expect(m.levels.child).toContain('the condition is met');
    expect(m.levels.child).toContain('The win.');
  });

  it('degrades honestly when the catalog has no outcome', () => {
    const m = moduleFromAlgorithm({ ...ALG, outcome: null });
    expect(m.levels.child).toContain('the condition is met');
    expect(m.levels.child).not.toMatch(/null|undefined/);
  });
});
