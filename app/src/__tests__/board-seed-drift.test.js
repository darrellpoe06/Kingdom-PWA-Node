// =============================================================================
// Seed drift — a live board that fell BEHIND its own build record (2026-07-07:
// Darrell's live Moore board read "1/13 done" while the seed spec carried
// 14/16 verifiably SHIPPED; three newer spec items had no live rows at all).
// Pins the two pure detectors that drive the one-tap board heals.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { missingSeedTasks, staleSeedStatuses, seedTasksForBoard } from '../lib/board.js';

const MOORE = 'board-moore-divahs';

describe('missingSeedTasks', () => {
  it('names exactly the spec items whose slug has no live row', () => {
    const all = seedTasksForBoard(MOORE);
    const live = all.slice(0, all.length - 3).map((r) => ({ ...r }));
    const missing = missingSeedTasks(MOORE, live);
    expect(missing.map((r) => r.slug)).toEqual(all.slice(-3).map((r) => r.slug));
    expect(missingSeedTasks(MOORE, all)).toEqual([]);
    expect(missingSeedTasks('board-does-not-exist', [])).toEqual([]);
  });
});

describe('staleSeedStatuses', () => {
  it('flags a live seed row still not-started while the spec marks it done (the screenshot case)', () => {
    const all = seedTasksForBoard(MOORE);
    const doneInSpec = all.filter((r) => r.status === 'done');
    expect(doneInSpec.length).toBeGreaterThanOrEqual(10); // the Moore build record really is mostly shipped
    const live = all.map((r) => ({ ...r, status: 'not-started' }));
    const stale = staleSeedStatuses(MOORE, live);
    expect(stale.map((t) => t.slug).sort()).toEqual(doneInSpec.map((r) => r.slug).sort());
  });

  it('never flags a human-moved row (in-progress/blocked/done) or a non-seed row — upgrade-only, edits outrank the heal', () => {
    const all = seedTasksForBoard(MOORE);
    const live = all.map((r) => ({ ...r, status: 'in-progress' }));
    live.push({ slug: 'bt-user-own-item', status: 'not-started', title: 'hand-added row' });
    expect(staleSeedStatuses(MOORE, live)).toEqual([]);
  });

  it('never proposes a downgrade: spec not-started items are ignored regardless of live status', () => {
    const all = seedTasksForBoard(MOORE);
    const specNotStarted = all.filter((r) => r.status === 'not-started');
    expect(specNotStarted.length).toBeGreaterThan(0); // md-dns / md-handles stay honestly open
    const live = all.map((r) => ({ ...r })); // live matches spec exactly
    expect(staleSeedStatuses(MOORE, live)).toEqual([]);
  });
});
