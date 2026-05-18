# Lifecycle & Handoff — How work travels through the system

> Founder framing (2026-05-18):
> *"Make sure the processes are cyclical and optional. Add or get rid of any process. However we want the process to be historical — like phase 1 of this project, and now phase 2 with all the background information available to continue if that's with the same people or not, that way transition and hand-offs are easy. Again making sure all data comes back into the system and nothing is lost — but we don't want too much either, a perfect balance. Have the system attach old data to the new issues as they come in, so the person can choose to see historical data for reference or not. Either way it's a better hand-off. Also, triage should suggest who can take care of it and bring up a list based on history if it has any."*

This is the binding pattern for every trackable item in the system: incidents, projects, inquiries, feedback, capex items, tenant conversations, voicemails, and anything added later. **Three patterns. Each one is optional in the user's hands; each one is required in the data model.**

---

## Pattern 1 — Lifecycle Log (the history rail)

Every trackable entity carries a `lifecycle` object:

```js
lifecycle: {
  phase: 'new',                      // current state
  openedAt: '2026-05-18T13:42:00Z',
  closedAt: null,                    // set when item reaches a terminal phase
  log: [
    { at: '2026-05-18T13:42:00Z', fromPhase: null,        toPhase: 'new',         by: 'darrell',  note: 'created from Voice Ops inbound' },
    { at: '2026-05-18T14:10:00Z', fromPhase: 'new',       toPhase: 'in-progress', by: 'darrell',  note: 'called tenant, scheduled visit' },
    { at: '2026-05-20T09:00:00Z', fromPhase: 'in-progress', toPhase: 'resolved',  by: 'christina', note: 'visit completed, faucet repaired' },
  ],
}
```

### Rules

- **No phase change is silent.** Every `phase` write pushes a `log` entry. The PWA's status-update affordances do this automatically; manual edits prompt for a note.
- **Phases are cyclical, not linear.** A `resolved` incident can reopen as `new` if it recurs. A `shipped` feedback item can move back to `planned` if a follow-up surfaces. The log captures the loop; the current `phase` is just a pointer.
- **Terminal phases are still re-openable.** Closed never means deleted. A handler picking up next week sees the full log + can advance to the next phase.
- **Optional process steps are honored.** If a phase doesn't apply (e.g., an incident never went through `triaging` because it was self-evident), it's simply absent from the log. We never invent steps the user didn't perform.

### Why this matters

A new handler — whether that's Christina taking over from Darrell, a future PoeTech employee taking over from Christina, or a paying customer's new property manager taking over from their predecessor — opens an item and **sees what was done, by whom, when, and why**. No verbal handoff required. The system is the handoff.

This is "phase 1 of this project, now phase 2 with all the background information available." Every entity is its own multi-phase project; the log is the historical record.

### Data retention discipline ("perfect balance")

- **Keep:** every phase transition + the note attached. These are decisions, and decisions are load-bearing.
- **Don't keep:** every keystroke, every form-field re-edit before save, every internal UI state. Those are noise.
- **Old logs:** never auto-deleted. Storage cost is negligible (text is cheap); cognitive cost of losing context is high.
- **PII inside logs:** if a note contains anything sensitive (medical info, SSNs, etc.), the form should refuse the save and prompt for redaction before adding it to the log. (TLC stays out of this system entirely; this is for the general case.)

---

## Pattern 2 — Related History (the "you've seen this before" panel)

When a new entity is created, the system **automatically attaches related historical entities** as optional reference. The user can expand to see them or skip and proceed.

### Match keys (in priority order)

| Entity type | Match keys |
|---|---|
| Incident on a property | Same property → all prior incidents (open + closed) |
| Inquiry | Same source (referral / channel) → prior inquiries from that source |
| Voicemail (Inbound) | Same caller number → prior calls from that number |
| Feedback | Same `currentView` → prior feedback on that screen |
| Project | Same tag/scope category → prior projects in that category |
| Capex | Same entity + same category → prior capex items |

