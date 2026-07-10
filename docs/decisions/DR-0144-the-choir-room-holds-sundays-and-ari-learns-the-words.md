# DR-0144 — The choir room holds Sundays, and Ari learns the words by the choir's corrections

- **Status:** accepted
- **Tier:** A/B — derived filters + a derived drafting/measuring loop on existing data; no schema, no money, no new external face
- **Scope:** `lib/choir-sync.js` (buildPastServices keeps watchable SUNDAYS), `lib/choir-words.js` (the transcript word-teasing), `lib/ari-words-training.js` (the correction-pair calibration), `components/Choir.jsx` (Draft-words action + honest states + auto-draft badge), `components/ChoirSongbook.jsx` (Words on the repertoire card), the pinned tests
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), SPEAK-ESTABLISHED-FACT, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DR-0134 (one transcript source, many harvests)

## Directive

Darrell, 2026-07-10, with Choir screenshots: *"Choir only sings on Sunday… we also don't have the words for each one so the choir can have a starting point."* And, sharpening the words feature into a training loop: *"Use one of the final versions from the choir to see the difference so Ari can be trained to tease out the words for songs as they sing and after — so Ari is the expert at these, UIUX and all the python and JS type of actions, quality controls and other low hanging fruit for self healing and project management and implementation and research for current and future work."*

## The verified trace

1. **The widened history (DR-0137) surfaced the whole corpus into the choir's room** — including Wednesday Bible Study and Monday-posted recordings. The weekday label is honest to the DATE (Darrell's own 2026-07-02 rule, service-day.js), but the choir sings on Sunday: non-Sunday video-only rows are the sermon library's history, not the choir's.
2. **No song had words.** The harvester drafts a title and a "Heard in the recording" quote; the lyric sheet the choir rehearses from did not exist anywhere, on the set lists or the Songbook repertoire.
3. **The transcript already holds the words** — the same live `video_transcripts` rows the sermon library and Call-to-Give read (DR-0134's one-source recipe), and the harvester's heard-quote pinpoints where the song happens in them.

## Decision

1. **The choir room holds Sundays.** A video-only past service earns a Choir-history card only when its real weekday (from the date, never asserted) is Sunday; planned rows and rows carrying songs stay regardless (a Monday conference set Christina planned is hers). Other weekday recordings remain in the sermon library, where they belong.
2. **Every song can get a STARTING POINT of words, derived.** "Draft words from the recording" locates the song in its service transcript (heard-quote first, title fallback), takes the run of words that follows, wraps it as a verse-width sheet, and saves it clearly labeled `[Auto-draft … trim to the words the choir sings]`. Honest failure states, never a guess: no transcript yet → says the loader fills these; song not locatable → says add by hand. The Songbook repertoire card shows the Words wherever a rendition carries them.
3. **The choir's trim IS Ari's training.** The draft/final boundary is the label line itself (trimmed away on confirmation — the text testifies, no flag column). `ari-words-training.js` derives correction pairs live with NOTHING stored twice: the confirmed final + the same transcript re-teased = the measurable difference (recall: how much of the final came from Ari's draft; precision: how much of the draft survived). `calibrationExamples`/`calibrationSummaryLine` are measured or honestly empty — today the corpus has ZERO confirmed sheets, so no calibration UI ships painted; the loop that creates the first pairs ships instead.
4. **The correction-pair engine is Ari's general curriculum** (Darrell's sharpening): the same pattern — Ari drafts, the steward corrects, the difference is measured and kept — is how Ari becomes the expert at UI/UX findings, quality controls, self-healing actuators, and project research. Words are the first domain because the choir confirms sheets weekly; the generalization is routed below.

## Opportunities and constraints

- **Opportunity:** surface the calibration readout (the summary line + per-song diffs) on the Songbook / Ari's report once the first confirmed sheets exist — the instrument is built and tested; the display follows the data, never precedes it. `re-review: 2026-07-17`.
- **Opportunity:** generalize the correction-pair engine to the next domain (UI/UX findings from REV-0031's classes: Ari proposes the fix, the merged diff is the correction) — the Tier-C local-LLM tuning lane consumes the pairs when it arms (three brakes). `re-review: 2026-07-24`.
- **Constraint (held):** transcripts hear ad-libs, repeats, and the congregation — the draft is a quarry, never presented as verified lyrics (the label line + the needs-trim badge say so on the surface).
- **Constraint (verified):** transcript coverage is partial (the NAS trickle loader, DR-0134) — songs without transcripts get the honest awaiting message, and the calibration counts them as `awaitingTranscript`, never as skill.

## Supersedes / pairs

Pairs with DR-0137 (the history this focuses to Sundays), DR-0134 (one transcript source, many harvests — this is the third harvest from it), DR-0121 (derived pairs, no second store), service-day.js / DR of 2026-07-02 (the date-honest label stands; the FILTER changes, not the truth). Supersedes the any-weekday watchable rule in the choir history.
