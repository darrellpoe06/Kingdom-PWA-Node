# Claude Prompt Caching Pattern

**Layer 3 (reference) per the ICM hierarchy declared in `CLAUDE.md`.** A foundation document the agent loads before wiring any n8n workflow that calls the Anthropic Messages API directly. Added 2026-06-02 (Maui), at Darrell's go-ahead, so every direct Anthropic call our own workflows make pays the static-context bill once and reads it cheap thereafter, instead of re-buying the same foundation rules on every single call.

This document does NOT re-derive the routing policy. It assumes the work has already cleared the two-axis decision in `CLAUDE-TOOL-ROUTING.md` (axis A said "Claude," axis B said "n8n HTTP Request node") and the content has already cleared the TLC firewall as non-clinical. Given that, this is the mechanical answer to "how do I stop paying full input price for the same static prefix on every call."

---

## 1. Why this exists

Every Code Task and every workflow that reasons today reads the same large static context from scratch: `CLAUDE.md` (Layer 0), the relevant foundation docs (Layer 3), the recent session notes (Layer 4). When that context is handed to a vendor reasoner as a system prompt, the agent pays the **full input-token price for that prefix on every single call** — even though the prefix is byte-for-byte identical from one call to the next. A 20K-token foundation prefix called ten times in a few minutes is 200K input tokens billed, when it is really the same 20K tokens read ten times.

Prompt caching collapses that. The first call **writes** the static prefix into Anthropic's ephemeral cache; every subsequent call within the cache window **reads** it at roughly a tenth of the input price. The static context is bought once and rented cheap thereafter.

**Important scope note — this is for OUR OWN workflows, not for Claude Code / Cowork sessions.** Claude Code and Cowork already do prompt caching internally; their session context is cached for you and you do not wire anything to get it. The win documented here is exclusively for **n8n workflows on the NAS that call the Anthropic API directly over HTTP** — the foundation-agent workflow, a batch-summarizer, any future workflow that hands Claude a big static rulebook plus a small changing question. Those calls are raw HTTP we control, so caching is ours to turn on or leave off. We turn it on.

This pairs with `project-cost-discipline-with-growth-permission` and the vendor cost caps in Section 7: caching is one of the cheapest levers we have for keeping combined Claude+Gemini metered spend under the $25 soft cap, because it directly cuts the largest line item — repeated static input.

---

## 2. How prompt caching works (Anthropic Messages API)

The Anthropic Messages API supports **cache breakpoints** via a `cache_control` marker. You attach `"cache_control": {"type": "ephemeral"}` to the end of a content block (in the `system` array, in `tools`, or in a long static `messages` block), and everything from the start of the request up to and including that block becomes a cacheable prefix.

The mechanics that matter:

1. **First call writes the cache.** The marked prefix is stored under a hash of its exact bytes. This call is billed at the cache-write rate (higher than normal input — you are paying to store).
2. **Subsequent calls read the cache.** As long as the prefix is byte-identical and the call lands within the TTL, the matching prefix is served from cache at the cache-read rate (far below normal input).
3. **The TTL is 5 minutes (ephemeral), refreshed on each hit.** Every cache read resets the 5-minute clock. A workflow that fires every couple of minutes keeps the cache permanently warm; a once-an-hour workflow writes fresh each time and gets no benefit (see Section 6).
4. **Byte-identical is non-negotiable.** A single changed character anywhere in the cached prefix — a different timestamp, a re-ordered rule, trailing whitespace — produces a different hash and a cold miss that re-writes the cache. Keep everything dynamic OUT of the cached block.
5. **There is a minimum cacheable size.** For the larger models the floor is roughly **1024 tokens**; smaller blocks are simply not cached and the breakpoint is a silent no-op. Do not wrap a 200-token system message in `cache_control` and expect a win — there is none, and the marker is wasted. Cache only genuinely large static prefixes.

The right shape is: **one big static block marked with `cache_control`, then the small dynamic block(s) with no marker, then the user message.** Static-then-dynamic, cached-then-fresh.

---

## 3. The cost math (Sonnet 4.6 as the worked tier)

Per-token rates for the worked tier (Sonnet 4.6), input side:

