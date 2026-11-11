// =============================================================================
// learner-household — the household a reader belongs to, for their record
// =============================================================================
// Darrell, 2026-11-10, of what a record should say beneath the reader's name:
// "Also parents etc... households... vs individuals etc." (DR-1420)
//
// One read of what the household account already holds: its own name
// (instances.display_name) and its roster (list_instance_members: each
// member's own display name, their role, and the relationship a steward has
// written for them). The roster is readable by the household's owner and
// admins only, by its own wall; for anyone else this returns an empty
// household and the record simply says less. Nothing is written, and a read
// that fails is an empty household, never a guess.
// =============================================================================
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';
import { listInstanceMembers } from './member-roles.js';

export function emptyHousehold() {
  return { name: '', count: 0, byUser: new Map() };
}

export async function loadLearnerHousehold() {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return emptyHousehold();
    const [members, inst] = await Promise.all([
      listInstanceMembers(instanceId),
      supabase.from('instances').select('display_name').eq('id', instanceId).maybeSingle(),
    ]);
    const byUser = new Map();
    for (const m of members || []) if (m && m.userId) byUser.set(m.userId, m);
    return { name: String((inst && inst.data && inst.data.display_name) || '').trim(), count: byUser.size, byUser };
  } catch {
    return emptyHousehold();
  }
}
