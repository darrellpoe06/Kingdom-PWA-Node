// =============================================================================
// timeline, rooms, exif, payments — held against the real doors
// =============================================================================
// The shapes are the live ones (four unlabelled rows at 805 North Prospect; the
// 1003 Koehn voucher rows with their four blank months). Every personal name is
// invented — no tenant name belongs in a repository.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  hasEnded, tenancyLabel, transitionEvents, photoEvents, documentEvents,
  doorEvents, buildPropertyTimeline, turnPhotos, latestAtDoor,
} from '../modules/properties/timeline.js';
import {
  inferKind, liveRooms, archivedRooms, buildRoom, seedRooms, archiveRoom,
  restoreRoom, reorderRooms, photosForRoom, roomBoard, assertNoRoomDevice, ROOM_KINDS,
} from '../modules/properties/rooms.js';
import {
  haversineMeters, dmsToDecimal, readExifLocation, readExifTaken,
  readExifDevice, proposeFiling, sortBatch,
} from '../modules/properties/exif.js';
import {
  periodOf, periodsBetween, paymentLedger, gaps, discrepancies, accuracy, totals,
} from '../modules/properties/payments.js';

// ---------------------------------------------------------------------------
// timeline
// ---------------------------------------------------------------------------
const earlier = { id: 't1', tenant_name: 'Jordan Ellery', lease_start: '2022-01-01', lease_end: '2023-06-30', status: 'ended' };
const later = { id: 't2', tenant_name: 'Rowan Fitch', lease_start: '2023-09-01', lease_end: null, status: 'active' };

describe('a tenancy chapter', () => {
  it('knows an ended tenancy from its status and from a past end date', () => {
    expect(hasEnded(earlier)).toBe(true);
    expect(hasEnded(later)).toBe(false);
    expect(hasEnded({ lease_end: '2199-01-01', status: 'active' })).toBe(false);
    expect(hasEnded({ status: 'evicted' })).toBe(true);
  });

  it('does not call an unnamed household "Unknown" — nothing was recorded to lose', () => {
    // The 1003 Koehn case: the sheet's client column says "Section 8".
    expect(tenancyLabel({ tenant_name: null })).toMatch(/not named in the record/i);
    expect(tenancyLabel(earlier)).toBe('Jordan Ellery');
  });

  it('makes a move-in and a move-out event', () => {
    const e = transitionEvents(earlier);
    expect(e.map((x) => x.kind)).toEqual(['move-in', 'move-out']);
    expect(e[1].summary).toMatch(/moved out/);
  });

  it('does not invent a move-out for a tenancy still running', () => {
    expect(transitionEvents(later).map((x) => x.kind)).toEqual(['move-in']);
  });

  it('yields no dated transition when the lease has no dates', () => {
    expect(transitionEvents({ id: 'x', tenant_name: 'A', status: 'active' })).toEqual([]);
  });
});

describe('photos and documents as events', () => {
  it('dates a photo by the shutter, and says so when it used the upload instead', () => {
    const [a, b] = photoEvents([
      { id: 'p1', taken_at: '2023-07-02T10:00:00Z', kind: 'turn', caption: 'Carpet pulled' },
      { id: 'p2', uploaded_at: '2023-07-09T10:00:00Z', kind: 'turn' },
    ]);
    expect(a.at).toBe('2023-07-02T10:00:00.000Z');
    expect(a.datedByUpload).toBe(false);
    expect(b.datedByUpload).toBe(true);
  });

  it('reads a document as an event at its issue date', () => {
    const [d] = documentEvents([{ id: 'd1', title: 'Lease', issued_at: '2023-09-01T00:00:00Z', tenancy_id: 't2' }]);
    expect(d.kind).toBe('document');
    expect(d.tenancyId).toBe('t2');
  });
});

