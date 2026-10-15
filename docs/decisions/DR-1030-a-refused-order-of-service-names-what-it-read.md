# DR-1030: A refused Order of Service names what it read — the owner's own screen said "ask a steward" and nothing else

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (a surface says the truth it measured; no data, policy or schema change)
**Type:** surface
**Area:**
- `app/src/lib/service-program.js` (`getServiceProgramAccess` names every read that failed instead of folding it into "not on the team"; `accessDiagnosis(access)` — the lines a refusal shows, pure and pinned)
- `app/src/components/ServiceProgram.jsx` (three honest states in place of one false one: "Checking your place on the team…" while the check runs; "The team check did not finish" with the reason and Retry after a 20 s deadline; the refusal with the account, the role read, the roster and every failed read, with Retry; the seed button names Bishop Gwin's order)
- `app/src/__tests__/service-program.test.js` (+4: the diagnosis lines), `app/src/__tests__/service-program-sections.test.jsx` (+1: the refused screen renders the diagnosis and Retry)

**Amends:** DR-1029 (the surface it hands Darrell to), DR-0076 §8 (provenance and honest uncertainty on a screen)
**Declared by:** Darrell's screenshot, 2026-10-15, of his own Order of Service tab reading "Ask a steward to add you to the team" under his own name as the space's owner, followed by "Where is it?!"

---

## Context

The Order of Service tab gated on `access.canSee`, whose initial state was `false`. The component showed the "ask a steward" refusal for that initial state, for the whole time the five reads behind the check were running, and for a check that never answered, exactly as it showed it for a real outsider. The owner of the space, whom `join_church_instance` seats as owner by allowlist and whom `deriveAccess` then grants both seeing and editing, saw the outsider's screen with no way to tell which of those three it was, and no way to retry.

## What was measured

- `getServiceProgramAccess` (service-program.js) runs five reads: the church instance, the role, choir membership, the finalizer flag and the roster row. Every one returns `{ data, error }`; none was inspected for `error`, so a failed read was indistinguishable from a false answer.
- The component's `load()` had no deadline and no catch. A hung read left the screen on the refusal indefinitely.
- The Choir tab resolves the same instance and role through the same functions (`getChoirAccess`, choir-sync.js), which is why the same account can read the Choir and be refused the order: the gate's inputs are identical, so a refusal here is either a read that failed, a check that did not finish, or a real non-membership, and the old screen named none of the three.
- From this sandbox the hosted database is not readable, so WHICH of the three Darrell hit is not established here; the surface now establishes it on his own screen.

## Impact

- A refusal is a diagnosis: the signed-in account, whether a church space answered, the role recorded there, the choir roster state, and each read that failed with its message. An owner or admin reading the refusal is told that a read failed and to retry.
- The check's running state is its own state, and a check that does not answer within 20 s says so and offers Retry, rather than looking like a verdict.
- The seed button says whose order it is: "Start from Bishop Gwin's order", per Darrell, 2026-10-15: "This is Bishop Gwin's order of service."

## Decision

A gated church surface never shows an outsider's refusal for a state that is not an outsider's. The three states (checking, did not finish, refused) are distinct, and the refusal carries what was read. `accessDiagnosis` is the single source of those lines so they are pinned by test and reused by any sibling gate that adopts the same rule (the Choir, harvest ledger and ministries gates still show the bare refusal; `re-review: 2026-10-22` to carry them across once the live reading from Darrell's screen says which failure class it was).

## Verification

- `service-program` 39 → 43 green (the four diagnosis pins); `service-program-sections` 3 → 4 green (the refused screen renders the diagnosis list and Retry); lint clean.
- Proven to catch: with the diagnosis list removed from the refused branch, the sections pin fails on the missing `order-access-diagnosis` node; restored, it passes.
- Live proof owed (DR-0107): Darrell reopens Church → Order of Service after the deploy; the screen is either the order or a refusal that names the reason. That reading closes this record's open question.
