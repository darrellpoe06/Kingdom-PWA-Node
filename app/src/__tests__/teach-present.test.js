import { describe, it, expect } from 'vitest';
import { MODULES } from '../lib/church-classes.js';
import {
  TEACH_CHANNEL,
  SESSION_TARGET_MIN,
  formatClock,
  buildSlide,
  holdingSlide,
} from '../lib/teach-present.js';

describe('teach-present — present-mode core', () => {
  it('formatClock renders mm:ss, zero-padded, clamped at 0', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(5)).toBe('00:05');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(75 * 60)).toBe('75:00');
    expect(formatClock(-10)).toBe('00:00'); // never count negative
    expect(formatClock(NaN)).toBe('00:00'); // never render NaN:NaN
    expect(formatClock(90.9)).toBe('01:30'); // floor, not round
  });

  it('SESSION_TARGET_MIN is the 75-minute session', () => {
    expect(SESSION_TARGET_MIN).toBe(75);
  });

  it('TEACH_CHANNEL is a stable, versioned channel name', () => {
    expect(TEACH_CHANNEL).toBe('poe-teach-v1');
  });

  it('buildSlide returns a learner-only payload for a real week', () => {
    const s = buildSlide(0, '2026-07-11');
    expect(s.type).toBe('slide');
    expect(s.week).toBe(1);
    expect(s.total).toBe(MODULES.length);
    expect(s.title).toBe(MODULES[0].title);
    expect(s.bigIdea).toBe(MODULES[0].bigIdea);
    expect(s.inApp).toBe(MODULES[0].inApp);
    expect(s.anchorRef).toBe(MODULES[0].anchor.ref);
    expect(s.dateLabel).toContain('2026');
  });

  it('buildSlide NEVER carries facilitator notes (no leak to the projector)', () => {
    const s = buildSlide(0, '2026-07-11');
    // these are the teacher-only fields the parallel session is authoring
    expect(s).not.toHaveProperty('facilitator');
    expect(s).not.toHaveProperty('lesson');
    expect(s).not.toHaveProperty('talkingPoints');
    expect(s).not.toHaveProperty('howToRun');
    expect(s).not.toHaveProperty('discussionPrompts');
    expect(s).not.toHaveProperty('watchFor');
  });

  it('buildSlide computes the real per-week date from the cohort start', () => {
    const wk1 = buildSlide(0, '2026-07-11');
    const wk2 = buildSlide(1, '2026-07-11');
    expect(wk1.dateLabel).toContain('July 11');
    expect(wk2.dateLabel).toContain('July 18'); // +7 days, the real next date
  });

  it('buildSlide returns null past the last week (audience keeps last good slide)', () => {
    expect(buildSlide(MODULES.length, '2026-07-11')).toBeNull();
    expect(buildSlide(-1, '2026-07-11')).toBeNull();
  });

  it('buildSlide tolerates a missing/blank start date (date label null, content intact)', () => {
    const s = buildSlide(0, '');
    expect(s.title).toBe(MODULES[0].title);
    expect(s.dateLabel).toBeNull(); // honest: no fake date
  });

  it('holdingSlide is an intentional placeholder, not a stale slide', () => {
    expect(holdingSlide().type).toBe('hold');
    expect(holdingSlide('X').title).toBe('X');
  });
});
