// =============================================================================
// rescue-local-records — the records leave the phone, or the test says why not
// =============================================================================
// These assert the three rules the module exists to keep: never invent, safe to
// run twice, and say what is NOT carried. Several are written against mistakes
// I actually made building this — the wrong table shape, the fabricated
// machine, the silent drop — so they fail if any of them comes back.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  planRescue, describePlan, conversationToNote, unitNoteToRow,
  roomToRow, roomNotesText, equipmentToRow, maintenanceToEvent,
  systemKindFor, eventKindFor,
} from '../lib/rescue-local-records.js';
import { NOTE_KINDS } from '../lib/property-notes.js';
import { SYSTEM_KINDS, EVENT_KINDS } from '../modules/properties/systems.js';
import { ROOM_KINDS } from '../modules/properties/rooms.js';

const INSTANCE = '11111111-1111-1111-1111-111111111111';
const UUID = '22222222-2222-2222-2222-222222222222';

const door = (over = {}) => ({
  id: 'r-1508williamsburg',
  name: '1508 Williamsburg',
  ...over,
});

describe('the vocabulary bridges land inside the real vocabularies', () => {
  it('every equipment category maps to a kind the table accepts', () => {
    const cats = ['HVAC', 'Furnace', 'AC Unit', 'Water Heater', 'Refrigerator',
      'Stove / Oven', 'Dishwasher', 'Washer', 'Dryer', 'Microwave',
      'Garbage Disposal', 'Sump Pump', 'Roof', 'Electrical Panel', 'Garage Door', 'Other'];
    for (const category of cats) {
      expect(SYSTEM_KINDS, category).toContain(systemKindFor({ category }));
    }
  });

  it('a category nobody has ever seen still lands somewhere legal', () => {
    expect(SYSTEM_KINDS).toContain(systemKindFor({ category: 'Trebuchet' }));
  });

  it('every maintenance urgency maps to an event kind the table accepts', () => {
    for (const urgency of ['emergency', 'urgent', 'incident', 'repair', 'service', 'routine', 'planned', '']) {
      expect(EVENT_KINDS, urgency).toContain(eventKindFor({ urgency }));
    }
  });

  it('an unrecognized urgency becomes a note rather than a guess at severity', () => {
    expect(eventKindFor({ urgency: 'whenever' })).toBe('note');
  });
});

describe('a conversation becomes a note, keeping the words and the person', () => {
  const entry = {
    id: 'cv-1751840000000',
    date: '2026-07-06',
    person: 'Adrianna Johnson',
    summary: 'Smoking on the porch again',
    notes: 'Second time this month.',
  };

  it('keeps the name, the summary and the follow-up text', () => {
    const row = conversationToNote(entry, { rentalSlug: 'r-x', unitLabel: 'Apt 3' });
    expect(row.body).toContain('Adrianna Johnson');
    expect(row.body).toContain('Smoking on the porch again');
    expect(row.body).toContain('Second time this month.');
  });

  it('files under a kind the 0062 CHECK actually allows', () => {
    // The live constraint is general/maintenance/tenant/financial/inspection/
    // follow-up. My first draft of the migration invented a different six and
    // would have made the app's own writes illegal.
    expect(NOTE_KINDS).toContain(conversationToNote(entry, { rentalSlug: 'r-x' }).kind);
  });

  it('carries the device id so a second run updates instead of duplicating', () => {
    expect(conversationToNote(entry, { rentalSlug: 'r-x' }).legacy_id).toBe('cv-1751840000000');
  });

  it('marks itself as rescued, not as something typed into the record', () => {
    expect(conversationToNote(entry, { rentalSlug: 'r-x' }).source).toBe('rescued-from-device');
  });

  it('refuses an entry with nothing to say instead of filing an empty note', () => {
    expect(conversationToNote({ id: 'cv-2', date: '2026-07-06', person: 'A' }, { rentalSlug: 'r-x' })).toBeNull();
  });

  it('leaves the date null when the entry has no readable one', () => {
    expect(conversationToNote({ summary: 'said something', date: 'last tuesday' }, { rentalSlug: 'r-x' }).note_date).toBeNull();
  });
});

