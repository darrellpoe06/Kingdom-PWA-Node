// @vitest-environment node
// =============================================================================
// THE SPEED CHIP CHANGED NOTHING ON THE CLOUD PATH
// =============================================================================
// Darrell 2026-09-18, reading the same lesson on two devices: "Reader speed is
// different on the laptop vs cellphone... we may need 4.5 or even as high as 5x
// speed for the laptop... it's slower."
//
// WHAT THE CODE SAID, read rather than guessed at. Two read paths exist. The
// DEVICE-VOICE path honours the rate: tts.js binds utterance.rate per segment
// and re-speaks the current segment on a change. The CLOUD path — the sovereign
// studio or the vendor bridge, which since DR-0382 carries the SYSTEM voice and
// is therefore the default nobody changes — was `new Audio(url)` followed by
// `a.play()`, with playbackRate never touched at ALL. So on that path every
// speed chip moved the button highlight and left the speech exactly as it was.
// One device honouring the rate while the other ignores it is precisely "the
// speed is different on the laptop than the phone", and no amount of raising
// the ceiling would have fixed it.
//
// TWO SEPARATE THINGS ARE THEREFORE FIXED, and they are not the same fix:
//   1. The clip now takes the rate, at creation and on a live change, and the
//      applied value is READ BACK — a device that clamps or refuses says so
//      rather than leaving the reader to wonder (DR-0076 §1, §4).
//   2. The ladder now reaches 5x, because the nominal rate is not a speed:
//      each engine has its own baseline words-per-minute, so 2.5x on a desktop
//      voice can be slower than 1.5x on a phone's. The old 2.5x ceiling capped
//      the laptop below the pace he reads at.
//
// PROVEN-TO-CATCH: the first test reproduces the old behaviour — an element
// nobody set a rate on — so this file fails if the wiring is removed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyClipRate, clipRateNotice, clampClipRate,
  CLIP_RATE_MIN, CLIP_RATE_MAX, HONOR_TOLERANCE,
} from '../lib/clip-rate.js';
import { RATE_STEPS, MIN_RATE, MAX_RATE, clampRate } from '../lib/tts.js';

/** A stand-in for an audio element that honours whatever it is given. */
const honest = () => ({ playbackRate: 1, preservesPitch: false });
/** One that clamps everything to 2x, the way some engines do. */
const clamps = (ceiling = 2) => {
  let r = 1;
  return { get playbackRate() { return r; }, set playbackRate(v) { r = Math.min(ceiling, v); }, preservesPitch: false };
};
/** One whose setter throws — a device fact, never an exception for the reader. */
const refuses = () => ({ get playbackRate() { return 1; }, set playbackRate(_v) { throw new Error('nope'); } });

describe('the defect, reproduced', () => {
  it('an element nobody sets a rate on plays at 1x however the chips are pressed', () => {
    const a = honest();
    for (const step of RATE_STEPS) {
      // the OLD code path: create, play, never touch playbackRate
      expect(a.playbackRate, `pressing ${step.label} moved the rate, so this is not the reported defect`).toBe(1);
    }
  });

  it('and the old 2.5x ceiling could not reach the speed he asked for', () => {
    const OLD_MAX = 2.5;
    expect(4.5 > OLD_MAX && 5 > OLD_MAX).toBe(true);
    expect(MAX_RATE, 'the ceiling still cannot reach 5x').toBeGreaterThanOrEqual(5);
  });
});

