# DR-0905 — A HEIC photo is a photo

- **Status:** accepted
- **Tier:** B (the evidence path — move-out condition photographs are what a deposit argument turns on)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/lib/heic.js` (new), `app/src/lib/image.js` (`compressImageFile` gains the fallback), `app/package.json` (`libheif-js`), `app/src/__tests__/a-heic-photo-is-a-photo.test.js` (new), `app/src/__tests__/fixtures/a-real-photo.heic` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure don't claim), COMMUNITY-FIRST-MISSION, PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** the 2026-07-07 "couldn't upload an image" class (`isLikelyImageFile` was widened then for the same family of failures), DR-0153 (`property_photos.taken_at` — "when the shutter fired, if known")

## The word, as spoken

Darrell, 2026-10-10, on the Add a picture panel, fourteen photographs refused
in one go:

> "Skipped 14: 6660.heic (the image could not be decoded on this device (HEIC
> or an unsupported format?)), 6659.heic (the image could not be decoded on
> this device...)..."
>
> "I want to accept this type of images!!! Fix it!!!"

## What was measured

**The picker was never the problem.** `isLikelyImageFile` has accepted `.heic`
and `.heif` by extension since the 2026-07-07 widening (image.js:42) — and its
comment even says "let the decoder be the real judge". The decoder then judged
everything a phone takes to be unusable.

`compressImageFile` hands the bytes to an `<img>` and waits for `onload`.
Android Chrome cannot decode HEIC that way, so `onerror` fired and the file was
dropped with a message that **correctly guessed its own cause and could do
nothing about it**: *"HEIC or an unsupported format?"*. Read, offered,
accepted, discarded at the last step.

HEIC is the default capture format on every recent iPhone. This was a move-out
condition set — the photographs a deposit argument turns on — and fourteen of
them went nowhere.

## Impact

Unfixed, the app silently refuses the most common photo format in the world on
the surface whose entire purpose is keeping evidence. The failure is also the
worst shape: it looks like it worked (the files are listed, the panel is
cheerful) right up to a red paragraph naming files the person has already
moved on from.

What the call obligates: the decoder is **megabytes**, so it must stay off the
critical path for everyone who never meets a HEIC, and the native path must
keep winning where it works — Safari decodes HEIC natively and beats any WASM
build.

**Not proven from this sandbox:** his own Samsung, his own iPhone-written
files, on the deployed build. The decode is proven on a real HEIC here; the
phone is his to try. `re-review: 2026-10-17`.

## The decision

1. **Try the native path first, always.** `compressImageFile` is unchanged for
   every format the browser can already read; only its failure reaches the new
   code, and only when the file is really a HEIC.
2. **Sniff the BYTES, not the name.** `looksHeicBytes` reads the ISO-BMFF
   `ftyp` box and its compatible brands. Android hands the browser an empty or
   `application/octet-stream` MIME often enough that image.js already carries a
   comment about it, and a file from a cloud picker can have no extension at
   all. An mp4 shares the container shape and is correctly refused.
3. **libheif, bundled, lazy.** The reference implementation compiled to WASM,
   from npm rather than a CDN — matching `onnxruntime-web` and the phonemizer
   already here, and avoiding the CSP question entirely. Dynamically imported,
   so it lands in its own 2.04 MB chunk (the WASM inlined as base64, no second
   fetch) that is downloaded only when a HEIC appears.
4. **The decode is DOM-free.** `decodeHeicToRgba` returns `{width, height,
   data}` and touches no canvas, so the gate can run it in Node against a real
   file and look at the pixels. The canvas step is separate and is only what a
   browser must do.
5. **Say what actually went wrong.** A HEIC container holding no image item is
   reported as exactly that, not as "unsupported format" — the two send a
   person hunting different problems.

## Outcome

`a-heic-photo-is-a-photo.test.js` — **11 green, against a real `.heic`.**

**THE FIXTURE IS REAL, and the first one was not.** The first attempt was made
with ffmpeg: `file` called it *"ISO Media, HEIF Image HEVC Main or Main Still
Picture Profile"* and **libheif refused it** — "No images found" — correctly,
because an ffmpeg container carries the HEVC bitstream without the HEIF image
items a photograph has. That refusal is the most useful thing that happened
while building this: a mocked decoder would have hidden it, and the fix could
have shipped against a file shape no phone produces. The committed fixture is
written by libheif's own encoder, 64×48, **left half red and right half blue**,
so the gate checks the PIXELS that come back — a decoder returning a grey
rectangle passes "did it throw?" and fails this.

Measured decode of that fixture: 64×48, 12288 RGBA bytes, left sample red,
right sample blue.

Also pinned: a JPEG, a PNG, a too-short buffer and an **mp4** are all refused;
a compatible brand behind a different major brand is found; the no-image
container and the failed-to-load decoder each say their own true thing; the
import is lazy; the native path is tried first.

Re-run together: **161 green** across the image, photo and NAS-photo suites.
eslint clean at `--max-warnings 0`. Build clean, the lazy chunk confirmed in
`dist/`.

## Next, and asked for in the same breath

Darrell, immediately after: *"Take Metadata off images to verify information
etc..."* and then the governing constraint: *"Just to use as information not
to deny anything..."*

Measured while here: `property_photos.taken_at` exists and is indexed — 0153
calls it "when the shutter fired, if known" — and is **only ever written when
the photo is captured in the app right now** (`captured ? new Date()... :
null`, DoorTabs.jsx:1237). For a photo CHOSEN from the phone, which is exactly
what these fourteen were, it is null, and the timeline falls back to the
upload date and flags itself `datedByUpload`. So the date a condition
photograph was actually taken is thrown away at the door. Reading EXIF
`DateTimeOriginal` fills a column that has been waiting since 0153 — as
information only: **no upload is ever refused because of what its metadata
says.** DR-0906.
