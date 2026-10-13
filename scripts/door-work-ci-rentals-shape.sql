-- =============================================================================
-- door-work-ci-rentals-shape.sql — the rentals columns production gained from
-- schema-v2.13 (and the app's own sync), for the CI door-work leg. Applied
-- after schema-v2.2.2 and before 0152-0154 on a throwaway PostgreSQL only.
-- schema-v2.13 itself cannot be replayed there (it alters `incidents`, which
-- this leg does not build); these are its rentals lines, copied verbatim in
-- shape, plus the two the rentals sync writes (monthly_rent, tenant_name).
-- Never applied to a real database.
-- =============================================================================
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS current_market_value numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_balance numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_rate numeric(6,3);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_escrow numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rent_actual numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS monthly_rent numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS tenant_name text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS notes text;
