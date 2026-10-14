// =============================================================================
// The city bus says how close, and the routes come from the agency's feed (DR-1018)
// =============================================================================
// Darrell, 2026-10-14: "I'm sure there is a bus stop closer than a mile away...
// I believe out front... or really close... find out so we can tell our
// potential clients."
//
// Two things, pinned: (1) a short walk is read in FEET on the card ("about 175
// feet", never "about 0.1 miles" for a stop out front); (2) the bus witness
// reads a GTFS feed and says, per stop within a walk, the feet, the routes,
// the days and the buses a day, with the feed's own window. The fixture is a
// tiny feed in the shape MTD publishes (a parent station with two platforms).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { feetText, milesText, roundMiles } from '../modules/properties/area.js';
import {
  parseCsv, readGtfs, stopsNear, routesAtStop, serviceDays, daysText, feedWindow, report, WALK_MILES,
} from '../../../scripts/bus-witness.mjs';

const HOUSE = { lat: 40.1234, lng: -88.2583 };
const FEED = {
  'stops.txt': [
    'stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station',
    'CORNER,"Prospect & Harvard",40.12378,-88.25799,1,',
    'CORNER:1,"Prospect & Harvard (NE)",40.12378,-88.25799,0,CORNER',
    'CORNER:2,"Prospect & Harvard (SW)",40.12370,-88.25810,0,CORNER',
    'FAR,"Market Place",40.14244,-88.24307,0,',
  ].join('\n'),
  'routes.txt': 'route_id,route_short_name,route_long_name\nR30,30,Lavender\nR7,7,Grey\nR2,2,Red\n',
  'trips.txt': [
    'route_id,service_id,trip_id',
    'R30,WEEKEND,t1', 'R30,WEEKEND,t2', 'R7,WEEKDAY,t3', 'R2,WEEKDAY,t4', 'R2,WEEKDAY,t5', 'R2,WEEKEND,t6',
  ].join('\n'),
  'stop_times.txt': [
    'trip_id,stop_id,stop_sequence',
    't1,CORNER:1,4', 't2,CORNER:2,4', 't3,CORNER:1,2', 't4,FAR,1', 't5,FAR,1', 't6,FAR,1',
  ].join('\n'),
  'calendar.txt': [
    'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
    'WEEKDAY,1,1,1,1,1,0,0,20260809,20261219',
    'WEEKEND,0,0,0,0,0,1,1,20260809,20261219',
  ].join('\n'),
  'calendar_dates.txt': 'service_id,date,exception_type\nWEEKDAY,20261126,2\n',
};
const dir = mkdtempSync(join(tmpdir(), 'gtfs-'));
for (const [name, text] of Object.entries(FEED)) writeFileSync(join(dir, name), text);

describe('a short walk is read in feet', () => {
  it('under a tenth of a mile the card says feet, in 25-foot steps', () => {
    expect(feetText(0.033)).toBe('about 175 feet');
    expect(milesText(0.033)).toBe('about 175 feet');
    expect(feetText(0.001)).toBe('about 25 feet');
  });
  it('a tenth of a mile and up still reads in miles', () => {
    expect(feetText(0.1)).toBe('about 0.1 miles');
    expect(milesText(0.7)).toBe('about 0.7 miles');
  });
  it('the rounding keeps the hundredth under a tenth, so the feet survive the save', () => {
    expect(roundMiles(0.033)).toBe(0.03);
    expect(roundMiles(0.0001)).toBe(0.01);
    expect(roundMiles(0.74)).toBe(0.7);
  });
});

describe('the bus witness reads the agency’s feed', () => {
  const gtfs = readGtfs(dir);

  it('parses quoted names and reads the feed’s own window', () => {
    expect(parseCsv('a,b\n"x, y",2\n')).toEqual([{ a: 'x, y', b: '2' }]);
    expect(gtfs.stops[0].stop_name).toBe('Prospect & Harvard');
    expect(feedWindow(gtfs)).toEqual({ start: '20260809', end: '20261219' });
  });

  it('groups a station’s platforms into one corner and measures it in feet, nearest first', () => {
    const near = stopsNear(gtfs, HOUSE, WALK_MILES);
    expect(near.map((s) => s.name)).toEqual(['Prospect & Harvard']);
    expect(near[0].ids.sort()).toEqual(['CORNER', 'CORNER:1', 'CORNER:2']);
    expect(near[0].miles).toBeLessThan(0.1);
    expect(stopsNear(gtfs, HOUSE, 5).map((s) => s.name)).toEqual(['Prospect & Harvard', 'Market Place']);
  });

  it('names every route at the corner with its days and its busiest day’s count', () => {
    const rs = routesAtStop(gtfs, ['CORNER:1', 'CORNER:2']);
    expect(rs.map((r) => `${r.route.route_short_name} ${daysText(r.days)} ${r.tripsPerDay}`)).toEqual([
      '30 Sat, Sun 2', '7 Mon–Fri 1',
    ]);
    expect(serviceDays(gtfs.calendar[0])).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    expect(daysText(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).toBe('every day');
  });

  it('the report says the window, the exceptions, the stop in feet and each route', () => {
    const r = report(gtfs, HOUSE);
    expect(r.stops).toBe(1);
    expect(r.lines[0]).toBe('feed window: 20260809 to 20261219');
    expect(r.lines).toContain('calendar exceptions (holidays, not applied here): 1');
    expect(r.lines.some((l) => /^ {2}Prospect & Harvard · about \d+ feet$/.test(l))).toBe(true);
    expect(r.lines).toContain('    30 Lavender — Sat, Sun · about 2 buses on its busiest day');
    expect(r.lines).toContain('    7 Grey — Mon–Fri · about 1 buses on its busiest day');
  });

  it('a house with no stop within the walk reports zero, never a far stop as near', () => {
    expect(report(gtfs, { lat: 41.0, lng: -88.0 }).stops).toBe(0);
  });
});
