// property-manager-access.js
// Pure, dependency-free helpers for the Property-Manager (external 1099) role.
//
// This module is the source of truth for the PRE-GRANT PREVIEW: what a scoped
// Property Manager WILL and WILL NOT be able to see, shown to the owner
// (Christina/Darrell) BEFORE they create the account or grant any assignment.
//
// It is descriptive only — the actual enforcement is RLS in
// infra/supabase/proposed/property-manager-scoped-role.sql. Keep the two lists
// in sync with that migration. See docs/00-foundations/PROPERTY-MANAGER-ROLE-ONBOARDING.md.

// The management surfaces a PM can reach, scoped to ASSIGNED units only.
export const PM_SURFACES_ALLOWED = [
  'Assigned properties/units (address, unit, type, occupancy status)',
  'Maintenance & service requests for assigned units (view + update + log new)',
  'Tenant contact for assigned units (name, phone, email, emergency contact)',
  'Message threads with tenant/owner for assigned units',
];

// Everything a PM can NEVER reach. This is enforced as default-DENY (she is
// an external user, a member of no instance) — listed here for the preview so
// the owner sees the hard boundary explicitly.
export const PM_SURFACES_DENIED = [
  'Family finances & Books (accounts, transactions, debts, budgets)',
  'Owner property financials (purchase price, mortgage, market value, taxes, insurance)',
  'Rent amounts, rent payments, and leases',
  'Any property NOT assigned to her (same owner)',
  'Any other owner’s or other business’s data',
  'Personal / non-rental properties and any non-rental surface',
];

// Normalize a rental record to the preview shape (management columns only).
// Accepts either the app’s local rental object or a pm_property_view row.
export function toPmUnitPreview(rental = {}) {
  return {
    id: rental.id ?? rental.rental_id ?? null,
    label:
      rental.display_name ||
      rental.displayName ||
      [rental.address, rental.unit].filter(Boolean).join(' ') ||
      rental.address ||
      '(unnamed unit)',
    status: rental.status ?? null,
  };
}

// Build the full pre-grant preview for a set of to-be-assigned rentals.
// `selectedRentals` = the rows the owner picked in the assignment control.
// Returns exactly what to render before the trigger is pulled.
export function buildPmAccessPreview(selectedRentals = []) {
  const units = (Array.isArray(selectedRentals) ? selectedRentals : [])
    .map(toPmUnitPreview)
    .filter((u) => u.id);
  return {
    assignedUnitCount: units.length,
    willSee: {
      units,
      surfaces: PM_SURFACES_ALLOWED,
    },
    willNotSee: PM_SURFACES_DENIED,
    // Guardrail reminder surfaced in the UI: the grant is the owner’s action.
    grantIsOwnerAction: true,
    note:
      units.length === 0
        ? 'Select at least one property to assign before inviting a property manager.'
        : `This property manager will be able to manage ${units.length} assigned ` +
          `unit(s) and nothing else. Finances and all other data stay private.`,
  };
}

// ---------------------------------------------------------------------
// GENERAL role framework (configured roles — property, project, learner, ...).
// One primitive; a role differs only by its SCOPE + which threads it joins.
// See infra/supabase/proposed/role-framework-and-threads.sql.
// ---------------------------------------------------------------------

// Per-role config: the human label, what a scope item is called, the SEE list,
// and the participate-in-threads note. Add a role = add a row here (config).
export const ROLE_FRAMEWORK = {
  'property-manager': {
    label: 'Property Manager (1099)',
    workerClass: '1099-contractor',
    scopeKind: 'property',
    scopeNoun: 'property/unit',
    surfaces: PM_SURFACES_ALLOWED,
    threads: 'Discuss directly with the tenants on assigned units.',
  },
  'project-manager': {
    label: 'Project Manager (1099)',
    workerClass: '1099-contractor',
    scopeKind: 'project',
    scopeNoun: 'project/board',
    surfaces: [
      'Assigned projects/boards and their items (view + update status/notes)',
      'Message threads with the owner/stakeholders for assigned projects',
    ],
    threads: 'Discuss directly with the owner/stakeholders on assigned projects.',
  },
  learner: {
    label: 'Next-Gen Steward (learner)',
    workerClass: 'learner',
    scopeKind: 'property', // or 'project'; guardian curates
    scopeNoun: 'guardian-curated item',
    surfaces: [
      'A curated, read-only view of what the family manages and plans (guardian chooses)',
      'Guided explanations that teach the how-and-why of management (read-oriented)',
    ],
    threads: 'Read-only; no direct messaging (learning view).',
    readOnly: true,
  },
};

// What EVERY configured worker/learner role can never reach — the hard boundary.
export const ROLE_DENIED_ALWAYS = [
  'Finances & Books (accounts, transactions, debts, budgets)',
  'Anything outside their assigned scope',
  'Any other worker’s scope, any other owner’s / other org’s data (no-leak)',
  'Personal / family data not explicitly in their scope',
];

// Owner-facing pre-grant preview for ANY role. `selectedScopeItems` = the
// entities (units, boards, ...) the owner picked, each {id, label, status?}.
export function buildWorkerAccessPreview(roleKey, selectedScopeItems = []) {
  const cfg = ROLE_FRAMEWORK[roleKey] || ROLE_FRAMEWORK['property-manager'];
  const items = (Array.isArray(selectedScopeItems) ? selectedScopeItems : [])
    .map((it) => ({ id: it.id ?? it.rental_id ?? it.board_slug ?? null, label: it.label || it.display_name || it.board_title || String(it.id ?? ''), status: it.status ?? null }))
    .filter((it) => it.id);
  return {
    roleKey,
    roleLabel: cfg.label,
    scopeKind: cfg.scopeKind,
    assignedCount: items.length,
    readOnly: !!cfg.readOnly,
    willSee: { items, surfaces: cfg.surfaces, threads: cfg.threads },
    willNotSee: ROLE_DENIED_ALWAYS,
    grantIsOwnerAction: true,
    note:
      items.length === 0
        ? `Select at least one ${cfg.scopeNoun} to assign before inviting.`
        : `${cfg.label} will be able to work ${items.length} assigned ${cfg.scopeNoun}(s) ` +
          `and nothing else. Finances and everything outside scope stay private.`,
  };
}

// INVITEE WELCOME (self-explaining, two-tier). Shown to the 1099 worker on
// first sign-in so they land in a clear scoped workspace, not a blank app.
export function buildInviteeWelcome(roleKey, assignedItems = []) {
  const cfg = ROLE_FRAMEWORK[roleKey] || ROLE_FRAMEWORK['property-manager'];
  const items = (Array.isArray(assignedItems) ? assignedItems : []).map(
    (it) => it.label || it.display_name || it.board_title || String(it.id ?? '')
  );
  return {
    title: `Welcome — you're set up as a ${cfg.label}`,
    // Tier 1: the one-line plain statement.
    summary:
      `You have access to ${items.length} assigned ${cfg.scopeNoun}(s). ` +
      `You can ${cfg.readOnly ? 'view' : 'view and update'} them and ` +
      `${cfg.readOnly ? 'read' : 'message directly in'} their threads.`,
    // Tier 2: the "learn more" expansion.
    youCan: cfg.surfaces,
    youCannot: ROLE_DENIED_ALWAYS,
    assigned: items,
    footer:
      'Your access is scoped by the owner and can change. Reach out if you need a ' +
      'property or project you don’t see.',
  };
}
