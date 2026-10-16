// =============================================================================
// church-profile.test.js — a church's face and channels as data (0297, DR-1066)
// =============================================================================
// Proven-to-catch (DR-0076 §3): the rules are the same rules the database
// trigger enforces, so each case here names the thing the wall would refuse
// and asserts the phone refuses it first, in the same words. And the one
// decision that could go quietly wrong — whose channels the Give panel shows —
// is pinned from every side: another church never inherits COLG's list.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  slugProblem, suggestSlug, emailProblem, channelsProblem, profileProblem,
  normalizeChannels, profileFromForm, formFromProfile, mergeChurchRecord,
  resolveChurchGiving, provisionRequest, isHttpsLink, MAX_GIVING_CHANNELS,
  CHANNEL_KINDS, PROFILE_FIELDS, RESERVED_SLUGS, DOOR_CONSTRAINT,
} from '../lib/church-profile.js';
import { GIVING_CHANNELS } from '../lib/giving.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const good = (over = {}) => ({ id: 'cashapp', label: 'Cash App', url: 'https://cash.app/$X', display: '$X', how: 'Opens Cash App.', ...over });

describe('slugs — the short name a church is keyed by', () => {
  it('accepts the shape provision_church_instance accepts', () => {
    expect(slugProblem('first-baptist-compton')).toBeNull();
    expect(slugProblem('ab')).toBeNull();
    expect(slugProblem('colg')).toBeNull();
  });
  it('refuses what the database refuses, before the wire', () => {
    expect(slugProblem('a')).toMatch(/2 to 40/);
    expect(slugProblem('Bad Slug!')).toMatch(/2 to 40/);
    expect(slugProblem('-leading')).toMatch(/2 to 40/);
    expect(slugProblem('x'.repeat(41))).toMatch(/2 to 40/);
    for (const r of RESERVED_SLUGS) expect(slugProblem(r)).toMatch(/reserved/);
    expect(slugProblem('u-123')).toMatch(/reserved/);
  });
  it('suggests a slug from a church name a steward can read back', () => {
    expect(suggestSlug('First Baptist of Compton')).toBe('first-baptist-of-compton');
    expect(suggestSlug('  Grace & Truth Church!! ')).toBe('grace-and-truth-church');
    expect(suggestSlug('Iglesia Señor')).toBe('iglesia-senor');
    expect(slugProblem(suggestSlug('A very long church name that keeps going on and on and on forever'))).toBeNull();
  });
});

describe('emails', () => {
  it('needs a real address because it is the way in', () => {
    expect(emailProblem('bishop@church.org')).toBeNull();
    expect(emailProblem('not-an-email')).toMatch(/real email/);
    expect(emailProblem('')).toMatch(/real email/);
  });
});

describe('giving channels — the same rule as the trigger, in the same words', () => {
  it('accepts a sound list', () => {
    expect(channelsProblem([good(), good({ id: 'zelle', label: 'Zelle', url: 'https://enroll.zellepay.com/qr-codes/?data=abc' })])).toBeNull();
    expect(channelsProblem([])).toBeNull();
  });
  it('refuses a non-list, a non-object, and more than eight', () => {
    expect(channelsProblem(null)).toBe('giving channels must be a list');
    expect(channelsProblem({})).toBe('giving channels must be a list');
    expect(channelsProblem(['x'])).toBe('each giving channel must be an object');
    const nine = Array.from({ length: MAX_GIVING_CHANNELS + 1 }, (_, i) => good({ id: `c${i}` }));
    expect(channelsProblem(nine)).toBe(`at most ${MAX_GIVING_CHANNELS} giving channels`);
  });
  it('refuses the links the never-invent-a-URL rule refuses: http, javascript:, no host, a bare word', () => {
    expect(channelsProblem([good({ url: 'http://cash.app/$X' })])).toMatch(/complete https link \(Cash App\)/);
    expect(channelsProblem([good({ url: 'javascript:alert(1)' })])).toMatch(/complete https link/);
    expect(channelsProblem([good({ url: 'https://' })])).toMatch(/complete https link/);
    expect(channelsProblem([good({ url: 'cash.app/$X' })])).toMatch(/complete https link/);
    expect(channelsProblem([good({ url: 'https://cash.app/$X with space' })])).toMatch(/complete https link/);
  });
  it('refuses a bad id, a duplicate id, a missing label, and over-long text', () => {
    expect(channelsProblem([good({ id: 'Cash App' })])).toMatch(/id of letters, digits and dashes/);
    expect(channelsProblem([good(), good()])).toBe('channel ids must be unique: cashapp');
    expect(channelsProblem([good({ label: '' })])).toMatch(/label of 1 to 40/);
    expect(channelsProblem([good({ label: 'x'.repeat(41) })])).toMatch(/label of 1 to 40/);
    expect(channelsProblem([good({ display: 'x'.repeat(121) })])).toMatch(/display is too long/);
    expect(channelsProblem([good({ how: 'x'.repeat(201) })])).toMatch(/note is too long/);
  });
  it('COLG’s own shipped constants pass the rule (the rule was written from them, not against them)', () => {
    expect(channelsProblem(GIVING_CHANNELS)).toBeNull();
  });
});

