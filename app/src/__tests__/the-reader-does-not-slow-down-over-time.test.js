// =============================================================================
// The reader does not slow down over time (2026-10-07, DR-0786)
// =============================================================================
// Darrell, on the Firestick: "The reader begins to slow down on firestick...
// longer pauses... etc... over time... why?!!!!!"
//
// Measured against the code as it was (lib/clip-cache.js):
//   • put() awaited a full eviction — store.list() of EVERY clip on the
//     device, sorted — on every save. The fetch-ahead saves a sentence a
//     second, so the device re-read its whole clip catalogue once a second,
//     and the scan grew with every lesson ever listened to.
//   • get() awaited a WRITE (touch) before handing the clip to the player, so
//     the next sentence queued behind the fetch-ahead's writes and scans.
//   • the fetch-ahead asked the NAS three at a time; the NAS takes two and
//     answers the third 503 busy, which then waited 600 ms+ to ask again.
// The pause between sentences is exactly the time the next clip waits, and
// that time grew. These tests break each mechanism on purpose with a backend
// that COUNTS its own calls, so a return to any of them fails here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClipCache, memoryBackend, AHEAD_CONCURRENCY, EVICT_DEBOUNCE_MS, TOUCH_DEBOUNCE_MS } from '../lib/clip-cache.js';
import { createClipQueue } from '../lib/clip-queue.js';
import { createTripLog, tripSummary, waitsLine, LONG_WAIT_MS } from '../lib/reader-trip.js';

const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');
const blob = (size) => ({ size, type: 'audio/wav' });

/** A memory backend that counts what the cache asks of it. */
function countingBackend() {
  const inner = memoryBackend();
  const counts = { list: 0, touch: 0, touchMany: 0, del: 0, put: 0, get: 0 };
  return {
    counts,
    get: (k) => { counts.get += 1; return inner.get(k); },
    put: (k, b, m) => { counts.put += 1; return inner.put(k, b, m); },
    del: (k) => { counts.del += 1; return inner.del(k); },
    list: () => { counts.list += 1; return inner.list(); },
    touch: (k, at) => { counts.touch += 1; return inner.touch(k, at); },
    touchMany: (entries) => { counts.touchMany += 1; return inner.touchMany(entries); },
    getMeta: (k) => inner.getMeta(k),
    setMeta: (k, m) => inner.setMeta(k, m),
    get size() { return inner.size; },
  };
}

/** A scheduler the test drives by hand: nothing runs until fire(). */
function manualScheduler() {
  const due = [];
  return {
    schedule: (fn, ms) => { due.push({ fn, ms }); return due.length; },
    fire: async () => { const now = due.splice(0); for (const d of now) await d.fn(); },
    get pending() { return due.length; },
  };
}

describe('1. saving a sentence no longer scans every clip on the device', () => {
  it('fifty saves under the cap: ONE count, zero evictions, zero deletes', async () => {
    const backend = countingBackend();
    const sched = manualScheduler();
    const cache = createClipCache({ backend, capBytes: () => 1e9, schedule: sched.schedule });
    for (let i = 0; i < 50; i++) await cache.put(`k${i}`, blob(1000));
    // The old code: 50 puts → 50 list() scans. Now the catalogue is read once.
    expect(backend.counts.list).toBe(1);
    expect(backend.counts.del).toBe(0);
    expect(sched.pending).toBe(0);
    expect(cache.knownBytes()).toBe(50_000);
  });

  it('a put never waits on the eviction: over the cap it is scheduled, then runs once for many saves', async () => {
    const backend = countingBackend();
    const sched = manualScheduler();
    let t = 0;
    const cache = createClipCache({ backend, capBytes: () => 3000, now: () => ++t, schedule: sched.schedule });
    for (let i = 0; i < 10; i++) await cache.put(`k${i}`, blob(1000)); // 10 000 > 3 000 from the 4th save on
    // Nothing was deleted yet — the puts returned without a scan...
    expect(backend.counts.del).toBe(0);
    expect(backend.counts.list).toBe(1);
    // ...one eviction is due, not seven.
    expect(sched.pending).toBe(1);
    await sched.fire();
    await cache.flush(); // the eviction the timer started, run to its end
    expect(backend.counts.list).toBe(2);
    expect(await cache.totalBytes()).toBe(3000);
    expect(backend.counts.del).toBe(7);
    // The least recently saved went first.
    expect(await cache.has('k0')).toBe(false);
    expect(await cache.has('k9')).toBe(true);
    expect(cache.knownBytes()).toBe(3000);
  });

  it('the eviction debounce is short enough to hold the cap and long enough to batch a reading', () => {
    expect(EVICT_DEBOUNCE_MS).toBeGreaterThanOrEqual(1000);
    expect(EVICT_DEBOUNCE_MS).toBeLessThanOrEqual(5000);
  });
});

