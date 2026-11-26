// The Life Situations Guide is hand-read data: every lesson id must exist, none repeats, and a flagged entry says so.
import { describe, it, expect } from 'vitest';
import INDEX from '../lib/learn-discover-index.json';
import { SITUATIONS } from '../lib/learn-discover-situations.js';
import { prepareIndex, discoverSearch, situationsFor } from '../lib/learn-discover-search.js';

const P = prepareIndex(INDEX);
describe('the Life Situations Guide', () => {
  it('has at least 40 situations, unique ids, and phrasings', () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
    for (const s of SITUATIONS) expect(s.say.length, s.id).toBeGreaterThan(0);
  });
  it('points only at real lessons, once each, and flags thin or empty entries honestly', () => {
    for (const s of SITUATIONS) {
      expect(new Set(s.lessons).size, s.id).toBe(s.lessons.length);
      for (const id of s.lessons) expect(P.byId.has(id), `${s.id}: ${id}`).toBe(true);
      if (s.flag === 'gap') expect(s.lessons.length, s.id).toBe(0);
      else expect(s.lessons.length, s.id).toBeGreaterThanOrEqual(3);
      if (s.flag === 'thin' || s.flag === 'gap') expect(s.note, s.id).toBeTruthy();
    }
  });
  it('matches how people actually type, and never lets a stray word hijack a question', () => {
    expect(situationsFor("my kids won't listen to me")[0].id).toBe('kids-listen');
    expect(situationsFor('I feel so lonely lately')[0].id).toBe('lonely');
    expect(situationsFor('How does the Holy Spirit work')[0].id).toBe('spirit');
    expect(situationsFor('Matthew 6')).toEqual([]);
  });
  it('leads with the hand-read lessons in order, and returns nothing (not filler) for a gap', () => {
    const s = SITUATIONS.find((x) => x.id === 'kids-listen');
    expect(discoverSearch(P, "my kids won't listen to me")[0].lessonId).toBe(s.lessons[0]);
    expect(discoverSearch(P, 'caring for my aging parents')).toEqual([]);
  });
});
