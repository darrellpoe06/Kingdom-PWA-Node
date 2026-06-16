// Conference / Event Center sync — the multi-attendee behaviors locked as pure
// logic (no live DB / browser): row<->shape round-trip, capacity-vs-registration
// tracking, and the whole-building breakout-parallelism answer. Plus proof that
// the concurrent build's meals + Service<->Choir link is PRESERVED (re-exported
// and still resolves). Pairs with conference-rls-noleak.test.js (isolation) and
// DR-0076 (measure, don't claim).
import { describe, it, expect } from 'vitest';
import {
  toConferenceShape, toRoomShape, toSessionShape, toParticipantShape, toVenueShape,
  deriveAccess, registrationCount, conferenceRsvpCount, effectiveCapacity,
  capacityStatus, breakoutsDuringMainService, buildingView, roomForSession,
  roomsForVenue, roomsSupporting, venueSeatTotal, venueById,
  SESSION_TYPES, REGISTRATION_STATUSES, USE_TYPES,
  // preserved from lib/conference.js, re-exported through conference-sync:
  MEAL_TYPES, aggregateMeals, isMainService, resolveServiceSermon, resolveServiceSongs,
} from '../lib/conference-sync.js';

describe('row -> shape round-trip (sync mappers)', () => {
  it('maps a session row incl. session_type / room / capacity / Service<->Choir', () => {
    const s = toSessionShape({
      id: 's1', conference_id: 'c1', day: 'Tue Jul 15', time: '7:00 PM',
      title: 'Evening Worship', speaker: 'BG', session_type: 'main_service',
      room_resource_id: 'r1', capacity: 600, sermon_ref: 'serm1',
      music_set: ['song1', 'song2'], sort_order: 2, status: 'active',
    });
    expect(s).toMatchObject({
      id: 's1', conferenceId: 'c1', sessionType: 'main_service',
      roomResourceId: 'r1', capacity: 600, sermonRef: 'serm1', musicSet: ['song1', 'song2'],
    });
  });

  it('defaults a malformed session safely', () => {
    const s = toSessionShape({ id: 's2', conference_id: 'c1', title: 'X' });
    expect(s.sessionType).toBe('breakout');
    expect(s.musicSet).toEqual([]);
    expect(s.capacity).toBe(null);
  });

  it('maps a participant row + snaps meal_type to a known category', () => {
    const p = toParticipantShape({ id: 'p1', conference_id: 'c1', session_id: null, user_id: 'u1', name: 'Naomi', meal_type: 'vegan', dietary: 'peanut', registration_status: 'registered', created_by: 'u1' }, 'u1');
    expect(p).toMatchObject({ id: 'p1', name: 'Naomi', mealType: 'Vegan', dietary: 'peanut', registrationStatus: 'registered', mine: true });
  });

  it('maps room features as an array always', () => {
    expect(toRoomShape({ id: 'r1', name: 'Hall', capacity: 120, features: ['projector'] }).features).toEqual(['projector']);
    expect(toRoomShape({ id: 'r2', name: 'Foyer' }).features).toEqual([]);
  });

  it('maps a conference front-door row incl. venue', () => {
    const c = toConferenceShape({ id: 'c1', name: '77th National Assembly', theme: 'Reviving Faith', dates_label: 'July 2026', venue_id: 'v1', status: 'active' });
    expect(c).toMatchObject({ id: 'c1', name: '77th National Assembly', datesLabel: 'July 2026', venueId: 'v1' });
  });

  it('maps a venue row + carries venue_id/use_types onto rooms and sessions', () => {
    const v = toVenueShape({ id: 'v1', name: 'South Campus Event Center', address: '1109 N 4th Street, Champaign, IL', sort_order: 1 });
    expect(v).toMatchObject({ id: 'v1', name: 'South Campus Event Center', address: '1109 N 4th Street, Champaign, IL' });
    expect(toRoomShape({ id: 'r1', name: 'Kitchen', venue_id: 'v1', use_types: ['food'] })).toMatchObject({ venueId: 'v1', useTypes: ['food'] });
    expect(toRoomShape({ id: 'r2', name: 'Foyer' }).useTypes).toEqual([]);
    expect(toSessionShape({ id: 's1', conference_id: 'c1', title: 'X', venue_id: 'v1' }).venueId).toBe('v1');
  });
});

