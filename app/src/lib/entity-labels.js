// =============================================================================
// entity-labels — which of the family's three money worlds a record belongs to
// (Christina, 2026-11-03): PERSONAL, POE PROPERTIES, TLC THERAPY SOLUTIONS.
// =============================================================================
// "The payment account and the entity responsible for the expense are two
// different things." So a record's entity is ONLY its own `entityId` — never
// read off the account that paid it. A record with no entityId is NEEDS REVIEW,
// never quietly Personal.
//
// The kind is matched by the family's entity ids (e-personal / e-poeprops /
// e-tlc) first, then by name, so a renamed entity keeps its label. Any other
// entity (PoeTech, a future LLC) keeps its own name; nothing is dropped.
//
// Pure leaf module: no React, no storage.
// =============================================================================

export const ENTITY_KINDS = [
  { id: 'personal', icon: '🏠', label: 'PERSONAL' },
  { id: 'poe', icon: '🏘️', label: 'POE PROPERTIES' },
  { id: 'tlc', icon: '💼', label: 'TLC THERAPY' },
];
export const NEEDS_REVIEW = { id: 'review', icon: '⚠️', label: 'NEEDS REVIEW' };

// TLC Therapy Solutions spending, told apart (Christina 2026-11-03).
export const TLC_KINDS = [
  ['operating', 'Business operating expense'],
  ['therapist-pay', 'Therapist compensation'],
  ['business-debt', 'Business debt'],
];
export const TLC_KIND_LABEL = Object.fromEntries(TLC_KINDS);

const isPersonalType = (e) => !e.type || e.type === 'personal' || e.type === 'joint';

export function entityKind(e) {
  if (!e) return null;
  const name = String(e.name || '').toLowerCase();
  if (e.id === 'e-poeprops' || /poe propert/.test(name)) return 'poe';
  if (e.id === 'e-tlc' || /\btlc\b|therapy solutions/.test(name)) return 'tlc';
  if (e.id === 'e-personal' || isPersonalType(e)) return 'personal';
  return 'other';
}

// The chip for one record: { kind, icon, label, entityId }.
export function entityLabel(entities = [], entityId) {
  if (entityId == null || entityId === '') return { ...NEEDS_REVIEW, kind: 'review', entityId: null };
  const e = (entities || []).find((x) => x && x.id === entityId);
  if (!e) return { ...NEEDS_REVIEW, kind: 'review', entityId };
  const kind = entityKind(e);
  const k = ENTITY_KINDS.find((x) => x.id === kind);
  return k ? { ...k, kind, entityId } : { id: 'other', icon: '🏢', label: String(e.name || 'Other').toUpperCase(), kind: 'other', entityId };
}

// The entity a filter chip stands for, so "POE PROPERTIES" finds e-poeprops.
export function entitiesOfKind(entities = [], kind) {
  return (entities || []).filter((e) => e && entityKind(e) === kind).map((e) => e.id);
}
