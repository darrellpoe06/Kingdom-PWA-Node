# Claude Batch API Pattern (overnight research queue, 50% off)

**Layer 3 (reference) per the ICM hierarchy declared in `CLAUDE.md`.** A foundation document the agent loads before deciding whether a non-urgent reasoning task should run synchronously or be queued for the overnight Batch path. Added 2026-06-02 (Maui), as Ship 3 of the cost-discipline foundation set, so future sessions have one canonical source for "when do I batch instead of call live, and how does the queue workflow actually run."

This document does NOT improvise its rules. It builds on three existing sources and cites rather than duplicates them: `CLAUDE-TOOL-ROUTING.md` (which already lists "Batch / overnight async generation - Either vendor's Batch API - 50% off, async" as a Tier 2 route), the Ship 2 prompt-caching doc (`CLAUDE-PROMPT-CACHING-PATTERN.md`, which composes with this one), and the cost guardrail in `project_cost_discipline_with_growth_permission` (the $25 soft / $50 hard caps). Where it restates a source it names the source. The model named below (`claude-sonnet-4-6`) is the daily research reasoner per the routing table; the Batch *logic* is model-agnostic - slot a newer Sonnet/Opus tier into the same request shape and the rules do not change.

---

## 1. Why Batch exists in this system

The Anthropic Message Batches API runs your requests asynchronously and returns the results at **50% off both input and output tokens** versus the synchronous Messages API. The trade is latency: instead of a sub-minute round-trip you accept a turnaround of up to 24 hours (usually much sooner, often within the hour off-peak). For a large class of PoeTech work that turnaround is free money - the work was never urgent, so the only thing the discount costs is patience overnight.

The honest read from recent session work: a steady stream of long-form research-reviews flowed through the synchronous path at full price when none of them needed sub-minute latency. Concretely, these real recent session-note research items are exactly the shape that fits Batch:

- **The Quo research-review** - the Incoming-Tab phone-call intake model writeup (Dispatch task `4f36e4b1`, landed at `0ae89b3`). A long-form synthesis that produced a session note. Nobody was waiting on the screen for it.
- **The Hostinger research** - the hosting/infra evaluation writeup. Same shape: a query in, a session note out, no live consumer.
- **The pricing-tier review** - the About-page reorder / tier-rename / value-claims audit (the audits behind commits `9fb0b53` and the Freddie audit work). Heavy reasoning, overnight-tolerant.
- **The family-worldview-commentary processing** - long-context commentary passes against `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` and related foundation reading.

Every one of those would have been **~50% cheaper through Batch** with no loss of quality and no practical loss of timeliness - a research-review requested at 4pm and delivered by morning is delivered exactly when a human would have read it anyway. That is the WHY: Batch turns non-urgent reasoning into half-price reasoning, and most research is non-urgent.

This pairs directly with the cost caps. Per `project_cost_discipline_with_growth_permission` and `CLAUDE-TOOL-ROUTING.md` Section 3, combined vendor spend (Claude + Gemini metered) carries a **$25/month soft cap (alert)** and a **$50/month hard stop (manual review)**. Every research item correctly routed to Batch is billed at half rate, which is the single largest lever for keeping the metered spend under those numbers without dropping any work. Sovereign-first (Tier 0 on the NAS) is still the default and still $0 marginal; Batch is the discount for the subset of work that genuinely needs a vendor reasoner but does not need it *now*.

---

## 2. How the Message Batches API works

The mechanics, stated concretely so the workflow design in Section 4 is grounded.

**Submit.** You POST to `https://api.anthropic.com/v1/messages/batches` with headers `x-api-key: <ANTHROPIC_API_KEY>`, `anthropic-version: 2023-06-01`, and `content-type: application/json`. The body is `{"requests": [ ... ]}`. Each element of `requests` is one independent Messages-API call wrapped with a `custom_id`:

```
{
  "custom_id": "quo-research-2026-06-02",
  "params": {
    "model": "claude-sonnet-4-6",
    "max_tokens": 4096,
    "system": "<optional system prompt>",
    "messages": [ { "role": "user", "content": "<the research query>" } ]
  }
}
```

