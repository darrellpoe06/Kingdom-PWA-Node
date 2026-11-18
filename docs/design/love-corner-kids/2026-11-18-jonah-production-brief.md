# Jonah and the Great Fish: the production brief (J2 to J4)

**Date:** 2026-11-18 · **Record:** DR-1527 · **For:** Darrell, to produce the illustrations, the narration and the episode. **Status:** every file below is still to be produced; the app takes each one the moment it is in the folder, with no code change (the landed manifest).

## 1. How to hand a file over

Drop files into `app/public/lovecorner/kids/` under the exact names below (scenes at the top level, recordings under `narration/`, the episode under `episodes/`), commit and push. From anywhere in PowerShell, with the real folder in place of Downloads:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
New-Item -ItemType Directory -Force app\public\lovecorner\kids\narration | Out-Null
New-Item -ItemType Directory -Force app\public\lovecorner\kids\episodes | Out-Null
Copy-Item "C:\Users\dpoe\Downloads\jonah\jonah-*.png" app\public\lovecorner\kids\
Copy-Item "C:\Users\dpoe\Downloads\jonah\jonah-p*.m4a" app\public\lovecorner\kids\narration\
Copy-Item "C:\Users\dpoe\Downloads\jonah\jonah-poster.jpg" app\public\lovecorner\kids\episodes\
node scripts\kids-landed-manifest.mjs
git add app\public\lovecorner\kids app\src\lib\kids\landed.json
git commit -m "Jonah: the scenes, the narration, the poster"
git push origin ccr-117befe9-n9u0iz
```

Or attach the files in this channel and I place them. Either way the build regenerates the manifest, the tests prove every file is a real image or recording, and the live walk shows them on the phone.

**The two children, in every image (the approved reference set in the kids folder: `guide-girl.png`, `guide-boy.png`, the two face files, `guides-pair.png`, `bible-adventures-key-art.jpg`).** The girl: braids gathered in a top bun with pink and white beads, small stud earrings, red hoodie over a white tee, black backpack. The boy: short curly twists with a fade, blue hoodie, tan utility vest, backpack. Same faces, hair, skin tones and clothes in every frame; no third child; no change of age. The look is the key art's: a 3D animated feature-film render, warm light, expressive eyes. True to the text: the great fish is the fish the LORD prepared, calm and strong, never a monster; no magic, no fantasy power, nothing the text does not say; the hard parts gentle and short.

## 2. The eight illustrations (J2)

One 16:9 scene per page, PNG (or JPEG), sRGB, named exactly as the id. **At least 1600 × 900 for the storybook; 2400 × 1350 or larger** so the episode's slow camera move stays sharp at 1080p (the movie-maker scales each scene to 1.25× the frame). Each shows what its verse says, the two guides present as witnesses (except page 4, inside the fish). The verse and the guide's caption are what the page prints beside the picture.

**Who is in the frame (Darrell, 2026-11-18).** Every human character in these illustrations is Black / African American: Jonah, the sailors, the people and the king of Nineveh, and the two guides. The two guides are the approved pair and no one else, identical in every scene: the girl (braided hair gathered into a bun, pink and white beads, red hoodie, black backpack) and the boy (short curly twists with a fade, blue hoodie, tan utility vest, backpack), with the same faces, skin tones, hairstyles, clothing and approximate ages as the reference images in the kids folder. The look is a high-quality 3D animated feature-film scene, never a generic cartoon.

**Until a scene lands, its page keeps the existing temporary artwork** (the interim open-Bible picture with the guide's face). No unrelated illustration stands in for a missing scene; the registry shows a page's real scene only when `jonah-N.png` is in the folder (the landed manifest), and the manifest test proves each file is a real image.

### `jonah-1.png` · page 1 · Jonah 1:1-3

**Scene.** Jonah, a bearded man in a simple robe, hurrying down a stone dock at Joppa toward a wooden ship, a coin purse in hand, looking back over his shoulder the wrong way; the two guides on the dock watching, the girl's hand over her mouth.

**KJV (printed and read on the page).** *"Now the word of the LORD came unto Jonah the son of Amittai, saying, Arise, go to Nineveh, that great city, and cry against it; for their wickedness is come up before me. But Jonah rose up to flee unto Tarshish from the presence of the LORD, and went down to Joppa; and he found a ship going to Tarshish: so he paid the fare thereof, and went down into it, to go with them unto Tarshish from the presence of the LORD."*

**The guide's caption (girl).** Yahweh told Jonah to go to Nineveh. Look which way Jonah is going! That is the wrong way.

### `jonah-2.png` · page 2 · Jonah 1:4

**Scene.** The ship pitched in a great wind, waves high, sailors hauling ropes, afraid. (Landed 2026-11-18 without the guides in frame; approved as is by Darrell. The boy's face stays beside his caption on the page.)

**KJV (printed and read on the page).** *"But the LORD sent out a great wind into the sea, and there was a mighty tempest in the sea, so that the ship was like to be broken."*

**The guide's caption (boy).** Hold on tight! Yahweh sent a great wind, and the sailors were afraid.

### `jonah-3.png` · page 3 · Jonah 1:17

**Scene.** From the shore: the great fish the LORD prepared rises beside the ship, enormous, calm and strong, not a monster; Jonah is already in the water; the guides on the beach, the boy holding his lantern high, the girl pointing.

**KJV (printed and read on the page).** *"Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights."*

**The guide's caption (boy).** Three days inside a fish! Yahweh had a plan for Jonah even there.

### `jonah-4.png` · page 4 · Jonah 2:1

**Scene.** Inside the fish, dim and strange, Jonah on his knees praying with hands lifted; a soft light from above him only; the guides are not in this one.

**KJV (printed and read on the page).** *"Then Jonah prayed unto the LORD his God out of the fish’s belly,"*

**The guide's caption (girl).** Even inside the fish, Jonah could pray. Yahweh hears us anywhere.

### `jonah-5.png` · page 5 · Jonah 2:10

**Scene.** The fish at the shoreline setting Jonah safely on dry sand; Jonah on hands and knees, grateful; the guides running toward him with joy.

**KJV (printed and read on the page).** *"And the LORD spake unto the fish, and it vomited out Jonah upon the dry land."*

**The guide's caption (girl).** Safe on dry land! Yahweh told the fish what to do, and it did.

### `jonah-6.png` · page 6 · Jonah 3:1-3

**Scene.** Jonah walking through the great gate of Nineveh, a huge city of walls and towers; the guides walking beside him, looking up at the walls.

**KJV (printed and read on the page).** *"And the word of the LORD came unto Jonah the second time, saying, Arise, go unto Nineveh, that great city, and preach unto it the preaching that I bid thee. So Jonah arose, and went unto Nineveh, according to the word of the LORD. Now Nineveh was an exceeding great city of three days’ journey."*

**The guide's caption (boy).** This time Jonah went the right way. Nineveh was a very big city.

### `jonah-7.png` · page 7 · Jonah 3:5

**Scene.** The people of Nineveh in the streets, in rough sackcloth, kneeling and listening, the king among them; the guides at the edge of the crowd, moved.

**KJV (printed and read on the page).** *"So the people of Nineveh believed God, and proclaimed a fast, and put on sackcloth, from the greatest of them even to the least of them."*

**The guide's caption (girl).** The people listened and believed God. Even the king put on rough clothes to show he was sorry.

### `jonah-8.png` · page 8 · Jonah 3:10

**Scene.** Morning over Nineveh, the city whole and the sky clear; Jonah on a hill looking at it; the guides beside him, the girl's arm around the boy's shoulder, both smiling at the city.

**KJV (printed and read on the page).** *"And God saw their works, that they turned from their evil way; and God repented of the evil, that he had said that he would do unto them; and he did it not."*

**The guide's caption (boy).** Yahweh saw that they turned from doing wrong, and He showed them mercy. He is kind!

## 3. The eight narration recordings (J3)

One file per page under `narration/`, **`jonah-p1.m4a` through `jonah-p8.m4a`** (AAC in M4A preferred; MP3, OGG or WAV also taken), mono, 44.1 kHz, about 128 kbps, under 1 MB each. The same reader for all eight, a quiet room, about half a second of silence at each end. Each recording reads, in this order and exactly as printed in section 2: **the KJV verse**, a breath, **the guide's caption**. No added words, no music under the voice (music belongs to the episode). The page plays the recording for Hear this page and Read to me, pauses and resumes it, turns the page at its end, and lights the sentence being read; the lighting is an estimate over the recording's length until each file is timed, after which the timings go into `app/src/lib/kids/narration-cues.json` (I time them from the files; nothing is needed from the reader for that).

The narration script, page by page:

1. **`jonah-p1.m4a`** · "Now the word of the LORD came unto Jonah the son of Amittai, saying, Arise, go to Nineveh, that great city, and cry against it; for their wickedness is come up before me. But Jonah rose up to flee unto Tarshish from the presence of the LORD, and went down to Joppa; and he found a ship going to Tarshish: so he paid the fare thereof, and went down into it, to go with them unto Tarshish from the presence of the LORD." · (breath) · "Yahweh told Jonah to go to Nineveh. Look which way Jonah is going! That is the wrong way."
2. **`jonah-p2.m4a`** · "But the LORD sent out a great wind into the sea, and there was a mighty tempest in the sea, so that the ship was like to be broken." · (breath) · "Hold on tight! Yahweh sent a great wind, and the sailors were afraid."
3. **`jonah-p3.m4a`** · "Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights." · (breath) · "Three days inside a fish! Yahweh had a plan for Jonah even there."
4. **`jonah-p4.m4a`** · "Then Jonah prayed unto the LORD his God out of the fish’s belly," · (breath) · "Even inside the fish, Jonah could pray. Yahweh hears us anywhere."
5. **`jonah-p5.m4a`** · "And the LORD spake unto the fish, and it vomited out Jonah upon the dry land." · (breath) · "Safe on dry land! Yahweh told the fish what to do, and it did."
6. **`jonah-p6.m4a`** · "And the word of the LORD came unto Jonah the second time, saying, Arise, go unto Nineveh, that great city, and preach unto it the preaching that I bid thee. So Jonah arose, and went unto Nineveh, according to the word of the LORD. Now Nineveh was an exceeding great city of three days’ journey." · (breath) · "This time Jonah went the right way. Nineveh was a very big city."
7. **`jonah-p7.m4a`** · "So the people of Nineveh believed God, and proclaimed a fast, and put on sackcloth, from the greatest of them even to the least of them." · (breath) · "The people listened and believed God. Even the king put on rough clothes to show he was sorry."
8. **`jonah-p8.m4a`** · "And God saw their works, that they turned from their evil way; and God repented of the evil, that he had said that he would do unto them; and he did it not." · (breath) · "Yahweh saw that they turned from doing wrong, and He showed them mercy. He is kind!"

## 4. The animated episode (J4)

- **`episodes/jonah.mp4`**: 16:9, 1920 × 1080, H.264 video with AAC stereo audio, 5 to 8 minutes, the eight scenes in order with the narration above as the voice track (the same reader), music and sound (the wind, the sea, the city) under it, never over it. The Word is spoken word for word from the KJV; the captions carry the same words.
- **`episodes/jonah-poster.jpg`**: the poster frame, 16:9, at least 1600 × 900, the two guides and the great fish, the logo lockup optional. The poster alone, before the video, marks the episode IN PRODUCTION on the shelf and shows there; with the video it is the frame the Theater shows before play.
- **`episodes/jonah.en.vtt`**: the captions. The script is already written from the KJV in `jonah-episode-captions.en.vtt` beside this brief; once the episode is cut I re-time its cues to the finished picture and place the file. Nothing is needed from the studio for the words.
- **Where the video lives.** The app is served from Cloudflare Pages, whose documented per-file limit is 25 MiB, so the finished MP4 does not go in the repository. The sovereign road is the NAS serving it at the same path through the same-origin transport (Caddy-served, like the tax feature's files); the fallback is an unlisted YouTube upload, which the Theater already plays. I wire whichever you choose the day the file exists; the poster and the captions go in the repository either way.

## 5. What the app does with each file, the day it lands

| File | Effect, with no code change |
|---|---|
| `jonah-N.png` | Page N shows it; Put the story in order shows it on the card; the Theater shelf thumbnail uses `jonah-3`. |
| `narration/jonah-pN.m4a` | Page N is NARRATED: Hear this page and Read to me play it; the sentence lights as it is read. |
| `episodes/jonah-poster.jpg` | The shelf reads IN PRODUCTION with the poster. |
| `episodes/jonah.mp4` (+ `.en.vtt`) | The episode is PUBLISHED: Now showing in the Theater, WATCH on the shelf, the trail's last stop opens, Front Row is earned at the end. |

## 6. Checklist

- [ ] `jonah-1` … `jonah-8` (2 of 8 on disk, 2026-11-18: `jonah-1.jpg`, `jonah-2.jpg`; scene 2 has no guides in frame, approved as is by Darrell 2026-11-18)
- [ ] `narration/jonah-p1.m4a` … `jonah-p8.m4a` (0 of 8)
- [ ] `episodes/jonah-poster.jpg` (0 of 1)
- [ ] `episodes/jonah.mp4` (0 of 1; served off-repo)
- [x] `episodes/jonah.en.vtt` script written; timing waits on the cut
