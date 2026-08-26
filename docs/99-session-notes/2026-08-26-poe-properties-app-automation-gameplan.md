# The Poe Properties App — build + automation gameplan (2026-08-26)

**Written for review** (Darrell: *"what is the gameplan for this building automation systems that supports the Poe Properties processes? gemini will review..."*). Everything below is stated so a reviewer who has never seen this repo can check it: each claim names the file, the table, or the gate that proves it. Decision record: **DR-0313**.

---

## 1. What this app is

**Poe Properties** is a second installable app on the same codebase and the same database as PoeTech.

- **Tenants, their families, and 1099 workers** use the Poe Properties App. They are *not* members of the family's instance and never see anything but their own door.
- **The family** manages from either app — PoeTech's `Properties` tab or the Poe Properties App — because both mount **the same module** (`app/src/modules/properties/`). There is no second copy of the logic and no second store, so "both apps with the latest synced data" is a property of the architecture, not a job that can fall behind.
- **Other landlords** are a later product face (phase P7, Tier C, Governor's gate).

## 2. The reality-trace that set the plan (measured 2026-08-26)

| Fact | How it was measured |
| --- | --- |
| ~90% of the workflows already existed | `Rentals.jsx`, `UnitManagement.jsx`, `tenant-portal.js`, `dispatch.js`, `renter-portal.js` read in full |
| The tenant + delegation tables are LIVE | `list_tables` on the production project: `rental_tenancies`, `tenant_maintenance_requests`, `tenant_messages`, `tenant_notices`, `rent_records`, `delegated_capabilities`, `tenancy_worker_access`, `request_documentation`, `rent_balance_adjustments` all present |
| …and every one of them is EMPTY | same query: 0 rows |
| 12 rental doors are real | `rentals` = 12 rows |
| Recognition keys on `auth.uid()` | `pg_get_functiondef` of `user_is_tenant`, `user_delegated_can`, `user_is_enabled_worker` |
| A landlord could not grant by email | `delegated_capabilities.grantee_user_id` is `NOT NULL` |

**The single blocking gap** was therefore not features — it was that no path existed from *"I know this person's email"* to *"this person is recognized."* That is what shipped today.

## 3. What shipped in this session

| Piece | File | Why it matters |
| --- | --- | --- |
| Invite → claim seam | `infra/supabase/migrations-auto/0150-…sql` | A landlord invites by email; the person is recognized only after signing in to that verified address. **The role ceiling is enforced inside the function**, so a tampered invite widens nothing. |
| The tenant's family | same migration (`tenancy_household`, `user_is_tenancy_household`) | A spouse or adult child gets their own login on the same door — work orders, thread, notices, rent **read**; never the rent write. |
| The shared relationship record | same migration (`tenancy_notes`) | Append-only notes from anyone on the door. Management reads all of them. |
| The money river | same migration (`posted_tx_id` + posting trigger) | A confirmed payment posts **once** into the PoeTech books; a delegated operator is refused by a trigger, not by a comment. |
| The module | `app/src/modules/properties/` | model · config · RLS-scoped I/O · the role-resolved UI. |
| The second door | `app/properties/app/index.html`, `manifest-properties.webmanifest`, `PropertiesDoor.jsx`, `main.jsx` branch | Own scope `/properties/`, own icon, lean boot that never imports the monolith. |
| The PoeTech mount | `surfaces.js` + the shell's `view === 'properties'` | The family manages from the app they already use. |
| The gates | `properties-door.test.js` (38), `0150-poe-properties-isolation-smoke.sql`, the `poe-properties` leg of `rls-isolation.yml` | See §5. |

## 4. The automation systems behind the processes

The rule this follows is DR-0132 / the `/n8n` retirement: **new pipelines are sovereign Python on the NAS, never a new n8n webhook**, and anything timer-driven ships with brakes (three-brakes rule, as amended by DR-0247/DR-0248).

| Process | Automation | Status | Gameplan |
| --- | --- | --- | --- |
| **Work order → worker** | `dispatch.js` builds the job text; the phone's own messaging app sends it (`sms:`/`tel:`) | **Live, no vendor, no spend** | Stays deliberately un-automated at the send step: the app never sends on its own. A carrier gateway would mean A2P 10DLC registration and real money — revisit only if volume ever justifies it. |
| **Inbound tenant text → a capture record** | `infra/nas-property-inbound/loop.py` — deterministic, stdlib-only, three brakes, **ships inert**, never sends | Built, inert | Arm it only after the pilot door is running, with a human confirming each `needs_review` row. Inbound text is DATA, never a command. |
| **Property photos** | `infra/nas-property-photos/photo_server.py` — the sovereign image server behind `/nas-photos` | Live | Feeds the chronological photo story (DR-0124). Next: EXIF capture-date on upload so undated photos date themselves. |
| **Property history from Synology Chat** | `infra/n8n/wf-property-history.json` + `/property-history` transport | Contract defined; **NAS side is still the n8n-era shell** | This is a `/n8n` retirement item: rewrite as a small sovereign Python reader on the NAS behind the existing same-origin route. The import already stages messages for a human to accept — nothing lands unverified. |
| **Work order state, documentation, notes, rent** | No automation by design — these are *records of what humans did* | Live | Deliberate. The value is a true timeline, and a bot writing entries would poison exactly that. |
| **Rent → books** | The posting step in the module + the DB idempotency key | Live | One tap by the books owner, once per record. Auto-posting is a candidate only after a season of correct manual posts. |
| **Isolation proof** | `rls-isolation.yml` → the `poe-properties` leg | Live | Runs against the real database after every migration apply. |

**What is deliberately NOT automated:** sending anything to a tenant or worker, moving money, screening decisions, and writing to the historical record on a human's behalf. Each of those is either a bright line (DR-0094), legally regulated (DR-0101 §7), or would destroy the credibility of the record it writes to.

## 5. How this is verified (a reviewer can run all of it)

- **38 unit assertions** — `app/src/__tests__/properties-door.test.js`. Includes the anti-drift gate: the app's capability vocabulary is read **out of the SQL** and compared, so a second source of truth cannot survive.
- **Proven-to-catch, not theatre.** Two mutations were run and both went red as intended: colliding the properties scope with PoeTech's (3 failures, including the derived all-faces sweep), and adding `rent.adjust` to the field-worker ceiling in the app only (2 failures). Restored, all 60 pass.
- **The isolation smoke** asserts, against the real database and then rolls back: an invite grants nothing before it is claimed; a stranger's claim grants nothing; a tenant sees one door; the family shares that door but is refused the rent write; the field-worker ceiling drops `rent.adjust`; a manager is refused the books; an invite is single-use; nothing crosses to another landlord.
- **The plan validates itself.** `validateLaunchPlan()` fails any phase claiming "built" without evidence, "gated" without a gate, "waiting on a hand" without a name, or deferring without a re-review date — and the test proves the validator can fail.

## 6. Timeline

| Phase | What | When | Gated by |
| --- | --- | --- | --- |
| P0–P2 | The seam, the module, both doors, the gates | **Done today**; merges and applies itself on green | CI + the `poe-properties` isolation leg |
| P3 | The 12 doors get real tenancies (name, email, lease, rent) | **Darrell's / Christina's hand** — one sitting | Nothing; the screen is ready |
| P4 | First pilot: one door, one tenant, one 1099 worker, one real work order end to end | Within days of P3 | The pilot round-trip |
| P5 | Every door, every tenant, every worker; rent starts posting to the books | ~2 weeks after the pilot | P4 |
| P6 | Policy playbook + application review | `re-review: 2026-10-07` | Fair-housing / FCRA guardrail (DR-0101 §7) |
| P7 | The app for other landlords | `re-review: 2026-10-21` | Tier C — Governor |

**The honest bottom line:** the software is finished and proven; the data is not entered. Nobody can be invited to a door that has no tenancy row, and the agent cannot invent tenant records (DR-0076). From the moment those records exist, the first tenant and the first 1099 worker can be sent the link the same day.
