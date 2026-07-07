# DR-0122 — Perpetual reports: one portable, sortable history over every record stream, with the failures-and-fixes coverage lens

- **Status:** accepted
- **Tier:** B (a new derived surface in the Projects hub; rides the lane with the full suite + guards)
- **Scope:** every record stream the platform keeps (projects, board work + its history events, concerns, discussions, the decision ledger, the review registry, the lessons incidents); portability of the record
- **Date:** 2026-07-07
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DATA-AS-EMPOWERMENT, WAYS-REVIEW, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, same sitting as the DR-0121 program:

> "Perpetual reports like the books sections historical however for every thing we want to keep track of in our projects and other systems so it's portable and can sort multiple business systems processes for adaptability. Again when we add features we need to update our Ways and documentation and find the opportunities and constraints, Ari's responsibility and reports should all update to reflect as well all inside the PoeTech App. No static data combine what makes sense and keep cleaning until we like it. Period."

And, in the same sitting, the standing question this DR's lens answers structurally: *"Are we implementing fixes for all the failures recorded throughout the app — a detailed report."*

## Decision

1. **The Books-ledger pattern is generalized into one Perpetual Report** (Projects → ∞ Perpetual Report): every record stream normalized into one row shape (`date · system · kind · title · detail · status · source`), filterable by system/status/text, sortable as a timeline (undated rows always sink — never an invented date, DR-0076), paginated, and **exportable as CSV** so the same history travels into any other business system ("portable... for adaptability"). Streams at launch: projects, board work + its append-only `links.history` events (the DR-0120 finish ripples and hand-offs), the full composed concerns set (seed + DB + feedback read-through + machine audit — the SAME composition the Concerns board renders, so the two can never disagree), discussions, the decision ledger, the review registry, and the lessons incidents. Engine: `app/src/lib/perpetual-report.js` (pure, fixture-tested); surface: `app/src/components/PerpetualReport.jsx`.
2. **The failures & fixes coverage strip is the standing answer to "are the recorded failures being worked?"** — open/working/closed counts derived per failure stream (concerns, reviews, lessons) from the records themselves. It moves the moment the underlying records do; an open count is a work item, never a decoration.
3. **New record streams join the report as they are born.** A feature that creates a new kind of tracked record adds its projection to `buildReportRows` in the same PR — the ways-review (DR-0108) checks for streams the report has outrun, exactly as DR-0120 §5 checks record surfaces.
4. **No static data (DR-0121) governs here absolutely:** every row is a projection of a live record (a synced row, an append-only history entry, or a build-parsed repo record). Nothing on the surface is hand-typed.

## Shipped with this DR (the same sitting's cleaning pass)

- **BuildBoard consolidation (DR-0121 item 5) — the hand-typed ROADMAP is retired.** The Build tab now derives: Shipped = the decision ledger; Building/Next = the live board store (seed specs as the labeled fallback where a device has no live rows); Gated = the open governance queue; Past Due = real due dates only (`lib/build-story.js`, fixture-tested).
- **The ledger parser reads the whole record:** 28 DR files (including the newest, DR-0116–DR-0121) used the list-style header the build parser could not read, so they carried no title/date into the app and silently dropped out of date-derived surfaces. The parser now reads both shapes — the in-app ledger, the Build tab, Ari's notes, and this report all carry the full record.
- **Ari's record derives (DR-0121 item 3, the surface half):** `lib/ari-notes.js` + the AriRecord panel in Discussions — one note per dated Decision Record (updates every build; cannot silently stall), Ari's live workload from the real board rows (owner = Ari), and his standing duties with DR refs resolved against the live ledger. The credentialed Local-LLM tending lane (Tier C, three brakes) still owns writing real synced reflections when it arms.
- **The four open audit findings fixed** (the "failures recorded throughout the app" that were still open): the Church Home "coming soon" dead-ends replaced with honest real-action copy; CRM, Library, and Scripture long lists gained real windowing/pagination. Re-audit run: 0 open findings, 4 auto-resolved.

## Constraints (honest, verified)

- Family-instance streams (board rows, concerns, discussions) sync per device/sign-in; on a signed-out device the report shows the honest empty for those streams while repo-derived streams still render.
- CSV is the portability floor; direct hand-off into another system's API is a later increment (would ride the AI-FOUNDATION operations lane, not the browser).
- The coverage lens classifies by each stream's own status vocabulary; a stream that never records closure (e.g. lessons incidents are "distilled," not "fixed") is counted by what its record actually says — the lens does not invent a fix state (DR-0076).
