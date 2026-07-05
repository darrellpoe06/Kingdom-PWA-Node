# UI/UX & Accessibility Review Registry

**What this is.** The append-only, repo-side record of UI/UX, accessibility (WCAG), code-review, and orchestration (how-we-worked) findings on PoeTech surfaces — surfaced INSIDE the app (Projects › Build › Quality / Proof, Governor-gated) so the reviews close their own loop where the work lives, not only in session notes. Since DR-0102 the panel also MEASURES this registry's freshness (days since the newest record) and flips to attention past 7 days — consistency is the schema, freshness is measured, not promised.

**Why it exists.** Darrell, 2026-06-16: *"our app UI/UX reviews — are they in there?"* They lived in CI, review docs, and the local-LLM output, not in the app. This is the structured, real feed the in-app panel reads (parsed at build time into `__UIUX_REVIEWS__`, the same pattern as the governance queue and the DR ledger). The live local-LLM diff review and the live WCAG contrast measurement render alongside these records from their own real sources.

**Binding rule — no fabricated reviews.** Every record below points at a real artifact in this repo (a source doc, a gate script, or a DR). `Status: addressed` is used ONLY where the resolution is independently verifiable (a passing gate, an injected build marker). Otherwise the status is `logged` (recorded, resolution not verified here) or `open` (known, unresolved). Add a record when a review happens; never invent one to make the panel look green.

**Format (parsed):** one record per `###` block. Fields: `Date`, `Surface`, `Type` (`accessibility` | `ui-ux` | `security` | `code-review` | `orchestration`), `Status` (`addressed` | `open` | `logged`), `Findings`, `Source`. An `orchestration` record reviews how the work itself ran (lanes, verification, integration, handoffs) per DR-0102 — one per reviewed working day, frictions carried as actions with re-review dates.

---

## Records

### REV-0001 · Per-theme WCAG 2.1 AA contrast
- **Date:** 2026-06-15
- **Surface:** All themes (white, slate, sapphire, rose, midnight)
- **Type:** accessibility
- **Status:** addressed
- **Findings:** A code comment falsely claimed "all combinations exceed WCAG 2.1 AA" while light-theme body text measured 2.92:1 against 4.5:1 required. Replaced the claim with a deterministic per-theme contrast gate that fails the build below AA. The live measurement is shown in this panel from the same scanner (`scanContrast`).
- **Source:** scripts/contrast-guard.mjs

### REV-0002 · Machine-readable build-freshness marker
- **Date:** 2026-06-01
- **Surface:** App shell / Build board header
- **Type:** ui-ux
- **Status:** addressed
- **Findings:** Daily review could not confirm which build the phone was running — no machine-readable build-SHA was exposed in the DOM, so "is the phone on the new build?" recurred. Resolved by injecting `__BUILD_SHA__` / `__BUILD_TIME__` at build and surfacing them with a freshness dot (green = latest, red = a newer build is waiting).
- **Source:** app/vite.config.js

### REV-0003 · Public landing CTA pointed at an undeployed workflow
- **Date:** 2026-06-01
- **Surface:** Public landing — primary "Drop your bank file" CTA
- **Type:** ui-ux
- **Status:** logged
- **Findings:** The loudest CTA on the public landing POSTed to a webhook (wf33) that was not in the active/deployed set, so a first-time visitor doing the most-encouraged action would hit HTTP 404 and the error modal. Flagged against BUSINESS-PROCESS-CONNECTIONS (don't make an unwired surface the loudest button). The signed-in real-data ingest path is tracked on the Build board.
- **Source:** docs/99-session-notes/2026-06-01-mvp-comprehensive-review.md

### REV-0004 · Client-rendered surface not visually verified (no-browser run)
- **Date:** 2026-05-31
- **Surface:** Persona picker / demo data / leak check
- **Type:** ui-ux
- **Status:** logged
- **Findings:** First daily review ran without a browser; the meta/shell leak check was clean but the client-rendered surface (persona picker, sample data, build marker) could not be visually verified. Recorded as a coverage gap; later runs with Chrome verified the rendered surface.
- **Source:** docs/99-session-notes/2026-05-31-daily-app-review.md

### REV-0005 · Tenant data-isolation review (no cross-family leak)
- **Date:** 2026-06-14
- **Surface:** Multi-tenant data access (RLS / instance scoping)
- **Type:** security
- **Status:** addressed
- **Findings:** Reviewed whether one family could see another's records after the "Darrell at top" parishioner incident. Confirmed cosmetic-only (RLS held under a service-vs-anon test); encoded the judgment as the tenancy guard + conference no-leak gate so a cross-instance read fails the build.
- **Source:** scripts/tenancy-guard.mjs

### REV-0006 · Orchestration review — the 2026-07-05 working day
- **Date:** 2026-07-05
- **Surface:** How the work itself ran (PRs #585–#587) — lanes, verification, integration order, handoffs
- **Type:** orchestration
- **Status:** logged
- **Findings:** Kept: six parallel audit lanes over all 39 surfaces with adversarial file:line classification (DR-0076); proven-to-catch tests on all four financial-math fixes; every non-live item carries its why + re-review date (DR-0075); small follow-up lanes (#586/#587) integrated cleanly. Frictions → actions: (1) one 59-file PR carried five workstreams — discovery may batch, but its fixes integrate as separate small lanes per DR-0077 (practice, effective now, re-review 2026-07-12); (2) the 0077 migration unlock is still a hand-paste for Darrell while the db-migrate lane exists — name the cause (NAS family instance vs cloud secret) and close it (re-review 2026-07-12); (3) this registry sat 20 days without a record across ~200 merges — freshness is now measured in-app and orchestration reviews append per working day (DR-0102). **(4) THE STALL — "we don't move when I'm not pushing" (Darrell, remedy asap):** verified root cause — the auto-open-PR + auto-merge lane filtered eligible branches to `^(feat|fix|merge|docs)/`, so every `claude/*` agent PR (all remote-session work, incl. this one) was invisible to the hands-off merge lane and could only be landed by Darrell's hand. Fixed this session: `claude/**` added to the CI push trigger, auto-open-PR trigger, and auto-merge eligibility, so agent PRs ride the existing default (auto-merge on green gates; `hold` label = the per-PR soak/Governor brake). Behavioral half: idle turns now pull the next dated backlog item forward instead of parking on passive poll-timers (recorded to memory). Re-review 2026-07-12.
- **Source:** docs/99-session-notes/2026-07-05-orchestration-review.md
