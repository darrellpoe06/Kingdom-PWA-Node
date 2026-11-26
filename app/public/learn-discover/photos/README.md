# Learning Zone photography: replacing a picture

Each picture is named for the slot it fills. To replace one with the full-resolution original, save the new file **with the same name and the `.webp` extension** in this folder and commit it. No code changes. Nothing else in the app reads these files.

| File | Where it shows | Suggested size |
|---|---|---|
| `welcome-banner.webp` | the banner | 2400 x 840 |
| `topic-*.webp` (11) | the Explore by Topic tiles (and the Bible-study photo is also the desktop banner Bible) | 1280 x 720 |
| `series-*.webp` (4) | Featured Series | 1280 x 720 |
| `todays-word.webp` | the open Bible on Today's Word and the mobile banner | 1280 x 800 |

Converting a JPG or PNG: `cwebp -q 88 original.jpg -o topic-faith-spiritual-growth.webp` (or any editor's Export as WebP). Keep each file under about 400 KB.
Technology uses an existing lesson cover; the Building a Stronger Marriage series shares `topic-marriage-relationships.webp`. Lesson, course and Continue Learning pictures are never in this folder.