describe('a unit note keeps the shape it was typed in', () => {
  it('keeps its own kind when the 0062 vocabulary allows it', () => {
    const row = unitNoteToRow({ id: 'un-1', body: 'Paid rent', kind: 'financial', note_date: '2026-07-25' }, { rentalSlug: 'r-x' });
    expect(row.kind).toBe('financial');
    expect(row.note_date).toBe('2026-07-25');
  });

  it('falls back to general rather than writing a kind the CHECK rejects', () => {
    const row = unitNoteToRow({ id: 'un-2', body: 'Something', kind: 'turnover' }, { rentalSlug: 'r-x' });
    expect(NOTE_KINDS).toContain(row.kind);
    expect(row.kind).toBe('general');
  });

  it('accepts the camelCase spelling the older local rows used', () => {
    expect(unitNoteToRow({ id: 'un-3', body: 'x', noteDate: '2026-01-02' }, { rentalSlug: 'r-x' }).note_date).toBe('2026-01-02');
  });

  it('refuses an empty note', () => {
    expect(unitNoteToRow({ id: 'un-4', body: '   ' }, { rentalSlug: 'r-x' })).toBeNull();
  });
});

describe('a room carries its punch list in its notes', () => {
  it('folds each item, its status and its note into readable lines', () => {
    const txt = roomNotesText({
      items: [
        { name: 'Faucet', status: 'needs-work', notes: 'drips' },
        { name: 'Paint', status: 'done' },
      ],
    });
    expect(txt).toContain('- Faucet [needs-work] — drips');
    expect(txt).toContain('- Paint [done]');
  });

  it('is empty rather than a heading over nothing when there are no items', () => {
    expect(roomNotesText({ items: [] })).toBe('');
  });

  it('lands on a kind the table accepts and keeps the given order', () => {
    const row = roomToRow({ id: 'rm-1', name: 'Bathroom 1' }, { instanceId: INSTANCE, rentalUuid: UUID, sortOrder: 30 });
    expect(ROOM_KINDS).toContain(row.kind);
    expect(row.sort_order).toBe(30);
    expect(row.rental_ref).toBe(UUID);
  });

  it('refuses a nameless room', () => {
    expect(roomToRow({ id: 'rm-2', name: '  ' }, { instanceId: INSTANCE, rentalUuid: UUID })).toBeNull();
  });
});

