# Jonah and the Great Fish: the first complete Bible Adventure (development plan)

**Date:** 2026-11-17 · **Record:** DR-1523 · **Scope:** the existing Kids Zone inside the PoeTech PWA; no separate app, no redesign.

Darrell, 2026-11-17, after approving the Kids & Youth Zone and the characters: *"Immediately begin the next phase: building the actual interactive Bible Adventures experience. Our first complete adventure will be Jonah and the Great Fish. I want Bible Adventure Theater, interactive storybooks with narration and page turning, Bible games, memory verses, an adventure map, and achievement badges. Keep all existing features. Do not create a separate app. Start by reviewing what already exists so we don't rebuild anything unnecessarily."*

## 1. What already exists (reviewed before planning)

| Piece asked for | What is live today (file) | Verdict |
|---|---|---|
| Bible Adventure Theater | `components/kids/Theater.jsx` + `lib/kids/theater.js`: a poster (the key art) with tap-to-play, an episode shelf (Jonah, Noah, David, all `planned`, shown COMING SOON), the church channel playing until an episode is published. A `published` episode must carry a YouTube link; nothing else plays. | Keep. Needs a self-hosted video path and the Jonah episode. |
| Interactive storybook | `components/kids/Storybook.jsx` + `lib/kids/storybooks.js`: Jonah is 8 pages, each a KJV verse loaded word for word (Jonah 1:1-3, 1:4, 1:17, 2:1, 2:10, 3:1-3, 3:5, 3:10), a guide caption per page, **Hear this page** (the device reader), **Color this page**, page dots, Back/Next, three questions whose answers are in the verses, a learner record `storybook-jonah` on finish. Page art: the interim open-Bible scene with the narrator's face until `jonah-1..8` land. | Keep. Needs narration recordings, a page turn, read-to-me, and the 8 scenes. |
| Bible games | Memory verse (weekly verse, every fourth word blanked), Bible trivia (from the message), Word Builder (the verse's own words), Who am I? (five people, clues from verses; Jonah is not among them). | Keep. Add Jonah to the games. |
| Memory verses | `MemoryVerseGame` plays the week's verse only. | Keep. Add the storybook's own verse. |
| Adventure map | `AdventureMap` in `KidsZone.jsx` lights stops from LESSON rows of the chosen course. | **Gap:** a finished storybook does not light a stop, though the finish screen says "That stop is lit on your map." |
| Achievement badges | `badgesFor` in `lib/youth-zone.js`: six badges derived from real rows; a finished storybook already counts toward First Step and Quiz Star. | Keep. Add adventure badges from the same rows. |

Also in hand: the two approved characters (portraits, faces, pair), the key art, the device reader (`lib/tts.js`, segment highlighting, rate and voice), the in-repo KJV (`public/bible/kjv`), the coloring-page derivation, the voice gate over every line of our own voice, the learner-records sync (signed-in rows, RLS), the live production witnesses (`site-health.yml`, `live-kids-zone-walk.yml`).

## 2. Gaps named plainly (DR-0219)

1. The map does not read `kids-storybooks` rows; the storybook's finish line claims a lit stop that is not lit.
2. Narration is the device's synthetic voice; there is no recorded human reading.
3. Pages cut, they do not turn; there is no read-to-me mode that carries a child through the book.
4. The Theater plays YouTube only; an episode of our own cannot be served from our own files.
5. Nothing Jonah-specific in the games; no Jonah memory verse; no badge a child earns by finishing an adventure.
6. Every Jonah page shows the interim scene (honest, unlabeled) until the eight illustrations land.

## 3. The build, in four steps

Each step ships through the normal lane (tests, gates, PR, auto-merge on green, deploy proven). The first step needs no asset at all and starts now.

### J1. Claude builds now, nothing to wait on

- **The map lights from storybooks.** A "Bible Adventures" trail on the map: one stop per storybook plus a Theater stop, lit from `kids-storybooks` and `kids-theater` rows. The finish line says what is true (lit when signed in, invitation when not). Test: a `storybook-jonah` row lights exactly that stop; signed out lights none.
- **Page turning.** A CSS page-turn (3D flip, 400 ms) on Next/Back and on a horizontal swipe; `prefers-reduced-motion` gets a crossfade. Test: the swipe handler advances and retreats; reduced motion sets no transform.
- **Read to me.** One tap reads the whole book: the verse, then the caption, then turns the page; the sentence being read is highlighted (the reader already segments and reports progress); pause and stop in the same bar. Test: the sequence verse → caption → next page; stop halts and leaves the page.
- **Jonah in the games.** Who am I? gains Jonah (clues Jonah 1:17, 1:3, 3:3, each proven to name him in the KJV); Word Builder offers Jonah 1:17 and 2:10 from the storybook; a new **Put the story in order** game: the eight pages shuffled, the child orders them by caption (by picture once the scenes land), graded "not yet" like every kids game. Tests: order grading, shuffle never equals the answer, every clue verse contains the name.
- **The Jonah memory verse.** Each storybook names its verse (Jonah 2:9, *"Salvation is of the LORD"*); the storybook's last page offers **Learn the verse**, which opens the existing memory verse game on it; the Games tab lists the adventure verses under the weekly one. Test: the game receives the storybook's reference.
- **Adventure badges from the same rows.** `great-fish` (finished Jonah and passed), `three-stories` (three storybooks finished), `front-row` (an episode watched to the end). Tests: each from rows alone; none signed out.
- **A self-hosted episode path.** `lib/kids/theater.js` accepts a same-origin MP4/WebM source beside YouTube; `Theater.jsx` plays it in a `<video>` with the poster, a WebVTT caption track (the KJV verses and captions, written by Claude), and writes `episode-jonah` under `kids-theater` when the video ends. The validator still refuses `published` without a source. Tests: a same-origin source is watchable; `ended` writes the row.
- **The asset drop.** The storybook reads `jonah-<n>.png` the moment it is in `public/lovecorner/kids/` and the registry marks it landed; narration reads `jonah-narration.json` the same way. Nothing on screen says "coming".

### J2. Needs the eight illustrations (section 4a)

The scenes land as files; the registry flips `jonah-1..8` to landed; Put the story in order shows pictures; the Jonah Theater poster is `jonah-3` until a key frame of the video exists. Test: `kids-guides-assets` proves each file is a real PNG or JPEG at or above 1600 × 900.

### J3. Needs the narration recordings (section 4b)

The player prefers the recording and falls back to the device reader when a page has none; **Hear this page** plays the recording; Read to me turns the page when the track ends; per-sentence highlight follows the manifest's timings when they are given, else the reader's. Tests: a page with a recording never speaks synthetically; a missing file falls back without an error on screen.

### J4. Needs the animated video (section 4c)

The episode moves to `in-production` (shelf reads IN PRODUCTION) the day Darrell says production started, and to `published` with its source the day the file is served; Now showing becomes Jonah; the storybook opens after the credits. Test: the validator's proven-to-catch cases stand.

## 4. What we still need to produce (and how to hand it over)

Hand files over the same way as the five character images: attach them in this channel, or drop them into the folder from PowerShell:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
Copy-Item "C:\Users\dpoe\Downloads\jonah-*.png" app\public\lovecorner\kids\
git status
```

### 4a. Illustrations (8 files)

`jonah-1.png` through `jonah-8.png`, 16:9, at least 1600 × 900, PNG or JPEG, the two approved children present as witnesses exactly as the artwork brief describes each scene (`2026-11-13-character-artwork-brief.md`, §3d): the dock at Joppa; the ship in the wind; the great fish the LORD prepared, calm and strong, never a monster; Jonah praying inside the fish (no guides on this page); the fish setting Jonah on dry sand; the gate of Nineveh; the people in sackcloth with the king; morning over the spared city. Same faces, hair, skin and wardrobe as the five approved images; no magic, no occult sign, no gore.

### 4b. Audio narration (8 to 11 files)

One recording per page, `jonah-p1.m4a` through `jonah-p8.m4a` (AAC or MP3, mono, 44.1 kHz, about 128 kbps, under 1 MB each): the reader reads the KJV verse exactly as printed on the page, a short pause, then the guide's caption exactly as printed. Optional: `jonah-q1.m4a` to `jonah-q3.m4a` for the three questions. A quiet room, the same reader for all eight, a second of silence at each end. Claude writes the manifest and the captions; sentence timings are optional (the reader's own highlighting carries the page without them).

### 4c. Animated video (1 file, plus one still)

`jonah.mp4`: 16:9, 1080p, H.264 video with AAC audio, 5 to 8 minutes, with a `jonah-poster.jpg` key frame. **Where it lives:** the app is served from Cloudflare Pages, whose documented per-file limit is 25 MiB, so a finished episode does not go in the repository. Two roads, both already in the architecture: the NAS serving the file through the same-origin transport (the sovereign road, Caddy-served like the tax feature), or an unlisted YouTube upload (already supported by the Theater today). The plan builds for both; Darrell names which when the video exists.

## 5. What does not change

Every game, lesson, quiz, the Grown-Ups tab, Teens Zone, the church home, the records and their RLS, the voice gate, the asset ratchet. No new app, no new route, no redesign of the Kids Zone: the work adds inside the tabs that exist.

## 6. Verification each step carries

Suites green with the new proven-to-catch tests named above; nine screens at 360, 390 and 414 px with no overflow and no target under 36 px; the production walk (`live-kids-zone-walk.yml`) reads ten stops ok after each deploy; the site witness reads UP and fresh. `re-review: 2026-11-24` for J1 built and green or a why.
