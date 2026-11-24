# learn-thumbs — Learn Studio thumbnail compositor

Turns one **text-free** cinematic master image per lesson into every asset the Learn redesign needs, with **our** typography composed on top. It never reads or writes a lesson file.

## Why the AI image is always text-free

Image models misspell words and drift in font, weight and placement from one image to the next. Across 994 lessons that means a rejection-and-regenerate loop that costs money and time. So:

- The provider is asked for a picture with **no text**, with clean negative space on one side.
- The headline is set here in **Anton**, uppercase, at −8° italic skew, with a heavy shadow. Lines are stacked 2–3 deep: line 2 and the last line are gold `#CFA63C`, the rest are white. This matches the approved mockup, and it is the same stacking rule `LearnStudio.jsx` uses.
- In the app, `LearnStudio` overlays the headline live in CSS on the text-free derivatives, so a headline edit in review never needs a new image.
- The composed `og.jpg` carries the same typography baked in, for link previews, social posts and YouTube-style exports.

## Usage

```bash
cd app/scripts/learn-thumbs && npm ci          # one-time; isolated from the PWA
node compose.mjs --image master.png \
  --course living-lessons --lesson ll338-not-with-eyeservice \
  --headline "NOBODY'S WATCHING" --layout left \
  --department "Living Lessons" --out ./out
```

`--layout` names the side the **headline** goes on, which is the side the subject is *not* on. The image prompt asks the provider to leave that side clear.

From code (this is what the batch pipeline calls):

```js
import { composeLesson } from './compose.mjs';
import { dHash, hamming, nearDuplicates, NEAR_DUPLICATE_MAX } from './dhash.mjs';
const manifest = await composeLesson({ image, courseKey, lessonId, thumbHeadline, layout, department, outDir });
```

Failures throw `ComposeError` with a stable `code`:

| Code | Meaning |
|---|---|
| `bad-input` | A required field is missing, or a key isn't slug-safe |
| `read-failed` | The image file couldn't be read |
| `corrupt-image` | The bytes aren't a readable picture |
| `font-fallback` | The SVG isn't rendering in Anton |
| `timeout` | A step ran past its time limit |
| `compose-failed` | Any other composition error |

## Outputs — `<out>/<courseKey>/<lessonId>/`

| File | What it is |
|---|---|
| `master.<ext>` | The provider's original bytes, untouched (kept for re-composition and audit) |
| `w1920 / w1280 / w640 / w320 .avif + .webp` | Text-free 16:9 delivery sizes, cover-cropped with libvips "attention" focus, never enlarged |
| `og.jpg` | 1280×720 share thumbnail with the headline, brand line and legibility gradient composed |
| `manifest.json` | `image: { src, srcSet: { avif, webp }, lqip }`, `sizes`, `width`, `height`, `sha256`, `dhash`, `ogPath`, `headline: { lines, fontSize }` |

`manifest.image` drops straight into a presentation record's `image` field. `src` is the 1280-wide WebP, and `lqip` is a ~24×14 blurred WebP data URI for instant placeholders.

**Atomic writes.** Everything is written to `.<lessonId>.tmp-*`, then renamed into place. The previous version is swapped aside and only removed after the swap succeeds. A corrupt image or a timeout leaves the previous output byte-identical, and no temp directory is left behind (both are tested).

**Timeouts.** Every libvips call has `sharp().timeout()` plus a wall-clock race: 10 s for decode and font steps, 60 s (configurable `timeoutMs`) for each encode.

## Duplicate detection — `dhash.mjs`

`dHash(buffer)` returns a 64-bit difference hash (9×8 greyscale) as 16 hex characters. `hamming(a, b)` gives the bit distance:

- **0–5:** the same picture, re-encoded or resized.
- **6–12:** near-duplicate, sent to a person.
- **Over 12:** a different picture.

`nearDuplicates(entries)` lists every pair within `NEAR_DUPLICATE_MAX` (12). Exact duplicates are also caught by `manifest.sha256`.

## Fonts and licensing

- `fonts/Anton-Regular.ttf` is decompressed from `public/fonts/anton-latin.woff2` (Fontsource 5.3.0), because FreeType here can't be relied on to read WOFF2. It is the same font under the same license.
- Anton is licensed under the **SIL Open Font License 1.1**. The license is in `fonts/OFL-Anton.txt` (also `public/fonts/OFL-Anton.txt`). The OFL permits embedding in images and redistribution with the license; the font itself may not be sold on its own.
- **Deterministic rendering.** At load, `compose.mjs` writes a fontconfig file with absolute paths that lists **only** `fonts/`, and points `FONTCONFIG_FILE` at it before sharp loads. `assertAntonRenders()` then renders a probe line through the SVG path and compares its width to Pango's measurement from the font *file*. If they differ by more than 10%, it throws `font-fallback` rather than shipping thumbnails in the wrong face. Measured ratio: 1.00.
- **If the host already sets `FONTCONFIG_FILE`,** it is respected, and the same check guards it.

## Dependency

`sharp` 0.34.5 (libvips 8.17) is the **only** dependency. It is pinned in this folder's own `package.json`, so it never enters the PWA bundle or `app/package-lock.json`.

Why sharp:

- One native binding does the decode, resize, AVIF/WebP encode, SVG text rendering (librsvg) and perceptual hash.
- The alternatives are a headless browser (Playwright/Puppeteer, ~150 MB+ and far slower) or shelling out to ImageMagick (an unpinned system dependency with an inconsistent AVIF build).

The vitest suite skips, with a printed reason, on a checkout where `npm ci` hasn't been run here. It never passes silently.

## Cost of running it

Composition is local CPU only, with no API spend.

**Time.** Measured at about **4.5 s per lesson** on a 2-core sandbox, mostly AVIF encoding. That is roughly 75 minutes for 994 lessons single-threaded, and about 20 minutes with 4 workers on the NAS. AVIF `effort` (currently 4) is the main speed control.

**Storage per lesson.** The synthetic test gradients compress far below real photographs, so these are estimates for photographic masters:

| Asset | Estimated size |
|---|---|
| Master (provider PNG/JPEG at ~1536×1024 to 2048×1152) | 0.4–3 MB |
| AVIF set (4 sizes) | ~0.25 MB |
| WebP set (4 sizes) | ~0.45 MB |
| `og.jpg` | ~0.2 MB |

That totals **about 1.3–3.9 MB per lesson**. For the whole library:

- About **1.3–3.9 GB** including masters, best kept on the NAS.
- About **0.9 GB** of delivery files (AVIF, WebP and OG), which is the part to serve and cache.

## Tests

`app/src/__tests__/learn-thumbs-compose.test.js` (8 tests) checks:

- The headline renders in Anton.
- Line stacking and colors match LearnStudio, and short two-word headlines are stacked onto two lines.
- Every size and format is written, and the OG image is 1280×720.
- The manifest has the shape a presentation record needs.
- The provider's master bytes are kept untouched.
- The derivatives stay text-free.
- dHash is identical, close and far for the right pairs.
- A corrupt input fails cleanly and leaves the previous output intact.
- Slug and path safety holds.
