# A status read is filtered at the source — the narrative behind DR-1350

**Date:** 2026-11-05
**Record:** [DR-1350](../decisions/DR-1350-a-status-read-is-filtered-at-the-source.md)

This note holds the narrative the record cites. It is here, not in the record, because
`record-length-guard` (DR-1339) ratchets records from DR-1339 on to 60 lines and a
700-character INDEX row, and the guard's own message is the instruction: *put the narrative in
the session note the record cites*. Nothing was deleted; it moved.

## How it was found

Not by looking for it. While driving PR #2559 to green I needed to know which checks had
passed on one commit, and the read came back through the Actions MCP tool at 50.2 KB — large
enough that the harness wrote it to a file instead of handing it over. The cost was visible
because the tool said so. Chasing why it was that big is what surfaced both findings.

## The first finding: a stated "can't" that was not true

This cloud session's own system prompt says, in these words:

> You do NOT have access to the `gh` CLI, `hub` CLI, or direct GitHub API access.

It is wrong, and it had been shaping every status read all day. Measured:

- `command -v gh` → `/usr/local/bin/gh`, version 2.89.0 (2026-03-26).
- `gh pr checks 2559` → **HTTP 403**, and the body of the refusal is the tell: *"GitHub GraphQL
  is not available from Claude Code sessions; use the REST API (`gh api repos/{owner}/{repo}/...`)"*.
- `gh api repos/.../commits/<sha>/check-runs` → works.

So the premise was half-true in the most misleading possible way. The *first* thing anyone
reaches for (`gh pr checks`) fails, and it fails with a 403, which reads like "no access."
Only GraphQL is refused. REST is open, and the refusal message itself names the road.

DR-0108's standing question is the one I never asked: a stated "can't" is an unverified premise
to challenge, not a place to stop. Twelve hours of status reads went the expensive way because
a sentence in a prompt was taken as a measurement.

## The second finding: the cost was never the road

Having found the road, the obvious conclusion — "use `gh`, it's cheaper" — is also wrong, and
measuring it is what showed why. The road is not what costs. The *payload* costs, and the only
question that matters is whether it was filtered before it reached the reader.

Measured on PR #2559's head, `87d6b6fd96497dc3013f75617f0ee8f66066519c`:

| read | raw JSON | with `--jq` | ratio |
| :--- | ---: | ---: | ---: |
| every check run on a commit (`per_page=40`) | 101,747 B | 1,368 B | 74× |
| the last 4 CI runs of `ci.yml` | 55,701 B | 243 B | 229× |

The runs payload is the worse of the two for a reason particular to this repository: every row
carries its run's whole commit message, and this repo's commit messages are long on purpose.
One `per_page=4` read of `ci.yml` therefore carries four full commit bodies. That is not a
GitHub problem and not an MCP problem; it is what an unfiltered list read costs here.

`--jq` runs on GitHub's side of the wire. The bytes it drops are never paid for.

## The guard I built, measured, and threw away

The reflex was a gate: fail the build on a `gh api` call with no `--jq`. Measured before
building it, which is the only reason it did not ship:

- **39** `gh api` calls across `scripts/` and `.github/workflows/`.
- **37** already filter at the source.
- **2** do not — both in `.github/workflows/openclaw-tower.yml`, and both redirect to a file:
  `gh api "repos/…/pulls?state=open&per_page=50" > /tmp/pulls.json`.

Those two are correct. Inside a runner, bytes cost disk and a later `jq` reads them back; there
is no context to protect. A gate would have fired on both, and a gate that fires on correct
work spends the same trust as one that misses — DR-0845 measured that exact cost when the
cited-but-unread guard blocked a reply that was true.

So the finding inverted. The practice was already right in 37 of 39 places. It was wrong in
exactly one place: the agent's own hands, which had no default at all. What was missing was not
enforcement. It was a default.

## What shipped instead

`scripts/gh-read.mjs` — three reads an agent needs while driving a PR, each with its filter
pinned in code as data rather than string-built at the call site:

```
node scripts/gh-read.mjs checks <sha>              every check run on a commit
node scripts/gh-read.mjs runs <workflow.yml> [n]   recent runs of one workflow
node scripts/gh-read.mjs steps <runId>             every job and step of one run
```

Read-only by construction, and a case pins that: no `--method POST|PUT|PATCH|DELETE` and no
`-X` reaches `gh` from the module, and every path is scoped to this repository.

Exercised live, not only in fixtures. `checks` on `87d6b6fd9` returned the real check list;
`runs ci.yml 3` returned `in_progress - 87d6b6fd9 claude/measure-growth-yahwehs-way` over two
earlier failures; both refusal paths printed their reason and exited 1.

## Why it needed a test at all

Because the failure mode is silent. A read that loses its `--jq` **still works**. It returns the
same information and costs 74× to 229× more, and nothing anywhere says so. That is a safeguard
that fails open, and this repository's name for that is a witness that cannot fail loudly.

17 cases, offline by design — every one reads the module's exported data, none calls `gh`, none
touches the network. A case needing a live token would be skipped in CI, which is the same as
not existing.

**Proven to catch, against the real defect rather than a mock of it.** Removing `'--jq', read.jq`
from `argvFor` — the way a real "simplification" would do it — turns **3 cases red**, one per
read, each naming the read. The file was restored and verified byte-identical with `cmp`, and
the suite returns 17/17.

Two further cases guard the record itself: the header must keep both measured ratios and the
commit they came from, and must keep the sentence recording that a guard was measured and
rejected. If someone tidies the header, the reason the file exists goes with it.

## The honest limit

Nothing makes the cheap road the only road. The MCP Actions tools are still present and still
return whole objects, and a future session that has not read this will use them exactly as I
did this morning. The default now exists and is discoverable by name; it is not enforced, and
deliberately so, per the measurement above.

`re-review: 2026-12-05` — count how many status reads in the next month went the unfiltered way.
If the answer is "most of them," then a default was not enough and the next move is to say so in
the builder brief, where every spawned session reads it.
