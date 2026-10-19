# DR-1106: An email can make you a member; only a role can make you a governor — the sons and daughters learn by witnessing and helping

**Date:** 2026-10-19
**Status:** accepted
**Tier:** C (front-door identity — the shell's authority check; ships behind the Governor's `hold` per RELEASE-TIERS)
**Type:** way

**Area:**
- `app/src/lib/family-standing.js` (new — the pure standing model: role decides authority, per space)
- `app/src/__tests__/family-standing.test.js` (new — 17 cases, the 2026-08-23 exposure pinned by name)

**Grounds:** Darrell, 2026-10-19, reading his son's row in Access & Usage: *"Why is my son a child and not others or what restriction or whatever is there for their roles and capabilities"* and then, on the answer: **"Fix it... he gets access... we want them to learn by doing or helping and or witnessing our businesses... make sense?"**
**Principles:** DR-0093 (children join through the safety rails, never the allowlist — read in full for this record); DR-0094 (money visibility is the guardian's decision; the guardian decides WHAT they see, not just whether); DR-0076 §3 and §8 (proven-to-catch; every claim measured); DR-0107 (a door that goes dark is the worst outcome)

## Context

The son's badge reads CHILD because migration 0144 set that role on 2026-08-23,
and it set it for a good reason: DR-0093 decided children join through the
safety rails and **never** through the family email allowlist — which DR-0093
itself names "the dangerous door," the binary flag that unlocks all family
financials and the imported bank/Gmail feed. Migration 0080 had put
`darrellpoejr@gmail.com` on that allowlist anyway, and 0144's own words are
*"The persona was never the wall — RLS is, and RLS saw 'member'."*

0144 raised the wall. It did not take the address off the list.

## What was measured

Traced in the real tree before anything was written:

| asked | answer |
|---|---|
| where does the CHILD badge come from? | the stored `instance_members.role`, printed through `access-metrics.js:22-32`; `child` is not in that vocabulary map so it falls through to the raw word |
| why do the daughters differ? | they are stored `member`; mrspoe06 is `admin`, which that map renames **Steward-Admin** |
| what does `child` actually block? | RLS, not UI: books (`entities, accounts, transactions, debts, projects`) read **and** write denied (`0082:76-91`); what-is-owed and mortgage line items deny `child` and `assistant` (`0202:179`, `0203:109`) |
| is the son still on the email allowlist? | **yes** — `poe-financial-mvp-v28.jsx:593-594`, persona `family` |
| what does that flag grant in the client? | **11 call sites**, read as three different things: membership, Governor authority (`isGov` / `isGovernor`, **18** of those), and financial visibility |
| does the shell read any database role? | **no** — zero hits for `user_role_in_instance` in all 5,193 lines of the shell |

**So the live state is the worst of both.** The client hands a minor the
Governor surfaces; the database denies every row behind them. He is
over-trusted by the app and locked out by the data at the same time. Neither
half is what anyone decided.

## Impact

This is why "he gets access" could not be answered by flipping a role. A role
change alone moves the database wall, and the client would still decide who he
is from a list of email addresses — so a son promoted to help in the business
would still be flagged `isGovernor`, and a son left at `child` would still be
shown surfaces with nothing in them.

The fix has to be the other way round: **authority stops coming from an
address.** Once a role decides, the Governor can place each of his children
where he wants them, per space, and the app will agree with the database
instead of contradicting it.

It also unblocks what DR-0093 and DR-0094 both deferred behind one condition —
*"the first linked child account"* — which is already met. DR-0093 left the
app-layer `child`-role gating of client surfaces undone (noting the client
"treats a child sign-in as a regular non-family user, which shows LESS, not
more"); DR-0094 sequenced the **How Money Works** view behind it. This is that
gating's foundation.

## Decision

**1. An email can make you a MEMBER. Only a ROLE can make you a GOVERNOR.**
`standingInSpace({ allowlisted, role })` answers from the role whenever a role
is known. No allowlist entry can confer authority — and a case asserts that
every known role answers `source: 'role'`, so the hole cannot reopen quietly.

**2. Three standings, named in the Governor's own frame**, because he asked for
three different things: **witness** (sees the space, writes nothing), **helper**
(sees and does the work), **governor** (also governs). They mirror the RLS that
is the real wall — `successor`/`viewer` witness, `member`/`specialist` help,
`owner`/`admin` govern, and `child`/`assistant` are walled from the books by
0082/0202/0203 exactly as the database walls them. The model does not invent
permission; it stops the client from inventing it.

**3. Per space, on one sign-in.** `instance_members` is per-instance and so is
this: a son can **witness** the household and **help** in Poe Properties from
the same sign-in. That is the shape of "learn by doing or helping and or
witnessing our businesses" — and a case pins that helping in the business does
not open the household books.

**4. The owner is never locked out.** A role read is a network call. When the
role is unknown the standing falls back to exactly today's allowlist behavior,
so a failed read changes nothing rather than demoting the person reading it
(DR-0107). The fallback is named `allowlist-fallback` in the returned shape so
it is visible in a trace instead of silent.

**5. The surface says what a person HOLDS, never "denied."** `standingSentence`
returns *"You are witnessing Poe Family — you can see the work; the money stays
with the stewards,"* and a case asserts the words *denied / forbidden / not
allowed / no access* never appear.

## Verification

- **Proven to catch** (DR-0076 §3): the old rule restored inside the module —
  the address decides, the role is only a hint — and **four** cases fail by
  name, including *"allowlisted + child role -> a witness, never a governor"*
  and the roster case that pins the standing of every role on the list.
  Restored **byte-identical** (`cmp`), 17 cases green after restore.
- **Anti-theatre:** a case pins the DEFECT itself (the old rule calling the
  same person a governor), so a revert cannot pass quietly; another asserts
  every known role resolves from `source: 'role'`, so the fallback cannot be
  widened back into a grant path.
- Every row of the measured table above is a read of the tree, cited by file
  and line (DR-0076 §8). The shell's zero role-reads is a count, not a
  recollection.
- Lint clean; `verify:gates` green **by exit code** from `app/`.

## What this does not do — and what comes next

- **It does not change anyone's role.** `set_member_role` runs as the
  authenticated owner; placing Darrell Jr is the Governor's own tap in
  Role & stewards, and it is a value only he holds.
- **It does not yet rewire the shell's 18 `isGovernor` call sites.** This
  record ships the model and its proof; the wiring is the next slice and is
  front-door work that belongs under the `hold` with the Governor's eyes on it.
  Until it lands, behavior is unchanged — which is why the fallback is written
  to be exactly today's answer.
- **It does not take the son off the allowlist.** Removing the address before
  the role path is wired would make him see *less*, not more — the opposite of
  what was asked. Order matters: wire authority to the role first, then the
  address stops mattering on its own.
- **`finance.view` still changes nothing a child can reach**, exactly as
  DR-0094 states: RLS walls the `child` role from the financial tables and the
  grant is the recorded decision the education view will honor, not a live data
  path. **`re-review: 2026-10-26`** — with the shell wiring, decide whether the
  son is placed as `successor` at home (reads the books, cannot write) or
  `member` in a business space, and whether the **How Money Works** view is
  built raw or curated, which DR-0094 says is his call and not the platform's.
