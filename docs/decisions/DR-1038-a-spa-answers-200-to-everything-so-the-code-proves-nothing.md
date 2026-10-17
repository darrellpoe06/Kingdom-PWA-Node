# DR-1038: A SPA answers 200 to everything, so the code proves nothing — I published a finding that was not one

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (defect fix to a read-only diagnostic, plus a correction posted to the ledger it wrote to)
**Type:** orchestration
**Area:**
- `.github/workflows/cf-pages-diagnose.yml` (step 2 judges the body, not the HTTP code; the "How to read" note corrected to match)
- `#2057` comment [`6187010846`](https://github.com/darrellpoe06/Kingdom-PWA-Node/issues/2057#issuecomment-6187010846) (the correction, posted where the wrong reading was posted)

**Amends:** DR-1030's sibling — the cf-pages-diagnose workflow shipped in #2183 — in its step-2 reading only. Steps 1, 3, 4 and 5 are untouched and their findings stand.
**Grounds:** DR-0076 §4 (measure, don't claim) and §8 (provenance and honest uncertainty — a claim about the system cites a run, and "I didn't verify X" is a required output); DR-0621 (a flag is where the work starts); P53 (a finding nobody reads — and its worse sibling, a wrong finding people do read)
**Declared by:** me, correcting my own published reading before anyone acted on it

## Concern

I wrote a diagnostic to break a five-day stall on #2057, dispatched it, and posted its reading to the ledger as the first actual diagnosis there. One of its five steps was wrong, and the wrongness was mine — not a flaky probe, not a changed upstream. The step printed a confident label over evidence that supports no label at all.

## Context

#2057 had carried 35 comments, every one a bot re-measuring the same symptom, and none asking Cloudflare what it believed was deployed. `cf-pages-diagnose.yml` (#2183, merged `30de26ab0`) asks. Run `38696507997` fired it, all ten steps succeeded, and it posted `6186515031` — one comment carrying the whole reading, deliberately, because the ledger's problem was never too few notes.

## What was measured

**Step 2 judged by the HTTP status code alone.** The code was:

```bash
code=$(curl -sS -o /tmp/r.json -w '%{http_code}' ... "https://$host/_routes.json")
if [ "$code" = "200" ]; then
  echo "    SERVED AS A STATIC FILE. First 900 bytes:"
```

The run got `HTTP 200` on both hosts and a body beginning `<!DOCTYPE html>`. So it printed **SERVED AS A STATIC FILE** over the SPA shell.

**A Cloudflare Pages SPA answers 200 to every unknown path**, handing back the index document so client-side routing can take over. 200 there is therefore the ordinary case and carries no information. `_routes.json` genuinely being served as an asset would look like **200 + a JSON body**. What the run saw is what a path with nothing servable looks like from outside, which is consistent with a correctly-consumed routing config and consistent with several other states too. It distinguishes nothing.

**The "How to read the above" step repeated the same error** in the sentence a human was most likely to act on: *"Step 2 HTTP 200 => `_routes.json` is being served as an ASSET instead of read as routing config."*

**Nothing acted on it.** The wrong reading sat on #2057 for roughly 25 minutes. That is luck, not a mitigation.

**The other four steps hold, and were re-read before this record.** Step 1 is the decisive one and is unaffected: `/automation-status` returns `200`, `text/html`, `<!DOCTYPE html>` on **both** `poetech.us` and `poetech-app.pages.dev`, which puts the fault inside the deployment or the project rather than in front of the custom domain. Step 3's `success: true / status: active` means "Cloudflare-side" is verifiable from CI for the first time. Step 4 reads an unremarkable project. Step 5's five deployments are each `latest_stage: deploy success`, and their `initialize/clone_repo/build -> idle` stages are **normal** for a direct `wrangler pages deploy` upload — not a fault, which is itself worth stating, because an earlier reading could easily have called those idle stages the smoking gun.

## Impact

**The `_routes.json`-as-an-asset theory is neither confirmed nor ruled out.** It was never tested. Striking step 2 removes a false confirmation; it does not add a refutation. The honest state of #2057 after this correction is narrower than before the run (step 1 did real work) and one theory lighter in *apparent* support.

**The instrument is sound where it was read correctly, and that distinction matters.** DR-1030 found a gate that was right and pointed at the wrong data. This is the inverse: an instrument pointed at the right data and *read* wrong by its author. Both are the looks-fine-but-isn't failure; only the second is invisible to a test, because the fault lived in a printed English sentence rather than in a comparison.

## Decision

1. **Step 2 reads the body.** JSON → flagged as served-as-an-asset; non-JSON at 200 → named as the SPA fallback **and explicitly marked as proving nothing**; non-200 → nothing served on the path. The code is reported but never used as the verdict.
2. **The "How to read" note is corrected** to the same rule, in the same words, so the summary and the step cannot drift apart.
3. **The correction is posted to #2057**, naming the comment it corrects and what remains standing. A wrong finding on a ledger is worse than no finding, because the next reader inherits it as fact.

## Verification

- **YAML parses; 8 steps, names unchanged.**
- **Proven to catch, on all three bodies.** The new logic was dry-run against a real `_routes.json` payload (`{"version":1,"include":["/automation-status"],"exclude":[]}` → flagged as a static file), against the SPA shell the live run actually received (→ named as the fallback, proving nothing), and against a 404 (→ nothing served). The **old** code prints `SERVED AS A STATIC FILE` for the middle case, which is the exact misread above.
- **Not claimed:** that the workflow has been re-dispatched since the fix. It is dispatch-only and read-only, and re-running it now would re-post to #2057 for no new information — step 1 is the step that matters and it has not changed. The next dispatch of it, whenever #2057 next needs interrogating, will carry the corrected step.
- **Not claimed:** that #2057 is any closer to a cause than step 1 put it. It is not. What changed is that the ledger no longer carries a claim I cannot support.

**Not addressed here:** #2057 itself. Step 1 narrows it to the deployment or the project, and the remedy may still be a Cloudflare dashboard action only Darrell can take. That stays open on its own issue.
