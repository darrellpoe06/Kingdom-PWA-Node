// Proven-to-catch: the family allowlist must AGREE across both layers, or a
// family member is "in but not really" (the exact failure Darrell named). A
// person is truly family only when BOTH:
//   1. the active join_default_instance() migration joins their email to the
//      shared 'poe-family' instance (server-side / RLS — the real data gate), AND
//   2. the shell's isFamilyEmail() recognizes them client-side (so the public
//      host shows them the family world, not EMPTY_WORLD).
// If a future migration re-replaces the RPC and drops an email, or the shell
// constant drifts, this test fails the build. Anchored on Darrell Jr (added
// 2026-07-05, migration 0080) so the two layers can't silently disagree on him.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFamilyEmail } from '../poe-financial-mvp-v28.jsx';

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'infra', 'supabase', 'migrations-auto');

// The active definition = the alphabetically-last migration that (re)defines the
// RPC — the same selection the tenancy guard uses.
function activeProvisioningSql() {
  const defining = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => /CREATE OR REPLACE FUNCTION\s+public\.join_default_instance/i.test(readFileSync(join(MIGRATIONS, f), 'utf8')))
    .sort();
  return readFileSync(join(MIGRATIONS, defining[defining.length - 1]), 'utf8');
}

const FAMILY_EMAILS = [
  'darrellpoe06@gmail.com',
  'mrspoe06@gmail.com',
  'christina@tlctherapysolutions.com',
  'darrellpoejr@gmail.com',
];

describe('family allowlist — SQL and shell agree (no "in but not really")', () => {
  const sql = activeProvisioningSql();

  it('the active provisioning migration joins every family email to poe-family', () => {
    for (const email of FAMILY_EMAILS) {
      expect(sql.includes(email), `active join_default_instance migration missing: ${email}`).toBe(true);
    }
    // (The allowlist-gate ordering — emails BEFORE the poe-family grant — is
    // enforced on comment-stripped SQL by scripts/tenancy-guard.mjs.)
  });

  it('the shell recognizes every family email as family', () => {
    for (const email of FAMILY_EMAILS) {
      expect(isFamilyEmail(email), `isFamilyEmail false for ${email}`).toBe(true);
    }
  });

  it('Darrell Jr is in BOTH layers (added 2026-07-05)', () => {
    expect(sql.includes('darrellpoejr@gmail.com')).toBe(true);
    expect(isFamilyEmail('darrellpoejr@gmail.com')).toBe(true);
  });
});
