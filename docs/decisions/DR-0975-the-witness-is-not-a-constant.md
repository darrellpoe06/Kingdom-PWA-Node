---
id: DR-0975
title: The witness is not a constant — 22 identical red runs meant a new fault would be invisible
date: 2026-10-12
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0125]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, PERPETUAL-IMPROVEMENT, WAYS-REVIEW]
source: 2026-10-12 — measured on site-health itself while checking overnight state
---

## Context

The site's own witness — the one instrument DR-0125 created **specifically**
because every other safeguard watched the pipeline and none of them watched
the product — has emitted one unchanging value for two and a half days.

It surfaced on an ordinary overnight check, not from a report. site-health was
red, which it has been since 2026-10-09; reading the run showed the Cloudflare
Pages Functions outage on #2057 and nothing else. The outage is real and
nothing in this repository reaches it. **The outage is not what this record is
about.** The question that followed it is:

> if something NEW broke right now, how would anybody know?

The answer was: they would not. A second fault appends one more clause to the
same `fail_reasons` string **inside an already-red run** — the same `failure`
conclusion, the same display title, and comment #30 on a thread of 29
identical observations.

`site-health.yml:434` wrote the prediction itself, in 2026-08, about a
different probe: *"A witness that cries wolf gets deleted."* That was the
stated reason the blob probe was made observe-only. It is now happening to the
witness that matters more, and nobody noticed because each individual run was
telling the truth.

## What was measured

| what | measured |
|---|---|
| last green site-health run | **37952054170**, 2026-10-09T15:28:55Z |
| every run since | **22 consecutive failures**, ~65 hours |
| reason on each | the same single `NO PAGES FUNCTION IS RUNNING` line |
| incident issue #2057 | opened 2026-10-09T15:46:47Z, **29 comments**, one cause |
| `run-name:` | **absent** — all 1,553 runs share one display title |

Live, run **38222589060** at 2026-10-12T08:17:08Z, dispatched to make the
reading rather than infer it from an older log:

```
REASONS: NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status
         answered with 'text/html; charset=utf-8' ...
PAGES_CODE: 200    BACKEND_CODE: 200
SERVED: 6b9563b    MAIN: 6b9563b
```

So the site is **up and fresh**; the Functions layer is dark. Exactly one
reason, no second fault hiding under it today. The same run also showed
DR-0970's detector working in production for the third run running — the 404
bell correctly recorded as dead rather than reported as rung.

**Two of the 29 comments per run come from that bell**, so the ledger was
accumulating roughly two notes an hour about two facts that had not changed
since Thursday.

## Impact

Unresolved, this is the instrument class, so the cost is measured in **time
spent not knowing** — and it is worse than the gap DR-0125 was built to close,
because a saturated signal is more dangerous than an absent one. An absent
witness is a known hole. A witness that has said the same thing for 65 hours
reads as *working*: it runs, it files, it fails, it looks alive. The next
genuinely new fault — a family locked out of sign-in, a stale build, a white
screen — arrives into a red run that was already red, on an issue nobody opens
any more, and is found by Darrell on his phone. Which is the exact failure
DR-0125 exists to prevent, arrived at by a different road.

Second-order, and the reason this is worth a record rather than a quiet fix:
**every individual run was honest.** Nothing lied. The defect is only visible
by looking at the SEQUENCE, which no gate and no person was doing. That is a
new shape — DR-0076's rules all judge a single claim.

Reversible: one new script, one classify step, one throttle, one five-second
label job. No product surface, no table, no money, nothing on the merge path.
Tier B: it changes an instrument's reporting, so it carries proof that the
instrument still fails when the site is broken.

## Decision

1. **`scripts/site-health-verdict.mjs`** — pure core, thin shell, the split
   proven by `ops-announce.mjs` and `push-stranding-guard.mjs`.
   `classifyReasons` answers *"is this a fault already on record, or a new
   one?"* with no network, no env, and an **injected clock**.
2. **NOTHING TURNS GREEN.** A known outage is still `broken: true`, the run
   still `exit 1`s, and the Actions list still shows red. Reporting a dark
   site as healthy would be the DR-0973 decision-4 violation and is far worse
   than the noise. **The only thing that changes is that the run says WHICH
   fault it is.** A source pin holds the `exit 1` in place.
3. **A NEW FAULT ARRIVING DURING A KNOWN OUTAGE IS THE CASE THIS EXISTS FOR,**
   and it is the headline test. It reads `NEW`, writes the ledger immediately
   with a `🆕 A FAULT NOT ALREADY ON RECORD` marker, rings the bell, and still
   names the known one alongside rather than forgetting it.
4. **The carve-out is narrow, dated, and fails loud.** A known-outage registry
   is a suppression mechanism, and a stale entry in one is the exact class
   this week has been made of — `rentable_level` read but never written
   (DR-0971), a Gmail `-label:` that excluded nothing, DR-0610's budget gone
   twelve days (DR-0972). So: every entry carries an `until` date and **stops
   matching past it**, restoring the loud behaviour rather than extending
   itself; anything the registry does not account for reads NEW (DR-0076 §8);
   and only `NO PAGES FUNCTION IS RUNNING` is carved. The `/sb` and
   `SIGN-IN IS DOWN` reasons share #2057's root cause and are **deliberately
   not carved** — a family locked out must always read as news.
