// @vitest-environment node
// =============================================================================
// The printed flyer and the app say the same thing
// =============================================================================
// Darrell 2026-09-20, sending the church's "Love Corner Experience" volunteer
// flyer — twenty-one ministries, a QR code, "We Need You!": "Can we make sure
// to have the necessary process and procedures in place to support this today?
// And tested..."
//
// Measured when he asked: the flyer named 21 ministries and the app carried 9.
// A person scans that QR wanting the Prayer Ministry or Children's Ministry
// and finds no such thing — which reads as "they do not want me", on the one
// surface the church printed a code to send them to. Paper and app disagreeing
// is not a cosmetic gap; it is the church's invitation failing at the door.
//
// This is the gate that keeps them in step. It is written from the FLYER, not
// from the code — so the test fails when the app drifts from what the church
// published, which is the only direction that matters.

import { describe, it, expect } from 'vitest';
import {
  CHURCH_MINISTRIES, MINISTRY_ROSTER_IS_CONFIRMED, MINISTRY_ROSTER_NOTE,
  ministryById, ministriesWithSurface, ministriesWithoutSurface,
  mergeMinistries, ministryFromRow, ministryToRow,
} from '../lib/church-ministries.js';

// Transcribed from the flyer image, in its own order. Each entry is a phrase
// that must appear in SOME ministry's name — the app may word it more fully
// (the flyer's "Media & Social Media" is our "Media / Broadcast"), but the
// thing a volunteer is looking for has to be findable.
const FLYER = [
  'Music', 'Instrumental', 'Media', 'IT', 'Usher', 'Hospitality',
  'Parking', 'Security', 'Deacons', 'Prayer', 'Missions', 'Bus',
  "Children", 'Youth', 'College', 'School Outreach', 'Administration',
  'Events', 'Care', 'Counseling', 'Membership',
];

const names = CHURCH_MINISTRIES.map((m) => m.name);
const has = (needle) => names.some((n) => n.toLowerCase().includes(needle.toLowerCase()));

