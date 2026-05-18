# Editable Everywhere — Any record about anything can be edited, with caveats

> Founder framing (2026-05-18):
> *"All locations that have information about the other aspects of the system I would like to be able to edit and update — unless it will cause some issues for scaling or other issues that constrain our capabilities later."*

This is the binding rule for **edit affordances** across every tab, every list, every record in SKOS / PoeTech Family OS. Partner of `IN-PLACE-FIRST.md` (which says edit happens inline, not in a top-of-page form) and `IDENTITY-ROLES-AUDIT.md` (which says every edit is attributable).

---

## The rule

**Every row that displays information about an entity must have an Edit affordance** — unless one of the listed exceptions applies. Edit drops down inline, writes a lifecycle log entry, and respects the acting user's role per `IDENTITY-ROLES-AUDIT.md`.

This applies to: 1099 contractors, Cart subscriptions, Entities, Accounts, Transactions, Recurring obligations, Events, Maintenance log entries, Equipment, Leases, Tenants, Rooms & Work, Conversations, Inquiries, Inquiry journal, Scope agreements, Capex items, Projects, Watchlist tickers, Skill profiles, Feedback rows (PoeTech-side only), and any new entity type added later.

A record without an Edit affordance is a bug, not a feature, *unless* it falls under one of the explicit exceptions below.

---

## Exceptions (where Edit is intentionally NOT exposed)

### 1 — Computed / derived values

A field that is **calculated from other inputs** is not editable in place. Examples:

- `totals.netCashFlow` — derived from inflows minus outflows
- `capacityPct` — derived from sum of project hours / sum of skill profile hours
- `rentalSnowball.allClearedYears` — derived from the snowball math
- `pressureCalc.extraAvailable` — derived from pressure slider + cash flow

Fix: instead of an edit affordance on the derived value, surface a link to the **inputs** so the user knows where to go. (Example: "Net cash flow is computed from inflows + outflows — edit those to change this number.")

### 2 — Immutable historical facts

Audit log entries themselves are append-only. A past lifecycle log entry shows what happened; the user can add a corrective entry but cannot edit the original.

Past reconciled transactions (when reconciliation ships in a future round) are editable by Owner role only and require an explicit "I know this is reconciled" confirmation; the edit logs both the old AND new values + the reason for the change.

### 3 — Data owned by another module

Acuity-managed appointment data is not editable in SKOS — Acuity is system-of-record. SKOS shows the data; the user clicks through to Acuity to edit.

Twilio call records (the raw recording / transcript) are not editable. The user's notes on what to do about the call are editable; the call itself is what Twilio captured.

External market data (Stooq quotes) is not editable. The watchlist `ticker` and `note` fields are editable; the live price is what Stooq returned.

### 4 — Active confidentiality boundary

Legal matters require PIN entry before any edit. The Edit affordance still exists on the row, but tapping it triggers PIN gate first. Per `LEGAL-PRIVACY-BOUNDARY.md`.

TLC inquiry detail (when the inquiry has been escalated to PHI-adjacent content) is read-only inside SKOS; the user must use Acuity. The metadata (status, follow-up date, source attribution) remains editable.

### 5 — Role doesn't have permission

Per `IDENTITY-ROLES-AUDIT.md` permission matrix — a Viewer role does not see Edit affordances; a Contributor role sees Edit only on records they own. The UI hides the button rather than showing it disabled (cleaner; fewer surfaces to misread).

---

## Scaling concerns the founder flagged — and the mitigations

### Concern: "What could undermine us later?"

Five concrete scaling risks from making everything editable, and what we do about each:

| Risk | Mitigation |
|---|---|
| **Audit log explosion** — hundreds of trivial edits per day balloon the log | Rate-limit identical edits (no log entry for "balance: 100 → 100"). Roll up consecutive edits to the same field within 60 seconds into one entry. |
| **Concurrent edit conflicts** (Phase 3+ when multi-user lands) | Optimistic locking — show "X edited this 2 min ago, refresh?" before overwriting. Last-write-wins is the explicit fallback, with the loser's content saved as an audit-log note for recovery. |
| **Bulk edit pain** — editing 50 transactions one-by-one is tedious | Single-row inline edit ships now (this rule). Bulk-edit mode layers on later without changing the data shape — same `update*` functions, called per-row. No re-architecture. |
| **Mobile viewport overload** — expanded panels push content off-screen | One-expansion-at-a-time per list (already implemented in Calendar / Action Queue / Books-Accounts). Opening a new edit collapses the previously open one. |
| **Cross-tab data integrity** — editing a tenant's name in Real Estate could orphan references in Inquiries / Conversations | Cross-tab links use IDs, not names. Renaming a tenant updates the canonical record; references resolve through the ID. Audit log records the rename so the original name is recoverable. |

### Concern: "What constrains our capabilities later?"

Two architectural pinch-points that universal editability creates if not handled carefully:

