# DR-0607 — PoeTech designs repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person's institutional knowledge

- **Status:** accepted (held for Governor review before merge — mission identity is Tier C)
- **Tier:** C (front-door / About / mission identity, per `RELEASE-TIERS.md`; the PR carries `hold` until Darrell lifts it)
- **Type:** principle (a declared purpose statement; new binding-principle ID `REPEATABLE-GOVERNANCE`)
- **Date:** 2026-09-24
- **Scope:** `docs/decisions/PRINCIPLES.md` (new ID `REPEATABLE-GOVERNANCE`); `docs/00-foundations/_root/GOVERNANCE-EXECUTION-ADVISORY.md` (new section "What PoeTech designs"); `app/src/lib/purpose.js` (new — the one place the sentence lives in the app, with the Word behind it verbatim); `app/src/components/About.jsx` (the Mission section renders it as "What PoeTech designs"); `app/src/components/OpsBoard.jsx` (the governance surface states the purpose it serves, above the lane model); `app/src/__tests__/repeatable-governance-purpose.test.jsx` (new — 5 pins: the sentence, record-and-app never drift, the Word verbatim from the corpus on disk, the About render, the OpsBoard render)
- **Principles:** APP-IS-PRIMARY (DR-0065 — surfaced inside the app, not only in the repo), DECISION-RECORDS, GOVERN-EXECUTE-ADVISE (this statement names what the Foundation's governance systems are FOR), DR-0331 (his words rendered for meaning), DR-0076 (the pin holds record, lib and surface together; the Word verbatim), TIER-C
- **Grounds:** Darrell, 2026-09-24, declared: *"PoeTech App should be Designing repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person's institutional knowledge."*

## Context — the question

A declared statement of purpose at the level of the whole app. It is not a feature request; it is the sentence the governance surfaces already being built (the OpsBoard, the Governance Queue, the decision ledger, the Council Chamber, the ministry coordination spine, the six-tier watcher fleet) have been reaching toward without a stated name. Per Layer 0 a declared directive is a new decision record, never a rewrite; per APP-IS-PRIMARY it must also be stated inside the app where the people it serves will read it.

## What was measured

| what | measured |
| --- | --- |
| where the app already said what it is for | About → Mission: "PoeTech exists to help families be supported in their relationship with Yahweh"; About → How it works: "a Family Operating System"; the data-systems course: "one app, real data, for the Body". None named governance as the thing designed. |
| prior art for the condition | `MINISTRY-SUPPORT-PATTERN.md` (2026-07-12): the software's whole job is to make the carrying "coordinated instead of dependent on one person's memory and phone calls" — the same principle, stated for one ministry. This record generalizes it to the app. |
| the governance surfaces that already embody it | OpsBoard (the lane's state read live from the repo, never one steward's memory); GovernanceQueue (the decision queue and the decided ledger parsed at build time, no external dependency); the decision-chain gate (every new record must answer concern → evidence → impact → decision → outcome); the six-tier watcher fleet (DR-0135: probe → readout → actuator → announce) |
| the Word behind it, verbatim from the corpus on disk | "Where no counsel is, the people fall: but in the multitude of counsellors there is safety" (Proverbs 11:14); "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2); "woe to him that is alone when he falleth; for he hath not another to help him up" (Ecclesiastes 4:10) |
| after | one sentence in `lib/purpose.js`; About → Mission renders it with the three verbs and the referenced Word; the OpsBoard renders it above the lane model as the purpose the board serves; the pin reads the record file and the KJV files so the three cannot drift |

## The statement, held in our voice

**PoeTech designs repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person's institutional knowledge.**

Three verbs and one condition. Every governance surface in the app is measured against them: does it help a community recognize a pattern, surface a risk, or make a better decision — and does it do so in a way that would still work if the one person who knows how it all fits were absent? A surface that only works while Darrell remembers is not a governance system; it is a memory.

## Decision

1. `REPEATABLE-GOVERNANCE` is a binding-principle ID in `PRINCIPLES.md`, citable by later records.
2. The sentence lives once in the app (`lib/purpose.js`) and is read by the About Mission section and the OpsBoard; no component hardcodes it.
3. The Word beside it is quoted verbatim from the corpus on disk and referenced; the pin compares text to file.
4. **This is Tier C** (mission identity on the front door). The PR ships through the lane with `hold`; Darrell lifts the hold to merge. Nothing here self-activates.
5. **Standing test for future governance surfaces:** a new governance surface names which of the three verbs it serves and how it holds without one person's knowledge; a surface that cannot answer is a `re-review:` item, not a launch.

## Verification

- `repeatable-governance-purpose.test.jsx` 5/5; `about-sections-render`, `ops-board-render`, `decision-chain` green; eslint 0.
- After the hold is lifted and the merge deploys: DR-0104 live review — About → Mission on a phone: the "What PoeTech designs" block under the local-first line; Admin → OpsBoard: the purpose line above the lane model.

## Limits, stated

1. **The statement is on two surfaces, not every governance surface.** The Governance Queue, the Council Chamber and the watcher readouts do not yet name which verb they serve. `re-review: 2026-10-07` — add the one-line "this surface: recognizes / surfaces / decides" caption to each, from `lib/purpose.js`.
2. **"Organizations" is his word and is kept.** The app's named first community is a church and a family (COMMUNITY-FIRST); the sentence is deliberately wider, and the About block sits beside the COLG-first mission rather than replacing it. If the width reads wrong on the live page, the re-review above is where it is narrowed.
