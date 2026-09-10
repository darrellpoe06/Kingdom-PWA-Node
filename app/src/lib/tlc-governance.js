// =============================================================================
// tlc-governance — the office's hierarchy, and what each position governs and
// reaches, as data (DR-0346)
// =============================================================================
// Darrell 2026-09-10: "Assistants and others need hierarchy for making sure we
// have appropriate governance and resources for our business" / "Owners and
// managers etc need to be able to govern using the same app."
//
// The access ROLE is the database's word (instance_members.role: owner, admin,
// member, assistant, viewer; DR-0220 / 0111 / 0130); the POSITION is the
// office's word for the same seat. One table binds them, names who reports
// to whom, what each seat governs, and which parts of the TLC app it reaches
// — so the door's gates, the Governance area, and the handbook say one thing.
// Pure data + helpers; the RPCs (member-roles.js) and RLS are the enforcement.

// The parts of the TLC app a seat can reach. Ids are the door's tab ids and
// Training / Team area ids, so the matrix is checkable against the real gates.
export const TLC_RESOURCES = Object.freeze([
  { id: 'find', label: 'Find your therapist', kind: 'tab' },
  { id: 'inquiries', label: 'Inquiries', kind: 'tab' },
  { id: 'growth', label: 'Client Growth', kind: 'tab' },
  { id: 'revenue', label: 'Revenue', kind: 'tab' },
  { id: 'training', label: 'Training', kind: 'tab' },
  { id: 'training:library', label: 'Training · course library, map, hours, CE', kind: 'area' },
  { id: 'training:assign', label: 'Training · assign a lesson to a client', kind: 'area' },
  { id: 'team', label: 'Team · documents, who we are', kind: 'tab' },
  { id: 'team:launch', label: 'Team · launch board', kind: 'area' },
  { id: 'team:governance', label: 'Team · governance (members, roles, invites)', kind: 'area' },
  { id: 'assistant', label: 'Assistant workspace', kind: 'tab' },
  { id: 'onboarding', label: 'Onboarding (invites, packets, roster)', kind: 'tab' },
  // HIRE THROUGH THE APP (DR-0350): the door's open positions, and the desk.
  { id: 'door:jobs', label: 'Join the team · open positions, apply, share', kind: 'area' },
  { id: 'onboarding:hiring', label: 'Onboarding · jobs and applicants (hire)', kind: 'area' },
]);

const EVERYONE = ['find', 'training', 'team', 'assistant', 'door:jobs'];
const STAFF = [...EVERYONE, 'inquiries', 'growth', 'revenue', 'training:library', 'training:assign', 'team:launch'];
const MANAGERS = [...STAFF, 'onboarding', 'team:governance', 'onboarding:hiring'];
// Before membership (DR-0350): a stranger on the door, and a hire mid-packet.
const BEFORE_LOGIN = ['find', 'door:jobs'];

