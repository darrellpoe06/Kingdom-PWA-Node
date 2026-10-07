// @vitest-environment node
// =============================================================================
// The voice stays clear: the player stretches nothing it can ask the voice for
// (2026-10-07, DR-0794)
// =============================================================================
// Darrell, on the Firestick, the male stand-in reading: "Why does the male
// voice sound like it's slowing down while it's talking? Not able to
// correctly enunciate words... etc... all the time... it should be clear and
// understandable..."
//
// Measured against the code as it was:
//   • the reading pinned its voice pace ONCE (voiceSpeedFor(rate) at Play);
//     a speed change mid-reading left the element to stretch every later
//     piece — 1.5x pieces at a 1x rate = playbackRate 0.667, a drawl that
//     smears the words;
//   • a saved reading at any speed but 1x was always the 1x pieces stretched
//     by the element, never spoken at that pace;
//   • nothing measured what the device did with the sound: how long a clip
//     was, how long it took to play, what rate the element was set to.
// The contract pinned here:
//   • the queue asks the voice again at the new pace from the next piece on
//     (pending prefetches at the old pace are dropped), so after a speed
//     change the element stretches nothing;
//   • a joined file carries the pace its pieces were spoken at; the element
//     takes only the remainder;
//   • every piece's pace is reported (chars, clip length, wall time, element
//     rate, voice pace; a paused piece is marked), the trip sums them, and
//     the panel's line says it in words;
//   • the reading joins the pace's own pieces first and stretches a saved 1x
//     file only when the NAS voice cannot be reached.
// Proven-to-catch: each test fails against the code as it was.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClipQueue, chunkForClips, PREFETCH_AHEAD } from '../lib/clip-queue.js';
import { createTripLog, tripSummary, paceLine, DRAG_RATIO } from '../lib/reader-trip.js';
import { voiceSpeedFor } from '../lib/voice-service.js';

const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');
const tick = async () => { for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0)); };

