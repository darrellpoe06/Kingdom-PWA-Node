// @vitest-environment node
// =============================================================================
// The reading keeps its own trip log and says the last one in words (DR-0738)
// =============================================================================
// Darrell 2026-10-01: "It still stops when in the background... when should
// we expect that feature?" The phone had never said WHAT stopped, so the
// answer was a guess. Now it says: which voice, which sentence, whether the
// screen went dark first, what the voice said when it gave up, and how many
// times it tried again in the dark.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTripLog, tripSummary, reasonText, TRIPS_KEY, TRIPS_KEPT } from '../lib/reader-trip.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'lib', 'use-read-aloud.js'), 'utf8');
const PANEL = readFileSync(join(HERE, '..', 'components', 'TTSControl.jsx'), 'utf8');

const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const clock = (start = 1_700_000_000_000) => { let t = start; return { now: () => t, tick: (ms) => { t += ms; } }; };

describe('the trip log', () => {
  it('opens, notes, ends, and keeps the last trips on the device', () => {
    const storage = memStorage(); const c = clock();
    const log = createTripLog({ storage, now: c.now });
    expect(log.last()).toBe(null);
    log.start({ title: 'L206', pieces: 60 });
    expect(log.open()).toBe(true);
    log.note('voice', { kind: 'audio' });
    for (let i = 0; i < 14; i++) log.note('piece', { i });
    c.tick(90_000);
    log.note('hidden');
    const done = log.end('ended');
    expect(done.voice).toBe('audio');
    expect(done.piece).toBe(13);
    expect(done.events.map((e) => e.kind)).toEqual(['voice', 'hidden']); // pieces are one number, not rows
    expect(done.events[1].at).toBe(90_000);
    expect(log.open()).toBe(false);
    expect(log.last().id).toBe(done.id);
    expect(JSON.parse(storage.getItem(TRIPS_KEY))).toHaveLength(1);
  });

  it(`keeps only the last ${TRIPS_KEPT}`, () => {
    const storage = memStorage();
    const log = createTripLog({ storage, now: () => 1 });
    for (let i = 0; i < TRIPS_KEPT + 4; i++) { log.start({ title: `t${i}` }); log.end('ended'); }
    expect(log.all()).toHaveLength(TRIPS_KEPT);
    expect(log.last().title).toBe(`t${TRIPS_KEPT + 3}`);
  });

  it('a device that cannot keep the log still works, and the open trip is still the last', () => {
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    const log = createTripLog({ storage: broken, now: () => 5 });
    log.start({ title: 'x' });
    log.note('voice', { kind: 'device' });
    expect(log.last().voice).toBe('device');
    expect(log.end('stopped').end).toBe('stopped');
    expect(log.last()).toBe(null);
    expect(createTripLog({ storage: null }).last()).toBe(null);
  });
});

