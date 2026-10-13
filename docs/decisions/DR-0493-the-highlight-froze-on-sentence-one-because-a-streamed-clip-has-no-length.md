# DR-0493 — The highlight froze on sentence one, because a streamed clip has no length

- **Status:** accepted
- **Tier:** B (reader behaviour on the live church door)
- **Date:** 2026-09-18
- **Type:** fix
- **Scope:** `app/src/lib/clip-progress.js` (new), `app/src/lib/use-read-aloud.js` (both cloud playback sites), `app/src/__tests__/the-cloud-highlight-keeps-moving.test.js` (new, 10 checks), `app/src/__tests__/the-highlight-lasts-the-whole-lesson.test.jsx` (new, 5 checks)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4 §8), REALITY-TRACE-BEFORE-BUILDING (DR-0061), FOLLOW-ALONG (DR-0264 / DR-0265)

## The report

Darrell, 2026-09-18, from the live church door with a screenshot:

> "Reader does not read the full story... with highlights... it keeps reading and stops highlighting the whole lesson... it starts with the highlighting though... the image in the screen shows where it is while reading with no highlighter of the words... why? ... if this one does that which other lessons also do this?"

## What was eliminated first, by measurement rather than by reasoning

Three plausible causes were tested and **ruled out**. They are recorded so nobody pays for them twice:

| hypothesis | measurement | result |
|---|---|---|
| a segment the follow map cannot locate, so its range is null | 875 lesson texts, every segment located with a moving cursor | **0** unlocatable — not the cause |
| a resume start re-segments differently from the ranges (`text.slice(start)` vs `segments.slice(at)`) | 795 texts × every start index | **0** drift — not the cause |
| held ranges die when the lesson re-renders mid-read | a real Learn lesson rendered, every range captured, host re-rendered | every range survived — not the cause |

A fourth was ruled out by reading: `_speakSegment` emits on every segment, so the device-voice `segmentIndex` does advance.

## The cause

In the sovereign/cloned voice the **whole lesson is one audio clip**, and the follow-along highlight is driven entirely by that clip's playback FRACTION — `cloudProgress` in `use-read-aloud.js`, converted to a sentence by `segmentIndexAtFraction` in `TTSControl`. Both playback sites computed it as:

```js
a.ontimeupdate = () => {
  const d = a.duration;
  if (Number.isFinite(d) && d > 0) setCloudProgress(Math.min(1, a.currentTime / d));
};
```

An `<audio>` element served a **streamed or chunk-encoded body** — which is what a synthesis endpoint returns when it writes the clip as it makes it — reports `duration` as `Infinity` for the whole of playback. So that guard was false on **every tick**: `setCloudProgress` was never called after its initial `0`, `cloudProgress` stayed at `0`, and the sentence highlight painted **segment zero once and never moved again** while the audio read the entire lesson.

Highlight at the start. None afterwards. Reading unaffected. That is the report, exactly — and it is not lesson-specific, which answers "which other lessons also do this?": **every lesson, in that voice**.

## The fix

`clip-progress.js` takes the best information that exists, in order: the element's real `duration`; failing that the far end of `seekable`; failing that a **named estimate** from the text's length at roughly 15 characters a second. A real duration always wins the moment one arrives, and the estimate is documented as an estimate rather than dressed as a measurement (DR-0076 §8). A highlight that keeps moving on an estimate beats a highlight frozen on sentence one.

## What was missing, and now is not

The house had a gate proving every spoken sentence **has** a range at the moment the map is built (`reader-learn-follow.test.jsx`). Nothing anywhere proved a range still **paints** later in the same read. Both new files close that:

- `the-highlight-lasts-the-whole-lesson.test.jsx` walks a real Learn lesson and requires a live range carrying its own words for **every** segment, first to last.
- `the-cloud-highlight-keeps-moving.test.js` reproduces the defect against the OLD arithmetic (200 ticks, not one fraction produced; the highlight pinned to sentence 0 for all of them) and then walks a streamed clip end to end, requiring the highlight to visit **all thirty** sentences.

## Two facts worth keeping

**A Range does not die when its node is removed.** The DOM specification moves the boundary points to the parent, so `isConnected` stays true while the paint is wrong. Any future liveness probe must compare the **words**, never the connectedness — the first draft of the new gate got this wrong and its own proven-to-catch caught it.

**One synthetic character is unpaintable by design.** At a block boundary the follow map inserts a sentence-end so a heading is not welded onto the paragraph below it. That character is anchored to the previous block's last real character and is not in the DOM, so a segment ending on one paints its words minus that stop ("Engage · Discuss" for "Engage · Discuss."). The words are right; only the invented punctuation cannot be lit. Recorded rather than hidden.

## Still open

Darrell also reported, in the same sitting, that the reader "reads only the child version no matter what is chosen". That is **not** explained by anything above — the teach text demonstrably does change per band (3/2/2/4/2 steps, different opening sentences at child/youth/teen/adult/senior). It is carried as its own item rather than guessed at.
