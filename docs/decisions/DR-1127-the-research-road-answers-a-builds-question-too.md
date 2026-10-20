# DR-1127: The research road answers a build's question too — the road already could; only the question was nailed down

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one manually-dispatched workflow and its gate; no surface, no schema, no money, no lesson text, nothing on a timer)
**Type:** way

**Area:** `.github/workflows/research-ask.yml` (new) and `app/src/__tests__/the-research-road-is-a-build-tool.test.js` (new).

**Grounds:** Darrell, 2026-10-20, immediately after the third-pile reading (DR-1126): **"Can this research tab also be used for building... testing... development... etc?"** And then, when the agent asked for permission to shape it: **"I already said the word!!!!!!!!! Why do I need to say more?!!!!!!!!!!!!!"** — the DR-0111 correction, recorded here because the question in the first message was the direction, and treating it as an open question was the defect.

**Principles:** DR-0111 (do the work; a directing question is a direction); DR-0076 §8 (provenance and honest uncertainty) and §3 (proven-to-catch); DR-1099 / DR-1101 (the research road, and its `verified:false`); DR-1126 (what the road is NOT for).

## Context

**The answer is yes, and the road already could.** `research-health.yml` has, since DR-1101, joined the tailnet, SSHed to the NAS so the family token never leaves it, and asked the road a question. What stopped it being a build tool was not capability — it was that its question is **nailed down on purpose**: `"Where were the Dead Sea Scrolls found, and when?"`, hardcoded at `research-health.yml:98`, so a green run means the same thing this week as last. A witness that takes a parameter is no longer a witness.

So the shape is a **sibling, not a widening** — the same precedent DR-0545 set for the second quotation gate, and for the same reason: the fixed question keeps its meaning and the free question gets its own road.

## What was measured

Measured 2026-10-20 on main `15141ac71`, each from the file named.

| what | reading |
|---|---|
| the witness's question | hardcoded, `research-health.yml:98` — *"Where were the Dead Sea Scrolls found, and when?"*; it takes no input |
| the forwarder's port | **8797**, `research_forwarder.py:627`'s own `--port` default |
| what else listens on 8099, the port my first draft used | the **property-photo server**, `photo_server.py:1859` (`PHOTO_PORT`), and the `/nas-photos` road in `funnel_watchdog.py` — a live listener on the same box |
| what that server does with a POST to `/ask` | **404**, `photo_server.py:1330-1331` (any POST but `/upload` and `/media-upload`) |
| the road's query cap | `MAX_QUERY_CHARS = 500`, `research.js:20` |
| what the road says about its own answers | `verified:false`, stated at `research.js:14` and set at `research.js:120` |
| the road's callers in the app before this change | exactly **one** that is not a test — `ResearchTry.jsx:11` |

That last row is the second half of what DR-1126 reserved for `re-review: 2026-11-20` ("whether the research road has a second caller"). It now has a second, and it is a build-side one.

**And a measurement this record failed to make, caught by a gate rather than by me.** The first version of this record had no *What was measured* section at all — its readings were scattered through the prose. `decision-chain.test.js` failed the full suite with `expected [ 'DR-1127 missing evidence' ] to deeply equal []`, which is the ledger rule that every record from DR-0588 on answers all five steps: Context / What was measured / Impact / Decision / Verification. The table above is that fix. Worth recording because the record was *about* the difference between a lead and a measurement, and shipped without separating its own.

## Why this fits a build when DR-1126 says it does not fit a lesson

Both records are about the same sentence in `app/src/lib/research.js:14` — *"The road marks every answer `verified:false`"* (and `research.js:120` sets it). DR-1126 refused to point the road at a lesson's figures for exactly that reason: a wrong figure reaches a reader, and the verifier is slow, external and human.

A build inverts both terms. **The verifier is already sitting there** — a wrong answer about an API or a flag costs one red check, in minutes, with nobody reading it in the meantime. *Unverified lead + cheap local proof* is the right shape here and the wrong shape there. That is the whole distinction, and it is why the two records differ without either being wrong.

So the road carries a rule in its own output, in words: **the answer is a LEAD, never a finding.** Nothing it returns may be written into a lesson, a record, or a claim about our own system until something in this repo reproduces it (`research-intake.js` step 2 — *"An asserted 'we have X' is checked, not believed"*).

## Decision

**Ship `research-ask.yml`: the witness's discipline with the question as an input.**

- **Manual dispatch only** (`workflow_dispatch`), `concurrency: research-ask`, `timeout-minutes: 10`, `permissions: contents: read`. Nothing on a timer, nothing spawning work — this is not the class the three-brakes rule governs, and it is said here so nobody has to decide that later.
- **The family token is read ON the NAS and never leaves it.** Every HTTP call runs over SSH on the box, `umask 077`, the token read from `/volume1/PoeTech/secrets/chat-bridge-token.txt` into an env var that only ever becomes an `Authorization` header. It is never echoed, printed, or put in a summary — asserted, not intended.
- **Free text never reaches a shell unquoted.** The question travels **base64**. The witness only ever passes `true`/`false`, so its plain interpolation is safe; a question carrying an apostrophe would break out of this one's. Length is refused locally against the road's own `MAX_QUERY_CHARS = 500` rather than after the round trip, and `mode` is held to `speed|balanced|quality`.
- **Only `http(s)` sources are carried out**, matching `safeSources()` in the app's own library, capped at 12.
- **It fails when the ROAD failed, never because an answer is unwelcome** — unreachable, non-200, or 200-with-an-empty-answer. There is no judgement of the answer's content anywhere in the failure path, and a case asserts there is none.

