// =============================================================================
// The household's own record, shelf and findings (DR-0357). The record refuses
// what the app must never hold, every question names the surface it feeds, the
// shelf takes a file OR a pointer and is private until shared, and the findings
// say nothing when there is nothing true to say. DR-0076: proven both ways.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  HOUSEHOLD_SECTIONS, HOUSEHOLD_ALL_FIELDS, HOUSEHOLD_FLOOR, HOUSEHOLD_REFUSED_KEYS,
  emptyHousehold, normalizeHousehold, validateHousehold, householdProgress, householdLabelFor,
} from '../lib/household-intake.js';
import { HOUSEHOLD_COVENANT } from '../lib/household-covenant.js';
import {
  VAULT_CATEGORIES, documentSlug, validateDocument, validateFile, documentPath,
  expiringSoon, shelfSummary, MAX_FILE_BYTES,
} from '../lib/family-vault.js';
import { householdInsights, workflowCandidates, WORKFLOW_LADDER, HELP_DEPENDS_ON } from '../lib/household-insights.js';
import { exportHouseholdRecord } from '../lib/household-sync.js';
import { liveSectionsFor } from '../lib/product-forms.js';

const filled = () => ({
  householdName: 'The Poe household', answeredBy: 'Darrell Poe', contactEmail: 'd@example.com',
  helpWith: ['money'], sabbathDay: 'Sunday', bankName: 'Busey', biggestFriction: 'Paperwork piles up',
  incomeKinds: ['w2', 'rental'],
});

