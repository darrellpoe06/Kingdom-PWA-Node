# DR-1057: The archive does not cross the wire to print eight lines — why The Word was slow to populate

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (church-facing; changes what is fetched, never what is shown)
**Type:** word
**Area:**
- `app/src/lib/sermon-library-sync.js` (`fetchTranscriptsFor`, `videosNeedingTranscript`, `TRANSCRIPT_BATCH_CAP`; the eager bundle loses its expensive member)
- `app/src/components/Pulpit.jsx` (The Word — the needs-only fetch)
- `app/src/components/Choir.jsx` (one song wants one transcript)
- `app/src/__tests__/transcripts-are-asked-for-by-name.test.js` (new)

**Grounds:** Darrell, 2026-10-15, with a screenshot of The Word — Migdal: **"We need to find out why it takes long to populating these tabs... opportunities and constraints..."**
**Principles:** DR-0076 §4 (measure, do not claim), §5 (characterize before you change), §8 (honest uncertainty); DR-0075 (perpetual improvement); DR-0219 (SHOULD / ARE / GAPS / CLOSE)

## Context

He asked why the tabs are slow to populate, and for the opportunities and the
constraints — not for a guess.

## What was measured

**The dominant cause, read out of the code.** `Pulpit.jsx` ran this on arrival
for every signed-in member, through `fetchPointsData`:

```js
supabase.from('video_transcripts').select('video_id,text');   // no WHERE, no LIMIT
```

That is **the full caption text of every service the church has posted**, pulled
to a phone before the outline could render. The speaker chips in his screenshot
count **232 messages for Bishop Gwin alone**.

**And what those bytes were for makes it worse, not better:**

- the transcript is the **THIRD precedence** in `sermon-points.js` — BG's prep
  outline wins, then the harvest row, and only then are captions parsed;
- the derivation yields **at most eight short strings**
  (`extractSermonPoints(transcript, { limit: 8 })`).

So for every message that already had prep, the whole transcript was read and
discarded.

**The discipline was already in this repo, one call site over.** `Choir.jsx`
fetched transcripts only when somebody taps "draft words", and cached them —
its own comment says *"fetched once per visit."* The Word fetched eagerly on
arrival. **Same function, two call sites, opposite habits.** (Choir still pulled
the whole archive to read one of them; that is fixed here too.)

**The structural half, counted across `app/src/lib`:**

| | |
|---|---|
| bounded reads (`limit` / `range` / `single`) | **67** |
| **unbounded** reads | **63** |
| of those, `select('*')` — every column | **37** |

The generic `makeSubscriber` (`choir-sync.js:503`) is `select('*')` with an
order and **no limit**, and it backs **39 tables** across six libs — choir 11,
bus ministry 9, conference 6, service program 5, song workshop 5, video wall 3.
Not one has a `.limit()`. So every tab's cost grows with the church's history,
forever.

**What is NOT the cause:** the sermon rows themselves. `choir_sermons` carries
short scalar columns; 234 rows is on the order of 100 KB. The transcripts are
the problem, not the list.

## Impact

**What it buys.** On the real shape of this church's data — prep on nearly every
message — the tab fetches **three transcripts instead of 232**, and each one is
tens of kilobytes of caption text. The worst case (no prep anywhere) is capped
at 60 rather than unbounded.

**What it costs the reader: nothing.** The transcript is still the third
precedence, still parsed the same way. This changed **when** it arrives, never
**whether** it wins. `pointsForVideo` already accepts `transcript: null` by
contract and degrades to the title scriptures — which is what made deferring it
safe by construction rather than a gamble.

