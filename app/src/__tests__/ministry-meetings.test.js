// Tests for the sovereign-meeting scheduling + LOAD RULES (2026-07-12). The load
// check is the "three brakes" applied to meetings so the environment can't be
// overloaded; it must actually CATCH each overload class (DR-0076 proven-to-catch).
import { describe, it, expect } from 'vitest';
import {
  toMeetingShape, meetingProviderLabel, meetingStatusLabel,
  isActiveMeeting, windowsOverlap, meetingLoadCheck, upcomingMeetings, MEETING_LIMITS,
} from '../lib/ministry-meetings.js';

const NOW = Date.parse('2026-07-12T12:00:00Z');

const base = {
  ministry: 'bus', title: 'Bus Sync', durationMin: 60, participantCap: 12,
  scheduledAt: '2026-07-16T23:00:00Z', // future
};

describe('shape + labels', () => {
  it('maps a row and labels providers/status', () => {
    const m = toMeetingShape({ id: 'm1', ministry: 'bus', title: 'Sync', provider: 'poetech-obs', duration_min: 45, participant_cap: 10, host_user_id: 'u1', status: 'scheduled' }, 'u1');
    expect(m).toMatchObject({ ministry: 'bus', title: 'Sync', provider: 'poetech-obs', durationMin: 45, participantCap: 10, mine: true });
    expect(meetingProviderLabel('poetech-obs')).toBe('PoeTech (OBS)');
    expect(meetingStatusLabel('live')).toBe('Live');
  });
});

describe('isActiveMeeting / windowsOverlap', () => {
  it('live is active; ended/canceled are not', () => {
    expect(isActiveMeeting({ status: 'live' }, NOW)).toBe(true);
    expect(isActiveMeeting({ status: 'ended', scheduledAt: '2026-07-16T23:00:00Z' }, NOW)).toBe(false);
    expect(isActiveMeeting({ status: 'canceled' }, NOW)).toBe(false);
  });
  it('scheduled is active until its window ends', () => {
    expect(isActiveMeeting({ status: 'scheduled', scheduledAt: '2026-07-16T23:00:00Z', durationMin: 60 }, NOW)).toBe(true);
    expect(isActiveMeeting({ status: 'scheduled', scheduledAt: '2026-07-12T10:00:00Z', durationMin: 60 }, NOW)).toBe(false); // past
  });
  it('windowsOverlap detects overlap', () => {
    const a = Date.parse('2026-07-16T23:00:00Z');
    const b = Date.parse('2026-07-16T23:30:00Z');
    expect(windowsOverlap(a, 60, b, 60)).toBe(true);
    expect(windowsOverlap(a, 20, b, 60)).toBe(false);
  });
});

describe('meetingLoadCheck — passes a sound meeting', () => {
  it('ok when scheduled, future, within caps, no conflict', () => {
    expect(meetingLoadCheck([], base, NOW)).toEqual({ ok: true, violations: [] });
  });
});

describe('meetingLoadCheck — CATCHES each overload class', () => {
  it('scheduling required (no start time)', () => {
    const r = meetingLoadCheck([], { ...base, scheduledAt: null }, NOW);
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.rule)).toContain('scheduling-required');
  });
  it('start in the past', () => {
    const r = meetingLoadCheck([], { ...base, scheduledAt: '2026-07-01T10:00:00Z' }, NOW);
    expect(r.violations.map((v) => v.rule)).toContain('scheduling-required');
  });
  it('duration over the ceiling', () => {
    const r = meetingLoadCheck([], { ...base, durationMin: MEETING_LIMITS.maxDurationMin + 1 }, NOW);
    expect(r.violations.map((v) => v.rule)).toContain('duration');
  });
  it('participant cap over the ceiling', () => {
    const r = meetingLoadCheck([], { ...base, participantCap: MEETING_LIMITS.maxParticipants + 5 }, NOW);
    expect(r.violations.map((v) => v.rule)).toContain('participant-cap');
  });
  it('participant cap missing / < 1', () => {
    expect(meetingLoadCheck([], { ...base, participantCap: 0 }, NOW).violations.map((v) => v.rule)).toContain('participant-cap');
  });
  it('ministry lock — one meeting per ministry in a window', () => {
    const existing = [toMeetingShape({ id: 'e1', ministry: 'bus', status: 'scheduled', scheduled_at: base.scheduledAt, duration_min: 60, participant_cap: 10 })];
    const r = meetingLoadCheck(existing, { ...base, scheduledAt: '2026-07-16T23:30:00Z' }, NOW);
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.rule)).toContain('ministry-lock');
  });
  it('max concurrent per instance — 3 other ministries already in the window', () => {
    const existing = ['choir', 'ushers', 'security'].map((m, i) =>
      toMeetingShape({ id: `e${i}`, ministry: m, status: 'scheduled', scheduled_at: base.scheduledAt, duration_min: 60, participant_cap: 10 }));
    const r = meetingLoadCheck(existing, base, NOW); // proposed is 'bus' -> distinct ministry
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.rule)).toContain('max-concurrent');
  });
  it('does NOT block when the conflicting meeting has ended', () => {
    const existing = [toMeetingShape({ id: 'e1', ministry: 'bus', status: 'ended', scheduled_at: base.scheduledAt, duration_min: 60, participant_cap: 10 })];
    expect(meetingLoadCheck(existing, { ...base, scheduledAt: '2026-07-16T23:30:00Z' }, NOW).ok).toBe(true);
  });
});

describe('upcomingMeetings', () => {
  it('lists active meetings soonest-first', () => {
    const list = [
      toMeetingShape({ id: 'a', status: 'scheduled', scheduled_at: '2026-07-20T10:00:00Z', duration_min: 60 }),
      toMeetingShape({ id: 'b', status: 'scheduled', scheduled_at: '2026-07-16T10:00:00Z', duration_min: 60 }),
      toMeetingShape({ id: 'c', status: 'ended', scheduled_at: '2026-07-16T10:00:00Z', duration_min: 60 }),
    ];
    expect(upcomingMeetings(list, NOW).map((m) => m.id)).toEqual(['b', 'a']);
  });
});
