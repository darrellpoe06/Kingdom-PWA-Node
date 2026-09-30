# DR-0708 — One household, one ledger; and a tax upload that says why

- **Status:** accepted
- **Tier:** B (schema: a realtime publication change on the live database; no RLS change)
- **Type:** fix
- **Date:** 2026-09-30
- **Scope:** `infra/supabase/migrations-auto/0245-every-synced-table-tells-open-screens-when-it-changes.sql` (new) + `infra/supabase/tests/0245-realtime-publication-smoke.sql` (new) + the `realtime-publication` leg in `.github/workflows/rls-isolation.yml`; `app/src/lib/sync-freshness.js` (new); `app/src/lib/table-sync.js` (freshness stamps, "Sync now", re-read on return to the screen); `app/src/components/LedgerFreshness.jsx` (new) on Books → Imported; `app/src/lib/tax-upload.js` + `app/src/components/BooksTaxes.jsx` (the button always answers, one fresh-key retry, 60 MB cap); `infra/nas-tax-ingest/tax_upload_server.py` (60 MB) + `install.sh` (restart when the service code changes); `.github/workflows/family-books-probe.yml` (new, registered in `scripts/system-flow-registry.mjs`); tests `ledger-open-screen-parity.test.js`, `ledger-freshness-render.test.jsx` (new), `books-taxes-render.test.jsx`, `tax-upload.test.js`.
- **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, SPEC-CONFORMANCE-REVIEW, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS
- **Grounds:** DR-0060 (RLS stays the data gate); DR-0061 (a surface is a live view of real state); DR-0076 (measure, never guess; unknown freshness never reads as fresh; proven-to-catch); DR-0125 (the runner is the eye the sandbox lacks); DR-0310 (REPOINT-ARMED: the app reads the NAS database); DR-0330 (the /taxes road). The number is the next free one above every open PR's claim (#1908 holds DR-0706; #1909 holds DR-0707).

## Context

Darrell and Christina, 2026-09-30, with screenshots, both on build aae49f9:

1. **Christina could not upload taxes.** Signed in as mrspoe06 on her Galaxy Z Fold, Books → Taxes, she filled "Upload a return" (Personal (Darrell + Christina), 2024, Return (1040), "Taxes 2024.pdf"). The page said the device held the family key. Pressing "UPLOAD TO MY NAS" did nothing.
2. **The same Books → Imported screen showed two ledgers.** Her phone: September 258 of 3,405, IN $33,727, OUT $33,059. His desktop (incognito, both profiles picked): 183 of 3,330, IN $26,414, OUT $25,276. Darrell: *"we have different numbers than each other at least for some time... and now one says the same as Christina's and the next doesn't... why?!!!!"*

## What was measured

All from runners on the tailnet (`family-books-probe`, runs 36787773243 and the follow-up runs), counts and ids only.

**The ledger.**
- The live poe-family ledger holds **3,405 rows, 258 dated September 2026**. Christina's phone showed exactly that; **Darrell's desktop was the stale screen.**
- The difference is **75 rows**, all dated September, all written by Christina **on 2026-09-30** to account `a-1782032772632`. (All 258 September rows are hers; 140 were written 2026-09-22.) Their slugs and dates are listed in the probe run's step summary.
- Both accounts resolve to the same instance (poe-family); Christina is `admin`, Darrell `owner`; RLS on `transactions` reads by instance role, not by `created_by`. **No row was hidden from either of them.** Zero exact-duplicate groups in September; 5 September rows deleted 2026-09-28 (not the 75).
- **`transactions` is not in the NAS `supabase_realtime` publication.** Of the 46 tables the app syncs through `lib/table-sync.js`, **37 that exist on the NAS were not in it**, among them `transactions`, `accounts`, `debts`, `entities` and `projects`. The realtime container is up (6 weeks); it had nothing to say about the ledger.
- Cause: `schema-v2.14-realtime-publication.sql` put the books tables into the publication on the hosted project, by hand. It was never in `migrations-auto`, so the NAS database the app reads since REPOINT-ARMED (2026-08-19) never received it.
- So every open screen showed the ledger **as of the moment it loaded**, and nothing on the screen said when that was. Whichever device loaded after Christina's latest import matched her; whichever loaded before did not. That is the "one says the same, the next doesn't" Darrell saw.
- The dollar figures could not be matched to a single SQL definition of IN/OUT (the screen also excludes internal transfers it detects itself); the row counts match exactly and are the measurement this record rests on.

