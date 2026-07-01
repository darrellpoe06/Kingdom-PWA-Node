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
