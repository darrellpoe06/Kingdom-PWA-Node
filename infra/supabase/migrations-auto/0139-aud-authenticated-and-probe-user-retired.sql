-- ============================================================================
-- 0139 — every user is visible to the doorman: aud normalized, probe retired
-- ============================================================================
-- Measured 2026-08-20 (nas-health run 32325254572): sovereign GoTrue ran with
-- an EMPTY jwt aud, minting aud='' users and scoping every lookup to aud=''.
-- The 23 migrated accounts carry hosted's aud='authenticated' — present in
-- the table, invisible to sign-in. Correct PIN → "Invalid login credentials";
-- existing email → "Database error saving new user" (lookup missed, the
-- unique index refused the re-create). The compose change sets
-- GOTRUE_JWT_AUD=authenticated (hosted's value); this migration normalizes
-- any row minted under the empty aud, and retires the 2026-08-19 probe
-- account (the signup-witness's one deletable side effect).
--
-- Sovereign-only guard: hosted already has every aud='authenticated'; this
-- file only ever runs through the sovereign replay ledger.
UPDATE auth.users SET aud = 'authenticated'
 WHERE coalesce(aud, '') <> 'authenticated';

DELETE FROM auth.identities
 WHERE user_id IN (SELECT id FROM auth.users WHERE email = '15555550100@phone.poetech.us');
DELETE FROM auth.users WHERE email = '15555550100@phone.poetech.us';
