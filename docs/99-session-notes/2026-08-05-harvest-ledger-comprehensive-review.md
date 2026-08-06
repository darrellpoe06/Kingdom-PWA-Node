# 2026-08-05 — Harvest Ledger comprehensive review (process, opportunities, constraints)

**Trigger:** Darrell's phone screenshot of Church → Harvest (858 videos, "avg 26%", a
success-green banner, two near-invisible stat numbers) + "Comprehensive review of the
process and opportunities and constraints."

**Standard:** DR-0239 / COMPREHENSIVE-REVIEW-STANDARD.md — all seven dimensions run,
results below. Findings land in exactly two states (DONE with evidence, or CARRIED by a
named system).

## The headline (measured, not claimed)

The harvest process was **stalled for a month and the surface hid it.** Real state,
queried live 2026-08-05 (Supabase prod):

- 858 `choir_sermons` with a video; **81 transcripts with real text** (137 rows; 56 are
  empty no-caption markers) → **9.4% transcribed**
- **0 rows in `video_harvests`** — no steward has ever recorded a manual harvest
- Last transcript landed **2026-07-06 04:32 UTC**; last ops command **2026-07-06 01:14**
- `transcript-backfill.yml` last ran **2026-07-11 — failure** (4 of 5 lifetime runs
  failed; run #5 log: all 50 fetch attempts `RequestBlocked` — YouTube blocks
  GitHub-hosted runner IPs; no proxy secrets set)
- Meanwhile the corpus grew ~135 → 858 (channel backfill, manifest 2026-08-03), so the
  transcript gap widened while the pipeline sat parked

The avg-26% floor is exactly the row-derived harvests (message/scripture/songs/events)
with almost no transcript-derived harvests lighting — the "un-freeze" shipped in code
but its fuel line was never put on a clock.

## The seven dimensions

**1. SHOULD/ARE (DR-0219).**
- SHOULD: "No video lost — every video mined into many harvests"
  (`app/src/lib/video-harvest.js:4-6`); transcripts auto-sourced from YouTube captions
  (`video-harvest.js:20-25`); the stall signal shown on the surface
  (`app/src/lib/harvest-ledger.js:94-96` — "Never a silent hang: the surface shows it").
- ARE: transcripts required a human to press "Fetch next transcripts" (last pressed
  2026-07-06); `transcribedVideos` was fetched by the wiring and **never rendered** by
  `HarvestLedger.jsx`; the CI fallback is IP-blocked by design of GitHub's runners.
- GAPS → CLOSED this session (see work queue below).

