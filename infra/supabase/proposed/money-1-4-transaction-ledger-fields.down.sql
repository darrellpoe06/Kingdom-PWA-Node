-- Reverses money-1-4-transaction-ledger-fields.sql: drops exactly the five
-- columns it adds, nothing else. Data in them is lost; every other column and
-- row is untouched.
ALTER TABLE transactions DROP COLUMN IF EXISTS outstanding;
ALTER TABLE transactions DROP COLUMN IF EXISTS cleared_on;
ALTER TABLE transactions DROP COLUMN IF EXISTS pending;
ALTER TABLE transactions DROP COLUMN IF EXISTS source;
ALTER TABLE transactions DROP COLUMN IF EXISTS doc_id;