describe('venues (buildings) — multi-building scoping', () => {
  const venues = [
    { id: 'main', name: 'Main Campus', address: '312 E. Bradley Avenue, Champaign, IL 61820', status: 'active' },
    { id: 'south', name: 'South Campus Event Center', address: '1109 N 4th Street, Champaign, IL', status: 'active' },
  ];
  const rooms = [
    { id: 'r1', venueId: 'south', name: 'Main Sanctuary', capacity: 300, useTypes: ['service', 'class'], status: 'active' },
    { id: 'r2', venueId: 'south', name: 'Fellowship Hall', capacity: 120, useTypes: ['class', 'food', 'service'], status: 'active' },
    { id: 'r3', venueId: 'south', name: 'Kitchen', capacity: null, useTypes: ['food'], status: 'active' },
    { id: 'r4', venueId: 'south', name: 'Bathrooms', capacity: null, useTypes: ['facility'], status: 'active' },
    { id: 'r5', venueId: 'main', name: 'Sanctuary', capacity: 600, useTypes: ['service'], status: 'active' },
  ];

  it('roomsForVenue scopes rooms to a building', () => {
    expect(roomsForVenue(rooms, 'south').map((r) => r.name)).toEqual(['Main Sanctuary', 'Fellowship Hall', 'Kitchen', 'Bathrooms']);
    expect(roomsForVenue(rooms, 'main').map((r) => r.name)).toEqual(['Sanctuary']);
  });

  it('roomsSupporting picks the right room for a module (class/food/service), scoped to a building', () => {
    expect(roomsSupporting(rooms, 'food', 'south').map((r) => r.name)).toEqual(['Fellowship Hall', 'Kitchen']);
    expect(roomsSupporting(rooms, 'class', 'south').map((r) => r.name)).toEqual(['Main Sanctuary', 'Fellowship Hall']);
    expect(roomsSupporting(rooms, 'service').map((r) => r.name)).toEqual(['Main Sanctuary', 'Fellowship Hall', 'Sanctuary']);
  });

  it('venueSeatTotal sums known room capacities per building (NULLs ignored)', () => {
    expect(venueSeatTotal(rooms, 'south')).toBe(420); // 300 + 120 (kitchen/baths NULL)
    expect(venueSeatTotal(rooms, 'main')).toBe(600);
  });

  it('venueById resolves a building or null', () => {
    expect(venueById(venues, 'south')).toMatchObject({ name: 'South Campus Event Center' });
    expect(venueById(venues, 'nope')).toBe(null);
    expect(venueById(venues, null)).toBe(null);
  });

  it('exposes the use-type vocabulary', () => {
    expect(USE_TYPES).toEqual(['service', 'class', 'food', 'facility']);
  });
});

describe('access derivation (UI mirror of RLS)', () => {
  it('owner/admin can edit + see; a plain member sees only', () => {
    expect(deriveAccess('owner', true)).toEqual({ canEdit: true, canSee: true });
    expect(deriveAccess('admin', false)).toEqual({ canEdit: true, canSee: true });
    expect(deriveAccess('member', true)).toEqual({ canEdit: false, canSee: true });
    expect(deriveAccess(null, false)).toEqual({ canEdit: false, canSee: false });
  });
});

describe('capacity vs registration tracking', () => {
  const parts = [
    { sessionId: 'b1', conferenceId: 'c1', registrationStatus: 'registered' },
    { sessionId: 'b1', conferenceId: 'c1', registrationStatus: 'checked_in' },
    { sessionId: 'b1', conferenceId: 'c1', registrationStatus: 'cancelled' },  // does NOT occupy a seat
    { sessionId: 'b1', conferenceId: 'c1', registrationStatus: 'waitlist' },   // does NOT occupy a seat
    { sessionId: null, conferenceId: 'c1', registrationStatus: 'registered' }, // whole-conference RSVP
  ];

  it('counts only seat-occupying statuses for a session', () => {
    expect(registrationCount(parts, 'b1')).toBe(2);
  });

  it('counts whole-conference RSVPs (session_id null) separately', () => {
    expect(conferenceRsvpCount(parts, 'c1')).toBe(1);
  });

  it('effectiveCapacity falls back to the room when the session has none', () => {
    const rooms = [{ id: 'r1', capacity: 30 }];
    expect(effectiveCapacity({ capacity: 12, roomResourceId: 'r1' }, rooms)).toBe(12);
    expect(effectiveCapacity({ capacity: null, roomResourceId: 'r1' }, rooms)).toBe(30);
    expect(effectiveCapacity({ capacity: null, roomResourceId: 'rX' }, rooms)).toBe(null);
  });

  it('capacityStatus tones: good / attention (>=90%) / problem (over)', () => {
    expect(capacityStatus(5, 30).tone).toBe('good');
    expect(capacityStatus(27, 30).tone).toBe('attention');
    expect(capacityStatus(31, 30).tone).toBe('problem');
    expect(capacityStatus(31, 30).label).toMatch(/over capacity/);
    expect(capacityStatus(30, 30).label).toMatch(/full/);
    expect(capacityStatus(10, 30).label).toMatch(/20 seats left/);
    expect(capacityStatus(5, null).tone).toBe('idle'); // unbounded
  });
});

