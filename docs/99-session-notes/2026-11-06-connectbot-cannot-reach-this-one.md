# 2026-11-06 — ConnectBot cannot reach this one

Narrative for **[DR-1374](../decisions/DR-1374-the-tailnet-ticket-stops-expiring.md)**.

## The question, and why it was the right one

Darrell asked two things in quick succession: **"ConnectBot?"** and then
**"Onetime fix... not 50 different connectbot tries!!!!!"**

The first is the DR-0108 question — I had reported a blocker and named a value
only he holds, which is exactly where the Ways review says to stop and ask
whether the whole team's reach was scoped, not only mine. He has SSH to the NAS
from his phone. So: why was I asking for a key instead of using the road he
already has?

The second is the real instruction. He is not refusing to help; he is refusing
to be the mechanism. A fix he performs repeatedly is not a fix.

## The answer to the first, verified rather than asserted

ConnectBot cannot reach this one, and the reason is structural rather than
convenient:

> The dead credential is the **runner's** ticket onto the tailnet. It lives in
> Tailscale's control plane and GitHub's secret store. Nothing on the NAS holds
> it.

The NAS is not the thing that is shut. The NAS is fine and on the tailnet; what
failed is a GitHub runner's attempt to *join* the tailnet in order to reach it.
SSH into the NAS, from a phone or anywhere else, does not touch either store. I
walked the DR-0108 order and road one is the one that is broken.

That is a satisfying answer only because it is checkable. The run says it:

```
Join the tailnet (to reach the live database): success
Verify the tailnet actually joined: FAILURE
```

The join step closed `success` while the road was shut — the DR-1284 shape, and
the verification step that someone added after DR-1284 is the only reason this
was diagnosable at all rather than surfacing later as something unrelated.

## The answer to the second: the credential TYPE was the bug

I had been about to ask for a fresh auth key. That would have been the fiftieth
try, just spelled differently, because **a Tailscale auth key expires by design
— 90 days at most.** DR-1269 recorded one expiry. DR-1284 recorded another.
Each fixed the instance and left the cause.

Then I measured the blast radius:

```
68 join sites across 64 workflows, every one passing secrets.TS_AUTHKEY
```

One key expiry shuts sixty-eight roads: the deploy, every health witness, the
announce bell, the lesson intake. That is why this keeps arriving as an
emergency.

An **OAuth client does not expire.** `tailscale/github-action` accepts one.
Minted once, this ends. So the one-time fix he asked for is not a key at all —
it is changing what kind of ticket the runners carry, and the repo side of that
is mine to build, not his.

## The measurement that changed the plan

A single composite action is the obvious shape: one door, so the next change is
one file. Before converting anything I checked whether every join site could
actually *read* a local action — which requires `actions/checkout` to have run
first.

```
join sites with NO checkout before them: 21
```

Twenty-one of sixty-eight. A straight conversion would have broken them all
silently, most of them health probes — the instruments we rely on to notice
things being broken. They got a sparse checkout of `.github/actions` alone.

## And the rewrite broke a file, which is why it was checked

The first pass matched `uses: tailscale/github-action@` and rebuilt the block at
the `uses:` line's own indentation. At the `- uses:` shape that silently drops
the list marker, and `transcript-backfill.yml` came out invalid — a file that
parsed fine before I touched it.

A YAML parse of all 97 workflows is what caught it, immediately, rather than CI
or a 3am failure. Re-measured after the fix: **0 invalid, 0 join sites without a
prior checkout, 0 raw uses remaining.** Asserting the property over the whole
set is the only reason a 68-site mechanical edit is something I would push.

## The tests that pinned the door's name (2026-11-09)

Five assertions across four suites went red for a change that only renamed the
door, which is the third sighting of one shape in four days: DR-1363's literal
lesson numbers, DR-1379's literal date, and now a literal action name. The
repair is always the same — assert the thing, not the spelling it had — so each
now accepts either `./.github/actions/join-tailnet` or the raw action.

The one that mattered was `a-tailnet-join-is-not-a-witness.test.js`, DR-1284's
shrink-only debt gate. Its sweep looked for the raw action, so after the
rewrite it found **zero** joiners and said it was measuring nothing — the
anti-vacuity assertion doing precisely its job. The honest close is that the
debt really is 0 now, and the reason deserves saying plainly: **not 41 judgment
calls, but one step moved into the door**, which the verify then reached all 64
joining lanes through at once. The pin went 41 → 0 in one move, and a pin that
falls that fast is exactly the kind that deserves suspicion, so it is still
measured off disk every run and still proven to catch: putting a single lane
back on a bare join reds the gate and names `announce-bearer-sync.yml`.

Two smaller things fell out of reading it closely. The exempt set's test for
"this lane's join may fail" was proximity-based — any `continue-on-error`
within 500 characters *before* the join counted — and that had been quietly
reading `loops-health.yml` into the set off an unrelated earlier step. With one
canonical door there is a real step block to read, so the predicate is now
exact and that lane leaves the list; verified against `origin/main` that its
join never carried the flag, so the measurement sharpened and the fleet did
not change. And the record's own count was wrong: it said two sites carry
`continue-on-error`, re-counted as four, all four preserved through the
rewrite.

## This change is lane-touching, so DR-0107 clause 2 is not yet discharged

Read properly rather than recalled: DR-0107 does not only ask that the served
build advanced after a merge (clause 3). For a change to the merge/CI/deploy
lane it says the change **is not done until a real merge has produced a real
deploy**, and it obligates enumerating *every* downstream `push`-triggered
effect and proving each still fires. This rewrite touches
`deploy-cloudflare-pages.yml`, so that clause binds — and checking that the
deploy's `continue-on-error` survived is NOT discharge of it.

Enumerated rather than assumed: 12 workflows are `push`-triggered, 6 of them
join the tailnet and so are changed here, and **5 of those 6 fire on a merge to
`main`**:

| workflow | fires on |
| --- | --- |
| `deploy-cloudflare-pages.yml` | push to `main` |
| `db-migrate.yml` | push to `main` |
| `lessons-sync.yml` | push to `main` |
| `openclaw-tower.yml` | push to `main` |
| `voice-intake-health.yml` | push, any branch |

(`public-shelf-anon-probe.yml` is the sixth; it fires only on `probe/**`, so a
merge to `main` does not exercise it.)

**The obligation standing on this PR:** after it merges, watch each of those
five actually fire on the merge commit, and confirm the deploy run's `head_sha`
matches `main`'s tip. Until that is done the change is shipped, not proven —
and the 2026-07-06 incident DR-0107 records is exactly the shape of assuming
otherwise: nine hours of a stale `poetech.us` because a downstream `push`
effect silently stopped firing while every other signal stayed green.

## What is left for him, exactly once

Mint one OAuth client in the Tailscale admin console, add two secrets. The
fallback means nothing waits on it and nothing breaks before it — and when it
lands, sixty-eight roads stop dying on a timer.
