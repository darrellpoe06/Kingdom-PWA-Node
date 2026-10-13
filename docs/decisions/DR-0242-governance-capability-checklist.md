# DR-0242 — The governance checklist: per-member capabilities between the roles

- **date:** 2026-07-29
- **status:** accepted
- **tier:** C (role/RLS change — shipped with the live capability smoke per DR-0225 carry-the-proof)
- **decides:** how a steward grants SPECIFIC powers between the three base roles — "different levels of governance without the full admin"
- **pairs-with:** DR-0241 (the viewer deny-overlay this rides on), DR-0220 P6 (the write-granularity item this un-parks), DR-0187 (two-party invite — unchanged), DR-0076 (proven live), DR-0111/DR-0236 (asked = built now)

## The trigger

Darrell 2026-07-29, immediately after the DR-0241 delivery: **"What about the checklist of options to give access to different levels of governance without the full admin or only whatever we give other types of users."** The finer-grained layer had been carried to 2026-09-15 (DR-0220 P6); the direct ask un-parks it (DR-0236 — buildable now is built now).

## The decision

**Additive, per-person capability grants on top of the base role — a checklist the owner/admin checks on and off, DB-enforced, default-deny.**

1. **The model (migration `0126-member-capability-checklist.sql`).** `member_capabilities` (instance, user, capability; UNIQUE) holds the grants; writes are RPC-only (`set_member_capability`, owner/admin of the space, never self, never an owner/admin target); reads are self-or-leader RLS. Two kinds of capability:
   - **`write:<area>`** — unlocks WRITE on one named area's tables for a **viewer** (choir, bus, inventory, crm, events, property, content). The 0125 RESTRICTIVE deny-overlay learns the checklist: each table's policy admits a viewer only when a grant exists for the area that table maps to (`capability_area()`), baked per-table at overlay-apply time.
   - **`invite:viewer`** — a **member** may mint one-time invites for the space the grant is on, with the role **forced to viewer** server-side (asking for member/admin still mints viewer). The DR-0187 claim + confirm handshake is untouched.
2. **DEFAULT DENY + the never-unlockable core.** Only area-mapped tables are unlockable at all; everything unmapped keeps the pure viewer deny. The core is pinned twice: `never_unlockable_tables()` (entities, accounts, transactions, debts, projects, payments, budget_goals, member_stewardship, instance_members/invites, the capability tables themselves) returns NULL from the area map, and tenancy-guard **Check E** now fails the build if a later migration redefines the overlay hollowed, drops a participation exception, or unpins a core table — proven-to-catch both ways in `tenancy-guard.test.js`.
3. **No role powers are delegable.** Role changes stay owner/admin (0111 guards untouched); the checklist cannot reach admin, membership, money, or the books. "Different levels of governance" = specific named powers, never a fourth ambient role.
4. **Proven live, every migrate.** `viewer-readonly-isolation.yml` now applies 0125+0126 and runs BOTH smokes against the real database: `tests/0126-capability-checklist-smoke.sql` proves grant→write works, the ledger stays sealed DESPITE a grant, revoke closes the door, the delegated member's mint is forced to viewer, and the RPC rejects member callers / unknown capabilities / self-grants. Rolls back.
5. **The surface (Admin → Role & stewards).** Each member/viewer row gains a **Checklist** expander: grouped checkboxes (Governance / Areas) with plain-language notes, reading and writing the real grants (`member-roles.js` catalog mirrors the RPC's `v_known` list exactly — pinned by test). The panel states the bright line: *"The books, money, and membership are never unlockable here."*

## What this closes and carries

- **Closes** the "write granularity" half of DR-0220 P6 ahead of its 2026-09-15 date.
- **Carries** the member-readable `audit_log` half (no audit_log table exists yet to read — building the table is its own decision) on the same 2026-09-15 date.