### UI contract

A new entity creation form shows a collapsible **"Related history (N items)"** section. Default state: **collapsed** — so the user isn't forced to read history they don't want. The count is visible so they know what's available. Expanding shows a chronological list with phase, date, owner, and 1-line summary. Each item is clickable to jump to the full record.

### Rules

- **Never block creation on history review.** The new item creates regardless. The history is reference, not gate.
- **History stays attached.** Even after the new item is created, the related-history list persists on the item so a future handler can see what was "in the room" when the item was opened.
- **Volume cap.** Show the 10 most recent matches. If more exist, link out to a filtered view of all of them. No infinite scroll on creation forms.
- **Cross-references count too.** If a tenant calls about plumbing for the third time and the system shows the first two calls, the related history is doing its job. The math is local; no LLM needed; pattern-match on indexed fields.

### Why this matters

Two reasons. First: prevent re-discovery. If the property's HVAC has been serviced three times in two years, the new handler should see that without having to ask. Second: handoff continuity. If the customer is on their third property manager, that property manager opens the same incident and gets the prior two managers' context for free.

---

## Pattern 3 — Assignee Suggest (the "who can take this" list)

When an item is open and needs an owner, the system surfaces a **ranked list of suggested handlers**. Optional — the user can pick anyone, including someone not on the list. The suggestion is informational, not prescriptive.

### Ranking inputs

1. **Skill profile match.** If the item has tags (e.g., `plumbing`, `tenant-comms`, `bookkeeping`), match against each `skillProfile.skills` array. Higher tag overlap → higher rank.
2. **Prior closures of similar items.** If a person has previously closed N items with overlapping tags or against the same property/source, that history boosts their rank. Recency-weighted (last 90 days counts more).
3. **Available capacity.** Pull from the existing Capacity Guard — if a person is already at >100% committed hrs/wk, their rank is penalized (shown in the list but flagged "over capacity"). At <80%, no penalty. Between 80–100%, mild penalty.
4. **Explicit availability.** If a skill profile has a "currently unavailable" flag (vacation, leave, etc. — future field), they're excluded from the suggestion entirely but still pickable manually.

### Display

A short list: top 3 suggested handlers with name, primary skill match, prior-similar closure count, and current capacity %. Click to assign. Below the list: a regular "Assign to…" dropdown with everyone. Always optional; the user can also leave it unassigned.

### Rules

- **No auto-assignment.** The system suggests; humans decide. This is the whole point of "optional" in the user's framing.
- **Track who actually closed.** When an item moves to a terminal phase, record the handler in the lifecycle log. This feeds back into the ranking for next time. Self-improving from real use, no ML required.
- **First-use behavior.** Before there's any closure history, the suggestion ranks purely on skill match + capacity. The list still exists; it just starts shallow.

### Why this matters

Three reasons. First: speed — the right person picked in one tap instead of three. Second: fairness — load distributes across handlers based on capacity, not based on who-shouts-loudest. Third: continuity — when a handler leaves, the system already knows who else has worked similar items.

---

## How the three patterns combine

A typical lived example:

1. Voicemail lands on the Inbound tab (Pattern 1: `lifecycle.phase = 'new'`).
2. User taps "Convert to Incident." The creation form opens. Pattern 2 shows: *"Related history: 2 prior incidents at this property — expand to view."*
3. User glances at the history, sees the prior plumbing repair, notes that the same vendor was used. Creates the incident with that context in the related-history attachment.
4. Incident shows Pattern 3: *"Suggested handlers: Darrell (3 prior plumbing closures, 65% capacity), Christina (1 prior, 80% capacity)."* User taps Darrell.
5. Incident moves through phases: `new → triaging → in-progress → resolved`. Each step writes a log entry. (Pattern 1.)
6. Three months later, a different tenant at the same property has the same issue. The new incident form shows three items in related history now — and Darrell's name is even higher on the suggested-handlers list because of his successful prior closures.