A single batch accepts **up to ~100,000 requests** (or ~256 MB of request payload, whichever comes first). That ceiling is far larger than a day's research queue will ever approach - one batch per day is plenty.

**The `custom_id` is the join key.** Results come back unordered and asynchronously, so each request carries a `custom_id` you choose. When you retrieve results you match each result object back to the originating query by its `custom_id`. Choose stable, meaningful ids (here: a slug plus the date) so a morning poller can route each result to the right `docs/99-session-notes/` file without guessing.

**Poll.** The submit response returns a batch object with an `id` (shaped `msgbatch_...`) and a `processing_status`. You GET `https://api.anthropic.com/v1/messages/batches/<id>` and watch `processing_status` until it reads `ended`. The object also reports per-request counts (`request_counts`: processing / succeeded / errored / canceled / expired) so you can see partial progress.

**Retrieve.** Once `processing_status` is `ended`, the batch object carries a `results_url`. You GET that URL and stream a **`.jsonl`** body - one JSON line per request, each line `{"custom_id": "...", "result": {...}}`. The `result` is either a `succeeded` envelope carrying the model message (with its own `usage` block) or an error envelope. You parse the stream line by line, match on `custom_id`, and drop each succeeded message into the destination doc.

**Batch and caching COMPOSE.** A batch request's `params` may still carry `cache_control` blocks exactly as a synchronous request would (see Ship 2's `CLAUDE-PROMPT-CACHING-PATTERN.md`). So a batch of research queries that all share a large common system prefix - the same foundation-doc context, the same worldview spine - gets the 50% batch discount **on top of** the cache read discount on the shared prefix. The two savings stack: cache the prefix, batch the requests. For a daily queue where every query shares the same standing instructions, this is the cheapest possible path to a vendor reasoner.

---

## 3. When to use Batch (and when never)

**Use Batch when ALL of these hold:**

1. The task produces a **session note from a long-form research query** - the dominant output is a written synthesis that lands in `docs/99-session-notes/`, not an interactive reply.
2. The work can **tolerate a few-hour-to-overnight turnaround**. If a human would read the result tomorrow morning anyway, Batch costs nothing real.
3. The content is **non-clinical and non-sensitive** (see the firewall below).

That covers the bulk of research-reviews, audits, long-context commentary passes, and the "go think hard about X and write it up" work that has no live consumer.

**Never use Batch for:**

- **Interactive / Council-Chamber / live work.** Anything where a human or a downstream step is waiting on the result in real time. Council Chamber replies, Dev/Ops intake responses, anything in a conversation loop - these need the synchronous path. Batch's whole premise is that nobody is waiting; if someone is waiting, it is the wrong tool.
- **Clinical / TLC content - the firewall is absolute.** This is the inviolable line from `CLAUDE-TOOL-ROUTING.md` Section 3 restated for the Batch path: **clinical / therapy / counseling content NEVER leaves the NAS - not to the synchronous Messages API, not to the Batch API, regardless of any token.** The Batch API is a cloud round-trip to Anthropic; TLC content forbids any cloud round-trip. Fail closed: if an agent is uncertain whether a queued item is clinical, it treats it as clinical and never queues it. The queue workflow in Section 4 carries non-urgent *research* only, and research is screened sovereign-side before it is ever appended to the queue. Batch is for non-sensitive content, full stop.

The decision is a two-gate filter: first the TLC firewall (is this clinical? if yes or unsure, stop - stay on the NAS), then the latency gate (does anyone need this now? if yes, synchronous; if no, Batch).

---

## 4. The concrete workflow: 42-batch-research-queue.json