// The seats, top down. `role` is the database role that carries the seat.
export const TLC_POSITIONS = Object.freeze([
  { key: 'owner', role: 'owner', title: 'Owner · Clinical Director', holder: 'Christina Poe, LCSW', reportsTo: null,
    governs: 'The practice: clinical standards, who joins the office, every role below, the roster the public sees, approval of every course and lesson, the money.',
    resources: MANAGERS,
    may: ['Set any role (admin, member, assistant, viewer); only an owner may make or unmake an admin', 'Invite a colleague and approve their packet onto the roster', 'Approve or send back every course', 'See revenue, inquiries, client growth', 'Assign lessons to clients'] },
  { key: 'admin', role: 'admin', title: 'Operations Manager', holder: 'Darrell Poe', reportsTo: 'owner',
    governs: 'Operations: onboarding invites and packets, the launch board, the office members below admin, the systems the office runs on.',
    resources: MANAGERS,
    may: ['Move a member between member, viewer and assistant (never admin)', 'Invite a colleague and manage packets', 'See revenue, inquiries, client growth', 'Assign lessons to clients'] },
  { key: 'supervisor', role: 'member', title: 'Clinical Supervisor (LCSW)', holder: 'Named by the owner', reportsTo: 'owner',
    governs: 'Supervision: the pre-licensed colleagues’ hours and their four-hours-a-month supervision, per 68 Ill. Adm. Code 1470.20; sits as a member in the app, the supervisory duty is clinical, not an app power.',
    resources: STAFF,
    may: ['Work the inquiries and client growth board', 'Train and assign lessons to clients', 'Read the launch board and the office documents'] },
  { key: 'therapist', role: 'member', title: 'Therapist (independent contractor)', holder: 'Each approved colleague', reportsTo: 'supervisor',
    governs: 'Their own caseload and their own training record; the inquiries they pick up.',
    resources: STAFF,
    may: ['Work the inquiries and client growth board', 'Train, log hours and CE, assign lessons to their clients', 'Update the launch board'] },
  { key: 'trainee', role: 'member', title: 'Therapist-in-training (pre-licensed)', holder: 'Each approved colleague under supervision', reportsTo: 'supervisor',
    governs: 'Their own training record toward the LCSW: the weekly trainings, the supervised hours ledger.',
    resources: STAFF,
    may: ['Everything a therapist may, under supervision', 'Log supervised hours toward the 3,000'] },
  { key: 'assistant', role: 'assistant', title: 'Office Assistant', holder: 'Named by the owner', reportsTo: 'admin',
    governs: 'The assistant workspace only: referral organizations, content posts, ideas, the working schedule (0130).',
    resources: EVERYONE,
    may: ['Work the Assistant workspace', 'Read the office documents and the public roster', 'Never client inquiries, revenue, packets, or roles'] },
  { key: 'reviewer', role: 'viewer', title: 'Reviewer (read-only)', holder: 'A guest the owner admits', reportsTo: 'admin',
    governs: 'Nothing; reads what the office chooses to show.',
    resources: EVERYONE,
    may: ['Read the public roster, the training a client sees, the office documents'] },
  { key: 'client', role: null, title: 'Client', holder: 'Anyone who signs in without an office role', reportsTo: null,
    governs: 'Their own learning: the lessons their therapist assigns, their reading choices.',
    resources: EVERYONE,
    may: ['Find a therapist and book', 'Read the client lessons, with or without the Word', 'See lessons assigned to them and mark them reviewed'] },
  // The two standings BEFORE membership that the hiring workflow needs
  // (Darrell 2026-09-10: "Do we have all the types of users we need for these
  // workflows to work"). Neither holds an office role; the database reaches
  // them only through the functions named here.
  { key: 'applicant', role: null, title: 'Applicant (no login yet)', holder: 'Anyone who applies to a posting on the door', reportsTo: 'admin',
    governs: 'Nothing in the office: one application, written once through tlc_apply, read by the owner/admin only; never a member until hired, packeted and approved.',
    resources: BEFORE_LOGIN,
    may: ['Read the open positions and share a posting', 'Apply once per posting (text only, no documents, never client information)', 'Hear back from the office at the email they gave'] },
  { key: 'newhire', role: null, title: 'New colleague (hired, in onboarding)', holder: 'A hired applicant with a login, before the packet is approved', reportsTo: 'admin',
    governs: 'Their own packet: the intake answers, the documents as pointers, the three signed acknowledgments; they may withdraw it. Not a member until the owner approves.',
    resources: EVERYONE,
    may: ['Open the one-time invite and bind the packet to their own login', 'Read each document in the app and sign it by typed name (version and time recorded)', 'Withdraw the packet (a hard delete, files first)'] },
]);

export function positionForRole(role, { approvedColleague = false } = {}) {
  if (role === 'owner') return TLC_POSITIONS.find((p) => p.key === 'owner');
  if (role === 'admin') return TLC_POSITIONS.find((p) => p.key === 'admin');
  if (role === 'member') return TLC_POSITIONS.find((p) => p.key === 'therapist');
  if (role === 'assistant') return TLC_POSITIONS.find((p) => p.key === 'assistant');
  if (role === 'viewer') return TLC_POSITIONS.find((p) => p.key === 'reviewer');
  if (approvedColleague) return TLC_POSITIONS.find((p) => p.key === 'therapist');
  return TLC_POSITIONS.find((p) => p.key === 'client');
}

export function resourcesFor(role, opts = {}) {
  const p = positionForRole(role, opts);
  return p ? p.resources.slice() : EVERYONE.slice();
}

export function canReach(role, resourceId, opts = {}) {
  return resourcesFor(role, opts).includes(resourceId);
}

// The chain of command above a seat, top first.
export function chainOfCommand(key) {
  const out = [];
  let p = TLC_POSITIONS.find((x) => x.key === key);
  while (p && p.reportsTo) { p = TLC_POSITIONS.find((x) => x.key === p.reportsTo); if (p) out.unshift(p); }
  return out;
}

// The matrix the Governance area renders: one row per resource, one column per seat.
export function resourceMatrix() {
  return TLC_RESOURCES.map((r) => ({ resource: r, seats: TLC_POSITIONS.map((p) => ({ key: p.key, reaches: p.resources.includes(r.id) })) }));
}

export const GOVERNANCE_NOTE = 'The database decides (RLS and the guarded role functions); this table is the office’s reading of the same rule, kept in step by the tests. An owner is never changed here; only an owner makes or unmakes an admin; no one changes their own seat.';
