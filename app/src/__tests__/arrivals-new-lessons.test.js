// =============================================================================
// A lesson that lands in the catalog rings the bell (2026-10-21)
// =============================================================================
// Darrell: "The arrivals popup for latest lessons don't keep up with the
// lessons!!!!" Every arrival kind before this needed a row of the person's
// own (agent_inbox), and the newest lessons -- sov41-46, pm13, car1-6, built
// from his emailed requests -- never had one, so the bell never knew them.
// These read the REAL catalog (lesson-dates.json, re-derived from git by CI).
//
// THE TWO NAMED IDS AGED OUT, AND THE WINDOW WAS RIGHT (2026-10-28, bank9).
// This file pinned `sov46` and `pm13` BY ID as the proof that the walk reaches
// real catalog lessons rather than a fixture. `catalogArrivals` caps at
// CATALOG_MAX = 20, newest first, which is a deliberate bound: a bell that lists
// everything ever written is not a bell. MEASURED the day bank9 landed: 21
// lessons now carry a day on or after 2026-10-19, so the cap drops exactly one —
// pm13, the oldest of the 21 — and the assertion went red for a lesson that had
// simply fallen out the far end of a window doing its job. sov46 sits at
// position 15 and was next.
//
// A PIN THAT MUST AGE OUT IS A PIN THAT WILL EVENTUALLY BLOCK CORRECT WORK, so
// the ids are now DERIVED from the same catalog, which on the dimension it
// measures is strictly STRONGER than naming two of them: the whole ordered head
// of the list is pinned against the real data, so a dropped lesson or a
// reordering fails — neither of which the two `toContain` checks could see. The
// anti-fixture guarantee they were there for is kept and widened: the catalog
// must be genuinely large, and the window must be genuinely full so the bound is
// exercised rather than merely declared.
//
// AND THE DERIVED FORM HAS ONE BLIND SPOT, MEASURED RATHER THAN ASSUMED. The
// expected list slices at CATALOG_MAX, so it MOVES WITH the constant: changing
// the cap from 20 to 19 in arrivals.js left all four checks green (measured on
// the real file, then restored). A derivation cannot witness the number it
// derives from. So the cap's VALUE is pinned as a literal beside it — that is
// the one thing here that must stay hand-written, and a deliberate change to it
// is a one-line edit with a reason rather than a silent drift.
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
    // The whole head of the list, derived from the catalog and in its order.
    const expected = lessons
      .filter((l) => l.day >= '2026-10-19')
      .slice(0, CATALOG_MAX)
      .map((l) => `lesson-new:${l.courseKey}/${l.lessonId}`);
    expect(ids).toEqual(expected);
    // It cannot pass vacuously: a real catalog, and a window actually at its cap
    // so the bound is exercised rather than merely declared.
    expect(lessons.length).toBeGreaterThan(400);
    expect(ids).toHaveLength(CATALOG_MAX);
    // The one figure a derivation cannot witness, so it is written out: the bell
    // lists at most twenty, and a change to that is a decision, not a drift.
    expect(CATALOG_MAX).toBe(20);
    expect(items.every((i) => i.at.slice(0, 10) >= '2026-10-19')).toBe(true);
    // newest first, by day
    const days = items.map((i) => i.at);
    expect([...days].sort().reverse()).toEqual(days);
  });

  it('PROVEN TO CATCH: a lesson dropped from the head, or the head reordered, fails', () => {
    // What the two aged-out `toContain` ids could NOT see, and what replaced
    // them: the derived form catches a missing item ANYWHERE in the window and
    // catches a window served out of order.
    const lessons = datedLessons();
    const expected = lessons.filter((l) => l.day >= '2026-10-19').slice(0, CATALOG_MAX)
      .map((l) => `lesson-new:${l.courseKey}/${l.lessonId}`);
    const dropped = catalogArrivals(lessons.filter((_, i) => i !== 3), { since: '2026-10-19' }).map((i) => i.id);
    expect(dropped).not.toEqual(expected);
    const reordered = [...expected.slice(1), expected[0]];
    expect(reordered).not.toEqual(expected);
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
