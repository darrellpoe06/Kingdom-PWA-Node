// =============================================================================
// church-members — the Love Corner door governs itself, from the real records
// =============================================================================
// Darrell, 2026-09-10, three asks scoped to the PoeTech / Love Corner app
// ("focus on PoeTech App only... or Love Corner App"): "how can we see and
// edit the onboarding process when we or staff want to make adjustments?" —
// "Assistants and others need hierarchy for making sure we have appropriate
// governance and resources" — "Owners and managers etc need to be able to
// govern using the same app" — "opportunities and constraints".
//
// This lib is the PURE half of the church Members tab (components/
// ChurchMembers.jsx). Nothing here paints a number: every count comes from a
// row the database returned to an owner/admin, and every "may / may not"
// line is derived from the same catalog the server enforces (ROLE_LABELS +
// CAPABILITIES in member-roles.js mirror set_member_role 0111/0130/0144 and
// set_member_capability 0126). The database is the wall; this only reads it
// back so the person governing can see what is true (DR-0076, DR-0241).
//
// The way in (migration 0014's join_church_instance, unchanged since): a
// leader on the allowlist is joined on sign-in; anyone else is joined ONLY
// when an owner/admin has invited their email and that invite is still open
// (unaccepted, unexpired) when they sign in. That is the onboarding process;
// wayInSteps() states it with the live counts beside each step so the process
// is SEEN, and the controls on the tab are how it is EDITED.
import { supabase } from './supabase.js';
import {
  listMyAdminInstances, listInstanceMembersStrict, listMemberCapabilities,
  CAPABILITIES, ROLE_LABELS,
} from './member-roles.js';
import { listPendingClaims } from './family-invite.js';

// The order people are listed in: the hierarchy, top down.
export const ROLE_ORDER = ['owner', 'admin', 'member', 'assistant', 'successor', 'child', 'viewer'];

// What each standing MAY do and MAY NOT do on this door, in the words the
// database already agreed to (ROLE_LABELS is surface-says-truth verified;
// the constraints mirror grantableRoles / canEditCapabilities / 0125 / 0082).
const ROLE_RIGHTS = {
  owner: {
    may: ['Read and edit every shared record', 'Invite people and set any standing, admin included', 'Grant or revoke extra rights', 'Set the protective standings (child, successor)'],
    mayNot: ['Be changed from this tab — an owner is untouchable here (no lockout)'],
  },
  admin: {
    may: ['Read and edit every shared record', 'Invite people as member, viewer or admin', 'Move a member between member, viewer and assistant', 'Grant or revoke extra rights for members and viewers'],
    mayNot: ['Make or change an admin (an owner does that)', 'Touch an owner', 'Set child or successor (the owner’s hand alone)'],
  },
  member: {
    may: ['Read and edit the space’s shared records'],
    mayNot: ['Invite people or change anyone’s standing', 'Reach the books or money'],
  },
  viewer: {
    may: ['Read the shared records'],
    mayNot: ['Change any record (read-only, enforced by the database)', 'Invite people or change anyone’s standing'],
  },
  assistant: {
    may: ['Work in the office workspace'],
    mayNot: ['See or change anything outside that workspace'],
  },
  successor: {
    may: ['See what the owner sees'],
    mayNot: ['Change anything'],
  },
  child: {
    may: ['Use the door as a member'],
    mayNot: ['See anything financial'],
  },
};

/**
 * The opportunities and constraints of one person: their standing's rights,
 * plus each extra right from the checklist as "may" when granted and "may not"
 * when not (member / viewer only — the roles the checklist applies to).
 * @param {string} role
 * @param {Array<{userId:string, capability:string}>} grants  the whole space's grants
 * @param {string} userId
 */
export function rightsFor(role, grants = [], userId = null) {
  const base = ROLE_RIGHTS[role] || { may: [], mayNot: ['No standing on record — nothing is open until an owner or admin sets one'] };
  const may = [...base.may];
  const mayNot = [...base.mayNot];
  if (['member', 'viewer'].includes(role)) {
    const mine = new Set(grants.filter((g) => g.userId === userId).map((g) => g.capability));
    for (const c of CAPABILITIES) {
      if (mine.has(c.key)) may.push(`${c.label} (extra right)`);
      else mayNot.push(c.label);
    }
  }
  return { may, mayNot };
}

