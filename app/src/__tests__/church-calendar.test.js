// =============================================================================
// The church calendar as event records (DR-1585): the week strip, the month
// and year navigation, where a record comes from, and the read path's tenancy.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  isDateKey,
  addDays,
  weekStart,
  makeEvent,
  fromAnnounced,
  fromOfficeRows,
  encodeDetail,
  decodeDetail,
  mergeEvents,
  servicesOnDate,
  dayAgenda,
  weekDays,
  shiftMonth,
  shiftYear,
  monthGrid,
  eventsInMonth,
  whenLine,
  longDate,
} from '../lib/church-calendar.js';
import { readCalendarRows } from '../lib/church-calendar-sync.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const C = COLG_DEFAULT_CHURCH;
const THU = '2026-11-19';

describe('dates', () => {
  it('knows a real day from a written one', () => {
    expect(isDateKey('2026-11-19')).toBe(true);
    expect(isDateKey('2028-02-29')).toBe(true);
    for (const bad of ['2026-02-30', '2027-02-29', '2026-13-01', '11/19/2026', '', null, '2026-1-9']) expect(isDateKey(bad)).toBe(false);
  });
  it('the week starts on Sunday and crosses months and years', () => {
    expect(weekStart(THU)).toBe('2026-11-15');
    expect(weekStart('2026-11-15')).toBe('2026-11-15');
    expect(weekStart('2027-01-01')).toBe('2026-12-27');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('says a date in words', () => {
    expect(longDate(THU)).toBe('Thursday, November 19, 2026');
    expect(longDate('nope')).toBe('');
  });
});

describe('records', () => {
  it('an event needs a name and a real date; a bad end date leaves it one day', () => {
    expect(makeEvent({ name: 'Harvest Dinner', date: '2026-11-21' })).toMatchObject({ name: 'Harvest Dinner', date: '2026-11-21', endDate: null });
    expect(makeEvent({ name: '', date: '2026-11-21' })).toBeNull();
    expect(makeEvent({ name: 'X', date: '2026-02-30' })).toBeNull();
    expect(makeEvent({ name: 'X', date: '2026-11-21', endDate: '2026-11-20' }).endDate).toBeNull();
  });
  it('reads the church record’s own announced events, both of them, unchanged', () => {
    const got = fromAnnounced(C.announcedEvents);
    expect(got.map((e) => e.id)).toEqual(C.announcedEvents.map((e) => e.id));
    expect(got[0]).toMatchObject({ date: '2026-07-14', endDate: '2026-07-16', source: 'announced' });
  });
  it('an office row keeps its time, place and last day as words, and reads them back', () => {
    const detail = encodeDetail({ time: '6:00 PM', place: 'Fellowship hall', endDate: '2026-11-22', detail: 'Bring a dish.' });
    expect(detail).toBe('Time: 6:00 PM\nPlace: Fellowship hall\nThrough: 2026-11-22\nBring a dish.');
    expect(decodeDetail(detail)).toEqual({ time: '6:00 PM', place: 'Fellowship hall', endDate: '2026-11-22', detail: 'Bring a dish.' });
    expect(decodeDetail('Just a note')).toEqual({ time: '', place: '', endDate: '', detail: 'Just a note' });
  });
  it('only calendar rows become events; an undated calendar row is dropped and counted', () => {
    const rows = [
      { id: 'a', ministry: 'calendar', title: 'Harvest Dinner', week_of: '2026-11-21', detail: 'Time: 5:00 PM' },
      { id: 'b', ministry: 'bus', title: 'Fix the van', week_of: '2026-11-16' },
      { id: 'c', ministry: 'calendar', title: 'No date yet', week_of: null },
    ];
    const { events, dropped } = fromOfficeRows(rows);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: 'office-a', name: 'Harvest Dinner', time: '5:00 PM', source: 'office', rowId: 'a' });
    expect(dropped).toBe(1);
  });
  it('merges to one record per id in date order', () => {
    const a = makeEvent({ id: 'x', name: 'Later', date: '2026-12-01' });
    const b = makeEvent({ id: 'y', name: 'Sooner', date: '2026-11-01' });
    const a2 = makeEvent({ id: 'x', name: 'Later, corrected', date: '2026-12-02' });
    expect(mergeEvents([a, b], [a2]).map((e) => e.name)).toEqual(['Sooner', 'Later, corrected']);
  });
});