describe('2. a read hands the clip over at once; "last played" is written in one batch later', () => {
  it('three gets: no write before the clip is returned; one touchMany for all three on flush', async () => {
    const backend = countingBackend();
    const sched = manualScheduler();
    const cache = createClipCache({ backend, capBytes: () => 1e9, schedule: sched.schedule });
    await cache.put('a', blob(10)); await cache.put('b', blob(10)); await cache.put('c', blob(10));
    expect(await cache.get('a')).toEqual(blob(10));
    expect(await cache.get('b')).toEqual(blob(10));
    expect(await cache.get('c')).toEqual(blob(10));
    // The old code: a touch write awaited inside every get.
    expect(backend.counts.touch + backend.counts.touchMany).toBe(0);
    expect(sched.pending).toBe(1);
    await sched.fire();
    expect(backend.counts.touchMany).toBe(1);
    expect(backend.counts.touch).toBe(0);
    expect(TOUCH_DEBOUNCE_MS).toBeGreaterThanOrEqual(1000);
  });

  it('the batched touches still decide least-recently-played before an eviction', async () => {
    const backend = countingBackend();
    const sched = manualScheduler();
    let t = 0;
    const cache = createClipCache({ backend, capBytes: () => 3000, now: () => ++t, schedule: sched.schedule });
    await cache.put('a', blob(1000)); await cache.put('b', blob(1000)); await cache.put('c', blob(1000));
    await cache.get('a'); // played: newest, though saved first
    await cache.put('d', blob(1000));
    await cache.flush();
    expect(await cache.has('a')).toBe(true);
    expect(await cache.has('b')).toBe(false);
  });

  it('a backend without touchMany still gets its touches, one by one, after the clip was returned', async () => {
    const inner = memoryBackend();
    let touched = 0;
    const backend = { ...inner, get: (k) => inner.get(k), put: (k, b, m) => inner.put(k, b, m), list: () => inner.list(), touch: (k, at) => { touched += 1; return inner.touch(k, at); }, getMeta: (k) => inner.getMeta(k) };
    delete backend.touchMany;
    const sched = manualScheduler();
    const cache = createClipCache({ backend, capBytes: () => 1e9, schedule: sched.schedule });
    await cache.put('a', blob(10));
    await cache.get('a');
    expect(touched).toBe(0);
    await cache.flush();
    expect(touched).toBe(1);
  });
});

