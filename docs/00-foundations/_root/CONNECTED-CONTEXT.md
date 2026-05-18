# Connected Context — Everything is linked under the hood; surfaced only when wanted

> Founder framing (2026-05-18):
> *"We want to make sure we use all data where it makes sense to give our users the best context and data possible — as options, not as mandatory — but mandatory under the hood for those who know and want to see how things are tied together, and may want to give us ideas that don't come from our experiences that will help their communities, trades using the tool, and other people trying to use technology in various ways."*

This is the binding rule for **how data relates to itself** across SKOS / PoeTech Family OS. It is upstream of every feature that touches a record.

---

## Two rules. Non-negotiable.

### Rule 1 — Mandatory under the hood

Every trackable entity in the system carries a **`links` array** that connects it to every other entity it touches. Property → tenant → lease → maintenance log → vendor → scope → invoice → 1099 → entity → tax category — all linked. Inquiry → source → conversion → recurring revenue. Feedback → view → user → instance type → similar feedback. Voicemail → caller → property → existing incident → handler.

Connections happen at write time. The system does not wait for someone to ask "is this related?" — it already knows.

### Rule 2 — Optional on the surface

Default UI shows only what the user needs to act right now. The full graph is one tap away — a **"Show connections"** affordance on every record — but never pushed into the user's face. Some users will live their whole tenure with the system never tapping it. Others (SMEs, power users, customers who think in systems, future employees doing handoffs) will live in it.

Both are correct uses of the same software.

---

## Why this matters

Three reasons, in order of stakes:

1. **The data is the moat.** Customers (and SMEs, and family members reviewing the system) who ask *"how do these things connect?"* are answering a question that competitors using siloed apps cannot answer. That capability is most of the value proposition.

2. **Their ideas, not just ours.** The user said it plainly: *"they may want to give us ideas that don't come from our experiences."* A trades customer will see connections between scope, materials cost, and weather that a therapy-practice customer never thinks about. A church admin will see connections between a hospitality team and a maintenance request that we'd never name. The system must be **structurally open to connections we did not predict**.

3. **Handoff and continuity.** A new family member or new property manager opens the system and asks *"why is this tied to that?"* — the answer is on the screen, with timestamps and the original logic. No tribal knowledge required. This is `LIFECYCLE-AND-HANDOFF.md` extended to the full data graph.

---

## How this interacts with what's already built

This is not a new pattern — it's the **unification** of patterns already shipping.

| Existing pattern | What it already does | What Connected Context formalizes |
|---|---|---|
| Lifecycle Log (`LIFECYCLE-AND-HANDOFF.md`) | Each entity carries its own state history | Every entry in the log can also link to other entities ("status changed because incident #X was resolved") |
| Related History (`LIFECYCLE-AND-HANDOFF.md`) | New issues see prior issues on the same property/caller/source | Just one expression of universal cross-linking; same engine powers all related-X panels |
| Cross-reference strip (Big Picture) | Five-cell strip linking to source tabs | The same affordance, scaled to every record: "this maintenance log → 3 connections" |
| Action Queue ↔ Property/Inquiry | Items already reference source records | Formalized as bidirectional links so both sides know |
| Feedback tied to current view | Each feedback row records the screen it came from | Same idea, generalized: every record records the context it was born in |
| Multi-instance (`MULTI-INSTANCE-STRATEGY.md`) Phase 2 backend | Feedback flows back to PoeTech central | New: connection-suggestions flow back too. When 70% of trades-template customers manually link "scope → weather," that becomes a default rule for the trades template. |

Nothing is being torn out. Connected Context is the **organizing principle** these features were already trying to express.

---

## Data model

### Every entity gains a uniform link shape

```js
item.links = [
  {
    id: 'l-<random>',          // own id, for editing/deleting the link itself
    toEntityType: 'incident',  // 'incident' | 'project' | 'inquiry' | 'property' | 'scope' | 'transaction' | 'account' | 'feedback' | 'inbound' | 'capex' | 'tenant' | 'conversation' | 'event' | etc.
    toEntityId:   'in-1234',   // foreign id
    kind:         'caused-by', // 'caused-by' | 'resolves' | 'follows' | 'parent-of' | 'duplicates' | 'same-property' | 'same-caller' | 'same-source' | 'related' | 'user-defined' | ...
    source:       'auto',      // 'auto' (system inferred) | 'user' (manually added) | 'suggested' (system proposed, user accepted)
    at:           '2026-05-18T13:42:00Z',
    by:           'user' | 'system' | 'darrell' | …,
    note:         '',          // optional human note about why this link exists
  },
  …
]
```

### Bidirectionality

Every link is **stored once, traversable in both directions**. When `incident.links` references a property, the property's view of "related incidents" doesn't store a duplicate — it queries `incidents` where `links.toEntityId === thisProperty.id`. Pure functions, no consistency bugs.

### Link kinds — opinionated but extensible

The system ships with a starter taxonomy of `kind` values (above). Users (and especially feedback contributions from other communities/trades) can introduce **new kinds**. New kinds start as `source: 'user'`. If enough instances of the same template use the same new kind, Phase 2 backend can suggest promoting it to the canonical taxonomy for that template.

### Storage cost

A link is ~6 fields of text + 2 IDs. Hundreds of thousands of links easily fit in the same IndexedDB the rest of the data uses. No new infrastructure. No new bill.

---

## UI contract

### Default: invisible

A typical screen does not show the full link graph. It shows:
- The record the user is looking at
- A small **`🔗 N`** badge in the corner of each record where N > 0 (subtle, monospace, never colored aggressively)

### One tap: "Show connections"

Clicking the badge expands an inline panel listing every linked entity grouped by `kind`. Each link is itself tappable to navigate. The panel can be dismissed; the user is right back where they were.

