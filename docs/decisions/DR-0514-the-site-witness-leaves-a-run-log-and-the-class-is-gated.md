# DR-0514 — The site's own witness leaves a run log, and the class is gated

- **Status:** accepted
- **Tier:** B (the instrument that answers "is the site up?")
- **Type:** verification
- **Date:** 2026-09-18
- **Scope:** `.github/workflows/site-health.yml` (a `Record the run (rolling log, pass or fail)` step and a `log_disabled` job), `.github/workflows/level-witness.yml` (a `log_disabled` job), `app/src/__tests__/every-witness-leaves-a-run-log.test.js` (new, 14 checks), `app/src/lib/witness-run-log-baseline.json` (new, shrink-only)
- **Principles:** UNKNOWN-NEVER-READS-FRESH (DR-0125), VERIFICATION-DOCTRINE (DR-0076 §2 §3 §8), A-DOWN-SITE-IS-THE-WORST-OUTCOME (DR-0107), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0125 (the site has its own witness), DR-0502/0503 (the level witness learned this one day earlier), the standing finding carried since 2026-09-18

## The measurement that forced it

Tonight a merge landed on `main` and the question was the one DR-0107 makes binding: **did it reach the live site?** The sandbox has no route to poetech.us, so the answer has to come from a runner. `site-health.yml` was dispatched on `main` at 22:05Z for exactly that purpose.

It produced **no observable record at all.** Not a pass, not a failure — nothing. Fifty minutes after an earlier dispatch of `level-witness.yml`, the same silence. The question had no answer, and I could not honestly tell Darrell the deploy was verified.

The cause was structural, and it was the failure DR-0125 was written about — in the instrument DR-0125 created. `site-health.yml` filed to the incident ledger on **failure**, and closed a recovered incident. That was all. A run that passed left nothing behind, so **"no issue filed" meant either "the site is fine" or "the witness never ran"**, and those cannot be told apart. DR-0125's own rule is that unknown freshness must never read as fresh.

`level-witness.yml` had already learned this on 2026-09-17, on its very first clean run, and carries a rolling run log on issue #1687. The more important witness did not.

## What shipped

A `Record the run (rolling log, pass or fail)` step, `if: always()`, appending one line per run to a rolling `site-health: the live site, run log` issue. The line carries what the dispatch was asking for:

> `<timestamp>` — `UP. Fresh` / `UP but STALE - the deploy heal was dispatched` / `DOWN/BROKEN - <reasons>`. **Served build: `<sha>` (main: `<sha>`)**. pages.dev shell: HTTP `<code>`. backend auth: HTTP `<code>`. Run: `<url>`

Served build beside main's head is the answer to "did the last merge actually reach the live site?", and it is now written down on every run rather than reconstructed afterwards.

`always()` is deliberate and load-bearing: a probe that crashes must still leave a line, because an unexplained crash is a failing observation rather than a silent pass. **Silence on that log now means the witness did not run.**

## The class, not the instance (DR-0076 §2)

Two workflows sharing a good habit is not a rule. `every-witness-leaves-a-run-log.test.js` makes it one: **any workflow that files a finding to the incident ledger must also append to a rolling run log.** Six workflows qualify as witnesses by that definition; two now carry one.

The other four — `deploy-cloudflare-pages.yml`, `harvest-health.yml`, `node-availability.yml`, `ops-queue-health.yml` — are recorded as **shrink-only debt**, not retrofitted in one pass. Writing four run-log steps tonight would mean naming outputs nobody has measured, and a line that reads `unknown` for every field is precisely the gate-that-always-passes DR-0076 §3 forbids. The list may only shrink, healing is reported by name, a baseline entry that no longer exists is reported as a ghost, and **a NEW incident-filing workflow must carry a run log from its first commit.** **re-review: 2026-09-25.**

The gate also checks that a run log which *exists* is actually readable, per step rather than per file — `always()`, a timestamp, a link back to the run, `gh issue comment` as well as `create`, and a search for **its own** log. That last one matters: the level-witness test found in its own first draft that checking the whole file let the incident step satisfy an assertion about the run log.

## Proven to catch

11 checks. Removing the new step from `site-health.yml` and re-running fails **three independent assertions**:

```
these file findings with no run log, and are NOT recorded debt:
site-health.yml: expected [ 'site-health.yml' ] to deeply equal []
expected 1 to be greater than or equal to 2
expected '' to contain 'Served build: ${SERVED:-unknown}'
```

Plus the deliberate breaks: a witness with no log recognised as a witness, a run log conditioned on `success()` instead of `always()`, and a step that would append to another workflow's log.

## And the hole a run log alone does not close

Both witnesses carry a **job-level `if` on a repository variable** — `SITE_HEALTH_ENABLED`, `LEVEL_WITNESS_ENABLED`. When one is set to `false` the whole job is SKIPPED, which means the run-log step *inside* it never runs either. The log then looks exactly as it does when the workflow was never dispatched at all, so **"switched off on purpose" becomes indistinguishable from "never fired"** — the same ambiguity the log was built to remove, reintroduced one level up.

Closed with a second job, `log_disabled`, on both witnesses: `needs:` the probe, `if: always() && needs.<job>.result == 'skipped'`. It is purely additive — it cannot run unless the probe was skipped, and all it does is append the line the probe could not, naming the variable that has to be flipped back.

**Its first draft was wrong and the validation caught it.** The copied job said `needs: probe`, which is correct for `site-health.yml` and wrong for `level-witness.yml`, whose job is named `witness`. A dangling `needs:` makes the whole workflow file invalid — it would have silenced the witness completely while the change was described as making silence impossible. The gate now asserts that `needs:` names a job that actually exists in the same file, and that assertion is proven against the broken shape.

## The honest limit

This is the structural fix and it is not yet an observation. The step only exists on `main` once this merges, so the first real line on the new log comes from the first run after that. **Tonight's question — whether the current `main` is the served build — is still unanswered**, and this record says so rather than implying the fix answered it. That is the whole point of the log: the next dispatch leaves a line whether it passes, fails or crashes.