The workflow at `docs/00-foundations/n8n-workflows/42-batch-research-queue.json` (shipped **`"active": true`** on 2026-06-02, named **"42 - Batch research queue (accumulate by day, submit 11pm, 50% off)"**) implements the accumulate-and-submit half of a two-stage pattern. It is git-tracked with the rest of the workflows in `docs/00-foundations/n8n-workflows/`, and the PWA reaches it via the same-origin `/n8n` Vercel rewrite, never the absolute Tailscale Funnel URL (per `project_n8n_same_origin_rewrite`). It is applied to the NAS via `scripts/nas-update-wf42-batch-research-queue.sh`, which also adds the `/data/batch-queue` bind mount and pre-creates the `pending` / `submitted` / `archive` directory structure. Because the 11pm submit is guarded by an "is the queue empty" check, the live workflow is dormant until the first research item is queued; it never submits an empty batch and never calls Anthropic on an empty night.

### Stage 1 - Accumulate (webhook, all day)

A webhook node at path **`batch-queue-add`** receives `{query, custom_id?, system?}` throughout the day. A code node normalizes the payload - it fills a `custom_id` from a slug-plus-timestamp if the caller did not supply one, attaches an optional `system` prompt, and stamps the queued time - then **appends the request as one JSON line** to `/data/batch-queue/pending.jsonl` (it `mkdir -p`s the dir first; `fs` is available in the sandboxed code node for `/data` reads/writes). A respond-to-webhook node returns `{queued: true, custom_id}` so the caller has the join key. Each query is one line; the file grows through the day. This is the JSON-lines accumulator: cheap appends, no read-modify-write race, trivially clearable.

### Stage 2 - Submit (cron, 11:00 PM America/Chicago)

