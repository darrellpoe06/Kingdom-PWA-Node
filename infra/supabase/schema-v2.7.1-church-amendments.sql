-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.7.1-church-amendments.sql
--
-- v2.7.1 CHURCH AMENDMENTS (Q5 follow-on lock-in 2026-05-25):
--   On-demand giving reconciliation drift report.
--
-- Depends on: schema-v2.7-church.sql (service_offerings + giving_reconciliations
--             + donor_giving).
--
-- Q5 lock-in: "as an option for the user to do if they want to" — the function
-- is callable by any instance member with the appropriate scope. It returns
-- one row per service_offering in the window that shows expected (cash +
-- check + online totals from the offering row), claimed (sum of giving_recon
-- rows for that offering in verified/accepted status), identified_in_books
-- (sum of donor_giving rows on the same gift_date matched to this instance),
-- and the residual_anonymous delta — i.e. what's left unaccounted for after
-- subtracting named claims from the offering total.
--
-- The check is "best-effort report, never authoritative" — the treasurer
-- reads the drift_amount and decides whether to act (re-count, follow up
-- with a member who promised a check, etc.). The schema does not auto-
-- correct anything based on this report. POE binding: the user has the
-- last word on what the drift means.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.service_offerings_drift_report(
  p_instance     uuid,
  p_window_start date,
  p_window_end   date
) RETURNS TABLE (
  service_offering_id    uuid,
  service_date           date,
  service_kind           text,
  service_label          text,
  expected_total         numeric(12,2),
  cash_total             numeric(12,2),
  check_total            numeric(12,2),
  online_total           numeric(12,2),
  named_claims_total     numeric(12,2),
  identified_in_books    numeric(12,2),
  residual_anonymous     numeric(12,2),
  drift_amount           numeric(12,2),
  drift_status           text
)
LANGUAGE sql STABLE
AS $$
  WITH offerings AS (
    SELECT so.id, so.service_date, so.service_kind, so.service_label,
           so.cash_total, so.check_total, so.online_total,
           (so.cash_total + so.check_total + so.online_total) AS expected_total
      FROM service_offerings so
     WHERE so.instance_id = p_instance
       AND so.service_date BETWEEN p_window_start AND p_window_end
  ),
  claims AS (
    SELECT gr.service_offering_id,
           COALESCE(SUM(gr.amount_claimed), 0)::numeric(12,2) AS named_claims_total
      FROM giving_reconciliations gr
     WHERE gr.instance_id  = p_instance
       AND gr.claim_status IN ('verified','accepted')
     GROUP BY gr.service_offering_id
  ),
  books AS (
    SELECT dg.gift_date,
           COALESCE(SUM(dg.amount), 0)::numeric(12,2) AS identified_in_books
      FROM donor_giving dg
     WHERE dg.instance_id   = p_instance
       AND dg.gift_date BETWEEN p_window_start AND p_window_end
       AND dg.parishioner_id IS NOT NULL
     GROUP BY dg.gift_date
  )
  SELECT
    o.id,
    o.service_date,
    o.service_kind,
    o.service_label,
    o.expected_total,
    o.cash_total,
    o.check_total,
    o.online_total,
    COALESCE(c.named_claims_total, 0)::numeric(12,2),
    COALESCE(b.identified_in_books, 0)::numeric(12,2),
    GREATEST(
      o.expected_total - COALESCE(c.named_claims_total, 0),
      0
    )::numeric(12,2) AS residual_anonymous,
    (o.expected_total
       - COALESCE(c.named_claims_total, 0)
       - GREATEST(o.expected_total - COALESCE(c.named_claims_total, 0), 0)
    )::numeric(12,2) AS drift_amount,
    CASE
      WHEN ABS(o.expected_total - COALESCE(c.named_claims_total, 0)
               - GREATEST(o.expected_total - COALESCE(c.named_claims_total, 0), 0)) < 1.00
        THEN 'clean'
      WHEN ABS(o.expected_total - COALESCE(c.named_claims_total, 0)
               - GREATEST(o.expected_total - COALESCE(c.named_claims_total, 0), 0)) < 25.00
        THEN 'review-soft'
      ELSE 'review-hard'
    END AS drift_status
  FROM offerings o
  LEFT JOIN claims c ON c.service_offering_id = o.id
  LEFT JOIN books  b ON b.gift_date           = o.service_date
  ORDER BY o.service_date DESC
$$;

GRANT EXECUTE ON FUNCTION public.service_offerings_drift_report(uuid, date, date)
  TO authenticated;

COMMENT ON FUNCTION public.service_offerings_drift_report(uuid, date, date) IS
  'Optional drift report for COLG giving reconciliation. Reports per-service '
  'expected vs claimed vs identified-in-books vs residual-anonymous so the '
  'treasurer can spot discrepancies. Never authoritative — the operator '
  'decides whether drift means an error to fix or a normal anonymous-giving '
  'gap. Q5 lock-in 2026-05-25.';

COMMIT;

-- =====================================================================
-- End of schema-v2.7.1-church-amendments.sql
-- =====================================================================
