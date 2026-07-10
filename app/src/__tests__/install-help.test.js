import { describe, it, expect } from 'vitest';
import { detectPlatform, installSteps, validateInterest } from '../lib/install-help.js';

describe('install-help', () => {
  it('detectPlatform reads the platform from the UA', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome')).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome')).toBe('desktop');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari')).toBe('desktop');
    expect(detectPlatform('something-weird')).toBe('other');
  });

  it('a desktop-shaped Linux UA on a TOUCH screen is a phone, not a computer (the Fold, 2026-07-10)', () => {
    const foldUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
    const real = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'maxTouchPoints');
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
    try {
      expect(detectPlatform(foldUA)).toBe('android');
    } finally {
      delete navigator.maxTouchPoints;
      if (real) Object.defineProperty(Object.getPrototypeOf(navigator), 'maxTouchPoints', real);
    }
    // The same UA with NO touch screen stays a computer.
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    try {
      expect(detectPlatform(foldUA)).toBe('desktop');
    } finally {
      delete navigator.maxTouchPoints;
    }
  });

  it('Android steps name the scrollable menu path and the already-installed tell', () => {
    const joined = installSteps('android').steps.join(' ');
    expect(joined).toContain('Add to Home screen');
    expect(joined).toContain('app drawer');
    expect(joined).toContain('Open PoeTech');
  });

  it('installSteps always returns non-empty steps for every platform', () => {
    for (const p of ['ios', 'android', 'desktop', 'other']) {
      const s = installSteps(p);
      expect(s.title).toBeTruthy();
      expect(Array.isArray(s.steps)).toBe(true);
      expect(s.steps.length).toBeGreaterThan(0);
    }
  });

  it('installSteps gives the one-tap path when a native prompt is available', () => {
    const s = installSteps('android', true);
    expect(s.steps.length).toBe(1);
    expect(s.steps[0]).toMatch(/one|tap|install/i);
  });

  it('iOS steps tell the user to use Safari + Share + Add to Home Screen', () => {
    const s = installSteps('ios');
    const joined = s.steps.join(' ').toLowerCase();
    expect(joined).toContain('safari');
    expect(joined).toContain('share');
    expect(joined).toContain('add to home screen');
  });

  it('validateInterest requires a name and a valid email', () => {
    expect(validateInterest({ name: '', email: '' }).ok).toBe(false);
    expect(validateInterest({ name: 'Jo', email: 'not-an-email' }).errors.email).toBeTruthy();
    expect(validateInterest({ name: 'Jo', email: 'jo@example.com' }).ok).toBe(true);
  });

  it('validateInterest blocks a flagged minor until a parent confirms', () => {
    const r = validateInterest({ name: 'Kid', email: 'kid@example.com', isMinor: true, parentConfirmed: false });
    expect(r.ok).toBe(false);
    expect(r.errors.parentConfirmed).toBeTruthy();
    const ok = validateInterest({ name: 'Kid', email: 'kid@example.com', isMinor: true, parentConfirmed: true });
    expect(ok.ok).toBe(true);
  });

  it('validateInterest trims whitespace-only fields', () => {
    expect(validateInterest({ name: '   ', email: '  ' }).ok).toBe(false);
  });
});
