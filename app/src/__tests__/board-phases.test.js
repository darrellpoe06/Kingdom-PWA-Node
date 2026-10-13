// The finish ripple + boards-on-the-timeline (DR-0120, proven-to-catch per
// DR-0076). Darrell 2026-07-07: "Why don't the boards show up on the timelines
// and why aren't we adding the context to the Timelines and updating the boards
// after we finish each faze or swim?" Pinned here:
//   * withPhaseCompletion writes the phase-complete context entry ONLY when the
//     last open item of a group goes done — never early, never twice for the
//     same write, never on a non-status patch.
//   * phaseCompletions derives the timeline context feed, newest first.
//   * boardPhases / boardTimelineLanes put every live board on the timeline as
//     an honest lane (real roll-up, real due date, no invented data).
import { describe, it, expect } from 'vitest';
import {
  boardPhases, withPhaseCompletion, phaseCompletions, boardTimelineLanes,
  taskHistory, SEED_BOARDS,
} from '../lib/board.js';

const T = (over = {}) => ({
  slug: over.slug || Math.random().toString(36),
  status: 'not-started', boardSlug: 'b', boardTitle: 'Board B', title: 'x',
  group: 'Phase 1', links: {}, ...over,
});

describe('withPhaseCompletion — the finish ripple', () => {
  it('appends a phase-complete entry when the LAST open item of a group goes done', () => {
    const a = T({ slug: 'a', status: 'done' });
    const b = T({ slug: 'b2' });
    const patch = withPhaseCompletion([a, b], b, { status: 'done' }, { at: '2026-07-07T12:00:00Z' });
    const hist = patch.links.history;
    expect(hist).toHaveLength(1);
    expect(hist[0].kind).toBe('phase-complete');
    expect(hist[0].phase).toBe('Phase 1');
    expect(hist[0].board).toBe('b');
    expect(hist[0].at).toBe('2026-07-07T12:00:00Z');
  });

  it('does NOT fire while other items in the group are still open', () => {
    const a = T({ slug: 'a' });
    const b = T({ slug: 'b2' });
    const patch = withPhaseCompletion([a, b], b, { status: 'done' });
    expect(patch).toEqual({ status: 'done' });
  });

  it('does NOT fire for a non-done patch or an already-done task', () => {
    const a = T({ slug: 'a', status: 'done' });
    expect(withPhaseCompletion([a], a, { status: 'done' })).toEqual({ status: 'done' });
    expect(withPhaseCompletion([a], a, { title: 'renamed' })).toEqual({ title: 'renamed' });
  });

  it('only counts peers in the SAME group on the SAME board', () => {
    const sameGroup = T({ slug: 'a', status: 'done' });
    const otherGroup = T({ slug: 'b2', group: 'Phase 2' });               // open, different group
    const otherBoard = T({ slug: 'c', boardSlug: 'other' });              // open, different board
    const closing = T({ slug: 'd' });
    const patch = withPhaseCompletion([sameGroup, otherGroup, otherBoard, closing], closing, { status: 'done' }, { at: 'now' });
    expect(patch.links.history).toHaveLength(1);
  });

  it('preserves a links patch already in flight (e.g. a handoff in the same write)', () => {
    const closing = T({ slug: 'a', links: { dr_ref: 'DR-0120' } });
    const inFlight = { status: 'done', links: { dr_ref: 'DR-0120', history: [{ kind: 'handoff', to: 'Ari' }] } };
    const patch = withPhaseCompletion([closing], closing, inFlight, { at: 'now' });
    expect(patch.links.dr_ref).toBe('DR-0120');
    expect(patch.links.history).toHaveLength(2);
    expect(patch.links.history[1].kind).toBe('phase-complete');
  });
});

describe('phaseCompletions — the derived timeline context feed', () => {
  it('collects phase-complete entries across boards, newest first, and skips handoffs', () => {
    const t1 = T({
      slug: 'a', status: 'done',
      links: { history: [
        { kind: 'handoff', at: '2026-07-06T00:00:00Z', to: 'Ari' },
        { kind: 'phase-complete', at: '2026-07-01T00:00:00Z', phase: 'Phase 1', board: 'b', boardTitle: 'Board B' },
      ] },
    });
    const t2 = T({
      slug: 'c', boardSlug: 'other', boardTitle: 'Other',
      links: { history: [{ kind: 'phase-complete', at: '2026-07-05T00:00:00Z', phase: 'Ingest' }] },
    });
    const feed = phaseCompletions([t1, t2]);
    expect(feed).toHaveLength(2);
    expect(feed[0].phase).toBe('Ingest');                 // newest first
    expect(feed[0].boardSlug).toBe('other');              // falls back to the row's board
    expect(feed[1].boardTitle).toBe('Board B');
  });

  it('is empty when nothing has been recorded — never invents context', () => {
    expect(phaseCompletions([T(), T({ group: 'G2' })])).toEqual([]);
  });
});

describe('boardPhases + boardTimelineLanes — boards ON the timeline', () => {
  it('rolls each group up as a phase with an honest complete flag', () => {
    const phases = boardPhases([
      T({ slug: 'a', status: 'done' }),
      T({ slug: 'b2', status: 'done' }),
      T({ slug: 'c', group: 'Phase 2' }),
    ], ['Phase 1', 'Phase 2']);
    expect(phases.map((p) => p.label)).toEqual(['Phase 1', 'Phase 2']);
    expect(phases[0].complete).toBe(true);
    expect(phases[1].complete).toBe(false);
    expect(phases[1].total).toBe(1);
  });

  it('builds one lane per live board with the current phase and the nearest real due date', () => {
    const rows = [
      T({ slug: 'a', status: 'done' }),
      T({ slug: 'b2', group: 'Phase 2', dueDate: '2026-08-01' }),
      T({ slug: 'c', group: 'Phase 2', dueDate: '2026-07-15' }),
      T({ slug: 'done-dated', status: 'done', dueDate: '2026-07-01' }), // done: not "next due"
    ];
    const lanes = boardTimelineLanes(rows);
    expect(lanes).toHaveLength(1);
    expect(lanes[0].title).toBe('Board B');
    expect(lanes[0].currentPhase).toBe('Phase 2');
    expect(lanes[0].nextDue).toBe('2026-07-15');
    expect(lanes[0].progress.total).toBe(4);
  });

  it('orders seed-program boards in SEED_BOARDS order, user boards after', () => {
    const seedSlug = SEED_BOARDS[1].slug;
    const lanes = boardTimelineLanes([
      T({ slug: 'u', boardSlug: 'board-user-zzz', boardTitle: 'User board' }),
      T({ slug: 's', boardSlug: seedSlug, boardTitle: SEED_BOARDS[1].title }),
    ]);
    expect(lanes[0].slug).toBe(seedSlug);
    expect(lanes[1].slug).toBe('board-user-zzz');
  });

  it('returns no lanes for no rows — the timeline says so instead of painting', () => {
    expect(boardTimelineLanes([])).toEqual([]);
  });
});

describe('history separation — phase entries never corrupt the handoff record', () => {
  it('taskHistory still returns all entries; consumers filter by kind', () => {
    const t = T({ links: { history: [{ kind: 'handoff', to: 'Ari' }, { kind: 'phase-complete', phase: 'P' }] } });
    expect(taskHistory(t)).toHaveLength(2);
  });
});
