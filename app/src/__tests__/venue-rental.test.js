// venue-rental — the COMMUNITY space-booking domain (Church > Venues). These pin
// the PURE logic with no live DB (DR-0076: measure, don't claim), and they are
// PROVEN-TO-CATCH: the no-double-booking engine is the closed loop the surface
// promises, so the suite shows it BOTH flags a real double-book AND clears a clean
// one. A green here means double-booking can't silently slip through.
import { describe, it, expect } from 'vitest';
import {
  CAMPUSES, CAMPUS_IDS, EVENT_TYPE_IDS, findCampus, findSpace,
  responsibilitiesFor, responsibilityProgress,
  timeToMinutes, timeRangesOverlap, bookingConflicts, hasConflict,
  bookingRevenue, revenueSummary, formatPrice,
  validateBookingRequest, buildBookingRow, toBookingShape, BOOKING_STATUSES,
} from '../lib/venue-rental.js';

// A scheduled booking factory (camelCase shape, as the management surface sees it).
const bk = (over = {}) => ({
  id: over.id || 'b1',
  campus: 'north',
  spaceId: 'north-sanctuary',
  eventType: 'wedding',
  eventDate: '2026-08-01',
  startTime: '12:00',
  endTime: '15:00',
  status: 'scheduled',
  quotedPrice: null,
  responsibilities: {},
  ...over,
});

describe('catalog', () => {
  it('has the two campuses with North premium and South standard', () => {
    expect(CAMPUS_IDS).toEqual(['north', 'south']);
    expect(findCampus('north').tier).toBe('premium');
    expect(findCampus('south').tier).toBe('standard');
    expect(findCampus('south').address).toContain('1109 N 4th');
  });
  it('resolves a space to its campus (ids are unique across campuses)', () => {
    expect(findSpace('north-sanctuary').campusId).toBe('north');
    expect(findSpace('south-kitchen').campusId).toBe('south');
    expect(findSpace('nope')).toBeNull();
  });
});

describe('responsibilities (nothing dropped)', () => {
  it('funeral / wedding / community each carry a team-tagged checklist', () => {
    for (const t of EVENT_TYPE_IDS) {
      const list = responsibilitiesFor(t);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((r) => r.key && r.label && r.team)).toBe(true);
    }
    // AV always lands on the media team.
    expect(responsibilitiesFor('funeral').find((r) => r.key === 'av').team).toBe('Media Team');
  });
  it('progress reflects what is marked done', () => {
    const empty = responsibilityProgress(bk({ eventType: 'community', responsibilities: {} }));
    expect(empty.done).toBe(0);
    expect(empty.tone).toBe('problem');
    const some = responsibilityProgress(bk({ eventType: 'community', responsibilities: { setup: true } }));
    expect(some.done).toBe(1);
    expect(some.tone).toBe('attention');
    const all = {};
    responsibilitiesFor('community').forEach((r) => { all[r.key] = true; });
    const done = responsibilityProgress(bk({ eventType: 'community', responsibilities: all }));
    expect(done.complete).toBe(true);
    expect(done.tone).toBe('good');
  });
});

describe('time math', () => {
  it('parses HH:MM and rejects garbage', () => {
    expect(timeToMinutes('12:30')).toBe(750);
    expect(timeToMinutes('9:05')).toBe(545);
    expect(timeToMinutes('25:00')).toBeNull();
    expect(timeToMinutes('')).toBeNull();
    expect(timeToMinutes(null)).toBeNull();
  });
  it('overlap is half-open; touching edges do NOT overlap', () => {
    expect(timeRangesOverlap('12:00', '13:00', '13:00', '14:00')).toBe(false);
    expect(timeRangesOverlap('12:00', '13:30', '13:00', '14:00')).toBe(true);
    // A missing window is treated as all-day → always overlaps.
    expect(timeRangesOverlap(null, null, '13:00', '14:00')).toBe(true);
  });
});

describe('no-double-booking engine (proven-to-catch)', () => {
  it('FLAGS a real double-book: same campus + space + date + overlapping time', () => {
    const existing = [bk({ id: 'a', startTime: '12:00', endTime: '15:00' })];
    const candidate = bk({ id: 'b', startTime: '14:00', endTime: '16:00' });
    expect(hasConflict(existing, candidate)).toBe(true);
    expect(bookingConflicts(existing, candidate).map((c) => c.id)).toEqual(['a']);
  });
  it('CLEARS a clean booking: same space, non-overlapping times', () => {
    const existing = [bk({ id: 'a', startTime: '09:00', endTime: '11:00' })];
    const candidate = bk({ id: 'b', startTime: '12:00', endTime: '15:00' });
    expect(hasConflict(existing, candidate)).toBe(false);
  });
  it('does not conflict across different campuses or different dates', () => {
    const existing = [bk({ id: 'a' })];
    expect(hasConflict(existing, bk({ id: 'b', campus: 'south', spaceId: 'south-sanctuary' }))).toBe(false);
    expect(hasConflict(existing, bk({ id: 'b', eventDate: '2026-08-02' }))).toBe(false);
  });
  it('a WHOLE-CAMPUS booking blocks every space on that campus (and vice versa)', () => {
    const wholeNorth = [bk({ id: 'a', spaceId: 'north-whole' })];
    expect(hasConflict(wholeNorth, bk({ id: 'b', spaceId: 'north-fellowship' }))).toBe(true);
    // but not the other campus
    expect(hasConflict(wholeNorth, bk({ id: 'b', campus: 'south', spaceId: 'south-whole' }))).toBe(false);
  });
  it('declined / cancelled bookings never hold the room', () => {
    const released = [bk({ id: 'a', status: 'declined' }), bk({ id: 'c', status: 'cancelled' })];
    expect(hasConflict(released, bk({ id: 'b' }))).toBe(false);
    // and a released candidate never conflicts with anything
    expect(hasConflict([bk({ id: 'a' })], bk({ id: 'b', status: 'cancelled' }))).toBe(false);
  });
  it('an untimed (all-day) booking conflicts with any booking that day on the space', () => {
    const allDay = [bk({ id: 'a', startTime: null, endTime: null })];
    expect(hasConflict(allDay, bk({ id: 'b', startTime: '18:00', endTime: '20:00' }))).toBe(true);
  });
});