**2. JOURNEY WALKS.** Steward-on-phone (the screenshot's own journey): opens Harvest →
reads a green "every ingested recording has been mined" over 0/858-fully-harvested →
correctly concludes nothing needs doing. The surface itself taught the stall. Walked;
finding closed via the three-state banner. Congregant/choir-member read path: unchanged,
read-only, fine.

**3. SURFACE-SAYS-TRUTH.** The banner claimed "has been mined" (past tense, success
green) while avg coverage was 26% and the pipeline was dead — a first-rank defect per
the standard. CLOSED: `ledgerBanner()` (pure, tested) — red when orphans exist, **amber
"every recording has begun mining · N still owe harvests" while owed**, green only when
every video is fully mined; sub-line now carries `transcribed N/M`.

**4. FORM-FACTOR SWEEP (measured on the real phone render).** Two midnight-theme
legibility breaks photographed: the neutral stat values (`858`) inline-dark on a
theme-remapped dark card (~invisible), and the Corpus Wholeness strip's inline cream
background under class-remapped light text (washed out). Root class: **mixed inline/class
theming pairs** — inline styles never remap, class tokens do. CLOSED: stat values ride
class tokens; the wholeness strip rides class tokens throughout; the banner keeps
inline-on-inline pairs. The standing `legibility-guard` gate CAUGHT the first fix attempt
(inline `#5A5751` sub-line, 2.56:1) — the gate works; fix conformed to it and
`legibility-health.json` regenerated. Chip-row wrap ("CUSTOM" on its own line) and the
floating FEEDBACK button overlapping the count line are cosmetic, global-chrome classes
carried by the standing layout probe + surface-audit loop.

**5. DELIVERY-CONTEXT + DR-0108 CAPABILITY RE-SYNC.** The "his hand" challenge run:
- CI runners: IP-blocked by YouTube (proven in run #5's log) — not a channel for this.
- Residential proxy secrets: a dashboard-click + paid-service decision — carried as an
  optional lever, not required.
- **The NAS residential IP works** (81 transcripts fetched 07-05/06 prove it), and the
  house already has a zero-hands activation channel: the **services-sync clock**
  (choir-dates + funnel-watchdog precedent — "zero new DSM entries"). The crontab path
  needs password-sudo by design; the services.json rider needs **no hands at all**.
  Merge = deploy = the trickle starts on the NAS's own clock.

**6. FINDINGS ARE A WORK QUEUE — all DONE or CARRIED this session:**
| Finding | State |
|---|---|
| Transcript pipeline parked on a manual button (waiting-by-default, DR-0247 class) | **DONE** — `transcript-trickle` services.json rider (stamp-gated ~8×4/day from the NAS IP) + `transcript-backfill` nas-loops registry entry; brakes pinned in tests |
| Banner over-claims success at 26% | **DONE** — `ledgerBanner()` three honest states + truth tests |
| Stall signal fetched but never rendered | **DONE** — "Transcribed" stat + banner sub-line |
| Midnight contrast: stat values + wholeness strip | **DONE** — class-token theming; legibility health regenerated |
| CI backfill red without proxy | **CARRIED** — documented in the workflow header; optional Webshare/YT_PROXY secrets remain the lever if the NAS path ever loses its IP; the NAS trickle makes it non-blocking |
| Chip-wrap + floating-button overlap (cosmetic, global chrome) | **CARRIED** — chrome-layout-probe (CI) + surface-audit loop own the class |
| 0 rows in `video_harvests` (stewards have never recorded a manual harvest) | **CARRIED** — the amber banner + owed-harvest rows now surface the debt honestly; evidence-derived signals keep climbing without steward input |

**7. GATE-THE-CLASS.** New pins added: `ledgerBanner` truth tests (green only when
truly done — the false-victory class); `nas-loops.test.js` pins the transcript-backfill
loop enabled + braked + trickle-paced (the fuel-line-off-the-clock class);
services-sync-guard already gates the manifest entry (installer exists, brakes present).
The legibility-guard gate already existed and proved itself mid-session.

## Opportunities (beyond this session's closes)

1. **Watch the trickle land** — transcribed count should move within ~a day of merge;
   the Harvest Ledger's new stat is the witness. If it doesn't move, the reel + ntfy
   red is the alarm (exit-3 all-blocked runs).
2. **LLM deepening pass** — the transcript-derived harvests light as 'partial'
   (heuristic extractors). Once transcripts drain, a bounded AI pass over the same
   corpus (cap-resume gate, Tier C) could complete lessons/discernment/testimony/trivia.
3. **Steward 'na' sweeps** — Wednesday studies with no songs will never hit 100% until
   marked 'na'; a one-tap "no songs this service" sweep would let fully-mined turn true
   honestly.
4. **Residential proxy secrets** (optional) — would revive the CI path as a second
   fetch lane; only worth it if the NAS IP ever gets blocked for good.

## Constraints (named, honest)

- **YouTube IP policy** governs the whole fetch side: GH runners are hard-blocked;
  even the NAS must sip (~50-in-a-burst got it blocked 2026-07-03). The trickle pace is
  a constraint-shaped design, not a preference.
- **Caption availability**: some videos genuinely have none (4 confirmed no-caption
  verdicts so far); Whisper-on-NAS remains the fallback for those.
- **The 480s per-installer timeout** inside services-sync bounds each trickle fire —
  the 4-video sip fits with wide margin.
- **The sandbox has no NAS route** (P18) — activation rides committed records
  (registry/manifest) + the NAS's own clock, which is exactly the DR-0247 design.

## Addendum (same day) — the Ways pass run fully, deltas found

Darrell asked: *"did you actually review the Ways and documentation fully?"* Honest
answer at that moment: no — the code path and standards were read; the REV registry,
the DR index for prior harvest decisions, and DR-0108's full text were not. The full
pass was then run. What it changed:

1. **The stall had recorded, dated warnings that lapsed unwatched.** REV-0008
   (2026-07-06) ranked "arm the NAS runner" (re-review 2026-07-13) and "arm the
   hourly schedule" (re-review 2026-07-20); DR-0145 §4 routed the same arming as a
   standing Tier-C decision with re-review 2026-07-17; DR-0178 had already corrected
   the identical "Harvest lanes left inert" answer once before. This session's
   trickle rider is the execution of those lapsed decisions — by DR-0247 machinery
   (armed-by-record on the services-sync clock) instead of another date.
2. **A measured constraint applied:** the NAS residential IP blocks after ~180
   requests/day (REV-0008, LESSONS P22/P23). The trickle's ~32/day is sized well
   under it — previously justified only by the burst incident.
3. **Conformance gap closed:** DR-0108 requires a ways review to land as an
   `orchestration` REV record, not only a session note — REV-0241 now records this
   review in the registry the in-app panel reads.
4. **Carried opportunities inherited, not re-invented:** REV-0008's still-open items
   keep their identities and dates — last-mile consumers (2026-08-15), LLM deepening
   partial→complete (2026-08-15), multi-platform corpus join (2026-09-01).

---

## 2026-08-06 — the Ways pass run FULLY, and what it found in this review itself

Darrell: *"did you actually review the Ways and documentation fully... do it..."*
The honest answer was **no** — the 08-05 pass read the harvest code and the review
standard, but not the review registry, the decision ledger, DR-0108's own text, or
the enforcement machinery. Five parallel readers then covered all of it. The deeper
pass found that **the fix shipped on 08-05 had re-created the very failure class it
set out to end**, and that the real root cause had never been touched.

**The root cause of the month-long silence (not the parked button — that was the
proximate cause):** every alarm lived *on the NAS*.
- `scripts/harvest-stall-guard.mjs` is real and correct but **wired to nothing** —
  it reads `scripts/out/harvest-progress.jsonl`, a gitignored path no live code
  writes, so it always takes its "no snapshot log yet" branch and exits 0.
- The loop reel's ntfy fires on `loop_fail` — which requires the loop to *run*. A
  powered-down or de-tailnetted NAS emits nothing at all.
- The announce relay is itself a Funnel URL **on the NAS**. NAS down ⇒ bell down,
  by construction. The watchdog died with the host.
- So my 08-05 claim that "the reel + ntfy red is the alarm" was **false**. Corrected
  here, in REV-0241, and in the PR record.

**Defects found in the 08-05 work, all fixed 08-06, each proven-to-catch by
reverting the fix and watching the gate fail:**

| Defect | Why it mattered | Fix |
|---|---|---|
| The loader's auto-pause was a human-cleared kill-switch whose only documented clear path routes through `ops-runner.py`, which **no enabled service installs** | Three blocked runs would have stopped the drain **permanently and silently** — the exact stall this lane exists to end; a DR-0248 violation | Time-decayed backoff that clears itself after 24h; a gate forbids any stop-path naming an uninstalled runner |
| Every PostgREST read unpaged; PostgREST silently caps at 1000 rows | At 858 videos and growing, a truncated `existing_state` makes loaded videos look unloaded — every run re-fetches the same head and burns its whole budget, a permanent phantom gap with no error | Paged reads with a stable total order; pinned |
| The rider was registered **last** of seven installers under one tree-wide timeout | A docker pull or the choir-dates drain could SIGKILL it before it ever ran — silently, with the cycle green | Registered **first**; pinned |
| The duplicate `transcript-backfill` registry loop shipped `enabled: true` with no clock | Green while nothing fired it; if ever clocked it would add ~64 videos/day on top of the rider's ~32, past the measured ~180/day ceiling | `enabled:false` with recorded why + dated revisit; my own earlier test that asserted the fake-green is corrected |
| Pace stated in the wrong unit | ~32 videos/day is ~64–96 HTTP calls — roughly **half** the ~180/day ceiling, not a fifth | Corrected everywhere stated |
| `--start-jitter` existed, recommended by the loader's own docstring, never passed | A fixed-time daily pattern is easier to block | Passed |

**The instrument that was missing, now built:** `.github/workflows/harvest-health.yml`
— a 6-hourly, read-only probe of transcript coverage and freshness that runs **on a
GitHub runner, outside the NAS failure domain**, measures the *outcome* (so it
catches the stall whatever the cause), files the rolling `incident` issue, and
**fails its own run** so the signal exists without anyone opening the app. Ships
active. This executes DR-0135's lapsed 2026-07-31 data-plane-probe commitment — the
instrument that, had it existed, would have announced this stall on day two.

**Recorded:** REV-0242 (the ways review, with all five DR-0108 questions answered),
REV-0241 corrected from `addressed` to `logged` with an honest title, and **DR-0277**
— the decision the 08-05 session should have written and did not.
