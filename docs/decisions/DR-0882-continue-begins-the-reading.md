# DR-0882 — Continue begins the reading

- **Status:** accepted
- **Tier:** B (the lesson door most readers use)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/components/ChurchLearn.jsx` (`continueAndRead`, the three `onContinue` call sites), `app/src/__tests__/continue-begins-the-reading.test.jsx` (new)
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SURFACE-PREMISE-CONFLICTS
- **Grounds:** DR-0631 (every Continue ends ON the words), "PLAY MEANS READ IT" (`read-target.js:105`), DR-0702 (the read door), `lib/learn-open.js` (never touches audio)

## The word, as spoken

Darrell, 2026-10-10:

> "Clicking continue on lessons the big green tab doesn't just begin with the
> required reading... users have to click again!!!!!!!!!!! Why?"

## What was measured

**The obvious fix was the wrong one, and measuring first is what caught it.**

My own first reading of this was that Continue opens "the guide" and the
reading is a second door. That is false. `TutorPanel` **is** the component
that renders the lesson's reading and registers it as the page's primary
reading; "🧭 Ari — your guide for this lesson" is its chrome label, not a
door standing in front of the words.

Seeded a real place (`living-lessons / ll3-bodybuilding-christ`, stage 1 step
2), mounted Learn against the real catalog, tapped `continue-latest` **once**:

| after one tap | |
| --- | --- |
| lesson space | present |
| the reading element | present |
| registered read target | `{ isDoor: false, hasText: true }` |
| rendered text | the Word at the saved part and step |

So setting `resumeOpenGuide = false` — the change that suggests itself — would
have done the opposite of the ask, twice: it **unmounts the reading**, leaving
the lesson to register a DOOR (`read-target.js:63`, whose whole purpose is
"its full reading is not mounted yet") and forcing a "Read this lesson" tap —
*creating* the extra tap he is naming — and it would have killed DR-0631's
saved-place landing, which reads `resumeOpenGuide && placeInProgress(saved)`.

**The single real difference between the two doors is one call:**

| tap | lesson space | reading mounted | saved place | `pendingRead()` |
| --- | --- | --- | --- | --- |
| `continue-latest` | yes | yes | yes | **null** |
| ▶ Play | yes | yes | yes | `{ owner }` |

What does not "begin" is the reading **aloud**. His second tap is Play.

## Impact

This makes Continue speak, which is a product promise and not merely a bug
fix — stated plainly rather than slipped in. It is his own law, declared in
capitals three times (`read-target.js:105`: *"Play Button reads the
lesson!!!!!"*), and Continue means *resume what I was doing*. The tap itself
is the user gesture, so there is no autoplay problem.

**Where it is armed is load-bearing, and a later reader will be tempted to
"simplify" it.** It is armed at the three CALL SITES, never inside
`resumeNow`, because `resumeNow` is also the single door for
`lib/learn-open.js`, whose contract says it *"never touches audio — it only
opens, scrolls and marks"*, and whose live caller is the reader's own "Show
the text" — pressed **while the reader is already reading**. Arming a read in
there would restart the very reading that asked to be shown. A test holds
`resumeNow` clean for exactly that reason.

Honest limit: with `/voice` dark (issue #2057, the Pages Functions outage) the
reading that now begins will be spoken by whatever engine the fallback reaches
— on a Fire TV, Fire OS's own until DR-0881's device voice is in place. This
change is about the tap, not the timbre.

## The decision

`continueAndRead(place)` calls `resumeNow(place)` and then
`requestRead(place.lessonId)`. All three Continue doors use it — the offer
under the picker, the one on the course card, and the sticky chip — because a
reader who uses the chip would otherwise still tap twice. A place with no
lesson asks for nothing rather than throwing.

## Outcome

**9 green** on the new gate; **116 green** across every Continue, resume and
Play suite (`continue-a-lesson`, `-render`, `-landing`, `-numbers`,
`learn-resume`, `-render`, `resume-at-the-sentence`, `play-reads-the-lesson`,
`reader-lesson-start`, `the-place-is-visible-and-continue-stays`). eslint
clean.

Proven-to-catch: the gate fails on the presence of `onContinue={resumeNow}`,
and separately asserts `resumeNow` itself contains no `requestRead` — so both
the fix and the reason for its placement are held.

**Not verified on a live browser:** whether his second tap was ▶ Play
specifically or the floating speaker's "Read this lesson" (which is two). The
sandbox has no route to poetech.us (DR-0125). Either way this arms the read on
Continue. `re-review: 2026-10-17`.
