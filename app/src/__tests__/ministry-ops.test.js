// Tests for the Ministry Ops pure logic (Darrell 2026-07-13). Locks the access
// gate, the week-of math, the row->shape mapper, the week/ministry groupings,
// the status tally, and — critically — that the member digest NEVER leaks a
// non-member-visible item (the paid-content boundary). The verification gate.
import { describe, it, expect } from 'vitest';
import {
  OPS_STATUS, opsStatusLabel, OPS_MINISTRIES, opsMinistryLabel, canManageOps,
  addDays, weekOf, toOpsShape, groupByWeek, groupByMinistry, opsProgress,
  memberDigest, memberVisibleCount,
} from '../lib/ministry-ops.js';

describe('access + labels', () => {
  it('only owner/admin manage ops', () => {
    expect(canManageOps('owner')).toBe(true);
    expect(canManageOps('admin')).toBe(true);
    expect(canManageOps('member')).toBe(false);
    expect(canManageOps(null)).toBe(false);
  });
  it('label maps resolve known + pass unknown', () => {
    expect(opsStatusLabel('in-progress')).toBe('In progress');
    expect(opsMinistryLabel('bus')).toBe('Bus / Van');
    expect(opsMinistryLabel('mystery')).toBe('mystery');
    expect(OPS_STATUS.length).toBeGreaterThanOrEqual(4);
    expect(OPS_MINISTRIES.some(([k]) => k === 'general')).toBe(true);
  });
});

describe('weekOf (Monday on/before)', () => {
  it('maps any day to its Monday', () => {
    expect(weekOf('2026-07-13')).toBe('2026-07-13'); // Monday -> itself
    expect(weekOf('2026-07-15')).toBe('2026-07-13'); // Wednesday -> Monday
    expect(weekOf('2026-07-12')).toBe('2026-07-06'); // Sunday -> previous Monday
    expect(weekOf('2026-07-19')).toBe('2026-07-13'); // next Sunday -> that Monday
  });
  it('addDays helper', () => {
    expect(addDays('2026-07-13', -7)).toBe('2026-07-06');
  });
});

describe('toOpsShape', () => {
  it('maps a row incl. memberVisible + mine', () => {
    const s = toOpsShape({ id: 'o1', ministry: 'bus', title: 'Confirm Sunday drivers', status: 'in-progress', week_of: '2026-07-13', owner_user_id: 'u1', member_visible: true }, 'u1');
    expect(s).toMatchObject({ ministry: 'bus', title: 'Confirm Sunday drivers', status: 'in-progress', weekOf: '2026-07-13', memberVisible: true, mine: true });
  });
  it('defaults', () => {
    expect(toOpsShape({ id: 'o2', title: 'x' })).toMatchObject({ ministry: 'general', status: 'todo', memberVisible: false, mine: false });
  });
});

describe('groupByWeek + groupByMinistry + opsProgress', () => {
  const items = [
    toOpsShape({ id: 'a', ministry: 'bus', title: 'B', status: 'done', week_of: '2026-07-13' }),
    toOpsShape({ id: 'b', ministry: 'choir', title: 'A', status: 'todo', week_of: '2026-07-13' }),
    toOpsShape({ id: 'c', ministry: 'bus', title: 'C', status: 'blocked', week_of: '2026-07-06' }),
    toOpsShape({ id: 'd', ministry: 'media', title: 'D', status: 'in-progress', week_of: null }),
  ];
  it('groups by week newest-first, undated last', () => {
    const weeks = groupByWeek(items);
    expect(weeks.map((w) => w.week)).toEqual(['2026-07-13', '2026-07-06', 'undated']);
    // within a week, sorted by ministry then title (bus 'B' before choir 'A')
    expect(weeks[0].items.map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('groups by ministry', () => {
    expect(groupByMinistry(items).map((g) => g.ministry)).toEqual(['bus', 'choir', 'media']);
  });
  it('tallies status', () => {
    expect(opsProgress(items)).toMatchObject({ total: 4, done: 1, todo: 1, blocked: 1, 'in-progress': 1 });
  });
});

describe('memberDigest — the paid-content boundary (never leaks private ops)', () => {
  const items = [
    toOpsShape({ id: 'pub1', ministry: 'bus', title: 'New accessibility route added', status: 'done', member_visible: true, created_at: '2026-07-13T10:00:00Z' }),
    toOpsShape({ id: 'pub2', ministry: 'bus', title: 'Driver reminders now automated', status: 'in-progress', member_visible: true, created_at: '2026-07-13T12:00:00Z' }),
    toOpsShape({ id: 'priv', ministry: 'bus', title: 'Internal: staffing gap', status: 'blocked', member_visible: false }),
    toOpsShape({ id: 'pub3', ministry: 'choir', title: 'Fall program set', status: 'done', member_visible: true, created_at: '2026-07-10T09:00:00Z' }),
  ];
  it('returns ONLY member-visible items', () => {
    const digest = memberDigest(items);
    const ids = digest.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).toContain('pub1');
    expect(ids).toContain('pub3');
    expect(ids).not.toContain('priv'); // private ops item never surfaces
    expect(memberVisibleCount(items)).toBe(3);
  });
  it('groups by ministry, newest first within a ministry, with labels + done count', () => {
    const digest = memberDigest(items);
    const bus = digest.find((g) => g.ministry === 'bus');
    expect(bus.ministryLabel).toBe('Bus / Van');
    expect(bus.items.map((i) => i.id)).toEqual(['pub2', 'pub1']); // newer created_at first
    expect(bus.done).toBe(1);
  });
  it('empty when nothing is published', () => {
    expect(memberDigest([toOpsShape({ id: 'x', title: 'y', member_visible: false })])).toEqual([]);
  });
});
