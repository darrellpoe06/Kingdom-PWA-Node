# DR-0721 — "My voice (Darrell)" reads the lesson, or the reader says why: the clone is asked piece by piece, his recording reaches XTTS as WAV, and a stand-in never reads in silence

- **Status:** accepted (code shipped; the studio itself waits on one value only Darrell holds, named below)
- **Tier:** B (reader behaviour and the studio image; no new door, no cloud, no vendor spend)
- **Type:** feature fix + pipeline proof
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/my-voice.js` (new, pure), `app/src/lib/use-read-aloud.js` (catalog, `myVoice`, `playMyVoice`, the person-voice read branch), `app/src/components/TTSControl.jsx` (the status line under the voice list, the words beside Reading), `infra/voice-studio/server.py` (reference transcode, `/health` says it clones), `infra/voice-studio/Dockerfile` (ffmpeg), `infra/voice-studio/voice_forwarder.py` (16 MB body cap), `.github/workflows/arm-voice-studio.yml` (a clone proof with printed length and duration, an unmaskable key print, a Verdict step), tests.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), HOLD-THE-HAND (DR-0621), SOVEREIGNTY (DR-0132, DR-0138), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065); builds on DR-0382, DR-0401, DR-0440, DR-0566, DR-0568, DR-0569, DR-0576, DR-0579, DR-0581, DR-0654.
- **Grounds:** Darrell, 2026-10-01: *"Also my recorded voice still will not work as my reader voice… why?"*; *"My voice is recorded and stored in that same section it recorded it... it just doesn't use it after choosing it."*; *"When I push play on the recorded voice I gave it, it sounds like me... just won't read like me."* His recording has never once been used to read.

## Context

His recording plays back in his voice, so the recording is fine. Reading NEW text in his voice needs a clone: a model that takes his recording as the reference and speaks the lesson with it. The house has one: the XTTS-v2 studio (`infra/voice-studio/server.py`), meant to run on the 4070 tower `tlcmediadpt` and be reached at the same-origin `/voice` route through the NAS forwarder.

**SHOULD** (DR-0138, DR-0440, DR-0576): pick "my voice" once, and every reading is in that voice when the studio answers; when it does not, the reader says so.

**ARE**, traced end to end:

1. **Where the recording goes.** IndexedDB on the device that recorded it, key `ref:darrell` (`voice-reference.js:21`, `VoiceStudio.jsx:405`). The consent row goes to `voice_profiles` (one row, `created_by` his phone door, nas-health run 36785257832). Nothing is uploaded to the tower; the recording rides each request.
2. **Does the studio have his voice.** It needs none stored: XTTS clones per request from `reference_audio` (`server.py` `speak`). The studio was never running: every one of the twelve arm runs stopped at the tower's door (below).
3. **The pick.** The Voice tab's pick writes `person:darrell` to the one reading-voice preference (`VoiceStudio.jsx:290`, `reading-voice.js`). The reader honoured it: `isPersonVoiceId` sent the read into the person branch (`use-read-aloud.js`, old lines 627-711). The list called the voice "Darrell Poe", and left it out entirely whenever the consent row did not load (nas-health logs `permission denied for table voice_profiles`, 22:11 UTC 2026-09-30).
4. **The request.** The branch POSTed `{ text, voice: 'voice-dp', person_key: 'darrell', reference_audio }` to `/voice/speak` → `functions/voice/[[path]].js` → Funnel → NAS forwarder `:8771` → tower `:8770`. With the studio dark the route answers a road failure (404 when the Funnel mount is down, DR-0566).
5. **The fallback.** A road failure set `standInWhy` and wrote **no message** (2026-09-23, "No headaches"). The NAS Piper voice (a man, not him) then read, and the only trace was " · stand-in voice, the studio is offline" after "Reading…" in a panel that folds into a pill while it reads.

**GAPS:**

- **G1, the studio has never run.** No arm run built it. All twelve took 18 to 33 seconds; a first build takes many minutes. Run 36005924144 (2026-09-24) read green with `dialect=none` and `SSH FAILED`, because the road and the probe are `continue-on-error`.
- **G2, the whole lesson went in one request.** The branch sent up to 32,000 characters to XTTS with a 45-second bound. A clone of a whole lesson cannot finish in 45 seconds on a 4070. An armed studio would still have timed out, and the stand-in would still have read.
- **G3, his recording format.** The browser records `audio/webm;codecs=opus` (iOS: `audio/mp4`). XTTS loads its reference through torchaudio, and the image had no ffmpeg (`Dockerfile`: `git curl` only), so the first real clone would have failed as `synthesis-failed`. `audio/mp4` was written to a `.wav` name.
- **G4, the forwarder refused large samples.** `MAX_BODY` was 2 MB, which an imported WAV sample exceeds.
- **G5, silence.** He was never told that someone else's voice was reading, or why.
- **G6, the arm lane never proved a clone.** Its verify step synthesized only the built-in speaker, with no reference.

## What was measured

- **Arm runs** (`arm-voice-studio.yml`): runs 1 to 12. The 2026-10-01 probe, run 36796348603, joined the tailnet, and the tower refused the CI key at once (`the tower refuses the CI key for creed`). The tower is on and answering SSH; it does not trust the key. Road 2: `the NAS holds no key road to creed@tlcmediadpt`. Road 3: `secrets.TOWER_CREED_PASSWORD set: false`. Then `dialect=none`, `SSH FAILED`, and the job concluded **success**. Run 36796584904 (dispatched with `arm=true` by this session) was queued behind it and walks the same road.
- **The key print is masked.** Run 36796348603 row 2 read `AAAAIMI9UAijUYeaiNzA1YeLr***j2aF`: a short line of the private key sits inside a 32-character row, so the line to authorize could not be copied from the log.
- **Tests on origin/main sources** (the new tests, run with this DR's source changes stashed): 8 of 10 fail. The six behaviour tests in `my-voice-reads.test.jsx` fail (no "My voice (Darrell)", no voice without a consent row, the whole lesson in one request, no sentence on a dark studio, a missing sample, or a refused key), and so does the studio contract (no webm-to-WAV). With the fix: 16 of 16 pass, and the 52 existing reader and voice suites pass (572 tests).
- **Licence check.** The studio's model is Coqui XTTS-v2 under the Coqui Public Model License, which allows **non-commercial** use only (stated in `server.py` and the `Dockerfile` since they were written). The weights are open, the model runs on our own GPU, and nothing goes to a cloud. Darrell's lessons read in his own voice, for his family and church, fall within that. A **paid** voice feature would not, and Coqui closed in early 2024, so a commercial licence cannot be bought. OpenVoice V2 (MIT) is the named swap, and the `/speak` contract is model-agnostic. That MIT status comes from training data and has not been verified here; it must be verified against the upstream repository before any swap.

## Impact

- Picking "My voice (Darrell)" sends the lesson to the studio **one breath-sized piece at a time**. Each piece carries his recording as `reference_audio` and names him (`voice-dp`, `darrell`). The pieces play through the element unlocked in the tap, and the highlight follows the piece that is playing. A piece the studio cannot make hands the rest of the reading to the NAS stand-in, and the panel says so.
- The reader's voice list calls it **"My voice (Darrell)"** and offers it whenever his recording is on this device, even when the consent row did not load. Recording is the consent gesture (`voice-recording.js`), and the Voice tab records only under the signed-in person's own key.
- Under the list, one sentence says whether his voice can read now, and if it cannot, why. The four reasons: the studio is not answering (named as the 4070 tower), the recording is not on this device (with the door to the Voice tab), the family key was refused, or the studio returned an error. The sentence appears before play, from the probe, and again as the notice after a miss, which marks the folded pill with "!". Beside Reading it says **"not your voice"**.
- The studio converts any non-WAV recording to mono 22.05 kHz WAV (the first 30 s) with ffmpeg before XTTS. A missing ffmpeg is a named 400 (`reference-needs-ffmpeg`), never a silent bad read. `/health` reports `clone: true` and the model.
- The arm lane proves a **clone**: the warm built-in clip comes back, is re-encoded as webm/opus (exactly what a phone sends), and goes up as the reference with John 1:1. The cloned WAV's byte length and duration are printed (`CLONE SPOKE: N bytes, S seconds`), and the clip is kept as an artifact. A run that never reached the tower now ends red, with `NOT REACHED`. The CI key also prints in four-character groups that masking cannot hide.

## Decision

1. **A person voice is always tried and never replaced in silence.** The 2026-09-23 "no message on a road problem" rule stands for the System voice. For a voice the listener picked as their own, a stand-in reading is said in one sentence: whose voice is reading, and why.
2. **A clone is asked piece by piece**, the pieces the NAS voice already uses (`chunkForClips`). A lesson is never asked for in one request.
3. **The studio accepts what browsers record.** WAV is used as-is. Everything else goes through ffmpeg first.
4. **The arm lane is green only when it reached the tower**, and it proves a clone, not only a built-in voice, with numbers in the log.
5. **The one hand-step left is the tower's key**, and it is a value only Darrell holds: creed's Windows password, set once as the repository secret `TOWER_CREED_PASSWORD`. Road 3 of the lane then places the CI key itself, and the secret can be deleted. From his desktop:

   ```
   cd C:\Users\dpoe\Kingdom-PWA-Node
   gh secret set TOWER_CREED_PASSWORD --repo darrellpoe06/Kingdom-PWA-Node
   gh workflow run arm-voice-studio.yml --repo darrellpoe06/Kingdom-PWA-Node --ref main -f arm=true
   ```

   (`gh secret set` asks for the value without echoing it.)
6. **Licence.** XTTS-v2 (CPML, non-commercial) stays for the family and church reading. Before any personal voice is sold as a subscriber feature, the studio swaps to a commercially licensed open model, after that model's licence is verified upstream. `re-review: 2026-11-01`, or on the first paid-voice decision, whichever comes first.
7. **Still open, named.** The cause of `permission denied for table voice_profiles` (DR-0562, DR-0569) is still not found. The reader no longer depends on that table to offer his voice, but the consent record on other devices still does. `re-review: 2026-10-08`.

## Verification

- `app/src/__tests__/my-voice-reads.test.jsx` (the real hook; only the network seams are faked) covers: "My voice (Darrell)" listed, with and without a consent row; picking it sends his recording as the reference, names `voice-dp` / `darrell`, and sends each piece at or under 200 characters; a dark studio, a missing recording and a refused key each produce their own sentence; a probe-dark studio is said before play. **Fails on origin/main (7 of 7), passes with this change.**
- `app/src/__tests__/my-voice-words.test.js`: the name, the states, and every sentence (pure).
- `infra/voice-studio/test_speak_contract.py`, through `voice-studio-serves-the-built-in-voice.test.js`, runs the real handler. Checks 6 to 9: a webm recording reaches XTTS as WAV; mp4 is converted rather than mislabelled; no ffmpeg gives a named refusal; `/health` says the studio clones. **Fails on origin/main**.
- `voice_forwarder.py --selftest`: all checks pass at the new cap.
- Updated pins (the old behaviour deliberately superseded, as recorded in each pin): `the-voice-panel-is-intuitive`, `the-studio-is-tried-not-asked-about`, `the-key-provisions-itself-before-the-read`, `nothing-hovers-over-the-word`.
- **On the tower:** not yet. The next `arm=true` dispatch after the secret is set must print `SPOKE` (built-in) and then `CLONE SPOKE: N bytes, S seconds` (the clone). Until it does, this record does not claim his voice reads.
