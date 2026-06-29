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
});

export const RELATIONSHIPS = Object.freeze([
  {
    type: RELATIONSHIP_TYPES.GUARDIAN_CHILD,
    label: 'Guardian ↔ Child',
    blurb:
      'A guardian (Darrell / Christina) sets exactly what a child account can do. ' +
      'Child-safe by default; outbound and sensitive actions are guardian-approval-gated; ' +
      'spending and family finances are locked off and cannot be granted.',
    roles: ['guardian', 'child'],
    steward: 'guardian', // the side that CONFIGURES the other's access
  },
  {
    type: RELATIONSHIP_TYPES.FAMILY,
    label: 'Family circle',
    blurb:
      'Family members share family-scoped surfaces by their role. Governors build and ' +
      'steward; members use the shared family circle; children see only their child-safe slice.',
    roles: ['governor', 'member', 'child'],
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
  // Locked-deny: child-safety floor the guardian cannot remove.
  'content.unrated':   { default: SETTING.DENY,     maxGrant: SETTING.DENY },
  'purchase.any':      { default: SETTING.DENY,     maxGrant: SETTING.DENY },
  'finance.view':      { default: SETTING.DENY,     maxGrant: SETTING.DENY },
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
    },
    member: {
      'family.shared': ALLOW,
      // Adult family members use the shared circle but do NOT build/steward or
      // manage other members unless promoted to governor.
      'family.build': DENY,
      'family.manage': DENY,
      'finance.view': ALLOW,
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
