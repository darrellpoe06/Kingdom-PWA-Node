// @vitest-environment jsdom
// =============================================================================
// THE FAMILY'S APP HOLDS EACH RECORD WHOLE, ONCE; BOTH DOORS READ ONE ROW (DR-0999)
// =============================================================================
// Darrell, 2026-10-13: "they all should be in sync... correct? End to end
// processes!!!" The repairs are decided here on his records' shapes; the
// sync mappers are proven to carry the archive name and the structure both
// ways; the NAS client is proven to take the direct road when the same-origin
// one answers the app's own HTML (#2057) and to say which road answered.
import { describe, it, expect } from 'vitest';
import { recordRepairs, holdTheRecords } from '../modules/properties/hold-the-record.js';
import { rentalToRow, rentalFromRow } from '../lib/rentals-sync.js';
import { localPatchToCloud, CLOUD_TO_LOCAL } from '../lib/rental-write.js';
import {
  nasFetch, nasRoad, fetchChannels, fetchListingPhoto, chatChannelFor, NAS_PHOTO_DIRECT, NAS_PHOTO_BASE, setBridgeToken,
} from '../lib/nas-photos.js';

const json = (body, status = 200) => ({ ok: status < 400, status, headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null) }, json: async () => body });
const html = () => ({ ok: true, status: 200, headers: { get: () => 'text/html; charset=utf-8' }, json: async () => { throw new SyntaxError('<'); } });

