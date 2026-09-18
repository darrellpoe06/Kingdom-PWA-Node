# DR-0503 — The level switch, answered; and a witness that cried wolf on its first run

- **Status:** accepted
- **Tier:** B (the answer to a standing user report, and a correction to a new instrument)
- **Type:** verification
- **Date:** 2026-09-18
- **Scope:** `scripts/live-link-probe.mjs` (the level comparison now rests on the FULL body and reports the divergence index), `app/src/__tests__/the-level-witness-can-be-read.test.js` (14 checks; the false-alarm class pinned shut)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4 §7 §8), REVIEW-OUR-WAYS (DR-0108), A-WITNESS-THAT-CRIES-WOLF-GETS-IGNORED (DR-0125)
- **Grounds:** DR-0502 (the witness, built hours earlier), DR-0494 (the level-blind intro — the same report's other half), DR-0497 (the over-claim this repeats in a different costume)

## The answer, measured from a real browser on the live site

Darrell reported: *"the highlighting reads only the child version no matter what is chosen"*. The witness ran against `https://poetech.us/lovecorner/app/` on the exact lesson from his screenshot (`made-in-time` / `mit5-those-who-know-their-god`) and selected each band in turn.

| what was measured | result |
|---|---|
| lesson card mounted from the deep link | **true** |
| course heading rendered | *Made in Time: Ages, the Mind, and the War for It* |
| body with **Child** selected | **787 characters** |
| body with **Adult** selected | **1968 characters** |
| the two bodies | **different** |

And measured locally against the real module, the bands are not merely different lengths — they are different texts from their first words:

- **child** (760 chars): *"A favourite trick of the devil is hoping you DON'T KNOW how strong God is"*
- **teen** (1165): *"Everything in this course points here."*
- **senior** (1574): *"For the seasoned believer, this is the capstone"*
- **adult** (3133): *"This is where the whole course lands."*

The **read-aloud** text — which is what his report is actually about — also differs per band: 3996 / 4467 / 4467 / 4812 / 7550 characters for child / youth / teen / senior / adult, each with its own opening after the shared lesson title.

**So the reported defect is NOT reproduced.** On the live site the body changes when a band is picked, and the reader text changes with it. That is the honest finding, and it is now an observation rather than an inference.

## But the witness failed the run — and it was wrong

The probe reported: *"THE REPORTED DEFECT IS REAL: 2 levels were selected and only 1 distinct lesson bodies rendered — [Child:787ch, Adult:1968ch]"*.

Read those numbers against that sentence. **787 and 1968 are not one body.** The check compared the first **240 characters**, and both bands share an opening because the lesson card renders its own chrome — the title, the anchor, the big idea — above the band text. The claim contradicted the evidence printed beside it.

That is the same failure as DR-0497 wearing different clothes: a measurement that produced a number, and a sentence that over-claimed past it. It is worse here in one respect — **a witness that fires falsely is worse than no witness**, because the next real finding gets read as noise. DR-0125's own note says a witness that cries wolf gets deleted.

**The fix:** the failure now rests on the **full body**, byte for byte. When the bodies differ, the probe prints the index of the first differing character, so a shared opening is visibly the card's heading rather than a mystery. The bodies themselves (capped at 4000 characters) are written into `result.json`, so the evidence is readable instead of summarised. The test pins the new comparison AND pins the old one shut: comparing `b.head` is named as the false-alarm bug.

## What is still open, and it is the real remaining question

**Why did he see it?** The instrument says the live product serves a different body and a different reader text per band. His report stands as a real experience, and three candidates remain, none of them guessed at here:

1. **A stale service worker** serving an older build on his device — the app has scope-shell worker logic with exactly this history (PR #1405), and an installed worker updates on its own schedule. **BUILT, not deferred:** the witness now asks the running page which build it is executing (`globalThis.__PT_BUILD__`, injected by vite) and whether a service worker is controlling the page at all, and carries both into the run log and the incident entry. So "is he on an old build?" is now a comparison between two recorded numbers rather than a theory. Calling that "the next build" was a fake boundary, and the ari-guard caught it before this record reached Darrell.
2. **The level chosen in one surface not reaching the other** — the panel's chip versus the reader's own band. The plumbing measures correct, and only an instrumented read on his device settles it.
3. **The report predating the fixes.** DR-0494 (the level-blind intro) merged today; if he read before that deploy landed, the intro genuinely did not change with the band.

**re-review: 2026-09-19.** Nothing here says his report was wrong. It says the defect is not in the place I looked, and names where to look next.

## Amendment, the same day: the witness could not say it had passed

With the fixed comparison live on `main`, the witness was dispatched against poetech.us. **Nothing was filed.** And that turned out to be unreadable rather than reassuring, because the first version of the workflow recorded a finding only on FAILURE — so an empty ledger means either *the reader is fine* or *the witness never ran*, and those are different answers that cannot be told apart from outside.

That is DR-0125's rule arriving from a new direction: **unknown freshness must never read as fresh.** I had built an instrument whose silence I was about to interpret, which is the same over-claim this record already corrects once.

**The fix is a rolling RUN LOG.** Every run now appends its measurement — `PASS - each band rendered its own lesson body`, or the failure with its reasons — to one issue kept for that purpose, deliberately NOT labeled `incident`, so a pass never opens an incident and a failure still reaches the ledger. Two records, two meanings. Silence on the log is now itself a finding: the witness did not run.

Three breaks proven against the real workflow, each reverted: the run log made failure-only again, the run log labelling its entries as incidents, and the deletion of the note that states what silence means. **re-review: 2026-09-19** stands, and the answer now arrives on the log rather than from my inference.

## And the break run caught two hollow checks of my own

The served-build checks passed on the first attempt, so I ran the breaks anyway — and **two of the three did not fail**:

- Gutting the probe to `out.build = null` left the check green, because it asserted `toContain('globalThis.__PT_BUILD__')` and the probe's own **header comment** contains that string.
- Deleting the build from the **run log** line left the check green, because it searched the whole file and the **incident** step carries the same words.

Both are the class DR-0076 §3 exists to forbid: a gate that survives a gutted implementation. Tightened to assert the ASSIGNMENT (`out.build = globalThis.__PT_BUILD__ || null`) rather than the identifier, and to check each record's step SEPARATELY by slicing the workflow text. Re-broken three ways afterwards — probe gutted, run log stripped, incident entry stripped — and all three now fail.

Worth naming plainly: I only found these because I ran the breaks after the checks were already green. Reading a check cannot tell you it would catch anything.