describe('equipment keeps what was measured and guesses nothing else', () => {
  const eq = {
    id: 'eq-1', category: 'Water Heater', make: 'Rheem', model: 'XE50',
    serial: 'RH123', installDate: '2019-04-02', warrantyEnd: '2027-04-02', notes: '50 gallon',
  };

  it('names itself from make and model when it has them', () => {
    expect(equipmentToRow(eq, { instanceId: INSTANCE, rentalUuid: UUID }).name).toBe('Rheem XE50');
  });

  it('falls back to the category, which is the field the tab requires', () => {
    expect(equipmentToRow({ id: 'eq-2', category: 'Furnace' }, { instanceId: INSTANCE, rentalUuid: UUID }).name).toBe('Furnace');
  });

  it('never invents an expected life or a service interval', () => {
    // DR-0076: an undated system must read 'unknown', never 'ok'. Inventing a
    // 12-year life here would make the systems board report a confident
    // remaining-life number the landlord never told anybody.
    const row = equipmentToRow(eq, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(row.expected_life_years).toBeNull();
    expect(row.service_interval_months).toBeNull();
    expect(row.last_service_on).toBeNull();
  });

  it('drops an unreadable install date rather than storing a broken one', () => {
    const row = equipmentToRow({ ...eq, installDate: 'about 2019' }, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(row.installed_on).toBeNull();
  });
});

describe('a maintenance entry that names no machine still lands', () => {
  const mt = {
    id: 'mt-1', date: '2026-05-02', category: 'lawn', urgency: 'routine',
    description: 'Mowed and edged', cost: 65, vendor: 'Ruiz Lawn', notes: '',
  };

  it('files with a null system, because the work belonged to no equipment', () => {
    // This is the whole reason 0159 relaxed system_ref. Before it, the choice
    // was drop the entry or invent a mower that never existed.
    const row = maintenanceToEvent(mt, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(row.system_ref).toBeNull();
    expect(row.rental_ref).toBe(UUID);
  });

  it('keeps the category in front of the summary so the word survives', () => {
    expect(maintenanceToEvent(mt, { instanceId: INSTANCE, rentalUuid: UUID }).summary).toBe('lawn: Mowed and edged');
  });

  it('keeps the cost and the vendor', () => {
    const row = maintenanceToEvent(mt, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(row.cost).toBe(65);
    expect(row.vendor_name).toBe('Ruiz Lawn');
  });

  it('refuses an entry with no date instead of stamping today onto old work', () => {
    expect(maintenanceToEvent({ ...mt, date: '' }, { instanceId: INSTANCE, rentalUuid: UUID })).toBeNull();
  });

  it('refuses an entry with no description', () => {
    expect(maintenanceToEvent({ ...mt, description: '' }, { instanceId: INSTANCE, rentalUuid: UUID })).toBeNull();
  });

  it('drops a negative cost rather than recording money that flowed backwards', () => {
    expect(maintenanceToEvent({ ...mt, cost: -20 }, { instanceId: INSTANCE, rentalUuid: UUID }).cost).toBeNull();
  });
});

describe('planRescue does not send what the server already has', () => {
  it('skips a local note whose body and date are already on the server', () => {
    // The measured case: three 1508 Williamsburg notes are in property_notes
    // AND in localStorage. A rescue that re-sent them would double his record.
    const rental = door({
      unitNotes: [
        { id: 'un-1', body: 'Paid rent $1150 for August 2026', kind: 'financial', note_date: '2026-07-25' },
        { id: 'un-2', body: 'New one nobody has seen', kind: 'general', note_date: '2026-08-01' },
      ],
    });
    const plan = planRescue(rental, {
      instanceId: INSTANCE,
      rentalUuid: UUID,
      existingNotes: [{ body: 'Paid rent $1150 for August 2026', note_date: '2026-07-25' }],
    });
    expect(plan.notes).toHaveLength(1);
    expect(plan.notes[0].body).toBe('New one nobody has seen');
  });

  it('keeps two identical notes written on different days', () => {
    // "Rent paid" every month is eleven true records, not one duplicate.
    const rental = door({
      unitNotes: [
        { id: 'un-1', body: 'Rent paid', note_date: '2026-06-01' },
        { id: 'un-2', body: 'Rent paid', note_date: '2026-07-01' },
      ],
    });
    expect(planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID }).notes).toHaveLength(2);
  });

  it('reports nothing to carry when the record is already whole', () => {
    const plan = planRescue(door(), { instanceId: INSTANCE, rentalUuid: UUID });
    expect(plan.total).toBe(0);
    expect(plan.reason).toBe('nothing-to-carry');
    expect(describePlan(plan)).toBe('Everything in this record is already on the server.');
  });
});

describe('planRescue tells the truth about what it cannot carry', () => {
  it('names the photos it is leaving behind instead of implying a clean sweep', () => {
    const rental = door({
      rooms: [{ id: 'rm-1', name: 'Kitchen', photos: [{ id: 'ph-1', src: 'data:image/webp;base64,AA' }] }],
      maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', description: 'Fixed sink', photos: [{ src: 'data:x' }, { src: 'data:y' }] }],
    });
    const plan = planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(plan.deferred.join(' ')).toContain('3 photos');
  });

  it('names the entries it could not file, one by one', () => {
    const rental = door({
      maintenanceLog: [
        { id: 'mt-1', date: '2026-05-02', description: 'Fixed sink' },
        { id: 'mt-2', date: '', description: 'Something happened' },
      ],
    });
    const plan = planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(plan.events).toHaveLength(1);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0]).toContain('maintenance entry #2');
  });

  it('holds back UUID-keyed records when the door has not synced, and says so', () => {
    // Two keys, not interchangeable: property_rooms wants rentals.id. Without
    // it the rows would be keyed to nothing, which is worse than not yet
    // written — so they wait, and the landlord is told they are waiting.
    const rental = door({
      rooms: [{ id: 'rm-1', name: 'Kitchen' }],
      equipment: [{ id: 'eq-1', category: 'Furnace' }],
      conversationLog: [{ id: 'cv-1', date: '2026-07-06', summary: 'Called about the heat' }],
    });
    const plan = planRescue(rental, { instanceId: INSTANCE, rentalUuid: null });
    expect(plan.rooms).toHaveLength(0);
    expect(plan.systems).toHaveLength(0);
    expect(plan.notes).toHaveLength(1);   // slug-keyed, so it can go now
    expect(plan.deferred.join(' ')).toContain('has synced');
  });

  it('refuses a rental with no slug rather than writing rows keyed to nothing', () => {
    const plan = planRescue({ name: 'no id' }, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe('no-slug');
  });

  it('survives a rental whose stores are missing entirely', () => {
    const plan = planRescue({ id: 'r-x' }, { instanceId: INSTANCE, rentalUuid: UUID });
    expect(plan.ok).toBe(true);
    expect(plan.total).toBe(0);
  });
});

describe('a record already carried up stops counting as device-only', () => {
  // THE DEFECT: the first version of this counted from localStorage alone, so
  // after a successful carry the strip went right on saying "1 room on this
  // device only". The upload deduped correctly server-side, so pressing again
  // was harmless — but a surface that reports work as undone after doing it is
  // lying to the person reading it.
  const rental = door({
    conversationLog: [{ id: 'cv-1', date: '2026-07-06', summary: 'Called about the heat' }],
    rooms: [{ id: 'rm-1', name: 'Kitchen' }, { id: 'rm-2', name: 'Bathroom' }],
    equipment: [{ id: 'eq-1', category: 'Furnace' }],
    maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', description: 'Fixed sink' }],
  });

  it('drops every part that the server already holds under its device id', () => {
    const plan = planRescue(rental, {
      instanceId: INSTANCE,
      rentalUuid: UUID,
      carried: {
        notes: new Set(['cv-1']),
        rooms: new Set(['rm-1', 'rm-2']),
        systems: new Set(['eq-1']),
        events: new Set(['mt-1']),
      },
    });
    expect(plan.total).toBe(0);
    expect(describePlan(plan)).toBe('Everything in this record is already on the server.');
  });

  it('still offers the half that has not been carried', () => {
    const plan = planRescue(rental, {
      instanceId: INSTANCE,
      rentalUuid: UUID,
      carried: { rooms: new Set(['rm-1']) },
    });
    expect(plan.rooms).toHaveLength(1);
    expect(plan.rooms[0].name).toBe('Bathroom');
    expect(plan.systems).toHaveLength(1);
  });

  it('accepts a plain array as readily as a Set, and an absent part as none', () => {
    const plan = planRescue(rental, {
      instanceId: INSTANCE, rentalUuid: UUID, carried: { rooms: ['rm-1', 'rm-2'] },
    });
    expect(plan.rooms).toHaveLength(0);
    expect(plan.events).toHaveLength(1);
  });

  it('over-offers rather than under-offers when the check came back empty', () => {
    // A failed read yields empty sets. Showing a carried record as still local
    // is a harmless second press; hiding a genuinely stranded one is the harm.
    const plan = planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID, carried: {} });
    expect(plan.total).toBe(5);
  });
});

