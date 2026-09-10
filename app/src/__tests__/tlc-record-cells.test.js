// =============================================================================
// A cell for every item (DR-0354): the pure middle. Which cells an editor may
// fill, the value a cell holds, the patch that carries only what changed and
// never a refused key. DR-0076: proven-to-catch — each wall is asserted.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { editableSections, keptForThePacket, cellValue, cellDraft, cellsPatch, cellsFilled, REFUSED_CELL_KEYS, CELL_TYPES } from '../lib/tlc-record-cells.js';
import { liveSections } from '../lib/tlc-office-forms.js';
import { SECTIONS, DAYS, emptyPacket } from '../lib/tlc-onboarding.js';

const live = liveSections(null);

describe('which cells an editor fills', () => {
  it('every question of the live form that is not a file, a signature or banking is a cell; the banking section is dropped whole', () => {
    const ed = editableSections(live);
    expect(ed.map((s) => s.id)).not.toContain('banking');
    expect(ed.map((s) => s.id)).not.toContain('agreements'); // only signatures live there
    const keys = ed.flatMap((s) => s.fields.map((f) => f.key));
    const expected = SECTIONS.flatMap((s) => s.fields).filter((f) => CELL_TYPES.includes(f.type)).map((f) => f.key);
    expect(keys).toEqual(expected);
    for (const k of keys) expect(REFUSED_CELL_KEYS).not.toContain(k);
    expect(keys).toContain('availability');
    expect(keys).toContain('caqhAccessGranted');
  });
  it('files and the three signatures are named as kept for the packet', () => {
    const kept = keptForThePacket(live);
    expect(kept.map((k) => k.key)).toContain('resume');
    expect(kept.map((k) => k.key)).toContain('w9');
    expect(kept.filter((k) => k.type === 'acknowledgment').map((k) => k.key)).toEqual(['policies', 'confidentiality', 'contractorAgreement']);
  });
  it('a question the office added is a cell too, under its own key', () => {
    const form = { sections: [{ id: 'about', fields: [{ key: 'x_pronouns', type: 'text', label: 'Pronouns' }] }] };
    const ed = editableSections(liveSections(form));
    expect(ed.find((s) => s.id === 'about').fields.map((f) => f.key)).toContain('x_pronouns');
  });
});

describe('the value a cell holds', () => {
  it('a missing cell reads as empty of its kind, never undefined', () => {
    expect(cellValue({}, { key: 'phone', type: 'tel' })).toBe('');
    expect(cellValue({}, { key: 'specialties', type: 'multiselect' })).toEqual([]);
    expect(cellValue({}, { key: 'caqhAccessGranted', type: 'yesno' })).toBe(null);
    const a = cellValue({}, { key: 'availability', type: 'availability' });
    expect(Object.keys(a)).toEqual(DAYS);
    expect(a.Monday).toEqual([]);
  });
  it('a held value reads back as given, copied not shared', () => {
    const rec = { specialties: ['a'], availability: { Monday: ['7 am - 8 am'] }, caqhAccessGranted: false, licenseNumber: 12 };
    const v = cellValue(rec, { key: 'specialties', type: 'multiselect' });
    v.push('b');
    expect(rec.specialties).toEqual(['a']);
    expect(cellValue(rec, { key: 'availability', type: 'availability' }).Monday).toEqual(['7 am - 8 am']);
    expect(cellValue(rec, { key: 'caqhAccessGranted', type: 'yesno' })).toBe(false);
    expect(cellValue(rec, { key: 'licenseNumber', type: 'text' })).toBe('12');
  });
});

describe('the patch: only what changed, never a refused key', () => {
  it('an untouched draft is an empty patch; a changed cell is the whole patch', () => {
    const rec = { ...emptyPacket(), firstName: 'Ann', phone: '217' };
    const base = cellDraft(rec, live);
    expect(cellsPatch(base, base)).toEqual({});
    const after = { ...base, phone: '309', specialties: ['trauma-informed'] };
    expect(cellsPatch(base, after)).toEqual({ phone: '309', specialties: ['trauma-informed'] });
  });
  it('a refused key never rides, even if a draft somehow carries it', () => {
    const base = { phone: '1' };
    const after = { phone: '2', acknowledgments: { policies: { agreed: true } }, documents: {}, routingNumber: '071102568', caqhPassword: 'x' };
    expect(cellsPatch(base, after)).toEqual({ phone: '2' });
  });
  it('the honest count: an answer is a non-empty string, a true/false, a chosen option, or a day with hours', () => {
    expect(cellsFilled({ a: '', b: ' x ', c: [], d: ['y'], e: null, f: false, g: { Monday: [], Tuesday: [] }, h: { Monday: ['7 am - 8 am'] } })).toEqual({ filled: 4, total: 8 });
  });
});
