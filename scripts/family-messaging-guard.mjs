// =============================================================================
// family-messaging-guard — deterministic no-leak gate for family messaging (0057)
// =============================================================================
// Family messaging is the same isolation machinery turned INWARD: a child's
// message must be private from a SIBLING, visible to a GUARDIAN (oversight), and
// invisible to any OTHER instance / anon. Those are RLS properties the generic
// tenancy guard (RLS-enabled only) cannot see. This guard reads migration 0057
// and FAILS the build if the family_messages policies don't encode them.
//
// The dangerous regression this catches: a SELECT policy of `USING (true)` or
// `USING (user_in_instance(instance_id))` ALONE — either would let every family
// member (including a sibling) read every message in the instance, breaking
// sibling privacy. The real policy must additionally require the reader to be a
// PARTICIPANT (sender/recipient) or a GUARDIAN (owner/admin).
//
// Anti-theater (DR-0060): shipped only with a proven catch — pass a broken policy
// string and it FAILS; pass the real one and it PASSES. Deterministic, $0, no-LLM.
// Importable (scanFamilyMessaging) so a vitest gates merges from the required
// `app — lint + vitest` check. CLI: node scripts/family-messaging-guard.mjs
// =============================================================================
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'infra/supabase/migrations-auto');
const stripComments = (s) => s.replace(/--[^\n]*/g, '');

function loadMigrationSql() {
  if (!existsSync(MIGRATIONS_DIR)) return '';
  const f = readdirSync(MIGRATIONS_DIR).find((n) => /family-messaging/i.test(n) && n.endsWith('.sql'));
  return f ? readFileSync(join(MIGRATIONS_DIR, f), 'utf8') : '';
}

// Extract one statement: CREATE POLICY <name> ... ; (up to the terminating ;)
function policyBody(sql, name) {
  const re = new RegExp(`CREATE\\s+POLICY\\s+${name}\\b([\\s\\S]*?);`, 'i');
  const m = sql.match(re);
  return m ? m[1] : null;
}

export function scanFamilyMessaging(sqlOverride = null) {
  const sql = stripComments(sqlOverride != null ? sqlOverride : loadMigrationSql());
  const problems = [];

  if (!sql.trim()) {
    return { ok: false, problems: ['family-messaging migration not found / empty — guard is stale, re-anchor it'] };
  }

  // RLS must be enabled on family_messages.
  if (!/ALTER\s+TABLE\s+family_messages\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql)) {
    problems.push('family_messages: ROW LEVEL SECURITY not enabled');
  }

  // No anon grant anywhere in the migration (family-internal only).
  if (/\bTO\s+anon\b/i.test(sql)) {
    problems.push('an anon GRANT/policy exists — family messaging must be family-internal only');
  }

  // SELECT policy: must scope to PARTICIPANT or GUARDIAN, never instance-only.
  const read = policyBody(sql, 'family_messages_read');
  if (!read) {
    problems.push('family_messages_read SELECT policy not found');
  } else {
    const has = (re) => re.test(read);
    if (!has(/recipient_user_id\s*=\s*auth\.uid\(\)/i)) {
      problems.push('family_messages_read does not key on recipient_user_id = auth.uid() — sibling privacy is NOT enforced');
    }
    if (!has(/sender_user_id\s*=\s*auth\.uid\(\)/i)) {
      problems.push('family_messages_read does not let the sender read their own message');
    }
    if (!has(/user_role_in_instance\([^)]*\)\s*IN\s*\(\s*'owner'\s*,\s*'admin'\s*\)/i)) {
      problems.push('family_messages_read does not grant guardian (owner/admin) oversight');
    }
    if (!has(/user_in_instance/i)) {
      problems.push('family_messages_read is not scoped to the instance (cross-instance read risk)');
    }
    // Sibling-leak smell: an instance-only read with NO participant/guardian
    // predicate. If user_in_instance appears but NONE of the participant/guardian
    // predicates do, every family member can read every message.
    const participantScoped =
      has(/recipient_user_id\s*=\s*auth\.uid\(\)/i) ||
      has(/sender_user_id\s*=\s*auth\.uid\(\)/i) ||
      has(/user_role_in_instance/i);
    if (!participantScoped) {
      problems.push('family_messages_read is instance-only (no participant/guardian predicate) — siblings can read each other');
    }
  }

  // INSERT policy: sender must be sending AS themselves.
  const ins = policyBody(sql, 'family_messages_insert');
  if (!ins) {
    problems.push('family_messages_insert policy not found');
  } else if (!/sender_user_id\s*=\s*auth\.uid\(\)/i.test(ins)) {
    problems.push('family_messages_insert does not pin sender_user_id = auth.uid() (spoofable sender)');
  }

  return { ok: problems.length === 0, problems };
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
if (isMain()) {
  const { ok, problems } = scanFamilyMessaging();
  console.log('# FAMILY-MESSAGING GUARD (sibling privacy + no external leak)\n');
  if (ok) {
    console.log('PASS — family_messages is participant/guardian-scoped, instance-bound, no anon.');
  } else {
    console.log('FAIL — family messaging can leak:');
    problems.forEach((p) => console.log(`  - ${p}`));
  }
  process.exit(ok ? 0 : 1);
}
