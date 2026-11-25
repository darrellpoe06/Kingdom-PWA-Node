# Jonah and the Great Fish: the animated episode, production plan

**Date:** 2026-11-19 · **For:** Darrell · **Status:** plan only. Nothing here changes the live Jonah experience. The Theater keeps reading "read aloud now · episode coming soon" until a finished episode file lands (the landed manifest, DR-1527).

## Status, 2026-11-25: the complete cut is in review

The complete movie (9 min 37 s, Jonah 1 to 4, -16.5 LUFS) is built from Darrell's fourteen Runway Gen-4.5 clips with the approved stills between them (`scripts/kids-episode/jonah.shots.json`). Every line is spoken by its character from the cast in `jonah.episode.json` (Kokoro open voices, Apache-2.0; Yahweh's words stay with the narrator), and the guides close with the lesson, the memory verse and goodbye, then the credits. It is in Darrell's private review and is not in the Theater until he approves it.

## 1. What we already have, and what we can reuse

| Asset | Where | Reuse in the episode |
|---|---|---|
| Eight approved scene illustrations (1672×941 to 1920×1080) | `app/public/lovecorner/kids/jonah-1..8.jpg` | Every shot starts from one of these. Scenes 1, 2, 4, 5 and 6 are final. 3, 7 and 8 are temporary until the corrected renders land. |
| The two approved guides, cut out on transparency | `guide-girl.png`, `guide-boy.png`, the two face files, `guides-pair.png` | Character layers for intro, outro and between-scene moments (animated breathing, blinks, gestures by layer transforms). |
| The KJV text of Jonah, in repo | `app/public/bible/kjv/Jonah.json` | The script is read from it, never typed by hand. |
| The guide captions per page | `app/src/lib/kids/storybooks.js` | The guides' lines in the episode. |
| The episode cutter (ffmpeg) | `scripts/kids-make-episode.mjs` | Already cuts all eight scenes with a slow camera move, crossfades, timed KJV captions, a poster and a sidecar saying what each shot was made from. A 58-second silent draft was cut from it on 2026-11-18. This is the spine we extend. |
| The caption script | `docs/design/love-corner-kids/jonah-episode-captions.en.vtt` | Re-timed to the finished cut. |
| The Theater player, poster, captions, PUBLISHED state | `Theater.jsx`, `lib/kids/theater.js` | No code needed: dropping `episodes/jonah.mp4`, `jonah-poster.jpg` and `jonah.en.vtt` publishes it. |
| The live phone walk | `scripts/live-kids-zone-walk.mjs` | Extended to press WATCH and confirm the video plays on production. |

## 2. What "animated" will honestly mean, in three tiers

A feature-film 3D episode (rigged characters, lip-sync, every frame rendered from 3D models) is studio work: an outside 3D artist, months, and real money. We can still deliver real motion in phases, each one releasable.

1. **Tier 1: the living storybook (2.5D animation).** Each scene is split into layers (sky, sea, ship, characters, foreground). The camera moves through them with real depth (parallax). Water, rain, spray, light rays, sand and dust move. The guides breathe, blink, turn and point by layer animation. Narration, music, sound effects and burned-in or track captions are included. **Fully buildable here, automatically.** This is not a slideshow: nothing on screen is ever fully still.
2. **Tier 2: hero motion shots (AI image-to-video).** For the moments that need real character movement (the storm, the sailors at the ropes, Jonah praying, the fish setting him on dry land, Nineveh kneeling), 5 to 10 second clips are generated *from our approved stills*, so faces and clothes start from the approved look. Each clip is reviewed for character consistency and accuracy to the Word before it replaces a Tier 1 shot. Two roads exist (section 4).
3. **Tier 3: true 3D (optional, later).** Built 3D models of the two guides and Jonah, animated in Blender. Needed only if we want a long-running series with full acting and lip-sync. Outside artist required.

**Recommendation:** release Tier 1 as the first Jonah episode, then swap in Tier 2 hero shots as they pass review. Decide on Tier 3 after the series has three episodes.

## 3. The episode (target 6 minutes, 1920×1080)

The Word is read verbatim from the KJV. Jonah 1 to 3 selected verses come to about 720 words (measured from the in-repo text), about 5.5 minutes at a children's reading pace; the script trims to land at 6 minutes with the guides' lines, intro and outro. Nothing is added to the Biblical events. The guides never claim to have been there: they watch "the story the Word tells."

