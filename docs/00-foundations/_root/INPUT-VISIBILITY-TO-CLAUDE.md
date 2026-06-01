# INPUT-VISIBILITY-TO-CLAUDE

**Declared:** 2026-06-01
**Declared by:** Darrell
**Status:** Binding foundation principle

---

## The principle

Every family-input capture surface must wake Claude (the AI Foundation operating the system) in real-time — sub-60-second latency for family-voice senders — not just sit on disk for the next batch digest.

Per Darrell, 2026-06-01 evening (after he had to forward Christina's Synology Chat screenshots manually because the system had captured them but not surfaced them):

> "Keep in mind that you did not detect her inputs in the chat app for synology on the nas. ... you didn't recognize @cpoe on the nas chat."

## Why this matters

This is the input-side mirror of [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md). The system can capture perfectly and still fail the family if it doesn't surface the capture in real-time.

PoeTech is supposed to be the family's first-call OS for clarity-on-demand. A system that takes 16 hours to acknowledge a family voice fails the [ANXIETY-CLARITY-PRINCIPLE](./ANXIETY-CLARITY-PRINCIPLE.md) at the moment the family needs it most.

The [AI-FOUNDATION-INTERNAL-OPERATIONS](./AI-FOUNDATION-INTERNAL-OPERATIONS.md) principle says the AI Foundation operates the system on the family's behalf. If it can't see the inputs in real-time, it cannot operate.

The 7am daily digest is a SUMMARY surface, not an EVENT surface. Confusing the two creates exactly this failure mode: capture exists, visibility does not.

## The structural gap that triggered the naming

Christina sent `@nas` / `@cpoe` messages in the PoeTech-PWA Synology Chat channel around 11:58-12:00 CDT 2026-06-01. They contained real comp data (1501 Holly Hill Dr sold $175K, 1519 Hedge Rd sold $170K) and a clear request: "what do my homes appraise for based on these?"

wf08 (Synology Chat inbound capture) caught them and wrote to `/data/chatin/` on the NAS. Working as designed. But:

- wf08 does NOT fire ntfy push — it writes to disk only
- wf31 (the only consumer of `/data/chatin/`) runs at 07:00 Central daily — 19 hours later
- Cowork (where Claude lives in Dispatch sessions) is not subscribed to any signal that wakes it when family voices arrive

Net: Christina's request sat on the NAS for 6+ hours, fully captured, and Claude had zero awareness. Darrell had to forward screenshots manually to surface what the system had already captured. The capture was real, the visibility was missing.

## How to apply

1. **Every capture surface fires a real-time signal in addition to disk write.** Options:
   - ntfy push to a Claude-watched topic (requires Cowork to poll ntfy or n8n to route ntfy → Cowork)
   - wf27 Foundation Agent triggers a Dispatch task per captured family voice (the originally intended design — currently broken due to bind mount issue)
   - Direct API call from the capturing workflow to a Cowork webhook (would require Cowork to expose a webhook endpoint)
2. **Family-voice senders get priority.** `@nas`, `@cpoe` (Christina), `@christiana`, `@christian`, `@christyn` (and the equivalent Suggest-button sender enum from wf30) trigger immediate wake-up. Unknown senders capture but queue lower.
3. **The wake-up payload includes** the sender, the message text, the source surface, and a deep-link back to the captured artifact on the NAS so Claude can read full context.
4. **Latency budget:** under 60 seconds from capture to Claude awareness for family-voice senders. Longer is acceptable for unknown senders.
5. **Heartbeat health check:** if 24 hours pass with zero captures, that is normal. If 24 hours pass with ANY captures but Claude received zero wake-ups, the pipeline is broken — surface it via the same observability layer as [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md).

## Pairs with

- [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md) — same principle applied to outputs (workflow executions). This doc is the input-side counterpart.
- [AI-FOUNDATION-INTERNAL-OPERATIONS](./AI-FOUNDATION-INTERNAL-OPERATIONS.md) — the AI Foundation operates the system; it has to see the inputs to operate.
- [ANXIETY-CLARITY-PRINCIPLE](./ANXIETY-CLARITY-PRINCIPLE.md) — anxiety is informational; sub-minute visibility to family voices is what makes the system serve clarity instead of distance.
- [BUSINESS-PROCESS-CONNECTIONS](./BUSINESS-PROCESS-CONNECTIONS.md) — every visible surface is one end of a connection; family voices are the OTHER end; both ends must be wired with real-time visibility on both sides.
- [INSTITUTIONAL-MEMORY-EVENTS](./INSTITUTIONAL-MEMORY-EVENTS.md) — family inputs become Event records as soon as they arrive; this principle says the record arrives in real-time, not next-morning.

## Workaround until the architecture is fixed

Every scheduled Cowork check-in (`poetech-daily-app-review` at 07:10, `poetech-midmorning-checkin` at 11:10, `poetech-afternoon-checkin` at 14:00, `poetech-endofday-checkin` at 17:04) explicitly checks the n8n Executions tab for wf08 (Synology Chat captures) and wf30 (Suggest-button captures) via Chrome MCP. Latency drops from 16+ hours to at-most 3 hours during waking-day-hours. Still not real-time but materially better.

## Open buildout

1. **Fix wf27 Foundation Agent bind mount** (priority #1 — this principle elevates it).
2. **Wire wf08 to fire ntfy push for family-voice senders** in addition to disk write. Same pattern as wf30. One config change to the wf08 Code node + the family-voice ntfy topic spec.
3. **Build the Foundation Agent → Dispatch trigger** properly — wf27 should spawn a Cowork Dispatch task per captured family voice, with the sender + text + source + deep-link payload.
4. **Formalize the 60-second latency SLA** for family-voice senders and add it to PERPETUAL-PIPELINE-HEALTH.
5. **Update all scheduled task prompts** to include the chat-and-feedback scan as a standard first step. (Done 2026-06-01 evening for the 3 new tasks; 7am task still pending.)

## Cost of not building this

Every family voice that arrives between batch digests is invisible to Claude. The AI Foundation cannot operate on what it cannot see. Family members lose trust in the system because it does not acknowledge them at human-conversation latency.

## Cost of building this

wf08 config tweak + wf27 bind mount fix + a Cowork-callable webhook. Maybe 4-6 focused hours. The leverage is massive — every future family-input surface inherits the pattern.
