// =============================================================================
// One forms engine for every product (DR-0357): the engine is product-free,
// each product's originals validate clean, the floor cannot be un-required or
// hidden, the rental application keeps every app-collected field and drops
// exactly the ones the app refuses to hold, and the migrations + smokes ride
// the isolation matrix. DR-0076: every wall asserted, both ways.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultForm, normalizeForm, validateForm, liveSections, newCustomKey, newCustomField, formKeys,
} from '../lib/forms-engine.js';
import {
  PRODUCTS, PRODUCT_KEYS, originalFor, normalizeFor, validateFor, liveSectionsFor,
  originalProduct, resolveProduct, RENTAL_APPLICATION_SECTIONS, RENTAL_APPLICATION_FLOOR,
} from '../lib/product-forms.js';
import { APPLICATION_SECTIONS, LEGAL_REVIEW_REQUIRED, OUT_OF_BAND } from '../modules/properties/intake.js';
import { HOUSEHOLD_SECTIONS, HOUSEHOLD_FLOOR } from '../lib/household-intake.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const M200 = read('../../../infra/supabase/migrations-auto/0200-one-forms-engine-for-every-product-the-office-of-each-instance-edits-its-own-questions-and-documents.sql');
const M201 = read('../../../infra/supabase/migrations-auto/0201-the-household-keeps-its-own-record-and-its-own-shelf-of-documents.sql');
const S200 = read('../../../infra/supabase/tests/0200-product-forms-smoke.sql');
const S201 = read('../../../infra/supabase/tests/0201-household-and-vault-smoke.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

const SIMPLE = [
  { id: 'a', title: 'First', blurb: 'b', fields: [
    { key: 'name', type: 'text', label: 'Name', required: true },
    { key: 'colour', type: 'select', label: 'Colour', options: ['red', 'blue'] },
    { key: 'agree', type: 'acknowledgment', label: 'Agree', statement: 'I agree.' },
  ] },
];

describe('the engine is product-free', () => {
  it('takes whatever sections it is handed and merges a saved body onto them', () => {
    const def = defaultForm(SIMPLE, { floor: ['name'] });
    expect(formKeys(def)).toEqual(['name', 'colour', 'agree']);
    expect(validateForm(SIMPLE, def, { floor: ['name'] })).toEqual([]);
    const body = { sections: [{ id: 'a', title: 'First (ours)', fields: [
      { key: 'name', label: 'Your name', required: false, hidden: true },
      { key: 'x_pets', type: 'text', label: 'Pets' },
    ] }] };
    const merged = normalizeForm(SIMPLE, body, { floor: ['name'] });
    const name = merged.sections[0].fields.find((f) => f.key === 'name');
    expect(name.label).toBe('Your name');
    expect(name.required).toBe(true);   // the floor cannot be made optional
    expect(name.hidden).toBe(false);    // nor hidden
    expect(formKeys(merged)).toContain('x_pets');
    expect(formKeys(merged)).toContain('colour'); // never less than the original
    const errs = validateForm(SIMPLE, body, { floor: ['name'] });
    expect(errs.join(' ')).toMatch(/cannot be hidden/);
    expect(errs.join(' ')).toMatch(/cannot be made optional/);
  });
  it('an acknowledgment is always fixed, floor or not; a live section drops what the office hid', () => {
    const body = { sections: [{ id: 'a', title: 'First', fields: [
      { key: 'agree', label: 'Agree', hidden: true, required: false },
      { key: 'colour', label: 'Colour', hidden: true },
    ] }] };
    expect(validateForm(SIMPLE, body, {}).join(' ')).toMatch(/cannot be hidden/);
    const live = liveSections(SIMPLE, body, {});
    expect(live[0].fields.map((f) => f.key)).toEqual(['name', 'agree']); // colour hidden, agree cannot hide
  });
  it('a new question gets a safe key and never collides', () => {
    expect(newCustomKey('Pets at home')).toBe('x_pets-at-home');
    expect(newCustomKey('Pets at home', ['x_pets-at-home'])).toBe('x_pets-at-home-2');
    expect(newCustomField('select', 'Which van', []).options).toEqual([]);
  });
});

describe('every product is registered with its own originals', () => {
  it('two products, each with a form and its documents, all validating clean', () => {
    expect(PRODUCT_KEYS).toEqual(['poetech', 'properties']);
    for (const key of PRODUCT_KEYS) {
      const resolved = originalProduct(key);
      expect(Object.keys(resolved).length, key).toBeGreaterThan(1);
      for (const [formKey, entry] of Object.entries(resolved)) {
        expect(entry.version, `${key}.${formKey}`).toBe(0); // nothing saved by an office yet
        const body = entry.kind === 'form' ? entry.form : entry.doc;
        expect(validateFor(key, formKey, body), `${key}.${formKey}`).toEqual([]);
      }
    }
  });
  it('the household form carries every authored question, and its floor holds', () => {
    const form = originalFor('poetech', 'household-intake');
    expect(form.sections.map((s) => s.id)).toEqual(HOUSEHOLD_SECTIONS.map((s) => s.id));
    for (const k of HOUSEHOLD_FLOOR) expect(formKeys(form)).toContain(k);
    const body = { sections: [{ id: 'household', title: 'The household', fields: [{ key: 'householdName', label: 'Name', required: false, hidden: true }] }] };
    expect(validateFor('poetech', 'household-intake', body).join(' ')).toMatch(/cannot be/);
    const live = liveSectionsFor('poetech', 'household-intake', null);
    expect(live.find((s) => s.id === 'agreements').fields[0].type).toBe('acknowledgment');
  });
  it('an unknown product or form is refused rather than guessed', () => {
    expect(originalFor('nope', 'x')).toBeNull();
    expect(normalizeFor('poetech', 'nope', {})).toBeNull();
    expect(validateFor('poetech', 'nope', {})).toEqual(['unknown form']);
    expect(resolveProduct('nope', null)).toEqual({});
  });
});

describe('the rental application, on the engine, loses nothing and gains no risk', () => {
  it('keeps every app-collected field and drops exactly the out-of-band and derived ones', () => {
    const appFields = APPLICATION_SECTIONS.flatMap((s) => s.fields.filter((f) => f.collect === 'app').map((f) => `${s.id}.${f.id}`));
    const engineKeys = RENTAL_APPLICATION_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
    // Every app-collected field of a kind the form can render survives.
    for (const k of engineKeys) expect(appFields).toContain(k);
    expect(engineKeys.length).toBeGreaterThan(50);
    // Nothing the app refuses to hold can appear, by any path.
    for (const k of OUT_OF_BAND) expect(engineKeys).not.toContain(k);
    expect(engineKeys.join(' ')).not.toMatch(/ssn|driversLicense/i);
    // The block awaiting a lawyer is not in the form the engine renders.
    expect(RENTAL_APPLICATION_SECTIONS.map((s) => s.id)).not.toContain('consumer');
    expect(LEGAL_REVIEW_REQUIRED.blocks.length).toBeGreaterThan(0);
  });
  it('the floor is the answers a landlord cannot act without, and it holds', () => {
    expect(RENTAL_APPLICATION_FLOOR).toContain('applicant.lastName');
    expect(RENTAL_APPLICATION_FLOOR).toContain('applicant.firstName');
    const body = { sections: [{ id: 'applicant', title: 'Applicant', fields: [{ key: 'applicant.lastName', label: 'Last name', required: false }] }] };
    expect(validateFor('properties', 'rental-application', body).join(' ')).toMatch(/cannot be made optional/);
  });
  it('the criteria and the fair-housing page ship as real documents, and say they are not legal advice', () => {
    const crit = originalFor('properties', 'rental-criteria');
    const fair = originalFor('properties', 'fair-housing');
    expect(crit.sections.length).toBeGreaterThan(3);
    expect(JSON.stringify(crit)).toMatch(/not legal advice/);
    expect(JSON.stringify(fair)).toMatch(/not legal advice/);
    expect(JSON.stringify(fair)).toMatch(/Fair Credit Reporting Act/);
    // No invented threshold is presented as this office's decided policy.
    expect(JSON.stringify(crit)).not.toMatch(/\b[23](\.\d)?x\b/);
    expect(JSON.stringify(crit)).toMatch(/The office fills in/);
  });
  it('both products are instance-scoped, and neither names an instance_type', () => {
    expect(PRODUCTS.poetech.instanceTypes).toEqual(['family']);
    expect(PRODUCTS.properties.instanceTypes).toContain('landlord');
    expect(M200).not.toMatch(/instance_type\s*=/);
    expect(M201).not.toMatch(/instance_type\s*=/);
  });
});

describe('migrations 0200 + 0201 and their smokes', () => {
  it('0200: owner/admin saves with a note, version+1, history append-only, writes only through the function', () => {
    expect(M200).toMatch(/CREATE TABLE IF NOT EXISTS public\.product_forms/);
    expect(M200).toMatch(/UNIQUE \(instance_id, product, key\)/);
    expect(M200).toMatch(/UNIQUE \(form_id, version\)/);
    expect(M200).toMatch(/ALTER TABLE public\.product_forms ENABLE ROW LEVEL SECURITY/);
    expect(M200).toMatch(/ALTER TABLE public\.product_form_history ENABLE ROW LEVEL SECURITY/);
    expect(M200).toMatch(/coalesce\(v_role, ''\) NOT IN \('owner','admin'\)/);
    expect(M200).toMatch(/say in a few words what changed/);
    expect(M200).toMatch(/version = public\.product_forms\.version \+ 1/);
    // No direct-write policy exists on either table.
    expect(M200).not.toMatch(/CREATE POLICY [a-z_]+ ON public\.product_forms FOR (INSERT|UPDATE|DELETE)/);
    expect(M200).toMatch(/apply_assistant_scope_overlay\(\);\s*SELECT public\.apply_viewer_readonly_overlay\(\);/);
  });
  it('0200: an anonymous applicant may read properties only, and only a named office', () => {
    expect(M200).toMatch(/IF product_in <> 'properties' THEN RAISE EXCEPTION 'sign in first'/);
    expect(M200).toMatch(/IF instance_in IS NULL THEN RAISE EXCEPTION 'name the office'/);
    expect(M200).toMatch(/GRANT EXECUTE ON FUNCTION public\.product_forms_read\(text, uuid\) TO authenticated, anon/);
    expect(M200).toMatch(/REVOKE ALL ON FUNCTION public\.product_form_save\([^)]*\) FROM PUBLIC, anon/);
  });
  it('0201: the household record refuses secrets by key, in the function AND on the table', () => {
    for (const k of ['accountNumber', 'routingNumber', 'cardNumber', 'password', 'ssn', 'diagnosis']) {
      expect(M201, k).toMatch(new RegExp(`patch_in \\? '${k}'|record \\? '${k}'`));
    }
    expect(M201).toMatch(/household_records_no_secrets_chk/);
    expect(M201).toMatch(/a signature is made on the document itself, never through a patch/);
    expect(M201).toMatch(/only an adult with a seat in this household may fill its record/);
    expect(M201).toMatch(/'signedAtServer', CASE/);
    expect(M201).toMatch(/clock_timestamp\(\)/);
  });
  it('0201: the shelf is private until shared, locatable, and its bucket is private with owner-only writes', () => {
    expect(M201).toMatch(/shared_with_household boolean NOT NULL DEFAULT false/);
    expect(M201).toMatch(/family_documents_locatable_chk/);
    expect(M201).toMatch(/created_by = auth\.uid\(\)\s*\n\s*OR \(shared_with_household AND public\.user_in_instance\(instance_id\)\)/);
    expect(M201).toMatch(/'family-documents', 'family-documents', false/);
    expect(M201).toMatch(/family_documents_object_write ON storage\.objects FOR INSERT/);
    expect(M201).toMatch(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
    // Update and delete stay with the person who filed it, even once shared.
    expect(M201).toMatch(/CREATE POLICY family_documents_update ON public\.family_documents FOR UPDATE TO authenticated\s*\n\s*USING \(created_by = auth\.uid\(\)\)/);
  });
  it('both smokes prove the walls and ride the product-forms leg', () => {
    for (const must of ['a member changed the household form', 'a viewer changed the household form', 'an anonymous reader saw a household form', 'a direct insert bypassed the save function']) {
      expect(S200, must).toContain(must);
    }
    for (const must of ['an account number was written into a household record', 'a viewer signed the household covenant', 'a member saw', 'a member deleted a document another person shared']) {
      expect(S201, must).toContain(must);
    }
    expect(LEG).toMatch(/feature: product-forms/);
    expect(LEG).toMatch(/0200-one-forms-engine-for-every-product[^"\n]*\.sql 0201-the-household-keeps-its-own-record[^"\n]*\.sql"/);
    expect(LEG).toMatch(/smokes: "0200-product-forms-smoke\.sql 0201-household-and-vault-smoke\.sql[^"\n]*"/);
  });
});
