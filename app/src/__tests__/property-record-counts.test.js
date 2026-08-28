// =============================================================================
// The collapsed card counts what the open record holds — Darrell, 2026-08-28
// =============================================================================
import { describe, it, expect } from 'vitest';
import { recordCounts, recordSummary, hasRecords, STORES } from '../lib/property-record-counts.js';

// The exact shape from the screenshots: three unit notes, nothing else.
const WILLIAMSBURG = {
  id: 'r1',
  name: '1508 Williamsburg',
  unitNotes: [
    { id: 'n1', kind: 'financial', text: 'Paid rent $1150 for August 2026' },
    { id: 'n2', kind: 'maintenance', text: 'She said her toilet is backing up and understands she will have to pay if her kids put something down the toilet.' },
    { id: 'n3', kind: 'general', text: 'She said her toilet is backing up?' },
  ],
  maintenanceLog: [],
  conversationLog: [],
};

describe('the defect from the screenshots', () => {
  it('counts the three unit notes the collapsed card reported as zero', () => {
    // The card said "0 MAINT · 0 NOTES · 0 PHOTOS"; the record showed 3.
    expect(recordCounts(WILLIAMSBURG).unitNotes).toBe(3);
    expect(recordCounts(WILLIAMSBURG).total).toBe(3);
    expect(recordSummary(WILLIAMSBURG)).toContain('3 notes');
  });

  it('does not confuse unit notes with tenant/vendor conversations', () => {
    // The original label called conversationLog "notes", which is why three
    // real notes could sit behind a card that said zero.
    const both = { ...WILLIAMSBURG, conversationLog: [{ id: 'c1' }, { id: 'c2' }] };
    const c = recordCounts(both);
    expect(c.unitNotes).toBe(3);
    expect(c.conversationLog).toBe(2);
    const said = recordSummary(both);
    expect(said).toContain('3 notes');
    expect(said).toContain('2 conversations');
  });
});

describe('every store a record keeps is counted', () => {
  it('counts all six, not the three the old summary knew about', () => {
    const full = {
      unitNotes: [1], maintenanceLog: [1, 2], conversationLog: [1, 2, 3],
      rooms: [1, 2, 3, 4], equipment: [1, 2, 3, 4, 5], photos: [1, 2, 3, 4, 5, 6],
    };
    const c = recordCounts(full);
    expect(c.total).toBe(21);
    for (const s of STORES) expect(c[s.key], `${s.key} is not counted`).toBeGreaterThan(0);
  });

  it('rooms and equipment are counted — the old summary ignored both', () => {
    expect(recordCounts({ rooms: [1, 2] }).total).toBe(2);
    expect(recordSummary({ rooms: [1, 2] })).toContain('2 rooms');
    expect(recordSummary({ equipment: [1] })).toContain('1 system');
  });
});

describe('what an empty record says', () => {
  it('says so in words rather than a row of zeroes', () => {
    expect(recordSummary({})).toBe('Records — nothing filed yet');
    expect(hasRecords({})).toBe(false);
  });

  it('names only what is actually there', () => {
    const said = recordSummary({ unitNotes: [1], rooms: [] });
    expect(said).toBe('Records — 1 note');
    expect(said).not.toContain('0 ');
    expect(said).not.toContain('rooms');
  });
});

describe('photos can come from the NAS channel, and that count wins', () => {
  it('uses the override so real pictures are never under-reported', () => {
    expect(recordCounts({ photos: [] }, { photoOverride: 7 }).photos).toBe(7);
    expect(recordSummary({ photos: [] }, { photoOverride: 7 })).toContain('7 photos');
  });

  it('ignores a nonsense override rather than trusting it', () => {
    expect(recordCounts({ photos: [1, 2] }, { photoOverride: null }).photos).toBe(2);
    expect(recordCounts({ photos: [1, 2] }, { photoOverride: -3 }).photos).toBe(2);
    expect(recordCounts({ photos: [1, 2] }, { photoOverride: NaN }).photos).toBe(2);
  });
});

describe('junk in never throws', () => {
  it('survives null, undefined and wrong types', () => {
    for (const bad of [null, undefined, 0, '', 'x', []]) {
      expect(() => recordCounts(bad)).not.toThrow();
      expect(recordCounts(bad).total).toBe(0);
    }
    expect(recordCounts({ unitNotes: 'three' }).unitNotes).toBe(0);
  });
});
