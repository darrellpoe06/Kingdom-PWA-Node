# DR-1107: The shell asks the role who governs — and the seam it needed was already in the tree

**Date:** 2026-10-19
**Status:** accepted
**Tier:** C (front-door identity — this is the change a family member will FEEL; ships behind the Governor's `hold` per RELEASE-TIERS)
**Type:** way

**Area:**
- `app/src/poe-financial-mvp-v28.jsx` (all 10 `isGovernor` bindings now read one role-derived `isGov`; net **0** lines — the monolith freeze held)
- `app/src/lib/family-standing.js` (`governsHere` — the composed rule the shell reads)
- `app/src/lib/instance-role.js` (re-exports it, so the shell's import rides the existing role-seam line)
- `app/src/lib/nav-items.jsx` (the Admin tab reads the same flag, defaulting to today's answer for every other caller)
- `app/src/__tests__/the-role-decides-who-governs.test.js` (new — 14 cases), `family-standing.test.js` (+4), `reviewer-mode.test.js` / `relationships-wiring.test.js` (pins moved to the new spelling)

**Grounds:** Darrell, 2026-10-19, on his son's CHILD badge: **"Fix it... he gets access... we want them to learn by doing or helping and or witnessing our businesses... make sense?"**
**Principles:** DR-1106 (the rule this wires); DR-0093 (children never join through the allowlist); DR-0094 (money visibility is the guardian's decision); DR-0104 (the reviewer lens must stay honest); DR-0107 (a door that goes dark is the worst outcome); DR-0076 §3 and §8

## Context

DR-1106 shipped the model and said plainly what it had not done: *"It does not yet
rewire the shell's 18 `isGovernor` call sites... the wiring is the next slice."*
This is that slice.

## A correction first

Closing DR-1106 I said a new RPC or migration was the prerequisite, because
`list_my_admin_instances` (0112, re-shaped by 0221) filters
`im.role IN ('owner','admin')` and therefore cannot serve a child.

**That was wrong, and it was wrong in the expensive direction** — it would have
parked a buildable slice behind a schema change. `my_default_instance_role()`
(0130, `migrations-auto/0130-assistant-provisioning-and-office-workspace.sql`)
already returns the caller's own role with **no role filter at all**, is granted
`TO authenticated`, and **the shell has been calling it since DR-0271** —
`poe-financial-mvp-v28.jsx:1251`, `useInstanceRole()`. The role was already in
the shell's hand. It was consulted for exactly one thing: `=== 'assistant'`.

No migration. No new RPC. The seam was there; nothing asked it the question.

## What was measured

| asked | answer |
|---|---|
| does an RPC give a non-admin their own role? | **yes** — `my_default_instance_role()`, 0130, no `im.role IN (...)` clause, `GRANT ... TO authenticated` |
| was the shell already calling it? | **yes**, `:1251` — used only to test for `assistant` |
| how many `isGovernor` bindings are in the shell? | **10** (`isGovernor={...}` and `isGovernor: ...`), every one of them previously derived from `isFamilyEmail` or from `isFamilyMember`, which is that same allowlist |
| which of those are the ones that matter? | **AdminConsole** (the Access & Usage panel in the Governor's own screenshot), **Relationships** (where the guardian governs a child's capabilities), the **governance station**, **Projects**, **CommandServeCenter**, **CohortPrograms**, **TlcAssistant** ×2 |
| did the Admin **tab** agree with the Admin **console**? | **no** — the tab gate lives in `lib/nav-items.jsx:150` and read `isFamilyMember`, so a child would have seen a tab that opens onto a locked panel |
| shell line budget | **5193**, the frozen ceiling, before and after |

## Decision

**1. One derivation, ten readers.** `governsHere({ signedIn, reviewerMode,
allowlisted, role })` composes the four things the shell already knows and
returns one boolean. All 10 bindings read it as `isGov`. Before this, three
different spellings of the same intent sat at three different sites — including
one (`:4799`) that had lost its `!reviewerMode` term entirely. One fact, one
place; they can no longer disagree.

**2. The rule lives beside the model, not in the shell.** `governsHere` is in
`lib/family-standing.js` with its own cases, re-exported from
`lib/instance-role.js` so the shell's import rides the existing role-seam line.
That is the documented monolith-freeze trim (DR-0291: the comments move to where
a reader actually looks), and it is also just true — someone asking "who
governs?" should find the answer next to the standings, not in a 5,193-line
shell.

**3. The nav tab reads the same flag.** `navItems` takes `isGovernor`,
**defaulting to `isFamilyMember`** so every other caller keeps exactly today's
answer, and the shell hands it the role-derived one. The shell's own
assistant-scope comment already states the principle — *"the nav agrees instead
of painting empty tabs"* — and this is the Admin tab finally obeying it.

**4. The reviewer lens is senior to both the role and the address.** In
reviewer mode `governsHere` returns false before it looks at anything, so the
Governor previewing the app as a visitor cannot be re-promoted by his own
membership row. Without that, the preview would be a lie (DR-0104).

**5. The fallback is unchanged, and it is the whole safety of this slice.** A
role read is a network call. Unknown role → the standing answers from the
allowlist, exactly as the app behaved yesterday. A failed read cannot demote the
person reading it (DR-0107).

## What a person will FEEL — stated plainly, because this is the Tier C part

The roster in Access & Usage, read through this wiring:

| person | stored role | before | after |
|---|---|---|---|
| Darrell Poe / darrellpoe06 | `owner` | governs | **governs — unchanged** |
| mrspoe06 | `admin` | governs | **governs — unchanged** |
| christianapoe, Christyn Poe | `member` | governed (by address) | **helper** — keeps the tabs and the books RLS already allows; the Governor-only panels (Admin, the capability panel, the governance station, the Projects governor controls) close |
| darrellpoejr | `child` | **governed (by address)** over rows the database denied | **witness** — the app and the database finally say the same thing |

The daughters' change is the one to look at, and it is not a demotion invented
here: it is the client stopping its own over-grant. `member` was never a
governing role in the database — 0111's `set_member_role` guard and every
`user_role_in_instance(...) IN ('owner','admin')` policy have said so all along.
The app was the only thing claiming otherwise. **If the Governor wants a daughter
governing, the answer is a role, which is a tap he holds in Role & stewards — and
that is the point of the whole change.**

## Verification

- **Proven to catch** (DR-0076 §3): the scanner is run against the real shell
  with the pre-wiring form restored — `isFamilyEmail` in an `isGovernor` slot,
  `isFamilyMember` in one, the role dropped from the rule, the reviewer lens
  dropped, the import removed — and it fails by name on each. A companion case
  pins the population (**≥8 bindings**) so the scan cannot pass vacuously.
- **The quiet failure has its own gate.** If `my_default_instance_role` were
  ever narrowed the way `list_my_admin_instances` is, a child's role would read
  as null, the standing would fall back to the allowlist, and he would be a
  governor again **with nothing failing**. Four cases hold that seam open: no
  role filter, the caller's own role, the `authenticated` grant, and a
  mutation case that applies the 0112 narrowing and confirms the gate rejects
  it. A fifth asserts the admin-scoped RPC is still admin-scoped, so the two
  cannot be confused for each other.
- **The reviewer-mode pins were updated, not deleted.** That suite's own
  comment warns that a pin which can only say *"this line changed"* cannot tell
  a real break from a rename. Its three failures here were exactly that case:
  the narrowing was intact, the spelling was not. The pins now hold the
  property — the shell hands the rule `reviewerMode` and the session, and
  nothing else in the shell may define `isGov` — and the lens's behavior is
  asserted on the rule itself.
- **Measured, not claimed:** shell **5193 / 5193** lines, the frozen ceiling, net
  **0** (one line added for the rule, one removed where the shadowed `isGov`
  used to be). `npm run lint` exit **0**. `npm run verify:gates` exit **0** from
  `app/`. The 5 directly-affected suites **79 cases green**; the full set of
  **93** test files that import the shell re-run green after the pin updates.
- DR-1106's own CI is green under the `hold` (runs 8440 + 8441 on `50a1956`).

## What this does not do

- **It changes no one's role.** `set_member_role` runs as the authenticated
  owner; placing Darrell Jr — `successor` at home, `member` in a business space,
  or something else — is the Governor's tap and a value only he holds.
- **It does not take the son off the email allowlist**, and the order is
  deliberate: authority is wired to the role first, so the address now grants
  membership and nothing more. Removing it before this landed would have shown
  him *less*, which is the opposite of what was asked.
- **It does not build the How Money Works view.** `finance.view` remains the
  recorded decision DR-0094 describes, not a live data path; RLS still walls the
  `child` role from the financial tables.
- **It does not touch the ~30 membership reads.** `isFamilyMember` still decides
  which tabs render and which world seeds — DR-1106's own rule is that an email
  *can* make you a member. Those are pinned by a case so the current state is a
  decision rather than a drift.
- **`re-review: 2026-10-26`** — with the Governor's eyes on the live build:
  where Jr is placed, whether the daughters are given a governing role, and
  whether the standing sentence should appear on the surfaces that now close.
