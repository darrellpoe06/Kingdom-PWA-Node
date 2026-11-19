// =============================================================================
// worker-reach — "why isn't he getting them?", answered from the real rows
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!? Find and fix it!!!!!!"
//
// The chain has four links (DR-1594): the invitation, the worker signing in
// (the claim), the permissions the claim grants, and a job assigned to him.
// Any one missing and he sees nothing, and until now no screen said which one.
// This is the pure half: per 1099 worker, each link read from the rows the
// owner can actually read (property_access_invites, delegated_capabilities in
// his instance, the work orders), and the ONE plain reason that stops him,
// or that nothing does. Nothing here is painted: a link that could not be
// read is said to be unknown, never "fine".
// =============================================================================
import { personName, personContact } from './people.js';
import { CAPABILITY_LABELS, ROLE_CEILING } from './model.js';

const OPEN = ['submitted', 'received', 'scheduled', 'in-progress'];
const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * One row per 1099 worker invited to this instance (not revoked), deduplicated
 * by how they sign in. `grants` are delegated_capabilities rows (null when
 * they could not be read); `jobs` are work orders (null when unreadable).
 */
export function workerReach(invites = [], { instanceId = null, grants = null, jobs = null } = {}) {
  const rows = (Array.isArray(invites) ? invites : []).filter((i) => i && !i.revoked
    && i.role_label === 'field_worker' && (!instanceId || !i.instance_id || i.instance_id === instanceId));
  const byPerson = new Map();
  for (const i of rows) {
    const c = personContact(i);
    const key = c.phone || (c.kind === 'email' ? c.label : '') || i.id;
    const prev = byPerson.get(key);
    // A claimed row beats an unclaimed one; otherwise the newest invitation.
    if (!prev || (!prev.claimed_by && i.claimed_by)
      || (!!prev.claimed_by === !!i.claimed_by && String(i.created_at || '') > String(prev.created_at || ''))) byPerson.set(key, i);
  }
  const nameCount = new Map();
  for (const i of byPerson.values()) {
    const n = norm(i.display_name);
    if (n) nameCount.set(n, (nameCount.get(n) || 0) + 1);
  }
  const out = [];
  for (const [key, i] of byPerson) {
    const userId = i.claimed_by || null;
    const name = personName(i);
    const label = norm(i.display_name);
    const held = grants == null ? null : grants
      .filter((g) => g && userId && g.grantee_user_id === userId && g.setting === 'allow'
        && ROLE_CEILING.field_worker.includes(g.capability))
      .map((g) => g.capability);
    const open = jobs == null ? null : jobs.filter((j) => j && OPEN.includes(j.status));
    const theirs = open == null ? null : open.filter((j) => userId && j.assigned_to === userId);
    const waitingByName = open == null ? null : open.filter((j) => !j.assigned_to && label && norm(j.assigned_to_label) === label);
    const sharedName = !!label && (nameCount.get(label) || 0) > 1;
    const asked = Array.isArray(i.capabilities) ? i.capabilities.filter((c) => ROLE_CEILING.field_worker.includes(c)) : [];
    out.push({
      key,
      name,
      contact: personContact(i),
      invitedAt: i.created_at || null,
      signedIn: !!i.claimed_at,
      signedInAt: i.claimed_at || null,
      userId,
      invitedWith: asked.map((c) => CAPABILITY_LABELS[c] || c),
      holds: held == null ? null : [...new Set(held)].map((c) => CAPABILITY_LABELS[c] || c),
      jobs: theirs == null ? null : theirs.length,
      waitingByName: waitingByName == null ? null : waitingByName.length,
      ...verdict({ i, name, userId, asked, held, theirs, waitingByName: waitingByName == null ? 0 : waitingByName.length, sharedName }),
    });
  }
  const rank = { blocked: 0, waiting: 1, unknown: 2, idle: 3, ok: 4 };
  return out.sort((a, b) => rank[a.state] - rank[b.state] || a.name.localeCompare(b.name));
}

function verdict({ i, name, userId, asked, held, theirs, waitingByName, sharedName }) {
  const how = personContact(i).kind === 'phone' ? `with ${personContact(i).label} and their PIN` : `as ${personContact(i).label}`;
  if (!asked.length && !userId) {
    return { state: 'blocked', reason: `${name}'s invitation grants nothing. Take it away and invite them again: the boxes now start checked.` };
  }
  if (!userId) {
    const n = waitingByName || 0;
    return { state: 'waiting', reason: `${name} has not signed in yet. They sign in ${how} and open Poe Properties once${n === 1 ? '; the job sent to their name becomes theirs then' : n ? `; the ${n} jobs sent to their name become theirs then` : ''}.` };
  }
  if (held == null || theirs == null) {
    return { state: 'unknown', reason: `${name} signed in, but their permissions or jobs could not be read just now. Nothing is concluded from that.` };
  }
  if (!held.length && !theirs.length) {
    return { state: 'blocked', reason: `${name} signed in, but holds no permission and has no job assigned, so they see nothing. Take the invitation away and invite them again with the boxes checked.` };
  }
  if (waitingByName && sharedName) {
    return { state: 'blocked', reason: `${waitingByName} job${waitingByName === 1 ? ' was' : 's were'} sent to the name "${name}", which two people share, so ${waitingByName === 1 ? 'it was' : 'they were'} not given to either. Send ${waitingByName === 1 ? 'it' : 'them'} again from Dispatch, choosing the person.` };
  }
  if (!theirs.length) {
    return { state: 'idle', reason: `${name} can sign in and see their work, but nothing open is assigned to them. Send a job from Dispatch.` };
  }
  return { state: 'ok', reason: `${name} has ${theirs.length} open job${theirs.length === 1 ? '' : 's'} assigned. They are listed under My work orders and on the bell when the app is open.` };
}
