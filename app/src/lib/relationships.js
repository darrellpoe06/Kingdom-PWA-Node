// =============================================================================
// relationships.js — the RELATIONSHIP-BASED permission model (the source of truth)
// =============================================================================
// Darrell, 2026-06-29: "How can I allow my child to do X or Y — can they or not?
// Can family / landlord<->tenant relationship workflows work, and should they,
// based on [role]?"
//
// Accounts now work, so the question stops being "is someone signed in" and
// becomes "what does the RELATIONSHIP between two people grant." This module is
// the single, explicit, CONFIGURABLE answer — not a pile of `if (email === ...)`
// checks buried in the monolith. It defines:
//
//   1. RELATIONSHIP_TYPES — guardian<->child, family, landlord<->tenant.
//   2. The ROLES inside each relationship.
//   3. A CAPABILITY registry (every can/can't is a named, documented capability).
//   4. The MATRIX: per relationship type, per role, what each capability resolves
//      to (allow / deny / approval-gated).
//   5. `can()` / `requiresApproval()` — the pure predicates the UI + RLS-shaped
//      logic read, so "this child can do X, not Y" is one function call, not a
//      scattered guess.
//
// CHILD-SAFETY IS STRUCTURAL, not just a default (DR-0076 verification doctrine:
// a safety property must be a gate you cannot talk past). Every child capability
// carries a `maxGrant` — the MOST permissive setting a guardian is allowed to
// choose. Outbound money is locked to `deny`; the guardian literally cannot grant
// a 10-year-old the ability to spend or transact on their own. The guardian
// configures within the safe envelope; they cannot configure their way out of it.
//
// NO MONEY IS EXECUTED BY THE SYSTEM anywhere downstream of this model. A tenant's
// `rent.initiate` capability means "record that I am paying" — the payment itself
// is the owner's hand / the processor. See lib/tenant-portal.js.
//
// PURE + DETERMINISTIC: no I/O, no React, no Supabase. Importable by the surface,
// by the workflow libs, and by vitest. The DB enforces the same shape in RLS
// (migration 0055) so a client that ignores this model still cannot leak.
// =============================================================================

// ---------------------------------------------------------------------------
// Permissiveness ordering. A capability setting is one of these three. The order
// matters: `deny` < `approval` < `allow`. Clamping a guardian's choice to a
// capability's `maxGrant` is a numeric min over this scale.
// ---------------------------------------------------------------------------
export const SETTING = Object.freeze({ DENY: 'deny', APPROVAL: 'approval', ALLOW: 'allow' });
const RANK = Object.freeze({ deny: 0, approval: 1, allow: 2 });
const rank = (s) => (s in RANK ? RANK[s] : 0); // unknown -> deny (fail safe)

// Clamp a desired setting so it never exceeds the safety ceiling `maxGrant`.
export function clampSetting(desired, maxGrant) {
  return rank(desired) <= rank(maxGrant) ? (desired in RANK ? desired : SETTING.DENY) : maxGrant;
}

// ---------------------------------------------------------------------------
// RELATIONSHIP TYPES + the roles inside each. Two people, a relationship between
// them, and the role each holds in that relationship — that is the whole model.
// ---------------------------------------------------------------------------
export const RELATIONSHIP_TYPES = Object.freeze({
  GUARDIAN_CHILD: 'guardian-child',
  FAMILY: 'family',
  LANDLORD_TENANT: 'landlord-tenant',
  LANDLORD_MANAGER: 'landlord-manager',
  OWNER_ASSISTANT: 'owner-assistant',
});

