# DR-1175: Your team is named before a shovel moves — the sixteen people a ground-up build needs, and which of them you have

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (additive: one new table behind 0307's existing wall, one new card on an owner-only tab)
**Type:** build
**Area:**
- `infra/supabase/migrations-auto/0308-a-team-is-named-before-a-shovel-moves.sql` (`dev_team`, the sixth child of `dev_projects`)
- `app/src/modules/properties/development-team.js` (the slide, verbatim; `rolesFor`, `teamState`, `nextToFind`, `teamWords`, `SEQUENCE_READING`)
- `app/src/modules/properties/development-cloud.js` (`dev_team` joins `CHILD_TABLES`; `setTeamMember`; `projectForEngine` returns `filled`)
- `app/src/modules/properties/DevelopmentTab.jsx` (the `Team` card, mounted FIRST)
- `scripts/system-flow-registry.mjs` (`db:dev_team` placed on the development loop)
- `app/src/__tests__/your-team-for-building-from-nothing.test.js` (15 cases: the slide)
- `app/src/__tests__/your-team-is-named-before-a-shovel-moves.test.jsx` (20 cases: the records, the seam, the card)

**Grounds:** Darrell, 2026-10-21, with a photograph of a slide titled "Your Team" and a link (`https://youtu.be/6GVmsB3PLmY`): **"Research and add features and functionality for users to formulation of their teams... make sense? Inside the Poe Properties Apps for building from nothing... make sense?"**
**Principles:** DR-1166 (the development records this joins); DR-0076 §4 (measure, don't claim — §8 provenance: his list and my reading are kept apart); DR-0061 / reality trace (name the real table before drawing a surface); DR-0365 (the landlord instance); DR-0202 (the books' wall); DR-0065 (build it in the app)

## Context

Poe Properties could count a building before it existed — its budget, its change orders, its bays, its phase checks, its capital (DR-1166, migration 0307). It could not name a single person who would build it.

He sent a slide listing sixteen roles, numbered, with three marked "(commercial)", nine set in bold, and one annotation. For a person building from nothing, that list is the thing they do not have and do not yet know to go and find. The slide is the spec, and it is not paraphrased anywhere in this change.

## What was measured

- **The whole of what the module knew about people, before a line of this.** Two kinds, and neither is this one: `app/src/modules/properties/people.js` — the invites on a DOOR (tenant, household, worker, manager), everyone attached to a unit that already exists; and `dispatch-roster.js` — the workers a maintenance REQUEST can be sent to, everyone fixing something already built. **Nothing in the module knows a surveyor, an architect or a lender**, because nothing in it had ever been about building from nothing.
- **The slide itself, counted rather than summarised:** 16 roles; 9 set bold (`1, 2, 3, 5, 6, 7, 8, 13, 14`); 3 marked "(commercial)" (Civil, MEP, Structural Engineer); exactly 1 annotated (16, Property Manager — "should be a part of the dev process"). What the bold MEANS is stated nowhere on it.
- **The mount already existed.** `MANAGER_TABS` carries `development`, and `DevelopmentTab.jsx` already computed `const hasCommercial = project && ['mixed-use', 'commercial'].includes(project.kind)` — exactly the question `rolesFor({ commercial })` asks.
- **0307's pattern, read before mirroring it:** five child tables, each `project_id` + `instance_id`, RLS through `dev_can_read` / `dev_can_write` / `dev_project_in`, both overlays re-applied in 0232's order. `dev_team` is the sixth and declares no new rule.
- **His video's own words are not in hand.** `source-transcript.yml` was dispatched on main for that link at 13:30 (run `39608625742`) and was still QUEUED when this shipped — Actions had ~25 runs queued against 3 in progress all session. So nothing in this change is sourced from the video; only from the slide.

## Impact

- A project opens on **who you have and who you still need**, before anything is priced — the Team card is FIRST on the tab, above Budget, because the team is what you find before there is a price to put in a budget.
- An empty record reads **"Nobody on the team yet — 16 roles to fill"** and names the first to go and find. That is the true answer for someone starting from nothing, and it is the whole point of the card.
- A residential build is offered 13, not 16, and the card SAYS which three are missing and why — the slide's own word "commercial", not an inference of ours.
- Nothing moves for the five sibling tables, the arithmetic in `development.js`, or any other tab.

## Decision

**`dev_team` is the sixth child of a development project: one row per role, holding whoever fills it.** A role nobody fills has **no row**, so the difference between the sixteen roles in code and the names in the database IS the answer to "who do I still need" — there is no row pretending to be a gap, and no gap pretending to be a row.

- **His list is carried verbatim and his emphasis is carried as DATA, never as a claim.** `emphasis: 'bold' | 'plain'` records what the slide sets; the slide does not say what bold means, so the card says *"It sets nine of them in bold and does not say what bold means"* and counts them as **the slide's emphasis**. The words "required"/"optional" appear nowhere, and a case asserts the whole card's text never matches `/required/i`. "GC" stays "GC" — spelling it out would be us improving his source.
- **My reading of the numbering is labelled as mine.** `SEQUENCE_READING.whose` is literally *"read from the numbering by PoeTech, not stated on the slide"*, and the card prints that attribution beside the reading (survey and soil before a design; a design before a price; a price before a lender). A case asserts the reading is not smuggled into any role.
- **A blank name is refused, in two places.** The database's `dev_team_name_chk` refuses it, and `setTeamMember` refuses it first with **its own reason** (`needs-a-person`), not the project's `needs-a-name` — the two say different things to a person and must not share one sentence. Emptying a role is `deleteRow('dev_team', id)`: the role goes back to being a gap, which is the truth.
- **One person to a role** (`UNIQUE (project_id, role_key)`), so "2 of 16 filled" counts roles and never rows, and saving the same role twice replaces the person instead of growing a second row both counts would read.
- **The wall is 0307's, inherited unchanged:** owner, admin and member read; owner or admin write; a child row must sit in its project's own instance, so a name cannot be filed into another household's project. A tenant, a child, an assistant and a viewer read nothing here — these are a developer's contacts, not a door's.
- **`role_key` is not constrained to the sixteen.** A build can need a role the slide does not name; when it does, `label` carries that role's own words. The sixteen are the spec, not a ceiling.

## Verification

- **35 cases green** across the two suites (15 pinning the slide, 20 pinning the records, the seam and the card), plus the four development suites together: **75 passed**.
- **Two proven to catch, by breaking the code:**
  1. The card's sentence changed from *"not as a requirement"* to *"these nine are required"* → **1 red**; restored.
  2. `AND public.dev_project_in(project_id, instance_id)` deleted from `dev_team_insert`'s `WITH CHECK` → **green, wrongly.** My own assertion used a lazy `[\s\S]*?`, which ran past the end of the statement and matched the SIBLING update policy's copy of the clause. Rewritten as `[^;]*` so it cannot leave the statement; with the same break still in place → **1 red**; restored, 20 green. **A gate that cannot catch is itself a lie (DR-0076 §3), and this one could not until it was tested against the break.**
- **`interconnect-guard` caught a real omission** — `table dev_team (born in 0308...) has no declared place in the flow graph`. `db:dev_team` is now declared on the development loop's reads and writes; the graph reads 215 nodes / 571 connections / 0 findings.
- `verify:gates` 0 (24 guards, read without a pipe); lint 0 on all five changed files; monolith budget held at 5193 — **the shell did not grow**, the card mounts inside the existing tab.

## What this does not do

- **Nobody has seen it rendered.** This sandbox has no route to poetech.us or to a preview, so the live pass is the stewards' after deploy (DR-0104).
- **It tracks ONE person to a role, not candidates.** "Formulating" a team genuinely includes talking to three surveyors before picking one, and `UNIQUE (project_id, role_key)` forbids that today. Building half of it (a `state` column the counts would have to interpret) would make "2 of 16 filled" ambiguous, so it is not built blind. **`re-review: 2026-10-28`** on whether a candidate list earns its own row shape.
- **The video is unread.** `source-transcript.yml` run `39608625742` was still queued at the time of this commit. When its words land they either confirm `SEQUENCE_READING` or correct it; nothing in this change depends on them, and the reading is already labelled as not the slide's. **`re-review: 2026-10-22`.**
- **The Development tab does not follow the device's palette, and the Team card inherits that.** Every color on this tab is a literal hex (`#2F5D50`, `#1A1815`, `#E8E4DC`, `#6B665E`) rather than a theme token, so it reads the same under Heritage, Midnight and the rest — the exact complaint Darrell made about Real Estate on 2026-10-21 ("the colors can change with the color choices like the other tab"). The new card matches its neighbours rather than being the one themed island on an unthemed tab; `contrast-guard` PASSES all 11 themes and `legibility-guard` reports no new violation, so this is a consistency debt and not a legibility one. Converting the whole tab is its own pass. **`re-review: 2026-10-28`** with the Real Estate token work.
- **No role is wired to anything else yet.** A GC named here is not the same record as a worker on `dispatch-roster.js`, and a lender named here is not a `dev_capital` row. Joining them is real work with a real risk of merging two people who share a name; it is not done by guess. **`re-review: 2026-11-04`.**
