# DR-0092 — Human-proof firm-up: per-surface crash containment, the error journal, and full-registry dead-end guarantees

- **Status:** accepted
- **Tier:** B (structural resilience in the mount layer + a new watching subsystem; rides the DR-0091 branch preview soak)
- **Scope:** every surface mounted through the registry; every uncaught runtime error; the whole nav registry
- **Date:** 2026-07-03
- **Principles:** VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, LESSONS-LEARNED, DECISION-RECORDS

## Directive

Darrell, 2026-07-03: "fix or firm up this app so humans can't break it or expose it or make it fail, verifying all loops that go to whatever page never goes to a dead end, and make sure it has proactive error correcting algorithms so qualitative and quantitative errors are minor because of our procedures and experience."

## What the recon found (characterize before change, DR-0076)

- An app-wide ErrorBoundary existed, but it replaces the WHOLE screen; SectionBoundary contained only the Books area. A render throw in any of the other ~35 registered surfaces white-carded the entire app (the 2026-06-25 Books>Tx class, contained in one place instead of structurally).
- No global error capture existed anywhere — no `window.onerror`, no `unhandledrejection` handler, no error journal. A runtime failure's whole life was one console line (the P3/P5 outcome-observability gap).
- Dead-end reachability was asserted for TOP-LEVEL surfaces only, and only by the surface-audit CLI step in CI; nothing in the vitest suite bound the real registry to the real shell, and church/books sub-surfaces were a documented hole.
- Real self-healing already existed and is kept as-is: chunk-reload-heal (reload-once on deploy skew, loop-guarded), auth refresh-before-logout, SW zero-click update, feedback degrading-payload retry, table-sync reconnect refetch.

## Decision

1. **Containment at the mount layer** (`lib/surface-boundary.jsx` + `surfaces.js`): every registry surface is wrapped `withSurfaceBoundary(lazy(load), label)` — one broken surface degrades to one inline recover-card (Try again / Reload); the nav and every other tab keep working. Lives in `lib/` because the registry is core and the boundary law forbids it a static `components/` import. Navigating away unmounts the branch, so a return visit gets a fresh boundary.
2. **The error journal** (`lib/error-journal.js`): capped, device-local (localStorage — the user's own diagnostic data, nothing egresses), dedupe-by-repeat (a recurring error bumps a count; the repeat is the signal). Fed by the new boundary, both existing boundaries, and a global `error` + `unhandledrejection` capture installed at boot. The watcher can never throw (DR-0083 posture: observing never breaks the observed).
3. **Surfaced beside the other numbers**: a "Runtime errors (this device)" row on the Quality & Throughput board (DR-0091) — recent-24h drives the status dot; the last real error shows with its source. Honest scope stated on the row: device-local.
4. **Full-registry dead-end guarantee** (`surface-mount-integrity.test.js`): the vitest suite now binds the REAL `SURFACES` registry to the REAL shell for all three nav kinds — top-level AND church/books subs (closing the documented audit limitation) — with a proven-to-catch fabricated-surface check. Zero dead ends found at adoption.

## Not done, with why (DR-0075)

- No generic retry/backoff primitive: no live call site needs one today (fetch failures already degrade to honest empties; the bespoke heals cover the real failure classes). Adding an unused primitive is dead code. **re-review: when the journal shows a recurring transient-fetch error class (the journal is now the detector).**
- No auto-retry on render errors: a render throw is deterministic in the common case; an automatic re-render loop would spin. Chunk-load failures (the transient class) already heal upstream. User-driven Try again is the honest recovery.
- Errors stay device-local, not synced to Supabase: syncing error text risks leaking PII embedded in messages (DATA-AS-EMPOWERMENT). **re-review: when a steward needs fleet-wide error visibility — design a scrubbed, opt-in channel then.**

## Consequences

- A human can mash any tab, feed any surface malformed state, or hit a deploy-skewed chunk, and the blast radius is one inline card — recorded, recoverable, never a white screen.
- Failures now have memory: the steward sees what broke, where, how often, on the same board as every other quality number.
- A registered surface can never silently lose its render branch — the suite goes red, in addition to the CI audit step.
