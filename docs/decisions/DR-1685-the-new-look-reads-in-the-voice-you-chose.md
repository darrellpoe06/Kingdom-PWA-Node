# DR-1685: The new lesson look reads in the voice you chose, and the house's clone is woken with one paste

**Date:** 2026-11-26
**Status:** Accepted (reader shipped and proven; the first spoken lesson in his voice waits on the NAS clone answering, below)
**Tier:** B (reader behaviour; no schema, no money, no new door)
**Type:** fix + spec-conformance trace (DR-0219)
**Area:** `app/src/lib/chosen-voice-narrator.js` (new), `app/src/components/learn-studio/LessonExperience.jsx`, `LessonExperienceDoor.jsx`, `LessonExperienceTools.jsx` (`VoiceNote`), `app/src/__tests__/new-look-reads-in-my-voice.test.jsx` (new)
**Pairs with:** DR-0721 (my voice reads or the reader says why), DR-1538 (my voice made on the NAS), DR-1555 (the voice's own answer), DR-1482 (one reading, one voice), DR-0720 (enrollment for who spoke), DR-1159 (roads to a NAS value), DR-0076

## Context

Darrell, 2026-11-26: *"Can our speech and or readers be better or enhanced? I want the reader to read in my voice!!!!! Haven't had that happen yet!!!!!"* Then: *"And any users who are interested!!!!!!"* The house has built "My voice" six times (DR-0721, 1131, 1482, 1494, 1538, 1555). He has never heard it.

## What was measured (SHOULD vs ARE, traced 2026-11-26, his account)

**SHOULD** (DR-0721, DR-1538): pick "My voice" once; every lesson reads in it when an engine answers (the tower's XTTS, or the NAS's own OpenVoice converter when the tower is dark); when none answers, the reader says so in one sentence.

**ARE**, end to end:

1. **Consent.** `voice_profiles` holds one row: `person_key darrell`, `consent_state granted`, scope `read-aloud-narration`, since 2026-06-30 (SELECT-only, 2026-11-26). Consent is not the break.
2. **The recording.** It lives only on the device that recorded it (IndexedDB `ref:darrell`, `voice-reference.js:24`). No server copy. A second phone, a cleared site, or a reinstalled PWA has no sample. This is a standing limit, and the reader names it (below).
3. **The engine.** `voice-health` run 45718587894 (2026-11-25 23:05Z), public road, no key: both `poetech.tail5a2f35.ts.net/voice/health` and `poetech.us/voice/health` answered **the camera forwarder** (`"go2rtc": "1.9.14"`). That means no `/voice` mount: the forwarder's installer mounts it only when the tower or the NAS clone answers ready (`infra/voice-studio/install.sh:139-148`). So **neither engine has answered** in the eight days since DR-1538 merged. Why is not observable from here. The tailnet witness has failed every run since 2026-11-21 (`invalid key: API key does not exist`), and `nas_heartbeat_receipt()` reads `seen: false`. The NAS itself is alive: `bg-message-lessons` wrote to `agent_inbox` at 14:47Z today.
4. **The new lesson look.** `LessonExperience.jsx` drove one narrator, `createBrowserTTS` (`:382`): the phone's own voice, always. It never read the reading-voice pick, never loaded the recording, never asked `/voice/speak`. Even with the engine up, the look most lessons now open in could not speak in his voice. The classic reader (`use-read-aloud.js`) does ask, piece by piece.
5. **A tap of Read Aloud today**, new look: the phone's voice reads, and nothing says it isn't his. Classic look: the clone is asked, `/voice/speak` falls through to the camera forwarder, and the stand-in reads with DR-0721's sentence.

**GAPS:** G1, the new look ignores the chosen voice (fixed here). G2, no engine answers (one paste, below). G3, the sample exists on one device only (named; see Decision 4). G4, no witness can see the clone's install state (the runner road's key is dead; the DR-1360 direction stands).

## Impact

Picking My voice now reaches the clone from the new lesson look as well as the classic one, and a stand-in never reads without a line saying so. Nothing changes for a listener who has not picked a person voice.

## Decision

