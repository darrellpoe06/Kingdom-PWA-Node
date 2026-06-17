// Tests for lib/church-live.js — the honest "is the church plausibly streaming
// now?" gate for the Church tab's Live Worship player (bug, 2026-06-17).
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the regression these guard against is
// the player auto-mounting outside service times, which paints YouTube's frozen
// "Waiting for <stale 2019 stream>" frame. The gate's whole job is to be FALSE
// outside the service window. The "off-window -> live === false" cases below
// fail if the gate ever regresses to always-true.
import { describe, it, expect } from 'vitest';
import { parseServiceTime, liveStatus } from '../lib/church-live.js';

// COLG's real published online schedule.
const COLG_SERVICES = [
  { id: 'svc-sun',  day: 'Sunday',    time: '11:00 AM', label: 'Sunday Worship', online: true },
  { id: 'svc-wed1', day: 'Wednesday', time: '1:00 PM',  label: 'Bible Study',    online: true },
  { id: 'svc-wed2', day: 'Wednesday', time: '6:00 PM',  label: 'Bible Study',    online: true },
];

describe('parseServiceTime', () => {
  it('parses 12-hour times to minutes since midnight', () => {
    expect(parseServiceTime('11:00 AM')).toBe(11 * 60);
    expect(parseServiceTime('1:00 PM')).toBe(13 * 60);
    expect(parseServiceTime('6:00 PM')).toBe(18 * 60);
    expect(parseServiceTime('12:00 AM')).toBe(0);
    expect(parseServiceTime('12:30 PM')).toBe(12 * 60 + 30);
  });
  it('returns null for unparseable input', () => {
    expect(parseServiceTime('')).toBeNull();
    expect(parseServiceTime(undefined)).toBeNull();
    expect(parseServiceTime('noon')).toBeNull();
    expect(parseServiceTime('25:00')).toBeNull();
  });
});

describe('liveStatus — in-window auto-mount', () => {
  it('is live exactly at Sunday 11:00 AM service start', () => {
    // Sunday 2026-06-21, 11:00 local.
    const now = new Date(2026, 5, 21, 11, 0, 0);
    expect(liveStatus(COLG_SERVICES, now).live).toBe(true);
  });
  it('is live shortly before start (pre-roll window)', () => {
    const now = new Date(2026, 5, 21, 10, 50, 0); // 10 min before
    expect(liveStatus(COLG_SERVICES, now).live).toBe(true);
  });
  it('is live well into the service (post-roll window)', () => {
    const now = new Date(2026, 5, 21, 13, 0, 0); // 2h after
    expect(liveStatus(COLG_SERVICES, now).live).toBe(true);
  });
  it('catches the Wednesday evening service', () => {
    const now = new Date(2026, 5, 24, 18, 15, 0); // Wed 6:15 PM
    expect(liveStatus(COLG_SERVICES, now).live).toBe(true);
  });
});

describe('liveStatus — off-window stays FALSE (the zombie-frame guard)', () => {
  it('is NOT live mid-week with no service', () => {
    const now = new Date(2026, 5, 23, 9, 0, 0); // Tuesday 9 AM
    expect(liveStatus(COLG_SERVICES, now).live).toBe(false);
  });
  it('is NOT live Sunday evening after worship has ended', () => {
    const now = new Date(2026, 5, 21, 20, 0, 0); // Sunday 8 PM
    expect(liveStatus(COLG_SERVICES, now).live).toBe(false);
  });
  it('is NOT live just before the pre-roll window opens', () => {
    const now = new Date(2026, 5, 21, 10, 30, 0); // 30 min before, outside 20-min pre-roll
    expect(liveStatus(COLG_SERVICES, now).live).toBe(false);
  });
  it('is NOT live for an in-person-only schedule, ever', () => {
    const inPersonOnly = [{ day: 'Sunday', time: '11:00 AM', online: false }];
    const now = new Date(2026, 5, 21, 11, 0, 0);
    expect(liveStatus(inPersonOnly, now).live).toBe(false);
  });
  it('is NOT live when there are no services', () => {
    expect(liveStatus([], new Date(2026, 5, 21, 11, 0, 0)).live).toBe(false);
    expect(liveStatus(undefined, new Date(2026, 5, 21, 11, 0, 0)).live).toBe(false);
  });
});

describe('liveStatus — next-service hint for the offline card', () => {
  it('points to the soonest upcoming service from a quiet weekday', () => {
    const now = new Date(2026, 5, 23, 9, 0, 0); // Tuesday 9 AM -> next is Wed 1 PM
    const { next } = liveStatus(COLG_SERVICES, now);
    expect(next).toBeTruthy();
    expect(next.day).toBe('Wednesday');
    expect(next.time).toBe('1:00 PM');
  });
  it('rolls to next Sunday after the last Wednesday service', () => {
    const now = new Date(2026, 5, 24, 23, 0, 0); // Wed 11 PM, both Wed services done
    const { next } = liveStatus(COLG_SERVICES, now);
    expect(next.day).toBe('Sunday');
    expect(next.time).toBe('11:00 AM');
  });
});
