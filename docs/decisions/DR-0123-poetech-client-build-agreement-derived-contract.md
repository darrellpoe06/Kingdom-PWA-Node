# DR-0123 — The PoeTech client contract: a derived agreement, one source with the terms, counsel-review gate before first signature

- **Status:** accepted
- **Tier:** B (a new template on the existing Scopes · Agreements surface; the counsel sign-off before first EXTERNAL use is the Tier-C gate it carries)
- **Scope:** every client-business engagement contract; the Scopes · Agreements surface; the agreement's relationship to the terms module
- **Date:** 2026-07-08
- **Principles:** GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, APP-IS-PRIMARY, COMMUNITY-FIRST, DECISION-RECORDS

## Directive

Darrell, 2026-07-08: *"Create a contract for people who want to do business with PoeTech — review the Ways and documentation and create a contract."* And, same sitting, the standing frame: *"Make sure it has quality comprehensive process that adds the maximum value to the overall process."* He then showed the Projects → Scopes · Agreements surface — the contract's home.

## Decision

1. **The contract DERIVES from the terms module — it is never a typed document that can drift.** `lib/client-build-agreement.js` generates every clause from `lib/client-engagements.js` — the SAME source the door's price-out reads and the deposit gate (`canStartBuild`) enforces — so the agreement, the door, and the gate can never disagree (DR-0121 applied to legal paper). A terms change is a new DR in the terms module; the contract follows on the next build. Proven-to-catch: the test fails if any clause re-types a dollar figure the derive did not produce.
2. **It ships as the "PoeTech Build Client" template on Projects → Scopes · Agreements** (retitled "Contractor & Client Agreements"), beside the contractor templates — one agreements surface, steward fills client name/quote/link-to-project, both sides agree before work.
3. **The clauses encode the reviewed Ways:** DR-0117 in full ($2,000 minimum · $500 deposit before ANY work — structural · $500 at MVP · balance across the 90-day same-as-cash window · NO INTEREST EVER · $150/mo Feedback-portal support · beyond-scope re-enters the front door · payments RECORDED never processed); DR-0114 (the quote is the governor's hand); DR-0104 (MVP delivered live + offered for the client's own review); recorded-discovery scope anchoring (acceptance anchors to the reviewed requirements, not evolving wishes); DATA-AS-EMPOWERMENT as contract text (client data exportable at any time, never sold, never an advertising asset, never a collection lever — including in non-payment).
4. **Counsel-review gate (DR-0021/DR-0026 posture):** the template prints a DRAFT line — "route to counsel for legal-sufficiency review before the first external signature; not legal advice" — at the top of the scope on every copy. Attorneys own legal sufficiency; the module owns fidelity to the recorded terms. Counsel sign-off flips the line by a new DR; until then no external client signs it.
5. **Agreements are a tracked record stream:** scopes now project into the Perpetual Report (DR-0122 §3 honored in the same PR the stream became business-real).

## Opportunities and constraints (found, as directed)

- **Opportunity:** a print/PDF export of a filled scope (the Books CSV pattern applied to agreements) — the scope view already renders all clauses; a print stylesheet is a small increment. `re-review: 2026-07-15`.
- **Opportunity:** the engagement record (client-engagements.js rows, ◈ Clients) and the signed scope could link by id, so `canStartBuild` can also confirm "agreement on file." `re-review: 2026-07-15`.
- **Constraint (verified):** scope rows are per-family synced records; the template itself carries no client data. The derive runs at build time — a terms change reaches clients only through the lane (which is the correct brake).
- **Constraint (held):** no external signature before counsel review — the DRAFT line is the in-surface enforcement; the ways-review checks it has not been silently removed.
