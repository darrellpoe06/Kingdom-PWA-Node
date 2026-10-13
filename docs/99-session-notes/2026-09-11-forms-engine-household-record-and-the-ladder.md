# 2026-09-11 — One forms engine for every product; the household's record, shelf and findings

Darrell: *"Create the same type of intake forms for PoeTech and Poe Properties Apps... however make sure they fit the requirements of the product it claims to be. We also need a PoeTech family documents upload and a process for analytics and services to be created based on the information; workflows are added to become MVPs until we are systematizing our lives and training our LLMs based on the business needs of our specific family needs."* And: *"each has their own databases so each can work independently and together as our Ways and documentation state... comprehensive review of the history of the work in our DRs."*

## The review first, then the build

Two reviews ran before a line was written — one over the code (what each product already holds, how TLC-specific the engine was, which buckets exist), one over the decision record history (tenancy, the intake/documents lineage, the properties decisions, the family's constraints, the insights precedents, the sovereign-Python and brake decisions). Four findings changed the plan:

1. **Poe Properties already has its application**, live on the door, transcribed field-for-field from the paper form, with the SSN and licence number deliberately never stored and the fair-housing guard already a machine check. Building a second one would have been a duplicate; the real gap was that not a word of it could change without a deploy, and the criteria DR-0101 requires *in writing* did not exist.
2. **There is no `landlord` instance.** The 12 doors live in `poe-family`, on purpose (DR-0313: one module, two doors). "Each has their own databases" therefore means the instance + RLS wall, and giving Properties its own instance is a tenancy decision with a dated re-review — not something to do quietly inside a forms change.
3. **There is no family bucket and no household record.** The Family Roster names the people; nothing named the household.
4. **The Behavioral Mirror had no code.** DATA → TRUTH → IDENTITY → INVITATION has been doctrine since the foundations; `derived-insights.js` is a pure library nothing mounts.

## What was built (DR-0357)

- **`lib/forms-engine.js`** — TLC's proven way with the product lifted out. `tlc-office-forms.js` keeps its API and delegates; every TLC suite passes untouched. Two corrections the lift forced: the base-vs-added validator is now everyone's, and an acknowledgment or floor question is required by definition so a default form can never fail its own validation.
- **`lib/product-forms.js`** — the registry. PoeTech: the household intake (42 questions, nine sections) and the Household Covenant. Poe Properties: the application converted onto the engine (63 questions; the out-of-band and derived fields dropped by construction, the lawyer-blocked consumer-report section excluded and asserted so by test) plus two new documents, *What we look at in an application* and *How we choose, and how we do not* — with every threshold left as the office's to fill, because inventing one would be a fabricated policy.
- **Migration 0200** — `product_forms (instance_id, product, key)` + append-only history + save/read. **No `instance_type` anywhere**, so the day Properties gets its own instance nothing changes. Owner/admin saves with a note; an anonymous applicant may read the properties product only, and only for a named office.
- **Migration 0201** — the household record (a cell for every item, patched cell by cell, the covenant signed in place with the server's clock) and the `family-documents` shelf: a file OR a pointer, private until shared, and sharing does not hand over the pen.
- **`lib/household-insights.js`** — the first code behind the Behavioral Mirror. Every finding carries the rows it read; no rows produces no finding; `WORKFLOW_LADDER` (Noticed → Described → MVP → Systematized → Hardened) makes the process visible, with candidates drawn from what the household itself named.
- **Surfaces** — `HouseholdSpace` (record · documents · findings) beside the Family Roster on Command & Serve; *Before you apply* on the Poe Properties door.

## The walls held

Every constraint the DR history imposes was kept and is asserted: no PII in the repo; no password, bank number, SSN or diagnosis in a household record (by key in the guard AND by table constraint); an adult answers about the household and children are counted in ranges, because DR-0093's consent/assent flow is still owed and nothing here may open a child-facing data stream; health is logistics, never a clinical record; the shelf's honesty about what is *not* built (no key only the family holds); fair housing and FCRA in writing, framed as the office's own policy verified with a licensed professional, never legal advice.

## Proof

`0200-product-forms-smoke.sql` and `0201-household-and-vault-smoke.sql` on a new `product-forms` isolation leg; `product-forms.test.js` (11), `household-record.test.js` (16), `household-space-render.test.jsx` (7); lint, the guards, the standards suites, the build and the layout probe. Live proof after merge: db-migrate 0200–0201, then the rls-isolation run it dispatches.

## Left open, deliberately

- **A landlord instance for Poe Properties** — the Governor's call; collides with DR-0313's rent-posting rule.
- **The editor screen** for the new products' forms (the engine and the save are in; the screen is not). *re-review: 2026-09-18.*
- **Training an LLM on the family's record** — no corpus, no box, no consent mechanism and no gate exist, and no DR authorizes any of it. Named, not started.
