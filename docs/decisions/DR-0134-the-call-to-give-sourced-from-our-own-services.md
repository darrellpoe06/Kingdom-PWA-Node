# DR-0134 — The Call to Give is sourced from our own services, historically, derived from the one corpus

- **Status:** accepted
- **Tier:** A/B (a derived archive over existing member-scoped rows inside the existing Give panel; no new data class, no public face changed)
- **Scope:** `lib/call-to-give.js` (the deterministic detector + archive + coverage), `lib/call-to-give-sync.js` (one fetch over the existing corpus + transcript rows), `components/ChurchGiving.jsx` (the archive rendered inside the Give panel), `lib/ari-notes.js` (the call-to-give standing duty), `__tests__/call-to-give.test.js`
- **Date:** 2026-07-10
- **Principles:** NO-STATIC-DATA (DR-0121), VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY, SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), COMMUNITY-FIRST

## Directive

Darrell, 2026-07-10, linking the live service `https://www.youtube.com/live/efj-t2_Z-nI`: *"Can you also source all of the Call-To-Give's from the same YouTube and documents sources we have? Add the historically — and all the videos should be able to get the transcripts from our videos now, correct? Again when we add features we need to update our Ways and documentation and find the opportunities and constraints; Ari's responsibility and reports should all update to reflect as well, all inside the PoeTech App. No static data."*

## The verified trace (the answer to "correct?")

Yes, with the pace stated honestly. The transcript STORE is live in the app (`video_transcripts`, migration 0058 — the sermon library and Harvest ledger already read it). Two loaders feed it: the NAS caption loader (`infra/nas-sme-pipeline/load-transcripts.py`) — real and working but MANUAL, three-braked, and running as a trickle because YouTube IP-blocks bulk pulls at ~50–180 fetches — and the sovereign Whisper GPU endpoint (`infra/church-gpu-node/whisper-gpu/server.py`), a passive on-demand fallback for caption-less videos. So every service video CAN get a transcript; the historical corpus fills at trickle pace, human-armed. "Call to Give" existed nowhere in the platform before this DR — net-new, built on the proven choir-archive recipe. The linked video's metadata is honestly PENDING: the cloud sandbox has no route to YouTube (CONNECT 403, verified 2026-07-10); enrichment rides the NAS-side loader that does.

## Decision

1. **One corpus, one transcript source, many harvests.** The Call-to-Give archive derives from the SAME `choir_sermons` service-video spine (the 335-video backfill + the email importers) and the SAME live `video_transcripts` rows everything else reads. Nothing is re-scraped, nothing re-typed (DR-0121).
2. **The detector is deterministic and conservative.** A reviewable cue vocabulary (strong appeal phrases vs support words); support cues alone NEVER claim a giving appeal — a teaching on the tithe is not a Call to Give. Every detected segment ships `needsReview: true`: the detector proposes, the church confirms (DR-0076, the choir-archive discipline).
3. **Coverage is measured, never claimed.** The surface states corpus / transcribed / detected / awaiting from the real rows, with the honest denominator (detection only runs where a transcript exists), and answers the transcript question with the dated, provenance-carrying pipeline note. A video without a transcript reads AWAITING — never painted.
4. **It lives where giving lives.** The archive renders inside the existing Give panel (combine what makes sense — one giving surface), degrading honestly for signed-out visitors (RLS returns nothing and the panel says so). Ari carries the call-to-give standing duty; this DR lands in his derived notes/reports on this build.

## Opportunities and constraints

- **Opportunity:** persist confirmed segments (a reviewed `call_to_give` table + `content_sources` registration) so the church's confirmations survive as rows, with timestamps into the video where the trickle loader can supply them. `re-review: 2026-07-24`.
- **Opportunity:** arm the NAS trickle loader on its watched schedule so the historical corpus fills; the coverage strip on the Give panel is the readout of that progress. `re-review: 2026-07-24`.
- **Opportunity:** the same derived-segment recipe for other recurring service moments (altar call, announcements, benediction) once Call-to-Give proves the pattern. `re-review: 2026-08-07`.
- **Constraint (verified):** the sandbox cannot reach YouTube (CONNECT 403) — video metadata and captions only enter through the NAS-side pipeline or the family's hands.
- **Constraint (carried):** YouTube rate-limits bulk caption pulls; the loader stays a three-braked, human-armed trickle (never an unattended fleet — the 2026-06-06 lesson).
- **Constraint (held):** transcripts are plain text without timestamps today, so segments link to the video, not into its timeline; timestamped excerpts ride the persist-the-segments opportunity.

## Supersedes / pairs

Pairs with DR-0133 (the church's own door — the giving surface this archive strengthens is a door face), DR-0121 (derived, never hand-kept), DR-0076 (needs-review + measured coverage), DR-0122 (a future courses/streams-style report can ride the same rows). Supersedes nothing.
