// =============================================================================
// 0143 — worker classification: a label, never a power (2026-08-22)
// =============================================================================
// Darrell: "when adding a new person to my family members or assistants, 1099
// and other etc... how can we change their statuses as needed." Two axes now:
// the access ROLE (what they may do) and the CLASSIFICATION (what they are to
// the books: family / W-2 / 1099 / volunteer). These pins keep the second axis
// honest: DB-guarded to owner/admin, value-checked in the schema AND the RPC,
// granted to authenticated only, and surfaced in Role & stewards.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASSIFICATIONS, classificationLabel } from '../lib/member-roles.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0143-member-worker-classification.sql');
const sql = readFileSync(MIG, 'utf8');
const code = sql.replace(/--.*$/gm, '');

describe('0143 — the migration keeps its gates', () => {
  it('the column carries a CHECK: only family/w2/1099/volunteer or NULL', () => {
    expect(code).toMatch(/classification IS NULL OR classification IN \('family','w2','1099','volunteer'\)/);
  });

  it('the setter is owner/admin-gated and value-checked, with empty-clears', () => {
    expect(code).toMatch(/coalesce\(user_role_in_instance\(instance_uuid\), ''\) NOT IN \('owner','admin'\)/);
    expect(code).toMatch(/only an owner\/admin can classify members/);
    expect(code).toMatch(/v_class IN \('family','w2','1099','volunteer'\)/);
    expect(code).toMatch(/IF v_class = '' THEN/);
  });

  it('PUBLIC execute is revoked on both functions; authenticated only', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.set_member_classification\(uuid, uuid, text\) FROM PUBLIC/);
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.set_member_classification\(uuid, uuid, text\) TO authenticated/);
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.list_instance_members\(uuid\) FROM PUBLIC/);
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.list_instance_members\(uuid\) TO authenticated/);
  });

  it('the roster function returns the classification and keeps its owner/admin guard', () => {
    expect(code).toMatch(/RETURNS TABLE \(user_id uuid, display_name text, email text, role text, classification text\)/);
    expect(code).toMatch(/AND user_role_in_instance\(instance_uuid\) IN \('owner','admin'\)/);
  });

  it('a label is never a power: the migration touches no role and no policy', () => {
    expect(code).not.toMatch(/set_member_role|CREATE POLICY|DROP POLICY/);
  });
});

describe('the client speaks the four classifications', () => {
  it('the list and labels are exactly the four the schema allows', () => {
    expect(CLASSIFICATIONS.map((c) => c.key)).toEqual(['family', 'w2', '1099', 'volunteer']);
    expect(classificationLabel('1099')).toBe('1099 contractor');
    expect(classificationLabel('w2')).toBe('W-2 staff');
    expect(classificationLabel('nope')).toBe('');
  });

  it('Role & stewards renders the classification control per member', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'AdminConsole.jsx'), 'utf8');
    expect(src).toMatch(/changeMemberClassification\(m\.userId, e\.target\.value\)/);
    expect(src).toMatch(/<option value="">Unclassified<\/option>/);
    expect(src).toMatch(/CLASSIFICATIONS\.map/);
  });

  it('listInstanceMembers carries the classification through to the surface', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'member-roles.js'), 'utf8');
    expect(src).toMatch(/classification: r\.classification \?\? null/);
  });
});

// 2026-08-23, Darrell's screenshot: "No members to manage" shown to the OWNER
// of the space — the roster RPC had just been re-created by 0144 and the API
// cache missed; the fail-soft [] rendered as truth. The control surface now
// uses the STRICT read so an error SAYS it is one (DR-0100).
describe('the roster error is never dressed as an empty roster', () => {
  it('member-roles exports the strict twin that throws instead of returning []', () => {
    const lib = readFileSync(join(HERE, '..', 'lib', 'member-roles.js'), 'utf8');
    expect(lib).toMatch(/export async function listInstanceMembersStrict/);
    expect(lib).toMatch(/if \(error\) throw new Error\(error\.message \|\| 'list_instance_members failed'\)/);
  });
  it('AdminConsole reads the roster strictly — its catch renders the honest error', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'AdminConsole.jsx'), 'utf8');
    expect(src).toMatch(/await listInstanceMembersStrict\(wanted\)/);
    expect(src).toMatch(/status: 'error', list: \[\], myRole: null, error:/);
  });
});

// Build 0755B9C, Darrell's screenshot: the honest error surfaced the TRUE root
// cause — the Load-members button passed its CLICK EVENT as the space id, and
// the RPC tried to JSON-serialize an HTMLButtonElement (circular structure).
// Two pins: the button passes NO argument, and the loader accepts only strings.
describe('the loader never receives a click event as a space id', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'AdminConsole.jsx'), 'utf8');
  it('the Load-members button calls loadMembers with no argument', () => {
    expect(src).toMatch(/onClick=\{\(\) => loadMembers\(\)\}/);
    expect(src).not.toMatch(/onClick=\{loadMembers\}/);
  });
  it('loadMembers type-guards its argument to a string space id', () => {
    expect(src).toMatch(/typeof targetInstance === 'string' && targetInstance \? targetInstance : null/);
  });
});