describe('the door stream', () => {
  const photos = [
    { id: 'po', taken_at: '2023-06-29T00:00:00Z', kind: 'move-out-condition', tenancy_id: null },
    { id: 'pt', taken_at: '2023-07-15T00:00:00Z', kind: 'turn', tenancy_id: null },
    { id: 'pi', taken_at: '2023-08-30T00:00:00Z', kind: 'move-in-condition', tenancy_id: null },
  ];

  it('runs newest first across both tenancies', () => {
    const s = doorEvents({ tenancies: [earlier, later], photos });
    const times = s.filter((e) => e.ms !== null).map((e) => e.ms);
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(s[0].kind).toBe('move-in'); // 2023-09-01, the latest thing that happened
  });

  it('sinks an undated event instead of floating it to the top as "latest"', () => {
    const s = doorEvents({ tenancies: [later], events: [{ id: 'u', kind: 'note', at: null, ms: null }] });
    expect(s[s.length - 1].id).toBe('u');
  });

  it('puts the pictures between the tenancies into a turn, not into either term', () => {
    const chapters = buildPropertyTimeline({ tenancies: [earlier, later], photos });
    const turn = chapters.find((c) => c.type === 'turn');
    expect(turn).toBeTruthy();
    expect(turn.photos).toBe(3);
    expect(turn.after).toBe('Jordan Ellery');
    expect(turn.before).toBe('Rowan Fitch');
  });

  it('brackets the turn with the move-out and move-in condition sets', () => {
    const chapters = buildPropertyTimeline({ tenancies: [earlier, later], photos });
    const t = turnPhotos(chapters.find((c) => c.type === 'turn'));
    expect(t.movedOut).toHaveLength(1);
    expect(t.movedIn).toHaveLength(1);
    expect(t.turn).toHaveLength(1);
    expect(t.complete).toBe(true);
  });

  it('says a turn is incomplete when only one side was photographed', () => {
    const chapters = buildPropertyTimeline({ tenancies: [earlier, later], photos: [photos[0]] });
    expect(turnPhotos(chapters.find((c) => c.type === 'turn')).complete).toBe(false);
  });

  it('marks the running tenancy current and the finished one not', () => {
    const chapters = buildPropertyTimeline({ tenancies: [earlier, later] });
    const [first, second] = chapters.filter((c) => c.type === 'tenancy');
    expect(first.label).toBe('Rowan Fitch'); // newest chapter first
    expect(first.current).toBe(true);
    expect(second.current).toBe(false);
    expect(second.movedOut).toBe('2023-06-30T00:00:00.000Z');
  });

  it('never silently drops an event that fits no chapter or turn', () => {
    const stray = [{ id: 'old', kind: 'note', at: '2019-01-01T00:00:00Z', ms: Date.parse('2019-01-01') }];
    const chapters = buildPropertyTimeline({ tenancies: [earlier, later], events: stray });
    const shown = chapters.flatMap((c) => c.events.map((e) => e.id));
    expect(shown).toContain('old');
  });

  it('surfaces the latest documents, notes and photos at the door', () => {
    const stream = doorEvents({
      tenancies: [later],
      photos,
      docs: [{ id: 'd1', title: 'Lease', issued_at: '2023-09-01T00:00:00Z' }],
      events: [{ id: 'n1', kind: 'note', at: '2024-01-05T00:00:00Z', ms: Date.parse('2024-01-05') }],
    });
    const latest = latestAtDoor(stream);
    expect(latest.notes[0].id).toBe('n1');
    expect(latest.documents[0].id).toBe('d1');
    expect(latest.photos).toHaveLength(3);
    expect(latest.transitions[0].kind).toBe('move-in');
  });
});

