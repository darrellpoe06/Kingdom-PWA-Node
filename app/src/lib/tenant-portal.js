// =============================================================================
// tenant-portal.js — the landlord <-> tenant workflows (pure logic)
// =============================================================================
// The rentals already model the LANDLORD side (rentals table, rent roll, units).
// This adds the TENANT side of the same relationship and the four workflows that
// run between them, as pure, testable state — the surface (Relationships.jsx) and
// the DB (migration 0055) carry it; this file is the rules.
//
//   1. MAINTENANCE / repair request  — tenant submits, landlord triages.
//   2. RENT record                   — tenant INITIATES, landlord CONFIRMS.
//   3. NOTICE                        — landlord posts, tenant reads.
//   4. MESSAGE                       — two-way thread scoped to the tenancy.
//
// MONEY IS NEVER EXECUTED HERE. A rent record is a shared ledger of what the two
// humans did out-of-band: the tenant pays through the owner's processor / the
// owner's hand, then records "I paid"; the landlord confirms "received." The app
// moves no money and holds no card. `rent.initiate` / `rent.confirm` are the only
// rent verbs, and both are record-keeping. This is the binding constraint from
// the task and from DATA-AS-EMPOWERMENT-NOT-EXTRACTION.
//
// NO-LEAK is enforced in two places: the DB RLS (a tenant row is visible only to
// that tenant + the property's instance), and here, where `tenantView()` /
// `landlordView()` derive exactly the slice each side is allowed to see. A tenant
// sees their unit, never the portfolio.
//
// PURE: no I/O, no React, no Supabase. The caller supplies rows + a clock.
// =============================================================================

import { can, RELATIONSHIP_TYPES } from './relationships.js';

const REL = RELATIONSHIP_TYPES.LANDLORD_TENANT;

// ---------------------------------------------------------------------------
// Lifecycles. Maintenance and rent each have a small, explicit state machine so
// status is never a free-text guess and an illegal transition can't be saved.
// ---------------------------------------------------------------------------
export const MAINTENANCE_STATUS = Object.freeze([
  'submitted', // tenant filed it
  'received',  // landlord has seen it
  'scheduled', // a fix is planned
  'in-progress',
  'resolved',  // done
  'declined',  // landlord won't act (with a reason)
  'cancelled', // tenant withdrew it
]);

export const MAINTENANCE_TRANSITIONS = Object.freeze({
  submitted: ['received', 'cancelled'],
  received: ['scheduled', 'in-progress', 'resolved', 'declined'],
  scheduled: ['in-progress', 'resolved', 'declined'],
  'in-progress': ['resolved', 'declined'],
  resolved: [],
  declined: [],
  cancelled: [],
});

export const RENT_STATUS = Object.freeze([
  'reported',  // tenant recorded that they paid (via the owner's processor/hand)
  'confirmed', // landlord confirmed receipt
  'disputed',  // amounts/dates don't match — needs a human conversation
  'void',      // recorded in error
]);

export const RENT_TRANSITIONS = Object.freeze({
  reported: ['confirmed', 'disputed', 'void'],
  confirmed: ['disputed'],
  disputed: ['confirmed', 'void'],
  void: [],
});

export const PRIORITY = Object.freeze(['low', 'normal', 'high', 'urgent']);

export function canTransition(machine, from, to) {
  const table = machine === 'rent' ? RENT_TRANSITIONS : MAINTENANCE_TRANSITIONS;
  return Array.isArray(table[from]) && table[from].includes(to);
}

// ---------------------------------------------------------------------------
// Builders. Each returns a plain row ready to persist. `actorRole` is checked
// against the relationship model so a side can only create what it is allowed to.
// `clock` is an injected ISO string (no Date.now() — keeps this pure/testable).
// ---------------------------------------------------------------------------
const clean = (s, cap = 2000) => String(s ?? '').trim().slice(0, cap);

export function buildMaintenanceRequest(form = {}, clock) {
  if (!can(REL, 'tenant', 'maintenance.submit')) {
    throw new Error('tenant role cannot submit maintenance');
  }
  const title = clean(form.title, 160);
  if (!title) throw new Error('a maintenance request needs a short title');
  return {
    tenancy_id: form.tenancyId || null,
    title,
    detail: clean(form.detail, 4000),
    area: clean(form.area, 80), // kitchen / bathroom / HVAC ...
    priority: PRIORITY.includes(form.priority) ? form.priority : 'normal',
    status: 'submitted',
    created_at: clock || null,
    created_by_role: 'tenant',
  };
}

