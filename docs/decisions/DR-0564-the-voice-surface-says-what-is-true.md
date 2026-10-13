# DR-0564 — The Voice studio says what is true: the recording stays, and "live" is earned

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/voice-assignment.js` (new `describeDeviceVoices`); `app/src/components/VoiceStudio.jsx` (the saved sample plays and says where it lives; the census replaces the gender assertion; "cloned voice live" is conditioned); `app/src/__tests__/the-voice-surface-says-what-is-true.test.js` (18 checks, new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — counted, never asserted), SURFACE-SAYS-TRUTH (DR-0239 §3), REALITY-TRACE (DR-0061), DR-0381 (a hollow surface is a lie)
- **Grounds:** Darrell 2026-09-22, four messages and five screenshots on a build where he was enrolled, the studio answered, and he still heard a stranger's voice

---

## Four things the surface said that were not so

> "Where does my voice go after?!!! I would like to have access to it stay right there after the recording!!!!!! Why not?!!!! Also where does it live on the device anywhy... also does it work?!!!"
> "Nothing changed the actual voice from the same female no matter what I pick!!!!!"
> "No choice for male or female like the verbiage on the app explains... not accurate?!!!!!!!!"

**1. The recording was taken away the moment it was saved.** `saveRecording` called `recorder.reset()`, which dropped the only playable handle on the audio. What remained was the sentence *"A voice sample is saved on this device"* and no way to hear it. The bytes were in IndexedDB the whole time; the surface would not hand them back. **Now:** the saved sample renders an `<audio controls>`, read **back out of the store** rather than reused from the recorder — so what plays on the page is provably the thing that persisted. Object URLs are revoked on replace and on remove.

**2. Nobody said where it lived.** *"It stays on this device"* is not an answer to *"where does it live on the device."* **Now:** IndexedDB, database `poe-voice`, store `references`, key `ref:<enrolKey>` — printed on the page, with the two consequences that follow: it does not travel to another device, and clearing site data deletes it.

**3. The gender copy asserted the wrong reason.** It said *"this browser only exposes female voices to web pages."* On his Android that is **not what is happening.** The list is not female-only, it is **genderless**: every entry is named by locale — `English Nigeria (en_NG)`, `Assamese India (as_IN)` — so `classifyVoiceGender` returns `unknown` for all of them and no male/female match is possible from that list at all. A wrong reason is its own defect: it sent him hunting for a toggle that could not exist. **Now:** `describeDeviceVoices` counts what the device actually handed the browser, and the surface states it — *"This browser exposes 5 voices and names every one of them by LANGUAGE rather than by voice, so a male match cannot be made from this list — which is why changing the selection does not change how it sounds."* The Android Text-to-speech route, which was the one true part of the old copy, is kept. And the note is no longer hardcoded to `male`, so a female persona on an unmatchable device gets the same honesty instead of silence.

**4. "Cloned voice live" was not earned.** The card read *"Enrolled · consent granted · cloned voice live"* and *"✓ IN USE"* while a device voice was what he heard. `prov.real` only knows the studio is **configured and answering** — it does not know whether **this device** holds the sample the clone is conditioned on. Without it the read falls back and the card still claims live. **Now:** for your own voice the claim requires `myRefExists`, and when the sample is missing it says exactly that instead — *"the studio is answering, but THIS device holds no sample of your voice."* This narrows the claim and never widens it.

## Verification

- **18 new checks**, green. The census cases are built from **his actual list** as the screenshots show it, not from an invented fixture.
- **Proven to catch (DR-0076 §3):** the locale detector was broken to a constant `false` and the suite went red **2 of 18** on exactly the two cases that exist to hold it. Restored, 18 of 18.
- Lint clean; the 24 voice suites re-run green (281 checks).

## The process failure worth recording

I found all four of these, named them in my own words, and then **ended the turn reporting them instead of building them.** Darrell's reply was *"Fix all of that!!!!!!"* and then *"Why did I need to say that!!!!!!!!!!"*

He should not have needed to. Finding a defect and describing it back is not the work; DR-0111 says the default is ACT, and a list of four things I had already diagnosed is not a decision waiting on the Governor — it is a queue. The trigger to watch for is the shape of my own sentence: when a reply ends by naming what is broken, the turn is not over.

## Limits, stated

1. **The real clone still needs the studio.** Nothing here makes a male voice come out of a genderless device list — it makes the app stop implying it can. The only route to his own voice is the sovereign studio with a sample present, which is what the corrected card now says.
2. **`namedByLocale` is a heuristic** — it matches names ending in `(xx_YY)`. An engine that names voices some third way would count as "declares no gender" rather than "names by language". Both messages are true; the second is just less specific. `re-review: 2026-11-22`.
3. **Not yet proven on his device.** This is the structural fix; the proof is him opening the Record tab, playing back his own sample, and reading the census. `re-review: 2026-09-23`.
