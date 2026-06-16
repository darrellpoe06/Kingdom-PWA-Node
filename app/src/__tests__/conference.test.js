// Tests for the Conference module's pure logic (meals + Service<->Choir link).
// Locks the two behaviors called out in the build: (1) a mealType RSVP persists
// in the spec shape and aggregates into exact counts + an allergy list, and
// (2) a Main Service references a REAL choir sermon + song set resolved live
// from the choir lists (never duplicating the data). Pairs with RELEASE-LANE.md
// (tests ship with the feature) + DR-0076 (measure, don't claim).
import { describe, it, expect } from 'vitest';
import {
  MEAL_TYPES, normalizeMealType, buildRsvp, aggregateMeals, mealCountRows,
  parseMealOptions, formatMealOptions, buildMeal,
  isMainService, resolveServiceSermon, resolveServiceSongs, linkedServiceView, toggleSongId,
} from '../lib/conference.js';

describe('mealType normalization + spec shape', () => {
  it('snaps known categories case-insensitively, defaults Regular', () => {
    expect(normalizeMealType('vegan')).toBe('Vegan');
    expect(normalizeMealType('GLUTEN-FREE')).toBe('Gluten-free');
    expect(normalizeMealType('')).toBe('Regular');
    expect(normalizeMealType('nonsense')).toBe('Regular');
  });
  it('buildRsvp produces the event_participants.dietary shape', () => {
    const r = buildRsvp({ name: '  Naomi  ', mealType: 'vegan', dietary: '  peanut allergy ', id: 'rv-1', at: '2026-07-14' });
    expect(r).toEqual({ id: 'rv-1', name: 'Naomi', mealType: 'Vegan', dietary: 'peanut allergy', at: '2026-07-14' });
  });
  it('exposes the five task categories in order', () => {
    expect(MEAL_TYPES).toEqual(['Regular', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other']);
  });
});

describe('aggregateMeals — organizer counts + allergy list (no manual tally)', () => {
  const rsvps = [
    buildRsvp({ name: 'Adam', mealType: 'Regular', dietary: '', id: 'a', at: '2026-07-14' }),
    buildRsvp({ name: 'Naomi', mealType: 'Vegan', dietary: 'peanut allergy', id: 'b', at: '2026-07-14' }),
    buildRsvp({ name: 'Ruth', mealType: 'Vegan', dietary: '', id: 'c', at: '2026-07-14' }),
    buildRsvp({ name: 'Boaz', mealType: 'Gluten-free', dietary: 'celiac', id: 'd', at: '2026-07-14' }),
  ];
  it('counts each mealType exactly', () => {
    const { counts, total } = aggregateMeals(rsvps);
    expect(counts).toEqual({ Regular: 1, Vegan: 2, 'Gluten-free': 1 });
    expect(total).toBe(4);
  });
  it('collects only the RSVPs that wrote an allergy/specific need', () => {
    const { notes } = aggregateMeals(rsvps);
    expect(notes).toEqual([
      { name: 'Naomi', mealType: 'Vegan', dietary: 'peanut allergy' },
      { name: 'Boaz', mealType: 'Gluten-free', dietary: 'celiac' },
    ]);
  });
  it('mealCountRows is ordered by MEAL_TYPES, non-zero only', () => {
    const { counts } = aggregateMeals(rsvps);
    expect(mealCountRows(counts)).toEqual([['Regular', 1], ['Vegan', 2], ['Gluten-free', 1]]);
  });
  it('empty roll is safe', () => {
    expect(aggregateMeals([])).toEqual({ counts: {}, notes: [], total: 0 });
    expect(aggregateMeals(undefined)).toEqual({ counts: {}, notes: [], total: 0 });
  });
});

describe('meal menu rows (options as a real array)', () => {
  it('parses + formats options across "·", comma, newline', () => {
    expect(parseMealOptions('Baked chicken · vegan plate, salad')).toEqual(['Baked chicken', 'vegan plate', 'salad']);
    expect(formatMealOptions(['Baked chicken', 'vegan plate'])).toBe('Baked chicken · vegan plate');
  });
  it('buildMeal yields the { day, mealName, options[], notes } shape', () => {
    const m = buildMeal({ day: 'Tue Jul 15', mealName: ' Dinner ', options: 'chicken, vegan plate', notes: ' fellowship hall ', id: 'ml-1' });
    expect(m).toEqual({ id: 'ml-1', day: 'Tue Jul 15', mealName: 'Dinner', options: ['chicken', 'vegan plate'], notes: 'fellowship hall' });
  });
  it('accepts options that are already an array', () => {
    expect(buildMeal({ mealName: 'Lunch', options: ['a', 'b'] }).options).toEqual(['a', 'b']);
  });
});

describe('Service <-> Choir link — references real choir data, never duplicates', () => {
  // Stand-ins for the LIVE choir_sermons / choir_songs the subscribers deliver.
  const sermons = [
    { id: 'sm-1', title: 'Reviving Faith', speaker: 'Bishop Gwin', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', serviceDate: '2026-07-15' },
    { id: 'sm-2', title: 'Restoring Hope', speaker: 'Elder Poe', youtubeUrl: 'https://youtu.be/abc12345678' },
  ];
  const songs = [
    { id: 'sg-1', title: 'Total Praise', youtubeUrl: 'https://youtu.be/aaa11112222' },
    { id: 'sg-2', title: 'Way Maker', youtubeUrl: 'https://youtu.be/bbb11112222' },
    { id: 'sg-3', title: 'Goodness of God', youtubeUrl: 'https://youtu.be/ccc11112222' },
  ];

  it('flags a Main Service vs a breakout', () => {
    expect(isMainService({ kind: 'main' })).toBe(true);
    expect(isMainService({ kind: 'breakout' })).toBe(false);
    expect(isMainService({})).toBe(false);
    expect(isMainService(null)).toBe(false);
  });

  it('resolves the linked sermon from the live list by id', () => {
    const session = { id: 'cs-1', kind: 'main', sermonId: 'sm-1', songIds: ['sg-2', 'sg-1'] };
    const sermon = resolveServiceSermon(session, sermons);
    expect(sermon).toBe(sermons[0]); // SAME object — referenced, not copied
    expect(sermon.speaker).toBe('Bishop Gwin');
  });

  it('resolves songs IN the organizer-set order, dropping unknown ids', () => {
    const session = { kind: 'main', sermonId: 'sm-1', songIds: ['sg-2', 'sg-1', 'sg-missing'] };
    const set = resolveServiceSongs(session, songs);
    expect(set.map((s) => s.title)).toEqual(['Way Maker', 'Total Praise']);
    expect(set[0]).toBe(songs[1]); // referenced object
  });

  it('linkedServiceView assembles a Main Service from real choir data', () => {
    const session = { kind: 'main', sermonId: 'sm-2', songIds: ['sg-3'] };
    const view = linkedServiceView(session, sermons, songs);
    expect(view.isMain).toBe(true);
    expect(view.sermon.title).toBe('Restoring Hope');
    expect(view.songs.map((s) => s.title)).toEqual(['Goodness of God']);
  });

  it('a non-main / unlinked session resolves to nothing', () => {
    expect(linkedServiceView({ kind: 'breakout' }, sermons, songs)).toEqual({ isMain: false, sermon: null, songs: [] });
    expect(resolveServiceSermon({ kind: 'main', sermonId: 'nope' }, sermons)).toBeNull();
  });

  it('toggleSongId adds to the end and removes, preserving order', () => {
    expect(toggleSongId(['sg-1'], 'sg-2')).toEqual(['sg-1', 'sg-2']);
    expect(toggleSongId(['sg-1', 'sg-2'], 'sg-1')).toEqual(['sg-2']);
    expect(toggleSongId(undefined, 'sg-1')).toEqual(['sg-1']);
  });
});
