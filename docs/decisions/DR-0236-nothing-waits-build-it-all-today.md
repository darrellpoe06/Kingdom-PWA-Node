# DR-0236 — Nothing waits: everything buildable now is built now

- **Status:** accepted
- **Date:** 2026-07-27
- **Tier:** A (Ways/documentation + the operating posture it corrects)
- **Governs:** how the agent sequences directed work — the death of "next phase," "later," and "on its clock" for anything that can be built and verified today
- **Grounds:** DR-0111 (do the work), DR-0225 (brakes are build requirements, never a stall), DR-0103 (motion is the default), DR-0106 (DO, don't re-ask), PERPETUAL-IMPROVEMENT (DR-0075)
- **Pairs with:** DR-0068 (the three brakes still gate what ships ACTIVE), RELEASE-TIERS (tiers gate activation, not building), DR-0108 (ways-review)

## Declared by Darrell, 2026-07-27

> "We want everything today... no waiting for anything... nothing says waiting anymore... stop undermining our building automation systems by constantly suggesting we stop and wait for another time... Ways and documentation..."

Correcting the agent for closing the Scribe Phase 1 delivery with a "named next steps on the branch's clock" list — the whisper-queue consumer, the minutes join, the guide generator — all of which were buildable and verifiable the same day.

## The decision

**"Later" is not a scheduling tool the agent may reach for. If a directed piece of work can be built and verified with the tools available right now, it is built right now — in the same session, through the same lane.** Deferring buildable work to a named "next phase" is the same defect as re-asking a settled question (DR-0111): it undermines the building of the automation systems by inserting a wait no one asked for.

What this changes operationally:

1. **A "next steps" list at the end of a delivery is a WORK QUEUE for the same session, not a sign-off.** The agent finishes the list before the turn ends, or names the single genuine blocker per item — a physical-access step, a value only Darrell holds, a bright line not yet decided. Those are the only three; "it's a lot" and "another PR later" are not on the list.
2. **The three brakes and the tiers gate ACTIVATION, never building (DR-0225 restated).** Timer-driven automation is built today with its brakes designed in and proven-to-catch in CI today, ships inactive through the lane today, and activates on proof. "That's Tier C" defers the switch-flip, never the construction.
3. **His-hand steps are handed over ready-to-run, not parked.** Anything that genuinely requires Darrell's hands (NAS deploy, a physical cable, an OAuth click) ships as paste-ready commands in the same delivery — the agent's side of it is 100% complete, so the moment his hand moves, the system runs. A his-hand step with no ready-to-paste block is unfinished agent work.
4. **Real decision records with re-review dates stand — but the agent does not re-cite them as reasons to slow adjacent work.** DR-0182's OBS engine keeps its Tier-C activation clock; everything AROUND it (capture, ingest, transcription, minutes, guides) builds now and plugs in when it lands. Citing a parked item's date as a brake on unparked items is the violation.

## The test

Before ending any delivery turn: **"Is anything in my own 'next' list buildable and verifiable right now?"** If yes, the turn is not over. If no, each item carries its one-line genuine blocker in the delivery message.

## Encoded

- CLAUDE.md Layer 0: "Nothing Waits — Everything Buildable Now Is Built Now" section (loads first, survives compaction).
- The Scribe follow-through built under this DR the same day it was declared: the whisper-queue consumer with the three brakes proven-to-catch in CI, the scribe→ministry_meetings minutes join, and the step-manifest guide generator.
