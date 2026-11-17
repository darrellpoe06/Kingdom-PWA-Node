# The Love Corner Bible Adventures: the character artwork collection (brief)

Date: 2026-11-13. For: Darrell, to generate from the approved character reference. Status: **the Kids Zone visual design stays on hold until these renders land.** The reference image is `app/public/lovecorner/kids/guides-reference.png` (also beside the mockup under `docs/design/love-corner-kids/assets/`). Interim cutouts from it (`guide-girl.png`, `guide-boy.png`, the two `-face.png` avatars, `logo.png`, `guides-pair.png`, `bible-open.png`, the five `door-*.png`) are placeholders only, never final artwork.

## 1. The rules every image follows

1. **Same two children, always.** The girl and the boy of the reference, with the same faces, skin tones, hairstyles and wardrobe (section 2). No third child stands in for either; supporting children in a scene are new, consistent characters, never these two re-dressed.
2. **Same look.** High-quality 3D animated feature-film render, as the reference: soft studio-warm lighting, gentle depth of field, expressive eyes, natural smiles, rich skin with subsurface warmth, clean clothing detail. Never flat vector, never clip-art, never photoreal children, never a different age.
3. **Christ-centered and true to the text.** A Bible scene shows what the verse says, in the order it says it. Miracles are the acts of Yahweh shown plainly (the great fish the LORD prepared; the door Yahweh shut; the stone that flew). No magic, spells, wands, glowing runes, fairies, genies, potions, wishes, superpowers, occult signs, or "mystical" light that is not the text's own. No scary gore; the hard parts of a story stay gentle and short.
4. **The church's colors live in the frame, not the costumes.** The children keep their reference wardrobe (red and black). True red on the page is for the Blood and the brand; scenes use natural color.
5. **Three kinds of file.** CUTOUT: a child on a transparent background (PNG, alpha, 1200 px tall, full body unless said half-body). HEADER: a 3:2 scene with the children and the activity's props, 1500 × 1000 PNG or JPEG. SCENE: a 16:9 story illustration, 1600 × 900 PNG or JPEG. Every file at least that size; larger is fine.
6. **Names.** The guides have none yet. The file names below are roles (`girl`, `boy`); when Darrell names them the registry gets the names and the files keep their ids.
7. **Delivery.** Drop files into `app/public/lovecorner/kids/` with the exact names below. From anywhere in PowerShell (replace the Downloads path with the real folder):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
Copy-Item "C:\Users\dpoe\Downloads\kids-art\*.png" app\public\lovecorner\kids\
git add app\public\lovecorner\kids
git commit -m "Kids Zone character artwork: the renders from the approved reference"
git push origin ccr-117befe9-n9u0iz
```

The registry (`app/src/lib/kids/guides.js`, `SHOT_LIST`) names every file below; its test proves each registered file is on disk, and a surface shows a labeled slot for any shot that has not landed.

## 2. The character bible (from the reference)

**The girl.** About nine. Deep warm brown skin. Long box braids past the shoulders, parted at the crown, with a big red satin bow on top; small gold hoop earrings. Bright, wide eyes; open, dimpled smile. Red hoodie with white-and-black stripes on the sleeve cuffs. In the reference she leans on her hand over an open Bible.

**The boy.** About ten. Warm brown skin, a shade lighter than the girl's. Short curly twists on top with a clean fade at the sides. Warm, easy smile, bright eyes. Black hoodie with red lining and red drawstrings, a white T-shirt under it. In the reference his arms are folded on the table over the open Bible.

**Continuity notes for the generator.** Keep the bow, the hoops, the hoodies and the hairlines identical in every image. Eye shape and smile are the identity; do not re-style them. Ages do not change between images.

## 3. The images, surface by surface

The id is the file name without `.png`. CUTOUT files carry alpha. "Expression" is the face; "Action" is the body.

### 3a. The home (Screen 1)

| id | Kind | Where | Description |
|---|---|---|---|
| `home-hero` | SCENE | the hero band | The two guides on a green hill at sunrise, a winding dotted path behind them up to a gold-lit treasure chest, a big open Bible on a rock beside them. The girl holds an unrolled parchment treasure map and looks at the viewer, delighted; the boy stands a half-step ahead, pointing up the path, lantern in his other hand. Blue sky with a few stars still out. |
| `girl-wave` | CUTOUT | Meet your guides | Full body, facing the viewer, waving with her right hand, big smile. |
| `boy-wave` | CUTOUT | Meet your guides | Full body, facing the viewer, waving with his left hand, warm grin. |
| `girl-reading-lantern` | HEADER | This week's adventure card | The girl sitting cross-legged on a rug, a big open Bible on her lap, a lantern beside her, reading with one finger on the line, absorbed and happy. |
| `pair-theater-tile` | HEADER | Theater door | The two on beanbags in a dim room, lit by a glowing screen in front of them (the screen is out of frame or shows soft light only), faces up, eyes wide, popcorn optional. |
| `girl-storybook` | HEADER | Storybooks door | The girl holding up an open picture-storybook toward the viewer, showing the page (the page shows a simple sea and a fish), proud and inviting. |
| `boy-reading-headphones` | HEADER | Reading corner door | The boy with headphones on, following a line in an open Bible with his finger, mouthing the words, content. |
| `girl-remembering` | HEADER | Memory verse tile | The girl with eyes closed and one hand to her temple, smiling, remembering; three small blank word cards float above her. |
| `boy-question` | HEADER | Bible trivia tile | The boy with his hand raised high, eager, a big gold question mark above him. |
| `girl-blocks` | HEADER | Word builder tile | The girl lifting a big wooden letter block ("W") onto a stack that reads O, R, D. |
| `boy-magnifier` | HEADER | Who am I? tile | The boy holding a magnifying glass up toward a purple stage curtain, one eye squinting, detective-serious and fun. |

### 3b. The guides' speech bubbles (every activity screen)

Half-body CUTOUTS, waist up, facing slightly left so they sit beside a bubble on their right. Eight expressions carry every line the app says.

| id | Expression and action |
|---|---|
| `girl-point` | pointing to her right (toward the bubble), explaining, bright |
| `girl-encourage` | thumbs up, warm grin ("you've got this") |
| `girl-wonder` | hands clasped, eyes wide, amazed |
| `girl-shh-listen` | finger to lips, eyes up, listening |
| `boy-explain` | open palm up, friendly teaching face |
| `boy-think` | finger on chin, eyebrows up, thinking |
| `boy-cheer` | both fists up, mouth open in a cheer |
| `boy-reading-point` | holding a small open Bible, pointing at a line |

### 3c. The Bible Adventure Theater (Screen 7)

| id | Kind | Description |
|---|---|---|
| `theater-key-art` | SCENE | The approved reference image is this already (`guides-reference.png`). Nothing new needed. |
| `pair-theater-wide` | SCENE | The two on beanbags in a dark theater, seen from behind the screen's edge, faces lit by it, a bag of popcorn between them. Used when nothing is playing. |
| Episode thumbnails | — | Stills from the episodes themselves when they exist; none needed now. |

### 3d. The storybooks (Screen 8): one SCENE per page, the guides present as witnesses

**Jonah and the Great Fish** (8 pages)

| id | Verse | Scene |
|---|---|---|
| `jonah-1` | Jonah 1:1-3 | Jonah, a bearded man in a simple robe, hurrying down a stone dock at Joppa toward a wooden ship, a coin purse in hand, looking back over his shoulder the wrong way; the two guides on the dock watching, the girl's hand over her mouth. |
| `jonah-2` | Jonah 1:4 | The ship pitched in a great wind, waves high, sailors hauling ropes, afraid; the guides gripping the rail, braids and hood flying. |
| `jonah-3` | Jonah 1:17 | From the shore: the great fish the LORD prepared rises beside the ship, enormous, calm and strong, not a monster; Jonah is already in the water; the guides on the beach, the boy holding his lantern high, the girl pointing. |
| `jonah-4` | Jonah 2:1 | Inside the fish, dim and strange, Jonah on his knees praying with hands lifted; a soft light from above him only; the guides are not in this one. |
| `jonah-5` | Jonah 2:10 | The fish at the shoreline setting Jonah safely on dry sand; Jonah on hands and knees, grateful; the guides running toward him with joy. |
| `jonah-6` | Jonah 3:1-3 | Jonah walking through the great gate of Nineveh, a huge city of walls and towers; the guides walking beside him, looking up at the walls. |
| `jonah-7` | Jonah 3:5 | The people of Nineveh in the streets, in rough sackcloth, kneeling and listening, the king among them; the guides at the edge of the crowd, moved. |
| `jonah-8` | Jonah 3:10 | Morning over Nineveh, the city whole and the sky clear; Jonah on a hill looking at it; the guides beside him, the girl's arm around the boy's shoulder, both smiling at the city. |

**Noah and the Door Yahweh Shut** (8 pages: Genesis 6:8, 6:14, 6:22, 7:7-9, 7:16, 8:11, 8:20, 9:13). Same pattern: the ark built plank by plank on dry land with neighbors watching; animals two by two up the ramp; the door shut from outside with no hand on it; the dove with the olive leaf; Noah's altar; the bow in the cloud with the family and the guides beneath it.

**David and the Giant** (8 pages: 1 Samuel 17:4, 17:33, 17:40, 17:45, 17:49, 17:50-51, 17:52, 18:1). The giant's size shown by scale, never by gore; the sling, the five smooth stones from the brook; the stone's flight; the giant fallen face-down (no blood); the army's shout; David and Jonathan's friendship.

### 3e. The games (Screens 4 and 5)

| id | Kind | Description |
|---|---|---|
| `word-builder-header` | HEADER | The girl mid-lift, placing a big letter block on a tall stack, tongue out in concentration, blocks spelling part of a word. |
| `who-am-i-header` | HEADER | The boy with the magnifying glass before a purple curtain; behind the curtain a tall silhouette with a question mark; dramatic spotlight. |
| `memory-verse-header` | HEADER | The girl with eyes closed, reciting, one hand on her heart; word cards float around her. |
| `trivia-header` | HEADER | The boy at a little podium with a buzzer, hand slapping it, grinning. |

### 3f. Achievements and the map (Screen 6)

| id | Kind | Description |
|---|---|---|
| `pair-celebrate` | SCENE | Both guides jumping with arms up in a burst of gold confetti and stars, pure joy. |
| `girl-badge` | CUTOUT | The girl holding a big gold star badge in both hands, showing it to the viewer, beaming. |
| `boy-map` | CUTOUT | The boy holding an unrolled treasure map, pointing at a lit stop on it. |
| `pair-chest` | SCENE | The two opening the treasure chest at the end of the path; inside, an open Bible glowing warm gold; their faces lit by it. |

### 3g. Coloring pages (every lesson's sheet)

| id | Kind | Description |
|---|---|---|
| `girl-lineart` | CUTOUT | The girl, full body, as clean black LINE ART with no shading and no fill: thick even outlines, big closed regions a crayon can fill, holding an open Bible. For the printed coloring sheets. |
| `boy-lineart` | CUTOUT | The boy, full body, the same line-art treatment, one hand raised in a wave. |

### 3h. Not these two

- **Teens 11–17** need their own two approved characters (a girl and a boy of about fifteen) in the same style; the Teens screens show a labeled slot until a reference arrives. Decision: Darrell's.
- **Little Ones 3–6** reuse the guides as big-sibling helpers; no extra character.
- **Ari** is not a child and gets no face; the gold star mark stays.
- **Grown-ups** needs no character art.

## 4. Count and order

54 images in all: 11 home, 8 bubbles, 1 theater, 24 storybook pages, 4 game headers, 4 achievement pieces, 2 line-art cutouts for the coloring sheets, plus the reference (already in hand). Suggested order: the 8 bubble cutouts and `home-hero` first (they unlock every screen), then `girl-wave`, `boy-wave`, the 7 home headers, then the Jonah pages, then games and achievements, then Noah and David.
