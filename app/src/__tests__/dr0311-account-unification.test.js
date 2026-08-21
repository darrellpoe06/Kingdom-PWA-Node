// =============================================================================
// DR-0311 — one person, two doors, one library: the migration keeps its shape
// =============================================================================
// Proven-to-catch gates on 0141 (person_links + same_person + remap). Each rule
// here is a bright line from the locked design; drifting any of them re-opens
// a hole the census receipt (run 32417595488) closed:
//   • person_links must carry NO app write policy — with RLS on and no policy,
//     app roles cannot write a link, so self-linking into someone else's
//     library is structurally impossible. A future CREATE POLICY ..._insert
//     on person_links fails this build.
//   • game_saves must stay OUT of the substitution — 0077 scopes it by
//     user_role_in_instance(instance_id), not by owner; the final ground-truth
//     read caught it on the staged list and removed it.
//   • NOTHING is deleted — the delete-the-gmail-row proposal was refused on
//     the measured record; a DELETE / DROP USER sneaking into 0141 fails here.
//   • Door-class rows stay on the door — the remap must not touch
//     user_credentials, dm_public_keys, member_presence, instance_members.
//   • The seed pins BOTH measured identities by EMAIL (resolved live on the
//     box, the census's own correction — never a hardcoded hosted-era UUID).
// Plus the client mirror: a linked door never sees the Add-email affordance.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLinkedDoor, linkedPrimary, LINKED_DOORS } from '../lib/person-links.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0141-account-unification-person-links.sql');
const sql = readFileSync(MIG, 'utf8');
// Comments stripped so a rule can't be "satisfied" (or violated) by prose.
const code = sql.replace(/--.*$/gm, '');

describe('0141 — person_links is unwritable by app roles', () => {
  it('enables RLS and defines exactly one policy: SELECT for the person', () => {
    expect(code).toMatch(/ALTER TABLE person_links ENABLE ROW LEVEL SECURITY/);
    const policies = code.match(/CREATE POLICY\s+person_links_\w+/g) || [];
    expect(policies).toEqual(['CREATE POLICY person_links_select']);
    expect(code).toMatch(/person_links_select ON person_links FOR SELECT/);
  });

  it('grants app roles SELECT only — never INSERT/UPDATE/DELETE', () => {
    const grants = code.match(/GRANT[^;]*ON person_links[^;]*;/g) || [];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).toMatch(/GRANT SELECT ON person_links/);
      expect(g).not.toMatch(/INSERT|UPDATE|DELETE|ALL/);
    }
  });

  it('door_user is unique (a door belongs to exactly one person)', () => {
    expect(code).toMatch(/UNIQUE\s*\(door_user\)/);
  });

  it('proven-to-catch: a smuggled write policy WOULD fail the policy gate', () => {
    const tampered = code + '\nCREATE POLICY person_links_insert ON person_links FOR INSERT WITH CHECK (true);';
    const policies = tampered.match(/CREATE POLICY\s+person_links_\w+/g) || [];
    expect(policies).not.toEqual(['CREATE POLICY person_links_select']);
  });
});