describe('every ministry on the flyer exists in the app', () => {
  it('nothing the church printed is missing', () => {
    const missing = FLYER.filter((f) => !has(f));
    expect(
      missing,
      `the flyer offers these and the app does not: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the same check fires on a ministry we do not carry', () => {
    // Without this, a passing test above could mean the checker is broken
    // rather than the roster being complete.
    expect(has('Aviation Ministry')).toBe(false);
  });

  it('carries at least as many as the flyer names', () => {
    expect(CHURCH_MINISTRIES.length).toBeGreaterThanOrEqual(FLYER.length);
  });
});

describe('the roster is honest about itself', () => {
  it('is CONFIRMED, because the church published it', () => {
    // It stood at false while the list was our guess at theirs. A roster the
    // church printed and put a QR code on is the office naming it, and leaving
    // the disclaimer up would understate what we know — as much a failure of
    // truth as overstating it (DR-0100).
    expect(MINISTRY_ROSTER_IS_CONFIRMED).toBe(true);
  });

  it('still tells someone whose gift is not listed that there is a place', () => {
    // The flyer's own last tile reads "If you have a talent or a heart to
    // serve, there's a place for you!" The app must not be narrower than the
    // paper that sent them here.
    expect(MINISTRY_ROSTER_NOTE).toMatch(/still a place for you/i);
  });

  it('no longer claims the list is merely what we know so far', () => {
    expect(MINISTRY_ROSTER_NOTE).not.toMatch(/knows about so far/i);
  });
});

describe('every entry is usable, not just present', () => {
  it('each has an id, a name, a blurb, a join line and a provenance', () => {
    const bad = [];
    for (const m of CHURCH_MINISTRIES) {
      for (const k of ['id', 'name', 'blurb', 'join', 'source']) {
        if (!m[k] || !String(m[k]).trim()) bad.push(`${m.id || '?'}:${k}`);
      }
    }
    expect(bad, `incomplete entries: ${bad.join(', ')}`).toEqual([]);
  });

  it('ids are unique — a duplicate would shadow a whole ministry', () => {
    const ids = CHURCH_MINISTRIES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each is reachable by its own id', () => {
    for (const m of CHURCH_MINISTRIES) expect(ministryById(m.id)).toBeTruthy();
  });

  it('the surface split still adds up, so the gaps stay visible', () => {
    // ministriesWithoutSurface is what makes an un-built ministry honest
    // rather than silent. Most of the flyer's additions land here today, and
    // that is the correct state: named and joinable, surface still owed.
    expect(ministriesWithSurface().length + ministriesWithoutSurface().length)
      .toBe(CHURCH_MINISTRIES.length);
    expect(ministriesWithoutSurface().length).toBeGreaterThan(0);
  });

  it('every flyer addition records the flyer as its provenance', () => {
    // DR-0076: nothing here is guessed. A reader can see exactly how we know
    // each ministry exists.
    const fromFlyer = CHURCH_MINISTRIES.filter((m) => /flyer/i.test(m.source));
    expect(fromFlyer.length).toBeGreaterThanOrEqual(14);
    for (const m of fromFlyer) expect(m.source).toMatch(/published by the church/);
  });
});

describe('the office can edit the list without anyone writing code', () => {
  // Darrell 2026-09-20: "expandable by staff and no need for technical work."
  // The seeded array is now a FLOOR, not the list. church_ministries (0223) is
  // the living one. These pin the merge, because the failure mode is silent and
  // awful: get it wrong and either the office's edits do nothing, or a working
  // list disappears the moment a table is empty.
  it('an empty or missing table still shows the church its ministries', () => {
    // The assertion that makes this safe to ship on a Sunday morning.
    expect(mergeMinistries([])).toHaveLength(CHURCH_MINISTRIES.length);
    expect(mergeMinistries(null)).toHaveLength(CHURCH_MINISTRIES.length);
    expect(mergeMinistries(undefined)).toHaveLength(CHURCH_MINISTRIES.length);
  });

  it('an office row REPLACES the seeded one of the same slug', () => {
    // If a rename did not stick, the edit box would be a lie.
    const merged = mergeMinistries([{ slug: 'bus', name: 'Transportation Ministry' }]);
    expect(merged.find((m) => m.id === 'bus').name).toBe('Transportation Ministry');
    expect(merged).toHaveLength(CHURCH_MINISTRIES.length);
  });

  it('a brand-new ministry is appended, with no code change anywhere', () => {
    const merged = mergeMinistries([{ slug: 'motorcycle', name: 'Motorcycle Ministry', sort_order: 5 }]);
    expect(merged).toHaveLength(CHURCH_MINISTRIES.length + 1);
    expect(merged.at(-1).name).toBe('Motorcycle Ministry');
    expect(merged.at(-1).fromOffice).toBe(true);
  });

  it('new ministries follow the office’s own ordering', () => {
    const merged = mergeMinistries([
      { slug: 'b', name: 'Bravo', sort_order: 20 },
      { slug: 'a', name: 'Alpha', sort_order: 10 },
    ]);
    expect(merged.slice(-2).map((m) => m.name)).toEqual(['Alpha', 'Bravo']);
  });

  it('a row with no slug is skipped rather than rendering a nameless tile', () => {
    expect(mergeMinistries([{ name: 'No slug' }, null, {}])).toHaveLength(CHURCH_MINISTRIES.length);
  });

  it('a row round-trips through the DB shape without losing its surface', () => {
    const row = ministryToRow(
      { id: 'x', name: 'X', blurb: 'b', join: 'j', surface: { view: 'church', sub: 'x' }, feedbackKey: 'k' },
      { tenantId: 't', userId: 'u' },
    );
    expect(row.slug).toBe('x');
    expect(row.view).toBe('church');
    expect(ministryFromRow(row).surface).toEqual({ view: 'church', sub: 'x' });
  });

  it('an office row is labelled as the office’s, so provenance stays honest', () => {
    expect(ministryFromRow({ slug: 's', name: 'S' }).source).toMatch(/church office/);
  });
});
