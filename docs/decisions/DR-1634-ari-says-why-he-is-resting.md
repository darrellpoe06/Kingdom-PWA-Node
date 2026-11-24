# DR-1634: Ari says why he is resting

**Date:** 2026-11-24
**Status:** Accepted (the screen and the time limit; the road itself is not yet observed)
**Tier:** A (one client call and one line under a chat bubble; no schema, no server change)
**Type:** decision
**Area:** `app/src/lib/class-tutor.js` (`askTutor`, `tutorTroubleWords`); `app/src/components/kids/KidsAdventure.jsx` (`AriChat`)
**Sent in by:** Darrell, 2026-11-24, with a child's one-word question ("Lord") answered "Ari is resting right now. Ask a grown-up, or try again in a minute.": *"What happened?!!!! Kids can't ask simple questions?!!!"*
**Pairs with:** DR-0218 (the house's own model on `/llm`), DR-1053 (no error destructured away), DR-1619 and DR-1624 (the NAS reports its own road), DR-1622 (the tailnet outage of this day), DR-0076

## Context

Ari's answers go from the page to `/llm/chat`, a same-origin road to the house's own model on the NAS. When that call fails for any reason the Kids chat shows one sentence and nothing else.

## What was measured

- `askTutor` returned its reason (`http_<code>`, `unreachable`, `unavailable`, `empty`) and `AriChat` discarded it. No one beside the child could tell a closed road from a refused key.
- `askTutor` had no time limit. The NAS server's own limit is 90 s (`llm_server.py TIMEOUT_S`).
- The resting sentence was kept in the chat and sent back to the model as if Ari had said it.
- The road on 2026-11-24: the NAS fell off its tailnet (DR-1622). `site-health` run 45414379732 at 14:27Z read the site up. Nothing probes `/llm`. `funnel-health` runs 45295428622 and 45307769047 failed at the tailnet join with an expired auth key, so that witness saw nothing either way. Whether `/llm` was restored is NOT VERIFIED.

After: `ari-says-why-he-is-resting.test.jsx` 4 green. A 502 reads `http_502`; a road that never answers is stopped and reads `timeout` (proven to catch at a 20 ms limit); the child's bubble is unchanged; under it a grown-up reads the reason with its code; the next question is sent without the resting line.

## Impact

The child still hears gentle words. The grown-up beside them, and the next person to look at a screenshot, can read what failed.

## Decision

1. The Kids chat keeps its sentence for the child and adds one small line for a grown-up, naming the reason in plain words with the code kept.
2. `askTutor` stops at 100 s, after the NAS's own 90 s, and says `timeout`.
3. The resting line is the screen's, not Ari's: it is never sent back as part of the conversation.

## What is NOT in this record

The cause on the live site is not proven, and this record does not claim Ari answers now. What was measured after the code above was written:

- The public road was dark from 23:09Z on 11-23 to about 14:08Z on 11-24 (recorded on main, #2848). `funnel-health` run 45415930462 at 14:36Z passed: all twelve watched doors answer.
- `/llm` is not one of the twelve. It is in neither `funnel_watchdog.py SOVEREIGN_MOUNTS` (what the NAS restores after an outage) nor `funnel-health.yml MOUNTS` (what the outside eye asks). After a Funnel reset nothing puts it back and nothing checks it.
- It was not added here. `infra/nas-llm/README.md` gives port 8791 for the LLM server and the watchdog already gives 8791 to `/scribe`; one of the two is stale, and a wrong port in a script that rewrites the Funnel can close a working door. The box's own reading of what listens where settles it.

Next, in order: read the listening ports on the NAS over the tailnet road; add `/llm` to both lists with the port it really has; watch `funnel-health` ask it. `re-review: 2026-11-26`.
