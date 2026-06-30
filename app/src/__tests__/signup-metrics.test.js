// Tests for lib/signup-metrics.js — the pure shaping of the platform-signup
// payload returned by the admin_signup_metrics() RPC. The fetch wrapper itself
// (network) is exercised in the live app; here we pin the pure logic that turns
// real RPC rows into the governor's view, so the shaping is verified
// independent of Supabase (DR-0076: measure/verify, don't claim).
import { describe, it, expect } from 'vitest';
import {
  summaryTiles, categoryLabel, categoryTone, maskEmail,
  hasReturned, signupRowView, sortSignups,
} from '../lib/signup-metrics.js';

// A fixed "now" so relative-time output is deterministic.
const NOW = Date.parse('2026-06-29T12:00:00Z');
const iso = (msAgo) => new Date(NOW - msAgo).toISOString();
const DAY = 24 * 60 * 60 * 1000;

describe('summaryTiles', () => {
  it('maps a real summary into four tiles with subs', () => {
    const tiles = summaryTiles({
      total_accounts: 12, family_members: 3, church_members: 4,
      self_serve_signups: 5, signups_7d: 2, signups_30d: 6,
      active_7d: 4, returned: 7,
    });
    expect(tiles).toHaveLength(4);
    expect(tiles[0]).toEqual({ label: 'Total accounts', value: 12, sub: '3 family · 4 church' });
    expect(tiles[1].value).toBe(5);
    expect(tiles[2]).toEqual({ label: 'New (7d)', value: 2, sub: '6 in 30d' });
    expect(tiles[3]).toEqual({ label: 'Active (7d)', value: 4, sub: '7 ever returned' });
  });

  it('treats missing/blank summary as zeros, never blank (honest)', () => {
    for (const tiles of [summaryTiles(null), summaryTiles({}), summaryTiles(undefined)]) {
      expect(tiles).toHaveLength(4);
      for (const t of tiles) expect(t.value).toBe(0);
    }
  });
});

describe('categoryLabel / categoryTone', () => {
  it('labels each known category', () => {
    expect(categoryLabel('self-serve')).toBe('Public signup');
    expect(categoryLabel('family')).toBe('Family');
    expect(categoryLabel('church')).toBe('Church');
    expect(categoryLabel('unprovisioned')).toBe('No space yet');
  });
  it('falls back to Unknown for anything unrecognized', () => {
    expect(categoryLabel('nope')).toBe('Unknown');
    expect(categoryLabel(undefined)).toBe('Unknown');
    expect(categoryTone('nope')).toBe('neutral');
  });
});

describe('maskEmail', () => {
  it('keeps first char + domain', () => {
    expect(maskEmail('jane.doe@gmail.com')).toBe('j…@gmail.com');
    expect(maskEmail('A@b.co')).toBe('A…@b.co');
  });
  it('handles falsy + non-address input honestly', () => {
    expect(maskEmail('')).toBe('(no email)');
    expect(maskEmail(null)).toBe('(no email)');
    expect(maskEmail('notanemail')).toBe('notanemail');
    expect(maskEmail('@nostart.com')).toBe('@nostart.com');
  });
});

describe('hasReturned', () => {
  it('true when last sign-in is well after creation', () => {
    expect(hasReturned({ created_at: iso(10 * DAY), last_sign_in_at: iso(1 * DAY) })).toBe(true);
  });
  it('false when never signed in, or only the creation sign-in', () => {
    expect(hasReturned({ created_at: iso(DAY), last_sign_in_at: null })).toBe(false);
    // last == created (signed up, never came back): within the 5-min grace.
    const t = iso(DAY);
    expect(hasReturned({ created_at: t, last_sign_in_at: t })).toBe(false);
  });
  it('false on missing/garbage timestamps', () => {
    expect(hasReturned(null)).toBe(false);
    expect(hasReturned({ created_at: 'x', last_sign_in_at: 'y' })).toBe(false);
  });
});

describe('signupRowView', () => {
  const row = {
    user_id: 'u1', display_name: ' Jane ', email: 'jane@x.com',
    category: 'self-serve', instance_type: 'family', role: 'owner',
    created_at: iso(3 * DAY), last_sign_in_at: iso(1 * DAY), email_confirmed: true,
  };

  it('shapes real fields, trims name, computes relative times', () => {
    const v = signupRowView(row, NOW);
    expect(v.name).toBe('Jane');
    expect(v.email).toBe('jane@x.com');
    expect(v.categoryLabel).toBe('Public signup');
    expect(v.joined).toBe('3d ago');
    expect(v.lastSeen).toBe('yesterday');
    expect(v.returned).toBe(true);
    expect(v.emailConfirmed).toBe(true);
  });

  it('masks email when asked, keeping the raw for actions', () => {
    const v = signupRowView(row, NOW, true);
    expect(v.email).toBe('j…@x.com');
    expect(v.rawEmail).toBe('jane@x.com');
  });

  it('reports never-signed-in honestly', () => {
    const v = signupRowView({ ...row, last_sign_in_at: null }, NOW);
    expect(v.lastSeen).toBe('never');
    expect(v.returned).toBe(false);
  });

  it('handles an empty row without throwing', () => {
    const v = signupRowView(null, NOW);
    expect(v.email).toBe('(no email)');
    expect(v.name).toBe(null);
    expect(v.category).toBe('unknown');
  });
});

describe('sortSignups', () => {
  it('orders newest-created first and does not mutate input', () => {
    const input = [
      { user_id: 'old', created_at: iso(30 * DAY) },
      { user_id: 'new', created_at: iso(1 * DAY) },
      { user_id: 'mid', created_at: iso(10 * DAY) },
    ];
    const out = sortSignups(input);
    expect(out.map((r) => r.user_id)).toEqual(['new', 'mid', 'old']);
    expect(input[0].user_id).toBe('old'); // original untouched
  });
  it('tolerates empty / missing dates', () => {
    expect(sortSignups(null)).toEqual([]);
    const out = sortSignups([{ user_id: 'a' }, { user_id: 'b', created_at: iso(DAY) }]);
    expect(out[0].user_id).toBe('b');
  });
});
