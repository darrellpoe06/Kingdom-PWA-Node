// @vitest-environment node
//
// conference-class — the all-ages conference class. These prove the contract is
// REAL, never painted (DR-0061 / DR-0076): a blank conference date yields null (the
// UI then says "to be set", it does not invent a day); a set date reports its TRUE
// weekday; lane progress is counted from the learner's own record via namespaced
// keys that never collide across lanes; and the three lanes are well-formed with
// Scripture anchors cited by reference + theme gloss (never a quoted translation).
import { describe, it, expect } from 'vitest';
import {
  CONFERENCE_META, PROPOSED_CONFERENCE_DATE, LANES,
  sessionKey, getLane, laneProgress, overallProgress, conferenceDate,
} from '../lib/conference-class.js';

describe('lane shape', () => {
  it('has exactly the three named lanes', () => {
    expect(LANES.map((l) => l.id)).toEqual(['elders', 'everyday', 'youth']);
  });

  it('every lane is well-formed with a promise and sessions', () => {
    expect(LANES.every((l) => l.id && l.label && l.forWhom && l.promise && l.sessions.length > 0)).toBe(true);
  });

  it('every session has a big idea, an in-app action, and a Scripture anchor (ref + theme)', () => {
    const sessions = LANES.flatMap((l) => l.sessions);
    expect(sessions.every((s) => s.id && s.title && s.bigIdea && s.inApp && s.anchor?.ref && s.anchor?.theme)).toBe(true);
  });

  it('anchors cite a reference + plain-language theme, not a quoted verse (no surrounding quotes)', () => {
    const themes = LANES.flatMap((l) => l.sessions).map((s) => s.anchor.theme);
    // A theme gloss is prose, not a quoted translation: it should not be wrapped
    // in quotation marks the way a quoted verse would be.
    expect(themes.every((t) => !/^["“]/.test(t.trim()))).toBe(true);
  });

  it('proposes a blank conference date so the UI stays honest until one is set', () => {
    expect(PROPOSED_CONFERENCE_DATE).toBe('');
    expect(CONFERENCE_META.title).toBeTruthy();
  });
});

describe('sessionKey + getLane', () => {
  it('namespaces keys per lane so lanes never collide', () => {
    expect(sessionKey('elders', 'just-talk-to-it')).toBe('conf:elders:just-talk-to-it');
    expect(sessionKey('youth', 'the-test')).toBe('conf:youth:the-test');
  });

  it('every generated key is unique across all lanes + sessions', () => {
    const keys = LANES.flatMap((l) => l.sessions.map((s) => sessionKey(l.id, s.id)));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('getLane returns the lane or null', () => {
    expect(getLane('elders')?.label).toBe('At Your Pace');
    expect(getLane('nope')).toBeNull();
  });
});

describe('laneProgress — counted from the real record', () => {
  it('is zero with no record', () => {
    expect(laneProgress(getLane('elders'), {})).toEqual({ done: 0, total: 3, pct: 0 });
  });

  it('counts only this lane’s checked-off sessions', () => {
    const elders = getLane('elders');
    const progress = { [sessionKey('elders', elders.sessions[0].id)]: '2026-07-01T00:00:00Z' };
    expect(laneProgress(elders, progress)).toEqual({ done: 1, total: 3, pct: 33 });
  });

  it('a youth key does not count toward the elders lane', () => {
    const progress = { [sessionKey('youth', 'the-test')]: '2026-07-01T00:00:00Z' };
    expect(laneProgress(getLane('elders'), progress).done).toBe(0);
  });

  it('handles a null lane safely', () => {
    expect(laneProgress(null, {})).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe('overallProgress', () => {
  it('sums every lane without double counting', () => {
    const total = LANES.reduce((n, l) => n + l.sessions.length, 0);
    expect(overallProgress({}).total).toBe(total);
    const progress = {
      [sessionKey('elders', getLane('elders').sessions[0].id)]: 't',
      [sessionKey('youth', getLane('youth').sessions[0].id)]: 't',
    };
    expect(overallProgress(progress).done).toBe(2);
  });
});

describe('conferenceDate — never painted', () => {
  it('returns null for a blank or invalid date', () => {
    expect(conferenceDate('')).toBeNull();
    expect(conferenceDate(null)).toBeNull();
    expect(conferenceDate('not-a-date')).toBeNull();
  });

  it('reports the TRUE weekday of a set date', () => {
    // 2026-07-11 is a Saturday (UTC).
    expect(conferenceDate('2026-07-11').weekday).toBe('Saturday');
    // A non-Saturday shows the truth, not a forced day.
    expect(conferenceDate('2026-07-13').weekday).toBe('Monday');
  });
});
