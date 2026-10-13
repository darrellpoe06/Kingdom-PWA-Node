-- =============================================================================
-- 0134 — accounts carry "leave alone" and the deliberate rate override
-- =============================================================================
-- Christina 2026-08-10, after seeing the card list land on the Debts tab: "I
-- need to be able to edit each line that is input or each line that is there in
-- general, manually."
--
-- Editing every field on a debt row needs two flags that had nowhere to live:
--
--   1. leave_alone — the Debts tab already RENDERS a "Leave alone" badge, sorts
--      those rows last, and excludes them from the totals and the snowball
--      (deriveDebts / projectDebtSnowball). For an account-backed debt the flag
--      was hardcoded false, so the badge could never appear and the family had
--      no way to park a card they are deliberately not attacking — a settled
--      charge-off, a closed account in a payment plan. The behaviour existed;
--      only the switch was missing.
--
--   2. rate_overridden — the rate a card's OWN statement interest implies is
--      authoritative by default and must not be silently undermined (the
--      standing rule from 2026-07-20). But "authoritative" was implemented as
--      "not editable at all", which left a real line on the tab that nobody
--      could correct — visible in Christina's screenshot as the Chase line of
--      credit at 17.44% with no edit affordance. This flag makes a correction
--      EXPLICIT rather than impossible: the derived figure is still computed
--      and still shown beside the override, the row is marked, and reverting to
--      the data is one tap. The data keeps its authority; the person is no
--      longer locked out of their own number.
--
-- DEPENDS ON: 0129, 0133 (accounts debt-declaration + card-terms columns).
-- IDEMPOTENT: additive ADD COLUMN IF NOT EXISTS only; no data is rewritten.
-- Both default FALSE, so every existing row keeps exactly today's behaviour —
-- no account silently becomes parked, and no rate silently stops tracking the
-- statements. Each flag turns true only where a person sets it.
-- =============================================================================

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS leave_alone     boolean NOT NULL DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS rate_overridden boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.accounts.leave_alone IS
  'TRUE = deliberately parked: shown on Debts with a badge, sorted last, and excluded from the totals and the snowball.';
COMMENT ON COLUMN public.accounts.rate_overridden IS
  'TRUE = a person deliberately replaced the statement-derived rate. The derived figure is still computed and shown beside it; reverting clears this flag.';
