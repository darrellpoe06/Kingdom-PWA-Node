// DR-1675: a hand-picked lesson collection is never picked from memory. Every lesson the measurement
// flags is judged -- IN a section, or OUT with its reason -- and a new lesson cannot silently miss.
import { describe, it, expect } from 'vitest';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { RELATIONSHIP_GROUPS, RELATIONSHIP_LESSONS } from '../lib/learn-presentation/presentation.js';
import { relationshipDensity, RELATIONSHIP_FLAG, RELATIONSHIP_REVIEWED_OUT } from '../lib/learn-presentation/collection-review.js';

const LESSONS = learnInventory().flatMap((c) => c.lessons || []);
const IDS = new Set(LESSONS.map((l) => l.id));

describe('Relationships: every flagged lesson is judged, and the section is larger than a row', () => {
  it('every lesson at or above the flag is in a section or judged out with a reason', () => {
    const unjudged = LESSONS.filter((l) => relationshipDensity(l) >= RELATIONSHIP_FLAG)
      .map((l) => l.id)
      .filter((id) => !RELATIONSHIP_LESSONS.includes(id) && !RELATIONSHIP_REVIEWED_OUT[id]);
    expect(unjudged, 'read each and add it to a RELATIONSHIP_GROUPS section or to RELATIONSHIP_REVIEWED_OUT with a reason').toEqual([]);
  });

  it('no lesson is both in and out; every id is a real lesson; every reason is written', () => {
    for (const id of Object.keys(RELATIONSHIP_REVIEWED_OUT)) {
      expect(RELATIONSHIP_LESSONS).not.toContain(id);
      expect(IDS.has(id)).toBe(true);
      expect(RELATIONSHIP_REVIEWED_OUT[id].length).toBeGreaterThan(8);
    }
    for (const id of RELATIONSHIP_LESSONS) expect(IDS.has(id)).toBe(true);
    expect(new Set(RELATIONSHIP_LESSONS).size).toBe(RELATIONSHIP_LESSONS.length);
  });

  it('four sections, more than double the first 19', () => {
    expect(RELATIONSHIP_GROUPS.map((g) => g.label)).toEqual(['Marriage & Love', 'Family & Children', 'Friends, Neighbors & the Church', 'Hard Conversations, Offense & Forgiveness']);
    expect(RELATIONSHIP_LESSONS.length).toBeGreaterThan(38);
  });
});
