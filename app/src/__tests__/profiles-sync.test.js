// =============================================================================
// profiles-sync — one full profile per person (DR-0342), proven at the seam
// =============================================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const calls = [];
vi.mock('../lib/supabase.js', () => {
  const rpc = vi.fn(async (name, args) => {
    calls.push([name, args]);
    if (name === 'get_profile') return { data: [{ user_id: args.other, display_name: 'Sister Ann', photo_thumb: null, house: 'the Ann house', ministries: ['Choir'], favorite_verse: 'Psalms 23:1', testimony: 'He kept me.', visibility: 'members', updated_at: '2026-09-09T00:00:00Z', full_view: true }], error: null };
    if (name === 'upsert_my_profile') return { data: { user_id: 'me', display_name: args.display_name_in, photo_thumb: args.photo_thumb_in, house: args.house_in, ministries: args.ministries_in, favorite_verse: args.favorite_verse_in, testimony: args.testimony_in, visibility: args.visibility_in, updated_at: 'now' }, error: null };
    return { data: null, error: null };
  });
  return { default: { rpc, auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) } };
});
vi.mock('../lib/image.js', () => ({ compressImageFile: async () => 'data:image/jpeg;base64,AAAA', isLikelyImageFile: () => true }));

import { profileShape, validateProfileFields, initialsOf, loadProfile, saveMyProfile, __resetProfileCache, PHOTO_THUMB_MAX_CHARS, photoThumbFromFile } from '../lib/profiles-sync.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SQL = readFileSync(join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0186-full-profiles-one-row-per-person-seen-by-the-people-who-may-already-message-you.sql'), 'utf8');

beforeEach(() => { calls.length = 0; __resetProfileCache(); });

describe('pure shapes', () => {
  it('profileShape reads a server row and defaults honestly', () => {
    expect(profileShape(null)).toBeNull();
    const p = profileShape({ user_id: 'u1', display_name: 'Ann', ministries: null, visibility: 'weird' });
    expect(p).toMatchObject({ userId: 'u1', displayName: 'Ann', ministries: [], visibility: 'members', fullView: true });
    expect(profileShape({ user_id: 'u1', display_name: 'Ann', full_view: false }).fullView).toBe(false);
  });
  it('validateProfileFields refuses what the server refuses, before it leaves the device', () => {
    expect(validateProfileFields({ displayName: '' }).ok).toBe(false);
    expect(validateProfileFields({ displayName: 'Ann', photoThumb: 'http://x/y.jpg' }).errors).toContain('the picture must be a small thumbnail');
    expect(validateProfileFields({ displayName: 'Ann', photoThumb: 'data:image/jpeg;base64,' + 'A'.repeat(PHOTO_THUMB_MAX_CHARS) }).ok).toBe(false);
    const v = validateProfileFields({ displayName: '  Ann  ', ministries: 'Choir, Bus;Ushers,,', testimony: 'x'.repeat(5000), visibility: 'nope' });
    expect(v.ok).toBe(true);
    expect(v.fields).toMatchObject({ displayName: 'Ann', ministries: ['Choir', 'Bus', 'Ushers'], visibility: 'members' });
    expect(v.fields.testimony.length).toBe(2000);
  });
  it('initials never blank', () => {
    expect(initialsOf('Darrell Poe')).toBe('DP');
    expect(initialsOf('Ann')).toBe('A');
    expect(initialsOf('')).toBe('?');
  });
});

describe('reads by id, cached; writes through the one server function', () => {
  it('loadProfile calls get_profile once per person and caches the card', async () => {
    const a = await loadProfile('u-ann');
    const b = await loadProfile('u-ann');
    expect(a).toMatchObject({ displayName: 'Sister Ann', house: 'the Ann house', favoriteVerse: 'Psalms 23:1' });
    expect(b).toBe(a);
    expect(calls.filter(([n]) => n === 'get_profile').length).toBe(1);
  });
  it('saveMyProfile validates, then sends exactly the server function\'s arguments', async () => {
    const r = await saveMyProfile({ displayName: 'Darrell Poe', ministries: 'Tech, Teaching', favoriteVerse: 'Genesis 49:10', testimony: 'He is faithful.', visibility: 'leaders', house: 'Poe' });
    expect(r.saved).toBe(true);
    const [name, args] = calls.find(([n]) => n === 'upsert_my_profile');
    expect(name).toBe('upsert_my_profile');
    expect(args).toEqual({ display_name_in: 'Darrell Poe', photo_thumb_in: null, house_in: 'Poe', ministries_in: ['Tech', 'Teaching'], favorite_verse_in: 'Genesis 49:10', testimony_in: 'He is faithful.', visibility_in: 'leaders' });
    expect(r.profile.displayName).toBe('Darrell Poe');
  });
  it('a bad save never reaches the server', async () => {
    const r = await saveMyProfile({ displayName: '' });
    expect(r.saved).toBe(false);
    expect(calls.length).toBe(0);
  });
  it('photoThumbFromFile makes a thumbnail, never a full photo', async () => {
    expect(await photoThumbFromFile(new Blob(['x']))).toMatch(/^data:image\//);
  });
});

describe('migration 0186 — the design is in the SQL (proven-to-catch source pins)', () => {
  it('one row per person keyed by auth user; RLS to the owner only; no direct read of others', () => {
    expect(SQL).toMatch(/CREATE TABLE IF NOT EXISTS profiles \(\s*user_id\s+uuid PRIMARY KEY REFERENCES auth\.users\(id\)/);
    expect(SQL).toMatch(/ALTER TABLE profiles ENABLE ROW LEVEL SECURITY/);
    expect(SQL).toMatch(/CREATE POLICY profiles_read_own ON profiles FOR SELECT\s+USING \(user_id = auth\.uid\(\)\)/);
    expect(SQL).not.toMatch(/FOR SELECT\s+USING \(auth\.uid\(\) IS NOT NULL\)/);
  });
  it('the list never carries the bytes: only a capped thumbnail; every text field capped', () => {
    expect(SQL).toMatch(/photo_thumb.*char_length\(photo_thumb\) <= 32000/);
    expect(SQL).toMatch(/testimony.*<= 2000/);
    expect(SQL).toMatch(/cardinality\(ministries\) <= 12/);
  });
  it('who may see a profile is who may message them — users_can_dm reused, narrowed by visibility', () => {
    expect(SQL).toMatch(/FUNCTION public\.get_profile\(other uuid\)/);
    expect(SQL).toMatch(/users_can_dm\(im\.instance_id, other\)/);
    expect(SQL).toMatch(/visibility IN \('members','leaders','private'\)/);
    expect(SQL).toMatch(/SECURITY DEFINER/);
    expect(SQL).toMatch(/REVOKE ALL ON FUNCTION public\.get_profile\(uuid\) FROM anon, public/);
  });
  it('one write, one name everywhere: upsert_my_profile updates every membership\'s display_name', () => {
    expect(SQL).toMatch(/FUNCTION public\.upsert_my_profile\(/);
    expect(SQL).toMatch(/UPDATE instance_members SET display_name = nm WHERE user_id = me/);
    expect(SQL).toMatch(/RAISE EXCEPTION 'the picture must be a small image thumbnail'/);
  });
});
