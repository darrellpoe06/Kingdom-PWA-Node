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

## DR-1360 governs, and this record had re-proposed what it withdrew (2026-11-09)

Found by being made to read a record I had cited from a commit subject line.
**DR-1360** — "The proof of the work is readable inside the app, and the NAS
initiates every road" — is Accepted and merged, and its §2 says, in Darrell's
words: *"The OAuth-client proposal is withdrawn as the fix: it changes which
outside system the house depends on, not whether it depends."* Against
*"Not a broken way!!!"* and *"Why would I willingly want to depend on other
systems... That can and do fail!!!"*

This record proposed exactly that OAuth client. Measured: it contained **no
mention of DR-1360**, carried no `supersedes:`, and nothing in `docs/decisions/`
supersedes DR-1360. Both are dated 2026-11-06. So it was not a considered
reversal — it was a later record re-proposing a withdrawn one, silently. Worse,
I spent a session asking Darrell to go mint those credentials: pressing him
toward the thing he had already refused, in his own recorded words.

**Resolved without needing his ruling, because the evidence settles it.** An
unmerged record does not override a merged accepted one, so DR-1360 governs.
The `oauth-*` inputs stay dormant, the claim that the OAuth client is *the fix*
is withdrawn from the record and the action's header, and the ask is withdrawn.
Nothing about the shipped behaviour changes: no OAuth secret exists, so every
join already falls through to `TS_AUTHKEY`.

**What survives is the uncontested majority, and it serves DR-1360.** One door
and a verify that asks tailscale itself: DR-1284's 41-lane debt closes, and
retiring a runner→NAS road — DR-1360's actual fix — becomes a one-file change
instead of 68. Reviving the OAuth preference would need a decision that
supersedes DR-1360; this is not that decision.

Evidence the underlying problem is live, from the deploy of `a3d14b848` the same
hour: `backend error: invalid key: API key does not exist` / `Tailscale up
failed`. The deploy survived only because its join carries `continue-on-error`
and has a second road (DR-1269). The key really is dead; DR-1360's answer to
that is to stop needing it, not to buy a longer-lived one.

## What is left for him — nothing, and that is the correction

This section used to read: *"Mint one OAuth client in the Tailscale admin
console, add two secrets."* **That ask is withdrawn** (see the section above).
DR-1360 governs and it withdrew the OAuth client as the fix, so asking him to
mint one was pressing him toward what he had already refused. Nothing here waits
on him.

The road forward is DR-1360's own: the NAS initiates every road, and each
runner→NAS road is retired as it is reversed, after which the Tailscale key
goes back to being the phone's door and cannot shut the house. This change is a
step on that road — one door instead of 68 join sites — not an alternative to
it.

## The friction this landing exposed: the two budget ratchets (DR-1388)

Landing DR-1374 cost two hand resolutions that no tool owned, and they are the
reason this section exists. `keep-prs-current` calls
`scripts/workflow-budget.json` and `scripts/file-budgets.json` "the owner's
call", so every branch that touches a workflow or grows a budgeted file resolves
them by hand. **They are not the owner's call**, and the arithmetic is the kind
a hand gets wrong quietly.

A raise entry is a **link in a chain** — `from` the ceiling before a change,
`to` after. Both sides of a merge branch from the same `from`, so keeping both
entries leaves two claiming one predecessor, and the ceiling counts only one of
the two changes. The real numbers from #2582:

| | what it said | what it means |
|---|---|---|
| base | ends at `22413` | the ceiling both sides branched from |
| main | added `22413 → 22416` | DR-1363's three guard lines |
| ours | wrote `22413 → 22659` | DR-1374's 246 lines, against the main of the hour |
| naive union | `22659` | **main's three lines vanish** (`22659 < 22416 + 246`) |
| re-based | `22416 → 22662` | the delta kept, landing on main's chain |

What survives a merge is the **delta**, not the numbers — and the file already
records that re-basing done by hand **twice**, in its own prose: *"First written
as 22413 → 22659 against the main of the hour; after merging main (DR-1363's
three lines raised it to 22416) the same change is 22416 → 22662, which is the
measured total and not above it."* The practice was already precedent. Only the
arithmetic was manual, and it was right because the numbers were small.

**What the resolver now does, and the line it does not cross.** It unions the
append-only `raises` and re-bases our entries onto main's chain, per *file* for
`file-budgets.json` since each file chains separately. It **never sets a
ceiling**: it leaves what the chain predicts, then runs each guard's own
`--generate` — both down-only, `Math.min` in `workflow-register.mjs` and
`regenerate` in `file-budget-guard.mjs` — and lets each guard's own check judge.
So the measurement is never reimplemented and a ceiling can rise only by as much
as a raise entry with a human's reason explains. An unexplained rise is REFUSED,
carrying the guard's own message, which is already written to ask for that
reason.

That line matters more than the convenience: every open branch's resolution runs
through this script, so a resolver that invented a ceiling would move a ratchet
on nine branches at once without anyone reading it.

**Prose is reported, never rewritten.** A re-based entry's `reason` may still
recite the pre-merge numbers. The resolver prints the old and the new and says
so — rewriting prose by number is the exact fault DR-1362 §2 records, and the
two entries above are the proof, since each describes its own re-basing in words
a tool could not have written.

**One check was wrong about the code, not the other way round.** I wrote a check
expecting a refusal when a subject has no predecessor *and* no ceiling in main,
and it failed. The test was right: having neither is positive evidence that main
has never seen that file, so there is nothing to re-base onto *and* nothing to
re-base — ours already starts in the right place, and the guard still measures
the result. The refusal was over-eager and the code changed. Recorded because a
flag is where the work starts (DR-0621), and because the opposite reflex — bend
the test until it is green — is what would have shipped a resolver that refuses
every genuinely new budgeted file.
