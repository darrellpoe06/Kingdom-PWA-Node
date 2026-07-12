// @vitest-environment node
// =============================================================================
// household-profiles — a parent adds a child, minor data stays protected
// =============================================================================
// DP 2026-07-12: "How do I add my son to the Love Corner App?" PROVEN-TO-CATCH:
// a child profile carries ONLY a first name + age band (never a minor's last
// name / contact info), the age band sets the Learn pace, and a double-add can't
// duplicate.
import { describe, it, expect } from 'vitest';
import {
  AGE_BANDS, ageBand, paceForBand, makeChildProfile, listChildren, childExists,
} from '../lib/household-profiles.js';

describe('makeChildProfile — first name + age band, nothing more', () => {
  it('adds a child and maps the age band to the Learn pace', () => {
    const r = makeChildProfile({ firstName: 'Junior', bandId: 'child' });
    expect(r.ok).toBe(true);
    expect(r.child).toMatchObject({ kind: 'child-profile', firstName: 'Junior', bandId: 'child', pace: 'child' });
  });

  it('NEVER stores a minor\'s last name / contact info (COPPA)', () => {
    const r = makeChildProfile({ firstName: 'Junior', name: 'Junior Poe', bandId: 'child', lastName: 'Poe', phone: '2173594172', email: 'x@y.com', address: '312 E Bradley' });
    expect(r.ok).toBe(true);
    const keys = Object.keys(r.child);
    expect(keys).not.toContain('lastName');
    expect(keys).not.toContain('phone');
    expect(keys).not.toContain('email');
    expect(keys).not.toContain('address');
    expect(r.child.firstName).toBe('Junior');           // first name only, not "Junior Poe"
  });

  it('rejects a missing name or a bad age band', () => {
    expect(makeChildProfile({ bandId: 'child' }).ok).toBe(false);
    expect(makeChildProfile({ firstName: 'Junior', bandId: 'nope' }).errors.join(' ')).toMatch(/age/);
  });
});

describe('age bands + pace', () => {
  it('covers the Learn tab bands and maps adult -> standard', () => {
    expect(AGE_BANDS.map((b) => b.id)).toEqual(['child', 'youth', 'teen', 'adult', 'senior']);
    expect(paceForBand('child')).toBe('child');
    expect(paceForBand('adult')).toBe('standard');
    expect(ageBand('senior').range).toBe('65+');
    expect(paceForBand('unknown')).toBe('standard');    // safe default
  });
});

describe('listChildren / childExists — no accidental duplicates', () => {
  const raw = [
    { kind: 'child-profile', firstName: 'Junior', bandId: 'child', pace: 'child' },
    { kind: 'child-profile', firstName: 'junior', bandId: 'child', pace: 'child' }, // dup (case)
    { kind: 'child-profile', firstName: 'Zoe', bandId: 'youth', pace: 'youth' },
    { kind: 'note', firstName: 'not a child' },          // ignored
  ];
  it('returns only well-formed, de-duplicated child rows', () => {
    const kids = listChildren(raw);
    expect(kids).toHaveLength(2);
    expect(kids.map((k) => k.firstName)).toEqual(['Junior', 'Zoe']);
  });
  it('childExists catches an already-added child (case-insensitive)', () => {
    expect(childExists(raw, 'JUNIOR', 'child')).toBe(true);
    expect(childExists(raw, 'Junior', 'teen')).toBe(false);   // same name, different age = not a dup
  });
});