| Operation | Rate (per MTok) | Multiple of normal input |
|---|---|---|
| Uncached input (every call, no caching) | $3.00 | 1.00x |
| Cache **write** (first call, stores the prefix) | $3.75 | 1.25x |
| Cache **read** (subsequent calls, within TTL) | $0.30 | 0.10x |

Read that as: the first call costs **1.25x** a normal read because you are paying to store; every cached read after costs **0.10x**. So:

- **Call 1** (write): 1.25x — slightly more expensive than not caching.
- **Call 2** (read): 0.10x — you have now spent 1.25x + 0.10x = 1.35x across two calls, versus 2.00x uncached. **Break-even is reached at the second call.**
- **Call 3 onward**: each adds only 0.10x. The gap widens fast. **Clear win from the third call.**

### Worked example: a 20K-token static prefix, called 10x in one window

**Uncached** — full input price every call:

```
10 calls x 20,000 tokens x $3.00 / 1,000,000 = $0.600
```

**Cached** — one write, nine reads:

```
write:  1 x 20,000 x $3.75 / 1,000,000 = $0.0750
reads:  9 x 20,000 x $0.30 / 1,000,000 = $0.0540
total                                  = $0.1290
```

**Savings on the static-input portion:**

```
($0.600 - $0.129) / $0.600 = 0.785  ->  ~78.5% saved across the 10 calls
```

And the marginal picture is even starker — once the cache is warm, each additional cached read is $0.30/MTok against $3.00/MTok uncached, a **90% cut on every call from the third onward** (0.10x vs 1.00x). The 10-call window lands at ~78.5% because it still carries the one-time 1.25x write; stretch the window to more calls and the blended savings climbs toward that ~90% asymptote. Either way the answer is the same: for any static prefix called three or more times in a five-minute window, cache it.

### Other tiers scale proportionally

Opus and Haiku use the **same multipliers** on their own base input rates: cache write is 1.25x that tier's input rate, cache read is 0.10x that tier's input rate. So the break-even (2nd call) and clear-win (3rd call) thresholds are identical regardless of model — only the absolute dollars change. Pick the tier per `CLAUDE-TOOL-ROUTING.md` Section 3; the caching decision rides on call-count-in-window, not on which model.

---

## 4. Concrete n8n wiring

Use the **HTTP Request node** (typeVersion 4.2), not a managed Anthropic node. This matches the Gemini-vs-Claude fallback posture already practiced in `17-gemini-deeper-reasoning.json` (HTTP Request mode so we control the exact JSON body) — and here it is mandatory, because the `cache_control` marker lives inside the body and a managed node would not expose it.

### The node configuration

- **Method:** `POST`
- **URL:** `https://api.anthropic.com/v1/messages`
- **Headers** (`sendHeaders: true`):
  - `x-api-key`: `={{ $env.ANTHROPIC_API_KEY }}`
  - `anthropic-version`: `2023-06-01`
  - `content-type`: `application/json`
- **Body** (`sendBody: true`, `specifyBody: json`): a `jsonBody` whose `system` field is an **array of content blocks**.

### The body shape