describe('the sentence on the button says what will happen', () => {
  it('counts each kind of record in plain words', () => {
    const rental = door({
      conversationLog: [{ id: 'cv-1', date: '2026-07-06', summary: 'Called about the heat' }],
      rooms: [{ id: 'rm-1', name: 'Kitchen' }],
      equipment: [{ id: 'eq-1', category: 'Furnace' }, { id: 'eq-2', category: 'Roof' }],
      maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', description: 'Fixed sink' }],
    });
    const line = describePlan(planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID }));
    expect(line).toContain('1 note');
    expect(line).toContain('1 room');
    expect(line).toContain('2 systems');
    expect(line).toContain('1 maintenance entry');
    expect(line).toContain('on this device only');
  });
});

describe('every row the plan produces carries its device id', () => {
  it('so pressing the button twice cannot double the record', () => {
    const rental = door({
      conversationLog: [{ id: 'cv-1', date: '2026-07-06', summary: 'Called' }],
      unitNotes: [{ id: 'un-9', body: 'A note', note_date: '2026-07-07' }],
      rooms: [{ id: 'rm-1', name: 'Kitchen' }],
      equipment: [{ id: 'eq-1', category: 'Furnace' }],
      maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', description: 'Fixed sink' }],
    });
    const plan = planRescue(rental, { instanceId: INSTANCE, rentalUuid: UUID });
    const all = [...plan.notes, ...plan.rooms, ...plan.systems, ...plan.events];
    expect(all).toHaveLength(5);
    for (const row of all) expect(row.legacy_id).toBeTruthy();
  });
});
