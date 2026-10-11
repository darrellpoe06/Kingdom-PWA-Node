---
id: DR-0964
title: The witness was pinned to the defect — deleting the PIN form turned the deploy red for two merges
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, PROVE-THE-DEPLOY, GATE-THE-CLASS]
source: 2026-10-11 — found by the agent checking the deploy ladder after #2118 merged
---

## Context

No report. Found while proving the deploy for #2118, which is the step DR-0107
exists to force. The deploy workflow had been **red on two consecutive merges**
and nothing had said so.

## What was measured

| Run | SHA | Deploy job | Boot-check job |
|---|---|---|---|
| 1614 | `f707e91a` (#2115) | success | success |
| 1615 | `e6d75403` (#2116) | **success** | **FAILURE** |
| 1616 | `eccda88b` (#2118) | **success** | **FAILURE** |

The failure, from run 38112398908's own log:

```
BOOT FAIL https://poetech.us/poetech-app/ — app did not mount within 30s
(no mount marker; body 462 chars): "POE PROPERTIES — PLACES TO LIVE
 2 places available ... No account needed to look. Champaign, Illinois.
 PHOTOGRAPHS COMING ... BOOK A STAY —"
```

**The app had mounted.** That body is the front door rendering correctly, and
`?moore=1` and `?view=church` both read `BOOT OK` in the same run, seconds
later. The upload job succeeded, so the live site was serving the right build
the whole time.

`scripts/boot-check.mjs:22` held:

```js
const MOUNT_MARKERS = ['PROJECTIONS, NOT PROMISES', 'Create your profile', 'SIGNED IN AS'];
```

**`'Create your profile'` was the heading of the PIN form** Darrell
photographed that morning — *"Why are you asking new users to create an account
before seeing the listings?!!!!!!!!!!!!"* DR-0958 removed it. The instrument
watching the signed-out root was still looking for it, so **deleting the defect
is what turned the deploy red.**

**A second fault, caught before it shipped.** My first fix added the heading
literally. It would have failed too: boot-check reads
`document.body.innerText`, which Chrome returns with CSS `text-transform`
already applied, and the heading carries `uppercase`. The failing log printing
the words IN CAPITALS is the evidence, and I nearly read past it. Verified:
against that exact body, the folded compare matches and a literal one does not.

## Impact

Not an outage — the site was up and correct throughout, which is the one piece
of good news here. The cost is that **a red deploy stopped meaning anything**
for an hour and fifty minutes: a real boot failure arriving in that window
would have looked identical to this one. A gate that cries wolf is as broken as
one that stays silent (P46), and this one cried on the fix.

It also files a bogus incident comment and attempts a phone push on every run.

## Decision

1. **The markers and the comparison move to `scripts/boot-markers.mjs`** — a
   pure module with no browser import. `boot-check.mjs` imports
   `playwright-core` at module scope and **cannot be loaded by a test at all**,
   which is a large part of why this rule went unproven for as long as it did.
   The pure-core / thin-shell split is the one `push-stranding-guard.mjs`
   already uses.
2. **The front door's heading joins the list**, and **every marker now carries
   a note naming the screen it is for.** The root cause was a marker outliving
   its screen with nothing recording what it had been for; the note is what
   makes a retired screen visible to the next reader.
3. **The comparison is case-folded**, in the verdict, in the in-page waiter and
   on the fail markers. Capitalising the marker instead would have worked until
   somebody dropped the CSS class. Folding means a styling change can never
   blind the witness again. The in-page waiter is folded separately and must
   be: it runs inside the page and cannot call the shared helper, so a literal
   compare there would have timed out for thirty seconds before a correct
   verdict said it was fine.
4. **Not decided:** whether a mount marker should be a stable DOM attribute
   rather than human-visible text. That is the real durable answer — text on a
   screen is content, and content changes — but it touches every surface
   boot-check watches. `re-review: 2026-10-18`.

## Verification

- `app/src/__tests__/the-witness-watches-the-door-that-is-there.test.js` — 6
  tests, built on the **exact body copied from the failing run's log**, not
  retyped from the component.
- **Proven-to-catch, three mutations, each caught:**

  | Mutation | Result |
  |---|---|
  | The front door's marker removed (**the state that went red**) | **2 of 6 fail** |
  | The fold removed, back to a literal compare | **2 fail** |
  | A marker loses the note naming its screen | **1 fail** |

  Restored: 6 pass. One test asserts the literal compare *fails* on that body,
  so nobody can "simplify" the fold away without the suite saying why it exists.
  Another reads the heading **out of `PublicFrontDoor.jsx`**, so changing the
  heading without telling the witness fails here rather than on the next deploy.
- **Live proof:** the next deploy after this merges must reach `BOOT OK` on the
  bare root. Until a green deploy run is seen on a `main` SHA containing this,
  the record stays open — decided by exact commit, never list position (P62).

## Links

[DR-0958] (the front door that replaced the PIN form), [DR-0139] (boot-check:
probe-green is not boot-green), [DR-0107] / P26 (prove the deploy — the step
that found this), [DR-0393] (the pure-core / thin-shell split this copies),
P46 (a gate that cries wolf), P44 (a green check is not a check that ran).
