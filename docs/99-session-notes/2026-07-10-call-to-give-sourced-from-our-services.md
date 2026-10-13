# The Call to Give, sourced from our own services — and the transcript question answered

> Layer 4 working artifact. Companion to **DR-0134** and REV-0025; sibling of the same-day own-door strategy (DR-0133). Trigger, Darrell 2026-07-10, linking `https://www.youtube.com/live/efj-t2_Z-nI`: *"Can you also source all of the Call-To-Give's from the same YouTube and documents sources we have? Add the historically — and all the videos should be able to get the transcripts from our videos now, correct?"*

## What was actually true (verified)

- **"Call to Give" existed nowhere in the platform** — zero matches repo-wide. Net-new, built on the proven choir-archive derived recipe.
- **The corpus already exists:** the `choir_sermons` spine carries the service videos (the 335-video @TheLoveCorner backfill, of which 125 had parseable dates, plus the email importers' rows). Nothing needed re-scraping.
- **The transcript store is LIVE** (`video_transcripts`, migration 0058) and the app already reads it (sermon library points, Harvest ledger). Two loaders feed it: the NAS caption loader — real, manual, three-braked, running as a trickle because **YouTube IP-blocks bulk pulls at ~50–180 fetches** (documented in `load-transcripts.py`) — and the passive sovereign Whisper GPU endpoint for caption-less videos.
- **The sandbox has no YouTube route** — CONNECT 403 verified on the video page, the oEmbed endpoint, and curl. The linked video is recorded by its real id (`efj-t2_Z-nI`) with metadata honestly pending the NAS-side fetch.

## The answer to "correct?"

**Yes — every service video CAN get a transcript, and the pace is stated honestly:** the store is live, the caption loader fills it as a human-armed trickle (the three-brakes law holds; never an unattended fleet — the 2026-06-06 lesson), and Whisper covers the caption-less remainder on demand. The Give panel now carries this answer as a dated, provenance-carrying note **beside the measured coverage strip** (corpus / transcribed / detected / awaiting), so the question always has a live readout instead of a remembered claim.

## What shipped (DR-0134)

1. `lib/call-to-give.js` — the deterministic, conservative detector (support cues alone never claim an appeal; every detection `needsReview: true`), the archive builder attributed to the one corpus, and measured coverage with the honest denominator.
2. `lib/call-to-give-sync.js` — one fetch over the existing member-scoped rows; degrades to empty on RLS-deny, never throws.
3. The archive rendered inside the existing Give panel (`ChurchGiving.jsx`) — combine what makes sense: one giving surface — with honest signed-out, awaiting-transcript, and none-detected states.
4. Ari's `call-to-give` standing duty + the DR-0134 note in his derived record; REV-0025 in the Ways registry.
5. Proven-to-catch tests: the detector refusing support-cues-alone, attribution-not-invention, awaiting never reading detected, coverage never NaN.

## Opportunities (dated) and constraints — recorded in DR-0134

Persist confirmed segments + `content_sources` registration (`re-review: 2026-07-24`); arm the watched trickle loader (`re-review: 2026-07-24`); generalize the recipe to altar call / announcements (`re-review: 2026-08-07`). Constraints carried: no sandbox YouTube route; YouTube rate-limits bulk caption pulls; transcripts are untimestamped today so segments link to the video, not into its timeline.
