# DR-0576 — The voice panel is intuitive: the device is deduced, the door is one tap, the sample is kept, and nothing floats over the Word

- **Status:** accepted
- **Tier:** A
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/device-voice-route.js` (new, pure: deduce the device; the route to its Text-to-speech screen, with a one-tap door where a browser can open one); `app/src/components/VoiceStudio.jsx` (the route card replaces the census sentence; a pick in the device list is heard at once; Download / Use-a-recording-file on the saved sample; the citation folds); `app/src/components/TTSControl.jsx` (the read notice lives inside the panel, with a mark on the pill and the button; no timer); `app/src/lib/voice-service.js` (`isStudioRoadProblem`; the 404 reason for the panel and console); `app/src/lib/use-read-aloud.js` (a road problem is status, never a message); `app/src/__tests__/the-voice-panel-is-intuitive.test.js` (36 checks, new); two older suites re-pinned with the reason in place
- **Principles:** DRIVE-DONT-DELEGATE (the product must not hand the person a hunt), VERIFICATION-DOCTRINE (DR-0076), DR-0558 (a notice that names a route opens it), DR-0564 / DR-0565 (the voice surface says what is true), DR-0574, DR-0566 (why a 404 means the road)
- **Grounds:** Darrell, 2026-09-23, five messages on the voice surfaces: *"Popup's?!!! Where are my voices stored in my cellphone so I can troubleshoot without having to do the recording over and over again... fix these issues"*; *"Make this easy!!!!!!!!!!!!"* (the 84-voice census paragraph); *"Make those options inside the app that opens that space... for the user... deduce the device?!!!!!!"* / *"Intuitive Design!!!!!!"*; *"Why does this need this?!!!!!!!!!!!"* / *"Intuitive!!!!!!!!"* (a row whose file paths took three lines at Big Print); *"How do we know which settings to change?!!!!"* (three screenshots of Samsung Settings searched for "voice", finding TalkBack, Voice Access, Voice Recorder and Voice Typing — and not the reading voice).

---

## The one defect under five messages

Each surface handed the person a hunt: a floating box over the lesson; a paragraph that ended with *"choose a male voice in Settings → Text-to-speech"* as if every phone filed that screen in the same place under a word a person would search for; a saved sample with no way to keep it or bring it back; a citation line between the person and the fix. Drive-Don't-Delegate is a rule about the product too.

## What changed, and why it is the shape it is

**1. Which settings screen — deduced, with a door.** `device-voice-route.js` reads the user agent and answers per device. His Samsung (the `SM-` model in the agent): *Settings → General management → Text-to-speech* — and the word to search is **Text-to-speech**, because his screenshots prove that searching "voice" finds nothing. A Pixel: *Accessibility → Text-to-speech output* (older phones: *System → Languages & input*). iPhone, Windows and Mac: their own screens, and no Android door. On Android **in a browser** the card carries a one-tap door: an `intent:` link to `com.android.settings.TTS_SETTINGS`, which Chrome launches from a tap. Inside the local app the door is withheld honestly — Capacitor's WebView hands an unknown scheme to `ACTION_VIEW`, which has no handler — and the steps stand alone until the shell gains a settings plugin (DR-0570 queue).

*Why the phone's setting decides at all:* Chrome on Android hands a page one voice per LANGUAGE ("English United States (en_US)"); which real voice speaks for that language is the phone's own Text-to-speech setting. That is why the in-app list cannot change how it sounds, and why the card leads with the phone's screen.

**2. A pick is heard.** Changing the device-voice dropdown now speaks a line in the voice picked. A change that makes no sound leaves the person guessing whether anything happened — which was the exact complaint.

**3. The sample is kept and brought back.** The sample is not a file in the phone's Files app; it is in the browser's own storage, which no file manager shows. So the honest answer is a **Download my sample** (an object URL with `download`, `poetech-voice-<key>.webm`) and a **Use a recording file** (any audio file → the same store, same key, read back out so what plays is what persisted, consent row written in the same gesture when the device can). The plain sentence comes first; the exact location folds under *Exactly where*.

**4. The citation folds.** Each check's *where* line is a `<details>` under the verdict and the fix. He asked for the documentation in the app (2026-09-22) and it stays in the app — one tap down, not between him and the answer.

**5. Nothing floats.** The read notice is no longer a box in the fixed stack over the prose. It renders inside the open panel under the header; while the panel is a pill or a button, a small **!** mark on that pill or button says a message is waiting and opens the panel. The twelve-second timer from 2026-09-22 goes: it treated the symptom (the box still appeared over the Word first), and a message that vanishes while it is being read is its own defect. The person dismisses it, or the next read replaces it.

**6. A road problem is the house's, not the reader's — no message at all.** The first cut of this record turned the HTTP 404 into a better sentence. Darrell's answer: *"What?!!!! Intuitive... you do it!!!! Deduce if it worked properly!!!!!!!!! No headaches!!!!"* He is right: a person reading a lesson can do nothing about a dark studio or an unmounted route, so no sentence about it belongs in front of him. `isStudioRoadProblem(tag)` classifies 404, timeout, no answer, 5xx, empty and unconfigured as the road; on those the read raises **no notice**, falls back to the stand-in voice, and the panel's status line says which voice is speaking and why (*Reading… · stand-in voice, the studio is offline*; *· stand-in voice until the studio is armed*). The "reading in a stand-in voice" sentence that fired on every read is status now too, never a message (DR-0138's never-silent holds: it is printed, not popped). Only a problem the reader can act on — a refused key, no sample on this device, no consent — earns a notice, and that notice carries its door (DR-0558). The studio tab marks itself *down* on a road problem instead of messaging. The reason sentence for a 404 (the road is not mounted; nothing on this device is wrong; the recording is safe) survives for the Does-it-work panel and the console, where a steward reads it.

## Verification

36 checks: the device deduced from his Fold's agent, a Pixel's, an iPhone's, Windows and Mac; the Samsung route names General management → Text-to-speech and the search word; the door is the exact intent and is withheld in the shell; every route ends with what to do back in the app; the surface deduces from the live agent and renders the door, steps and after-line; the old sentence is gone; the pick speaks; Download and Use-a-file exist and land in the same store; the citation folds; exactly one notice block, inside the panel, not in the fixed stack, with two marks and no timer; the road classified and the read proven to raise no notice on it; the status line and its clearing; the studio marking itself down. Two older pins rewritten with the reason in place (the timer pins; the "Settings → Text-to-speech" pin).

## Limits, stated

1. **The door is not yet proven on his phone.** `intent:` links from a tap are Chrome-for-Android behaviour; the sandbox cannot tap a phone. Proof: tap *Open the phone's Text-to-speech settings* on the Fold in Chrome and the Samsung screen opens. `re-review: 2026-09-25`.
2. **The Pixel, iPhone, Windows and Mac paths are written from the platforms' documented menus, not measured on those devices this session.** `re-review: 2026-10-01`.
3. **The local app has no door.** A Capacitor settings plugin is the fix; DR-0570 queue. `re-review: 2026-10-08`.
4. **The studio was dark when he read** (the 404). Arming it is channel work (DR-0568); this record makes the reason honest, not the studio live.