describe('the last reading, said in one line', () => {
  const trip = (over = {}) => ({ id: '1', startedAt: new Date(2026, 9, 1, 8, 5).getTime(), title: 'Kings Who Search It Out', pieces: 60, piece: 13, voice: 'audio', events: [], end: null, endDetail: null, ...over });

  it('played to the end', () => {
    expect(tripSummary(trip({ end: 'ended' }))).toBe('Last reading at 8:05 AM (Kings Who Search It Out): the NAS voice · played to the end.');
  });
  it('stopped by you, at the sentence', () => {
    expect(tripSummary(trip({ end: 'stopped', voice: 'saved' }))).toBe('Last reading at 8:05 AM (Kings Who Search It Out): the saved recording · stopped by you at sentence 14 of 60.');
  });
  it('held in the dark: the sentence, the reason, the retries, and when the screen went dark', () => {
    const t = trip({ end: 'held', endDetail: { reason: 'fetch-failed' }, events: [{ at: 1000, kind: 'voice', kind2: 'audio' }, { at: 75_000, kind: 'hidden' }, { at: 80_000, kind: 'fallback', i: 13, reason: 'fetch-failed', hidden: true }, { at: 85_000, kind: 'retry', step: 1 }, { at: 95_000, kind: 'retry', step: 2 }] });
    expect(tripSummary(t)).toBe('Last reading at 8:05 AM (Kings Who Search It Out): the NAS voice · stopped at sentence 14 of 60 while the screen was off: the next piece could not be fetched (tried again 2 times in the dark) — it resumes when the app is seen again · screen went dark 1 min 15 s in.');
  });
  it('picked up again in the dark is said too', () => {
    const t = trip({ end: 'ended', events: [{ at: 20_000, kind: 'hidden' }, { at: 30_000, kind: 'retry', step: 1 }, { at: 30_500, kind: 'resumed-in-the-dark' }] });
    expect(tripSummary(t)).toBe('Last reading at 8:05 AM (Kings Who Search It Out): the NAS voice · played to the end · screen went dark 20 s in · picked up again in the dark.');
  });
  it("the phone's voice taking over names the reason", () => {
    const t = trip({ end: 'stopped', voice: 'device', events: [{ at: 9_000, kind: 'handoff', reason: 'voice-lite-timeout' }] });
    expect(tripSummary(t)).toBe('Last reading at 8:05 AM (Kings Who Search It Out): this phone’s own voice · stopped by you at sentence 14 of 60 · the phone’s voice took over: the NAS did not answer in time.');
  });
  it('still reading, no title, no piece yet', () => {
    expect(tripSummary(trip({ title: '', piece: -1, voice: '' }))).toBe('Last reading at 8:05 AM: no voice yet · still reading.');
    expect(tripSummary(null)).toBe('');
  });
  it('reasons are words', () => {
    expect(reasonText('voice-lite-503')).toBe('the NAS was busy');
    expect(reasonText('NotAllowedError')).toMatch(/without a tap/);
    expect(reasonText('')).toBe('no reason was given');
    expect(reasonText('something-else')).toBe('something-else');
  });
});

describe('the reader keeps the log and tries again in the dark (source pins)', () => {
  it('a reading opens a trip, every voice choice and hand-off is noted, stop and end close it', () => {
    expect(SRC).toMatch(/createTripLog\(/);
    expect(SRC).toMatch(/trip\(\)\.start\(\{ title/);
    expect(SRC).toMatch(/markVoice\('audio'\)/);
    expect(SRC).toMatch(/markVoice\('device'\)/);
    expect(SRC).toMatch(/trip\(\)\.note\('handoff'/);
    expect(SRC).toMatch(/trip\(\)\.note\('fallback'/);
    expect(SRC).toMatch(/trip\(\)\.end\('stopped'\)/);
    expect(SRC).toMatch(/trip\(\)\.end\('ended'\)/);
    expect(SRC).toMatch(/note\(pageHidden\(\) \? 'hidden' : 'visible'\)/);
  });
  it('a piece that cannot be had while the screen is off is tried again, longer each time, before the reading is held', () => {
    expect(SRC).toMatch(/export const DARK_RETRY_MS = \[5000, 10000, 20000, 40000, 60000, 120000\]/);
    expect(SRC).toMatch(/armDarkRetryRef\.current\(reason\)/);
    expect(SRC).toMatch(/trip\(\)\.note\('retry'/);
    expect(SRC).toMatch(/trip\(\)\.note\('resumed-in-the-dark'/);
    expect(SRC).toMatch(/trip\(\)\.end\('held', \{ reason \}\)/);
    // A refusal to play without a tap is a gesture matter: no retry can fix it.
    expect(SRC).toMatch(/if \(isPlayRefusal\(reason\)\) \{ trip\(\)\.end\('held', \{ reason \}\); return; \}/);
    // Seen again: the visible path resumes it and the retry is cleared.
    expect(SRC).toMatch(/clearDarkRetry\(\);\s*\n\s*const rest = heldLiteRef\.current;/);
  });
  it('the panel says the last trip when nothing is reading', () => {
    expect(PANEL).toMatch(/data-testid="reader-last-trip"/);
    expect(PANEL).toMatch(/tripSummary\(/);
    expect(PANEL).toMatch(/lastTrip/);
  });
});
