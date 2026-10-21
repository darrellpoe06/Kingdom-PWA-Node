// =============================================================================
// A door shows its pictures to its people (DR-1197, migration 0309)
// =============================================================================
// The pure halves of the change, and the pins that keep the data wall, the
// app's words and the CI proof in one place:
//   - picturesInRoom / countLine: the tenant's room filter and its one line
//   - picturesWord / picturesValue / rentalPatchOut: the landlord's switch, a
//     word on the form and a boolean on the row, ON unless held
//   - the migration: the switch column, the helper that mirrors
//     door_role_of_user, a LISTING-only door-level read, the rooms read
//   - the smoke exists and both CI legs run it (the door-work leg twice-applied,
//     the live rls-isolation leg)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { picturesInRoom, countLine, EVERY_ROOM, NO_ROOM, WORDS } from '../modules/properties/DoorPictures.jsx';
import { picturesWord, picturesValue, rentalPatchOut, PICTURES_WORDS } from '../modules/properties/DoorTabs.jsx';
import { TENANT_TABS } from '../modules/properties/model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const MIG = '0309-a-door-shows-its-pictures-to-its-people.sql';
const SMOKE = '0309-door-pictures-smoke.sql';

describe('the room filter', () => {
  const shots = [
    { id: 'a', room_id: 'k', caption: 'Kitchen' },
    { id: 'b', room_id: null, caption: 'Front' },
    { id: 'c', room_id: 'k', caption: 'Sink', archived_at: '2026-10-01' },
    { id: 'd', room_id: 'b', caption: 'Bath' },
  ];
  it('every room, one room, no room; an archived picture is never drawn', () => {
    expect(picturesInRoom(shots, EVERY_ROOM).map((p) => p.id)).toEqual(['a', 'b', 'd']);
    expect(picturesInRoom(shots, 'k').map((p) => p.id)).toEqual(['a']);
    expect(picturesInRoom(shots, NO_ROOM).map((p) => p.id)).toEqual(['b']);
    expect(picturesInRoom(null, EVERY_ROOM)).toEqual([]);
  });
  it('counts in plain words', () => {
    expect(countLine(0)).toBe('0 pictures');
    expect(countLine(1)).toBe('1 picture');
    expect(countLine(3, 'Kitchen')).toBe('3 pictures · Kitchen');
  });
  it('the tenant face carries the tab, and the words say what is and is not shown', () => {
    expect(TENANT_TABS.map((t) => t.id)).toContain('pictures');
    expect(WORDS.whatYouSee).toMatch(/listing pictures your landlord shares/);
    expect(WORDS.whatYouSee).toMatch(/Condition pictures from before your time are not part of them/);
    expect(WORDS.unreachable).toMatch(/unknown rather than absent/);
  });
});

describe("the landlord's switch", () => {
  it('is ON unless held: an unset row reads as shared, false reads as held', () => {
    expect(picturesWord(undefined)).toBe(PICTURES_WORDS.shared);
    expect(picturesWord(true)).toBe(PICTURES_WORDS.shared);
    expect(picturesWord(false)).toBe(PICTURES_WORDS.held);
    expect(picturesValue(PICTURES_WORDS.held)).toBe(false);
    expect(picturesValue(PICTURES_WORDS.shared)).toBe(true);
  });
  it('the edit patch turns the word into the column, beside the utilities word, and leaves other keys alone', () => {
    expect(rentalPatchOut({ pictures: PICTURES_WORDS.held, unit: 'Apt 2' })).toEqual({ pictures_shared_with_door: false, unit: 'Apt 2' });
    expect(rentalPatchOut({ pictures: PICTURES_WORDS.shared, utilities: 'x' })).toMatchObject({ pictures_shared_with_door: true });
    expect(rentalPatchOut({ unit: 'Apt 2' })).toEqual({ unit: 'Apt 2' });
  });
});

describe('the data wall, pinned at the text', () => {
  const sql = read('infra', 'supabase', 'migrations-auto', MIG);
  it('adds the per-door switch, ON by default', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS pictures_shared_with_door boolean NOT NULL DEFAULT true/);
  });
  it('opens door-level LISTING pictures only, to the door\'s tenant or household, while the switch is on', () => {
    const pol = sql.slice(sql.indexOf('CREATE POLICY property_photos_door_people_read'), sql.indexOf('DROP POLICY IF EXISTS property_rooms_door_people_read'));
    expect(pol).toMatch(/tenancy_id IS NULL/);
    expect(pol).toMatch(/kind = 'listing'/);
    expect(pol).toMatch(/archived_at IS NULL/);
    expect(pol).toMatch(/door_shares_pictures_with\(rental_ref\)/);
    const fn = sql.slice(sql.indexOf('FUNCTION public.door_shares_pictures_with'), sql.indexOf('REVOKE ALL ON FUNCTION public.door_shares_pictures_with'));
    expect(fn).toMatch(/r\.pictures_shared_with_door/);
    expect(fn).toMatch(/door_role_of_user\(r\.id\) IN \('tenant', 'household'\)/);
  });
  it('opens the rooms of that door, read-only, by the same rule', () => {
    const pol = sql.slice(sql.indexOf('CREATE POLICY property_rooms_door_people_read'));
    expect(pol).toMatch(/FOR SELECT TO authenticated/);
    expect(pol).toMatch(/door_shares_pictures_with\(rental_ref\)/);
    expect(sql).not.toMatch(/property_rooms_door_people_(write|update)/);
  });
  it('the smoke exists, rolls back, and both CI legs run it', () => {
    const smoke = read('infra', 'supabase', 'tests', SMOKE);
    expect(smoke).toMatch(/^BEGIN;/m);
    expect(smoke).toMatch(/^ROLLBACK;/m);
    expect(smoke).toMatch(/DOOR PICTURES SMOKE: PASS/);
    expect(smoke).toMatch(/never reads a turn shot/);
    expect(smoke).toMatch(/with the switch off the tenant loses the listing shot/);
    const ci = read('.github', 'workflows', 'ci.yml');
    expect(ci).toMatch(new RegExp(`for i in 1 2; do psql [^\\n]*${MIG}`));
    expect(ci).toMatch(new RegExp(`tests/${SMOKE}`));
    const live = read('.github', 'workflows', 'rls-isolation.yml');
    expect(live).toMatch(new RegExp(MIG.replace(/\./g, '\\.')));
    expect(live).toMatch(new RegExp(SMOKE.replace(/\./g, '\\.')));
  });
});
