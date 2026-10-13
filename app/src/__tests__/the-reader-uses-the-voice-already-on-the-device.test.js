// =============================================================================
// THE READER USES THE PIPER ALREADY ON THIS DEVICE, BEFORE THE DEVICE'S OWN
// =============================================================================
// Darrell, 2026-10-10, on the Firestick: "Words keep slurring not articulate
// or even decernable... we need other strategies for making the reader read
// appropriately. Opportunities and constraints!!!"
//
// WHY IT SLURS, measured the same day by the outside-in site probe rather than
// guessed: the Cloudflare Pages Functions have not run since 2026-10-09
// (issue #2057), so EVERY NAS-backed road is dark at once — /sb, /cams and,
// for the reader, /voice. Piper on the NAS is not sounding bad; it never
// plays. Each piece fails and the reading falls through to Web Speech, which
// on a Fire TV is Fire OS's own engine. That fall-through is the slurring.
//
// THE OPPORTUNITY THAT WAS ALREADY BUILT. lib/device-voice.js runs the SAME
// Piper model the NAS runs — espeak-ng phonemizer in WASM, onnxruntime-web,
// phoneme ids measured 10/10 identical to the NAS binary — in a Web Worker on
// this device's own CPU, from Cache Storage, with no network at all. Its
// header has said since DR-0656: "Not wired into the reader yet." So the good
// voice was on the device and the reader was not allowed to ask for it.
//
// This pins the POLICY, which is where the judgement lives. The three limits
// are each real rather than cautious:
//   * pace 1 only — the device worker takes no speed, and a clip filed under
//     a fast key would be played without the stretch that key implies, which
//     is the WRONG PACE, worse than the wrong voice;
//   * already downloaded only — ~63 MB of model plus ~14 MB of runtime is not
//     something to pull silently because a reading stumbled;
//   * faster than real time, MEASURED on the first piece — whether a
//     low-power ARM stick runs ONNX on single-threaded WASM ahead of its own
//     playback cannot be answered from a sandbox, so it is measured rather
//     than assumed, and the voice stands down if it cannot keep up.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  realtimeFactor, keepsAhead, mayUseDeviceVoice, standDownReason,
  MIN_REALTIME, DEVICE_VOICE_PACE,
} from '../lib/device-voice-fallback.js';

describe('can this device keep ahead of its own voice', () => {
  it('PROVEN-TO-CATCH: a stick slower than real time is caught, not trusted', () => {
    // Four seconds of speech that took six seconds to make: 0.67x.
    expect(keepsAhead({ ms: 6000, audioSeconds: 4 })).toBe(false);
  });

  it('a device comfortably ahead is used', () => {
    // Four seconds of speech in one second: 4x.
    expect(keepsAhead({ ms: 1000, audioSeconds: 4 })).toBe(true);
  });

  it('exactly real time is NOT good enough — there is a next piece to make', () => {
    expect(realtimeFactor({ ms: 4000, audioSeconds: 4 })).toBe(1);
    expect(keepsAhead({ ms: 4000, audioSeconds: 4 })).toBe(false);
    expect(MIN_REALTIME).toBeGreaterThan(1);
  });

  it('unknown is never "fast enough" — it answers null, and null is not true', () => {
    // DR-0076 §8: an unmeasurable device must not be assumed good.
    expect(keepsAhead({})).toBeNull();
    expect(keepsAhead({ ms: 0, audioSeconds: 4 })).toBeNull();
    expect(keepsAhead({ ms: 1000, audioSeconds: 0 })).toBeNull();
    expect(keepsAhead(undefined)).toBeNull();
  });
});

describe('when the reader may ask the device voice', () => {
  const READY = { ready: true, stoodDown: false };

  it('PROVEN-TO-CATCH: at pace 1, with the model downloaded, yes', () => {
    expect(mayUseDeviceVoice({ ...READY, speed: 1 })).toBe(true);
    expect(DEVICE_VOICE_PACE).toBe(1);
  });

  it('never at another pace — the worker takes no speed, so the clip would play wrong', () => {
    for (const speed of [0.5, 1.25, 1.5, 2]) {
      expect(mayUseDeviceVoice({ ...READY, speed })).toBe(false);
    }
  });

  it('never when the model is not already on the device', () => {
    // ~63 MB of model and ~14 MB of runtime is not a silent download.
    expect(mayUseDeviceVoice({ speed: 1, ready: false })).toBe(false);
  });

  it('never again once a piece proved this device too slow', () => {
    expect(mayUseDeviceVoice({ speed: 1, ready: true, stoodDown: true })).toBe(false);
  });

  it('defaults refuse rather than assume', () => {
    expect(mayUseDeviceVoice()).toBe(false);
    expect(mayUseDeviceVoice({})).toBe(false);
  });
});

describe('what the listener is told when it stands down', () => {
  it('says what happened and what helps, not which subsystem failed', () => {
    const s = standDownReason(0.7);
    expect(s).toMatch(/slower than it speaks/);
    expect(s).toMatch(/saved while you are on wifi/);
    expect(s).not.toMatch(/ONNX|WASM|worker|onnxruntime/i);
  });

  it('is still a sentence when there is no measurement', () => {
    expect(standDownReason(null)).toMatch(/could not be measured/);
  });
});

describe('the device voice answers in the shape the reader already consumes', () => {
  it('returns the blob, the format and which engine spoke', async () => {
    // synthesizeLite answers { url, blob, format, engine } — the clip cache
    // keeps the BLOB and the player asks the clip its FORMAT. Without those
    // two fields this is not a drop-in, however good the audio is.
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'device-voice.js'), 'utf8');
    expect(src).toContain('blob, format: \'wav\', engine: \'device-voice\'');
  });

  it('the reader reaches for it only after the NAS piece failed', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'use-read-aloud.js'), 'utf8');
    // The NAS voice stays first: this is a fallback, not a replacement.
    expect(src).toContain('if (got.error) {\n        const d = await deviceVoicePiece(');
    // And it is taken at the synthesis seam, so the cache, the join, the saved
    // reading and the background player all keep working unchanged.
    expect(src).toContain('const speakPiece = async (t, timeoutMs, sp) => {');
  });
});
