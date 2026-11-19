// =============================================================================
// The Grown-ups page always has notes to lead with (DR-1589).
// =============================================================================
// GrownUps.jsx says "This week with your child: <lesson>" then "How to lead it,
// from the lesson's own notes". The pick was the week index modulo the WHOLE
// catalog, so every lesson that landed moved it, and some weeks it fell on a
// lesson with no howToRun (measured 2026-11-19: ll173 on one branch, ll238 on
// main for 2026-11-16). The pick now rotates only over lessons that carry
// notes. These cases hold that for a year of weeks on the real catalog, and
// prove the check catches the old rule on a fixed list and a fixed date.
import { describe, it, expect } from 'vitest';
import { YOUTH_DOORS, weekIndex, weeklyPick, weeklyModule, weeklyLesson, leadLines, hasLeadNotes } from '../lib/youth-zone.js';
import { moduleFor } from '../components/kids/GrownUps.jsx';

const START = new Date('2026-11-16T15:00:00Z');
const WEEK = 7 * 86400000;
const weeks = (n) => Array.from({ length: n }, (_, i) => new Date(START.getTime() + i * WEEK));

const led = (id) => ({ id, title: id, facilitator: { howToRun: `Read ${id} aloud | Ask one question` } });
const bare = (id) => ({ id, title: id, facilitator: { talkingPoints: ['a point, but no how-to'] } });

// The rule this record replaced, kept here only to prove the guard catches it.
const oldPick = (modules, at) => weeklyPick(modules, at);

describe('the facilitator lines', () => {
  it('split on the lesson’s own " | " joins and know when there are none', () => {
    expect(leadLines(led('a')).how).toEqual(['Read a aloud', 'Ask one question']);
    expect(hasLeadNotes(led('a'))).toBe(true);
    expect(hasLeadNotes(bare('b'))).toBe(false);
    expect(hasLeadNotes({ id: 'c', facilitator: { howToRun: ' | ' } })).toBe(false);
    expect(hasLeadNotes(null)).toBe(false);
  });
});

describe('the weekly module', () => {
  // Five modules, index 0 bare: whichever residue START lands on, a list built
  // so the old rule lands on the bare one at START.
  const list = (() => {
    const n = 5;
    const hit = weekIndex(START) % n;
    return Array.from({ length: n }, (_, i) => (i === hit ? bare(`m${i}`) : led(`m${i}`)));
  })();

  it('proven to catch: the old rule hands a fixed date a lesson with no notes', () => {
    expect(hasLeadNotes(oldPick(list, START))).toBe(false);
  });
  it('the new rule picks a lesson with notes on that same date and list', () => {
    expect(hasLeadNotes(weeklyModule(list, START))).toBe(true);
  });
  it('keeps the deterministic rotation over the led lessons: same all week, every led lesson in turn', () => {
    const sat = new Date(START.getTime() + 5 * 86400000);
    expect(weeklyModule(list, sat)).toBe(weeklyModule(list, START));
    const seen = new Set(weeks(4).map((at) => weeklyModule(list, at).id));
    expect(seen.size).toBe(4);
  });
  it('falls back to the whole list only when no lesson carries notes, and to nothing on an empty list', () => {
    const none = [bare('x'), bare('y')];
    expect(none).toContain(weeklyModule(none, START));
    expect(weeklyModule([], START)).toBeNull();
    expect(weeklyModule(null, START)).toBeNull();
  });
});

describe('a year of weeks on the real catalog', () => {
  const doors = YOUTH_DOORS.map((d) => d.key);

  it('every door, every one of 52 weeks: the grown-ups pick carries "how to lead it" notes', () => {
    const misses = [];
    for (const at of weeks(52)) {
      for (const door of doors) {
        const mod = moduleFor(weeklyLesson(door, at));
        if (!mod || !hasLeadNotes(mod)) misses.push(`${door} ${at.toISOString().slice(0, 10)} ${mod ? mod.id : 'none'}`);
      }
    }
    expect(misses).toEqual([]);
  });
});
