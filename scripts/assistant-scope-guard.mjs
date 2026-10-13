// =============================================================================
// assistant-scope-guard — deterministic proof that the ASSISTANT role is scoped
// to the office workspace and nothing else (DR-0271; DR-0060/0074/0076).
// =============================================================================
// Christina 2026-08-04: the assistant sees "everything in the Assistant tab"
// and NOT "everything [on] all of the other tabs". Migration 0130 makes that
// structural: a RESTRICTIVE deny-overlay (apply_assistant_scope_overlay) blocks
// role 'assistant' on every instance-scoped table except office_records + the
// six self-scoped participation tables. This guard reads the migration SQL and
// PROVES the shape — so an edit that hollows the overlay, drops a participation
// exception, silently widens the allowlist, or lets an invite mint 'owner'
// FAILS the build instead of waiting for a leak to be noticed.
//
// It also enforces the FUTURE-TABLES discipline (the tenancy-guard Check E
// pattern): any migration sorting after 0130 that creates an instance-scoped
// table must re-run `SELECT public.apply_assistant_scope_overlay();` in the
// same file, or the new table would sit outside the assistant wall.
//
// Companion to scripts/assistant-wall-guard.mjs (the 0100 books wall — which
// this NEVER touches) and scripts/tenancy-guard.mjs. Deterministic, $0, no-LLM.
// Importable (scanAssistantScope, scanFutureMigrations) so a vitest test gates
// merges inside the required `app — lint + vitest` check.
//   CLI: node scripts/assistant-scope-guard.mjs
//
// NOTE: static proof of the policy SHAPE. The confirming adversarial LIVE RLS
// test (an assistant session reads office_records and 0 rows elsewhere) is the
// tests/0130-assistant-scope-smoke.sql leg.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'infra/supabase/migrations-auto');
const MIGRATION_FILE = '0130-assistant-provisioning-and-office-workspace.sql';
const MIGRATION = join(MIGRATIONS_DIR, MIGRATION_FILE);

// The assistant's whole reach: the office workspace + the same six self-scoped
// participation tables the viewer overlay excepts (0125). Anything added here
// is a deliberate, reviewed widening of what an assistant can touch.
export const ASSISTANT_ALLOWED_TABLES = [
  'office_records',
  'direct_messages',
  'group_messages',
  'family_messages',
  'feedback',
  'usage_events',
  'user_instance_settings',
];

// The roles allowed to work the office workspace. viewer/child/successor/
// specialist are excluded by omission — default deny.
const OFFICE_WORK_SET = "in ('owner','admin','member','assistant')";
const ROLE_GATE = 'user_role_in_instance(instance_id)';
const OVERLAY_CALL = 'select public.apply_assistant_scope_overlay();';