// A tenant RECORDS a rent payment. No money moves — `method` describes how the
// human paid out-of-band (the owner's processor, a check, cash to the owner).
export function buildRentRecord(form = {}, clock) {
  if (!can(REL, 'tenant', 'rent.initiate')) {
    throw new Error('tenant role cannot record rent');
  }
  const amount = Number(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('rent amount must be a positive number');
  return {
    tenancy_id: form.tenancyId || null,
    amount,
    for_period: clean(form.forPeriod, 40), // e.g. '2026-07'
    method: clean(form.method, 60) || 'owner-processor',
    memo: clean(form.memo, 500),
    status: 'reported', // recorded only; the owner confirms receipt
    reported_at: clock || null,
    // Explicit, machine-readable proof that the system did not move money.
    money_moved_in_app: false,
  };
}

export function buildNotice(form = {}, clock) {
  if (!can(REL, 'landlord', 'notice.post')) {
    throw new Error('only the landlord posts notices');
  }
  const title = clean(form.title, 160);
  if (!title) throw new Error('a notice needs a title');
  return {
    tenancy_id: form.tenancyId || null,
    title,
    body: clean(form.body, 4000),
    kind: clean(form.kind, 40) || 'general', // general / lease / inspection / payment
    posted_at: clock || null,
    created_by_role: 'landlord',
  };
}

export function buildMessage(form = {}, clock) {
  const role = form.fromRole === 'landlord' ? 'landlord' : 'tenant';
  const cap = role === 'landlord' ? 'message.tenant' : 'message.landlord';
  if (!can(REL, role, cap)) throw new Error(`${role} cannot message on this tenancy`);
  const body = clean(form.body, 4000);
  if (!body) throw new Error('a message needs a body');
  return {
    tenancy_id: form.tenancyId || null,
    body,
    from_role: role,
    sent_at: clock || null,
  };
}

// ---------------------------------------------------------------------------
// Views. The no-leak slice each side is allowed to see, derived from raw rows.
// ---------------------------------------------------------------------------

// What a tenant sees: ONLY their own tenancy's rows. The caller passes the
// tenant's tenancy id; anything not matching is dropped (defense in depth — RLS
// already filters, this guarantees the UI can't render a stray row).
export function tenantView(tenancyId, { tenancy = null, maintenance = [], rent = [], notices = [], messages = [] } = {}) {
  const mine = (r) => r && r.tenancy_id === tenancyId;
  return {
    tenancy: tenancy && tenancy.id === tenancyId ? tenancy : null,
    maintenance: maintenance.filter(mine),
    rent: rent.filter(mine),
    notices: notices.filter(mine),
    messages: messages.filter(mine),
    // The tenant CANNOT see the portfolio — assert it for the UI/help.
    canSeePortfolio: can(REL, 'tenant', 'portfolio.view'),
  };
}

// What a landlord sees: the rent roll + open requests across THEIR tenancies.
// `tenancies` is the set the landlord's instance owns (RLS already scoped them).
export function landlordView({ tenancies = [], maintenance = [], rent = [], notices = [] } = {}) {
  const open = maintenance.filter((m) => !['resolved', 'declined', 'cancelled'].includes(m.status));
  const byTenancy = (id) => ({
    tenancy: tenancies.find((t) => t.id === id) || null,
    openRequests: open.filter((m) => m.tenancy_id === id).length,
    lastRent: rent
      .filter((r) => r.tenancy_id === id)
      .sort((a, b) => String(b.reported_at || '').localeCompare(String(a.reported_at || '')))[0] || null,
  });
  return {
    rentRoll: tenancies.map((t) => byTenancy(t.id)),
    openRequests: open,
    notices,
    reportedUnconfirmed: rent.filter((r) => r.status === 'reported'),
    doorCount: tenancies.length,
  };
}

// One-line summary the surface + help can show for the relationship.
export function rentSafetyNote() {
  return 'PoeTech records rent; it never moves money. The tenant pays through the ' +
    "owner's processor or hand, then records it here, and the owner confirms receipt.";
}
