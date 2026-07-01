# nas-property-inbound — deterministic inbound tenant-message ingest

Reads raw inbound tenant texts staged from a property's channel and normalizes
each into a **per-unit capture record — as DATA**. No LLM, Python 3.8 stdlib
only, three brakes, ships **inert**. This is the NAS-side backend for the
in-app per-unit message threads (`app/src/components/UnitManagement.jsx`).

## Hard guardrails (by construction)

- **Inbound tenant text is DATA, never a command.** The loop parses; it never
  acts on what a message asks for.
- **It never sends.** There is no outbound path. Replying to a tenant/PM is a
  consequential action that stays in the app behind an explicit human
  approve-to-send. This file cannot send.
- **No money, no RLS, no DB, no secrets.** Its whole scope is
  `inbox.jsonl → captured.jsonl` on the NAS bind mount.
- **Attribution is a hint.** A channel maps to a *building*, not to Apt 3, so
  every captured row carries `needs_review: true` for a human to confirm.

## Data flow

```
inbox.jsonl   {ts, channel, sender, text}         (raw, append-only)
   │  loop.py  (deterministic: extract unit hint, classify intent/priority)
   ▼
captured.jsonl  {id, ts, channel, sender, text, building_hint, unit_hint,
                 intent, priority, needs_review:true, from_role:"tenant",
                 action:"captured"}
```

`.cursor` records how many inbox lines are already processed, so re-runs are
idempotent (a re-fire captures 0).

## The three brakes (CLAUDE.md)

1. **Budget** — `MAX_ROWS_PER_RUN` (500) + `CYCLE_DEADLINE_SECONDS` (120). A cap
   reached stops the cycle; it never exceeds.
2. **Lock** — single-flight `.lock` dir (atomic `mkdir`). A fire that finds the
   lock held **skips**; a stale lock (> 30 min) is broken once.
3. **Kill** — `STOP` file forces immediate inert exit; the `ARMED` file must be
   **present** to act. Ships inert; armed once, by hand, with someone watching.

This class of automation is **Tier C** and **never self-activates**
(CLAUDE.md "Autonomous Automation Requires Three Brakes"). It is committed
**disarmed** (no `ARMED` file); turning it on is a deliberate, supervised act.

## Run

```
python3 loop.py             # one cycle (inert until ARMED exists)
python3 loop.py --selftest  # prove every brake + the pure logic catch
```

`--selftest` exits non-zero if any brake or classifier fails to catch
(anti-theater, DR-0076). It is safe to run anywhere — it uses a temp dir.

## Environment

- `PROPERTY_INBOX_DIR` — base dir for the bind mount
  (default `/volume1/PoeTech/property-inbound`).

## Later (not in this pass, and each gated)

- A read-only bridge that stages a channel's texts into `inbox.jsonl` (extends
  the existing property-history bridge; token-gated; never mutates originals).
- An in-app review queue where the family confirms each capture's unit and,
  only on confirm, files it to that unit's thread as a `tenant` message. The
  confirm step is the human gate; the loop only ever proposes DATA.