describe('the profile', () => {
  it('accepts COLG’s record as a profile and an empty object', () => {
    expect(profileProblem({})).toBeNull();
    expect(profileProblem(COLG_DEFAULT_CHURCH)).toBeNull();
  });
  it('refuses non-https links anywhere a link lives', () => {
    expect(profileProblem({ site: 'ftp://x.org' })).toMatch(/site link/);
    expect(profileProblem({ links: { give: 'http://x.org/give' } })).toMatch(/give link/);
    expect(profileProblem({ media: { youtube: 'youtube.com/@x' } })).toMatch(/youtube link/);
    expect(profileProblem({ links: 'nope' })).toBe('links must be an object');
    expect(profileProblem({ services: 'Sunday' })).toBe('services must be a list');
    expect(profileProblem([])).toBe('the profile must be an object');
    expect(profileProblem({ name: 'x'.repeat(121) })).toBe('the name is too long');
  });
});

describe('form rows -> channels', () => {
  it('drops blank rows, derives ids, keeps them unique, and fills the kind’s sentence', () => {
    const rows = [
      { kind: 'cashapp', label: 'Cash App', url: 'https://cash.app/$X', display: '$X' },
      { kind: 'cashapp', label: 'Cash App (youth)', url: 'https://cash.app/$Y' },
      { label: '', url: '' },
      { label: 'Our giving page', url: 'https://x.org/give' },
    ];
    const out = normalizeChannels(rows);
    expect(out.map((c) => c.id)).toEqual(['cashapp', 'cashapp-2', 'our-giving-page']);
    expect(out[0].how).toBe(CHANNEL_KINDS.find((k) => k.id === 'cashapp').how);
    expect(out[2].how).toBe('');
    expect(channelsProblem(out)).toBeNull();
  });
});

describe('profile <-> form', () => {
  it('round-trips the nested links and media through flat form values', () => {
    const p = { name: 'Grace', site: 'https://grace.org', links: { give: 'https://grace.org/give' }, media: { youtube: 'https://www.youtube.com/@grace' } };
    const form = formFromProfile(p);
    expect(form.givePage).toBe('https://grace.org/give');
    expect(form.youtube).toBe('https://www.youtube.com/@grace');
    expect(profileFromForm(form)).toEqual(p);
    expect(PROFILE_FIELDS.find((f) => f.key === 'name').required).toBe(true);
  });
  it('an empty form is an empty profile, not a profile of empty strings', () => {
    expect(profileFromForm({ name: '', site: ' ' })).toEqual({});
  });
});

describe('merging a profile row over the record the shell carries', () => {
  it('a row never erases a field it does not set', () => {
    const merged = mergeChurchRecord(COLG_DEFAULT_CHURCH, { profile: 'ignored-shape' });
    expect(merged.youtubeChannelId).toBe(COLG_DEFAULT_CHURCH.youtubeChannelId);
    const merged2 = mergeChurchRecord(COLG_DEFAULT_CHURCH, { links: { give: 'https://thechurchofthelivinggod.com/give' } });
    expect(merged2.links.give).toBe('https://thechurchofthelivinggod.com/give');
    expect(merged2.links.about).toBe(COLG_DEFAULT_CHURCH.links.about);
    expect(merged2.services).toEqual(COLG_DEFAULT_CHURCH.services);
  });
  it('a null or missing row returns the base untouched', () => {
    expect(mergeChurchRecord(COLG_DEFAULT_CHURCH, null)).toBe(COLG_DEFAULT_CHURCH);
  });
});

