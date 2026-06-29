# NDI low-hanging fruit — PWA Program Output over the church LAN (2026-06-24)

Layer 4 working artifact + media-team runbook. Ships the **lowest-effort, highest-value
NDI win** for COLG: get the app's program content (lyrics, Scripture, a holding card,
keyed lower-thirds) onto the production switcher and the sanctuary screens **over the
LAN** — IP video routing, no HDMI run from the booth — using **free tooling, NO GPU**.

The NDI/CUDA *generative* pipeline (live speech → A.I. image on the wall) stays the
**deep roadmap** — GPU-gated (DR-0014), Node 2 switcher, forbidden during church hours.
This is the part that ships **without** the GPU box.

## The honest engineering reality

A web browser **cannot emit NDI by itself** — NDI is a native protocol (Vizrt/NewTek
SDK); there is no in-browser NDI encoder. So the low-effort win is **not** writing an
encoder in the PWA. It is the standard, free, proven **bridge**:

```
  PWA program-output URL  ->  OBS "Browser Source"  ->  DistroAV (obs-ndi) plugin
                                                         publishes an NDI source
  NDI source on the LAN   ->  any NDI receiver  ->  sanctuary screen / switcher
```

OBS is already in the Node 1/Node 2 architecture (`2026-06-09-sovereign-ai-orchestrator-architecture.md`).
The app's job — what shipped here — is to **provide the clean program-output route**, a
**generic program-payload contract**, and **this routing runbook**.

## What shipped (this lane)

- `app/src/lib/ndi-output.js` — pure contract: NDI source names, the program-payload
  builders (hold / scripture / lyric / lower-third / slide), URL-param parsing, the
  same-origin output-URL helper, the routing map as DATA, and the honest browser note.
- `app/src/components/NdiProgramOutput.jsx` — the fixed-frame, high-contrast (WCAG AA,
  AudienceWindow tokens) renderer OBS ingests as a Browser Source. Useful **standalone
  via URL params** with no in-app sender built; also listens on a `poetech-program-v1`
  BroadcastChannel for a future in-app "program control" panel to drive it live.
- `app/src/main.jsx` — one additive `?output=1` standalone boot, matching the existing
  `?audience=1` pattern (the heavy app is never pulled into the program window).
- `app/src/__tests__/ndi-output.test.js` — proven-to-catch: param→payload mapping +
  the NO-GPU / browser-can't-emit-NDI honesty.

**No multi-screen or church-live lane files were touched** — `AudienceWindow.jsx`,
`TeachMode.jsx`, `teach-present.js`, `venue-cast.js`, `church-live.js` are read-only
here. The class projector (`?audience=1`, channel `poe-teach-v1`) and this program feed
(`?output=1`, channel `poetech-program-v1`) are independent and never cross-talk.

## The output URL (what the media team opens as a Browser Source)

Same-origin on the existing host, so it rides the current Caddy/Funnel — no new exposure.

- Holding card: `…/poetech-app/?output=1`
- Scripture: `…/poetech-app/?output=1&kind=scripture&ref=John%203:16&text=For%20God%20so%20loved%20the%20world…&translation=ESV`
- Lyric stanza: `…/poetech-app/?output=1&kind=lyric&title=Amazing%20Grace&lines=Amazing%20grace|how%20sweet%20the%20sound`
- Keyed lower-third (transparent for the switcher): `…/poetech-app/?output=1&kind=lower-third&name=Bishop%20Gwin&role=Senior%20Pastor`

LAN host: `http://192.168.1.26:8088/poetech-app/?output=1…`  ·  Funnel: `https://poetech.tail5a2f35.ts.net:8443/poetech-app/?output=1…`

## Wiring it (free tools, church LAN, no GPU)

1. **Install (one PC on the LAN):** OBS Studio + the DistroAV (obs-ndi) plugin, and NDI
   Tools (for NDI Studio Monitor). All free.
2. **PWA → NDI source:** In OBS add a **Browser Source** pointing at the `?output=1` URL
   above; set it to 1920×1080. For a keyed lower-third, check the Browser Source
   **transparent** option (the page already renders a transparent background for keyed
   payloads). Enable **DistroAV → NDI Output** and name it `POETECH (Program)` (and a
   second `POETECH (Lower-Third)` for the keyed bar).
3. **Cameras → NDI:** an NDI-native camera, or any camera through OBS/an NDI encoder,
   publishes its own source on the LAN — ingested the same way (OBS NDI Source).
4. **NDI → screen:** open **NDI Studio Monitor** on the display PC, pick the
   `POETECH (Program)` source, full-screen it onto the sanctuary screen — **or** feed an
   NDI-to-HDMI decoder / the switcher / vMix. No SDI/HDMI run from the booth.

## Why this is the low-hanging fruit

- **Low effort:** the browser can't speak NDI, so the win is config + a clean output
  route, not an encoder. Zero native code, zero SDK in the bundle, zero GPU.
- **High value:** decouples program content from the class-only `?audience` slide and
  the HDMI-to-projector path; any surface (The Word, choir songbook, a class, a future
  control panel) can drive the wall through one IP-routable source.
- **Sovereign:** every hop is church-LAN, free tooling, no cloud, no vendor telemetry.
- **No collision + honest:** new files + one additive boot; the deep NDI/CUDA generative
  pipeline is untouched and stays correctly marked a build target (DR-0076).

## Next increments (not blocking)

- In-app **Program Control** panel (drives `poetech-program-v1` live: pick a song stanza,
  a Scripture, a speaker lower-third). Build as its own module per "new surface = new
  module"; do not add to the monolith.
- Bridge the existing teach-present slide / One-Voice item onto `slideProgram` so the
  class projector and the program feed can share a source when wanted.
