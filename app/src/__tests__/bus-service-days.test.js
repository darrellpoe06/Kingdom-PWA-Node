// @vitest-environment node
//
// The bus runs on SUNDAY *AND* WEDNESDAY.
//
// Darrell, 2026-09-11, with the COLG leadership looking at this surface:
// "You say which Sunday? We need to say Sunday and Wednesday." And after a
// leader tapped in: "it just showed me the Sunday sign... Sunday and Wednesday."
//
// The days are NOT hardcoded here — they are read off the church's own service
// record (the reality-trace: name the real data). These tests pin that, pin the
// back-compat every pre-existing Sunday row depends on, and prove the gate
// catches the Sunday-only regression it exists to prevent (DR-0076 §3).
import { describe, it, expect } from 'vitest';
import {
  serviceSlots, upcomingServices, nextDayOfWeek, serviceRunLabel, rowMatchesRun,
  coverageForDate, ARRIVE_LEAD_MINUTES, dowIndex,
} from '../lib/bus-ministry.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

describe("serviceSlots — the church's own record names the days", () => {
  const slots = serviceSlots(COLG_DEFAULT_CHURCH);

  it('carries BOTH Sunday and Wednesday, not Sunday alone', () => {
    const days = new Set(slots.map((s) => s.dayLabel));
    expect(days.has('Sunday')).toBe(true);
    expect(days.has('Wednesday')).toBe(true);
  });

  it("reads COLG's three real services in order", () => {
    expect(slots.map((s) => `${s.dayLabel} ${s.time}`))
      .toEqual(['Sunday 11:00 AM', 'Wednesday 1:00 PM', 'Wednesday 6:00 PM']);
  });

  it('derives the arrive time from the service start, not from a made-up number', () => {
    // Deacon Anderson's declared pair is arrive 9:45 for an 11:00 AM service.
    // The derivation has to reproduce it exactly, or the lead is wrong.
    const sunday = slots.find((s) => s.dow === 0);
    expect(sunday.arriveDefault).toBe('09:45');
    expect(ARRIVE_LEAD_MINUTES).toBe(75);
    expect(slots.find((s) => s.time === '6:00 PM').arriveDefault).toBe('16:45');
  });

  it('follows ANOTHER congregation to their own days', () => {
    const slots2 = serviceSlots({ services: [
      { id: 'a', day: 'Saturday', time: '9:30 AM', label: 'Sabbath Worship' },
      { id: 'b', day: 'Tuesday', time: '7:00 PM', label: 'Prayer' },
    ] });
    expect(slots2.map((s) => s.dayLabel)).toEqual(['Tuesday', 'Saturday']);
    expect(slots2.find((s) => s.time === '9:30 AM').arriveDefault).toBe('08:15');
  });

  it('falls back to Sunday rather than an empty picker when a church has no services yet', () => {
    for (const empty of [null, {}, { services: [] }, { services: [{ day: 'Blursday' }] }]) {
      const s = serviceSlots(empty);
      expect(s).toHaveLength(1);
      expect(s[0].dayLabel).toBe('Sunday');
    }
  });

  it('maps weekday names to indices and rejects nonsense', () => {
    expect(dowIndex('Sunday')).toBe(0);
    expect(dowIndex('wednesday')).toBe(3);
    expect(dowIndex('Blursday')).toBe(-1);
  });
});