1. **Schema migration cost.** When the data model changes (e.g., adding a field, renaming a field), every Edit form needs to learn the new shape. Mitigation: shared form helpers per entity type (one `renderForm` function per entity, used by both Add and Edit). Schema change touches one place.

2. **Search / index performance.** Every entity must be searchable as the data grows. Edits invalidate any index. Mitigation: build search lazily (when the user opens search), don't maintain a live full-text index. For instances with >10k rows per entity type (Phase 3+ enterprise), introduce a per-entity-type index that updates on save.

---

## Anti-patterns this rule forbids

- **"Delete is the only action available."** A row that lets you delete it should also let you edit it. Currently violating tabs (pre-r23): Books → Calendar (fixed r22), 1099s (next), Cart subscriptions (next), Markets watchlist (audit needed).
- **Edit form pushed to top of tab.** Per `IN-PLACE-FIRST.md` — Edit drops down inline under the row. Top form is for Add only.
- **Silent edits.** Per `IDENTITY-ROLES-AUDIT.md` — every save writes a lifecycle log entry with `by`, `at`, `fromValue`, `toValue`. No exceptions.
- **Edit affordance on derived values.** Surface the inputs instead.
- **"Edit" buttons that don't do anything.** A dead button is worse than no button. If the form isn't built yet, the affordance shouldn't exist yet.

---

## Sweep — where this rule needs to be applied

State as of 2026-05-18:

| Surface | Status | Notes |
|---|---|---|
| Big Picture · Action Queue rows | ✓ Inline expand (r17) | |
| Real Estate · Property edit | ✓ Inline drop-down (r7) | |
| Real Estate · Maintenance log entries | TODO | Add inline edit |
| Real Estate · Equipment | TODO | Add inline edit |
| Real Estate · Lease & Tenant fields | TODO | Add inline edit |
| Real Estate · Rooms & Needed Work | TODO | Add inline edit |
| Real Estate · Conversation log | TODO | Add inline edit |
| Books · Entities | TODO | Add inline edit |
| Books · Accounts | ✓ Inline drop-down (r21) | |
| Books · Transactions | TODO | Top form is current; convert to inline |
| Books · Calendar (recurring + events) | ✓ Inline drop-down (r22) | |
| Books · Cart subscriptions | TODO | Likely delete-only today |
| Books · 1099 contractors | TODO | Likely read-only today |
| Books · Legal matters | Placeholder (r23) — full CRUD pending #95–99 | |
| Projects | ✓ Inline drop-down (r20) | |
| Projects · Conversation log | TODO | Add inline edit |
| Projects · Capex inventory | TODO | Verify edit affordance |
| Projects · Scope agreements | TODO | Add inline edit |
| Practice · Inquiries | ✓ Already inline expand | |
| Practice · Inquiry conversation log | TODO | Add inline edit |
| Practice · Inquiry journal entries | TODO | Add inline edit |
| Debts · Individual debt rows | TODO | Add inline edit |
| Markets · Watchlist tickers | TODO | Likely add-only today |
| Dev/Ops · Skill profiles | TODO | Add inline edit |
| Dev/Ops · Opportunity overrides | TODO | If user customizes |
| Voice Ops · Inbound row notes | TODO | Notes field editable |
| About · Feedback Log (PoeTech-side) | TODO | When feedback lifecycle ships per #73 |
| About · Checkout Intents | Read-only by design (immutable historical fact) | |
| About · Instance Settings | TODO | When multi-instance config ships per #74 |

Each TODO is one batch in a future sweep round. Order by user friction reported × frequency of use.

---

## Sustainability check

| Item | Cost |
|---|---|
| Inline Edit affordance + drop-down panel | $0 — same component pattern as existing |
| Lifecycle log entry per save | $0 — already in IndexedDB |
| Audit log rate-limiting on identical edits | $0 — pure-function check in `appendLifecycleLog` |
| Future bulk-edit mode | $0 — layer on existing per-row updates |
| Future search indexing | $0 in Phase 1–2 (local); Cloudflare D1 free tier in Phase 3 |

No paid dependency at any phase. Rule held.

---

## Cross-references

- `IN-PLACE-FIRST.md` — where Edit happens (inline, not jump-to-top).
- `IDENTITY-ROLES-AUDIT.md` — who can Edit and how it's recorded.
- `LIFECYCLE-AND-HANDOFF.md` — the audit log this rule writes to.
- `CONNECTED-CONTEXT.md` — when edits ripple across linked entities.
- `LEGAL-PRIVACY-BOUNDARY.md` — exception #4 (PIN-gated edit).
- `SITUATIONAL-PEACE.md` — being able to fix what's wrong is peace.
- `EXCELLENCE-STANDARD.md` — religion AND relationship. Religion: every save is logged. Relationship: editing is one tap away, no jump-to-top.

---

**End of document.** Binding. Any new list or row in the system must ship with Edit + Delete + (optional) per-row actions wired up. Read-only by accident is a regression; read-only by design must cite one of the five exceptions above. This rule is in force from r23 onwards; the sweep table above is the punch list.