| # | Beat | KJV (read verbatim) | Scene source | Motion | Sound |
|---|---|---|---|---|---|
| 0 | Title and the guides welcome the viewer | none (guide line) | `guides-pair`, logo | guides wave, title rises | theme music |
| 1 | The call and the flight to Joppa | 1:1-3 | jonah-1 | harbor water, gulls, sail flapping, Jonah walking off | harbor, footsteps |
| 2 | The great wind | 1:4-7 | jonah-2 | rain, lightning flash, waves, ropes strain | storm, thunder |
| 3 | Jonah tells the sailors the truth; cast into the sea | 1:10-12, 1:15-16 (gentle, short) | jonah-2 / new shot | sea calms after 1:15 | storm fades to calm |
| 4 | The great fish | 1:17 | jonah-3 | fish rises, lantern glow, waves | deep swell |
| 5 | Prayer inside the fish | 2:1-2, 2:7, 2:9 | jonah-4 | light rays, floating particles, weeds sway | muted underwater hum |
| 6 | Dry land | 2:10 | jonah-5 | surf, guides run in | waves, joyful cue |
| 7 | The second call; into Nineveh | 3:1-4 | jonah-6 | crowd movement, banners | city ambience |
| 8 | Nineveh believes; the king in sackcloth | 3:5-9 | jonah-7 | crowd kneels, dust in light | hush, low strings |
| 9 | Yahweh shows mercy | 3:10 | jonah-8 | morning light sweeps the city | theme returns |
| 10 | The guides close: Jonah 2:9 memory verse and the invitation to the storybook and games | 2:9 (verbatim) | guides | guides turn to camera | theme outro |

**A decision for you (recommended default: include it):** Jonah 4 is the true end of the book. In it, Jonah is displeased at Yahweh's mercy and Yahweh teaches him (4:1-2, 4:10-11). A short closing beat with those verses keeps the story faithful to the whole book and fixes the scene 8 problem at its root. It adds about 45 seconds.

## 4. Tools: what is available, what runs automatically, what needs you

| Need | Tool | Status | Automatic? |
|---|---|---|---|
| Layer splitting of scenes | Canva "separate image layers" / background removal; or segmentation run on the church GPU | Canva: blocked until AI credits return. GPU: needs the runner road to the NAS | Yes, once one road is open |
| 2.5D animation, camera, particles, compositing | ffmpeg (installed), Picsart Media Studio (connected; keyframed layers, effects, looks, transitions, export; exercised to 100 layers, 4096 px, 60 min), Playwright/Chromium (installed) | **Available now** | **Yes** |
| AI image-to-video hero shots | (a) Canva video generation: 5 to 30 s per clip, 720p, draws on your monthly AI limit, needs your explicit OK per batch. (b) Sovereign: an open model (LTX-Video or Wan 2.x class) on the church 2× RTX 4070 | (a) blocked until credits return; 720p is below the 1080p target. (b) **not yet installed**; whether the 12 GB cards run these at our quality is unverified until tried | (a) yes, per-batch approval. (b) yes, once installed, as a render job with a budget and a single-instance lock (DR-0247/0248) |
| Narration voice | (a) a human reader you choose (best). (b) your own voice via the sovereign XTTS-v2 studio (`infra/voice-studio`, consent-gated). (c) Piper, the labelled stand-in voice on the NAS CPU (`infra/nas-voice-lite`) | All exist; (b) and (c) are reached through the NAS road | (b) and (c) yes; (a) needs the recordings |
| The guides' voices | Two child voices: real children with a parent's written consent, or a reader doing two voices | **Your decision** | No |
| Music | Licensed royalty-free library tracks (license kept in the repo), or an original commissioned theme. AI music models exist but their weights are mostly non-commercial; fine for church use, as with XTTS, but your call | **Your decision** | Once chosen, yes |
| Sound effects | Licensed royalty-free SFX (CC0 or library) | Needs a source you approve | Yes, once chosen |
| Captions | Generated from the script and timed to the narration (Whisper on the GPU, or timed from the cut) | Available | Yes |
| Where the video lives | NAS same-origin road (sovereign) or an unlisted YouTube upload. Cloudflare Pages cannot hold a file over 25 MiB | **Your decision**, still open from J2 | Yes, once chosen |