A `scheduleTrigger` node fires on cronExpression **`0 0 23 * * *`** (11:00 PM, timezone `America/Chicago` in the workflow settings). A code node reads `/data/batch-queue/pending.jsonl`, parses each line, and **builds the `requests` array** - one request object per queued query, each shaped `{custom_id, params:{model:"claude-sonnet-4-6", max_tokens, system, messages}}`. If the queue is empty it short-circuits (no empty batch submitted). The array flows to an `httpRequest` node that **POSTs to `https://api.anthropic.com/v1/messages/batches`** with `x-api-key: {{ $env.ANTHROPIC_API_KEY }}`, `anthropic-version: 2023-06-01`, `content-type: application/json`, and body `{requests:[...]}`. A final code node takes the returned batch `id`, writes **`/data/batch-queue/submitted/<id>.json`** carrying the batch id, the submit timestamp, and the `custom_id`-to-destination map (so the morning poller knows which session-note file each result belongs in), then **archives and clears** `pending.jsonl` (it moves the day's queue to `/data/batch-queue/archive/<date>.jsonl` and truncates the pending file) so tomorrow starts clean.

Inside any code node that needs to make an HTTP call, use **`this.helpers.httpRequest`**, NOT raw `require('http')` - the sandbox does not expose the raw http module, and the raw-require path was the exact failure corrected in commit `633755d` (the execution-outcome-observability lesson). The dedicated `httpRequest` node handles the actual batch POST here; the rule stands for any in-code call.

### Stage 3 - Retrieve (documented TODO, deferred)

The skeleton carries a `noOp` node named **"TODO: morning poller - GET results_url, drop into session notes"** to mark the deferred stage. The retrieve loop is fully specified in Section 2 but intentionally not yet implemented in this skeleton: a morning cron reads each `/data/batch-queue/submitted/<id>.json`, GETs `https://api.anthropic.com/v1/messages/batches/<id>`, and when `processing_status` is `ended`, GETs the `results_url`, streams the `.jsonl`, matches each line's `custom_id` against the stored destination map, and writes each succeeded message into the relevant `docs/99-session-notes/` file. Keeping submit and retrieve as two clearly-described stages is deliberate: the accumulate-and-submit path is the one that captures the 50% discount the moment it ships; the poller is a mechanical follow-on that lands next.

### The n8n credential

The workflow authenticates to Anthropic with **`ANTHROPIC_API_KEY`, set in the n8n container's `.env`** and referenced as `{{ $env.ANTHROPIC_API_KEY }}`. This is the same credential the README documents and the same one Ship 2's `CLAUDE-PROMPT-CACHING-PATTERN.md` uses - one key, one place, cross-referenced so it is never duplicated or re-pasted. The key lives in the container `.env` on the NAS, never in the workflow JSON and never in the repo.

Because the workflow now ships `active: true`, one operator action remains before the queue can actually submit: **`ANTHROPIC_API_KEY` must be present in the container `.env`** (a value only Darrell has - the legitimate-ask category). Until it is set, an empty queue stays harmless (the cron never calls the API), but a queued item on an 11pm run would fail the POST and surface through the wf02 error-workflow alert. So: set the key, then queue. The companion script reminds and checks for the key but cannot set it (it is Darrell's secret to paste).

---

## 5. Worked example: the Quo research-review through Batch

Take the real Quo research-review (the Incoming-Tab phone-call intake writeup) and run it through Batch instead of synchronous Sonnet. Reasonable token sizes for that kind of long-form synthesis: roughly **~8,000 input tokens** (the research prompt plus the foundation context it carries) and **~4,000 output tokens** (the written review). Using illustrative Sonnet-tier rates of **$3.00 per million input tokens** and **$15.00 per million output tokens** for the synchronous path:

**Synchronous (full price):**

- Input: 8,000 tokens x $3.00 / 1,000,000 = **$0.024**
- Output: 4,000 tokens x $15.00 / 1,000,000 = **$0.060**
- **Synchronous total: $0.084**

**Batch (50% off both input and output):**

- Input: 8,000 tokens x $1.50 / 1,000,000 = **$0.012**
- Output: 4,000 tokens x $7.50 / 1,000,000 = **$0.030**
- **Batch total: $0.042**

**Dollar delta: $0.042 saved on this single item - exactly half.**

Per-item the saving is small - four cents on one research-review. That is the honest read: nobody gets rich saving four cents. But the saving is *every* non-urgent research item, every day, indefinitely, and it compounds. Ten research-reviews a week at this shape is ~$0.42/week saved, ~$1.80/month - and the queue also carries the audits, the long-context commentary passes, and the worldview-processing runs, each of which is larger. Against the **$25 soft / $50 hard** monthly caps, halving the bill on the entire non-urgent research stream is a meaningful fraction of the headroom, and it costs nothing but overnight patience. And when the shared-prefix queries carry `cache_control` (Section 2, Ship 2), the cache-read discount stacks on top of the batch discount, pushing the effective price lower still. Small per item; structural across the system; the right default for any reasoning nobody is waiting on.

---

## 6. Sources

This document synthesizes and extends the following. It cites and routes back to them rather than duplicating them.

1. **`CLAUDE-TOOL-ROUTING.md`** (Layer 3, this repo) - the two-axis routing policy; lists "Batch / overnight async generation - Either vendor's Batch API - 50% off, async" as a Tier 2 route and states the TLC firewall and the $25/$50 caps that this document operationalizes for the Batch path.
2. **`CLAUDE-PROMPT-CACHING-PATTERN.md`** (Ship 2, Layer 3, this repo) - the prompt-caching pattern that **composes** with Batch; the source for the `cache_control`-stacks-with-batch behavior in Sections 2 and 5, and the shared `ANTHROPIC_API_KEY` credential documented in Section 4.
3. **`project_cost_discipline_with_growth_permission`** (memory) - the $25 soft / $50 hard combined-vendor caps that Batch's 50% discount is the largest lever against.
4. **The recent session notes named in Section 1** - the Quo research-review (`0ae89b3`), the Hostinger research, the pricing-tier audits (`9fb0b53` and the Freddie audit work), and the family-worldview-commentary passes - the real non-urgent research items that motivate this pattern.
5. **Commit `633755d`** - the `this.helpers.httpRequest`-not-raw-`require('http')` sandbox lesson (execution-outcome-observability) encoded in the Section 4 code-node rule.

---

*Sovereign first, and free, for everything the NAS can carry. When a vendor reasoner is genuinely needed but no one is waiting, we queue it overnight and pay half. The clinical firewall never bends for a discount - TLC content stays home. We waste no token and no dollar that patience can save, and we hold the caps not by dropping the work but by being wise about how it is bought. We all win. We create. Amen.*
