// Proven-to-catch tests for the multi-worker work-order model. Each test
// asserts a behavior that, if the helper regressed, would silently corrupt the
// dispatch trail (lost workers, legacy rows not read, payout "$0" vs blank).
import { describe, it, expect } from 'vitest';
import {
  getAssignments,
  makeAssignment,
  addAssignment,
  markDone,
  reopen,
  removeAssignment,
  setPayout,
  allDone,
  dispatchState,
  summarize,
  totalPayout,
} from '../lib/assignments.js';

const worker = (id, name, extra = {}) => ({ id, name, phone: '217-555-0100', role: 'plumber', ...extra });

describe('getAssignments — reads new, legacy, and empty shapes', () => {
  it('returns [] when no dispatch', () => {
    expect(getAssignments({})).toEqual([]);
    expect(getAssignments({ dispatch: null })).toEqual([]);
  });

  it('reads the new { assignments: [...] } shape', () => {
    const inc = { dispatch: { assignments: [{ id: 'a1', name: 'Mike' }] } };
    expect(getAssignments(inc)).toHaveLength(1);
    expect(getAssignments(inc)[0].name).toBe('Mike');
  });

  it('upgrades a legacy single-worker dispatch into one assignment', () => {
    const inc = { dispatch: { contractorId: 'k1', contractorName: 'Isaiah Ramos', contractorPhone: '217-555-0142', dispatchedAt: '2026-06-20T10:00:00Z' } };
    const list = getAssignments(inc);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Isaiah Ramos');
    expect(list[0].phone).toBe('217-555-0142');
    expect(list[0].type).toBe('contractor');
    expect(list[0].status).toBe('assigned');
  });
});

describe('addAssignment — crew building with de-dupe', () => {
  it('adds multiple distinct workers', () => {
    let inc = {};
    let list = addAssignment(inc, worker('k1', 'Mike'));
    inc = { dispatch: dispatchState(list) };
    list = addAssignment(inc, worker('k2', 'Dwayne', { type: 'vendor' }));
    expect(list).toHaveLength(2);
    expect(list.map(a => a.name)).toEqual(['Mike', 'Dwayne']);
    expect(list[1].type).toBe('vendor');
  });

  it('does not add the same active contractor twice', () => {
    const list = addAssignment({}, worker('k1', 'Mike'));
    const again = addAssignment({ dispatch: dispatchState(list) }, worker('k1', 'Mike'));
    expect(again).toHaveLength(1);
  });

  it('allows re-assigning a worker who was already marked done', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = markDone(list, list[0].id);
    const re = addAssignment({ dispatch: dispatchState(list) }, worker('k1', 'Mike'));
    expect(re).toHaveLength(2);
  });

  it('carries the per-assignment type override', () => {
    const list = addAssignment({}, worker('k1', 'Acme Supply'), { type: 'vendor' });
    expect(list[0].type).toBe('vendor');
  });
});

describe('per-worker status: done / reopen / remove', () => {
  it('marks one worker done without touching the others', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    list = markDone(list, list[0].id);
    expect(list[0].status).toBe('done');
    expect(list[0].doneAt).toBeTruthy();
    expect(list[1].status).toBe('assigned');
  });

  it('reopen clears done + doneAt', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = markDone(list, list[0].id);
    list = reopen(list, list[0].id);
    expect(list[0].status).toBe('assigned');
    expect(list[0].doneAt).toBeNull();
  });

  it('removes one worker by id', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    list = removeAssignment(list, list[0].id);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Dwayne');
  });
});

describe('allDone — the work order done-rule', () => {
  it('false for an empty crew', () => {
    expect(allDone([])).toBe(false);
  });
  it('false until every worker is done', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    list = markDone(list, list[0].id);
    expect(allDone(list)).toBe(false);
    list = markDone(list, list[1].id);
    expect(allDone(list)).toBe(true);
  });
});

describe('setPayout — 1099 finance hook (blank vs $0)', () => {
  it('stores hours + amount per worker', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = setPayout(list, list[0].id, { hours: '8', amount: '450' });
    expect(list[0].payout).toEqual({ hours: 8, amount: 450 });
  });

  it('keeps blank distinct from zero', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = setPayout(list, list[0].id, { hours: '', amount: '0' });
    expect(list[0].payout.hours).toBeNull();
    expect(list[0].payout.amount).toBe(0);
  });

  it('totalPayout rolls up the crew', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    list = setPayout(list, list[0].id, { amount: '450' });
    list = setPayout(list, list[1].id, { amount: '120' });
    expect(totalPayout(list)).toBe(570);
  });
});

describe('dispatchState + summarize — storage and display', () => {
  it('dispatchState is null for an empty list, { assignments } otherwise', () => {
    expect(dispatchState([])).toBeNull();
    const list = addAssignment({}, worker('k1', 'Mike'));
    expect(dispatchState(list)).toEqual({ assignments: list });
  });

  it('summarize: single name, crew count + done tally', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    expect(summarize(list)).toBe('Mike');
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    list = markDone(list, list[0].id);
    expect(summarize(list)).toBe('2 workers · 1/2 done');
  });

  it('round-trips through dispatchState back into getAssignments', () => {
    let list = addAssignment({}, worker('k1', 'Mike'));
    list = addAssignment({ dispatch: dispatchState(list) }, worker('k2', 'Dwayne'));
    const inc = { dispatch: dispatchState(list) };
    expect(getAssignments(inc)).toHaveLength(2);
  });
});

describe('makeAssignment — shape', () => {
  it('mints a unique id and the payout hook', () => {
    const a = makeAssignment(worker('k1', 'Mike'), { at: '2026-06-23T00:00:00Z' });
    expect(a.id.startsWith('asg-')).toBe(true);
    expect(a.dispatchedAt).toBe('2026-06-23T00:00:00Z');
    expect(a.payout).toEqual({ hours: null, amount: null });
    expect(a.status).toBe('assigned');
  });
});
