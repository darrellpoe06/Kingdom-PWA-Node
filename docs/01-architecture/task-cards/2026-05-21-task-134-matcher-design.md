# Task card — #134 · Design matcher rules for properties / tenants / contractors / projects (CONNECTED-CONTEXT phase 2.5)

**Date:** 2026-05-21 · **Issued by:** Cowork (via Claude Code surfacing gap during task #88) · **Status:** open · **Depends on:** task #87 (links shape) ✓ done · task #88 (auto-link on inquiry + incident) ✓ done in this session

---

**Foundation rules that apply:**

- `/docs/00-foundations/_root/CONNECTED-CONTEXT.md` — the binding rule for how data relates to itself. Auto-link is **Rule 1** (mandatory under the hood). This card extends it to four entity types not yet covered.
- `/docs/00-foundations/_root/CONNECTED-CONTEXT.md` — **anti-pattern: Connection spam.** "If matching on 'same date' produces 200 useless connections, that auto-link rule is wrong and gets removed. Quality bar: a typical record should have between 0 and ~12 meaningful links, not hundreds of noise." This is the binding constraint on every rule designed below.
- `/docs/00-foundations/_root/IN-PLACE-FIRST.md` — the suggestion UI lands in the create form, not a modal.
- `/docs/00-foundations/_root/SITUATIONAL-PEACE.md` — suggestions must reduce noise, not add to it; a chip with no clear "why" defeats the principle.

---

**The gap (surfaced 2026-05-21 during task #88 wire-up):**

`findRelatedAuto(newItem, entityType, allData, maxResults)` currently matches only four entity types:

| entityType | matches on | kind tagged |
|---|---|---|
| `incident` | same `linkType:'rental'` + `linkId` | `same-property` |
| `inbound`  | same `caller` | `same-caller` |
| `inquiry`  | same `source` | `same-source` |
| `feedback` | same `currentView` | `same-view` |

Task #88's scope named six entity flows. Two of the six (incident, inquiry) had matchers and were wired up in r42. **Four did not:** properties, tenants, contractors, projects. They were deferred to this card rather than guessed at, because Connected-Context's anti-spam constraint is real — a wrong matcher would dump ~hundreds of noise links into the user's view.

---

**Candidate matcher rules to evaluate (starting points, not decisions):**

For each entity type below, the proposal is **one default rule per type**, designed to clear the anti-spam bar (typical match count under 12 per new record). Each rule must be tested against the seed data before shipping.

### Properties (`rental`)
- **Candidate kind:** `same-entity` — properties owned by the same legal entity (e.g., Poe Properties LLC) often share a manager, vendor pool, tax category, insurance carrier. A new property gets a quick path to "this is how the others in the same entity are set up."
- **Alternative:** `same-zip` — proximity matters for vendor scheduling and inspection routing, but only if multiple properties exist in one ZIP. Sparser than same-entity.
- **Anti-spam check:** Does it return < 12 matches in the seed? Poe Properties has ~11 rentals — same-entity returns 10 for each new one. Borderline. Refinement: cap at `maxResults = 5` and rank by recency (last activity, last maintenance, last rent change).

### Tenants (`tenant` — sub-entity of rental)
- **Candidate kind:** `same-property` — when a new tenant is added to a property that previously had tenants, link to the prior tenancy. Useful for handoff (deposits, condition notes, what worked / didn't).
- **Alternative:** `prior-tenancy-same-name` — if a tenant comes back to a different unit; relies on name match which has false-positive risk.
- **Anti-spam check:** Typically 0–3 prior tenancies on a single property — well under 12. Safe.
- **Caveat:** Tenants aren't a top-level entity yet in seed data; they're nested in `rental.lease`. Either lift them to top-level for #134 or scope this rule to "find prior `rental.lease.history`" instead.

### Contractors (`contractor1099`)
- **Candidate kind:** `same-trade` — contractors with overlapping `trades` arrays. Useful when sourcing for a new project: "you've worked with X on similar trade before."
- **Alternative:** `prior-scope-with-same-entity` — contractor has had a scope agreement with the same engaging entity.
- **Anti-spam check:** Trade overlap could be too broad ("plumber" matches every plumber). Refinement: require **2+ trade tags in common**, OR require same-entity scope history.

### Projects (`project`)
- **Candidate kind:** `same-domain` — projects in the same domain (`business-poetech`, `family`, `church`, etc.). Useful for capacity planning and recurring-pattern detection.
- **Alternative:** `same-contractor` — projects sharing a contractor on the contractorIds list. Sharper signal than domain.
- **Anti-spam check:** Domain is coarse — `business-poetech` could match dozens. Refinement: require same-domain AND (same-entity OR overlapping-contractor) — two-of-three.

---

**Out of scope (do NOT decide in this card):**

- Don't wire UI for these four types until the rules pass the anti-spam check on seed data.
- Don't ship multiple matchers per entity type at once; pick one default, ship it, observe link density, then add a second if quality holds.
- Don't change the existing four matchers (incident, inbound, inquiry, feedback).

---

**Verification commands (when the matcher rules land):**

1. For each new rule, write a one-off script that runs the matcher against every record in seed data and reports: `(entity_type, new_record_id, match_count, match_kinds_distribution)`.
2. Inspect: are any records returning > 12 matches? If yes, refine the rule before shipping.
3. `npm run lint && npm run build` per the standard gate.
4. Wire UI per the same IN-PLACE-FIRST chip pattern used in r42 (Practice.jsx + the incident form).

---

**When done, report back:**

1. Which rule was chosen for each of the four entity types and why.
2. Anti-spam check numbers per rule (max match count on seed, mean match count, distribution).
3. `git diff --stat`
4. Build + lint output (last 5 lines each).
5. Any deviation from the candidate rules above, with one-line reason.

---

**Notes from Cowork:**

This card exists because task #88 surfaced the gap honestly instead of guessing matchers. Continue that discipline: **design before wiring** for these four. The cost of a bad matcher (connection spam) is higher than the cost of waiting one more session to think it through.

If during design any of the four entity types turn out to have no reliable signal short of user-defined links, that's a valid outcome — flag it and move that entity type to task #90 (user-defined linking) instead.
