# Orchestration review — how the work itself ran — 2026-07-05

**Mandate (Darrell):** "Orchestration review, how should we work and what needs
updated to have more efficient work look at my request today and review how we
did add to our historical reviews for quality and freshness to be consistent
and perpetual inside the PoeTech App."

This is a review of the WORK PROCESS, not the product: today's requests, measured
against the standing operating model (`ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md`
/ DR-0077), with every claim traced to a real artifact. It is recorded three ways
so it cannot go stale in one place: this note (Layer 4), record **REV-0006** in
`docs/reviews/REVIEWS.md` (the registry the app parses), and **DR-0102** (the
standing practice going forward).

## What ran today (measured, not recalled)

| When (CT) | PR | Size | What it was |
|---|---|---|---|
| 02:39 | #585 | 59 files, +3,939 / −180 | Live-data tabs audit + financial-math proof + 0077 sync rails + 1099 worker manager + camera registry |
| 04:15 | #586 | 3 files, +58 / −12 | Watchlist rail verified live cross-device + quote relay |
| 08:24 | #587 | 1 file, 1 line | Header tagline |

Context for scale: **2026-07-04 landed 43 merges** (small, focused lanes — the
TV Time build-out, the Scripture reader series, DR-0097–0100); **2026-07-05
landed 3**, one of which carried five workstreams. Both days shipped their
mandates with gates green. The difference in shape is the material for this
review.

## Scorecard against the operating model (DR-0077 / DR-0076 / DR-0075)

**KEPT — the model working as designed (with evidence):**

1. **Parallel lanes for discovery.** The #585 audit ran six parallel audit
   passes over all 39 registry surfaces plus every shell-mounted view — the
   DR-0077 fan-out used for what it is best at. Evidence: the method section of
   `2026-07-05-live-data-tabs-audit-and-timeline.md`.
2. **Adversarial classification with provenance.** Every rendered collection
   traced to file:line and classified LIVE / LOCAL-ONLY / STATIC / STATIC-BY-DESIGN
   / BUILDING per DR-0076 — no green without evidence.
3. **Proven-to-catch discipline held.** All four financial-math defects were
   fixed with tests first verified failing against the old code (DR-0076 §3).
4. **Nothing parked silently.** The 15-row timeline gives every not-yet-live item
   its why + owner + re-review date (DR-0075).
5. **Fail-soft shipping.** The seven 0077 rails shipped before the migration was
   applied and self-heal when it lands — code never blocked on ops.
6. **Small follow-up lanes worked.** #586 (verify the watchlist rail live
   cross-device) and #587 (one-line tagline) are exactly the right size — Tier A/B
   lanes that integrate in minutes.

**FRICTIONS → what gets updated (each with an action and a date):**

| # | Friction (evidence) | Update | Owner / lane | Re-review |
|---|---|---|---|---|
| 1 | **One 59-file PR carried five workstreams** (#585: audit + financial proof + 7 sync rails + 1099 manager + camera registry). One Tier-B soak covered five features; a defect in any one would have held all five. Contrast: 07-04's 43 small lanes. | **Discovery may batch; fixes integrate as separate lanes.** An audit is one lane of discovery — its report lands together, but the fixes it spawns integrate as small PRs in order, per DR-0077. Practice change, effective now. | agent (practice) | 2026-07-12 |
| 2 | **A migration unlock still ends in a manual paste for Darrell.** The 0077 timeline row 1 hands him a Supabase-Studio SQL paste while the `db-migrate` lane exists (merge = migrate, memory `project_db_migrations_auto_lane`). The note names it "db-migrate gap" but not the CAUSE — whether the family instance is the NAS database the lane does not reach, or the cloud `SUPABASE_DB_URL` secret path. This is the exact "you keep guessing" class from 2026-07-04. | **Name the cause, then close it**: verify which database the family instance uses and whether the lane ran on the #585 merge; if the gap is the NAS instance, a NAS-side apply loop (P18 local-agent pattern, ships inert behind the three brakes) makes merge = migrate everywhere. | agent + Darrell (one verification question) | 2026-07-12 |
| 3 | **The review registry itself went stale.** `docs/reviews/REVIEWS.md` last record: REV-0005, 2026-06-15 — 20 days without a review record while ~200 merges landed. A freshness practice that depends on remembering is not perpetual. | **The registry now polices its own freshness in-app** (this session's build): the Quality / Proof Reviews panel shows days-since-last-review and flips to attention past 7 days. Reviews append per working day per DR-0102. | shipped this session | 2026-07-26 |
| 4 | **The daily-review workflow's leverage note is frozen text** (`.github/workflows/daily-review.yml` cites 2026-06-13 findings and W1–W4 as current). A "review" that reports stale leverage is itself a freshness failure. The schedule also remains deliberately commented out (three-brakes — that part is correct). | Re-point the leverage step at maintained sources (the concerns board artifact / interconnect manifest) or drop the hardcoded note; keep ship-inactive discipline. | agent, next infra lane | 2026-07-19 |

## How should we work — the standing answer

The model is already declared (DR-0077) and today proved both its halves; the
update is discipline at the seams, not a new model:

1. **Parallel lanes for discovery and independent builds; one orchestrator
   integrating small PRs in order.** 07-04's 43-lane day and 07-05's six-pass
   audit are both correct uses. The seam to hold: a discovery lane's FIXES go
   back out as small lanes (friction 1).
2. **Verification stays sovereign and per-lane** — `npm run verify` green before
   "done," gates over claims, proven-to-catch for every new failure class. This
   held today; keep it.
3. **No manual ops step survives where a lane exists** — merge = migrate,
   merge = deploy. Every hand-paste left is a named gap with a closing action
   (friction 2). Drive, don't delegate applies to infrastructure seams too.
4. **The work reviews itself on the same cadence it ships.** A working day that
   merges to `main` appends its orchestration REV record; the app measures the
   registry's freshness and says so when it goes stale (DR-0102). Review of the
   work is now a surface, not a memory.

## Where this review lives from now on (the perpetual loop)

- **The record:** one `### REV-NNNN` block with `Type: orchestration` appended to
  `docs/reviews/REVIEWS.md` per reviewed working day — kept/frictions→actions,
  each action with a re-review date (DR-0075).
- **The surface:** the app's Quality / Proof → Reviews panel (governor-gated)
  renders the registry at build time (`__UIUX_REVIEWS__`) and now shows the
  measured freshness verdict beside it — fresh within 7 days, attention beyond.
- **The rule:** DR-0102. Consistency is the schema; freshness is measured, not
  promised; perpetuity is the in-app chip that shames a stale registry.

## Gates run this session

eslint 0-warnings + full vitest (`npm run verify`) on the branch, including the
new proven-to-catch freshness tests (stale date → attention; fresh date → good;
undated/empty → idle, never green; missing clock → idle). Results in the PR.

Proof the gates guard the gate-builders too: the first verify run of this very
session FAILED — the consistency guard (DR-0079) caught a new emoji-as-icon this
review's own panel change tried to add, and the label shipped as plain text
instead. Gates over claims, applied to the reviewer.
