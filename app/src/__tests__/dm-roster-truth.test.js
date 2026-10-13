// =============================================================================
// dm-roster-truth — "the systems should already know" (Darrell 2026-07-28)
// =============================================================================
// The 2026-07-27 messaging review named the two live defects this pins closed:
// GAP 1 — an invited/phone-only person rendered as an invisible empty world
// (list_dm_contacts projects instance_members only, and the surface's footer
// blamed the encryption key — the wrong cause); GAP 2 — loadDmContacts dropped
// instance_id, so every send was stamped with the church instance and a
// non-church contact was correctly RLS-blocked. Pure functions are tested
// directly; the wiring that jsdom can't execute is source-pinned (the
// reviewer-mode pattern) so a revert fails the build.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dedupeDmContacts, invitedFromRows, resolveDmInstance } from '../lib/direct-messages-sync.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), 'utf8');

describe('dedupeDmContacts — GAP 2: instance_id survives the dedupe', () => {
  it('keeps each row instance_id on the contact', () => {
    const out = dedupeDmContacts([
      { user_id: 'u1', display_name: 'Ann', role: 'member', instance_id: 'inst-a' },
    ]);
    expect(out).toEqual([{ userId: 'u1', displayName: 'Ann', role: 'member', instanceId: 'inst-a' }]);
  });

  it('prefers the leader row but never loses a known instance', () => {
    const out = dedupeDmContacts([
      { user_id: 'u1', display_name: 'Ann', role: 'member', instance_id: 'inst-a' },
      { user_id: 'u1', display_name: 'Ann (leader)', role: 'owner' },
    ]);
    expect(out[0].role).toBe('owner');
    expect(out[0].instanceId).toBe('inst-a');
  });

  it('drops rows without a user_id and sorts by name', () => {
    const out = dedupeDmContacts([
      { user_id: null, display_name: 'ghost' },
      { user_id: 'u2', display_name: 'Zed', instance_id: 'i' },
      { user_id: 'u3', display_name: 'Abe', instance_id: 'i' },
    ]);
    expect(out.map((c) => c.displayName)).toEqual(['Abe', 'Zed']);
  });
});

describe('invitedFromRows — GAP 1: invited people are visible, never an empty world', () => {
  it('maps the 0124 rows to pending chips', () => {
    const out = invitedFromRows([
      { invite_id: 'inv1', email: 'james@example.com', instance_id: 'colg', invite_role: 'member' },
    ]);
    expect(out).toEqual([{ inviteId: 'inv1', email: 'james@example.com', instanceId: 'colg', role: 'member' }]);
  });

  it('refuses rows without an email and tolerates junk', () => {
    expect(invitedFromRows([{ invite_id: 'x' }, null, { email: 'a@b.c' }])).toHaveLength(1);
    expect(invitedFromRows(null)).toEqual([]);
  });
});

describe('resolveDmInstance — the send rides the contact\'s own space', () => {
  it('explicit contact instance wins; fallback covers thread-only sends; neither is honest null', () => {
    expect(resolveDmInstance('inst-a', 'church')).toBe('inst-a');
    expect(resolveDmInstance(null, 'church')).toBe('church');
    expect(resolveDmInstance(null, null)).toBeNull();
  });
});

describe('source pins — the wiring the review dated 2026-07-29, shipped 2026-07-28', () => {
  it('Messages footer no longer blames the encryption key and tells the email/phone truth', () => {
    const src = read('../components/Messages.jsx');
    expect(src).not.toContain('that first visit creates their encryption key');
    expect(src).toMatch(/phone numbers are never account keys/);
  });

  it('DirectMessages sends on the contact\'s own instance and renders pending invites', () => {
    const src = read('../components/DirectMessages.jsx');
    expect(src).toMatch(/sendDirectMessage\(openWith, text, displayName, contact\?\.instanceId\)/);
    expect(src).toMatch(/Invited — waiting for their first sign-in/);
  });

  it('loadDmContacts materializes membership before reading the roster (invite-consumption ordering)', () => {
    const src = read('../lib/direct-messages-sync.js');
    const contacts = src.slice(src.indexOf('export async function loadDmContacts'));
    const materialize = contacts.indexOf('churchInstanceId()');
    const rpc = contacts.indexOf("rpc('list_dm_contacts')");
    expect(materialize).toBeGreaterThan(-1);
    expect(rpc).toBeGreaterThan(materialize);
  });

  it('the DM key publishes at sign-in, not only on the Messages surface', () => {
    const src = read('../lib/supabase.js');
    expect(src).toMatch(/publishDmKeyOnSignIn/);
    expect(src).toMatch(/onAuthStateChange\(\(event, session\) => \{\s*\n?\s*if \(session\?\.user\?\.id\)/);
  });

  it('migration 0124 exists, is leader-scoped, and grants no anon execute', () => {
    const p = join(here, '../../../infra/supabase/migrations-auto/0124-dm-invited-visibility.sql');
    expect(existsSync(p)).toBe(true);
    const sql = readFileSync(p, 'utf8');
    expect(sql).toMatch(/list_dm_invited/);
    expect(sql).toMatch(/im\.role IN \('owner','admin'\)/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.list_dm_invited\(\) FROM anon/);
    expect(sql).toMatch(/accepted_at IS NULL/);
  });
});
