# DR-1065: The sweep runs itself — the producer was written months ago and never clocked

**Date:** 2026-10-16
**Status:** accepted
**Tier:** C (a deterministic NAS loop that writes to the church's database on a 15-minute clock)
**Type:** word
**Area:**
- `infra/nas-sme-pipeline/worship-song-harvest.py` (the budget brake, a selftest, and the discarded exit code)
- `infra/church-media-golive/worship_song_harvest_install.sh` (new — the rider)
- `infra/nas-loops/services.json` (registered beside `choir-dates` and `stream-length`)
- `.github/workflows/ci.yml` (the selftest gates merge)

**Grounds:** Darrell, 2026-10-16, over the Songbook's own readout of 920 services with 915 still to sweep: **"What?!!!!! Fix it!!!! Make sure humans have to do nothing if possible... just get all of them... we already have it dont we?!!!"**
**Principles:** DR-0247 (agreed work starts itself through the lane); DR-0248 (the deterministic class carries budget + lock); DR-0076 §3 (proven-to-catch / anti-theatre); DR-0277 (a loop that is enabled but unclocked reads green while nothing runs)

## Context

The Songbook carries a sweep readout: of the service videos the church already
holds, how many have had their songs harvested. It read 920 services with 915
still to sweep. Darrell saw that number and asked why, given the capability
was supposed to already exist and humans were supposed to do nothing.

## What was measured: "we already have it, don't we?" -- yes, and that is the finding

**The producer was written months ago and was never given a clock.**
`infra/nas-sme-pipeline/worship-song-harvest.py` is 279 lines of pure Python —
no LLM, grounded drafts only, idempotent against its own previous output. It
appeared **nowhere outside its own folder**:

| | |
|---|---|
| `infra/nas-loops/registry.json` | 6 loops. Not one of them. |
| `infra/nas-loops/services.json` | 21 riders on the armed clock. Not one of them. |
| `.github/workflows/` | nothing matching `reperto`/`choir`/`song`/`sme`. |

So the only way it ever ran was **a person opening an SSH session and typing
it**, then pasting its output into a textarea in the Songbook. 915 services sat
unswept because nothing swept them. That is exactly the *"humans have to do
nothing"* failure he named, and the capability really was already built.

**One thing I checked rather than claimed.** My first reading was that
`transcript-backfill` being `enabled: false` was a second stacked gap — the
harvest reads `video_transcripts`, after all. It is not: that loop is disabled
**by record**, with a measured reason (the live path is the transcript-trickle
rider on the same armed clock, and arming both would put the pair over the
measured ~180/day `IpBlocked` ceiling). The transcripts are arriving. Only the
harvest had no road.

## Decision

**It rides the already-armed services-sync clock** — the same road
`choir-dates` and `stream-length` take, and for the same reason: it reads
`video_transcripts` and writes `choir_songs` through the sovereign Supabase on
the tailnet, with a secret that lives at `/volume1/PoeTech/secrets/supabase.json`
and never leaves the NAS. A GitHub runner cannot do this work.

**25 services and 240 seconds per 15-minute cycle, newest first.** Each new
Sunday is swept on the first cycle after its row exists; the 915 standing
services drain behind it in roughly ten hours; every cycle after that is one
read of the database and nothing else.

**Nothing becomes trusted by running it.** Every row is
`source='harvest-transcript'`, `needs_review=true`, confidence low or medium,
and carries the **verbatim phrase it was heard in**. The steward still confirms
every song — they just correct a grounded draft instead of facing 915 blank
services. Re-runs dedupe per video and per title against drafts already
written.

## Brakes (DR-0248, the deterministic class)

- **Budget — new, and the only brake that was missing.** `--chunk` and
  `--time-budget`, checked **before** starting a service rather than after
  finishing one: a run that starts work it cannot finish inside the runner's
  timeout gets killed mid-insert, and a killed insert is the one way this
  otherwise-idempotent script could do harm. `0` means no cap, so the by-hand
  invocation behaves exactly as it always did.
- **Lock and outer timeout** — the nas-loops runner, unchanged.
- No kill-switch by record: this class carries budget and lock, and the
  merge-gating selftest is the protection.

## Verification

- **10 selftest cases**, split between the brake and the groundedness the
  harvester exists for: every draft's evidence phrase must really appear in the
  text it was given, silence yields nothing, and ordinary preaching yields
  nothing.
- **Proven to catch, by two mutations:** disabling the chunk brake → 8/10;
  inventing a song from silence → 9/10. Both reverted, 10/10 after each.
- **AND THOSE TWO MUTATIONS FOUND A WORSE BUG THAN THE ONE THEY WERE TESTING.**
  The selftest printed `FAIL` and **exited 0**: `main()` returned the code and
  `if __name__ == "__main__": main()` discarded it. Wired into CI unchanged,
  that is a merge gate that can never fail — which is worse than no gate,
  because it reads green (DR-0076 §3). Now `sys.exit(main() or 0)`, and
  re-proven: clean → 0, brake disabled → **1**, restored → 0. **This is the
  whole argument for running a mutation instead of reading the file.**
- `sh -n` on the installer; `ci.yml` parsed as YAML (16 jobs); the
  `services.json` rewrite verified to add **6 lines and nothing else**, 21 → 22
  services with every other entry byte-identical.
- workflow-list-order, infra-transport and his-hand guards green.

## What this does not do

- **It does not remove the paste box.** The Songbook's `repertoire.json` import
  stays: the SME pipeline's transcription extract is a richer source than the
  hook-matcher (timestamps, per-song confidence, `source_quote`), and a steward
  with a better extract should still be able to bring it. The rider means
  nobody *has* to.
- **It does not raise the extractor's reach.** The harvester matches
  distinctive, song-unique lyric hooks; services whose songs are not in
  `REPERTOIRE`, or whose transcript lost the singing, still yield nothing.
  Honest and empty beats confident and invented. The coverage this actually
  achieves is a real number nobody has yet, and it will be readable off the
  Songbook's own sweep readout within a day of this merging.
  **`re-review: 2026-10-18`** — read the real coverage, and grow the hook list
  from what the stewards correct.
- **It does not run until this merges and the NAS syncs**, which is the
  services-sync manifest's own job (DR-0247, armed by record).
