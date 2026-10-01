// @vitest-environment node
// =============================================================================
// THE READER'S TRIP RIDES WITH A FEEDBACK NOTE (DR-0744)
// =============================================================================
// Darrell 2026-10-01: "Why are we not able to continue to listen when inside
// the downloaded app". The reader keeps a trip log of what the last reading
// did (DR-0738); a feedback note never carried it, so "it stopped" arrived
// without which voice was speaking or what happened in the dark. Now the form
// hands a recent trip in as one line and the body closes with it, marked
// [reader].
//
// PROVEN-TO-CATCH: the body test fails against the old composer, which
// dropped every field it did not know; the window test fails if an old trip
// is handed in.
import { describe, it, expect } from 'vitest';
import { createTripLog, recentTripLine, tripSummary, TRIPS_KEY, TRIP_RECENT_MS } from '../lib/reader-trip.js';
import { composeFeedbackBody } from '../lib/feedback-sync.js';

const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};

describe('recentTripLine', () => {
  it('is the last trip in one line when it ended within the window', () => {
    const storage = memStorage();
    let t = 1_000_000;
    const now = () => t;
    const log = createTripLog({ storage, now });
    log.start({ title: 'L206', pieces: 40 });
    log.note('voice', { kind: 'device' });
    log.note('piece', { i: 11 });
    t += 90_000;
    log.note('hidden');
    t += 2_000;
    log.end('held', { reason: 'voice-lite-road' });
    t += 10 * 60 * 1000;
    const line = recentTripLine({ storage, now });
    expect(line).toBe(tripSummary(log.last()));
    expect(line).toMatch(/this phone’s own voice/);
    expect(line).toMatch(/stopped at sentence 12 of 40 while the screen was off/);
    expect(line).toMatch(/screen went dark/);
  });
  it('PROVEN-TO-CATCH: a trip older than the window is not handed in, and no trip is an empty string', () => {
    const storage = memStorage();
    let t = 1_000_000;
    const now = () => t;
    const log = createTripLog({ storage, now });
    log.start({ title: 'L201', pieces: 3 });
    log.end('ended');
    t += TRIP_RECENT_MS + 1;
    expect(recentTripLine({ storage, now })).toBe('');
    expect(recentTripLine({ storage: memStorage(), now })).toBe('');
    expect(storage.getItem(TRIPS_KEY)).toBeTruthy();
  });
  it('a trip still open counts from when it started', () => {
    const storage = memStorage();
    let t = 5_000;
    const now = () => t;
    createTripLog({ storage, now }).start({ title: 'L202', pieces: 9 });
    t += 60_000;
    expect(recentTripLine({ storage, now })).toMatch(/still reading/);
  });
});

describe('composeFeedbackBody', () => {
  it('composes the fields as before when no trip is handed in', () => {
    expect(composeFeedbackBody({ whatsNot: 'it stops', categories: ['reader'] })).toBe('Not working: it stops | [reader]');
    expect(composeFeedbackBody({ text: 'plain' })).toBe('plain');
    expect(composeFeedbackBody({ rating: 'rough' })).toBe('Rated: rough');
    expect(composeFeedbackBody({})).toBe('');
  });
  it('closes the body with the trip, marked [reader], for every shape of note', () => {
    const readerTrip = 'Last reading at 3:56 PM (L206): this phone’s own voice · stopped at sentence 12 of 40 while the screen was off: the next piece could not be fetched — it resumes when the app is seen again.';
    expect(composeFeedbackBody({ whatsNot: 'it stops in the background', readerTrip })).toBe(`Not working: it stops in the background | [reader] ${readerTrip}`);
    expect(composeFeedbackBody({ text: 'plain', readerTrip })).toBe(`plain | [reader] ${readerTrip}`);
    expect(composeFeedbackBody({ readerTrip })).toBe(`[reader] ${readerTrip}`);
    expect(composeFeedbackBody({ whatsNot: 'x', readerTrip: '   ' })).toBe('Not working: x');
  });
});
