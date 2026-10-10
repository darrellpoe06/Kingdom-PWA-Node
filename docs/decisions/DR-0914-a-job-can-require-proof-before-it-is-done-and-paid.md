# DR-0914 — A job can require proof before it is done, and paid

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: Work board, Dispatch, the 1099 worker's jobs (migration 0264)
**Principle:** DR-0913 (pictures on work orders), DR-0897 (work on the door), DR-0899 (the clock), DR-0303 (the list never carries the bytes), DR-0076

## Context

Darrell, 2026-10-10:

> "1099 works notice of the need for pictures to document the work... may be mandatory for payment... situations that need images to validate the work is completely done and video when necessary... make sense?"

**SHOULD.**
- The family can require proof on a job: pictures, or pictures and a video.
- The worker is told before starting that the proof is required for payment.
- "Fixed" is not accepted without the proof.
- The family sees when a job is proven and fixed, meaning ready to pay.

**ARE.**
- Pictures could be attached to jobs (DR-0913), but nothing required them.
- A worker's "Fixed" was accepted with nothing attached.
- No video could be attached at all.

## What was measured

- `request_documentation` had `image_data`, but no video column and no rule tying "Fixed" to evidence.
- The dispatch text carried the address, the job, the urgency and the detail, and nothing about proof.
- The board's documentation read selected `*`, so any video column would have carried its bytes into every board load. DR-0303 forbids that.

## Impact

Payment rested on the word "Fixed" alone. A disputed job had no picture to settle it, and a worker learned that pictures were expected only after leaving the site.

## Decision

1. **The family sets a job's proof** (0264): none (the default, so every existing job is unchanged), photos, or photos-and-video, plus an optional line saying what to show. Only those who can move the job can set it; a worker cannot lift it. Every change is on `record_events`.
2. **The database refuses an unproven "Fixed".** A documented "Fixed" on a job that requires proof is refused until the job holds at least one picture, and also a video for photos-and-video. The refusal says what is missing and that it is required for payment.
3. **Video is documentation too.**
   - `request_documentation.video_data` holds the video as a data URL. A CHECK requires it to be a video and caps it at about 25 MB.
   - `has_video` is a stored generated column, so the board's list reads that flag, never the bytes. The bytes are fetched one at a time, when someone taps "Play the video".
   - The app refuses a clip over 25 MB and asks for about 30 seconds of the finished work.
4. **The worker is told up front.** The proof notice is shown on the job and appended to the dispatch text: "Pictures and a video of … are required for payment. Add them on the job before marking it fixed."
5. **Ready to pay is shown, not assumed.** Each job with a requirement reads either "Proof for payment: N pictures, M videos. Still needed: …" or "Proof complete (…), fixed: ready to pay". The family can still close a job by its own status move; the requirement binds the worker's documented claim, which is what payment rests on.

`re-review: 2026-10-24` — set "Pictures and a video" on a live job, dispatch it, and from a worker seat try "Fixed" with nothing attached (refused), then add a picture and a video and mark it fixed. Confirm "ready to pay" and that the board loads without the video's bytes.

## Verification

- **The database.** `infra/supabase/tests/0264-proof-before-paid-smoke.sql` runs in the `door-work` CI leg after 0264 applies twice, and in the live rls-isolation poe-properties leg. It proves:
  - the family sets proof, and the worker cannot lift it;
  - "Fixed" with no picture is refused; after a picture it succeeds and the job resolves;
  - on a photos-and-video job, a picture alone is not enough; a non-video is refused; after a video, "Fixed" succeeds and `has_video` reads true;
  - a job with no proof is fixed as before;
  - the requirement is on the clock.
  - Measured locally on PostgreSQL 16.15, all five smokes pass together.
- **Proven to catch.** Three breaks each failed by name: dropping the proof trigger, dropping the video CHECK, and dropping the proof clock trigger.
- **The app.** `properties-work-on-any-door.test.jsx` gains three tests:
  - the notice, the counts, and that "ready to pay" requires both the proof and "Fixed";
  - the dispatch text ends with the notice;
  - the family sets a job's proof from the board, which shows the notice, what is still needed, and "Add a video".
  - 35 Properties suites (700 tests) pass, and lint is clean.

## Addendum, 2026-10-10: renumbered

This record was written as DR-0902. #2098 merged its own DR-0902 on main first ("the apply button opens the application"), so this one is DR-0914, with every reference renamed.
