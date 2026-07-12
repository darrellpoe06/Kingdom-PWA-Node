// Tests for the Bus/Van Ministry pure domain logic (Deacon Anderson, 2026-07-12).
// Locks the access gate, the row<->shape mappers, the Sunday/reminder date math,
// the coverage view, and the reminder plan — the rules the surface trusts. These
// ARE the verification gate for the module (DR-0076): a rule that isn't proven
// here doesn't ship.
import { describe, it, expect } from 'vitest';
import {
  deriveAccess,
  driverRoleLabel, scheduleStatusLabel, requestStatusLabel, reminderChannelLabel,
  STARTER_ROUTES, STARTER_VANS, DEFAULT_ARRIVE, DEFAULT_END, DEFAULT_REMIND_OFFSET_DAYS,
  addDays, dayOfWeek, nextSunday, upcomingSundays, remindSendOn,
  formatTime, serviceWindow,
  toDriverShape, toRouteShape, toVanShape, toScheduleShape, toReminderShape, toBusMessageShape, toRequestShape,
  coverageForDate, buildReminderPlan, dueReminders, overdueReminders, unconfirmedForDate, needsReminder,
} from '../lib/bus-ministry.js';

describe('deriveAccess (visibility/edit gate)', () => {
  it('owner/admin can see AND edit', () => {
    expect(deriveAccess('owner', false)).toEqual({ canEdit: true, canSee: true });
    expect(deriveAccess('admin', false)).toEqual({ canEdit: true, canSee: true });
  });
  it('a roster driver can see but not edit', () => {
    expect(deriveAccess('member', true)).toEqual({ canEdit: false, canSee: true });
    expect(deriveAccess(null, true)).toEqual({ canEdit: false, canSee: true });
  });
  it('a non-member can neither see nor edit', () => {
    expect(deriveAccess('member', false)).toEqual({ canEdit: false, canSee: false });
    expect(deriveAccess(null, false)).toEqual({ canEdit: false, canSee: false });
  });
});

describe('label maps', () => {
  it('resolve known keys and pass through unknown', () => {
    expect(driverRoleLabel('coordinator')).toBe('Coordinator');
    expect(driverRoleLabel('mystery')).toBe('mystery');
    expect(scheduleStatusLabel('confirmed')).toBe('Confirmed');
    expect(requestStatusLabel('shipped')).toBe('Shipped');
    expect(reminderChannelLabel('text')).toBe('Text');
  });
});

describe('starter templates reflect the deacon\'s real routes/vans', () => {
  it('has the four declared routes with the accessibility route flagged', () => {
    expect(STARTER_ROUTES).toHaveLength(4);
    expect(STARTER_ROUTES.map((r) => r.name)).toEqual([
      'Champaign — South of Springfield',
      'Champaign — North of Springfield',
      'Urbana',
      'Accessibility (Champaign–Urbana)',
    ]);
    expect(STARTER_ROUTES.find((r) => r.accessible)).toMatchObject({ name: 'Accessibility (Champaign–Urbana)' });
  });
  it('has vans including an accessibility van', () => {
    expect(STARTER_VANS.some((v) => v.accessible)).toBe(true);
    expect(STARTER_VANS.length).toBeGreaterThanOrEqual(2);
  });
  it('defaults encode the declared window (9:45 arrive, 1:30 end)', () => {
    expect(DEFAULT_ARRIVE).toBe('09:45');
    expect(DEFAULT_END).toBe('13:30');
    expect(DEFAULT_REMIND_OFFSET_DAYS).toBe(3);
  });
});

describe('date math (UTC-anchored, deterministic)', () => {
  it('addDays / dayOfWeek', () => {
    expect(addDays('2026-07-12', 3)).toBe('2026-07-15');
    expect(addDays('2026-07-12', -3)).toBe('2026-07-09');
    expect(dayOfWeek('2026-07-12')).toBe(0); // 2026-07-12 is a Sunday
    expect(dayOfWeek('2026-07-09')).toBe(4); // Thursday
  });
  it('nextSunday returns the same day when already Sunday, else the coming Sunday', () => {
    expect(nextSunday('2026-07-12')).toBe('2026-07-12'); // Sunday -> itself
    expect(nextSunday('2026-07-13')).toBe('2026-07-19'); // Monday -> next Sunday
    expect(nextSunday('2026-07-09')).toBe('2026-07-12'); // Thursday -> that Sunday
  });
  it('upcomingSundays yields consecutive Sundays', () => {
    expect(upcomingSundays('2026-07-13', 3)).toEqual(['2026-07-19', '2026-07-26', '2026-08-02']);
  });
  it('remindSendOn lands on the Thursday before a Sunday service', () => {
    expect(remindSendOn('2026-07-19')).toBe('2026-07-16'); // Sunday - 3 = Thursday
    expect(dayOfWeek(remindSendOn('2026-07-19'))).toBe(4); // Thursday
  });
});