describe('the week strip', () => {
  const src = { events: fromAnnounced(C.announcedEvents), services: C.services };
  it('is Sunday to Saturday of the week holding today, with today marked', () => {
    const days = weekDays(src, THU);
    expect(days.map((d) => d.key)).toEqual(['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21']);
    expect(days.map((d) => d.short)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual([THU]);
  });
  it('counts only what the record holds: Sunday worship, two Wednesday studies, nothing else', () => {
    expect(weekDays(src, THU).map((d) => d.count)).toEqual([1, 0, 0, 2, 0, 0, 0]);
  });
  it('a tapped Wednesday shows both Bible studies in time order, from the record', () => {
    const got = dayAgenda(src, '2026-11-18');
    expect(got.map((e) => `${e.name} ${e.time}`)).toEqual(['Bible Study 1:00 PM', 'Bible Study 6:00 PM']);
    expect(got.every((e) => e.source === 'service')).toBe(true);
  });
  it('a multi-day event shows on every day it covers and not the day after', () => {
    for (const k of ['2026-07-14', '2026-07-15', '2026-07-16']) expect(dayAgenda(src, k).some((e) => e.id === 'evt-77th-assembly')).toBe(true);
    expect(dayAgenda(src, '2026-07-17').some((e) => e.id === 'evt-77th-assembly')).toBe(false);
  });
  it('PROVEN TO CATCH: a service is never placed on a day the record does not name', () => {
    // If servicesOnDate matched loosely (or ignored the weekday), Thursday would not be empty.
    expect(servicesOnDate(C.services, THU)).toEqual([]);
    expect(servicesOnDate([{ id: 's', day: 'Thursday', time: '7:00 PM', label: 'Choir rehearsal' }], THU)).toHaveLength(1);
    expect(weekDays({ events: [], services: [] }, THU).every((d) => d.count === 0)).toBe(true);
  });
  it('no date, no strip', () => {
    expect(weekDays(src, 'not-a-date')).toEqual([]);
    expect(dayAgenda(src, '')).toEqual([]);
  });
});

describe('month and year', () => {
  it('moves by month across a year end, and by year', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 11 }, -23)).toEqual({ year: 2024, month: 12 });
    expect(shiftYear({ year: 2026, month: 11 }, -1)).toEqual({ year: 2025, month: 11 });
  });
  it('lays November 2026 out Sunday first: five rows, the 1st on a Sunday, the 30th on a Monday', () => {
    const g = monthGrid({ year: 2026, month: 11 });
    expect(g).toHaveLength(5);
    expect(g[0][0]).toBe('2026-11-01');
    expect(g[4]).toEqual(['2026-11-29', '2026-11-30', null, null, null, null, null]);
    expect(g.flat().filter(Boolean)).toHaveLength(30);
  });
  it('a leap February has 29 days and a plain one 28', () => {
    expect(monthGrid({ year: 2028, month: 2 }).flat().filter(Boolean)).toHaveLength(29);
    expect(monthGrid({ year: 2027, month: 2 }).flat().filter(Boolean)).toHaveLength(28);
  });
  it('lists the events that touch a month, including one that began the month before', () => {
    const ev = [...fromAnnounced(C.announcedEvents), makeEvent({ id: 'span', name: 'Revival', date: '2026-07-30', endDate: '2026-08-02' })];
    expect(eventsInMonth(ev, { year: 2026, month: 7 }).map((e) => e.id)).toEqual(['evt-77th-assembly', 'span']);
    expect(eventsInMonth(ev, { year: 2026, month: 8 }).map((e) => e.id)).toEqual(['span', 'evt-gospel-fest']);
    expect(eventsInMonth(ev, { year: 2025, month: 7 })).toEqual([]);
  });
  it('writes a span in words', () => {
    expect(whenLine({ date: '2026-07-14', endDate: '2026-07-16' })).toBe('Jul 14 – 16');
    expect(whenLine({ date: '2026-07-30', endDate: '2026-08-02' })).toBe('Jul 30 – Aug 2');
    expect(whenLine({ date: '2026-08-29', endDate: null })).toBe('Aug 29');
  });
});

// ── the read path (tenancy, DR-0060) ─────────────────────────────────────────
function fakeClient({ session = { user: { id: 'u1' } }, data = [], error = null } = {}) {
  const calls = [];
  const q = {
    select: (s) => (calls.push(['select', s]), q),
    eq: (k, v) => (calls.push(['eq', k, v]), q),
    order: (k) => (calls.push(['order', k]), q),
    then: (ok) => Promise.resolve({ data, error }).then(ok),
  };
  return { calls, auth: { getSession: async () => ({ data: { session } }) }, from: (t) => (calls.push(['from', t]), q) };
}
const church = (value) => async () => ({ ok: true, value });

describe('reading the office rows', () => {
  it('names the reader’s own church and the calendar ministry in the query', async () => {
    const client = fakeClient({ data: [{ id: 'a', ministry: 'calendar', title: 'X', week_of: '2026-11-21' }] });
    const got = await readCalendarRows({ client, resolveChurch: church('church-1') });
    expect(got.status).toBe('ok');
    expect(got.rows).toHaveLength(1);
    expect(client.calls).toContainEqual(['from', 'ministry_ops']);
    expect(client.calls).toContainEqual(['eq', 'instance_id', 'church-1']);
    expect(client.calls).toContainEqual(['eq', 'ministry', 'calendar']);
  });
  it('signed out, it asks the database nothing', async () => {
    const client = fakeClient({ session: null });
    expect(await readCalendarRows({ client, resolveChurch: church('church-1') })).toEqual({ status: 'signed-out', rows: [] });
    expect(client.calls).toEqual([]);
  });
  it('with no church resolved it never queries without an instance', async () => {
    const client = fakeClient();
    expect((await readCalendarRows({ client, resolveChurch: church(null) })).status).toBe('no-church');
    expect(client.calls).toEqual([]);
  });
  it('a read that failed, stalled or threw is unavailable, never an empty calendar', async () => {
    expect((await readCalendarRows({ client: fakeClient({ error: { message: 'x' } }), resolveChurch: church('c') })).status).toBe('unavailable');
    expect((await readCalendarRows({ client: fakeClient(), resolveChurch: async () => ({ ok: false, reason: 'timeout' }) })).status).toBe('unavailable');
    expect((await readCalendarRows({ client: fakeClient(), resolveChurch: () => new Promise(() => {}), timeoutMs: 10 })).status).toBe('unavailable');
    expect(
      (
        await readCalendarRows({
          client: {
            auth: {
              getSession: async () => {
                throw new Error('down');
              },
            },
          },
        })
      ).status
    ).toBe('unavailable');
  });
});
