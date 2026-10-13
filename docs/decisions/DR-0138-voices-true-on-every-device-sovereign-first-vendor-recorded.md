# DR-0138 — Voices true on every device: men heard as men, women as women; sovereign first, every vendor need recorded

- **Status:** accepted
- **Tier:** A/B (engine hardening + verified speaker data + a derived ledger; the sovereign studio ARMING stays a governor step; the vendor bridge arming is a governor step recorded as a gap)
- **Scope:** `lib/tts.js` (waitForVoices — the cold-start gate), `lib/use-cast-read.js` (the dramatized player hardened: sequential, segmented, GC-retained, busy-only cancel, onerror-advance), `lib/use-read-aloud.js` (voices-ready resolution at tap + the honest stand-in/vendor notices), `lib/scripture-voices.js` + `lib/scripture-voice-cast.js` (Mary + the faithful women, verified verbatim, cast female), `lib/voice-service.js` (sovereign outranks; vendor = recorded gap), `lib/sovereignty-gaps.js` (the vendor ledger) + its strip in `VoiceStudio.jsx`, `lib/ari-notes.js` (the voices duty), tests
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), COMMUNITY-FIRST (accessibility — read-aloud is a default, not a luxury), SOVEREIGNTY (DATA-AS-EMPOWERMENT), PERPETUAL-IMPROVEMENT (DR-0075), WORD-FIRST

## Directive

Darrell, 2026-07-10: *"Can we make sure the AI voices and the TTS work no matter the device with local llms or local voices for men and women — so when the Bible reader reads it actually sounds like a man or woman based on who is speaking? My AI voice never worked."* Sharpened same session: *"We want to not need any vendor llm if possible... because we want to use it outside of vendor time allotment or when offline"* — and: *"source the vendor AI for things we can't do, with a record of when we need to and what we need to build and/or purchase, including building to get a local device capable of whatever we need."*

## The verified trace — why the AI voice never worked

Every speech backend beyond the browser's built-in synthesis was INERT: the vendor bridge had no token and no client flag; the sovereign XTTS studio on our own RTX 4070 was written but never armed or probed (the device register records ":8770 not probed"). So the "AI voice" was always a browser stand-in — honestly labeled in the picker, but the real timbre never had a backend, on any device. Beneath that, two device-level failure classes: (1) a read tapped before the mobile voice list populates resolved NO voice and fell to the raw OS default (wrong gender / silence); (2) the dramatized Bible read rode a second, un-hardened speech path — bulk-queued utterances iOS truncates, unreferenced utterances Chrome GCs mid-sentence, a bare pre-cancel that swallows the first tap.

## Decision

1. **The device's local voices are the floor, and the floor is hardened.** They are on-device, offline-capable, male and female, on every phone — the sovereign baseline that must never silently fail. The dramatized player now speaks sequentially through the same defenses as the main engine (segmentation, GC-retain, busy-only cancel, resume kick, onerror-advance); a read tapped before voices exist now waits briefly and resolves against what actually arrived (`waitForVoices`).
2. **The Word's speakers are heard as men and women — verified only.** Mary and the faithful women (Elizabeth, Ruth, Martha) join the red-letter voices: colored on the page and CAST to distinct female device voices in the dramatized read, exactly as the men are cast male. Every quote is fetched verbatim from the shipped KJV before it lands (the existing verbatim gate proves it in CI); where a speaker is not verified, the words stay the narrator's — never attributed by guess.
3. **Sovereign first; a vendor is never an unrecorded habit.** The sovereign studio (our own 4070, `:8770`) ALWAYS outranks the vendor bridge; arming it closes the voice gap — unmetered, offline. Where a capability genuinely exceeds our hardware today, the vendor MAY be sourced — but only as an OPEN entry in the **sovereignty ledger** (`lib/sovereignty-gaps.js`, rendered in VoiceStudio): the capability, when we needed it, what runs locally today, the vendor meanwhile, the BUILD path (which of our devices, what to arm), and the PURCHASE path where hardware is missing — each with a re-review date. A gap without its full record fails the build (proven-to-catch); a closed gap needs evidence. Vendor use announces itself in the reading notice — never silent.
4. **The stand-in is never mistaken for "broken" again.** When a personal voice reads in a stand-in, the surface says so and names what turns the real voice on. Ari carries the voices duty.

## Opportunities and constraints

- **Opportunity (closes the voice gap):** arm `infra/voice-studio` on tlcmediadpt (the LEFT 4070) and set `VITE_VOICE_SERVICE_URL` — the standup steps are the 2026-06-25 session note; no purchase needed. `re-review: 2026-07-24`.
- **Opportunity:** grow the verified speaker data book-by-book (the women of the Gospels, Hannah, Deborah; the prophets) — each addition is a quote + the verbatim gate, nothing else. `re-review: 2026-08-07`.
- **Opportunity:** the sovereignty ledger generalizes beyond voices — fold the DR-0132 provider register's vendor slots into the same recorded-gap discipline. `re-review: 2026-08-07`.
- **Constraint (held):** browser voices vary per device; the engine picks the most natural gender-correct voice AVAILABLE and says which — it never promises a specific timbre it cannot verify.
- **Constraint (held):** Android's native pause/resume stays unreliable; pause support remains best-effort with re-speak on rate change (the engine's existing behavior).
- **Constraint (verified):** the sandbox cannot hear audio — device verification is the family's DR-0104 pass on real phones; the harness proves the logic, not the speaker.

## Supersedes / pairs

Pairs with DR-0099 (Jesus' words stay red — the Son's color), DR-0076 (verbatim attribution only), DR-0132 (local-first provider routing — the sibling doctrine for LLMs), DR-0135 (the ledger is a self-healing readout for sovereignty), COMMUNITY-FIRST (read-aloud accessibility). Supersedes the un-hardened cast player.