The `system` field is an array. The large static block carries `cache_control`; the dynamic per-request block follows it with no marker:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": [
    {
      "type": "text",
      "text": "<LARGE STATIC SYSTEM PROMPT - byte-identical across calls, e.g. foundation rules>",
      "cache_control": { "type": "ephemeral" }
    },
    {
      "type": "text",
      "text": "<DYNAMIC PER-REQUEST CONTEXT - no cache_control, sits after the cached block>"
    }
  ],
  "messages": [
    { "role": "user", "content": "<the per-request user question>" }
  ]
}
```

The ordering is load-bearing: cached block first, dynamic block second, user message last. Anything before the `cache_control` breakpoint is part of the cached prefix; if a per-request value sneaks in ahead of it, the prefix changes every call and the cache never hits.

### Confirming the cache is actually hitting

The Anthropic response `usage` object reports `cache_creation_input_tokens` (written this call), `cache_read_input_tokens` (read this call), `input_tokens` (uncached this call), and `output_tokens`. A healthy warm call shows `cache_read_input_tokens > 0` and a small `input_tokens`; the first call in a window shows `cache_creation_input_tokens > 0` instead. The template's `Parse answer + cache usage` Code node surfaces all four so you can verify the win is real rather than assumed. Log these counts in the n8n layer the same way grounded-query counts are logged per the cost guardrail (Section 7), so the bill cannot surprise.

### The credential change

Add `ANTHROPIC_API_KEY` to the n8n container `.env` on the NAS, exactly the same pattern as `GEMINI_API_KEY` and `OLLAMA_BASE_URL` already documented in `docs/00-foundations/n8n-workflows/README.md` (see its "Credentials required" and the env-var tables). One line in `.env`, then `docker compose up -d` to pick it up — zero workflow JSON edits, because every workflow reads the key as `{{ $env.ANTHROPIC_API_KEY }}` and never hardcodes it. Cross-reference that README when adding the key so the credential inventory stays in one place.

### The template

A ready-to-import skeleton ships alongside this doc at `docs/00-foundations/n8n-workflows/_TEMPLATE-cached-system-message.json` (`active: false`, name `_TEMPLATE - Anthropic cached system message (HTTP Request)`). It contains a manual trigger, a `cache_control` note Code node, the HTTP Request node wired exactly as above, the cache-usage parser, and a terminal noOp. Import it, swap the two placeholder blocks for your real static prefix and dynamic context, replace the manual trigger with your real trigger, and ship.

---

## 5. Respect the firewall

Prompt caching is for **NON-clinical, non-sensitive system prompts only.** This does not soften the TLC firewall by one inch — it operates entirely downstream of it.

The firewall is absolute and stated in full in `CLAUDE-TOOL-ROUTING.md` Section 3: clinical / therapy / counseling content NEVER routes to any cloud reasoner — not Claude, not Gemini — regardless of any token, regardless of task class. That content **never leaves the NAS at all, cache or no cache.** Caching changes nothing about that boundary, because caching only exists on the far side of an Anthropic API call that clinical content is never allowed to make in the first place. There is no "cached clinical prompt" because there is no clinical prompt sent to the cloud, period. Fail closed.

So the rule for this pattern: only ever place foundation rules, public docs, routing policy, architecture context, and other non-sensitive static material in a cached block. If you are ever uncertain whether a prefix contains clinical or family-private content, treat it as clinical and do not send it to Anthropic at all — route the work to a sovereign Ollama model on the NAS per the routing authority. The cache is a cost optimization for content that was already cleared to leave; it is never a reason to let content leave.

---

## 6. When caching wins and when it does not

Cache when **all** of these hold; skip it otherwise:

- **Call count in window >= 3.** Break-even is the 2nd call, clear win the 3rd. A prefix sent once and never repeated within five minutes gains nothing (the write costs 1.25x and is never amortized). A burst of many calls — a batch loop, a high-frequency webhook, a fan-out over many items sharing one rulebook — is the ideal case.
- **Static prefix >= ~1024 tokens.** Below the larger-model floor the API does not cache and the marker is a no-op. Do not wrap small system messages.
- **The prefix is genuinely byte-identical across calls.** If the "static" context actually carries a timestamp, a per-item value, or anything that changes call to call, it is not cacheable as written — move the changing part into the dynamic block so the cached block stabilizes.
- **The window is tight enough to stay warm.** Each read refreshes the 5-minute TTL. Sub-5-minute call cadence keeps the cache hot indefinitely; an hourly cron writes cold every time and should not bother marking a breakpoint.

The honest non-win cases: a once-a-day report that calls Claude a single time, a workflow whose "static" prefix is really per-request, a tiny system message under the size floor. For those, the breakpoint is wasted effort at best and a 1.25x tax at worst. Cache deliberately, not reflexively.

---

## 7. Cost caps and the routing authority

This pattern sits under the same guardrails as every other vendor call. Combined Claude+Gemini metered spend carries a **$25/month soft cap (email/ntfy alert)** and a **$50/month hard stop (manual review)**, per `CLAUDE-TOOL-ROUTING.md` Section 3 and `project-cost-discipline-with-growth-permission`. Caching is a tool for staying under those caps, not a license to call the vendor more — the sovereign-first default still holds: most reasoning stays on Tier 0 (Ollama on the NAS) and never touches Anthropic at all. Caching only makes the calls that legitimately DO escalate to Claude cheaper on their repeated static input.

`CLAUDE-TOOL-ROUTING.md` is the routing authority. This document is downstream of it: it presumes axis A already chose Claude and axis B already chose the n8n HTTP Request node, and the content already cleared the firewall. If any of those is in doubt, resolve it there first; this doc only governs how to wire the cache once the call is approved.

---

## 8. Adoption into existing workflows (and where `cache_control` deliberately does NOT go)

When the live directive came to "wire `cache_control` into the existing high-call workflows that read the foundation docs - at minimum wf27 (Foundation Agent), wf30 (family-feedback intake), wf31 (daily standup digest), wf32 (daily ship summary)," the honest finding from reading those four on disk is a **premise conflict worth surfacing rather than executing through** (per the `feedback-surface-premise-conflicts` binding):

- **None of the four has an Anthropic-calling node.** wf27 and wf31 call the sovereign Ollama endpoint (`http://ollama:11434/api/generate`). wf30 calls no LLM at all - it captures the Suggest-button submission to `/data/finance-events/family-feedback/` and pushes ntfy. wf32 calls no LLM either - it summarizes GitHub commit *metadata*. `cache_control` is an Anthropic Messages-API field; there is no Anthropic request in any of these to attach it to.
- **Three of the four carry family-private content.** wf30, wf31, and wf32 process family voices and family activity. The firewall keeps that on the NAS. Bolting an Anthropic call onto a family-voice summarizer so its prompt could be "cached" would not be an optimization - it would be a **firewall breach**, sending family-private content to the cloud that was deliberately kept home. So Anthropic `cache_control` is not added to these, by design, not by oversight. The sovereign-first routing that put them on Ollama in the first place is the correct posture; caching does not change it.

