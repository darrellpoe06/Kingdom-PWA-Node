# DR-1603: The deploy lock holds one job

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (the deploy lane; DR-0107 applies: proven by a watched merge and deploy)
**Type:** lane
**Area:** `.github/workflows/deploy-cloudflare-pages.yml`
**Pairs with:** DR-0107 (prove the deploy), DR-0139 (the boot check), DR-0153 (the propagation gate), DR-1601 / DR-1602 / DR-1604 / DR-1605 (this lane fix)

## Context

Measured 2026-11-19 from the Actions API: deploy runs took 20 to 66 minutes from creation to finish overnight (03:00 to 08:00Z) and 6 to 11 minutes after 10:00Z. The site ran up to four merges stale.

One run shows where the time goes. Run 44476228421 was created at 06:59:53. Its `deploy` job waited for the previous run's lock until 07:08:50, then for a runner until 07:21:32, and the site was live at 07:27:45. Its four post-deploy jobs (the boot check and three dispatches, about a minute of work together) were created at 07:27:48 and waited for runners until 07:49 to 07:54. The concurrency group was workflow-level, so the run held `cf-pages-deploy` until 07:54:47, and any newer deploy waited 27 minutes behind work that no longer touched the site.

GitHub keeps one running and one waiting run per group; a newer waiting run replaces the older. Every replaced run was for an older main than its replacement, so that replacement loses no merge. The wait was the lock being held, not the replacement.

## Decision

The lock moves from the workflow to the `deploy` job. The boot check (propagation gate, real-browser boot check, incident filing) moves into that job as its last steps, so the lock covers build, upload and boot check on one runner, with no wait for a second runner inside it. The incident is filed only when the propagation or boot step failed, never on a failed build.

A step after the upload sets `published=true`. The three dispatch jobs (lessons sync, address completer then doors, camera witness) run on `always() && needs.deploy.outputs.published == 'true'`: outside the lock, after every upload, even when the boot check then fails (they ran in parallel with it before). The `deploy` job carries `issues: write` for the incident step.

Not done, and why: the brief asked that a waiting deploy not be cancelled unless the newer one has started. GitHub's concurrency has no such mode; with the lock on one short job, the waiting run is replaced only by a run for a newer main, which deploys everything the replaced one would have.

## Proof

`the-deploy-lock-holds-one-job.test.js` reads the real workflow: no workflow-level lock, the deploy job holds `cf-pages-deploy` without cancelling, the boot check is inside it, no other job takes the lock, every dispatch runs on the upload alone, and a failed build files no incident. Proven to catch: the old workflow-level lock and a boot check outside the job are both named. The existing deploy tests (247) pass. The DR-0107 proof is a watched merge of this PR producing a deploy run on main's head, then `site-health.yml` green, recorded on the PR.

re-review: 2026-12-03 (read a week of deploy runs: created-to-live and lock-held time per run).
