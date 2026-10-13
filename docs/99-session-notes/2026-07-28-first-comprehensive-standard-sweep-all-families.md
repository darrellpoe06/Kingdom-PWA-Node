# The first full sweep under the comprehensive standard — all surface families

> Layer 4 working artifact. Companion to REV-0212. Trigger, Darrell 2026-07-28: *"Ari review our other apps and surfaces with the new comprehensive standard."* Three parallel deep reviews (books/taxes/rentals · church/spiritual · business/admin/family) ran dimensions 1/2/3/5 source-level; dimension 4 ran MEASURED (the chrome-layout probe swept 10 views × 3 widths in real Chromium — 30/30 clean signed-out); dimensions 6/7 are this note's queue and gates. ~45 findings with `file:line` receipts; the highest-value surgical set was FIXED same-session, the builds are CARRIED with named carriers (DR-0240 two-states law).

## FIXED this session (all through the lane, suite 6,752 green)

1. **Live bar dead frame (worst user-facing):** `LiveWorshipBar` still rode the abandoned `/embed/live_stream` endpoint — visible only during a real service window, i.e. broken exactly when used, and its test PINNED the broken URL. Now rides `worshipPlayerSrc` (the proven uploads-playlist embed); test repinned to forbid the abandoned form.
2. **Deep links dead-ended:** `?view=learn|scripture|bus|harvest|conference|program` landed on Overview; all now open the Church tab with the right sub-tab.
3. **Prayer request false "✓ sent":** with no office email, "Send" opened the church homepage and still marked the request sent. Now: "sent" only on a real mailto; otherwise the affordance honestly reads "Open contact page →". Render test updated with the why.
4. **Moore leads invisible:** `CRM.jsx` hardcoded four businesses; door-captured Moore leads were written and unreachable. Tabs now derive from the one engine registry (DR-0081).
5. **Checkout unarm-able:** `Bookstore` hardcoded `enabled:false`, dead-ending DR-0230's runbook Step 4 forever. Now an env read (`VITE_CHECKOUT_ENABLED`) — arming is a deploy-env flip in Darrell's custody, never a source edit.
6. **False cross-device promises:** BibleReader ("highlights follow you across devices" — they are device-local) and Engagement ("save your answers across devices" — write-only table, no reader) now tell the truth.
7. **Doctrine:** Psalm 34:3 restored verbatim ("his name" — the capitalization rule never edits inside a quote); Engagement's wrong-answer verdicts moved off true red to terracotta (DR-0099 — red stays the Blood's); the Give panel's authored voice says Yahweh (DR-0210); tenant-invite copy stops promising an unbuilt portal screen; giver-facing strings stop leaking build logs (NAS/CONNECT-403/office-note reworded for the reader, honest "pending" kept).

## CARRIED — the queue (two states only; carrier + derivation on every line)

**Decided-by-existing-record, execute next (carrier: the build lane, next working session — derived from today's measured throughput of five delivered increments/day; the daily review-watcher sweeps the date):**
- **Tier-ladder single source.** The public About ladder ($39/$89/$149/$249) passed Tier-C family review with the store identity, so it IS the decided ladder; the schema's $9/$19/$49/$99 comments and the two $39.99 strays are drift. Build: one `POETECH_TIERS` module, all six copies read it, a pinned test fails on any stray price literal (closes DR-0117's flagged mismatch + the door's $399 mis-quote + DevOps math that doesn't add up). `re-review: 2026-07-29`.
- **Test-count claims read the live census** (`__TEST_CENSUS__` is already wired) — the public store masthead is 6 over, About ~500 under. `re-review: 2026-07-29`.
- **CRM capture surfaces its sync result** (the `Calendar.jsx` banner pattern) — captures currently vanish silently signed-out. `re-review: 2026-07-29`.
- **Verse-verbatim gate over the lesson prose** (`living-lessons-class`, `church-classes`, `broadcast-class`, `default-church`, `giving`) — the structured sets are gated, the served prose is not; unlabeled non-KJV renderings (NIV/ESV wording, bare refs) are the found class. Gate + a labeling pass. `re-review: 2026-07-30`.
- **DR-0099 color gate** (no true red on Scripture-bearing meaning) + the `#991B1B`-as-error-ink sweep. `re-review: 2026-07-30`.
- **`app_interest` joins the one CRM** (adapter + widen `crm-single-engine-guard` to catch capture-table names it currently misses). `re-review: 2026-07-30`.

**Real builds (carrier: this recorded queue swept daily by the review-watcher; sized by the measured lane, sequenced oldest-need-first):**
- Payments→Books wiring (`toBooksTransaction` has zero callers — DR-0230's "one money truth" is unimplemented; the ledger panel's copy overstates it). `re-review: 2026-07-30`.
- `rental_tenancies` writer + the renter-portal surface (`loadMyRentHistory` has no screen; service requests/tenant messages permanently gated). `re-review: 2026-07-31`.
- Taxes on poetech.us (`/taxes/*` Pages Function proxy mirroring nas-photos; distinguish 401 from unreachable; fix the nas-tax-ingest README's copy-the-script premise + daemonize the uvicorn line). `re-review: 2026-07-31`.
- Guardian approval queue wiring (`buildApprovalRequest` zero callers — ask-first is configured but never enforced) + Governance queue decide-in-app actions (read-only today against its own promise). `re-review: 2026-08-01`.
- Budget-goal persistence honesty + family-only gate vs pricing copy; rentals `actual=rent` painted 100% collection; entitlements-vs-userTier dual truth + the self-service "Preview tier (dev)" ladder. `re-review: 2026-08-01`.
- Highlights/answers real sync (make the promises true instead of just honest); Chamber names itself; signed-out sign-in affordances on Choir/ServiceProgram/BusMinistry; sub-mounted surfaces join the surface-audit's denominator (its green currently covers 39 top-level routes, not the 16 sub-mounted surfaces where this sweep found the breaks). `re-review: 2026-08-04`.

**Already lawfully carried (no action):** DR-0224 sub-tab reachability gate (`2026-08-05`), DR-0228 public-surface sweep (`2026-08-05`), DR-0227 per-brand storage (`2026-08-01`) — on their own recorded clocks.

## What only live sessions can verify (named honestly)
Applied-migration state and live RLS behavior per table; whether checkout env/keys are set in Cloudflare (Darrell's custody); realtime behavior on Engagement/Choir/BusMinistry; the DR-0104 reviewer-mode pass on the fixed surfaces after deploy — the standing human step.

## Ways-review (DR-0108)
The standard's own first full run found what the old "comprehensive" missed at scale — journeys and copy-truth produced the majority of the ~45 findings; the probe made dimension 4 measurable for the first time (30/30 clean); the biggest systemic find is a *gate-coverage* truth: the surfaces that broke live almost entirely OUTSIDE the surface-audit's denominator and the string-pinned tests — dimension 7's next work is widening denominators, which this queue carries.
