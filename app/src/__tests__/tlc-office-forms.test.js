// The office edits its own forms (DR-0352) and colleagues already on the old
// form claim a prefilled packet by email (DR-0353): the pure middle, the
// migrations, the smokes, the leg.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OFFICE_DOCUMENT_KEYS, FLOOR_REQUIRED, CUSTOM_FIELD_TYPES, CUSTOM_KEY_RE,
  defaultIntakeForm, normalizeIntakeForm, validateIntakeForm, newCustomKey, newCustomField, formKeys, liveSections, requiredCustomKeys,
  normalizeDocument, validateDocument, resolveOfficeDocuments, liveDocuments, ORIGINAL,
} from '../lib/tlc-office-forms.js';
import { documentVersion, signatureRecord } from '../lib/tlc-signing.js';
import { SECTIONS, ACKNOWLEDGMENT_KEYS } from '../lib/tlc-onboarding.js';
import { TLC_HANDBOOK } from '../lib/tlc-handbook.js';
import { TLC_CONTRACTOR_AGREEMENT } from '../lib/tlc-agreements.js';
import { TLC_POSITIONS, TLC_RESOURCES as RESOURCES } from '../lib/tlc-governance.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const M196 = read('../../../infra/supabase/migrations-auto/0196-the-office-edits-its-own-forms-the-intake-questions-and-the-documents-versioned-in-the-app.sql');
const M197 = read('../../../infra/supabase/migrations-auto/0197-colleagues-already-on-the-form-a-prefilled-invite-claimed-by-email-at-sign-in.sql');
const S196 = read('../../../infra/supabase/tests/0196-tlc-office-forms-smoke.sql');
const S197 = read('../../../infra/supabase/tests/0197-tlc-prefilled-invite-smoke.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

describe('the intake form as data: the original, a body normalized onto it, what renders', () => {
  it('the original carries every code question with its editable words and nothing invented; the floor stays required', () => {
    const f = defaultIntakeForm();
    expect(f.sections.map((s) => s.id)).toEqual(SECTIONS.map((s) => s.id));
    expect(formKeys(f).length).toBe(SECTIONS.reduce((n, s) => n + s.fields.length, 0));
    for (const k of FLOOR_REQUIRED) expect(formKeys(f)).toContain(k);
    const lic = f.sections.flatMap((s) => s.fields).find((x) => x.key === 'licenseType');
    expect(lic.required).toBe(true);
    expect(lic.options.length).toBeGreaterThan(3);
    const ack = f.sections.flatMap((s) => s.fields).find((x) => x.key === 'policies');
    expect(ack.statement).toMatch(/Therapy Practice Policies/);
    expect(validateIntakeForm(f)).toEqual([]);
    expect(JSON.stringify(normalizeIntakeForm(null))).toBe(JSON.stringify(f));
    expect(JSON.stringify(ORIGINAL.intakeForm)).toBe(JSON.stringify(f));
  });
  it('a saved body relabels, adds help, hides an optional question, adds the office’s own question; a floor question can be neither hidden nor optional; a base question keeps its key and type', () => {
    const body = {
      sections: [
        { id: 'about', title: 'About you (edited)', blurb: 'new blurb', fields: [
          { key: 'firstName', type: 'textarea', label: 'Given name', help: 'as on your license', required: false, hidden: true },
          { key: 'preferredName', label: 'What should we call you?', hidden: true },
          { key: 'x_pronouns', type: 'text', label: 'Pronouns', required: true, help: 'optional to share' },
          { key: 'x_bad key', type: 'text', label: 'Broken' },
          { key: 'x_kind', type: 'rocket', label: 'Broken kind' },
          { key: 'x_langs', type: 'multiselect', label: 'Languages', options: 'English\nSpanish\n\nEnglish' },
        ] },
        { id: 'made-up', title: 'Not a section', fields: [{ key: 'x_nope', type: 'text', label: 'dropped' }] },
      ],
    };
    const f = normalizeIntakeForm(body);
    const about = f.sections.find((s) => s.id === 'about');
    expect(about.title).toBe('About you (edited)');
    const first = about.fields.find((x) => x.key === 'firstName');
    expect(first).toMatchObject({ type: 'text', label: 'Given name', help: 'as on your license', required: true, hidden: false, base: true });
    expect(about.fields.find((x) => x.key === 'preferredName')).toMatchObject({ hidden: true, base: true });
    expect(about.fields.find((x) => x.key === 'x_pronouns')).toEqual({ key: 'x_pronouns', type: 'text', label: 'Pronouns', help: 'optional to share', required: true, hidden: false, custom: true });
    expect(about.fields.find((x) => x.key === 'x_langs').options).toEqual(['English', 'Spanish']);
    expect(about.fields.some((x) => x.key === 'x_bad key' || x.key === 'x_kind')).toBe(false);
    expect(f.sections.some((s) => s.id === 'made-up')).toBe(false);
    expect(f.sections.length).toBe(SECTIONS.length);
    // the validator names the floor breaches the editor must refuse
    const errs = validateIntakeForm(body);
    expect(errs.some((e) => /First Name.*cannot be hidden/.test(e))).toBe(true);
    expect(errs.some((e) => /First Name.*cannot be made optional/.test(e))).toBe(true);
    expect(errs.some((e) => /malformed key/.test(e))).toBe(true);
    expect(errs.some((e) => /cannot render/.test(e))).toBe(true);
  });
  it('what renders: hidden questions gone, base questions keep their file/image/word rules under the office’s words, custom choose-any as the form expects', () => {
    const body = { sections: [
      { id: 'about', fields: [{ key: 'preferredName', hidden: true }, { key: 'x_langs', type: 'multiselect', label: 'Languages', options: ['English', 'Spanish'] }] },
      { id: 'profile', fields: [{ key: 'headshot', label: 'Your photo' }, { key: 'bio', label: 'Bio (edited)', required: true }] },
      { id: 'agreements', fields: [{ key: 'policies', statement: 'I read the policies.' }] },
    ] };
    const live = liveSections(body);
    const about = live.find((s) => s.id === 'about');
    expect(about.fields.some((x) => x.key === 'preferredName')).toBe(false);
    expect(about.fields.find((x) => x.key === 'x_langs')).toEqual({ key: 'x_langs', type: 'multiselect', label: 'Languages', help: '', required: false, custom: true, options: [{ id: 'English', label: 'English', detail: '' }, { id: 'Spanish', label: 'Spanish', detail: '' }] });
    const profile = live.find((s) => s.id === 'profile');
    const photo = profile.fields.find((x) => x.key === 'headshot');
    expect(photo).toMatchObject({ type: 'file', doc: true, image: true, label: 'Your photo' });
    const bio = profile.fields.find((x) => x.key === 'bio');
    expect(bio.words).toEqual([150, 300]);
    expect(bio.required).toBe(true);
    expect(live.find((s) => s.id === 'agreements').fields.find((x) => x.key === 'policies').statement).toBe('I read the policies.');
    // what the server enforces beyond the floor: the office's required questions that a person types
    expect(requiredCustomKeys(body)).toEqual(['bio']);
    expect(requiredCustomKeys(null)).toEqual([]);
  });
  it('a new question gets a unique x_ key from its label; the kinds are the six the form renders', () => {
    expect(newCustomKey('Preferred pronouns?')).toBe('x_preferred-pronouns');
    expect(newCustomKey('Preferred pronouns?', ['x_preferred-pronouns'])).toBe('x_preferred-pronouns-2');
    expect(newCustomKey('!!!')).toBe('x_question');
    expect(CUSTOM_KEY_RE.test(newCustomKey('A very long label that keeps going and going past thirty characters'))).toBe(true);
    const f = newCustomField('select', 'Shirt size', formKeys(defaultIntakeForm()));
    expect(f).toEqual({ key: 'x_shirt-size', type: 'select', label: 'Shirt size', help: '', required: false, hidden: false, custom: true, options: [] });
    expect(CUSTOM_FIELD_TYPES.map((t) => t.key)).toEqual(['text', 'textarea', 'select', 'multiselect', 'yesno', 'date']);
    expect(validateIntakeForm({ sections: [{ id: 'about', title: 'About', fields: [f] }] }).some((e) => /at least two choices/.test(e))).toBe(true);
  });
});

describe('the documents as data, and the signature that pins the live text', () => {
  it('the original documents are the code ones; a body normalized without a field keeps the original words; sections renumber', () => {
    expect(normalizeDocument('policies', null)).toEqual(TLC_HANDBOOK);
    expect(normalizeDocument('contractorAgreement', null)).toEqual(TLC_CONTRACTOR_AGREEMENT);
    const edited = normalizeDocument('contractorAgreement', { title: 'Contractor Agreement (2026)', sections: [{ n: 9, title: 'Only one', text: ' kept ', items: ['a', '', 'b'] }] });
    expect(edited.title).toBe('Contractor Agreement (2026)');
    expect(edited.preamble).toBe(TLC_CONTRACTOR_AGREEMENT.preamble);
    expect(edited.sections).toEqual([{ n: 1, title: 'Only one', text: 'kept', items: ['a', 'b'] }]);
    const hb = normalizeDocument('policies', { sections: [{ id: 'x', title: 'One', items: [{ label: 'L', text: 'T' }, { label: '', text: '' }] }] });
    expect(hb.welcome).toBe(TLC_HANDBOOK.welcome);
    expect(hb.sections).toEqual([{ id: 'x', title: 'One', items: [{ label: 'L', text: 'T' }] }]);
    expect(validateDocument('policies', { title: '', sections: [] })).toEqual(['the document needs at least one section']); // an empty title falls back to the original's, never less
    expect(validateDocument('confidentiality', { title: 'NDA', sections: [{ title: '' }] })).toEqual(['section 1 needs a title', 'section 1 (untitled) has no words']);
    expect(normalizeDocument('nope', {})).toBeNull();
  });
  it('resolveOfficeDocuments reads the database shape onto the original (version 0 where nothing is saved) and the signature hashes the LIVE text', () => {
    const r = resolveOfficeDocuments({ 'intake-form': { body: { sections: [{ id: 'about', title: 'Edited' }] }, version: 3, updated_at: '2026-09-10T18:00:00Z', note: 'x' }, confidentiality: { body: { title: 'NDA v2', sections: [{ title: 'Purpose', text: 'y' }] }, version: 2 } });
    expect(r.intakeForm.version).toBe(3);
    expect(r.intakeForm.form.sections[0].title).toBe('Edited');
    expect(r.documents.confidentiality.version).toBe(2);
    expect(r.documents.policies.version).toBe(0);
    expect(r.documents.contractorAgreement.doc).toEqual(TLC_CONTRACTOR_AGREEMENT);
    const live = liveDocuments(r);
    expect(Object.keys(live).sort()).toEqual([...ACKNOWLEDGMENT_KEYS].sort());
    expect(documentVersion('confidentiality', live)).not.toBe(documentVersion('confidentiality'));
    expect(documentVersion('policies', live)).toBe(documentVersion('policies'));
    expect(signatureRecord({ signature: 'Ann Lee', key: 'confidentiality', live, now: new Date('2026-09-10T18:00:00Z') }).docVersion).toBe(documentVersion('confidentiality', live));
    expect(OFFICE_DOCUMENT_KEYS).toEqual(['intake-form', 'policies', 'confidentiality', 'contractorAgreement']);
  });
  it('the governance chart names the editing right for owner/admin only', () => {
    expect(RESOURCES.some((r) => r.id === 'onboarding:forms')).toBe(true);
    for (const p of TLC_POSITIONS) {
      const has = p.resources.includes('onboarding:forms');
      expect(has, p.key).toBe(['owner', 'admin'].includes(p.role));
    }
  });
});

describe('migration 0196 and its smoke: versioned rows, the note, who reads, the live required questions at submit', () => {
  it('two tables, RLS on, read by every member / history by owner-admin, written only by the save function; the save requires a note and bumps the version; the read serves a member or a packet holder', () => {
    expect(M196).toContain("key         text NOT NULL CHECK (key IN ('intake-form','policies','confidentiality','contractorAgreement'))");
    expect(M196).toContain('UNIQUE (instance_id, key)');
    expect(M196).toContain('UNIQUE (document_id, version)');
    expect(M196).toMatch(/CREATE POLICY tlc_office_documents_member_read[\s\S]*coalesce\(public\.user_role_in_instance\(instance_id\), ''\) <> ''/);
    expect(M196).toMatch(/CREATE POLICY tlc_office_document_history_manager_read[\s\S]*IN \('owner','admin'\)/);
    expect(M196).not.toMatch(/CREATE POLICY tlc_office_document(s|_history)_\w+_(insert|update|delete)/);
    expect(M196).toContain("IF char_length(v_note) < 3 OR char_length(v_note) > 500 THEN");
    expect(M196).toContain('version = public.tlc_office_documents.version + 1');
    expect(M196).toContain("INSERT INTO public.tlc_office_document_history");
    expect(M196).toContain("VALUES (v_row.instance_id, auth.uid(), 'update', 'tlc_office_document', v_row.id,");
    expect(M196).toMatch(/tlc_office_documents_read[\s\S]*i\.instance_type = 'therapy-practice'[\s\S]*p\.applicant_user_id = auth\.uid\(\)/);
    // submit: the floor first, then the office's own required questions, never a file or a signature
    expect(M196).toContain("FOREACH v_key IN ARRAY ARRAY['firstName','lastName','phone','preferredEmail','licenseType','employmentStatus'] LOOP");
    expect(M196).toContain("WHERE coalesce((f->>'required')::boolean, false) AND NOT coalesce((f->>'hidden')::boolean, false)");
    expect(M196).toContain("v_type IN ('file','acknowledgment','availability')");
    expect(M196).toContain("clock_timestamp() AT TIME ZONE 'UTC'"); // 0194's stamp survives
    expect(M196).toMatch(/SELECT public\.apply_assistant_scope_overlay\(\);\s*SELECT public\.apply_viewer_readonly_overlay\(\);/);
    for (const rung of ['a save without a note was accepted', 'history holds % versions', 'a member changed the office form', 'the assistant changed the office form', 'changed a row by hand', 'the member reads the history', 'a stranger reads the office forms', "a submit without the office''s required question went through", 'the custom answer was not kept']) expect(S196, rung).toContain(rung);
  });
});

describe('migration 0197 and its smoke: a prefilled invite claimed by email', () => {
  it('a prefill never carries a password or a bank number; the banking rides apart and leaves the invite once behind the wall; claim finds the invite by the signed-in email and never a second packet; a signature is never prefilled', () => {
    expect(M197).toMatch(/tlc_onboarding_invites_prefill_check CHECK \([\s\S]*NOT \(prefill \? 'caqhPassword'\)[\s\S]*NOT \(prefill \? 'routingNumber'\)/);
    expect(M197).toContain('UPDATE public.tlc_onboarding_invites SET prefill_banking = NULL WHERE id = inv.id;');
    expect(M197).toContain("coalesce(inv.prefill, '{}'::jsonb)");
    expect(M197).toMatch(/tlc_onboarding_claim\(\)[\s\S]*WHERE i\.email = v_email AND i\.revoked_at IS NULL AND i\.expires_at > now\(\)[\s\S]*NOT EXISTS \(SELECT 1 FROM public\.tlc_onboarding_packets p WHERE p\.invite_id = i\.id\)/);
    expect(M197).toContain("RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('claimed', false);");
    expect(M197).toContain("v_pkt := public.tlc_onboarding_start_packet(v_inv);");
    expect(M197).toContain("REVOKE ALL ON FUNCTION public.tlc_onboarding_start_packet(public.tlc_onboarding_invites) FROM PUBLIC, anon, authenticated;");
    expect(M197).toContain("RAISE EXCEPTION 'a prefill is the packet body only: never a password, never a bank number';");
    expect(M197).not.toMatch(/acknowledgments/); // nothing in the mechanism touches a signature
    for (const rung of ['a prefill with a password was accepted', 'a prefill with a bank number was accepted', 'a stranger claimed a packet', 'the answers are not in the packet', 'a signature was prefilled', 'did not reach the walled table', 'still sit on the invite', 'a second claim made a new packet', 'a colleague without an invite claimed a packet', 'does not say the packet was prefilled']) expect(S197, rung).toContain(rung);
  });
  it('both ride the tlc-office leg after 0195, with their smokes', () => {
    expect(LEG).toMatch(/0195-join-the-team[^"\n]*\.sql 0196-the-office-edits-its-own-forms[^"\n]*\.sql 0197-colleagues-already-on-the-form[^"\n]*\.sql"/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0196-tlc-office-forms-smoke\.sql 0197-tlc-prefilled-invite-smoke\.sql"/);
  });
});
