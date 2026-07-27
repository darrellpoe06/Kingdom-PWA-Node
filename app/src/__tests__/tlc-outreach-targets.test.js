// =============================================================================
// tlc-outreach-targets — proven-to-catch tests (DR-0076) for Christina's
// community-outreach starter directory + the tlc-community-outreach pipeline.
// Pins: the directory matches the source lists (counts per category), slugs
// are unique + idempotency-safe (never seed-prefixed), every target adapts to
// a valid lead on the ONE-CRM backbone, consent starts FALSE (served, not
// surveilled — the first intro is human-sent), notes stay org-level (no PHI),
// and the crm_capture_lead RPC allowlist stays in sync with the engine.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TLC_OUTREACH_TARGETS, OUTREACH_COHORTS, OUTREACH_CATEGORIES,
  TLC_OUTREACH_PROVENANCE, targetsForCategory, targetsForCohort,
  categoriesForCohort, cohortOf, targetToLead, targetLeadId,
} from '../lib/tlc-outreach-targets.js';
import {
  PIPELINES, pipelinesForBusiness, getSequence, STAGE_META, stageGroup,
  canOutreach, nextFollowUp, isSeedLead, validateCapture, flagPotentialPhi,
} from '../lib/crm-engine.js';

const NOW = '2026-07-27T12:00:00.000Z';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('the directory matches the source lists (Zakaria via Christina)', () => {
  it('carries the exact per-category counts from the screenshots', () => {
    expect(targetsForCategory('schools')).toHaveLength(10);
    expect(targetsForCategory('youth-orgs')).toHaveLength(6);
    expect(targetsForCategory('dv-shelters')).toHaveLength(4);
    expect(targetsForCategory('hospitals')).toHaveLength(5);
    expect(targetsForCategory('nonprofits')).toHaveLength(6);
    expect(targetsForCategory('womens-health')).toHaveLength(7);
    expect(targetsForCategory('cancer-centers')).toHaveLength(10);
    expect(TLC_OUTREACH_TARGETS).toHaveLength(48);
  });

  it('splits into the two cohorts: 38 Champaign-Urbana + 10 Chicago-area', () => {
    expect(targetsForCohort('cu-community')).toHaveLength(38);
    expect(targetsForCohort('breast-cancer-centers')).toHaveLength(10);
    expect(categoriesForCohort('cu-community')).toHaveLength(6);
    expect(categoriesForCohort('breast-cancer-centers')).toHaveLength(1);
  });

  it('every target names a real category in a real cohort', () => {
    for (const t of TLC_OUTREACH_TARGETS) {
      expect(t.name, t.slug).toBeTruthy();
      expect(OUTREACH_CATEGORIES[t.category], `${t.slug} category`).toBeTruthy();
      expect(OUTREACH_COHORTS[cohortOf(t)], `${t.slug} cohort`).toBeTruthy();
    }
  });

  it('slugs are unique (idempotent re-import can never duplicate)', () => {
    const slugs = TLC_OUTREACH_TARGETS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every cancer center carries a person-to-reach and a phone, as provided', () => {
    for (const t of targetsForCategory('cancer-centers')) {
      expect(t.reach, t.slug).toBeTruthy();
      expect(t.phone, t.slug).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
    }
  });

  it('provenance is honest: contact info is marked unverified (DR-0076)', () => {
    expect(TLC_OUTREACH_PROVENANCE.contactInfoVerified).toBe(false);
    expect(TLC_OUTREACH_PROVENANCE.providedBy).toContain('Zakaria');
  });
});