/** A fake element whose clock the test owns; it fires 'pause' like a browser. */
function audioEl(clock) {
  const handlers = {};
  return {
    src: '', paused: true, ended: false, playbackRate: 1, defaultPlaybackRate: 1, duration: NaN, currentTime: 0,
    play() { this.paused = false; this.ended = false; return Promise.resolve(); },
    pause() { this.paused = true; (handlers.pause || []).forEach((f) => f()); },
    addEventListener(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    removeEventListener(ev, fn) { handlers[ev] = (handlers[ev] || []).filter((f) => f !== fn); },
    /** The clip plays through: `seconds` of audio, `wallMs` on the clock. */
    finish(seconds, wallMs) { this.duration = seconds; clock.t += wallMs; this.ended = true; this.paused = true; (handlers.pause || []).forEach((f) => f()); this.onended(); },
  };
}

const TEXT = 'One sentence here. Two sentence here. Three sentence here. Four sentence here. Five sentence here.';

describe('a speed change asks the voice again at the new pace', () => {
  it('from the next piece on, pieces are fetched at the new pace and the element stretches nothing; the old prefetches are dropped', async () => {
    const chunks = chunkForClips(TEXT);
    const clock = { t: 0 };
    const audio = audioEl(clock);
    const asked = [];
    const rates = [];
    const q = createClipQueue({
      chunks, audio, rate: 1.5, now: () => clock.t,
      paceFor: (r) => voiceSpeedFor(r),
      fetchClip: async (t, i, pace) => { asked.push([i, pace]); return { url: `blob:${i}@${pace}`, speed: pace }; },
      onPiece: () => rates.push(audio.playbackRate),
    });
    await q.start();
    await tick();
    expect(q.pace).toBe(1.5);
    expect(asked.slice(0, 1 + PREFETCH_AHEAD).every(([, p]) => p === 1.5)).toBe(true);
    // The listener slows to 1x while sentence 1 plays.
    q.setRate(1);
    // The piece on the element takes the remainder (the one stretch that is left)...
    expect(audio.playbackRate).toBeCloseTo(1 / 1.5, 3);
    expect(q.pace).toBe(1);
    await tick();
    // ...and the pending pieces were asked for again at 1x.
    const afterChange = asked.slice(1 + PREFETCH_AHEAD);
    expect(afterChange.length).toBe(PREFETCH_AHEAD);
    expect(afterChange.every(([, p]) => p === 1)).toBe(true);
    audio.finish(1.2, 1200); await tick();
    expect(audio.src).toBe('blob:1@1');
    expect(audio.playbackRate).toBe(1);
    audio.finish(1.2, 1200); await tick();
    expect(audio.src).toBe('blob:2@1');
    expect(audio.playbackRate).toBe(1);
    // Every piece after the change is asked at the new pace, never the old.
    expect(asked.slice(1 + PREFETCH_AHEAD).every(([, p]) => p === 1)).toBe(true);
    expect(rates.slice(1).every((r) => r === 1)).toBe(true);
  });

  it('a speed change to the same pace drops nothing (the remainder is re-applied, as before)', async () => {
    const chunks = chunkForClips(TEXT);
    const clock = { t: 0 };
    const audio = audioEl(clock);
    const asked = [];
    const q = createClipQueue({
      chunks, audio, rate: 3, now: () => clock.t,
      paceFor: (r) => voiceSpeedFor(r),
      fetchClip: async (t, i, pace) => { asked.push([i, pace]); return { url: `blob:${i}`, speed: pace }; },
    });
    await q.start(); await tick();
    const before = asked.length;
    q.setRate(2.5); // both clamp to the voice's 2x
    await tick();
    expect(asked.length).toBe(before);
    expect(audio.playbackRate).toBe(1.25);
  });

  it('without paceFor the queue behaves exactly as before: fetchClip gets a null pace and setRate only re-applies the remainder', async () => {
    const chunks = chunkForClips(TEXT);
    const clock = { t: 0 };
    const audio = audioEl(clock);
    const asked = [];
    const q = createClipQueue({ chunks, audio, rate: 2, now: () => clock.t, fetchClip: async (t, i, pace) => { asked.push(pace); return { url: `blob:${i}`, speed: 2 }; } });
    await q.start(); await tick();
    expect(q.pace).toBe(null);
    expect(asked.every((p) => p === null)).toBe(true);
    const n = asked.length;
    q.setRate(1); await tick();
    expect(asked.length).toBe(n);
    expect(audio.playbackRate).toBe(0.5);
  });
});

describe('a joined file carries its pace', () => {
  it('pieces spoken at 1.5x joined into one file play at 1x at a 1.5x rate; a join that names no pace is the saved 1x file, stretched', async () => {
    const chunks = chunkForClips('One sentence here. Two sentence here.');
    const clock = { t: 0 };
    const a1 = audioEl(clock);
    const q1 = createClipQueue({ chunks, audio: a1, rate: 1.5, now: () => clock.t, fetchClip: async (t, i) => ({ url: `blob:${i}`, speed: 1.5 }) });
    expect(q1.join({ url: 'blob:joined@1.5', offsets: [0, 1.2], duration: 2.4, speed: 1.5 })).toBe(true);
    await q1.start();
    expect(a1.src).toBe('blob:joined@1.5');
    expect(a1.playbackRate).toBe(1);
    const a2 = audioEl(clock);
    const q2 = createClipQueue({ chunks, audio: a2, rate: 1.5, now: () => clock.t, fetchClip: async (t, i) => ({ url: `blob:${i}`, speed: 1.5 }) });
    q2.join({ url: 'blob:joined@1', offsets: [0, 1.2], duration: 2.4 });
    await q2.start();
    expect(a2.playbackRate).toBe(1.5);
  });
});

describe('the pace of every piece is measured', () => {
  it('reports chars, clip length, wall time, element rate and voice pace per piece; a paused piece is marked', async () => {
    const chunks = chunkForClips(TEXT);
    const clock = { t: 0 };
    const audio = audioEl(clock);
    const paces = [];
    const q = createClipQueue({
      chunks, audio, rate: 1.5, now: () => clock.t,
      paceFor: (r) => voiceSpeedFor(r),
      fetchClip: async (t, i, pace) => ({ url: `blob:${i}`, speed: pace }),
      onPace: (d) => paces.push(d),
    });
    await q.start(); await tick();
    audio.finish(1.6, 1600); await tick();   // played in its own length
    audio.finish(1.6, 2400); await tick();   // dragged: 1.5x its length
    audio.pause(); clock.t += 5000; audio.play(); // the listener paused inside sentence 3
    audio.finish(1.6, 6600); await tick();
    expect(paces.length).toBe(3);
    expect(paces[0]).toMatchObject({ i: 0, chars: chunks[0].text.length, clipS: 1.6, wallMs: 1600, paused: false, playbackRate: 1, pieceSpeed: 1.5 });
    expect(paces[1]).toMatchObject({ i: 1, clipS: 1.6, wallMs: 2400, paused: false });
    expect(paces[2]).toMatchObject({ i: 2, paused: true });
  });

  it('a joined reading reports each piece from its offsets', async () => {
    const chunks = chunkForClips('One sentence here. Two sentence here. Three sentence here.');
    const clock = { t: 0 };
    const audio = audioEl(clock);
    const paces = [];
    const q = createClipQueue({ chunks, audio, rate: 1, now: () => clock.t, fetchClip: async () => ({ url: 'x' }), onPace: (d) => paces.push(d) });
    q.join({ url: 'blob:joined', offsets: [0, 1.5, 3.0], duration: 4.5, speed: 1 });
    await q.start(); await tick();
    clock.t += 1500; audio.currentTime = 1.5; audio.ontimeupdate();
    clock.t += 1500; audio.currentTime = 3.0; audio.ontimeupdate();
    clock.t += 1800; audio.duration = 4.5; audio.finish(4.5, 0);
    expect(paces.map((p) => [p.i, p.clipS, p.wallMs])).toEqual([[0, 1.5, 1500], [1, 1.5, 1500], [2, 1.5, 1800]]);
  });
});

describe('the trip says the pace in one line', () => {
  const log = () => { const store = new Map(); return createTripLog({ storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }, now: () => 1000 }); };

  it('steady 1x after a pace-spoken reading: the voice spoke at 1.5x, the player stretched nothing, letters a second, no drag', () => {
    const t = log(); t.start({ title: 'L1', pieces: 3 });
    for (let i = 0; i < 3; i++) t.note('pace', { i, chars: 60, clipS: 4, wallMs: 4100, paused: false, playbackRate: 1, pieceSpeed: 1.5 });
    const line = paceLine(t.last().pace);
    expect(line).toContain('the voice spoke at 1.5×');
    expect(line).toContain('the player stretched nothing');
    expect(line).toContain('about 15 letters a second reached the ear');
    expect(line).toMatch(/played 3 sentences in 1\.0[0-9]?× their length \(no drag\)/);
    t.end('ended');
    expect(tripSummary(t.last())).toContain('pace: the voice spoke at 1.5×');
  });

  it('a below-1x stretch is named as the slur; a dragged device is counted with its worst sentence; a paused piece does not count as drag', () => {
    const t = log(); t.start({ pieces: 4 });
    t.note('pace', { i: 0, chars: 60, clipS: 4, wallMs: 2700, paused: false, playbackRate: 1.5, pieceSpeed: 1 });
    t.note('pace', { i: 1, chars: 60, clipS: 4, wallMs: 6000, paused: false, playbackRate: 0.667, pieceSpeed: 1.5 });
    t.note('pace', { i: 2, chars: 60, clipS: 4, wallMs: 9000, paused: false, playbackRate: 0.667, pieceSpeed: 1.5 }); // 1.5x its length
    t.note('pace', { i: 3, chars: 60, clipS: 4, wallMs: 60000, paused: true, playbackRate: 0.667, pieceSpeed: 1.5 });
    const p = t.last().pace;
    expect(p.n).toBe(4);
    expect(p.timed).toBe(3);
    expect(p.dragged).toBe(1);
    expect(p.worstAt).toBe(2);
    const line = paceLine(p);
    expect(line).toContain('the voice spoke at more than one pace');
    expect(line).toContain('between 0.67× and 1.5×');
    expect(line).toContain('(below 1× slurs the words)');
    expect(line).toContain(`dragged 1 of 3 sentences past ${DRAG_RATIO}× their length (worst 1.5× at sentence 3)`);
  });

  it('no pace notes: no line', () => {
    const t = log(); t.start({});
    expect(paceLine(t.last().pace)).toBe('');
    expect(tripSummary(t.last())).not.toContain('pace:');
  });

  it('a stretched last-resort join is said plainly', () => {
    const t = log(); t.start({ pieces: 2 });
    t.note('join', { pieces: 2, seconds: 30, speed: 1, stretched: true });
    t.end('ended');
    expect(tripSummary(t.last())).toContain('the saved 1× pieces, stretched by the player because the NAS voice could not be reached');
  });
});

