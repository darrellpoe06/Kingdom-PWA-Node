// relationships-wiring.test.js — proves the Relationships surface is wired into
// every place a top-level surface must appear, so it can't ship half-mounted
// (the class feedback-area-guard / module-boundary-guard guard against).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

describe('Relationships surface is fully wired', () => {
  const surfaces = read('surfaces.js');
  const mono = read('poe-financial-mvp-v28.jsx');

  it('is registered in the surface registry as a lazy load + named export', () => {
    expect(surfaces).toMatch(/id:\s*'relationships'[\s\S]*?import\('\.\/components\/Relationships\.jsx'\)/);
    expect(surfaces).toMatch(/export const Relationships\s*=\s*surfaceById\['relationships'\]\.component/);
  });

  it('is imported into the shell from the registry (never a static import)', () => {
    expect(mono).toMatch(/Relationships,?\s*\n?\s*}\s*from\s*'\.\/surfaces\.js'/);
    // It must NOT be statically imported from the component file in the shell.
    expect(mono).not.toMatch(/import\s+[^\n]*from\s*'\.\/components\/Relationships\.jsx'/);
  });

  it('is a valid route, a gated nav entry, has a render branch + a feedback area', () => {
    expect(mono).toMatch(/'relationships'/);                                  // VALID routes
    expect(mono).toMatch(/isFamilyMember\s*\?\s*\[\['relationships'/);        // no-leak nav spread
    expect(mono).toMatch(/view === 'relationships'/);                          // render branch
    expect(mono).toMatch(/<Relationships\s+isGovernor=\{isFamilyMember\}/);    // governor-gated render
    // FEEDBACK_AREAS moved to components/FeedbackCenter.jsx with the extraction.
    expect(read('components/FeedbackCenter.jsx')).toMatch(/\['relationships',/); // FEEDBACK_AREAS entry
  });
});

describe('the migration ships the relationship tables with no-leak shape', () => {
  const sql = read('../../infra/supabase/migrations-auto/0055-relationship-permissions.sql');

  it('adds the child role and the seven workflow tables', () => {
    expect(sql).toMatch(/role IN \('owner','admin','member','viewer','specialist','child'\)/);
    for (const t of ['rental_tenancies', 'maintenance_requests', 'rent_records', 'tenant_notices', 'tenant_messages', 'child_capabilities', 'child_action_requests']) {
      expect(sql, `missing table ${t}`).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`));
    }
  });

  it('pins that no money moves in-app (a CHECK forces money_moved_in_app false)', () => {
    expect(sql).toMatch(/money_moved_in_app\s+boolean[^\n]*CHECK \(money_moved_in_app = false\)/);
  });

  it('scopes tenant rows by user_is_tenant and gates child writes to guardians', () => {
    expect(sql).toMatch(/FUNCTION public\.user_is_tenant/);
    expect(sql).toMatch(/OR user_is_tenant\(tenancy_id\)/);
    // child_action_requests UPDATE (resolve) is owner/admin only — a child can't self-approve.
    expect(sql).toMatch(/child_action_requests_update[\s\S]*?IN \('owner','admin'\)/);
  });
});
