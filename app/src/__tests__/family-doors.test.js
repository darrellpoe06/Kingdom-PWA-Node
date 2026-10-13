// =============================================================================
// Family doors — instant in-app access keeps its guardrails (migration 0142)
// =============================================================================
// Darrell 2026-08-21: "I should be able to give access instantly to her or
// anyone.... especially my family." The power is real, so the gates must be
// provable: only a family admin may call, only family/shared-space accounts
// may be targeted, PUBLIC execute is revoked, and the password never appears
// in any log or return. Each rule here fails the build if it drifts.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0142-admin-sets-family-doors.sql');
const sql = readFileSync(MIG, 'utf8');
const code = sql.replace(/--.*$/gm, '');

describe('0142 — admin_set_family_password keeps its gates', () => {
  it('caller gate: only the family admin trio may execute', () => {
    expect(code).toMatch(/v_caller_email NOT IN \('darrellpoe06@gmail\.com', 'mrspoe06@gmail\.com', '15636502416@phone\.poetech\.us'\)/);
    expect(code).toMatch(/RAISE EXCEPTION 'Only a family admin can set a door\.'/);
  });

  it('target gate: family allowlist OR an instance shared with the caller — never a stranger', () => {
    expect(code).toMatch(/christina@tlctherapysolutions\.com/);
    expect(code).toMatch(/darrellpoejr@gmail\.com/);
    expect(code).toMatch(/JOIN instance_members b ON a\.instance_id = b\.instance_id/);
    expect(code).toMatch(/RAISE EXCEPTION 'That account is not in any of your spaces\.'/);
  });

  it('the hash path is bcrypt via pgcrypto — the same path GoTrue verifies', () => {
    expect(code).toMatch(/crypt\(new_password, gen_salt\('bf'\)\)/);
    expect(code).toMatch(/email_confirmed_at = coalesce\(email_confirmed_at, now\(\)\)/);
  });

  it('PUBLIC execute is revoked; only authenticated may call', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.admin_set_family_password\(text, text\) FROM PUBLIC/);
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.admin_set_family_password\(text, text\) TO authenticated/);
  });

  it('the password value is never RAISEd, NOTICEd, or returned', () => {
    // The only permitted uses of new_password: the length check and the crypt
    // call. A RAISE/RETURN carrying it would leak into logs (proven-to-catch).
    const uses = code.match(/new_password/g) || [];
    expect(uses.length).toBe(3); // signature, length check, crypt — nothing more
    expect(code).not.toMatch(/RAISE[^;]*new_password/);
    expect(code).not.toMatch(/RETURN[^;]*new_password/);
  });

  it('minimum password length is enforced in the database, not only the client', () => {
    expect(code).toMatch(/length\(coalesce\(new_password, ''\)\) < 8/);
  });
});

describe('family-doors client — generatePassword and the RPC wrapper', () => {
  beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });

  it('generates a 12-character password from the unambiguous alphabet', async () => {
    const { generatePassword } = await import('../lib/family-doors.js');
    const p = generatePassword();
    expect(p).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{12}$/);
    expect(generatePassword()).not.toBe(p);
  });

  it('refuses to mint without a real crypto source (no fake safety)', async () => {
    vi.stubGlobal('crypto', undefined);
    const { generatePassword } = await import('../lib/family-doors.js');
    expect(() => generatePassword()).toThrow(/cannot generate a safe password/i);
  });

  it('rejects a short password and an empty email before ever calling the database', async () => {
    const { setFamilyPassword } = await import('../lib/family-doors.js');
    expect((await setFamilyPassword('', 'longenough123')).ok).toBe(false);
    expect((await setFamilyPassword('mrspoe06@gmail.com', 'short')).ok).toBe(false);
  });
});

describe('the Admin surface carries the door', () => {
  it('AdminConsole mounts FamilyDoors as its own section', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'AdminConsole.jsx'), 'utf8');
    expect(src).toMatch(/import FamilyDoors from '\.\/FamilyDoors\.jsx'/);
    expect(src).toMatch(/id: 'doors'/);
    expect(src).toMatch(/label: 'Family doors'/);
  });

  it('the magic-link sent screen names the doors that work without email (DR-0100)', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'PasswordAuth.jsx'), 'utf8');
    expect(src).toMatch(/No email after a couple of minutes\?/);
    expect(src).toMatch(/Prefer a password\? Use one/);
  });
});
