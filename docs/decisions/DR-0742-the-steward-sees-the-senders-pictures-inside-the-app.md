# DR-0742 — The steward sees the sender's pictures inside the app

- **Status:** accepted (built and proven in the suite; the presence walk guards the control)
- **Tier:** A (one component on the steward's Feedback queue; no table, no policy change, no money, no new door)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/components/FeedbackScreenshots.jsx` (new), `app/src/components/FeedbackCenter.jsx` (the focused card mounts it; `FeedbackPromotePanel` takes `fetchImages` for the tests), `app/src/lib/feature-registry.json` (the `feedback-queue` surface and `feedback-queue-shot`), `app/src/__tests__/intake-outcome-render.test.jsx`, `app/src/__tests__/feature-presence.test.jsx`, `docs/decisions/INDEX.md`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), REALITY-TRACE (DR-0061: observed on his screen), VERIFICATION-DOCTRINE (DR-0076: a failed read is said, never painted as empty), HOLD-THE-HAND (DR-0621: a flag is where the work starts), DR-0625 (every intake is carried to an outcome), DR-0726 (every user-facing control is registered).
- **Grounds:** Darrell, 2026-10-01, two screenshots of Projects → Feedback on the family door, a focused note reading "5 SCREENSHOTS ATTACHED (OPEN ON THE SUBMITTER'S DEVICE OR IN SUPABASE)": *"Can't see the information submitted?!!!!!!!!!!!! Make it work so we can see inside the app!!!!!!!"* / *"How can we fix things when we don't get the feedback we needed for the fix?!!!!!!!"* / *"How can we open the submitted persons phone?!!!!!!!!!!! Why would that be a requirement when anyone all over the world can submit their own feedback?!!!!!!!"* / *"Encrypted from us fixing the system issues?!!!!!"*

## Context

**SHOULD.** A steward reading a note on the Feedback queue sees everything the sender sent, including the pictures, because the pictures are usually the whole point of the note ("here is what is wrong").

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE (his screen, 2026-10-01).** The pictures are not encrypted and were never missing. The form compresses each one to a JPEG data URL and stores the set in the `screenshots` column of the `feedback` table (migration 0026). The board's list query leaves those columns out on purpose, so a hundred notes do not pull a hundred pictures over a phone connection (`feedback-sync.js`, `FEEDBACK_LIST_COLUMNS`), and `fetchFeedbackImages(id)` was written to bring ONE note's pictures in when a person looks at it. The focused card never called it. When a row had the count but not the bytes it printed the line he saw, which pointed at the sender's phone and at the database console instead of showing the pictures.

**GAPS.** The second half of the on-demand design was never wired. A steward with no database console had no way to see what was sent.

## Impact

A steward reads a note and its pictures in one place, inside the app, with no database console and no trip to the sender's phone. A failed read is said, never painted as empty.

## Decision

1. **`FeedbackScreenshots`.** Mounted on the focused card when the note carries pictures. A row that came with its bytes shows them at once; a row that came with only the count fetches them once through `fetchFeedbackImages` and shows them. The heading says "Screenshot" or "N screenshots".
2. **Each picture is a tap from full size, inside the app.** A 44 px thumbnail button opens the picture in the shared Modal, full width, with Prev / Next when there are several and a Save link (a `download` of the same data URL; a new-tab link to a data URL is blocked by phone browsers, which is why the old "Open full size" anchors did nothing there).
3. **A failed read is said.** If the fetch fails or returns nothing for a note that says it has pictures, the card reads "could not be loaded from the database just now" with Try again. It never collapses into "no pictures" (DR-0076).
4. **Registered** (DR-0726): a `feedback-queue` surface and `feedback-queue-shot`; the presence walk mounts the queue with a note that carries a picture.

## Verification

- `intake-outcome-render.test.jsx`: a focused note with count 2 and no bytes fetches once with its id, reads `ready`, shows two thumbnails and no line about the sender's device; the second thumbnail opens "Screenshot 2 of 2" with the right image and a Save link named `feedback-f9-2.jpg`; a first fetch that returns nothing shows the failure line and Try again, which fetches again and then shows the picture; **proven to catch:** a note without pictures fetches nothing and draws nothing, and a local row with bytes needs no fetch.
- `feature-presence.test.jsx`: the `feedback-queue` walk finds the control.
- `feedback-list-carries-no-image-bytes.test.js`: unchanged and green; the list still carries no bytes.
- Lint clean.

## Limits, stated

- The read is by the signed-in steward's own session, so it sees what the `feedback` policy already lets that person read; a member sees only their own notes, as before.
- Pictures are compressed JPEGs as the form made them. The originals never left the sender's phone; what the steward sees is what was sent.
