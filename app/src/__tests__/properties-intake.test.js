// @vitest-environment node
// =============================================================================
// The rental application is HIS form — and it refuses to hold what it shouldn't
// =============================================================================
// Source: Darrell's Drive, APPLICATION FOR RENTAL (the paper form Poe Properties
// uses). These assertions pin (a) that the app's questions are the real form's
// questions, (b) that an SSN never lands in this database, (c) that the borrowed
// California/On-Site.com authorization cannot be rendered as ours, and (d) that
// the fair-housing guardrail DR-0101 §7 requires is a machine check, not prose.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  APPLICATION_SECTIONS, FCRA_RIGHTS, LEGAL_REVIEW_REQUIRED, OUT_OF_BAND,
  applicationFieldIds, validateApplication, screenDecisionReason, PROTECTED_CLASS_TERMS,
} from '../modules/properties/intake.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('the questions are the ones on his form', () => {
  it('carries every section of the source application', () => {
    const ids = APPLICATION_SECTIONS.map((s) => s.id);
    for (const s of ['unit', 'applicant', 'currentAddress', 'previousAddress', 'occupants',
      'pets', 'income', 'emergency', 'references', 'vehicles', 'other', 'background']) {
      expect(ids, `the source form has a ${s} section`).toContain(s);
    }
  });

  it('keeps the specifics a landlord actually screens on', () => {
    const all = applicationFieldIds();
    for (const f of ['currentAddress.landlordPhone', 'currentAddress.reasonForLeaving',
      'income.monthlySalary', 'income.supervisorPhone', 'references.relationship',
      'vehicles.license', 'background.evicted', 'background.convicted', 'other.heardAbout']) {
      expect(all, `${f} is on the paper form and must survive the port`).toContain(f);
    }
  });

  it('asks for a cell phone, because that is how an approved tenant signs in', () => {
    const applicant = APPLICATION_SECTIONS.find((s) => s.id === 'applicant');
    const cell = applicant.fields.find((f) => f.id === 'cellPhone');
    expect(cell.required).toBe(true);
    expect(applicant.fields.find((f) => f.id === 'email').required).toBe(false);
  });

  it('every background question that can decline someone is required, with room to explain', () => {
    const bg = APPLICATION_SECTIONS.find((s) => s.id === 'background');
    for (const id of ['bankruptcy', 'refusedRent', 'evicted', 'convicted']) {
      expect(bg.fields.find((f) => f.id === id).required).toBe(true);
    }
    expect(bg.fields.some((f) => f.id === 'evictedDetail')).toBe(true);
    expect(bg.fields.some((f) => f.id === 'convictedDetail')).toBe(true);
    expect(bg.note).toMatch(/not an automatic decline/i);
  });
});

describe('the app never holds a Social Security number', () => {
  it('SSN and driver\'s license are collected OUT OF BAND', () => {
    expect(OUT_OF_BAND).toContain('applicant.ssn');
    expect(OUT_OF_BAND).toContain('applicant.driversLicense');
  });

  it('a filled SSN is REFUSED, not quietly stored', () => {
    const r = validateApplication({ 'applicant.ssn': '123-45-6789' });
    expect(r.ok).toBe(false);
    expect(r.refused).toEqual(['applicant.ssn']);
  });

  it('an application with the required fields and no SSN validates clean', () => {
    const values = {};
    for (const s of APPLICATION_SECTIONS) {
      for (const f of s.fields) if (f.required && f.collect === 'app') values[`${s.id}.${f.id}`] = 'x';
    }
    expect(validateApplication(values)).toEqual({ ok: true, missing: [], refused: [] });
  });

  it('no surface in the app renders an SSN input (the model is not the only guard)', () => {
    const dir = join(here, '../modules/properties');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.jsx'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      // Word-bounded: a bare /ssn/i also matches "className" (cla-ssN-ame),
      // which failed this on its first run against clean code — a false alarm
      // is a broken gate too (DR-0076 §3).
      expect(/\bssn\b/i.test(src), `${f} references an SSN field`).toBe(false);
    }
  });
});

describe('the borrowed authorization cannot ship as ours', () => {
  it('is carried as a REVIEW item naming the real problem, with a date', () => {
    expect(LEGAL_REVIEW_REQUIRED.why).toMatch(/On-Site\.com/);
    expect(LEGAL_REVIEW_REQUIRED.why).toMatch(/California/);
    expect(LEGAL_REVIEW_REQUIRED.why).toMatch(/Illinois/);
    expect(LEGAL_REVIEW_REQUIRED.reReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_REVIEW_REQUIRED.blocks).toContain('screening-decision');
  });

  it('the vendor and the wrong state are NOT reproduced as our own text anywhere', () => {
    const dir = join(here, '../modules/properties');
    for (const f of readdirSync(dir)) {
      if (!/\.(js|jsx)$/.test(f) || f === 'intake.js') continue;
      const src = readFileSync(join(dir, f), 'utf8');
      expect(/On-Site\.com/i.test(src), `${f} reproduces the borrowed vendor text`).toBe(false);
    }
  });

  it('keeps the FCRA rights that protect the applicant', () => {
    expect(FCRA_RIGHTS.length).toBeGreaterThanOrEqual(5);
    expect(FCRA_RIGHTS.join(' ')).toMatch(/dispute incomplete or inaccurate/i);
  });
});

describe('fair housing is a gate, not a paragraph (DR-0101 §7)', () => {
  it('refuses a decision recorded on a protected-class factor', () => {
    for (const reason of [
      'we do not rent to families with children',
      'Their accent made me uncomfortable',
      'wrong religion for this building',
      'she is pregnant and it is a small unit',
    ]) {
      const r = screenDecisionReason(reason);
      expect(r.ok, `"${reason}" must be refused`).toBe(false);
      expect(r.refused).toBe(true);
      expect(r.message).toMatch(/Fair Housing Act forbids it/);
    }
  });

  it('accepts a documented, lawful criterion', () => {
    expect(screenDecisionReason('Income is 2.1x rent; our documented minimum is 3x.').ok).toBe(true);
    expect(screenDecisionReason('Prior landlord confirmed a balance left owing at move-out.').ok).toBe(true);
  });

  it('refuses an EMPTY reason — every applicant gets the same criteria, on the record', () => {
    const r = screenDecisionReason('no');
    expect(r.ok).toBe(false);
    expect(r.refused).toBe(false);
    expect(r.message).toMatch(/Name the criterion/);
  });

  it('the protected-class list covers the Act\'s seven classes', () => {
    const joined = PROTECTED_CLASS_TERMS.join(' ');
    for (const t of ['race', 'color', 'religion', 'sex', 'familial status', 'national origin', 'disability']) {
      expect(joined).toContain(t);
    }
  });
});