**The tax upload.**
- With the family key, a 1 MB and a 20 MB test PDF both uploaded end to end through poetech.us: **200** in 1.1 s and 9.9 s. The test folder `zz-probe-delete-me` was then removed from the drop and publish folders, the ingest re-run, and the archive checked clean (0 probe entries left). This was a write, and it was undone in the same run.
- Without the key, bodies of 1, 10, 24, 30, 60 and 95 MB all reached the NAS service and were refused 401 by the service itself (95 MB in 48 s). **No hop before the NAS limits size.** The NAS service caps a file at 25 MB, and so did the app.
- The service is active, `/taxes` is mounted on the Funnel, all 4 poe-family entity slugs match the service's id pattern, and the archive holds 0 documents: Christina's return never arrived.
- The service's access log could not be read over SSH (not even the probe's own requests came back), so what her press sent cannot be read from the NAS. What the code shows (`BooksTaxes.jsx`, before this change): **the button was `disabled={!gate.ok || busy}`.** Whenever `validateUpload` refused anything, most likely a scanned return over 25 MB, the button greyed out and no reason was shown anywhere, because the reasons were only ever written by `doUpload`, which a disabled button never calls. A 401 from a device key that no longer matched the NAS would show one message and never try again.

## Impact

- Two members of one household saw different family finances with no way to tell which was current. That is the failure DR-0061 and DR-0076 exist to prevent, on the surface where trust matters most.
- Every other synced table (accounts, debts, projects, inventory, prayer requests and 31 more) had the same blindness on every open screen since 2026-08-19.
- Christina could not file a return from the app and was told nothing about why.

## Decision

1. **Publish every synced table (0245).** Additive and idempotent; a table already published or absent is skipped; the migration raises if the ledger is still unpublished afterwards. Nothing about who may read a row changes: realtime delivers only rows the subscriber's RLS allows, and the client filters its channel to its own instance (DR-0060).
2. **A screen does not depend on realtime alone.** The ledger (and every delta-capable table) re-reads when the screen comes back to the front or back online, at most once per 30 s. Event-driven, no timer. "Sync now" re-reads the whole table.
3. **The screen says how fresh it is.** `table-sync` stamps a table only after the database answered in full (every page, or both legs of a delta); a partial or failed read records a failure instead. Books → Imported shows the stamp: *synced just now* / *last synced N minutes ago* / *not yet confirmed* / *the last read did not complete*. **No stamp reads as "not confirmed", never as fresh.** Nothing is persisted, so a page that has not heard the database since it loaded cannot claim otherwise.
4. **The upload button always answers.** It is disabled only while uploading. Pressing it with anything wrong says what, in words (with the file's size in MB); once a file is picked, what is still missing shows before anyone presses. Errors are announced as alerts and never styled like success.
5. **A refused key is fetched once more.** On 401/403 the device drops its key, asks the family for the current one, and retries once. If the NAS still refuses, the screen says the published key and the NAS key differ.
6. **60 MB per file** in the app and on the NAS (measured road capacity 95 MB). The NAS installer now restarts the service when its code changes, so the new cap takes effect on the next services-sync cycle instead of whenever something else restarts it.
7. **`family-books-probe`** stays as a dispatch-only diagnostic: read-only ledger and publication counts, the size ladder without the key, and an opt-in test upload that removes itself.

## Verification

- **Proven-to-catch, ledger:** `ledger-open-screen-parity.test.js` runs a fake database that never sends a realtime event. On the pre-DR-0708 `table-sync.js` it fails with *"expected 183 to be 258"*, the incident's own numbers. It passes on the new code, along with the freshness states (unknown → fresh → stale → failed) and "Sync now".
- **Proven-to-catch, upload:** four new `books-taxes-render` tests fail on the old component and library (the grey button, the silent oversize file, no key retry, a key mismatch shown as success) and pass on the new one. `tax-upload.test.js` pins the 60 MB cap (31 MB now accepted, 61 MB refused with its size), one retry on 401 only, and no retry on a 400.
- **Migration:** applied twice to a local Postgres 16 (the second run changes nothing); the 0245 smoke fails before it, names a table removed from the publication, and passes when the publication is whole. It runs in the `realtime-publication` leg of `rls-isolation`.
- **After merge:** db-migrate's sovereign replay carries 0245 to the NAS, and `family-books-probe` section 14 must list **no** synced table missing from the publication. The result is recorded on the PR.
- **What Darrell and Christina should see:** the same Imported counts on both screens once each screen is opened or brought back to the front, a "Ledger" line saying when that screen last synced, and on Taxes a button that either files the return or says why it did not. A return up to 60 MB uploads once the NAS service has restarted on the merged code.
- **re-review: 2026-10-14.** Read the NAS service's access log from the next probe run (fix the log read if it is still empty) and confirm Christina's 2024 return is in the archive.
