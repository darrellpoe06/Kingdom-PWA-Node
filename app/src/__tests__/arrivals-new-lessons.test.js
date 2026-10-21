// =============================================================================
// A lesson that lands in the catalog rings the bell (2026-10-21)
// =============================================================================
// Darrell: "The arrivals popup for latest lessons don't keep up with the
// lessons!!!!" Every arrival kind before this needed a row of the person's
// own (agent_inbox), and the newest lessons -- sov41-46, pm13, car1-6, built
// from his emailed requests -- never had one, so the bell never knew them.
// These read the REAL catalog (lesson-dates.json, re-derived from git by CI).
import { describe, it, expect } from 'vitest';
import { datedLessons } from '../lib/lesson-dates.js';
import {
  catalogArrivals, catalogSince, combineArrivals, arrivalLanding, unseenArrivals, markSeen,
  SCREEN_KINDS, ARRIVAL_KINDS, CATALOG_MAX, CATALOG_SINCE_PREFIX, EMPTY_SEEN,
} from '../lib/arrivals.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };

describe('new lessons in the catalog are arrivals', () => {
  it('PROVEN TO CATCH: an account with no lesson rows at all still sees the newest catalog lessons, newest first', () => {
    const lessons = datedLessons();
    const newest = lessons[0];
    const items = combineArrivals({ catalog: catalogArrivals(lessons, { since: '2026-10-19' }) });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].kind).toBe('lesson-new');
    expect(items[0].id).toBe(`lesson-new:${newest.courseKey}/${newest.lessonId}`);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('lesson-new:sovereign-ai/sov46-the-helper-that-must-see-everything');
    expect(ids).toContain('lesson-new:project-management/pm13-selected-designed-procured-built-and-steered');
    expect(items.every((i) => i.at.slice(0, 10) >= '2026-10-19')).toBe(true);
    // newest first, by day
    const days = items.map((i) => i.at);
    expect([...days].sort().reverse()).toEqual(days);
  });

  it('names the lesson in words, opens that lesson in Learn, and is a known kind seen by opening Learn', () => {
    const [a] = catalogArrivals([{ courseKey: 'sovereign-ai', lessonId: 'sov46-the-helper-that-must-see-everything', day: '2026-10-20' }]);
    expect(a.title).toBe('New lesson: The Helper That Must See Everything');
    expect(a.detail).toBe('Sovereign A.I.');
    expect(arrivalLanding({ pathname: '/poetech-app/', search: '', item: a })).toBe('/poetech-app/?view=church&sub=learn&course=sovereign-ai&lesson=sov46-the-helper-that-must-see-everything');
    expect(ARRIVAL_KINDS).toContain('lesson-new');
    expect(SCREEN_KINDS.learn).toEqual(['lesson-new']);
    const seen = markSeen(EMPTY_SEEN, [a], SCREEN_KINDS.learn);
    expect(unseenArrivals([a], seen)).toEqual([]);
  });

  it('a first look lists the last week, set once per account; never every lesson ever written', () => {
    const s = mem();
    const today = new Date('2026-10-21T02:00:00Z');
    expect(catalogSince(s, 'u1', today)).toBe('2026-10-14');
    expect(s.m.get(`${CATALOG_SINCE_PREFIX}u1`)).toBe('2026-10-14');
    expect(catalogSince(s, 'u1', new Date('2026-12-01T00:00:00Z'))).toBe('2026-10-14');   // it does not move
    const all = catalogArrivals(datedLessons(), { since: '' });
    expect(all.length).toBe(CATALOG_MAX);
    expect(catalogSince(null, 'u1', today)).toBe('2026-10-14');
  });
});
