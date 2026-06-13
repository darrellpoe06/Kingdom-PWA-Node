// Per-user project scope (Darrell, 2026-06-13): "show me my projects since I'm
// logged in ... each user has their own list ... the whole family's in the same
// place." These lock the real-attribution filter (created_by, surfaced as
// createdBy) and the safe default that never lands a user on an empty screen.
import { describe, it, expect } from 'vitest';
import { isMine, scopeProjects, defaultProjectScope } from '../components/Projects.jsx';

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

describe('scopeProjects', () => {
  it('"mine" returns only my projects', () => {
    expect(scopeProjects(projects, me, 'mine').map(p => p.id)).toEqual(['p1', 'p3']);
  });
  it('"all" returns the whole family list unchanged', () => {
    expect(scopeProjects(projects, me, 'all').map(p => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});

describe('defaultProjectScope', () => {
  it('defaults to "mine" when the signed-in user has their own projects', () => {
    expect(defaultProjectScope(projects, me)).toBe('mine');
  });
  it('falls back to "all" so a user is never stranded on an empty screen', () => {
    expect(defaultProjectScope(projects, 'user-nobody')).toBe('all'); // none attributed to them
    expect(defaultProjectScope(projects, null)).toBe('all');          // signed out
    expect(defaultProjectScope([{ id: 'x', createdBy: null }], me)).toBe('all'); // legacy-only
  });
});