// Normalize SQL for structural matching: drop line comments, unescape the
// doubled single-quotes Postgres format() strings use ('' -> '), lowercase,
// collapse whitespace.
function normalize(sql) {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/''/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function scanAssistantScope(sqlOverride = null) {
  const problems = [];
  let sql = sqlOverride;
  if (sql == null) {
    if (!existsSync(MIGRATION)) return { ok: false, problems: [`migration not found: ${MIGRATION}`] };
    sql = readFileSync(MIGRATION, 'utf8');
  }
  const n = normalize(sql);

  // 1. The overlay exists, is RESTRICTIVE, denies 'assistant', and covers all
  //    four verbs — a hollowed overlay (always-true, or SELECT-only) fails.
  if (!n.includes('apply_assistant_scope_overlay')) {
    problems.push('apply_assistant_scope_overlay is missing');
  }
  if (!n.includes('as restrictive')) {
    problems.push('the assistant overlay policies are not RESTRICTIVE');
  }
  if (!n.includes("is distinct from 'assistant'")) {
    problems.push("the overlay does not deny role 'assistant'");
  }
  for (const verb of ['for select', 'for insert', 'for update', 'for delete']) {
    if (!n.includes(verb)) problems.push(`the overlay is missing a ${verb.toUpperCase()} deny`);
  }

  // 2. The allowlist is EXACTLY the reviewed set — every allowed table named,
  //    and no extra table smuggled into the overlay's ARRAY (a silent widening
  //    of the assistant's reach must be a visible guard edit).
  for (const t of ASSISTANT_ALLOWED_TABLES) {
    if (!n.includes(`'${t}'`)) problems.push(`participation/workspace exception '${t}' is missing from the overlay allowlist`);
  }
  const arrayMatch = n.match(/allowed\s+text\[\]\s*:=\s*array\s*\[([^\]]*)\]/);
  if (!arrayMatch) {
    problems.push("the overlay's allowlist ARRAY was not found");
  } else {
    const listed = (arrayMatch[1].match(/'[a-z0-9_]+'/g) || []).map((s) => s.slice(1, -1));
    const extras = listed.filter((t) => !ASSISTANT_ALLOWED_TABLES.includes(t));
    if (extras.length) problems.push(`unreviewed table(s) in the assistant allowlist: ${extras.join(', ')}`);
  }

  // 3. The overlay is actually RUN in the migration (defining it is not
  //    applying it), and the viewer overlay re-run Check E requires is present.
  if (!n.includes(OVERLAY_CALL)) {
    problems.push('the migration never runs apply_assistant_scope_overlay()');
  }
  if (!n.includes('select public.apply_viewer_readonly_overlay();')) {
    problems.push('the migration never re-runs apply_viewer_readonly_overlay() (Check E)');
  }

  // 4. office_records is role-gated to the working set on all four verbs —
  //    membership-only gating (the 0082-child-gap class) fails.
  if (!n.includes('office_records')) problems.push('office_records is missing');
  if (!n.includes(ROLE_GATE)) problems.push(`office_records policies are not role-gated — expected ${ROLE_GATE}`);
  const workPolicies = n.match(new RegExp(`${ROLE_GATE.replace(/[()]/g, '\\$&')} ${OFFICE_WORK_SET.replace(/[()]/g, '\\$&')}`, 'g')) || [];
  if (workPolicies.length < 4) {
    problems.push(`office_records must gate all four verbs to ${OFFICE_WORK_SET} (found ${workPolicies.length})`);
  }

  // 5. The invite + role paths may issue 'assistant' but still never 'owner':
  //    the clamps must be exactly the four grantable roles.
  const inviteClamp = "not in ('admin','member','viewer','assistant')";
  if (!n.includes(`if v_role ${inviteClamp} then v_role := 'member'`)) {
    problems.push(`invite_to_instance must clamp to admin/member/viewer/assistant (never owner)`);
  }
  if (!n.includes(`if v_role ${inviteClamp} then raise exception`)) {
    problems.push('set_member_role must reject anything outside admin/member/viewer/assistant (never owner)');
  }
  const invitesRoleList = n.match(/instance_invites_role_check\s+check\s*\(\s*role\s+in\s*\(([^)]*)\)/);
  if (!invitesRoleList || !invitesRoleList[1].includes("'assistant'")) {
    problems.push("the instance_invites role check does not carry 'assistant'");
  }

  return { ok: problems.length === 0, problems };
}

// Future-tables discipline: a migration after 0130 that creates an
// instance-scoped table must re-run the assistant overlay in the same file
// (mirrors tenancy-guard Check E for the viewer overlay). Scanned on a
// newline-PRESERVING normalize (comments stripped, lowercased) — the table-body
// regex anchors on the closing `)` line, exactly like Check E's.
const CREATE_TABLE_RE = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)\s*\(([\s\S]*?\n\s*\)\s*;)/g;

function normalizeKeepLines(sql) {
  return sql.replace(/--[^\n]*/g, ' ').toLowerCase();
}

export function scanFutureMigrations(dirOverride = null) {
  const dir = dirOverride || MIGRATIONS_DIR;
  const problems = [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql') && f > MIGRATION_FILE).sort();
  for (const f of files) {
    const raw = normalizeKeepLines(readFileSync(join(dir, f), 'utf8'));
    let m;
    let needsOverlay = false;
    CREATE_TABLE_RE.lastIndex = 0;
    while ((m = CREATE_TABLE_RE.exec(raw)) !== null) {
      if (/\binstance_id\b/.test(m[2])) { needsOverlay = true; break; }
    }
    if (needsOverlay && !normalize(raw).includes(OVERLAY_CALL)) {
      problems.push(`${f} creates an instance-scoped table without re-running apply_assistant_scope_overlay()`);
    }
  }
  return { ok: problems.length === 0, problems };
}

// --- CLI ---------------------------------------------------------------------
function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
if (isMain()) {
  const scope = scanAssistantScope();
  const future = scanFutureMigrations();
  const ok = scope.ok && future.ok;
  console.log('# ASSISTANT SCOPE GUARD (an assistant reaches the office workspace and nothing else)\n');
  if (ok) {
    console.log('PASS — the assistant scope overlay + office workspace policies are intact.');
    process.exit(0);
  }
  console.log('FAIL — the assistant scope is not intact:');
  [...scope.problems, ...future.problems].forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
