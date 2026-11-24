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

The cause on the live site is not established, and this record does not claim Ari answers now. Two things remain: an outside-in probe of `poetech.us/llm/health` beside the site's other probes, and a fresh tailnet key for the `funnel-health` witness, which only Darrell can mint. `re-review: 2026-11-26`.