describe('targetToLead — the ONE-CRM adapter (DR-0081)', () => {
  it('lands every target as a valid lead on tlc-community-outreach, stage new', () => {
    for (const t of TLC_OUTREACH_TARGETS) {
      const lead = targetToLead(t, { now: NOW });
      expect(lead.business).toBe('tlc');
      expect(lead.pipeline).toBe('tlc-community-outreach');
      expect(lead.stage).toBe('new');
      expect(lead.id).toBe(`tlc-target-${t.slug}`);
      expect(lead.source).toBe('community-list');
      expect(lead.name).toBe(t.name);
    }
  });

  it('directory targets are REAL, never seed — and never match the seed regex', () => {
    for (const t of TLC_OUTREACH_TARGETS) {
      const lead = targetToLead(t, { now: NOW });
      expect(lead.seed).toBe(false);
      expect(isSeedLead(lead), t.slug).toBe(false);
    }
  });

  it('consent starts FALSE: no outreach draft until a real opt-in is recorded', () => {
    const lead = targetToLead(TLC_OUTREACH_TARGETS[0], { now: NOW });
    expect(canOutreach(lead)).toBe(false);
    expect(nextFollowUp(lead, { now: NOW }).available).toBe(false);
    // ...and a recorded consent unlocks the community nurture sequence.
    const consented = { ...lead, consent: { outreachOk: true, channels: [], capturedAt: NOW, note: 'Org replied' } };
    const step = nextFollowUp(consented, { now: NOW });
    expect(step.available).toBe(true);
    expect(step.sequenceKey).toBe('tlc-community-nurture');
    expect(step.requiresHumanApproval).toBe(true);
  });

  it('contact preference: email when provided, else phone, else empty email', () => {
    const withEmail = targetToLead(TLC_OUTREACH_TARGETS.find((t) => t.email), { now: NOW });
    expect(withEmail.contactMethod).toBe('email');
    expect(withEmail.contactValue).toContain('@');
    const withPhone = targetToLead(TLC_OUTREACH_TARGETS.find((t) => t.phone && !t.email), { now: NOW });
    expect(withPhone.contactMethod).toBe('phone');
    const bare = targetToLead(TLC_OUTREACH_TARGETS.find((t) => !t.phone && !t.email), { now: NOW });
    expect(bare.contactMethod).toBe('email');
    expect(bare.contactValue).toBe('');
  });

  it('notes stay org-level — the PHI linter finds nothing in any target', () => {
    for (const t of TLC_OUTREACH_TARGETS) {
      const lead = targetToLead(t, { now: NOW });
      expect(flagPotentialPhi(`${lead.name} ${lead.notes}`), t.slug).toHaveLength(0);
    }
  });

  it('targetLeadId is stable and targetToLead(null) is safe', () => {
    expect(targetLeadId({ slug: 'x' })).toBe('tlc-target-x');
    expect(targetToLead(null)).toBe(null);
  });
});

describe('the tlc-community-outreach pipeline rides the one engine', () => {
  it('is registered under the TLC business with valid, ordered stages', () => {
    const p = PIPELINES['tlc-community-outreach'];
    expect(p).toBeTruthy();
    expect(p.business).toBe('tlc');
    expect(pipelinesForBusiness('tlc').map((x) => x.id)).toContain('tlc-community-outreach');
    for (const s of p.stages) expect(STAGE_META[s], s).toBeTruthy();
    expect(stageGroup('referring')).toBe('won');
    expect(getSequence('tlc-community-nurture').steps.length).toBeGreaterThan(1);
  });

  it('validateCapture forces the safe shape on this pipeline too', () => {
    const { ok, lead } = validateCapture('tlc-community-outreach', {
      name: 'Some Org', contactMethod: 'email', source: 'community-list',
      stage: 'referring',            // must be forced back to first stage
      diagnosis: 'smuggled clinical', // must be structurally stripped
    }, { now: NOW, id: 'cap-1' });
    expect(ok).toBe(true);
    expect(lead.stage).toBe('new');
    expect(lead.consent.outreachOk).toBe(false);
    expect(JSON.stringify(lead)).not.toContain('smuggled');
  });

  it('the crm_capture_lead RPC allowlist stays in sync (0120 carries the branch)', () => {
    const sql = readFileSync(join(ROOT, 'infra/supabase/migrations-auto/0120-tlc-community-outreach-pipeline.sql'), 'utf8');
    expect(sql).toMatch(/WHEN 'tlc-community-outreach'\s+THEN v_business := 'tlc';\s+v_stage := 'new'; v_seq := 'tlc-community-nurture';/);
    expect(sql).toMatch(/create or replace function public\.crm_capture_lead/i);
    expect(sql).not.toMatch(/create\s+table/i); // ONE-CRM: a pipeline, never a new table
  });
});
