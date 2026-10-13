# DR-0551 — Are the words on the wall the words that were sung?

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** gate
- **Relates to:** DR-0076 (verification doctrine), DR-0108 (review our Ways), DR-0061 (reality-trace before building), DR-0012 (the GPU bright line this deliberately does not cross), DR-0277 (the transcript lane and its witness), DR-0264 (read-follow), the choir-renditions descriptive-never-prescriptive binding (Darrell 2026-06-24)

## What he asked

> *"Choir rehearsals are on Thursdays the YouTube videos are supposed to be getting the songs lyrics and making sure they are accurate on the screen using whisper or some tool on the left cuda for transcript live during the broadcast at some point... review our Ways and DRs..."*

Three things in one sentence: a standing fact, a directed capability, and a future ambition with a bright line across it. They are answered separately below because they have different risk.

## The Ways review

**Rehearsal day was already correct as data, and needed nothing.** `app/src/lib/service-day.js:63` carries `'Thursday rehearsal'` as the canonical label, and — the part that matters — `weekdayName()` derives the weekday from the actual date so a label can never contradict the calendar. That Way exists because of a real defect (a Choir card reading "SUNDAY SERVICE · MON, JUL 13", Darrell 2026-07-02). The Tuesday corrected the same day in DR-0550 was prose in one lesson, not the system's belief about the week.

**The lyrics chain was whole except for one link.** Traced end to end before anything was written:

| Stage | Where | State |
|---|---|---|
| uploads → `choir_sermons` | `transcript-backfill.yml` phase 1 | detects the Thursday rehearsal when YouTube publishes it |
| captions → `video_transcripts` | NAS transcript-trickle rider, residential IP | live; **no GPU, no Whisper** |
| transcript → draft sheet | `choir-words.js` `draftWordsFromTranscript()` | anchored on the heard quote, labelled `[auto-draft:v1]` |
| draft → confirmed final | the director | human confirms |
| final → the wall | `ndi-output.js` `lyricProgram()` | stanza frames to the NDI program feed |
| draft measured against final | `ari-words-training.js` `wordsDiff()` | how good Ari's first pass was |

**And there the gap sat.** Every existing measure compares a DRAFT to a FINAL. **Nothing compared the finished words against WHAT WAS ACTUALLY SUNG.** A sheet could be confirmed once and drift, or be typed from somebody else's recording of the same song, and every instrument in the house would report green while the congregation read lines nobody sang. That is precisely the class DR-0076 exists for: a thing that looks right, is wrong, and has no gate.

## What was built — `lib/lyrics-accuracy.js`

**The asymmetry is the whole design**, and it is why this is not `wordsDiff` pointed at a transcript:

- **ON THE WALL, NOT HEARD** — the congregation is reading text the recording does not support. **This is the fault.** It puts words in front of the room on our authority.
- **HEARD, NOT ON THE WALL** — an ad-lib, a repeat, a vamp, a spoken exhortation between lines. **This is ordinary**, and very often exactly right; `choir-renditions.js` already treats ad-libs as real and reviewable.

A single blended score would hide the first inside the second. So the two are measured and returned **separately**, and only the first drives the verdict. A test asserts the result carries no `combinedScore`.

**Descriptive, never prescriptive.** The module never rewrites a sheet and proposes no replacement words — a test asserts the result object carries no `suggested` / `correction` / `replacement` / `fixed` / `rewrite` key. An auto-corrector would quietly turn a faithful record into a prescription for how to sing, which is the one thing the 2026-06-24 binding forbids.

**A low score flags for review and never claims the sheet is wrong.** A caption transcript mishears, drops words and runs them together. The verdict name (`needs-review`, not `wrong`) and the steward's line both carry that — otherwise a steward "corrects" a correct sheet to match a bad transcript, which would be this gate causing the very damage it was built to prevent.

**Honest by construction:** `no-transcript`, `no-words`, `not-found` are stated non-answers, never padded scores. A song with no transcript is never dragged into the review queue as a fault.

## Verification

13 tests, three of them proven-to-catch:
- a line from a different song spliced into a sheet is flagged, **and no line that was sung is flagged**;
- a sheet from the wrong song entirely fails the verdict;
- a rendition full of ad-libs still passes, and the ad-libs are visible in `extraHeard` rather than penalised.

## The part deliberately NOT built, and why that is not a stall

**DR-0012 §3 is a decided bright line:** *"ANY non-Ollama CUDA process are a first-class, absolute-priority preemption trigger… Creative work has absolute priority over LLM jobs."* The 4070 is shared with Premiere, After Effects, C4D — **and OBS, which streams the broadcast.** A live-transcript job wants the GPU at exactly the moment DR-0012 says AI work must yield it within ~1 second. `church-gpu-node/README.md` reinforces it: the live-media tower feeding the NovaStar stays separate from AI-compute.

`infra/church-gpu-node/whisper-gpu` exists and is CUDA faster-whisper at `:8771`, but its endpoint is `POST /transcribe` against an uploaded file — scoped as the harvest **no-caption fallback**. Live means chunked audio in, partial text out, continuously: a different server shape, not a config change.

**This is a DR-0089 carve-out** — a bright line already decided, whose crossing is a Tier C activation call belonging to the Governor. Proceeding either way without his ruling would either violate DR-0012 or silently narrow what he asked for. Recorded as task #98 with three routes and their real costs; the recommendation is a streaming endpoint on the **church** tower, proven at **Thursday rehearsal** before any Sunday — same room, same songs, same wall, and a wrong caption there disrupts nobody's worship.

**And the honesty requirement rides whichever route wins (DR-0076):** a live transcript on the wall is machine output shown to a congregation in real time with no human between it and the room. It must be visibly labelled as live machine transcription and never presented as the confirmed words of a song — the same posture `choir-words.js` takes with `[auto-draft:v1]`.

## The honest remainder

- **The module is a primitive, not yet a surface.** It is pure and tested; no screen calls it yet. The steward-facing review queue (`songsNeedingWordReview`) needs a home in the Choir door. **re-review: 2026-09-27.**
- **It has not been run against the live corpus.** Its verdicts are proven against a constructed caption transcript of the shape YouTube actually produces, not against the real `video_transcripts` rows. What the real corpus says is a measurement, not a claim, and it has not been taken. **re-review: 2026-09-27** — run it over the live rows and record what it finds, whatever that is.
