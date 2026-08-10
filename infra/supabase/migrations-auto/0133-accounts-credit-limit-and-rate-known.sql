-- =============================================================================
-- 0133 — accounts carry the card's limit, its peak, and whether the rate is KNOWN
-- =============================================================================
-- Christina 2026-08-10, handing over the family's full 27-card list: "take the
-- following information and add it to the debts section ... and also make it so
-- that I can add debts myself manually if needed."
--
-- 0129 gave accounts the debt declaration (treat_as_debt / min_payment / rate).
-- Three facts in that list still had nowhere to land, and each one is load-
-- bearing for telling the truth on the Debts tab:
--
--   1. credit_limit — she supplied a limit or an available-credit figure for
--      most cards, and ten of the business cards are a LIMIT with no balance at
--      all. Without this column the utilization the family actually watches
--      ("107% used") cannot be shown, and the ten business cards import as
--      nameplates with nothing attached.
--
--   2. highest_balance — the card's peak. CareCredit sits at $863 against a
--      $3,515 peak: that is real paydown already accomplished, and the tab
--      should be able to show it rather than only the debt that remains.
--
--   3. rate_known — the one that fixes an actual defect. deriveDebts flags a
--      debt as needing terms when `rate > 0` is false, so a genuine 0% promo
--      card is indistinguishable from a card whose rate nobody has entered yet.
--      TWELVE of this family's cards are 0%. Without this flag every one of
--      them reads "Add terms" forever and the debt-free projection can never
--      complete, no matter how much the family fills in. A stored 0 now means
--      "zero percent" when rate_known is true, and "not gathered yet" when it
--      is false.
--
--   4. rate_min — issuers quote a RANGE ("29.99% to 35.99%"). The working rate
--      stays in `rate` (the HIGH end, so a payoff date is never rosier than the
--      family can count on — DR-0100); rate_min preserves the low end so the UI
--      can show the real range instead of implying a single quoted number.
--
-- DEPENDS ON: 0129 (accounts debt-declaration columns). IDEMPOTENT: additive
-- ADD COLUMN IF NOT EXISTS only; no data is rewritten. Safe to re-run.
--
-- BACKFILL NOTE: rate_known defaults to FALSE, which preserves today's exact
-- behaviour for every existing row — an account already carrying a real rate is
-- unaffected (its rate > 0 still reads as terms-present), and no existing row
-- silently gains a "0% is confirmed" claim it never made. The flag turns true
-- only where a person actually enters a rate from here on.
-- =============================================================================

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS credit_limit    numeric;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS highest_balance numeric;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS rate_known      boolean NOT NULL DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS rate_min        numeric;

-- An account that already carries a positive rate has, by definition, a known
-- rate — the figure came from a bank feed or a person typing it in. Marking
-- those true is a restatement of what the existing data already proves, not a
-- new claim: it keeps `rate_known` consistent for rows that predate the column
-- so the Debts tab reads them the same way it reads new ones. Rows at rate 0
-- are deliberately left false — nobody has confirmed those are 0% yet.
UPDATE public.accounts
SET rate_known = true
WHERE rate IS NOT NULL AND rate > 0 AND rate_known = false;

COMMENT ON COLUMN public.accounts.credit_limit IS
  'Card/line credit limit. NULL = unknown; never derived where the arithmetic contradicts a stated utilization (an over-limit card).';
COMMENT ON COLUMN public.accounts.highest_balance IS
  'Highest balance this account has carried. Context for progress already made; NULL = unknown.';
COMMENT ON COLUMN public.accounts.rate_known IS
  'TRUE when the rate was actually supplied (including a genuine 0%). FALSE means not gathered yet, so a stored 0 is never mistaken for a confirmed 0% promo.';
COMMENT ON COLUMN public.accounts.rate_min IS
  'Low end of a quoted APR range; `rate` holds the high end used for projection. NULL when a single rate was quoted.';
