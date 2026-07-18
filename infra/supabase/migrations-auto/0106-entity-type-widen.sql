-- =============================================================================
-- 0106 — widen entity_type to the full set the UI already offers
-- =============================================================================
-- Review finding (2026-07-18): the entities table CHECK only allowed
-- ('personal','business'), so entities-sync.js had to flatten every other type
-- to 'personal' on upload. A family member who correctly set an entity to
-- 'nonprofit' / 'trust' / 'joint' / 'other' silently lost that tax classification
-- on the next sync — silent data loss on a tax-relevant field. The UI has offered
-- all six types the whole time (BooksEntities.jsx ENTITY_TYPES).
--
-- Widen the CHECK to the six the UI offers, and let the sync pass the real type
-- through. Widening a CHECK never rejects existing rows (they are all personal/
-- business), so this is safe + additive. Idempotent: DROP IF EXISTS then ADD, so
-- a re-run ends with exactly the new constraint.
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_entity_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_entity_type_check
  CHECK (entity_type IN ('personal','business','nonprofit','trust','joint','other'));