describe('whose channels the Give panel shows — the decision that could go quietly wrong', () => {
  const grace = { name: 'Grace Church', site: 'https://grace.org', links: { give: 'https://grace.org/give' } };
  it('the office’s own rows win for any church, COLG included', () => {
    const rows = [good({ id: 'givelify', label: 'Givelify', url: 'https://www.givelify.com/donate/x' })];
    const r = resolveChurchGiving({ church: COLG_DEFAULT_CHURCH, slug: 'colg', profile: { giving_channels: rows } });
    expect(r.source).toBe('profile');
    expect(r.channels).toBe(rows);
    expect(r.line).toMatch(/entered by its office/);
  });
  it('COLG with no row of its own shows its slide constants — by slug, and by record while the slug is unknown', () => {
    expect(resolveChurchGiving({ church: COLG_DEFAULT_CHURCH, slug: 'colg', profile: null }).channels).toBe(GIVING_CHANNELS);
    const byRecord = resolveChurchGiving({ church: COLG_DEFAULT_CHURCH, slug: null, profile: null });
    expect(byRecord.source).toBe('colg');
    expect(byRecord.line).toMatch(/GIVE ONLINE slide/);
  });
  it('ANOTHER church never inherits COLG’s list: an honest empty state instead', () => {
    const r = resolveChurchGiving({ church: grace, slug: 'grace-church', profile: null });
    expect(r.source).toBe('none');
    expect(r.channels).toEqual([]);
    expect(r.line).toMatch(/not published its giving channels/);
    // Even when the record is COLG's but the SLUG says another church (a COLG
    // member's device opening a second church), the slug decides.
    expect(resolveChurchGiving({ church: COLG_DEFAULT_CHURCH, slug: 'grace-church', profile: null }).source).toBe('none');
  });
  it('a row whose channels fail the rule is not shown as if it passed', () => {
    const r = resolveChurchGiving({ church: grace, slug: 'grace-church', profile: { giving_channels: [good({ url: 'http://x' })] } });
    expect(r.source).toBe('none');
  });
});

describe('the steward’s request', () => {
  it('builds the RPC arguments only from a sound request', () => {
    const r = provisionRequest({ slug: 'Grace-Church', name: ' Grace Church ', leaderEmail: 'Bishop@Grace.org', site: 'https://grace.org' });
    expect(r.ok).toBe(true);
    expect(r.args).toEqual({ slug_in: 'grace-church', display_name_in: 'Grace Church', leader_email_in: 'bishop@grace.org', leader_role_in: 'owner', profile_in: { site: 'https://grace.org' } });
  });
  it('names the first problem it finds, in the office’s words', () => {
    expect(provisionRequest({ slug: 'x', name: 'Grace', leaderEmail: 'a@b.co' }).problem).toMatch(/2 to 40/);
    expect(provisionRequest({ slug: 'grace', name: 'G', leaderEmail: 'a@b.co' }).problem).toMatch(/church name/);
    expect(provisionRequest({ slug: 'grace', name: 'Grace', leaderEmail: 'nope' }).problem).toMatch(/real email/);
    expect(provisionRequest({ slug: 'grace', name: 'Grace', leaderEmail: 'a@b.co', site: 'grace.org' }).problem).toMatch(/https/);
    expect(provisionRequest({ slug: 'grace', name: 'Grace', leaderEmail: 'a@b.co', leaderRole: 'member' }).args.leader_role_in).toBe('owner');
  });
  it('states the remaining constraint rather than hiding it', () => {
    expect(DOOR_CONSTRAINT).toMatch(/installable door/);
    expect(DOOR_CONSTRAINT).toMatch(/not yet a form/);
    expect(isHttpsLink('https://poetech.us/lovecorner/')).toBe(true);
  });
});
