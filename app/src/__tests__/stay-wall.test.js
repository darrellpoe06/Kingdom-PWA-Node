// =============================================================================
// The Life wall's rules (DR-1010, 0289) — pure
// =============================================================================
// The wording the app carries is byte-for-byte the wording 0289 seeds, so the
// fingerprint the database refuses a signature against is the fingerprint of
// what the signer read. The submission rules, the grouping of the public wall
// by building, and the guest card's memory of what it shared.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  WORDING_V1, WORDING_VERSION_V1, STAY_WALL_ATTESTATION, ESIGN_CONSENT, ATTESTATIONS, LIMITS,
  validateSubmission, statusLine, groupWalls, wallsForShelf, rememberGuestShare, guestShares, GUEST_SHARED_KEY,
} from '../modules/properties/stay-wall.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MIGRATION = join(ROOT, 'infra/supabase/migrations-auto/0289-a-stay-picture-joins-the-wall-with-the-familys-yes.sql');

describe('the wording', () => {
  it('is the exact text 0289 seeds as v1 — the database fingerprints that text', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    const m = /\$wording\$([\s\S]*?)\$wording\$/.exec(sql);
    expect(m).not.toBeNull();
    expect(m[1]).toBe(WORDING_V1);
    expect(sql).toMatch(new RegExp(`VALUES \\('${WORDING_VERSION_V1}', \\$wording\\$`));
  });
  it('PROVEN-TO-CATCH: one changed character is a different fingerprint', () => {
    const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');
    expect(sha(WORDING_V1)).not.toBe(sha(`${WORDING_V1} `));
    expect(sha(WORDING_V1)).toMatch(/^[0-9a-f]{64}$/);
  });
  it('is plain ASCII with straight quotes, so no device re-encodes it', () => {
    expect([...WORDING_V1].every((ch) => { const c = ch.charCodeAt(0); return c === 9 || c === 10 || (c >= 32 && c <= 126); })).toBe(true);
  });
  it('says the five things the record needs', () => {
    for (const must of ['17 U.S.C. 204(a)', 'E-SIGN', 'take', 'under eighteen', 'fingerprint', 'without payment']) expect(WORDING_V1).toContain(must);
  });
  it('the two sentences a signature carries are the house\'s own', () => {
    expect(STAY_WALL_ATTESTATION).toBe('By checking this box, I acknowledge that I have read the rights assignment in full and I agree to be bound by it.');
    expect(ESIGN_CONSENT).toMatch(/^By typing my full legal name I sign this document electronically/);
  });
});

describe('validateSubmission', () => {
  const good = { pictures: [{ image: 'data:image/jpeg;base64,x' }], name: 'Tess Tenant', caption: '', own: true, consent: true, minors: true, read: true, sign: true };
  it('accepts a whole submission', () => {
    expect(validateSubmission(good)).toEqual({ ok: true, errors: {} });
  });
  it('PROVEN-TO-CATCH: each of the three attestations, the read, the consent, the name and a picture are each required', () => {
    for (const a of ATTESTATIONS) expect(validateSubmission({ ...good, [a.key]: false }).errors[a.key]).toBeTruthy();
    expect(validateSubmission({ ...good, read: false }).errors.read).toBeTruthy();
    expect(validateSubmission({ ...good, sign: false }).errors.sign).toBeTruthy();
    expect(validateSubmission({ ...good, name: 'T' }).errors.name).toBeTruthy();
    expect(validateSubmission({ ...good, pictures: [] }).errors.pictures).toBeTruthy();
    expect(validateSubmission({ ...good, pictures: new Array(LIMITS.pictures + 1).fill(good.pictures[0]) }).errors.pictures).toBeTruthy();
    expect(validateSubmission({ ...good, caption: 'x'.repeat(LIMITS.caption + 1) }).errors.caption).toBeTruthy();
  });
});

describe('statusLine', () => {
  it('says where a picture stands', () => {
    expect(statusLine({ status: 'pending' })).toMatch(/Waiting for the family/);
    expect(statusLine({ status: 'approved' })).toBe('On the wall');
    expect(statusLine({ status: 'approved', listing_photo_id: 'p' })).toBe('On the wall and in the listing');
    expect(statusLine({ status: 'approved', removal_asked_at: 'now' })).toMatch(/off the wall/);
    expect(statusLine({ status: 'declined', decline_reason: 'blurry' })).toBe('Not shown: blurry');
    expect(statusLine({ status: 'removed' })).toBe('Taken down');
  });
});

describe('the public wall, grouped by building', () => {
  const rows = [
    { id: 'p1', wall_key: 'k805', wall_label: 'Life at 805', door_ids: ['a', 'c'], caption: 'pancakes' },
    { id: 'p2', wall_key: 'k805', wall_label: 'Life at 805', door_ids: ['a', 'c'], caption: 'porch' },
    { id: 'p3', wall_key: 'k9', wall_label: 'Life at this home', door_ids: ['b'], caption: 'yard' },
  ];
  it('one wall per key, its pictures in the order received', () => {
    const walls = groupWalls(rows);
    expect(walls.map((w) => [w.key, w.label, w.doorIds, w.pictures.map((p) => p.id)])).toEqual([
      ['k805', 'Life at 805', ['a', 'c'], ['p1', 'p2']],
      ['k9', 'Life at this home', ['b'], ['p3']],
    ]);
  });
  it('a wall hangs under the shelf only when its building has a card there', () => {
    const walls = groupWalls(rows);
    expect(wallsForShelf(walls, ['c']).map((w) => w.key)).toEqual(['k805']);
    expect(wallsForShelf(walls, ['b', 'a']).map((w) => w.key)).toEqual(['k805', 'k9']);
    expect(wallsForShelf(walls, ['zzz'])).toEqual([]);
    expect(wallsForShelf(walls, [])).toEqual([]);
  });
  it('tolerates an empty or malformed read', () => {
    expect(groupWalls(null)).toEqual([]);
    expect(groupWalls([null, {}])).toEqual([]);
  });
});

describe('the guest card remembers what this device shared', () => {
  const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
  it('keeps the ids per card key, newest last, at most twenty', () => {
    const st = store();
    rememberGuestShare('tok', 'id1', st);
    rememberGuestShare('tok', 'id2', st);
    rememberGuestShare('tok', 'id1', st);
    rememberGuestShare('other', 'id9', st);
    expect(guestShares('tok', st)).toEqual(['id1', 'id2']);
    expect(guestShares('other', st)).toEqual(['id9']);
    expect(guestShares('none', st)).toEqual([]);
    for (let i = 0; i < 30; i += 1) rememberGuestShare('many', `x${i}`, st);
    expect(guestShares('many', st)).toHaveLength(20);
    expect(JSON.parse(st.getItem(GUEST_SHARED_KEY)).tok).toEqual(['id1', 'id2']);
  });
  it('a device with no storage neither throws nor remembers', () => {
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(() => rememberGuestShare('tok', 'id', broken)).not.toThrow();
    expect(guestShares('tok', broken)).toEqual([]);
  });
});