describe('the one-time repairs, decided on his records', () => {
  const doors = [
    { id: 'u1', slug: 'r-1508williamsburg', address: '1508 Williamsburg, Champaign, IL, 61821', city: '', state: '', zip: '', unit: '' },
    { id: 'u2', slug: 'r-709commercial', address: '709 Commercial St, IL', city: '', state: '' },
    { id: 'u3', slug: 'r-805nprospect', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL' },
    { id: 'u4', slug: 'r-other', address: '12 Oak Street', city: 'Danville', state: 'IL', photo_channel: 'Already' },
    // Apt 1: not in the old list, so the live app sent its display name as the
    // channel and the NAS answered 400 (Darrell's screenshot, 2026-10-13).
    { id: 'u5', slug: 'r-805nprospect-apt-1', address: '805 North Prospect Avenue', unit: 'Apt 1', city: 'Champaign', state: 'Illinois', name: '805 North Prospect Avenue Apt 1, Champaign, Illinois, 61820' },
    // Bed B in Apt 4: the unit is folded out of the street for the building key.
    { id: 'u6', slug: 'r-805nprospect-bed-b', address: '805 North Prospect Avenue Apt 4', unit: 'Bed B', city: 'Champaign', state: 'Illinois' },
    // Another street with no archive anywhere: nothing is guessed.
    { id: 'u7', slug: 'r-2111talans-apt-2', address: '2111 Talans Dr', unit: 'Apt 2', city: 'Danville', state: 'IL' },
  ];
  it('splits a whole-line address, names the archive from the old list, and leaves a townless row unheld but named', () => {
    const r = recordRepairs(doors, { heldAt: {}, channels: {} });
    const by = Object.fromEntries(r.map((x) => [x.id, x]));
    expect(by.u1.patch).toMatchObject({ address: '1508 Williamsburg', city: 'Champaign', state: 'IL', zip: '61821', photo_channel: '1508Williamsburg' });
    expect(by.u1.patch.address_held_at).toBeTruthy();
    expect(by.u1.summary).toContain('was "1508 Williamsburg, Champaign, IL, 61821"');
    expect(by.u1.summary).toContain('Picture archive on the NAS named: 1508Williamsburg');
    // 709: no town anywhere -> the address is NOT touched and NOT marked held
    // (the card keeps saying it needs the town); the archive is still named.
    expect(by.u2.patch).toEqual({ photo_channel: '709CommercialSt' });
    // 805: already in its parts -> held now, archive named.
    expect(by.u3.patch).toMatchObject({ photo_channel: '805NProspect' });
    expect(by.u3.patch.address).toBeUndefined();
    // u4: in its parts, no mapping, archive already on the row -> held only.
    expect(Object.keys(by.u4.patch)).toEqual(['address_held_at']);
    // THE BUILDING'S ARCHIVE: Apt 1 and Bed B take 805's from their sibling;
    // a street with no archive anywhere takes nothing.
    expect(by.u5.patch.photo_channel).toBe('805NProspect');
    expect(by.u5.summary).toContain('named from the building: 805NProspect');
    expect(by.u6.patch.photo_channel).toBe('805NProspect');
    expect(by.u7.patch.photo_channel).toBeUndefined();
  });

  it('PROVEN-TO-CATCH: the building\'s archive is read from what the database already holds, too', () => {
    const r = recordRepairs([
      { id: 'a', slug: 'r-x', address: '12 Oak Street', unit: 'Apt 1', city: 'Danville', state: 'IL' },
      { id: 'b', slug: 'r-y', address: '12 Oak Street', unit: 'Apt 2', city: 'Danville', state: 'IL' },
    ], { heldAt: { a: 'x', b: 'x' }, channels: { b: '12Oak' } });
    expect(r).toEqual([{ id: 'a', patch: { photo_channel: '12Oak' }, summary: 'Picture archive on the NAS named from the building: 12Oak' }]);
  });

  it('PROVEN-TO-CATCH: a held row and a named archive are never touched again', () => {
    const r = recordRepairs(doors, { heldAt: { u1: '2026-10-13T00:00:00Z', u3: '2026-10-13T00:00:00Z', u4: 'x', u5: 'x', u6: 'x', u7: 'x' }, channels: { u1: '1508Williamsburg', u2: '709CommercialSt', u3: '805NProspect', u5: '805NProspect', u6: '805NProspect' } });
    expect(r).toEqual([]);
  });

  it('applies through the door edit path and never throws', async () => {
    const saved = [];
    const r = await holdTheRecords(doors, { heldAt: {}, channels: {} }, async (id, patch, summary) => { saved.push({ id, patch, summary }); return { ok: id !== 'u2' }; });
    expect(r.done).toEqual(['u1', 'u3', 'u4', 'u5', 'u6', 'u7']);
    expect(r.failed).toEqual(['u2']);
    expect(saved.find((s) => s.id === 'u1').summary).toContain('Address held in its parts');
    const boom = await holdTheRecords(doors, {}, async () => { throw new Error('x'); });
    expect(boom.done).toEqual([]);
  });
});

describe('the sync carries the archive and the structure both ways', () => {
  it('toRow writes photo_channel only when the door names one; fromRow reads it back', () => {
    const ctx = { tenantId: 'inst', userId: 'me' };
    const row = rentalToRow({ id: 'r-805nprospect', name: '805', address: '805 North Prospect Avenue', photoChannel: '805NProspect' }, ctx);
    expect(row.photo_channel).toBe('805NProspect');
    const none = rentalToRow({ id: 'r-x', name: 'x', address: 'x' }, ctx);
    expect('photo_channel' in none).toBe(false);
    const bad = rentalToRow({ id: 'r-x', name: 'x', address: 'x', photoChannel: 'bad name' }, ctx);
    expect('photo_channel' in bad).toBe(false);
    expect(rentalFromRow({ id: 'u', slug: 'r-805nprospect', address: '805', photo_channel: '805NProspect' }).photoChannel).toBe('805NProspect');
    expect(rentalFromRow({ id: 'u', slug: 'r-x', address: 'x' }).photoChannel).toBe('');
  });

  it('a Real Estate edit to a LINKED door carries unit, building, room, level and the archive (the DR-0160 gap)', () => {
    const p = localPatchToCloud({ unitLabel: 'Apt 2', building: '805', roomLabel: '', rentableLevel: 'bed', photoChannel: '805NProspect' });
    expect(p).toEqual({ unit: 'Apt 2', building_label: '805', room_label: null, rentable_level: 'bed', photo_channel: '805NProspect' });
    expect(localPatchToCloud({ rentableLevel: 'house' }).rentable_level).toBeNull();
    expect(CLOUD_TO_LOCAL.photo_channel).toBe('photoChannel');
  });
});

describe('the NAS client, by road (DR-0999; #2057)', () => {
  it('the default direct base is unset in every normal build', () => {
    expect(NAS_PHOTO_DIRECT).toBe('');
    expect(NAS_PHOTO_BASE).toBe('/nas-photos');
  });

  it('same-origin answers as the server: taken, and said', async () => {
    const calls = [];
    const r = await nasFetch('/nas-photos/channels', {}, { fetchImpl: async (u) => { calls.push(String(u)); return json({ channels: [] }); }, direct: 'https://nas.example/nas-photos' });
    expect(r.ok).toBe(true);
    expect(calls).toEqual(['/nas-photos/channels']);
    expect(nasRoad()).toBe('same-origin');
  });

  it('THE OUTAGE: same-origin answers the app\'s own HTML, so the direct road is asked and said', async () => {
    const calls = [];
    const r = await nasFetch('/nas-photos/channels', {}, { fetchImpl: async (u) => { calls.push(String(u)); return calls.length === 1 ? html() : json({ channels: [{ name: '805NProspect', total: 121 }] }); }, direct: 'https://nas.example/nas-photos' });
    expect(calls).toEqual(['/nas-photos/channels', 'https://nas.example/nas-photos/channels']);
    expect((await r.json()).channels[0].total).toBe(121);
    expect(nasRoad()).toBe('direct');
  });

  it('PROVEN-TO-CATCH: with no direct base, HTML from same-origin is "no answer", never read as the server\'s', async () => {
    const r = await nasFetch('/nas-photos/channels', {}, { fetchImpl: async () => html(), direct: '' });
    expect(r).toBeNull();
    expect(nasRoad()).toBe('none');
  });

  it('a 401 from the server is the server\'s answer and comes back as such', async () => {
    const r = await nasFetch('/nas-photos/channels', {}, { fetchImpl: async () => json({ error: 'unauthorized' }, 401), direct: 'https://nas.example/nas-photos' });
    expect(r.status).toBe(401);
  });

  it('fetchChannels and fetchListingPhoto read the server\'s shapes and refuse bad input', async () => {
    const real = globalThis.fetch;
    setBridgeToken('t');
    try {
      globalThis.fetch = async (u) => (String(u).includes('/channels')
        ? json({ channels: [{ name: '805NProspect', total: 121 }, { name: 'bad name', total: 1 }] })
        : json({ ok: true, id: '9001', name: 'a.jpg', date: '2024-01-22', width: 1920, height: 1280, bytes: 10, image: 'data:image/jpeg;base64,AAAA' }));
      expect(await fetchChannels()).toEqual([{ name: '805NProspect', total: 121 }]);
      expect((await fetchListingPhoto('805NProspect', '9001')).ok).toBe(true);
      expect((await fetchListingPhoto('bad name', '9001')).reason).toBe('bad-request');
      globalThis.fetch = async () => json({ ok: false, error: 'the original is not on this NAS' }, 404);
      expect((await fetchListingPhoto('805NProspect', '9001')).reason).toBe('the original is not on this NAS');
    } finally { globalThis.fetch = real; setBridgeToken(''); }
  });

  it('chatChannelFor: the record first, the old list second, a bare name only when it is a safe channel', () => {
    expect(chatChannelFor({ id: 'r-805nprospect', photoChannel: 'Chosen' })).toBe('Chosen');
    expect(chatChannelFor({ id: 'r-805nprospect', photo_channel: 'FromRow' })).toBe('FromRow');
    expect(chatChannelFor({ id: 'r-805nprospect' })).toBe('805NProspect');
    expect(chatChannelFor({ id: 'r-new', name: '1003Koehn' })).toBe('1003Koehn');
    expect(chatChannelFor({ id: 'r-new', name: '805 N Prospect (multi-unit)' })).toBe('');
  });
});
