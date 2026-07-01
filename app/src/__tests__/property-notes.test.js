import { describe, it, expect } from 'vitest';
import { buildPropertyNote, noteDateOf, sortNotes, notesForUnit, NOTE_KINDS } from '../lib/property-notes.js';

// The per-unit note primitive: a note must attach to a specific door and carry a
// date so the RecordsLog "filing office" can index it. Pure + proven-to-catch.

const CLOCK = '2026-07-01T14:00:00.000Z';

describe('buildPropertyNote', () => {
  it('builds a valid note attached to a specific unit', () => {
    const n = buildPropertyNote({ rentalRef: 'r6', unitLabel: 'Apt 3', body: 'Handrail loose', kind: 'maintenance' }, CLOCK);
    expect(n.rental_ref).toBe('r6');
    expect(n.unit_label).toBe('Apt 3');
    expect(n.body).toBe('Handrail loose');
    expect(n.kind).toBe('maintenance');
    expect(n.note_date).toBe('2026-07-01'); // defaults to the clock's date
  });

  it('refuses a note with no target unit', () => {
    expect(() => buildPropertyNote({ body: 'orphan' }, CLOCK)).toThrow(/specific unit/);
  });

  it('refuses an empty note', () => {
    expect(() => buildPropertyNote({ rentalRef: 'r6', body: '   ' }, CLOCK)).toThrow(/text/);
  });

  it('falls back to a valid kind and honors an explicit note date', () => {
    const n = buildPropertyNote({ rentalRef: 'r6', body: 'x', kind: 'not-a-kind', noteDate: '2026-06-15' }, CLOCK);
    expect(NOTE_KINDS).toContain(n.kind);
    expect(n.kind).toBe('general');
    expect(n.note_date).toBe('2026-06-15');
  });
});

describe('noteDateOf / sortNotes / notesForUnit', () => {
  it('sorts newest-first with pinned notes floated up', () => {
    const notes = [
      { id: '1', rental_ref: 'r6', note_date: '2026-06-01', body: 'old' },
      { id: '2', rental_ref: 'r6', note_date: '2026-06-20', body: 'new' },
      { id: '3', rental_ref: 'r6', note_date: '2026-05-01', body: 'pinned old', pinned: true },
    ];
    const sorted = sortNotes(notes);
    expect(sorted[0].id).toBe('3');          // pinned first
    expect(sorted[1].id).toBe('2');          // then newest
    expect(sorted[2].id).toBe('1');
  });

  it('noteDateOf falls back to created_at when no note_date', () => {
    expect(noteDateOf({ created_at: '2026-07-01T10:00:00Z' })).toBe('2026-07-01');
  });

  it('notesForUnit isolates one door (defense in depth)', () => {
    const notes = [{ rental_ref: 'r6', body: 'a' }, { rental_ref: 'r7', body: 'b' }];
    expect(notesForUnit(notes, 'r6')).toHaveLength(1);
    expect(notesForUnit(notes, 'r6')[0].body).toBe('a');
  });
});
