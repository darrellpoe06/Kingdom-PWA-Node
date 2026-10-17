// @vitest-environment node
// =============================================================================
// An overlay leaves a correct policy alone (DR-1090; migration 0301).
//
// The rls-isolation poe-properties leg ran out of lock slots because both
// overlays dropped and re-created every policy on every instance-scoped table
// on every call. 0301 compares first. These tests pin, statically, that the
// redefinition is still the same wall (the live proof is the 0301 smoke):
// RESTRICTIVE, every verb, the exact allowlists, and a compare before every
// DROP. PROVEN-TO-CATCH: each mutation below is a hollowing the guard names.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanOverlayRedefinitions } from '../../../scripts/assistant-scope-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FILE = '0301-an-overlay-leaves-a-correct-policy-alone.sql';
const real = readFileSync(join(ROOT, 'infra/supabase/migrations-auto', FILE), 'utf8');
const scanWith = (sql) => {
  const dir = mkdtempSync(join(tmpdir(), 'overlay-'));
  writeFileSync(join(dir, FILE), sql);
  return scanOverlayRedefinitions(dir);
};

describe('0301 keeps the assistant wall exactly as 0130 built it', () => {
  it('the real redefinition passes', () => {
    expect(scanWith(real)).toEqual({ ok: true, problems: [] });
    expect(scanOverlayRedefinitions().ok).toBe(true);
  });
  it('CATCHES a widened allowlist', () => {
    const r = scanWith(real.replace("'office_records',", "'office_records', 'legal_documents',"));
    expect(r.problems.join(' ')).toMatch(/widens the assistant allowlist: legal_documents/);
  });
  it('CATCHES a dropped verb', () => {
    const r = scanWith(real.replaceAll('FOR DELETE', 'FOR SELECT'));
    expect(r.problems.join(' ')).toMatch(/without a FOR DELETE deny/);
  });
  it('CATCHES a permissive overlay', () => {
    const r = scanWith(real.replaceAll('AS RESTRICTIVE', 'AS PERMISSIVE'));
    expect(r.problems.join(' ')).toMatch(/without RESTRICTIVE/);
  });
});

describe('0301 compares before it rebuilds', () => {
  const body = (fn) => {
    const start = real.indexOf(`FUNCTION public.${fn}()`);
    return real.slice(start, real.indexOf('$$;', start) === -1 ? undefined : real.indexOf('\n$$', start + 10));
  };
  for (const fn of ['apply_assistant_scope_overlay', 'apply_viewer_readonly_overlay']) {
    it(`${fn}: every DROP of an overlay policy sits behind a compare`, () => {
      const b = body(fn);
      const drops = (b.match(/DROP POLICY IF EXISTS (assistant_scope|viewer_readonly)_\w+ ON public\.%I', r\.tbl/g) || []).length;
      const compares = (b.match(/IF NOT public\.overlay_policy_is\(r\.tbl,/g) || []).length;
      expect(drops).toBeGreaterThan(0);
      expect(compares).toBe(drops);
    });
  }
  it('the viewer overlay keeps all seven participation exceptions and the 0227 sweep', () => {
    const b = body('apply_viewer_readonly_overlay');
    for (const t of ['direct_messages', 'group_messages', 'family_messages', 'feedback', 'usage_events', 'user_instance_settings', 'push_subscriptions']) {
      expect(b).toContain(`'${t}'`);
    }
    expect(b).toMatch(/FOREACH p IN ARRAY participation LOOP/);
    expect(b).toMatch(/capability_area\(r\.tbl\)/);
  });
  it('every rls-isolation leg that re-applies an overlay definer ends on 0301', () => {
    const wf = readFileSync(join(ROOT, '.github/workflows/rls-isolation.yml'), 'utf8');
    const lines = wf.split('\n').filter((l) => /^\s*migrations: "/.test(l) && /\b(0125|0126|0130|0181|0190|0227)-/.test(l));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l.trim().endsWith(`${FILE}"`)).toBe(true);
  });
});
