# DR-1111: The system understood whole — eleven parts, a change log that can be re-run, and prudent evaluation over all of it

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one foundation standard, one session ledger, one read-only script with its test)
**Type:** governance
**Area:**
- `docs/00-foundations/_root/SYSTEM-UNDERSTANDING-STANDARD.md` (new; routed from `docs/CONTEXT.md`)
- `docs/99-session-notes/2026-10-19-the-system-inside-and-out.md` (its first application)
- `scripts/system-change-log.mjs` and `app/src/__tests__/system-change-log.test.js` (new)

**Amends:** nothing. It stands beside `COMPREHENSIVE-REVIEW-STANDARD.md` (DR-0239), which reviews a surface. This standard frames the system around the surfaces. Grounds: DR-0076 (verification), DR-0236 (findings are work), DR-0108 (review our ways), DR-0622 (continuity).
**Declared by:** Darrell, 2026-10-19, across six messages:
1. "Comprehensive understanding of the system..."
2. "What is outside of the 10 dimensions... give me the full understanding of the system"
3. "Inside and out..."
4. "Comprehensive meaning whatever we have currently... what changed and when exactly like logs... and also the ability to reverse any undermining processes because every system is interdependent... and our overall system goals so the vision is clear and we alignment is very effective and deliberate and intuitive"
5. "Standard code and sequences and jobs and workflows and critical paths wrapped with a systemic incentive structure and foundation placeholders for allowing flexibility in the development process for all necessary factors..."
6. "Prudent evaluations"

---

## Context

The ten review dimensions ask whether a surface does what it should. They do not ask:
- whether the instruments that watch the system tell the truth;
- whether a change can be undone, or what a change touches;
- whether the goals have live measures.

Darrell named those things himself, one message at a time. This record makes his list a standard, so the next review starts from it rather than rediscovering it.

## What was measured

- **Five read-only traces** were made: transport and NAS, data and flow, delivery and witnesses, goals, and reversal. Each one is cited to `file:line`. Samples of every trace were re-read in code before they were relayed:
  - the bell classifier and the relay's 200;
  - the `NTFY_URL` unit and the compose port;
  - the `/voice` grep;
  - the proxy without a timeout;
  - three goal quotes;
  - deploy-freshness's 7.7% firing rate;
  - the README's backup line;
  - the auto-merge branch filter.
- **The change log** read 127 merged changes from 2026-10-12 to 2026-10-19. 22 of them carry a schema migration. Every changed path landed in a named layer, with none left in "other". The test asserts that over the last 60 merges.
- **One sentence of mine was corrected before shipping.** My first draft of `reversalOf` said deploy-freshness heals a missed deploy "within 5 min". The workflow's own measurement says its cron fires only 7.7% of the time, with gaps of up to 11.3 hours. The sentence now says "backstop", and the test pins that the old promise cannot return.
- **Proven to catch.** With the migration branch of `reversalOf` disabled, 2 of 8 cases fail; with it restored, all pass. The test now has 9 cases.

## Decision

- **A full understanding of the system has eleven parts:** goals, inside, outside, standards, critical paths, jobs, incentives, placeholders, change log, reversal and interdependency. It is evaluated prudently, by looking well, foreseeing and understanding the way (Proverbs 14:15; 22:3; 14:8), with an evidence grade on every claim.
- **The change log is generated, not written.** Main's squash history is the record. The script adds the layers each change touched, and how to reverse it in each one. It never calls a migration revertible.

## Impact

The ledger's findings, each of which goes into the work queue:
- **The sovereign database has no backup** (`infra/nas-supabase/README.md:105`). This is the largest risk to reversibility, and the next build.
- **There is no Cloudflare rollback,** and a revert made with GitHub's Revert button is ignored by the lane.
- **Goal G1, quality of life, has no live measure,** so the incentives reward correct process but not outcomes.
- **The 2026-10-09 sign-in unlock still points the bundle at the Funnel origin,** although its premise was disproven.
- **Six schedules have no kill-switch variable,** and the NAS fleet's documented `KILL_SWITCH` does nothing.

## Verification

- `system-change-log.test.js`: 9 cases, including the walk over real history and the two pins against promising an undo a layer cannot give.
- The 15 CI guard scripts and lint pass (the guards by exit code).
- `re-review: 2026-10-26`. That date is when site-health's one known-outage carve-out expires, and that carve-out is the false headline. By then:
  - the backup exists;
  - the change log names blast radius from the flow graph;
  - each goal in §0 has a live measure or a stated reason why not.