### Power-user view: the graph

A tier-gated (PoeTech+ and above) **`Connections`** tab shows a node-and-edge view of the active record's neighborhood, 1–2 hops out. Hover any node for its summary, click to navigate. Built with pure SVG (no graph library); free; works offline.

### User-defined linking — "I see something you don't"

On any record, a **`+ Link to…`** affordance lets the user manually connect this record to any other. They pick:
- The other entity (searchable picker)
- The `kind` (dropdown of existing kinds + free-text option)
- An optional note explaining the connection

This is **the channel for ideas that don't come from our experiences**. Every user-defined link with a free-text kind becomes a feedback candidate that PoeTech central can review and, if useful broadly, promote into the template defaults.

---

## Cross-pollination across instances (Phase 2 backend, when ready)

Per `MULTI-INSTANCE-STRATEGY.md` Phase 2: aggregated, anonymized link patterns can flow back to PoeTech central. Not the data — never the data — just the patterns:

- "65% of trades-template customers link `scope` to `weather-window` with a user-defined `kind=blocked-by`. Promote this to a default link rule for the trades template?"
- "Therapy-practice customers consistently link `inquiry → referral-source → existing-client` to detect chain referrals. Add a 'referral chain' view to the Practice tab for that template?"
- "Church-template customers link `event → volunteer → maintenance-request`. Add a 'volunteer impact' view?"

The customer always sees the link suggestion as: *"Other [trades / churches / therapy practices] connect these — want to enable for your instance?"* It is never imposed.

---

## Anti-patterns (what this rule explicitly forbids)

- **Hidden coupling.** No silent connection. Every link is in `item.links` where a user can see it (via the badge) if they choose to. Nothing happens because of a connection the user can't audit.
- **Auto-merge.** The system never deduplicates entities based on link patterns. Two records that look related stay two records with a link between them. Merging is a user decision.
- **Mandatory-on-surface, optional-under-the-hood.** That's the inversion. We're going the other way: mandatory under the hood, optional on the surface.
- **Closed taxonomy.** We do not freeze the list of link `kind` values. Users — especially users from communities/trades we have not lived in — must be able to name their own connections.
- **Connection spam.** Links must add information. If matching on "same date" produces 200 useless connections, that auto-link rule is wrong and gets removed. Quality bar: a typical record should have between 0 and ~12 meaningful links, not hundreds of noise.

---

## Sustainability check

| Item | Cost |
|---|---|
| `item.links` storage | $0 (IndexedDB; text is cheap) |
| Auto-linking compute | $0 (in-memory matching on indexed keys) |
| "Show connections" inline UI | $0 (single component reused everywhere) |
| Graph view (SVG, no library) | $0 |
| Link-pattern aggregation (Phase 2 backend) | $0 incremental (same Worker + D1 as feedback ingestion) |

No new paid dependency at any phase. Rule held.

---

## Roll-out sequence

Each step shippable in isolation:

1. **Foundation.** This doc. ✓ (locked in).
2. **Data shape.** Add `links: []` to every entity creator. Default empty.
3. **Auto-link on create.** When a new entity is created, run the related-history matcher (already designed for `LIFECYCLE-AND-HANDOFF.md` Pattern 2) and write the matches as `source: 'auto'` links. Reuses the same code.
4. **Badge + inline panel.** `🔗 N` on every record; tap to expand.
5. **"+ Link to…" affordance.** Manual link creation, including free-text kinds.
6. **Graph view (PoeTech+ tier).** SVG node-and-edge view, 1–2 hops.
7. **Phase 2 cross-instance suggestions.** Worker-side aggregation, opt-in surfacing.
8. **Feedback Log enhancement.** Every user-defined link with a free-text kind generates a feedback candidate visible to PoeTech central.

Each step is independently useful. The system gets smarter cumulatively; the user is never blocked waiting for the next step.

---

## Cross-references

- `LIFECYCLE-AND-HANDOFF.md` — Connected Context is the broader principle; the three patterns there (Lifecycle Log, Related History, Assignee Suggest) are specific applications.
- `MULTI-INSTANCE-STRATEGY.md` — Phase 2 backend gives this its cross-instance learning loop.
- `SITUATIONAL-PEACE.md` — Connected Context produces peace by making the full picture available without forcing the user to assemble it themselves.
- `FOUNDERS-CONFESSION.md` — His Story not mine; the system serves the steward by showing them every thread He has already woven.
- `EXCELLENCE-STANDARD.md` — religion AND relationship. Religion: every link is precise, audited, sourced. Relationship: nothing is forced; the user opens what they want, when they want.
- `/docs/00-foundations/GLOSSARY.md` — to be updated: Link, Link Kind, Connection Badge, Connections View, User-Defined Link.
- `/docs/00-foundations/KPIS.md` — to be updated: link density per entity, % of records with at least one user-defined link, top emergent link kinds per instance template.

---

## How to recognize when it's working

- A new family member or property manager opens any record and never has to ask *"why is this here?"* — the connections are on the screen.
- A user from a community we have not lived in (a kinship caregiver, a Black contractor, a foster family, a farmer) introduces a `kind` we never named, and a year later it's a default for their template.
- Customer-service-score feedback shifts from "how do I find X?" to "I noticed Y was connected to Z and that was super helpful" — meaning the surface is doing its job.
- PoeTech central sees emergent patterns across instances we never coded for, and the roadmap gets re-shaped by what real users are connecting in real life.

---

**End of document.** Binding. Any new entity type added to the system must implement the `links` shape and the badge/inline-panel UI; designing one without it is a regression. Connected Context is the soil in which Lifecycle, Handoff, and Multi-Instance all grow.
