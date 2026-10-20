# DR-1124: The witness sees the Worker roads — ten days of "every Pages Function is dark" and nothing ever asked about the other layer

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one probe step in the site witness, reporting only; no surface, no schema, no money)
**Type:** bug

**Area:** `.github/workflows/site-health.yml` (the Worker-road probe) and `app/src/__tests__/the-witness-sees-the-worker-roads.test.js` (new).

**Answers the re-review in:** DR-1071, due today — *"wire the funnel, and name the one place a steward reads the count."*
**Principles:** DR-0125 (the site has its own witness — prove the SITE, not only the deploy); DR-0076 §4 (measure, don't claim) and §3 (proven-to-catch); DR-1072 (a measurement no steward can read is not a measurement); DR-0061 / P15 (reality-trace: name the real data and the real screen before building).

## Context

DR-1071's remainder left an item for today: *"DR-1070's visitor funnel is written
but not yet wired to Access & Usage… **`re-review: 2026-10-20`** — wire the
funnel, and name the one place a steward reads the count."*

**That half is already done, four days early.** DR-1072 built `VisitorDoors.jsx`
and put its chip in `AccessUsageMetrics.jsx` between Signups and Bots & blocks,
on 2026-10-16. Verified on main `4ef997c44`: both files are there and
`AccessUsageMetrics.jsx` references them, so the library DR-1072 found with zero
callers now has real ones. **The one place a steward reads the count is Admin →
Access & Usage, the Visitor doors panel.** The re-review is answered by that
record, and this one only writes it down.

Then the obvious next question — *can a steward read it today?* — turned up
something nothing in the house could answer.

## What was measured

**The witness has never probed the Worker roads.** `grep -c edge
site-health.yml` returns **13**, and all thirteen are the word "le**dge**r".
The workflow probes the static shell, the hashed bundle, the served auth
backend, `/sb`, the bell, and — since 2026-10-09 — `/automation-status` as a
single reading that names a whole class: *"NO PAGES FUNCTION IS RUNNING… EVERY
NAS-backed road is dark at once: /sb sign-in, /n8n, /cams, /taxes, /openers,
/llm, /reviews, /voice, /nas-photos, /ways, /scribe."* That list is right, and
`/edge` is correctly absent from it.

**Because `/edge/*` is not a Pages Function.** It is the **poetech-roads
Worker**, bound by zone route in `infra/cf-roads-worker/wrangler.toml`
(`poetech.us/edge/*`, `www.poetech.us/edge/*`), and a zone-route Worker runs
*before* Pages. So through ten days of #2057 — an outage whose own description
is "every Cloudflare Pages Function stopped being invoked" — **no instrument
has ever established whether the Worker layer was dark too.** The two surfaces
that ride it are the Edge Guard and the Admin visitor count this very
re-review is about.

**And the causal chain for "can a steward read the count" runs through both
layers.** `edge-guard.js` calls `/edge` with a bearer token
(`EDGE_BASE = '/edge'`), and `edge.js` verifies that session by calling
`/sb/auth/v1/user` — **a Pages Function**. So while `/sb` is dark the Worker can
answer and still admit nobody. The count is unreadable today because sign-in is
down, not because the funnel is broken, and it returns on its own when #2057
lifts with no repo change. Those are two different causes that the witness
could not previously tell apart.

## Decision

**Probe `/edge/whoami` unauthenticated, and read the content-type.** `edge.js`
refuses a caller with no bearer token by returning JSON 401
`{"reason":"signed-out"}` **before it looks anything up**, so only a running
Worker writes that; a dead road answers with the SPA shell, a 404, or nothing.
The runner holds no steward token and needs none, which is what makes this
probe possible at all.

**JSON is a reading, not a verdict.** The alive arm is a bare `:` — it notes and
does nothing else, because a live Worker is emphatically *not* proof that a
steward can get in, and reporting it as such would be the "a 200 is not an
answer" error this repository has already recorded twice. Only a non-JSON answer
raises a failure, and its message says in words that this is a **different
layer** from the Pages Functions above and points at the zone route and the
Worker's own deploy.

**Placed directly beneath the Pages-Function probe,** so the report reads the two
classes side by side. Telling them apart is the entire purpose.

## Impact

**What this buys.** When #2057 is next diagnosed, the report answers a question
it could not before: is this one layer or two? If the Function probe fails and
the Worker probe passes, the blast radius is Pages alone and the Edge Guard is
sound behind a dead front door. If both fail, the outage is wider than Pages has
ever been described and the wrangler route is the place to look — and nobody has
to guess, because the line is in the run log either way.

**What this does not do.**

- **It does not resolve, shorten, or diagnose #2057.** It is Cloudflare-side, no
  repo change reaches it, and this adds one reading to the instrument that
  watches it.
- **It does not tell us what the Worker answered during the ten days past.** The
  probe starts measuring now; the history is simply absent, and inventing a
  retrospective reading is not available. The first run after this merges is the
  first datum.
- **It does not probe the Worker's other roads** (the road table `worker.js`
  serves beside `/edge/*`). One liveness reading per Worker is what the Pages
  probe does for eleven routes, and the same logic applies: one road answering
  proves the layer is up. **`re-review: 2026-11-20`** — whether any Worker road
  has failed independently of the layer, which would make one reading too few.
- **It cannot be run from this sandbox.** There is no route from here to
  poetech.us (DR-0125: the runner is the team's eye), so the probe's own lines
  are proven by running them against a **stub `curl`** rather than against the
  site. The first live reading comes from the runner.
- **It does not add a probe of the visitor count itself.** That needs a steward's
  session, which the runner must not hold.

## Verification

`app/src/__tests__/the-witness-sees-the-worker-roads.test.js`, **9 cases**; the
15 witness and edge-guard suites still green beside it — **251 passing**. Full
vitest suite and `npm run lint` before pushing, per DR-1072's own standard
(*"targeted tests while building, the full suite + lint once before pushing"* —
the standard I had been substituting picked suites for).

**The probe's real lines are RUN, not only read.** Four cases lift the step out
of the YAML, strip its comments, define `note`/`add_fail`, put a stub `curl` on
`PATH` that answers with a chosen code and content-type, and execute it — so a
`case` arm that classifies wrongly cannot pass by reading correctly. JSON 401 →
no failure; the SPA shell → failure; `000` with an empty content-type → failure
(DR-0076: unknown never reads as healthy); 200 JSON → no failure.

**Proven to catch:** removing the probe from the workflow turns **6 of the 9**
cases red.

**Two of my own cases were wrong on their first run, and both are the same
mistake this file is about — measuring prose as code.** One sliced the alive arm
with `indexOf('*)')`, which finds the `*)` inside `*application/json*)` itself
and silently compared half a pattern; it now asserts the arm's shape by regex.
The other asserted that the Pages-Function probe does not mention `/edge` — and
failed on **this record's own comment block** sitting between the two probes,
because I imported the house's `codeOnly()` helper and then did not use it on
that slice. The helper exists for exactly that, and its own header says so.
