# DR-0106 — The app is not static: review the comprehensive app on every change until the history solidifies

- **Status:** accepted
- **Tier:** n/a (working-discipline constraint; encoded in CLAUDE.md Layer 0)
- **Scope:** every change to the PoeTech PWA, until the institutional/historical understanding is solid
- **Date:** 2026-07-05
- **Principles:** REALITY-TRACE, ONE-APP-EVERYTHING-COMES-TOGETHER, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, DECISION-RECORDS

## Directive

Darrell, 2026-07-05:

> "make sure when things happen the PoeTech App is not static — review the comprehensive app every time until our historical understanding solidifies."

## Decision

**Treat the app as a living, interconnected whole on every change — not as the one file in front of you.** Before and while changing any surface, review across the comprehensive app for the connections and ripples the change touches, rather than optimizing a single file in isolation. This holds **until our historical/institutional understanding solidifies** — i.e., until the memory, decision records, and foundation docs have captured enough that the connections are reliably known without re-deriving them each time.

Concretely, on each change the agent:

1. **Names the ripples, not just the edit.** A surface is one end of a connection (BUSINESS-PROCESS-CONNECTIONS); before shipping, identify the other surfaces, shared libs, sync rails, and data that the change touches or that mirror it — and keep them consistent. This is the reality-trace (DR-0061) widened from "this surface + its data" to "this surface within the whole app."
2. **Re-reviews the comprehensive app, not a stale snapshot.** The app changes under us (other lanes merge, surfaces move). Read the live state before assuming last session's shape still holds; memories reflect what was true when written (CLAUDE.md), so verify the connection still exists.
3. **Feeds what it learns back into the history.** Each pass that discovers a connection records it (memory / DR / foundation doc) so the "comprehensive review" gets cheaper over time — that accumulation is exactly what "until our historical understanding solidifies" points at. The obligation relaxes for an area only once its history is solid.

## Why this is a standing constraint, not a one-off

It is the working posture behind the through-line already in Layer 0 — *everything in the workflows comes together inside this one app* (DR-0061/DR-0095), surfaces are live views of real flow (DR-0061), and the app is the primary artifact (DR-0065). Those say the app IS an interconnected whole; this says **act like it on every change** — the review is comprehensive by default, and staleness/siloed edits are the failure mode it prevents. Recorded so future sessions inherit it rather than re-learning it after a siloed change breaks a connection.