1. **The new look reads in the voice you chose** (`chosen-voice-narrator.js`). When a person voice is picked, each sentence (the same `segmentText` segments the page highlights) is asked of the clone with the listener's recording. The next sentence is made while one plays, through one audio element unlocked inside the tap (DR-0654). No person voice picked means the device voice, exactly as before.
2. **Never a silent stand-in** (DR-0721). If the clone cannot make a sentence (no recording here, no key, the engine dark or busy), the device voice reads **from that sentence on**. No sentence is read twice, and none is restarted from the top. One line on the page (`le-voice-note`) says whose voice is reading and why, using `my-voice.js`'s own sentences. A stop or a new play makes any late clip stale.
3. **The clone is woken by one paste** (DR-1159 road 2, ConnectBot, no password: `sudo -n` works on the box, DR-1622). The paste clears the daily-retry stamps, walks the clone's installer through its steps, mounts `/voice` when the clone answers, and prints the public answer. It changes nothing the installers do not already do on their own clock; it only stops waiting a day between steps.
4. **Any member who wants it** (Darrell, 2026-11-26). Recording, consent and the pick already work per person (`person:<key>`, `user:<uuid>`; RLS on `voice_profiles`; Remove deletes the sample and the consent). Two things stand between an ordinary member and hearing their voice:
   - **The door.** `/voice/speak` is gated on the **family** bridge token (0128). Church members get none, by design: that token also opens photos and taxes. It will **never** be extended to members. The member road needs its own scoped door: the forwarder checks a member's own session, counts per member, and serves `/speak` only. That is a new door to the house (Tier C), built after his voice is heard. `re-review: 2026-12-03`.
   - **Capacity, said plainly.** The NAS clone makes one sentence at a time. A second request waits up to 90 s and then gets 503, and the forwarder refuses a third at once (`nas_clone_server.py:35,69`; `voice_forwarder.py:74`, selftest §5). One reader asks for the sentence playing plus the next, so **the NAS serves one listener in My voice at a time**, and only if its measured `rtf` is under 1.0, which is not yet measured. A busy engine hands the listener to their device voice with the sentence saying why; nobody waits in silence.
5. **The sample on one device** stays as is for now: a server copy of a person's voice is a privacy bright line, theirs to choose. The reader names it ("your recording is not on this device… Voice tab").

## Verification

- `new-look-reads-in-my-voice.test.jsx`, 9 cases: every sentence asked in order and played; a failed piece hands over from that sentence, with the reason and the right highlight index; a stop makes a late clip stale; pace bounded; a picked person voice is asked and named "My voice (Darrell)"; a missing recording names the Voice tab; no pick means the device voice exactly as before; on the real page, Read Aloud asks the clone for the first sentence and the line is on screen; the door passes the narrator.
- **Proven to catch:** with `LessonExperience.jsx` and `LessonExperienceDoor.jsx` at `origin/main`, 2 of 9 fail (the page line and the wiring). Two mutations of the narrator each fail a case: handing over from the top, and dropping the stale-clip guard.
- The existing new-look suites pass (`lesson-experience-prototype`, `lesson-experience-public`: 80 tests).
- **Not yet observed:** a lesson spoken in his voice. It counts as done when `voice-health` reads "the voice's own answer" with `engine: nas-clone` and a measured `rtf`, and his phone reads a lesson with the line "My voice (Darrell) is ready". `re-review: 2026-11-28`.

## His one step (ConnectBot to `dpoe@192.168.1.26`, at home on wifi)

```
cd /volume1/PoeTech/repos/Kingdom-PWA-Node; V=/volume1/PoeTech/voice-clone; sudo -n rm -f $V/.torch-attempt $V/.ov-attempt $V/.weights-attempt-config.json $V/.weights-attempt-checkpoint.pth; for i in 1 2 3 4 5 6; do echo "--- pass $i"; sudo -n sh infra/nas-voice-clone/install.sh 2>&1 | grep -E "present|installed|downloaded|FAILED|not |health|measured|Waiting|done" | tail -4; done; echo "--- mount"; sudo -n sh infra/voice-studio/install.sh 2>&1 | grep -E "clone|mount|health" | tail -5; echo "--- public"; curl -s -m 15 https://poetech.us/voice/health | head -c 300; echo
```

It may take up to 20 minutes, because PyTorch is the large download. The last line is the answer. `"engine": "nas-clone"` means the house is speaking. `"go2rtc"` means it is not yet, and the lines above it name the step that stopped.

## Better and enhanced (Step 3), next with dates

- The new look's System voice asks the NAS man's voice (voice-lite) as classic does, one voice across both looks (DR-1482); the NAS reports the clone's install state itself (DR-1360): `re-review: 2026-12-01`.
- Natural pauses at paragraph ends, measured on real clips after the first `rtf`; the member door and per-member capacity (Decision 4): `re-review: 2026-12-03`. Clone pieces cached per lesson and voice on the device, instant and offline on a second listen: `re-review: 2026-12-05`.