describe('time formatting', () => {
  it('formats 24h HH:MM to 12h AM/PM', () => {
    expect(formatTime('09:45')).toBe('9:45 AM');
    expect(formatTime('13:30')).toBe('1:30 PM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('bad')).toBe('bad');
  });
  it('serviceWindow composes the arrive/end window', () => {
    expect(serviceWindow('09:45', '13:30')).toBe('9:45 AM – 1:30 PM');
    expect(serviceWindow(null, null)).toBe('9:45 AM – 1:30 PM');
  });
});

describe('row -> shape mappers', () => {
  it('maps a driver row incl. mine flag', () => {
    const s = toDriverShape({ id: 'd1', user_id: 'u1', display_name: 'Mother Davis', phone: '217-555-0100', email: 'md@x.org', driver_role: 'driver', active: true }, 'u1');
    expect(s).toMatchObject({ id: 'd1', displayName: 'Mother Davis', phone: '217-555-0100', role: 'driver', active: true, mine: true });
  });
  it('maps route/van/schedule/reminder/message/request rows', () => {
    expect(toRouteShape({ id: 'r1', name: 'Urbana', accessible: false, sort_order: 3 })).toMatchObject({ id: 'r1', name: 'Urbana', accessible: false, sortOrder: 3, active: true });
    expect(toVanShape({ id: 'v1', name: 'Van 1', capacity: 15 })).toMatchObject({ name: 'Van 1', capacity: 15, accessible: false });
    expect(toScheduleShape({ id: 's1', service_date: '2026-07-19', route_id: 'r1', driver_name: 'Joanne', driver_user_id: 'u9', status: 'confirmed' }, 'u9'))
      .toMatchObject({ serviceDate: '2026-07-19', routeId: 'r1', driverName: 'Joanne', status: 'confirmed', arriveTime: '09:45', endTime: '13:30', mine: true });
    expect(toReminderShape({ id: 'x1', service_date: '2026-07-19', driver_name: 'Joanne', send_on: '2026-07-16', status: 'pending' }))
      .toMatchObject({ serviceDate: '2026-07-19', driverName: 'Joanne', sendOn: '2026-07-16', status: 'pending', channel: 'app' });
    expect(toBusMessageShape({ id: 'm1', user_id: 'u1', display_name: 'Deacon', body: 'Be here 9:45' }, 'u1')).toMatchObject({ body: 'Be here 9:45', mine: true });
    expect(toRequestShape({ id: 'q1', title: 'Add text reminders', submitted_by: 'u1', submitter_name: 'Deacon', status: 'new', priority: 'high' }, 'u1')).toMatchObject({ title: 'Add text reminders', status: 'new', priority: 'high', mine: true });
  });
});

describe('coverageForDate — "is this Sunday covered?"', () => {
  const routes = [
    { id: 'r1', name: 'Champaign — South', sortOrder: 1, active: true, accessible: false },
    { id: 'r2', name: 'Champaign — North', sortOrder: 2, active: true, accessible: false },
    { id: 'r3', name: 'Urbana', sortOrder: 3, active: true, accessible: false },
    { id: 'r4', name: 'Accessibility', sortOrder: 4, active: true, accessible: true },
  ];
  it('flags open routes and tallies assigned/confirmed', () => {
    const schedule = [
      { id: 's1', serviceDate: '2026-07-19', routeId: 'r1', driverName: 'Joanne', status: 'confirmed' },
      { id: 's2', serviceDate: '2026-07-19', routeId: 'r2', driverName: 'McVeigh\'s daughter', status: 'scheduled' },
      // r3 + r4 unassigned
    ];
    const cov = coverageForDate(schedule, routes, '2026-07-19');
    expect(cov.totalRoutes).toBe(4);
    expect(cov.assignedCount).toBe(2);
    expect(cov.confirmedCount).toBe(1);
    expect(cov.openCount).toBe(2);
    expect(cov.fullyCovered).toBe(false);
    expect(cov.routes.find((c) => c.routeId === 'r3')).toMatchObject({ assigned: false, status: 'open' });
  });
  it('fullyCovered when every active route has a driver', () => {
    const schedule = routes.map((r, i) => ({ id: `s${i}`, serviceDate: '2026-07-19', routeId: r.id, driverName: `Driver ${i}`, status: 'confirmed' }));
    const cov = coverageForDate(schedule, routes, '2026-07-19');
    expect(cov.fullyCovered).toBe(true);
    expect(cov.openCount).toBe(0);
  });
  it('surfaces ad-hoc runs not tied to a known route', () => {
    const schedule = [{ id: 's9', serviceDate: '2026-07-19', routeId: null, routeName: 'Airport run', driverName: 'Deacon', status: 'scheduled' }];
    const cov = coverageForDate(schedule, routes, '2026-07-19');
    expect(cov.routes.some((c) => c.routeName === 'Airport run' && c.assigned)).toBe(true);
  });
  it('ignores other dates', () => {
    const schedule = [{ id: 's1', serviceDate: '2026-07-26', routeId: 'r1', driverName: 'Joanne', status: 'confirmed' }];
    expect(coverageForDate(schedule, routes, '2026-07-19').assignedCount).toBe(0);
  });
});

describe('buildReminderPlan — schedule out => reminders scheduled for Thursday', () => {
  it('makes one pending reminder per assigned driver, dated the Thursday before', () => {
    const schedule = [
      { id: 's1', serviceDate: '2026-07-19', routeName: 'Urbana', driverName: 'Joanne', driverUserId: 'u1', status: 'scheduled' },
      { id: 's2', serviceDate: '2026-07-19', routeName: 'South', driverName: 'Davis', status: 'confirmed' },
      { id: 's3', serviceDate: '2026-07-19', routeName: 'North', driverName: null, status: 'open' }, // no driver -> skip
      { id: 's4', serviceDate: '2026-07-19', routeName: 'Accessibility', driverName: 'Q', status: 'declined' }, // declined -> skip
    ];
    const plan = buildReminderPlan(schedule);
    expect(plan).toHaveLength(2);
    expect(plan.every((r) => r.sendOn === '2026-07-16' && r.status === 'pending' && r.channel === 'app')).toBe(true);
    expect(plan.map((r) => r.driverName).sort()).toEqual(['Davis', 'Joanne']);
  });
  it('honors a custom offset + channel', () => {
    const schedule = [{ id: 's1', serviceDate: '2026-07-19', driverName: 'Joanne', status: 'scheduled' }];
    const plan = buildReminderPlan(schedule, { offsetDays: 2, channel: 'text' });
    expect(plan[0]).toMatchObject({ sendOn: '2026-07-17', channel: 'text' });
  });
});

describe('due / overdue reminders — the "no one called them" fix', () => {
  const reminders = [
    { id: 'a', status: 'pending', sendOn: '2026-07-16', driverName: 'Joanne' },
    { id: 'b', status: 'pending', sendOn: '2026-07-18', driverName: 'Davis' },
    { id: 'c', status: 'sent', sendOn: '2026-07-16', driverName: 'Q' },
  ];
  it('dueReminders includes today-and-earlier pending', () => {
    expect(dueReminders(reminders, '2026-07-16').map((r) => r.id)).toEqual(['a']);
    expect(dueReminders(reminders, '2026-07-18').map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('overdueReminders is strictly-before and only pending', () => {
    expect(overdueReminders(reminders, '2026-07-17').map((r) => r.id)).toEqual(['a']);
    expect(overdueReminders(reminders, '2026-07-16')).toHaveLength(0);
  });
});

describe('unconfirmedForDate + needsReminder', () => {
  it('lists assigned-but-not-confirmed drivers, excluding open/declined', () => {
    const schedule = [
      { id: 's1', serviceDate: '2026-07-19', driverName: 'Joanne', status: 'scheduled' },
      { id: 's2', serviceDate: '2026-07-19', driverName: 'Davis', status: 'confirmed' },
      { id: 's3', serviceDate: '2026-07-19', driverName: null, status: 'open' },
      { id: 's4', serviceDate: '2026-07-19', driverName: 'Q', status: 'declined' },
    ];
    expect(unconfirmedForDate(schedule, '2026-07-19').map((s) => s.id)).toEqual(['s1']);
  });
  it('needsReminder predicate', () => {
    expect(needsReminder({ serviceDate: '2026-07-19', driverName: 'A', status: 'scheduled' })).toBe(true);
    expect(needsReminder({ serviceDate: '2026-07-19', driverName: null, status: 'open' })).toBe(false);
    expect(needsReminder({ serviceDate: '2026-07-19', driverName: 'A', status: 'declined' })).toBe(false);
  });
});