**The port is pinned against the forwarder's own source, because I got it wrong — and the hazard is worse than I first recorded.** My first draft posted to `127.0.0.1:8099`. The forwarder listens on **8797** (`research_forwarder.py:627`, its own `--port` default, and what the witness calls).

I wrote in the first draft of this record that an invented port "fails as *the NAS did not answer*, which reads like an outage." **That was wrong, and the truth is sharper: 8099 is not a spare number.** It is the **property-photo server's** own port (`photo_server.py:1859`, `PHOTO_PORT` default `8099`; also the `/nas-photos` road in `funnel_watchdog.py` and the `photo-local` target in `health-check.sh`) — a **live listener on the same box**. So there would have been no timeout. The question and the **family-key bearer** would have gone to the photo server, which 404s any POST but `/upload` and `/media-upload` (`photo_server.py:1330-1331`), and this workflow's own failure path would have printed `::error::/ask answered 404: the road refused the call` — **one service's refusal wearing another service's name.** A reader chasing that would have examined the research road, which was fine.

So the gate holds the forwarder's default, the witness's URL and this road to one number, and **pins 8099 to the photo server** with the 404 branch read out of its source, so the two ports cannot be confused again by anyone reading this file. The workflow's header names 8099 on purpose, which is why the "never 8099" case measures the code only and not the comments.

## Impact

**What this buys.** A session or a build that hits an unknown about the outside world — an API's current shape, a tool's flag, whether a standard moved — can ask our own search and our own model, from a runner, without a third-party AI and without the token leaving the NAS. The answer arrives labelled as a lead with its sources, in the step summary, next to the local proof that will or will not confirm it.

**What this does not do.**

- **It verifies nothing, and says so twice** — once in the workflow's own header and once in every run's summary. The `verified:false` the road sets is printed as the road's own flag rather than restated by us.
- **It is not wired to the lesson lane, and DR-1126 is why.** Nothing here may check a lesson's figures; that is `lesson-sources-witness.mjs`'s job and needs a publisher's own page read back, not a model's summary.
- **It cannot be run from this sandbox.** The tailnet join and the SSH both happen on a GitHub runner; the sandbox has no route. So the first real dispatch is the first datum, exactly as DR-1124's probe stands — the gate here proves the file's *discipline*, not that the road answered today.
- **It is not configured until two secrets exist.** With `TS_AUTHKEY` or `NAS_SSH_KEY` absent the run says `NOT CONFIGURED` and stops rather than failing noisily. Those are values only Darrell holds; the same pair `research-health.yml` already needs.
- **No throttle beyond the concurrency group.** One run at a time, 10-minute ceiling, manual trigger — enough for a tool a person dispatches, and named here rather than discovered. **`re-review: 2026-11-20`** — whether it has been dispatched at all, whether a lead it returned was ever contradicted by the local proof (the number that says whether this is worth its trip), and whether anything has tried to put its output somewhere a reader would meet it.

## Verification

`app/src/__tests__/the-research-road-is-a-build-tool.test.js`, **14 cases** — correcting the count I had reported as 11 before the suite ran, which was 13 and became 14 with the photo-server pin.

```
CI=1 npx vitest run src/__tests__/the-research-road-is-a-build-tool.test.js --reporter=basic
  --pool=threads --poolOptions.threads.maxThreads=1 --poolOptions.threads.minThreads=1
→ Test Files 1 passed (1) · Tests 14 passed (14) · Duration 670ms
```

`npm run lint` exit 0. `npm run verify:gates` exit 0 — **after it caught this change**, which is the honest order: the first run failed with `interconnect-guard: workflow research-ask.yml has no declared place in the flow graph`. DR-0621's rule that a new workflow joins the flow graph at birth is machinery, not memory, and it stopped me. Closed by declaring the node in `system-flow-registry.mjs` (reads a hand dispatch and the road on 8797; writes `gh:research-lead`, a declared **sink** whose stated reason is that nothing machine-readable may consume an unverified lead — *a consumer here would be a claim nobody checked*; seeds nothing, because the local proof is the consumer and pretending otherwise would be the hollow edge the gate exists to refuse). Gates then read **86 workflows + 34 NAS riders all placed, 0 findings**.

The single-file run needed those pool flags because `vitest.local-slot.js` caps non-CI runs at two slots and an earlier attempt waited 30 minutes for one rather than failing — worth recording, since a run that WAITS looks identical to a run that is slow.

Every case reads code with `#` comment lines stripped, so this record's own prose can never be measured as the workflow's behaviour — the mistake DR-1124 made twice in one file.

**Proven to catch** — the port, which is the case that matters most:

| what was done | what went red |
| --- | --- |
| the port reverted to the `8099` my first draft used | **1** — `expected 'name: research-ask\non:\n  workflow_d…' to match /http:\/\/127\.0\.0\.1:8797\/ask/` (`1 failed \| 12 passed`) |

Restored from backup, `grep -c "8797"` = 1, re-run green.

Three cases hold what a gate on a workflow can actually prove and no more: that the question is an **input** here, that the **witness keeps its fixed question** so the two cannot converge, and that the two roads agree on one port so they cannot drift.

**And `verify:gates` is itself the second, independent witness** (DR-0076 §7): the vitest reads this workflow's text, while the interconnect guard reads the whole `.github/workflows` directory and demands a place in the graph for anything it finds there. The vitest was green when the guard failed — which is the argument for having both.
