// Build freshness indicator — the gate for the green/red dot next to the build
// stamp. REQUIRED behavior: latest build -> GREEN "Latest"; a newer build
// waiting -> RED "Update available". Locked here against the pure logic in
// lib/freshness.js (no real service worker / browser needed).
import { describe, it, expect } from 'vitest';
import {
  freshnessDescriptor, updateWaiting, FRESH_COLOR, STALE_COLOR,
} from '../lib/freshness.js';

// --- Relative luminance + contrast (WCAG 2.1) so the dot's >=3:1 non-text
//     contrast (1.4.11) is VERIFIED, not asserted by eye. ---
function relLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b) {
  const la = relLuminance(a), lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe('freshnessDescriptor', () => {
  it('latest build -> GREEN with a non-color text label (not color-alone)', () => {
    const d = freshnessDescriptor(false);
    expect(d.stale).toBe(false);
    expect(d.color).toBe(FRESH_COLOR);
    expect(d.label).toBe('Latest');
    // WCAG 1.4.1: state is also carried by text, not only the dot color.
    expect(d.label.length).toBeGreaterThan(0);
    expect(d.ariaLabel.length).toBeGreaterThan(0);
  });

  it('update pending -> RED "Update available" with a reload affordance in the copy', () => {
    const d = freshnessDescriptor(true);
    expect(d.stale).toBe(true);
    expect(d.color).toBe(STALE_COLOR);
    expect(d.label).toMatch(/update available/i);
    expect(d.label).toMatch(/reload/i);
    expect(d.ariaLabel).toMatch(/reload/i);
  });

  it('green and red are distinct colors', () => {
    expect(freshnessDescriptor(false).color).not.toBe(freshnessDescriptor(true).color);
  });
});

describe('updateWaiting (the stale signal)', () => {
  it('no registration -> not waiting (GREEN)', () => {
    expect(updateWaiting({})).toBe(false);
    expect(updateWaiting({ __pwaReg: {} })).toBe(false);
    expect(updateWaiting(undefined)).toBe(false);
  });

  it('registration with a waiting worker -> waiting (RED)', () => {
    expect(updateWaiting({ __pwaReg: { waiting: { postMessage() {} } } })).toBe(true);
  });

  it('is null-safe on a hostile window handle', () => {
    const hostile = { get __pwaReg() { throw new Error('boom'); } };
    expect(updateWaiting(hostile)).toBe(false);
  });
});

describe('WCAG 1.4.11 non-text contrast — dot stays visible on every theme', () => {
  // The light themes are all near-white and midnight is pure black, so clearing
  // >=3:1 against BOTH endpoints covers the full theme range.
  for (const [name, color] of [['fresh/green', FRESH_COLOR], ['stale/red', STALE_COLOR]]) {
    it(`${name} clears 3:1 vs white and vs black`, () => {
      expect(contrast(color, '#FFFFFF')).toBeGreaterThanOrEqual(3);
      expect(contrast(color, '#000000')).toBeGreaterThanOrEqual(3);
    });
  }
});
