# Arm the voice — the Firestick has no voice engine, and the app already has the answer

**The finding, stated plainly.** TTS on the Fire TV clicks, responds, and reads
its controls correctly, and produces no sound. The device plays video with
audio fine, so output is not the problem — **the browser simply has no speech
engine to speak with.** Fire OS ships no TTS voices for the web, so
`speechSynthesis.getVoices()` stays empty and every utterance goes nowhere.

**And that does not matter, because the app does not need the device's voice.**
`use-read-aloud.js` runs a System-voice CLOUD read *before* the device path: it
synthesizes server-side and plays the result through an `<audio>` element —
which the Firestick handles perfectly, as the sermon video proves. The whole
chain is built and verified in the repo:

| Link | State |
| --- | --- |
| Client asks for the service's own voice (`allowBuiltIn: true`) | **built** — `use-read-aloud.js`, DR-0382 |
| Server serves a built-in speaker with no sample | **built** — `infra/voice-studio/server.py`, DR-0394 |
| Result plays through `<audio>`, device-independent | **built** |
| `VITE_VOICE_SERVICE_URL` points at a live studio | **MISSING — this is the whole gap** |

`activeVoiceEndpoint()` returns `null` when neither the sovereign URL nor the
bridge flag is set, so the cloud read never fires and the reader falls to a
device engine that cannot speak. One environment variable stands between the
television and the Word read aloud.

---

## Step 1 — start the studio (on the machine with the GPU)

Plain version: SSH to the tower, build the image once, run it detached on port
8770. It downloads the XTTS-v2 model on first start, which takes a while.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@poetech.tail5a2f35.ts.net "docker build -t voice-studio /volume1/repos/Kingdom-PWA-Node/infra/voice-studio"
```

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@poetech.tail5a2f35.ts.net "docker run -d --name voice-studio --restart unless-stopped -p 8770:8770 -e COQUI_TOS_AGREED=1 voice-studio"
```

On a box with the 4070, add the GPU flag instead:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@poetech.tail5a2f35.ts.net "docker run -d --name voice-studio --restart unless-stopped --gpus all -p 8770:8770 -e COQUI_TOS_AGREED=1 voice-studio"
```

## Step 2 — prove it answers BEFORE wiring anything

Do not skip this. `isVoiceServiceReady()` is a CONFIG check, so a mistyped URL
reads as "armed" everywhere and fails on every read (DR-0440 records exactly
that defect). Health first, then a real synthesis.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s http://poetech.tail5a2f35.ts.net:8770/health
```

```
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s -X POST http://poetech.tail5a2f35.ts.net:8770/speak -H "Content-Type: application/json" -d "{\"text\":\"The Word of Yahweh endures forever.\"}" -o C:\Users\dpoe\voice-test.wav
```

```
cd C:\Users\dpoe\Kingdom-PWA-Node
Get-Item C:\Users\dpoe\voice-test.wav | Select-Object Length
```

**A file of a few hundred KB means the built-in speaker path works.** A
`reference-required` error means the loaded model exposes no speaker bank — the
server says so honestly rather than pretending (DR-0394), and the fix is the
XTTS-v2 model, not the client.

Play it to be certain:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
Start-Process C:\Users\dpoe\voice-test.wav
```

## Step 3 — wire it, once, for every device at once

In the deploy dashboard set:

```
VITE_VOICE_SERVICE_URL = https://poetech.tail5a2f35.ts.net:8770
```

Then redeploy. **This is a build-time variable, so one setting lights up every
device simultaneously** — the Firestick, the Samsung, every phone. Nothing is
configured per device and nothing needs to be on the same network, because the
browser fetches the audio over the tailnet URL.

If the studio is served over plain HTTP while the site is HTTPS, the browser
will block it as mixed content. Tailscale Funnel or a TLS terminator in front
of :8770 is the fix; the `https://` above assumes one is present.

## Step 4 — confirm on the television itself

Open `poetech.us/lovecorner` on the Firestick, open a lesson, press READ ALOUD.
It should speak in the studio voice.

**If it still does not:** the reader will now TELL you why rather than sitting
silent — that gap was closed the same day (the notice was computed on every
failure and never rendered, because `TTSControl` never destructured it). Read
what the panel says; it distinguishes "no voice on this device and no service
configured" from "service configured but it did not answer."

---

## Why this is worth the trouble

A television in a living room is the one screen a whole family looks at
together, and a child who cannot yet read fluently gets nothing from a lesson
that only displays. The sovereign path also means the Word is read in a voice
this house owns, on hardware this house owns, unmetered and with no vendor in
the middle — which is the standing preference over the bridge, not an
afterthought.

*Every value above is real: the tailnet name comes from the 2026-06-25 bridge
note, the port and endpoints from `infra/voice-studio/server.py`, the variable
name from `lib/voice-service.js`. Nothing is a placeholder.*
