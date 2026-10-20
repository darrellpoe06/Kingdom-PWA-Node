# DR-1131: The voice is listened to, not only inspected — a clarity witness that transcribes what the reader plays, and three more places a long sentence is cut

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (the reading voice every lesson plays through; one new dispatch-only witness; a change to what every piece is handed as)
**Type:** product (defect + instrument)
**Area:**
- `app/src/lib/synthesis-text.js` (an aside in parentheses is its own sentence; a subordinator is the cut of last resort)
- `app/src/lib/speech-shape.js` (a hyphen with a space either side is a breath, as the em-dash already was)
- `scripts/voice-clarity-corpus.mjs` and `infra/nas-voice-lite/fixtures/clarity-corpus.json` (56 real pieces, cut by the reader's own pipeline, pinned)
- `scripts/voice-clarity-witness.py` (speak, transcribe, score)
- `.github/workflows/voice-clarity-witness.yml` (dispatch-only, read-only, braked)
- `app/src/__tests__/the-voice-is-heard-as-written.test.js`, `synthesis-text.test.js`, `speech-shape.test.js`
- `scripts/system-flow-registry.mjs` (the witness has a place in the flow graph)

**Amends:** DR-0851 (short, closed sentences: the cuts it had no place for). Grounds: DR-0076 (§4 measure, don't claim; §7 an independent method), DR-0653 (one short piece at a time; the L191 gibberish measurement), DR-0794 (the voice speaks at the pace, nothing is stretched that can be asked for), DR-0881 (the Piper on the device before the device's own engine), DR-0108 (account for the whole team's reach: a GitHub runner can listen; the sandbox cannot).
**Declared by:** Darrell, 2026-10-20, a Living Lessons week on the phone, with a screenshot of the lit piece: *"Our app is still mumbling in sections of the tts.... fix it so it can be fully functional without defective speaking parts of the lessons... make sense?"* And, while it was being built: *"Comprehensive understanding and helpful skills to enhance and improve our stakeholders experience... make sense?"*

---

## Context

The reading voice is Piper (`en_US-ryan-medium`) on the NAS, reached at `/voice-lite`, handed one piece of about 180 characters at a time (DR-0653), each piece shaped into sentences of at most 18 words where a comma or a joiner gave a place to cut (DR-0851). Three records in a month changed what the voice is handed, and each was proven on the text: word counts, sentence ends, byte-identical phoneme ids. **Nothing ever listened to a clip and checked that the words came back.** "It mumbles" had no number, so "it is fixed" had none either, and he is reporting it a third time.

## What was measured

**The lit piece in his screenshot**, through the real pipeline (`chunkForClips` → `toSpokenForm` → `forSynthesis`):

> `" (Leviticus chapter 19 verse 34) This week teaches what an education is before it argues about how long one should be -. and names plainly that we read a digest, not one full article.`

One 23-word sentence reached the voice, with three faults no earlier record covered: the citation in parentheses glued to the sentence after it; the typed hyphen ` - ` left standing, so the joiner cut produced `be -.`; and the lone quotation mark the piece cut had left in front.

**The catalog**, every piece of every Living Lesson in spoken form (38,427 pieces):

| | pieces with a sentence over 18 words | over 24 words | longest |
|---|---|---|---|
| before (DR-0851's shaping) | 1,047 | 113 | 37 |
| after | 143 | 5 | 28 |

The 20 longest before were, almost without exception, one shape: a quotation that runs on across the piece with its citation in parentheses in the middle — *"and see that the LORD is good" (Psalm 34:8) together with a readiness always "to give an answer to every man that asketh you…"*, 37 words, no stop anywhere. A reader pauses before and after a citation; nothing in DR-0851 could.

**The sandbox cannot listen** (no route to poetech.us, and the Hugging Face hosts that serve both the Piper model and a speech-recognition model answer 403 through the egress proxy; measured). A GitHub runner can do both.

## Decision

1. **Three more places a long sentence is cut**, used only when a sentence is over 18 words and in this order after the comma and the joiner:
   - an **aside in parentheses** is spoken as its own sentence, with a stop before and after it; the quotation mark it leaves alone is not spoken; the aside itself is cut if it is long; a clause mark that joined it to its neighbour is not spoken as a dangling comma;
   - a **hyphen with a space either side** is the breath the em-dash already was (`speech-shape.js`); `forty-four` is untouched;
   - a **subordinator** (that, who, whom, whose, where, when, before, after, until, unless, though, although, if, as, than, for, nor, or, yet) is the cut of last resort, inside the window first, then the first one after it.
   A short sentence with an aside is left exactly as it was: `"For God so loved the world" (John chapter 3 verse 16).` still reads as one.
2. **A clarity witness** (`voice-clarity-witness.yml`, dispatch-only): speaks the 56-piece corpus through `/voice-lite` with the family bearer at paces 1, 1.5 and 2, exactly as the app asks; transcribes each clip on the runner (faster-whisper, CPU); scores each piece as **word error rate** against the text; writes the table to the step summary, every clip to the artifact; and **fails** on a piece at pace 1 that loses more than half its words, naming the piece and what was heard. Numbers are compared as words on both sides; a mis-heard proper name is the floor, not a fault.
3. **The corpus is the reader's own cut**, pinned: the lit piece, the three photographed on 2026-10-09, the 20 catalog pieces with the longest sentences left after shaping, 10 that open on a quotation mark and a citation, and 16 short plain pieces as the control. The test regenerates it from the live catalog and compares, so it cannot drift from the pipeline.

## Impact

- Every piece the NAS voice, the on-device Piper and the studio voice are handed changes shape where a sentence was long; the written page, the highlight and the follow map are unchanged (spoken form only, as DR-0851). Cache keys follow the spoken text, so an old clip is never served for a new shape.
- "It mumbles" is now a per-piece, per-pace number that a run produces on demand, with the clip beside it. The next report names a piece; the witness says what was heard.
- What this does not do, said plainly: 143 pieces still reach the voice over 18 words (none over 28) because they hold no comma, joiner, aside or subordinator past a four-word head; and the witness measures the NAS voice at the paces the reader asks for, not the device engine a phone falls back to when the NAS cannot be reached (DR-0881).

## Verification

- `synthesis-text.test.js`: the lit piece now reaches the voice as three sentences of 5, 16 and 11 words; the Psalm 34 run as four; the long aside is itself cut and the dangling comma gone; the short John 3:16 case unchanged; the subordinator cut ranks after the comma. **Proven to catch:** without the aside and subordinator cuts the lit piece is one 23-word sentence (pinned); the catalog gate that every long sentence with a safe cut is cut still passes.
- `speech-shape.test.js`: the spaced hyphen is a breath; the hyphenated word is not.
- `the-voice-is-heard-as-written.test.js` (7 cases): the fixture regenerates byte-for-byte from the live catalog; every piece's spoken form is the reader's; the lit and photographed pieces are in it; every group present with its bounds; the scorer's 13 offline checks pass; the workflow is dispatch-only, read-only and braked and runs the script on the fixture.
- `interconnect-guard`: 191 nodes, 479 connections, 75 workflows and 31 riders placed, 0 findings.
- **Live listening**, the first run after merge (a new workflow can only be dispatched once it is on `main`): the baseline table at paces 1, 1.5 and 2 is read into this record's follow-up, and the pieces the transcriber loses are the next work. `re-review: 2026-10-20` (the same day): read the first run; if any piece at pace 1 is over the threshold, that piece is the next change.
- **First live listen, 2026-10-20 19:54Z (run 39487388380), after the browser-shaped request landed (#2306):** 167 of 168 clips came back 200 through poetech.us/voice-lite (one 502 from Cloudflare on screenshot-04 at pace 1, nine seconds in: the origin answered an error for that one piece). The transcriber then died before scoring a single clip: faster-whisper 1.2.1's own decoder passes `metadata_errors` to `av.open`, and PyAV 19 (what `pip install faster-whisper` now resolves) no longer takes it. The witness now reads each clip with the stdlib (`wave` + `array`) and hands Whisper the 16 kHz mono samples itself (`wav_samples_16k`); the self-test proves the decoder on a stereo 22050 Hz clip, pure Python and numpy paths sample for sample (15 checks). The numbers come from the next dispatch.
- **Second live listen, 2026-10-20 20:06Z (run 39489093593, the witness decoding its own WAV):** all 168 clips came back 200 and were scored. Pace 1: median WER 0.03, worst 1.03, 1 of 56 over the 0.5 line; pace 1.5: median 0.04, worst 0.94; pace 2: median 0.04, worst 0.94. By group at pace 1 (median / worst): screenshot 0.00 / 0.11, photographed 0.00 / 1.03, longest 0.03 / 0.13, citation-led 0.06 / 0.17, ordinary 0.02 / 0.10. The lit piece from his screenshot (screenshot-01) reads at 0.00 at pace 1. **The one failure, photographed-03** ("Change why you open the Book…"), came back as babble at every pace ("Ching-d-d-da-da…", "Change the forest.", "Change it to the…"), 4.7–5.2 s for 29 words; its three clips were all synthesized in run 39487388380 within two minutes of the server's 502 on screenshot-04 (19:56:46) and then **cached**, so every later reader of that piece would hear the same garbage. Decided from this: `/voice-lite/speak` takes `fresh: true` (bearer-gated) to make a clip again and replace the cached one; the witness runs a heal pass on any piece over the line (spoken fresh, transcribed again) and reports *healed* when the fresh clip reads clean, failing only when the voice truly cannot say the words; `--texts 'a || b'` listens to one line or a few variants without the whole catalog. Proper names the small model spells its own way (Jael, Gehenna, Yahweh heard as "YHWH" at pace 1) count against the number without being the voice's fault; the median says the reader is clear.
- **The cause, bisected 2026-10-20 20:24–20:36Z (runs 39491668237, 39492075479, 39493087468, one-line listens):** the exact photographed-03 text babbled from the cache ("Ching!", 5.17 s); the same text with one word added, a new cache key, babbled fresh too ("Change the world of you, tool out of you…", 5.14 s) — so the cache was not the cause, and the earlier reading that it was is withdrawn. The eight-way bisect found the junction: **a period followed by a lowercase word** ("…before each reading. not to say I got you…"). Piper's phonemizer does not take that as a sentence end; with "Not" the same 35 words read at **WER 0.00 in 8.53 s**, and "…His Way. and then…" alone is fine (adhoc-01, 0.00). Every cut this record introduced leaves its tail lowercase, so the shape was ours. Decided: every sentence the voice is handed starts with a capital (`synthesisSentences` → `spokenStart`; the lit piece's tail is now "And names plainly…"), and the voice server applies the same rule after every sentence end before Piper (`piper_text`), so any caller is safe. The clip guard above stays as the net: a 36-word clip of 5 s is never kept. Proof: the full listen on the branch after the change, and the server's own self-test on the exact junction.
