# DR-1200: The words go in one press, and research comes back as a reading

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A for §1–§3 (the composer and Your prompts); B for §4 (a second pass in an existing scheduled lane and a new request-driven door on the NAS research forwarder, both behind the family key, one road call per run)
**Type:** surface + lane
**Area:**
- `app/src/components/OneVoiceInput.jsx`: the send no longer refuses the words over a recording too short to send; the "From the Word" suggestions sit under Send
- `app/src/components/PromptHistory.jsx`: one "To the box" per card (the "Put … in the box" replacers are gone); a Create row
- `app/src/lib/create-from-words.js`, `app/src/components/CreateFromWords.jsx` (new): tick a lesson, a build for PoeTech, research; press Create once
- `infra/nas-research/research_forwarder.py`: `POST /read` (the tower alone, no search), its selftest cases
- `scripts/research-reading-text.mjs`, `scripts/research-reading-waiting.sql` (new); `.github/workflows/research-inbox.yml`: the reading pass
- `app/src/lib/research-items.js`, `app/src/components/ResearchSection.jsx`: the reading parsed, paired and drawn; the Create row on an answer
- Tests: `spoken-lesson-one-send.test.jsx` (three cases), `create-from-words.test.jsx`, `research-reading.test.jsx`, `research-section-render.test.jsx` (two cases), `saved-prompts.test.jsx` and `the-words-come-back-where-the-line-was-made.test.jsx` (moved to the one box button)

**Grounds:** DR-0608 (the lesson door), DR-0622 (a PoeTech request is relayed and filed), DR-0630 (the suggestions stay on screen after a send), DR-0076 (every answer and reading unverified, in words; a refusal names its cause), DR-1172 (the Research section and its lane, budget + lock), DR-1101 (the research road behind the family key), DR-0248 (the deterministic class: budget + lock), UX-PATTERNS 2f.3 (a disabled control says why), 2g.
**Declared by:** Darrell, 2026-10-21, in four messages from the Thinking Space and the Research tab: *"What happens when we get the results from our Research? Did we create the systems I expected... opportunities and constraints... fix it."* — *"why do we need to do anything other than say make a lesson or build or research... when we can see the words transcript... we can say create and have a check box for what is possible then it will create... fix it."* — *"After putting things in the box, it does not allow me to just send it... I shouldn't have to put it in the box 15,000 times... there's nothing that allows me to just push it through. Also, the order, why would we have to go through all these links before we can just see what we're doing?... Those other things are suggestions... we want the lessons we want... evaluation can happen after the fact."*

## Context

**SHOULD.** Words on the screen become what Darrell says, in one press. A lesson he wants is in the space first; suggestions and evaluation come after. A research result comes back as something the family can use: what it is, the opportunities, the constraints, the next step, and where in PoeTech it belongs.

**ARE, traced on his screenshots and in the code.**
1. **The send refused the words.** With a transcript in the box and a 0:02 take beside it, Send the lesson said *"Not sent (Record at least 3 seconds.)"*. `OneVoiceInput.send` sent the RECORDING whenever a take existed (`takeReady`: the take heard sound), and `recordingProblem` refused a take under `MIN_LESSON_SECONDS` = 3, taking the words down with it.
2. **The suggestions stood between him and Send.** `LessonsForSituation` rendered above the kind choice, the notice and the Send row.
3. **Five box buttons per card.** A spoken lesson's card carried Show the words / Put the words in the box / Add the words to the box, then Put it in the box / Add to the box / Copy / Keep / Delete. "Add" already puts into an empty box (`boxAfter`), so every "Put" was a second button for the same act — and nothing on the card sent anything.
4. **Research came back as a raw dump.** The lane wrote the transcript or the search answer as the answer row and stopped; nothing read it for the family's systems.

**GAPS.** Four. **CLOSE.** Below.

## What was measured

| what | before | after |
|---|---|---|
| a transcript in the box with a 0:02 take beside it | "Not sent (Record at least 3 seconds.)" | sent as the lesson; the take set aside in one sentence |
| where the "From the Word" suggestions sit | above the kind choice and Send | under Send and its confirmation |
| box buttons on a spoken lesson's card | 4 (Put / Add, twice) | 2 (To the box, once for the words and once for the line) |
| presses from words on a card to a lesson, a build or research | box, choose a chip, Send (per destination) | tick, Create (one press for any of the three) |
| what an answered research item says about itself | the raw answer | a reading: what it is, opportunities, constraints, next step, where it lands; or the reading's pending why |
| road calls per research-lane run | 1 | 1 (the reading runs only in a run that answered nothing) |

## Impact

Darrell's words go where he says the first time, and the suggestions wait below for after. A transcript he can see becomes a lesson, a build or a research item with one press. A link or a question he sends to Research comes back saying what it is for the family, what it opens up, what stands in the way, and which part of PoeTech it belongs to.

## Decision

1. **The words go, even when the recording cannot.** A take too short to send is set aside with one sentence (*"The 0:02 recording was too short to send (it needs at least 3 seconds), so it was set aside and your words went on their own."*) and the box's words go as the lesson. A take with no words beside it still says why it cannot send.
2. **What is like it comes after what you are doing.** The "From the Word for this" suggestions render under Send and its confirmation (DR-0630 keeps them on screen after a send).
3. **One box button, and Create.** Each card has one **To the box** (into an empty box, or under what it holds). And a **Create** row: tick *A lesson*, *A build for PoeTech*, *Research*; press Create once; the words go down the roads that already exist (the lesson door; `sendPoeTechRequest`; the Research inbox), one row per tick, and one line says what was sent and what was not. A lesson's words start ticked as a lesson; a spoken line with no words yet offers nothing to create from. Answered research items carry the same row.
4. **Research comes back as a reading.** When no item waits to be answered, the research lane reads one answered item: its words and the sender's own note go to the forwarder's new `POST /read` (the tower alone, JSON only, no search), and come back in one fixed shape — what it is, up to five opportunities, up to five constraints, the next step, and where it lands (one of the app's own systems, or *unplaced*, never invented). The row is unverified in its first line; the Research section draws it under the answer with the landing as a link. A sleeping tower writes its own words as the why, and the item is not asked again for six hours. Still one road call per run; the lane's lock and budget are unchanged.

## Verification

- `spoken-lesson-one-send`: words with a 0:02 take go as the lesson, no upload, the set-aside sentence exact — **proven to catch** (with the old send restored it fails); a take with no words still refuses; the suggestions are pinned under Send. 14 cases.
- `create-from-words`: one row per tick down the existing roads, no name tag on a lesson, a refusing road never stops the next, Create says why it waits — **proven to catch** on the rendered row.
- `research-reading`: the renderer's shape round-trips through the parser; a 503, a reading that stopped saying unverified, and one that says nothing are never written; the lane runs the reading only when nothing waited, claims first, releases on failure, waits six hours. `research_forwarder.py --selftest` (53 checks, OK) covers `/read`: no key, too short, a bad note, the fixed shape with lists capped at five, an unknown landing made *unplaced*, a model that does not answer in the shape refused, truncation said.
- With the composer, Your prompts, Research, UI-standards, consistency and feature-presence suites: 24 files, 323 cases green; `ui-standards-guard` 0 regressions; lint 0.
- Not seen rendered: the live pass is the stewards' after deploy (DR-0104). The first reading arrives on the first quarter hour a tower answers and nothing waits.

## What this does not do

- It does not create the Love Corner trivia feature the waiting mt27.org item asks for. The reading will say where it lands; building it is its own ask.
- It does not evaluate a lesson before it is built: per his word, evaluation happens after the lesson is in the space.
