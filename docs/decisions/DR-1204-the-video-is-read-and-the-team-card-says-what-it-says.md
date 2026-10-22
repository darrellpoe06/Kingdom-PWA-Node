# DR-1204: The video is read — the Team card says what its source says

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (copy and reference content on the Development tab's Team card; no data, no wall, no road changes)
**Type:** surface
**Area:**
- `app/src/modules/properties/development-team.js`: each role carries the video's `when` / `does` / `vet` / `pay`; `EMPHASIS_MEANING`, `VIDEO_SOURCE`, `VIDEO_WAYS`; `SEQUENCE_READING` becomes the video's order
- `app/src/modules/properties/DevelopmentTab.jsx`: the Team card's emphasis and order lines; *What the video says* per role; *Finding, vetting and keeping them*
- `docs/99-session-notes/sources/build-your-real-estate-development-team-6gvmsb3plmy/transcript.txt`: the source, on our own road
- Tests: `your-team-is-named-before-a-shovel-moves.test.jsx`, `your-team-for-building-from-nothing.test.js`

**Grounds:** DR-1175 (the Team card, which closed with *"his video is unread … re-review 2026-10-22"*), DR-1203 (the texts are reachable), DR-0076 (say whose a claim is; never more than the source says), DR-0236 (nothing waits).
**Declared by:** Darrell, 2026-10-22, with a screenshot of the video's transcript in the Research list: *"I need to be able to copy the text... also... why can't you get these text?!!!!!"*

## Context

**SHOULD.** The Team card is built from the source he sent: the slide AND the video it comes from.

**ARE, measured.** DR-1175 built the card from the slide alone, because the video's transcript had not come home when it shipped. So the card said the slide *"sets nine of them in bold and does not say what bold means"*, and it offered PoeTech's own reading of the numbering (*"a price before a lender"*), labelled as PoeTech's. The transcript was already in the Research list (the 14:27 link, answered at 18:06 on 2026-10-21). The agent had said it could not get it because the cloud sandbox has no route to the live database, and it stopped there. That was wrong: `source-transcript-nas.yml` brings a video's transcript into the repo on our own road. Dispatched for `6GVmsB3PLmY`, run 39708525219 committed it in 26 seconds (6,431 words, YouTube's auto-generated captions).

## Decision

**The card says what the video says, labelled as the video's, and corrects what PoeTech had guessed.**

- **Bold** = in the video's words, *"the core members of your team that you'll need even if you want to build a single-family home or a duplex"*. Still never called "required".
- **The order** is the video's, and it corrects the old reading. Before an offer: build lender relationships before there is a deal, and ask the architect or land use attorney what the lot allows. Once under contract: the surveyor, the soil engineer and the attorney or title company. Then the design, the GC's price, insurance, and the property manager during construction.
- **Each role** opens *What the video says*: when to call them, what they do, the questions he vets them with (architect, land use attorney, GC, civil engineer, property manager), and his ballpark pay, always with his own caveat: his Virginia numbers, varying by market, location, size, complexity and relationships.
- **Finding, vetting and keeping them** at the top: hire local; find by referrals, local development news, driving local projects, professional groups; vet by independent references, visiting projects, reviews, the state licensing board; keep them by clear expectations, driving the vision, not nickel-and-diming, paying on time.
- Everything from the video is **summarised, not quoted as his exact words**. The captions are a machine's hearing, and their own header says to verify wording before quoting a person. The single phrase quoted for the bold is short and clear in the captions.

## What was measured

| what | before (DR-1175) | after |
|---|---|---|
| what the bold means | "does not say" | the video's own phrase |
| the order | PoeTech's guess, "a price before a lender" | the video's: lenders first, before a deal |
| what the card knows about each role | its name | when, what they do, what to ask (5 roles), ballpark pay (12 roles) |
| the video's transcript | "unread" | in the repo, 6,431 words |

## Impact

- A person building from nothing sees who to call, when, what to ask and roughly what it costs, on the same card where they record who fills each role.
- DR-1175's dated re-review for the video (2026-10-22) is closed by this record.

## Verification

- 36 Team tests green, including the moved pins: the bold's meaning in the video's words, the order *from the video*, a role's panel (when, a vetting question, the pay with its caveat), the finding-and-vetting panel; **proven to catch** (the bold's meaning rewritten as "these nine are required": 2 red; restored: green). The card still never says "required".
- UI standards, consistency, contrast, legibility and feature-presence: 156 green; lint 0.
- **Not yet seen rendered on poetech.us:** the stewards' pass after deploy (DR-0104).