export const RELATIONSHIPS = Object.freeze([
  {
    type: RELATIONSHIP_TYPES.GUARDIAN_CHILD,
    label: 'Guardian ↔ Child',
    blurb:
      'A guardian (Darrell / Christina) sets exactly what a child account can do. ' +
      'Child-safe by default; outbound actions are guardian-approval-gated at most; ' +
      'spending and security stay locked. What a child SEES — including the family ' +
      'finances, for money education — is the guardian’s decision (DR-0094).',
    roles: ['guardian', 'child'],
    steward: 'guardian', // the side that CONFIGURES the other's access
  },
  {
    type: RELATIONSHIP_TYPES.FAMILY,
    label: 'Family circle',
    blurb:
      'Family members share family-scoped surfaces by their role. Governors build and ' +
      'steward; members use the shared family circle and can work the books; a SUCCESSOR ' +
      '(a steward-in-training being raised to take over) SEES the real books but cannot ' +
      'change them — read-only, so they learn on the family’s actual numbers without ' +
      'risk (DR-0111); children see only their child-safe slice.',
    roles: ['governor', 'member', 'successor', 'child'],
    steward: 'governor',
  },
  {
    type: RELATIONSHIP_TYPES.LANDLORD_TENANT,
    label: 'Landlord ↔ Tenant',
    blurb:
      'A real two-sided relationship for the rentals. Each side sees only what the ' +
      'relationship grants: a tenant sees their unit + lease, never the portfolio; the ' +
      'landlord manages the lease + requests for their properties only.',
    roles: ['landlord', 'tenant'],
    steward: 'landlord',
  },
  // LANDLORD ↔ MANAGER — the 1099-delegation relationship (Darrell 2026-07-06:
  // "a landlord can let 1099 workers manage the business while they watch the
  // workflows and live separated from the day to day… seeing the nuance to
  // train their 1099 management… review the historical text exchanges… and even
  // give that sight to new family to run the business or a 1099 worker").
  //
  // The MANAGER (a 1099 contractor OR a family member being raised to run it)
  // RUNS the day-to-day — the full landlord operating set (rent roll, maintenance,
  // rent-confirm, notices, lease, tenant contact, messaging). But the manager is
  // NOT the owner: they cannot WATCH-over the business as an owner, review the
  // whole message history for training, train another manager, or GRANT access
  // to anyone else. Those four are the owner's, and they are the ceiling — a 1099
  // worker runs the business, they do not get to hand it to someone else.
  //
  // The LANDLORD (owner) lives separated from the day-to-day yet keeps the whole
  // operating set PLUS the four oversight powers: watch the workflows, review the
  // historical exchanges to see the nuance, train for quality, and delegate that
  // same sight to new family or another 1099 worker. "With or without them" — the
  // owner can always act, and can always watch. Same staged, revocable pattern as
  // guardian↔child and the family successor: run within an envelope the steward
  // sets and can pull back.
  {
    type: RELATIONSHIP_TYPES.LANDLORD_MANAGER,
    label: 'Landlord ↔ Manager (1099)',
    blurb:
      'The delegation relationship: a landlord lets a 1099 worker (or a family member ' +
      'being raised to run it) MANAGE the business day-to-day, while the owner stays ' +
      'separated from the day-to-day and WATCHES the workflows. The manager runs the ' +
      'full operating set — rent roll, maintenance, rent, notices, lease, messaging — ' +
      'but never owns it: watching over the business, reviewing the whole message ' +
      'history to train, and granting access to others stay the owner’s. The owner ' +
      'trains from the nuance and can give that same sight to new family or another ' +
      '1099 worker, so quality holds with or without them.',
    roles: ['landlord', 'manager'],
    steward: 'landlord',
  },
  // OWNER ↔ ASSISTANT — the business-level delegation for a working assistant
  // (Darrell 2026-07-13: "make sure assistants can't see the owner's data,
  // however the owners or governors can see [down the level] — level and data
  // controls for leadership and owners"). The ASSISTANT (e.g. an executive
  // admin / marketing assistant in training) OPERATES a scoped set of work
  // surfaces — the referral database + marketing ops, their own tasks/calendar,
  // pre-intake inbound inquiries (contact-level, NO PHI), and the CRM scoped to
  // their OWN assigned leads. They are walled off from the owner's world: the
  // finances, the forecast, the whole portfolio, family governance, the other
  // businesses, and the oversight powers — all DENY, explicitly (a data gate,
  // not just a hidden tab; the DB half is the load-bearing next slice, RLS, the
  // same way `child`/`successor` are role-gated at the row level, DR-0074/0082).
  //
  // The OWNER (leadership / governor) sees DOWN: everything the assistant does,
  // plus the four oversight powers (watch the workflows, review the history to
  // train, coach for quality, delegate the same sight). Leadership sees the
  // level below; the level below never sees up. Same staged, revocable pattern
  // as landlord↔manager and the family successor.
  {
    type: RELATIONSHIP_TYPES.OWNER_ASSISTANT,
    label: 'Owner ↔ Assistant',
    blurb:
      'The business delegation for a working assistant: the owner hands an assistant a ' +
      'scoped set of work surfaces — the referral database + marketing, their own ' +
      'tasks, pre-intake inbound (contact-level, no PHI), and the CRM leads assigned to ' +
      'them — while the finances, forecast, portfolio, family data, and the other ' +
      'businesses stay walled off. The owner sees everything the assistant does and ' +
      'keeps the oversight powers; the assistant never sees up the level.',
    roles: ['owner', 'assistant'],
    steward: 'owner',
  },
]);