The system gets smarter as the family uses it. No AI required. Just disciplined data capture + simple ranking math.

---

## Where these patterns live in the codebase

To be implemented across these entity types (each gets the same `lifecycle` shape + related-history matching + assignee-suggest engine):

- `data.incidents[]` — already has `status`, needs `lifecycle.log` + `assignee` + suggestion engine
- `data.projects[]` — already has `status`, needs the same
- `data.feedback[]` — needs `lifecycle` with the new → reviewed → planned → shipped flow
- `data.inquiries[]` (Practice) — already has `status`, needs the same
- `data.capexItems[]` — needs `lifecycle` for the buy-or-park journey
- `data.inbound[]` (Voicemails) — has `handled_as`, needs the full lifecycle as it's the entry-point for many other items

A small set of shared helpers does the heavy lifting:

- `advancePhase(item, newPhase, by, note)` — writes the log entry, updates `closedAt` if terminal.
- `findRelatedHistory(item, entityType, allData)` — pure function, returns 10 most recent matches.
- `suggestHandlers(item, skillProfiles, allCompletedItems, capacityMap)` — returns ranked list.

These are local-first computations. No backend required. They scale to thousands of items per instance on a phone.

---

## Sustainability check (per Poe Family operating rule)

| Item | Cost |
|---|---|
| Lifecycle log storage | $0 (IndexedDB; text is cheap) |
| Related history compute | $0 (in-memory pattern match) |
| Assignee suggest compute | $0 (in-memory ranking) |
| Cross-instance learning (later) | Phase 2 backend, $0 incremental on Cloudflare Workers free tier |

No new paid dependency at any phase. Rule held.

---

## Cross-references

- `SITUATIONAL-PEACE.md` — these patterns ARE the peace mechanism: a new storm-handler walks in and has every prior storm's response already in their hand.
- `FOUNDERS-CONFESSION.md` — His Story not mine; the handoff is built so the work outlasts any individual handler.
- `EXCELLENCE-STANDARD.md` — religion AND relationship. Religion: the data model is precise. Relationship: the UI is optional, the history is browse-by-choice, the assignment is suggested-not-mandated.
- `MULTI-INSTANCE-STRATEGY.md` — multi-instance customers will need exactly this for their own internal handoffs; baking it in once means it ships to every customer simultaneously.
- `/docs/00-foundations/KPIS.md` — to be updated: each entity's lifecycle log is a data source for trend KPIs ("avg time-to-close per category", "handler closure rate", etc.).
- `/docs/00-foundations/GLOSSARY.md` — to be updated with: Lifecycle Log, Related History, Assignee Suggest, Phase, Handler.

---

## Roll-out sequence

To ship safely without breaking the current MVP:

1. **Foundation.** This doc. ✓ (locked in).
2. **Data model.** Add `lifecycle: { phase, openedAt, closedAt, log: [] }` to incidents, projects, inquiries, feedback, capex, inbound. Defaults written for existing records (treat current `status` as `phase`, synthesize a one-entry log marking creation).
3. **Phase-change discipline.** All status-update affordances in the UI go through `advancePhase()`. Adds the log entry automatically; prompts for an optional note.
4. **History rail UI.** Collapsible "History (N entries)" section on every item.
5. **Related history.** Pure-function matcher + collapsible "Related history (N items)" on creation forms.
6. **Assignee suggest.** Ranking function + top-3 panel on every open item.
7. **KPI/Glossary updates.** Once the data is flowing.

Each step is independently shippable. None depends on a later step. The user can stop at any point and have a working improvement.

---

**End of document.** Binding for every entity that tracks work in the SKOS / PoeTech Family OS. Future entity types (e.g., maintenance contracts, donor pledges, volunteer hours) inherit this pattern automatically; designing a new entity without it is a regression and should be caught in review.
