# 2026-10-18 — The research road: Vane comes home (DR-1101)

**What changed.** The first of the ten tools Darrell sent (DR-1099) is built to run on the NAS:
- Vane (slim, pinned) answers a question by searching the web through our own SearxNG and our own Ollama, and returns the sources.
- `research_forwarder.py` is the only door, on `/research`, behind the family key. It serves `/health` and `/ask` and nothing else, because Vane has no login.
- `infra/nas-research/install.sh` self-deploys it through services-sync.
- `research-health.yml` asks one question a day and keeps an incident ledger.
- The "Try Vane" panel on the Infra Plan lets Darrell ask it from the app.

**Why.** Darrell asked when the repos would be "operational and test ready for me to use them and see their capabilities". DR-1099 named Vane's next step precisely, and every part of it could be built and verified here (DR-0236).

**How it was kept true.**
- Read from the source at the pin: no login (so a door, not a proxy), the single image's passwordless sudo (so the slim image), and environment-seeded providers (so no setup screen).
- Both images are pinned by digest and bound to 127.0.0.1.
- The forwarder's selftest has 38 checks and was proven to catch a door that accepts a wrong key and a `javascript:` source.
- The app's test has 15 checks and pins the mirrored caps and the whole wiring.
- The transport, routing and flow-graph gates are all green.

**Still open.**
- When it goes live depends on the NAS running the installer and the right tower's models being reachable. Until then the panel says "Not ready" with the NAS's own reason.
- No lesson reads from it yet. That waits on a live pass and a gate for sourced claims.

**Re-review:** 2026-10-25.
