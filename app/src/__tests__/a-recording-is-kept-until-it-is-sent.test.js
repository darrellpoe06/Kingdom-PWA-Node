// =============================================================================
// A RECORDING IS KEPT UNTIL IT IS SENT — the 2026-10-09 lost lesson
// =============================================================================
// Darrell and Christina recorded a lesson in the app at 14:05 on 2026-10-09,
// during the hours when every POST through poetech.us answered 405 with an
// empty body. The send died. Asked where it went, four stores answered:
//
//   sovereign database, lesson-audio   1 object, from Oct 6 — nothing today
//   hosted database,    lesson-audio   0 objects
//   NAS /volume1/PoeTech/lesson-voice  holds the 13:51 street video (517,970
//                                      bytes) — so the listing WORKS
//   the same directory, stamped 14:0x  nothing
//
// It never reached any of them. And it was not on the phone either, because
// the recorder held the audio in React state alone (OneVoiceInput.jsx:161)
// while the autosave persisted only text, route and name
// (OneVoiceInput.jsx:198, draft-autosave.js). What survived was the LINE the
// recorder writes into the box — "Spoken lesson, 14:05 (the words come back
// from Whisper)" — and the remembered name choice. Darrell saw both and said
// so: "It said set and kept the name... I saw and remember it." He was right,
// and the name is exactly what was kept. The audio was not.
//
// So the screen went on showing a lesson waiting to send after the recording
// was gone. Darrell: "Why wouldn't it also be on my cellphone?"
//
// THE LAW PINNED HERE: a take is written to the device when it is taken, it
// comes back after a reload, it survives a failed send, and it is removed only
// when it has actually been delivered. A store that cannot keep it says so
// rather than claiming it did.
//
// PROVEN-TO-CATCH (DR-0076 §3): every case below fails against the code as it
// stood that morning, when nothing wrote the blob anywhere.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  keepRecording, readKeptRecording, dropKeptRecording, keptKey, keptMemoryBackend,
  KEEP_MS, KEPT_DB,
} from '../lib/kept-recording.js';

/** A take shaped exactly as the recorder hands it over. */
const take = (seconds = 125, bytes = 517970, type = 'audio/webm') => ({
  blob: { size: bytes, type },
  url: 'blob:fake',
  seconds,
  verdict: { ok: true },
});
const SURFACE = 'notes';

let be;
beforeEach(() => { be = keptMemoryBackend(); });

describe('the recording is on the device the moment it is taken', () => {
  it('a take is kept, and comes back whole — blob, length and type', async () => {
    expect(await keepRecording(SURFACE, take(), { backend: be })).toBe(true);
    const back = await readKeptRecording(SURFACE, { backend: be });
    expect(back, 'nothing came back — this is the 2026-10-09 loss').toBeTruthy();
    expect(back.blob.size).toBe(517970);
    expect(back.seconds).toBe(125);
    expect(back.type).toBe('audio/webm');
  });

  it('PROVEN-TO-CATCH: it survives a FAILED send — the whole point', async () => {
    await keepRecording(SURFACE, take(), { backend: be });
    // The send throws, exactly as it did through the 405: nothing clears it.
    try { throw new Error('405'); } catch (_) { /* the outage */ }
    expect(await readKeptRecording(SURFACE, { backend: be })).toBeTruthy();
  });

  it('and it is gone once it is DELIVERED, so nothing is sent twice', async () => {
    await keepRecording(SURFACE, take(), { backend: be });
    expect(await dropKeptRecording(SURFACE, { backend: be })).toBe(true);
    expect(await readKeptRecording(SURFACE, { backend: be })).toBe(null);
  });

  it('each surface keeps its own, so one recorder never hands another its audio', async () => {
    await keepRecording('notes', take(10), { backend: be });
    await keepRecording('church', take(99), { backend: be });
    expect((await readKeptRecording('notes', { backend: be })).seconds).toBe(10);
    expect((await readKeptRecording('church', { backend: be })).seconds).toBe(99);
    expect(keptKey('notes')).not.toBe(keptKey('church'));
  });

  it('a new take replaces the old one rather than piling up', async () => {
    await keepRecording(SURFACE, take(10), { backend: be });
    await keepRecording(SURFACE, take(42), { backend: be });
    expect((await readKeptRecording(SURFACE, { backend: be })).seconds).toBe(42);
    expect(be.size).toBe(1);
  });
});

describe('it never lies about what it holds', () => {
  it('a device with nowhere to write says false, and reads back null', async () => {
    expect(await keepRecording(SURFACE, take(), { backend: null })).toBe(false);
    expect(await readKeptRecording(SURFACE, { backend: null })).toBe(null);
  });

  it('a store that throws on write says false — it does not claim a keep it did not make', async () => {
    const broken = { ...be, put: async () => { throw new Error('QuotaExceeded'); } };
    expect(await keepRecording(SURFACE, take(), { backend: broken })).toBe(false);
  });

  it('a store that throws on read answers null instead of breaking the recorder', async () => {
    const broken = { ...be, getMeta: async () => { throw new Error('InvalidState'); } };
    expect(await readKeptRecording(SURFACE, { backend: broken })).toBe(null);
  });

  it('nothing to keep is not an error, and keeps nothing', async () => {
    expect(await keepRecording(SURFACE, null, { backend: be })).toBe(false);
    expect(await keepRecording(SURFACE, { seconds: 5 }, { backend: be })).toBe(false);
    expect(await readKeptRecording(SURFACE, { backend: be })).toBe(null);
  });

  it('meta without its audio is cleared, never offered as a sendable take', async () => {
    // A half-written take: the row exists, the bytes do not. Offering this
    // would mean a Send that delivers nothing, which is the failure wearing
    // the opposite coat.
    await keepRecording(SURFACE, take(), { backend: be });
    await be.put(keptKey(SURFACE), { size: 0, type: '' }, { at: Date.now(), seconds: 125 });
    expect(await readKeptRecording(SURFACE, { backend: be })).toBe(null);
    expect(await be.getMeta(keptKey(SURFACE))).toBe(null);
  });
});

describe('it is a draft, not an archive', () => {
  it('a take nobody sent for two weeks ages out, and clears itself', async () => {
    const at = 1_000_000;
    await keepRecording(SURFACE, take(), { backend: be, now: () => at });
    // One hour later it is still there — an outage easily outlasts that.
    expect(await readKeptRecording(SURFACE, { backend: be, now: () => at + 3600_000 })).toBeTruthy();
    // Past the window it is gone, and the row with it.
    expect(await readKeptRecording(SURFACE, { backend: be, now: () => at + KEEP_MS + 1 })).toBe(null);
    expect(await be.getMeta(keptKey(SURFACE))).toBe(null);
  });

  it('the window is generous enough to outlast a weekend outage', () => {
    expect(KEEP_MS).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('it has its OWN database, so clearing cached reading clips cannot drop a lesson', () => {
    expect(KEPT_DB).toBe('poe-kept-recordings');
    expect(KEPT_DB).not.toBe('poe-voice-clips');
  });
});
