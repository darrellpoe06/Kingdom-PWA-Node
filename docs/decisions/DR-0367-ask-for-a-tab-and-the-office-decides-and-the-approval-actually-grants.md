# DR-0367 — Ask for a tab, and the office decides — and the approval actually grants

**Date:** 2026-09-12 · **Status:** accepted · **Tier:** B · **Area:** platform · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-PREMISE-CONFLICTS, DETERMINISTIC-FIRST, SAY-WHAT-IS-NOT-BUILT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

> *"We need the staff to be able to edit all surfaces... each user will be able to be upgraded based on checking another access these tabs type functionality for the office staff and tech team to give access based on BG and have an request and approval process for changing or giving access to the tabs that are staff and work related"*

and, on the shape of it:

> *"Also staff should be the only ones on certain tabs anyway.... views for different users... not showing tabs unless they are staff or it's black with instructions for access..."*

**BG is Bishop Gwin** (`bg@thechurchofthelivinggod.com`) — already the entire `CHURCH_STAFF_EMAILS` allowlist in the shell, and the person named as the gate. Established by reading the shell, not assumed.

---

## Part 1 — The gate was prose

`surfaces.js` carried a `gate:` field on **29 of 56** surfaces. It was a human-readable note, and it was **read by nothing**. The real gating happened in hand-written conditions scattered through the render switch.

Every surface now also carries a machine-readable `requires` and a `whenDenied`, and `lib/surface-access.js` decides.

### Two behaviours, and which one is a decision per surface

Darrell's sentence names two, so the registry declares which each surface gets:

| mode | when | examples |
| --- | --- | --- |
| `hide` | the surface's very EXISTENCE is not the viewer's business | Admin, CRM, Forecast, the private Study circle, the church Observation board |
| `lock` | a person could legitimately want it and legitimately ask | Devices, Infra Plan, Video Wall, Harvest, church Projects |

**Why a locked tile beats a hidden one where it is safe:** a hidden tab teaches nothing. Somebody who *should* have access cannot tell "not for me" from "broken", and never learns the door was there.

The five staff surfaces previously fell back to hand-written white boxes reading *"Sign in with a church staff account to view it"* — which is not instructions, and is simply **wrong for anybody already signed in**, which is most of the people who ever hit them.

---

## Part 2 — The premise conflict that had to be solved first

**An approval queue that cannot grant is theatre.**

The staff tabs were gated by an **email allowlist in the shell**. So "approve the request" could not have granted anything — it would have needed a code edit and a deploy, per person. The queue would have said *granted* while the person still met a locked tile.

That is the failure this whole chain exists to prevent, and it had to be solved in the database before any surface was worth building.

**0126 already had the right home.** `member_capabilities` is written only through `set_member_capability`, which is owner/admin-only, refuses self-grants, refuses to "grant" an owner powers they already hold, and requires the target actually be in the space. Migration **0211** adds **one key** to that closed allowlist — `see:church-staff` — and the shell learns to honour it beside the email list.

### Decisions

1. **One key, not one per tab.** Every staff church surface gates on the *same* predicate today. A key per tab would be a promise the app cannot keep — it would show a granted "Devices" and still hand over the Infra Plan. So the **request names the surface** (the office sees what was wanted) and the **grant is the one thing that is real**. Both surfaces say so out loud (`GRANT_IS_ALL_STAFF_TABS`) rather than letting somebody discover it.

2. **It is a `see:` key, not a `write:` key.** It unlocks no table and no write path: `capability_area()` does not map it, the viewer read-only overlay does not consult it, RLS is untouched — and 0211 redefines none of those three, which the suite asserts as "does not touch them". It changes what the app **draws**.

3. **Deciding IS granting.** `access_request_decide` performs the grant through 0126's guarded door **before** marking the row, so a grant that cannot happen (the person left the church, they are already an owner) makes the whole decision raise and write **nothing**. There is deliberately **no UPDATE policy** on `access_requests` — a decision written straight to the table could skip the grant.

4. **One open ask per person per surface.** Asking twice is not two asks; it is the same person still waiting, and a queue full of duplicates is a queue nobody reads. Decided rows stay, so the history is whole.

5. **A decided row must carry who decided it and when** — a table constraint, not a convention. A `granted` row with no hand behind it is exactly the record this table exists to prevent.

6. **Nobody decides their own request**, and a member cannot decide at all. Both enforced in the function body.

### Two things beside the key changed in `set_member_capability`, named rather than left in a diff

- **An `audit_log` row.** 0126 wrote none — so a capability could be granted or revoked with nothing to show for it, on the one class of write where that matters most. Every other privileged write in this system audits; this one now does.
- **`REVOKE ... FROM PUBLIC, anon`.** 0126 only `GRANT`ed. A tightening, matching every function written since.

Every *guard* is 0126's, unchanged — diffed line for line before shipping.

---

## A defect the machinery caught

`migration-replay-order-guard` refused the first draft:

> *the `viewer-readonly` leg re-applies 0126, which redefines `set_member_capability` — 0211 redefines the same and is not listed after it, so a replay REVERTS it.*

Exactly right: a replay would have silently restored the closed allowlist and removed the key, leaving approvals raising *"unknown capability"* in production while every test passed. 0211 is now on that leg after 0126, and a test pins the ordering so it cannot drift back.

---

## What is NOT built (DR-0329: say it)

- **No per-tab keys.** Decision 1, said in the UI.
- **No notification.** An ask lands in the queue and waits to be looked at; nothing emails or pushes Bishop Gwin. *re-review: 2026-10-12 — once web push has a church audience.*
- **No expiry on a grant.** A key given stays until it is taken back the same way. *re-review: 2026-12-12.*
- **The `access` surface is not itself in the request chain** — it requires only a sign-in, because a person must always be able to see and withdraw their own asks.

## Proof

- `0211-access-request-smoke.sql` — assertions against the real database, rolled back, on **two** isolation legs. The central one is not that a status changed: it is that the **capability exists afterwards**, and that when the grant is impossible the decision refuses with it and leaves the row `open`.
- `app/src/__tests__/access-requests.test.jsx` — 27 tests, including proven-to-catch for an approval that grants nothing, a capability the database would refuse, a gate reading a key the shell does not, and the replay-order defect above.
- `app/src/__tests__/surface-access.test.jsx` — 26 tests on the gate itself, including that reviewer mode inherits neither staff status nor a granted key.
