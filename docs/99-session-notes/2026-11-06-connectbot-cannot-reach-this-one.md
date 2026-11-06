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

## What is left for him, exactly once

Mint one OAuth client in the Tailscale admin console, add two secrets. The
fallback means nothing waits on it and nothing breaks before it — and when it
lands, sixty-eight roads stop dying on a timer.
