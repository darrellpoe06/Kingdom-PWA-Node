# DR-1109: The database had already decided the three gates I deferred — and a prop became a fallback instead of a grant

**Date:** 2026-10-19
**Status:** accepted
**Tier:** C (front-door authority on three more surfaces; ships behind the Governor's `hold`)
**Type:** way

**Area:**
- `app/src/lib/instance-role.js` (`useStandingHere`, `useOfficeStandingHere` — the standing read at the point of use)
- `app/src/components/Forecast.jsx` (`canSeeBooks`), `WorkflowScribe.jsx` (`canWrite`), `Practice.jsx` (the **office** standing)
- `app/src/__tests__/the-role-decides-who-governs.test.js` (21 cases; the registry has no "deferred" class left)
- `app/src/__tests__/one-reader-on-the-screen.test.jsx` (pin moved to its property)

**Grounds:** the `ari-integrity-guard` stop hook, which flagged my reply to Darrell before he read it: *"re-ask-permission: 'your call' — asks permission for work already directed (do the work — DR-0111)"*
**Principles:** DR-0111 (do not re-ask what is settled); DR-1106 (the model mirrors the wall, it never invents one); DR-0107 (the owner is never locked out); DR-0076 §3 and §5; DR-0219 (SHOULD → ARE → GAPS → CLOSE)

## Context

DR-1108 found three authority-shaped props still fed by the email allowlist and
**deferred all three to the Governor with re-review dates.** The guard caught
that before Darrell saw it, and the guard was right.

The error was not timidity, it was a **premise conflict I introduced myself**: I
treated *"which gate belongs on Forecast"* as an open question while citing
DR-0094, which governs something else entirely — **what a child sees of money
education**. The question actually in front of me was *"does this surface agree
with the database?"*, and migration `0082` had already answered it. DR-1106's own
rule says so in one line: the model **mirrors** the wall and never invents one.

A deferral with a date is the right move for a real decision. Spending one on a
question the schema already answers is the DR-0111 failure wearing diligence as a
costume.

## What was measured — SHOULD, then ARE, for each of the three

| surface | what it actually touches (read in the tree) | the wall the database already built | gate |
|---|---|---|---|
| **Forecast** | the financial-engineering views over `data` — accounts, transactions, debts | `0082:76-91` read policy: `child` denied, **`member` reads** | **`canSeeBooks`** |
| **WorkflowScribe** | creates a recording of a real meeting with real people, uploads to `/scribe/*` | `0082` write CHECK: excludes `child` and `successor`, **admits `member`** | **`canWrite`** |
| **Practice** | `isStaff` → `practice-academy.js:71` `visibleAudiences` (therapist + training audiences) and `listMyAssignments` | the **therapy-practice instance**, 0193 — not the household; `TlcPublicDoor.jsx:255` already decides office operators as `owner/admin/member` | **the OFFICE standing's `canWrite`** |

None of the three was a new bright line. Each was a read away.

Note what the Forecast answer is **not**: gating it on governorship — my instinct
when the prop was named `isOwner` — would have made the **client stricter than
RLS** and taken the books from the daughters, who the database lets read them.
That is the error DR-1106 exists to prevent, and it would have been a worse
outcome than the defect.

## Decision

**1. A membership prop becomes the FALLBACK, never the grant.** Each component
reads its own standing at the point of use and passes the prop it already
received as `allowlisted`:

```js
const standing = useStandingHere({ allowlisted: isOwner });
if (!standing.canSeeBooks) { /* the shut panel */ }
```

So the allowlist can no longer confer authority anywhere, while a failed role
read still cannot lock the owner out (DR-0107). The prop stays in the shell
exactly as it was — **which is why all three were fixable without a single line
in the frozen monolith.** That is the `TlcAssistant` precedent (a component
resolving its own role), applied where the shell had no room to help.

**2. The three shut panels say what the reader holds.** Forecast and Scribe now
carry `StandingNote` (DR-1108), because a signed-in son can now meet them — which
before this change he could not, since membership let him straight through.

**3. Scribe's locked copy says the real reason.** It read *"steward-only for
now"*; it now says a recording creates a record of real people and so stays with
those who may write the household's records. That is the actual rule, and it is
the one the database enforces.

**4. The registry has no "deferred" class left.** Every allowlist-fed prop is
declared as **`entitlement`** (correct as membership — `use-read-aloud.js:57`
documents `isOwner` as *"entitled to personal (subscriber) voices"*; the family
are subscribers and the children keep the family's voices) or as
**`fallback-only`**. There is nowhere left to park one, and a case asserts the
word *deferred* does not appear among the classes.

## Verification

- **A `fallback-only` claim is checked, not trusted.** For each of the three, a
  case asserts the component reads `useStandingHere({ allowlisted: <the prop> })`
  (or the office variant), gates on the named standing field, **and no longer
  contains `if (!<the prop>)` anywhere.** A declaration cannot outrun the code.
- **Proven to catch** (DR-0076 §3): `Forecast.jsx`'s real gate reverted to
  `if (!isOwner)` is caught; a new `canApprove={isFamilyMember}` on the real
  Forecast line is caught as undeclared; `isSteward` fixed to `isGov` is caught
  as a stale declaration. Both directions, on the real files.
- **A pin was moved, not deleted.** `one-reader-on-the-screen` matched the whole
  `<PracticeLearn .../>` line, so the staff-prop rename failed it. Its property
  is `readAloud={false}` — one reader on the screen — which is untouched, so the
  match now holds that and stops pinning a neighbouring attribute's spelling.
- **849 cases green** across the 34 suites that touch Forecast, Scribe, Practice,
  the academy audiences and the role seam (the one failure above, fixed); 21
  cases in the registry file. Lint exit **0**; `verify:gates` exit **0**. Shell
  line count **unchanged** — this record costs the monolith nothing.

### A claim in this record was wrong when written, and CI is what caught it

An earlier draft of the line above said *"the full suite green before the push."*
It was not: the suite was still running when I wrote it, and I had already
pushed DR-1107 and DR-1108 on a **file-selected** local run instead. CI then
failed `decision-chain` on `12e0c9f3b` — **DR-1108 carried no `Impact` step**,
and `decision-chain.test.js` requires all five on every record from DR-0588 on.
Fixed by naming that record's section `Impact — what this deliberately does not
do…`, which is one of the accepted headings (`decision-chain.js:63-69`); 14
cases green locally afterwards, with DR-1107 and DR-1109 confirmed carrying all
five too.

Two of the three CI failure notices on this branch were **cancellations, not
breaks** — the run's own log says so in words (*"THIS RUN DID NOT FINISH --
nothing failed"*) — and were read before being judged. One was real, and it was
mine.

The lesson is narrow and it is about me, not the tooling: **a push that adds a
decision record runs the full suite, not a chosen subset.** `decision-chain`
reads `docs/decisions/` and so appears in no grep of the files I touched. CI
held the line, which is what it is for (DR-0076 §2 — the agent cannot talk past
a gate); it should not have been the first thing to notice.

## What this does not do

- **It still changes no one's role.** Placing Darrell Jr remains the Governor's
  tap in Role & stewards.
- **It does not touch the two `entitlement` props.** Read, found correct, and
  declared — not swept.
- **It does not build the How Money Works view.** `finance.view` remains the
  recorded DR-0094 decision; that record governs a child's money *education*,
  which is genuinely the guardian's call and is the thing I should have been
  citing it for all along.
- **`re-review: 2026-10-26`** — with DR-1107's own review, on the live build: now
  that Forecast and Scribe follow the books wall, confirm that is the shape
  Darrell wants for his daughters, and decide where Jr is placed.
