# The Wake / Handoff Contract — vendor goes offline, the NAS wakes it back up

> Layer 4 working contract for the portable orchestrator. Implements the
> Charter's §3 bridge promise — *"it wakes, starts, and instructs vendor models
> when the need is real, and it restarts a vendor session (including Claude)
> after that session has gone offline"* — as a real, machine-readable interface.
> Grounded in: the PoeTech Orchestrator Charter (`../charter/CHARTER.md`), the
> portable bundle (this folder), the tiered-routing strategy
> (`docs/99-session-notes/2026-06-13-vendor-llm-routing-strategy.md`,
> DR-0056 / DR-0073), and the braked self-activation decision (DR-0071).

## The problem this solves

Darrell's design (2026-06-16): a vendor model (Claude, Gemini) reaches the end of
a session — it goes offline, hits a limit, or finishes a turn that leaves work
queued. Today the work just stops until a human comes back and re-prompts. The
bridge changes that: **before going offline the vendor emits a structured
handoff** that states *when* to wake, *what* to resume, and *where* the durable
state lives. The always-on NAS scheduler reads it, schedules the wake, and at
wake-time summons the right vendor — tiered, cheapest-capable-first — with the
Charter + the lane/task + the state pointer. The humans are freed to govern; the
system keeps the work moving.

This is **event-driven self-activation, not a timer loop** (DR-0071). The wake
fires off a *real handoff event* a vendor deliberately wrote — never a bare
clock that spawns compute with no event behind it. Every summon runs behind the
three brakes + the kill-switch + a dedicated wake-summon flag (below).

## The contract (schema)

The authoritative machine schema is [`schema.json`](schema.json) (JSON Schema
draft-07). A worked example is [`example.handoff.json`](example.handoff.json).
The shape, in brief:

| Field | Req | Meaning |
|---|---|---|
| `v` | yes | Contract version (`1`). |
| `id` | yes | Stable unique id — dedupe, lock, audit. |
| `issued_at` | yes | UTC ISO-8601 — when the handoff was written. |
| `issued_by` | yes | `claude` \| `gemini` \| `local` \| `human` — who is going offline. |
| `wake_at` | yes | When to wake: `at` (absolute UTC) **or** `after_seconds` **or** `condition` (named predicate); optional `not_before` floor. |
| `lane` | yes | The durable work lane to resume (a stream of work, not one turn). |
| `task` | yes | The concrete next action, self-contained for a cold session. |
| `work_type` | no | `code`/`research`/… — drives the affinity map. |
| `private` | no | `true` => **local-only, never a vendor** (sovereignty gate). |
| `state_pointer` | yes | `{kind, ref, note?}` — WHERE the durable state lives (git branch/PR, repo path, NAS path, event log, URL). The handoff carries a *pointer*, never the bulk state. |
| `suggested_vendor` | no | The issuer's suggestion (`local`/`claude`/`gemini`/`auto`); **advisory** — the router decides. |
| `offline_message` | no | The verbatim final message ("back up ~22:00 UTC; resume X"). Human-readable; the structured fields are authoritative. |
| `budget_hint_usd` | no | Per-task spend hint; never overrides the hard budget brake (smaller wins). |

### `wake_at` resolution

- **`at`** — absolute UTC time. Derived from the offline message's stated
  "I'll be back up at …". Due when `now >= at`.
- **`after_seconds`** — relative delay from `issued_at`. Due when
  `now >= issued_at + after_seconds`.
- **`condition`** — a named, **pluggable** predicate (e.g. `ci-green:PR-210`,
  `file-exists:/data/x`). The router evaluates it at scan time. An **unknown**
  condition is treated as **NOT due** and logged — the bridge never guesses a
  wake into existence (Verification Doctrine: honest uncertainty over a painted
  "due").
- **`not_before`** — optional floor; even a met condition does not wake before
  this time.

## Where handoffs are written + read

- **Inbox (runtime, gitignored):** vendors / the human drop handoff JSON files
  into `state/handoffs/` inside the bundle (one file per handoff, named
  `<id>.json`). This dir is runtime state — it travels with the deployed NAS,
  never the repo.