describe('0141 — same_person substitutes only the locked list', () => {
  it('same_person is STABLE SECURITY DEFINER with pinned search_path', () => {
    expect(code).toMatch(/FUNCTION public\.same_person\(other uuid\)\s*\nRETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public/);
  });

  it('the four pure owner-scoped tables get same_person on all four verbs', () => {
    for (const t of ['study_entries', 'study_spaces', 'eternal_algorithms', 'tv_watch']) {
      for (const verb of ['select', 'insert', 'update', 'delete']) {
        expect(code, `${t}_${verb}`).toMatch(new RegExp(`CREATE POLICY ${t}_${verb} ON ${t}`));
      }
      expect(code).not.toMatch(new RegExp(`${t}[\\s\\S]{0,200}owner = auth\\.uid\\(\\)`));
    }
  });

  it('tv_share: only the SELECT owner branch widens; circle logic and writes untouched', () => {
    expect(code).toMatch(/tv_share_select ON tv_share FOR SELECT/);
    expect(code).toMatch(/same_person\(owner\)\s*\n\s*OR \(\s*\n\s*tv_is_member/);
    // The write policies are NOT recreated here — 0074's stand.
    expect(code).not.toMatch(/tv_share_insert|tv_share_update|tv_share_delete/);
  });

  it('game_saves is untouched — 0077 scopes it by instance, not owner', () => {
    expect(code).not.toMatch(/game_saves/);
  });
});

describe('0141 — the remap moves attribution and deletes nothing', () => {
  it('remaps exactly the five census columns', () => {
    expect(code).toMatch(/UPDATE board_tasks\s+SET created_by = gml WHERE created_by = phn/);
    expect(code).toMatch(/UPDATE usage_events\s+SET owner\s+= gml WHERE owner\s+= phn/);
    expect(code).toMatch(/UPDATE feedback\s+SET user_id\s+= gml WHERE user_id\s+= phn/);
    expect(code).toMatch(/UPDATE market_watchlist\s+SET created_by = gml WHERE created_by = phn/);
    expect(code).toMatch(/UPDATE family_snapshots\s+SET updated_by = gml WHERE updated_by = phn/);
  });

  it('asserts floor AND exhaustion, with counts NOTICE-d', () => {
    expect(code).toMatch(/FLOOR FAILED/);
    expect(code).toMatch(/EXHAUSTION FAILED/);
    expect(code).toMatch(/RAISE NOTICE 'DR-0311 remap moved phone->gmail/);
  });

  it('deletes NOTHING — no DELETE, DROP TABLE, or TRUNCATE anywhere in 0141', () => {
    // "DELETE" appears only inside policy names/verbs and CASCADE clauses;
    // an actual row-deleting statement must never enter this migration.
    expect(code).not.toMatch(/^\s*DELETE FROM/m);
    expect(code).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM auth\.users/i);
  });

  it('door-class rows stay on the door — never remapped', () => {
    for (const t of ['user_credentials', 'dm_public_keys', 'member_presence', 'instance_members']) {
      expect(code).not.toMatch(new RegExp(`UPDATE ${t}`));
    }
  });

  it('the seed resolves both identities by EMAIL, live — never a hardcoded UUID', () => {
    expect(code).toMatch(/g\.email = 'darrellpoe06@gmail\.com'/);
    expect(code).toMatch(/p\.email = '15636502416@phone\.poetech\.us'/);
    // The census's own lesson: no UUID literals anywhere in the executable SQL.
    expect(code).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });
});

describe('person-links client mirror — the door surface tells the truth', () => {
  it('the phone door is a linked door, mapped to the gmail identity', () => {
    expect(isLinkedDoor('15636502416@phone.poetech.us')).toBe(true);
    expect(linkedPrimary('15636502416@phone.poetech.us')).toBe('darrellpoe06@gmail.com');
  });

  it('unlinked and null emails are not doors', () => {
    expect(isLinkedDoor('someone@example.com')).toBe(false);
    expect(isLinkedDoor(null)).toBe(false);
    expect(linkedPrimary('someone@example.com')).toBe(null);
  });

  it('every linked door maps to a real primary (no empty targets)', () => {
    for (const [door, primary] of Object.entries(LINKED_DOORS)) {
      expect(door).toMatch(/@/);
      expect(primary).toMatch(/@/);
      expect(door).not.toBe(primary);
    }
  });

  it('AuthBanner never offers Add-email to a linked door (source gate)', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'AuthBanner.jsx'), 'utf8');
    expect(src).toMatch(/isPhoneUser && linkedDoor &&/);
    expect(src).toMatch(/isPhoneUser && !linkedDoor &&/);
    expect(src).toMatch(/isPhoneUser && !linkedDoor && addEmailOpen &&/);
    expect(src).toMatch(/one library, both doors/);
  });
});