describe('the household record asks only what a real surface reads', () => {
  it('every question names the surface it feeds, so a question nobody reads cannot survive review', () => {
    for (const f of HOUSEHOLD_ALL_FIELDS) {
      if (f.type === 'acknowledgment') continue;
      expect(typeof f.feeds, f.key).toBe('string');
      expect(f.feeds.length, f.key).toBeGreaterThan(8);
    }
  });
  it('it holds no bank number, no password, no Social Security number and no diagnosis — by key', () => {
    const keys = HOUSEHOLD_ALL_FIELDS.map((f) => f.key);
    for (const bad of HOUSEHOLD_REFUSED_KEYS) expect(keys).not.toContain(bad);
    // The bank's NAME is a fact we keep; its numbers are not.
    expect(keys).toContain('bankName');
    const dirty = normalizeHousehold({ ...filled(), accountNumber: '13198025', ssn: '000-00-0000', diagnosis: 'x' });
    for (const bad of HOUSEHOLD_REFUSED_KEYS) expect(dirty[bad]).toBeUndefined();
    const check = validateHousehold({ ...filled(), routingNumber: '071102568' });
    expect(check.ok).toBe(false);
    expect(check.errors.join(' ')).toMatch(/routingNumber is never stored/);
  });
  it('it asks nothing about a named child — only how many, in ranges', () => {
    const minors = HOUSEHOLD_ALL_FIELDS.find((f) => f.key === 'minorsCount');
    expect(minors.type).toBe('select');
    expect(minors.options).toContain('none');
    expect(minors.help).toMatch(/Family Roster/);
    const text = JSON.stringify(HOUSEHOLD_SECTIONS).toLowerCase();
    expect(text).not.toMatch(/child(ren)?(’|')s name|name of (your |the )?child/);
  });
  it('the health section is logistics, never a clinical record', () => {
    const wellbeing = HOUSEHOLD_SECTIONS.find((s) => s.id === 'wellbeing');
    expect(wellbeing.blurb).toMatch(/not a medical record/);
    expect(wellbeing.fields.map((f) => f.key)).not.toContain('diagnosis');
  });
  it('an empty record has a place for every item, and the floor is what makes it stand', () => {
    const empty = emptyHousehold();
    for (const f of HOUSEHOLD_ALL_FIELDS) {
      if (f.type === 'acknowledgment') expect(empty.acknowledgments[f.key]).toBeTruthy();
      else expect(f.key in empty, f.key).toBe(true);
    }
    expect(validateHousehold(empty).missing).toEqual(HOUSEHOLD_FLOOR);
    expect(validateHousehold(filled()).ok).toBe(true);
    expect(validateHousehold({ ...filled(), contactEmail: 'nope' }).errors.join(' ')).toMatch(/does not look like an address/);
    expect(householdLabelFor('sabbathDay')).toBe('Our day of rest');
  });
  it('progress is counted, never painted', () => {
    expect(householdProgress(null)).toMatchObject({ done: 0, pct: 0 });
    const p = householdProgress(filled());
    expect(p.done).toBe(8); // the eight keys `filled()` sets
    expect(p.total).toBe(HOUSEHOLD_ALL_FIELDS.length);
    expect(p.pct).toBe(Math.round((8 / p.total) * 100));
  });
  it('the covenant says what is NOT built, not only what is', () => {
    const text = JSON.stringify(HOUSEHOLD_COVENANT);
    expect(text).toMatch(/not encrypted with a key only you hold/i);
    expect(text).toMatch(/private shelf, not a safe deposit box/i);
    expect(text).toMatch(/do not sell this data/i);
    expect(text).toMatch(/insurer/i);
  });
  it('the record exports as plain labelled answers a person can read and keep', () => {
    const sections = liveSectionsFor('poetech', 'household-intake', null);
    const out = exportHouseholdRecord({ householdName: 'The Poe household', record: filled() }, sections);
    expect(out.household).toBe('The Poe household');
    expect(out.answers['Our day of rest']).toBe('Sunday');
    expect(out.answers['What we call this household']).toBe('The Poe household');
    expect(Object.keys(out.answers)).not.toContain('Household Covenant');
    expect(out.note).toMatch(/yours/);
  });
});

describe('the shelf takes a file OR a pointer, and is private until shared', () => {
  it('a row with neither bytes nor a place is refused; either one alone stands', () => {
    expect(validateDocument({ label: 'The deed', category: 'home' }).join(' ')).toMatch(/either upload the file or say where the paper is/);
    expect(validateDocument({ label: 'The deed', category: 'home', storagePath: 'u/x.pdf' })).toEqual([]);
    expect(validateDocument({ label: 'The will', category: 'legacy', whereFiled: 'the fire safe' })).toEqual([]);
    expect(validateDocument({ label: '', category: 'home', whereFiled: 'x' }).join(' ')).toMatch(/give the document a name/);
    expect(validateDocument({ label: 'x', category: 'nope', whereFiled: 'x' }).join(' ')).toMatch(/choose the shelf/);
    expect(validateDocument({ label: 'x', category: 'home', whereFiled: 'x', dateOf: 'last June' }).join(' ')).toMatch(/must be a real date/);
  });
  it('a file is bounded and typed; its path puts the owner first, which IS the access rule', () => {
    expect(validateFile({ size: MAX_FILE_BYTES + 1, type: 'application/pdf', name: 'x.pdf' }).ok).toBe(false);
    expect(validateFile({ size: 10, type: 'application/x-msdownload', name: 'x.exe' }).ok).toBe(false);
    expect(validateFile({ size: 10, type: 'application/pdf', name: 'x.pdf' }).ok).toBe(true);
    expect(documentPath({ userId: 'u1', slug: 'the-deed', fileName: 'Deed.PDF' })).toBe('u1/the-deed.pdf');
  });
  it('slugs are readable and never collide; the shelves are named for a household, not an office', () => {
    expect(documentSlug('The deed on Maple')).toBe('the-deed-on-maple');
    expect(documentSlug('The deed on Maple', ['the-deed-on-maple'])).toBe('the-deed-on-maple-2');
    const ids = VAULT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain('identity');
    expect(ids).toContain('legacy');
    expect(ids).toContain('health-admin');
    expect(VAULT_CATEGORIES.find((c) => c.id === 'health-admin').hint).toMatch(/Not a medical record/);
  });
  it('the summary and the expiry window count rows, never guess', () => {
    const rows = [
      { id: 'a', category: 'home', storagePath: 'x', sharedWithHousehold: true, expiresOn: '2026-10-01', label: 'Insurance' },
      { id: 'b', category: 'home', whereFiled: 'safe', sharedWithHousehold: false, label: 'Deed' },
    ];
    const s = shelfSummary(rows);
    expect(s).toMatchObject({ total: 2, files: 1, pointers: 1, shared: 1 });
    expect(s.byCategory.find((c) => c.id === 'home')).toMatchObject({ total: 2, files: 1, pointers: 1 });
    expect(s.empty.length).toBe(VAULT_CATEGORIES.length - 1);
    expect(expiringSoon(rows, 60, '2026-09-11').map((r) => r.id)).toEqual(['a']);
    expect(expiringSoon(rows, 5, '2026-09-11')).toEqual([]);
    expect(shelfSummary([]).total).toBe(0);
  });
});

describe('the findings say nothing when there is nothing true to say', () => {
  it('an untouched household gets an honest sentence, not an empty dashboard', () => {
    const r = householdInsights({});
    expect(r.ok).toBe(false);
    expect(r.findings).toEqual([]);
    expect(r.unavailable).toMatch(/Nothing has been written down yet/);
  });
  it('every finding names what it read, and the sharpest one is what you asked for against what you gave', () => {
    const r = householdInsights({ record: filled(), documents: [], today: '2026-09-11' });
    expect(r.ok).toBe(true);
    for (const f of r.findings) {
      expect(f.basis.length, f.id).toBeGreaterThan(0);
      expect(f.invitation.length, f.id).toBeGreaterThan(0);
      expect(f.truth.length, f.id).toBeGreaterThan(10);
    }
    const money = r.findings.find((f) => f.id === 'want-money');
    expect(money).toBeTruthy();
    expect(money.data).toMatch(new RegExp(`of ${HELP_DEPENDS_ON.money.length} of the answers`));
    expect(money.truth).toMatch(/can only show part of the picture/);
    expect(r.findings.find((f) => f.id === 'covenant-unsigned')).toBeTruthy();
    expect(r.findings.find((f) => f.id === 'sabbath').data).toMatch(/Sunday/);
  });
  it('a signed covenant reads as signed; an expiring paper outranks everything else', () => {
    const record = { ...filled(), acknowledgments: { householdCovenant: { agreed: true, signature: 'Darrell Poe', signedOn: '2026-09-11' } } };
    const docs = [{ id: 'd1', category: 'home', label: 'Home insurance', storagePath: 'x', expiresOn: '2026-09-20' }];
    const r = householdInsights({ record, documents: docs, today: '2026-09-11' });
    expect(r.findings[0].id).toBe('expiring');
    expect(r.findings.find((f) => f.id === 'covenant').data).toMatch(/signed by Darrell Poe/);
    expect(r.findings.find((f) => f.id === 'covenant-unsigned')).toBeUndefined();
  });
  it('the ladder is the process, and a candidate only ever starts at the bottom', () => {
    expect(WORKFLOW_LADDER.map((s) => s.id)).toEqual(['noticed', 'described', 'mvp', 'systematized', 'hardened']);
    for (const s of WORKFLOW_LADDER) expect(s.means.length).toBeGreaterThan(30);
    expect(workflowCandidates({})).toEqual([]);
    const c = workflowCandidates({ record: filled() });
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ id: 'friction', stage: 'noticed' });
    expect(c[0].said).toBe('Paperwork piles up');
    expect(c[0].from).toMatch(/household_records\.record\.biggestFriction/);
  });
});
