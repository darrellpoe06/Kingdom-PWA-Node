// @vitest-environment node
//
// ONE-CRM guard — proven-to-catch (DR-0081 / principle ONE-CRM, DR-0076).
// Pins the binding rule: ONE shared sovereign CRM backbone; every funnel +
// business rides it via config, never a per-business fork. This test is the CI
// enforcement — it proves the guard CATCHES a forked CRM table and PASSES on the
// real tree, so a second CRM cannot land green.
import { describe, it, expect } from 'vitest';
import {
  scan, forkViolations, looksLikeCrmTable, tablesInSql,
  BACKBONE_TABLES, ALLOWLIST,
} from '../../../scripts/crm-single-engine-guard.mjs';

describe('the real repo holds the ONE-CRM invariant', () => {
  const result = scan();

  it('scans real migrations — not vacuously empty', () => {
    expect(result.tables.length).toBeGreaterThan(10);
  });
  it('has NO forked CRM/leads table', () => {
    expect(result.violations, result.violations.join(', ')).toEqual([]);
  });
  it('the shared engine (PIPELINES/BUSINESSES) is present', () => {
    expect(result.enginePresent).toBe(true);
  });
  it('the crm_capture_lead() API seam is present', () => {
    expect(result.capturePresent).toBe(true);
  });
  it('the backbone tables exist', () => {
    expect(result.backbonePresent).toBe(true);
  });
});

describe('the guard CATCHES a fork (proven-to-catch)', () => {
  it('flags a brand-new leads table as a fork', () => {
    expect(forkViolations(['accounts', 'marketing_leads'])).toEqual(['marketing_leads']);
  });
  it('flags a parallel crm_* table', () => {
    expect(forkViolations(['crm2_contacts', 'gtm_pipeline'])).toEqual(['crm2_contacts', 'gtm_pipeline']);
  });
  it('does NOT flag the sanctioned backbone tables', () => {
    expect(forkViolations(BACKBONE_TABLES)).toEqual([]);
  });
  it('does NOT flag allowlisted grandfathered/non-CRM tables', () => {
    expect(forkViolations(Object.keys(ALLOWLIST))).toEqual([]);
  });
  it('every allowlist entry carries a reason (no silent exception)', () => {
    for (const reason of Object.values(ALLOWLIST)) expect(reason.length).toBeGreaterThan(10);
  });
});

describe('the CRM-table pattern is broad but precise', () => {
  it('matches CRM/lead/pipeline/funnel/prospect names', () => {
    ['crm_x', 'x_leads', 'leads', 'pipeline_x', 'x_funnel', 'prospects'].forEach((n) =>
      expect(looksLikeCrmTable(n)).toBe(true));
  });
  it('does not match unrelated tables', () => {
    ['accounts', 'inquiries_log', 'choir_songs', 'projects'].forEach((n) =>
      expect(looksLikeCrmTable(n)).toBe(false));
  });
  it('extracts table names from CREATE TABLE SQL (incl. IF NOT EXISTS)', () => {
    expect(tablesInSql('CREATE TABLE IF NOT EXISTS crm_leads (...); create table foo_leads (...)'))
      .toEqual(['crm_leads', 'foo_leads']);
  });
});