**What needs you, in one list:**
1. The narration voice (human reader, your own voice, or the labelled stand-in).
2. The guides' voices.
3. A music source and a sound-effects source.
4. Where the video is hosted (NAS or unlisted YouTube).
5. Canva AI credits, or a go to install a sovereign image-to-video model on the church GPU.
6. Include Jonah 4 (recommended yes).
7. Final approval of each phase on your phone before it reaches children.

## 5. Phases (each one releasable without waiting for the rest)

| Phase | What ships | Needs from you | Working time once unblocked |
|---|---|---|---|
| E0 · Plan and template (this document; the template below) | Nothing live changes | none | done this session |
| E1 · Script and animatic | Full timed script from the KJV, shot list, a silent animatic with placeholder motion, reviewed by you | item 6 | 1 session |
| E2 · Tier 1 episode, v1 | 2.5D animation of all beats, music, SFX, narration, captions, poster. Theater shows WATCH | items 1–4 | 2–3 sessions after the voice recordings and music arrive |
| E3 · Corrected art | Scenes 3 and 8 corrected, scene 6 with a full Assyrian gate, all scenes at 2400×1350 or larger | item 5 | 1 session after credits/GPU |
| E4 · Hero motion shots | 5 to 8 Tier 2 clips replacing Tier 1 shots, each reviewed | item 5 | 2–4 sessions, depending on how many clips pass review |
| E5 · Final mix and release | Final audio mix, final captions, the live walk presses WATCH on production | item 7 | 1 session |

## 6. Realistic timeline

The timeline below is in calendar terms. The working sessions are short. The waits are mostly on the decisions and recordings in section 4.

- **Jonah episode, Tier 1 (E1 + E2):** about **1 to 2 weeks** from the day you choose the voice, music and hosting. The work itself is about 3 to 4 sessions; the rest is recording time and your review rounds.
- **Jonah with corrected art and hero shots (E3 + E4 + E5):** about **2 to 4 more weeks**, depending on Canva credits or the GPU install, and on how many generated clips pass review.
- **True 3D (Tier 3), if wanted:** **2 to 4 months** with an outside 3D artist.
- **The next Bible adventure (Noah or David, already on the Theater shelf as planned):**
  - **Storybook, games, memory verse, map and badges live:** about **3 to 5 days** from the start, using the template. The eight illustrations are the bottleneck (generation, your review, corrections).
  - **Its Tier 1 episode:** about **1 week** after its art is approved, using the same pipeline and voices.

## 7. The reusable adventure template (prepared now, built in E1)

One file per adventure drives everything, so the next story is mostly data:

```
adventures/<id>.json
  id, title, book, chapters, memoryVerse, keyVerse
  pages[8]:   { ref, scene: "<id>-N", guide: "girl"|"boy", caption, sceneBrief }
  questions[]: { prompt, choices, answer, ref }
  episode:    { targetSeconds, beats[]: { ref | guideLine, scene, layers[], motion, sfx[], music } }
  characters: { guides: approved reference files, biblical: look notes, all Black }
```

From that one file, scripts generate:

1. the storybook registry entry and the games data, in the shape `storybooks.js` already uses;
2. the production brief (scene briefs, KJV text, narration script);
3. the narration script and caption cues, with the KJV text read from the in-repo corpus and never typed by hand;
4. the episode cut: `kids-make-episode.mjs`, extended from "eight stills" to "beats with layers, motion, SFX and music";
5. the checks: verse refs exist in the corpus; every page has a scene; the guides are only the approved pair; the capitalization rules hold.

The current Jonah data becomes the first `adventures/jonah.json`, which proves the template reproduces the live experience exactly before Noah or David uses it.

## 8. Guardrails

- The live Jonah storybook and Theater are not touched until a finished episode file is approved by you on the phone.
- KJV read verbatim; no invented events, no magic, nothing the text does not say; the hard moments (the storm, Jonah cast into the sea) gentle and short.
- Every person in the episode is Black; the guides are only the approved pair, identical in every frame.
- Every generated clip is reviewed for character consistency and accuracy to the Word before it is used.
- No commercial music without a license on file; licenses are recorded beside the episode.
- Any GPU render job ships with a budget and a single-instance lock (DR-0247/0248).
