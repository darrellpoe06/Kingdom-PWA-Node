// =============================================================================
// home-week — the homepage leads with the right thing on each day, from the
// church's REAL schedule, in the church's clock, and never paints an event.
// =============================================================================
// The redesign brief §9 (2026-11-12). Every case passes `now` in; the record
// is the real COLG default (Sun 11:00 AM; Wed 1:00 PM and 6:00 PM).
import { describe, it, expect } from 'vitest';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { churchClock, churchDateKey, weekStrip, nextService, upcomingAnnounced, featureCards, todayLine, servicesOn } from '../lib/home-week.js';

const S = COLG_DEFAULT_CHURCH.services;
// Champaign is UTC-6 in November (CST).
const SUN_10AM = new Date('2026-11-15T16:00:00Z');
const MON_9AM = new Date('2026-11-16T15:00:00Z');
const TUE_NOON = new Date('2026-11-17T18:00:00Z');
const WED_8AM = new Date('2026-11-18T14:00:00Z');
const THU_2PM = new Date('2026-11-19T20:00:00Z');
const SAT_11PM = new Date('2026-11-22T05:00:00Z'); // 11 PM Saturday Champaign = 05:00Z Sunday

describe('the church clock', () => {
  it('reads the weekday and hour in Champaign, not the runner', () => {
    expect(churchClock(SUN_10AM)).toMatchObject({ day: 0, hour: 10, minute: 0 });
    expect(churchClock(SAT_11PM)).toMatchObject({ day: 6, hour: 23 });
    expect(churchDateKey(SAT_11PM)).toBe('2026-11-21');
  });
});

describe('the week strip and the next service', () => {
  it('marks Sunday and Wednesday as service days and today as today', () => {
    const strip = weekStrip(S, THU_2PM);
    expect(strip.map((d) => d.services.length > 0)).toEqual([true, false, false, true, false, false, false]);
    expect(strip.find((d) => d.today).name).toBe('Thursday');
    expect(servicesOn(S, 3).map((s) => s.time)).toEqual(['1:00 PM', '6:00 PM']);
  });
  it('finds the next service, wrapping the week, in the record order of time', () => {
    expect(nextService(S, THU_2PM)).toMatchObject({ dayName: 'Sunday', service: { label: 'Sunday Worship' }, today: false });
    expect(nextService(S, WED_8AM)).toMatchObject({ dayName: 'Wednesday', service: { time: '1:00 PM' }, today: true });
    expect(nextService(S, SUN_10AM)).toMatchObject({ dayName: 'Sunday', service: { time: '11:00 AM' }, today: true });
    expect(nextService([], SUN_10AM)).toBeNull();
  });
});

describe('announced events are never painted', () => {
  it("the record's own announced events are in the past on 2026-11-12, so none are upcoming", () => {
    expect(upcomingAnnounced(COLG_DEFAULT_CHURCH.announcedEvents, MON_9AM)).toEqual([]);
  });
  it('a future event surfaces, soonest first, and one still running today counts', () => {
    const evs = [
      { id: 'b', name: 'Later', date: '2026-12-01' },
      { id: 'a', name: 'Sooner', date: '2026-11-20' },
      { id: 'run', name: 'Running', date: '2026-11-14', endDate: '2026-11-16' },
      { id: 'gone', name: 'Gone', date: '2026-11-01' },
    ];
    expect(upcomingAnnounced(evs, MON_9AM).map((e) => e.id)).toEqual(['run', 'a', 'b']);
  });
});

describe('the feature cards by weekday (brief §9)', () => {
  const lead = (now) => featureCards({ services: S, announcedEvents: COLG_DEFAULT_CHURCH.announcedEvents, now })[0];
  it('Sunday leads with worship', () => expect(lead(SUN_10AM)).toMatchObject({ id: 'sunday', open: { sub: 'home', section: 'worship' } }));
  it('Monday and Tuesday lead with the reading and the challenge', () => {
    expect(lead(MON_9AM).id).toBe('start');
    expect(lead(TUE_NOON)).toMatchObject({ id: 'start', open: { sub: 'learn' } });
  });
  it('Wednesday leads with Bible Study at both published times', () => {
    expect(lead(WED_8AM)).toMatchObject({ id: 'wednesday' });
    expect(lead(WED_8AM).title).toBe('Bible Study at 1:00 PM and 6:00 PM');
  });
  it('Thursday to Saturday lead with ministries, learning and Sunday ahead', () => {
    expect(lead(THU_2PM)).toMatchObject({ id: 'ahead', open: { sub: 'ministries' } });
    expect(lead(THU_2PM).body).toContain('Sunday Worship, Sunday 11:00 AM');
    expect(lead(SAT_11PM).id).toBe('ahead');
  });
  it('with no upcoming event the second card says so — it never invents one', () => {
    const cards = featureCards({ services: S, announcedEvents: COLG_DEFAULT_CHURCH.announcedEvents, now: MON_9AM });
    expect(cards[1]).toMatchObject({ id: 'no-events' });
    expect(cards.map((c) => c.id)).toEqual(['start', 'no-events', 'visit']);
  });
  it('with a future event the second card is that event', () => {
    const cards = featureCards({ services: S, announcedEvents: [{ id: 'x', name: 'Harvest Dinner', date: '2026-11-21', detail: 'Fellowship hall' }], now: MON_9AM });
    expect(cards[1]).toMatchObject({ id: 'event-x', title: 'Harvest Dinner' });
    expect(cards[1].body).toBe('2026-11-21 · Fellowship hall');
  });
  it('PROVEN-TO-CATCH: a Sunday with no Sunday service in the record does NOT lead with worship', () => {
    const noSunday = S.filter((s) => s.day !== 'Sunday');
    expect(featureCards({ services: noSunday, now: SUN_10AM })[0].id).not.toBe('sunday');
  });
});

describe('the This week line', () => {
  it("names today's services when there are any", () => {
    expect(todayLine(S, WED_8AM).heading).toBe('Today: Bible Study 1:00 PM · Bible Study 6:00 PM');
  });
  it('names the next service when there are none today', () => {
    expect(todayLine(S, THU_2PM)).toMatchObject({ heading: 'Thursday' });
    expect(todayLine(S, THU_2PM).body).toContain('Next up: Sunday Worship, Sunday 11:00 AM');
  });
});
