// =============================================================================
// service-day — the weekday-from-date label helper (2026-07-02 date-label fix).
// =============================================================================
// PROVEN-TO-CATCH: pins the exact reported bug — a 'sunday'-type service on
// 2026-07-13 (a MONDAY) must NOT read "Sunday service"; the weekday is derived
// from the real date. Also pins timezone-safety (no UTC day-shift).
import { describe, it, expect } from 'vitest';
import {
  weekdayName, serviceKind, serviceKindLabel, serviceDayLabel,
} from '../lib/service-day.js';

describe('weekdayName — timezone-safe weekday from a YYYY-MM-DD', () => {
  it('gives the real calendar weekday (not a UTC-shifted one)', () => {
    expect(weekdayName('2026-07-13')).toBe('Monday');   // the reported date
    expect(weekdayName('2026-07-12')).toBe('Sunday');   // the day before
    expect(weekdayName('2026-06-14')).toBe('Sunday');
    expect(weekdayName('2026-07-13', { short: true })).toBe('Mon');
  });
  it('is empty for a missing / malformed date', () => {
    expect(weekdayName(null)).toBe('');
    expect(weekdayName('')).toBe('');
    expect(weekdayName('not-a-date')).toBe('');
  });
});

describe('serviceDayLabel — the label always matches the date', () => {
  it('FIXES the reported bug: sunday-type on a Monday reads the real weekday', () => {
    // Before: "Sunday service". After: derived from the date -> "Monday service".
    expect(serviceDayLabel('sunday', '2026-07-13')).toBe('Monday service');
  });
  it('reads exactly as before when the weekday matches the type', () => {
    expect(serviceDayLabel('sunday', '2026-07-12')).toBe('Sunday service');
    expect(serviceDayLabel('rehearsal', '2026-07-16')).toBe('Thursday rehearsal'); // Jul 16 2026 = Thu
    expect(serviceDayLabel('wednesday', '2026-07-15')).toBe('Wednesday Bible study'); // Jul 15 2026 = Wed
  });
  it('tells the truth for a mismatched Bible study / rehearsal too', () => {
    expect(serviceDayLabel('wednesday', '2026-07-13')).toBe('Monday Bible study');
    expect(serviceDayLabel('rehearsal', '2026-07-13')).toBe('Monday rehearsal');
  });
  it('falls back to the canonical label when there is no date', () => {
    expect(serviceDayLabel('sunday', null)).toBe('Sunday service');
    expect(serviceDayLabel('wednesday', '')).toBe('Wednesday Bible study');
  });
});

describe('serviceKind / serviceKindLabel — the KIND, never a weekday', () => {
  it('maps type to a weekday-free kind', () => {
    expect(serviceKind('sunday')).toBe('service');
    expect(serviceKind('wednesday')).toBe('Bible study');
    expect(serviceKind('rehearsal')).toBe('rehearsal');
  });
  it('capitalizes for a standalone tag (used where the date already shows the weekday)', () => {
    expect(serviceKindLabel('sunday')).toBe('Service');
    expect(serviceKindLabel('wednesday')).toBe('Bible study');
    expect(serviceKindLabel('rehearsal')).toBe('Rehearsal');
  });
});