describe('revenue (real numbers only)', () => {
  it('counts a quoted price only on scheduled / completed bookings', () => {
    expect(bookingRevenue(bk({ status: 'scheduled', quotedPrice: 1200 }))).toBe(1200);
    expect(bookingRevenue(bk({ status: 'completed', quotedPrice: 800 }))).toBe(800);
    expect(bookingRevenue(bk({ status: 'requested', quotedPrice: 1200 }))).toBe(0);
    expect(bookingRevenue(bk({ status: 'scheduled', quotedPrice: null }))).toBe(0);
  });
  it('summarizes total + per-campus from real prices', () => {
    const sum = revenueSummary([
      bk({ id: 'a', campus: 'north', status: 'scheduled', quotedPrice: 1500 }),
      bk({ id: 'b', campus: 'south', status: 'completed', quotedPrice: 600 }),
      bk({ id: 'c', campus: 'north', status: 'requested', quotedPrice: 9999 }), // not income yet
    ]);
    expect(sum.total).toBe(2100);
    expect(sum.byCampus.north).toBe(1500);
    expect(sum.byCampus.south).toBe(600);
  });
  it('formats money and shows a dash for empty', () => {
    expect(formatPrice(1200)).toBe('$1,200');
    expect(formatPrice(0)).toBe('—');
    expect(formatPrice(null)).toBe('—');
  });
});

describe('validation + row mapping', () => {
  it('requires name, campus, space, type, date; checks email and time order', () => {
    const bad = validateBookingRequest({});
    expect(bad.ok).toBe(false);
    expect(bad.errors).toHaveProperty('requesterName');
    expect(bad.errors).toHaveProperty('campus');
    expect(bad.errors).toHaveProperty('spaceId');
    expect(bad.errors).toHaveProperty('eventDate');

    const badTimes = validateBookingRequest({
      requesterName: 'Jane', campus: 'north', spaceId: 'north-sanctuary',
      eventType: 'wedding', eventDate: '2026-08-01', startTime: '15:00', endTime: '12:00',
    });
    expect(badTimes.errors).toHaveProperty('endTime');

    const good = validateBookingRequest({
      requesterName: 'Jane', campus: 'north', spaceId: 'north-sanctuary',
      eventType: 'wedding', eventDate: '2026-08-01', email: 'jane@example.com',
    });
    expect(good.ok).toBe(true);
  });
  it('requires at least one contact method so "a leader will reach out" stays keepable', () => {
    const noContact = validateBookingRequest({
      requesterName: 'Jane', campus: 'north', spaceId: 'north-sanctuary',
      eventType: 'wedding', eventDate: '2026-08-01',
    });
    expect(noContact.ok).toBe(false);
    expect(noContact.errors).toHaveProperty('requesterEmail');

    const phoneOnly = validateBookingRequest({
      requesterName: 'Jane', campus: 'north', spaceId: 'north-sanctuary',
      eventType: 'wedding', eventDate: '2026-08-01', requesterPhone: '217-555-0100',
    });
    expect(phoneOnly.ok).toBe(true);
  });
  it('rejects a space that belongs to a different campus', () => {
    const r = validateBookingRequest({
      requesterName: 'Jane', campus: 'north', spaceId: 'south-kitchen',
      eventType: 'community', eventDate: '2026-08-01',
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveProperty('spaceId');
  });
  it('buildBookingRow denormalizes the space name + clamps event type; toBookingShape round-trips', () => {
    const row = buildBookingRow({
      requesterName: 'Jane', campus: 'north', spaceId: 'north-sanctuary',
      eventType: 'banquet', eventDate: '2026-08-01', startTime: '12:00', endTime: '15:00',
    });
    expect(row.space_name).toBe('Main Sanctuary');
    expect(row.event_type).toBe('community'); // unknown type clamped to a safe default
    expect(BOOKING_STATUSES).toContain('scheduled');

    const shape = toBookingShape({ ...row, id: 'x', status: 'scheduled', quoted_price: 1200, responsibilities: { setup: true } });
    expect(shape.spaceName).toBe('Main Sanctuary');
    expect(shape.quotedPrice).toBe(1200);
    expect(shape.responsibilities.setup).toBe(true);
  });
});

describe('campus catalog shape', () => {
  it('every campus space has a unique id and a name', () => {
    const ids = new Set();
    for (const c of CAMPUSES) {
      for (const s of c.spaces) {
        expect(s.name).toBeTruthy();
        expect(ids.has(s.id)).toBe(false);
        ids.add(s.id);
      }
    }
  });
});