export const relationshipByType = Object.fromEntries(RELATIONSHIPS.map((r) => [r.type, r]));

// ---------------------------------------------------------------------------
// CAPABILITY registry. Every can/can't is a named capability with a human label,
// a one-line description, and two flags used by the UI and the safety logic:
//   outbound  — the action leaves the family / reaches a third party.
//   sensitive — money, security, or settings that change the account itself.
// Capabilities are grouped by the relationship they live in.
// ---------------------------------------------------------------------------
export const CAPABILITIES = Object.freeze({
  // ---- guardian<->child / family child capabilities -----------------------
  'learn.read':        { label: 'Learn',                  desc: 'Open the Learn courses and lessons.',              outbound: false, sensitive: false },
  'scripture.read':    { label: 'Scripture',              desc: 'Read Scripture and the study surfaces.',           outbound: false, sensitive: false },
  'game.play':         { label: 'Play the game',          desc: 'Play the in-app game.',                            outbound: false, sensitive: false },
  'voice.listen':      { label: 'Listen / read-aloud',    desc: 'Have content read aloud.',                         outbound: false, sensitive: false },
  'create.make':       { label: 'Create',                 desc: 'Make documents and art in the Create space.',      outbound: false, sensitive: false },
  'message.family':    { label: 'Message family',         desc: 'Send messages to people inside the family.',       outbound: false, sensitive: false },
  'profile.edit':      { label: 'Edit own profile',       desc: 'Change their own display name / avatar.',          outbound: false, sensitive: false },
  'message.outbound':  { label: 'Message outside family', desc: 'Send messages to people outside the family.',      outbound: true,  sensitive: false },
  'share.outbound':    { label: 'Share / post outward',   desc: 'Post or share anything to a place others see.',    outbound: true,  sensitive: false },
  'content.unrated':   { label: 'Unfiltered content',     desc: 'Reach content not vetted as age-appropriate.',     outbound: true,  sensitive: true  },
  'purchase.any':      { label: 'Buy / spend',            desc: 'Purchase or spend money on their own.',            outbound: true,  sensitive: true  },
  'finance.view':      { label: 'See family finances',    desc: 'View the family books, forecast, or accounts.',    outbound: false, sensitive: true  },
  'finance.manage':    { label: 'Work the books',          desc: 'Record, edit, or remove financial transactions.',  outbound: false, sensitive: true  },
  'account.security':  { label: 'Change security',        desc: 'Change PINs, sign-in, or account settings.',       outbound: false, sensitive: true  },

  // ---- landlord<->tenant capabilities -------------------------------------
  'lease.view':        { label: 'See unit + lease',       desc: 'View their own unit/room and lease terms.',        outbound: false, sensitive: false },
  'rent.initiate':     { label: 'Record a rent payment',  desc: 'Record/initiate rent (no money moves in-app).',    outbound: false, sensitive: false },
  'rent.history':      { label: 'See rent history',       desc: 'See their own rent record history.',               outbound: false, sensitive: false },
  'maintenance.submit':{ label: 'Submit a request',       desc: 'Submit a maintenance / repair request.',           outbound: false, sensitive: false },
  'maintenance.track': { label: 'Track own requests',     desc: 'See the status of their own requests.',            outbound: false, sensitive: false },
  'notice.view':       { label: 'See notices',            desc: 'Read notices the landlord posts to them.',         outbound: false, sensitive: false },
  'message.landlord':  { label: 'Message landlord',       desc: 'Message the landlord about their tenancy.',        outbound: false, sensitive: false },
  'rentroll.view':     { label: 'Rent roll',              desc: 'See the rent roll across their properties.',       outbound: false, sensitive: false },
  'maintenance.manage':{ label: 'Manage requests',        desc: 'Receive, triage, and update maintenance requests.',outbound: false, sensitive: false },
  'rent.confirm':      { label: 'Confirm rent received',  desc: 'Mark a rent record received (no money moves).',     outbound: false, sensitive: false },
  'notice.post':       { label: 'Post notices',           desc: 'Post notices to a tenant.',                        outbound: false, sensitive: false },
  'lease.manage':      { label: 'Manage the lease',       desc: 'Create and manage lease terms.',                   outbound: false, sensitive: true  },
  'tenant.contact':    { label: 'See tenant contact',     desc: 'See tenant contact details for their units.',      outbound: false, sensitive: true  },
  'message.tenant':    { label: 'Message tenant',         desc: 'Message a tenant of their property.',              outbound: false, sensitive: false },
  'portfolio.view':    { label: 'See whole portfolio',    desc: 'See the entire property portfolio.',               outbound: false, sensitive: true  },

  // ---- landlord<->manager (1099-delegation) oversight capabilities ---------
  // The four OWNER powers that a 1099 manager runs the business WITHOUT. They are
  // the ceiling on delegation: a manager operates, an owner oversees + hands off.
  'ops.oversight':     { label: 'Watch the workflows',    desc: 'See all workflow activity a manager runs, live.',  outbound: false, sensitive: true  },
  'ops.history':       { label: 'Review message history', desc: 'Review the historical tenant/manager exchanges.',  outbound: false, sensitive: true  },
  'ops.train':         { label: 'Train for quality',      desc: 'Coach a manager on workflow quality from the nuance.', outbound: false, sensitive: false },
  'ops.delegate':      { label: 'Grant access to others', desc: 'Give running/oversight access to family or a 1099 worker.', outbound: false, sensitive: true  },

  // ---- owner<->assistant (business delegation) work surfaces ---------------
  // The scoped set an assistant OPERATES. Each is a work surface, never the
  // owner's finances/portfolio/family data (those stay in the deny set below).
  'referrals.manage':  { label: 'Referral DB + marketing', desc: 'Operate the referral database + marketing/content ops.', outbound: false, sensitive: false },
  'tasks.own':         { label: 'Own tasks / calendar',   desc: 'Manage their own task list and schedule.',          outbound: false, sensitive: false },
  'inbound.contact':   { label: 'Inbound (contact-level)', desc: 'Work pre-intake inbound inquiries — contact-level only, NO PHI.', outbound: false, sensitive: true  },
  'crm.assigned':      { label: 'CRM — assigned leads',   desc: 'See + work only the CRM leads assigned to them (not the whole pipeline).', outbound: false, sensitive: true  },

  // ---- family / governance capabilities -----------------------------------
  'family.shared':     { label: 'Shared family surfaces', desc: 'Use the shared family circle data + surfaces.',     outbound: false, sensitive: false },
  'family.build':      { label: 'Build / steward',        desc: 'Build, configure, and steward the platform.',      outbound: false, sensitive: true  },
  'family.manage':     { label: 'Manage members',         desc: 'Add members and set relationship permissions.',    outbound: false, sensitive: true  },
  'child.configure':   { label: 'Configure a child',      desc: "Set a child's allowed capabilities + approvals.",  outbound: false, sensitive: true  },
});

