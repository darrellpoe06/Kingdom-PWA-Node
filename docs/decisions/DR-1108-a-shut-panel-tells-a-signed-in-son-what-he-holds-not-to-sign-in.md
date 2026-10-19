# DR-1108: A shut panel tells a signed-in son what he HOLDS — it stops telling him to sign in

**Date:** 2026-10-19
**Status:** accepted
**Tier:** C (front-door copy on the panels a family member now meets; ships behind the Governor's `hold`)
**Type:** way

**Area:**
- `app/src/components/StandingNote.jsx` (new — the line a shut panel owes a signed-in reader)
- `app/src/components/AdminConsole.jsx`, `Relationships.jsx`, `CommandServeCenter.jsx` (the three panels a family member can now meet)
- `app/src/__tests__/a-shut-panel-says-what-you-hold.test.jsx` (new — 12 cases)

**Grounds:** Darrell, 2026-10-19: **"he gets access... we want them to learn by doing or helping and or witnessing our businesses... make sense?"**
**Principles:** DR-1106 §5 (the surface says what a person HOLDS, never "denied"); DR-1107 (the wiring that made these panels reachable while signed in); DR-0094 (what a child sees is the guardian's decision); DR-0329 / LockedSurface (what a shut door owes the reader); DR-0075 (a non-improvement carries a why and a date); DR-0076 §8

## Context

DR-1107 moved authority from the email allowlist to the database role. That had
a consequence nobody wrote copy for: **the people who meet a steward-only panel
are now signed in.** Before, only a signed-out visitor or an outsider could
reach one. From now on it is a son at `child` and a daughter at `member`.

DR-1106 §5 had already decided what they should read — *the surface says what a
person HOLDS, never "denied"* — and shipped `standingSentence` to say it. Nothing
rendered it. This is that sentence reaching a screen.

## What was measured

Every steward-only locked message in the tree was read, and they do **not** all
have the defect — which is why this is three files and not eight:

| panel | gate it is handed | who meets the locked box | verdict |
|---|---|---|---|
| `AdminConsole` | `isGov` (DR-1107) | a signed-in son or daughter | **ends on *"Sign in with a steward account to enter."*** — false to them |
| `Relationships` | `isGov` | the same — **including the child whose capabilities this panel sets** | **ends on *"Sign in with a family/governor account"*** — false to them |
| `CommandServeCenter` | `isGov` | the same | no false instruction, but says nothing about where they DO stand |
| `AccessUsageMetrics` | `snap.signedIn === false` | only a signed-out reader | **correct as written** — left alone |
| `Forecast` (`isOwner`), `WorkflowScribe` (`isSteward`) | `isFamilyMember` | only a non-family reader | **correct as written** — see below |
| shell CRM / Inventory / Moore Divahs | `isFamilyMember` | only a non-family reader | **correct as written** |
| `CohortPrograms` | `isGov` | non-governors get `ParentInvite`, a full surface | not a locked box at all |

`LockedSurface`'s own header named this exact failure about the five white boxes
it replaced in September: *"for somebody already signed in it is simply wrong."*
Three panels still had it; the wiring is what brought a signed-in reader to them.

## Decision

**1. A shut panel says what the reader holds.** `StandingNote` renders
`standingSentence` from the role — *"You are witnessing Poe Family — you can see
the work; the money stays with the stewards"* — and then one line naming who can
place them differently (**Role & stewards**), because a shut door owes the reader
the person who holds the key, not "your administrator."

**2. The space is named from the database, never painted.** `spaceNameFromSlug`
prettifies the slug `my_default_instance_role` returned. An unknown slug reads
*"this space"* rather than inventing a household name.

**3. It claims nothing about a reader it has not identified.** No role read —
signed out, or the read has not landed — renders the panel's **existing**
sign-in sentence, passed in as `fallback`. The old copy is kept, demoted from
*the* answer to *the unidentified reader's* answer. With no fallback it renders
nothing at all.

**4. Nothing for a governor.** A person who governs is not reading a locked
panel; a standing line there would be noise.

## What this deliberately does NOT do — with the why and the date

**`Forecast` (`isOwner`) and `WorkflowScribe` (`isSteward`) still read
`isFamilyMember`.** They are authority-shaped props that the DR-1107 scanner did
not catch, because it only inspected bindings *named* `isGovernor`. That is a
real gap and it is named here rather than swept, for a reason that is not
timidity: **the correct gate for Forecast is books-visibility, not
governorship.** A `member` reads the financial tables under `0082`, so gating
Forecast on `isGov` would make the client **stricter than RLS** — which is
exactly what DR-1106 forbids: the model mirrors the wall, it does not invent one.
Choosing between `canSeeBooks` and governorship for those surfaces is a decision
about what a daughter and a son see, which DR-0094 keeps with the guardian and
not with the platform. **`re-review: 2026-10-26`**, with DR-1107's own review.

Today those two panels are met only by a non-family reader, for whom *"sign in
with a family account"* is true — so no reader is being told something false
while the decision waits. That is the whole reason it can wait.

## Verification

- **12 cases**, rendered through a real React root with the role seam stubbed and
  **the rule itself unstubbed** — the standing a `child` and a `member` get is
  computed by `lib/family-standing.js`, not by the test.
- A case walks **six** non-governing roles and asserts the words *denied /
  forbidden / not allowed / no access* never appear **and that the reader is
  never shown an empty box**.
- **Proven to catch** (DR-0076 §3): the pre-change shape — the sign-in sentence
  in the panel's own prose rather than in a fallback — is reconstructed from the
  real `AdminConsole.jsx` and fails the assertion by shape.
- The unidentified-reader paths are pinned both ways: fallback present → the
  panel's exact old sentence, byte for byte; absent → empty string.
- A case pins the two panels this record deliberately leaves alone, by their
  exact shell lines, so the deferral above is a decision in the suite rather
  than a silence.
- Shell **5193 / 5193** lines — this slice costs the frozen monolith nothing.
  Lint exit **0**; `verify:gates` exit **0**; **201 cases green** across the 14
  suites that touch the three components and the model.
