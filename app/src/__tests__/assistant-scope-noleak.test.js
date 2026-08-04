// Assistant scope — a granted assistant reaches the shared office workspace
// (the Assistant tab's real data) and NOTHING else (Christina 2026-08-04: "I
// don't want them to be able to see everything [on] all of the other tabs").
// The proof is structural + deterministic, the repo's accepted RLS standard
// (same shape as assistant-wall-noleak): the guard reads migration 0130 and
// proves the RESTRICTIVE assistant deny-overlay + the office_records role gate
// + the never-owner invite clamps. Run inside the required `app — lint +
// vitest` check so it gates every merge. DR-0271; DR-0076 (prove it) +
// DR-0074 (a client gate is not a data gate) + DR-0060 (proven-to-catch).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanAssistantScope, scanFutureMigrations, ASSISTANT_ALLOWED_TABLES } from '../../../scripts/assistant-scope-guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(here, '../../../infra/supabase/migrations-auto/0130-assistant-provisioning-and-office-workspace.sql');
const realSql = () => readFileSync(MIGRATION, 'utf8');

describe('assistant scope — the overlay + office workspace gate (migration 0130)', () => {
  it('PASSES on the real migration 0130 as shipped', () => {
    const { ok, problems } = scanAssistantScope();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('every later migration that creates an instance-scoped table re-runs the assistant overlay', () => {
    const { ok, problems } = scanFutureMigrations();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('the allowlist is exactly the office workspace + the six participation tables', () => {
    expect(ASSISTANT_ALLOWED_TABLES).toEqual([
      'office_records',
      'direct_messages',
      'group_messages',
      'family_messages',
      'feedback',
      'usage_events',
      'user_instance_settings',
    ]);
  });

  // --- Proven-to-catch (DR-0060): the guard must FAIL the real leak shapes. ---

  it('CATCHES a hollowed overlay (RESTRICTIVE dropped — the deny would stop denying)', () => {
    const leak = realSql().replaceAll('AS RESTRICTIVE ', '');
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/not RESTRICTIVE/i);
  });

  it("CATCHES an overlay that stops denying 'assistant'", () => {
    const leak = realSql().replaceAll("IS DISTINCT FROM ''assistant''", "IS DISTINCT FROM ''nobody''");
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/does not deny role 'assistant'/i);
  });

  it('CATCHES a table smuggled into the allowlist (a silent widening of assistant reach)', () => {
    const leak = realSql().replace("'office_records',         -- the granted workspace", "'office_records', 'transactions',");
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/unreviewed table/i);
  });

  it('CATCHES the overlay being defined but never RUN', () => {
    const leak = realSql().replaceAll('SELECT public.apply_assistant_scope_overlay();', '');
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/never runs apply_assistant_scope_overlay/i);
  });

  it('CATCHES membership-only gating on office_records (the 0082 child-gap class)', () => {
    const leak = realSql().replaceAll(
      "user_role_in_instance(instance_id) IN ('owner','admin','member','assistant')",
      'user_in_instance(instance_id)'
    );
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/office_records/i);
  });

  it("CATCHES an invite clamp widened to mint 'owner'", () => {
    const leak = realSql().replaceAll(
      "NOT IN ('admin','member','viewer','assistant')",
      "NOT IN ('owner','admin','member','viewer','assistant')"
    );
    const { ok, problems } = scanAssistantScope(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/never owner/i);
  });
});