export const capabilityMeta = (cap) => CAPABILITIES[cap] || null;

// ---------------------------------------------------------------------------
// CHILD capability defaults + the safety ceiling. `default` is the out-of-the-box
// child-safe setting; `maxGrant` is the MOST permissive a guardian may choose.
// When default === maxGrant the row is LOCKED (the guardian cannot loosen it).
// This is the structural child-safety: the guardian configures, but the floor of
// safety is not theirs to remove.
// ---------------------------------------------------------------------------
export const CHILD_CAPABILITY_POLICY = Object.freeze({
  'learn.read':        { default: SETTING.ALLOW,    maxGrant: SETTING.ALLOW },
  'scripture.read':    { default: SETTING.ALLOW,    maxGrant: SETTING.ALLOW },
  'game.play':         { default: SETTING.ALLOW,    maxGrant: SETTING.ALLOW },
  'voice.listen':      { default: SETTING.ALLOW,    maxGrant: SETTING.ALLOW },
  'create.make':       { default: SETTING.ALLOW,    maxGrant: SETTING.ALLOW },
  'profile.edit':      { default: SETTING.APPROVAL, maxGrant: SETTING.ALLOW },
  'message.family':    { default: SETTING.APPROVAL, maxGrant: SETTING.ALLOW },
  // Outbound: a guardian may UP TO approval-gate it, never free-allow it.
  'message.outbound':  { default: SETTING.DENY,     maxGrant: SETTING.APPROVAL },
  'share.outbound':    { default: SETTING.DENY,     maxGrant: SETTING.APPROVAL },
  // Money VISIBILITY is the guardian's decision (DR-0094; Darrell 2026-07-03:
  // "I do want the guardian to make that decision — I want to make sure my
  // kids can see how money actually works, education before they need it").
  // Default stays child-safe DENY (a per-child, deliberate opt-in), but the
  // guardian may raise it to approval-gated or allow. SEEING is not SPENDING:
  // purchase.any below stays locked-deny regardless of this grant.
  'finance.view':      { default: SETTING.DENY,     maxGrant: SETTING.ALLOW },
  // Locked-deny: child-safety floor the guardian cannot remove.
  'content.unrated':   { default: SETTING.DENY,     maxGrant: SETTING.DENY },
  'purchase.any':      { default: SETTING.DENY,     maxGrant: SETTING.DENY },
  'account.security':  { default: SETTING.DENY,     maxGrant: SETTING.DENY },
});

