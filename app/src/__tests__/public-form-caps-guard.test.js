// =============================================================================
// 0033 public-form caps — server-side enforcement gate (DR-0076 / DR-0060)
// =============================================================================
// The client cleaner (lib/sanitize-input) is bypassable — an attacker POSTs straight
// to PostgREST with the bundled anon key. The ENFORCEABLE cap is the DB CHECK
// constraint in migration 0033. This gate proves (a) every public-form field has its
// length / range CHECK in the real migration, and (b) the numeric caps AGREE with
// FIELD_CAPS, so the client and the database can never silently drift apart. Per
// DR-0060 it is proven-to-catch: a synthetic migration missing a constraint, or
// carrying a wrong cap, FAILS the checker.
//
// The checker parses each named constraint individually (table+column precise), so a
// drift in ONE table's cap is never masked by another table sharing the same cap.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_CAPS } from '../lib/sanitize-input.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const MIGRATION = join(ROOT, 'infra/supabase/migrations-auto/0033-public-form-input-hardening.sql');

// constraint name -> expected numeric bound (sourced from FIELD_CAPS so this gate
// fails if FIELD_CAPS changes without the migration following). party_range is a
// fixed 1..99 range, not a length cap.
const EXPECT = {
  conf_pub_reg_name_len: FIELD_CAPS.name,
  conf_pub_reg_email_len: FIELD_CAPS.email,
  conf_pub_reg_phone_len: FIELD_CAPS.phone,
  conf_pub_reg_dietary_len: FIELD_CAPS.dietary,
  conf_pub_reg_days_len: FIELD_CAPS.days,
  conf_pub_reg_confname_len: FIELD_CAPS.conferenceName,
  conf_pub_reg_source_len: FIELD_CAPS.source,
  conf_pub_reg_party_range: 99,
  app_interest_name_len: FIELD_CAPS.name,
  app_interest_email_len: FIELD_CAPS.email,
  app_interest_phone_len: FIELD_CAPS.phone,
  app_interest_issue_len: FIELD_CAPS.issue,
  app_interest_platform_len: FIELD_CAPS.platform,
  app_interest_ua_len: FIELD_CAPS.userAgent,
  app_interest_referrer_len: FIELD_CAPS.referrer,
  app_interest_source_len: FIELD_CAPS.source,
  app_interest_signed_in_email_len: FIELD_CAPS.signedInEmail,
};

// Parse `ADD CONSTRAINT <name> CHECK (<body>) NOT VALID` into { name: body }.
function parseConstraints(sql) {
  const clean = sql.replace(/--[^\n]*/g, '');
  const out = {};
  const re = /ADD\s+CONSTRAINT\s+(\w+)\s+CHECK\s*\(([\s\S]*?)\)\s*NOT VALID/gi;
  let m;
  while ((m = re.exec(clean)) !== null) out[m[1]] = m[2];
  return out;
}

// Pure checker: returns { ok, problems }.
export function checkCapsMigration(sql) {
  const bodies = parseConstraints(sql);
  const problems = [];
  for (const [name, cap] of Object.entries(EXPECT)) {
    const body = bodies[name];
    if (!body) { problems.push(`missing constraint ${name}`); continue; }
    const le = new RegExp(`<=\\s*${cap}\\b`);
    const between = new RegExp(`BETWEEN\\s+1\\s+AND\\s+${cap}\\b`, 'i');
    if (!le.test(body) && !between.test(body)) problems.push(`${name} must bound at ${cap} (found: ${body.trim()})`);
  }
  return { ok: problems.length === 0, problems };
}

describe('0033 migration — server-side caps exist and agree with FIELD_CAPS', () => {
  it('the migration file exists', () => {
    expect(existsSync(MIGRATION), `missing ${MIGRATION}`).toBe(true);
  });

  it('PASSES the real migration (every field capped, caps match FIELD_CAPS)', () => {
    const { ok, problems } = checkCapsMigration(readFileSync(MIGRATION, 'utf8'));
    expect(ok, problems.join('; ')).toBe(true);
  });

  // --- proven-to-catch (DR-0060) ---------------------------------------------
  it('CATCHES a missing field constraint', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
      .replace(/char_length\(dietary\) <= 500/i, 'true /* removed */');
    const { ok, problems } = checkCapsMigration(sql);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/conf_pub_reg_dietary_len/i);
  });

  it('CATCHES a cap that disagrees with FIELD_CAPS (drift in ONE table only)', () => {
    // Conference name cap drifts to 999 while app_interest name stays 120: a precise
    // gate must still catch the conference drift (not mask it via app_interest).
    const sql = readFileSync(MIGRATION, 'utf8').replace(/BETWEEN 1 AND 120/i, 'BETWEEN 1 AND 999');
    const { ok, problems } = checkCapsMigration(sql);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/conf_pub_reg_name_len/i);
  });

  it('CATCHES a missing party_size range', () => {
    const sql = readFileSync(MIGRATION, 'utf8').replace(/party_size BETWEEN 1 AND 99/i, 'party_size IS NOT NULL');
    const { ok, problems } = checkCapsMigration(sql);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/conf_pub_reg_party_range/i);
  });
});