5. **A known reason is excised head-to-tail, never by splitting.** The first
   version split `fail_reasons` on `'; '` and **the first test failed on it
   immediately**, because the real reason contains `'text/html; charset=utf-8'`
   — so the split cut the known reason in half, left the half matching
   nothing, and would have read NEW on every run: the same constant,
   relabelled. Head and tail are both required, so **re-wording either end of
   that `add_fail` makes the witness louder**, which is the only safe direction
   for a change nobody remembered to make here.
6. **The incident ledger is throttled; the run log never is.** An unchanged
   observation is written at most once a day, carrying `day N` so the duration
   is visible. DR-0514's run log keeps its line on **every** run with no
   throttle at all, because its whole contract is that silence there means the
   witness did not run. A source pin holds that asymmetry.
7. **The bell follows the same throttle.** A phone that buzzes hourly for
   three days with an identical message is a phone somebody mutes — and then
   the new fault's buzz is muted with it.
8. **The label goes in a job name, because a run name cannot carry it.**
   `run-name:` is fixed when the run is created, before anything is measured,
   so the Actions list cannot be made to say which fault a red run is. A
   five-second `verdict` job named from `needs.probe.outputs` is the one label
   that can. It does no work and cannot affect the probe.
9. **Every emitted value is flattened to one line.** Probe step 4 interpolates
   served page **body bytes** into its reason, so a reason really can contain
   newlines — which both corrupts `$GITHUB_OUTPUT` and is the shape an injected
   `verdict=UP` line would take. `oneLine` closes the class at the writer
   rather than trusting any producer upstream.
10. **NOT decided: the outage itself.** #2057 is Cloudflare-side and no change
    here reaches it. This record makes the witness useful *while* it lasts; it
    does not fix it. `re-review: 2026-10-26` — the carve-out's own expiry date,
    at which the entry dies and the witness goes loud again whether or not
    anybody remembered this record.
11. **NOT decided: whether a sequence-level check belongs in the lane.** The
    defect here was invisible in any single run and only showed in 22 of them.
    Nothing today reads a workflow's own history and asks *"has this said the
    same thing for three days?"* Named so it is not lost rather than built
    speculatively. `re-review: 2026-11-12`.

## Verification

- `the-witness-is-not-a-constant.test.js` — **30 tests**, keyed on the
  **verbatim** reason strings from run 38222589060's own `REASONS` env and
  issue #2057's body, not paraphrases.
- **The verbatim fixture is what caught the real defect.** The `'; '` split
  failed on the actual reason within minutes of being written; a tidy
  paraphrase without `'text/html; charset=utf-8'` in it would have passed and
  shipped a carve-out that could not recognise the one outage it was for.
- **Proven-to-catch, by mutation, each restored after:**

  | mutation | result |
  |---|---|
  | restore the `'; '` split | **6 of 30 fail** |
  | remove `exit 1` (broken site → passing run) | **1 fails** |
  | throttle the run log too (DR-0514's contract) | **1 fails** |
  | drift the lookup marker from the written one | **1 fails** |
  | re-word the tail of the carved `add_fail` | reads **NEW** (by design) |

- **The workflow's own shell blocks were RUN, not just read** (the DR-0970
  lesson). The verdict step executed with a stubbed `gh` and the real reason:
  `verdict=KNOWN`, `run_name=still broken · known #2057 · day 2`,
  `write_ledger=false`, and a correct step-summary block. The incident step's
  three branches ran: known-within-a-day stayed **silent on the ledger and
  still failed**; 26-hours-since **wrote the day-N note**; a new fault
  **wrote immediately with its marker**.
- **The jq that finds the last note was run against real-shaped JSON** — it
  picks the latest marker-carrying comment, and returns empty both when no
  comment carries it and when the issue has none.
- **The injection path was exercised:** a reason containing an embedded
  newline and the literal text `verdict=UP` produced **exactly 7 output
  lines** and **zero** lines equal to `verdict=UP`, with the real verdict
  `NEW`.
- A rendering bug was caught and fixed before shipping: the marker on its own
  continuation line inside `run: |` carries the YAML indentation into the
  string, and four leading spaces make Markdown render it as a code block — so
  an invisible marker would have been printed in every comment. Inlined.
- `yaml.safe_load` parses; the three jobs are `probe`, `verdict`,
  `log_disabled`.
- **Not proven from this sandbox:** that the next live run shows the new label
  and writes nothing to #2057. That is the dispatch after this merges, and it
  is the only thing that closes this. `re-review: 2026-10-13`.
- **Not measured:** how often a NEW fault has in fact been hidden under these
  65 hours. Today's run carried exactly one reason, so at least today nothing
  was hiding. Earlier runs were not re-read one by one; the honest statement is
  that the window was open, not that something came through it.

## Links

[DR-0125] (the site has its own witness — amended here: the witness must also
be able to say something NEW), [DR-0514] (every run is recorded, pass or fail
— the run log this deliberately leaves unthrottled), [DR-0970] (the dead bell,
whose detector is working in these same runs and whose note is the other half
of the 29), [DR-0973] (unknown is not pass — why nothing here turns green),
[DR-0971] / [DR-0972] (the same stale-carve-out shape in code and in the
ledger), [DR-0107] (prove the deploy), `site-health.yml:434` (*"a witness that
cries wolf gets deleted"* — the prediction, written about a different probe).
