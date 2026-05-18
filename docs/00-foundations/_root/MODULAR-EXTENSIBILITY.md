# Modular Extensibility — Modules update / add / interact without breaking each other

> Founder direction (2026-05-18):
> *"I want to make sure we are doing work in a way where we can update and add modules that makes sense and interact with new data in ways that benefit the users."*

Binding architectural rule for how the SKOS / PoeTech Family OS grows. Operates alongside the existing foundations — `CONNECTED-CONTEXT.md` (data linking), `LIFECYCLE-AND-HANDOFF.md` (state history), `IDENTITY-ROLES-AUDIT.md` (who did what), `EDITABLE-EVERYWHERE.md` (every record editable), `IN-PLACE-FIRST.md` (inline UX), `LEGAL-PRIVACY-BOUNDARY.md` (confidentiality), `MULTI-INSTANCE-STRATEGY.md` (scaling) — and governs how all new work plugs into them without re-architecture.

---

## The rule

**Every module is a file. Every file owns its slice. New modules slot in without modifying the existing ones except at one well-defined integration point.** A module that requires touching three other modules to ship is wrong; it gets refactored before it merges.

This is **not** an aesthetic preference. It's how the system stays shippable as it grows past one founder + one device + one family into thousands of instances, multiple users, paid customers with custom needs.

---

## Five rules, non-negotiable

### Rule 1 — One module per file

Each top-level capability lives in its own file under `app/src/components/`:

```
components/
  shared.jsx              — pure presentational atoms (MetricCell, SectionTitle, …)
  About.jsx               — About tab + checkout cart
  Legal.jsx               — Legal Matters (placeholder → full)
  Contractors1099.jsx     — 1099 relationships
  (future)
  Cart.jsx                — Cart / subscriptions audit
  Markets.jsx             — Watchlist + Stooq fetch
  Practice.jsx            — Inquiry pipeline (TLC isolation enforced)
  Rentals.jsx             — Real Estate / property records
  Projects.jsx            — Projects + Scope + Capex
  DevOps.jsx              — Opportunity engine
  Books/                  — sub-tab modules (Entities, Accounts, Transactions, Calendar)
  Inbound.jsx             — Voice Ops UI
  BigPicture.jsx          — Dashboard
  Modules/{newModule}.jsx — anything new
```

When a section grows past ~300 lines inside the monolith, extract it. The truncation problem we've been fighting in `poe-financial-mvp-v28.jsx` is the symptom of not following this rule earlier. Every new module ships in its own file from day one.

### Rule 2 — Dependency injection via props, never globals

A module declares what it needs as props. It does not reach up into a parent component, does not import a `data` global, does not assume any particular state-management library.

```jsx
// GOOD — module declares its dependencies
function Contractors1099({ contractors, entities, addContractor, updateContractor, deleteContractor }) { … }

// BAD — module reaches into the global state
function Contractors1099() {
  const data = window.__appData;  // never do this
  const contractors = data.contractors1099;
}
```

Why this matters: testing, refactoring, and the eventual Phase 3 multi-tenant backend all become possible. A module that takes `addContractor` as a prop can be wired to local IndexedDB today and to a Cloudflare Worker tomorrow with zero internal change.

### Rule 3 — Integrate by data shape, not by import chain

A new module gets data integration "for free" by following the universal patterns:

- **Lifecycle:** add `lifecycle: { phase, openedAt, closedAt, log: [] }` to your records. Calling `appendLifecycleLog(item, newPhase, by, note)` already exists.
- **Links:** add `links: []` to records. Auto-link matcher (per `CONNECTED-CONTEXT.md`) does the rest at write-time.
- **Audit:** the lifecycle log IS the audit log. Add `by`, `byRole`, `device` per `IDENTITY-ROLES-AUDIT.md` once Phase 2 ships.
- **Edit affordance:** ship inline edit per `EDITABLE-EVERYWHERE.md`.
- **Permissions:** declare role requirements in `VIEW_TIER_REQUIREMENTS` (existing) and `PERMISSIONS_MATRIX` (when Phase 2 ships).

A module that respects these shapes plugs in cleanly. A module that invents its own shapes makes the system harder to use, harder to handoff, harder to sell to scale.

### Rule 4 — The integration point is the main file, once

Every module has exactly **one** seam in the main monolith (`poe-financial-mvp-v28.jsx`):

```jsx
// At top:
import { Contractors1099 } from './components/Contractors1099.jsx';

// At the render switch:
{booksView === 'k1099' && <Contractors1099 contractors={data.contractors1099} … />}
```

Plus, if the module owns state-mutating actions, the App component declares the CRUD helpers (e.g., `addContractor`, `updateContractor`, `deleteContractor`) — typically 3-5 lines each.

That's it. A new module adds: (a) an import line, (b) a render-switch line, (c) optional CRUD helpers in App. Removing a module is symmetric. **Three lines to add, three lines to remove. No deeper coupling allowed.**

### Rule 5 — Data shape changes are migrations, not surprises

When a module needs a new field on an existing entity, treat it as a schema migration:

1. Add the field with a sensible default in `ensureLifecycle`-style on-load patches (one place, idempotent).
2. Ship the new field as **optional** in the UI for one release (existing records render fine without it).
3. Backfill old records lazily on first interaction, never via a one-shot rewrite of stored data.
4. Document the change in the module's foundation doc.

This way: old records don't break, new records get the new shape, the system stays operable end-to-end during the migration. Multi-instance customers don't need a synchronized rollout.

---

## The "new module checklist"

