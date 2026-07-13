// =============================================================================
// assistant-wall-guard — deterministic proof that the ASSISTANT role is walled
// out of the core books (DR-0060/0074/0076: prove it, don't claim it).
// =============================================================================
// The hard guarantee (Darrell 2026-07-13): a 1099 assistant "never [sees] our
// personal data, business data etc." An assistant operates only the scoped work
// surfaces the owner checked on; the core financial books stay walled. That wall
// is RLS in migration 0100. This guard reads the migration SQL and PROVES,
// structurally, that the assistant is excluded from the books' read AND write
// policies — so a policy that stops excluding 'assistant' FAILS the build instead
// of waiting for a session (or a leak) to notice.
//
// Companion to scripts/tenancy-guard.mjs (RLS enabled) + conference-rls-guard.mjs
// (policies don't cross instances); this proves the ROLE wall. Deterministic, $0,
// no-LLM. Importable (scanAssistantWall) so a vitest test gates merges from inside
// the required `app — lint + vitest` check. Proven-to-catch: the test injects a
// books read policy that forgets 'assistant' and confirms a FAIL.
//   CLI: node scripts/assistant-wall-guard.mjs
//
// NOTE: static proof of the policy SHAPE. The confirming adversarial LIVE RLS test
// (an assistant's own session reads 0 books rows) runs against the real instance
// after deploy — the DR-0111 re-review item 0100 is the fix for.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = join(ROOT, 'infra/supabase/migrations-auto/0100-assistant-role-and-books-rls.sql');

// The core personal + business FINANCIAL books the assistant must never reach.
export const BOOKS_TABLES = ['entities', 'accounts', 'transactions', 'debts', 'projects'];

// The exact role-gated exclusion lists the wall requires (order-sensitive on
// purpose — this pins the intended form; changing it is a deliberate guard edit).
const READ_WALL = "not in ('child','assistant')";
const WRITE_WALL = "not in ('child','successor','assistant')";
const ROLE_GATE = 'user_role_in_instance(instance_id)';

// Normalize SQL for structural matching: drop line comments, unescape the doubled
// single-quotes Postgres format() strings use ('' -> '), lowercase, collapse ws.
function normalize(sql) {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/''/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function scanAssistantWall(sqlOverride = null) {
  const problems = [];
  let sql = sqlOverride;
  if (sql == null) {
    if (!existsSync(MIGRATION)) return { ok: false, problems: [`migration not found: ${MIGRATION}`] };
    sql = readFileSync(MIGRATION, 'utf8');
  }
  const n = normalize(sql);

  // 1. The 'assistant' role must exist in the membership role check — read the
  //    enum list that immediately follows the constraint, not just any later
  //    'assistant' token (the books policies mention it too).
  const roleList = n.match(/instance_members_role_check\s+check\s*\(\s*role\s+in\s*\(([^)]*)\)/);
  if (!roleList || !roleList[1].includes("'assistant'")) {
    problems.push("the 'assistant' role is not added to the instance_members role check");
  }

  // 2. Non-vacuous: the wall must actually name the core books tables (quoted in
  //    the DO-loop ARRAY, or as a policy target — match the name as a whole word).
  const missingTables = BOOKS_TABLES.filter((t) => !new RegExp(`\\b${t}\\b`).test(n));
  if (missingTables.length) problems.push(`books tables not named in the wall: ${missingTables.join(', ')}`);

  // 3. The policies must be ROLE-gated (not membership-only — that was the 0082
  //    gap for child; membership alone would let the assistant, a member, in).
  if (!n.includes(ROLE_GATE)) {
    problems.push(`the books policies are not role-gated — expected ${ROLE_GATE}`);
  }

  // 4. READ wall — a SELECT policy that excludes the assistant.
  if (!n.includes('for select')) problems.push('no SELECT (read) policy found on the books');
  else if (!n.includes(READ_WALL)) {
    problems.push(`the books READ policy does not wall out the assistant — expected: ${ROLE_GATE} ${READ_WALL}`);
  }

  // 5. WRITE wall — INSERT + UPDATE policies that exclude the assistant.
  if (!n.includes('for insert')) problems.push('no INSERT policy found on the books');
  if (!n.includes('for update')) problems.push('no UPDATE policy found on the books');
  if (!n.includes(WRITE_WALL)) {
    problems.push(`the books WRITE policies do not wall out the assistant — expected: ${ROLE_GATE} ${WRITE_WALL}`);
  }

  return { ok: problems.length === 0, problems };
}

// --- CLI ---------------------------------------------------------------------
function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
if (isMain()) {
  const { ok, problems } = scanAssistantWall();
  console.log('# ASSISTANT WALL GUARD (an assistant cannot read/write the core books)\n');
  if (ok) {
    console.log('PASS — the assistant role is walled out of the books (read + write).');
    process.exit(0);
  }
  console.log('FAIL — the assistant wall is not intact:');
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
