// @vitest-environment node
// =============================================================================
// Today's Focus and My Goals — real records, and the two ways they refuse to lie
// =============================================================================
// Darrell 2026-09-17 relayed three home-view mockups from his wife Christina.
// A reality-trace found that every tile in them maps onto an existing feature
// EXCEPT two: "Today's Focus" and "MY GOALS" had no record anywhere — no
// todaysFocus, no dailyFocus, no focusItems, no goals. Shipped as drawn they
// would have been invented checkboxes on the family's front screen, which is
// the painted-number defect on the surface where it costs the most trust. He
// approved building them real.
//
// This gate holds the two properties that make them honest, and both are easy
// to lose later by someone being helpful:
//
//   1. A FOCUS ITEM BELONGS TO A DAY. Without that, "Today's Focus" means
//      "whatever is still in the list", so yesterday's intentions silently
//      become today's and the card lies by omission every single morning.
//      Unfinished items are OFFERED, never auto-carried — the person decides
//      whether it is still their business.
//
//   2. A GOAL CARRIES NO TYPED PERCENTAGE. A number a person types about their
//      own progress is exactly as invented as the checklist this replaces, so
//      progress counts only real linked work and returns NULL when nothing
//      links. Showing nothing is honest; showing 60% is not.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  today, newFocusItem, addFocusItem, toggleFocusItem, removeFocusItem,
  focusForDay, focusProgress, unfinishedBefore,
  newGoal, addGoal, updateGoal, daysUntil, goalProgress, GOAL_STATUSES,
  DAILY_FOCUS_KEYS, EMPTY_FOCUS_WORLD,
} from '../lib/daily-focus.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

