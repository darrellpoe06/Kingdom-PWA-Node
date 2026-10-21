// =============================================================================
// Your team, for building from nothing (DR-1175)
// =============================================================================
// Darrell, 2026-10-21, with a photograph of a slide titled "Your Team" and a
// link: "Research and add features and functionality for users to formulation
// of their teams... make sense? Inside the Poe Properties Apps for building
// from nothing... make sense?"
//
// The slide IS the spec. These cases pin it verbatim, keep his source's
// emphasis as data rather than as a claim, and keep my own reading of the
// numbering clearly separate from his list.
import { describe, it, expect } from 'vitest';
import {
  DEV_TEAM_ROLES, SEQUENCE_READING, roleKey, rolesFor, teamState, nextToFind, teamWords,
} from '../modules/properties/development-team.js';

describe('the slide, verbatim', () => {
  it('carries all sixteen roles in his numbering', () => {
    expect(DEV_TEAM_ROLES).toHaveLength(16);
    expect(DEV_TEAM_ROLES.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('keeps his wording, not a tidied version of it', () => {
    const byN = Object.fromEntries(DEV_TEAM_ROLES.map((r) => [r.n, r.role]));
    expect(byN[1]).toBe('Surveyor');
    expect(byN[2]).toBe('Soil Engineer');
    expect(byN[3]).toBe('Attorney / Title Company');
    expect(byN[4]).toBe('Securities Attorney');
    expect(byN[6]).toBe('Zoning Consultant / Land Use Attorney');
    // "GC" stays "GC". Spelling it out would be me improving his source.
    expect(byN[7]).toBe('GC');
    expect(byN[13]).toBe('Suppliers / Subs');
    expect(byN[16]).toBe('Property Manager');
  });

  it('keeps the one note the slide adds, in the slide’s own words', () => {
    const pm = DEV_TEAM_ROLES.find((r) => r.n === 16);
    expect(pm.note).toBe('should be a part of the dev process');
    // And it is the ONLY role the slide annotates.
    expect(DEV_TEAM_ROLES.filter((r) => r.note).map((r) => r.n)).toEqual([16]);
  });

  it('marks exactly the three the slide marks "(commercial)"', () => {
    expect(DEV_TEAM_ROLES.filter((r) => r.commercial).map((r) => r.role))
      .toEqual(['Civil Engineer', 'MEP Engineer', 'Structural Engineer']);
  });

  it('records the slide’s emphasis on nine of them AS EMPHASIS, never as "required"', () => {
    // The slide sets nine bold and says nowhere what bold means. Carrying it as
    // data lets a surface say "the slide emphasises these nine", which is true,
    // and stops it saying "these nine are required", which the slide does not.
    const bold = DEV_TEAM_ROLES.filter((r) => r.emphasis === 'bold').map((r) => r.n);
    expect(bold).toEqual([1, 2, 3, 5, 6, 7, 8, 13, 14]);
    expect(bold).toHaveLength(9);
    for (const r of DEV_TEAM_ROLES) expect(['bold', 'plain']).toContain(r.emphasis);
    // No field anywhere calls a role required.
    expect(JSON.stringify(DEV_TEAM_ROLES)).not.toMatch(/required/i);
  });

  it('keeps MY reading of the numbering separate from HIS list, and says whose it is', () => {
    expect(SEQUENCE_READING.whose).toMatch(/not stated on the slide/);
    expect(SEQUENCE_READING.words).toMatch(/Survey and soil before a design/);
    // The reading is not smuggled into a role.
    expect(JSON.stringify(DEV_TEAM_ROLES)).not.toMatch(/before a design/);
  });
});

describe('the team a build of this kind calls for', () => {
  it('a commercial build offers all sixteen', () => {
    expect(rolesFor({ commercial: true })).toHaveLength(16);
  });

  it('a residential build drops the three the SLIDE calls commercial, and only those', () => {
    const res = rolesFor({ commercial: false });
    expect(res).toHaveLength(13);
    expect(res.map((r) => r.role)).not.toContain('Civil Engineer');
    expect(res.map((r) => r.role)).not.toContain('MEP Engineer');
    expect(res.map((r) => r.role)).not.toContain('Structural Engineer');
    // The other plain-set roles are NOT dropped — plain is not "optional".
    expect(res.map((r) => r.role)).toContain('Securities Attorney');
    expect(res.map((r) => r.role)).toContain('Bookkeeper');
    expect(res.map((r) => r.role)).toContain('Interior Designer');
  });
});

describe('who you have and who you still need', () => {
  it('an empty record is sixteen gaps — the true answer for starting from nothing', () => {
    const s = teamState({ commercial: true, filled: {} });
    expect(s.need).toHaveLength(16);
    expect(s.have).toHaveLength(0);
    expect(teamWords(s)).toMatch(/Nobody on the team yet — 16 roles to fill/);
  });

  it('counts the ones filled and names the next by HIS numbering', () => {
    const s = teamState({ filled: { surveyor: 'Ames Land Survey', architect: { name: 'R. Okafor', phone: '555' } } });
    expect(s.have.map((r) => r.n)).toEqual([1, 5]);
    expect(nextToFind(s).role).toBe('Soil Engineer');   // 2 is the lowest unfilled
    expect(teamWords(s)).toMatch(/2 of 16 filled · 14 to go · next by the numbering: Soil Engineer/);
  });

  it('a name typed as a bare string counts the same as a full record', () => {
    const s = teamState({ filled: { gc: 'Bell Brothers' } });
    expect(s.have[0].who.name).toBe('Bell Brothers');
  });

  it('a blank or whitespace name is NOT somebody — it is still a gap', () => {
    const s = teamState({ filled: { gc: '   ', lenders: { name: '' } } });
    expect(s.have).toHaveLength(0);
    expect(s.need.map((r) => r.role)).toContain('GC');
    expect(s.need.map((r) => r.role)).toContain('Lenders');
  });

  it('a whole team says so, and says the thing the slide says about the last two', () => {
    const filled = Object.fromEntries(DEV_TEAM_ROLES.map((r) => [roleKey(r.role), 'someone']));
    const s = teamState({ filled });
    expect(s.need).toHaveLength(0);
    expect(nextToFind(s)).toBe(null);
    expect(teamWords(s)).toMatch(/All 16 roles filled/);
    expect(teamWords(s)).toMatch(/not at the end of it/);
  });

  it('counts the slide’s emphasised roles still missing, without calling them required', () => {
    const s = teamState({ filled: { surveyor: 'A' } });
    expect(s.emphasised).toBe(9);
    expect(s.emphasisedNeeded).toBe(8);
  });

  it('a role key is stable across the punctuation his wording uses', () => {
    expect(roleKey('Attorney / Title Company')).toBe('attorney-title-company');
    expect(roleKey('Zoning Consultant / Land Use Attorney')).toBe('zoning-consultant-land-use-attorney');
    expect(roleKey('Suppliers / Subs')).toBe('suppliers-subs');
    expect(roleKey('GC')).toBe('gc');
  });
});