describe('whole-building: breakouts parallel to a main service', () => {
  const sessions = [
    { id: 'm1', day: 'Tue Jul 15', sessionType: 'main_service', status: 'active', roomResourceId: 'main' },
    { id: 'b1', day: 'Tue Jul 15', sessionType: 'breakout', status: 'active', roomResourceId: 'r1', capacity: 30 },
    { id: 'b2', day: 'Tue Jul 15', sessionType: 'breakout', status: 'active', roomResourceId: 'r2', capacity: 20 },
    { id: 'b3', day: 'Wed Jul 16', sessionType: 'breakout', status: 'active', roomResourceId: 'r1' },  // different day
    { id: 'b4', day: 'Tue Jul 15', sessionType: 'breakout', status: 'archived', roomResourceId: 'r3' }, // archived
  ];
  const rooms = [{ id: 'main', capacity: 600 }, { id: 'r1', capacity: 30 }, { id: 'r2', capacity: 20 }];

  it('answers how many breakouts run while the main space is in use', () => {
    const main = sessions[0];
    const parallel = breakoutsDuringMainService(sessions, main);
    expect(parallel.map((s) => s.id).sort()).toEqual(['b1', 'b2']); // same day, active, breakout
  });

  it('buildingView reports parallel count + total breakout seats per main service', () => {
    const view = buildingView(sessions, rooms);
    expect(view).toHaveLength(1);
    expect(view[0].parallelCount).toBe(2);
    expect(view[0].totalBreakoutSeats).toBe(50); // 30 + 20
  });

  it('roomForSession resolves the assigned room', () => {
    expect(roomForSession({ roomResourceId: 'r1' }, rooms)).toMatchObject({ id: 'r1', capacity: 30 });
    expect(roomForSession({ roomResourceId: null }, rooms)).toBe(null);
  });
});

describe('PRESERVED: meals + Service<->Choir reused (not regressed)', () => {
  it('the five meal categories + aggregate are reachable through conference-sync', () => {
    expect(MEAL_TYPES).toEqual(['Regular', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other']);
    const agg = aggregateMeals([
      { name: 'A', mealType: 'Vegan', dietary: 'peanut' },
      { name: 'B', mealType: 'Regular', dietary: '' },
    ]);
    expect(agg.counts).toEqual({ Vegan: 1, Regular: 1 });
    expect(agg.notes).toHaveLength(1);
  });

  it('a main_service session resolves a REAL choir sermon + ordered song set live', () => {
    const session = { sessionType: 'main_service', kind: 'main', sermonId: 'serm1', songIds: ['song2', 'song1'] };
    expect(isMainService(session)).toBe(true);
    const sermon = resolveServiceSermon(session, [{ id: 'serm1', title: 'The King\'s Way' }]);
    expect(sermon).toMatchObject({ id: 'serm1' });
    const songs = resolveServiceSongs(session, [{ id: 'song1', title: 'A' }, { id: 'song2', title: 'B' }]);
    expect(songs.map((s) => s.id)).toEqual(['song2', 'song1']); // organizer order preserved
  });
});

describe('enum guards', () => {
  it('exposes the session + registration enums for the UI', () => {
    expect(SESSION_TYPES).toEqual(['main_service', 'breakout', 'other']);
    expect(REGISTRATION_STATUSES).toEqual(['registered', 'waitlist', 'cancelled', 'checked_in']);
  });
});
