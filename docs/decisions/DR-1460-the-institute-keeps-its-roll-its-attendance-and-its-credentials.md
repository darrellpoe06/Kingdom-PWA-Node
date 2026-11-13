# DR-1460: The Institute keeps its roll, its attendance and its credentials — every wall in the database

**Date:** 2026-11-13
**Status:** Accepted (Slice B of the Institute; Phase 5 of the Love Corner redesign)
**Tier:** C (new tables and RLS; no money; ships inactive until the office's row reads confirmed + open)
**Type:** decision
**Area:** `infra/supabase/migrations-auto/0325-*.sql`, `infra/supabase/tests/0325-institute-walls-smoke.sql`, `app/src/lib/church-institute-sync.js`, `app/src/components/ChurchInstitute.jsx`, `.github/workflows/ci.yml` (`institute-walls`)
**Sent in by:** Darrell's Institute addition, 2026-11-12: a dedicated landing with Enrollment, Students and Certificates; "Do not advertise courses or enrollment as available unless they actually exist." Pulled forward under DR-0236 after Phase 4 (DR-1459) went live.
**Pairs with:** DR-1455 (Slice A, the landing), DR-0250 (`learner_lesson_records`, the course standard it reads), USER-ACCOUNTS-AND-HISTORIES-STANDARD, DR-0060 (tenancy proven-to-catch), DR-0076 §2–3, DR-1053 (no error destructured away)

## Context

Slice A said what was true with no store behind it: enrollment closed, certificates planned. The brief's rule is that nothing is offered that does not exist, so the next true thing is a store the office governs, in which an application cannot exist before the paperwork is confirmed and a certificate cannot exist before the standard is met. Tuition (Slice C) still waits on the Bishop's word and touches none of this.

## What was measured

| what | measured |
| --- | --- |
| the CI chain + 0325 applied twice on a local PostgreSQL 16 | every step ok; idempotent |
| `0325-institute-walls-smoke.sql`, ten assertions | `INSTITUTE WALLS SMOKE: PASS` |
| first smoke run | failed at assertion 9: `gen_random_bytes` needs pgcrypto, absent on the runner; the code now comes from core `gen_random_uuid()` |
| the seam, 11 tests | every door names its table or RPC; refusals before the network; a refused insert returns `ok:false reason:refused`, never a throw |
| the built app at 390 px, signed out (`docs/design/love-corner-redesign/2026-11-13-live-build-institute-certificates.png`) | six tabs and no Office; Certificates reads Planned; no Apply; the verify door present; scroll width 390, no overflow; the Check button 48 px |
| the landing, 11 render tests | closed shows no Apply; open + signed out shows no Apply; open + signed in applies with the program's course keys; the Office tab mounts only for `isOffice` |

## Impact

Four tables under RLS: `institute_settings` (one row per church; office writes, anyone reads), `institute_enrollments` (one row per applicant per program; INSERT allowed only while the settings read confirmed + open; an applicant may only withdraw), `institute_attendance` (office-only), `institute_credentials` (no INSERT policy at all; rows exist only through the RPC). Three doors: `institute_completion` (student or office), `institute_issue_credential` (office; re-runs the standard; one per enrollment; `YYYY-0001` numbering and a ten-character verify code), `institute_verify_credential` (anon + authenticated; holder, program, number, date and nothing else).

## Decision

1. **The policy is the wall, the UI only repeats it:** Apply renders only when the live settings row reads open, and the database refuses the insert regardless.
2. **The completion standard is one function**, read by student and office alike: every `course_keys` entry has a passed quiz in `learner_lesson_records`, sessions present ≥ the office's floor, status accepted or completed. Issuing re-runs it server-side.
3. **A credential is minted only by the RPC**; the verify door returns the minimal fields and `null` for a wrong code.
4. **The proof rides CI:** the `institute-walls` job applies the real chain, 0325 twice, and greps the PASS line.

## Verification after merge

DR-0107, done 2026-11-13: #2651 squash-merged as `a6fddb15` at 00:41Z; db-migrate run 43339007968 applied 0325 on the real database; Deploy (Cloudflare Pages) run 43339062389 on that SHA green at 00:48Z, BOOT OK on poetech.us, pages.dev, the Moore door and `?view=church`. DR-0125: `site-health.yml` run 43340181003 at 00:50Z: verdict UP, served build `a6fddb1` = main. The matrix run 43339993126 on the same SHA: the `institute-roll` leg green at 01:02Z, `INSTITUTE WALLS SMOKE: PASS` against the real database. (Its `one-person-one-house` leg is red on the 0319 smoke's `renter` role against `instance_members_role_check`, red on the previous run too; not this change's, carried in the session note with a date.)
