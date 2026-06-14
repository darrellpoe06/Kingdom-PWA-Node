// Per-user project scope (Darrell, 2026-06-13): "show me my projects since I'm
// logged in ... each user has their own list ... the whole family's in the same
// place." These lock the real-attribution filter (created_by, surfaced as
// createdBy) and the safe default that never lands a user on an empty screen.
import { describe, it, expect } from 'vitest';
import { isMine, scopeProjects, defaultProjectScope, rankOf, orderProjects, defaultOrderMode, hasNextStep, isBlocked, swapById } from '../components/Projects.jsx';

const me = 'user-darrell';
const her = 'user-christina';
const projects = [
  { id: 'p1', createdBy: me },
  { id: 'p2', createdBy: her },
  { id: 'p3', createdBy: me },
  { id: 'p4', createdBy: null }, // legacy row, no attribution
];

describe('isMine', () => {
  it('matches only the signed-in user\'s own projects', () => {
    expect(isMine({ createdBy: me }, me)).toBe(true);
    expect(isMine({ createdBy: her }, me)).toBe(false);
  });
  it('is false when there is no signed-in user or no project', () => {
    expect(isMine({ createdBy: me }, null)).toBe(false);
    expect(isMine(null, me)).toBe(false);
    expect(isMine({ createdBy: null }, me)).toBe(false);
  });
});

describe('isMine — personal assignment', () => {
  it('matches a project assigned to my persona even if someone else created it', () => {
    expect(isMine({ createdBy: her, assigneePersonas: ['darrell'] }, me, 'darrell')).toBe(true);
    expect(isMine({ createdBy: her, assigneePersonas: ['christina'] }, me, 'darrell')).toBe(false);
  });
  it('still matches projects I created regardless of assignment', () => {
    expect(isMine({ createdBy: me, assigneePersonas: [] }, me, 'darrell')).toBe(true);
  });
  it('needs a persona to match an assignment', () => {
    expect(isMine({ createdBy: her, assigneePersonas: ['darrell'] }, me, null)).toBe(false);
  });
});

describe('scopeProjects', () => {
  it('"mine" returns projects I created OR am assigned to', () => {
    const list = [
      { id: 'p1', createdBy: me },
      { id: 'p2', createdBy: her },
      { id: 'p3', createdBy: her, assigneePersonas: ['darrell'] }, // assigned to me
    ];
    expect(scopeProjects(list, me, 'darrell', 'mine').map(p => p.id)).toEqual(['p1', 'p3']);
  });
  it('"all" returns the whole family list unchanged', () => {
    expect(scopeProjects(projects, me, null, 'all').map(p => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});

describe('defaultProjectScope', () => {
  it('defaults to "mine" when the signed-in user has their own projects', () => {
    expect(defaultProjectScope(projects, me, null)).toBe('mine');
  });
  it('defaults to "mine" when something is assigned to my persona', () => {
    expect(defaultProjectScope([{ id: 'x', createdBy: her, assigneePersonas: ['darrell'] }], me, 'darrell')).toBe('mine');
  });
  it('falls back to "all" so a user is never stranded on an empty screen', () => {
    expect(defaultProjectScope(projects, 'user-nobody', null)).toBe('all'); // none attributed to them
    expect(defaultProjectScope(projects, null, null)).toBe('all');          // signed out
    expect(defaultProjectScope([{ id: 'x', createdBy: null }], me, null)).toBe('all'); // legacy-only
  });
});

// --- manual reprioritization (priority_rank) ---------------------------------
describe('rankOf', () => {
  it('returns the rank when set, Infinity when unranked', () => {
    expect(rankOf({ priorityRank: 0 })).toBe(0);
    expect(rankOf({ priorityRank: 5 })).toBe(5);
    expect(rankOf({ priorityRank: null })).toBe(Infinity);
    expect(rankOf({})).toBe(Infinity);
    expect(rankOf(null)).toBe(Infinity);
  });
});

describe('orderProjects', () => {
  const list = [
    { id: 'a', startDate: '2026-07-01', priorityRank: 2 },
    { id: 'b', startDate: '2026-06-01', priorityRank: 0 },
    { id: 'c', startDate: '2026-06-15', priorityRank: null }, // unranked
    { id: 'd', startDate: '2026-05-01', priorityRank: 1 },
  ];
  it('priority mode: by hand-set rank, unranked sink to the bottom', () => {
    expect(orderProjects(list, 'priority').map(p => p.id)).toEqual(['b', 'd', 'a', 'c']);
  });
  it('timeline mode: by date regardless of rank', () => {
    expect(orderProjects(list, 'timeline').map(p => p.id)).toEqual(['d', 'b', 'c', 'a']);
  });
  it('does not mutate the input array', () => {
    const before = list.map(p => p.id);
    orderProjects(list, 'priority');
    expect(list.map(p => p.id)).toEqual(before);
  });
});

describe('defaultOrderMode', () => {
  it('starts in priority when any project carries a hand-set rank', () => {
    expect(defaultOrderMode([{ id: 'a', priorityRank: 3 }, { id: 'b', priorityRank: null }])).toBe('priority');
  });
  it('starts in timeline when nothing is ranked', () => {
    expect(defaultOrderMode([{ id: 'a', priorityRank: null }, { id: 'b' }])).toBe('timeline');
    expect(defaultOrderMode([])).toBe('timeline');
  });
});

// --- next step / blocker (build backlog #2, ANXIETY-CLARITY) ------------------
describe('hasNextStep', () => {
  it('is true only when a non-blank next step is set', () => {
    expect(hasNextStep({ nextStep: 'Call the contractor' })).toBe(true);
    expect(hasNextStep({ nextStep: '' })).toBe(false);
    expect(hasNextStep({ nextStep: '   ' })).toBe(false); // whitespace-only is empty
    expect(hasNextStep({})).toBe(false);
    expect(hasNextStep(null)).toBe(false);
  });
});

describe('isBlocked', () => {
  it('is true only when a non-blank blocker is set', () => {
    expect(isBlocked({ blocker: 'Waiting on the permit' })).toBe(true);
    expect(isBlocked({ blocker: '' })).toBe(false);
    expect(isBlocked({ blocker: '  ' })).toBe(false);
    expect(isBlocked({})).toBe(false);
    expect(isBlocked(null)).toBe(false);
  });
});

// --- reorder with filters on (build backlog #3) ------------------------------
describe('swapById', () => {
  it('swaps two items by id, leaving others (incl. filter-hidden rows) in place', () => {
    const list = [{ id: 'A' }, { id: 'H1' }, { id: 'B' }]; // H1 hidden between two visible
    expect(swapById(list, 'A', 'B').map(p => p.id)).toEqual(['B', 'H1', 'A']);
  });
  it('returns the original list unchanged when an id is missing', () => {
    const list = [{ id: 'A' }, { id: 'B' }];
    expect(swapById(list, 'A', 'Z')).toBe(list);
  });
  it('does not mutate the input', () => {
    const list = [{ id: 'A' }, { id: 'B' }];
    const before = list.map(p => p.id);
    swapById(list, 'A', 'B');
    expect(list.map(p => p.id)).toEqual(before);
  });
  it('tolerates an empty or undefined list', () => {
    expect(swapById(undefined, 'A', 'B')).toEqual(undefined);
    expect(swapById([], 'A', 'B')).toEqual([]);
  });
});
