# DR-0159 — Business facts live once: the REV-0031 static-data burn-down closes

- **Status:** accepted
- **Tier:** A shipped through the lane (a one-source module + a proven-to-catch guard; no schema, no money)
- **Scope:** `app/src/lib/family-ministries.js` (the facts), `app/src/__tests__/family-ministries.test.js` (the duplication guard), `app/src/components/PromoBanners.jsx` + `DevOps.jsx` + `EventCenterModule.jsx` (consumers rewired)
- **Date:** 2026-07-10
- **Principles:** NO-STATIC-DATA (DR-0121), VERIFICATION-DOCTRINE (DR-0076 — measure current reality before working a finding), REALITY-TRACE, PERPETUAL-IMPROVEMENT (DR-0075), SEED-DATA-AS-ASPIRATION

## What the findings turned out to be (measured 2026-07-10, not assumed)

The DR-0139/REV-0031 "static data (15 findings)" line named five classes. Re-measured against today's code before working them:

1. **Duplicated business facts — REAL, now dead.** "7-clinician team" was typed twice in PromoBanners and a third time in DevOps; "11 rentals" twice in DevOps and once in PromoBanners; the 77th National Assembly's identity lived in PromoBanners AND the Event Center seed. These are real-world facts with **no live in-app source** (the rentals ROWS are per-instance data a public marketing surface cannot read), so the honest structure is one dated registry: `lib/family-ministries.js` — each fact with provenance (`family-declared in shipped copy; consolidated 2026-07-10`) and a `reVerify: 2026-10-01` date the family owns. Every consumer derives; a fact wrong here is wrong everywhere at once, which is what makes it findable.
2. **The guard (proven-to-catch).** `family-ministries.test.js` scans every component for the literal shapes that were duplicated (`N-clinician`, `N rentals`, `N rental homes`, the Assembly name) and fails the build naming the offender. On its FIRST run it caught a fourth instance the survey had missed (DevOps' roadmap row "~7 of 11 rentals paid off") — the guard works.
3. **ChurchVideoWall timeline — NOT the painted class; held as a chronicle.** Reality-traced: every entry is a dated record of a real observed event (on-site photos, the commissioning night, the Freeze decision), explicitly sourced in the file. A historical narrative has no live source to derive from — hand-written is its honest form, like LESSONS-LEARNED. The real risk is STALENESS (the "Punch list" row lingering after resolution): routed as a dated item, `re-review: 2026-07-24` — confirm the punch-list rows against reality or retire them.
4. **BigPictureDashboard counts — already derived** (reduce over the real urgency bands; the ingest counts read from the live feed). No work needed; the finding had gone stale.
5. **SURFACE_CATALOG — already gone.** No occurrence anywhere in the app source; another lane removed it after the review filed.

## Opportunities and constraints (routed)

- **Opportunity:** the DevOps provenance card could also name the measured workflow count from `__WORKFLOW_REGISTRY__` (DR-0158's bench) instead of prose-only claims — one more derived line. `re-review: 2026-07-17` (rides the existing date).
- **Constraint (held):** facts in the registry are family-declared, not machine-verifiable — the `reVerify` date is the honesty mechanism, and the module never grows values the family didn't declare.

## Supersedes / pairs

Closes the "Static data (15 findings)" line of DR-0139/REV-0031 (`re-review: 2026-07-17`, met early). Pairs with DR-0121 (no static data), DR-0158 (the workflow bench — same derived posture), DR-0076 (measure before working a finding: two of five classes had already closed, and saying so is part of the record). No supersession.
