// @vitest-environment node
// =============================================================================
// viewer-overlay-lineage — a redefinition of apply_viewer_readonly_overlay()
// must carry EVERY earlier exception (post-incident, DR-0347)
// =============================================================================
// 2026-09-10: 0181 redefined the overlay from 0125's text to add one
// participation table and silently dropped 0126's capability predicate; the
// DR-0242 checklist was dead in production for four days and only the
// rls-isolation smoke said so. Check E asked a redefinition to keep RESTRICTIVE
// + 'viewer'; it never asked it to keep what came before. This gate does:
// walking every migration that redefines the function, in order, the
// participation list must be a superset of every earlier list, and once the
// capability predicate (has_capability + capability_area) appears it must
// never disappear. Proven-to-catch against 0181's own body.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const MIG = join(here, '../../../infra/supabase/migrations-auto');

export function overlayBody(sql) {
  const i = sql.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.apply_viewer_readonly_overlay\s*\(\s*\)/i);
  if (i < 0) return null;
  const rest = sql.slice(i);
  // the body ends at the first "$$;" that closes the function
  const parts = rest.split('$$');
  return parts.length >= 3 ? parts[1] : rest;
}
export function participationOf(body) {
  const m = body.match(/participation\s+text\[\]\s*:=\s*ARRAY\s*\[([\s\S]*?)\]/i);
  if (!m) return [];
  return Array.from(m[1].matchAll(/'([a-z_]+)'/g)).map((x) => x[1]);
}
export function hasCapabilityPredicate(body) {
  return /has_capability\s*\(/.test(body) && /capability_area\s*\(/.test(body);
}
// The lineage check over ordered [{ name, body }]. History is append-only, so
// an earlier drop cannot be rewritten; what must hold is that the LAST
// definition — the one production runs — carries every participation table
// any earlier definition carried, and the capability predicate once any
// earlier definition taught it. Returns the problems with the last definition.
export function lineageProblems(defs) {
  if (!defs.length) return ['no definition of apply_viewer_readonly_overlay found'];
  const last = defs[defs.length - 1];
  const problems = [];
  const union = new Set();
  let capabilityEver = false;
  for (const d of defs.slice(0, -1)) { for (const t of participationOf(d.body)) union.add(t); capabilityEver = capabilityEver || hasCapabilityPredicate(d.body); }
  const list = participationOf(last.body);
  for (const t of union) if (!list.includes(t)) problems.push(`${last.name} drops participation table "${t}" that an earlier definition carried`);
  if (capabilityEver && !hasCapabilityPredicate(last.body)) problems.push(`${last.name} drops the capability predicate (has_capability / capability_area) that an earlier definition carried`);
  if (!/AS\s+RESTRICTIVE/i.test(last.body) || !/'viewer'/.test(last.body)) problems.push(`${last.name} is not a RESTRICTIVE viewer overlay`);
  return problems;
}

function realLineage() {
  const files = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort();
  const defs = [];
  for (const f of files) {
    const sql = readFileSync(join(MIG, f), 'utf8');
    if (!/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.apply_viewer_readonly_overlay/i.test(sql)) continue;
    defs.push({ name: f, body: overlayBody(sql) });
  }
  return defs;
}

describe('viewer-overlay lineage (DR-0347)', () => {
  it('every redefinition carries every earlier participation table and, once taught, the capability predicate; the LAST definition is the whole truth', () => {
    const defs = realLineage();
    expect(defs.map((d) => d.name.slice(0, 4))).toEqual(['0125', '0126', '0181', '0190']);
    expect(lineageProblems(defs)).toEqual([]);
    const last = defs[defs.length - 1];
    expect(hasCapabilityPredicate(last.body)).toBe(true);
    expect(participationOf(last.body)).toEqual(['direct_messages', 'group_messages', 'family_messages', 'feedback', 'usage_events', 'user_instance_settings', 'push_subscriptions']);
  });
  it('PROVEN-TO-CATCH: with 0190 removed, 0181’s own redefinition is the drop this gate exists to name', () => {
    const defs = realLineage().filter((d) => !d.name.startsWith('0190'));
    const problems = lineageProblems(defs);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^0181-.*drops the capability predicate/);
  });
  it('PROVEN-TO-CATCH: a redefinition that forgets a participation table is named', () => {
    const defs = realLineage();
    const bad = { name: '0999-bad.sql', body: defs[defs.length - 1].body.replace("'push_subscriptions'", "'nothing_here'") };
    const problems = lineageProblems([...defs, bad]);
    expect(problems).toEqual(['0999-bad.sql drops participation table "push_subscriptions" that an earlier definition carried']);
    const hollow = { name: '0998-hollow.sql', body: 'RETURNS integer AS SELECT 0;' };
    expect(lineageProblems([...defs, hollow]).length).toBeGreaterThanOrEqual(3);
  });
  it('0190 is in the rls-isolation viewer-readonly leg after 0181, so the smoke that found this proves the fix', () => {
    const wf = readFileSync(join(here, '../../../.github/workflows/rls-isolation.yml'), 'utf8');
    const line = wf.split('\n').find((l) => /0125-viewer-true-readonly/.test(l));
    expect(line).toMatch(/0181-push-subscriptions[^"]*0190-the-viewer-overlay-keeps-the-checklist/);
  });
});
