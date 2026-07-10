# The voices made true — why "my AI voice never worked," and the Word heard in men's and women's voices

> Layer 4 working artifact. Companion to **DR-0138** and REV-0028. Triggers, Darrell 2026-07-10: *"Can we make sure the AI voices and the TTS work no matter the device with local llms or local voices for men and women — so when the Bible reader reads it actually sounds like a man or woman based on who is speaking? My AI voice never worked."* Sharpened mid-session: *"We want to not need any vendor llm if possible... use it outside of vendor time allotment or when offline"* — then: *"source the vendor AI for things we can't do, with a record of when we need to and what we need to build and/or purchase, including building to get a local device capable of whatever we need."*

## The diagnosis (verified)

1. **The AI voice never had a backend.** Both real-timbre paths were inert: the vendor bridge (no `REPLICATE_API_TOKEN`, no `VITE_VOICE_BRIDGE`) and the sovereign XTTS studio written for our own RTX 4070 (`infra/voice-studio`, `:8770`) — never armed, never probed (the device register says so). Every "AI voice" pick played a browser stand-in. The label was honest; the experience read as broken.
2. **The cold-start tap.** Mobile engines fill `getVoices()` a beat after load; a read tapped inside that window resolved NO voice and fell to the raw OS default — the wrong-gender / silent first tap.
3. **The dramatized read rode an un-hardened second engine.** Bulk-queued utterances (iOS caps the queue and drops later lines), utterances eligible for GC mid-sentence (Chrome goes silent), a bare pre-cancel (swallows the first tap), no segmentation (long verses truncate), and a `voiceschanged` property assignment that clobbers the main engine's listener.

## What shipped (DR-0138)

- **The hardened floor** — device-local voices (offline-capable, male + female, on every phone) through one discipline: the cast player rebuilt sequential with segmentation, GC-retain, busy-only cancel, resume kick, and onerror-advance; `waitForVoices` closes the cold-start gap and the read resolves against the voices that actually arrived.
- **The women heard as women** — Mary (Luke 1:38; 1:46-47) and the faithful women (Elizabeth, Luke 1:42; Ruth, Ruth 1:16; Martha, John 11:27) join the red-letter voices: colored on the page, cast to distinct female device voices in the dramatized read, beside Jesus/the Father/the prophets cast male. Every quote fetched verbatim from the shipped KJV; the CI verbatim gate proves it; unverified speech stays the narrator's.
- **Sovereign first, vendor recorded** — the studio on our own hardware always outranks the vendor bridge; `lib/sovereignty-gaps.js` is the standing ledger of every capability we can't yet serve locally, each carrying when we needed it, what runs locally today, the vendor meanwhile, the **build path on our own devices**, the **purchase path** where hardware is missing, and a re-review date. An unrecorded vendor need fails the build. Vendor playback announces itself. The ledger renders in VoiceStudio beside the honesty banner.
- **The stand-in explains itself** — a personal-voice read now says it's a stand-in and names the step that turns the real voice on, so "never worked" becomes "not armed yet, and here's what arms it."

## The step that turns your real voice on (no purchase needed)

Arm the studio on the LEFT 4070 (`tlcmediadpt`) per the 2026-06-25 standup note, then set `VITE_VOICE_SERVICE_URL` to it. Your recorded sample + the studio = Darrell heard as Darrell, offline, unmetered. `re-review: 2026-07-24`.

## Constraints (carried)

The sandbox cannot hear audio — the family's reviewer pass on real phones (DR-0104) is the ear; the harness proves the logic. Android's native pause stays best-effort. Device voice sets vary; the engine picks the most natural gender-correct voice available and never promises a timbre it cannot verify.
