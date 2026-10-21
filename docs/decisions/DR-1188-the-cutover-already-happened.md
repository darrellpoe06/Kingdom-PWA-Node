# DR-1188: The cutover already happened — the lane that serves the site stopped calling itself a dry run

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (comments and a guard; no job, gate, step or serving behaviour changed)
**Type:** orchestration
**Area:**
- `.github/workflows/deploy-cloudflare-pages.yml` (the header and the gate's comment say what is true)
- `vercel.json` (the measured record updated: the lever it listed as remaining was taken)
- `app/src/__tests__/the-cutover-already-happened.test.js` (5 cases, 3 proven to catch)

**Grounds:** on 2026-10-21 the Vercel Hobby 100/day cap was spent and `Vercel: failure` landed on every open PR. The question "is the site down?" had to be answered, and the first place a reader looks said the opposite of the truth.
**Principles:** DR-0107 (a down site is the worst outcome — prove the deploy); DR-0125 (the site has its own witness; prove the SITE); DR-0076 §5 (characterize before you change) and §8; DR-0219 (SHOULD vs ARE — undocumented or wrongly-documented intent is itself a finding); DR-0621 (a flag is where the work starts)

## Context

Every open PR went red with `Vercel: failure — Resource is limited, try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`. That is a question about production, so the header of the workflow that actually deploys production is where a reader goes. It said the pipeline was safe-by-default and the cutover still pending, that the job "serves nothing", and that this therefore "cannot break the live Vercel path".

**Every clause of that was true when written and false by 2026-10-21.** Read as written it tells you two wrong things at once: that this pipeline is a dry run, and that a red Vercel status is a live-site outage.

## What was measured

**The cutover is live, two independent ways:**

- The Cloudflare Pages project `poetech-app` holds the domains `["poetech-app.pages.dev", "poetech.us", "www.poetech.us"]`, and all ten roads probed on poetech.us answered **signed `pages-function`** — not the SPA shell.
- The `CF_PAGES_ENABLED`-gated deploy job is producing **real successes on main** — `90ac836` at 15:45Z, `d44f366` at 15:06Z — which it cannot do with the gate shut. (The repo-variables API is 403 for this integration, so the successes are the evidence rather than a read of the variable.)

**And the red Vercel blocks nothing, measured rather than assumed:** **PR #2366 merged at 15:53Z carrying `Vercel: failure` and an overall combined status of `failure`.** Vercel is not a required check.

**The second stale record.** `vercel.json` listed "the built Cloudflare Pages cutover (CF_PAGES_ENABLED)" among the *remaining levers* for stopping Vercel's preview churn. That lever was taken. The file is otherwise accurate and valuable: it records that **both in-repo placements are measured dead** — the 2026-07-03 test put the config on main and the very next branch push still fired a preview — so nothing in this repository can silence Vercel.

## Decision

**The lane says what it is: production. And a guard keeps it from drifting back.**

- The header states the cutover happened, names the two measurements, states plainly that **Vercel is not production**, and says a red Vercel is noise — **while pointing at `site-health.yml`, which is what actually measures the live site.** A comment that says "ignore the red" without naming what to read instead only moves the blindness (DR-0125).
- The gate's own comment now reads as the **off-switch it has become** rather than a cutover still pending: clearing `CF_PAGES_ENABLED` stops the live site advancing, which is the worst outcome there is (DR-0107).
- `vercel.json` records that the cutover lever was taken, that the serving config is dead with it — **kept, not pruned**, because the Root Directory setting still reads it and a rollback to Vercel would need it — and that the one remaining lever is dashboard-side and Darrell's own hand. Nothing in the repository can reach it; that is the measured result the file exists to hold.

## Verification

- **5 cases green.** They read the workflow's **comment lines only**, because the point is what the file *tells* a reader; an `if:` expression is not where a stale premise hides. They pin the two claims a reader acts on, not the prose, so the header stays free to be rewritten.
- **3 proven to catch** (DR-0076 §3): restoring the old safe-by-default/live-Vercel wording turned three of the five red at once — the pending-cutover claim, the Vercel-is-live claim, and the absence of the positive statement. Restored to 5 green.
- A case also pins that `vercel.json` keeps `git.deploymentEnabled.main === true` and keeps its `MEASURED INEFFECTIVE` history, so the record cannot be quietly dropped while the claim is updated.
- The 5 existing test files that read this workflow stay green (61 cases); YAML parses; no job, gate, step or serving behaviour changed.

## What this does not do

- **It does not stop Vercel deploying or silence its status.** It cannot: the 2026-07-03 measurement already proved both in-repo placements dead, and the integration is dashboard-side. **This record does not park that on a decision** — it states the measured fact that the repository has no lever, names the two dashboard paths (Project Settings → Git → disable deployments, or disconnect the integration), and makes the red harmless to read in the meantime, which is the part that was actually costing something.
- **It does not quote the old wording verbatim.** The guard matches on the claim and cannot tell a quotation from an assertion, so the header paraphrases its own history and says why. That is a real limit of a text guard, stated rather than worked around.
- **It does not audit the rest of the repository's comments for the same rot.** This one was found because a red status forced the question; the same class certainly exists elsewhere (#2057 carried five days of it, DR-1180 another). **`re-review: 2026-11-04`** — whether a general "a comment that names a live path must cite its measurement" check is worth building, or whether this stays a per-incident fix.
