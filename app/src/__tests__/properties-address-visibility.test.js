// =============================================================================
// The address is shown when the landlord says so — Darrell, 2026-08-28
// =============================================================================
// "we may or may not want the addresses to show on the Properties tab until
// they submit a request for an application to rent then show... I know I want
// more control without needing to build again"
//
// THE FINDING, measured on all twelve live rows before any of this was written:
// public_vacancies() omits r.address and the storefront promised "the exact
// address is given by a person, not published here" — while publishing `label`,
// which is display_name, which IS the street on 12 of 12 doors. Withholding a
// COLUMN is not withholding the INFORMATION.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sql = readFileSync(
  join(process.cwd(), '..', 'infra/supabase/migrations-auto/0158-the-address-is-shown-when-he-says-so.sql'),
  'utf8',
);
const store = () => readFileSync(join(process.cwd(), 'src/modules/properties/Storefront.jsx'), 'utf8');
const app = () => readFileSync(join(process.cwd(), 'src/modules/properties/PropertiesApp.jsx'), 'utf8');

describe('0158 — the control, per door', () => {
  it('adds the setting with only the two meanings it has', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS address_visibility text/);
    expect(sql).toMatch(/address_visibility IN \('public', 'after-application'\)/);
  });

  it('defaults to WITHHOLDING — a door nobody set does not leak', () => {
    expect(sql).toMatch(/coalesce\(p_visibility, 'after-application'\) = 'public'/);
  });

  it('decides it in ONE place, so nothing can drift again', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.rental_address_is_public/);
    const fn = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.public_vacancies'));
    expect(fn).toMatch(/rental_address_is_public\(r\.address_visibility\)/);
  });
});

describe('a gated card is placeable, not locatable', () => {
  const label = sql.slice(sql.indexOf('CASE WHEN v.shown'), sql.indexOf('END AS label'));

  it('never falls back to display_name when gated — that IS the street', () => {
    const gated = label.slice(label.indexOf('ELSE'));
    expect(gated).not.toMatch(/display_name/);
    expect(gated).not.toMatch(/\ba\.address\b|r\.address/);
  });

  it('still says enough to want it: size, kind, and the town', () => {
    const gated = label.slice(label.indexOf('ELSE'));
    expect(gated).toMatch(/beds/);
    expect(gated).toMatch(/property_type/);
    expect(gated).toMatch(/v\.city/);
  });

  it('withholds the unit too — "Apt B" at a named building is the door', () => {
    expect(sql).toMatch(/CASE WHEN v\.shown THEN v\.unit ELSE NULL END/);
  });

  it('tells the caller which it did, so the card cannot guess', () => {
    expect(sql).toMatch(/address_shown boolean/);
    expect(sql).toMatch(/v\.shown AS address_shown/);
  });
});

describe('"...then show" — the applicant gets it', () => {
  const fn = sql.slice(sql.indexOf('vacancy_address_for_applicant'));

  it('is keyed by the application the person just created', () => {
    expect(fn).toMatch(/FROM rental_applications a/);
    expect(fn).toMatch(/WHERE a\.id = p_application/);
  });

  it('cannot be walked to enumerate addresses', () => {
    // The id is returned by their own insert; 0152 grants no SELECT on the
    // table, so nobody can read one back out. A wrong id returns no row.
    expect(fn).toMatch(/RETURNS TABLE \(address text/);
    expect(fn).not.toMatch(/OR TRUE|1=1/);
  });

  it('still refuses for our own home and for an unlisted door', () => {
    expect(fn).toMatch(/r\.listed_at IS NOT NULL/);
    expect(fn).toMatch(/NOT public\.rental_is_own_home/);
  });
});

describe('the surface stops making a claim it was breaking', () => {
  it('no longer prints the blanket "not published here" line', () => {
    expect(app()).not.toMatch(/The exact address is given by a person, not published here/);
  });

  it('says per card which one it is', () => {
    expect(store()).toMatch(/Address shared when you apply/);
    expect(store()).toMatch(/unit\.addressShown === false/);
  });

  it('reads an un-migrated database as SHOWN, not as protected', () => {
    // Claiming a door is held back when the migration has not run would be the
    // same lie pointing the other way.
    expect(app()).toMatch(/address_shown === undefined \? true/);
  });
});