**What was actually wired - the sovereign analog (`keep_alive`).** Ollama has its own cousin of prompt caching: a model kept resident serves a repeated, byte-stable leading prompt prefix from its in-memory KV/context cache instead of recomputing it cold. The knob is `keep_alive`. So wf27 and wf31 - the two that genuinely call Ollama with a stable system preamble - now pass **`keep_alive: '30m'`** in their `/api/generate` body. That keeps the 14B daily-driver warm across the cluster of calls in a digest run (and across the 7am/12pm/5pm/9pm Foundation-Agent ticks), so each call skips the cold-load penalty and reuses the resident prefix. It is weaker than Anthropic's `cache_control` - no cross-request guarantee, resident-only, no separate read price because it is all $0 on-LAN already - but it is the firewall-safe, sovereign-first, zero-dollar version of the same idea. Full prefix-cache parity (and concurrency) arrives with the Phase 2 GPU box + vLLM.

**Where `cache_control` DOES belong** is any *future* genuine, non-clinical, repeated Claude call our workflows make directly over HTTP: the Batch queue's shared-prefix research bursts (`CLAUDE-BATCH-API-PATTERN.md`, where cache and batch discounts stack), or a Foundation-Agent `needs-claude` path if it is ever changed to call the API directly instead of queuing to a Dispatch session (today it queues to `/data/poetech-briefing/queued-for-claude/`, so there is no API call to cache). For those, use the HTTP-Request template from Section 4. The rule stands: cache the vendor calls we actually make and that clear the firewall; do not invent vendor calls to cache.

---

## 9. Sources

- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` — the two-axis routing authority, the Tier 0/1/2 model ladder, the cost caps, and the TLC firewall override. This doc is its mechanical downstream companion.
- `docs/00-foundations/n8n-workflows/README.md` — the credential inventory and the `$env` pattern (`GEMINI_API_KEY`, `OLLAMA_BASE_URL`); `ANTHROPIC_API_KEY` joins it the same way.
- `docs/00-foundations/n8n-workflows/17-gemini-deeper-reasoning.json` — the HTTP-Request-mode precedent (control the JSON body ourselves) and the in-workflow TLC firewall classifier this pattern presumes upstream.
- `docs/00-foundations/n8n-workflows/_TEMPLATE-cached-system-message.json` — the importable skeleton this doc describes.
- `CLAUDE.md` — Layer 0 binding rules, including the firewall posture and the cost-discipline memories.

---

*The static rulebook is bought once and read cheap; the changing question stays fresh; the clinical word never leaves the house. We spend where it serves the family and nowhere it does not. We all win. We create. Amen.*