describe('upcomingServices — Sunday and Wednesday interleave in ONE picker', () => {
  const slots = serviceSlots(COLG_DEFAULT_CHURCH);

  it('runs in true chronological order, not Sundays-then-Wednesdays', () => {
    // 2026-09-11 is a Friday.
    const runs = upcomingServices('2026-09-11', slots, 6);
    expect(runs.map((r) => r.date)).toEqual([
      '2026-09-13', '2026-09-16', '2026-09-16', '2026-09-20', '2026-09-23', '2026-09-23',
    ]);
    expect(runs.map((r) => r.dayLabel)).toEqual([
      'Sunday', 'Wednesday', 'Wednesday', 'Sunday', 'Wednesday', 'Wednesday',
    ]);
  });

  it('keeps the two Wednesday services apart — same date, different runs', () => {
    const wed = upcomingServices('2026-09-11', slots, 6).filter((r) => r.dayLabel === 'Wednesday');
    const sameDay = wed.filter((r) => r.date === '2026-09-16');
    expect(sameDay).toHaveLength(2);
    expect(sameDay[0].slotId).not.toBe(sameDay[1].slotId);
    expect(sameDay.map((r) => r.time)).toEqual(['1:00 PM', '6:00 PM']);
    expect(new Set(sameDay.map((r) => r.key)).size).toBe(2);
  });

  it('includes TODAY when today is itself a service day', () => {
    expect(nextDayOfWeek('2026-09-13', 0)).toBe('2026-09-13'); // a Sunday
    expect(upcomingServices('2026-09-13', slots, 1)[0].date).toBe('2026-09-13');
  });

  it('reads as a sentence a rider understands', () => {
    const run = upcomingServices('2026-09-11', slots, 6).find((r) => r.time === '6:00 PM');
    expect(serviceRunLabel(run, (d) => d)).toBe('2026-09-16 · 6:00 PM Bible Study');
    expect(serviceRunLabel(null, (d) => d)).toBe('');
  });
});

describe('back-compat — no Sunday row written before today is orphaned', () => {
  const slots = serviceSlots(COLG_DEFAULT_CHURCH);
  const runs = upcomingServices('2026-09-11', slots, 6);
  const sunday = runs[0];
  const wed1 = runs[1];

  it('treats a slotless legacy row as the date’s primary run', () => {
    expect(rowMatchesRun({ serviceDate: sunday.date }, sunday)).toBe(true);
  });

  it('matches a slotted row only to its own run', () => {
    const row = { serviceDate: wed1.date, serviceSlot: wed1.slotId };
    expect(rowMatchesRun(row, wed1)).toBe(true);
    expect(rowMatchesRun(row, runs[2])).toBe(false); // the 6:00 PM, same date
  });

  it('never matches across dates, and never throws on junk', () => {
    expect(rowMatchesRun({ serviceDate: '2026-01-01' }, sunday)).toBe(false);
    expect(rowMatchesRun(null, sunday)).toBe(false);
    expect(rowMatchesRun({ serviceDate: sunday.date }, null)).toBe(false);
  });

  it('coverage narrows to ONE service when the date holds two', () => {
    const routes = [{ id: 'r1', name: 'Urbana', active: true, sortOrder: 1 }];
    const schedule = [
      { id: 's1', serviceDate: wed1.date, serviceSlot: wed1.slotId, routeId: 'r1', driverName: 'Deacon Anderson', status: 'confirmed' },
      { id: 's2', serviceDate: wed1.date, serviceSlot: runs[2].slotId, routeId: 'r1', driverName: 'Sister Ruth', status: 'scheduled' },
    ];
    const one = coverageForDate(schedule, routes, wed1.date, wed1.slotId);
    expect(one.routes).toHaveLength(1);
    expect(one.routes[0].driverName).toBe('Deacon Anderson');
    const other = coverageForDate(schedule, routes, wed1.date, runs[2].slotId);
    expect(other.routes[0].driverName).toBe('Sister Ruth');
  });

  it('coverage with NO slot asked for behaves exactly as it always did', () => {
    const routes = [{ id: 'r1', name: 'Urbana', active: true, sortOrder: 1 }];
    const schedule = [{ id: 's1', serviceDate: '2026-09-13', routeId: 'r1', driverName: 'Deacon Anderson', status: 'confirmed' }];
    const cov = coverageForDate(schedule, routes, '2026-09-13');
    expect(cov.fullyCovered).toBe(true);
    expect(cov.confirmedCount).toBe(1);
  });
});

describe('proven-to-catch (anti-theater) — the Sunday-only regression fails here', () => {
  it('CATCHES a picker that offers Sundays only', () => {
    const runs = upcomingServices('2026-09-11', serviceSlots(COLG_DEFAULT_CHURCH), 6);
    const nonSunday = runs.filter((r) => r.dow !== 0);
    expect(nonSunday.length).toBeGreaterThan(0);
  });

  it('CATCHES a model that collapsed the two Wednesday services into one', () => {
    const runs = upcomingServices('2026-09-11', serviceSlots(COLG_DEFAULT_CHURCH), 6);
    expect(new Set(runs.map((r) => r.key)).size).toBe(runs.length);
    expect(new Set(runs.map((r) => r.date)).size).toBeLessThan(runs.length);
  });
});