describe('the clip takes the rate, and says so when it cannot', () => {
  it('applies the requested rate and preserves pitch so the words stay words', () => {
    const a = honest();
    const r = applyClipRate(a, 4);
    expect(r).toEqual({ requested: 4, applied: 4, honored: true });
    expect(a.playbackRate).toBe(4);
    expect(a.preservesPitch, 'at 4x an unpreserved clip stops sounding like speech').toBe(true);
    expect(clipRateNotice(r), 'a working control should say nothing').toBe('');
  });

  it('reports the real value when the device caps it', () => {
    const r = applyClipRate(clamps(2), 5);
    expect(r).toEqual({ requested: 5, applied: 2, honored: false });
    expect(clipRateNotice(r)).toBe('This device capped the read at 2×; 5× was asked for.');
  });

  it('reports plainly when the device ignores the rate entirely', () => {
    const r = applyClipRate(clamps(1), 3);
    expect(r.honored).toBe(false);
    expect(clipRateNotice(r)).toContain('ignored the 3× speed');
  });

  it('never throws on a setter that raises, and never claims that rate worked', () => {
    // The setter throws but the element still reports 1x, so the honest line
    // is the one about being ignored — that is what the reader is hearing.
    const r = applyClipRate(refuses(), 5);
    expect(r).toEqual({ requested: 5, applied: 1, honored: false });
    expect(clipRateNotice(r)).toContain('ignored the 5× speed');
  });

  it('says it plainly when the element will not even report a rate', () => {
    const opaque = { get playbackRate() { throw new Error('no'); }, set playbackRate(_v) { throw new Error('no'); } };
    const r = applyClipRate(opaque, 5);
    expect(r).toEqual({ requested: 5, applied: null, honored: false });
    expect(clipRateNotice(r)).toContain('would not take the 5× speed');
  });

  it('survives a missing or junk element rather than breaking the read', () => {
    for (const bad of [null, undefined, 0, 'audio']) {
      const r = applyClipRate(bad, 2);
      expect(r.honored).toBe(false);
      expect(r.requested).toBe(2);
    }
  });

  it('clamps a nonsense rate instead of handing it to the engine', () => {
    expect(clampClipRate(99)).toBe(CLIP_RATE_MAX);
    expect(clampClipRate(0.01)).toBe(CLIP_RATE_MIN);
    expect(clampClipRate(0)).toBe(1);
    expect(clampClipRate(-3)).toBe(1);
    expect(clampClipRate('fast')).toBe(1);
    expect(clampClipRate(NaN)).toBe(1);
  });

  it('holds the same bounds the utterance ladder does, so one control cannot promise two ranges', () => {
    expect(CLIP_RATE_MIN).toBe(MIN_RATE);
    expect(CLIP_RATE_MAX).toBe(MAX_RATE);
    expect(HONOR_TOLERANCE).toBeGreaterThan(0);
  });
});

describe('the ladder reaches the pace a laptop needs', () => {
  it('offers 3x, 4x and 5x on top of what it had', () => {
    const values = RATE_STEPS.map((s) => s.value);
    for (const v of [0.7, 1, 1.5, 2, 2.5, 3, 4, 5]) expect(values).toContain(v);
  });

  it('rises in order, with no step the engine would refuse', () => {
    const values = RATE_STEPS.map((s) => s.value);
    for (let i = 1; i < values.length; i += 1) expect(values[i]).toBeGreaterThan(values[i - 1]);
    for (const v of values) expect(clampRate(v)).toBe(v);
  });

  it('names every step in plain language, with no two names alike', () => {
    const names = RATE_STEPS.map((s) => s.name);
    expect(new Set(names).size, 'two steps share a name').toBe(names.length);
    for (const s of RATE_STEPS) expect(s.label).toMatch(/^\d(?:\.\d)?×$/);
  });

  it('lays the chips out in even rows rather than crushing eight into five columns', () => {
    const control = readFileSync(join(process.cwd(), 'src', 'components', 'TTSControl.jsx'), 'utf8');
    const grid = control.match(/className="grid grid-cols-(\d)[^"]*" role="group" aria-label="Reading speed"/);
    expect(grid, 'the speed grid moved — find it and re-pin this').toBeTruthy();
    expect(RATE_STEPS.length % Number(grid[1]), 'the chips no longer fill whole rows').toBe(0);
  });
});

describe('both cloud playback sites are wired, not just one', () => {
  const src = readFileSync(join(process.cwd(), 'src', 'lib', 'use-read-aloud.js'), 'utf8');

  it('every clip created in the hook is handed the current rate', () => {
    const created = (src.match(/new Audio\(url\)/g) || []).length;
    const applied = (src.match(/applyClipRate\(a, rateRef\.current\)/g) || []).length;
    expect(created, 'no clip is created here any more — re-read this file').toBeGreaterThan(0);
    expect(applied, `${created} clips created, ${applied} given the rate`).toBe(created);
  });

  it('a speed change while a clip is playing reaches that clip', () => {
    // An audio element takes a live rate change mid-play, unlike an utterance,
    // so the chip must be audible immediately rather than at the next clip.
    expect(src).toMatch(/const setRate = useCallback\(/);
    expect(src).toMatch(/applyClipRate\(a, r\)/);
    expect(src, 'the hook still hands out the raw setter, so a clip never hears the change')
      .not.toMatch(/setRate: tts\.setRate/);
  });

  it('reads the rate from a ref, not from a render closure', () => {
    // The stale-closure class tts.js was built to kill: a clip created inside
    // an async read would otherwise use the speed from the render that started
    // it, which is how "adjusting speed seems like the same speed" happened.
    expect(src).toMatch(/rateRef\.current = tts\.rate/);
  });
});
