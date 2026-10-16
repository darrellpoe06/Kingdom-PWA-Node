# DR-1061: A song list arrives however Christina has it — and a link TO a list is not a song

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the choir's front door for getting its repertoire in)
**Type:** word
**Area:**
- `app/src/lib/song-list-import.js` (new — a document's text becomes song lines)
- `app/src/lib/song-link-list.js` (new — a link to a list is classified and read)
- `app/src/components/ChoirSongWorkshop.jsx` (both roads land in the same box)
- `app/src/__tests__/song-list-from-anywhere.test.js` (new), `choir-song-workshop-render.test.jsx`

**Grounds:** Darrell, 2026-10-16: **"Make sure this works with Google docs... Excel and other documents to pull lists of songs from Christina and the senior team members in choir and senior media team members... initially Christina and myself"** — then, looking at Choir → Songs: **"Does pasting a link with a list of songs add them to the app like the others that work comprehensively?"** ... **"Fix it..."**
**Principles:** DR-0076 §5 (characterize before you change); DR-1053 (a thing that did not happen is never reported as success); DR-0709 (one Books upload reads anything); DR-0236 (build it now)

## His question had an answer, and the answer was no

**Pasting a link to a list added one bogus song and reported success.**
`parseSongList` sees one line with one url, so a Google Sheet link became a
single idea titled after the link, the box said **"1 song detected"**, and the
insert succeeded. Forty songs did not arrive and nothing said so.

That is the DR-1053 family again — the app reporting a success for a thing that
did not happen — and it is the most expensive kind, because the person walks
away believing their work is in.

## Both halves already existed; the seam did not

| already in the repo | what it does |
|---|---|
| `lib/books-intake-read.js` → `readAnyFile` | Excel (.xlsx/.xlsm/.xlsb/.xls), CSV/TSV/TXT, a PDF through its text layer, and **a photograph of a page** through OCR — sovereign first, the family's own NAS before the device, never a third-party cloud (DR-0709) |
| `lib/song-workshop-sync.js` → `parseSongList` | strips bullets, pulls a YouTube link out of `Title - https://youtu.be/…`, de-duplicates |
| `lib/choir-sync.js` → `ytApi` | the YouTube Data API road, already proven walking ~850 channel videos |

So the choir surface was asking Christina to **type** a list the same app could
already read off a spreadsheet, a PDF or a photograph. **The fifth time this
week the cure was one call site over**, and the habit DR-1062 records applies
here too.

**The one thing neither half did:** a spreadsheet row reads
`Total Praise,Richard Smallwood,B`, and `parseSongList` would take the whole row
as the title. `song-list-import.js` picks the song out of the row — by the
header when the sheet has one, **by shape when it does not**, and a header row
is consumed rather than added as a song.

## Decision

**Three roads in, one vocabulary, and the person always sees the list before it
is added.** Both readers fill the same paste box with one song per line; the
existing count updates; nothing is inserted on anyone's behalf.

1. **Paste the songs** — unchanged, and deliberately untouched.
2. **Paste a link to a list** — classified, not counted. A YouTube playlist is
   read through the API road this app already walks (paged, 50 at a time,
   `Private video` / `Deleted video` entries dropped). A Google Sheet is read
   from `/export?format=csv`, a Doc from `/export?format=txt`, and a plain
   `.csv/.tsv/.txt/.md` url directly.
3. **Upload the list** — `readAnyFile` → `songsFromDocument`. **This is the road
   that never depends on another site letting us in**, and it is offered beside
   the paste box at all times, not only after a failure.

**The classifier is deliberately narrow.** A real list of songs that happens to
contain a document link is still a list of songs and keeps its old path. Only
the *"I pasted the address of my list"* case is diverted — because only that
case is the one that silently added one row.

## What this honestly cannot promise, said here rather than discovered by Christina

A browser can only read another site's file when that site allows it, and
Google serves a private document to a signed-in **session**, which a fetch from
poetech.us does not carry. **A sheet that is not shared "anyone with the link"
cannot be read this way.** So the surface *tries*, and when it is refused it
says the one thing that always works: download it (**File → Download → CSV,
Excel or Plain text**) and upload it — read here on our own equipment, with no
Google sign-in involved at all.

**A `.docx` is named as unread** rather than failing silently; no `.docx`
reader exists in this app. Reaching into Drive directly would mean a new OAuth
credential and a new external integration — a decision, not a detail.

## Verification

- **30 new cases**, weighted at the two ways this can lie.
- **The defect is characterized before it is fixed** (DR-0076 §5): one case
  pins that the *old* parser really does turn a Sheet link into a single bogus
  idea, so the record is measured rather than remembered.
- **A SIGN-IN PAGE IS NOT A SONG LIST.** An unshared document returns Google's
  login HTML with status **200**; parsed naively it yields "songs" named after
  markup and the person is told it worked. That is refused explicitly, and it
  is the single most important case in the suite.
- **Every refusal is asserted to produce a sentence over 30 characters**, and
  each one names a road that works. None of them is silence.
- **On the real surface, in jsdom:** a pasted Sheet link does **not** render
  "1 song detected", does say *"a link to a list, not a song"*, and the **Add
  to pool button is disabled** — the bogus one-row insert is unreachable.
- **The narrowness is pinned**: a three-line list containing a Sheet link still
  parses as three songs down the old path.

## What this does not do

- **It does not read a YouTube playlist without `VITE_YOUTUBE_API_KEY`.** The
  surface says exactly that rather than failing as "unreadable".
- **It does not import to Songbook**, only to the candidate pool, which is
  where a member's suggestion belongs. Christina marks finals as she always has.
- **No Drive integration.** See above — that is a decision with a credential
  attached, not a detail. **`re-review: 2026-11-16`.**
