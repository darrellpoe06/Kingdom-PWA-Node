# DR-0113 — Build visibility lives in the app from day one: every build project gets a live board in Projects → Boards at kickoff

- **Status:** accepted
- **Tier:** n/a (a way — how we work; it constrains process, it does not itself ship a user surface)
- **Scope:** every build project the team starts (family, church, business verticals, platform work); the Projects → ▦ Boards surface
- **Date:** 2026-07-07
- **Principles:** APP-IS-PRIMARY, WAYS-REVIEW, VERIFICATION-DOCTRINE, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, mid-kickoff of the Moore Divahs business system (his sister Shay's fashion business): *"Where can I see this building in the PoeTech App which tab shows this project?"* — and, on the answer (the Projects tab's Boards, where the other build programs already live, but with no Moore Divahs board yet): *"Add this to our Ways and documentation."*

The gap the question exposed: the agent had discovery, architecture, and a build plan — in chat and in a session note — but **nothing visible inside the app**. The principal had no in-app place to watch the project he had just commissioned. That is the exact failure class DR-0065 (the app is the primary artifact) names: the work existed everywhere except the place the family actually lives.

## Decision

**When a build project starts, its build board starts with it.** Concretely:

1. **A live board in Projects → ▦ Boards is part of PROJECT KICKOFF, not polish.** The same session that captures a new project's discovery/spec also lands a board for it (a `SEED_BOARDS` spec in `app/src/lib/board.js`, or live `board_tasks` rows) so the principal can open the app and see the project, its pieces, and their state — from day one.
2. **Statuses are honest (DR-0076).** `done` only where verifiably shipped; everything else `not-started` / `in-progress` / `blocked`. A kickoff board is mostly not-started — that is the truthful picture, and it is better than an invisible project.
3. **Ownership follows least-human.** Build items the system can do are owned by Ari; a human owns only what genuinely needs a human (a credential, a real-world step, a decision) — per the board's standing ownership rule.
4. **The board is maintained as the work lands.** Each shipped increment flips its item in the same session that ships it (the board is a live view of real state, never a painted plan — Reality-Trace / DR-0061). A board left stale is the same failure re-created.
5. **Where the answer to "where can I see it?" is a tab that doesn't exist yet, the build board IS the answer until the surface lands** — the project is watchable in Boards before its own tab exists.

**Practiced immediately:** the `board-moore-divahs` build board ships with this DR (Projects → ▦ Boards → "Moore Divahs — business system"), carrying the full build plan from the 2026-07-07 discovery spec (`docs/99-session-notes/2026-07-07-moore-divahs-business-system-discovery.md`) with honest statuses — discovery done; engine, tables, tab, classes, KPIs, and the branded front door not-started.

## Consequences

- Kickoff of any future project (a new vertical, a church program, a family system) includes a board landing in the same first PR as its spec. "Where can I see this building?" should never again need to be asked — the answer is standing: **Projects → ▦ Boards**.
- The ways-review (DR-0108) checks this as part of its pass: any in-flight project without a live board is a finding.
- The Moore Divahs project is the first project born under this way.