describe('3. the fetch-ahead asks the NAS exactly as many at once as the NAS takes', () => {
  it('AHEAD_CONCURRENCY equals the NAS voice’s own default cap', () => {
    const server = readFileSync(join(process.cwd(), '..', 'infra', 'nas-voice-lite', 'voice_lite_server.py'), 'utf8');
    const m = server.match(/VOICE_LITE_MAX_INFLIGHT",\s*"(\d+)"/);
    expect(m, 'the NAS cap is read from its source').toBeTruthy();
    expect(AHEAD_CONCURRENCY).toBe(Number(m[1]));
  });
  it('the reader uses the shared constant, not a number of its own', () => {
    const hook = SRC('lib/use-read-aloud.js');
    expect(hook).toMatch(/source\.ahead\(\{ concurrency: AHEAD_CONCURRENCY,/);
    expect(hook).not.toMatch(/concurrency: 3/);
  });
});

describe('4. the pause between sentences is measured and said', () => {
  function fakeAudio() {
    const a = { src: '', paused: true, currentTime: 0, duration: 2, playbackRate: 1, defaultPlaybackRate: 1 };
    a.play = () => { a.paused = false; return Promise.resolve(); };
    a.pause = () => { a.paused = true; };
    return a;
  }

  it('the queue reports, per piece, how long the listener waited and whether the piece was in hand', async () => {
    let t = 1000;
    const now = () => t;
    const pieces = [];
    const clips = { 0: 'u0', 1: 'u1', 2: 'u2' };
    const fetchClip = (text, i) => new Promise((r) => { setTimeout(() => r({ url: clips[i] }), 0); });
    const audio = fakeAudio();
    const q = createClipQueue({
      chunks: [{ text: 'a', len: 1 }, { text: 'b', len: 1 }, { text: 'c', len: 1 }],
      fetchClip, audio, now,
      onPiece: (i, w) => pieces.push({ i, ...w }),
    });
    await q.start();
    expect(pieces[0].i).toBe(0);
    expect(pieces[0].inHand).toBe(false); // the first is always fetched
    // Let the prefetch of 1 and 2 settle, so piece 1 is in hand when 0 ends.
    await new Promise((r) => setTimeout(r, 5));
    t += 300; // 300 ms later piece 0 ends; piece 1 is swapped in at once
    audio.onended();
    await new Promise((r) => setTimeout(r, 1));
    expect(pieces[1]).toEqual({ i: 1, waitMs: 0, inHand: true });
    q.stop();
  });

  it('a piece that was NOT in hand carries the wait it cost', async () => {
    let t = 0;
    const now = () => t;
    const pieces = [];
    let release = null;
    const fetchClip = (text, i) => (i === 0 ? Promise.resolve({ url: 'u0' }) : new Promise((r) => { release = () => r({ url: `u${i}` }); }));
    const audio = fakeAudio();
    const q = createClipQueue({
      chunks: [{ text: 'a', len: 1 }, { text: 'b', len: 1 }],
      fetchClip, audio, now,
      onPiece: (i, w) => pieces.push({ i, ...w }),
    });
    await q.start();
    audio.onended(); // piece 1 is still on the wire
    t += 2300;       // the listener waits 2.3 s in silence
    release();
    await new Promise((r) => setTimeout(r, 1));
    expect(pieces[1]).toEqual({ i: 1, waitMs: 2300, inHand: false });
    q.stop();
  });

  it('the trip sums the waits into one clause: typical, longest and where it came from', () => {
    const store = new Map();
    const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
    let t = 1_700_000_000_000;
    const log = createTripLog({ storage, now: () => t });
    log.start({ title: 'The Step and the Wait', pieces: 4 });
    log.note('voice', { kind: 'audio' });
    log.note('piece', { i: 0, waitMs: 900, inHand: false });
    log.note('piece', { i: 1, waitMs: 100, inHand: true });
    log.note('piece', { i: 2, waitMs: 2300, inHand: false });
    log.note('piece', { i: 3, waitMs: 200, inHand: true });
    t += 60_000;
    const trip = log.end('ended');
    expect(trip.waits).toEqual({ n: 4, sumMs: 3500, maxMs: 2300, maxAt: 2, maxFetched: true, fetched: 2, long: 1 });
    expect(waitsLine(trip.waits)).toBe('waits between sentences: typical 0.9 s, longest 2.3 s at sentence 3 (fetched), 1 over 1.0 s; 2 of 4 fetched while you waited');
    expect(tripSummary(trip)).toMatch(/played to the end · waits between sentences: typical 0\.9 s, longest 2\.3 s at sentence 3 \(fetched\)/);
    expect(LONG_WAIT_MS).toBe(1000);
  });

  it('a trip without waits says nothing about them (every older trip on every device)', () => {
    expect(waitsLine(undefined)).toBe('');
    expect(waitsLine({ n: 0 })).toBe('');
  });

  it('the reader passes the queue’s measurement into the trip', () => {
    const hook = SRC('lib/use-read-aloud.js');
    expect(hook).toMatch(/onPiece: \(i, w\) => \{[^\n]*trip\(\)\.note\('piece', \{ i, \.\.\.\(w \|\| \{\}\) \}\)/);
  });
});
