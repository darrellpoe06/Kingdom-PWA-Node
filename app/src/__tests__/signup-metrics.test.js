// Tests for lib/signup-metrics.js — the pure shaping of the platform-signup
// payload returned by the admin_signup_metrics() RPC. The fetch wrapper itself
// (network) is exercised in the live app; here we pin the pure logic that turns
// real RPC rows into the governor's view, so the shaping is verified
// independent of Supabase (DR-0076: measure/verify, don't claim).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  summaryTiles, categoryLabel, categoryTone, maskEmail,
  hasReturned, signupRowView, sortSignups, lastActiveAt, isActiveNow, ownNameOf,
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

describe('lastActiveAt', () => {
  it('prefers the effective last_active_at from the RPC', () => {
    expect(lastActiveAt({ last_active_at: iso(0), last_sign_in_at: iso(14 * DAY) })).toBe(iso(0));
  });
  it('falls back to the auth stamp when there is no presence-backed value', () => {
    expect(lastActiveAt({ last_sign_in_at: iso(3 * DAY) })).toBe(iso(3 * DAY));
  });
  it('is null when neither clock is present (never fabricated)', () => {
    expect(lastActiveAt({})).toBe(null);
    expect(lastActiveAt(null)).toBe(null);
  });
});

describe('hasReturned', () => {
  it('true when last activity is well after creation', () => {
    expect(hasReturned({ created_at: iso(10 * DAY), last_sign_in_at: iso(1 * DAY) })).toBe(true);
  });
  it('true when the auth stamp is stale but the presence heartbeat is fresh (the bug)', () => {
    // Signed up a month ago; auth stamp frozen 2w ago by silent token refresh;
    // but active in the app today per member_presence. Must read as returned.
    expect(hasReturned({
      created_at: iso(30 * DAY), last_sign_in_at: iso(14 * DAY), last_active_at: iso(0),
    })).toBe(true);
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

describe('isActiveNow', () => {
  it('true within the heartbeat-freshness window', () => {
    expect(isActiveNow({ last_active_at: iso(2 * 60 * 1000) }, NOW)).toBe(true); // 2 min ago
  });
  it('false once activity is older than the window', () => {
    expect(isActiveNow({ last_active_at: iso(30 * 60 * 1000) }, NOW)).toBe(false); // 30 min ago
  });
  it('false with no activity timestamp', () => {
    expect(isActiveNow({ last_sign_in_at: null }, NOW)).toBe(false);
    expect(isActiveNow(null, NOW)).toBe(false);
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
    expect(v.activeNow).toBe(false);
    expect(v.emailConfirmed).toBe(true);
  });

  it('drives "last active" from the live heartbeat, not the stale auth stamp', () => {
    // The exact reported bug: created 1mo ago, auth stamp 2w old (silent refresh),
    // but a presence heartbeat from this minute. Must read active now, not "2w ago".
    const v = signupRowView(
      { ...row, created_at: iso(30 * DAY), last_sign_in_at: iso(14 * DAY), last_active_at: iso(60 * 1000) },
      NOW,
    );
    expect(v.lastSeen).toBe('today');
    expect(v.activeNow).toBe(true);
    expect(v.returned).toBe(true);
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

// A phone-door account's address is the phone it signs in with, never a
// mailbox (DR-0825, member-contact.js): the view says the phone, formatted,
// and masked shows only the last four digits.
describe('signupRowView reads the phone door as a phone', () => {
  const door = { user_id: 'u2', display_name: null, email: '15550100498@phone.poetech.us', created_at: iso(DAY) };
  it('unmasked: the formatted number and how they sign in', () => {
    const v = signupRowView(door, NOW);
    expect(v.email).toBe('(555) 010-0498 · signs in by phone');
    expect(v.phoneDoor).toBe(true);
    expect(v.phone).toBe('15550100498');
    expect(v.rawEmail).toBe('15550100498@phone.poetech.us');
    expect(v.name).toBeNull();
  });
  it('masked: only the last four digits', () => {
    expect(signupRowView(door, NOW, true).email).toBe('phone ending 0498 · signs in by phone');
  });
  it('a real address is untouched', () => {
    const v = signupRowView({ user_id: 'u3', email: 'jane@x.com', created_at: iso(DAY) }, NOW);
    expect(v.phoneDoor).toBe(false);
    expect(v.email).toBe('jane@x.com');
  });
});

// A "name" that is only the account's identifier is no name (DR-0829): the
// phone door names an account by its digits, and showing them as a name hid
// the contact's real name beside it (Darrell's screenshot, 2026-10-09).
describe('ownNameOf', () => {
  it('digits, the address local part, or the whole address read as no name', () => {
    expect(ownNameOf('14472209779', '14472209779@phone.poetech.us')).toBeNull();
    expect(ownNameOf('(447) 220-9779', '14472209779@phone.poetech.us')).toBeNull();
    expect(ownNameOf('JBVaughn21@gmail.com', 'jbvaughn21@gmail.com')).toBeNull();
    expect(ownNameOf('', 'x@y.com')).toBeNull();
  });
  it('a chosen name stays, and an ordinary email local part may be one', () => {
    expect(ownNameOf('jbvaughn21', 'jbvaughn21@gmail.com')).toBe('jbvaughn21');
    expect(ownNameOf('Bro Clifton Reed', '12175205745@phone.poetech.us')).toBe('Bro Clifton Reed');
    expect(ownNameOf(' Jane ', 'jane@x.com')).toBe('Jane');
  });
  it('signupRowView uses it, so the contact name fills the gap on the row', () => {
    const v = signupRowView({ user_id: 'u', display_name: '14472209779', email: '14472209779@phone.poetech.us', created_at: iso(DAY) }, NOW);
    expect(v.name).toBeNull();
  });
});

// =============================================================================
// OUR OWN INSTRUMENTS ARE NOT PEOPLE (DR-1075)
// =============================================================================
// Darrell found the site-health probe on the Admin roster as an unexplained
// phone number signing in daily -- "(555) 555-0100 ... Who or what is this
// account? What is it doing daily?!!! Bot?!!!" -- and had to ask. Two defects
// in one row: a count that included our own robot, and a roster that could not
// say what the row was.
describe('our own probe is named, and counted as nobody', () => {
  it('the probe row SAYS what it is, on the row', () => {
    const v = signupRowView({
      user_id: 'probe', email: '15555550100@phone.poetech.us',
      category: 'our-probe', created_at: iso(30 * DAY), last_sign_in_at: iso(0),
    }, Date.now());
    expect(v.categoryLabel).toBe('Our own probe');
    expect(v.isOurs).toBe(true);
    // The sentence has to answer the question that was actually asked: who is
    // this, and what is it doing daily?
    expect(v.whatItIs).toMatch(/Not a person/);
    expect(v.whatItIs).toMatch(/every 6 hours/);
    expect(v.whatItIs).toMatch(/nas-health\.yml/);
    expect(v.whatItIs, 'the row must say it is out of the totals').toMatch(/Counted in none of the totals/);
  });

  it('an ordinary account explains nothing — a real person needs no explaining', () => {
    const v = signupRowView({ user_id: 'u1', email: 'a@b.com', category: 'self-serve', created_at: iso(DAY) }, Date.now());
    expect(v.whatItIs).toBe('');
    expect(v.isOurs).toBe(false);
  });

  it('EVERY category the server can emit has a label — nothing renders as "Unknown"', () => {
    // The roster asks a person to recognize a row. A row whose own category
    // has no label is the same defect in a different coat.
    for (const cat of ['self-serve', 'family', 'church', 'our-probe', 'other', 'unprovisioned']) {
      expect(categoryLabel(cat), `${cat} has no label`).not.toBe('Unknown');
      expect(categoryTone(cat), `${cat} has no tone`).toBeTruthy();
    }
  });

  it('THE TILE SAYS THE EXCLUSION HAPPENED — a count that silently drops rows is its own lie', () => {
    const tiles = summaryTiles({ total_accounts: 30, family_members: 6, church_members: 0, our_probes: 1 });
    const total = tiles.find((t) => t.label === 'Total accounts');
    expect(total.value).toBe(30);
    expect(total.sub).toMatch(/1 of ours not counted/);
  });

  it('...and says nothing when there is nothing to say', () => {
    const tiles = summaryTiles({ total_accounts: 30, family_members: 6, church_members: 0, our_probes: 0 });
    expect(tiles.find((t) => t.label === 'Total accounts').sub).not.toMatch(/not counted/);
  });

  it('the tile does NOT re-subtract — the server already excluded them', () => {
    // Two places computing one number is how they drift. The value is the
    // server's own, carried through untouched.
    const tiles = summaryTiles({ total_accounts: 30, our_probes: 4 });
    expect(tiles.find((t) => t.label === 'Total accounts').value).toBe(30);
  });
});

describe('the migration excludes the probe from every PEOPLE count (DR-1075)', () => {
  const raw = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..',
      'infra', 'supabase', 'migrations-auto', '0298-our-own-probe-is-not-a-person.sql'), 'utf8');
  // CODE ONLY. This migration's header NAMES every key it filters, and the
  // first version of the check below matched that prose instead of the query —
  // the fourth time in one session a test in this repo has been satisfied by
  // its own documentation. Comment lines are dropped, and the drop is asserted
  // not to have emptied the file.
  const sql = raw.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  it('the comment-stripper did not blank the migration', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION/);
    expect(sql.length).toBeGreaterThan(1000);
  });

  it('names the probe by its exact address, and nothing wider', () => {
    expect(sql).toContain("'15555550100@phone.poetech.us'");
    // A "any 555-01xx" rule would swallow a real test account somebody makes.
    expect(sql).not.toMatch(/LIKE\s+'%555-?01/i);
  });

  it('EVERY people count reads from `people`, never from `accounts`', () => {
    // The defect was a count over all rows. If one of these slips back to
    // `accounts`, the robot is a person again in exactly one tile -- the
    // hardest kind of wrong number to notice.
    for (const key of ['total_accounts', 'self_serve_signups', 'family_members', 'church_members',
      'signups_7d', 'signups_30d', 'active_7d', 'returned', 'never_returned']) {
      const line = sql.split('\n').find((l) => l.includes(`'${key}'`));
      expect(line, `${key} is not in the summary`).toBeTruthy();
      expect(line, `${key} still counts our own probe`).toMatch(/FROM people/);
    }
  });

  it('the probe count itself reads from `accounts`, or it would always be zero', () => {
    const line = sql.split('\n').find((l) => l.includes("'our_probes'"));
    expect(line).toMatch(/FROM accounts WHERE category = 'our-probe'/);
  });

  it('the probe is still LISTED — hiding it would restore the unanswered question', () => {
    // Asserted on the QUERY, not on a comment saying so. The detail list
    // selects from `accounts` (every row) and never from `people` (the
    // filtered set), so the probe reaches the roster where the question gets
    // asked.
    const detail = sql.slice(sql.indexOf('detail AS'));
    expect(detail).toMatch(/SELECT \* FROM accounts ORDER BY created_at/);
    expect(detail, 'the detail list filtered the probe out').not.toMatch(/FROM people/);
    expect(detail).not.toMatch(/category\s*<>\s*'our-probe'/);
  });

  it('ours is decided FIRST, so a probe that gains a membership is still ours', () => {
    const cas = sql.slice(sql.indexOf('CASE'), sql.indexOf('END                                AS category'));
    expect(cas.indexOf('our-probe')).toBeLessThan(cas.indexOf("'family'"));
  });
});
