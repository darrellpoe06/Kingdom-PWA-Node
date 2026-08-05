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
