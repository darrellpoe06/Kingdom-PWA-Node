// @vitest-environment node
// =============================================================================
// lesson-timeline-context — every lesson knows where it sits in time, and the
// coverage cannot rot back
// =============================================================================
// The defect this module fixed was ROT, not absence: the timeline knew lessons
// only through hand-written `lessons: [...]` arrays that stopped being kept as
// the series grew, leaving 45 of 74 lessons with no chronological context at
// all. So the headline gate here is a COVERAGE FLOOR — if a future lesson lands
// with no resolvable epoch, the build says so instead of silently shipping a
// blank. That is the machine check for the class (DR-0076 §2).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  epochForRef, timelineContextFor, timelineLabelFor, timelineContextText,
} from '../lib/lesson-timeline-context.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { TIMELINE_EPOCHS } from '../lib/biblical-timeline.js';

describe('epochForRef — a reference is placed by where its EVENTS sit', () => {
  it('splits Genesis across the epochs it actually spans', () => {
    expect(epochForRef('Genesis 1:1')).toBe('creation');
    expect(epochForRef('Genesis 2:7')).toBe('creation');
    expect(epochForRef('Genesis 3:15')).toBe('the-fall');
    expect(epochForRef('Genesis 6:5')).toBe('genesis-6');
    expect(epochForRef('Genesis 11:4')).toBe('babel');
    expect(epochForRef('Genesis 12:2')).toBe('israel');
    expect(epochForRef('Genesis 50:20')).toBe('israel');
  });

  it('splits Revelation between the return and the consummation', () => {
    expect(epochForRef('Revelation 12:11')).toBe('the-return');
    expect(epochForRef('Revelation 21:3')).toBe('eternity');
    expect(epochForRef('Revelation 22:13')).toBe('eternity');
  });

  it('places the Gospels in Christ and the epistles in the church age', () => {
    expect(epochForRef('Matthew 27:46')).toBe('christ');
    expect(epochForRef('John 1:1')).toBe('christ');
    expect(epochForRef('Acts 17:23')).toBe('church-age');
    expect(epochForRef('1 Corinthians 6:11')).toBe('church-age');
    expect(epochForRef('Hebrews 9:22')).toBe('church-age');
  });

  it('places the Old Testament record in Israel', () => {
    expect(epochForRef('Exodus 12:40')).toBe('israel');
    expect(epochForRef('Psalm 27:10')).toBe('israel');
    expect(epochForRef('Isaiah 61:3')).toBe('israel');
    expect(epochForRef('Malachi 3:16')).toBe('israel');
  });

  it('returns null rather than guessing on junk', () => {
    expect(epochForRef('')).toBeNull();
    expect(epochForRef('Nowhere 1:1')).toBeNull();
    expect(epochForRef('not a reference')).toBeNull();
  });

  it('every epoch it can name is a real epoch (no dead ids)', () => {
    const ids = new Set(TIMELINE_EPOCHS.map((e) => e.id));
    const probes = ['Genesis 1:1', 'Genesis 3:1', 'Genesis 7:1', 'Genesis 11:1', 'Genesis 20:1',
      'Exodus 1:1', 'Matthew 1:1', 'Acts 1:1', 'Revelation 1:1', 'Revelation 21:1'];
    for (const p of probes) expect(ids.has(epochForRef(p)), `${p} -> ${epochForRef(p)}`).toBe(true);
  });
});

describe('the coverage floor — this is the rot gate', () => {
  it('EVERY Living Lesson resolves to at least one epoch', () => {
    const orphans = LIVING_LESSONS_MODULES
      .filter((m) => timelineContextFor(m).length === 0)
      .map((m) => m.id);
    expect(orphans, `lessons with no timeline context: ${orphans.join(', ')}`).toEqual([]);
  });

  it('the whole series is covered, not merely the curated few', () => {
    const covered = LIVING_LESSONS_MODULES.filter((m) => timelineContextFor(m).length > 0);
    expect(covered.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(covered.length).toBeGreaterThan(70);
  });
});

describe('curated placements outrank derived ones', () => {
  const curatedPairs = TIMELINE_EPOCHS.flatMap((e) => (e.lessons || []).map((id) => [id, e.id]));

  it('a hand-placed lesson keeps its epoch and is labeled curated', () => {
    expect(curatedPairs.length).toBeGreaterThan(0);
    for (const [lessonId, epochId] of curatedPairs) {
      const mod = LIVING_LESSONS_MODULES.find((m) => m.id === lessonId);
      if (!mod) continue; // dead refs are the timeline test's business, not this one
      const ctx = timelineContextFor(mod, { limit: 99 });
      const hit = ctx.find((c) => c.id === epochId);
      expect(hit, `${lessonId} must keep its curated epoch ${epochId}`).toBeTruthy();
      expect(hit.source).toBe('curated');
    }
  });

  it('curated entries sort ahead of derived ones', () => {
    for (const [lessonId] of curatedPairs) {
      const mod = LIVING_LESSONS_MODULES.find((m) => m.id === lessonId);
      if (!mod) continue;
      const ctx = timelineContextFor(mod, { limit: 99 });
      const lastCurated = ctx.map((c) => c.source).lastIndexOf('curated');
      const firstDerived = ctx.map((c) => c.source).indexOf('derived');
      if (lastCurated !== -1 && firstDerived !== -1) expect(lastCurated).toBeLessThan(firstDerived);
    }
  });
});

describe('the context carries DATA, not just a label', () => {
  it('an epoch with stated years hands them to the lesson', () => {
    const l73 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll73-the-house-of-el-and-the-only-saviour');
    const ctx = timelineContextFor(l73, { limit: 99 });
    const withYears = ctx.filter((c) => c.years.length > 0);
    expect(withYears.length).toBeGreaterThan(0);
    for (const y of withYears[0].years) {
      expect(y.figure).toBeTruthy();
      expect(y.ref).toBeTruthy();
    }
  });

  it('weight reflects how much of the lesson actually sits in that epoch', () => {
    const l73 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll73-the-house-of-el-and-the-only-saviour');
    const ctx = timelineContextFor(l73, { limit: 99 });
    expect(ctx.some((c) => c.weight > 0)).toBe(true);
  });

  it('the label and the export text render for a real lesson', () => {
    const l74 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll74-church-hurt-the-counterfeit-comfort-and-the-blood');
    expect(timelineLabelFor(l74)).toBeTruthy();
    expect(timelineContextText(l74)).toContain('WHERE THIS SITS IN TIME');
  });

  it('an empty module yields an honest empty, never an invented placement', () => {
    expect(timelineContextFor(null)).toEqual([]);
    expect(timelineContextFor({ id: 'x', title: 'x' })).toEqual([]);
    expect(timelineLabelFor({ id: 'x', title: 'x' })).toBe('');
    expect(timelineContextText({ id: 'x', title: 'x' })).toBe('');
  });
});