export const CHILD_CAPABILITIES = Object.freeze(Object.keys(CHILD_CAPABILITY_POLICY));

// Is this child capability LOCKED (guardian cannot make it more permissive)?
export const isChildCapabilityLocked = (cap) => {
  const p = CHILD_CAPABILITY_POLICY[cap];
  return !!p && rank(p.default) >= rank(p.maxGrant) && p.maxGrant === p.default;
};

// Resolve a child's effective setting for a capability, given the guardian's
// chosen config (a plain map cap -> setting). Missing => the child-safe default.
// The chosen value is always clamped to the capability's safety ceiling.
export function resolveChildCapability(cap, config = {}) {
  const policy = CHILD_CAPABILITY_POLICY[cap];
  if (!policy) return SETTING.DENY; // unknown capability => deny (no-leak)
  const chosen = Object.prototype.hasOwnProperty.call(config, cap) ? config[cap] : policy.default;
  return clampSetting(chosen, policy.maxGrant);
}

// The full effective child policy (every capability resolved), for the UI + RLS
// payload. Returns cap -> { setting, default, maxGrant, locked, meta }.
export function effectiveChildPolicy(config = {}) {
  const out = {};
  for (const cap of CHILD_CAPABILITIES) {
    const policy = CHILD_CAPABILITY_POLICY[cap];
    out[cap] = {
      setting: resolveChildCapability(cap, config),
      default: policy.default,
      maxGrant: policy.maxGrant,
      locked: isChildCapabilityLocked(cap),
      meta: CAPABILITIES[cap] || null,
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// The MATRIX for the non-child, fixed roles. Each role maps a capability to a
// fixed setting. (Children are NOT in here — their settings come from the policy
// above so a guardian can configure them.) Anything not listed is DENY by
// omission: the model never grants a capability it did not explicitly name.
// ---------------------------------------------------------------------------
const ALLOW = SETTING.ALLOW;
const DENY = SETTING.DENY;

export const MATRIX = Object.freeze({
  [RELATIONSHIP_TYPES.GUARDIAN_CHILD]: {
    guardian: {
      'child.configure': ALLOW,
      'family.manage': ALLOW,
      'finance.view': ALLOW,
    },
    // child: resolved from CHILD_CAPABILITY_POLICY, not a fixed row.
  },
  [RELATIONSHIP_TYPES.FAMILY]: {
    governor: {
      'family.shared': ALLOW,
      'family.build': ALLOW,
      'family.manage': ALLOW,
      'child.configure': ALLOW,
      'finance.view': ALLOW,
      'finance.manage': ALLOW,
    },
    member: {
      'family.shared': ALLOW,
      // Adult family members use the shared circle but do NOT build/steward or
      // manage other members unless promoted to governor.
      'family.build': DENY,
      'family.manage': DENY,
      // A member both SEES and can WORK the books (record/edit transactions).
      'finance.view': ALLOW,
      'finance.manage': ALLOW,
    },
    // SUCCESSOR — the steward-in-training being raised to take over (DR-0111;
    // Darrell 2026-07-06: "we can't expect our heirs to learn how we did… there
    // are new issues that older people want young people to take care of"). The
    // whole point of this role is a STAGED, REVOCABLE middle rung between a
    // member (sees + works the books) and a child (walled out): the successor
    // SEES the real books so they learn on the family's actual numbers, but
    // finance.manage is DENY so a read never becomes an accidental write. Read,
    // don't wreck. Deepening this to write access is a deliberate promotion to
    // member/governor, never automatic. (RLS enforcement of the read-only cut
    // is the next verified slice — see DR-0111 "Not done, with why".)
    successor: {
      'family.shared': ALLOW,
      'finance.view': ALLOW,
      'finance.manage': DENY,
      'family.build': DENY,
      'family.manage': DENY,
    },
    // child: resolved from CHILD_CAPABILITY_POLICY.
  },
  [RELATIONSHIP_TYPES.LANDLORD_TENANT]: {
    tenant: {
      'lease.view': ALLOW,
      'rent.initiate': ALLOW,
      'rent.history': ALLOW,
      'maintenance.submit': ALLOW,
      'maintenance.track': ALLOW,
      'notice.view': ALLOW,
      'message.landlord': ALLOW,
      // A tenant never sees the portfolio or manages the lease/other tenants.
      'portfolio.view': DENY,
      'lease.manage': DENY,
      'rentroll.view': DENY,
    },
    landlord: {
      'rentroll.view': ALLOW,
      'maintenance.manage': ALLOW,
      'rent.confirm': ALLOW,
      'notice.post': ALLOW,
      'lease.manage': ALLOW,
      'tenant.contact': ALLOW,
      'message.tenant': ALLOW,
      'portfolio.view': ALLOW,
    },
  },
  // LANDLORD ↔ MANAGER — the 1099-delegation matrix. The manager RUNS the full
  // operating set; the owner keeps that whole set AND the four oversight powers.
  // The delta between the two rows IS the delegation ceiling: watch / review-
  // history / train / delegate are the owner's alone. Explicit DENY rows (not
  // omission) so the matrix visibly SHOWS the manager "Not allowed" on the four,
  // the same way the tenant row visibly shows the portfolio walled off.
  [RELATIONSHIP_TYPES.LANDLORD_MANAGER]: {
    manager: {
      // Runs the business day-to-day — the full landlord operating set.
      'rentroll.view': ALLOW,
      'maintenance.manage': ALLOW,
      'rent.confirm': ALLOW,
      'notice.post': ALLOW,
      'lease.manage': ALLOW,
      'tenant.contact': ALLOW,
      'message.tenant': ALLOW,
      'portfolio.view': ALLOW,
      // …but never owns it. A 1099 worker cannot watch-over as an owner, mine the
      // whole history to train, coach another manager, or hand access to anyone.
      'ops.oversight': DENY,
      'ops.history': DENY,
      'ops.train': DENY,
      'ops.delegate': DENY,
    },
    landlord: {
      // The owner can still do everything the manager does — "with or without them."
      'rentroll.view': ALLOW,
      'maintenance.manage': ALLOW,
      'rent.confirm': ALLOW,
      'notice.post': ALLOW,
      'lease.manage': ALLOW,
      'tenant.contact': ALLOW,
      'message.tenant': ALLOW,
      'portfolio.view': ALLOW,
      // …plus the four oversight powers that make delegation safe and trainable.
      'ops.oversight': ALLOW,
      'ops.history': ALLOW,
      'ops.train': ALLOW,
      'ops.delegate': ALLOW,
    },
  },
  // OWNER ↔ ASSISTANT — the business delegation. The delta between the two rows
  // IS the level boundary Darrell asked for: the assistant OPERATES four scoped
  // work surfaces; the owner's finances, portfolio, family governance, and the
  // oversight powers are the assistant's explicit DENY set (a visible wall, the
  // same way the tenant row shows the portfolio walled off). The owner sees
  // everything the assistant does + keeps oversight — leadership sees down, the
  // level below never sees up.
  [RELATIONSHIP_TYPES.OWNER_ASSISTANT]: {
    assistant: {
      // The scoped work surfaces the assistant runs.
      'referrals.manage': ALLOW,
      'tasks.own': ALLOW,
      'inbound.contact': ALLOW,
      'crm.assigned': ALLOW,
      // …and the WALL: the owner's world is denied, explicitly (not by omission),
      // so the matrix visibly shows "Not allowed" on each — and the RLS half
      // (the load-bearing data gate) mirrors exactly this set.
      'finance.view': DENY,
      'finance.manage': DENY,
      'portfolio.view': DENY,
      'family.build': DENY,
      'family.manage': DENY,
      'ops.oversight': DENY,
      'ops.history': DENY,
      'ops.train': DENY,
      'ops.delegate': DENY,
    },
    owner: {
      // The owner sees everything the assistant does…
      'referrals.manage': ALLOW,
      'tasks.own': ALLOW,
      'inbound.contact': ALLOW,
      'crm.assigned': ALLOW,
      // …can see the finances the assistant cannot…
      'finance.view': ALLOW,
      'portfolio.view': ALLOW,
      // …and keeps the four oversight powers over the assistant's work.
      'ops.oversight': ALLOW,
      'ops.history': ALLOW,
      'ops.train': ALLOW,
      'ops.delegate': ALLOW,
    },
  },
});

// ---------------------------------------------------------------------------
// The predicates. `decide()` is the one entry point; `can()` / `requiresApproval()`
// are thin reads of it. For child roles the config is consulted; for fixed roles
// the matrix is. Unknown type/role/capability => safe deny.
// ---------------------------------------------------------------------------
const isChildRole = (role) => role === 'child';

export function decide({ relationship, role, capability, childConfig = {} } = {}) {
  const meta = CAPABILITIES[capability] || null;
  const fail = (reason) => ({ allowed: false, requiresApproval: false, setting: DENY, reason, meta });

  if (!relationshipByType[relationship]) return fail(`unknown relationship "${relationship}"`);
  const rel = relationshipByType[relationship];
  if (!rel.roles.includes(role)) return fail(`role "${role}" is not part of ${relationship}`);
  if (!meta) return fail(`unknown capability "${capability}"`);

  let setting;
  let configurable = false;
  if (isChildRole(role)) {
    if (!CHILD_CAPABILITY_POLICY[capability]) {
      return fail(`"${capability}" is not a capability a child can hold`);
    }
    setting = resolveChildCapability(capability, childConfig);
    configurable = !isChildCapabilityLocked(capability);
  } else {
    const row = (MATRIX[relationship] && MATRIX[relationship][role]) || {};
    setting = row[capability] || DENY;
  }

  return {
    allowed: setting === ALLOW,
    requiresApproval: setting === SETTING.APPROVAL,
    setting,
    configurable,
    reason:
      setting === ALLOW
        ? 'granted by the relationship'
        : setting === SETTING.APPROVAL
        ? 'allowed only with steward approval'
        : 'not granted by this relationship',
    meta,
  };
}

export function can(relationship, role, capability, childConfig = {}) {
  return decide({ relationship, role, capability, childConfig }).allowed;
}

export function requiresApproval(relationship, role, capability, childConfig = {}) {
  return decide({ relationship, role, capability, childConfig }).requiresApproval;
}

// ---------------------------------------------------------------------------
// The can/can't MATRIX as data, for the surface + the help system. One row per
// (relationship, role, capability) with the resolved verdict. `childConfig` lets
// the surface preview a guardian's pending configuration.
// ---------------------------------------------------------------------------
export function capabilitiesFor(relationship, role) {
  const rel = relationshipByType[relationship];
  if (!rel || !rel.roles.includes(role)) return [];
  if (isChildRole(role)) return CHILD_CAPABILITIES.slice();
  return Object.keys((MATRIX[relationship] && MATRIX[relationship][role]) || {});
}

export function buildMatrix(childConfig = {}) {
  const rows = [];
  for (const rel of RELATIONSHIPS) {
    for (const role of rel.roles) {
      for (const cap of capabilitiesFor(rel.type, role)) {
        const d = decide({ relationship: rel.type, role, capability: cap, childConfig });
        rows.push({
          relationship: rel.type,
          relationshipLabel: rel.label,
          role,
          capability: cap,
          label: d.meta?.label || cap,
          setting: d.setting,
          allowed: d.allowed,
          requiresApproval: d.requiresApproval,
          configurable: !!d.configurable,
          outbound: !!d.meta?.outbound,
          sensitive: !!d.meta?.sensitive,
        });
      }
    }
  }
  return rows;
}