**Why this matters more than usual right now.** The app currently reaches the
NAS **cross-origin over the Tailscale Funnel**, because every Pages Function is
dark (#2057). That repoint's own comment accepted the risk in writing: *"the
throttle… may begin firing under real family load."* Megabytes of caption text
over that road **is** real family load, so the slowness he asked about and the
15-second timeouts of DR-1053 may be the same system under the same strain.

## Decision

1. **Transcripts are asked for by name.** `fetchTranscriptsFor(videoIds)` —
   `.in('video_id', ids)`, de-duplicated, capped at `TRANSCRIPT_BATCH_CAP`.
2. **The expensive source leaves the arrival bundle.** `fetchPointsData` now
   carries only prep and harvests, the two cheap ones.
3. **Only what the cheap sources did not answer** is fetched, newest first, by
   the pure `videosNeedingTranscript` — so the saving is a tested property and
   not a claim.
4. **Choir asks for the one transcript it reads**, keeping its cache.

## Verification

- **13 cases**, weighted at the saving itself: on 232 messages with prep on all
  but three, the set that crosses the wire is asserted to be exactly
  `['v0','v1','v2']`. The worst case is asserted to equal the cap, because *"no
  prep anywhere"* is the defect's own shape and must not be the unbounded path
  again.
- **Proven to catch:** the exact line that shipped,
  `from('video_transcripts').select('video_id,text');`, is asserted absent, and
  the replacement is asserted to carry `.in('video_id', ids)`. The old
  whole-archive function is asserted gone from the lib and from **both**
  components, so a caller cannot quietly reach for it.
- **Nothing a person sees changes**, pinned rather than asserted in prose: the
  precedence comment `prep -> harvest -> transcript -> title` must still hold,
  and `pointsForVideo` must still accept `transcript = null`.
- **One of my own checks passed for the wrong reason and was repaired.** A line
  I wrote read `expect(a).toBeLessThan ? expect(b).toBeLessThan(c) : null` — a
  ternary on a *function reference*, which is always truthy, so it asserted
  almost nothing while printing green. That is the anti-theater rule (DR-0076
  §3) biting its author. Replaced with exact counts.
- Lint clean; 151 cases green across every suite touching Pulpit, The Word,
  the public library, dedupe, Show-the-Word, choir-sync and choir-words.

## The break I shipped into my own PR, and what it changed

The first version of this work **broke the production build**, and neither lint
nor 187 passing tests noticed.

`call-to-give-sync.js` still imported `fetchTranscriptsByVideo`, the function
this record removed. I had not read that file. ESLint does not resolve a
cross-module named import, and no test in the suites I ran imports it — so the
only thing that caught it was `vite build`, and even there the real message was
**masked**: this repo's `sw-version-stamp` plugin throws `ENOENT: dist/sw.js`
from `closeBundle`, which fires after a failed bundle, so the visible error was
a missing service worker three layers from the actual cause. Seeing the real
line took a temporary guard on that plugin.

**Two things came out of it, and both are kept:**

1. **The check now reads the WHOLE tree.** My original assertion checked that
   the old name was absent from the lib and the two components *I had edited* —
   a check scoped to what its author already knew, which is the same
   anti-theater failure as a gate that cannot fail. It now walks every
   `.js/.jsx/.mjs` under `app/src` outside `__tests__`. Proven to catch by
   mutation: restoring the broken import turns it red and names the file.
2. **Call-to-Give is the one place that genuinely wants the whole archive, and
   it now SAYS so.** A call-to-give moment can sit in any service ever
   recorded, so building that archive across the whole corpus is correct —
   unlike The Word, which read every transcript to print at most eight lines
   per message. `fetchTranscriptsFor` gained an explicit `cap`, and this caller
   passes the corpus's own size. "All of them" is a visible decision in the
   code rather than the absence of a WHERE clause nobody could see.

So the accurate claim is not "the unbounded read is gone" — it is **"the
implicit unbounded read is gone; the one deliberate whole-corpus read names
itself."**

## What this does NOT do

- **The bytes are not measured, and no number here claims to be one.** The
  sandbox has no route to the database, and `video_transcripts` is RLS'd to
  choir members, so even a runner with the anon key cannot weigh it. The *shape*
  is proven from code — full caption text, no WHERE, no LIMIT, 232 messages —
  and the *size* is not. **`re-review: 2026-10-16`** — stand up the measurement
  and record the real before/after.
- **The 39 unbounded subscriber tables are untouched.** A blind cap there would
  silently truncate a roster or a schedule, and a surface that shows nine of
  eleven members without saying so is a worse defect than a slow one — the
  "unknown is never up" rule applied to completeness. It needs a limit *and* a
  "showing the most recent N" line on each surface, which is its own change
  with its own proof. **`re-review: 2026-10-22`.**
- **The speaker roster has a data fault, noticed and not fixed here:** the chips
  read "Bishop Lloyd E. Gwin (232)", "Bishop L. Gwin (1)" and **"Bishop Llyod
  E. Gwin (1)"** — one man, three entries, one of them a transposition. Two rows
  want merging into the canonical speaker (0037). **`re-review: 2026-10-22`.**
