# DR-0536 — The Word is never sold: sell the accompaniment, never the content

- **Status:** accepted (model built and proven; **enforcement not built, by design**)
- **Date:** 2026-09-19
- **Type:** product
- **Relates to:** DR-0076 (proven-to-catch; no claim without evidence), DR-0111 (do the work, do not re-ask), DR-0225 (brakes gate ACTIVATION, never building), DR-0432 (departments derive from the one registry), RELEASE-TIERS (real money is Tier C)

## What Darrell asked

> *"should we separate certain courses for the paid versions? If so... which one!!!!!!"*

He asked **which ones**, so the deliverable is the classification — built, derived and proven — not a request for permission to think about it.

## The premise he needed first

The app already promises the reader, in its own shipped copy (`ChurchLearn.jsx`): **"you can read everything here; nothing is locked."** Any paywall over Learn content breaks a stated promise. That constrains the answer rather than blocking it.

## The answer

**Sell the accompaniment, never the content.**

The Word is never sold — *"Ho, every one that thirsteth, come ye to the waters, and he that hath no money; come ye, buy, and eat"* (Isaiah 55:1); *"freely ye have received, freely give"* (Matthew 10:8). That is the mission, not a pricing preference: Darrell's own reason for building the age bands was **"especially our children... this is mainly about getting them understanding even if and when the parents don't have it."** A child who cannot pay must never meet a locked lesson.

Labour is still legitimately paid — *"The labourer is worthy of his reward"* (1 Timothy 5:18). So the line is **not** free content versus paid content. Every course is classified:

- **FORMATION** — forms a disciple or a child. Never priced, and nothing beside it priced.
- **VOCATIONAL** — credentials a professional. **The reading stays free.** Only the accompaniment may ever carry a price: a certificate, facilitated cohort time, the AI teacher's time, the billable templates and workbooks a professional actually uses at work.

## The split, measured on the live catalog

**FORMATION — 20 courses**
`living-lessons` · `little-learners` · `made-in-time` · `church-offices` · `healthy-living` · `world-issues` · `prophetic-voices` · `broadcast` · `infrastructure` · `sound-board` · `word-out` · `datasystems` · `handed-forward` · `banking` · `legacy-provisions` · `kingdom-economics` · `mathematics` · `ai` · `sovereign-ai` · `ai-legal-blueprint`

**VOCATIONAL — 16 courses** (reading still free)
`property-principle` · `buying-terms` · `leasing-tenants` · `maintenance-trades` · `partnerships` · `financing-debt` · `taxes-records` · `appraisal` · `evictions` · `inspections` · `insurance-risk` · `management-stewardship` · `rent-to-own-business` · `development` · `project-management` · `software-project-management`

Serve the House is formation on purpose: serving your own congregation is never a product. Kingdom Life & Stewardship is formation because its subject is the Word's own teaching on money. A.I. The Way is formation because it is discernment for believers, not a credential.

## Derived, never a hand-kept list

Darrell, on a different surface: *"Why would I need to approve a script we agree to and see the outcome of initially so it can stay consistent with the changes???!!!!! I don't want more work I want more done better without me."*

So the tier comes from the **department the registry already declares** (DR-0432). A new course is classified the moment it mounts; nobody edits a list. An unknown or missing department **defaults to FREE** — the direction of the default is the safety property: a course that mounts before its department is declared falls open, not shut.

## Shipped inactive, and it cannot quietly stop being inactive

`ACCESS_ENFORCEMENT` is `false`, and **nothing reads it**. Turning any of this into money is Darrell's decision and a Tier C gate, which is why the classification is built and the enforcement is not (DR-0225: brakes gate activation, never building).

Two brakes, both **proven to catch** rather than asserted to work:

| Brake | Proof it fires |
|---|---|
| No surface may import the model | Adding a real import to `learn-organize.js` fails: *"a surface started reading the access model — that is a paywall, and it needs a decision first"* |
| The Word's departments are formation | Dropping `The Word & The Way` from the formation list fails: *"living-lessons must never be vocational"* |

A third assertion pins the reader-facing promise itself — if `"nothing is locked"` ever leaves `ChurchLearn.jsx`, this model's premise left with it and the file must be re-read rather than trusted.

## What is NOT decided here

Prices, who bills, whether a certificate is even wanted, and whether enforcement is ever built. Those are Darrell's, and each is real money — Tier C. This record fixes only the **boundary**: which side of the line each course sits on, and that the line never crosses the reading.

`re-review: 2026-12-19` — or immediately if the "nothing is locked" promise is ever deliberately changed.
