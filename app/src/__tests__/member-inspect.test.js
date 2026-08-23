// member-inspect.test.js — proven-to-catch coverage for the member stewardship
// rules (0122). Fires: unknown status/satisfaction, empty observations,
// id-less inserts, fabricated trends from a single read; proves latest-row
// resolution and the real trend directions.
import { describe, it, expect } from 'vitest';
import {
  MEMBER_STATUSES, SATISFACTION_LEVELS,
  validateObservation, latestByMember, satisfactionTrend, buildObservation,
} from '../lib/member-inspect.js';

describe('validateObservation', () => {
  it('a position edit alone is a valid observation', () => {
    expect(validateObservation({ position: 'Usher lead' })).toEqual({ ok: true, problems: [] });
  });
  it('CATCHES an unknown status', () => {
    expect(validateObservation({ status: 'ghosted', note: 'x' }).problems).toContain('unknown-status');
  });
  it('CATCHES an unknown satisfaction word (the vocabulary is care-shaped, fixed)', () => {
    expect(validateObservation({ satisfaction: '7/10', note: 'x' }).problems).toContain('unknown-satisfaction');
  });
  it('CATCHES an empty observation (a row must say something)', () => {
    expect(validateObservation({}).problems).toContain('empty-observation');
    expect(validateObservation({ position: '   ', note: '' }).problems).toContain('empty-observation');
  });
  it('the allowed vocabularies are exactly the schema check constraints', () => {
    expect(MEMBER_STATUSES).toEqual(['new', 'active', 'away', 'stepping-back', 'inactive']);
    expect(SATISFACTION_LEVELS).toEqual(['thriving', 'steady', 'strained', 'hurting']);
  });
});

describe('latestByMember — newest row is the current truth', () => {
  it('picks the newest observation per member', () => {
    const rows = [
      { member_user_id: 'a', position: 'Greeter', created_at: '2026-07-01T00:00:00Z' },
      { member_user_id: 'a', position: 'Usher lead', created_at: '2026-07-20T00:00:00Z' },
      { member_user_id: 'b', position: 'Sound', created_at: '2026-07-10T00:00:00Z' },
    ];
    const latest = latestByMember(rows);
    expect(latest.get('a').position).toBe('Usher lead');
    expect(latest.get('b').position).toBe('Sound');
  });
});

describe('satisfactionTrend — noticing drift before the person disappears', () => {
  const at = (day, satisfaction) => ({ satisfaction, created_at: `2026-07-${day}T00:00:00Z` });
  it('CATCHES the decline (steady -> strained)', () => {
    expect(satisfactionTrend([at('01', 'steady'), at('20', 'strained')])).toBe('declining');
  });
  it('sees improvement (hurting -> steady)', () => {
    expect(satisfactionTrend([at('01', 'hurting'), at('20', 'steady')])).toBe('improving');
  });
  it('NEVER fabricates a trend from one read (DR-0076)', () => {
    expect(satisfactionTrend([at('01', 'steady')])).toBeNull();
    expect(satisfactionTrend([])).toBeNull();
  });
  it('rows without satisfaction reads are ignored, not counted as data', () => {
    expect(satisfactionTrend([at('01', 'steady'), { note: 'called them', created_at: '2026-07-15T00:00:00Z' }, at('20', 'steady')])).toBe('steady');
  });
});

describe('buildObservation — the insert refuses what the schema would refuse', () => {
  const ids = { instanceId: 'i1', memberUserId: 'm1', recordedBy: 'u1' };
  it('builds a sound row (trims, nulls empties, defaults status)', () => {
    const out = buildObservation({ ...ids, position: '  Usher lead ', note: '' });
    expect(out.ok).toBe(true);
    expect(out.row).toMatchObject({
      instance_id: 'i1', member_user_id: 'm1', recorded_by: 'u1',
      position: 'Usher lead', note: null, status: 'active', satisfaction: null,
    });
  });
  it('CATCHES missing ids (the P35 tenant class)', () => {
    expect(buildObservation({ position: 'x' }).problems).toContain('missing-ids');
  });
  it('CATCHES an invalid observation instead of laundering it', () => {
    const out = buildObservation({ ...ids });
    expect(out.ok).toBe(false);
    expect(out.row).toBeNull();
  });
});

// 2026-08-23, Darrell inspecting his son: "what is inspect doing.... vs what
// is documented... requests and feedback..." — 0122's mirror ran one way
// (steward observes member). Now it runs both: the panel also shows the
// member's OWN recent feedback, confidential rows badged, never hidden as a
// false "no feedback".
import { readFileSync as rf } from 'node:fs';
import { join as j, dirname as dn } from 'node:path';
import { fileURLToPath as fu } from 'node:url';
const H = dn(fu(import.meta.url));
describe('the mirror runs both ways — their words beside your observations', () => {
  it('member-inspect-sync loads the member\'s real feedback rows with the confidential flag', () => {
    const lib = rf(j(H, '..', 'lib', 'member-inspect-sync.js'), 'utf8');
    expect(lib).toMatch(/export async function loadMemberFeedback/);
    expect(lib).toMatch(/feedback_text, sentiment, which_tab, submitted_at, is_confidential/);
  });
  it('MemberInspect renders their words with the confidential badge', () => {
    const src = rf(j(H, '..', 'components', 'MemberInspect.jsx'), 'utf8');
    expect(src).toMatch(/In their own words — recent feedback/);
    expect(src).toMatch(/confidential/);
    expect(src).toMatch(/loadMemberFeedback\(member\.userId\)/);
  });
});
