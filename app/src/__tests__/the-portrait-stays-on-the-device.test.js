// @vitest-environment jsdom
// THE PORTRAIT STAYS ON THE DEVICE (DR-0430) — likeness-reference pins.
import { describe, it, expect } from 'vitest';
import { portraitKey, isUsablePortrait, savePortrait, loadPortrait, hasPortrait, clearPortrait } from '../lib/likeness-reference.js';

const img = (n = 5000, type = 'image/jpeg') => new Blob([new Uint8Array(n)], { type });

describe('pure helpers', () => {
  it('keys by person, and only a real image with bytes is usable', () => {
    expect(portraitKey('darrell')).toBe('portrait:darrell');
    expect(isUsablePortrait(img())).toBe(true);
    expect(isUsablePortrait(img(100))).toBe(false);
    expect(isUsablePortrait(new Blob([new Uint8Array(5000)], { type: 'audio/wav' }))).toBe(false);
    expect(isUsablePortrait(null)).toBe(false);
  });
});

describe('save / load / clear (memory fallback where IndexedDB is absent, as in jsdom)', () => {
  it('round-trips a portrait and clears it', async () => {
    expect(await hasPortrait('darrell')).toBe(false);
    expect(await savePortrait('darrell', img())).toBe(true);
    expect(await hasPortrait('darrell')).toBe(true);
    const got = await loadPortrait('darrell');
    expect(got && got.size).toBe(5000);
    await clearPortrait('darrell');
    expect(await hasPortrait('darrell')).toBe(false);
  });
  it('refuses to store something that is not a usable portrait', async () => {
    expect(await savePortrait('darrell', img(10))).toBe(false);
    expect(await hasPortrait('darrell')).toBe(false);
  });
});