describe('the reading joins the pace\'s own pieces first (source contract)', () => {
  const src = SRC('lib/use-read-aloud.js');
  it('the queue gets paceFor and onPace on both audio voices, and fetchClip takes the pace', () => {
    expect((src.match(/\n\s+paceFor,\n/g) || []).length).toBe(2);
    expect((src.match(/onPace: \(d\) => \{ if \(queueRef\.current === q\) trip\(\)\.note\('pace', d\); \}/g) || []).length).toBe(2);
    expect((src.match(/fetchClip: \(t, i, sp\) =>/g) || []).length).toBe(2);
  });
  it('the pace\'s pieces join first; the 1x file is the last resort, marked stretched; a join at a pace the chip left is not made', () => {
    expect(src).toMatch(/let whole = await joinFromDevice\(pinned\);/);
    expect(src).toMatch(/if \(first && \(first\.error \|\| !first\.url\) && pinned !== 1\) \{\s*\n\s*const saved = await joinFromDevice\(1, \{ stretched: true \}\);/);
    expect(src).toMatch(/if \(q\.pace !== pinned\) return;/);
    expect(src).toMatch(/speed: sp, stretched, buildMs/);
  });
  it('each pace has its own source and keys', () => {
    expect(src).toMatch(/const keysFor = \(sp\) => \(sp === 1 \? savedKeys :/);
    expect(src).toMatch(/const sourceFor = \(sp\) => \{/);
    expect(src).toMatch(/fetchBlob: \(i, timeoutMs\) => speakPiece\(chunks\[i\]\.text, timeoutMs, sp\)/);
  });
});
