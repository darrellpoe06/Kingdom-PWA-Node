// board — the Project Boards roll-up + grouping logic (DR-0076 proven-to-catch).
// The progress bar and board-selector pills are only as trustworthy as this
// tally, so it is pinned: the rollup counts REAL statuses, an empty board reports
// null (never a fake bar), and re-seeding is idempotent.
import { describe, it, expect } from 'vitest';
import {
  boardProgress, groupTasks, sortTasks, nextStatus, boardsFromTasks,
  seedTasksForBoard, mergedBoardList, SEED_BOARDS, seedTaskSlug,
  BOARD_STATUS_ORDER,
} from '../lib/board.js';

const T = (over = {}) => ({ slug: over.slug || Math.random().toString(36), status: 'not-started', boardSlug: 'b', boardTitle: 'B', title: 'x', ...over });

describe('boardProgress — honest roll-up', () => {
  it('counts done/total and rounds the percent', () => {
    const p = boardProgress([T({ status: 'done' }), T({ status: 'done' }), T({ status: 'in-progress' }), T({ status: 'not-started' })]);
    expect(p.total).toBe(4);
    expect(p.done).toBe(2);
    expect(p.inProgress).toBe(1);
    expect(p.pct).toBe(50);
  });

  it('reports null pct for an empty board — never a fake bar', () => {
    const p = boardProgress([]);
    expect(p.total).toBe(0);
    expect(p.pct).toBeNull();
  });

  it('counts blocked and treats an unknown status as not-started', () => {
    const p = boardProgress([T({ status: 'blocked' }), T({ status: 'garbage' })]);
    expect(p.blocked).toBe(1);
    expect(p.notStarted).toBe(1);
  });

  // proven-to-catch: a miscount must change the answer.
  it('a status change moves the percent (the gate would catch a stuck tally)', () => {
    const before = boardProgress([T({ status: 'not-started' }), T({ status: 'not-started' })]);
    const after = boardProgress([T({ status: 'done' }), T({ status: 'not-started' })]);
    expect(before.pct).toBe(0);
    expect(after.pct).toBe(50);
  });
});

describe('nextStatus — one-tap cycle', () => {
  it('cycles not-started → in-progress → blocked → done → not-started', () => {
    let s = 'not-started';
    const seen = [s];
    for (let i = 0; i < 4; i++) { s = nextStatus(s); seen.push(s); }
    expect(seen).toEqual(['not-started', 'in-progress', 'blocked', 'done', 'not-started']);
  });
  it('every status is in the order', () => {
    for (const s of BOARD_STATUS_ORDER) expect(BOARD_STATUS_ORDER).toContain(nextStatus(s));
  });
});

describe('groupTasks — columns/sections', () => {
  it('splits by group and honors declared group order', () => {
    const tasks = [T({ group: 'B', title: 'b1' }), T({ group: 'A', title: 'a1' }), T({ group: 'A', title: 'a2' })];
    const groups = groupTasks(tasks, ['A', 'B']);
    expect(groups.map((g) => g.label)).toEqual(['A', 'B']);
    expect(groups[0].tasks.length).toBe(2);
  });
  it('defaults a null group to General', () => {
    const groups = groupTasks([T({ group: null })]);
    expect(groups[0].label).toBe('General');
  });
});

describe('sortTasks — live work first, done sinks', () => {
  it('orders blocked/in-progress/not-started ahead of done', () => {
    const out = sortTasks([T({ status: 'done', title: 'd' }), T({ status: 'blocked', title: 'b' }), T({ status: 'not-started', title: 'n' })]);
    expect(out[0].status).toBe('blocked');
    expect(out[out.length - 1].status).toBe('done');
  });
  it('respects a hand-set sortRank', () => {
    const out = sortTasks([T({ sortRank: 2, title: 'second' }), T({ sortRank: 1, title: 'first' })]);
    expect(out[0].title).toBe('first');
  });
});

describe('boardsFromTasks — derive live boards', () => {
  it('groups distinct boardSlug with a real roll-up', () => {
    const boards = boardsFromTasks([
      T({ boardSlug: 'x', boardTitle: 'X', status: 'done' }),
      T({ boardSlug: 'x', boardTitle: 'X', status: 'not-started' }),
      T({ boardSlug: 'y', boardTitle: 'Y', status: 'done' }),
    ]);
    const x = boards.find((b) => b.slug === 'x');
    expect(x.progress.total).toBe(2);
    expect(x.progress.pct).toBe(50);
  });
});

describe('seed boards — real, idempotent', () => {
  it('every seed board expands to rows with stable slugs', () => {
    for (const spec of SEED_BOARDS) {
      const rows = seedTasksForBoard(spec.slug);
      expect(rows.length).toBe((spec.items || []).length);
      // stable slug per (board, key) — re-seeding is a no-op against the unique index
      for (let i = 0; i < spec.items.length; i++) {
        expect(rows[i].slug).toBe(seedTaskSlug(spec.slug, spec.items[i].key));
      }
      // no painted-invalid statuses
      for (const r of rows) expect(BOARD_STATUS_ORDER).toContain(r.status);
    }
  });

  it('an unknown board seeds to nothing', () => {
    expect(seedTasksForBoard('nope')).toEqual([]);
  });

  it('mergedBoardList shows every seed board even before it is seeded', () => {
    const list = mergedBoardList([]);
    for (const spec of SEED_BOARDS) {
      const b = list.find((x) => x.slug === spec.slug);
      expect(b, `${spec.slug} present`).toBeTruthy();
      expect(b.seeded).toBe(false);
      expect(b.progress.total).toBe(0);
    }
  });

  it('mergedBoardList reflects loaded items and appends user boards', () => {
    const seeded = seedTasksForBoard('board-financial-loops').map((r) => ({ ...r, id: r.slug }));
    const userTask = T({ boardSlug: 'board-user-1', boardTitle: 'My board', status: 'done' });
    const list = mergedBoardList([...seeded, userTask]);
    const fin = list.find((b) => b.slug === 'board-financial-loops');
    expect(fin.seeded).toBe(true);
    expect(fin.progress.total).toBe(seeded.length);
    const user = list.find((b) => b.slug === 'board-user-1');
    expect(user).toBeTruthy();
    expect(user.progress.pct).toBe(100);
  });
});
