-- =============================================================================
-- 0129 — accounts carry the debt declaration (treat_as_debt / min_payment / rate)
-- =============================================================================
-- Darrell 2026-08-04, from the Debts-tab screenshots: "Our debts don't work
-- correctly and these won't stick."
--
-- ROOT CAUSE (verified against the live rows): the "Add as debt" / "Treat as
-- debt" flows write treatAsDebt + minPayment + rate on the LOCAL account, but
-- the accounts table has no columns for them — accounts-sync.js toRow/fromRow
-- silently dropped all three, so the first cloud refetch erased the debt
-- declaration and the Debts row vanished ("won't stick"). Meanwhile the
-- suggestion panel's dedupe missed the added card (fixed app-side in
-- lib/debt-payments.js), so every re-tap uploaded ANOTHER bare $0 credit
-- account: 24 stray rows accumulated across 2026-07-23 / 07-31 / 08-04.
--
-- This migration:
--   1. Adds the three columns the debt declaration needs to survive sync.
--   2. Consolidates the stray duplicates: within each (instance, entity,
--      display name) group of hand-added, zero-balance, transaction-less
--      credit accounts (slug 'a-<epoch>' — the addAccount id pattern; imported
--      and seeded accounts use word slugs and are untouched), keep the
--      EARLIEST row and delete the rest. Verified before writing: zero
--      transactions reference any row in this class (guarded again below).
--   3. Marks the kept row treat_as_debt = true — that is exactly what every
--      one of those taps was declaring. min_payment stays 0 here: the app now
--      derives the observed payment pace live from the ledger (measured,
--      DR-0076), and the minimum is an editable field that now persists.
--
-- DEPENDS ON: schema-v1.2 (accounts). IDEMPOTENT: additive ADD COLUMN IF NOT
-- EXISTS; the consolidation is a no-op once duplicates are gone. Safe to re-run.
-- =============================================================================

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS treat_as_debt boolean NOT NULL DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS min_payment  numeric NOT NULL DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS rate         numeric NOT NULL DEFAULT 0;

-- The stray class: hand-added (epoch slug), zero-balance credit accounts with
-- no ledger rows. Keep the earliest per (instance, entity, name); delete the
-- rest of the class; the kept row carries the declaration the taps meant.
WITH strays AS (
  SELECT a.id, a.instance_id, a.entity_slug, lower(trim(a.display_name)) AS name_key, a.created_at
  FROM public.accounts a
  WHERE a.account_type = 'credit'
    AND a.balance = 0
    AND a.slug ~ '^a-[0-9]+$'
    AND NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.account_id = a.id OR t.account_slug = a.slug
    )
),
keepers AS (
  SELECT DISTINCT ON (instance_id, entity_slug, name_key) id
  FROM strays
  ORDER BY instance_id, entity_slug, name_key, created_at ASC
),
doomed AS (
  SELECT id FROM strays WHERE id NOT IN (SELECT id FROM keepers)
)
DELETE FROM public.accounts WHERE id IN (SELECT id FROM doomed);

UPDATE public.accounts a
SET treat_as_debt = true
WHERE a.account_type = 'credit'
  AND a.balance = 0
  AND a.slug ~ '^a-[0-9]+$'
  AND a.treat_as_debt = false
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.account_id = a.id OR t.account_slug = a.slug
  );