When proposing a new module (e.g., **Home Command**, **Education Tracker**, **Caregiver Schedule**, **Donor CRM** for churches, **Materials Inventory** for trades), the checklist below is required reading. If any answer is "no" or "I'll figure it out later," the module isn't ready to merge.

1. **What entity types does it own?** (e.g., "rooms," "donors," "lessons," "tasks") — declare the data shape.
2. **Does each entity have `lifecycle: {...}` + `links: []`?** Required.
3. **Are status changes routed through `appendLifecycleLog()`?** Required.
4. **Does the module ship with Add / Edit / Delete inline per IN-PLACE-FIRST + EDITABLE-EVERYWHERE?** Required.
5. **Does it live in its own file under `components/`?** Required.
6. **What's its single seam in the main file?** (import + render switch line).
7. **What CRUD helpers does it need in App?** (typically `add{X}`, `update{X}`, `delete{X}` — copy the existing pattern).
8. **Which tier unlocks it?** Reference `VIEW_TIER_REQUIREMENTS`.
9. **What does it cross-link to?** (e.g., a "donor" links to "transactions" + "entities" + "events" + maybe "feedback").
10. **What does it NOT touch?** (HIPAA boundary, Legal isolation, TLC privacy — name the things it must avoid).
11. **What's the cost?** ($0 in Phase 1–2; Cloudflare free-tier costs only in Phase 3+.)
12. **What's the user benefit, in one sentence?** If you can't say it in one sentence, it's not ready.

---

## How modules interact with NEW data sources (e.g., a new connector, a new file format)

When a new external data source enters the system (a bank import, a Google Calendar sync, an Acuity webhook, a Stripe payout, a Zillow snapshot, a Twilio call):

- The source is wrapped in an **adapter** module under `components/connectors/{Source}.jsx` that owns the parse + ingest + lifecycle entry on import.
- The adapter never modifies user data without a confirmation (per `IN-PLACE-FIRST.md`).
- The adapter writes provenance into the lifecycle log: *"imported from {source} at {timestamp} by {actor}."*
- The adapter declares its own permission requirement (e.g., bank imports require Owner role).
- The adapter is independently disable-able: toggling it off in Instance Settings stops ingestion without removing previously-imported records.

This is how new data types benefit the user without becoming a tangle: every source has a single front door, every front door is auditable, every adapter is removable.

---

## Anti-patterns this rule forbids

- **Adding a 200-line component inline in the monolith.** Extract first.
- **Reaching into App's state via globals or refs.** Use props.
- **Sharing mutable state across modules.** Use the existing data slice + CRUD helpers.
- **Skipping `lifecycle` / `links` on a new entity type because "I'll add it later."** Always day-one.
- **A "configure-once" setup that requires editing the source code.** Configuration lives in `data.instance` + Instance Settings UI; module behavior reads from there.
- **A module that "knows about" another module's internals.** Modules talk only via the universal data shapes (lifecycle, links) and standard helpers.
- **Locked-in dependencies on a vendor SDK that doesn't have a fallback.** Stooq (Markets) survives with Google fallback; Twilio (Voice Ops) survives if disabled. Every external dependency must be optional from the user's perspective.

---

## How to recognize the rule is working

- A new module ships in a single PR that touches only its own file + ~3 lines elsewhere.
- A customer disables a module in Instance Settings; the system continues without it.
- An SME or future contributor reads ONE file to understand a module's full surface.
- Removing a module is reversible from `git`; no data is orphaned because every entity carries its own lifecycle + links.
- A "trades" instance and a "therapy practice" instance run the same codebase with different module sets enabled — no per-customer branches.
- The next big idea (e.g., "Volunteer Hours" for the church instance) ships in a week, not a month, because the integration surface is small.

---

## Sustainability check

| Item | Cost |
|---|---|
| Per-module file (zero ongoing cost) | $0 |
| Adapter for a new external source | $0 if the source has a free tier; rolls into the tier that unlocks the connector |
| Schema migration on field addition | $0 — local-first; idempotent on-load patches |
| Phase 2/3/4 multi-tenant migration | Already costed in `MULTI-INSTANCE-STRATEGY.md` |

No new paid dependency mandated by this rule. Rule held.

---

## Cross-references

- `CONNECTED-CONTEXT.md` — modules wire into the global link graph via `item.links`.
- `LIFECYCLE-AND-HANDOFF.md` — every module's records carry the same lifecycle shape.
- `IDENTITY-ROLES-AUDIT.md` — modules declare their permission requirements once; the framework enforces them.
- `EDITABLE-EVERYWHERE.md` — every module ships with inline Edit; no read-only-by-accident.
- `IN-PLACE-FIRST.md` — every module respects the same UX principle.
- `MULTI-INSTANCE-STRATEGY.md` — modules ship to every instance simultaneously; module toggles per instance template are the only customization.
- `LEGAL-PRIVACY-BOUNDARY.md` — the strictest module is the template for any future confidentiality-sensitive module.
- `SITUATIONAL-PEACE.md` — modular extensibility IS the peace mechanism for the codebase: changes don't ripple where you didn't intend.
- `FOUNDERS-CONFESSION.md` — His Story not mine. Modules are individually small acts of stewardship; the system is what they compose into.

---

**End of document.** Binding from r26 onwards. The current refactor toward this rule is well underway (shared.jsx, About.jsx, Legal.jsx, Contractors1099.jsx already extracted; Cart, Markets, Practice, Rentals, Projects, DevOps, BooksAccounts, BooksTransactions, BooksEntities, Calendar, Debts queued). No new feature ships inline in the monolith. The "new module checklist" above is mandatory.
