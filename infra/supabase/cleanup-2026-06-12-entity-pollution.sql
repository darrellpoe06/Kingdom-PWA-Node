-- =============================================================================
-- 2026-06-12 cleanup — entity pollution (demo rows + duplicates) in `entities`
-- =============================================================================
-- What happened: builds from before the demo/provenance filters uploaded
-- demo-persona entities ("Maya (mom)", "Jordan (dad)", "Shared - for Avery",
-- "The Reeves Family") and double-uploaded some real entities (one row with
-- a slug, one without). Cloud rows wear new UUIDs / null slugs, so the
-- client's id-based filters can never catch them — the app now also filters
-- by demo NAME and collapses duplicates for display, but the table itself
-- must be cleaned here (the entities RLS has no DELETE policy, so the app
-- cannot do it; Studio runs as service role and can).
--
-- Run section by section in the cloud Studio SQL Editor. LOOK at the
-- inspect output before each DELETE. Deletes are name-targeted; your real
-- entities are never matched.

-- 0) INSPECT — see everything first.
SELECT id, slug, display_name, entity_type, created_at
FROM entities
ORDER BY lower(display_name), created_at;

-- 1) Demo-persona entities OUT (names are unmistakable; '%' dodges the
--    unicode separator in "Shared - for Avery").
DELETE FROM entities
WHERE display_name IN ('Maya (mom)', 'Jordan (dad)', 'The Reeves Family', 'The Reynolds household', 'Sam (personal)')
   OR display_name LIKE 'Shared%for Avery';

-- 2) Duplicates: for each (instance, name), keep the best row — a slugged
--    row beats a null-slug row (FK references point at slugs); ties keep
--    the earliest created.
DELETE FROM entities e
USING entities k
WHERE e.instance_id = k.instance_id
  AND lower(e.display_name) = lower(k.display_name)
  AND e.id <> k.id
  AND (
        (k.slug IS NOT NULL AND e.slug IS NULL)
     OR ((k.slug IS NULL) = (e.slug IS NULL) AND e.created_at > k.created_at)
     OR ((k.slug IS NULL) = (e.slug IS NULL) AND e.created_at = k.created_at AND e.id > k.id)
  );

-- 3) Never again: one display name per instance, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS entities_instance_name_uidx
  ON entities (instance_id, lower(display_name));

-- 4) VERIFY — should be exactly your real entities, once each:
--    Personal (Darrell + Christina), Poe Properties LLC, PoeTech LLC,
--    TLC Therapy Solutions LLC.
SELECT id, slug, display_name, entity_type, created_at
FROM entities
ORDER BY lower(display_name), created_at;
