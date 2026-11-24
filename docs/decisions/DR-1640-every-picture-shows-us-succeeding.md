# DR-1640: Every Learn picture shows us, succeeding; about one in ten is also inclusive

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (the learner-facing identity of every Learn picture; no schema, no data)
**Type:** decision
**Area:** `app/scripts/learn-presentation/lib/prompts.mjs` (the text model's picture rule), `lib/art-v2.mjs` (the art-file check), `art-direction-v2.json`
**Sent in by:** Darrell, 2026-11-24, during the Learn redesign pilot: *"10 percent of the other cultures... 90 percent from our culture... African American... Foundational Black Americans..."* then *"Keep African American in each shot... just want to show we love all people groups... inclusive visuals... at times... however we need to see us as successful..."*
**Pairs with:** the Learn redesign session note `docs/99-session-notes/2026-11-24-learn-redesign-art-direction-v2.md`

## Context

The pipeline told the picture model only to show "meaningful representation of Black" people among "diverse" people. That leaves the mix to chance across 994 lessons, and says nothing about how we are shown.

## What was measured

Before: `SYSTEM_PROMPT` rule 7 in `lib/prompts.mjs` asked for "diverse, culturally representative people with meaningful representation of Black men, women, children…". No check read the mix. The 26 art-direction pictures (20 pilot lessons + 6 topic covers) were 25 Black-centered and 1 Cherokee-only (HIST2).

## Impact

Unchecked, a library-scale run could drift either way: too few of us in our own app, or inclusion that never shows. Applies to every Learn picture from now on (the pilot and the remaining 974 lessons).

## Decision

African American / Foundational Black American people are in **every** Learn picture, named as Black in the prompt, across generations, and shown as capable and successful (owners, leaders, teachers, professionals, thriving families), never as a stereotype of need. About **one picture in ten is also inclusive**: people of other groups in the frame beside them, to show we love all people groups. A solemn history (e.g. HIST2, the 1838 removal) is shown with dignity, not as success. Decided by Darrell.

Not decided: how individual faces, ages or settings are chosen per lesson (that stays with each lesson's teaching).

## Rationale

Because the app is ours and our children should see themselves in it, succeeding; and because the Word's love reaches every people group, which a picture can show at times without becoming the majority look.

## Verification

`validateArt` refuses an entry whose prompt never names Black people, an entry with no declared `people` (`fba` | `mixed`), a set more than 20% mixed, and (from 50 pictures) a set under 5% mixed. Proven to catch in `app/src/__tests__/learn-art-v2.test.js` ("DR-1640…"). The committed set: 26 of 26 name Black people; 2 of 26 (8%) inclusive (PM2, HIST2). The text model's rule 7 carries the same direction for the library run; its prompts are re-checked by the same rules before spend when that run is built. `re-review: 2026-12-08`

## Links

`docs/99-session-notes/2026-11-24-learn-redesign-art-direction-v2.md`; PR #2852.
