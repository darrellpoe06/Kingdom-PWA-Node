// @vitest-environment node
// Pins classifyServiceType — conference + funeral streams (the non-Sunday /
// non-Wednesday broadcasts) land in history correctly instead of all defaulting
// to "sunday" (Darrell 2026-07-14: "labeled as conferences and funerals for those
// streams that are not on Sunday and usually Wednesday except for conferences").
import { describe, it, expect } from 'vitest';
import { classifyServiceType, serviceKindLabel } from '../lib/service-day.js';
import { parseServiceTitle } from '../lib/youtube-title-parse.js';

describe('classifyServiceType', () => {
  it('title wins: a funeral / homegoing is a funeral on ANY day', () => {
    expect(classifyServiceType('Homegoing Celebration for Mother Smith', '2026-07-14')).toBe('funeral'); // a Tuesday
    expect(classifyServiceType('Funeral Service — Deacon Jones', '2026-07-19')).toBe('funeral');          // a Sunday
    expect(classifyServiceType('Celebration of Life', '2026-07-15')).toBe('funeral');
  });

  it('title wins: a conference/convocation is a conference even mid-week', () => {
    expect(classifyServiceType('77th National Assembly — Tuesday Night', '2026-07-14')).toBe('conference');
    expect(classifyServiceType('Holy Convocation 2026', '2026-07-19')).toBe('conference'); // conference even on a Sunday
    expect(classifyServiceType('Summer Youth Convention — Night 2', '2026-07-16')).toBe('conference');
  });

  it('no keyword keeps the historical default — the DATE never reclassifies a title', () => {
    // A Sunday message is often dated/uploaded on another weekday; the date must
    // NOT flip it (regression: 6-10-2026 is a Wednesday but the message is Sunday).
    expect(classifyServiceType('Bishop Gwin — LET GO AND LET GOD', '2026-06-10')).toBe('sunday');
    expect(classifyServiceType('Bishop Gwin Wednesday Bible Study', '2026-06-14')).toBe('wednesday');
  });

  it('explicit Wednesday Bible Study still classifies as wednesday', () => {
    expect(classifyServiceType('Bishop Gwin Wednesday Bible Study', '2026-07-15')).toBe('wednesday');
  });

  it('no date + no keyword falls back to sunday (unchanged default)', () => {
    expect(classifyServiceType('Bishop Gwin "SOME MESSAGE"', '')).toBe('sunday');
  });

  it('labels read cleanly', () => {
    expect(serviceKindLabel('conference')).toBe('Conference');
    expect(serviceKindLabel('funeral')).toBe('Funeral');
  });

  it('the video-title parser now emits conference/funeral (not just sunday)', () => {
    // A real conference title shape from the channel (77th National Assembly).
    const r = parseServiceTitle('7 - 14 - 2026 77th National Assembly: Sisters In Christ');
    expect(r.serviceType).toBe('conference');
  });
});
