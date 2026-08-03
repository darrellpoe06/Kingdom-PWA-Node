---
id: DR-0267
title: The Love Corner corpus lists EVERY channel tab (streams included) and refreshes itself on schedule; the harvest stays source-not-download
date: 2026-08-03
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [church]
grounds: [VERIFICATION-DOCTRINE, DETERMINISTIC-FIRST, SPEC-CONFORMANCE-REVIEW, PERPETUAL-IMPROVEMENT, WAYS-REVIEW]
source: 2026-08-03 comprehensive harvest-process review (REV-0227), triggered by Darrell — "have we updated all the Love Corner videos ... BG should have double the number of videos currently inside the Love Corner App"
---

## Context

Measured (not assumed): the live corpus held 387 `choir_sermons` rows (386 visible via `theword_public_sermons()` — the app hides nothing), but NOTHING had imported since the 2026-07-10 reconcile (~8 services missing), and every channel listing ever run used the `/videos` tab only. A channel that live-streams its services accumulates the service archive on the `/streams` tab — structurally invisible to the old listing, and the exact shape of BG's "double."

## Decision

1. **List every content tab.** `choir-youtube-backfill.mjs` defaults to `/videos` + `/streams`, deduped by video id; a failed `/videos` listing is an honest red; a failed `/streams` listing warns loudly and marks the run PARTIAL. The manifest records per-tab counts. (Shorts stay excluded — clips, not services; revisit only on evidence.)
2. **Freshness is armed by record.** `corpus-reconcile.yml` gains `schedule: Mon+Thu 16:00 UTC` (the mornings after the Sunday/Wednesday services). Its old "dispatch-only, a human arms each run" kill brake predated DR-0247 and had frozen the corpus for ~4 weeks; per DR-0247/DR-0248 the deterministic class carries budget + lock, and the stop-paths are a PR or the Actions toggle.
3. **The harvest stays SOURCE, not download** (Darrell 2026-06-14 standing rule). YT Zero (DR-0266) is the household's offline-viewing lane for followed channels; COLG ORIGINAL files come only through the owner-export path (YouTube Studio/Takeout — BG's/Darrell's own credential), never scraped through our tools.
4. **NOT decided here:** whether the streams tab in fact doubles the corpus — that is the first scheduled/dispatched run's MEASUREMENT, read from the regenerated manifest, not a claim made in advance (DR-0076 §8).

## Rationale

Because "have we updated all the videos?" must be answerable by an instrument, not a memory: the wholeness strip already compares live rows to the manifest — but a manifest generated from HALF the channel reads whole while blind, and a reconcile nobody dispatches reads current while frozen.

## Consequences

Twice-weekly runs regenerate the manifest, apply the idempotent backfill, and push manifest changes through the gated lane. `corpus-freshness-pins.test.js` fails any PR that drops the schedule or the streams tab (gate-the-class, proven-to-catch). A YouTube block on a runner shows as an honest red run; the NAS remains the fallback listing host.

## Links

REV-0227 · DR-0266 (YT Zero) · DR-0135 (corpus wholeness instrument) · DR-0247/DR-0248 (started-by-record; deterministic brakes) · `docs/99-session-notes/2026-06-23-research-review-body-study-to-course-materials-pipeline.md` §fallback (owner-export rule).
