// build-story (DR-0121 item 5) — the Build tab's ship story derives from live
// sources, never a hand-kept constant. These fixtures prove each derivation
// CATCHES: dated-ledger filtering, board classification (building/next/complete),
// seed-spec fallback, real-due-date past-due, and governance-queue gating.
import { describe, it, expect } from 'vitest';
import {
  shippedFromLedger, inFlightStory, effectiveBoards, pastDueTasks, gatedFromQueue,
} from '../lib/build-story.js';
import { SEED_BOARDS } from '../lib/board.js';

const task = (over = {}) => ({
  id: 'bt-x-1', slug: 'bt-x-1', boardSlug: 'board-test', boardTitle: 'Test board',
  title: 'An item', status: 'not-started', owner: null, group: 'Phase 1',
  startDate: null, dueDate: null, sortRank: 0, notes: null, links: {},
  ...over,
});

describe('shippedFromLedger', () => {
  it('maps dated records to shipped items, newest-first, and drops undated rows', () => {
    const out = shippedFromLedger({
      ok: true,
      items: [
        { id: 'DR-0010', title: 'Older', date: '2026-06-01', decision: 'because' },
        { id: 'DR-0011', title: 'Newer', date: '2026-07-01', decision: 'because' },
        { id: 'DR-0012', title: 'No date', date: '', decision: 'x' },
      ],
    });
    expect(out.map((r) => r.id)).toEqual(['DR-0011', 'DR-0010']);
    expect(out[0]).toMatchObject({ status: 'shipped', when: '2026-07-01', title: 'Newer' });
  });
  it('degrades honestly on a missing/failed ledger', () => {
    expect(shippedFromLedger(null)).toEqual([]);
    expect(shippedFromLedger({ ok: false })).toEqual([]);
  });
});

describe('inFlightStory / effectiveBoards', () => {
  it('classifies a board with work in progress as building', () => {
    const rows = [
      task({ slug: 'a', status: 'in-progress' }),
      task({ slug: 'b', status: 'not-started' }),
    ];
    const s = inFlightStory(rows);
    expect(s.building.map((b) => b.id)).toContain('board-test');
    expect(s.next.map((b) => b.id)).not.toContain('board-test');
  });
  it('classifies an untouched board as next and a finished board as complete', () => {
    const untouched = [task({ slug: 'a', boardSlug: 'board-n', boardTitle: 'N' })];
    expect(inFlightStory(untouched).next.map((b) => b.id)).toContain('board-n');
    const done = [task({ slug: 'a', boardSlug: 'board-d', boardTitle: 'D', status: 'done' })];
    expect(inFlightStory(done).complete.map((b) => b.id)).toContain('board-d');
  });
  it('carries real phase state and only real due dates', () => {
    const rows = [
      task({ slug: 'a', status: 'done', group: 'Phase 1' }),
      task({ slug: 'b', status: 'in-progress', group: 'Phase 2', dueDate: '2027-01-15' }),
    ];
    const b = inFlightStory(rows).building.find((x) => x.id === 'board-test');
    expect(b.currentPhase).toBe('Phase 2');
    expect(b.when).toBe('2027-01-15');
    expect(b.progress).toMatchObject({ done: 1, total: 2 });
  });
  it('falls back to the maintained seed spec (labeled) when a seed board has no live rows', () => {
    const boards = effectiveBoards([]);
    const seedSlugs = SEED_BOARDS.map((s) => s.slug);
    for (const slug of seedSlugs) {
      const b = boards.find((x) => x.slug === slug);
      expect(b).toBeTruthy();
      expect(b.live).toBe(false);
      expect(b.rows.length).toBeGreaterThan(0);
    }
  });
  it('uses live rows (not the spec) once a board has any', () => {
    const slug = SEED_BOARDS[0].slug;
    const rows = [task({ slug: 'only', boardSlug: slug, boardTitle: 'Live' })];
    const b = effectiveBoards(rows).find((x) => x.slug === slug);
    expect(b.live).toBe(true);
    expect(b.rows.length).toBe(1);
  });
});

describe('pastDueTasks', () => {
  const NOW = Date.parse('2026-07-07T12:00:00Z');
  it('catches an open item past its real due date, most-late first', () => {
    const rows = [
      task({ slug: 'late2', title: 'Two days late', dueDate: '2026-07-05', status: 'in-progress' }),
      task({ slug: 'late6', title: 'Six days late', dueDate: '2026-07-01', status: 'not-started' }),
    ];
    const out = pastDueTasks(rows, { now: NOW });
    expect(out.map((r) => r.id)).toEqual(['late6', 'late2']);
    expect(out[0].daysLate).toBeGreaterThan(out[1].daysLate);
  });
  it('never counts done items or undated/prose targets', () => {
    const rows = [
      task({ slug: 'done', dueDate: '2026-01-01', status: 'done' }),
      task({ slug: 'undated', dueDate: null, status: 'in-progress' }),
      task({ slug: 'prose', dueDate: 'after the review', status: 'in-progress' }),
    ];
    // Restrict to this board's rows: seed fallbacks may carry their own real
    // due dates, which is exactly the honest behavior — filter to the fixture.
    const out = pastDueTasks(rows, { now: NOW }).filter((r) => ['done', 'undated', 'prose'].includes(r.id));
    expect(out).toEqual([]);
  });
});

describe('gatedFromQueue', () => {
  it('maps open governance items to gated entries with the why', () => {
    const out = gatedFromQueue({
      ok: true,
      openCount: 1,
      items: [{ id: 'OPEN-12', title: 'A decision', unblocks: 'the thing', recommendation: 'do it', tier: 'C' }],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'OPEN-12', status: 'gated' });
    expect(out[0].what).toContain('Unblocks: the thing');
    expect(out[0].when).toContain('Tier C');
  });
  it('degrades honestly on an empty/missing queue', () => {
    expect(gatedFromQueue(null)).toEqual([]);
    expect(gatedFromQueue({ ok: false, items: [] })).toEqual([]);
  });
});
