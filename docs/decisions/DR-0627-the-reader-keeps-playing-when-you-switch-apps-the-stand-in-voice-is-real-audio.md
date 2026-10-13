---
id: DR-0627
title: The reader keeps playing when you switch apps — the stand-in voice is real audio from the NAS, and the panel says per voice what happens in the background
status: accepted
date: 2026-09-24
tier: B
type: defect
declared_by: Darrell
scope:
  - app/src/lib/clip-queue.js (new) — a reading played as paragraph clips through one audio element
  - app/src/lib/voice-service.js — synthesizeLite + the /voice-lite road
  - app/src/lib/use-read-aloud.js — the System voice and a person's stand-in try the NAS audio voice before Web Speech; which kind of voice is speaking is reported
  - app/src/components/TTSControl.jsx — the false "carries on" claim replaced by an honest line per voice
  - app/src/lib/background-audio.js — header corrected
  - app/functions/voice-lite/[[path]].js (new) — same-origin transport
  - infra/nas-voice-lite/ (new) — Piper server, installer, unit
  - infra/nas-loops/services.json, infra/nas-transport/RECORDED-STATE.md, .github/workflows/ci.yml, .github/workflows/voice-lite-probe.yml (new)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), SOVEREIGN-FIRST, APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0382 / DR-0401 — the System voice reaches the sovereign studio
  - DR-0440 — ready means answering
  - DR-0138 — a stand-in is labelled, and a man's stand-in sounds like a man
source: 2026-09-24 — Darrell, from his Android phone (Samsung, Chrome, installed app), with a screenshot of the Read Aloud panel
---

## Context

Darrell, 2026-09-24: "Why doesn't the player remain playing in the background when I switch between apps?!!? Fix it."

His screenshot showed the Read Aloud panel reading a lesson:
- the status "Reading… · stand-in voice, the studio is offline — keeps going to the next one";
- the voice "Darrell Poe · AI (stand-in)" at 1.5×;
- "Keeps the screen on while it reads: ON";
- and at the foot of the panel, the promise: "the reading carries on when you leave the app — your phone's own play/pause controls it."

On his phone that promise was false. Switching apps stopped the reading.

## What was measured

- **Which voice spoke.** The GPU studio (infra/voice-studio, XTTS on the 4070) was offline. When the studio road fails, `use-read-aloud.js` falls to the phone's Web Speech engine (`tts.speak`). The status line he saw ("stand-in voice, the studio is offline") is exactly that branch.
- **What the keep-alive does.** `background-audio.js` plays one silent looping `<audio>` element while reading, so the page counts as media and is not frozen. That keeps the PAGE alive. Web Speech is not media, and Android Chrome stops it when the app leaves the screen. The file's own header claimed Android was "the path that works"; his phone contradicted it. The header is corrected.
- **What does keep playing.** A real clip in an `<audio>` element is media, and a phone keeps it playing in the background like music. The cloned-voice and studio paths already play that way. The stand-in did not.
- **What audio voice exists when the studio is dark.** None did. `/voice` reaches only the studio, through the NAS forwarder, and the installer mounts it only when the studio answers. So there was no server voice at all while the GPU was off.
- **Not measured here.** The sandbox cannot reach poetech.us or the NAS. That Android stops Web Speech in the background rests on Darrell's report and on the known platform behavior. It was not reproduced here. The live clip is measured by `voice-lite-probe.yml` after the NAS installs the service (below).

## Impact

Every listener whose studio voice was unavailable lost the reading the moment they switched apps, while the panel told them it would carry on. The panel's own words were the defect Darrell met.

## Decision

1. **The stand-in voice is real audio from the NAS.** A new sovereign service, `infra/nas-voice-lite`, runs Piper (rhasspy/piper, MIT, CPU, offline) on the NAS.
   - Voices: `en_US-ryan-medium` for a man's stand-in and `en_US-amy-medium` for a woman's (DR-0138).
   - Road: behind the family bridge bearer, mounted at `/voice-lite` on the Funnel, reached same-origin through `app/functions/voice-lite/[[path]].js`.
   - Cache: by text, so a paragraph heard twice is made once.
   - Brakes (request-driven, not the timer class): 2 syntheses in flight, 1500 characters per piece, 90 s per synthesis, a 400 MB cache.
   - Deploy: the services-sync rider installs it. The installer mounts nothing until piper has synthesized a real sentence on the box and the server answers `/health` 200. It downloads at most one large file per cycle and is registered last, so it cannot starve a sibling.
2. **The reader plays a reading as clips.** `lib/clip-queue.js` plays the reading piece by piece through ONE `<audio>` element:
   - the first piece is short, so the voice starts quickly;
   - the next piece is fetched while one plays;
   - the chosen speed is the element's `playbackRate`, re-applied on every piece;
   - progress is reported across the whole reading, so the follow-along highlight keeps moving;
   - a piece that cannot be had hands the rest of the text to the device voice, so the reading continues instead of going silent.
3. **Order of voices.** For the System voice and for a person's stand-in: the studio first (unchanged), then the NAS audio voice, then Web Speech. A browser accent the listener picked on purpose stays their choice. A dark `/voice-lite` is remembered for two minutes, so it is not asked on every paragraph.
4. **The panel says what is true, per voice.**
   - Audio voice speaking: "This voice keeps playing when you switch apps — your phone's own play/pause controls it."
   - Phone voice speaking: "This voice stops when you switch apps — the audio voice is offline." While reading, this line is also shown near the top of the panel.
   - Idle: the audio voice keeps playing; if it is offline, the phone's voice reads instead, and that one stops.
5. **The lock screen and the headset.** The audio voice plays inside the same media session the reader already holds, so the phone's play and pause drive it (`pause()` / `resume()` act on the clip element).

## Verification

- `app/src/__tests__/reader-keeps-playing-in-background.test.js` (13 tests):
  - pieces: whole sentences, a short first piece, nothing lost;
  - one element and the next piece prefetched (proven to catch: removing the prefetch turns it red);
  - advancing on `ended` through every piece, then ending;
  - the speed kept on every new piece and taken mid-reading;
  - a lost piece hands back the rest;
  - `stop()` halts;
  - the road: audio becomes a clip, the app shell's HTML is refused, errors are tagged and the road rests;
  - the honest copy per voice, and the old one-claim-for-all promise gone from the rendered panel;
  - the NAS voice tried before the phone voice.
- `infra/nas-voice-lite/voice_lite_server.py --selftest` (16 checks, gates merge in ci.yml): bearer refusals, health 503 without piper, WAV served, cache hit not re-synthesized, busy 503 at once, pruning.
- **Live, after merge:** `voice-lite-probe.yml` asks the NAS service locally, then makes the app's own call through `https://poetech.us/voice-lite/speak` and keeps the clip as an artifact. Until that run is green, the NAS voice is built and not yet proven live.
- **The 20-second phone test:** open a lesson, press Play, and wait for the panel to say "This voice keeps playing when you switch apps". Then switch to another app. The reading keeps talking. If the panel instead says "This voice stops when you switch apps", the audio voice was not reachable, and the panel said so.

re-review: 2026-10-01 — confirm the probe's live clip and Darrell's phone test; if the NAS CPU is too slow for the first piece (15 s bound), switch to the `low` Piper voices.