// ---------------------------------------------------------------------------
// rooms
// ---------------------------------------------------------------------------
describe('rooms are data, not code', () => {
  const door = { instanceId: 'i1', rentalRef: 'r1' };

  it('guesses a kind from the name and lets it be overridden', () => {
    expect(inferKind('Bedroom 2')).toBe('bedroom');
    expect(inferKind('Half bath')).toBe('bathroom');
    expect(inferKind('Back porch')).toBe('exterior');
    expect(inferKind('Sewing nook')).toBe('other');
    expect(buildRoom({ ...door, name: 'Sewing nook', kind: 'office' }).kind).toBe('office');
  });

  it('adds a room with no schema change and no code branch', () => {
    const existing = [{ id: 'a', name: 'Kitchen', sort_order: 10 }];
    const room = buildRoom({ ...door, name: 'Finished basement' }, existing);
    expect(room.kind).toBe('basement');
    expect(room.sort_order).toBe(20);
    expect(room.archived_at).toBeNull();
  });

  it('refuses a blank name and a duplicate at the same door', () => {
    expect(() => buildRoom({ ...door, name: '   ' })).toThrow(/needs a name/);
    expect(() => buildRoom({ ...door, name: 'kitchen' }, [{ id: 'a', name: 'Kitchen' }])).toThrow(/already has a room/);
  });

  it('lets a name be reused once the old room is archived', () => {
    const archived = [{ id: 'a', name: 'Bathroom 2', archived_at: '2024-01-01T00:00:00Z' }];
    expect(buildRoom({ ...door, name: 'Bathroom 2' }, archived).name).toBe('Bathroom 2');
  });

  it('refuses a kind outside the vocabulary', () => {
    expect(() => buildRoom({ ...door, name: 'Vault', kind: 'panic-room' })).toThrow(/not a room kind/);
    expect(ROOM_KINDS).toContain('other');
  });

  it('seeds an empty door and never overwrites one already set up', () => {
    expect(seedRooms({ ...door, propertyType: 'apartment' })).toHaveLength(5);
    expect(seedRooms({ ...door }, [{ id: 'a', name: 'Kitchen' }])).toEqual([]);
  });

  it('archives a room and keeps its photos on the record', () => {
    const room = { id: 'rm1', name: 'Bedroom 3' };
    const photos = [{ id: 'p', room_id: 'rm1' }, { id: 'q', room_id: 'rm1' }];
    const r = archiveRoom(room, { by: 'u1', at: '2024-05-01T00:00:00Z', photos });
    expect(r.patch.archived_at).toBe('2024-05-01T00:00:00Z');
    expect(r.keepsPhotos).toBe(2);
    expect(r.statement).toMatch(/stay on the property's record/);
  });

  it('refuses to archive twice, and refuses a restore that collides', () => {
    expect(() => archiveRoom({ id: 'a', name: 'X', archived_at: 'now' })).toThrow(/already archived/);
    expect(() => restoreRoom({ id: 'a', name: 'Kitchen', archived_at: 'x' }, [{ id: 'b', name: 'Kitchen' }]))
      .toThrow(/already called/);
    expect(restoreRoom({ id: 'a', name: 'Kitchen', archived_at: 'x' }, []).archived_at).toBeNull();
  });

  it('reorders by the ids given', () => {
    const rooms = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(reorderRooms(rooms, ['c', 'a'])).toEqual([{ id: 'c', sort_order: 10 }, { id: 'a', sort_order: 20 }]);
  });

  it('shows a room its photos newest first', () => {
    const photos = [
      { id: 'old', room_id: 'rm1', taken_at: '2023-01-01T00:00:00Z' },
      { id: 'new', room_id: 'rm1', taken_at: '2024-01-01T00:00:00Z' },
      { id: 'other', room_id: 'rm2', taken_at: '2025-01-01T00:00:00Z' },
    ];
    expect(photosForRoom('rm1', photos).map((p) => p.id)).toEqual(['new', 'old']);
  });

  it('keeps the unsorted pile visible instead of letting it become nobody\'s job', () => {
    const rooms = [{ id: 'rm1', name: 'Kitchen', sort_order: 10 }, { id: 'rm2', name: 'Attic', archived_at: 'x' }];
    const photos = [{ id: 'a', room_id: 'rm1' }, { id: 'b', room_id: null }, { id: 'c', room_id: 'rm2' }];
    const board = roomBoard(rooms, photos);
    expect(liveRooms(rooms)).toHaveLength(1);
    expect(archivedRooms(rooms)).toHaveLength(1);
    expect(board.unfiled.map((p) => p.id)).toEqual(['b']);
    expect(board.archived[0].count).toBe(1);
    expect(board.statement).toMatch(/1 not yet in a room/);
  });

  it('refuses a device on a room (DR-028)', () => {
    expect(() => assertNoRoomDevice({ camera: true })).toThrow(/no surveillance inside a room/i);
    expect(() => assertNoRoomDevice({ Microphone: 'on' })).toThrow(/DR-028/);
    expect(assertNoRoomDevice({ smokeAlarm: true, notes: 'x' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exif
// ---------------------------------------------------------------------------
describe('reading a photo\'s metadata', () => {
  it('converts EXIF degrees/minutes/seconds with the hemisphere ref', () => {
    // 40 06 43.2 N, 88 14 24.0 W — Champaign, near enough.
    expect(dmsToDecimal([40, 6, 43.2], 'N')).toBeCloseTo(40.112, 3);
    expect(dmsToDecimal([88, 14, 24], 'W')).toBeCloseTo(-88.24, 3);
    expect(dmsToDecimal([[40, 1], [6, 1], [432, 10]], 'N')).toBeCloseTo(40.112, 3);
  });

  it('refuses nonsense rather than returning a plausible number', () => {
    expect(dmsToDecimal(null, 'N')).toBeNull();
    expect(dmsToDecimal([200, 0, 0], 'N')).toBeNull();
    expect(dmsToDecimal(['x', 'y', 'z'], 'N')).toBeNull();
  });

  it('reads the EXIF date form Date.parse does not understand', () => {
    expect(readExifTaken({ DateTimeOriginal: '2025:10:04 14:22:31' })).toBe('2025-10-04T14:22:31.000Z');
    expect(readExifTaken({})).toBeNull();
    expect(readExifTaken({ DateTimeOriginal: 'not a date' })).toBeNull();
  });

  it('treats 0,0 as an unset fix, not as a place in the Gulf of Guinea', () => {
    const r = readExifLocation({ GPSLatitude: 0, GPSLongitude: 0 });
    expect(r.location).toBeNull();
    expect(r.reason).toMatch(/unset fix/);
  });

  it('says plainly when there is no GPS at all', () => {
    expect(readExifLocation({}).reason).toMatch(/no GPS coordinate/);
  });

  it('reads the camera', () => {
    expect(readExifDevice({ Make: 'Apple', Model: 'iPhone 14' })).toBe('Apple iPhone 14');
    expect(readExifDevice({})).toBeNull();
  });

  it('measures distance', () => {
    const a = { lat: 40.112, lng: -88.24 };
    expect(haversineMeters(a, a)).toBeCloseTo(0, 5);
    expect(haversineMeters(a, { lat: 40.113, lng: -88.24 })).toBeGreaterThan(100);
  });
});

describe('filing a photo to a door', () => {
  const koehn = { id: 'koehn', address: '1003 Koehn Dr', unit: null, latitude: 40.1245, longitude: -87.6300 };
  // The real 805: four rows, one address, no unit labels.
  const prospect = [1, 2, 3, 4].map((n) => ({
    id: `p${n}`, address: '805 North Prospect Avenue', unit: null, latitude: 40.1250, longitude: -88.2450,
  }));
  const atProspect = { GPSLatitude: [40, 7, 30], GPSLatitudeRef: 'N', GPSLongitude: [88, 14, 42], GPSLongitudeRef: 'W', DateTimeOriginal: '2025:10:04 14:22:31' };

  it('files to one door when only one is in range', () => {
    const p = proposeFiling(atProspect, [koehn, prospect[0]]);
    expect(p.confidence).toBe('high');
    expect(p.rentalId).toBe('p1');
    expect(p.takenAt).toBe('2025-10-04T14:22:31.000Z');
  });

  it('is still a proposal, never a filing', () => {
    expect(proposeFiling(atProspect, [prospect[0]]).filed).toBe(false);
  });

  it('will not guess the apartment when four units share the address', () => {
    const p = proposeFiling(atProspect, prospect);
    expect(p.confidence).toBe('address-only');
    expect(p.rentalId).toBeNull();
    expect(p.unitOpen).toBe(true);
    expect(p.reason).toMatch(/cannot tell them apart/);
    expect(p.candidates).toHaveLength(4);
  });

  it('refuses when the nearest door is beyond the radius', () => {
    const p = proposeFiling(atProspect, [koehn]);
    expect(p.confidence).toBe('none');
    expect(p.reason).toMatch(/beyond the 75m radius/);
    expect(p.nearest.address).toBe('1003 Koehn Dr');
  });

  it('refuses when two different addresses are both in range', () => {
    const nextDoor = { id: 'nd', address: '807 North Prospect Avenue', latitude: 40.1250, longitude: -88.2451 };
    const p = proposeFiling(atProspect, [prospect[0], nextDoor]);
    expect(p.confidence).toBe('ambiguous');
    expect(p.reason).toMatch(/the landlord picks/);
  });

  it('downgrades a match made by a fix looser than the radius', () => {
    const p = proposeFiling({ ...atProspect, GPSHPositioningError: 500 }, [prospect[0]]);
    expect(p.confidence).toBe('low');
    expect(p.reason).toMatch(/only accurate to 500m/);
  });

  it('says so when no door on record carries coordinates', () => {
    expect(proposeFiling(atProspect, [{ id: 'x', address: 'somewhere' }]).reason).toMatch(/no door on record carries coordinates/);
  });

  it('sorts a batch and counts what still needs a person', () => {
    const b = sortBatch([
      { file: 'a.jpg', exif: atProspect },
      { file: 'b.jpg', exif: {} },
      { file: 'c.jpg', exif: atProspect },
    ], [prospect[0]]);
    expect(b.filed).toHaveLength(2);
    expect(b.needsAPerson).toHaveLength(1);
    expect(b.summary).toMatch(/1 need a person/);
    expect(b.filed.length + b.addressOnly.length + b.needsAPerson.length).toBe(b.total);
  });
});

// ---------------------------------------------------------------------------
// payments
// ---------------------------------------------------------------------------
describe('payment history, and how much of it is known', () => {
  // The real 1003 Koehn rows, plus the four months the sheet drew and left blank.
  const koehnRecords = [
    { id: 'r1', for_period: '2022-09', amount: 646, status: 'confirmed', confirmed_at: '2022-09-16T00:00:00Z' },
    { id: 'r2', for_period: '2022-10', amount: 640, status: 'confirmed', confirmed_at: '2022-10-03T00:00:00Z' },
    { id: 'r3', for_period: '2022-11', amount: 680, status: 'confirmed', confirmed_at: '2022-11-02T00:00:00Z' },
  ];
  const ledger = paymentLedger({ records: koehnRecords, expectedRent: 680, from: '2022-09', to: '2023-03', subsidised: true });

  it('names a period from a date', () => {
    expect(periodOf('2022-11-02T00:00:00Z')).toBe('2022-11');
    expect(periodOf('nonsense')).toBeNull();
  });

  it('walks months across a year boundary and refuses a backwards span', () => {
    expect(periodsBetween('2022-11', '2023-02')).toEqual(['2022-11', '2022-12', '2023-01', '2023-02']);
    expect(periodsBetween('2023-02', '2022-11')).toEqual([]);
  });

  it('shows a row for every month, so the four blank ones stop being invisible', () => {
    expect(ledger).toHaveLength(7);
    expect(gaps(ledger)).toEqual(['2023-03', '2023-02', '2023-01', '2022-12']);
  });

  it('runs newest first', () => {
    expect(ledger[0].period).toBe('2023-03');
    expect(ledger[ledger.length - 1].period).toBe('2022-09');
  });

  it('catches the two voucher months that did not cover the contract rent', () => {
    const d = discrepancies(ledger);
    expect(d.find((x) => x.period === '2022-09')).toMatchObject({ kind: 'short', by: 34 });
    expect(d.find((x) => x.period === '2022-10')).toMatchObject({ kind: 'short', by: 40 });
    expect(d.find((x) => x.period === '2022-11')).toBeUndefined();
  });

  it('flags a payment reported but never confirmed', () => {
    const l = paymentLedger({ records: [{ for_period: '2024-01', amount: 680, status: 'reported' }], expectedRent: 680 });
    expect(l[0].unconfirmed).toBe(true);
    expect(discrepancies(l).some((x) => x.kind === 'unconfirmed')).toBe(true);
  });

  it('flags a disputed period', () => {
    const l = paymentLedger({ records: [{ for_period: '2024-01', amount: 680, status: 'disputed' }], expectedRent: 680 });
    expect(l[0].state).toBe('disputed');
  });

  it('states how far the record can be trusted instead of scoring it', () => {
    const a = accuracy(ledger);
    expect(a.total).toBe(7);
    expect(a.known).toBe(3);
    expect(a.complete).toBe(false);
    expect(a.statement).toMatch(/3 of 7 month\(s\) carry a confirmed payment/);
    expect(a.statement).toMatch(/4 have no record at all/);
  });

  it('never lets a total read as complete when it is not', () => {
    const t = totals(ledger);
    expect(t.paid).toBe(1966);
    expect(t.basis).toBe('3 of 7 month(s)');
    expect(t.trustworthy).toBe(false);
    expect(t.caveat).toMatch(/^Incomplete:/);
  });

  it('drops the caveat once every month is confirmed', () => {
    const full = paymentLedger({
      records: [
        { for_period: '2024-01', amount: 680, status: 'confirmed' },
        { for_period: '2024-02', amount: 680, status: 'confirmed' },
      ],
      expectedRent: 680, from: '2024-01', to: '2024-02',
    });
    const t = totals(full);
    expect(t.trustworthy).toBe(true);
    expect(t.caveat).toBeNull();
    expect(t.balance).toBe(0);
  });

  it('says nothing is covered rather than claiming a perfect empty record', () => {
    const a = accuracy([]);
    expect(a.complete).toBe(false);
    expect(a.ratio).toBeNull();
  });
});
