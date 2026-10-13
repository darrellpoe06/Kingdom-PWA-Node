# DR-0762 — The vault holds only what the owner can open: passwords in the app, locked on the device, kept on our own server

- **Status:** accepted
- **Tier:** B (a new signed-in surface; a new table pair with owner-only walls proven on a real PostgreSQL in CI; the most sensitive data a person will hand the app, held so that we cannot read it; no money, no church-facing change).
- **Type:** feature + schema
- **Date:** 2026-10-06
- **Scope:** `infra/supabase/migrations-auto/0251-the-vault-holds-only-what-the-owner-can-open.sql`; `scripts/vault-ci-smoke.sql`; `.github/workflows/ci.yml` (`vault-walls` leg, required); `app/src/lib/vault-crypto.js`, `app/src/lib/vault-import.js`, `app/src/lib/vault-store.js`; `app/src/components/Vault.jsx`; `app/src/surfaces.js`, the shell (VALID, nav, render; budget 5300 -> 5302), `lib/nav-history.js`, `FeedbackCenter.jsx`, `scripts/system-flow-registry.mjs`; tests `vault-crypto.test.js`, `vault-import.test.js`, `vault-render.test.jsx`.
- **Principles:** SOVEREIGN-FIRST, DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE (DR-0076), DETERMINISTIC-FIRST, APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061), DR-0060 (RLS is the wall), DR-0100 (speak established fact), DR-0236 (nothing waits), DR-0737 (the sealed-message precedent for browser-side keys).
- **Grounds:** Darrell 2026-10-06, mid-build on the cameras: *"I also want to be able to pull my passwords into the PoeTech App as a sort of password management manager for the users..."*

## Context

The app already holds the house's most private things under three different postures, each written down: the family documents shelf (DR-0357: a private shelf, not a safe deposit box — the operator could read the bytes), the taxpayer id vault (device-only, never the cloud), and sealed messages (DR-0737: keys made in the browser, the server holds ciphertext). A password manager is the fourth, and it is the one where the second posture is the only honest one: a person must be able to say *nobody can read these, not even PoeTech*, and have it be true by construction rather than by promise. The precedent to reuse was already in the repo (`lib/dm-encryption.js`: WebCrypto AES-256-GCM, fresh IV per message, null on any failure); the KDF and the import formats were the new parts.

## What was measured

Before writing, read this session rather than recalled: the three existing postures and their files; `dm-encryption.js`'s envelope and helpers; migration 0249's owner-only RLS shape and its CI smoke; the five export header rows as the products write them (Chrome/Edge, Firefox, Bitwarden CSV and JSON, 1Password, LastPass, KeePass, Dashlane); OWASP's PBKDF2-HMAC-SHA256 recommendation of 600,000 iterations; the Postgres practice rules loaded for this change (`(select auth.uid())` in policies so the function runs once per statement; `text` and `timestamptz`; idempotent constraint creation; least privilege, anon revoked). Measured after writing: the crypto tests round-trip and fail closed on a wrong key, a tampered byte and a malformed envelope; the import tests read every named format by header and refuse an encrypted Bitwarden export with the way forward; the render test checks every byte that reaches the store against the password and the username and finds neither.

## Decision

1. **Zero knowledge, by construction.** The passphrase never leaves the device. The key (PBKDF2-SHA256, 600,000 rounds, per-user random salt, AES-256-GCM, non-extractable) never leaves memory, and is dropped after five idle minutes or when the tab hides. Each record is one ciphertext made in the browser. The server (0251) holds per person: a header (KDF, iterations, salt, and a verifier — a known sentence encrypted under the key so a wrong passphrase is told apart from a corrupt row without the key ever being here) and ciphertext rows. Owner-only RLS on every verb; anon revoked; the table refuses a weak KDF (iterations under 100,000), an oversized ciphertext and a short IV.
2. **No passphrase reset exists, and the surface says so.** Nobody else has the passphrase, so nobody can give it back. The covenant sentence stands on the screen in every state, and the encrypted backup (an export the person keeps, openable only with the passphrase) is the recovery path, offered beside the plain CSV that moves a person to another manager with a confirm that names what it is.
3. **"Pull my passwords in" is an import of the exports people already have**, read in the browser, previewed (new / already present / not a login), then encrypted and kept; the file is never uploaded, and the screen tells the person to delete it afterward because it is plain text on their disk. Formats are recognised by their header row, never by file name; an unrecognised header is refused naming the columns seen.
4. **One seam, two copies of the same bytes.** `lib/vault-store.js` names the tables and nothing else; a device cache holds the ciphertext rows so the vault opens offline, and the cloud copy is what every device of the owner syncs from, last-writer-wins on `updated_at` (a trigger moves it). Deletes are soft so a late device never resurrects a removed row.
5. **The surface is signed-in, locked when denied** (anyone could legitimately want it; signing in opens it). A generator (rejection-sampled WebCrypto randomness, ambiguous characters out by default), a search, reveal, copy with a 30-second clipboard clear, edit, delete with a confirm, and an audit (reused / weak / older than a year / empty) computed on the device. No breach-list lookups: they would send a hash of the password off the device, and that is a decision for its own record.
6. **Family sharing is deferred, on purpose.** A shared login would need per-device key wrapping as DR-0737's sealed messages do. re-review: 2026-11-20, with the first family request.

## Impact

Every signed-in person gains a password manager inside the app they already live in, held on the family's own server in a form the server cannot read. The shell grows by its documented two lines; the database gains two owner-only tables; CI gains one required leg that proves the walls on a real PostgreSQL. The app now carries all four private-data postures explicitly, and this one is the strictest.

## Risks named, not hidden (DR-0100)

- A forgotten passphrase is a lost vault unless the encrypted backup exists. Stated on the screen; the backup is one tap. re-review: 2026-11-20 whether a device-bound recovery (WebAuthn-wrapped key copy, `lib/webauthn.js`) should be added.
- PBKDF2 is weaker per round than Argon2 but is the native primitive; 600,000 rounds is the current OWASP figure. re-review: 2027-01-06.
- The clipboard clear after 30 s cannot be verified by the page (browsers do not let a page read the clipboard without a gesture); it writes an empty string if nothing else copied since. Stated as such.
- A plain CSV export is exactly as dangerous as any other manager's; it confirms first and says why.

## Verification after merge

CI: `vault-walls` applies 0251 twice and runs `scripts/vault-ci-smoke.sql` (every wall RAISEs on a wrong answer; the job greps the final line). The vitest suite carries 14 crypto, 20 import and 5 render tests. After deploy, db-migrate applies 0251 to the sovereign database on its own lane; the surface says "could not reach the server" rather than pretending until it has. Re-review dates: 2026-11-20 (family sharing; device-bound recovery), 2027-01-06 (KDF).

## Links

DR-0357 (the shelf's honest covenant), DR-0737 (browser-side keys precedent), DR-0060 (RLS is the wall), DR-0076, DR-0100, DR-0756 (the lane this followed), migration 0251, `.claude/skills/supabase-postgres-best-practices` (rules applied).