describe('the collections live in the MODULE, and really persist', () => {
  it('the shell was NOT grown for them — the freeze held', () => {
    // The first version declared dailyFocus and goals in EMPTY_WORLD with a
    // comment, and monolith-budget-guard refused it: the shell is frozen to
    // bug-fixes only and new capability belongs in a module. The guard was
    // right, so the shape moved here. This asserts the shell stayed out of it,
    // because the easy regression is to "just add two lines" next time.
    const host = readFileSync(join(REPO, 'app', 'src', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(host, 'the shell must not declare these collections').not.toMatch(/^\s*dailyFocus: \[\],$/m);
    expect(host, 'the shell must not declare these collections').not.toMatch(/^\s*goals: \[\],$/m);
    expect(DAILY_FOCUS_KEYS).toEqual(['dailyFocus', 'goals']);
    expect(EMPTY_FOCUS_WORLD).toEqual({ dailyFocus: [], goals: [] });
  });

  it('every reader tolerates an ABSENT collection, which is what makes that possible', () => {
    // No declaration means the keys genuinely do not exist until a first write.
    // If any reader stopped guarding, the front screen would throw on a new
    // account - the worst possible place for it.
    expect(focusForDay(undefined)).toEqual([]);
    expect(focusProgress(undefined)).toEqual({ done: 0, total: 0 });
    expect(unfinishedBefore(undefined)).toEqual([]);
    expect(toggleFocusItem(undefined, 'x')).toEqual([]);
    expect(removeFocusItem(undefined, 'x')).toEqual([]);
    expect(updateGoal(undefined, 'x', {})).toEqual([]);
    expect(addFocusItem(undefined, 'first ever')).toHaveLength(1);
    expect(addGoal(undefined, { title: 'first ever' })).toHaveLength(1);
  });

  it('and snapshot-sync PERSISTS them rather than stripping them — read, not assumed', () => {
    // The claim is that a new key on `data` is carried by the snapshot because
    // sync deletes an exclusion list and writes the rest. If that ever inverts
    // to a whitelist, these two collections would vanish silently - precisely
    // the lease-sync injury (thirteen doors, zero rows, nothing said a word).
    const sync = readFileSync(join(REPO, 'app', 'src', 'lib', 'snapshot-sync.js'), 'utf8');
    expect(sync, 'sync must work by DELETING an exclusion list').toMatch(/delete cleaned\[k\]/);
    expect(sync, 'dailyFocus must not be on any exclusion list').not.toMatch(/'dailyFocus'/);
    expect(sync, 'goals must not be on any exclusion list').not.toMatch(/'goals'/);
  });
});

describe('a focus item belongs to a DAY — the rule that stops the card lying', () => {
  it('a new item is stamped with the day it was made', () => {
    const now = new Date('2026-09-17T09:30:00Z');
    const item = newFocusItem('Move my body', now);
    expect(item.day).toBe(today(now));
    expect(item.label).toBe('Move my body');
    expect(item.done).toBe(false);
  });

  it("YESTERDAY'S ITEMS ARE NOT TODAY'S — the whole point", () => {
    const yesterday = new Date('2026-09-16T09:00:00Z');
    const now = new Date('2026-09-17T09:00:00Z');
    let list = addFocusItem([], 'Take care of business', yesterday);
    list = addFocusItem(list, 'Be present with my family', now);

    const mine = focusForDay(list, today(now));
    expect(mine.length, "yesterday's intention leaked into today").toBe(1);
    expect(mine[0].label).toBe('Be present with my family');
  });

  it("and yesterday's unfinished work is OFFERED, never silently carried", () => {
    const yesterday = new Date('2026-09-16T09:00:00Z');
    const now = new Date('2026-09-17T09:00:00Z');
    let list = addFocusItem([], 'Unfinished thing', yesterday);
    list = addFocusItem(list, 'Finished thing', yesterday);
    list = toggleFocusItem(list, list[1].id, yesterday);

    const offered = unfinishedBefore(list, today(now));
    expect(offered.map((f) => f.label)).toEqual(['Unfinished thing']);
    // Offered, not moved: today's list is still empty until the person acts.
    expect(focusForDay(list, today(now))).toEqual([]);
  });

  it('an empty submit never mints a row', () => {
    // A blank intention on the front screen reads as a broken feature.
    expect(newFocusItem('')).toBeNull();
    expect(newFocusItem('   ')).toBeNull();
    expect(newFocusItem(null)).toBeNull();
    expect(addFocusItem([], '  ')).toEqual([]);
  });

  it('toggling records WHEN it was done, and untoggling clears it', () => {
    const now = new Date('2026-09-17T09:00:00Z');
    let list = addFocusItem([], 'Celebrate progress', now);
    list = toggleFocusItem(list, list[0].id, new Date('2026-09-17T20:00:00Z'));
    expect(list[0].done).toBe(true);
    expect(list[0].doneAt).toBe('2026-09-17T20:00:00.000Z');
    list = toggleFocusItem(list, list[0].id, now);
    expect(list[0].done).toBe(false);
    expect(list[0].doneAt, 'a cleared item must not keep a completion time').toBeNull();
  });

  it('progress is MEASURED from the rows of that day, never a stored tally', () => {
    // A count kept beside the rows is a second source of truth and drifts from
    // them the first time a row is removed — so removal is part of this test.
    const now = new Date('2026-09-17T09:00:00Z');
    let list = addFocusItem([], 'One', now);
    list = addFocusItem(list, 'Two', now);
    list = addFocusItem(list, 'Three', now);
    list = toggleFocusItem(list, list[0].id, now);
    expect(focusProgress(list, today(now))).toEqual({ done: 1, total: 3 });

    list = removeFocusItem(list, list[2].id);
    expect(focusProgress(list, today(now)), 'the tally drifted from the rows').toEqual({ done: 1, total: 2 });
  });

  it('a day with nothing in it reports zero of zero, not an error', () => {
    expect(focusProgress([], '2026-09-17')).toEqual({ done: 0, total: 0 });
    expect(focusForDay(null, '2026-09-17')).toEqual([]);
    expect(unfinishedBefore(undefined)).toEqual([]);
  });
});

describe('a goal carries NO painted progress', () => {
  it('a goal with nothing linked to it reports NULL, so the surface shows nothing', () => {
    const goal = newGoal({ title: 'Finish the Airbnb' });
    expect(goalProgress(goal, [])).toBeNull();
    expect(goalProgress(goal, null)).toBeNull();
  });

  it('progress counts ONLY real linked work', () => {
    const now = new Date('2026-09-17T09:00:00Z');
    const goal = newGoal({ title: 'Finish the Airbnb' }, now);
    let list = addFocusItem([], 'Paint the trim', now);
    list = addFocusItem(list, 'Unrelated errand', now);
    // Only the first names the goal.
    list = list.map((f, i) => (i === 0 ? { ...f, goalId: goal.id } : f));
    expect(goalProgress(goal, list)).toEqual({ done: 0, total: 1, pct: 0 });
    list = toggleFocusItem(list, list[0].id, now);
    expect(goalProgress(goal, list)).toEqual({ done: 1, total: 1, pct: 100 });
  });

  it('the shape carries no percent field at all — there is nothing to type into', () => {
    // If a `progress` or `pct` field ever appears on the record itself, someone
    // can set it by hand and the surface will believe them. The absence IS the
    // protection, so it is asserted.
    const goal = newGoal({ title: 'A goal', why: 'A reason', targetDate: '2026-12-01' });
    expect(Object.keys(goal).sort()).toEqual(['createdAt', 'id', 'status', 'targetDate', 'title', 'why']);
    expect(goal).not.toHaveProperty('progress');
    expect(goal).not.toHaveProperty('pct');
    expect(goal).not.toHaveProperty('percentComplete');
  });

  it('a goal with no target date gets NULL days, never an invented deadline', () => {
    expect(daysUntil(newGoal({ title: 'No date' }))).toBeNull();
    expect(daysUntil(newGoal({ title: 'Bad date', targetDate: 'whenever' }))).toBeNull();
    expect(daysUntil(null)).toBeNull();
  });

  it('and with a date, the days are real and counted from today', () => {
    const now = new Date('2026-09-17T09:00:00Z');
    expect(daysUntil(newGoal({ title: 'g', targetDate: '2026-09-27' }, now), now)).toBe(10);
    expect(daysUntil(newGoal({ title: 'g', targetDate: '2026-09-17' }, now), now)).toBe(0);
    expect(daysUntil(newGoal({ title: 'g', targetDate: '2026-09-10' }, now), now), 'a passed target reads negative, not hidden').toBe(-7);
  });

  it('an empty goal is never minted, and updates are patches on a real row', () => {
    expect(newGoal({ title: '  ' })).toBeNull();
    expect(addGoal([], {})).toEqual([]);
    const list = addGoal([], { title: 'Real goal' });
    const updated = updateGoal(list, list[0].id, { status: 'reached' });
    expect(updated[0].status).toBe('reached');
    expect(updated[0].title, 'a patch must not lose the rest of the row').toBe('Real goal');
    expect(GOAL_STATUSES).toContain('reached');
  });
});

describe('ids are unique even inside one millisecond', () => {
  it('a batch add never mints twins', () => {
    // The same defect addProject records: a synchronous batch minting one id
    // collides React keys AND makes delete-by-id hit every twin at once.
    const now = new Date('2026-09-17T09:00:00Z');
    let list = [];
    for (let i = 0; i < 40; i += 1) list = addFocusItem(list, `Item ${i}`, now);
    expect(new Set(list.map((f) => f.id)).size).toBe(40);
    let goals = [];
    for (let i = 0; i < 40; i += 1) goals = addGoal(goals, { title: `Goal ${i}` }, now);
    expect(new Set(goals.map((g) => g.id)).size).toBe(40);
  });
});
