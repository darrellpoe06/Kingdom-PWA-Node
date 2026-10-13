import { describe, it, expect } from 'vitest';
import { trialFromCreatedAt, trialHeadline, formatEndDate } from '../lib/trial-status.js';
import { TRIAL_DAYS } from '../lib/entitlements.js';

const created = '2026-01-01T00:00:00.000Z';
const at = (days) => new Date(Date.parse(created) + days * 86400000).toISOString();

describe('trial-status — durable 90-day counter from account creation', () => {
  it('day 1 on the creation day', () => {
    const s = trialFromCreatedAt(created, at(0));
    expect(s.phase).toBe('trial');
    expect(s.dayNumber).toBe(1);
    expect(s.daysLeft).toBe(TRIAL_DAYS);
    expect(s.percentElapsed).toBe(0);
  });

  it('counts down mid-trial', () => {
    const s = trialFromCreatedAt(created, at(30));
    expect(s.phase).toBe('trial');
    expect(s.dayNumber).toBe(31);
    expect(s.daysLeft).toBe(60);
    expect(s.percentElapsed).toBe(33);
  });

  it('day-83 heads-up: the final week reads ENDING-SOON — a calm nudge, not a scare (DR-0075 add, 2026-07-23)', () => {
    // Day 82 (elapsed 81): still an ordinary trial — no early nagging.
    expect(trialFromCreatedAt(created, at(81)).phase).toBe('trial');
    // Day 83 (elapsed 82, 8 days left): the heads-up begins.
    const s = trialFromCreatedAt(created, at(82));
    expect(s.phase).toBe('ending-soon');
    expect(s.dayNumber).toBe(83);
    expect(s.daysLeft).toBe(8);
    const line = trialHeadline(s);
    expect(line).toMatch(/Heads-up/);
    expect(line).toMatch(/never locked out/);
    expect(line).toMatch(/nothing gets deleted/);
    // It holds through the final day, then hands off to expired.
    expect(trialFromCreatedAt(created, at(89)).phase).toBe('ending-soon');
    expect(trialFromCreatedAt(created, at(90)).phase).toBe('expired');
  });

  it('expires exactly at day 90 — never a lockout (falls to free)', () => {
    const s = trialFromCreatedAt(created, at(90));
    expect(s.phase).toBe('expired');
    expect(s.daysLeft).toBe(0);
    expect(s.percentElapsed).toBe(100);
    expect(trialHeadline(s)).toMatch(/free Foundation tier|nothing was deleted/i);
  });

  it('stays expired past 90 (percent capped at 100)', () => {
    const s = trialFromCreatedAt(created, at(200));
    expect(s.phase).toBe('expired');
    expect(s.percentElapsed).toBe(100);
  });

  it('clamps clock skew (future-dated createdAt) to day 1, not negative', () => {
    const s = trialFromCreatedAt(at(10), created); // now is BEFORE created
    expect(s.dayNumber).toBe(1);
    expect(s.daysLeft).toBe(TRIAL_DAYS);
    expect(s.phase).toBe('trial');
  });

  it('paid accounts show no countdown', () => {
    const s = trialFromCreatedAt(created, at(5), true);
    expect(s.phase).toBe('paid');
    expect(trialHeadline(s)).toMatch(/subscription is active/i);
  });

  it('unknown when there is no anchor (signed-out / missing createdAt)', () => {
    expect(trialFromCreatedAt(null, at(5)).phase).toBe('unknown');
    expect(trialFromCreatedAt('not-a-date', at(5)).phase).toBe('unknown');
  });

  it('durability: the SAME createdAt yields the SAME state regardless of device', () => {
    // No localStorage, no per-device start — identical inputs, identical output.
    const a = trialFromCreatedAt(created, at(45));
    const b = trialFromCreatedAt(created, at(45));
    expect(a).toEqual(b);
    expect(a.dayNumber).toBe(46);
  });

  it('trialHeadline speaks plainly and promises no lockout', () => {
    const s = trialFromCreatedAt(created, at(10));
    const h = trialHeadline(s);
    expect(h).toContain(`Day ${s.dayNumber} of ${TRIAL_DAYS}`);
    expect(h.toLowerCase()).toContain('never locked out');
  });

  it('formatEndDate renders a friendly date or empty', () => {
    expect(formatEndDate('2026-06-15T12:00:00.000Z')).toMatch(/2026/); // midday mid-year: TZ-stable
    expect(formatEndDate(null)).toBe('');
  });
});
