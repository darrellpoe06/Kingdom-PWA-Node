// tab-sme — the PURE SME model over voluntary feedback (Darrell 2026-07-05: "see
// who likes which tabs so their feedback will be prioritized... SMEs"). No
// network, no React. Pins the ranking, the SME threshold (repeat engagement, not
// one note — DR-0076 don't over-claim), self-attribution of the signed-in user's
// own local rows, and the SME-first prioritization the promote queue relies on.
import { describe, it, expect } from 'vitest';
import {
  SME_MIN_NOTES, tabSme, personTabs, standingsById, smeStanding, prioritizeBySme,
} from '../lib/tab-sme.js';

// A mix of remote-shaped rows (carry identity + which_tab) and own local rows
// (carry area + createdAt, NO submitter → attributed to `self`).
const CHRISTINA = 'id:u-christina';
const self = { id: 'u-darrell', name: 'Darrell' };

const FEEDBACK = [
  // Christina is the heavy voice on Church (3 notes) — the Church SME.
  { id: 'r1', user_id: 'u-christina', display_name: 'Christina', which_tab: 'church', submitted_at: '2026-07-01T10:00:00Z' },
  { id: 'r2', user_id: 'u-christina', display_name: 'Christina', which_tab: 'church', submitted_at: '2026-07-02T10:00:00Z' },
  { id: 'r3', user_id: 'u-christina', display_name: 'Christina', which_tab: 'church', submitted_at: '2026-07-03T10:00:00Z' },
  // Darrell's OWN local rows (no submitter) on Rentals — attributed to self.
  { id: 'l1', area: 'rentals', createdAt: '2026-07-04T10:00:00Z' },
  { id: 'l2', area: 'rentals', createdAt: '2026-07-05T10:00:00Z' },
  // One-off note on Church from Darrell — one note is NOT SME-level.
  { id: 'l3', area: 'church', createdAt: '2026-07-05T11:00:00Z' },
  // Unattributable row (no area) — ignored, never invents a person.
  { id: 'x1', createdAt: '2026-07-05T12:00:00Z' },
];

describe('tabSme — per-area contributor ranking', () => {
  const areas = tabSme(FEEDBACK, { self });

  it('ranks areas by total voice, then contributors by note count', () => {
    expect(areas.map((a) => a.area)).toEqual(['church', 'rentals']); // church 4 notes > rentals 2
    const church = areas.find((a) => a.area === 'church');
    expect(church.contributors[0]).toMatchObject({ key: CHRISTINA, name: 'Christina', notes: 3 });
    expect(church.contributors[1]).toMatchObject({ key: 'id:u-darrell', notes: 1 });
  });

  it('marks an SME only after repeated engagement (SME_MIN_NOTES)', () => {
    expect(SME_MIN_NOTES).toBe(2);
    const church = areas.find((a) => a.area === 'church');
    expect(church.smes.map((c) => c.name)).toEqual(['Christina']); // Darrell's 1 church note ≠ SME
    const rentals = areas.find((a) => a.area === 'rentals');
    expect(rentals.smes.map((c) => c.key)).toEqual(['id:u-darrell']); // 2 own notes → SME of own area
  });

  it('never invents a person for an unattributable row', () => {
    const total = areas.reduce((s, a) => s + a.totalNotes, 0);
    expect(total).toBe(6); // 7 rows minus the arealess x1
  });
});

describe('personTabs — who likes which tabs, per person', () => {
  it('lists each person and their areas, most-engaged first', () => {
    const people = personTabs(FEEDBACK, { self });
    const christina = people.find((p) => p.key === CHRISTINA);
    expect(christina.name).toBe('Christina');
    expect(christina.areas[0]).toMatchObject({ area: 'church', notes: 3, isSme: true });
    const darrell = people.find((p) => p.key === 'id:u-darrell');
    expect(darrell.name).toBe('Darrell');
    expect(darrell.areas.map((a) => a.area)).toEqual(['rentals', 'church']); // 2 vs 1
    expect(darrell.areas.find((a) => a.area === 'church').isSme).toBe(false);
  });
});

describe('standingsById — one-pass badge data per feedback row', () => {
  const map = standingsById(FEEDBACK, { self });

  it('badges a repeat voice as SME + top voice with its rank', () => {
    expect(map.get('r1')).toMatchObject({ area: 'church', name: 'Christina', notesOnArea: 3, rank: 1, isSme: true, isTopVoice: true });
    expect(map.get('l1')).toMatchObject({ area: 'rentals', notesOnArea: 2, rank: 1, isSme: true });
  });

  it('does not badge a one-off note as SME', () => {
    expect(map.get('l3')).toMatchObject({ area: 'church', notesOnArea: 1, rank: 2, isSme: false, isTopVoice: false });
  });

  it('omits rows with no resolvable area', () => {
    expect(map.has('x1')).toBe(false);
  });
});

describe('smeStanding — single item on demand', () => {
  it('matches the one-pass map', () => {
    expect(smeStanding(FEEDBACK, FEEDBACK[0], { self })).toMatchObject({ notesOnArea: 3, isSme: true });
    expect(smeStanding(FEEDBACK, { id: 'nope' }, { self })).toBeNull();
  });
});

describe('prioritizeBySme — SME feedback floats to the top, then recency', () => {
  it('orders SME rows (by note count) before non-SME, keeping recency within', () => {
    const ordered = prioritizeBySme(FEEDBACK, { self }).map((f) => f.id);
    // SME rows first: church (Christina, weight 3) then rentals (Darrell, weight 2),
    // each newest-first; then the non-SME rows by recency; arealess x1 last-ish.
    expect(ordered.indexOf('r3')).toBeLessThan(ordered.indexOf('l3')); // SME church < non-SME church note
    expect(ordered.indexOf('r1')).toBeLessThan(ordered.indexOf('l1')); // weight 3 before weight 2
    expect(ordered.indexOf('l2')).toBeLessThan(ordered.indexOf('l3')); // rentals SME before church one-off
  });

  it('is non-mutating and safe on empty / bad input', () => {
    const arr = FEEDBACK.slice();
    prioritizeBySme(arr, { self });
    expect(arr.map((f) => f.id)).toEqual(FEEDBACK.map((f) => f.id));
    expect(prioritizeBySme(null)).toEqual([]);
    expect(prioritizeBySme(undefined)).toEqual([]);
  });
});

describe('degrades safely with no self identity', () => {
  it('still ranks attributed (remote) rows; drops unattributed local rows', () => {
    const areas = tabSme(FEEDBACK); // no self
    expect(areas.map((a) => a.area)).toEqual(['church']); // rentals rows were self-only
    expect(areas[0].contributors.map((c) => c.name)).toEqual(['Christina']); // Darrell's church note had no identity
  });
});