- **The scheduler** (`orchestrator/lib/wake.sh`, run every supervisor tick)
  scans `state/handoffs/`, validates required fields, and for each handoff
  decides **due / pending / unknown**, emitting one event per scan to the
  append-only `events/events.jsonl`.
- **At wake-time**, when a handoff is due **and every brake is GO**, the live
  router (`scripts/wake-router.mjs`, host-side Node) is invoked with the handoff.
  It summons the tiered, cheapest-capable vendor, records the spend against the
  budget brake, and writes the outcome event. In the **inert skeleton** the
  scheduler never reaches the router — it logs the intent and stands by.

> **Why the router is host-side Node, not in the alpine container.** The portable
> bundle's supervisor is dependency-free POSIX sh (the self-contained guarantee):
> it schedules and brake-gates, but it does not carry an HTTP/vendor stack. Heavy
> work runs off the capped 1-CPU container (Charter §3a). The real multi-vendor
> summon lives in `scripts/wake-router.mjs`, run on the NAS host / a runner that
> already reaches Ollama + the vendor APIs — the same split as
> `scripts/orchestrator-v0.mjs`.

## Tiered routing at wake-time (cheapest-capable-first)

The router applies the Charter's tier ladder and the affinity map
(`vendor-llm-routing-strategy.md`):

1. **`private: true` → local-only.** Sovereignty outranks speed and cost; the
   handoff never reaches a vendor (DR-0056 / DR-0073 / TLC firewall).
2. **`ORCH_MODE=vendor-first` (default now, small CPU local):** the
   affinity-mapped capable vendor is primary; local is the outage fallback.
3. **`ORCH_MODE=local-first` (GPU-era end state):** local tries and self-rates;
   escalate only the hard ones.

The affinity map seeds the vendor per `work_type` (code/refactor/agentic/writing
→ Claude; longcontext/multimodal/research → Gemini) and the suggested vendor is a
tie-break hint, not an override. The map tunes itself from real outcomes in the
audit ledger over time (strategy §3).

## The brakes (non-negotiable — CLAUDE.md three-brakes rule, DR-0071)

A summon fires only when **every** brake is GO:

| Brake | State | Effect when not-GO |
|---|---|---|
| **Kill-switch** | `state/KILL_SWITCH` absent | present => inert, no summon, ever. |
| **ARM flag** | `state/ARMED` present | absent => disarmed, no summon. |
| **Wake-summon flag** | `state/WAKE_SUMMON` present | absent => the bridge schedules + logs intent but **never calls a vendor**. The dedicated, explicit consent for this specific capability. |
| **Budget** | per-task + daily `$` ceilings set (> 0) and daily spend under the ceiling | unset or over => refuse; never continue past the ceiling. |
| **Concurrency** | single-instance lock (`state/orchestrator.lock/`) | a second run that finds the lock held skips. |

Defense in depth: an orchestrator that is merely `ARMED` still will **not**
summon vendors on wake unless `WAKE_SUMMON` is also explicitly set. Arming the
standby and consenting to autonomous vendor-summoning are two separate,
deliberate acts.

## Ships INERT by default

Per the portable-bundle principle (RELEASE-TIERS Tier C; the June-6 runaway
rule): the bridge stands up and gives control immediately, but autonomous
wake/summon stays **OFF** until Darrell explicitly arms it. The kill-switch ships
engaged; `WAKE_SUMMON` ships absent; budgets ship `0` (a missing brake). Turning
it on is attended, with budgets set, never while the principal is traveling — see
the bundle README's "Arm the wake bridge" step.

## Emitting a handoff (for a vendor going offline)

Write a JSON file matching `schema.json` to `state/handoffs/<id>.json`. The
verbatim final message goes in `offline_message`; the structured fields are
authoritative for scheduling. Minimal valid handoff:

```json
{
  "v": 1,
  "id": "handoff-<lane>-<date>",
  "issued_at": "<UTC ISO-8601 now>",
  "issued_by": "claude",
  "wake_at": { "at": "<UTC ISO-8601 wake time>" },
  "lane": "<lane>",
  "task": "<the concrete next action>",
  "state_pointer": { "kind": "git-branch", "ref": "<branch>" }
}
```
