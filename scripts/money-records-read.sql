-- money-records-read.sql -- TEMPORARY read-only census of the Money records the
-- app actually reads (the sovereign NAS database), approved by Darrell
-- 2026-11-05 for one verification pass. Runs through scripts/live-sql.sh
-- (tailnet -> ssh -> docker exec psql, the road every sovereign lane walks).
--
-- WHAT IT NEVER PRINTS: exact balances (rounded to $100, prefixed ~), exact
-- payments (rounded to $10), transaction descriptions, notes, emails, full ids.
-- WHAT IT NEVER DOES: write. BEGIN READ ONLY makes the server refuse one.
BEGIN READ ONLY;

\echo == member | instance | type | role | user(8) | joined
SELECT 'member', i.slug, i.instance_type, m.role, left(m.user_id::text, 8), m.joined_at::date
  FROM instance_members m JOIN instances i ON i.id = m.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 6;

\echo == entity | instance | slug | display_name | type
SELECT 'entity', i.slug, e.slug, e.display_name, e.entity_type
  FROM entities e JOIN instances i ON i.id = e.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 3;

\echo == account | instance | slug | entity | name | institution | type | fragment | treat_as_debt | primary | in_legal | ~balance | changed
SELECT 'account', i.slug, a.slug, a.entity_slug, a.display_name, a.institution, a.account_type, a.fragment,
       a.treat_as_debt, a.is_primary, a.in_legal,
       '~' || (round(coalesce(a.balance, 0) / 100) * 100)::bigint, coalesce(a.updated_at, a.created_at)::date
  FROM accounts a JOIN instances i ON i.id = a.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 4, 5;

\echo == txn | instance | account_slug | rows | newest_row | checkpoint_rows | newest_checkpoint | last_changed
SELECT 'txn', i.slug, t.account_slug, count(*), max(t.txn_date),
       sum(CASE WHEN t.category IN ('balance-checkpoint', 'balance-adjustment') THEN 1 ELSE 0 END),
       max(CASE WHEN t.category = 'balance-checkpoint' THEN t.txn_date END),
       max(coalesce(t.updated_at, t.created_at))::date
  FROM transactions t JOIN instances i ON i.id = t.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') GROUP BY 2, 3 ORDER BY 2, 3;

\echo == debt | instance | slug | entity | creditor | type | ~balance | ~minimum | apr | leave_alone | changed
SELECT 'debt', i.slug, d.slug, d.entity_slug, d.creditor, d.debt_type,
       '~' || (round(coalesce(d.balance, 0) / 100) * 100)::bigint,
       '~' || (round(coalesce(d.minimum_payment, 0) / 10) * 10)::bigint,
       d.apr, d.leave_alone, coalesce(d.updated_at, d.created_at)::date
  FROM debts d JOIN instances i ON i.id = d.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 4, 5;

\echo == obligations_table | instance | rows
SELECT 'obligations_table', i.slug, count(*)
  FROM obligations o JOIN instances i ON i.id = o.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') GROUP BY 2;

\echo == snapshot | instance | updated_at | by(8) | bytes | numericSyncVerifiedAt | plan_updated | reserveByEntity | minCushion | mortgageDueDay | rentDueDay | incomeSchedule_keys | bufferTarget | bills_n | rentals_n | billStatus_n
SELECT 'snapshot', i.slug, s.updated_at, left(s.updated_by::text, 8), pg_column_size(s.payload),
       s.payload->'data'->>'numericSyncVerifiedAt',
       s.payload->'data'->'moneyPlan'->>'updatedAt',
       s.payload->'data'->'moneyPlan'->'settings'->'reserveByEntity',
       s.payload->'data'->'moneyPlan'->'settings'->>'minCushion',
       s.payload->'data'->'moneyPlan'->'settings'->>'mortgageDueDay',
       s.payload->'data'->'moneyPlan'->'settings'->>'rentDueDay',
       (SELECT string_agg(k, ',') FROM jsonb_object_keys(coalesce(s.payload->'data'->'moneyPlan'->'settings'->'incomeSchedule', '{}'::jsonb)) k),
       s.payload->'data'->'meta'->>'bufferTarget',
       jsonb_array_length(coalesce(s.payload->'data'->'recurringObligations', '[]'::jsonb)),
       jsonb_array_length(coalesce(s.payload->'data'->'inflows'->'rentals', '[]'::jsonb)),
       (SELECT count(*) FROM jsonb_object_keys(coalesce(s.payload->'data'->'moneyPlan'->'billStatus', '{}'::jsonb)))
  FROM family_snapshots s JOIN instances i ON i.id = s.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties');

\echo == bill | instance | name | group | entity | account | ~amount | frequency | nextDue | enabled | linkedMortgage
SELECT 'bill', i.slug, o->>'name', o->>'group', o->>'entityId', o->>'accountId',
       CASE WHEN (o->>'amount') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN '~' || (round((o->>'amount')::numeric / 10) * 10)::bigint ELSE o->>'amount' END,
       o->>'frequency', o->>'nextDue', o->>'enabled', o->>'linkedMortgageId'
  FROM family_snapshots s JOIN instances i ON i.id = s.instance_id,
       jsonb_array_elements(coalesce(s.payload->'data'->'recurringObligations', '[]'::jsonb)) o
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 5, 3;

\echo == mortgage | instance | rental_id | name | entity | status | ~balance | rate | ~monthlyPI | escrow | estimated
SELECT 'mortgage', i.slug, r->>'id', r->>'name', r->>'entityId', r->>'status',
       CASE WHEN (r->'mortgage'->>'balance') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN '~' || (round((r->'mortgage'->>'balance')::numeric / 100) * 100)::bigint ELSE r->'mortgage'->>'balance' END,
       r->'mortgage'->>'rate',
       CASE WHEN (r->'mortgage'->>'monthlyPI') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN '~' || (round((r->'mortgage'->>'monthlyPI')::numeric / 10) * 10)::bigint ELSE r->'mortgage'->>'monthlyPI' END,
       r->'mortgage'->>'escrow', r->'mortgage'->>'estimated'
  FROM family_snapshots s JOIN instances i ON i.id = s.instance_id,
       jsonb_array_elements(coalesce(s.payload->'data'->'inflows'->'rentals', '[]'::jsonb)) r
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 4;

\echo == rental | instance | slug | entity | name | status | ~mortgage_balance | rate | ~payment | escrow
SELECT 'rental', i.slug, r.slug, r.entity_slug, r.display_name, r.status,
       '~' || (round(coalesce(r.mortgage_balance, 0) / 100) * 100)::bigint, r.mortgage_rate,
       '~' || (round(coalesce(r.mortgage_payment, 0) / 10) * 10)::bigint, r.mortgage_escrow
  FROM rentals r JOIN instances i ON i.id = r.instance_id
 WHERE i.slug IN ('poe-family', 'poe-properties') ORDER BY 2, 5;

COMMIT;