/** People per standing, in hierarchy order, plus the total. */
export function countsByRole(members = []) {
  const counts = {};
  for (const r of ROLE_ORDER) counts[r] = 0;
  let total = 0;
  for (const m of members) {
    const r = m && m.role;
    if (!r) continue;
    counts[r] = (counts[r] || 0) + 1;
    total += 1;
  }
  return { ...counts, total };
}

/** The roster grouped by standing, hierarchy order, unknown standings last. */
export function groupByRole(members = []) {
  const groups = ROLE_ORDER.map((role) => ({ role, label: ROLE_LABELS[role] || role, people: [] }));
  const other = { role: 'other', label: 'No standing', people: [] };
  for (const m of members) {
    const g = groups.find((x) => x.role === m.role);
    (g || other).people.push(m);
  }
  return [...groups, other].filter((g) => g.people.length > 0);
}

/** Invites that can still let someone in: not yet accepted, not yet expired. */
export function openInvites(rows = [], now = Date.now()) {
  return rows.filter((r) => r && !r.accepted_at && (!r.expires_at || new Date(r.expires_at).getTime() > now));
}

/**
 * The join process, as the database runs it, with the live number beside each
 * step. Counts come from real rows; a step whose count cannot be read carries
 * null, never a painted zero.
 */
export function wayInSteps({ counts, invites, claims } = {}) {
  const c = counts || null;
  return [
    {
      id: 'leader',
      title: 'A leader is joined the moment they sign in',
      detail: 'The church’s named leaders are on the door’s allowlist and are joined as owner or admin on their first sign-in — no invite needed.',
      count: c ? (c.owner || 0) + (c.admin || 0) : null,
      unit: 'owners and admins',
    },
    {
      id: 'invite',
      title: 'An owner or admin invites a person by email, with a standing',
      detail: 'The invite stays open for 14 days. Only an owner or admin can send one; an admin may invite as member, viewer or admin.',
      count: Array.isArray(invites) ? invites.length : null,
      unit: 'invites open now',
    },
    {
      id: 'signin',
      title: 'They sign in with that email and are in',
      detail: 'Their open invite is accepted on sign-in and they become a member of this door with the standing you chose — nothing else to confirm for the church.',
      count: c ? c.total : null,
      unit: 'people on the door',
    },
    {
      id: 'claim',
      title: 'A family-style claim link waits on your confirmation',
      detail: 'Invites sent as a one-time link (the family way) are two-party: they open it, you confirm them here.',
      count: Array.isArray(claims) ? claims.length : null,
      unit: 'waiting on you',
    },
    {
      id: 'govern',
      title: 'Adjust anyone’s standing and extra rights any time',
      detail: 'Under People: set the standing, check or uncheck an extra right. The database enforces every change; this tab only shows what it holds.',
      count: c ? (c.member || 0) + (c.viewer || 0) : null,
      unit: 'members and viewers you can adjust',
    },
  ];
}

/** The church space the signed-in person may govern, if any (owner/admin). */
export function pickChurchSpace(spaces = []) {
  return spaces.find((s) => s && s.instanceType === 'church' && ['owner', 'admin'].includes(s.role)) || null;
}

/**
 * Read everything the tab shows, from the real records. Owner/admin only —
 * anyone else gets { governs: false }. Throws only from the roster read
 * (STRICT, so an error says it is one); the side reads fail soft to [].
 */
export async function loadChurchGovernance() {
  const spaces = await listMyAdminInstances();
  const space = pickChurchSpace(spaces);
  if (!space) return { governs: false, space: null, myRole: null, members: [], grants: [], invites: [], claims: [] };
  const members = await listInstanceMembersStrict(space.instanceId);
  const [grants, invites, claimsRes] = await Promise.all([
    listMemberCapabilities(space.instanceId).catch(() => []),
    readInvites(space.instanceId).catch(() => []),
    listPendingClaims().catch(() => ({ ok: false, claims: [] })),
  ]);
  return {
    governs: true,
    space,
    myRole: space.role,
    members,
    grants,
    invites: openInvites(invites),
    claims: claimsRes && claimsRes.ok ? claimsRes.claims : [],
  };
}

// The open invites for a space (RLS instance_invites_admin_read lets an
// owner/admin read them directly).
export async function readInvites(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase
    .from('instance_invites')
    .select('id,email,role,accepted_at,expires_at')
    .eq('instance_id', instanceId);
  if (error) { console.warn('[church-members] invites read failed:', error); return []; }
  return data || [];
}
